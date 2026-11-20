import { create } from "zustand";
import { toBytes } from "@/core/convert";
import type { MagicSuggestion } from "@/core/magic/types";
import type { StepResult } from "@/core/pipeline";
import type { DataType, Recipe } from "@/core/types";

interface IoState {
  input: Uint8Array;
  inputVersion: number;
  inputName?: string;
  setInputText(s: string): void;
  setInputBytes(b: Uint8Array, name?: string): void;
  output?: { data: Uint8Array; type: DataType };
  steps: StepResult[];
  status: "idle" | "running" | "error";
  totalMs?: number;
  selectedStep?: number;
  selectedOutput?: IoState["output"];
  resultRecipe?: Recipe;
  magicSuggestions?: MagicSuggestion[];
  view: "text" | "hex";
}

export const useIoStore = create<IoState>((set, get) => ({
  input: new Uint8Array(),
  inputVersion: 0,
  setInputText: (text) => get().setInputBytes(toBytes(text, "string")),
  setInputBytes: (input, inputName) => set(({ inputVersion }) => ({
    input, inputName, inputVersion: inputVersion + 1, magicSuggestions: undefined,
  })),
  output: undefined,
  steps: [],
  status: "idle",
  totalMs: undefined,
  selectedStep: undefined,
  view: "text",
}));
