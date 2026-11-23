import { z } from "@/lib/zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { localStorageSafe } from "./storage";

interface UiState {
  autoBake: boolean;
  panelSizes: number[];
  mobileTab: "input" | "recipe" | "output";
}

const persistedSchema = z.object({
  autoBake: z.boolean().optional(),
  panelSizes: z.tuple([z.number().positive(), z.number().positive(), z.number().positive()])
    .refine((sizes) => Math.abs(sizes.reduce((sum, size) => sum + size, 0) - 100) < 0.01)
    .optional(),
  mobileTab: z.enum(["input", "recipe", "output"]).optional(),
});

export const useUiStore = create<UiState>()(persist(
  (): UiState => ({ autoBake: true, panelSizes: [20, 30, 50], mobileTab: "input" }),
  {
    name: "data-workbench:ui:v1",
    storage: createJSONStorage(() => localStorageSafe),
    merge: (persisted, current) => {
      const result = persistedSchema.safeParse(persisted);
      return result.success ? { ...current, ...result.data } : current;
    },
  },
));
