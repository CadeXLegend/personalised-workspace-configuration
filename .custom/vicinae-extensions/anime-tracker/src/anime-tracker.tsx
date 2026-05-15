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
import type { WatchlistData, AniListMedia, WatchStatus, WatchlistEntry } from "./types";
import { loadWatchlist, saveWatchlist } from "./data/watchlist";
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

  const justSwitchedRef = useRef(false);

  // ── Effects ────────────────────────────────────────────────────────

  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

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
          icon={searchError ? Icon.ExclamationMark : Icon.MagnifyingGlass}
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
    return (
      <Grid
        searchBarPlaceholder={placeholder}
        isLoading={isLoading}
        throttle
        filtering
        searchText={searchText}
        onSearchTextChange={handleSearchChange}
        navigationTitle="Anime Tracker"
        columns={4}
        aspectRatio="2/3"
        fit={Grid.Fit.Fill}
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
          watchlist={watchlist}
          onIncrement={incrementEpisode}
          onDecrement={decrementEpisode}
          onCycleStatus={cycleStatus}
          onRemove={removeEntry}
          onAdd={enterSearchMode}
          onInspect={enterInspectMode}
          onWatch={watchOnAnikoTV}
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

