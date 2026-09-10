import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { median, toMbps, measurePing, measureDownload, measureUpload, summarizeRounds, jitter, nextPayloadSize } from '../app/tools/speed-test/measure';

test('median handles even and odd samples without changing their order', () => {
  const values = [9,1,8,2,7,3];
  assert.equal(median(values),5); assert.deepEqual(values,[9,1,8,2,7,3]);
  assert.equal(median([9,2,4]),4); assert.throws(() => median([]));
});
test('Mbps uses actual bytes and elapsed milliseconds; invalid timing is rejected', () => {
  assert.equal(toMbps(12500000,1000),100);
  assert.equal(toMbps(4000000,2000),16);
  assert.throws(() => toMbps(1000,0));
  assert.throws(() => toMbps(1000,-1));
});
test('one initial burst does not override two sustained rounds, and results are not plan-capped', () => {
  assert.deepEqual(summarizeRounds([110,80,81]),{speed:81,range:{min:80,max:110}});
  assert.equal(summarizeRounds([89,90,91]).speed,90);
  assert.equal(jitter([10,14,12]),3);
});
test('adaptive sizes target useful duration and remain bounded', () => {
  assert.equal(nextPayloadSize(1000000,1500),500000);
  assert.equal(nextPayloadSize(1000000,1),25000000);
  assert.equal(nextPayloadSize(1000,1000),64000);
});
test('aborted runs make no request', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(measurePing(controller.signal),{name:'AbortError'});
  await assert.rejects(measureDownload(controller.signal,() => {}),{name:'AbortError'});
  await assert.rejects(measureUpload(controller.signal,() => {}),{name:'AbortError'});
});
test('HTTP failures are surfaced', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(null,{status:503});
  try { await assert.rejects(measurePing(new AbortController().signal),/HTTP 503/); }
  finally { globalThis.fetch = original; }
});
test('latency excludes the connection warmup and uses ten measured probes', async () => {
  let clock = 0;
  let requests = 0;
  const original = globalThis.fetch;
  const timer = mock.method(performance,'now',() => clock);
  globalThis.fetch = async () => { clock += ++requests === 1 ? 1000 : 20; return new Response(null); };
  try { assert.equal(await measurePing(new AbortController().signal),20); assert.equal(requests,11); }
  finally { timer.mock.restore(); globalThis.fetch = original; }
});
test('download counts exact received bytes over three rounds with uncached unique requests', async () => {
  let clock = 0;
  const timer = mock.method(performance,'now',() => clock += 500);
  const original = globalThis.fetch;
  const urls: string[] = [];
  const updates: number[] = [];
  globalThis.fetch = async (url,init) => {
    urls.push(String(url)); assert.equal(init?.cache,'no-store');
    const size = Number(new URL(String(url)).searchParams.get('bytes'));
    return new Response(new Uint8Array(size));
  };
  try {
    const value = await measureDownload(new AbortController().signal,speed => updates.push(speed),10);
    assert.equal(urls.length,4); // one warmup plus one completed transfer per short test round
    assert.equal(new Set(urls).size,4);
    assert.equal(updates.length,4); // three live values plus final median
    assert.equal(value,updates[updates.length - 1]); assert.ok(value > 0);
  } finally { timer.mock.restore(); globalThis.fetch = original; }
});
test('incomplete downloads never become valid speed results', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(new Uint8Array(100));
  try { await assert.rejects(measureDownload(new AbortController().signal,() => {},10),/incomplete/); }
  finally { globalThis.fetch = original; }
});
test('uploads use random, adaptive payloads and await acknowledgement', async () => {
  let clock = 0;
  const timer = mock.method(performance,'now',() => clock += 500);
  const original = globalThis.fetch;
  const sizes: number[] = [];
  globalThis.fetch = async (_url,init) => {
    assert.equal(init?.method,'POST');
    const body = init?.body as Blob;
    sizes.push(body.size);
    const bytes = new Uint8Array(await body.arrayBuffer());
    assert.ok(bytes.some(value => value !== 0));
    return new Response(null);
  };
  try {
    assert.ok(await measureUpload(new AbortController().signal,() => {},10) > 0);
    assert.equal(sizes.length,4); assert.equal(sizes[0],256000);
    assert.ok(sizes.every(size => size >= 64000 && size <= 25000000));
  } finally { timer.mock.restore(); globalThis.fetch = original; }
});
test('cancelling a pending request aborts promptly without publishing a speed', async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  let published = false;
  globalThis.fetch = async (_url,init) => new Promise((_,reject) => {
    init?.signal?.addEventListener('abort',() => reject(init.signal?.reason),{once:true});
    queueMicrotask(() => controller.abort());
  });
  try { await assert.rejects(measureDownload(controller.signal,() => {published = true;}),{name:'AbortError'}); assert.equal(published,false); }
  finally { globalThis.fetch = original; }
});

test('a simulated sustained 80 Mbps connection reports 80, despite a faster warmup', async () => {
  const original = globalThis.fetch;
  let clock = 0;
  let requestCount = 0;
  const timer = mock.method(performance,'now',() => clock);
  globalThis.fetch = async url => {
    const bytes = Number(new URL(String(url)).searchParams.get('bytes'));
    const rate = ++requestCount === 1 ? 160 : 80;
    clock += bytes * 8 / (rate * 1000);
    return new Response(new Uint8Array(bytes));
  };
  try { assert.ok(Math.abs(await measureDownload(new AbortController().signal,() => {},10) - 80) < 1e-8); }
  finally { timer.mock.restore(); globalThis.fetch = original; }
});
