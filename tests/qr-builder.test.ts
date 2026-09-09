import { test } from 'node:test';
import assert from 'node:assert/strict';
import decodeQR from 'qr/decode.js';
import { buildQrContent, buildTextBatch, buildWifi, validateWifi } from '../app/tools/qr-generator/qr-builder';
import { createQrMatrix, drawQr, validateSettings } from '../app/tools/qr-generator/qr-renderer';
import type { QrInput } from '../app/tools/qr-generator/qr-types';

test('WiFi escapes reserved delimiters and omits passwords on open networks', () => {
  assert.equal(buildWifi({ ssid:'A;B:C,D"E\\', password:'p;:s,"\\word', encryption:'WPA', hidden:true }), 'WIFI:T:WPA;S:A\\;B\\:C\\,D\\"E\\\\;P:p\\;\\:s\\,\\"\\\\word;H:true;;');
  assert.equal(buildWifi({ ssid:'Guest', password:'ignored!', encryption:'nopass' }), 'WIFI:T:nopass;S:Guest;;');
  assert.throws(() => validateWifi({ ssid:'x'.repeat(33), password:'password', encryption:'WPA' }));
  assert.throws(() => validateWifi({ ssid:'Home', password:'short', encryption:'WPA' }));
  assert.equal(buildWifi({ ssid:'Legacy', password:'abcde', encryption:'WEP' }), 'WIFI:T:WEP;S:Legacy;P:abcde;;');
});

test('vCard escapes fields, uses CRLF, and cannot inject a second property', () => {
  const content = buildQrContent({ type:'contact', name:'Doe; Jane, Jr.\nTITLE:Fake', phone:'+977 (980) 123-4567', email:'jane@example.com' });
  assert.ok(content.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
  assert.ok(content.includes('FN:Doe\\; Jane\\, Jr.\\nTITLE:Fake\r\n'));
  assert.ok(content.includes('TEL;TYPE=CELL:+9779801234567'));
  assert.ok(content.endsWith('END:VCARD\r\n'));
  assert.ok(!content.includes('\r\nTITLE:'));
  const long = buildQrContent({ type:'contact', name:'नेपाल'.repeat(30), phone:'', email:'' });
  for (const line of long.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
});

test('mailto and tel preserve intent without URI/header injection', () => {
  const content = buildQrContent({ type:'email', recipient:'hello+tag@example.com', subject:'Hello & goodbye?', body:'Line 1\nनेपाल' });
  assert.ok(content.startsWith('mailto:hello%2Btag@example.com?subject=Hello%20%26%20goodbye%3F&body='));
  assert.ok(content.includes('%0D%0A'));
  assert.equal(buildQrContent({ type:'phone', phone:'+1 (202) 555-0123' }), 'tel:+12025550123');
  assert.throws(() => buildQrContent({ type:'email', recipient:'a@example.com?bcc=b@example.com', subject:'', body:'' }));
  assert.throws(() => buildQrContent({ type:'phone', phone:'123;phone-context=evil' }));
});

test('batches ignore blank lines, preserve values, and enforce entry limits', () => {
  const result = buildTextBatch('https://example.com\r\n\r\n  hello  ');
  assert.deepEqual(result.map(entry => entry.content),['https://example.com','  hello  ']);
  assert.throws(() => buildTextBatch('\n\n'));
  assert.throws(() => buildTextBatch(Array(101).fill('hello').join('\n')));
  assert.throws(() => buildTextBatch('a\n' + 'é'.repeat(1001)), /Entry 2/);
});

test('settings allow any color combination but reject invalid color syntax', () => {
  validateSettings({ foreground:'#202631', background:'#ffffff', size:512 });
  for (const [foreground,background] of [['#ffffff','#000000'],['#aaaaaa','#eeeeee'],['#202631','#202631']]) {
    assert.doesNotThrow(() => validateSettings({ foreground,background,size:512 }));
  }
  assert.throws(() => validateSettings({ foreground:'garbage',background:'#ffffff',size:512 }));
});

// Exercise the same integer-pixel draw routine as the browser, then decode its RGBA raster.
test('all payload types round-trip through the actual QR library and renderer', () => {
  const inputs: QrInput[] = [
    { type:'text',text:'https://example.com/?hello=नेपाल' },
    { type:'wifi',ssid:'Home;Guest',password:'p\\a;ssword',encryption:'WPA' },
    { type:'contact',name:'Jane Doe',phone:'+123456789',email:'jane@example.com' },
    { type:'email',recipient:'hi@example.com',subject:'Hello!',body:'How are you?' },
    { type:'phone',phone:'+9779801234567' },
  ];
  for (const input of inputs) {
    const content = buildQrContent(input);
    const size = 512;
    const data = new Uint8ClampedArray(size * size * 4);
    const context = {
      fillStyle:'#ffffff',
      fillRect(x:number,y:number,width:number,height:number) {
        assert.ok([x,y,width,height].every(Number.isInteger));
        const channels = [1,3,5].map(offset => parseInt(this.fillStyle.slice(offset,offset + 2),16));
        for (let row = y; row < y + height; row++) for (let column = x; column < x + width; column++) data.set([...channels,255],(row * size + column) * 4);
      },
    };
    const canvas = { width:0,height:0,getContext:() => context } as unknown as HTMLCanvasElement;
    drawQr(canvas,content,{ foreground:'#202631',background:'#ffffff',size });
    assert.equal(canvas.width,size);
    assert.equal(decodeQR({ width:size,height:size,data }),content);
    const matrix = createQrMatrix(content);
    for (let index = 0; index < 4; index++) {
      assert.ok(matrix[index].every(value => !value));
      assert.ok(matrix[matrix.length - 1 - index].every(value => !value));
      assert.ok(matrix.every(row => !row[index] && !row[row.length - 1 - index]));
    }
  }
});
