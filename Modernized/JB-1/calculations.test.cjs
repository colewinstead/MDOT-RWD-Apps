"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateBox, defaultThickness, supportedNoncircularSpans, totalQuantities } = require("./calculations.js");
const none = () => ({ span: 0, rise: 0, skew: 0, thickness: 0 });
const pipe = (span = 36, rise = span, skew = 0, thickness = 4) => ({ span, rise, skew, thickness });
const single = () => ({ pipes: [pipe(), none(), none(), none()], height: null });
const close = (actual, expected, tolerance = 2e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};

test("hand-worked single circular outflow matches recovered geometry and quantities", () => {
  // 36-in. circular pipe, 4-in. thickness: W1=36+8+21=65, W2=30;
  // H=(36+8+12)/12. Gross = 5*65*30 + 52.5*17.5 + 65*30*10 + 83*46*12.
  const result = calculateBox(single());
  close(result.widthsFeet[0], 65 / 12);
  assert.equal(result.widthsFeet[1], 2.5);
  close(result.minimumHeightFeet, 56 / 12);
  close(result.grossConcreteCubicYards, 75984.75 / 46656);
  close(result.openingDeductionCubicYards, (22 ** 2 * 3.141593 * 6) / 46656);
  close(result.concreteCubicYards, (75984.75 - 22 ** 2 * 3.141593 * 6) / 46656);
  assert.deepEqual(result.bars.map(({ mark, count }) => [mark, count]),
    [["A1", 2], ["A2", 0], ["A3", 0], ["A4", 0], ["B", 2], ["C", 2], ["D", 4], ["E", 16], ["F", 8]]);
  close(result.bars[0].lengthInches, Math.sqrt(34.5 ** 2 + 196), 5e-6);
  close(result.bars[4].lengthInches, 59, 5e-6);
  assert.equal(result.bars[1].lengthInches, 0);
});

test("opposing widths follow larger side and sign-symmetric skew", () => {
  const input = single();
  input.pipes[2] = pipe(48, 48, 30, 5);
  const positive = calculateBox(input);
  input.pipes[2].skew = -30;
  const negative = calculateBox(input);
  assert.deepEqual(positive, negative);
  close(positive.widthsFeet[0], ((48 + 10) / Math.cos(Math.fround(30 * 3.141593 / 180)) + 21) / 12);
  assert.equal(positive.widthsFeet[0], positive.widthsFeet[2]);
  // Different rise adds the outflow's 4-in. thickness: (48+10+12+4)/12.
  close(positive.minimumHeightFeet, 74 / 12);
});

test("equal inflow and outflow rises omit the extra outflow thickness", () => {
  const input = single();
  input.pipes[1] = pipe(36, 36, 0, 5);
  close(calculateBox(input).minimumHeightFeet, 58 / 12);
});

test("manual height changes wall and D-bar quantities while retaining minimum", () => {
  const input = single();
  const minimum = calculateBox(input);
  input.height = 6;
  const taller = calculateBox(input);
  assert.equal(taller.heightFeet, 6);
  assert.equal(taller.minimumHeightFeet, minimum.minimumHeightFeet);
  assert.equal(taller.bars.find(bar => bar.mark === "D").lengthInches, 66);
  assert.ok(taller.concreteCubicYards > minimum.concreteCubicYards);
  assert.ok(taller.steelPounds > minimum.steelPounds);
  input.height = 4;
  assert.throws(() => calculateBox(input), /at least/);
});

test("all recovered noncircular defaults and deduction table entries", () => {
  const spans = [22, 29, 36, 44, 51, 58, 65, 73, 88];
  const thicknesses = [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7];
  const deductions = [0.053, 0.087, 0.129, 0.195, 0.245, 0.318, 0.394, 0.489, 0.688];
  assert.deepEqual(supportedNoncircularSpans, spans);
  spans.forEach((span, index) => {
    assert.equal(defaultThickness(span, 1), thicknesses[index]);
    const input = single();
    input.pipes[0] = pipe(span, span - 1, 0, thicknesses[index]);
    const result = calculateBox(input);
    assert.equal(result.openingDeductionCubicYards, Math.fround(deductions[index]));
    assert.equal(result.warnings.length, 1);
  });
  assert.equal(defaultThickness(0, 0), 0);
  assert.equal(defaultThickness(36, 36), 4);
  assert.throws(() => defaultThickness(25, 20), /lookup/);
});

test("invalid, omitted, nonfinite, overflowed, or unsupported inputs fail explicitly", () => {
  assert.throws(() => calculateBox({ pipes: [] }), /exactly four/);
  for (const field of ["span", "rise", "skew", "thickness"]) {
    for (const value of [undefined, null, "36", true, NaN, Infinity, -Infinity, 1e300, 1e-300]) {
      const input = single();
      input.pipes[0][field] = value;
      assert.throws(() => calculateBox(input), Error, `${field}: ${value}`);
    }
  }
  for (const skew of [-90, 90, 120]) {
    const input = single(); input.pipes[0].skew = skew;
    assert.throws(() => calculateBox(input), /skew/);
  }
  const incomplete = single(); incomplete.pipes[1] = { span: 36 };
  assert.throws(() => calculateBox(incomplete), /finite number/);
  const missingOutflow = single(); missingOutflow.pipes[0] = none();
  assert.throws(() => calculateBox(missingOutflow), /outflow/);
  const unsupported = single(); unsupported.pipes[0] = pipe(25, 20);
  assert.throws(() => calculateBox(unsupported), /lookup/);
  const partialZero = single(); partialZero.pipes[1] = { ...none(), thickness: 1 };
  assert.throws(() => calculateBox(partialZero), /all zeros/);
});

test("calculation does not mutate inputs and steel sums the displayed bar schedule", () => {
  const input = single();
  const before = JSON.stringify(input);
  const result = calculateBox(input);
  assert.equal(JSON.stringify(input), before);
  const totalInches = Math.fround(result.bars.reduce((sum, bar) =>
    sum + Math.fround(bar.count * bar.lengthInches), 0));
  assert.equal(result.steelPounds, Math.fround(totalInches * 0.055663 + 4));
});

test("92 float32 values match four cases run in the original Windows executable exactly", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, "evidence/legacy-results.json"), "utf8"));
  const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "evidence/legacy-cases.json"), "utf8"));
  assert.equal(source.sourceSha256, "99a2e4c39ffcbe4de55eef8b47d0bbcd465a15b0f849081780c0fd19596bd462");
  let checked = 0;
  cases.forEach(({ name, input }, index) => {
    const result = calculateBox(input);
    const observed = {
      width13: result.widthsFeet[0], width24: result.widthsFeet[1],
      height: result.heightFeet, concrete: result.concreteCubicYards, steel: result.steelPounds,
    };
    result.bars.forEach(bar => {
      observed[bar.mark.toLowerCase()] = bar.lengthInches;
      observed[`n${bar.mark.toLowerCase()}`] = bar.count;
    });
    for (const [key, actual] of Object.entries(observed)) {
      const expected = Buffer.from(source.rawHex[key], "hex").readFloatLE(4 * (index + 1));
      assert.equal(actual, expected, `${name}: ${key}`);
      checked++;
    }
  });
  assert.equal(checked, 92);
});

test("project totals preserve the original single-precision accumulation order", () => {
  // At 2^24, adding one rounds back to 2^24 in float32; a double sum would differ.
  const large = { concreteCubicYards: 2 ** 24, steelPounds: 2 ** 24 };
  const one = { concreteCubicYards: 1, steelPounds: 1 };
  assert.deepEqual(totalQuantities([large, one, one]), large);
  assert.deepEqual(totalQuantities([one, one, large]), {
    concreteCubicYards: 2 ** 24 + 2, steelPounds: 2 ** 24 + 2,
  });
});
