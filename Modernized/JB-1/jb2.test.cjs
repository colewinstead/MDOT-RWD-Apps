'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {calculateBox, pipeSizes, totalQuantities} = require('./calculations.js');
const none = () => ({span: 0, rise: 0, thickness: 0, skew: 0});
const pipe = (id = '24x24', skew = 0) => {
  const {span, rise, thickness} = pipeSizes.find(size => size.id === id);
  return {span, rise, thickness, skew};
};
const box = () => ({type: 'JB-2', height: null, pipes: [pipe(), none(), pipe(), none()]});
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test('JB-2 six-inch hand calculation and user-confirmed solid-wall counts', () => {
  const result = calculateBox(box());
  assert.equal(result.wallThicknessInches, 6);
  assert.deepEqual(result.widthsFeet, [51 / 12, 30 / 12, 51 / 12, 30 / 12]);
  assert.equal(result.heightFeet, 42 / 12);
  close(result.grossConcreteCubicYards, (26683.75 + 27324) / 46656);
  close(result.openingDeductionCubicYards, .182);
  close(result.concreteCubicYards, 54007.75 / 46656 - .182);
  assert.deepEqual(result.bars.slice(4).map(b => [b.mark, b.size, b.count, b.lengthInches]),
    [['B', 6, 5, 47], ['C', 6, 8, 26], ['D', 6, 12, 42], ['E', 6, 20, 26], ['F', 6, 12, 47]]);
  const aLength = Math.sqrt(196 + 27.5 ** 2);
  const wallAndSlabInches = 5 * 47 + 8 * 26 + 12 * 42 + 20 * 26 + 12 * 47;
  close(result.steelPounds, 4 * aLength / 12 * .668 + wallAndSlabInches / 12 * 1.502 + 3.3);
});

test('one large pipe switches every wall and every deduction to eight-inch values', () => {
  const input = box(); input.pipes[2] = pipe('48x48');
  const result = calculateBox(input);
  assert.equal(result.wallThicknessInches, 8);
  close(result.widthsFeet[0], 83 / 12);
  close(result.heightFeet, 73 / 12);
  close(result.grossConcreteCubicYards, (43227.75 + 99328) / 46656);
  close(result.openingDeductionCubicYards, .121 + .453);
  assert.ok(result.bars.filter(b => ['B', 'C', 'D'].includes(b.mark)).every(b => b.size === 7));
  assert.ok(result.bars.filter(b => ['E', 'F'].includes(b.mark)).every(b => b.size === 6));
  input.pipes[2] = pipe('51x31');
  assert.equal(calculateBox(input).wallThicknessInches, 8);
  for (const id of ['42x42', '44x27']) {
    input.pipes[2] = pipe(id); assert.equal(calculateBox(input).wallThicknessInches, 6);
  }
});

test('all 18 listed pipes use the JB-2 drawing deduction and wall threshold', () => {
  const expected = [
    ['18x18', 6, .053, .071], ['24x24', 6, .091, .121], ['30x30', 6, .138, .184], ['36x36', 6, .196, .261], ['42x42', 6, .263, .350],
    ['48x48', 8, .453, .453], ['54x54', 8, .569, .569], ['60x60', 8, .699, .699], ['66x66', 8, .840, .840], ['72x72', 8, .996, .996],
    ['22x13', 6, .053, .071], ['29x18', 6, .087, .116], ['36x23', 6, .129, .172], ['44x27', 6, .185, .247],
    ['51x31', 8, .327, .327], ['58x36', 8, .424, .424], ['65x40', 8, .525, .525], ['73x45', 8, .652, .652],
  ];
  assert.equal(pipeSizes.length, expected.length);
  for (const [id, wall, deduction, deduction8] of expected) {
    const input = box(); input.pipes = [pipe(id), none(), none(), none()];
    const result = calculateBox(input);
    assert.equal(result.wallThicknessInches, wall, id);
    assert.equal(result.openingDeductionCubicYards, deduction, id);
    input.pipes[2] = pipe('48x48');
    const forced8 = calculateBox(input);
    assert.equal(forced8.wallThicknessInches, 8);
    close(forced8.openingDeductionCubicYards, deduction8 + .453);
  }
});

test('all-open walls omit infill bars; height and solid-wall runs control extra bars', () => {
  const input = box(); input.pipes = [pipe(), pipe(), pipe(), pipe()];
  const result = calculateBox(input);
  assert.deepEqual(result.bars.slice(4, 7).map(b => b.count), [5, 6, 12]);
  input.pipes[2] = none(); input.height = 4;
  const solid = calculateBox(input);
  assert.deepEqual(solid.bars.slice(4, 7).map(b => b.count), [6, 6, 14]);
  assert.equal(solid.bars.find(b => b.mark === 'D').lengthInches, 48);
  const symmetric = box(); symmetric.pipes[0].skew = 10;
  const positive = calculateBox(symmetric); symmetric.pipes[0].skew = -10;
  assert.deepEqual(calculateBox(symmetric), positive);
});

test('JB-2 validates dimensions, listed pipe pairs, type, and 9-ft-3-in width', () => {
  const largest = box(); largest.pipes[0] = pipe('72x72');
  assert.equal(calculateBox(largest).widthsFeet[0], 9.25);
  largest.pipes[0].skew = 1;
  assert.throws(() => calculateBox(largest), /maximum width/);
  for (const skew of [90, -90, NaN, Infinity, true]) {
    const input = box(); input.pipes[0].skew = skew;
    assert.throws(() => calculateBox(input), /skew/);
  }
  for (const height of ['', true, -1, 0, NaN, Infinity, 1e20, 1e308]) assert.throws(() => calculateBox({...box(), height}));
  const bad = box(); bad.pipes[0].rise = 23;
  assert.throws(() => calculateBox(bad), /common pipe table/);
  bad.pipes[0] = none(); assert.throws(() => calculateBox(bad), /outflow/);
  assert.throws(() => calculateBox({...box(), type: 'JB-3'}), /Choose JB-1 or JB-2/);
  assert.throws(() => calculateBox({...box(), pipes: []}), /four pipe sides/);
});

test('mixed standards keep individual results and sum unrounded quantities', () => {
  const input = box(), before = JSON.stringify(input);
  const jb2 = calculateBox(input), jb1 = calculateBox({...input, type: 'JB-1'});
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(totalQuantities([jb1, jb2]), {concreteCubicYards: jb1.concreteCubicYards + jb2.concreteCubicYards, steelPounds: jb1.steelPounds + jb2.steelPounds});
});
