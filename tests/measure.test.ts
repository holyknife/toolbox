import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { median, toMbps, measureLatency, parallelWindow, measureDirection, summarizeRounds, runSpeedTest } from '../app/tools/speed-test/measure';
import { latencyFromTiming, transfer } from '../app/tools/speed-test/network';
import { resilientStage, type Visibility } from '../app/tools/speed-test/session';
import { activityRatings } from '../app/tools/speed-test/result-insights';

test('median and shared byte/time arithmetic reject invalid data and do not cap to a plan', () => {
  const values = [90,80,81];
  assert.equal(median(values),81); assert.deepEqual(values,[90,80,81]);
  assert.equal(toMbps(10000000,1000),80);
  assert.equal(summarizeRounds([89,90,91]).speed,90);
  assert.throws(() => median([])); assert.throws(() => toMbps(1,0));
});
test('resource timing excludes setup and unavailable timing has an honest fallback', () => {
  assert.deepEqual(latencyFromTiming({requestStart:1000,responseStart:1020},1020),{milliseconds:20,timing:'resource'});
  assert.deepEqual(latencyFromTiming({requestStart:0,responseStart:0},370),{milliseconds:370,timing:'warmed-http'});
});
test('ping discards first setup sample and reports median plus mean of ten probes', async () => {
  const original = globalThis.fetch;
  let clock = 0; let requests = 0;
  const timer = mock.method(performance,'now',() => clock);
  globalThis.fetch = async () => { clock += ++requests === 1 ? 1000 : requests === 2 ? 200 : 20; return new Response(null); };
  try {
    const result = await measureLatency(new AbortController().signal);
    assert.equal(result.ping,20); assert.equal(result.pingMean,38); assert.equal(requests,11);
  } finally { globalThis.fetch = original; timer.mock.restore(); }
});

test('four concurrent streams share 80 Mbps; faster warm-up is excluded from all three rounds', async () => {
  const original = globalThis.fetch;
  let clock = 0; let batches = 0;
  const timer = mock.method(performance,'now',() => clock);
  let pending: {bytes:number;resolve:(response:Response) => void}[] = [];
  const urls = new Set<string>();
  globalThis.fetch = async (url,init) => new Promise(resolve => {
    assert.equal(init?.cache,'no-store'); urls.add(String(url));
    pending.push({bytes:Number(new URL(String(url)).searchParams.get('bytes')),resolve});
    if (pending.length === 4) {
      const batch = pending; pending = [];
      clock += batch.reduce((sum,item) => sum+item.bytes,0)*8/((++batches === 1 ? 160 : 80)*1000);
      batch.forEach(item => item.resolve(new Response(new Uint8Array(item.bytes))));
    }
  });
  try {
    const result = await measureDirection('download',new AbortController().signal,() => {},{streams:4,warmupMs:0,roundMs:1,rounds:3});
    assert.equal(batches,4); assert.equal(urls.size,16);
    assert.ok(Math.abs(result.speed-80) < 1e-8);
    assert.ok(Math.abs(result.range.min-80) < 1e-8);
  } finally { globalThis.fetch = original; timer.mock.restore(); }
});
test('download emits body progress but rejects truncated data', async () => {
  const original = globalThis.fetch; const updates: number[] = [];
  globalThis.fetch = async () => new Response(new Uint8Array(100));
  try {
    await assert.rejects(transfer('download',200,new AbortController().signal,value => updates.push(value)),/incomplete/);
    assert.deepEqual(updates,[100]);
  } finally { globalThis.fetch = original; }
});
test('one failed stream aborts every peer rather than leaving background traffic', async () => {
  const original = globalThis.fetch; let calls = 0; let aborted = 0;
  globalThis.fetch = async (_url,init) => {
    if (++calls === 1) return new Response(null,{status:503});
    return new Promise((_,reject) => init?.signal?.addEventListener('abort',() => { aborted++; reject(init.signal?.reason); },{once:true}));
  };
  try {
    await assert.rejects(parallelWindow('download',new AbortController().signal,[64000,64000,64000,64000],1,() => {}),/HTTP 503/);
    assert.equal(calls,4); assert.equal(aborted,3);
  } finally { globalThis.fetch = original; }
});
test('upload progress does not count as server acknowledgement and payloads are random', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis,'XMLHttpRequest');
  let finish: (() => void) | undefined; let random = false;
  class FakeXHR {
    status = 200; upload = {onprogress:null as null | ((event:{loaded:number}) => void)};
    onload: null | (() => void) = null; onerror = null; onabort: null | (() => void) = null;
    open() {}
    abort() { this.onabort?.(); }
    async send(blob: Blob) {
      random = new Uint8Array(await blob.arrayBuffer()).some(value => value !== 0);
      this.upload.onprogress?.({loaded:blob.size}); finish = () => this.onload?.();
    }
  }
  Object.defineProperty(globalThis,'XMLHttpRequest',{configurable:true,value:FakeXHR});
  let resolved = false; const progress: number[] = [];
  try {
    const task = transfer('upload',64000,new AbortController().signal,value => progress.push(value)).then(value => { resolved = true; return value; });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(random,true); assert.deepEqual(progress,[64000]); assert.equal(resolved,false);
    finish!(); assert.equal((await task).bytes,64000);
  } finally { if (previous) Object.defineProperty(globalThis,'XMLHttpRequest',previous); else Reflect.deleteProperty(globalThis,'XMLHttpRequest'); }
});

test('transient failures retry exactly once; persistent failures stop after two attempts', async () => {
  let calls = 0;
  assert.equal(await resilientStage(new AbortController().signal,async () => { if (++calls === 1) throw new Error('offline'); return 42; },() => {}),42);
  assert.equal(calls,2); calls = 0;
  await assert.rejects(resilientStage(new AbortController().signal,async () => { calls++; throw new Error('offline'); },() => {}),/offline/);
  assert.equal(calls,2);
});
test('hidden phase pauses, aborts its traffic, resumes, and retains its retry allowance', async () => {
  let hidden = false; const listeners = new Set<() => void>(); const states: string[] = []; let attempts = 0;
  const visibility: Visibility = {hidden:() => hidden,subscribe:listener => { listeners.add(listener); return () => {listeners.delete(listener);}; }};
  const task = resilientStage(new AbortController().signal,async signal => {
    attempts++;
    if (attempts === 1) return new Promise<number>((_,reject) => {
      signal.addEventListener('abort',() => reject(signal.reason),{once:true});
      hidden = true; listeners.forEach(listener => listener());
    });
    if (attempts === 2) throw new Error('transient');
    return 80;
  },state => states.push(state),visibility);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(attempts,1); assert.ok(states.includes('paused'));
  hidden = false; listeners.forEach(listener => listener());
  assert.equal(await task,80); assert.equal(attempts,3); assert.equal(listeners.size,0);
});
test('cancel while paused exits promptly without retrying', async () => {
  const controller = new AbortController(); const listeners = new Set<() => void>();
  const visibility: Visibility = {hidden:() => true,subscribe:listener => { listeners.add(listener); return () => {listeners.delete(listener);}; }};
  const task = resilientStage(controller.signal,async () => assert.fail('must not run'),() => {},visibility);
  controller.abort(); await assert.rejects(task,{name:'AbortError'}); assert.equal(listeners.size,0);
});
test('runner preserves completed ping and tries upload even after download fails twice', async () => {
  const original = globalThis.fetch; const phases: string[] = []; const completed: string[] = [];
  globalThis.fetch = async url => new Response(null,{status:new URL(String(url)).searchParams.get('bytes') === '0' ? 200 : 503});
  try {
    const result = await runSpeedTest(new AbortController().signal,key => phases.push(key),() => {},key => completed.push(key));
    assert.deepEqual(phases,['ping','download','upload']);
    assert.deepEqual(Object.keys(result.errors),['download','upload']);
    assert.deepEqual(completed,['ping']); assert.ok(result.ping! >= 0);
    assert.equal(result.download,undefined);
  } finally { globalThis.fetch = original; }
});

test('activity hints handle unknown data and include latency/jitter for gaming', () => {
  assert.ok(activityRatings({}).every(item => item.good === undefined));
  const slowPing = activityRatings({download:100,upload:20,ping:370,jitter:30});
  assert.equal(slowPing.find(item => item.name === 'Gaming')?.good,false);
  assert.equal(slowPing.find(item => item.name === 'HD streaming')?.good,true);
  assert.ok(activityRatings({download:100,upload:20,ping:20,jitter:3}).every(item => item.good));
});
