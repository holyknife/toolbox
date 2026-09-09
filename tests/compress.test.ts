import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseOutputType, compressPhoto, detectImageType, formatSize, getDownloadName, getTargetSizeBytes, type LoadedPhoto } from '../app/tools/photo-compressor/compress';

// Create a decoded-photo stand-in; Canvas encoding is supplied separately below.
function samplePhoto(type: LoadedPhoto['type'] = 'image/jpeg'): LoadedPhoto {
  return { file: new File([new Uint8Array(100000)], 'photo.jpg', { type }), image: {} as HTMLImageElement, type, width: 1000, height: 1000 };
}

// Supply predictable encoded sizes to exercise the search without browser rendering.
async function withCanvas(encode: (width: number, quality: number) => number, work: () => Promise<void>) {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: () => {} }),
      toBlob(this: { width: number }, callback: BlobCallback, type: string, quality: number) {
        callback(new Blob([new Uint8Array(Math.round(encode(this.width, quality)))], { type }));
      },
    }),
  } });
  try { await work(); }
  finally {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  }
}

test('target sizes use explicit units and reject unusable input', () => {
  assert.equal(getTargetSizeBytes('500', 'KB'), 500000);
  assert.equal(getTargetSizeBytes('1.2', 'MB'), 1200000);
  for (const value of ['', '0', '-2', 'NaN', 'Infinity']) assert.throws(() => getTargetSizeBytes(value, 'KB'));
  assert.equal(formatSize(1200000), '1.20 MB');
});

test('supported signatures are recognized while renamed PDF data is rejected', () => {
  const signatures: [number[], string][] = [
    [[255,216,255], 'image/jpeg'], [[137,80,78,71,13,10,26,10], 'image/png'],
    [Array.from(Buffer.from('RIFF0000WEBP')), 'image/webp'],
    [Array.from(Buffer.from('GIF89a')), 'image/gif'], [[66,77], 'image/bmp'],
  ];
  for (const [signature, type] of signatures) assert.equal(detectImageType(new Uint8Array(signature)), type);
  assert.throws(() => detectImageType(new Uint8Array(Buffer.from('%PDF-1.4'))), /Unsupported file/);
  assert.throws(() => detectImageType(new Uint8Array()), /Unsupported file/);
});

test('formats preserve PNG by default and produce truthful filenames', () => {
  assert.equal(chooseOutputType('image/png', false), 'image/png');
  assert.equal(chooseOutputType('image/png', true), 'image/webp');
  assert.equal(chooseOutputType('image/gif', false), 'image/webp');
  assert.equal(getDownloadName('holiday.png', 'image/webp', false), 'holiday-compressed.webp');
  assert.equal(getDownloadName('holiday.png', 'image/png', true), 'holiday.png');
});

test('larger targets skip Canvas and keep the original file', async () => {
  const photo = samplePhoto();
  const result = await compressPhoto(photo, 200000, false, new AbortController().signal);
  assert.equal(result.blob, photo.file);
  assert.equal(result.skipped, true);
});

test('quality search approaches target within five percent', async () => {
  await withCanvas((_width, quality) => 10000 + quality * 70000, async () => {
    const result = await compressPhoto(samplePhoto(), 50000, false, new AbortController().signal);
    assert.ok(Math.abs(result.blob.size - 50000) <= 2500);
    assert.equal(result.width, 1000);
    assert.equal(result.blob.type, 'image/jpeg');
  });
});

test('tiny targets trigger resizing and a quality warning', async () => {
  await withCanvas((width, quality) => 500 + width * width * (0.02 + quality * 0.05), async () => {
    const result = await compressPhoto(samplePhoto(), 1000, false, new AbortController().signal);
    assert.ok(result.width < 1000);
    assert.match(result.warning, /Quality may be significantly reduced/);
    assert.ok(Math.abs(result.blob.size - 1000) <= 50);
  });
});

test('PNG does not reduce resolution to chase a lossy target', async () => {
  await withCanvas(() => 80000, async () => {
    const result = await compressPhoto(samplePhoto('image/png'), 1000, false, new AbortController().signal);
    assert.equal(result.width, 1000);
    assert.equal(result.blob.type, 'image/png');
    assert.match(result.warning, /PNG has no adjustable lossy quality/);
  });
});

test('cancelled compression does no work', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(compressPhoto(samplePhoto(), 1000, false, controller.signal), { name: 'AbortError' });
});
