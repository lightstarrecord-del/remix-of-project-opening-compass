export type UpdateDecision = 'none' | 'reload' | 'wait';

/**
 * Decide what an open tab should do after asking the server for its build id.
 * - Same id (or no answer): nothing to do.
 * - New id and the current song just finished: reload — a song boundary is a natural
 *   moment to switch, even if the next song has already started.
 * - New id while a song/video is playing and the tab is visible: wait, so playback isn't
 *   cut — but only up to maxWaitMs, after which the update is forced.
 * - New id with nothing playing, or in a hidden tab: reload right away.
 */
export function decideUpdate(input: {
  clientBuildId: string;
  serverBuildId: string | null | undefined;
  mediaPlaying: boolean;
  tabHidden: boolean;
  /** The song that was playing just finished. */
  songJustEnded?: boolean;
  /** How long this update has already been waiting, in ms. */
  waitedMs?: number;
  /** Longest an update may wait for playback before it is forced. */
  maxWaitMs?: number;
}): UpdateDecision {
  const {
    clientBuildId,
    serverBuildId,
    mediaPlaying,
    tabHidden,
    songJustEnded = false,
    waitedMs = 0,
    maxWaitMs = 120_000,
  } = input;

  if (!serverBuildId || serverBuildId === clientBuildId) return 'none';
  if (songJustEnded) return 'reload';
  if (mediaPlaying && !tabHidden) {
    return waitedMs >= maxWaitMs ? 'reload' : 'wait';
  }
  return 'reload';
}
