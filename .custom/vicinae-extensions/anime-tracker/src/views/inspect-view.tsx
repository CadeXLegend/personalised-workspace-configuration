import { Action, ActionPanel, Color, Detail, Icon } from "@vicinae/api";
import { STATUS_LABELS } from "../status";
import type { WatchlistEntry } from "../types";
import { formatEpisodes, nextStatus, parseSeasonNumber } from "../utils/display";

// ---------------------------------------------------------------------------
// Inspect view — full-detail Pokédex-style with markdown left, metadata right
// ---------------------------------------------------------------------------

type InspectViewProps = {
  readonly entry: WatchlistEntry;
  readonly onBack: () => void;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly onCycleStatus: () => void;
  readonly onRemove: () => void;
};

export function InspectView({
  entry,
  onBack,
  onIncrement,
  onDecrement,
  onCycleStatus,
  onRemove,
}: InspectViewProps) {
  const season = parseSeasonNumber(entry.title);

  return (
    <Detail
      navigationTitle={entry.title}
      markdown={[
        `![](${entry.imageUrlLarge ?? entry.imageUrl})`,
        "",
        `### ${entry.title}`,
        `*${entry.titleRomaji}*`,
      ].join("\n")}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Episodes"
            text={formatEpisodes(entry.currentEpisode, entry.totalEpisodes)}
          />
          <Detail.Metadata.Separator />
          {entry.score !== null && (
            <>
              <Detail.Metadata.Label
                title="Score"
                text={{
                  value: `${entry.score}%`,
                  color: ratingColor(entry.score),
                }}
              />
              <Detail.Metadata.Separator />
            </>
          )}
          {season !== undefined && (
            <>
              <Detail.Metadata.Label title="Season" text={`S${season}`} />
              <Detail.Metadata.Separator />
            </>
          )}
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item
              color={statusColor(entry.status)}
              text={STATUS_LABELS[entry.status]}
            />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Separator />
          <Detail.Metadata.TagList title="Genres">
            {entry.genres.slice(0, 8).map((genre) => (
              <Detail.Metadata.TagList.Item
                key={genre}
                text={genre}
                color={Color.SecondaryText}
              />
            ))}
          </Detail.Metadata.TagList>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Added"
            text={new Date(entry.addedAt).toLocaleDateString()}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Link
            title="AniList"
            target={`https://anilist.co/anime/${entry.anilistId}`}
            text="View on AniList"
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title="+1 Episode"
            icon={Icon.Plus}
            shortcut={{ key: "=", modifiers: [] }}
            onAction={onIncrement}
          />
          <Action
            title="-1 Episode"
            icon={Icon.Minus}
            shortcut={{ key: "-", modifiers: [] }}
            onAction={onDecrement}
          />
          <Action
            title={`Status: ${STATUS_LABELS[nextStatus(entry.status)]}`}
            icon={Icon.Switch}
            shortcut={{ key: "s", modifiers: ["shift"] }}
            onAction={onCycleStatus}
          />
          <Action
            title="Remove"
            icon={Icon.Trash}
            shortcut={{ key: "backspace", modifiers: ["shift"] }}
            onAction={onRemove}
          />
          <Action.OpenInBrowser
            title="Open on AniList"
            url={`https://anilist.co/anime/${entry.anilistId}`}
            icon={Icon.Globe}
          />
          <Action
            title="Back to Watchlist"
            icon={Icon.ArrowLeft}
            shortcut={{ key: "tab", modifiers: [] }}
            onAction={onBack}
          />
        </ActionPanel>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: string): Color {
  if (status === "watching") return Color.Green;
  if (status === "completed") return Color.Blue;
  if (status === "on_hold") return Color.Yellow;
  if (status === "dropped") return Color.Red;
  return Color.Purple;
}

function ratingColor(score: number): Color {
  if (score >= 80) return Color.Green;
  if (score >= 60) return Color.Yellow;
  if (score >= 40) return Color.Orange;
  return Color.Red;
}
