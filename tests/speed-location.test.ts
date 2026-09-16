import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLocation, parseTraceIp, maskIp, formatNetworkInfo, getConnectionLocation } from '../app/tools/speed-test/location';
import { GET } from '../app/api/network-info/route';

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
test('formatNetworkInfo maps Cloudflare server-side network fields accurately',()=>{
  assert.deepEqual(formatNetworkInfo({
    ip: '203.0.113.195',
    country: 'NP',
    city: 'Kathmandu',
    region: 'Bagmati',
    asn: 17501,
    isp: 'WorldLink Communications',
    colo: 'KTM',
  }), {
    country: 'Nepal',
    server: 'Kathmandu · KTM',
    ip: '203.0.113.195',
    isp: 'WorldLink Communications',
    city: 'Kathmandu',
    asn: 17501,
    region: 'Bagmati',
  });
  assert.deepEqual(formatNetworkInfo({}), {
    country: 'Unavailable',
    server: 'Unavailable',
  });
});
test('getConnectionLocation uses primary client-side lookup when available (Chrome / mobile / Shields OFF)',async()=>{
  const original=globalThis.fetch;
  const calledUrls: string[] = [];
  globalThis.fetch=async(url)=>{
    const urlStr=String(url);
    calledUrls.push(urlStr);
    if (urlStr.includes('speed.cloudflare.com/cdn-cgi/trace')) {
      return new Response('loc=NP\ncolo=KTM\nip=203.0.113.10\n', { status: 200 });
    }
    if (urlStr.includes('ipwho.is')) {
      return new Response(JSON.stringify({
        city: 'Kathmandu',
        connection: { isp: 'WorldLink Communications' },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(null, { status: 404 });
  };
  try {
    const info=await getConnectionLocation(new AbortController().signal);
    assert.deepEqual(info,{
      country:'Nepal',
      server:'Kathmandu · KTM',
      ip:'203.0.113.10',
      isp:'WorldLink Communications',
      city:'Kathmandu',
    });
    // Verifies that /api/network-info was not needed because primary succeeded completely
    assert.equal(calledUrls.some(u => u.includes('/api/network-info')), false);
  } finally {
    globalThis.fetch=original;
  }
});

test('getConnectionLocation falls back to same-origin /api/network-info when Brave Shields blocks trace',async()=>{
  const original=globalThis.fetch;
  const calledUrls: string[] = [];
  globalThis.fetch=async(url)=>{
    const urlStr=String(url);
    calledUrls.push(urlStr);
    if (urlStr.includes('speed.cloudflare.com/cdn-cgi/trace')) {
      // Simulate Brave Shields blocking the third-party trace request
      throw new TypeError('Failed to fetch (ERR_BLOCKED_BY_CLIENT)');
    }
    if (urlStr.includes('ipwho.is')) {
      // ipwho might succeed or return partial data
      return new Response(JSON.stringify({
        city: 'Kathmandu',
        connection: { isp: 'WorldLink Communications' },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (urlStr.includes('/api/network-info')) {
      return new Response(JSON.stringify({
        ip: '203.0.113.50',
        country: 'NP',
        city: 'Kathmandu',
        region: 'Bagmati',
        asn: 17501,
        isp: 'WorldLink Communications',
        colo: 'KTM',
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(null, { status: 404 });
  };
  try {
    const info=await getConnectionLocation(new AbortController().signal);
    // Verifies that fallback filled in country, server, and IP while preserving ISP
    assert.deepEqual(info,{
      country:'Nepal',
      server:'Kathmandu · KTM',
      ip:'203.0.113.50',
      isp:'WorldLink Communications',
      city:'Kathmandu',
      asn:17501,
      region:'Bagmati',
    });
    assert.equal(calledUrls.some(u => u.includes('/api/network-info')), true);
  } finally {
    globalThis.fetch=original;
  }
});
test('api/network-info route extracts CF-Connecting-IP and cf metadata without throwing',async()=>{
  const requestWithCf = new Request('https://example.com/api/network-info',{
    headers:{'CF-Connecting-IP':'203.0.113.50'},
  });
  Object.assign(requestWithCf,{
    cf:{
      country:'NP',
      city:'Kathmandu',
      region:'Bagmati',
      asn:17501,
      asOrganization:'WorldLink Communications',
      colo:'KTM',
    },
  });
  const res1=await GET(requestWithCf);
  assert.equal(res1.status,200);
  assert.deepEqual(await res1.json(),{
    ip:'203.0.113.50',
    country:'NP',
    city:'Kathmandu',
    region:'Bagmati',
    asn:17501,
    isp:'WorldLink Communications',
    colo:'KTM',
  });

  const emptyRequest = new Request('https://example.com/api/network-info');
  const res2=await GET(emptyRequest);
  assert.equal(res2.status,200);
  assert.deepEqual(await res2.json(),{
    ip:null,
    country:null,
    city:null,
    region:null,
    asn:null,
    isp:null,
    colo:null,
  });
});
test('location lookup fails explicitly when blocked without inventing a location',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(null,{status:403});
  try { await assert.rejects(getConnectionLocation(new AbortController().signal),/unavailable/); }
  finally { globalThis.fetch=original; }
});


