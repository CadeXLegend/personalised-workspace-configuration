-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃                         Vicinae                              ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

-- Start vicinae systemd user service on Hyprland startup
hl.on("hyprland.start", function()
    hl.exec_cmd("systemctl --user start vicinae")
end)

-- Open vicinae with SUPER key alone (fires on release
-- when no other key was pressed during the hold)
hl.bind("SUPER + Super_L",
    hl.dsp.exec_cmd("vicinae toggle && vicinae vicinae://launch/@CadeXLegend/simple-date-time/clock"),
    { release = true, desc = "Toggle vicinae" })

-- Vicinae layer rules: blur + no animation
hl.layer_rule({
    name    = "vicinae",
    match   = { namespace = "^vicinae$" },
    blur    = true,
    no_anim = true,
})
