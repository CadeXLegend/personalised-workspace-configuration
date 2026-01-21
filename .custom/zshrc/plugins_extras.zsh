# cachyos
# this is here because I use cachyos and I like the configs it sets up
# however since it uses pl10k and I've transitioned to starship
# I don't want everything cachyos sets up
# so I might end up cherry picking what I want from their zsh config
# and not use it anymore in the future
source /usr/share/cachyos-zsh-config/cachyos-config.zsh
# I turn off nyae autocorrect cause I don't like it
unsetopt correct_all
# cachyos end

# evals
eval $(thefuck --alias)
eval "$(starship init zsh)"
# evals end
