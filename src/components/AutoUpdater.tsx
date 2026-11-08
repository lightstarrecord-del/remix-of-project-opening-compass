import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { decideUpdate } from '@/lib/updateCheck';

const CHECK_EVERY_MS = 60_000;
const TOAST_ID = 'site-update';

function isMediaPlaying(): boolean {
  return Array.from(document.querySelectorAll('audio, video')).some((el) => {
    const m = el as HTMLMediaElement;
    return !m.paused && !m.ended && !m.muted;
  });
}

async function fetchServerBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`/api/public/version?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { buildId?: string };
    return typeof data.buildId === 'string' ? data.buildId : null;
  } catch {
    return null;
  }
}

/**
 * Keeps every open tab on the newest published version: checks the server every minute
 * and when the tab comes back into view, then reloads. If a song or video is playing it
 * shows a message and reloads as soon as playback stops (or right away on "Update now").
 */
export default function AutoUpdater() {
  const reloading = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    const clientBuildId = __APP_BUILD_ID__;

    const reload = () => {
      if (reloading.current) return;
      reloading.current = true;
      toast.loading('Updating to the latest version…', { id: TOAST_ID });
      setTimeout(() => window.location.reload(), 600);
    };

    const check = async () => {
      if (reloading.current) return;
      const serverBuildId = await fetchServerBuildId();
      const decision = decideUpdate({
        clientBuildId,
        serverBuildId,
        mediaPlaying: isMediaPlaying(),
        tabHidden: document.visibilityState === 'hidden',
      });
      if (decision === 'reload') reload();
      if (decision === 'wait') {
        toast('A new version of the site is ready', {
          id: TOAST_ID,
          description: 'It will update when your song or video stops.',
          duration: Infinity,
          action: { label: 'Update now', onClick: reload },
        });
      }
    };

    // When something stops playing, re-check so a waiting update applies straight away.
    const onMediaStop = () => {
      setTimeout(() => {
        if (!isMediaPlaying()) void check();
      }, 300);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };

    const interval = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onVisible);
    document.addEventListener('pause', onMediaStop, true);
    document.addEventListener('ended', onMediaStop, true);
    void check();

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onVisible);
      document.removeEventListener('pause', onMediaStop, true);
      document.removeEventListener('ended', onMediaStop, true);
    };
  }, []);

  return null;
}
