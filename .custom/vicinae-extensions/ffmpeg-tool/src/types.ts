/** types of media supported by the extension */
export type MediaType = "image" | "video";

/** metadata extracted from a media file via ffprobe */
export type MediaInfo = {
  readonly path: string;
  readonly name: string;
  readonly size: number;
  readonly type: MediaType;
  readonly width: number | undefined;
  readonly height: number | undefined;
  readonly duration: number | undefined;
  readonly codec: string | undefined;
  readonly bitrate: number | undefined;
};

/** unique identifier for each operation */
export type OperationId =
  | "compress"
  | "resize-1080p"
  | "resize-720p"
  | "resize-480p"
  | "convert-webp"
  | "convert-avif"
  | "convert-jpg"
  | "convert-png"
  | "convert-mp4"
  | "convert-webm"
  | "rotate-90"
  | "rotate-180"
  | "rotate-270"
  | "extract-audio-mp3"
  | "extract-audio-aac"
  | "extract-audio-opus";

/** definition of an available operation */
export type Operation = {
  readonly id: OperationId;
  readonly label: string;
  readonly description: string;
  readonly applicableTypes: readonly MediaType[];
};

/** file type filter for the dropdown */
export type FileTypeFilter = "all" | "image" | "video";

/** result of running an ffmpeg operation */
export type OperationResult = {
  readonly ok: true;
  readonly outputPath: string;
  readonly originalSize: number;
  readonly newSize: number;
} | {
  readonly ok: false;
  readonly error: string;
};
