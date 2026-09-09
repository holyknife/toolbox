import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { parseMiuiBackup } from '../app/tools/qr-generator/miui-bak-parser';
import { buildWifi } from '../app/tools/qr-generator/qr-builder';

const config = 'network={\nssid="Home;Guest"\npsk="testpassword"\nkey_mgmt=WPA-PSK\nscan_ssid=1\n}\nnetwork={\nssid="Cafe"\nkey_mgmt=NONE\n}\n';
const encode = (value:string) => new TextEncoder().encode(value);
const miui = 'MIUI BACKUP\n2\ncom.android.settings Wi-Fi settings\n-1\n0\n';

// Fixtures are synthetic, never copied from a user's credential backup.
function combine(...arrays: Uint8Array[]): ArrayBuffer {
  const combined = new Uint8Array(arrays.reduce((total,part) => total + part.length,0));
  let offset = 0;
  for (const array of arrays) { combined.set(array,offset); offset += array.length; }
  return combined.buffer;
}

// Build a standards-shaped TAR fixture to test checksum, truncation, and archive handling.
function tar(payload: string, path = 'apps/com.android.settings/f/wpa_supplicant.conf'): Uint8Array {
  const content = encode(payload);
  const archive = new Uint8Array(512 + Math.ceil(content.length / 512) * 512 + 1024);
  archive.set(encode(path),0);
  archive.set(encode(content.length.toString(8).padStart(11,'0') + '\0'),124);
  archive.fill(32,148,156);
  archive[156] = 48;
  archive.set(encode('ustar\0'),257);
  const checksum = archive.subarray(0,512).reduce((total,byte) => total + byte,0);
  archive.set(encode(checksum.toString(8).padStart(6,'0') + '\0 '),148);
  archive.set(content,512);
  return archive;
}

test('plaintext and MIUI-prefixed records parse with exact credentials', async () => {
  for (const prefix of ['',miui]) {
    const result = await parseMiuiBackup(combine(encode(prefix + config)));
    assert.equal(result.networks.length,2);
    assert.equal(result.networks[0].ssid,'Home;Guest');
    assert.equal(result.networks[0].password,'testpassword');
    assert.equal(result.networks[1].encryption,'nopass');
    assert.match(buildWifi(result.networks[0]),/S:Home\\;Guest;/);
    assert.equal(result.networks[0].hidden,true);
  }
});

test('MIUI Android TAR works compressed and uncompressed', async () => {
  for (const compressed of [false,true]) {
    const body = tar(config);
    const result = await parseMiuiBackup(combine(encode(miui + `ANDROID BACKUP\n5\n${compressed ? '1' : '0'}\nnone\n`), compressed ? deflateSync(body) : body));
    assert.equal(result.networks.length,2);
  }
});

test('XML WiFi backup supports WPA, open networks, and preserved XML entities', async () => {
  const xml = '<?xml version="1.0"?><WifiBackupData><int name="Version" value="1"/><NetworkList><Network><WifiConfiguration><string name="SSID">&quot;Home &amp; Guest&quot;</string><string name="PreSharedKey">&quot;password123&quot;</string><byte-array name="AllowedKeyMgmt" num="1">02</byte-array><boolean name="HiddenSSID" value="true"/></WifiConfiguration></Network><Network><WifiConfiguration><string name="SSID">&quot;Open&quot;</string><null name="PreSharedKey"/><byte-array name="AllowedKeyMgmt" num="1">01</byte-array></WifiConfiguration></Network></NetworkList></WifiBackupData>';
  const result = await parseMiuiBackup(combine(encode(xml)));
  assert.equal(result.networks.length,2);
  assert.equal(result.networks[0].ssid,'Home & Guest');
  assert.equal(result.networks[0].password,'password123');
  assert.equal(result.networks[1].encryption,'nopass');
});

test('quoted braces, hex SSIDs, and escaped characters are parsed without guessing', async () => {
  const value = 'network={\nssid=4e6570616c\npsk="a}b\\\\c\\\"de"\nkey_mgmt=WPA-PSK\n}\n';
  const result = await parseMiuiBackup(combine(encode(value)));
  assert.equal(result.networks[0].ssid,'Nepal');
  assert.equal(result.networks[0].password,'a}b\\c"de');
});

test('unsupported networks are skipped with warnings, not converted into open WiFi', async () => {
  const result = await parseMiuiBackup(combine(encode(config + 'network={\nssid="Enterprise"\nkey_mgmt=WPA-EAP\n}\nnetwork={\nssid="Missing"\nkey_mgmt=WPA-PSK\n}\n')));
  assert.equal(result.networks.length,2);
  assert.ok(result.warnings.length > 0);
});

test('missing selected WEP keys never produce an open-network QR', async () => {
  const result = await parseMiuiBackup(combine(encode(config + 'network={\nssid="Broken WEP"\nwep_key0="abcde"\nwep_tx_keyidx=3\nkey_mgmt=NONE\n}\n')));
  assert.equal(result.networks.length,2);
  assert.ok(result.warnings.length > 0);
});

test('encrypted, malformed, wrong-type, and truncated backups fail with manual fallback', async () => {
  for (const value of ['', '%PDF-1.4 network garbage', miui.replace('\n2\n','\n9\n') + config, 'ANDROID BACKUP\n5\n0\nAES-256\n', 'ANDROID BACKUP\n5\n1\nnone\nnotzlib', 'network={\nssid="Broken"\n', '<WifiBackupData><NetworkList></WifiBackupData>']) {
    await assert.rejects(parseMiuiBackup(combine(encode(value))),/manually/);
  }
  const broken = tar(config);
  broken[0] ^= 1;
  await assert.rejects(parseMiuiBackup(combine(encode('ANDROID BACKUP\n5\n0\nnone\n'),broken)),/checksum/);
  await assert.rejects(parseMiuiBackup(combine(encode('ANDROID BACKUP\n5\n0\nnone\n'),tar(config).subarray(0,600))),/invalid|unexpectedly/);
});


// Reproduce the vendor structure using invented credentials, never the user's backup.
test('MIUI settings archive imports Android-named fields and skips SAE/OWE safely', async () => {
  const record = (name: string, security: string, password = '"password123"') =>
    `network={\nConfigKey="${name}"WPA_PSK\nSSID="${name}"\nPreSharedKey=${password}\nWEPTxKeyIndex=0\nHiddenSSID=false\nAllowedKeyMgmt=${security}\n}\n`;
  const payload = record('Example','02') + record('Example','0001') + record('Open','01','null') + record('Enhanced open','0002','null');
  for (const compressed of [false,true]) {
    const archive = tar(payload,'apps/com.android.settings/miui_bak/_tmp_bak');
    const result = await parseMiuiBackup(combine(encode(miui + `ANDROID BACKUP\n5\n${compressed ? '1' : '0'}\nnone\n`),compressed ? deflateSync(archive) : archive));
    assert.deepEqual(result.networks.map(network => [network.ssid,network.encryption,network.password]),[['Example','WPA','password123'],['Open','nopass','']]);
    assert.ok(result.warnings.length);
  }
});

test('MIUI incomplete passwords and mixed field formats are rejected', async () => {
  for (const extra of ['PreSharedKey=null', 'PreSharedKey="password123"\nkey_mgmt=NONE']) {
    await assert.rejects(parseMiuiBackup(combine(encode(`network={\nSSID="Example"\nAllowedKeyMgmt=02\nHiddenSSID=false\n${extra}\n}`))),/manually/);
  }
});
