import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLocation, getConnectionLocation } from '../app/tools/speed-test/location';
test('location uses the reported route and drops IP and other trace fields',()=>{
  assert.deepEqual(parseLocation('loc=NP\ncolo=SIN\nip=192.0.2.1\n'),{country:'Nepal',server:'Singapore · SIN'});
  assert.deepEqual(parseLocation('loc=NP\ncolo=KTM\n'),{country:'Nepal',server:'Kathmandu · KTM'});
  assert.equal(parseLocation('colo=XYZ\n').server,'Cloudflare · XYZ');
  assert.deepEqual(parseLocation('loc=invalid\ncolo=<script>\n'),{country:'Unavailable',server:'Unavailable'});
});
test('location lookup fails explicitly when blocked without inventing a location',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(null,{status:403});
  try { await assert.rejects(getConnectionLocation(new AbortController().signal),/unavailable/); }
  finally { globalThis.fetch=original; }
});
