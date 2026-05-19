#!/usr/bin/env bash
# sweet-rainbow themed screen locker using swaylock-effects
# renders "type password to unlock" onto the screenshot via imagemagick

tmp=$(mktemp --suffix=.png)
grim "$tmp"
magick "$tmp" \
  -font /usr/share/fonts/Electroharmonix.otf -pointsize 32 -fill '#ffffff80' \
  -gravity center -annotate +0+160 "type password to unlock" \
  "$tmp"

swaylock \
  --image "$tmp" \
  --scaling fill \
  --effect-blur 7x2 \
  --effect-custom "$HOME/.config/swaylock/effects/polygon_wall.c" \
  --fade-in 0.3 \
  --indicator-radius 100 \
  --indicator-thickness 5 \
  --ring-color f8f8f240 \
  --ring-clear-color f8f8f240 \
  --ring-ver-color f8f8f240 \
  --ring-wrong-color aa222240 \
  --ring-caps-lock-color ffb86c40 \
  --inside-color 00000000 \
  --inside-clear-color 00000000 \
  --inside-ver-color 00000000 \
  --inside-wrong-color 00000000 \
  --inside-caps-lock-color 00000000 \
  --key-hl-color ffffffff \
  --bs-hl-color ffffffff \
  --caps-lock-key-hl-color ffb86cff \
  --caps-lock-bs-hl-color ff5555ff \
  --line-color bd93f920 \
  --line-clear-color bd93f918 \
  --line-ver-color bd93f930 \
  --line-wrong-color ff555530 \
  --line-caps-lock-color ffb86c30 \
  --text-color '#ffffffff' \
  --text-clear-color '#ffffffff' \
  --text-ver-color '#ffffffff' \
  --text-wrong-color '#ff5555ff' \
  --text-caps-lock-color '#ffb86cff' \
  --font "Electroharmonix" \
  --font-size 24 \
  --layout-bg-color 17142160 \
  --layout-border-color ff79c640 \
  --layout-text-color '#ffffffff' \
  --indicator-idle-visible \
  --show-failed-attempts \
  --ignore-empty-password \
  "$@"

rm -f "$tmp"
