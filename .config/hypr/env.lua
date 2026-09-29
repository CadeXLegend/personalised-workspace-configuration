-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃                   Environment Variables                     ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

-- NVIDIA (Wayland stability)
hl.env("AQ_DRM_DEVICES", "/dev/dri/card0")
hl.env("GBM_BACKEND", "nvidia-drm")
hl.env("__GLX_VENDOR_LIBRARY_NAME", "nvidia")
hl.env("LIBVA_DRIVER_NAME", "nvidia")

-- Cursor
hl.env("HYPRCURSOR_SIZE", "24")
hl.env("XCURSOR_SIZE", "24")
hl.env("QT_CURSOR_SIZE", "24")

-- Qt theming
hl.env("QT_STYLE_OVERRIDE", "kvantum")
hl.env("QT_ICON_THEME", "Sweet-Rainbow")

-- GTK theming
hl.env("GTK_THEME", "Breeze-Dark")

-- KDE app menu prefix (fixes Dolphin "Open With" dialog)
hl.env("XDG_MENU_PREFIX", "arch-")

-- Electron Wayland
hl.env("ELECTRON_OZONE_PLATFORM_HINT", "auto")
