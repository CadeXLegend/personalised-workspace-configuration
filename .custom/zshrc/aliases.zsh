# Aliases - you can view all aliases by running `alias` in the terminal
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# return back to the previous directory before the last cd
alias back='cd -'

# overrides ls to provide a customised directory view
alias ls='eza -L 1 -l --icons --no-permissions --no-user --no-time -T'

# upgrades everything with pacman
alias upgrade='sudo pacman -Syu'

# remove a pacman package along with its dependencies and config files
alias remove='sudo pacman -Rsn'

# cleanup orphaned packages
alias cleanup="sudo pacman -Rsn $(pacman -Qtdq)"

# display system information
alias sysinf='fastfetch'

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
