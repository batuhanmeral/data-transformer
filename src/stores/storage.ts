import type { StateStorage } from "zustand/middleware";

// Browsers can deny access to storage or fail a write when the quota is full.
export const localStorageSafe: StateStorage = {
  getItem(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // State remains available in memory.
    }
  },
  removeItem(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Storage may be disabled.
    }
  },
};
