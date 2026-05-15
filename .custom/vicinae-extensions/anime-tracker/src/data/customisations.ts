import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { configDir } from "../utils/paths";

// ---------------------------------------------------------------------------
// Persisted customisation settings (view filter, sort order)
// ---------------------------------------------------------------------------

const CUSTOMISATIONS_PATH = configDir() + "/anime-tracker-customisations.json";
const DEFAULTS = { viewFilter: "all", sortOrder: "default" } as const;

export type CustomisationData = {
  viewFilter: string;
  sortOrder: string;
};

export function loadCustomisations(): CustomisationData {
  if (!existsSync(CUSTOMISATIONS_PATH)) {
    return { ...DEFAULTS };
  }
  try {
    const raw = readFileSync(CUSTOMISATIONS_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "viewFilter" in parsed &&
      "sortOrder" in parsed
    ) {
      return parsed as CustomisationData;
    }
  } catch {
    // Corrupt file — use defaults
  }
  return { ...DEFAULTS };
}

export function saveCustomisations(data: CustomisationData): void {
  const dir = configDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(CUSTOMISATIONS_PATH, JSON.stringify(data, null, 2), "utf-8");
}
