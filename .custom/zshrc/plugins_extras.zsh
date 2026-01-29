# Shell Configuration
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# gonna keep importing the config for now because I tried
# extracting only the parts I wanted, however it isn't
# working the same as the cachy config, what wizardry
# have they done to make it work the way it does?!
source /usr/share/cachyos-zsh-config/cachyos-config.zsh

unsetopt correct_all # don't want nyaeh autocomplete
# you'd think this'd preserve the multi-term history but nooooo
# for some reason they do some other shenanigans to make it work
# and I don't as of yet know what that is, I've only read
# so much of their config, and I think they do some stuff that
# I either missed, or is stored somewhere other than their zsh config
# export HISTCONTROL=ignorebothore 
# export HISTIGNORE="&:[bf]g:c:clear:history:exit:q:pwd:* --help"
# export PROMPT_COMMAND="history -a; $PROMPT_COMMAND"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Evals
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

eval $(thefuck --alias)
eval "$(starship init zsh)"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Load Plugins
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# commented these out for now since I'm using the cachyos config
# these were an attempt to take only the parts I wanted from it
# however there's still stuff missing
# source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
# source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
# source /usr/share/zsh/plugins/zsh-history-substring-search/zsh-history-substring-search.zsh

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
