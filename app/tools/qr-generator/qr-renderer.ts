import encodeQR from 'qr';
import type { QrSettings } from './qr-types';

// Validate color syntax and resolution; color combinations are the user's choice.
export function validateSettings(settings: QrSettings): void {
  if (!/^#[\da-f]{6}$/i.test(settings.foreground) || !/^#[\da-f]{6}$/i.test(settings.background)) throw new Error('Choose valid QR and background colors.');
  if (![256,512,1024,2048].includes(settings.size)) throw new Error('Choose a supported output resolution.');
}

// The library handles all QR encoding. Request four quiet-zone modules and medium ECC.
export function createQrMatrix(content: string): boolean[][] {
  try { return encodeQR(content, 'raw', { ecc:'medium', border:4 }); }
  catch { throw new Error('This content does not fit in a QR code. Shorten it and try again.'); }
}

// Draw square modules on integer pixels; center spare pixels without stretching or antialiasing.
export function drawQr(canvas: HTMLCanvasElement, content: string, settings: QrSettings): void {
  validateSettings(settings);
  const matrix = createQrMatrix(content);
  const moduleSize = Math.floor(settings.size / matrix.length);
  if (moduleSize < 3) throw new Error('This code is dense. Choose 512 px or a larger resolution for reliable scanning.');
  canvas.width = settings.size;
  canvas.height = settings.size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable. Try a current browser.');
  context.fillStyle = settings.background;
  context.fillRect(0,0,settings.size,settings.size);
  context.fillStyle = settings.foreground;
  const offset = Math.floor((settings.size - matrix.length * moduleSize) / 2);
  matrix.forEach((row, y) => row.forEach((filled,x) => {
    if (filled) context.fillRect(offset + x * moduleSize, offset + y * moduleSize, moduleSize, moduleSize);
  }));
}

// Render only after user action; no input or generated image is sent to a server.
export async function renderQrPng(content: string, settings: QrSettings): Promise<Blob> {
  const canvas = document.createElement('canvas');
  try {
    drawQr(canvas, content, settings);
    if (!canvas.toBlob) throw new Error('PNG export is unavailable in this browser.');
    return await new Promise<Blob>((resolve,reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('The browser could not create the PNG. Try a smaller output size.'));
    }, 'image/png'));
  } finally { canvas.width = 0; canvas.height = 0; }
}

// Numbered file names avoid duplicate SSIDs, filesystem characters, and credential leakage.
export function qrFilename(index: number): string {
  return `qr-${String(index + 1).padStart(3,'0')}.png`;
}
