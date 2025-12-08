# in case we use snap apps
snap_other_path="/var/lib/snapd/snap/bin"
snap_bin_path="/snap/bin"
if [ -n "${PATH##*${snap_bin_path}}" -a -n "${PATH##*${snap_bin_path}:*}" ]; then
    export PATH=$PATH:${snap_bin_path}
    export PATH=$PATH:${snap_other_path}
fi
# end snap apps section

# pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

export PATH="$PNPM_HOME:$PATH"
export NODE_PATH="$PNPM_HOME/global/5/node_modules:$NODE_PATH"
# pnpm end

# nvm
export NVM_DIR="$HOME/.nvm"
[[ -s /usr/share/nvm/nvm.sh ]] && source /usr/share/nvm/nvm.sh
# nvm end

# snap path
export PATH=/var/lib/snapd/snap/bin:$PATH
# end snap path
