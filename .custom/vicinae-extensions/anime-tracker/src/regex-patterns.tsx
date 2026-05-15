/** Regex patterns for the anime tracker extension */
export const patterns = {
  /**
   * Matches "Season N" style season markers in anime titles.
   * Capture group 1: the season number (e.g. "2" from "Season 2").
   * Case-insensitive.
   */
  seasonLabel: /Season\s+(\d+)/i,

  /**
   * Matches "Nth Season" / "Nst Season" / "Nrd Season" / "Nnd Season"
   * ordinal season markers. Capture group 1: the season number.
   * Case-insensitive.
   */
  ordinalSeason: /(\d+)(?:st|nd|rd|th)\s+Season/i,

  /**
   * Extracts the first watch page URL from anikototv.to search results.
   * Capture group 1: the full href value (e.g. "https://anikototv.to/watch/...").
   */
  anikotvWatchLink: /href="(https:\/\/anikototv\.to\/watch\/[^"]+)"/,
} as const;
