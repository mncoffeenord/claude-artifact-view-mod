import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { RecentArtifact } from '../types'

// Always the 5 newest; up to 10 when the extra ones changed in the last 14 days.
const MIN_COUNT = 5
const MAX_COUNT = 10
const RECENT_MS = 14 * 24 * 60 * 60 * 1000
const items = atom({ plugin: 'artifact-view', key: 'items' } as const, [])
const error = atom({ plugin: 'artifact-view', key: 'error' } as const, '')
const isOpen = atom({ plugin: 'artifact-view', key: 'isOpen' } as const, false)

// "3m", "2h", "4d" since the artifact was last updated.
function age(updatedAt?: string): string {
  if (!updatedAt) return ''
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(updatedAt)) / 60000))
  if (mins < 60) return `${mins}m`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`
  return `${Math.round(mins / 60 / 24)}d`
}

// The listing comes back most recently opened first, so take a wider page and sort by update time.
async function refresh($: EngineInterface) {
  const ran = await $.tool.call({ tool: 'Artifact', action: 'list', limit: 25 })
  const result = ran.result as { artifacts?: RecentArtifact[] } | undefined
  if (ran.deny || ran.isError || !result?.artifacts) {
    await update($, error, () => ran.deny ?? 'Could not list artifacts.')
    return
  }
  const list = result.artifacts
    .map(({ title, url, updatedAt }) => ({ title, url, updatedAt }))
    // Untitled entries are empty drafts the Artifacts page hides; leave them out here too.
    .filter(item => item.title.trim() !== '' && item.title.trim() !== 'Untitled')
    .sort((a, b) => Date.parse(b.updatedAt ?? '') - Date.parse(a.updatedAt ?? '') || 0)
    .filter((item, i) => i < MIN_COUNT || (i < MAX_COUNT && Date.now() - Date.parse(item.updatedAt ?? '') < RECENT_MS))
  await update($, items, () => list)
  await update($, error, () => '')
}

// Opening the list fetches it fresh; closing leaves the one-line toggle.
async function toggle($: EngineInterface) {
  const wasOpen = await read($, isOpen)
  await update($, isOpen, () => !wasOpen)
  if (!wasOpen) await refresh($)
}

// The desktop app opens any artifact link in its own sidebar, so the browser gets the URL from the OS:
// Windows first, then macOS, then Linux.
async function openInBrowser($: EngineInterface, url: string) {
  const openers = [['rundll32.exe', 'url.dll,FileProtocolHandler', url], ['open', url], ['xdg-open', url]]
  for (const argv of openers) {
    try {
      await $.process.run(argv)
      return
    } catch {
      // Not on this platform; try the next.
    }
  }
}


function clip(text: string, room: number): string {
  return text.length <= room ? text : `${text.slice(0, room - 1).trimEnd()}…`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    void refresh($)

    return next(e)
  })

  // Typing "recent artifacts" toggles the list too; the prompt is not sent.
  on('prompt.submit', async ($, e, next) => {
    if (!/^\/?recent[- ]artifacts\s*$/i.test(e.text.trim())) return next(e)
    await toggle($)

    return { drop: 'Toggled the recent artifacts list.' }
  })

  // A publish (or delete) anywhere in this session changes the list.
  on('tool.call', { tool: 'Artifact' }, async ($, e, next) => {
    const ran = await next(e)
    const action = (e as { action?: string }).action ?? 'publish'
    if (action === 'publish' || action === 'delete') void refresh($)

    return ran
  })

  // The list, above the message box, only while open: a closed list draws nothing there. Both links
  // are the mod's: a title opens in the sidebar, the ↗ in the system browser.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isOpen))) return next(e)
    const { Box, Text, Button, Markdown } = $.ui.resolve(e)
    const list = await read($, items)
    const problem = await read($, error)
    // A markdown link can't truncate itself, so the title is cut to the room the other columns leave.
    const titleRoom = Math.max(12, e.props.bodyColumns - 24)
    // Columns: the web icon and the title link sit together on the left, the age keeps a fixed width.
    const row = (key: string, web: JSX.Element, title: JSX.Element, when: JSX.Element) => (
      <Box key={key} flexDirection="row" columnGap="md">
        <Box width={4} flexShrink={0}>{web}</Box>
        <Box flexGrow={1} flexShrink={1} minWidth={0}>{title}</Box>
        <Box width={7} flexShrink={0} justifyContent="flex-end">{when}</Box>
      </Box>
    )

    return (
      <Box flexDirection="column" paddingX="md" rowGap="xs">
        {problem !== '' && <Text dimColor>{problem}</Text>}
        {problem === '' && list.length === 0 && <Text dimColor>No artifacts yet.</Text>}
        {list.length > 0 &&
          row(
            'head',
            <Text weight="semibold">Web</Text>,
            <Box flexDirection="row" columnGap="sm">
              <Text weight="semibold">Artifact</Text>
              <Button key="refresh" label="⟳" plain dimColor onPress={() => void refresh($)} />
            </Box>,
            <Text weight="semibold">Updated</Text>,
          )}
        {list.map((item, i) =>
          row(
            `row-${i}`,
            <Markdown
              key={`web-${i}`}
              text={`[🌐](${item.url}#web)`}
              onLinkPress={link => void openInBrowser($, link.href.replace(/#web$/, ''))}
            />,
            <Markdown
              key={`title-${i}`}
              text={`[${clip(item.title.replace(/[[\]]/g, ''), titleRoom)}](${item.url})`}
            />,
            <Text dimColor tabular>{age(item.updatedAt)}</Text>,
          ),
        )}
      </Box>
    )
  })

  // The one-click toggle, on the right of the footer under the message box, after the app's own modes.
  on('ui.render', { component: 'SessionMode' }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const open = await read($, isOpen)

    return (
      <Box flexDirection="row" columnGap="md">
        {e.props.modes.length > 0 && <Text dimColor>{e.props.modes.join(' & ')}</Text>}
        <Button key="toggle" label={open ? 'Artifacts ▾' : 'Artifacts ▸'} plain dimColor onPress={() => void toggle($)} />
      </Box>
    )
  })
}
