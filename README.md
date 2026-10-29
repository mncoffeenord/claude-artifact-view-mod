# Artifact QuickView

A Claude Code mod (plugin id `artifact-view`) that lists your recently updated artifacts from
inside the chat, so you can reopen one without leaving the conversation.

- An **Artifacts ▸** toggle sits on the right of the footer under the message box.
- Clicking it opens a list above the message box: the 5 most recently updated artifacts, plus up to
  10 in all when they changed in the last 14 days.
- Click a title to open the artifact in the sidebar; click the 🌐 globe to open it in your web browser.
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

## Notes

- Opening a title in the sidebar relies on the desktop app's native handling of artifact links, so
  the sidebar behaviour is a desktop-app feature; in other front-ends a title opens in the browser.
- The mod API has no way to draw in the desktop Session Rail or top bar, so the list lives in the
  band above the message box, whose frame and height the app controls.

Author: mncoffeenord
