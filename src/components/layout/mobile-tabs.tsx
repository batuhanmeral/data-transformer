"use client";

import { ArrowDownToLine, ArrowUpFromLine, ListOrdered } from "lucide-react";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUiStore } from "@/stores/ui";

export function MobileTabs({ input, recipe, output, tools }: {
  input: ReactNode;
  recipe: ReactNode;
  output: ReactNode;
  tools: ReactNode;
}) {
  const mobileTab = useUiStore((state) => state.mobileTab);

  return (
    <Tabs
      value={mobileTab}
      onValueChange={(value) => {
        if (value === "input" || value === "recipe" || value === "output") useUiStore.setState({ mobileTab: value });
      }}
      className="h-full min-h-0 gap-0"
    >
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-card px-2">
        <TabsList aria-label="Workspace panels" variant="line" className="h-full! min-w-0 flex-1">
          <TabsTrigger value="input"><ArrowUpFromLine aria-hidden="true" className="hidden min-[390px]:block" /> Input</TabsTrigger>
          <TabsTrigger value="recipe"><ListOrdered aria-hidden="true" className="hidden min-[390px]:block" /> Recipe</TabsTrigger>
          <TabsTrigger value="output"><ArrowDownToLine aria-hidden="true" className="hidden min-[390px]:block" /> Output</TabsTrigger>
        </TabsList>
        {tools}
      </div>
      <TabsContent value="input" className="min-h-0">{input}</TabsContent>
      <TabsContent value="recipe" className="min-h-0">{recipe}</TabsContent>
      <TabsContent value="output" className="min-h-0">{output}</TabsContent>
    </Tabs>
  );
}
