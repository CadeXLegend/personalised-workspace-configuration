import https from "node:https";
import type { AniListMedia, AniListResult } from "../types";

// ---------------------------------------------------------------------------
// AniList GraphQL API — search anime by title (async, non-blocking)
// ---------------------------------------------------------------------------

const ANILIST_API_URL = "https://graphql.anilist.co" as const;

export async function searchAniList(query: string): Promise<AniListResult> {
  const graphql = JSON.stringify({
    query: `
      query ($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            coverImage { large extraLarge }
            episodes
            averageScore
            genres
            status
          }
        }
      }
    `,
    variables: { search: query },
  });

  const body = await httpsPost(
    ANILIST_API_URL,
    graphql,
    "application/json",
  );

  if (!body) {
    return { ok: false, error: "Search failed" };
  }

  try {
    const parsed = JSON.parse(body);
    const media = (parsed as { data?: { Page?: { media?: AniListMedia[] } } })
      .data?.Page?.media;
    if (!media || media.length === 0) return { ok: false, error: "No results found" };
    return { ok: true, results: media };
  } catch {
    return { ok: false, error: "Failed to parse API response" };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function httpsPost(
  url: string,
  body: string,
  contentType: string,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "Accept": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "vicinae-anime-tracker/1.0",
        },
        timeout: 10_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          resolve(
            res.statusCode === 200
              ? Buffer.concat(chunks).toString("utf-8")
              : undefined,
          );
        });
        res.on("error", () => resolve(undefined));
      },
    );
    req.on("error", () => resolve(undefined));
    req.on("timeout", () => { req.destroy(); resolve(undefined); });
    req.write(body);
    req.end();
  });
}
