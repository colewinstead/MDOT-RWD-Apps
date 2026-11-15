'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { calculate, totals, drawings, railKeys } = require('./calculations.js');
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
  const empty = { pavement: 0, expansionJoint: 0, grooving: 0, bridgeExpansionJoint: 0, roadwayExpansionJoint: 0, bridgeJointSeal: 0, railLength: 0, rail32: 0, rail33_5: 0, rail37_5: 0, rail42: 0, rail43_5: 0 };
  assert.deepEqual(totals([]), empty);
  const small = value => ({ ...empty, pavement: value, expansionJoint: value, grooving: value });
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

const drawingInput = (change = {}) => ({ drawing: 'SDBE-1A', w1: 12, w2: 12, skew: 0, railHeight: 32, pavementThickness: 9, roadwayPavement: 'asphalt', groovingIncluded: true, ...change });
const round2 = value => Math.round(value * 100) / 100;
const area = polygon => Math.abs(polygon.reduce((sum, point, i) => {
  const next = polygon[(i + 1) % polygon.length];
  return sum + point[0] * next[1] - point[1] * next[0];
}, 0)) / 2;

// Independent plan-polygon clipping checks the analytical normal-strip integration.
function clip(polygon, signedDistance) {
  const output = [];
  for (let i = 0; i < polygon.length; i++) {
    const previous = polygon[(i + polygon.length - 1) % polygon.length];
    const current = polygon[i];
    const a = signedDistance(previous), b = signedDistance(current);
    if ((a >= 0) !== (b >= 0)) {
      const fraction = a / (a - b);
      output.push(previous.map((value, axis) => value + fraction * (current[axis] - value)));
    }
    if (b >= 0) output.push(current);
  }
  return output;
}

test('catalogue exposes exactly the drawing-compatible rails and slab variants', () => {
  assert.deepEqual(drawings.map(({id, railHeights, thicknesses}) => [id, railHeights, thicknesses]), [
    ['LEGACY', [0, 32, 42], [9, 12]], ['BE-1', [33.5, 43.5], [12]],
    ['BE-2', [33.5, 43.5], [9, 12]], ['SDBE-1', [37.5, 43.5], [12]],
    ['SDBE-1A', [32, 42], [9, 12]]]);
  assert.deepEqual(railKeys, [['rail32',32],['rail33_5',33.5],['rail37_5',37.5],['rail42',42],['rail43_5',43.5]]);
});

test('zero-skew drawing hand cases use the right paving, finish and separate joints', () => {
  const cases = [
    ['BE-1', 33.5, 12, 57.59, 0, 0, 0], ['BE-1', 43.5, 12, 57.78, 0, 0, 0],
    ['BE-2', 33.5, 9, 57.59, 0, 26.83, 0], ['BE-2', 43.5, 9, 57.78, 0, 27, 0],
    ['SDBE-1A', 32, 9, 57.59, 54.44, 26.83, 0], ['SDBE-1A', 42, 12, 57.78, 54.44, 27, 0],
    ['SDBE-1', 37.5, 12, 56.11, 8, 0, 24], ['SDBE-1', 43.5, 12, 56.3, 8, 0, 24]
  ];
  for (const [drawing, railHeight, pavementThickness, paving, grooving, bridgeExpansionJoint, bridgeJointSeal] of cases) {
    const result = calculate(drawingInput({drawing, railHeight, pavementThickness}));
    assert.deepEqual([result.pavement, result.grooving, result.bridgeExpansionJoint, result.bridgeJointSeal], [paving, grooving, bridgeExpansionJoint, bridgeJointSeal], `${drawing}/${railHeight}`);
    assert.equal(result.roadwayExpansionJoint, 0);
    assert.equal(result.expansionJoint, bridgeExpansionJoint);
    assert.equal(result.railLength, 20);
    const concrete = calculate(drawingInput({drawing, railHeight, pavementThickness, roadwayPavement: 'concrete'}));
    assert.equal(concrete.roadwayExpansionJoint, drawing === 'SDBE-1' ? 24 : 25);
    assert.equal(concrete.expansionJoint, round2(concrete.bridgeExpansionJoint + concrete.roadwayExpansionJoint));
    assert.equal(concrete.bridgeJointSeal, bridgeJointSeal);
    const noGrooving = calculate(drawingInput({drawing, railHeight, pavementThickness, groovingIncluded: false}));
    assert.equal(noGrooving.grooving, 0);
    assert.equal(noGrooving.pavement, result.pavement);
  }
});

test('drawing-derived paving agrees with the notched plan perimeter, not the bounding trapezoid', () => {
  const cases = [['BE-1',33.5,12,17/12,.5],['BE-2',43.5,9,1.5,.5],['SDBE-1A',32,12,17/12,.5],['SDBE-1',37.5,12,1.25,0],['SDBE-1',43.5,12,4/3,0]];
  for (const [drawing, railHeight, pavementThickness, allowance, normalEdge] of cases) {
    const width = 24 + 2 * allowance, cut = allowance - normalEdge;
    // At 45 degrees, A=10 and the bridge edge is x=10+y.
    const polygon = [[0,0],[10,0],[10+width,width],[width,width],[width-cut,width-cut],[0,width-cut],[0,cut],[cut,cut]];
    const expected = round2(area(polygon) / 9);
    const result = calculate(drawingInput({drawing, railHeight, pavementThickness, skew: 45}));
    assert.equal(result.pavement, expected, `${drawing}/${railHeight}`);
    assert.ok(result.pavement < round2(result.grossArea));
  }
  assert.equal(calculate(drawingInput({drawing:'SDBE-1',railHeight:37.5,pavementThickness:12,skew:45})).pavement, 64.78);
});

test('three-foot SDBE-1 grooving follows a normal strip and clips to actual pavement at high skew', () => {
  const cases = [[12,12,0],[12,12,10],[12,12,45],[12,12,85],[.1,.1,80],[.1,.1,89],[0,24,89.5]];
  let partial = 0, fullyClipped = 0;
  for (const railHeight of [37.5, 43.5]) {
    const allowance = railHeight === 37.5 ? 1.25 : 4/3;
    for (const [w1, w2, skew] of cases) {
      const radians = skew * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians), t = Math.tan(radians);
      const wb = w1+w2, width = wb+2*allowance;
      const a = Math.max(10,20-width*t/2), b = a+width*t;
      const clearPlan = [[0,allowance],[a+t*allowance,allowance],[b-t*allowance,width-allowance],[0,width-allowance]];
      const expectedArea = area(clip(clearPlan, ([x,y]) => 3+(x-a)*c-y*s));
      const result = calculate(drawingInput({drawing:'SDBE-1',railHeight,pavementThickness:12,w1,w2,skew}));
      assert.equal(result.grooving, round2(expectedArea/9), `${railHeight}/${wb}/${skew}`);
      assert.ok(result.grooving <= result.pavement);
      if (3/c > a+t*allowance && 3/c < b-t*allowance) partial++;
      if (3/c >= b-t*allowance) fullyClipped++;
    }
  }
  assert.ok(partial > 0);
  assert.ok(fullyClipped > 0);
  const diagonal = calculate(drawingInput({drawing:'SDBE-1',railHeight:37.5,pavementThickness:12,skew:45}));
  assert.equal(diagonal.grooving, 11.31);
  assert.notEqual(diagonal.grooving, 8, 'A longitudinal three-foot strip would wrongly omit the skew factor.');
});

test('every valid rail, thickness, surface, groove and ordinary skew combination is finite and dimensionally consistent', () => {
  let count = 0;
  for (const config of drawings) for (const railHeight of config.railHeights) for (const pavementThickness of config.thicknesses)
    for (const roadwayPavement of ['asphalt','concrete']) for (const groovingIncluded of [false,true]) for (const skew of [0,10,45]) {
      const args = drawingInput({drawing:config.id,railHeight,pavementThickness,roadwayPavement,groovingIncluded,skew});
      const result = calculate(args);
      assert.ok(Object.values(result).every(value => typeof value !== 'number' || (Number.isFinite(value) && value >= 0)));
      assert.equal(result.railLength, railHeight === 0 ? 0 : 20);
      assert.equal(railKeys.reduce((sum,[key]) => sum+result[key],0), result.railLength);
      for (const [key,height] of railKeys) assert.equal(result[key], height === railHeight ? 20 : 0);
      if (!groovingIncluded || config.groovingMode === 'full-overlay') assert.equal(result.grooving, 0);
      if (config.id !== 'LEGACY') {
        assert.equal(result.expansionJoint, round2(result.bridgeExpansionJoint+result.roadwayExpansionJoint));
        assert.equal(result.roadwayExpansionJoint, roadwayPavement === 'concrete' ? result.roadwayWidth : 0);
      }
      assert.equal(result.railDetail === 'None', railHeight === 0);
      count++;
    }
  assert.equal(count, 216);
});

test('new rail profiles retain distinct nominal slab allocations and actual rail projections', () => {
  for (const [railHeight, nominal, profile, detail] of [[37.5,15,14.5,'SDBER-1'],[43.5,16,15.5,'SDBER-2']]) {
    const result = calculate(drawingInput({drawing:'SDBE-1',railHeight,pavementThickness:12}));
    assert.equal(result.sideAllowance, nominal/12);
    assert.equal(result.railBaseWidth, nominal/12);
    assert.equal(result.railProfileBaseWidth, profile/12);
    assert.equal(result.railDetail, detail);
    assert.ok(result.notes.some(note => /15\/16-inch/.test(note)));
  }
  for (const thickness of [9,12]) for (const railHeight of [32,42]) {
    const result = calculate(drawingInput({railHeight,pavementThickness:thickness}));
    assert.equal(result.railDetail, `SDBEPR-${railHeight === 32 ? '1' : '1A'}-${thickness}`);
    assert.equal(result.railProfileBaseWidth, result.railBaseWidth);
  }
  const noRail = calculate(input());
  assert.equal(noRail.sideAllowance, .5);
  assert.equal(noRail.railProfileBaseWidth, 0);
});

test('new input boundaries reject incompatible families and cannot coerce contract choices', () => {
  for (const config of drawings.filter(config => config.id !== 'LEGACY')) {
    const valid = drawingInput({drawing:config.id,railHeight:config.railHeights[0],pavementThickness:config.thicknesses[0]});
    for (const railHeight of [0,32,33.5,37.5,42,43.5].filter(height => !config.railHeights.includes(height)))
      assert.throws(() => calculate({...valid,railHeight}), /not supported/);
    for (const field of ['w1','w2','skew','railHeight','pavementThickness']) for (const value of ['',true,null,NaN,Infinity,'0x20','12 ft'])
      assert.throws(() => calculate({...valid,[field]:value}), Error, `${config.id} ${field}: ${value}`);
    for (const value of [undefined,null,0,1,'true','false']) assert.throws(() => calculate({...valid,groovingIncluded:value}));
    for (const value of [undefined,null,true,'Concrete','gravel','']) assert.throws(() => calculate({...valid,roadwayPavement:value}));
    for (const value of [undefined,0,8,10,13]) assert.throws(() => calculate({...valid,pavementThickness:value}));
  }
  for (const drawing of ['',null,{},'BE1','SDBER-1','unknown']) assert.throws(() => calculate(drawingInput({drawing})));
});

test('mixed project totals retain each joint type and every rail height without double counting seals', () => {
  const records = [
    calculate(drawingInput({railHeight:32})),
    calculate(drawingInput({drawing:'BE-1',railHeight:33.5,pavementThickness:12,roadwayPavement:'concrete'})),
    calculate(drawingInput({drawing:'SDBE-1',railHeight:37.5,pavementThickness:12,roadwayPavement:'concrete'})),
    calculate(drawingInput({railHeight:42})),
    calculate(drawingInput({drawing:'BE-2',railHeight:43.5,roadwayPavement:'concrete'}))
  ];
  const total = totals(records);
  assert.equal(total.bridgeExpansionJoint, 80.83);
  assert.equal(total.roadwayExpansionJoint, 74);
  assert.equal(total.expansionJoint, 154.83);
  assert.equal(total.bridgeJointSeal, 24);
  assert.equal(total.railLength, 100);
  for (const [key] of railKeys) assert.equal(total[key],20);
  assert.notEqual(total.expansionJoint, total.bridgeExpansionJoint+total.roadwayExpansionJoint+total.bridgeJointSeal);
});
