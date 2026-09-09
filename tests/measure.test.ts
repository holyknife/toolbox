import { test } from 'node:test';
import assert from 'node:assert/strict';
import { median, toMbps, measurePing, measureDownload, measureUpload } from '../app/tools/speed-test/measure';
test('median handles even and odd samples without mutating them', () => { const values = [9,1,8,2,7,3]; assert.equal(median(values),5); assert.deepEqual(values,[9,1,8,2,7,3]); assert.equal(median([9,2,4]),4); });
test('Mbps uses decimal megabits and milliseconds', () => { assert.equal(toMbps(12500000,1000),100); assert.equal(toMbps(4000000,2000),16); });
test('aborted runs make no request', async () => { const controller = new AbortController(); controller.abort(); await assert.rejects(measurePing(controller.signal), {name:'AbortError'}); });
test('HTTP failures are surfaced', async () => { const original = globalThis.fetch; globalThis.fetch = async () => new Response(null,{status:503}); try { await assert.rejects(measurePing(new AbortController().signal), /HTTP 503/); } finally { globalThis.fetch = original; } });
test('download streams bytes and updates the gauge', async () => { const original = globalThis.fetch; let updates = 0; globalThis.fetch = async () => new Response(new Uint8Array(10000)); try { const value = await measureDownload(new AbortController().signal, () => updates++, 10); assert.ok(value > 0); assert.ok(updates > 0); } finally { globalThis.fetch = original; } });
test('upload posts a 4 MiB body and reports throughput', async () => { const original = globalThis.fetch; globalThis.fetch = async (_url, init) => { assert.equal(init?.method,'POST'); assert.equal((init?.body as Blob).size,4194304); return new Response(null); }; try { assert.ok(await measureUpload(new AbortController().signal, () => {}, 10) > 0); } finally { globalThis.fetch = original; } });
