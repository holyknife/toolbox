import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapUser } from '../lib/auth';
import { getSupabaseConfig } from '../lib/supabase';
import { tools } from '../lib/tools-registry';

test('mapUser handles valid and null users correctly', () => {
  assert.equal(mapUser(null), null);

  const mappedWithMetadata = mapUser({
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { name: 'Alice' },
  });
  assert.equal(mappedWithMetadata?.id, 'user-123');
  assert.equal(mappedWithMetadata?.name, 'Alice');
  assert.equal(mappedWithMetadata?.email, 'test@example.com');

  const mappedFromEmail = mapUser({
    id: 'user-456',
    email: 'developer@abhiyankhatiwada.com.np',
  });
  assert.equal(mappedFromEmail?.name, 'developer');
  assert.equal(mappedFromEmail?.email, 'developer@abhiyankhatiwada.com.np');
});

test('tools registry contains unique slugs', () => {
  const slugs = tools.map((t) => t.slug);
  const uniqueSlugs = new Set(slugs);
  assert.equal(slugs.length, uniqueSlugs.size);
});
