import { Action, ActionPanel, Color, Icon, List } from "@vicinae/api";
import type { AniListMedia, WatchlistEntry } from "../types";
import { displayTitle, parseSeasonNumber } from "../utils/display";

// ---------------------------------------------------------------------------
// Search view — AniList results in a List with detail pane (Pokédex-style)
// ---------------------------------------------------------------------------

type SearchViewProps = {
  readonly results: readonly AniListMedia[];
  readonly watchlistEntries: readonly WatchlistEntry[];
  readonly onAdd: (media: AniListMedia) => void;
  readonly onExit: () => void;
}

export function SearchView({
  results,
  watchlistEntries,
  onAdd,
  onExit,
}: SearchViewProps) {
  if (results.length === 0) return null;

  return (
    <List.Section title={`Results (${results.length})`}>
      {results.map((media) => {
        const title = displayTitle(media);
        const alreadyAdded = watchlistEntries.some(
          (e) => e.anilistId === media.id,
        );
        const season = parseSeasonNumber(title);

        return (
          <List.Item
            key={String(media.id)}
            id={String(media.id)}
            title={title}
            subtitle={[
              media.title.romaji !== title
                ? media.title.romaji
                : undefined,
              season !== undefined ? `S${season}` : undefined,
            ]
              .filter(Boolean)
              .join(" \u00B7 ")}
            icon={alreadyAdded ? Icon.CheckCircle : Icon.Plus}
            keywords={[media.title.romaji, ...media.genres]}
            accessories={[
              ...(media.averageScore !== null
                ? [
                    {
                      tag: {
                        value: `${media.averageScore}%`,
                        color: scoreColor(media.averageScore),
                      },
                      tooltip: "AniList score",
                    } as const,
                  ]
                : []),
              ...(media.episodes !== null
                ? [{ text: `${media.episodes} eps` } as const]
                : []),
              ...(alreadyAdded
                ? [
                    {
                      icon: Icon.CheckCircle,
                      tooltip: "Already in watchlist",
                    } as const,
                  ]
                : []),
            ]}
            detail={
              <List.Item.Detail
                markdown={buildDetailMarkdown(media, title, season)}
              />
            }
            actions={
              <ActionPanel>
                {!alreadyAdded && (
                  <Action
                    title="Add to Watchlist"
                    icon={Icon.Plus}
                    shortcut={{ key: "enter", modifiers: [] }}
                    onAction={() => onAdd(media)}
                  />
                )}
                {alreadyAdded && (
                  <Action
                    title="Already in Watchlist"
                    icon={Icon.CheckCircle}
                    onAction={onExit}
                  />
                )}
                <Action.OpenInBrowser
                  title="Open on AniList"
                  url={`https://anilist.co/anime/${media.id}`}
                  icon={Icon.Globe}
                />
                <Action
                  title="Back to Watchlist"
                  icon={Icon.ArrowLeft}
                  shortcut={{ key: "escape", modifiers: [] }}
                  onAction={onExit}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List.Section>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): Color {
  if (score >= 80) return Color.Green;
  if (score >= 60) return Color.Yellow;
  if (score >= 40) return Color.Orange;
  return Color.Red;
}

function buildDetailMarkdown(
  media: AniListMedia,
  title: string,
  season: number | undefined,
): string {
  return [
    `![Cover](${media.coverImage.large})`,
    "",
    `## ${title}`,
    `*${media.title.romaji}*`,
    "",
    `**Episodes:** ${media.episodes ?? "Unknown"}`,
    `**Score:** ${media.averageScore ? `${media.averageScore}%` : "N/A"}`,
    `**Status:** ${media.status.replace(/_/g, " ")}`,
    `**Genres:** ${media.genres.join(", ")}`,
    season !== undefined ? `**Season:** S${season}` : undefined,
    "",
    `[View on AniList](https://anilist.co/anime/${media.id})`,
  ]
    .filter(Boolean)
    .join("\n");
}
