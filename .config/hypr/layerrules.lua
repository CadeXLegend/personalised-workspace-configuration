-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃                       Layer Rules                            ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

-- Logout dialog animation
hl.layer_rule({
    name      = "anim-logout",
    match     = { namespace = "^logout_dialog$" },
    animation = "slide top",
})

-- Waybar animation
hl.layer_rule({
    name      = "anim-waybar",
    match     = { namespace = "^waybar$" },
    animation = "slide down",
})

-- Wallpaper animation
hl.layer_rule({
    name      = "anim-wallpaper",
    match     = { namespace = "^wallpaper$" },
    animation = "fade 50%",
})
