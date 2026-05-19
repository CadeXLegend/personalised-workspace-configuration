-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃                Hyprland Core Configuration                  ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

hl.config({
    general = {
        gaps_in  = 3,
        gaps_out = 5,

        border_size = 0,

        layout = "dwindle",

        snap = {
            enabled = true,
        },
    },

    decoration = {
        rounding       = 10,
        active_opacity = 1.0,

        blur = {
            enabled = true,
            size    = 15,
            passes  = 2,
            xray    = true,
        },

        shadow = {
            enabled = false,
        },
    },

    animations = {
        enabled = true,
    },

    group = {
        ["col.border_active"]          = pink,
        ["col.border_inactive"]        = greyDim,
        ["col.border_locked_active"]   = grey,
        ["col.border_locked_inactive"] = bgDim,

        groupbar = {
            font_family             = "Fira Sans",
            text_color              = fg,
            ["col.active"]          = pink,
            ["col.inactive"]        = greyDim,
            ["col.locked_active"]   = grey,
            ["col.locked_inactive"] = bgDim,
        },
    },

    misc = {
        font_family           = "Fira Sans",
        splash_font_family    = "Fira Sans",
        disable_hyprland_logo = true,
        force_default_wallpaper = -1,
        ["col.splash"]        = pink,
        background_color      = bg,
        enable_swallow        = true,
        swallow_regex         = "^(nautilus|nemo|thunafr|btrfs-assistant.)$",
        focus_on_activate     = true,
        vrr                   = 2,
    },

    render = {
        direct_scanout = true,
    },

    input = {
        follow_mouse                = 2,
        float_switch_override_focus = 0,
    },

    binds = {
        allow_workspace_cycles            = 1,
        workspace_back_and_forth          = 1,
        workspace_center_on               = 1,
        movefocus_cycles_fullscreen       = true,
        window_direction_monitor_fallback = true,
    },
})
