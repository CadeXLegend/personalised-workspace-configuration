#!/usr/bin/env bash
# Snap the active floating window to a monitor edge/half.
# A 0.5% inset prevents rounded corner clipping at screen edges.
# Usage: snap.sh left|right|top|bottom
# Uses Lua dispatch syntax (required for Hyprland 0.55+ Lua config).

set -euo pipefail

dir="${1:?Usage: snap.sh left|right|top|bottom}"

read -r mon_w mon_h < <(
    hyprctl monitors -j | jq -r '.[] | select(.focused==true) | "\(.width) \(.height)"'
)

# 0.2% inset on each side (0.4% total reduction)
inset=$(( mon_w * 2 / 1000 ))

case "$dir" in
    right)
        half_w=$(( mon_w / 2 ))
        w=$(( half_w - inset * 2 ))
        h=$(( mon_h - inset * 2 ))
        hyprctl dispatch "hl.dsp.window.resize({x=${w},y=${h}})"
        hyprctl dispatch "hl.dsp.window.move({x=$(( half_w + inset )),y=${inset}})"
        ;;
    left)
        half_w=$(( mon_w / 2 ))
        w=$(( half_w - inset * 2 ))
        h=$(( mon_h - inset * 2 ))
        hyprctl dispatch "hl.dsp.window.resize({x=${w},y=${h}})"
        hyprctl dispatch "hl.dsp.window.move({x=${inset},y=${inset}})"
        ;;
    top)
        half_h=$(( mon_h / 2 ))
        w=$(( mon_w - inset * 2 ))
        h=$(( half_h - inset * 2 ))
        hyprctl dispatch "hl.dsp.window.resize({x=${w},y=${h}})"
        hyprctl dispatch "hl.dsp.window.move({x=${inset},y=${inset}})"
        ;;
    bottom)
        half_h=$(( mon_h / 2 ))
        w=$(( mon_w - inset * 2 ))
        h=$(( half_h - inset * 2 ))
        hyprctl dispatch "hl.dsp.window.resize({x=${w},y=${h}})"
        hyprctl dispatch "hl.dsp.window.move({x=${inset},y=$(( half_h + inset ))})"
        ;;
    *)
        echo "Unknown direction: $dir" >&2
        exit 1
        ;;
esac
