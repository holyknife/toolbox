// Cloudflare HTTP measurements; ping is request latency, not an ICMP ping.
const ENDPOINT = 'https://speed.cloudflare.com';
export type Phase = 'ping' | 'download' | 'upload';
export interface Measurement { ping: number; download: number; upload: number }
export function median(values: number[]) { const sorted = [...values].sort((a,b) => a-b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; }
export function toMbps(bytes: number, milliseconds: number) { return bytes * 8 / Math.max(milliseconds, 1) / 1000; }
async function request(path: string, signal: AbortSignal, init?: RequestInit) {
  const response = await fetch(`${ENDPOINT}${path}`, { ...init, cache: 'no-store', signal });
  if (!response.ok) throw new Error(`The test server returned HTTP ${response.status}. Please try again.`);
  return response;
}
async function timed<T>(parent: AbortSignal, work: (signal: AbortSignal) => Promise<T>, timeout = 20000): Promise<T> {
  parent.throwIfAborted();
  const controller = new AbortController();
  const cancel = () => controller.abort(parent.reason);
  parent.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new Error('The test server took too long to respond. Please try again.')), timeout);
  try { return await work(controller.signal); } finally { clearTimeout(timer); parent.removeEventListener('abort', cancel); }
}
export async function measurePing(signal: AbortSignal) {
  const times: number[] = [];
  for (let i = 0; i < 6; i++) {
    await timed(signal, async s => { const start = performance.now(); const response = await request(`/__down?bytes=0&x=${Math.random()}`, s); await response.arrayBuffer(); times.push(performance.now() - start); });
  }
  return median(times);
}
export async function measureDownload(signal: AbortSignal, update: (value: number) => void, duration = 6000) {
  return timed(signal, async s => {
    const start = performance.now(); let bytes = 0; let lastUpdate = start;
    while (performance.now() - start < duration) {
      const response = await request(`/__down?bytes=25000000&x=${Math.random()}`, s);
      if (!response.body) throw new Error('Streaming downloads are unavailable in this browser.');
      const reader = response.body.getReader();
      try {
        while (true) {
          s.throwIfAborted();
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          const now = performance.now();
          if (now - lastUpdate >= 150) { update(toMbps(bytes, now - start)); lastUpdate = now; }
          if (now - start >= duration) break;
        }
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    }
    const result = toMbps(bytes, performance.now() - start); update(result); return result;
  });
}
export async function measureUpload(signal: AbortSignal, update: (value: number) => void, duration = 5000) {
  const chunk = new Blob([new Uint8Array(4 * 1024 * 1024)]);
  const start = performance.now(); let bytes = 0;
  while (performance.now() - start < duration) {
    await timed(signal, async s => { const response = await request('/__up', s, { method: 'POST', body: chunk }); await response.arrayBuffer(); });
    bytes += chunk.size; update(toMbps(bytes, performance.now() - start));
  }
  return toMbps(bytes, performance.now() - start);
}
export async function runSpeedTest(signal: AbortSignal, phase: (phase: Phase) => void, update: (value: number) => void, complete: (key: Phase, value: number) => void): Promise<Measurement> {
  phase('ping'); const ping = await measurePing(signal); complete('ping', ping);
  phase('download'); const download = await measureDownload(signal, update); complete('download', download);
  phase('upload'); const upload = await measureUpload(signal, update); complete('upload', upload);
  return { ping, download, upload };
}
