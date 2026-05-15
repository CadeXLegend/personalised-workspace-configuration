import { Action, ActionPanel, Grid, Icon } from "@vicinae/api";
import { STATUS_LABELS } from "../status";
import type { WatchlistEntry, WatchlistData } from "../types";
import { formatEpisodes, nextStatus, parseSeasonNumber } from "../utils/display";
import { getDisplayImage } from "../utils/images";

// ---------------------------------------------------------------------------
// Browse view — grid of watchlist covers with badges
// ---------------------------------------------------------------------------

type BrowseViewProps = {
  readonly watchlist: WatchlistData;
  readonly onIncrement: (anilistId: number) => void;
  readonly onDecrement: (anilistId: number) => void;
  readonly onCycleStatus: (anilistId: number) => void;
  readonly onRemove: (anilistId: number) => void;
  readonly onAdd: () => void;
  readonly onInspect: (anilistId: number) => void;
  readonly onWatch: (entry: WatchlistEntry) => void;
  readonly onCycleSort: () => void;
  readonly sortLabel: string;
};

export function BrowseView({
  watchlist,
  onIncrement,
  onDecrement,
  onCycleStatus,
  onRemove,
  onAdd,
  onInspect,
  onWatch,
  onCycleSort,
  sortLabel,
}: BrowseViewProps) {
  if (watchlist.entries.length === 0) return null;

  return (
    <Grid.Section title={`Watchlist (${watchlist.entries.length})`}>
      {watchlist.entries.map((entry) => (
        <Grid.Item
          key={String(entry.anilistId)}
          id={String(entry.anilistId)}
          content={getDisplayImage(
            entry.anilistId,
            entry.status,
            entry.imageUrl,
          )}
          title={entry.title}
          subtitle={buildSubtitle(entry)}
          keywords={[
            entry.titleRomaji,
            ...entry.genres,
            STATUS_LABELS[entry.status],
          ]}
          actions={
            <ActionPanel>
              <Action
                title={`Sort: ${sortLabel}`}
                icon={Icon.Switch}
                shortcut={{ key: "o", modifiers: ["ctrl"] }}
                onAction={onCycleSort}
              />
              <Action
                title="Inspect"
                icon={Icon.Eye}
                shortcut={{ key: "enter", modifiers: [] }}
                onAction={() => onInspect(entry.anilistId)}
              />
              <Action
                title="Watch on AnikoTV"
                icon={Icon.Play}
                shortcut={{ key: "o", modifiers: ["shift"] }}
                onAction={() => onWatch(entry)}
              />
              <Action
                title="+1 Episode"
                icon={Icon.Plus}
                shortcut={{ key: "}", modifiers: ["shift"] }}
                onAction={() => onIncrement(entry.anilistId)}
              />
              <Action
                title="-1 Episode"
                icon={Icon.Minus}
                shortcut={{ key: "{", modifiers: ["shift"] }}
                onAction={() => onDecrement(entry.anilistId)}
              />
              <Action
                title={`Status: ${STATUS_LABELS[nextStatus(entry.status)]}`}
                icon={Icon.Switch}
                shortcut={{ key: "s", modifiers: ["shift"] }}
                onAction={() => onCycleStatus(entry.anilistId)}
              />
              <Action
                title="Remove"
                icon={Icon.Trash}
                shortcut={{ key: "backspace", modifiers: ["shift"] }}
                onAction={() => onRemove(entry.anilistId)}
              />
              <Action
                title="Add Anime"
                icon={Icon.Plus}
                shortcut={{ key: "n", modifiers: ["shift"] }}
                onAction={onAdd}
              />
            </ActionPanel>
          }
        />
      ))}
    </Grid.Section>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSubtitle(entry: WatchlistEntry): string {
  const season = parseSeasonNumber(entry.title);

  return [
    formatEpisodes(entry.currentEpisode, entry.totalEpisodes),
    entry.score !== null ? `${entry.score}%` : undefined,
    season !== undefined ? `S${season}` : undefined,
    STATUS_LABELS[entry.status],
  ]
    .filter(Boolean)
    .join(" \u00B7 ");
}
