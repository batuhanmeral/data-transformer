import { convert, decodeUtf8Lossy, toBytes } from "./convert";
import { getOperation } from "./registry";
import { StepCache, stepCacheKey } from "./step-cache";
import type { DataType, Recipe } from "./types";

export interface StepResult {
  index: number;
  opId: string;
  status: "ok" | "error" | "skipped";
  type: DataType;
  size: number;
  durationMs: number;
  preview: string;
  error?: string;
}

export interface PipelineResult {
  output: Uint8Array;
  outputType: DataType;
  steps: StepResult[];
  stoppedAt?: number;
  errorIndex?: number;
  totalMs: number;
}

interface StepValue {
  value: unknown;
  type: DataType;
}

let lastStepValues: StepValue[] = [];

export function getStepValue(index: number): StepValue | undefined {
  return lastStepValues[index];
}

export async function runPipeline(
  input: Uint8Array,
  inputVersion: number,
  recipe: Recipe,
  opts?: { cache?: StepCache; onStep?(r: StepResult): void; getOp?: typeof getOperation },
): Promise<PipelineResult> {
  const { cache, onStep, getOp = getOperation } = opts ?? {};
  const startedAt = performance.now();
  const steps: StepResult[] = [];
  const stepValues: StepValue[] = [];
  lastStepValues = stepValues;

  let current: StepValue = { value: input, type: "bytes" };
  let output = input;
  let prefixCache = cache;
  let stoppedAt: number | undefined;
  let errorIndex: number | undefined;

  for (const [index, step] of recipe.entries()) {
    const { enabled, opId, breakpoint, args } = step;
    const stepStartedAt = performance.now();
    let status: StepResult["status"] = enabled ? "ok" : "skipped";
    let error: string | undefined;

    if (enabled) {
      try {
        const operation = getOp(opId);
        if (!operation) throw new Error(`Unknown operation: ${opId}`);
        if (operation.cacheable === false) prefixCache = undefined;
        const key = prefixCache ? stepCacheKey(inputVersion, recipe, index) : undefined;
        const cached = key === undefined ? undefined : prefixCache?.get(key);
        const next = cached ?? {
          value: await operation.run(
            convert(current.value, current.type, operation.input),
            operation.args.parse(args),
            { progress() {} },
          ),
          type: operation.output,
        };
        const bytes = toBytes(next.value, next.type);
        if (key !== undefined && !cached) prefixCache?.set(key, next, bytes.byteLength);
        current = next;
        output = bytes;
      } catch (cause) {
        status = "error";
        error = cause instanceof Error ? cause.message : String(cause);
        errorIndex = index;
      }
    }

    if (status !== "error") stepValues[index] = current;
    const result: StepResult = {
      index, opId, status, type: current.type, size: output.byteLength,
      preview: decodeUtf8Lossy(output.subarray(0, 1024)),
      durationMs: performance.now() - stepStartedAt,
      ...(error === undefined ? {} : { error }),
    };
    steps.push(result);
    onStep?.(result);

    if (status === "error") break;
    if (enabled && breakpoint) {
      stoppedAt = index;
      break;
    }
  }

  return {
    output, outputType: current.type, steps, totalMs: performance.now() - startedAt,
    ...(stoppedAt === undefined ? {} : { stoppedAt }),
    ...(errorIndex === undefined ? {} : { errorIndex }),
  };
}
