---
name: "hyprland-lua-config"
description: "Edit or debug Hyprland configuration written in Lua (~/.config/hypr/*.lua). Use when adding hotkeys, window rules, animations, monitors, or env vars, or when Hyprland --verify-config reports errors."
version: 1
created: "2026-09-11"
updated: "2026-09-11"
---
## When to Use
Use when you change or debug any file under `~/.config/hypr/`. The configuration is Lua-based, not `.conf`. Do not use this skill for the .conf files, they are not the source

## Procedure
1. Read the current lua sources before you change anything, the configuration is split across `hyprland.lua` (entry), `config.lua`, `autostart.lua`, `hotkeys.lua`, `animations.lua`, `colours.lua`, `env.lua`, `gestures.lua`, `layerrules.lua`, `monitors.lua`, `windowrules.lua`, and `vicinae.lua`
2. Cross-reference every `hl.*`, `hl.dsp.*`, and `hl.config()` call against the official bindings source before you use it, dispatchers are in `src/config/lua/bindings/LuaBindingsDispatchers.cpp`, config rules are in `src/config/lua/bindings/LuaBindingsConfigRules.cpp`, and `example/hyprland.lua` shows the canonical shape
3. Make one discrete change at a time and create a `TaskCreate` for each, for example "update hotkey bindings" or "add window rule"
4. Run `Hyprland --verify-config` after every change
5. Fix one error, then run `Hyprland --verify-config` again to confirm that the error is gone before you continue
6. Confirm that the last line of the verification output is `config ok` before you report the work as done

## Pitfalls
- `hl.*` signatures are not guessable, an invented function name fails silently or corrupts the configuration
- the `.conf` files still exist and look authoritative, an edit to them has no effect on the running compositor
- `config ok` must be the final line of the `Hyprland --verify-config` output, any other final line means errors remain
- never reload or restart the compositor to test a change, that kills the Wayland session and every client in it

## Verification
1. `Hyprland --verify-config` prints `config ok` as its last line
2. the change is present in the Lua source, not in a `.conf` file