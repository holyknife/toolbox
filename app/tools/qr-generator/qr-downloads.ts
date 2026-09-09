import type { GeneratedQr } from './qr-types';

// Load the ZIP library only for batch downloads. PNGs are already compressed, so store them as-is.
export async function createQrZip(results: Pick<GeneratedQr,'filename'|'blob'>[]): Promise<Blob> {
  if (!results.length) throw new Error('Generate at least one QR code first.');
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const result of results) zip.file(result.filename,await result.blob.arrayBuffer());
  return zip.generateAsync({ type:'blob', compression:'STORE' });
}
