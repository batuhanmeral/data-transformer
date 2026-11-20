"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { decodeShare, ShareError } from "@/core/share/url-codec";
import { useIoStore } from "@/stores/io";
import { useRecipeStore } from "@/stores/recipe";

export default function Home() {
  useEffect(() => {
    const fragment = window.location.hash;
    if (!fragment) return;

    let active = true;
    const { inputVersion } = useIoStore.getState();
    const { steps } = useRecipeStore.getState();

    void decodeShare(fragment).then(({ recipe, input }) => {
      if (!active || inputVersion !== useIoStore.getState().inputVersion || steps !== useRecipeStore.getState().steps) {
        return;
      }
      if (input !== undefined) useIoStore.getState().setInputBytes(input);
      useRecipeStore.getState().load(recipe);
    }).catch((cause: unknown) => {
      if (active) toast.error(cause instanceof ShareError ? cause.message : "Invalid share link.");
    });

    return () => { active = false; };
  }, []);

  return <AppShell />;
}
