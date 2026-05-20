import { execFile } from "node:child_process";
import { statSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { patterns } from "./regex-patterns";
import type { MediaInfo, MediaType, FileTypeFilter } from "./types";

// ---------------------------------------------------------------------------
// async spawn
// ---------------------------------------------------------------------------

/** runs a child process asynchronously and collects stdout/stderr */
export function spawnAsync(
  cmd: string,
  args: readonly string[],
  timeout: number,
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        status: error ? Number((error as NodeJS.ErrnoException).code) || 1 : 0,
        stdout: stdout || "",
        stderr: stderr || "",
      });
    });
  });
}

// ---------------------------------------------------------------------------
// file size formatting
// ---------------------------------------------------------------------------

/** formats a byte count into a human-readable size string */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** i;

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** formats the percentage change between two sizes (negative = reduction) */
export function formatSizeChange(original: number, new_: number): string {
  const diff = new_ - original;
  const pct = (diff / original) * 100;
  const sign = pct <= 0 ? "" : "+";
  return `${sign}${pct.toFixed(1)}% (${formatFileSize(original)} → ${formatFileSize(new_)})`;
}

// ---------------------------------------------------------------------------
// media type detection
// ---------------------------------------------------------------------------

/** determines whether a file is an image or video based on its extension */
function getMediaType(filepath: string): MediaType | undefined {
  if (patterns.imageExtension.test(filepath)) return "image";
  if (patterns.videoExtension.test(filepath)) return "video";
  return undefined;
}

/** checks if a file has a supported media extension */
function isMediaFile(filepath: string): boolean {
  return patterns.mediaExtension.test(filepath);
}

// ---------------------------------------------------------------------------
// file discovery
// ---------------------------------------------------------------------------

/** scans a directory (non-recursive) for media files */
function scanDirectory(dir: string): readonly MediaInfo[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    return Object.freeze(
      entries
        .filter((d) => d.isFile() && isMediaFile(d.name))
        .map((d) => {
          const fullPath = join(dir, d.name);
          return quickFileInfo(fullPath);
        })
        .filter((info): info is MediaInfo => info !== undefined),
    );
  } catch {
    return Object.freeze([]);
  }
}

// ---------------------------------------------------------------------------
// file info
// ---------------------------------------------------------------------------

/** gets basic file info (size, name, type) without ffprobe */
export function quickFileInfo(filepath: string): MediaInfo | undefined {
  const type = getMediaType(filepath);
  if (!type) return undefined;

  try {
    const stat = statSync(filepath);
    return {
      path: filepath,
      name: filepath.split("/").pop() ?? filepath,
      size: stat.size,
      type,
      width: undefined,
      height: undefined,
      duration: undefined,
      codec: undefined,
      bitrate: undefined,
    };
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// ffprobe metadata
// ---------------------------------------------------------------------------

type FfprobeStream = {
  readonly codec_type?: string;
  readonly codec_name?: string;
  readonly width?: number;
  readonly height?: number;
  readonly duration?: string;
  readonly bit_rate?: string;
};

type FfprobeFormat = {
  readonly duration?: string;
  readonly bit_rate?: string;
};

type FfprobeOutput = {
  readonly streams?: readonly FfprobeStream[];
  readonly format?: FfprobeFormat;
};

/** extracts detailed metadata from a media file using ffprobe (async) */
export async function probeFile(filepath: string): Promise<MediaInfo | undefined> {
  const base = quickFileInfo(filepath);
  if (!base) return undefined;

  try {
    const result = await spawnAsync("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filepath,
    ], 15_000);

    if (result.status !== 0 || !result.stdout) return base;

    const data: FfprobeOutput = JSON.parse(result.stdout);
    const videoStream = data.streams?.find((s) => s.codec_type === "video");
    const audioStream = data.streams?.find((s) => s.codec_type === "audio");
    const duration = parseFloat(data.format?.duration ?? "0");
    const bitrate = parseInt(data.format?.bit_rate ?? "0", 10);

    return {
      ...base,
      width: videoStream?.width,
      height: videoStream?.height,
      duration: Number.isFinite(duration) && duration > 0 ? duration : undefined,
      codec: videoStream?.codec_name ?? audioStream?.codec_name,
      bitrate: Number.isFinite(bitrate) && bitrate > 0 ? bitrate : undefined,
    };
  } catch {
    return base;
  }
}

// ---------------------------------------------------------------------------
// file search
// ---------------------------------------------------------------------------

/**
 * searches for media files in a set of directories.
 * returns all files when query is empty, filtered results otherwise.
 */
export function searchFiles(
  query: string,
  dirs: readonly string[],
  filter: FileTypeFilter,
): readonly MediaInfo[] {
  const q = query.toLowerCase().trim();

  const results: MediaInfo[] = [];

  for (const dir of dirs) {
    try {
      const scanned = scanDirectory(dir);
      for (const info of scanned) {
        if (filter !== "all" && info.type !== filter) continue;
        if (q && !info.name.toLowerCase().includes(q)) continue;
        results.push(info);
      }
    } catch {
      // skip inaccessible dirs
    }
    if (results.length >= 50) break;
  }

  return Object.freeze(results);
}

/** returns a label describing media dimensions or duration */
export function mediaLabel(info: MediaInfo): string {
  const parts: string[] = [];

  if (info.width !== undefined && info.height !== undefined) {
    parts.push(`${info.width}×${info.height}`);
  }
  if (info.duration !== undefined) {
    const mins = Math.floor(info.duration / 60);
    const secs = Math.floor(info.duration % 60);
    parts.push(`${mins}:${String(secs).padStart(2, "0")}`);
  }

  return parts.join(" · ");
}

/** returns the file extension without the dot */
export function fileExtension(filepath: string): string {
  return extname(filepath).slice(1).toLowerCase();
}

/** generates an output path with a suffix before the extension */
export function outputPath(filepath: string, suffix: string): string {
  const dot = filepath.lastIndexOf(".");
  if (dot === -1) return `${filepath}_${suffix}`;
  return `${filepath.slice(0, dot)}_${suffix}${filepath.slice(dot)}`;
}
