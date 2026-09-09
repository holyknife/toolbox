import type { QrEntry, QrInput, WifiInput } from './qr-types';

export const MAX_BATCH = 100;
export const MAX_CONTENT_BYTES = 2000;

// QR capacities count encoded bytes, not JavaScript characters (important for Nepali text).
export function validateContent(content: string): string {
  if (!content.trim()) throw new Error('Enter some content for your QR code.');
  if (new TextEncoder().encode(content).length > MAX_CONTENT_BYTES) throw new Error('This entry is too long. Keep each QR below 2,000 UTF-8 bytes.');
  return content;
}

// WiFi fields use backslash escapes so punctuation cannot introduce another field.
export function escapeWifi(value: string): string {
  return value.replace(/[\\;,:\"]/g, character => `\\${character}`);
}

// Refuse incomplete credentials instead of producing a plausible but unusable join code.
export function validateWifi(input: WifiInput): void {
  const bytes = new TextEncoder().encode(input.ssid).length;
  if (bytes < 1 || bytes > 32 || /[\x00-\x1f\x7f]/.test(input.ssid)) throw new Error('Network name must contain 1–32 UTF-8 bytes without control characters.');
  if (!['WPA', 'WEP', 'nopass'].includes(input.encryption)) throw new Error('Choose WPA/WPA2, WEP, or None.');
  if (input.encryption === 'nopass') return;
  if (/[\x00-\x1f\x7f]/.test(input.password)) throw new Error('WiFi passwords cannot contain control characters.');
  const passwordBytes = new TextEncoder().encode(input.password).length;
  if (input.encryption === 'WPA' && !((passwordBytes >= 8 && passwordBytes <= 63) || /^[a-f0-9]{64}$/i.test(input.password))) throw new Error('WPA/WPA2 needs an 8–63 byte password or a 64-digit hexadecimal key.');
  if (input.encryption === 'WEP' && !(/^[\x20-\x7e]{5}$|^[\x20-\x7e]{13}$|^[a-f0-9]{10}$|^[a-f0-9]{26}$/i.test(input.password))) throw new Error('WEP needs 5 or 13 ASCII characters, or 10 or 26 hexadecimal digits.');
}

// ZXing's widely recognized format: WIFI:T:WPA;S:ssid;P:password;H:true;;
// T:nopass means open WiFi; the password field is omitted for an open network.
export function buildWifi(input: WifiInput): string {
  validateWifi(input);
  let content = `WIFI:T:${input.encryption};S:${escapeWifi(input.ssid)};`;
  if (input.encryption !== 'nopass') content += `P:${escapeWifi(input.password)};`;
  if (input.hidden) content += 'H:true;';
  return content + ';';
}

// Restrict recipient syntax to one address, preventing accidental mailto header injection.
function emailAddress(value: string): string {
  const email = value.trim();
  if (!/^[^\s@<>?&#]+@[^\s@<>?&#]+\.[^\s@<>?&#]+$/.test(email)) throw new Error('Enter one valid email address.');
  return email;
}

// Remove visual separators while retaining an optional international prefix.
function phoneNumber(value: string): string {
  const phone = value.trim().replace(/[\s().-]/g, '');
  if (!/^\+?\d{3,20}$/.test(phone)) throw new Error('Enter a phone number using digits and an optional leading +.');
  return phone;
}

// vCard uses backslash escapes for text and CRLF separators, not URL encoding.
function escapeVcard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// vCard 3.0 folds long lines at 75 UTF-8 octets; continuation lines start with a space.
function foldVcardLine(value: string): string {
  let output = '';
  let lineBytes = 0;
  for (const character of value) {
    const bytes = new TextEncoder().encode(character).length;
    if (lineBytes + bytes > 75) { output += '\r\n '; lineBytes = 1; }
    output += character;
    lineBytes += bytes;
  }
  return output;
}

// FN is the displayed name; N has five structured fields. Keep the entered name intact.
function buildContact(input: Extract<QrInput, { type: 'contact' }>): string {
  if (!input.name.trim()) throw new Error('Enter a contact name.');
  const name = escapeVcard(input.name.trim());
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${name};;;;`, `FN:${name}`];
  if (input.phone.trim()) lines.push(`TEL;TYPE=CELL:${phoneNumber(input.phone)}`);
  if (input.email.trim()) lines.push(`EMAIL;TYPE=INTERNET:${escapeVcard(emailAddress(input.email))}`);
  lines.push('END:VCARD');
  return lines.map(foldVcardLine).join('\r\n') + '\r\n';
}

// Each content type owns its syntax; UI code never needs to concatenate protocol fields.
export function buildQrContent(input: QrInput): string {
  let content: string;
  switch (input.type) {
    case 'text': content = input.text; break;
    case 'wifi': content = buildWifi(input); break;
    case 'contact': content = buildContact(input); break;
    case 'phone': content = `tel:${phoneNumber(input.phone)}`; break;
    case 'email': {
      const recipient = encodeURIComponent(emailAddress(input.recipient)).replace(/%40/g, '@');
      const body = input.body.replace(/\r\n|\r|\n/g, '\r\n');
      content = `mailto:${recipient}?subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(body)}`;
      break;
    }
  }
  return validateContent(content);
}

// Batch text is deliberately one independent text/URL entry per non-empty line.
export function buildTextBatch(text: string): QrEntry[] {
  const lines = text.split(/\r\n|\r|\n/).filter(line => line.trim().length > 0);
  if (!lines.length) throw new Error('Paste at least one text or URL entry.');
  if (lines.length > MAX_BATCH) throw new Error(`Generate up to ${MAX_BATCH} entries at a time.`);
  return lines.map((content, index) => {
    try { return { label: `Entry ${index + 1}`, content: validateContent(content) }; }
    catch { throw new Error(`Entry ${index + 1} is too long. Keep each entry below 2,000 UTF-8 bytes.`); }
  });
}
