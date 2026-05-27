import type { AppData } from "../types";
import { createSeedData } from "../data/seed";

const STORAGE_KEY = "ingenium_app_v2";

export function loadAppData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createSeedData();
    saveAppData(seed);
    return seed;
  }
  try {
    const parsed = JSON.parse(raw) as AppData;
    if (parsed.version !== 2) {
      const seed = createSeedData();
      saveAppData(seed);
      return seed;
    }
    return parsed;
  } catch {
    const seed = createSeedData();
    saveAppData(seed);
    return seed;
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const STORAGE_INFO = {
  current: "localStorage (browser)",
  future:
    "Backend cloud (ex. Supabase / Firebase) — poze, postări, conversații, conturi reale",
} as const;
