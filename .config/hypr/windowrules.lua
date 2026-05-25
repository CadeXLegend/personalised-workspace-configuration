-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃                      Window Rules (v2)                       ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

-- All windows float (never tiled); use SUPER+F to maximize.
hl.window_rule({
    name       = "default-float",
    match      = { class = ".*" },
    float      = true,
})

-- Disable rounding on fullscreen windows
hl.window_rule({
    name       = "nofullscreen-rounding",
    match      = { class = ".*", fullscreen = true },
    rounding   = 0,
})

-- VSCode transparency + blur
hl.window_rule({
    name       = "code-transparent",
    match      = { class = "^(code-oss|Code|VSCodium)$" },
    opacity    = "0.92 0.88",
})

-- Discord transparency + blur
hl.window_rule({
    name       = "discord-transparent",
    match      = { class = "^discord$" },
    opacity    = "0.85 0.80",
})

-- Telegram transparency + blur
hl.window_rule({
    name       = "telegram-transparent",
    match      = { class = "^org\\.telegram\\.desktop$" },
    opacity    = "0.85 0.80",
})

-- Btrfs Assistant transparency + blur
hl.window_rule({
    name       = "btrfs-assistant-transparent",
    match      = { class = "^btrfs-assistant$" },
    opacity    = "0.86 0.82",
})

-- Steam transparency + blur
hl.window_rule({
    name       = "steam-transparent",
    match      = { class = "^steam$" },
    opacity    = "0.78 0.73",
})

-- xdg-desktop-portal-gtk dialogs (e.g. file chooser) — dark + blurred + transparent + constrained
hl.window_rule({
    name       = "portal-transparent",
    match      = { class = "^xdg-desktop-portal-gtk$" },
    opacity    = "0.88 0.82",
    center     = true,
    max_size   = "80% 80%",
})

-- Dolphin file transfer progress dialogs — constrain from filling the screen
hl.window_rule({
    name       = "dolphin-transfer-constrain",
    match      = { class = "^org\\.kde\\.dolphin$", title = "^(Copying|Moving)" },
    center     = true,
    max_size   = "80% 80%",
})
