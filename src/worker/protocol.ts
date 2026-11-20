import type { MagicSuggestion } from "../core/magic/types";
import type { StepResult } from "../core/pipeline";
import type { DataType, Recipe } from "../core/types";

export type ToWorker =
  | { type: "run"; runId: number; inputVersion: number; input?: ArrayBuffer; recipe: Recipe }
  | { type: "getStep"; runId: number; index: number }
  | { type: "magic"; runId: number; depth: number; budgetMs: number };

export type FromWorker =
  | { type: "step"; runId: number; result: StepResult }
  | {
      type: "done";
      runId: number;
      output: ArrayBuffer;
      outputType: DataType;
      stoppedAt?: number;
      errorIndex?: number;
      totalMs: number;
    }
  | { type: "stepData"; runId: number; index: number; data: ArrayBuffer; dataType: DataType }
  | { type: "stepError"; runId: number; index: number; message: string }
  | { type: "magicResult"; runId: number; suggestions: MagicSuggestion[] }
  | { type: "fatal"; runId: number; message: string };
