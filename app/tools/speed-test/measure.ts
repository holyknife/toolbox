import { pingRequest, transfer } from './network';
import { resilientStage, type StageState, type Visibility } from './session';

export type Phase = 'ping' | 'download' | 'upload';
export interface SpeedRange { min: number; max: number }
export interface Measurement {
  ping: number; download: number; upload: number;
  pingMean?: number; jitter?: number; timing?: 'resource' | 'warmed-http';
  downloadLatency?: number; uploadLatency?: number;
  downloadRange?: SpeedRange; uploadRange?: SpeedRange;
  method?: 'sustained-v2' | 'parallel-v3';
}
export interface Outcome extends Partial<Measurement> { errors: Partial<Record<Phase,string>> }
export interface Settings { rounds: number; roundMs: number; warmupMs: number; streams: number }
const defaults: Settings = {rounds:3,roundMs:4000,warmupMs:2000,streams:4};

// Median limits the influence of an isolated burst or unusually slow probe.
export function median(values: number[]) {
  if (!values.length || values.some(value => !Number.isFinite(value))) throw new Error('Not enough valid measurements.');
  const sorted = [...values].sort((a,b) => a-b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle-1] + sorted[middle]) / 2;
}
export function toMbps(bytes: number, milliseconds: number) {
  if (!Number.isFinite(bytes) || bytes < 0 || !Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error('The browser could not provide reliable timing.');
  return bytes * 8 / milliseconds / 1000;
}
export function summarizeRounds(rounds: number[]) {
  return {speed:median(rounds),range:{min:Math.min(...rounds),max:Math.max(...rounds)}};
}
export function jitter(times: number[]) {
  return times.length < 2 ? 0 : times.slice(1).reduce((sum,time,index) => sum + Math.abs(time-times[index]),0)/(times.length-1);
}
// Keep each stream's request near half a second, with bounded memory use.
export function nextPayloadSize(bytes: number, milliseconds: number) {
  return Math.min(8000000,Math.max(16000,Math.round(bytes * 500 / Math.max(milliseconds,1))));
}
function delay(signal: AbortSignal, milliseconds: number): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve,reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort',abort); resolve(); },milliseconds);
    signal.addEventListener('abort',abort,{once:true});
  });
}

// Discard the first request, then retain ten separate samples (not their minimum).
export async function measureLatency(signal: AbortSignal) {
  await pingRequest(signal);
  const samples: Awaited<ReturnType<typeof pingRequest>>[] = [];
  for (let index = 0; index < 10; index++) samples.push(await pingRequest(signal));
  const points = samples.map(sample => sample.milliseconds);
  return {ping:median(points),pingMean:points.reduce((sum,value) => sum+value,0)/points.length,
    jitter:jitter(points),timing:samples.every(sample => sample.timing === 'resource') ? 'resource' as const : 'warmed-http' as const};
}
export async function measurePing(signal: AbortSignal) { return (await measureLatency(signal)).ping; }

// One shared wall-clock denominator for ALL streams prevents double-counting speed.
// Progress is for the gauge only. Final bytes require complete, acknowledged requests.
export async function parallelWindow(direction: 'download' | 'upload', signal: AbortSignal,
  sizes: number[], duration: number, update: (value: number) => void) {
  signal.throwIfAborted();
  const workers = new AbortController();
  const abort = () => workers.abort(signal.reason);
  signal.addEventListener('abort',abort,{once:true});
  const start = performance.now();
  const completed = sizes.map(() => 0);
  const current = sizes.map(() => 0);
  let lastUpdate = start;
  const tasks = sizes.map(async (_,index) => {
    try {
      do {
        current[index] = 0;
        const sample = await transfer(direction,sizes[index],workers.signal,bytes => {
          if (workers.signal.aborted) return;
          current[index] = bytes;
          const now = performance.now();
          if (now-lastUpdate >= 100) {
            lastUpdate = now;
            const total = completed.reduce((sum,value) => sum+value,0) + current.reduce((sum,value) => sum+value,0);
            update(toMbps(total,now-start));
          }
        });
        completed[index] += sample.bytes; current[index] = 0;
        sizes[index] = nextPayloadSize(sample.bytes,sample.milliseconds);
      } while (performance.now()-start < duration);
    } catch (error) { workers.abort(error); throw error; }
  });
  try {
    await Promise.all(tasks);
    signal.throwIfAborted();
    return toMbps(completed.reduce((sum,value) => sum+value,0),performance.now()-start);
  } finally {
    workers.abort();
    await Promise.allSettled(tasks);
    signal.removeEventListener('abort',abort);
  }
}

// Loaded HTTP latency is separate from idle ping; failure never manufactures zero.
async function loadedLatency(signal: AbortSignal, points: number[]) {
  while (!signal.aborted) {
    try { await delay(signal,500); points.push((await pingRequest(signal)).milliseconds); }
    catch { return; }
  }
}

export async function measureDirection(direction: 'download' | 'upload', signal: AbortSignal,
  update: (value: number) => void, settings: Settings = defaults, warming: () => void = () => {}) {
  const sizes = Array.from({length:settings.streams},() => 64000);
  warming();
  // All streams warm for at least two seconds; no warm-up bytes enter results.
  await parallelWindow(direction,signal,sizes,settings.warmupMs,() => {});
  const points: number[] = [];
  const probes = new AbortController();
  const abort = () => probes.abort(signal.reason);
  signal.addEventListener('abort',abort,{once:true});
  const latencyTask = loadedLatency(probes.signal,points);
  try {
    const rounds: number[] = [];
    for (let round = 0; round < settings.rounds; round++) rounds.push(await parallelWindow(direction,signal,sizes,settings.roundMs,update));
    const result = summarizeRounds(rounds);
    update(result.speed);
    return {...result,loadedLatency:points.length ? median(points) : undefined};
  } finally { probes.abort(); await latencyTask; signal.removeEventListener('abort',abort); }
}
export async function measureDownload(signal: AbortSignal, update: (value: number) => void, duration = defaults.roundMs) {
  return (await measureDirection('download',signal,update,{...defaults,roundMs:duration})).speed;
}
export async function measureUpload(signal: AbortSignal, update: (value: number) => void, duration = defaults.roundMs) {
  return (await measureDirection('upload',signal,update,{...defaults,roundMs:duration})).speed;
}

// Retry each phase once, preserving completed phases and continuing after failures.
export async function runSpeedTest(signal: AbortSignal, phase: (phase: Phase) => void,
  update: (value: number) => void, complete: (key: Phase,value: number) => void,
  status: (phase: Phase,state: StageState | 'warming') => void = () => {}, visibility?: Visibility): Promise<Outcome> {
  const result: Outcome = {method:'parallel-v3',errors:{}};
  for (const key of ['ping','download','upload'] as const) {
    signal.throwIfAborted(); phase(key);
    try {
      if (key === 'ping') Object.assign(result,await resilientStage(signal,measureLatency,state => status(key,state),visibility));
      else {
        const measured = await resilientStage(signal,current => measureDirection(key,current,update,defaults,() => status(key,'warming')),
          state => status(key,state),visibility);
        result[key] = measured.speed;
        result[`${key}Range`] = measured.range;
        result[`${key}Latency`] = measured.loadedLatency;
      }
      complete(key,result[key]!);
    } catch (error) {
      signal.throwIfAborted();
      result.errors[key] = error instanceof Error ? error.message : 'This phase could not complete.';
    }
  }
  return result;
}
