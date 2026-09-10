const ENDPOINT = 'https://speed.cloudflare.com';

// Each request gets a unique URL and bypasses cache; reuse the same server origin.
function endpoint(path: string) { return `${ENDPOINT}${path}&x=${crypto.randomUUID()}`; }

// Always clean up the timeout and parent listener, including failed body reads.
async function timed<T>(signal: AbortSignal, work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  signal.throwIfAborted();
  const request = new AbortController();
  const abort = () => request.abort(signal.reason);
  signal.addEventListener('abort',abort,{once:true});
  const timeout = setTimeout(() => request.abort(new Error('The server took too long to respond.')),20000);
  try { return await work(request.signal); }
  finally { clearTimeout(timeout); signal.removeEventListener('abort',abort); }
}

// Resource Timing excludes DNS/TCP/TLS setup when the server exposes timing.
// Otherwise explicitly fall back to elapsed HTTP time on the warmed connection.
export function latencyFromTiming(entry: Pick<PerformanceResourceTiming,'requestStart' | 'responseStart'> | undefined, elapsed: number) {
  if (entry && entry.requestStart > 0 && entry.responseStart > entry.requestStart) {
    return { milliseconds:entry.responseStart - entry.requestStart, timing:'resource' as const };
  }
  return { milliseconds:elapsed, timing:'warmed-http' as const };
}

export async function pingRequest(signal: AbortSignal) {
  return timed(signal,async current => {
    const url = endpoint('/__down?bytes=0');
    const started = performance.now();
    const response = await fetch(url,{signal:current,cache:'no-store'});
    if (!response.ok) throw new Error(`The test server returned HTTP ${response.status}.`);
    await response.arrayBuffer();
    current.throwIfAborted();
    const entry = performance.getEntriesByName(url,'resource').at(-1) as PerformanceResourceTiming | undefined;
    return latencyFromTiming(entry,performance.now() - started);
  });
}

// Random payloads prevent compression of zero-filled data from inflating upload.
function randomPayload(size: number) {
  const bytes = new Uint8Array(size);
  for (let offset = 0; offset < size; offset += 65536) crypto.getRandomValues(bytes.subarray(offset,offset + 65536));
  return new Blob([bytes],{type:'application/octet-stream'});
}

// Download progress is actual body bytes; truncated responses invalidate the phase.
async function download(size: number, signal: AbortSignal, progress: (bytes: number) => void) {
  const response = await fetch(endpoint(`/__down?bytes=${size}`),{signal,cache:'no-store'});
  if (!response.ok) throw new Error(`The test server returned HTTP ${response.status}.`);
  if (!response.body) throw new Error('This browser cannot stream the test download.');
  const reader = response.body.getReader();
  let received = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      if (chunk.done) break;
      received += chunk.value.byteLength;
      progress(received);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  if (received !== size) throw new Error('The download was incomplete or modified.');
}

// XHR exposes upload progress for the gauge. Those bytes are provisional until
// the server acknowledges the request; only acknowledged payloads enter results.
function upload(payload: Blob, signal: AbortSignal, progress: (bytes: number) => void): Promise<void> {
  if (typeof XMLHttpRequest === 'undefined') throw new Error('This browser does not support upload progress.');
  return new Promise((resolve,reject) => {
    const request = new XMLHttpRequest();
    const abort = () => { request.abort(); finish(signal.reason); };
    const finish = (error?: unknown) => {
      signal.removeEventListener('abort',abort);
      request.onload = request.onerror = request.onabort = null;
      request.upload.onprogress = null;
      if (error) reject(error); else resolve();
    };
    request.open('POST',endpoint('/__up?upload=1'));
    request.upload.onprogress = event => progress(Math.min(event.loaded,payload.size));
    request.onload = () => request.status >= 200 && request.status < 300
      ? finish() : finish(new Error(`The upload server returned HTTP ${request.status}.`));
    request.onerror = () => finish(new Error('Could not reach the upload server. Check your connection or content blocker.'));
    request.onabort = () => finish(signal.reason || new DOMException('Cancelled','AbortError'));
    signal.addEventListener('abort',abort,{once:true});
    if (signal.aborted) abort();
    else { try { request.send(payload); } catch (error) { finish(error); } }
  });
}

// Allocation is outside request timing but inside the round's total wall time.
export async function transfer(direction: 'download' | 'upload', size: number, signal: AbortSignal, progress: (bytes: number) => void) {
  signal.throwIfAborted();
  const payload = direction === 'upload' ? randomPayload(size) : null;
  return timed(signal,async current => {
    const start = performance.now();
    if (payload) await upload(payload,current,progress); else await download(size,current,progress);
    current.throwIfAborted();
    return {bytes:size,milliseconds:performance.now() - start};
  });
}
