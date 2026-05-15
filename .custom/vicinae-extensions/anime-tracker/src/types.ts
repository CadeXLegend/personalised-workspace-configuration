import type { WatchStatus } from "./status";

// ---------------------------------------------------------------------------
// Shared types for the anime tracker extension
// ---------------------------------------------------------------------------

export type WatchlistEntry = {
  readonly anilistId: number;
  readonly title: string;
  readonly titleRomaji: string;
  readonly imageUrl: string;
  readonly imageUrlLarge?: string;
  readonly totalEpisodes: number | null;
  readonly currentEpisode: number;
  readonly score: number | null;
  readonly status: WatchStatus;
  readonly genres: readonly string[];
  readonly addedAt: string;
}

export type WatchlistData = {
  readonly entries: readonly WatchlistEntry[];
  readonly updatedAt: string;
}

export type AniListMedia = {
  readonly id: number;
  readonly title: {
    readonly romaji: string;
    readonly english: string | null;
  };
  readonly coverImage: {
    readonly large: string;
    readonly extraLarge: string;
  };
  readonly episodes: number | null;
  readonly averageScore: number | null;
  readonly genres: readonly string[];
  readonly status: string;
}

export type AniListResult =
  | { readonly ok: true; readonly results: readonly AniListMedia[] }
  | { readonly ok: false; readonly error: string };

export type Mode = "browse" | "search";
