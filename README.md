# personalised-workspace-configuration

A collection of customised configs that I spent time on and other workspace stuff for me to keep

> [!WARNING]
> Make sure to install oh-my-zsh, and p10k before copying these files or it won't work!

- [Installing oh-my-zsh](https://ohmyz.sh/#install)
- [Installing PowerLevel10k](https://github.com/romkatv/powerlevel10k?tab=readme-ov-file#oh-my-zsh)

## Installing Extensions

- [Installing EZA](https://github.com/eza-community/eza/blob/main/INSTALL.md)
- [Installing zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md)

# Awesome CLI Tools

- [NeoVIM](https://github.com/neovim/neovim/blob/master/INSTALL.md#linux)
- [FZF - super fast fuzzy finder](https://github.com/junegunn/fzf?tab=readme-ov-file#linux-packages)
- [bat - cat with in-terminal gui](https://github.com/sharkdp/bat)

## Issues with Snap .desktop apps after switching to Zsh

Move the .desktop apps to `/usr/share/applications/`
```bash
cd /var/lib/snapd/desktop/applications/
sudo cp *.desktop /usr/share/applications/
```
