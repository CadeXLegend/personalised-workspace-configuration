import type { AniListMedia } from "../types";
import { STATUS_ORDER, type WatchStatus } from "../status";
import { patterns } from "../regex-patterns";

// ---------------------------------------------------------------------------
// Display helpers — formatting, parsing, and UI utility functions
// ---------------------------------------------------------------------------

/** Returns the English title if available, otherwise the romaji title */
export function displayTitle(media: AniListMedia): string {
  return media.title.english ?? media.title.romaji;
}

/** Formats episode progress as "Ep 5/12" or "Ep 5/?" */
export function formatEpisodes(current: number, total: number | null): string {
  return total ? `Ep ${current}/${total}` : `Ep ${current}/?`;
}

/** Extracts season number from a title (e.g. "Season 2" → 2, "2nd Season" → 2) */
export function parseSeasonNumber(title: string): number | undefined {
  const labelMatch = title.match(patterns.seasonLabel);
  if (labelMatch?.[1]) return Number(labelMatch[1]);
  const ordinalMatch = title.match(patterns.ordinalSeason);
  if (ordinalMatch?.[1]) return Number(ordinalMatch[1]);
  return undefined;
}

/** Returns the next status in the rotation order */
export function nextStatus(current: WatchStatus): WatchStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] ?? "watching";
}
