export function matchShortcut(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+").map((part) => part.trim());
  const key = parts.pop();
  if (!key || event.key.toLowerCase() !== key || event.isComposing) return false;

  const mac = /mac/i.test(globalThis.navigator?.platform ?? "");
  const modifiers = new Set(parts.map((part) => part === "mod" ? (mac ? "meta" : "ctrl") : part));
  if ([...modifiers].some((part) => !["alt", "ctrl", "meta", "shift"].includes(part))) return false;

  return event.altKey === modifiers.has("alt") &&
    event.ctrlKey === modifiers.has("ctrl") &&
    event.metaKey === modifiers.has("meta") &&
    event.shiftKey === modifiers.has("shift");
}
