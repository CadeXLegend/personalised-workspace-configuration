-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃                   Curves & Animations                       ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

hl.curve("overshot", { type = "bezier", points = { {0.13, 0.99}, {0.29, 1.1} } })

hl.animation({ leaf = "windowsIn",    enabled = false })
hl.animation({ leaf = "windowsOut",   enabled = true, speed = 3,   bezier = "default",  style = "popin 80%" })
hl.animation({ leaf = "windowsMove",  enabled = true, speed = 3,   bezier = "default" })
hl.animation({ leaf = "border",       enabled = true, speed = 3,   bezier = "default" })
hl.animation({ leaf = "workspacesIn", enabled = true, speed = 3,   bezier = "overshot", style = "slide" })
hl.animation({ leaf = "workspacesOut",enabled = true, speed = 3,   bezier = "overshot", style = "slidefade 80%" })
