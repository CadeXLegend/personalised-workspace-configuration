// ---------------------------------------------------------------------------
// Watch status domain type and its metadata
// ---------------------------------------------------------------------------

export type WatchStatus =
  | "watching"
  | "completed"
  | "on_hold"
  | "dropped"
  | "plan_to_watch";

export const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "Watching",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
  plan_to_watch: "Waiting",
} as const;

export const STATUS_ORDER: readonly WatchStatus[] = Object.freeze([
  "watching",
  "completed",
  "on_hold",
  "dropped",
  "plan_to_watch",
]);
