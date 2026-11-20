import type { MagicSuggestion } from "../core/magic/types";
import type { StepResult } from "../core/pipeline";
import type { DataType, Recipe } from "../core/types";
import type { FromWorker, ToWorker } from "./protocol";

export interface RunHandlers {
  onStep(r: StepResult): void;
  onDone(m: Extract<FromWorker, { type: "done" }>): void;
  onFatal(msg: string): void;
  onMagic?(suggestions: MagicSuggestion[]): void;
}

interface StepData {
  data: Uint8Array;
  dataType: DataType;
}

export interface PipelineClient {
  run(input: Uint8Array, inputVersion: number, recipe: Recipe, h: RunHandlers): number;
  getStep(index: number): Promise<StepData>;
  cancel(): void;
  isBusy(): boolean;
  dispose(): void;
}

export function createPipelineClient(createWorker: () => Worker): PipelineClient {
  const pendingSteps = new Map<number, {
    promise: Promise<StepData>;
    resolve: (result: StepData) => void;
    reject: (error: Error) => void;
  }>();
  let current: { id: number; handlers: RunHandlers; busy: boolean } | undefined;
  let nextRunId = 0;
  let sentInputVersion: number | undefined;
  let worker: Worker | undefined = spawn();

  function rejectSteps(error: Error): void {
    for (const { reject } of pendingSteps.values()) reject(error);
    pendingSteps.clear();
  }

  function fail(message: string): void {
    const failed = current;
    current = undefined;
    rejectSteps(new Error(message));
    failed?.handlers.onFatal(message);
  }

  function spawn(): Worker {
    const instance = createWorker();
    instance.onmessage = ({ data: message }: MessageEvent<FromWorker>) => {
      if (worker !== instance || current?.id !== message.runId) return;

      switch (message.type) {
        case "step":
          if (current.busy) current.handlers.onStep(message.result);
          break;
        case "done":
          if (current.busy) {
            current.busy = false;
            current.handlers.onDone(message);
            if (worker === instance && current?.id === message.runId && current.handlers.onMagic
              && message.errorIndex === undefined && message.stoppedAt === undefined && message.output.byteLength > 0) {
              const request: ToWorker = { type: "magic", runId: message.runId, depth: 3, budgetMs: 500 };
              instance.postMessage(request);
            }
          }
          break;
        case "magicResult":
          if (!current.busy) current.handlers.onMagic?.(message.suggestions);
          break;
        case "stepData":
        case "stepError": {
          const pending = pendingSteps.get(message.index);
          pendingSteps.delete(message.index);
          if (message.type === "stepError") pending?.reject(new Error(message.message));
          else pending?.resolve({ data: new Uint8Array(message.data), dataType: message.dataType });
          break;
        }
        case "fatal":
          fail(message.message);
          break;
      }
    };
    instance.onerror = (event) => {
      if (worker !== instance) return;
      sentInputVersion = undefined;
      fail(event.message || "Pipeline worker failed.");
    };
    return instance;
  }

  function stop(reason: string): void {
    const previous = worker;
    worker = undefined;
    sentInputVersion = undefined;
    current = undefined;
    rejectSteps(new Error(reason));
    previous?.terminate();
  }

  return {
    run(input, inputVersion, recipe, handlers) {
      if (!worker) throw new Error("Pipeline client is disposed.");
      rejectSteps(new Error("Run was superseded."));
      const id = ++nextRunId;
      current = { id, handlers, busy: true };
      const message: Extract<ToWorker, { type: "run" }> = { type: "run", runId: id, inputVersion, recipe };
      try {
        if (inputVersion !== sentInputVersion) {
          const bytes = input.slice().buffer;
          worker.postMessage({ ...message, input: bytes }, [bytes]);
          sentInputVersion = inputVersion;
        } else {
          worker.postMessage(message);
        }
      } catch (cause) {
        fail(cause instanceof Error ? cause.message : String(cause));
      }
      return id;
    },

    getStep(index) {
      if (!worker || !current) return Promise.reject(new Error("No pipeline run is available."));
      const existing = pendingSteps.get(index);
      if (existing) return existing.promise;

      const { promise, resolve, reject } = Promise.withResolvers<StepData>();
      pendingSteps.set(index, { promise, resolve, reject });
      const message: ToWorker = { type: "getStep", runId: current.id, index };
      try {
        worker.postMessage(message);
      } catch (cause) {
        pendingSteps.delete(index);
        reject(cause);
      }
      return promise;
    },

    cancel() {
      if (!worker) return;
      stop("Run was cancelled.");
      worker = spawn();
    },

    isBusy: () => current?.busy ?? false,

    dispose() {
      stop("Pipeline client was disposed.");
    },
  };
}

export function createBrowserPipelineClient(): PipelineClient {
  return createPipelineClient(() => new Worker(new URL("./pipeline.worker.ts", import.meta.url), { type: "module" }));
}
