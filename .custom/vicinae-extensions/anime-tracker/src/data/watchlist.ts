import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { watchlistPath, configDir } from "../utils/paths";
import type { WatchlistData, WatchlistEntry } from "../types";

// ---------------------------------------------------------------------------
// Watchlist persistence — load from / save to ~/.custom/configs/anime-tracker/
// ---------------------------------------------------------------------------

export function loadWatchlist(): WatchlistData {
  const fp = watchlistPath();
  if (!existsSync(fp)) {
    return { entries: Object.freeze([]), updatedAt: new Date().toISOString() };
  }
  const raw = readFileSync(fp, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "entries" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).entries)
  ) {
    const data = parsed as { entries: WatchlistEntry[]; updatedAt?: string };
    return {
      entries: Object.freeze(data.entries),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }
  return { entries: Object.freeze([]), updatedAt: new Date().toISOString() };
}

export function saveWatchlist(data: WatchlistData): void {
  const dir = configDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(watchlistPath(), JSON.stringify(data, null, 2), "utf-8");
}
