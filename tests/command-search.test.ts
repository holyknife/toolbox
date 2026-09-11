import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commands, searchCommands } from '../lib/command-search';

test('palette lists unique destinations and keeps registry order for an empty query', () => {
  assert.deepEqual(searchCommands('  '),commands);
  assert.equal(new Set(commands.map(command => command.href)).size,commands.length);
});
test('palette supports skipped-letter matches, categories, keywords and calculator navigation', () => {
  assert.equal(searchCommands('qrg')[0].href,'/tools/qr-generator');
  assert.equal(searchCommands('PREETI')[0].href,'/tools/preeti-to-unicode');
  assert.equal(searchCommands('loan emi')[0].href,'/tools/calculators/loan-emi');
  assert.ok(searchCommands('language').some(command => command.href === '/tools/nepali-typing'));
  assert.deepEqual(searchCommands('zzzznotatool'),[]);
});
