import { describe, expect, it, vi } from "vitest";
import { z } from "@/lib/zod";
import { convert } from "./convert";
import { defineOperation } from "./define-operation";
import { getStepValue, runPipeline } from "./pipeline";
import { getOperation } from "./registry";
import { StepCache, stepCacheKey } from "./step-cache";
import type { RecipeStep } from "./types";

const hello = Uint8Array.of(72, 101, 108, 108, 111);

function step(opId: string, options: Partial<RecipeStep> = {}): RecipeStep {
  return { key: opId, opId, args: {}, enabled: true, breakpoint: false, ...options };
}

describe("runPipeline", () => {
  it("empty recipe returns input", async () => {
    const result = await runPipeline(hello, 1, []);
    expect(result).toMatchObject({ output: hello, outputType: "bytes", steps: [] });
  });

  it("chains to-base64 then from-base64 back to input", async () => {
    const result = await runPipeline(hello, 1, [step("to-base64"), step("from-base64")]);
    expect(result).toMatchObject({ output: hello, outputType: "bytes" });
    expect(result.steps).toMatchObject([
      { status: "ok", type: "string", size: 8, preview: "SGVsbG8=" },
      { status: "ok", type: "bytes", size: 5, preview: "Hello" },
    ]);
  });

  it("disabled step is skipped", async () => {
    const result = await runPipeline(hello, 1, [
      step("missing", { enabled: false, breakpoint: true }),
      step("to-base64"),
    ]);
    expect(result.steps.map(({ status }) => status)).toEqual(["skipped", "ok"]);
    expect(result.stoppedAt).toBeUndefined();
    expect(getStepValue(0)).toEqual({ value: hello, type: "bytes" });
  });

  it("breakpoint stops after step", async () => {
    const result = await runPipeline(hello, 1, [
      step("to-base64", { breakpoint: true }),
      step("from-base64"),
    ]);
    expect(result.stoppedAt).toBe(0);
    expect(result.steps).toHaveLength(1);
    expect(convert(result.output, "bytes", "string")).toBe("SGVsbG8=");
  });

  it("stops at failing step and keeps earlier results", async () => {
    const onStep = vi.fn();
    const result = await runPipeline(Uint8Array.of(255), 1, [
      step("to-base64"),
      step("from-base64", { args: { alphabet: "urlsafe", strict: true } }),
      step("missing"),
    ], { onStep });
    expect(result.errorIndex).toBe(1);
    expect(result.outputType).toBe("string");
    expect(convert(result.output, "bytes", "string")).toBe("/w==");
    expect(result.steps).toMatchObject([
      { status: "ok", preview: "/w==" },
      { status: "error", error: "Invalid Base64 character." },
    ]);
    expect(onStep.mock.calls).toEqual(result.steps.map((item) => [item]));
    expect(getStepValue(0)).toEqual({ value: "/w==", type: "string" });
    expect(getStepValue(1)).toBeUndefined();
  });

  it("invalid args produce step error", async () => {
    const result = await runPipeline(hello, 1, [step("from-base64", { args: { strict: "true" } })]);
    expect(result.errorIndex).toBe(0);
    expect(result.steps).toMatchObject([{ status: "error", error: expect.any(String) }]);
    expect(result.output).toEqual(hello);
  });

  it("reuses cache prefix when argument object keys are reordered", async () => {
    const run = vi.fn(() => "SGVsbG8=");
    const prefix = defineOperation({
      id: "prefix", name: "Prefix", category: "encoding", description: "",
      input: "bytes", output: "string", args: z.object({ a: z.string(), b: z.string() }), run,
    });
    const cache = new StepCache();
    const getOp = (id: string) => id === "prefix" ? prefix : getOperation(id);
    await runPipeline(hello, 1, [
      step("prefix", { args: { a: "x", b: "y" } }),
      step("from-base64"),
    ], { cache, getOp });
    const result = await runPipeline(hello, 1, [
      step("prefix", { args: { b: "y", a: "x" } }),
      step("to-base64"),
    ], { cache, getOp });
    expect(run).toHaveBeenCalledTimes(1);
    expect(convert(result.output, "bytes", "string")).toBe("U0dWc2JHOD0=");
  });

  it("non-cacheable step reruns every time and bypasses cache for later steps", async () => {
    let sequence = 0;
    const generate = {
      ...defineOperation({
        id: "generate", name: "Generate", category: "data", description: "",
        input: "string", output: "string", args: z.object({}),
        run: vi.fn(() => String(++sequence)),
      }),
      cacheable: false,
    };
    const append = defineOperation({
      id: "append", name: "Append", category: "text", description: "",
      input: "string", output: "string", args: z.object({}),
      run: vi.fn((text: string) => `${text}!`),
    });
    const recipe = [step("to-base64"), step(generate.id), step(append.id)];
    const cache = new StepCache();
    const prefixKey = stepCacheKey(1, recipe, 0);
    cache.set(stepCacheKey(1, recipe, 1), { value: "old", type: "string" }, 3);
    cache.set(stepCacheKey(1, recipe, 2), { value: "old!", type: "string" }, 4);
    const read = vi.spyOn(cache, "get");
    const write = vi.spyOn(cache, "set");
    const getOp = (id: string) => {
      if (id === generate.id) return generate;
      if (id === append.id) return append;
      return getOperation(id);
    };

    const opts = { cache, getOp };
    const first = await runPipeline(hello, 1, recipe, opts);
    const second = await runPipeline(hello, 1, recipe, opts);
    expect([first, second].map(({ output }) => convert(output, "bytes", "string"))).toEqual(["1!", "2!"]);
    expect(generate.run).toHaveBeenCalledTimes(2);
    expect(append.run).toHaveBeenCalledTimes(2);
    expect(read.mock.calls).toEqual([[prefixKey], [prefixKey]]);
    expect(write).toHaveBeenCalledExactlyOnceWith(prefixKey, { value: "SGVsbG8=", type: "string" }, 8);
  });

  it("limits previews to 1024 bytes", async () => {
    const input = new Uint8Array(1025).fill(65);
    const result = await runPipeline(input, 1, [step("missing", { enabled: false })]);
    expect(result.steps[0]).toMatchObject({ size: 1025, preview: "A".repeat(1024) });
  });
});

it("cache evicts the least recently used entry when over maxBytes", () => {
  const cache = new StepCache(4);
  const item = { value: "ab", type: "string" } as const;
  cache.set("a", item, 2);
  cache.set("b", item, 2);
  expect(cache.get("a")).toEqual(item);
  cache.set("c", item, 2);
  expect(cache.get("b")).toBeUndefined();
  expect(cache.get("a")).toEqual(item);
  cache.clear();
  expect(cache.get("a")).toBeUndefined();
});
