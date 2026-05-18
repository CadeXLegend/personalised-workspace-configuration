# Personalised Workspace Configuration

![Hyprland](https://img.shields.io/badge/Hyprland-58e1ff?style=flat&logo=hyprland&logoColor=black)
![Ghostty](https://img.shields.io/badge/Ghostty-7b4dff?style=flat)
![Vicinae](https://img.shields.io/badge/Vicinae-ff79c6?style=flat)
![Zsh](https://img.shields.io/badge/Zsh-f15a24?style=flat&logo=zsh&logoColor=white)
![Starship](https://img.shields.io/badge/Starship-dd0b78?style=flat&logo=starship&logoColor=white)

## Table of contents

- [What is this?](#what-is-this)
- [How do I use it?](#how-do-i-use-it)
- [Tracked Files](#tracked-files)
- [Prerequisites](#prerequisites)
- [Mentions](#mentions)

## What is this?

A modular workspace configuration covering window management, terminal, launcher, shell, prompt, scripts and application configs

I use an inverse gitignore which ignores everything by default and only whitelists what I want to track

## How do I use it?

See [Prerequisites](#prerequisites) for required tools

1. Clone into your home directory

   ```sh
   cd ~
   git clone git@github.com:CadeXLegend/personalised-workspace-configuration.git /tmp/dotfiles
   cp -r /tmp/dotfiles/. ~/
   rm -rf /tmp/dotfiles
   ```

2. Run `git status` from `~` to see what is and is not tracked

## Tracked Files

### Window Manager: Hyprland

| What | Path |
|---|---|
| Entry point | `.config/hypr/hyprland.lua` |
| Main config | `.config/hypr/config.lua` |
| Autostart | `.config/hypr/autostart.lua` |
| Hotkeys | `.config/hypr/hotkeys.lua` |
| Animations | `.config/hypr/animations.lua` |
| Colours | `.config/hypr/colours.lua` |
| Environment | `.config/hypr/env.lua` |
| Gestures | `.config/hypr/gestures.lua` |
| Layer rules | `.config/hypr/layerrules.lua` |
| Monitor rules | `.config/hypr/monitors.lua` |
| Window rules | `.config/hypr/windowrules.lua` |
| Vicinae integration | `.config/hypr/vicinae.lua` |
| Window maximize script | `.config/hypr/scripts/maximize.sh` |
| Window snap script | `.config/hypr/scripts/snap.sh` |

### Terminal: Ghostty

| What | Path |
|---|---|
| Main config with Sweet-Rainbow palette | `.config/ghostty/config` |
| Shell override | `.config/ghostty/config.ghostty` |

### Notifications: Mako

| What | Path |
|---|---|
| Notification config with Sweet-Rainbow colours | `.config/mako/config` |

### Launcher: Vicinae

| What | Path |
|---|---|
| Settings with Sweet-Rainbow theme | `.config/vicinae/settings.json` |
| Sweet-Rainbow theme | `.local/share/vicinae/themes/sweet-rainbow.toml` |

### Vicinae Extensions

| What | Path |
|---|---|
| Anime tracker | `.custom/vicinae-extensions/anime-tracker/**` |
| Man page reader | `.custom/vicinae-extensions/man-reader/**` |
| Nyaa search | `.custom/vicinae-extensions/nyaa/**` |
| Open repo folder | `.custom/vicinae-extensions/orf/**` |
| Simple date/time clock | `.custom/vicinae-extensions/simple-date-time/**` |

### Shell: Zsh

| What | Path |
|---|---|
| Zsh entry point | `.zshrc` |
| Aliases | `.custom/zshrc/aliases.zsh` |
| Exports | `.custom/zshrc/exports.zsh` |
| Functions | `.custom/zshrc/functions.zsh` |
| Plugin and Extras | `.custom/zshrc/plugins_extras.zsh` |

### Prompt: Starship

| What | Path |
|---|---|
| Starship config | `.custom/configs/starship.toml` |
| Config template | `.custom/configs/starship.toml.template` |

### Custom Scripts

| What | Path |
|---|---|
| HTTP status lookup | `.custom/scripts/http-status.sh` |
| Escape URL (Rust) | `.custom/scripts/escape-url/**` |
| Gradient generator (Rust) | `.custom/scripts/gradient/**` |
| Stardust template engine (Rust) | `.custom/scripts/stardust/**` |

### Application Configs

| What | Path |
|---|---|
| ksnip screenshot tool | `.config/ksnip/ksnip.conf` |
| Github domain config | `.custom/configs/domain` |
| Open repo folder config | `.custom/configs/orf` |
| Stardust template params | `.custom/configs/stardust-template-params.json` |

### Anime Tracker Data

| What | Path |
|---|---|
| Customisations | `.custom/configs/anime-tracker/anime-tracker-customisations.json` |
| Watchlist | `.custom/configs/anime-tracker/anime-watchlist-tracker.json` |
| Status overlays (5 images) | `.custom/configs/anime-tracker/overlays/*.png` |

### Misc

| What | Path |
|---|---|
| Wallpaper | `.custom/wallpapers/1378781.png` |

## Prerequisites

### Shell

[cachyos-zsh-config](https://github.com/CachyOS/cachyos-zsh-config) sourced as the zsh base

[starship](https://starship.rs/) for prompt customisation

[thefuck](https://github.com/nvbn/thefuck) for command correction

### CLI Tools

- [eza](https://github.com/eza-community/eza) for directory listings
- [jq](https://github.com/jqlang/jq) for JSON processing
- [fzf](https://github.com/junegunn/fzf) for fuzzy searching
- [nushell](https://www.nushell.sh/) for pretty printing data structures
- [gh](https://cli.github.com/) for GitHub operations
- [fastfetch](https://github.com/fastfetch-cli/fastfetch) for system info

### Desktop

- [Hyprland](https://hyprland.org/) compositor
- [Ghostty](https://ghostty.org/) terminal emulator
- [Vicinae](https://vicinae.com/) launcher
- swaybg for wallpaper
- swayidle + swaylock for idle and lock
- mako for notifications
- fcitx5 for input method
- nm-applet for network

## Mentions

Credit to [this useful list of scripts](https://evanhahn.com/scripts-i-wrote-that-i-use-all-the-time/) for [http status](.custom/scripts/http-status.sh)

Zsh layout inspired by [this fantastic article](https://afridi.dev/articles/organize-your-zsh-configurations-and-plugins/)
