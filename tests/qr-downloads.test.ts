import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { createQrZip } from '../app/tools/qr-generator/qr-downloads';
import { qrFilename } from '../app/tools/qr-generator/qr-renderer';

// Check the exported ZIP preserves every source file rather than overwriting repeated labels.
test('batch ZIP has unique PNG names and identical file bytes', async () => {
  const results = [0,1,2].map(index => ({ filename:qrFilename(index), blob:new Blob([new Uint8Array([137,80,78,71,index])],{ type:'image/png' }) }));
  const blob = await createQrZip(results);
  const archive = await JSZip.loadAsync(await blob.arrayBuffer());
  assert.deepEqual(Object.keys(archive.files),['qr-001.png','qr-002.png','qr-003.png']);
  for (let index = 0; index < results.length; index++) assert.deepEqual(await archive.file(results[index].filename)!.async('uint8array'),new Uint8Array(await results[index].blob.arrayBuffer()));
  await assert.rejects(createQrZip([]),/Generate at least/);
});
