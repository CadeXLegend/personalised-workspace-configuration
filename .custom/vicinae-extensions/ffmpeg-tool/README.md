# FFmpeg Tool

Interactive ffmpeg wrapper Vicinae extension for image and video transformations.

## Features

- **File search** — fuzzy-find media files across common directories (Pictures, Videos, Downloads, Desktop)
- **Image operations** — compress, resize (1080p/720p/480p), convert format (WebP, AVIF, JPEG, PNG), rotate (90°/180°/270°)
- **Video operations** — compress (H.264 CRF), resize, convert format (MP4, WebM), extract audio (MP3, AAC, Opus)
- **Size reporting** — shows exact file size change with percentage after each operation
- **Overwrite control** — choose between saving as a new file (default) or overwriting the original

## Usage

1. Open Vicinae and run the **FFmpeg Tool** command
2. Type to search for a media file, or filter by Image/Video using the dropdown
3. Select a file to see its metadata (dimensions, duration, codec, bitrate)
4. Choose an operation and click **Run**
5. See the results in a toast notification showing size reduction

### Keybindings

| Shortcut | Action |
|---|---|
| Enter | Run operation (save as new file) |
| Shift+O | Run operation (overwrite original) |
| Shift+Escape | Back to file select |

## Requirements

- `ffmpeg` and `ffprobe` must be installed and available in `$PATH`

## Development

```bash
pnpm install
pnpm dev    # start development mode
pnpm build  # build the extension
```
