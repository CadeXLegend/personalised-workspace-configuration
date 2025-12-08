# start pl10k
# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
# end pl10k

# start cachyos
# this is here because I use cachyos and I like the configs it sets up
source /usr/share/cachyos-zsh-config/cachyos-config.zsh
# except for nyae autocorrect
# so, I turn off nyae autocorrect
unsetopt correct_all
# end cachyos

#start thefuck
eval $(thefuck --alias)
#end thefuck
