#!/usr/bin/env bash
# Snap the active floating window to a monitor edge, half, or quarter.
# A 0.2% inset on each side prevents rounded corner clipping at screen edges
# and leaves a gutter between windows that share an edge.
# Usage: snap.sh left|right|top|bottom|top-left|top-right|bottom-left|bottom-right
# Uses Lua dispatch syntax (required for Hyprland 0.55+ Lua config).

set -euo pipefail

dir="${1:?Usage: snap.sh left|right|top|bottom|top-left|top-right|bottom-left|bottom-right}"

read -r mon_w mon_h < <(
    hyprctl monitors -j | jq -r '.[] | select(.focused==true) | "\(.width) \(.height)"'
)

# 0.2% inset on each side (0.4% total reduction)
inset=$(( mon_w * 2 / 1000 ))
half_w=$(( mon_w / 2 ))
half_h=$(( mon_h / 2 ))

# origin_x/origin_y are the top-left corner of the target cell, cell_w/cell_h its size
case "$dir" in
    left)         origin_x=0       origin_y=0       cell_w=$half_w cell_h=$mon_h  ;;
    right)        origin_x=$half_w origin_y=0       cell_w=$half_w cell_h=$mon_h  ;;
    top)          origin_x=0       origin_y=0       cell_w=$mon_w  cell_h=$half_h ;;
    bottom)       origin_x=0       origin_y=$half_h cell_w=$mon_w  cell_h=$half_h ;;
    top-left)     origin_x=0       origin_y=0       cell_w=$half_w cell_h=$half_h ;;
    top-right)    origin_x=$half_w origin_y=0       cell_w=$half_w cell_h=$half_h ;;
    bottom-left)  origin_x=0       origin_y=$half_h cell_w=$half_w cell_h=$half_h ;;
    bottom-right) origin_x=$half_w origin_y=$half_h cell_w=$half_w cell_h=$half_h ;;
    *)
        echo "Unknown direction: $dir" >&2
        exit 1
        ;;
esac

hyprctl dispatch "hl.dsp.window.resize({x=$(( cell_w - inset * 2 )),y=$(( cell_h - inset * 2 ))})"
hyprctl dispatch "hl.dsp.window.move({x=$(( origin_x + inset )),y=$(( origin_y + inset ))})"
