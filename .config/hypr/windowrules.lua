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

-- xdg-desktop-portal-gtk dialogs (Brave file chooser etc.) — dark + blurred + transparent
hl.window_rule({
    name       = "portal-transparent",
    match      = { class = "^xdg-desktop-portal-gtk$" },
    opacity    = "0.88 0.82",
})
