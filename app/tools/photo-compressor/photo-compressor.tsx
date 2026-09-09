'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ImageDown, Upload, ShieldCheck } from 'lucide-react';
import { compressPhoto, formatSize, getDownloadName, getTargetSizeBytes, loadPhoto, type CompressionResult, type LoadedPhoto, type SizeUnit } from './compress';

// Own preview URLs in an effect so replacing files or leaving the tool frees them.
function usePreviewUrl(blob: Blob | null): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) { setUrl(''); return; }
    const nextUrl = URL.createObjectURL(blob);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [blob]);
  return url;
}

// Translate unexpected browser failures into an actionable user-facing message.
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'The image could not be processed. Try a smaller image or another browser.';
}

// Keep each compression job and its local state isolated to this tool route.
export default function PhotoCompressor() {
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [targetSize, setTargetSize] = useState('500');
  const [unit, setUnit] = useState<SizeUnit>('KB');
  const [convertPng, setConvertPng] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const loadVersion = useRef(0);
  const job = useRef<AbortController | null>(null);
  const originalUrl = usePreviewUrl(photo?.file ?? null);
  const compressedUrl = usePreviewUrl(result?.blob ?? null);
  const busy = loading || compressing;

  // Ignore stale image loads and stop compression when navigation unmounts this UI.
  useEffect(() => {
    return () => { loadVersion.current += 1; job.current?.abort(); };
  }, []);

  // Validate and decode immediately so original dimensions are shown before compression.
  async function selectFile(file: File | undefined) {
    if (!file) return;
    const version = ++loadVersion.current;
    setPhoto(null);
    setResult(null);
    setError('');
    setStatus('Opening image…');
    setLoading(true);
    setConvertPng(false);
    try {
      const loadedPhoto = await loadPhoto(file);
      if (version !== loadVersion.current) return;
      setPhoto(loadedPhoto);
      setStatus('Image ready. Choose your target size.');
    } catch (reason) {
      if (version === loadVersion.current) { setError(errorMessage(reason)); setStatus(''); }
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }

  // Clear old output when settings change so a download always matches its labels.
  function clearResult() {
    setResult(null);
    setError('');
    setStatus('');
  }

  // Run browser work on demand; cancellation never replaces a newer result.
  async function startCompression() {
    if (!photo || job.current) return;
    setError('');
    setResult(null);
    let targetSizeBytes: number;
    try { targetSizeBytes = getTargetSizeBytes(targetSize, unit); }
    catch (reason) { setError(errorMessage(reason)); return; }
    const controller = new AbortController();
    job.current = controller;
    setCompressing(true);
    setStatus('Finding the closest size…');
    try {
      const compressed = await compressPhoto(photo, targetSizeBytes, convertPng, controller.signal);
      if (!controller.signal.aborted) { setResult(compressed); setStatus(compressed.message); }
    } catch (reason) {
      if (!controller.signal.aborted) { setError(errorMessage(reason)); setStatus(''); }
    } finally {
      if (!controller.signal.aborted) setCompressing(false);
      if (job.current === controller) job.current = null;
    }
  }

  // Canvas encoding finishes its current callback, but its result is discarded on cancel.
  function cancelCompression() {
    job.current?.abort();
    setCompressing(false);
    setStatus('Compression cancelled.');
  }

  return <div className="page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading"><span className="tool-icon"><ImageDown size={28}/></span><div><h1>Photo Compressor</h1><p>A smaller image. A little more space.</p></div></div>
    <section className="rounded-panel border border-border bg-panel p-6" aria-label="Photo compression settings">
      <label htmlFor="photo-file" className="mb-3 flex items-center gap-2 text-sm font-medium text-text"><Upload size={17}/>Choose an image</label>
      <input id="photo-file" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/x-ms-bmp" disabled={busy} onChange={event => { void selectFile(event.target.files?.[0]); event.target.value = ''; }} className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-dim file:mr-4 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-2 file:text-text" aria-describedby="supported-images"/>
      <p id="supported-images" className="mt-3 text-sm leading-relaxed text-dim">JPG, PNG, WebP, GIF, and BMP. GIF output is a single still frame; animation is not preserved. Animated WebP/PNG also become still images.</p>
      {photo && <p className="mt-4 break-words text-sm text-text"><strong>{photo.file.name}</strong> · {formatSize(photo.file.size)} ({photo.file.size.toLocaleString()} bytes) · {photo.width} × {photo.height} px</p>}
      <div className="mt-6 border-t border-border pt-6">
        <label htmlFor="target-size" className="mb-2 block text-sm font-medium text-text">Target file size</label>
        <div className="flex max-w-sm gap-2">
          <input id="target-size" type="number" min="0.000001" step="any" value={targetSize} disabled={busy} onChange={event => { setTargetSize(event.target.value); clearResult(); }} className="min-w-0 flex-1 rounded-lg border border-border bg-bg p-3 text-text" aria-describedby="target-help"/>
          <select aria-label="Target size unit" value={unit} disabled={busy} onChange={event => { setUnit(event.target.value as SizeUnit); clearResult(); }} className="rounded-lg border border-border bg-bg p-3 text-text"><option value="KB">KB</option><option value="MB">MB</option></select>
        </div>
        <p id="target-help" className="mt-3 text-sm leading-relaxed text-dim">We aim within 5% of your target. Exact sizes aren’t always possible. 1 KB = 1,000 bytes; 1 MB = 1,000,000 bytes.</p>
        {photo?.type === 'image/png' && <div className="mt-4 rounded-lg border border-border bg-bg p-4"><p className="text-sm leading-relaxed text-dim">PNG stays lossless at its original dimensions, so size reduction is limited. WebP can get closer to smaller targets and preserves transparency.</p><label className="mt-3 flex items-center gap-3 text-sm text-text"><input type="checkbox" checked={convertPng} disabled={busy} onChange={event => { setConvertPng(event.target.checked); clearResult(); }} className="h-4 w-4 accent-accent"/>Convert to WebP for smaller size</label></div>}
        <p className="mt-3 text-sm text-dim">Very small targets may reduce resolution and visual quality. Re-encoded files may lose metadata.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4"><button className="primary-button" disabled={!photo || busy} onClick={startCompression}><ImageDown size={17}/>{compressing ? 'Compressing…' : 'Compress image'}</button>{compressing && <button onClick={cancelCompression} className="text-sm text-dim underline">Cancel</button>}<span className="flex items-center gap-2 text-sm text-dim"><ShieldCheck size={16}/>Your image stays on this device</span></div>
      </div>
      <p role="status" aria-live="polite" className="mt-4 text-sm text-accent">{status}</p>
      {error && <p role="alert" className="error">{error}</p>}
      {result?.warning && <p role="status" className="mt-4 rounded-lg border border-border bg-bg p-4 text-sm leading-relaxed text-text">{result.warning}</p>}
    </section>
    {photo && <section aria-label="Image comparison" className="mt-6 grid gap-5 lg:grid-cols-2">
      <div className="min-w-0 rounded-panel border border-border bg-panel p-5"><h2 className="mb-3 text-base font-medium">Original</h2>{originalUrl && <img src={originalUrl} alt="Original uploaded image" className="h-64 w-full rounded-lg bg-bg object-contain"/>}<p className="mt-3 text-sm text-dim">{formatSize(photo.file.size)} · {photo.width} × {photo.height} px</p></div>
      <div className="min-w-0 rounded-panel border border-border bg-panel p-5"><h2 className="mb-3 text-base font-medium">{result?.skipped ? 'Original kept' : 'Compressed preview'}</h2>{result && compressedUrl ? <><img src={compressedUrl} alt="Result image for visual quality comparison" className="h-64 w-full rounded-lg bg-bg object-contain"/><p className="mt-3 text-sm text-text">{formatSize(result.blob.size)} ({result.blob.size.toLocaleString()} bytes) · {result.width} × {result.height} px</p><p className="mt-2 text-sm text-dim">Target: {targetSize} {unit} · {result.blob.type.replace('image/', '').toUpperCase() || photo.type.replace('image/', '').toUpperCase()}</p><a href={compressedUrl} download={getDownloadName(photo.file.name, result.blob.type, result.skipped)} className="primary-button mt-4"><Download size={16}/>{result.skipped ? 'Download original' : 'Download image'}</a></> : <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-bg p-6 text-center text-sm text-dim">{compressing ? 'Finding a smaller fit for your image…' : 'Compress your image to see the result here.'}</div>}</div>
    </section>}
  </div>;
}
