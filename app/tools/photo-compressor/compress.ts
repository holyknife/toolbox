export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'image/bmp';
export type OutputType = 'image/jpeg' | 'image/png' | 'image/webp';
export type SizeUnit = 'KB' | 'MB';

export interface LoadedPhoto {
  file: File;
  image: HTMLImageElement;
  type: ImageType;
  width: number;
  height: number;
}

export interface CompressionResult {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  skipped: boolean;
  message: string;
  warning: string;
}

// Use decimal units consistently so the target and displayed sizes agree.
export function getTargetSizeBytes(value: string, unit: SizeUnit): number {
  const targetSize = Number(value);
  const targetSizeBytes = Math.round(targetSize * (unit === 'MB' ? 1000000 : 1000));
  if (!Number.isFinite(targetSize) || targetSize <= 0 || !Number.isSafeInteger(targetSizeBytes) || targetSizeBytes < 1) {
    throw new Error('Enter a positive target size of at least 1 byte.');
  }
  return targetSizeBytes;
}

// Keep byte counts visible too, since rounded KB values can hide small differences.
export function formatSize(sizeBytes: number): string {
  if (sizeBytes < 1000) return `${sizeBytes} bytes`;
  if (sizeBytes < 1000000) return `${(sizeBytes / 1000).toFixed(2)} KB`;
  return `${(sizeBytes / 1000000).toFixed(2)} MB`;
}

// Inspect file signatures rather than trusting an extension or supplied MIME type.
export function detectImageType(header: Uint8Array): ImageType {
  const text = String.fromCharCode(...header);
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((value, index) => header[index] === value)) return 'image/png';
  if (text.startsWith('RIFF') && text.slice(8,12) === 'WEBP') return 'image/webp';
  if (text.startsWith('GIF87a') || text.startsWith('GIF89a')) return 'image/gif';
  if (text.startsWith('BM')) return 'image/bmp';
  throw new Error('Unsupported file. Choose a JPG, PNG, WebP, GIF, or BMP image. PDFs and videos are not supported.');
}

// Decode locally and release the temporary URL even when a corrupt image fails.
export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  if (typeof Image === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('This browser cannot load image previews. Try a current browser.');
  }
  const header = new Uint8Array(await file.slice(0,12).arrayBuffer());
  const type = detectImageType(header);
  const image = new Image();
  const temporaryUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { image.src = ''; reject(new Error('The image took too long to open. Try a smaller image.')); }, 30000);
      image.onload = () => { clearTimeout(timeout); resolve(); };
      image.onerror = () => { clearTimeout(timeout); reject(new Error('This image is corrupt or uses an encoding your browser cannot read. Try another image.')); };
      image.src = temporaryUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('This image has no readable pixel dimensions.');
    return { file, image, type, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    image.onload = null;
    image.onerror = null;
    URL.revokeObjectURL(temporaryUrl);
  }
}

// Preserve PNG and WebP; GIF/BMP use WebP to preserve possible transparency.
export function chooseOutputType(type: ImageType, convertPng: boolean): OutputType {
  if (type === 'image/png' && !convertPng) return 'image/png';
  if (type === 'image/jpeg') return 'image/jpeg';
  return 'image/webp';
}

// Derive the extension from the actual blob, including skipped original files.
export function getDownloadName(originalName: string, type: string, skipped: boolean): string {
  if (skipped) return originalName;
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return `${originalName.replace(/\.[^.]+$/, '')}-compressed.${extension}`;
}

// Wrap the callback API and detect browsers that silently fall back to PNG.
async function encodeCanvas(canvas: HTMLCanvasElement, outputType: OutputType, quality: number, signal: AbortSignal): Promise<Blob> {
  signal.throwIfAborted();
  if (typeof canvas.toBlob !== 'function') throw new Error('This browser does not support image compression with Canvas.');
  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) reject(new Error('The browser could not encode this image. Try a smaller image.'));
      else resolve(blob);
    }, outputType, quality);
  });
  signal.throwIfAborted();
  if (compressedBlob.type !== outputType) throw new Error(`This browser cannot export ${outputType.split('/')[1].toUpperCase()}. Try another browser or keep PNG format.`);
  return compressedBlob;
}

// Search quality at a fixed resolution, retaining the closest measured candidate.
async function searchQuality(canvas: HTMLCanvasElement, outputType: OutputType, targetSizeBytes: number, signal: AbortSignal): Promise<CompressionResult> {
  let lowerQuality = 0;
  let upperQuality = 1;
  let bestResult: CompressionResult | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    // Check both endpoints before binary search so tiny and large targets are covered.
    const quality = attempt === 0 ? 1 : attempt === 1 ? 0 : (lowerQuality + upperQuality) / 2;
    const compressedBlob = await encodeCanvas(canvas, outputType, quality, signal);
    const difference = Math.abs(compressedBlob.size - targetSizeBytes);
    if (!bestResult || difference < Math.abs(bestResult.blob.size - targetSizeBytes)) {
      bestResult = { blob: compressedBlob, width: canvas.width, height: canvas.height, quality, skipped: false, message: '', warning: '' };
    }
    if (difference <= targetSizeBytes * 0.05) break;
    if (attempt < 2) continue;
    if (compressedBlob.size > targetSizeBytes) upperQuality = quality;
    else lowerQuality = quality;
  }
  return bestResult!;
}

// Return the source unchanged when recompression cannot save useful bytes.
function originalResult(photo: LoadedPhoto, message: string): CompressionResult {
  return { blob: photo.file, width: photo.width, height: photo.height, quality: 1, skipped: true, message, warning: '' };
}

// Keep all Canvas work outside React; quality search is followed by bounded resizing.
export async function compressPhoto(photo: LoadedPhoto, targetSizeBytes: number, convertPng: boolean, signal: AbortSignal): Promise<CompressionResult> {
  signal.throwIfAborted();
  if (!Number.isSafeInteger(targetSizeBytes) || targetSizeBytes < 1) throw new Error('Enter a valid positive target size.');
  if (targetSizeBytes >= photo.file.size) return originalResult(photo, 'Your original is already at or below this target. Compression was skipped.');
  if (photo.width * photo.height > 40000000 || photo.width > 16384 || photo.height > 16384) {
    throw new Error('This image is too large for reliable browser compression. Choose an image under 40 megapixels and 16,384 pixels per side.');
  }
  const outputType = chooseOutputType(photo.type, convertPng);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable in this browser. Try a different browser.');
  let bestResult: CompressionResult | null = null;
  let width = photo.width;
  let height = photo.height;
  try {
    for (let resizeAttempt = 0; resizeAttempt < 8; resizeAttempt++) {
      signal.throwIfAborted();
      canvas.width = width;
      canvas.height = height;
      context.drawImage(photo.image, 0, 0, width, height);
      if (outputType === 'image/png') {
        const compressedBlob = await encodeCanvas(canvas, outputType, 1, signal);
        if (compressedBlob.size >= photo.file.size) return originalResult(photo, 'Lossless PNG re-encoding did not make this file smaller. Convert to WebP to reduce it further.');
        return { blob: compressedBlob, width, height, quality: 1, skipped: false, message: 'PNG kept lossless at its original dimensions.', warning: Math.abs(compressedBlob.size - targetSizeBytes) > targetSizeBytes * 0.05 ? 'PNG has no adjustable lossy quality. This is the available lossless result; convert to WebP to get closer to your target.' : '' };
      }
      const candidate = await searchQuality(canvas, outputType, targetSizeBytes, signal);
      if (!bestResult || Math.abs(candidate.blob.size - targetSizeBytes) < Math.abs(bestResult.blob.size - targetSizeBytes)) bestResult = candidate;
      if (Math.abs(candidate.blob.size - targetSizeBytes) <= targetSizeBytes * 0.05) break;
      // If even this candidate is smaller than requested, downsizing cannot help.
      if (candidate.blob.size <= targetSizeBytes || (width === 1 && height === 1)) break;
      const scale = Math.max(0.1, Math.min(0.8, Math.sqrt(targetSizeBytes / candidate.blob.size) * 0.9));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
    if (!bestResult) throw new Error('No compressed image could be created. Try another file.');
    if (bestResult.blob.size >= photo.file.size) return originalResult(photo, 'Re-encoding did not reduce this image. The original file has been kept.');
    const warnings: string[] = [];
    if (bestResult.quality < 0.4 || bestResult.width < photo.width || bestResult.height < photo.height) warnings.push('Quality may be significantly reduced. Resolution or encoding quality was lowered to approach this target.');
    if (Math.abs(bestResult.blob.size - targetSizeBytes) > targetSizeBytes * 0.05) warnings.push('The target could not be reached within 5%. This is the closest result found; exact byte sizes are not guaranteed.');
    bestResult.message = 'Compression complete. Preview the result before downloading.';
    bestResult.warning = warnings.join(' ');
    return bestResult;
  } finally {
    // Release the large pixel buffer when this job finishes or is cancelled.
    canvas.width = 0;
    canvas.height = 0;
  }
}
