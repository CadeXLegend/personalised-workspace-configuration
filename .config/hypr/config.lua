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
        ["col.border_active"]          = cachydgreen,
        ["col.border_inactive"]        = cachylgreen,
        ["col.border_locked_active"]   = cachymgreen,
        ["col.border_locked_inactive"] = cachydblue,

        groupbar = {
            font_family             = "Fira Sans",
            text_color              = cachydblue,
            ["col.active"]          = cachydgreen,
            ["col.inactive"]        = cachylgreen,
            ["col.locked_active"]   = cachymgreen,
            ["col.locked_inactive"] = cachydblue,
        },
    },

    misc = {
        font_family           = "Fira Sans",
        splash_font_family    = "Fira Sans",
        disable_hyprland_logo = true,
        force_default_wallpaper = -1,
        ["col.splash"]        = cachylgreen,
        background_color      = cachydblue,
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
