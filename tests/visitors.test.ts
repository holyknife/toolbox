import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/visitors/route';

test('visitors API: fetches current visitor count without incrementing', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      assert.ok(url.includes('/get/toolbox_visitors'), 'Expected /get endpoint');
      assert.equal(init?.method, 'POST');
      assert.ok(
        (init?.headers as Record<string, string>)?.Authorization?.startsWith('Bearer '),
        'Expected Bearer header'
      );
      return new Response(JSON.stringify({ result: '42' }), { status: 200 });
    }) as typeof fetch;

    const req = new Request('http://localhost:3000/api/visitors');
    const res = await GET(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.count, 42);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('visitors API: increments visitor count when inc=1 is requested', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      assert.ok(url.includes('/incr/toolbox_visitors'), 'Expected /incr endpoint');
      return new Response(JSON.stringify({ result: 43 }), { status: 200 });
    }) as typeof fetch;

    const req = new Request('http://localhost:3000/api/visitors?inc=1');
    const res = await GET(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.count, 43);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('visitors API: handles network or Upstash error gracefully', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => {
      return new Response('Unauthorized', { status: 401 });
    }) as typeof fetch;

    const req = new Request('http://localhost:3000/api/visitors');
    const res = await GET(req);
    assert.equal(res.status, 500);
    const data = await res.json();
    assert.equal(data.count, null);
    assert.equal(data.error, 'Redis error');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
