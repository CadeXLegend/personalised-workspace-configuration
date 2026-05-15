# Man Reader

A Vicinae extension for browsing and searching Unix man pages with a live, interactive UI

## Usage

1. Open Vicinae and search for **man**
2. Type a command name (e.g. `grep`, `curl`, `git`) and the man page loads live
3. Browse entries in the list, use the built-in fuzzy search to filter
4. Use the section dropdown to narrow by category (Options, Description, Examples, etc)
5. Backspace an empty search while in filter mode to re-enter search mode

## Features

| Feature | Description |
| :--- | :--- |
| Live search | Type a command name and the man page loads instantly |
| Fuzzy filtering | Filter entries in real time using the search bar |
| Section dropdown | Filter entries by section (Options, Synopsis, Description, Examples, etc) |
| Detail panel | Select any entry to view its full formatted content in the side panel |
| Structured entries | Option flags are parsed individually with their descriptions |
| Colored section tags | Each entry is tagged with its section for quick scanning |
| Copy actions | Copy entries, the full man page, or the `man` command to clipboard |

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Shift+Escape` | New search |
| `Enter` | Copy entry |

## Local Setup

```bash
pnpm i
pnpm dev
```
