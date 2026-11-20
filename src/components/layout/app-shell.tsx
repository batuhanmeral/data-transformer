"use client";

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, defaultKeyboardCoordinateGetter, rectIntersection, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Layers, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { OperationList } from "@/components/operations/operation-list";
import { CommandPalette } from "@/components/palette/command-palette";
import { RecipePanel } from "@/components/recipe/recipe-panel";
import { InputPanel } from "@/components/io/input-panel";
import { OutputPanel } from "@/components/io/output-panel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useBake } from "@/hooks/use-bake";
import { getOperation } from "@/core/registry";
import { useIoStore } from "@/stores/io";
import { useRecipeStore } from "@/stores/recipe";
import { restoreSession, saveSession } from "@/stores/session";
import { useUiStore } from "@/stores/ui";
import { MobileTabs } from "./mobile-tabs";
import { WorkspacePanel } from "./workspace-panel";

const desktopQuery = "(min-width: 1024px)";
const tabletQuery = "(min-width: 768px)";

function subscribeViewport(onChange: () => void) {
  const media = [matchMedia(desktopQuery), matchMedia(tabletQuery)];
  for (const query of media) query.addEventListener("change", onChange);
  return () => {
    for (const query of media) query.removeEventListener("change", onChange);
  };
}

function getViewport() {
  if (matchMedia(desktopQuery).matches) return "desktop";
  return matchMedia(tabletQuery).matches ? "tablet" : "mobile";
}

function IoPanels() {
  return (
    <ResizablePanelGroup orientation="vertical" defaultLayout={{ input: 50, output: 50 }}>
      <ResizablePanel id="input" minSize="20%"><InputPanel /></ResizablePanel>
      <ResizableHandle aria-label="Resize input and output" />
      <ResizablePanel id="output" minSize="20%"><OutputPanel /></ResizablePanel>
    </ResizablePanelGroup>
  );
}

function DesktopPanels({ recipePanel }: { recipePanel: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const sizes = useUiStore((state) => state.panelSizes);
  const [operations = 20, recipe = 30, io = 50] = sizes;

  return (
    <ResizablePanelGroup
      id="workspace"
      defaultLayout={{ operations, recipe, io }}
      onLayoutChanged={(layout, { isUserInteraction }) => {
        if (isUserInteraction) {
          useUiStore.setState({ panelSizes: [layout.operations ?? 20, layout.recipe ?? 30, layout.io ?? 50] });
        }
      }}
    >
      <ResizablePanel id="operations" minSize="15%">
        <WorkspacePanel
          title="Operations"
          icon={Layers}
          tools={
            <>
              <CommandPalette />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle theme"
                title="Cycle dark, light, and system themes"
                onClick={() => setTheme(theme === "light" ? "system" : theme === "system" ? "dark" : "light")}
              >
                <SunMoon aria-hidden="true" />
              </Button>
            </>
          }
        >
          <OperationList draggable />
        </WorkspacePanel>
      </ResizablePanel>
      <ResizableHandle aria-label="Resize operations and recipe" />
      <ResizablePanel id="recipe" minSize="20%">{recipePanel}</ResizablePanel>
      <ResizableHandle aria-label="Resize recipe and input/output" />
      <ResizablePanel id="io" minSize="30%"><IoPanels /></ResizablePanel>
    </ResizablePanelGroup>
  );
}

export function AppShell() {
  const viewport = useSyncExternalStore(subscribeViewport, getViewport, () => "desktop");
  const { bake, cancel, canCancel } = useBake();
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [draggedOperation, setDraggedOperation] = useState<string>();
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, args) => args.context.active?.data.current?.type === "recipe-step"
        ? sortableKeyboardCoordinates(event, args)
        : defaultKeyboardCoordinateGetter(event, args),
    }),
  );
  useEffect(() => {
    const input = useIoStore.subscribe((state, previous) => {
      if (state.inputVersion !== previous.inputVersion) saveSession();
    });
    const recipe = useRecipeStore.subscribe((state, previous) => {
      if (state.steps !== previous.steps) {
        useIoStore.setState({ selectedStep: undefined, selectedOutput: undefined });
        saveSession();
      }
    });
    void restoreSession();
    return () => {
      input();
      recipe();
    };
  }, []);

  const browseTools = (
    <>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Open operations" title="Operations">
          <Layers aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <CommandPalette />
    </>
  );
  const recipePanel = (
    <RecipePanel
      onBake={bake}
      onCancel={canCancel ? cancel : undefined}
      headerActions={viewport === "tablet" && <div className="flex justify-end gap-1.5 px-3.5 pb-1">{browseTools}</div>}
    />
  );

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={(args) => args.active.data.current?.type === "recipe-step"
        ? closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter((item) => item.data.current?.type === "recipe-step"),
          })
        : rectIntersection(args)}
      onDragStart={({ active }) => {
        const opId: unknown = active.data.current?.opId;
        if (typeof opId === "string") setDraggedOperation(getOperation(opId)?.name);
      }}
      onDragCancel={() => setDraggedOperation(undefined)}
      onDragEnd={({ active, over }) => {
        setDraggedOperation(undefined);
        const opId: unknown = active.data.current?.opId;
        const store = useRecipeStore.getState();
        const overIndex = store.steps.findIndex(({ key }) => key === over?.id);
        if (active.data.current?.type === "operation" && typeof opId === "string") {
          if (over?.id === "recipe" || overIndex >= 0) store.add(opId, overIndex < 0 ? undefined : overIndex);
        } else if (active.data.current?.type === "recipe-step" && overIndex >= 0) {
          store.move(store.steps.findIndex(({ key }) => key === active.id), overIndex);
        }
      }}
    >
      <Sheet open={operationsOpen} onOpenChange={setOperationsOpen}>
        <main aria-label="Data workspace" className="h-dvh overflow-hidden">
          <h1 className="sr-only">Unravel</h1>
          {viewport === "desktop" && <DesktopPanels recipePanel={recipePanel} />}
          {viewport === "tablet" && (
            <div className="grid h-full grid-cols-[2fr_3fr] divide-x divide-border">
              {recipePanel}
              <IoPanels />
            </div>
          )}
          {viewport === "mobile" && (
            <MobileTabs input={<InputPanel />} recipe={recipePanel} output={<OutputPanel />} tools={browseTools} />
          )}
        </main>
        <SheetContent side="left" className="w-[min(90vw,22rem)] gap-0">
          <SheetHeader className="shrink-0 border-b border-border">
            <SheetTitle>Operations</SheetTitle>
            <SheetDescription className="sr-only">Choose an operation for the recipe.</SheetDescription>
          </SheetHeader>
          <OperationList onAdd={() => {
            setOperationsOpen(false);
            if (viewport === "mobile") useUiStore.setState({ mobileTab: "recipe" });
          }} />
        </SheetContent>
      </Sheet>
      <DragOverlay dropAnimation={null}>
        {draggedOperation && (
          <div className="w-fit rounded-md border border-primary/60 bg-card px-3 py-2 text-sm shadow-lg">
            {draggedOperation}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
