export type RecentArtifact = { title: string; url: string; updatedAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'artifact-view': { items: RecentArtifact[]; error: string; isOpen: boolean }
  }
}
