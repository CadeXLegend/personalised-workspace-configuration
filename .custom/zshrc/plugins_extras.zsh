# Shell Configuration
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export HISTCONTROL=ignorebothore 
export HISTIGNORE="&:[bf]g:c:clear:history:exit:q:pwd:* --help"
export PROMPT_COMMAND="history -a; $PROMPT_COMMAND"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


# Evals
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

eval $(thefuck --alias)
eval "$(starship init zsh)"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Load Plugins
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
source /usr/share/zsh/plugins/zsh-history-substring-search/zsh-history-substring-search.zsh

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
