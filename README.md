# artifact-view

A Claude Code mod that lists your recently updated artifacts from inside the chat.

- An **Artifacts ▸** toggle sits on the right of the footer under the message box.
- Clicking it opens a list above the message box: the 5 most recently updated artifacts, plus up to
  10 in all when they changed in the last 14 days.
- Click a title to open the artifact in the sidebar; click ↗ to open it in your web browser.
- The list refreshes when a session starts, each time you open it, when the session publishes or
  deletes an artifact, and from the ⟳ next to the header.
- Typing `recent artifacts` at the prompt toggles it too.

## Install

At the prompt of a terminal session:

```
/plugin install artifact-view --marketplace mncoffeenord/claude-artifact-view-mod
```

From a shell:

```bash
claude plugin install artifact-view --marketplace mncoffeenord/claude-artifact-view-mod
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins,
Add marketplace with `mncoffeenord/claude-artifact-view-mod`, then Add plugin.

This repository is private: installing needs read access on GitHub and a git credential for
github.com on the machine (an SSH key, or `gh auth login` then `gh auth setup-git`).

## Limits

The mod API has no way to draw in the desktop Session Rail or top bar, so the list lives in the
band above the message box, whose frame and height the app controls.

Author: mncoffeenord
