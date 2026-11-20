"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { encodeShare, ShareError } from "@/core/share/url-codec";
import { useIoStore } from "@/stores/io";
import { useRecipeStore } from "@/stores/recipe";

export function ShareDialog({ onClose }: { onClose(): void }) {
  const [includeInput, setIncludeInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; inputOmitted: boolean }>();

  async function createLink() {
    setBusy(true);
    setResult(undefined);
    try {
      const recipe = useRecipeStore.getState().steps;
      const input = includeInput ? useIoStore.getState().input : undefined;
      const { fragment, inputIncluded } = await encodeShare({ recipe, input });
      const url = new URL(window.location.href);
      url.hash = fragment;
      setResult({ url: url.href, inputOmitted: includeInput && !inputIncluded });
    } catch (cause) {
      toast.error(cause instanceof ShareError ? cause.message : "Unable to create the share link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Share link copied.");
    } catch {
      toast.error("Unable to copy the share link.");
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share recipe</DialogTitle>
          <DialogDescription>Create a link to open this recipe on another device.</DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeInput}
            disabled={busy}
            onChange={(event) => {
              setIncludeInput(event.target.checked);
              setResult(undefined);
            }}
          />
          Include input
        </label>
        {result && (
          <div className="grid gap-2 text-sm">
            <label htmlFor="share-link">Share link</label>
            <input
              id="share-link"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              value={result.url}
              readOnly
              onFocus={(event) => event.target.select()}
            />
            {result.inputOmitted && (
              <p role="status" className="text-muted-foreground">
                The input exceeds the sharing size limit. This link includes only the recipe.
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button onClick={createLink} disabled={busy}>{busy ? "Creating link…" : "Create link"}</Button>
          {result && <Button variant="outline" onClick={() => copyLink(result.url)}>Copy link</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
