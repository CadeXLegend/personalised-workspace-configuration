#!/usr/bin/env bash
# Resize the active floating window to fill the focused monitor
# with a 0.5% inset so rounded corners don't clip at screen edges.
# Uses Lua dispatch syntax (required for Hyprland 0.55+ Lua config).

set -euo pipefail

read -r mon_w mon_h < <(
    hyprctl monitors -j | jq -r '.[] | select(.focused==true) | "\(.width) \(.height)"'
)

# 0.2% inset on each side (0.4% total reduction)
inset=$(( mon_w * 2 / 1000 ))  # 0.2% of width
w=$(( mon_w - inset * 2 ))
h=$(( mon_h - inset * 2 ))

hyprctl dispatch "hl.dsp.window.resize({x=${w},y=${h}})"
hyprctl dispatch "hl.dsp.window.move({x=${inset},y=${inset}})"
