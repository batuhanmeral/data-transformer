import { toBytes } from "../core/convert";
import { magic, magicInputLimit } from "../core/magic/search";
import { getStepValue, runPipeline } from "../core/pipeline";
import { StepCache } from "../core/step-cache";
import type { FromWorker, ToWorker } from "./protocol";

export function createHandler(
  post: (m: FromWorker, transfer?: Transferable[]) => void,
): (m: ToWorker) => Promise<void> {
  const cache = new StepCache();
  let savedInput: { version: number; bytes: Uint8Array } | undefined;
  let latestRunId: number | undefined;
  let stepRunId: number | undefined;
  let stepValues: ReturnType<typeof getStepValue>[] = [];
  let bakedOutput: Uint8Array | undefined;
  let activeMagic: AbortController | undefined;
  let runs = Promise.resolve();
  let queue = runs;

  return async (message) => {
    const { runId } = message;
    switch (message.type) {
      case "magic":
        if (runId !== latestRunId) return;
        queue = queue.then(async () => {
          if (runId !== latestRunId) return;
          const controller = new AbortController();
          activeMagic = controller;
          const suggestions = bakedOutput
            ? await magic(bakedOutput, {
              depth: message.depth, budgetMs: message.budgetMs, signal: controller.signal,
            }).catch(() => [])
            : [];
          activeMagic = undefined;
          if (runId === latestRunId) post({ type: "magicResult", runId, suggestions });
        });
        await queue;
        return;
      case "getStep": {
        const { index } = message;
        try {
          if (runId === latestRunId) await runs;
          const step = runId === latestRunId && runId === stepRunId ? stepValues[index] : undefined;
          if (!step) throw new Error(`No output is available for step ${index} of run ${runId}.`);

          const data = toBytes(step.value, step.type).slice().buffer;
          post({ type: "stepData", runId, index, data, dataType: step.type }, [data]);
        } catch (cause) {
          post({ type: "stepError", runId, index, message: cause instanceof Error ? cause.message : String(cause) });
        }
        return;
      }
      case "run": {
        const { input, inputVersion, recipe } = message;
        latestRunId = runId;
        activeMagic?.abort();
        bakedOutput = undefined;
        if (input !== undefined) {
          savedInput = { version: inputVersion, bytes: new Uint8Array(input) };
        }

        // Capture the input for this message before another run can replace it.
        const bytes = savedInput?.version === inputVersion ? savedInput.bytes : undefined;
        runs = queue = queue.then(async () => {
          if (runId !== latestRunId) return;
          if (!bytes) {
            post({ type: "fatal", runId, message: "No input was sent for this version." });
            return;
          }

          stepRunId = runId;
          stepValues = [];
          try {
            const result = await runPipeline(bytes, inputVersion, recipe, {
              cache,
              onStep(result) {
                if (runId === latestRunId) {
                  // Magic uses the pipeline too, so retain only this bake's step values here.
                  stepValues[result.index] = getStepValue(result.index);
                  post({ type: "step", runId, result });
                }
              },
            });
            if (runId === latestRunId) {
              // The pipeline can still hold this output as input, a step value, or a cache entry.
              const output = result.output.slice().buffer;
              const { outputType, totalMs, stoppedAt, errorIndex } = result;
              if (stoppedAt === undefined && errorIndex === undefined) {
                bakedOutput = result.output.slice(0, magicInputLimit);
              }
              post({ type: "done", runId, output, outputType, totalMs, stoppedAt, errorIndex }, [output]);
            }
          } catch (cause) {
            if (runId === latestRunId) {
              post({ type: "fatal", runId, message: cause instanceof Error ? cause.message : String(cause) });
            }
          }
        });
        await runs;
      }
    }
  };
}
