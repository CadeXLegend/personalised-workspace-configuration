# custom commands inside block start and block end
# so we can list them with the funcs function

### BLOCK START

# git alias for fetch and pull
function fnp {
	git fetch && git pull
}

# git alias for git reset hard origin/<currentbranchname>
function gitrh {
    currentbranch=$(git rev-parse --abbrev-ref HEAD)
    git reset --hard origin/$currentbranch
}

# clone a repo based on the domain provided in ~/.custom/domain
function clone {
  local full_repo_name=$(repo $1)
	git clone $(cat ~/.custom/domain)/$full_repo_name.git
}

# clone a repo based on a domain provided in the input
function cloned {
  local full_repo_name=$(repod $1 $2)
  git clone git@github.com:$1/$full_repo_name.git
}

# Opens a local repo/folder in VSCode based on a fuzzy search in the path defined in the ~/.custom/orf file
function orf() {
  local search_term="$1"
  local search_dir=$(readlink -f "${HOME}${$(cat ~/.custom/orf)}")

  local results
  results=($(find "$search_dir" -mindepth 1 -maxdepth 2 -type d -iname "*${search_term}*" 2>/dev/null))

  if (( ${#results[@]} == 0 )); then
    echo "No matches found for '${search_term}' in $search_dir."
    return 1
  fi

  if (( ${#results[@]} == 1 )); then
    code "${results[1]}" & disown
    exit
  fi

  local selected
  selected=$(printf '%s\n' "${results[@]}" | fzf --height 40% --reverse --info hidden --prompt '' --pointer '▶')
  if [[ -n "$selected" ]]; then
    code "$selected" & disown
    exit
  fi
}

# get a repo based on input provided and a custom domain specified in the file ~/.custom/domain
function repo {
    local selected_repo=$(gh search repos $1 --owner=$(cat ~/.custom/domain | cut -d ":" -f2) --archived=false --json name | \
        jq -r ".[] | select((.name | ascii_downcase) | contains(\"${1}\")) | .name" | \
        fzf --height 40% --reverse --info hidden --no-color --prompt '' --pointer '▶')

    if [[ -n "$selected_repo" ]]; then
        echo $selected_repo
    fi
}

# Get a repo based on input provided: $1 is the owner - $2 is the repo name
function repod {
    local selected_repo=$(gh search repos $2 --owner=$1 --archived=false --json name | \
        jq -r ".[] | select((.name | ascii_downcase) | contains(\"${2}\")) | .name" | \
        fzf --height 40% --reverse --info hidden --no-color --prompt '' --pointer '▶')

    if [[ -n "$selected_repo" ]]; then
        echo $selected_repo
    fi
}

# browse a repo
function repob {
    local selected_repo=$(gh search repos $1 --owner=$(cat ~/.custom/domain | cut -d ":" -f2) --archived=false --json name | \
        jq -r ".[] | select((.name | ascii_downcase) | contains(\"${1}\")) | .name" | \
        fzf --height 40% --reverse --info hidden --no-color --prompt '' --pointer '▶')

    if [[ -n "$selected_repo" ]]; then
        gh browse -R $(echo $(cat ~/.custom/domain)/$selected_repo.git)
    fi
}

# go to commonly used folders
function goto() {
    case $1 in
        dev)
            cd ~/dev
            ;;
        docs)
            cd ~/Documents
            ;;
        tmp)
            cd ~/dev/tmp
            ;;
        py)
            cd ~/dev/python
            ;;
        js)
            cd ~/dev/js
            ;;
        csharp)
            cd ~/dev/csharp
            ;;
        dl)
            cd ~/Downloads
            ;;
        local)
            cd ~/dev/local-setup
            ;;
        *)
            echo "Unknown directory: $1"
            return 1
            ;;
    esac
}

# encode uri/url
function escape() {
  node -p "encodeURIComponent('$1')"
}

# validate json
function vj() {
  result=$(jq empty < "$1" 2>&1)
  if [[ $result == *"parse error"* ]]; then
    line_number=$(echo "$result" | grep -oP 'line \K\d+')
    column_number=$(echo "$result" | grep -oP 'column \K\d+')
    start=$((line_number - 3))
    end=$((line_number + 3))

    RED='\033[0;31m'
    NC='\033[0m'

    sed -n "${start},${end}p" "$1" |
    while IFS= read -r line; do
      current_line=$((start++))
      if [ "$current_line" -eq "$line_number" ]; then
        printf "${RED}%4d: %s${NC}\n" "$current_line" "$line"
        printf "${RED}     %*s^${NC}\n" "$((column_number - 1))" ""
      else
        printf "%4d: %s\n" "$current_line" "$line"
      fi
    done

    echo "$result"
  else
    echo "JSON is valid"
  fi
}

# reload the shell quickly
function reload() {
    source ~/.zshrc
}

# repeat the last command
function replay() {
    if [[ $(fc -ln -1) = "replay" ]]; then
        echo "infinite loop detected, stopping"
    elif [[ $(fc -ln -1) = "devreplay" ]]; then
        echo "infinite loop detected, stopping"
    else
        eval '$(fc -ln -1)'
    fi
}

# reload the shell and then repeat the last command
function devreplay() {
    if [[ $(fc -ln -1) = "replay" ]]; then
        echo "infinite loop detected, stopping"
    elif [[ $(fc -ln -1) = "devreplay" ]]; then
        echo "infinite loop detected, stopping"
    elif [[ $(fc -ln -1) = "reload" ]]; then
        echo "infinite loop detected, stopping"
    else
        reload
        eval '$(fc -ln -2 | head -n 1)'
    fi
}

# pretty print json
function json() {
    nu -c "cat $1 | from json"
}

# render space delimited table with nushell
function table() {
    nu -c "$1 | from ssv"
}

# search for any emoji using words and get matching emojis back
function emoji() {
    bash ~/.custom/scripts/emoji_selector.sh $1
}

# get all http statuses
function httpstatus() {
    bash ~/.custom/scripts/http_status.sh
}

# open zsh customisation files; use zedit help to get a list of available inputs
function zedit() {
    case $1 in
        help)
            echo "Available inputs:"
            echo " - funcs"
            echo " - aliases"
            echo " - exports"
            echo " - plugins"
            echo " - extras"
            echo
            echo "Not providing an input will open the .zshrc file"
            ;;
        funcs)
            code ~/.custom/zshrc/functions.zsh
            ;;
        aliases)
            code ~/.custom/zshrc/aliases.zsh
            ;;
        exports)
            code ~/.custom/zshrc/exports.zsh
            ;;
        plugins)
            code ~/.custom/zshrc/plugins_extras.zsh
            ;;
        extras)
            code ~/.custom/zshrc/plugins_extras.zsh
            ;;
        *)
            code ~/.zshrc
            ;;
    esac
}

# extract a markdown section from all markdown files in the current directory and subdirectories
smdr() {
  local heading="$1"
  local file section
  while IFS= read -r file; do
    section=$(mdr "$heading" "$file")
    if [[ -n "${section//[[:space:]]/}" ]]; then
      echo "=== File: $file ==="
      echo "$section"
      echo
    fi
  done < <(find . -type f)
}

# extract a markdown section from a specified markdown file
function mdr() {
    local heading="$1"
    local readme_with_path="$2"

    md_section=$(awk -v h="$heading" -f - "$readme_with_path" <<'AWK_SCRIPT'
        function count_hashes(line) {
        if (match(line, /^#+/))
            return RLENGTH
        return 0
        }
        {
        if ($0 ~ "^#+[[:space:]]*" h "[[:space:]]*$") {
            level = count_hashes($0)
            flag = 1
            next
        }
        if (flag && match($0, /^#+/)) {
            current_level = RLENGTH
            if (current_level <= level)
            exit
        }
        if (flag)
            print
        }
AWK_SCRIPT
)

    local clean_var="${md_section//\#/}"
    clean_var="${clean_var#"${clean_var%%[![:space:]]*}"}"
    clean_var="${clean_var%"${clean_var##*[![:space:]]}"}"
    echo "$clean_var"
}

# list all custom scripts
function scripts() {
  ls ~/.custom/scripts | awk '{ print $NF }' | sed '1d' | sed 's/.sh//' | sed 's/^/• /'
}

# list all my custom aliases
function aliases() {
  data_file="/tmp/aliases.csv"

  awk '
    BEGIN {
      print "alias,command,description"
    }
    /### BLOCK START/ {flag=1; next}
    /### BLOCK END/ {flag=0}
    flag && /^#/ {
      desc=substr($0, index($0, $2));
      gsub(/,/, "\\,", desc);  # Escape commas in description
      next
    }
    flag && /^alias / {
      split($0, arr, "=");
      alias_name=substr(arr[1], 7);
      command=substr($0, index($0, "=") + 1);
      gsub(/,/, "\\,", command);  # Escape commas in command
      print alias_name "," command "," desc
    }
  ' ~/.custom/zshrc/aliases.zsh > "$data_file"

  nu -c "open $data_file --raw | from csv --flexible | table -e --theme rounded -i false"
}

# list all my custom functions
function funcs() {
  data_file="/tmp/functions.csv"

  awk '
    BEGIN {
      print "function,description"
    }
    /### BLOCK START/ {flag=1; next}
    /### BLOCK END/ {flag=0}
    flag && /^#/ {
      desc=substr($0, index($0, $2));
      gsub(/,/, "\\,", desc);  # Escape commas in description
      next
    }
    flag && /^function / {
      gsub(/\(\)/, "", $2);
      print $2 "," desc
    }
  ' ~/.custom/zshrc/functions.zsh > "$data_file"

  nu -c "open $data_file --raw | from csv --flexible | table -e --theme rounded -i false"
}
### BLOCK END
