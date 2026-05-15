import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { STATUS_LABELS, STATUS_ORDER, type WatchStatus } from "../status";
import {
  configDir,
  coversDir,
  overlaysDir,
  compositedDir,
  coverPath,
  overlayPath,
  compositePathFor,
} from "./paths";

// ---------------------------------------------------------------------------
// Tailwind dark-mode pill badge colors — only used in overlay generation
// ---------------------------------------------------------------------------

export const PILL_COLORS: Record<WatchStatus, { readonly bg: string; readonly text: string }> = {
  watching:   { bg: "#052e16", text: "#86efac" },
  completed:  { bg: "#082f49", text: "#7dd3fc" },
  on_hold:    { bg: "#431407", text: "#fdba74" },
  dropped:    { bg: "#450a0a", text: "#fca5a5" },
  plan_to_watch: { bg: "#3b0764", text: "#d8b4fe" },
} as const;

// ---------------------------------------------------------------------------
// Directory setup
// ---------------------------------------------------------------------------

/** Ensures all asset directories exist */
export function ensureDirs(): void {
  const dirs = [configDir(), coversDir(), overlaysDir(), compositedDir()];
  for (const d of dirs) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Overlay badge generation
// ---------------------------------------------------------------------------

/**
 * Generates pill-shaped overlay badge PNGs via SVG → librsvg.
 * Rendered at 180×40 with 22px font, transparent outside the pill,
 * 10% opacity for subtle cover bleed-through.
 */
export function ensureOverlays(): void {
  ensureDirs();

  const W = 180;
  const H = 40;
  const R = H / 2;

  for (const status of STATUS_ORDER) {
    const outPath = overlayPath(status);
    if (existsSync(outPath)) continue;

    const colors = PILL_COLORS[status];
    const label = STATUS_LABELS[status];

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
      `  <rect x="0" y="0" width="${W}" height="${H}" rx="${R}" fill="${colors.bg}" fill-opacity="0.9"/>`,
      `  <text x="${W / 2}" y="${Math.round(H * 0.7)}" text-anchor="middle" font-family="sans-serif" font-size="22" fill="${colors.text}">${label}</text>`,
      `</svg>`,
    ].join("\n");

    const svgPath = outPath.replace(/\.png$/, ".svg");
    writeFileSync(svgPath, svg, "utf-8");
    spawnSync("magick", [
      "-background", "none", svgPath,
      outPath,
    ], { encoding: "utf-8", timeout: 5_000 });
    unlinkSync(svgPath);
  }
}

// ---------------------------------------------------------------------------
// Cover caching & compositing
// ---------------------------------------------------------------------------

/** Downloads a cover image from an AniList URL and saves it locally */
export function cacheCover(anilistId: number, imageUrl: string): boolean {
  const dest = coverPath(anilistId);
  if (existsSync(dest)) return true;

  const result = spawnSync("curl", [
    "-sS", "--max-time", "15",
    "-o", dest,
    imageUrl,
  ], { encoding: "utf-8", timeout: 15_000 });

  return result.status === 0 && existsSync(dest);
}

/**
 * Composites the status overlay badge onto the cover image.
 * Normalizes cover to 230×325 so badge position is consistent.
 */
export function createComposite(anilistId: number, status: WatchStatus): string | undefined {
  const cover = coverPath(anilistId);
  if (!existsSync(cover)) return undefined;

  const overlay = overlayPath(status);
  if (!existsSync(overlay)) return undefined;

  const dest = compositePathFor(anilistId, status);

  // Delete old composites for other statuses
  for (const s of STATUS_ORDER) {
    if (s === status) continue;
    const old = compositePathFor(anilistId, s);
    if (existsSync(old)) unlinkSync(old);
  }

  // Always regenerate to pick up position/filter changes
  if (existsSync(dest)) unlinkSync(dest);

  const result = spawnSync("magick", [
    "(", cover, "-resize", "230x325^", "-gravity", "center", "-extent", "230x325", ")",
    overlay,
    "-gravity", "northeast",
    "-filter", "Lanczos",
    "-geometry", "90x20+14+10",
    "-composite",
    dest,
  ], { encoding: "utf-8", timeout: 10_000 });

  return result.status === 0 && existsSync(dest) ? dest : undefined;
}

/**
 * Returns the local path for a composited image.
 * Falls back to the raw cover, then to the remote URL.
 */
export function getDisplayImage(anilistId: number, status: WatchStatus, remoteUrl: string): string {
  const composite = compositePathFor(anilistId, status);
  if (existsSync(composite)) return composite;

  const cover = coverPath(anilistId);
  if (existsSync(cover)) return cover;

  return remoteUrl;
}

/** Removes all cached images for an entry */
export function cleanupEntry(anilistId: number): void {
  const cover = coverPath(anilistId);
  if (existsSync(cover)) unlinkSync(cover);

  for (const s of STATUS_ORDER) {
    const comp = compositePathFor(anilistId, s);
    if (existsSync(comp)) unlinkSync(comp);
  }
}
