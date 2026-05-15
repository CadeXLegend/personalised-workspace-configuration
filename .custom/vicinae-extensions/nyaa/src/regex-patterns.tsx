/** Regex patterns for parsing the nyaa.si RSS feed */
export const patterns = {
  /**
   * Splits RSS XML into individual `<item>...</item>` blocks.
   * Capture group 1: the content inside each `<item>` element.
   */
  rssItems: /<item>([\s\S]*?)<\/item>/g,

  /**
   * Extracts the text content of an XML element by tag name.
   * The tag name is interpolated into the pattern at use time.
   * Non-greedy match to handle nested elements correctly.
   */
  xmlTag: (tag: string): RegExp =>
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),

  /**
   * Matches a magnet link in an HTML anchor tag.
   * Capture group 1: the full magnet URI.
   * Used as fallback when infoHash is unavailable.
   */
  magnetLink: /magnet:\?xt=urn:btih:[a-fA-F0-9]{32,40}[^"'\s<]*/g,

  /**
   * Matches an HTML anchor tag's href attribute.
   * Capture group 1: the href value.
   */
  hrefAttribute: /href="([^"]+)"/,

  /**
   * Matches the human-readable size string like "1.4 GiB" or "800.5 MiB".
   * Capture group 1: the full size string.
   */
  sizeString: /^[\d.]+ [KMGT]iB$/,
} as const;
