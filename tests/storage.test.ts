import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storage } from '../lib/storage';
test('storage is safe on the server', async () => { assert.equal(await storage.get('speed-test','history'),null); });
test('adapter isolates tools, removes values, and tolerates invalid JSON', async () => {
  const data = new Map<string,string>();
  Object.defineProperty(globalThis, 'window', { configurable:true, value:{ localStorage:{ getItem:(key:string) => data.get(key) ?? null, setItem:(key:string,value:string) => data.set(key,value), removeItem:(key:string) => data.delete(key) } } });
  try { await storage.set('speed-test','history',[123]); assert.deepEqual(await storage.get('speed-test','history'),[123]); assert.equal(await storage.get('other','history'),null); await storage.remove('speed-test','history'); assert.equal(await storage.get('speed-test','history'),null); data.set('toolbox:v1:speed-test:history','invalid'); assert.equal(await storage.get('speed-test','history'),null); } finally { Reflect.deleteProperty(globalThis,'window'); }
});
