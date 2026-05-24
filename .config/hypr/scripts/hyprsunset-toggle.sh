#!/usr/bin/env bash
# toggle hyprsunset on/off, or cycle temperature presets
# usage: hyprsunset-toggle.sh [toggle|cycle|<temperature-k>]
#   no args: toggle between off and 4000K
#   toggle:  same as no args
#   cycle:   cycle through 4000K → 5000K → 6000K → 6500K → off
#   4000:    set explicit temperature in K

set -euo pipefail

HYPRSUNSET_BIN="hyprsunset"

# temperature presets (K)
declare -a TEMPS=(4000 5000 6000 6500)
DEFAULT_TEMP=4000

is_running() {
    pgrep -x "$HYPRSUNSET_BIN" > /dev/null 2>&1
}

get_current_temp() {
    # extract temperature from the running hyprsunset process command line
    if ! is_running; then
        echo "off"
        return
    fi
    local cmdline
    cmdline=$(ps -o args= -p "$(pgrep -x "$HYPRSUNSET_BIN" | head -1)" 2>/dev/null || true)
    if [[ "$cmdline" =~ -t[[:space:]]+([0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    elif [[ "$cmdline" =~ --temperature[[:space:]]+([0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "6500"  # default
    fi
}

start() {
    local temp="${1:-$DEFAULT_TEMP}"
    if is_running; then
        pkill -x "$HYPRSUNSET_BIN" || true
        sleep 0.1
    fi
    "$HYPRSUNSET_BIN" -t "$temp" &
    disown
}

stop() {
    if is_running; then
        pkill -x "$HYPRSUNSET_BIN" || true
    fi
}

toggle() {
    if is_running; then
        stop
        notify "hyprsunset: off"
    else
        start "$DEFAULT_TEMP"
        notify "hyprsunset: ${DEFAULT_TEMP}K"
    fi
}

cycle() {
    local current
    current=$(get_current_temp)

    # if off, start at first preset
    if [[ "$current" == "off" ]]; then
        start "${TEMPS[0]}"
        notify "hyprsunset: ${TEMPS[0]}K"
        return
    fi

    # find current temp index
    local idx=-1
    for i in "${!TEMPS[@]}"; do
        if [[ "${TEMPS[$i]}" == "$current" ]]; then
            idx=$i
            break
        fi
    done

    # if at last preset, turn off; otherwise advance
    if [[ $idx -ge $((${#TEMPS[@]} - 1)) ]]; then
        stop
        notify "hyprsunset: off"
    else
        local next="${TEMPS[$((idx + 1))]}"
        start "$next"
        notify "hyprsunset: ${next}K"
    fi
}

notify() {
    if command -v notify-send &>/dev/null; then
        notify-send -a hyprsunset -t 2000 "$1" 2>/dev/null || true
    fi
}

case "${1:-toggle}" in
    toggle)  toggle ;;
    cycle)   cycle ;;
    ''|*)    # if numeric, set explicit temp; otherwise toggle
        if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
            start "$1"
            notify "hyprsunset: ${1}K"
        else
            toggle
        fi
        ;;
esac
