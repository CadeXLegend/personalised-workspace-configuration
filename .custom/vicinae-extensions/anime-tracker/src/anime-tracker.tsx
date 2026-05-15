import {
  Action,
  ActionPanel,
  Grid,
  Icon,
  List,
  showToast,
  Toast,
} from "@vicinae/api";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ViewMode } from "./view-mode";
import { STATUS_LABELS, STATUS_ORDER, type WatchStatus } from "./status";

type ViewFilter = WatchStatus | "all";

type SortOrder = "default" | "status:asc" | "status:desc" | "title:asc" | "title:desc";

const SORT_ORDERS: ReadonlyArray<{ readonly value: SortOrder; readonly label: string }> = Object.freeze([
  { value: "default", label: "Default" },
  { value: "status:asc", label: "Status ↑" },
  { value: "status:desc", label: "Status ↓" },
  { value: "title:asc", label: "Title ↑" },
  { value: "title:desc", label: "Title ↓" },
]);
import type { WatchlistData, AniListMedia, WatchlistEntry } from "./types";
import { loadWatchlist, saveWatchlist } from "./data/watchlist";
import { loadCustomisations, saveCustomisations } from "./data/customisations";
import { searchAniList } from "./services/anilist";
import { getNextEpisodeUrl } from "./services/anikotv";
import { displayTitle, nextStatus } from "./utils/display";
import {
  ensureOverlays,
  cacheCover,
  createComposite,
  cleanupEntry,
} from "./utils/images";
import { coverPath } from "./utils/paths";
import { BrowseView } from "./views/browse-view";
import { SearchView } from "./views/search-view";
import { InspectView } from "./views/inspect-view";

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default function AnimeTrackerCommand() {
  // ── Startup ────────────────────────────────────────────────────────
  const initializedRef = useRef(false);
  if (!initializedRef.current) {
    initializedRef.current = true;
    ensureOverlays();
  }

  // ── State ──────────────────────────────────────────────────────────

  const [mode, setMode] = useState<ViewMode>(ViewMode.Browse);
  const [watchlist, setWatchlist] = useState<WatchlistData>(() =>
    loadWatchlist(),
  );
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<readonly AniListMedia[]>(
    Object.freeze([]),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [inspectingId, setInspectingId] = useState<number | undefined>(
    undefined,
  );
  const [viewFilter, setViewFilter] = useState<ViewFilter>(
    () => loadCustomisations().viewFilter as ViewFilter,
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () => loadCustomisations().sortOrder as SortOrder,
  );

  const justSwitchedRef = useRef(false);

  // ── Effects ────────────────────────────────────────────────────────

  useEffect(() => {
    saveWatchlist(watchlist);
    saveCustomisations({ viewFilter, sortOrder });
  }, [watchlist, viewFilter, sortOrder]);

  useEffect(() => {
    for (const entry of watchlist.entries) {
      if (!existsSync(coverPath(entry.anilistId))) {
        cacheCover(entry.anilistId, entry.imageUrl);
      }
      createComposite(entry.anilistId, entry.status);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== ViewMode.Search) return;
    const trimmed = searchText.trim();
    if (!trimmed) {
      setSearchResults(Object.freeze([]));
      setSearchError(undefined);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setSearchError(undefined);
    void searchAniList(trimmed).then((result) => {
      if (cancelled) return;
      setIsLoading(false);
      if (result.ok) {
        setSearchResults(result.results);
      } else {
        setSearchResults(Object.freeze([]));
        setSearchError(result.error);
      }
    });
    return () => { cancelled = true; };
  }, [searchText, mode]);

  // ── Actions ────────────────────────────────────────────────────────

  const enterSearchMode = useCallback(() => {
    justSwitchedRef.current = true;
    setMode(ViewMode.Search);
    setSearchText("");
    setSearchResults(Object.freeze([]));
    setSearchError(undefined);
  }, []);

  const enterInspectMode = useCallback((anilistId: number) => {
    setInspectingId(anilistId);
    setMode(ViewMode.Inspect);
  }, []);

  const exitInspectMode = useCallback(() => {
    setInspectingId(undefined);
    setMode(ViewMode.Browse);
  }, []);

  const exitSearchMode = useCallback(() => {
    justSwitchedRef.current = true;
    setMode(ViewMode.Browse);
    setSearchText("");
    setSearchResults(Object.freeze([]));
    setSearchError(undefined);
  }, []);

  const addToWatchlist = useCallback(
    (media: AniListMedia) => {
      const exists = watchlist.entries.some((e) => e.anilistId === media.id);
      if (exists) {
        void showToast({
          style: Toast.Style.Failure,
          title: "Already in watchlist",
          message: displayTitle(media),
        });
        return;
      }

      const initialStatus: WatchStatus = "watching";
      cacheCover(media.id, media.coverImage.large);
      createComposite(media.id, initialStatus);

      const title = displayTitle(media);
      const entry = {
        anilistId: media.id,
        title,
        titleRomaji: media.title.romaji,
        imageUrl: media.coverImage.large,
        imageUrlLarge: media.coverImage.extraLarge,
        totalEpisodes: media.episodes,
        currentEpisode: 0,
        score: media.averageScore,
        status: initialStatus,
        genres: media.genres,
        addedAt: new Date().toISOString(),
      } as const;

      setWatchlist((prev) => ({
        entries: Object.freeze([...prev.entries, entry]),
        updatedAt: new Date().toISOString(),
      }));

      void showToast({
        style: Toast.Style.Success,
        title: "Added to watchlist",
        message: title,
      });

      exitSearchMode();
    },
    [watchlist, exitSearchMode],
  );

  const removeEntry = useCallback((anilistId: number) => {
    cleanupEntry(anilistId);
    setWatchlist((prev) => ({
      entries: Object.freeze(prev.entries.filter((e) => e.anilistId !== anilistId)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const incrementEpisode = useCallback((anilistId: number) => {
    setWatchlist((prev) => ({
      ...prev,
      entries: Object.freeze(
        prev.entries.map((e) =>
          e.anilistId === anilistId
            ? {
                ...e,
                currentEpisode:
                  e.totalEpisodes !== null
                    ? Math.min(e.currentEpisode + 1, e.totalEpisodes)
                    : e.currentEpisode + 1,
              }
            : e,
        ),
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const decrementEpisode = useCallback((anilistId: number) => {
    setWatchlist((prev) => ({
      ...prev,
      entries: Object.freeze(
        prev.entries.map((e) =>
          e.anilistId === anilistId
            ? { ...e, currentEpisode: Math.max(e.currentEpisode - 1, 0) }
            : e,
        ),
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const cycleStatus = useCallback((anilistId: number) => {
    setWatchlist((prev) => ({
      ...prev,
      entries: Object.freeze(
        prev.entries.map((e) => {
          if (e.anilistId !== anilistId) return e;
          const next = nextStatus(e.status);
          createComposite(anilistId, next);
          return { ...e, status: next };
        }),
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const watchOnAnikoTV = useCallback((entry: WatchlistEntry) => {
    void getNextEpisodeUrl(entry.title, entry.currentEpisode).then((url) => {
      if (!url) {
        void showToast({
          style: Toast.Style.Failure,
          title: "Not found on AnikoTV",
          message: entry.title,
        });
        return;
      }
      spawnSync("xdg-open", [url]);
    });
  }, []);

  const cycleSortOrder = useCallback(() => {
    setSortOrder((prev) => {
      const idx = SORT_ORDERS.findIndex((o) => o.value === prev);
      return SORT_ORDERS[(idx + 1) % SORT_ORDERS.length]?.value ?? "default";
    });
  }, []);

  // ── Search bar ─────────────────────────────────────────────────────

  const handleSearchChange = useCallback(
    (text: string) => {
      if (justSwitchedRef.current) {
        justSwitchedRef.current = false;
        return;
      }
      if (mode === ViewMode.Search && text === "") {
        exitSearchMode();
        return;
      }
      setSearchText(text);
    },
    [mode, exitSearchMode],
  );

  // ── Empty view ─────────────────────────────────────────────────────

  const EmptyView = mode === ViewMode.Browse ? Grid.EmptyView : List.EmptyView;

  const emptyView = useMemo(() => {
    if (mode === ViewMode.Search) {
      return (
        <EmptyView
          title={
            searchError
              ? "Search failed"
              : searchText.trim()
                ? "No results"
                : "Search AniList"
          }
          description={
            searchError ?? "Type an anime title to search and add to your watchlist"
          }
          icon={searchError ? Icon.Exclamationmark : Icon.MagnifyingGlass}
        />
      );
    }

    return (
      <EmptyView
        title="Your watchlist is empty"
        description="Press Enter to search and add anime"
        icon={Icon.Bookmark}
        actions={
          <ActionPanel>
            <Action
              title="Add Anime"
              icon={Icon.Plus}
              onAction={enterSearchMode}
            />
          </ActionPanel>
        }
      />
    );
  }, [mode, searchError, searchText, enterSearchMode, EmptyView]);

  // ── Render ─────────────────────────────────────────────────────────

  const placeholder =
    mode === ViewMode.Search
      ? "Search AniList (e.g. Frieren, Steins;Gate)..."
      : "Filter watchlist...";

  if (mode === ViewMode.Inspect) {
    const entry = watchlist.entries.find((e) => e.anilistId === inspectingId);
    if (!entry) {
      exitInspectMode();
      return null;
    }

    return (
      <InspectView
        entry={entry}
        onBack={exitInspectMode}
        onIncrement={() => incrementEpisode(entry.anilistId)}
        onDecrement={() => decrementEpisode(entry.anilistId)}
        onCycleStatus={() => cycleStatus(entry.anilistId)}
        onRemove={() => {
          removeEntry(entry.anilistId);
          exitInspectMode();
        }}
      />
    );
  }

  if (mode === ViewMode.Browse) {
    const filteredEntries =
      viewFilter === "all"
        ? watchlist.entries
        : watchlist.entries.filter((e) => e.status === viewFilter);

    const sortedEntries = sortEntries(filteredEntries, sortOrder);

    const filteredWatchlist = {
      entries: sortedEntries,
      updatedAt: watchlist.updatedAt,
    };

    return (
      <Grid
        searchBarPlaceholder={placeholder}
        isLoading={isLoading}
        filtering
        searchText={searchText}
        onSearchTextChange={handleSearchChange}
        navigationTitle="Anime Tracker"
        columns={4}
        aspectRatio="2/3"
        fit={Grid.Fit.Fill}
        searchBarAccessory={
          <Grid.Dropdown
            tooltip="Filter by status"
            value={viewFilter}
            onChange={(v) => setViewFilter(v as ViewFilter)}
          >
            <Grid.Dropdown.Item title="All" value="all" />
            <Grid.Dropdown.Section title="Status">
              {STATUS_ORDER.map((s) => (
                <Grid.Dropdown.Item
                  key={s}
                  title={STATUS_LABELS[s]}
                  value={s}
                />
              ))}
            </Grid.Dropdown.Section>
          </Grid.Dropdown>
        }
        actions={
          <ActionPanel>
            <Action
              title="Add Anime"
              icon={Icon.Plus}
              shortcut={{ key: "n", modifiers: ["shift"] }}
              onAction={enterSearchMode}
            />
          </ActionPanel>
        }
      >
        {emptyView}
        <BrowseView
          watchlist={filteredWatchlist}
          onIncrement={incrementEpisode}
          onDecrement={decrementEpisode}
          onCycleStatus={cycleStatus}
          onRemove={removeEntry}
          onAdd={enterSearchMode}
          onInspect={enterInspectMode}
          onWatch={watchOnAnikoTV}
          onCycleSort={cycleSortOrder}
          sortLabel={SORT_ORDERS.find((o) => o.value === sortOrder)?.label ?? "Default"}
        />
      </Grid>
    );
  }

  return (
    <List
      searchBarPlaceholder={placeholder}
      isLoading={isLoading}
      throttle
      filtering={false}
      searchText={searchText}
      onSearchTextChange={handleSearchChange}
      isShowingDetail={searchResults.length > 0}
      navigationTitle="Anime Tracker — Search"
    >
      {emptyView}
      <SearchView
        results={searchResults}
        watchlistEntries={watchlist.entries}
        onAdd={addToWatchlist}
        onExit={exitSearchMode}
      />
    </List>
  );
}

// ---------------------------------------------------------------------------
// Sort logic
// ---------------------------------------------------------------------------

function sortEntries(
  entries: ReadonlyArray<WatchlistEntry>,
  order: SortOrder,
): ReadonlyArray<WatchlistEntry> {
  if (order === "default") return entries;

  const sorted = [...entries];

  if (order === "status:asc") {
    sorted.sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    );
  } else if (order === "status:desc") {
    sorted.sort(
      (a, b) => STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status),
    );
  } else if (order === "title:asc") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (order === "title:desc") {
    sorted.sort((a, b) => b.title.localeCompare(a.title));
  }

  return Object.freeze(sorted);
}

