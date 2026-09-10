export type StageState = 'running' | 'paused' | 'retrying';
export interface Visibility {
  hidden(): boolean;
  subscribe(listener: () => void): () => void;
}
export const browserVisibility: Visibility = {
  hidden: () => typeof document !== 'undefined' && document.hidden,
  subscribe(listener) {
    if (typeof document === 'undefined') return () => {};
    document.addEventListener('visibilitychange',listener);
    return () => document.removeEventListener('visibilitychange',listener);
  },
};
class HiddenTab extends Error {}

// Wait without network traffic; cancellation still works while the tab is hidden.
function waitUntilVisible(signal: AbortSignal, visibility: Visibility): Promise<void> {
  signal.throwIfAborted();
  if (!visibility.hidden()) return Promise.resolve();
  return new Promise((resolve,reject) => {
    const finish = () => {
      if (!signal.aborted && visibility.hidden()) return;
      unsubscribe(); signal.removeEventListener('abort',finish);
      if (signal.aborted) reject(signal.reason); else resolve();
    };
    const unsubscribe = visibility.subscribe(finish);
    signal.addEventListener('abort',finish,{once:true});
    finish();
  });
}

// A pause restarts only the interrupted phase with a new warm-up. It is not a
// failed attempt: hidden time is excluded and completed phases remain intact.
export async function resilientStage<T>(signal: AbortSignal, work: (signal: AbortSignal) => Promise<T>,
  state: (state: StageState) => void, visibility: Visibility = browserVisibility): Promise<T> {
  let failures = 0;
  while (true) {
    if (visibility.hidden()) state('paused');
    await waitUntilVisible(signal,visibility);
    signal.throwIfAborted();
    const attempt = new AbortController();
    const abort = () => attempt.abort(signal.reason);
    const pause = () => {
      if (visibility.hidden()) { state('paused'); attempt.abort(new HiddenTab()); }
    };
    signal.addEventListener('abort',abort,{once:true});
    const unsubscribe = visibility.subscribe(pause);
    state(failures ? 'retrying' : 'running');
    pause();
    try {
      const result = await work(attempt.signal);
      attempt.signal.throwIfAborted();
      return result;
    } catch (error) {
      signal.throwIfAborted();
      if (attempt.signal.reason instanceof HiddenTab) continue;
      if (++failures > 1) throw error;
    } finally {
      unsubscribe(); signal.removeEventListener('abort',abort);
    }
  }
}
