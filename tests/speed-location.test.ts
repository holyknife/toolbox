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
test('getConnectionLocation calls same-origin /api/network-info without external requests',async()=>{
  const original=globalThis.fetch;
  let requestedUrl='';
  globalThis.fetch=async(url)=>{
    requestedUrl=String(url);
    return new Response(JSON.stringify({
      ip: '198.51.100.25',
      country: 'US',
      city: 'San Jose',
      region: 'California',
      asn: 13335,
      isp: 'Cloudflare, Inc.',
      colo: 'SJC',
    }),{status:200,headers:{'content-type':'application/json'}});
  };
  try {
    const info=await getConnectionLocation(new AbortController().signal);
    assert.equal(requestedUrl,'/api/network-info');
    assert.deepEqual(info,{
      country:'United States',
      server:'San Jose · SJC',
      ip:'198.51.100.25',
      isp:'Cloudflare, Inc.',
      city:'San Jose',
      asn:13335,
      region:'California',
    });
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


