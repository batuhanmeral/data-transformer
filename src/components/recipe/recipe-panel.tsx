"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ListOrdered, Play, X } from "lucide-react";
import { useContext, type ReactNode } from "react";
import { PipelineClientContext } from "@/app/pipeline-provider";
import { WorkspacePanel } from "@/components/layout/workspace-panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useIoStore } from "@/stores/io";
import { useRecipeStore } from "@/stores/recipe";
import { useUiStore } from "@/stores/ui";
import { StepCard } from "./step-card";

// One step below the "sm" button so Bake does not dominate the panel header.
const bakeButtonClass = "h-7 min-w-16 gap-1 px-2 text-sm has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5";

export function RecipePanel({ onBake, onCancel, headerActions }: {
  onBake(): void;
  onCancel?(): void;
  headerActions?: ReactNode;
}) {
  const recipe = useRecipeStore((state) => state.steps);
  const autoBake = useUiStore((state) => state.autoBake);
  const running = useIoStore((state) => state.status === "running");
  const selectedStep = useIoStore((state) => state.selectedStep);
  const results = useIoStore((state) => state.resultRecipe === recipe ? state.steps : undefined);
  const getClient = useContext(PipelineClientContext);
  const { isOver, setNodeRef } = useDroppable({ id: "recipe", data: { type: "recipe" } });

  async function selectStep(index: number) {
    if (useIoStore.getState().selectedStep === index) {
      useIoStore.setState({ selectedStep: undefined, selectedOutput: undefined });
      return;
    }

    useIoStore.setState({ selectedStep: index, selectedOutput: undefined });
    if (!getClient || useIoStore.getState().resultRecipe !== recipe) return;
    try {
      const { data, dataType } = await getClient().getStep(index);
      const current = useIoStore.getState();
      if (current.selectedStep === index && current.resultRecipe === recipe) {
        useIoStore.setState({ selectedOutput: { data, type: dataType } });
      }
    } catch {
      // Failed, unvisited, or stale steps have no intermediate output.
    }
  }

  return (
    <WorkspacePanel
      title="Recipe"
      icon={ListOrdered}
      detail={`${recipe.length} ${recipe.length === 1 ? "step" : "steps"}`}
      headerActions={headerActions}
      tools={
        <>
          <label className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">Auto-bake</span>
            <Switch aria-label="Auto-bake" checked={autoBake} onCheckedChange={(value) => useUiStore.setState({ autoBake: value })} />
          </label>
          {onCancel ? (
            <Button size="sm" variant="outline" aria-label="Cancel bake" onClick={onCancel} className={bakeButtonClass}>
              <X aria-hidden="true" /> Cancel
            </Button>
          ) : (
            <Button size="sm" aria-label="Bake" onClick={onBake} className={cn(bakeButtonClass, "text-white dark:text-primary-foreground")}>
              <Play aria-hidden="true" />
              {running ? "Baking…" : "Bake"}
            </Button>
          )}
        </>
      }
    >
      <div ref={setNodeRef} className={cn("h-full", isOver && "bg-primary/5 ring-1 ring-inset ring-primary")}>
        {recipe.length ? (
          <SortableContext items={recipe.map(({ key }) => key)} strategy={verticalListSortingStrategy}>
            <ol className="h-full space-y-2 overflow-auto p-3">
              {recipe.map((step, index) => (
                <StepCard
                  key={step.key}
                  step={step}
                  index={index}
                  selected={selectedStep === index}
                  result={results?.[index]}
                  onSelect={() => void selectStep(index)}
                />
              ))}
            </ol>
          </SortableContext>
        ) : (
          <div className="grid h-full place-items-center p-4 text-center">
            <p className="max-w-48 text-sm text-muted-foreground">Add an operation to start a recipe.</p>
          </div>
        )}
      </div>
    </WorkspacePanel>
  );
}
