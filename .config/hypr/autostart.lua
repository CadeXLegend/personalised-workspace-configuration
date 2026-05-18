-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃                        Autostart                             ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

-- ── Event handlers ──

-- Track processed window addresses to avoid re-maximizing during
-- drag/resize operations (which re-fire window.open).
local maximized = {}

hl.on("window.open", function(w)
    if maximized[w.address] then return end
    maximized[w.address] = true
    hl.exec_cmd("~/.config/hypr/scripts/maximize.sh")
end)

-- Clean up tracked addresses when windows close
hl.on("window.close", function(w)
    maximized[w.address] = nil
end)

-- Raise the focused window above others on any focus change.
-- Fixes alt+tab via snappy-switcher where the focused window
-- doesn't get raised above the previous one.
hl.on("window.active", function(w, reason)
    hl.exec_cmd("hyprctl dispatch 'hl.dsp.window.bring_to_top()'")
end)

hl.on("hyprland.start", function()
    -- Background
    hl.exec_cmd("swaybg -o \\* -i ~/.custom/wallpapers/1378781.png -m fill")

    -- Input method
    hl.exec_cmd("fcitx5 -d &")

    -- Notifications
    hl.exec_cmd("mako &")

    -- Network applet
    hl.exec_cmd("nm-applet --indicator &")

    -- Volume overlay (wob)
    hl.exec_cmd("bash -c 'mkfifo /tmp/$HYPRLAND_INSTANCE_SIGNATURE.wob && tail -f /tmp/$HYPRLAND_INSTANCE_SIGNATURE.wob | wob & disown'")

    -- Polkit agent
    hl.exec_cmd("/usr/lib/polkit-kde-authentication-agent-1 &")

    -- DBus environment
    hl.exec_cmd("systemctl --user import-environment &")
    hl.exec_cmd("hash dbus-update-activation-environment 2>/dev/null &")
    hl.exec_cmd("dbus-update-activation-environment --systemd &")

    -- Signal systemd that the graphical session is ready (triggers vicinae + other user services)
    hl.exec_cmd("systemctl --user start graphical-session.target")

    -- Idle handler
    hl.exec_cmd("swayidle -w timeout 300 'swaylock -f -c 000000' before-sleep 'swaylock -f -c 000000'")

    -- Snappy Switcher daemon
    hl.exec_cmd("snappy-switcher --daemon")

    -- Apps
    hl.exec_cmd("ghostty")
    hl.exec_cmd("brave")
    hl.exec_cmd("discord")
    hl.exec_cmd("steam")
end)
