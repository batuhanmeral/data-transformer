import type { DataType, Recipe } from "./types";

interface StepValue {
  value: unknown;
  type: DataType;
}

export class StepCache {
  private readonly entries = new Map<string, { result: StepValue; size: number }>();
  private bytes = 0;

  constructor(private readonly maxBytes = 256 * 1024 * 1024) {}

  get(key: string): StepValue | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.result;
  }

  set(key: string, v: StepValue, size: number): void {
    this.delete(key);

    // Even an empty result occupies a cache entry.
    const weight = Math.max(1, size);
    if (weight > this.maxBytes) return;

    this.entries.set(key, { result: v, size: weight });
    this.bytes += weight;
    for (const oldest of this.entries.keys()) {
      if (this.bytes <= this.maxBytes) break;
      this.delete(oldest);
    }
  }

  clear(): void {
    this.entries.clear();
    this.bytes = 0;
  }

  private delete(key: string): void {
    const entry = this.entries.get(key);
    if (entry) {
      this.bytes -= entry.size;
      this.entries.delete(key);
    }
  }
}

export function stepCacheKey(inputVersion: number, recipe: Recipe, index: number): string {
  const prefix = recipe.slice(0, index + 1)
    .filter(({ enabled }) => enabled)
    .map(({ opId, args }) => [opId, args]);

  return JSON.stringify([inputVersion, prefix], (_key, value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : Number(a > b)));
  });
}
