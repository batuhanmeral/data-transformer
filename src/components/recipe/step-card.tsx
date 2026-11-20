"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Circle, GripVertical, Power, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StepResult } from "@/core/pipeline";
import { getOperation } from "@/core/registry";
import type { RecipeStep } from "@/core/types";
import { matchShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { useRecipeStore } from "@/stores/recipe";
import { ArgForm } from "./arg-form";

export function StepCard({ step, index, selected, result, onSelect }: {
  step: RecipeStep;
  index: number;
  selected: boolean;
  result?: StepResult;
  onSelect(): void;
}) {
  const { key, opId, enabled, breakpoint, args } = step;
  const operation = getOperation(opId);
  const name = operation?.name ?? opId;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: key,
    data: { type: "recipe-step", opId },
  });
  const status = result?.status ?? (enabled ? undefined : "skipped");

  function handleKeys(event: KeyboardEvent<HTMLButtonElement>) {
    const store = useRecipeStore.getState();
    const shortcuts: [string, () => void][] = [
      ["alt+arrowup", () => store.move(index, index - 1)],
      ["alt+arrowdown", () => store.move(index, index + 1)],
      ["delete", () => store.remove(key)],
      ["b", () => store.toggleBreakpoint(key)],
      ["d", () => store.toggleEnabled(key)],
    ];
    const hit = shortcuts.find(([combo]) => matchShortcut(event.nativeEvent, combo));
    if (hit) {
      event.preventDefault();
      hit[1]();
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-card",
        selected && "border-primary/70 ring-1 ring-primary/40",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex min-w-0 items-center gap-0.5 p-1.5">
        <Button
          variant="ghost" size="icon-xs" type="button" ref={setActivatorNodeRef}
          {...attributes} {...listeners}
          aria-label={`Drag step ${index + 1}: ${name}`}
          className="cursor-grab touch-none text-muted-foreground"
        >
          <GripVertical aria-hidden="true" />
        </Button>
        <button
          type="button"
          aria-label={`Select step ${index + 1}: ${name}`}
          aria-pressed={selected}
          onClick={onSelect}
          onKeyDown={handleKeys}
          className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1.5 text-left text-base focus-visible:outline focus-visible:outline-ring"
        >
          <span className="font-mono text-xs text-muted-foreground">{index + 1}</span>
          <span className={cn("truncate font-semibold", !enabled && "text-muted-foreground")}>{name}</span>
        </button>
        <Button
          variant="ghost" size="icon-xs" type="button" aria-label={`Breakpoint for ${name}`}
          title="Toggle breakpoint (B)" aria-pressed={breakpoint}
          onClick={() => useRecipeStore.getState().toggleBreakpoint(key)}
          className={breakpoint ? "text-destructive" : "text-muted-foreground"}
        >
          <Circle aria-hidden="true" className={cn("size-3", breakpoint && "fill-current")} />
        </Button>
        <Button
          variant="ghost" size="icon-xs" type="button" aria-label={`Enable ${name}`} aria-pressed={enabled}
          title="Toggle step (D)" onClick={() => useRecipeStore.getState().toggleEnabled(key)}
          className={enabled ? "text-foreground" : "text-muted-foreground"}
        >
          <Power aria-hidden="true" />
        </Button>
        <Button
          variant="ghost" size="icon-xs" type="button" aria-label={`Remove ${name}`}
          title="Remove step (Delete)" onClick={() => useRecipeStore.getState().remove(key)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2.5 font-mono text-xs text-muted-foreground">
        {operation && <Badge variant="outline" className="min-h-5 px-1.5">{operation.input} → {operation.output}</Badge>}
        {status && (
          <Badge variant={status === "error" ? "destructive" : "secondary"} className="min-h-5 px-1.5">
            {status === "ok" ? "OK" : status === "skipped" ? "Skipped" : "Error"}
          </Badge>
        )}
        {result && <span>{result.size.toLocaleString()} B · {result.durationMs.toFixed(1)} ms</span>}
      </div>
      {operation && Object.keys(operation.args.shape).length > 0 && (
        <div className="border-t border-border px-3 py-2.5">
          <ArgForm schema={operation.args} value={args} onChange={(value) => useRecipeStore.getState().update(key, value)} />
        </div>
      )}
      {result?.error && (
        <p role="alert" className="border-t border-destructive/25 bg-destructive/10 px-3 py-2 text-xs whitespace-pre-wrap wrap-break-word text-destructive">
          {result.error}
        </p>
      )}
    </li>
  );
}
