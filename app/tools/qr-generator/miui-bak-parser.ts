/**
 * Community reverse-engineering, NOT an official Xiaomi specification.
 * Known MIUI v2 backups prepend five newline-terminated fields to Android backup
 * data: magic, version, package/display name, feature ID, encryption flag.
 * https://github.com/nelenkov/android-backup-extractor/pull/79
 * Android BACKUP then has version, zlib flag, encryption algorithm, and TAR data.
 * https://github.com/nelenkov/android-backup-extractor
 * WiFi payloads use wpa_supplicant network blocks or Android WifiConfigStore /
 * WifiBackupData XML. We recognize those structures, never guess from loose passwords.
 * Encrypted, vendor-specific, enterprise, and masked records are not recoverable here.
 */
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { validateWifi } from './qr-builder';
import type { BackupResult, ImportedNetwork, WifiInput } from './qr-types';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 40 * 1024 * 1024;
const MAX_NETWORKS = 500;
const FALLBACK = ' You can still add networks manually in the WiFi tab.';
const decoder = new TextDecoder('utf-8', { fatal:true });

// Errors must explain the unsupported boundary without exposing any backup contents.
function failure(message: string): Error { return new Error(message + FALLBACK); }

// Decode strictly: replacement characters could turn a corrupt password into a wrong QR.
function text(bytes: Uint8Array): string {
  try { return decoder.decode(bytes); }
  catch { throw failure('The WiFi data is not valid UTF-8 text.'); }
}

// Consume only documented header lines; never scan arbitrary offsets for a magic string.
function readLine(bytes: Uint8Array, offset: number): { value: string; next: number } {
  const end = bytes.indexOf(10, offset);
  if (end < offset || end - offset > 4096) throw failure('The backup header is incomplete.');
  return { value:text(bytes.subarray(offset,end)).replace(/\r$/, ''), next:end + 1 };
}

// Stream decompression with a hard expanded-size ceiling to bound memory use.
async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') throw failure('This browser cannot unpack compressed Android backups. Try a current browser.');
  const reader = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_EXPANDED_BYTES) throw failure('This backup expands beyond the 40 MB limit. Export only WiFi settings.');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error instanceof Error && error.message.includes(FALLBACK)) throw error;
    throw failure('The compressed backup is corrupt or uses an unsupported format.');
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk,offset); offset += chunk.length; }
  return result;
}

// Validate TAR checksums and lengths. Read regular WiFi files only; never extract paths to disk.
function tarWifiFiles(bytes: Uint8Array): Uint8Array[] {
  const files: Uint8Array[] = [];
  let offset = 0;
  let entries = 0;
  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset,offset + 512);
    if (header.every(value => value === 0)) {
      if (bytes.length < offset + 1024 || !bytes.subarray(offset).every(value => value === 0)) throw failure('The backup archive is truncated or has an invalid ending.');
      return files;
    }
    if (++entries > 10000) throw failure('This backup contains too many archive entries. Export only WiFi settings.');
    const field = (start: number, length: number) => text(header.subarray(start,start + length)).replace(/\0.*$/s,'').trim();
    const sizeText = field(124,12);
    const checksumText = field(148,8);
    if (!/^[0-7]+$/.test(sizeText) || !/^[0-7]+$/.test(checksumText)) throw failure('The archive header is invalid.');
    const size = parseInt(sizeText,8);
    const checksum = header.reduce((sum,value,index) => sum + (index >= 148 && index < 156 ? 32 : value),0);
    if (checksum !== parseInt(checksumText,8) || size > MAX_EXPANDED_BYTES || offset + 512 + size > bytes.length) throw failure('The archive checksum or file length is invalid.');
    const path = field(345,155) + '/' + field(0,100);
    const type = header[156];
    const isMiuiSettings = path === '/apps/com.android.settings/miui_bak/_tmp_bak';
    if ((type === 0 || type === 48) && (isMiuiSettings || /(?:wifi|wpa_supplicant|bcm_supp)/i.test(path))) files.push(bytes.subarray(offset + 512,offset + 512 + size));
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  throw failure('The backup archive ended unexpectedly.');
}

// Quoted supplicant fields may contain C-style escapes, including UTF-8 hex bytes.
function decodeQuoted(value: string): string {
  if (!value.startsWith('"') || !value.endsWith('"')) throw new Error('Expected quoted field');
  const body = value.slice(1,-1);
  const bytes: number[] = [];
  for (let index = 0; index < body.length;) {
    if (body[index] !== '\\') {
      const character = String.fromCodePoint(body.codePointAt(index)!);
      bytes.push(...new TextEncoder().encode(character));
      index += character.length;
      continue;
    }
    const escape = body[++index];
    const simple: Record<string, number> = { '\\':92, '"':34, n:10, r:13, t:9, e:27 };
    if (simple[escape] !== undefined) { bytes.push(simple[escape]); index++; }
    else if (escape === 'x' && /^[a-f\d]{2}$/i.test(body.slice(index + 1,index + 3))) { bytes.push(parseInt(body.slice(index + 1,index + 3),16)); index += 3; }
    else { throw new Error('Unsupported escape'); }
  }
  return text(new Uint8Array(bytes));
}

// Unquoted SSIDs are hexadecimal octets; ordinary passwords must remain quoted.
function decodeSsid(value: string): string {
  if (value.startsWith('"')) return decodeQuoted(value);
  if (!/^(?:[a-f\d]{2})+$/i.test(value)) throw new Error('Invalid hexadecimal SSID');
  return text(new Uint8Array(value.match(/../g)!.map(pair => parseInt(pair,16))));
}

// Masked and encrypted placeholders cannot be turned back into working credentials.
function addNetwork(network: WifiInput, networks: WifiInput[]): void {
  if (/^\*+$/.test(network.password) || ['<removed>', '<encrypted>', 'null'].includes(network.password.toLowerCase())) throw new Error('Password unavailable');
  validateWifi(network);
  if (networks.length >= MAX_NETWORKS) throw failure('This backup has more than 500 networks. Export a smaller backup.');
  networks.push(network);
}

// Observed MIUI settings TAR payload: network blocks with SSID/PreSharedKey fields.
// Android KeyMgmt bits: NONE=0, WPA_PSK=1, FT_PSK=6, SAE=8, OWE=9.
// https://developer.android.com/reference/android/net/wifi/WifiConfiguration.KeyMgmt
// This vendor layout is community reverse-engineering, not an official Xiaomi spec.
function normalizeMiuiFields(fields: Record<string,string>): void {
  if (fields.key_mgmt !== undefined || fields.ssid !== undefined || fields.psk !== undefined) throw new Error('Mixed record formats');
  const encoded = fields.AllowedKeyMgmt;
  if (!/^(?:[a-f\d]{2})+$/i.test(encoded)) throw new Error('Invalid security bitset');
  const bytes = encoded.match(/../g)!.map(pair => parseInt(pair,16));
  if (bytes.slice(1).some(byte => byte !== 0)) throw new Error('Unsupported SAE/OWE or enterprise security');
  const bits = bytes[0];
  if (bits === 1) fields.key_mgmt = 'NONE';
  else if ((bits & 0x42) !== 0 && (bits & ~0x42) === 0) fields.key_mgmt = 'WPA-PSK';
  else throw new Error('Unsupported security');
  fields.ssid = fields.SSID || '';
  if (fields.PreSharedKey && fields.PreSharedKey !== 'null') fields.psk = fields.PreSharedKey;
  fields.wep_tx_keyidx = fields.WEPTxKeyIndex || '0';
  if (fields.HiddenSSID !== 'true' && fields.HiddenSSID !== 'false') throw new Error('Invalid hidden-network flag');
  fields.scan_ssid = fields.HiddenSSID === 'true' ? '1' : '0';
}

// Parse complete network={...} records with quoted braces allowed inside credentials.
function parseSupplicant(source: string, networks: WifiInput[], warnings: string[]): boolean {
  const blocks = [...source.matchAll(/^\s*network\s*=\s*\{((?:[^"{}]|"(?:\\.|[^"\\])*")*)\}/gm)];
  const starts = [...source.matchAll(/^\s*network\s*=\s*\{/gm)];
  if (!starts.length) return false;
  if (blocks.length !== starts.length) throw failure('A WiFi network block is incomplete or malformed.');
  for (const block of blocks) {
    try {
      const fields: Record<string,string> = {};
      for (const line of block[1].split(/\r?\n/)) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const pair = line.match(/^\s*(\w+)\s*=\s*("(?:\\.|[^"\\])*"|[^#]*?)\s*(?:#.*)?$/);
        if (!pair || fields[pair[1]] !== undefined) throw new Error('Malformed field');
        fields[pair[1]] = pair[2].trim();
      }
      // MIUI's settings export uses Android field names and little-endian bitset bytes.
      // Normalize only recognized records; SAE/OWE must never become open networks.
      if (fields.AllowedKeyMgmt !== undefined) normalizeMiuiFields(fields);
      const security = fields.key_mgmt;
      let encryption: WifiInput['encryption'];
      let password = '';
      if (security === 'WPA-PSK' || security === 'WPA-PSK FT-PSK') {
        encryption = 'WPA';
        // Raw 256-bit PSKs are not necessarily accepted as passphrases by phone QR readers.
        password = decodeQuoted(fields.psk || '');
      } else if (security === 'NONE') {
        const keyIndex = fields.wep_tx_keyidx || '0';
        if (!/^[0-3]$/.test(keyIndex)) throw new Error('Invalid WEP key index');
        const wepKey = fields[`wep_key${keyIndex}`];
        if (!wepKey && Object.keys(fields).some(name => /^wep_key[0-3]$/.test(name))) throw new Error('Selected WEP key is missing');
        encryption = wepKey ? 'WEP' : 'nopass';
        if (wepKey) password = wepKey.startsWith('"') ? decodeQuoted(wepKey) : wepKey;
        if (!wepKey && fields.psk) throw new Error('Conflicting security fields');
      } else throw new Error('Unsupported security');
      addNetwork({ ssid:decodeSsid(fields.ssid || ''), password, encryption, hidden:fields.scan_ssid === '1' }, networks);
    } catch (error) {
      if (error instanceof Error && error.message.includes('500 networks')) throw error;
      warnings.push('Skipped a network with incomplete credentials, unsupported security, or unreadable text.');
    }
  }
  return true;
}

// XML field names come from Android WifiConfigStore/WifiBackupData, not Xiaomi guesses.
function parseWifiXml(source: string, networks: WifiInput[], warnings: string[]): boolean {
  const trimmed = source.trim();
  if (!/<(?:WifiConfigStoreData|WifiBackupData)[\s>]/.test(trimmed)) return false;
  if (/<!DOCTYPE|<!ENTITY/i.test(trimmed) || XMLValidator.validate(trimmed) !== true) throw failure('The WiFi XML is malformed or contains unsupported declarations.');
  const parser = new XMLParser({ ignoreAttributes:false, parseTagValue:false, parseAttributeValue:false, trimValues:false, isArray:name => ['Network','string','byte-array','boolean','int','string-array','item'].includes(name) });
  const parsed = parser.parse(trimmed);
  const root = parsed.WifiConfigStoreData || parsed.WifiBackupData;
  const records = root?.NetworkList?.Network;
  if (!Array.isArray(records)) throw failure('The WiFi XML contains no supported network list.');
  for (const record of records) {
    try {
      const config = record.WifiConfiguration;
      if (!config) throw new Error('Missing configuration');
      const field = (tag: string, name: string) => {
        const matches = (config[tag] || []).filter((entry: Record<string,unknown>) => entry['@_name'] === name);
        if (matches.length > 1) throw new Error('Duplicate configuration field');
        return matches[0];
      };
      const ssid = field('string','SSID')?.['#text'];
      const key = field('string','PreSharedKey')?.['#text'];
      const keyManagement = field('byte-array','AllowedKeyMgmt')?.['#text'];
      if (typeof ssid !== 'string' || typeof keyManagement !== 'string' || !/^(?:[a-f\d]{2})+$/i.test(keyManagement)) throw new Error('Invalid configuration');
      const bits = keyManagement.match(/../g)!.map((pair: string) => parseInt(pair,16));
      if (bits.slice(1).some((byte: number) => byte !== 0)) throw new Error('Unsupported security');
      const firstByte = bits[0];
      let encryption: WifiInput['encryption'];
      let password = '';
      if ((firstByte & 0x42) !== 0 && (firstByte & ~0x42) === 0) {
        encryption = 'WPA';
        if (typeof key !== 'string') throw new Error('Password is not plaintext');
        password = decodeQuoted(key);
      } else if (firstByte === 1) {
        const keyIndex = Number(field('int','WEPKeyIndex')?.['@_value'] || 0);
        const wepKeys = field('string-array','WEPKeys');
        const wep = wepKeys?.item?.[keyIndex]?.['@_value'];
        if (!Number.isInteger(keyIndex) || keyIndex < 0 || keyIndex > 3 || (wepKeys && !wep)) throw new Error('Selected WEP key is missing');
        encryption = wep ? 'WEP' : 'nopass';
        if (wep) password = wep.startsWith('"') ? decodeQuoted(wep) : wep;
        if (key) throw new Error('Conflicting credentials');
      } else throw new Error('Unsupported security');
      addNetwork({ ssid:decodeSsid(ssid), password, encryption, hidden:field('boolean','HiddenSSID')?.['@_value'] === 'true' }, networks);
    } catch (error) {
      if (error instanceof Error && error.message.includes('500 networks')) throw error;
      warnings.push('Skipped an XML network with encrypted/missing credentials or unsupported security.');
    }
  }
  return true;
}

// Import recognized containers or exported WiFi config text. All credentials remain in memory.
async function parseBackupData(buffer: ArrayBuffer): Promise<BackupResult> {
  let bytes: Uint8Array = new Uint8Array(buffer);
  if (!bytes.length || bytes.length > MAX_BACKUP_BYTES) throw failure('Choose a non-empty WiFi backup smaller than 20 MB.');
  let format = 'WiFi configuration text';
  if (new TextDecoder().decode(bytes.subarray(0,12)).startsWith('MIUI BACKUP\n')) {
    let offset = 0;
    const lines: string[] = [];
    for (let index = 0; index < 5; index++) { const line = readLine(bytes,offset); lines.push(line.value); offset = line.next; }
    if (lines[1] !== '2') throw failure('This MIUI backup header version is not supported.');
    if (lines[4] !== '0') throw failure('Encrypted MIUI backups are not supported.');
    bytes = bytes.subarray(offset);
    format = 'MIUI v2 backup';
  }
  let payloads: Uint8Array[];
  if (new TextDecoder().decode(bytes.subarray(0,15)).startsWith('ANDROID BACKUP\n')) {
    let offset = 0;
    const lines: string[] = [];
    for (let index = 0; index < 4; index++) { const line = readLine(bytes,offset); lines.push(line.value); offset = line.next; }
    if (!/^[1-5]$/.test(lines[1]) || !/^[01]$/.test(lines[2])) throw failure('This Android backup version is not supported.');
    if (lines[3] !== 'none') throw failure('Encrypted Android backups are not supported.');
    bytes = bytes.subarray(offset);
    if (lines[2] === '1') bytes = await inflate(bytes);
    payloads = tarWifiFiles(bytes);
    format += ' / Android archive';
  } else if (new TextDecoder().decode(bytes.subarray(257,262)) === 'ustar') {
    payloads = tarWifiFiles(bytes);
    format += ' / TAR';
  } else {
    // Plaintext settings exports exist too. No arbitrary binary/string scraping is attempted.
    payloads = [bytes];
  }
  const networks: WifiInput[] = [];
  const warnings: string[] = [];
  for (const payload of payloads) {
    const source = text(payload);
    if (source.includes('\0')) { warnings.push('Skipped a binary WiFi payload from an unsupported backup version.'); continue; }
    if (!parseWifiXml(source,networks,warnings)) {
      const firstLine = source.split(/\r?\n/).find(line => line.trim() && !line.trim().startsWith('#')) || '';
      if (/^\s*\w+\s*=/.test(firstLine)) parseSupplicant(source,networks,warnings);
    }
  }
  if (!networks.length) {
    if (warnings.length) throw failure('This backup was opened, but its WiFi records use a layout or credential format this importer does not yet support. This does not mean your file is corrupt.');
    throw failure('This importer could not recognize WiFi records in this backup. A valid .bak file can use a different MIUI layout; the file extension alone does not identify that layout.');
  }
  const unique = networks.filter((network,index) => networks.findIndex(other => other.ssid === network.ssid && other.password === network.password && other.encryption === network.encryption && other.hidden === network.hidden) === index);
  return { networks:unique.map((network,index): ImportedNetwork => ({ ...network, id:`network-${index + 1}` })), warnings:[...new Set(warnings)].map(warning => `${warning} Review the imported list before continuing.`), format };
}

// Do not let unexpected vendor/XML errors leak raw content or omit the manual fallback.
export async function parseMiuiBackup(buffer: ArrayBuffer): Promise<BackupResult> {
  try { return await parseBackupData(buffer); }
  catch (error) {
    if (error instanceof Error && error.message.includes(FALLBACK)) throw error;
    throw failure('This backup could not be parsed safely. Its structure may be corrupt or unsupported.');
  }
}
