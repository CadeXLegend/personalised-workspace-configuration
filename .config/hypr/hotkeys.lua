-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃                         Hotkeys                             ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

local mainMod = "SUPER"

local terminal    = "ghostty"
local fileManager = "dolphin"
local launcher    = "vicinae"

-- ── Apps ──

hl.bind(mainMod .. " + T",
    hl.dsp.exec_cmd(terminal),
    { desc = "Open terminal" })

hl.bind(mainMod .. " + E",
    hl.dsp.exec_cmd(fileManager),
    { desc = "Open file manager" })

hl.bind(mainMod .. " + SPACE",
    hl.dsp.exec_cmd(launcher .. " toggle"),
    { desc = "Open launcher" })

hl.bind("ALT + F4",
    hl.dsp.window.close(),
    { desc = "Close active window" })

-- ── Maximize (fill screen, no exclusive state) ──
-- The old resizeactive/moveactive dispatchers don't work in
-- Hyprland 0.55+ Lua config mode; the script uses Lua dispatch.

hl.bind(mainMod .. " + F",
    hl.dsp.exec_cmd("~/.config/hypr/scripts/maximize.sh"),
    { desc = "Maximize window (fill screen)" })

-- ── Half-screen snapping ──

hl.bind(mainMod .. " + SHIFT + RIGHT",
    hl.dsp.exec_cmd("~/.config/hypr/scripts/snap.sh right"),
    { desc = "Snap to right half" })

hl.bind(mainMod .. " + SHIFT + LEFT",
    hl.dsp.exec_cmd("~/.config/hypr/scripts/snap.sh left"),
    { desc = "Snap to left half" })

hl.bind(mainMod .. " + SHIFT + UP",
    hl.dsp.exec_cmd("~/.config/hypr/scripts/snap.sh top"),
    { desc = "Snap to top half" })

hl.bind(mainMod .. " + SHIFT + DOWN",
    hl.dsp.exec_cmd("~/.config/hypr/scripts/snap.sh bottom"),
    { desc = "Snap to bottom half" })

-- ── Mouse drag/resize ──

hl.bind(mainMod .. " + mouse:272", hl.dsp.window.drag(),   { mouse = true })
hl.bind(mainMod .. " + mouse:273", hl.dsp.window.resize(), { mouse = true })

-- ── Screenshots ──

hl.bind("PRINT",
    hl.dsp.exec_cmd("grimblast copy area"),
    { desc = "Screenshot region" })
hl.bind("CTRL + PRINT",
    hl.dsp.exec_cmd("grimblast copy active"),
    { desc = "Screenshot active window" })
hl.bind("ALT + PRINT",
    hl.dsp.exec_cmd("grimblast copy output"),
    { desc = "Screenshot active display" })

-- ── Volume control ──

hl.bind("XF86AudioRaiseVolume",
    hl.dsp.exec_cmd("pactl set-sink-volume @DEFAULT_SINK@ +5% && pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+(?=%)' | awk '{if($1>100) system(\"pactl set-sink-volume @DEFAULT_SINK@ 100%\")}' && pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+(?=%)' | awk '{print $1}' | head -1 > /tmp/$HYPRLAND_INSTANCE_SIGNATURE.wob"),
    { locked = true, repeating = true })

hl.bind("XF86AudioLowerVolume",
    hl.dsp.exec_cmd("pactl set-sink-volume @DEFAULT_SINK@ -5% && pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+(?=%)' | awk '{print $1}' | head -1 > /tmp/$HYPRLAND_INSTANCE_SIGNATURE.wob"),
    { locked = true, repeating = true })

hl.bind("XF86AudioMute",
    hl.dsp.exec_cmd("amixer sset Master toggle | sed -En '/\\[on\\]/ s/.*\\[([0-9]+)%\\].*/\\1/ p; /\\[off\\]/ s/.*/0/p' | head -1 > /tmp/$HYPRLAND_INSTANCE_SIGNATURE.wob"),
    { locked = true })

-- ── Playback ──

hl.bind("XF86AudioPlay",  hl.dsp.exec_cmd("playerctl play-pause"))
hl.bind("XF86AudioNext",  hl.dsp.exec_cmd("playerctl next"))
hl.bind("XF86AudioPrev",  hl.dsp.exec_cmd("playerctl previous"))

-- ── Brightness ──

hl.bind("XF86MonBrightnessUp",
    hl.dsp.exec_cmd("brightnessctl s +5%"),
    { locked = true, repeating = true })
hl.bind("XF86MonBrightnessDown",
    hl.dsp.exec_cmd("brightnessctl s 5%-"),
    { locked = true, repeating = true })

-- ── Screen lock ──

hl.bind(mainMod .. " + L",
    hl.dsp.exec_cmd("$HOME/.config/hypr/scripts/lock.sh -f"),
    { desc = "Lock screen" })

-- ── Reload waybar ──

hl.bind(mainMod .. " + O",
    hl.dsp.exec_cmd("killall -SIGUSR2 waybar"),
    { desc = "Reload waybar" })

-- ── Snappy Switcher ──
-- The daemon auto-selects the highlighted window when ALT is released (dismiss_modifier = alt).
-- The release binding below only handles fullscreen — focus is managed by the daemon.

hl.bind("ALT + TAB",
    hl.dsp.exec_cmd("snappy-switcher next"),
    { desc = "Switch to next window" })

hl.bind("ALT + SHIFT + TAB",
    hl.dsp.exec_cmd("snappy-switcher prev"),
    { desc = "Switch to previous window" })

-- hl.bind("ALT + TAB + Alt_L",
--     hl.dsp.exec_cmd(""),
--     { release = true })

-- ── Exit Hyprland ──

hl.bind(mainMod .. " + SHIFT + M",
    hl.dsp.exit(),
    { desc = "Exit Hyprland" })
