import { expect, it, vi } from "vitest";
import { getOperation } from "../core/registry";
import type { Recipe } from "../core/types";
import { createHandler } from "./handler";
import type { FromWorker } from "./protocol";

const recipe: Recipe = [
  { key: "a", opId: "to-base64", args: {}, enabled: true, breakpoint: false },
  { key: "b", opId: "from-base64", args: {}, enabled: true, breakpoint: false },
];
const input = Uint8Array.of(72, 101, 108, 108, 111);

it("run posts step messages then done", async () => {
  const post = vi.fn<(message: FromWorker, transfer?: Transferable[]) => void>();
  await createHandler(post)({ type: "run", runId: 1, inputVersion: 1, input: input.buffer, recipe });
  expect(post.mock.calls.map(([{ type, runId }]) => [type, runId])).toEqual([
    ["step", 1], ["step", 1], ["done", 1],
  ]);
  const done = post.mock.calls[2]?.[0];
  expect(done?.type === "done" && new Uint8Array(done.output)).toEqual(input);
  expect(post.mock.calls[2]?.[1]).toEqual(done?.type === "done" ? [done.output] : undefined);
});

it("getStep returns intermediate bytes after a transferable output", async () => {
  const delivered: FromWorker[] = [];
  const handler = createHandler((message, transfer) => {
    delivered.push(structuredClone(message, { transfer: transfer as ArrayBuffer[] | undefined }));
  });
  await handler({ type: "run", runId: 1, inputVersion: 1, input: input.buffer, recipe });
  await handler({ type: "getStep", runId: 1, index: 0 });
  expect(delivered[3]).toMatchObject({ type: "stepData", runId: 1, index: 0, dataType: "string" });
  const intermediate = delivered[3];
  expect(intermediate?.type === "stepData" && new Uint8Array(intermediate.data)).toEqual(
    Uint8Array.of(83, 71, 86, 115, 98, 71, 56, 61),
  );
  await handler({ type: "run", runId: 2, inputVersion: 1, recipe: [] });
  const next = delivered.at(-1);
  expect(next?.type === "done" && new Uint8Array(next.output)).toEqual(input);
});

it("run without cached input posts fatal", async () => {
  const post = vi.fn();
  await createHandler(post)({ type: "run", runId: 1, inputVersion: 1, recipe });
  expect(post).toHaveBeenCalledExactlyOnceWith({ type: "fatal", runId: 1, message: expect.any(String) });
});

it("only the latest queued run posts results and can reuse input", async () => {
  const post = vi.fn<(message: FromWorker, transfer?: Transferable[]) => void>();
  const handler = createHandler(post);
  await Promise.all([
    handler({ type: "run", runId: 1, inputVersion: 1, input: input.buffer, recipe }),
    handler({ type: "run", runId: 2, inputVersion: 1, recipe }),
  ]);
  expect(post.mock.calls.map(([{ type, runId }]) => [type, runId])).toEqual([
    ["step", 2], ["step", 2], ["done", 2],
  ]);
});

it("suggests steps for the baked output and preserves intermediate step data", async () => {
  const post = vi.fn();
  const handler = createHandler(post);
  await handler({ type: "run", runId: 1, inputVersion: 1, input: input.buffer, recipe: recipe.slice(0, 1) });
  await handler({ type: "magic", runId: 1, depth: 3, budgetMs: 500 });
  expect(post).toHaveBeenCalledWith({
    type: "magicResult", runId: 1,
    suggestions: [expect.objectContaining({ steps: [expect.objectContaining({ opId: "from-base64" })], preview: "Hello" })],
  });
  await handler({ type: "getStep", runId: 1, index: 0 });
  expect(post.mock.calls.at(-1)?.[0]).toEqual({
    type: "stepData", runId: 1, index: 0,
    data: new TextEncoder().encode("SGVsbG8=").buffer, dataType: "string",
  });
});

it("getStep during running pipeline waits and does not post fatal", async () => {
  const getStep = vi.fn<() => Promise<void>>();
  const post = vi.fn<(message: FromWorker, transfer?: Transferable[]) => void>((message) => {
    if (message.type === "step" && message.result.index === 0) {
      void getStep();
    }
  });
  const handler = createHandler(post);
  getStep.mockImplementation(() => handler({ type: "getStep", runId: 1, index: 1 }));

  await handler({ type: "run", runId: 1, inputVersion: 1, input: input.buffer, recipe });
  expect(getStep).toHaveBeenCalledOnce();
  await getStep.mock.results[0]?.value;
  expect(post.mock.calls.map(([message]) => message.type)).toEqual(["step", "step", "done", "stepData"]);
  expect(post.mock.calls.at(-1)?.[0]).toEqual({
    type: "stepData", runId: 1, index: 1, data: input.buffer, dataType: "bytes",
  });
});

it("replies with stepError when the requested run is superseded", async () => {
  const post = vi.fn();
  const handler = createHandler(post);
  await Promise.all([
    handler({ type: "run", runId: 1, inputVersion: 1, input: input.buffer, recipe }),
    handler({ type: "getStep", runId: 1, index: 0 }),
    handler({ type: "run", runId: 2, inputVersion: 1, recipe }),
  ]);

  expect(post).toHaveBeenCalledWith({ type: "stepError", runId: 1, index: 0, message: expect.any(String) });
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: "done", runId: 2 }), expect.any(Array));
});

it("new run is not delayed by magic", async () => {
  vi.useFakeTimers();
  const post = vi.fn<(message: FromWorker) => void>();
  const handler = createHandler(post);
  const decoder = vi.spyOn(getOperation("from-base64")!, "run").mockImplementation(() => {
    setTimeout(() => {
      void handler({ type: "run", runId: 2, inputVersion: 1, recipe: [] });
    }, 0);
    return new Promise(() => {});
  });

  try {
    await handler({ type: "run", runId: 1, inputVersion: 1, input: input.buffer, recipe: recipe.slice(0, 1) });
    const search = handler({ type: "magic", runId: 1, depth: 3, budgetMs: 500 });
    await vi.advanceTimersByTimeAsync(25);

    expect(decoder).toHaveBeenCalledOnce();
    expect(post.mock.calls.map(([message]) => [message.type, message.runId])).toEqual([
      ["step", 1], ["done", 1], ["done", 2],
    ]);
    await search;
    expect(post.mock.calls.some(([message]) => message.type === "magicResult")).toBe(false);
  } finally {
    decoder.mockRestore();
    vi.useRealTimers();
  }
});
