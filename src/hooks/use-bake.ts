"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { PipelineClientContext } from "@/app/pipeline-provider";
import { matchShortcut } from "@/lib/shortcuts";
import { useIoStore } from "@/stores/io";
import { useRecipeStore } from "@/stores/recipe";
import { useUiStore } from "@/stores/ui";

const autoBakeDelay = 300;
const cancelAfter = 150;

export function useBake() {
  const getClient = useContext(PipelineClientContext);
  const autoBake = useUiStore((state) => state.autoBake);
  const inputVersion = useIoStore((state) => state.inputVersion);
  const recipe = useRecipeStore((state) => state.steps);
  const busySince = useRef<number | undefined>(undefined);
  const cancelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [canCancel, setCanCancel] = useState(false);

  const finish = useCallback(() => {
    clearTimeout(cancelTimer.current);
    busySince.current = undefined;
    setCanCancel(false);
  }, []);

  const bake = useCallback(() => {
    if (!getClient) return;
    clearTimeout(autoTimer.current);
    const client = getClient();
    const now = performance.now();

    if (client.isBusy() && busySince.current !== undefined && now - busySince.current > cancelAfter) {
      client.cancel();
    }
    if (!client.isBusy() || busySince.current === undefined) {
      clearTimeout(cancelTimer.current);
      setCanCancel(false);
      busySince.current = now;
      cancelTimer.current = setTimeout(() => setCanCancel(client.isBusy()), cancelAfter);
    }

    const { input, inputVersion } = useIoStore.getState();
    const { steps } = useRecipeStore.getState();
    useIoStore.setState({
      status: "running", resultRecipe: steps, steps: [],
      selectedStep: undefined, selectedOutput: undefined, totalMs: undefined, magicSuggestions: undefined,
    });
    client.run(input, inputVersion, steps, {
      onStep(result) {
        useIoStore.setState((state) => ({ steps: [...state.steps, result] }));
      },
      onDone({ output, outputType, errorIndex, totalMs }) {
        finish();
        useIoStore.setState({
          status: errorIndex === undefined ? "idle" : "error",
          output: { data: new Uint8Array(output), type: outputType },
          totalMs,
        });
      },
      onMagic(magicSuggestions) {
        if (useIoStore.getState().inputVersion === inputVersion && useRecipeStore.getState().steps === steps) {
          useIoStore.setState({ magicSuggestions });
        }
      },
      onFatal() {
        finish();
        useIoStore.setState({ status: "error" });
      },
    });
  }, [finish, getClient]);

  const cancel = useCallback(() => {
    clearTimeout(autoTimer.current);
    getClient?.().cancel();
    finish();
    useIoStore.setState({
      status: "idle", steps: [], resultRecipe: undefined, selectedStep: undefined,
      selectedOutput: undefined, magicSuggestions: undefined,
    });
  }, [finish, getClient]);

  useEffect(() => {
    if (!autoBake || (inputVersion === 0 && recipe.length === 0)) return;
    autoTimer.current = setTimeout(bake, autoBakeDelay);
    return () => clearTimeout(autoTimer.current);
  }, [autoBake, bake, inputVersion, recipe]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || !matchShortcut(event, "mod+enter")) return;
      event.preventDefault();
      bake();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      clearTimeout(cancelTimer.current);
    };
  }, [bake]);

  return { bake, cancel, canCancel };
}
