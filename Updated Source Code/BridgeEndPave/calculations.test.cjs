'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { calculate, totals } = require('./calculations.js');
const input = (change = {}) => ({ w1: 12, w2: 12, skew: 0, railHeight: 0, ...change });
const quantities = result => [result.pavement, result.expansionJoint, result.grooving, result.rail32, result.rail42];
const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);

test('zero-skew hand cases preserve all three rail rules and unrounded geometry', () => {
  const expected = [[0, 25, 55.56, 25, 55.56, 0, 0], [32, 26.833333, 57.59, 26.83, 54.44, 20, 0], [42, 27, 57.78, 27, 54.44, 0, 20]];
  for (const [railHeight, width, ...values] of expected) {
    const result = calculate(input({ railHeight }));
    assert.equal(result.width, width);
    assert.equal(result.widthBase, 24);
    assert.equal(result.sideA, 20);
    assert.equal(result.sideB, 20);
    assert.equal(result.clamped, false);
    assert.deepEqual(quantities(result), values);
  }
  const result = calculate(input({ railHeight: 32 }));
  close(result.grossArea, 59.62962888888889);
  close(result.railDeduction, 2.037037777777778);
  assert.equal(result.grooveDeduction, 3.148148);
});

test('45-degree clamped cases preserve the recovered approximate pi and rail deductions', () => {
  for (const [railHeight, expected] of [[0, [62.5, 35.36, 62.5, 0, 0]], [32, [67.08, 37.95, 63.94, 20, 0]], [42, [67.5, 38.18, 64.17, 0, 20]]]) {
    const result = calculate(input({ skew: 45, railHeight }));
    assert.equal(result.sideA, 10);
    assert.equal(result.clamped, true);
    assert.deepEqual(quantities(result), expected);
  }
  close(calculate(input({ skew: 45 })).sideB, 35.00000433012796);
});

test('A minimum is continuous across its switch and switches on the exact boundary', () => {
  const skew = Math.atan(20 / 25) * 180 / 3.141593;
  const before = calculate(input({ skew: skew - 1e-7 }));
  const boundary = calculate(input({ skew }));
  const after = calculate(input({ skew: skew + 1e-7 }));
  assert.equal(before.clamped, false);
  assert.ok(before.sideA > 10);
  assert.equal(boundary.sideA, 10);
  assert.equal(boundary.clamped, true);
  assert.equal(after.sideA, 10);
  assert.ok(after.sideB > 30);
  assert.deepEqual(quantities(before), quantities(after));
});

test('existing legacy report fixture matches its recorded rounded quantities', () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'evidence/existing-report-case.json'), 'utf8'));
  const result = calculate(fixture.input);
  assert.deepEqual(quantities(result), fixture.quantities);
  assert.equal(Number(result.sideA.toFixed(2)), 14.9);
  assert.equal(Number(result.sideB.toFixed(2)), 25.1);
});

test('decimal strings and a zero component width are accepted without type coercion surprises', () => {
  assert.deepEqual(calculate({ w1: ' 12 ', w2: '1.2e1', skew: '0', railHeight: '32' }), calculate(input({ railHeight: 32 })));
  assert.equal(calculate(input({ w1: 0, w2: 24 })).widthBase, 24);
});

test('blank, nonnumeric, nonfinite, structured, and out-of-domain inputs are rejected', () => {
  for (const field of ['w1', 'w2', 'skew', 'railHeight']) {
    for (const value of ['', ' ', true, false, null, undefined, [], {}, NaN, Infinity, -Infinity, '1e400', '12 feet', '0x20']) {
      assert.throws(() => calculate(input({ [field]: value })), Error, `${field}: ${String(value)}`);
    }
  }
  for (const change of [{ w1: -1 }, { w2: -1 }, { w1: 0, w2: 0 }, { w1: Number.MAX_VALUE, w2: Number.MAX_VALUE }, { skew: -1 }, { skew: 90 }, { skew: 100 }, { railHeight: 31 }, { railHeight: 33 }, { railHeight: 42.1 }, { skew: 89.999999 }]) assert.throws(() => calculate(input(change)));
  for (const value of [null, undefined, [], 'input', 1]) assert.throws(() => calculate(value));
});

test('rounding occurs per end before project totals and totals use integer cents', () => {
  const result = calculate(input());
  assert.equal(result.pavement, 55.56);
  assert.equal(totals([result, result, result]).pavement, 166.68);
  assert.notEqual(totals([result, result, result]).pavement, Math.round(result.grossArea * 3 * 100) / 100);
  assert.deepEqual(totals([]), { pavement: 0, expansionJoint: 0, grooving: 0, rail32: 0, rail42: 0 });
  const small = value => ({ pavement: value, expansionJoint: value, grooving: value, rail32: 0, rail42: 0 });
  assert.equal(totals([small(0.1), small(0.2)]).pavement, 0.3);
  assert.throws(() => totals([small(NaN)]));
  assert.throws(() => totals([small(-1)]));
  assert.throws(() => totals([small(1e20)]), /accurately/);
  assert.throws(() => totals(null));
});

test('browser classic script exposes the same API without CommonJS or network dependencies', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'calculations.js'), 'utf8'), context);
  assert.equal(vm.runInContext('BridgeEndPave.calculate({w1:12,w2:12,skew:0,railHeight:0}).pavement', context), 55.56);
});
