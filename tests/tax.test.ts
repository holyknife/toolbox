import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveTax } from '../app/tools/calculators/tax';

test('VAT fills the after-tax price from rate and before-tax price', () => {
  const result = solveTax({rate:'13',before:'1000',after:''});
  assert.equal(result.filled,'after');
  assert.ok(Math.abs(result.after - 1130) < 1e-8);
  assert.ok(Math.abs(result.tax - 130) < 1e-8);
});
test('VAT fills the before-tax price from inclusive price and rate', () => {
  const result = solveTax({rate:'13',before:'',after:'1130'});
  assert.equal(result.filled,'before');
  assert.ok(Math.abs(result.before - 1000) < 1e-8);
});
test('VAT derives the rate from both prices', () => {
  const result = solveTax({rate:'',before:'1000',after:'1130'});
  assert.equal(result.filled,'rate');
  assert.equal(result.rate,13);
});
test('VAT treats zero as input, handles rounded bills, and rejects inconsistent or insufficient inputs', () => {
  assert.equal(solveTax({rate:'0',before:'100',after:''}).after,100);
  assert.equal(solveTax({rate:'13',before:'0',after:''}).after,0);
  assert.equal(solveTax({rate:'',before:'100',after:'100'}).rate,0);
  assert.equal(solveTax({rate:'13',before:'100',after:'113'}).filled,null);
  assert.equal(solveTax({rate:'13',before:'19.99',after:'22.59'}).filled,null);
  for (const fields of [
    {rate:'13',before:'',after:''},
    {rate:'',before:'0',after:'0'},
    {rate:'',before:'100',after:'90'},
    {rate:'13',before:'100',after:'120'},
    {rate:'-1',before:'100',after:''},
  ]) assert.throws(() => solveTax(fields));
});
