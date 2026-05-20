import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  showToast,
  Toast,
  Cache,
  FileSearch,
} from "@vicinae/api";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { homedir } from "node:os";
import { join } from "node:path";
import { patterns } from "./regex-patterns";
import type { MediaInfo, FileTypeFilter } from "./types";
import {
  searchFiles,
  probeFile,
  formatFileSize,
  formatSizeChange,
  mediaLabel,
  quickFileInfo,
} from "./utils";
import {
  operationsFor,
  executeOperation,
  operationDetail,
} from "./operations";

// ---------------------------------------------------------------------------
// app mode state machine
// ---------------------------------------------------------------------------

type AppMode = "browse" | "operate";

// ---------------------------------------------------------------------------
// cache for recently used files
// ---------------------------------------------------------------------------

const cache = new Cache({ namespace: "ffmpeg-tool-recents" });
const RECENT_KEY = "recent-files" as const;

function loadRecents(): readonly string[] {
  const raw = cache.get(RECENT_KEY);
  if (!raw) return Object.freeze([]);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((p): p is string => typeof p === "string")) {
      return Object.freeze(parsed);
    }
    return Object.freeze([]);
  } catch {
    return Object.freeze([]);
  }
}

function saveRecents(paths: readonly string[]): void {
  cache.set(RECENT_KEY, JSON.stringify(paths.slice(0, 10)));
}

function addRecent(path: string): readonly string[] {
  const prev = loadRecents();
  const next = [path, ...prev.filter((p) => p !== path)];
  saveRecents(next);
  return Object.freeze(next);
}

// ---------------------------------------------------------------------------
// default search directories
// ---------------------------------------------------------------------------

const SEARCH_DIRS = Object.freeze([
  join(homedir(), "Pictures"),
  join(homedir(), "Videos"),
  join(homedir(), "Downloads"),
  join(homedir(), "Desktop"),
]);

// ---------------------------------------------------------------------------
// icons for media types
// ---------------------------------------------------------------------------

function fileIcon(type: "image" | "video"): Icon {
  return type === "image" ? Icon.Image : Icon.Video;
}

/** checks if a path matches the current type filter */
function matchesFilter(path: string, filter: FileTypeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "image") return patterns.imageExtension.test(path);
  return patterns.videoExtension.test(path);
}

// ---------------------------------------------------------------------------
// command
// ---------------------------------------------------------------------------

export default function FfmpegToolCommand() {
  // ── mode state ────────────────────────────────────────────────────
  const [mode, setMode] = useState<AppMode>("browse");
  const [searchText, setSearchText] = useState("");
  const [fileFilter, setFileFilter] = useState<FileTypeFilter>("all");
  const [selectedFile, setSelectedFile] = useState<MediaInfo | undefined>(undefined);
  const [selectedFileProbed, setSelectedFileProbed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<readonly MediaInfo[]>(Object.freeze([]));
  const [recents, setRecents] = useState<readonly MediaInfo[]>(Object.freeze([]));
  const justSwitchedRef = useRef(false);

  // ── load recents on mount ────────────────────────────────────────
  useEffect(() => {
    const recentPaths = loadRecents();
    const recentInfos = recentPaths
      .map(quickFileInfo)
      .filter((info): info is MediaInfo => info !== undefined);
    setRecents(Object.freeze(recentInfos));
  }, []);

  // ── async search triggered by typing ─────────────────────────────
  useEffect(() => {
    if (mode !== "browse") return;

    const trimmed = searchText.trim();
    if (!trimmed) {
      setSearchResults(Object.freeze([]));
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void (async () => {
      // use vicinae's built-in file search (indexed, fast)
      const indexedResults: MediaInfo[] = [];
      try {
        const fsResults = await FileSearch.search(trimmed);
        for (const f of fsResults) {
          if (matchesFilter(f.path, fileFilter)) {
            const info = quickFileInfo(f.path);
            if (info) indexedResults.push(info);
          }
        }
      } catch {
        // FileSearch may not be available or may throw
      }

      // also scan common media directories
      const scannedResults = searchFiles(trimmed, SEARCH_DIRS, fileFilter);

      if (cancelled) return;

      // deduplicate by path, prefer indexed results
      const seen = new Set(indexedResults.map((r) => r.path));
      const combined = [
        ...indexedResults,
        ...scannedResults.filter((r) => !seen.has(r.path)),
      ];

      setIsLoading(false);
      setSearchResults(Object.freeze(combined.slice(0, 50)));
    })();

    return () => { cancelled = true; };
  }, [searchText, fileFilter, mode]);

  // ── probe selected file ──────────────────────────────────────────
  const selectFile = useCallback(async (file: MediaInfo) => {
    setSelectedFile(file);
    setMode("operate");
    setSelectedFileProbed(false);
    setSearchText("");
    addRecent(file.path);

    const probed = await probeFile(file.path);
    if (probed) {
      setSelectedFile(probed);
    }
    setSelectedFileProbed(true);
  }, []);

  // ── back to browse ───────────────────────────────────────────────
  const backToBrowse = useCallback(() => {
    justSwitchedRef.current = true;
    setMode("browse");
    setSelectedFile(undefined);
    setSearchText("");
  }, []);

  // ── run operation ────────────────────────────────────────────────
  const runOperation = useCallback(async (
    operationId: Parameters<typeof executeOperation>[1],
    overwrite: boolean,
  ) => {
    if (!selectedFile) return;

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Running ffmpeg...",
      message: selectedFile.name,
    });

    const result = await executeOperation(selectedFile.path, operationId, overwrite);

    if (result.ok) {
      const changeStr = formatSizeChange(result.originalSize, result.newSize);
      toast.style = Toast.Style.Success;
      toast.title = "Operation complete";
      toast.message = changeStr;
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = "Operation failed";
      toast.message = result.error;
    }
  }, [selectedFile]);

  // ── search handling ──────────────────────────────────────────────
  const handleSearchChange = useCallback((text: string) => {
    if (justSwitchedRef.current) {
      justSwitchedRef.current = false;
      return;
    }
    if (mode === "operate" && text === "") {
      backToBrowse();
      return;
    }
    setSearchText(text);
  }, [mode, backToBrowse]);

  // ── recents filtered by type ─────────────────────────────────────
  const filteredRecents = useMemo(() => {
    if (mode !== "browse") return Object.freeze([]);
    if (searchText.trim()) return Object.freeze([]);

    return Object.freeze(
      recents.filter((info) =>
        fileFilter === "all" || info.type === fileFilter,
      ),
    );
  }, [mode, searchText, fileFilter, recents]);

  // ── empty view ───────────────────────────────────────────────────
  const emptyView = useMemo(() => {
    if (mode !== "browse") return undefined;
    if (isLoading) return undefined;

    const hasQuery = searchText.trim().length > 0;

    return (
      <List.EmptyView
        title={hasQuery ? "No media files found" : "Search for media files"}
        description={hasQuery ? "Try a different search term" : "Type a filename to find images and videos"}
        icon={hasQuery ? Icon.Exclamationmark : Icon.MagnifyingGlass}
      />
    );
  }, [mode, isLoading, searchText]);

  // ── render: operate mode ─────────────────────────────────────────
  if (mode === "operate" && selectedFile) {
    const ops = operationsFor(selectedFile.type);
    const info = selectedFile;
    const dimLabel = mediaLabel(info);

    return (
      <List
        searchBarPlaceholder="Filter operations..."
        isLoading={!selectedFileProbed}
        filtering
        searchText={searchText}
        onSearchTextChange={handleSearchChange}
        isShowingDetail
        navigationTitle={`FFmpeg Tool — ${info.name}`}
      >
        <List.Section title="Selected File">
          <List.Item
            id="file-info"
            title={info.name}
            subtitle={`${formatFileSize(info.size)}${dimLabel ? ` · ${dimLabel}` : ""}`}
            icon={fileIcon(info.type)}
            accessories={[
              {
                tag: {
                  value: info.type.charAt(0).toUpperCase() + info.type.slice(1),
                  color: info.type === "image" ? Color.Blue : Color.Purple,
                },
              },
            ]}
            detail={
              <List.Item.Detail
                markdown={[
                  `## ${info.name}`,
                  "",
                  `**Path:** \`${info.path}\``,
                  `**Size:** ${formatFileSize(info.size)}`,
                  `**Type:** ${info.type}`,
                  ...(info.width !== undefined
                    ? [`**Dimensions:** ${info.width}×${info.height}`]
                    : []),
                  ...(info.duration !== undefined
                    ? [`**Duration:** ${Math.floor(info.duration / 60)}m ${Math.floor(info.duration % 60)}s`]
                    : []),
                  ...(info.codec !== undefined
                    ? [`**Codec:** ${info.codec}`]
                    : []),
                  ...(info.bitrate !== undefined
                    ? [`**Bitrate:** ${Math.round(info.bitrate / 1000)} kbps`]
                    : []),
                ].join("\n")}
              />
            }
          />
        </List.Section>

        <List.Section title={`Operations (${ops.length})`}>
          {ops.map((op) => {
            const detail = operationDetail(op, info.name);
            return (
              <List.Item
                key={op.id}
                id={op.id}
                title={op.label}
                subtitle={op.description}
                icon={Icon.Wand}
                keywords={[op.id]}
                detail={<List.Item.Detail markdown={detail} />}
                actions={
                  <ActionPanel>
                    <Action
                      title={`Run: ${op.label}`}
                      icon={Icon.Play}
                      onAction={() => { void runOperation(op.id, false); }}
                    />
                    <Action
                      title={`Run: ${op.label} (Overwrite)`}
                      icon={Icon.SaveDocument}
                      shortcut={{ key: "o", modifiers: ["shift"] }}
                      onAction={() => { void runOperation(op.id, true); }}
                    />
                    <Action
                      title="Back to File Select"
                      icon={Icon.ArrowLeft}
                      shortcut={{ key: "escape", modifiers: ["shift"] }}
                      onAction={backToBrowse}
                    />
                    <Action.ShowInFinder
                      title="Show Original in Finder"
                      path={info.path}
                      icon={Icon.Folder}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
          <List.Item
            key="back-action"
            id="back-action"
            title="← Back to File Select"
            icon={Icon.ArrowLeft}
            actions={
              <ActionPanel>
                <Action
                  title="Back to File Select"
                  icon={Icon.ArrowLeft}
                  shortcut={{ key: "escape", modifiers: ["shift"] }}
                  onAction={backToBrowse}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      </List>
    );
  }

  // ── render: browse mode ──────────────────────────────────────────
  return (
    <List
      searchBarPlaceholder="Search media files..."
      isLoading={isLoading}
      filtering={false}
      throttle
      searchText={searchText}
      onSearchTextChange={handleSearchChange}
      navigationTitle="FFmpeg Tool"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by type"
          value={fileFilter}
          onChange={(v) => setFileFilter(v as FileTypeFilter)}
        >
          <List.Dropdown.Item title="All Files" value="all" />
          <List.Dropdown.Item title="Images" value="image" icon={Icon.Image} />
          <List.Dropdown.Item title="Videos" value="video" icon={Icon.Video} />
        </List.Dropdown>
      }
    >
      {emptyView}

      {filteredRecents.length > 0 && (
        <List.Section title="Recent">
          {filteredRecents.map((info) => (
            <List.Item
              key={`recent-${info.path}`}
              id={`recent-${info.path}`}
              title={info.name}
              subtitle={`${formatFileSize(info.size)}${mediaLabel(info) ? ` · ${mediaLabel(info)}` : ""}`}
              icon={fileIcon(info.type)}
              keywords={[info.path]}
              accessories={[
                {
                  tag: {
                    value: info.type.charAt(0).toUpperCase() + info.type.slice(1),
                    color: info.type === "image" ? Color.Blue : Color.Purple,
                  },
                },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Select File"
                    icon={Icon.ArrowRight}
                    onAction={() => { void selectFile(info); }}
                  />
                  <Action.ShowInFinder
                    title="Show in Finder"
                    path={info.path}
                    icon={Icon.Folder}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {searchResults.length > 0 && (
        <List.Section title={`Results (${searchResults.length})`}>
          {searchResults.map((info) => (
            <List.Item
              key={info.path}
              id={info.path}
              title={info.name}
              subtitle={`${formatFileSize(info.size)}${mediaLabel(info) ? ` · ${mediaLabel(info)}` : ""}`}
              icon={fileIcon(info.type)}
              keywords={[info.path, info.type]}
              accessories={[
                {
                  tag: {
                    value: info.type.charAt(0).toUpperCase() + info.type.slice(1),
                    color: info.type === "image" ? Color.Blue : Color.Purple,
                  },
                },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Select File"
                    icon={Icon.ArrowRight}
                    onAction={() => { void selectFile(info); }}
                  />
                  <Action.ShowInFinder
                    title="Show in Finder"
                    path={info.path}
                    icon={Icon.Folder}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
