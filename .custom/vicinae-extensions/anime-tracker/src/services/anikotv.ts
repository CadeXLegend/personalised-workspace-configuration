import { exec } from "node:child_process";
import { patterns } from "../regex-patterns";

// ---------------------------------------------------------------------------
// AnikoTV — search for an anime and construct the next-episode watch URL (async)
// ---------------------------------------------------------------------------

const SEARCH_URL = "https://anikototv.to/search" as const;

export function getNextEpisodeUrl(
  title: string,
  currentEpisode: number,
): Promise<string | undefined> {
  const url = `${SEARCH_URL}?keyword=${encodeURIComponent(title)}`;

  return curlGet(url).then((html) => {
    if (!html) return undefined;

    const match = patterns.anikotvWatchLink.exec(html);
    if (!match?.[1]) return undefined;

    const watchUrl = match[1];
    const nextEp = currentEpisode + 1;
    return watchUrl.replace(/\/ep-\d+$/, "") + `/ep-${nextEp}`;
  });
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function curlGet(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    exec(
      `curl -sS --max-time 10 -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' '${url.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024 },
      (error, stdout) => {
        resolve(error ? undefined : stdout);
      },
    );
  });
}
