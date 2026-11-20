"use client";

import { ChevronRight, Search } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listOperations, type OperationMeta } from "@/core/registry";
import type { Category } from "@/core/types";
import { useRecipeStore } from "@/stores/recipe";
import { OperationItem } from "./operation-item";

const operations = listOperations();
const categories: Record<Category, string> = {
  encoding: "Encoding",
  text: "Text",
  hash: "Hash",
  crypto: "Crypto",
  compression: "Compression",
  data: "Data",
  extract: "Extract",
};

export function OperationList({ draggable = false, onAdd }: { draggable?: boolean; onAdd?(): void }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const favorites = useRecipeStore((state) => state.favorites);
  const add = useRecipeStore((state) => state.add);
  const toggleFavorite = useRecipeStore((state) => state.toggleFavorite);
  const favoriteIds = new Set(favorites);
  const search = query.trim().toLowerCase();
  const groups = new Map<string, OperationMeta[]>([["Favorites", []]]);

  for (const operation of operations) {
    const searchable = `${operation.name} ${operation.description}`.toLowerCase();
    if (!searchable.includes(search)) continue;
    const group = favoriteIds.has(operation.id) ? "Favorites" : categories[operation.category];
    const items = groups.get(group);
    if (items) items.push(operation);
    else groups.set(group, [operation]);
  }

  const sections = [...groups.entries()].filter(([, items]) => items.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="relative shrink-0 p-3">
        <Search aria-hidden="true" className="pointer-events-none absolute top-5.5 left-5.5 size-4 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search operations"
          placeholder="Search operations…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-9 bg-card pl-8"
        />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 px-3 pb-3">
          {sections.map(([title, items]) => (
            <section key={title} aria-label={title}>
              <Collapsible.Root
                open={Boolean(search) || !collapsed.includes(title)}
                disabled={Boolean(search)}
                onOpenChange={(open) => setCollapsed((current) =>
                  open ? current.filter((name) => name !== title) : [...current, title],
                )}
              >
                <h3>
                  <Collapsible.Trigger className="group mb-1 flex w-full items-center gap-1.5 rounded px-1 py-1.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:text-foreground focus-visible:outline focus-visible:outline-ring">
                    <ChevronRight aria-hidden="true" className="size-3 group-data-[state=open]:rotate-90" />
                    {title}
                  </Collapsible.Trigger>
                </h3>
                <Collapsible.Content asChild>
                  <ul className="space-y-0.5">
                    {items.map((operation) => (
                      <OperationItem
                        key={operation.id}
                        operation={operation}
                        favorite={favoriteIds.has(operation.id)}
                        draggable={draggable}
                        onAdd={() => {
                          add(operation.id);
                          onAdd?.();
                        }}
                        onFavorite={() => toggleFavorite(operation.id)}
                      />
                    ))}
                  </ul>
                </Collapsible.Content>
              </Collapsible.Root>
            </section>
          ))}
          {!sections.length && <p className="px-1 py-2 text-sm text-muted-foreground">No matching operations.</p>}
        </div>
      </ScrollArea>
    </div>
  );
}
