# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Path to Neovim
# export PATH="$PATH:/opt/nvim-linux64/bin"

# Path to dotnet tools
# export PATH="$HOME/.dotnet/tools:$PATH"

# Path to yarn
# export PATH="$PATH:$(yarn global bin)"

ZSH_THEME="powerlevel10k/powerlevel10k"

plugins=(git zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh

# aliases
alias ls='eza -L 1 -l --icons --no-permissions --no-user --no-time -T'
alias ls2='eza -L 2 -l --icons --no-permissions --no-user --no-time -T'
alias vim="nvim"
alias bat="batcat"
alias k8s="microk8s"
alias k="kubectl"

# general helpers
function giveme {
    sudo apt install $1
}

function obliterate {
    sudo apt remove $1
}

function preview {
    fzf --preview 'batcat --color=always {}'
}

# git aliases
function fnp {
	git fetch && git pull
}

function clone {
    local full_repo_name=$(repo $1)
	git clone $(cat ~/.custom/domain)/$full_repo_name.git
}

function cloned {
    local full_repo_name=$(repo $1)
	git clone git@github.com:$full_repo_name/$2.git
}

function repo {
    local selected_repo=$(gh search repos $1 --owner=$(cat ~/.custom/domain | cut -d ":" -f2) --archived=false --json name | \
        jq -r ".[] | select((.name | ascii_downcase) | contains(\"${1}\")) | .name" | \
        fzf --height 40% --reverse --info hidden --no-color --prompt '' --pointer '▶')

    if [[ -n "$selected_repo" ]]; then
        echo $selected_repo
    fi
}

function repod {
    local selected_repo=$(gh search repos $1 --owner=$2 --archived=false --json name | \
        jq -r ".[] | select((.name | ascii_downcase) | contains(\"${1}\")) | .name" | \
        fzf --height 40% --reverse --info hidden --no-color --prompt '' --pointer '▶')

    if [[ -n "$selected_repo" ]]; then
        echo $selected_repo
    fi
}

function repob {
    local selected_repo=$(gh search repos $1 --owner=$(cat ~/.custom/domain | cut -d ":" -f2) --archived=false --json name | \
        jq -r ".[] | select((.name | ascii_downcase) | contains(\"${1}\")) | .name" | \
        fzf --height 40% --reverse --info hidden --no-color --prompt '' --pointer '▶')

    if [[ -n "$selected_repo" ]]; then
        gh browse -R $(echo $(cat ~/.custom/domain)/$selected_repo.git)
    fi
}

function aptupdate {
	sudo apt update && sudo apt upgrade
}


# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh