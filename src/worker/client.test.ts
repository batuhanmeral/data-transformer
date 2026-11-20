import { expect, it, vi } from "vitest";
import { createPipelineClient } from "./client";
import type { FromWorker, ToWorker } from "./protocol";

class FakeWorker {
  onmessage: ((event: MessageEvent<FromWorker>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn<(message: ToWorker, transfer?: Transferable[]) => void>();
  terminate = vi.fn();

  emit(message: FromWorker): void {
    this.onmessage?.(new MessageEvent("message", { data: message }));
  }
}

function setup() {
  const workers: FakeWorker[] = [];
  const client = createPipelineClient(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker as unknown as Worker;
  });
  const handlers = { onDone: vi.fn(), onStep: vi.fn(), onFatal: vi.fn() };
  return { client, workers, handlers };
}

function done(runId: number): FromWorker {
  return { type: "done", runId, output: new ArrayBuffer(0), outputType: "bytes", totalMs: 0 };
}

it("ignores stale run results", () => {
  const { client, workers: [worker], handlers } = setup();
  const input = Uint8Array.of(97);
  const staleId = client.run(input, 1, [], handlers);
  const currentId = client.run(input, 1, [], handlers);

  worker?.emit(done(staleId));
  expect(handlers.onDone).not.toHaveBeenCalled();
  expect(client.isBusy()).toBe(true);
  worker?.emit(done(currentId));
  expect(handlers.onDone).toHaveBeenCalledExactlyOnceWith(done(currentId));
  expect(client.isBusy()).toBe(false);
});

it("sends input only when version changes", () => {
  const { client, workers: [worker], handlers } = setup();
  const input = Uint8Array.of(97, 98, 99).subarray(1, 2);
  client.run(input, 1, [], handlers);
  client.run(input, 1, [], handlers);
  client.run(input, 2, [], handlers);

  const calls = worker?.postMessage.mock.calls;
  const first = calls?.[0]?.[0];
  expect(first?.type).toBe("run");
  if (first?.type !== "run" || !first.input) throw new Error("Missing input transfer.");
  expect(first.input).not.toBe(input.buffer);
  expect(new Uint8Array(first.input)).toEqual(Uint8Array.of(98));
  expect(calls?.[0]?.[1]).toEqual([first.input]);
  expect(calls?.[1]?.[0]).not.toHaveProperty("input");
  expect(calls?.[2]?.[0]).toHaveProperty("input");
});

it("cancel terminates and respawns, resending input on next run", () => {
  const { client, workers, handlers } = setup();
  const input = Uint8Array.of(97);
  const cancelledId = client.run(input, 1, [], handlers);
  client.cancel();
  expect(workers[0]?.terminate).toHaveBeenCalledOnce();
  expect(workers).toHaveLength(2);
  expect(client.isBusy()).toBe(false);
  client.run(input, 1, [], handlers);
  expect(workers[1]?.postMessage.mock.calls[0]?.[0]).toHaveProperty("input");
  workers[0]?.emit(done(cancelledId));
  expect(handlers.onDone).not.toHaveBeenCalled();
});

it("matches intermediate output by run ID and index", async () => {
  const { client, workers: [worker], handlers } = setup();
  const runId = client.run(Uint8Array.of(97), 1, [], handlers);
  const step = client.getStep(0);
  expect(worker?.postMessage).toHaveBeenLastCalledWith({ type: "getStep", runId, index: 0 });
  worker?.emit({ type: "stepData", runId, index: 0, data: Uint8Array.of(98).buffer, dataType: "string" });
  await expect(step).resolves.toEqual({ data: Uint8Array.of(98), dataType: "string" });
});

it("rejects pending intermediate output when superseded", async () => {
  const { client, handlers } = setup();
  const input = Uint8Array.of(97);
  client.run(input, 1, [], handlers);
  const rejected = expect(client.getStep(0)).rejects.toThrow("superseded");
  client.run(input, 1, [], handlers);
  await rejected;
});

it("dispose terminates without respawning", () => {
  const { client, workers } = setup();
  client.dispose();
  client.dispose();
  expect(workers[0]?.terminate).toHaveBeenCalledOnce();
  expect(workers).toHaveLength(1);
});

it("stepError rejects only that step and keeps run alive", async () => {
  const { client, workers: [worker], handlers } = setup();
  const runId = client.run(Uint8Array.of(97), 1, [], handlers);
  const unavailable = client.getStep(2);
  const available = client.getStep(0);
  const settled = unavailable.then(() => "resolved", (error: unknown) => error);
  worker?.emit({ type: "stepError", runId, index: 2, message: "No output" });

  await Promise.resolve();
  expect(await Promise.race([settled, Promise.resolve("pending")])).toEqual(new Error("No output"));
  expect(client.isBusy()).toBe(true);
  expect(handlers.onFatal).not.toHaveBeenCalled();

  worker?.emit({ type: "stepData", runId, index: 0, data: Uint8Array.of(97).buffer, dataType: "bytes" });
  await expect(available).resolves.toEqual({ data: Uint8Array.of(97), dataType: "bytes" });
  worker?.emit(done(runId));
  expect(handlers.onDone).toHaveBeenCalledExactlyOnceWith(done(runId));
});

it("delivers Magic suggestions only for the current run", () => {
  const { client, workers: [worker], handlers } = setup();
  const onMagic = vi.fn();
  const input = Uint8Array.of(97);
  const staleId = client.run(input, 1, [], { ...handlers, onMagic });
  worker?.emit(done(staleId));
  const currentId = client.run(input, 1, [], { ...handlers, onMagic });
  worker?.emit({ ...done(currentId), type: "done", output: input.buffer, outputType: "bytes", totalMs: 0 });
  expect(worker?.postMessage).toHaveBeenLastCalledWith({ type: "magic", runId: currentId, depth: 3, budgetMs: 500 });
  const suggestions = [{ steps: [{ opId: "from-base64", args: {} }], preview: "Hello", score: 0.9 }];

  worker?.emit({ type: "magicResult", runId: staleId, suggestions });
  expect(onMagic).not.toHaveBeenCalled();
  worker?.emit({ type: "magicResult", runId: currentId, suggestions });
  expect(onMagic).toHaveBeenCalledExactlyOnceWith(suggestions);
});
