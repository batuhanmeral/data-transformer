"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { importCyberChef } from "@/core/share/cyberchef-import";
import type { Recipe } from "@/core/types";
import { useRecipeStore } from "@/stores/recipe";

export function CyberChefImportDialog({ onClose }: { onClose(): void }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof importCyberChef>>();

  function load(recipe: Recipe) {
    useRecipeStore.getState().load(recipe);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import CyberChef recipe</DialogTitle>
          <DialogDescription>Paste a JSON or compact CyberChef recipe to replace the current recipe.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const result = importCyberChef(text);
            if (result.issues.length > 0) setPreview(result);
            else load(result.recipe);
          }}
        >
          <label className="grid gap-2 text-sm">
            CyberChef recipe
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setPreview(undefined);
              }}
            />
          </label>
          {preview && (
            <ul role="status" className="max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-muted-foreground">
              {preview.issues.map(({ op, message }, index) => (
                <li key={index} className="break-words">{op}: {message}</li>
              ))}
            </ul>
          )}
          <DialogFooter>
            {preview && preview.recipe.length > 0
              ? <Button type="button" onClick={() => load(preview.recipe)}>Import supported steps</Button>
              : <Button type="submit" disabled={!text.trim()}>Import recipe</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
