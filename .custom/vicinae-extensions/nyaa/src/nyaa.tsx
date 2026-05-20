import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
} from "@vicinae/api";
import { execFile } from "node:child_process";
import { useState, useEffect, useCallback, useMemo } from "react";
import { patterns } from "./regex-patterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NyaaTorrent {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly size: string;
  readonly seeders: number;
  readonly leechers: number;
  readonly downloads: number;
  readonly infoHash: string;
  readonly magnetLink: string;
  readonly viewUrl: string;
  readonly isTrusted: boolean;
  readonly isRemake: boolean;
}

type FetchSuccess = {
  readonly ok: true;
  readonly items: readonly NyaaTorrent[];
};

type FetchError = {
  readonly ok: false;
  readonly error: string;
};

type FetchResult = FetchSuccess | FetchError;

// ---------------------------------------------------------------------------
// RSS Parsing
// ---------------------------------------------------------------------------

/**
 * Extracts the text content inside an XML element.
 * Handles namespaced tags (e.g. `nyaa:seeders`) and CDATA sections.
 */
function xmlContent(xml: string, tag: string): string {
  const re = patterns.xmlTag(tag);
  const match = re.exec(xml);
  const raw = match?.[1]?.trim() ?? "";
  return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

/** Constructs a magnet URI from an info hash and display name */
function buildMagnetLink(infoHash: string, title: string): string {
  return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;
}

/** Extracts the magnet link from the description HTML as a fallback */
function extractMagnetFromDescription(description: string): string {
  const match = patterns.magnetLink.exec(description);
  return match?.[0] ?? "";
}

/** Parses a single `<item>` block from the RSS feed */
function parseItem(itemXml: string): NyaaTorrent | undefined {
  const title = xmlContent(itemXml, "title");
  const link = xmlContent(itemXml, "link");
  const infoHash = xmlContent(itemXml, "nyaa:infoHash");

  if (!title || !link || !infoHash) return undefined;

  const viewUrl = link;
  const idMatch = viewUrl.match(/\/(\d+)$/);
  const id = idMatch?.[1] ?? infoHash;

  const description = xmlContent(itemXml, "description");
  const magnetFromDesc = extractMagnetFromDescription(description);
  const magnetLink = magnetFromDesc || buildMagnetLink(infoHash, title);

  const parseNum = (raw: string): number => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    id,
    title,
    category: xmlContent(itemXml, "nyaa:category"),
    size: xmlContent(itemXml, "nyaa:size"),
    seeders: parseNum(xmlContent(itemXml, "nyaa:seeders")),
    leechers: parseNum(xmlContent(itemXml, "nyaa:leechers")),
    downloads: parseNum(xmlContent(itemXml, "nyaa:downloads")),
    infoHash,
    magnetLink,
    viewUrl,
    isTrusted: xmlContent(itemXml, "nyaa:trusted") === "Yes",
    isRemake: xmlContent(itemXml, "nyaa:remake") === "Yes",
  };
}

/** Parses the full nyaa.si RSS XML response into torrent items */
function parseRssXml(xml: string): readonly NyaaTorrent[] {
  return Object.freeze(
    Array.from(xml.matchAll(patterns.rssItems), (m) => m[1] ?? "")
      .map(parseItem)
      .filter((item): item is NyaaTorrent => item !== undefined),
  );
}

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

const NYAA_RSS_BASE = "https://nyaa.si/?page=rss" as const;

type CurlSuccess = { readonly ok: true; readonly body: string };
type CurlError = { readonly ok: false; readonly error: string };
type CurlResult = CurlSuccess | CurlError;

/** runs a child process asynchronously and collects stdout/stderr */
function spawnAsync(
  cmd: string,
  args: readonly string[],
  timeout: number,
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        status: error ? Number((error as NodeJS.ErrnoException).code) || 1 : 0,
        stdout: stdout || "",
        stderr: stderr || "",
      });
    });
  });
}

/** Fetches a URL via `curl` asynchronously with clean error-as-value handling */
async function curlGet(url: string): Promise<CurlResult> {
  try {
    const result = await spawnAsync("curl", [
      "-sS",
      "--max-time", "15",
      "-H", "User-Agent: vicinae-nyaa-extension/1.0",
      url,
    ], 15_000);

    if (result.status !== 0) {
      const error = result.stderr.trim() || "Failed to fetch";
      return { ok: false, error };
    }

    return { ok: true, body: result.stdout };
  } catch {
    return { ok: false, error: "Failed to fetch" };
  }
}

async function fetchSearch(query: string): Promise<FetchResult> {
  const url = `${NYAA_RSS_BASE}&q=${encodeURIComponent(query)}`;
  const curlResult = await curlGet(url);

  if (!curlResult.ok) {
    return { ok: false, error: curlResult.error };
  }

  const items = parseRssXml(curlResult.body);

  if (items.length === 0) {
    return { ok: false, error: "No results found" };
  }

  return { ok: true, items };
}

// ---------------------------------------------------------------------------
// Detail Markdown
// ---------------------------------------------------------------------------

function buildDetailMarkdown(item: NyaaTorrent): string {
  return [
    `## ${item.title}`,
    "",
    `**Category:** ${item.category}`,
    `**Size:** ${item.size}`,
    `**Seeders:** ${item.seeders}  \u2191`,
    `**Leechers:** ${item.leechers}  \u2193`,
    `**Downloads:** ${item.downloads}`,
    `**Trusted:** ${item.isTrusted ? "Yes" : "No"}`,
    `**Remake:** ${item.isRemake ? "Yes" : "No"}`,
    "",
    "---",
    "",
    `**Magnet:** \`${item.magnetLink}\``,
    `**Info Hash:** \`${item.infoHash}\``,
    `**View:** [${item.viewUrl}](${item.viewUrl})`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a color tag for the category badge */
function categoryColor(category: string): Color {
  const lower = category.toLowerCase();
  if (lower.includes("anime")) return Color.Orange;
  if (lower.includes("audio") || lower.includes("music")) return Color.Purple;
  if (lower.includes("literature") || lower.includes("book")) return Color.Blue;
  if (lower.includes("software") || lower.includes("game")) return Color.Green;
  if (lower.includes("live action")) return Color.Yellow;
  return Color.SecondaryText;
}

/** Returns an icon for the category */
function categoryIcon(category: string): Icon {
  const lower = category.toLowerCase();
  if (lower.includes("anime")) return Icon.Video;
  if (lower.includes("audio") || lower.includes("music")) return Icon.Music;
  if (lower.includes("literature") || lower.includes("book")) return Icon.Book;
  if (lower.includes("software") || lower.includes("game")) return Icon.GameController;
  return Icon.BlankDocument;
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default function NyaaCommand() {
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<readonly NyaaTorrent[]>(
    Object.freeze([]),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const trimmed = searchText.trim();
    if (!trimmed) {
      setItems(Object.freeze([]));
      setError(undefined);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(undefined);

    void fetchSearch(trimmed).then((result) => {
      if (cancelled) return;
      setIsLoading(false);

      if (result.ok) {
        setItems(result.items);
      } else {
        setItems(Object.freeze([]));
        setError(result.error);
      }
    });

    return () => { cancelled = true; };
  }, [searchText]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const emptyView = useMemo(
    () =>
      !isLoading && items.length === 0 ? (
        <List.EmptyView
          title={error ? "Search failed" : "Search nyaa.si"}
          description={
            error ??
            "Type a keyword to search for torrents on nyaa.si"
          }
          icon={error ? Icon.Exclamationmark : Icon.MagnifyingGlass}
        />
      ) : undefined,
    [isLoading, items.length, error],
  );

  return (
    <List
      searchBarPlaceholder="Search nyaa.si (e.g. anime title, group name)..."
      isLoading={isLoading}
      throttle
      filtering
      searchText={searchText}
      onSearchTextChange={handleSearchChange}
      isShowingDetail={items.length > 0}
      navigationTitle="Nyaa Search"
    >
      {emptyView}
      {items.length > 0 && (
        <List.Section title={`Results (${items.length})`}>
          {items.map((item) => (
            <List.Item
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={`${item.size} · ⬆ ${item.seeders} ⬇ ${item.leechers}`}
              icon={categoryIcon(item.category)}
              keywords={[item.category, item.infoHash]}
              accessories={[
                {
                  tag: {
                    value: item.category,
                    color: categoryColor(item.category),
                  },
                },
                {
                  text: `⬆${item.seeders}`,
                  tooltip: `${item.seeders} seeders`,
                },
                {
                  text: `⬇${item.leechers}`,
                  tooltip: `${item.leechers} leechers`,
                },
                ...(item.isTrusted
                  ? [
                      {
                        icon: Icon.CheckCircle,
                        tooltip: "Trusted uploader",
                      } as const,
                    ]
                  : []),
              ]}
              detail={<List.Item.Detail markdown={buildDetailMarkdown(item)} />}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Magnet Link"
                    content={item.magnetLink}
                    icon={Icon.Link}
                    shortcut={{ key: "m", modifiers: ["shift"] }}
                  />
                  <Action.CopyToClipboard
                    title="Copy Title"
                    content={item.title}
                    icon={Icon.Text}
                  />
                  <Action.CopyToClipboard
                    title="Copy Info Hash"
                    content={item.infoHash}
                    icon={Icon.Hashtag}
                  />
                  <Action.OpenInBrowser
                    title="Open in Browser"
                    url={item.viewUrl}
                    icon={Icon.Globe01}
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
