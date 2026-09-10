// Cloudflare HTTP throughput, not an ISP plan check or an ICMP ping.
// Method v2: warm up, measure three sustained rounds, then report their median.
// Full request/body time is included; no latency subtraction or plan-speed cap.
const ENDPOINT = 'https://speed.cloudflare.com';
const ROUNDS = 3;
const ROUND_DURATION = 6000;
export type Phase = 'ping' | 'download' | 'upload';
export interface SpeedRange { min: number; max: number }
export interface Measurement {
  ping: number; download: number; upload: number;
  jitter?: number; downloadLatency?: number; uploadLatency?: number;
  downloadRange?: SpeedRange; uploadRange?: SpeedRange;
  method?: 'sustained-v2';
}
interface DirectionResult { speed: number; range: SpeedRange; loadedLatency?: number }

// A median describes a typical round rather than picking the fastest burst.
export function median(values: number[]) {
  if (!values.length || values.some(value => !Number.isFinite(value))) throw new Error('Not enough valid measurements. Please try again.');
  const sorted = [...values].sort((a,b) => a-b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Mbps uses decimal megabits. Reject unusable timing instead of inventing a duration.
export function toMbps(bytes: number, milliseconds: number) {
  if (!Number.isFinite(bytes) || bytes < 0 || !Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error('The browser could not provide reliable timing. Please try again.');
  return bytes * 8 / milliseconds / 1000;
}

// Report the observed spread, not a statistical confidence interval.
export function summarizeRounds(rounds: number[]) {
  return { speed:median(rounds), range:{min:Math.min(...rounds),max:Math.max(...rounds)} };
}

// Mean change between adjacent latency probes describes variation in response time.
export function jitter(times: number[]) {
  if (times.length < 2) return 0;
  return times.slice(1).reduce((sum,time,index) => sum + Math.abs(time - times[index]),0) / (times.length - 1);
}

// Target roughly 750 ms per transfer, bounded to avoid tiny or excessive requests.
export function nextPayloadSize(bytes: number, milliseconds: number) {
  if (milliseconds <= 0) return bytes;
  return Math.min(25000000,Math.max(64000,Math.round(bytes * 750 / milliseconds)));
}

// Disable cache reuse and distinguish every request, including upload requests.
async function request(path: string, signal: AbortSignal, init?: RequestInit) {
  const response = await fetch(`${ENDPOINT}${path}`, { ...init, cache:'no-store', signal });
  if (!response.ok) throw new Error(`The test server returned HTTP ${response.status}. Please try again.`);
  return response;
}

// Link each request to cancellation and a deadline; always remove timers/listeners.
async function timed<T>(parent: AbortSignal, work: (signal: AbortSignal) => Promise<T>, timeout = 20000): Promise<T> {
  parent.throwIfAborted();
  const controller = new AbortController();
  const cancel = () => controller.abort(parent.reason);
  parent.addEventListener('abort',cancel,{once:true});
  const timer = setTimeout(() => controller.abort(new Error('The test server took too long to respond. Please try again.')),timeout);
  try { return await work(controller.signal); }
  finally { clearTimeout(timer); parent.removeEventListener('abort',cancel); }
}

// HTTP latency includes the response body and server time, consistently in all phases.
async function latencyProbe(signal: AbortSignal) {
  return timed(signal,async current => {
    const start = performance.now();
    const response = await request(`/__down?bytes=0&x=${Math.random()}`,current);
    await response.arrayBuffer();
    return performance.now() - start;
  });
}

// Discard connection setup before measuring ten unloaded probes.
async function unloadedLatency(signal: AbortSignal) {
  await latencyProbe(signal);
  const points: number[] = [];
  for (let index = 0; index < 10; index++) points.push(await latencyProbe(signal));
  return { ping:median(points), jitter:jitter(points) };
}
export async function measurePing(signal: AbortSignal) { return (await unloadedLatency(signal)).ping; }

// Fill in 64 KiB pieces because getRandomValues has a per-call byte limit.
// Random data avoids misleading gains from any intermediary payload compression.
function uploadPayload(size: number): Blob {
  const bytes = new Uint8Array(size);
  for (let offset = 0; offset < size; offset += 65536) crypto.getRandomValues(bytes.subarray(offset,Math.min(offset + 65536,size)));
  return new Blob([bytes]);
}

// Only fully received downloads and acknowledged uploads count toward throughput.
async function transfer(direction: 'download' | 'upload', size: number, signal: AbortSignal) {
  signal.throwIfAborted();
  const payload = direction === 'upload' ? uploadPayload(size) : undefined;
  return timed(signal,async current => {
    const start = performance.now();
    const response = await request(direction === 'download' ? `/__down?bytes=${size}&x=${Math.random()}` : `/__up?x=${Math.random()}`,current,
      payload ? {method:'POST',body:payload} : undefined);
    let received = 0;
    if (direction === 'download') {
      if (!response.body) throw new Error('Streaming downloads are unavailable in this browser.');
      const reader = response.body.getReader();
      try {
        while (true) {
          current.throwIfAborted();
          const {done,value} = await reader.read();
          if (done) break;
          received += value.byteLength;
        }
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      if (received !== size) throw new Error('The download was incomplete or modified. Please retry without a proxy or content filter.');
    } else { await response.arrayBuffer(); }
    return { bytes:direction === 'download' ? received : size, milliseconds:performance.now() - start };
  });
}

// Abortable pacing prevents background latency probes from outliving a cancelled test.
function delay(signal: AbortSignal, milliseconds: number): Promise<void> {
  return new Promise((resolve,reject) => {
    signal.throwIfAborted();
    const cancel = () => { clearTimeout(timer); signal.removeEventListener('abort',cancel); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort',cancel); resolve(); },milliseconds);
    signal.addEventListener('abort',cancel,{once:true});
  });
}

// Small parallel probes reveal responsiveness while the transfer phase is busy.
// Probe failure does not manufacture a zero-latency result or discard valid throughput.
async function loadedLatency(signal: AbortSignal, points: number[]) {
  while (!signal.aborted) {
    try { await delay(signal,500); points.push(await latencyProbe(signal)); }
    catch { return; }
  }
}

// Each round includes all transfer overhead and completed payloads over at least 6 s.
// This measures this browser's HTTP path to Cloudflare, not universal link capacity.
async function measureDirection(direction: 'download' | 'upload', signal: AbortSignal, update: (value: number) => void, duration: number): Promise<DirectionResult> {
  signal.throwIfAborted();
  const warmup = await transfer(direction,256000,signal);
  let size = nextPayloadSize(warmup.bytes,warmup.milliseconds);
  const rounds: number[] = [];
  const points: number[] = [];
  const probes = new AbortController();
  const cancel = () => probes.abort(signal.reason);
  signal.addEventListener('abort',cancel,{once:true});
  const latencyTask = loadedLatency(probes.signal,points);
  try {
    for (let round = 0; round < ROUNDS; round++) {
      signal.throwIfAborted();
      const start = performance.now();
      let bytes = 0;
      do {
        const sample = await transfer(direction,size,signal);
        bytes += sample.bytes;
        size = nextPayloadSize(sample.bytes,sample.milliseconds);
        update(toMbps(bytes,performance.now() - start));
      } while (performance.now() - start < duration);
      rounds.push(toMbps(bytes,performance.now() - start));
    }
    const result = summarizeRounds(rounds);
    update(result.speed);
    return { ...result,loadedLatency:points.length ? median(points) : undefined };
  } finally {
    probes.abort();
    signal.removeEventListener('abort',cancel);
    await latencyTask;
  }
}

// Public wrappers retain the existing tool/test API.
export async function measureDownload(signal: AbortSignal, update: (value: number) => void, duration = ROUND_DURATION) {
  return (await measureDirection('download',signal,update,duration)).speed;
}
export async function measureUpload(signal: AbortSignal, update: (value: number) => void, duration = ROUND_DURATION) {
  return (await measureDirection('upload',signal,update,duration)).speed;
}

// Collect both throughput and responsiveness; an interrupted run never becomes a result.
export async function runSpeedTest(signal: AbortSignal, phase: (phase: Phase) => void, update: (value: number) => void, complete: (key: Phase, value: number) => void): Promise<Measurement> {
  phase('ping');
  const latency = await unloadedLatency(signal); complete('ping',latency.ping);
  phase('download');
  const download = await measureDirection('download',signal,update,ROUND_DURATION); complete('download',download.speed);
  phase('upload');
  const upload = await measureDirection('upload',signal,update,ROUND_DURATION); complete('upload',upload.speed);
  signal.throwIfAborted();
  return { ...latency,download:download.speed,upload:upload.speed,downloadRange:download.range,uploadRange:upload.range,downloadLatency:download.loadedLatency,uploadLatency:upload.loadedLatency,method:'sustained-v2' };
}
