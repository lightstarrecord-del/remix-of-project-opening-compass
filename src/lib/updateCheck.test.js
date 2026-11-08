import { describe, expect, test } from 'bun:test';
import { decideUpdate } from './updateCheck';

const base = { clientBuildId: 'old', mediaPlaying: false, tabHidden: false };

describe('decideUpdate', () => {
  test('same version on server: do nothing', () => {
    expect(decideUpdate({ ...base, serverBuildId: 'old' })).toBe('none');
  });

  test('server unreachable: do nothing', () => {
    expect(decideUpdate({ ...base, serverBuildId: null })).toBe('none');
  });

  test('new version and nothing playing: reload for everyone', () => {
    expect(decideUpdate({ ...base, serverBuildId: 'new' })).toBe('reload');
  });

  test('new version while a song plays on screen: wait for it to stop', () => {
    expect(decideUpdate({ ...base, serverBuildId: 'new', mediaPlaying: true })).toBe('wait');
  });

  test('new version while playing in a background tab: reload', () => {
    expect(
      decideUpdate({ ...base, serverBuildId: 'new', mediaPlaying: true, tabHidden: true }),
    ).toBe('reload');
  });
});
