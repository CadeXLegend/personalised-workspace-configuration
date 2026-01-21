# Exports
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# snap
snap_other_path="/var/lib/snapd/snap/bin"
snap_bin_path="/snap/bin"
if [ -n "${PATH##*${snap_bin_path}}" -a -n "${PATH##*${snap_bin_path}:*}" ]; then
    export PATH=$PATH:${snap_bin_path}
    export PATH=$PATH:${snap_other_path}
    export PATH=/var/lib/snapd/snap/bin:$PATH
fi
# snap end

# pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
export NODE_PATH="$PNPM_HOME/global/5/node_modules:$NODE_PATH"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$NODE_PATH$PATH" ;;
esac
# pnpm end

# winapps
export PATH=$HOME/.local/bin:$PATH
# winapps end

# nvm
export NVM_DIR="$HOME/.nvm"
[[ -s /usr/share/nvm/nvm.sh ]] && source /usr/share/nvm/nvm.sh
# nvm end

# starship
export STARSHIP_CONFIG=~/.custom/configs/starship.toml
# starship end

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -