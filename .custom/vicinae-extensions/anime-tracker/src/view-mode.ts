// ---------------------------------------------------------------------------
// View mode enum — drives which view component renders
// ---------------------------------------------------------------------------

export const ViewMode = {
  Browse: "browse",
  Search: "search",
  Inspect: "inspect",
} as const;

export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];
