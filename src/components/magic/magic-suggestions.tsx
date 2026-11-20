"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MagicSuggestion } from "@/core/magic/types";
import { getOperation } from "@/core/registry";
import { useIoStore } from "@/stores/io";
import { useRecipeStore } from "@/stores/recipe";

export function MagicSuggestions() {
  const suggestions = useIoStore((state) => state.magicSuggestions);
  const resultRecipe = useIoStore((state) => state.resultRecipe);
  const recipe = useRecipeStore((state) => state.steps);

  if (!suggestions?.length || resultRecipe !== recipe) return null;

  function apply(suggestion: MagicSuggestion) {
    const current = useRecipeStore.getState();
    if (current.steps !== recipe || useIoStore.getState().magicSuggestions !== suggestions) return;
    const added = suggestion.steps.map((step) => ({
      ...step, key: crypto.randomUUID(), enabled: true, breakpoint: false,
    }));
    current.load([...recipe, ...added]);
  }

  return (
    <div role="group" aria-label="Magic suggestions" className="flex flex-wrap items-center gap-1.5 px-3.5 pb-2">
      <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-primary-text" />
      {suggestions.map((suggestion) => {
        const ids = suggestion.steps.map(({ opId }) => opId);
        const label = ids.map((id) => getOperation(id)?.name ?? id).join(" → ");
        return (
          <Button
            key={ids.join("/")}
            type="button"
            variant="outline"
            size="xs"
            className="h-auto min-h-6 max-w-full whitespace-normal"
            title={suggestion.preview}
            onClick={() => apply(suggestion)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
