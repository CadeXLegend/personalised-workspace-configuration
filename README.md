# personalised-workspace-configuration
a collection of customised configs that I spent time on and other workspace stuff for me to keep

## Issues with Snap .desktop apps after switching to Zsh
Move the .desktop apps to `/usr/share/applications/`
```bash
cd /var/lib/snapd/desktop/applications/
sudo cp *.desktop /usr/share/applications/
```
