// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, expect, it, vi } from "vitest";
import { idbGet, idbSet } from "./idb";
import { useIoStore } from "./io";
import { useRecipeStore } from "./recipe";
import { restoreSession, saveSession } from "./session";
import { useUiStore } from "./ui";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  useRecipeStore.setState({ steps: [], saved: [], favorites: [] });
  useIoStore.setState(useIoStore.getInitialState());
  useUiStore.setState(useUiStore.getInitialState());
  localStorage.clear();
});

it("move reorders steps", () => {
  const { add, move } = useRecipeStore.getState();
  add("to-base64");
  add("from-base64");
  move(1, 0);
  expect(useRecipeStore.getState().steps.map(({ opId }) => opId)).toEqual(["from-base64", "to-base64"]);
});

it("add uses defaultArgs", () => {
  useRecipeStore.getState().add("from-base64");
  expect(useRecipeStore.getState().steps).toEqual([
    expect.objectContaining({ opId: "from-base64", args: { alphabet: "standard", strict: false } }),
  ]);
});

it("ignores corrupt persisted state", async () => {
  localStorage.setItem("data-workbench:recipes:v1", "{broken");
  localStorage.setItem("data-workbench:ui:v1", JSON.stringify({ state: { autoBake: "false", mobileTab: "unknown" } }));
  await useRecipeStore.persist.rehydrate();
  await useUiStore.persist.rehydrate();
  expect(useRecipeStore.getState()).toMatchObject({ steps: [], saved: [], favorites: [] });
  expect(useUiStore.getState()).toMatchObject({ autoBake: true, mobileTab: "input" });
});

it("persists saved recipes and favorites without persisting working steps", async () => {
  const { add, save, toggleFavorite } = useRecipeStore.getState();
  add("to-base64");
  save("Encode");
  toggleFavorite("to-base64");
  const stored = JSON.parse(localStorage.getItem("data-workbench:recipes:v1") ?? "{}");
  expect(stored.state).toEqual({
    saved: [{ name: "Encode", recipe: useRecipeStore.getState().steps, savedAt: expect.any(Number) }],
    favorites: ["to-base64"],
  });
});

it("session roundtrip", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const input = Uint8Array.of(0xff, 0, 0x41);
  useIoStore.getState().setInputBytes(input, "sample.bin");
  useRecipeStore.getState().add("to-base64");
  const steps = useRecipeStore.getState().steps;
  saveSession();
  await vi.advanceTimersByTimeAsync(1000);
  vi.useRealTimers();
  await vi.waitFor(async () => expect(await idbGet("session")).toBeDefined());
  useIoStore.getState().setInputText("temporary");
  useRecipeStore.getState().clear();

  await expect(restoreSession()).resolves.toBe(true);
  expect(useIoStore.getState()).toMatchObject({ input, inputName: "sample.bin", inputVersion: 3 });
  expect(useRecipeStore.getState().steps).toEqual(steps);
});

it("idb failures are swallowed", async () => {
  vi.stubGlobal("indexedDB", { open() { throw new Error("Denied"); } });
  await expect(idbGet("session")).resolves.toBeUndefined();
  await expect(idbSet("session", {})).resolves.toBeUndefined();
  await expect(restoreSession()).resolves.toBe(false);
});
