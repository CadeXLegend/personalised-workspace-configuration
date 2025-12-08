# Custom

> [!INFO]
> This should live in your Home folder for your user

This folder is used for customising my setup, hence `custom`; custom solutions

For now it is divided into specific regions:

- scripts
- zshrc
- non-folder config files

## Scripts

The scripts folder is for plug-n-play `.sh` scripts that we want transportable and not connected to zsh

## Zshrc

The zshrc folder is for everything `zsh`

Currently it follows a compositional/modular design pattern

## Misc Files

### Domain

The `domain` file is used for the `clone` function that lets you clone from a pre-defined repo without needing to do:

```bash
repod CadeXLegend personalised
```

When you're using the configured domain, you can just do:

```bash
repo personalised
```

### Orf

This is a tool I made for quick-launching `vscode` with organised folders

You can define the folder name you want it to operate from in the `orf` folder

So for example:

```bash
orf personal
```

Will open this repo for me in `vscode` and will automatically close the terminal
