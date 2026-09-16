import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLocation, parseTraceIp, maskIp, getConnectionLocation } from '../app/tools/speed-test/location';
test('location uses the reported route and drops IP and other trace fields',()=>{
  assert.deepEqual(parseLocation('loc=NP\ncolo=SIN\nip=192.0.2.1\n'),{country:'Nepal',server:'Singapore · SIN'});
  assert.deepEqual(parseLocation('loc=NP\ncolo=KTM\n'),{country:'Nepal',server:'Kathmandu · KTM'});
  assert.equal(parseLocation('colo=XYZ\n').server,'Cloudflare · XYZ');
  assert.deepEqual(parseLocation('loc=invalid\ncolo=<script>\n'),{country:'Unavailable',server:'Unavailable'});
});
test('trace IP extracts valid IPv4 and IPv6 addresses safely',()=>{
  assert.equal(parseTraceIp('loc=NP\nip=198.51.100.42\ncolo=KTM\n'),'198.51.100.42');
  assert.equal(parseTraceIp('ip=2400:1a00:1b25:c928::1\n'),'2400:1a00:1b25:c928::1');
  assert.equal(parseTraceIp('colo=KTM\n'),undefined);
  assert.equal(parseTraceIp('ip=bad<script>\n'),undefined);
});
test('maskIp masks sensitive octets and blocks for privacy',()=>{
  assert.equal(maskIp('198.51.100.42'),'198.51.•••.•••');
  assert.equal(maskIp('2400:1a00:1b25:c928::1'),'2400:1a00:••••:••••');
  assert.equal(maskIp(''),'');
});
test('location lookup fails explicitly when blocked without inventing a location',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(null,{status:403});
  try { await assert.rejects(getConnectionLocation(new AbortController().signal),/unavailable/); }
  finally { globalThis.fetch=original; }
});

