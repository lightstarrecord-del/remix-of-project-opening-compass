export type UpdateDecision = 'none' | 'reload' | 'wait';

/**
 * Decide what an open tab should do after asking the server for its build id.
 * - Same id (or no answer): nothing to do.
 * - New id and nothing is playing: reload right away.
 * - New id while a song/video is playing and the tab is visible: wait, so playback isn't cut.
 *   A hidden tab reloads anyway — nobody is watching it.
 */
export function decideUpdate(input: {
  clientBuildId: string;
  serverBuildId: string | null | undefined;
  mediaPlaying: boolean;
  tabHidden: boolean;
}): UpdateDecision {
  const { clientBuildId, serverBuildId, mediaPlaying, tabHidden } = input;
  if (!serverBuildId || serverBuildId === clientBuildId) return 'none';
  if (mediaPlaying && !tabHidden) return 'wait';
  return 'reload';
}
