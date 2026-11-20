// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { matchShortcut } from "./shortcuts";

afterEach(() => vi.unstubAllGlobals());

it.each([
  ["MacIntel", { metaKey: true }, { ctrlKey: true }],
  ["Linux x86_64", { ctrlKey: true }, { metaKey: true }],
])("matchShortcut handles mod on %s", (platform, modifier, wrongModifier) => {
  vi.stubGlobal("navigator", { platform });
  expect(matchShortcut(new KeyboardEvent("keydown", { key: "k", ...modifier }), "mod+k")).toBe(true);
  expect(matchShortcut(new KeyboardEvent("keydown", { key: "k", ...wrongModifier }), "mod+k")).toBe(false);
  expect(matchShortcut(new KeyboardEvent("keydown", { key: "K", ...modifier, shiftKey: true }), "mod+k")).toBe(false);
  expect(matchShortcut(new KeyboardEvent("keydown", { key: "K", ...modifier, shiftKey: true }), "mod+shift+k")).toBe(true);
});
