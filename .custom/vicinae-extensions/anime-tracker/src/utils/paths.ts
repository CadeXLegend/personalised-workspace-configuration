import path from "node:path";
import type { WatchStatus } from "../status";

// ---------------------------------------------------------------------------
// Filesystem path resolution for cached assets and config
// ---------------------------------------------------------------------------

function getHome(): string {
  return process.env.HOME ?? process.env.USERPROFILE ?? "";
}

export function configDir(): string {
  return path.join(getHome(), ".custom", "configs", "anime-tracker");
}

export function watchlistPath(): string {
  return path.join(configDir(), "anime-watchlist-tracker.json");
}

export function coversDir(): string {
  return path.join(configDir(), "covers");
}

export function overlaysDir(): string {
  return path.join(configDir(), "overlays");
}

export function compositedDir(): string {
  return path.join(configDir(), "composited");
}

export function coverPath(anilistId: number): string {
  return path.join(coversDir(), `${anilistId}.jpg`);
}

export function overlayPath(status: WatchStatus): string {
  return path.join(overlaysDir(), `status_${status}.png`);
}

export function compositePathFor(anilistId: number, status: WatchStatus): string {
  return path.join(compositedDir(), `${anilistId}_${status}.jpg`);
}
