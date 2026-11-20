import { z } from "@/lib/zod";
import { idbGet, idbSet } from "./idb";
import { useIoStore } from "./io";
import { recipeSchema, useRecipeStore } from "./recipe";

const schema = z.object({
  input: z.custom<Uint8Array>((value) =>
    ArrayBuffer.isView(value) && Object.prototype.toString.call(value) === "[object Uint8Array]",
  ),
  inputName: z.string().optional(),
  steps: recipeSchema,
});

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export function saveSession(): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { input, inputName } = useIoStore.getState();
    const { steps } = useRecipeStore.getState();
    void idbSet("session", { input, inputName, steps });
  }, 1000);
}

export async function restoreSession(): Promise<boolean> {
  // Shared links start with a fresh workspace, even if decoding fails.
  if (typeof window !== "undefined" && window.location.hash) return false;
  const { inputVersion } = useIoStore.getState();
  const { steps } = useRecipeStore.getState();
  const session = schema.safeParse(await idbGet("session"));
  if (!session.success || inputVersion !== useIoStore.getState().inputVersion || steps !== useRecipeStore.getState().steps) {
    return false;
  }

  useIoStore.getState().setInputBytes(new Uint8Array(session.data.input), session.data.inputName);
  useRecipeStore.getState().load(session.data.steps);
  return true;
}
