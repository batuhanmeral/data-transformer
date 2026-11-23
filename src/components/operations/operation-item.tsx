"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { OperationMeta } from "@/core/registry";
import type { Category } from "@/core/types";
import { cn } from "@/lib/utils";

// Literal class names so Tailwind can see them; colors live in globals.css.
const categoryDotClass: Record<Category, string> = {
  encoding: "bg-(--category-encoding)",
  text: "bg-(--category-text)",
  hash: "bg-(--category-hash)",
  crypto: "bg-(--category-crypto)",
  compression: "bg-(--category-compression)",
  data: "bg-(--category-data)",
  extract: "bg-(--category-extract)",
};

export function OperationItem({ operation, favorite, draggable, onAdd, onFavorite }: {
  operation: OperationMeta;
  favorite: boolean;
  draggable: boolean;
  onAdd(): void;
  onFavorite(): void;
}) {
  const { id, name, description, category } = operation;
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `operation:${id}`,
    data: { type: "operation", opId: id },
    disabled: !draggable,
  });
  const actionClass = "grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-ring opacity-0 group-hover/operation:opacity-100 group-focus-within/operation:opacity-100 [@media(hover:none)]:opacity-100";

  return (
    <li
      ref={draggable ? setNodeRef : undefined}
      className={cn("group/operation flex items-center gap-0.5 rounded-md border border-transparent pr-1 hover:border-border hover:bg-card focus-within:border-border focus-within:bg-card", isDragging && "opacity-40")}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Add ${name}`}
            onClick={onAdd}
            className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-left text-base font-normal hover:text-primary-text focus-visible:outline focus-visible:outline-ring"
          >
            <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", categoryDotClass[category])} />
            <span className="truncate">{name}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={6} className="max-w-60">{description}</TooltipContent>
      </Tooltip>
      <button
        type="button"
        aria-label={`Favorite ${name}`}
        aria-pressed={favorite}
        title={favorite ? "Remove favorite" : "Add favorite"}
        onClick={onFavorite}
        className={cn(actionClass, favorite && "text-primary-text")}
      >
        <Star aria-hidden="true" className={cn("size-3.5", favorite && "fill-current")} />
      </button>
      {draggable && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag ${name}`}
          title="Drag into recipe"
          className={cn(actionClass, "cursor-grab touch-none active:cursor-grabbing")}
        >
          <GripVertical aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </li>
  );
}
