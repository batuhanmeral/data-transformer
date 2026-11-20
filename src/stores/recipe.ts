import { z } from "@/lib/zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultArgs } from "@/core/registry";
import type { Recipe } from "@/core/types";
import { localStorageSafe } from "./storage";

export const recipeSchema = z.array(z.object({
  key: z.string(),
  opId: z.string(),
  args: z.record(z.string(), z.unknown()),
  enabled: z.boolean(),
  breakpoint: z.boolean(),
}));

const persistedSchema = z.object({
  saved: z.array(z.object({ name: z.string(), recipe: recipeSchema, savedAt: z.number() })).optional(),
  favorites: z.array(z.string()).optional(),
});

interface RecipeState {
  steps: Recipe;
  add(opId: string, index?: number): void;
  remove(key: string): void;
  move(from: number, to: number): void;
  update(key: string, args: Record<string, unknown>): void;
  toggleEnabled(key: string): void;
  toggleBreakpoint(key: string): void;
  clear(): void;
  load(recipe: Recipe): void;
  saved: { name: string; recipe: Recipe; savedAt: number }[];
  save(name: string): void;
  deleteSaved(name: string): void;
  favorites: string[];
  toggleFavorite(opId: string): void;
}

export const useRecipeStore = create<RecipeState>()(persist(
  (set) => ({
    steps: [],
    saved: [],
    favorites: [],
    add: (opId, index) => set(({ steps }) => {
      const newStep = { key: crypto.randomUUID(), opId, args: defaultArgs(opId), enabled: true, breakpoint: false };
      const at = Math.max(0, Math.min(index ?? steps.length, steps.length));
      return { steps: steps.toSpliced(at, 0, newStep) };
    }),
    remove: (key) => set(({ steps }) => ({ steps: steps.filter((step) => step.key !== key) })),
    move: (from, to) => set(({ steps }) => {
      const step = steps[from];
      if (!step || !steps[to] || from === to) return { steps };
      return { steps: steps.toSpliced(from, 1).toSpliced(to, 0, step) };
    }),
    update: (key, args) => set(({ steps }) => ({
      steps: steps.map((step) => step.key === key ? { ...step, args } : step),
    })),
    toggleEnabled: (key) => set(({ steps }) => ({
      steps: steps.map((step) => step.key === key ? { ...step, enabled: !step.enabled } : step),
    })),
    toggleBreakpoint: (key) => set(({ steps }) => ({
      steps: steps.map((step) => step.key === key ? { ...step, breakpoint: !step.breakpoint } : step),
    })),
    clear: () => set({ steps: [] }),
    load: (recipe) => set({ steps: recipe }),
    save: (name) => set(({ saved, steps }) => ({
      saved: [{ name, recipe: steps, savedAt: Date.now() }, ...saved.filter((it) => it.name !== name)],
    })),
    deleteSaved: (name) => set(({ saved }) => ({ saved: saved.filter((it) => it.name !== name) })),
    toggleFavorite: (opId) => set(({ favorites }) => ({
      favorites: favorites.includes(opId)
        ? favorites.filter((id) => id !== opId)
        : [...favorites, opId],
    })),
  }),
  {
    name: "unravel:recipes:v1",
    storage: createJSONStorage(() => localStorageSafe),
    partialize: ({ saved, favorites }) => ({ saved, favorites }),
    merge: (persisted, current) => {
      const result = persistedSchema.safeParse(persisted);
      return result.success ? { ...current, ...result.data } : current;
    },
  },
));
