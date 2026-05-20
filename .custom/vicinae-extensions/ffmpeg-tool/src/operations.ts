import { spawnAsync, outputPath, fileExtension } from "./utils";
import type { Operation, OperationId, MediaType, OperationResult } from "./types";

// ---------------------------------------------------------------------------
// operation definitions
// ---------------------------------------------------------------------------

const OPERATIONS: ReadonlyArray<Operation> = Object.freeze([
  {
    id: "compress",
    label: "Compress",
    description: "Reduce file size while keeping the same format and dimensions",
    applicableTypes: Object.freeze(["image", "video"] as const),
  },
  {
    id: "resize-1080p",
    label: "Resize to 1080p",
    description: "Scale to 1920×1080, maintaining aspect ratio",
    applicableTypes: Object.freeze(["image", "video"] as const),
  },
  {
    id: "resize-720p",
    label: "Resize to 720p",
    description: "Scale to 1280×720, maintaining aspect ratio",
    applicableTypes: Object.freeze(["image", "video"] as const),
  },
  {
    id: "resize-480p",
    label: "Resize to 480p",
    description: "Scale to 854×480, maintaining aspect ratio",
    applicableTypes: Object.freeze(["image", "video"] as const),
  },
  {
    id: "convert-webp",
    label: "Convert to WebP",
    description: "Convert image to WebP format",
    applicableTypes: Object.freeze(["image"] as const),
  },
  {
    id: "convert-avif",
    label: "Convert to AVIF",
    description: "Convert image to AVIF format (best compression)",
    applicableTypes: Object.freeze(["image"] as const),
  },
  {
    id: "convert-jpg",
    label: "Convert to JPEG",
    description: "Convert image to JPEG format",
    applicableTypes: Object.freeze(["image"] as const),
  },
  {
    id: "convert-png",
    label: "Convert to PNG",
    description: "Convert image to PNG format (lossless)",
    applicableTypes: Object.freeze(["image"] as const),
  },
  {
    id: "convert-mp4",
    label: "Convert to MP4",
    description: "Convert video to MP4 (H.264 + AAC)",
    applicableTypes: Object.freeze(["video"] as const),
  },
  {
    id: "convert-webm",
    label: "Convert to WebM",
    description: "Convert video to WebM (VP9 + Opus)",
    applicableTypes: Object.freeze(["video"] as const),
  },
  {
    id: "rotate-90",
    label: "Rotate 90°",
    description: "Rotate clockwise by 90 degrees",
    applicableTypes: Object.freeze(["image"] as const),
  },
  {
    id: "rotate-180",
    label: "Rotate 180°",
    description: "Rotate by 180 degrees",
    applicableTypes: Object.freeze(["image"] as const),
  },
  {
    id: "rotate-270",
    label: "Rotate 270°",
    description: "Rotate clockwise by 270 degrees",
    applicableTypes: Object.freeze(["image"] as const),
  },
  {
    id: "extract-audio-mp3",
    label: "Extract Audio (MP3)",
    description: "Extract audio track as MP3",
    applicableTypes: Object.freeze(["video"] as const),
  },
  {
    id: "extract-audio-aac",
    label: "Extract Audio (AAC)",
    description: "Extract audio track as AAC",
    applicableTypes: Object.freeze(["video"] as const),
  },
  {
    id: "extract-audio-opus",
    label: "Extract Audio (Opus)",
    description: "Extract audio track as Opus",
    applicableTypes: Object.freeze(["video"] as const),
  },
]);

/** filters operations to those applicable for the given media type */
export function operationsFor(type: MediaType): ReadonlyArray<Operation> {
  return Object.freeze(
    OPERATIONS.filter((op) => op.applicableTypes.includes(type)),
  );
}

// ---------------------------------------------------------------------------
// resize targets
// ---------------------------------------------------------------------------

const RESIZE_TARGETS = {
  "resize-1080p": { width: 1920, height: 1080 },
  "resize-720p": { width: 1280, height: 720 },
  "resize-480p": { width: 854, height: 480 },
} as const;

// ---------------------------------------------------------------------------
// output suffix per operation
// ---------------------------------------------------------------------------

const SUFFIX_MAP: Record<OperationId, string> = {
  "compress": "compressed",
  "resize-1080p": "1080p",
  "resize-720p": "720p",
  "resize-480p": "480p",
  "convert-webp": "webp",
  "convert-avif": "avif",
  "convert-jpg": "jpg",
  "convert-png": "png",
  "convert-mp4": "mp4",
  "convert-webm": "webm",
  "rotate-90": "r90",
  "rotate-180": "r180",
  "rotate-270": "r270",
  "extract-audio-mp3": "audio",
  "extract-audio-aac": "audio",
  "extract-audio-opus": "audio",
} as const;

// ---------------------------------------------------------------------------
// file size helper
// ---------------------------------------------------------------------------

async function getFileSize(path: string): Promise<number> {
  const { statSync } = await import("node:fs");
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// command builders
// ---------------------------------------------------------------------------

type FfmpegArgs = {
  readonly args: readonly string[];
  readonly outputPath: string;
};

/** builds ffmpeg arguments for a given operation */
function buildCommand(inputPath: string, operationId: OperationId, overwrite: boolean): FfmpegArgs {
  const suffix = SUFFIX_MAP[operationId] ?? "output";
  const outPath = overwrite ? inputPath : outputPath(inputPath, suffix);

  // for convert operations, change the extension
  const convertExts: Partial<Record<OperationId, string>> = {
    "convert-webp": ".webp",
    "convert-avif": ".avif",
    "convert-jpg": ".jpg",
    "convert-png": ".png",
    "convert-mp4": ".mp4",
    "convert-webm": ".webm",
    "extract-audio-mp3": ".mp3",
    "extract-audio-aac": ".aac",
    "extract-audio-opus": ".opus",
  };

  const newExt = convertExts[operationId];
  const finalPath = newExt
    ? outPath.replace(/\.[^.]+$/, newExt)
    : outPath;

  const baseArgs: string[] = ["-y", "-i", inputPath];

  switch (operationId) {
    case "compress": {
      const ext = fileExtension(inputPath);
      if (["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
        // image: use quality param
        return { args: [...baseArgs, "-q:v", "5", finalPath], outputPath: finalPath };
      }
      // video: use CRF
      return { args: [...baseArgs, "-c:v", "libx264", "-crf", "28", "-preset", "medium", "-c:a", "aac", "-b:a", "128k", finalPath], outputPath: finalPath };
    }

    case "resize-1080p":
    case "resize-720p":
    case "resize-480p": {
      const target = RESIZE_TARGETS[operationId];
      const scaleFilter = `scale=${target.width}:${target.height}:force_original_aspect_ratio=decrease`;
      return { args: [...baseArgs, "-vf", scaleFilter, finalPath], outputPath: finalPath };
    }

    case "convert-webp":
      return { args: [...baseArgs, "-c:v", "libwebp", "-quality", "80", finalPath], outputPath: finalPath };
    case "convert-avif":
      return { args: [...baseArgs, "-c:v", "libaom-av1", "-crf", "30", "-still-picture", "1", finalPath], outputPath: finalPath };
    case "convert-jpg":
      return { args: [...baseArgs, "-q:v", "3", finalPath], outputPath: finalPath };
    case "convert-png":
      return { args: [...baseArgs, finalPath], outputPath: finalPath };

    case "convert-mp4":
      return { args: [...baseArgs, "-c:v", "libx264", "-crf", "23", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", finalPath], outputPath: finalPath };
    case "convert-webm":
      return { args: [...baseArgs, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus", finalPath], outputPath: finalPath };

    case "rotate-90":
      return { args: [...baseArgs, "-vf", "transpose=1", finalPath], outputPath: finalPath };
    case "rotate-180":
      return { args: [...baseArgs, "-vf", "transpose=2,transpose=2", finalPath], outputPath: finalPath };
    case "rotate-270":
      return { args: [...baseArgs, "-vf", "transpose=2", finalPath], outputPath: finalPath };

    case "extract-audio-mp3":
      return { args: [...baseArgs, "-vn", "-c:a", "libmp3lame", "-q:a", "2", finalPath], outputPath: finalPath };
    case "extract-audio-aac":
      return { args: [...baseArgs, "-vn", "-c:a", "aac", "-b:a", "192k", finalPath], outputPath: finalPath };
    case "extract-audio-opus":
      return { args: [...baseArgs, "-vn", "-c:a", "libopus", "-b:a", "128k", finalPath], outputPath: finalPath };
  }
}

// ---------------------------------------------------------------------------
// execute operation
// ---------------------------------------------------------------------------

/** runs an ffmpeg operation and returns the result */
export async function executeOperation(
  inputPath: string,
  operationId: OperationId,
  overwrite: boolean,
): Promise<OperationResult> {
  const originalSize = await getFileSize(inputPath);
  const cmd = buildCommand(inputPath, operationId, overwrite);

  try {
    const result = await spawnAsync("ffmpeg", cmd.args, 300_000);

    if (result.status !== 0) {
      const errLine = result.stderr.split("\n").filter(Boolean).pop() ?? "Unknown error";
      return { ok: false, error: errLine.trim() };
    }

    const newSize = await getFileSize(cmd.outputPath);

    return { ok: true, outputPath: cmd.outputPath, originalSize, newSize };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to execute ffmpeg" };
  }
}

// ---------------------------------------------------------------------------
// operation descriptions for detail view
// ---------------------------------------------------------------------------

/** returns a markdown description of what an operation will do */
export function operationDetail(operation: Operation, inputName: string): string {
  const lines = [
    `## ${operation.label}`,
    "",
    operation.description,
    "",
    "---",
    "",
    `**Input:** \`${inputName}\``,
  ];

  const cmd = buildCommand(inputName, operation.id, false);
  const outName = cmd.outputPath.split("/").pop() ?? cmd.outputPath;
  lines.push(`**Output:** \`${outName}\``);

  return lines.join("\n");
}
