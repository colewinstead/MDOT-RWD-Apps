'use strict';
const BridgeEndPave = (() => {
  const railKeys = [['rail32', 32], ['rail33_5', 33.5], ['rail37_5', 37.5], ['rail42', 42], ['rail43_5', 43.5]];
  const quantityKeys = ['pavement', 'expansionJoint', 'grooving', 'bridgeExpansionJoint', 'roadwayExpansionJoint', 'bridgeJointSeal', 'railLength', ...railKeys.map(([key]) => key)];
  const drawings = [
    { id: 'LEGACY', label: 'Legacy AI 1.2', description: 'Recovered executable calculation with original constants and rounding.', railHeights: [0, 32, 42], thicknesses: [9, 12], groovingMode: 'legacy', jointMode: 'legacy', normalEdge: 0.5 },
    { id: 'BE-1', label: 'BE-1 · Overlay and sleeper slab', description: '2017 standard drawing with full asphalt overlay and no bridge-seat expansion joint.', railHeights: [33.5, 43.5], thicknesses: [12], groovingMode: 'full-overlay', jointMode: 'none', normalEdge: 0.5 },
    { id: 'BE-2', label: 'BE-2 · Overlay, no sleeper slab', description: '2017 standard drawing with full asphalt overlay and a premolded bridge-interface joint.', railHeights: [33.5, 43.5], thicknesses: [9, 12], groovingMode: 'full-overlay', jointMode: 'bridge-premolded', normalEdge: 0.5 },
    { id: 'SDBE-1', label: 'SDBE-1 · Special overlay and sleeper slab', description: 'Special drawing with 37.5/43.5-inch rails and a three-foot exposed strip normal to the bridge joint.', railHeights: [37.5, 43.5], thicknesses: [12], groovingMode: 'normal-strip', jointMode: 'bridge-seal', normalEdge: 0 },
    { id: 'SDBE-1A', label: 'SDBE-1A · Special bare slab', description: 'Older special drawing with 32/42-inch rails and bare concrete surface.', railHeights: [32, 42], thicknesses: [9, 12], groovingMode: 'bare', jointMode: 'bridge-premolded', normalEdge: 0.5 },
  ];
  const round2 = value => Math.round(value * 100) / 100;

  function number(value, label) {
    if (typeof value === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) value = Number(value);
    if (typeof value !== 'number' || !Number.isFinite(value)) throw Error(`${label} must be a finite decimal number.`);
    return value;
  }

  function calculateLegacy(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Enter bridge end dimensions.');
    const w1 = number(input.w1, 'W1');
    const w2 = number(input.w2, 'W2');
    const skew = number(input.skew, 'Skew');
    const railHeight = number(input.railHeight, 'Rail height');
    const widthBase = w1 + w2;
    if (w1 < 0 || w2 < 0 || widthBase <= 0 || !Number.isFinite(widthBase)) throw Error('W1 and W2 must be nonnegative with a positive combined width.');
    if (skew < 0 || skew >= 90) throw Error('Enter skew as a magnitude from 0 up to, but not including, 90 degrees.');
    if (![0, 32, 42].includes(railHeight)) throw Error('Rail height must be 0, 32, or 42 inches.');

    // Preserve the constants and operation order recovered from the supplied AI 1.2 script.
    const radians = skew * 3.141593 / 180;
    const width = widthBase + (railHeight === 0 ? 1 : railHeight === 32 ? 2.833333 : 3);
    const unclampedA = 20 - (width / 2) * Math.tan(radians);
    const sideA = Math.max(10, unclampedA);
    const clamped = sideA === 10;
    const sideB = clamped ? 10 + width * Math.tan(radians) : 20 + (width / 2) * Math.tan(radians);
    const grossArea = ((sideA + sideB) / 2) * width / 9;
    let railDeduction = 0;
    let pavement = grossArea;
    const grooveDeduction = railHeight === 32 ? 3.148148 : railHeight === 42 ? 3.333333 : 0;
    if (railHeight !== 0) {
      const railWidth = railHeight === 32 ? 0.916667 : 1;
      const sideAM = (sideA - 10) * railWidth / 9;
      const sideBM = (sideB - 10) * railWidth / 9;
      railDeduction = sideAM + sideBM;
      pavement = grossArea - railDeduction;
    }
    const expansionJoint = width / Math.cos(radians);
    const grooving = pavement - grooveDeduction;
    if ([width, sideA, sideB, grossArea, pavement, expansionJoint, grooving].some(value => !Number.isFinite(value) || value < 0)) throw Error('These dimensions produce an invalid quantity. Check the widths and skew.');
    const result = { w1, w2, skew, railHeight, widthBase, width, sideA, sideB, grossArea, pavement: round2(pavement), expansionJoint: round2(expansionJoint), grooving: round2(grooving), rail32: railHeight === 32 ? 20 : 0, rail42: railHeight === 42 ? 20 : 0, clamped, railDeduction, grooveDeduction };
    if (quantityKeys.some(key => !Number.isFinite(result[key]))) throw Error('The calculated quantities exceed the numeric range.');
    return result;
  }

  function calculate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Enter bridge end dimensions.');
    const drawing = input.drawing === undefined ? 'LEGACY' : input.drawing;
    const config = drawings.find(item => item.id === drawing);
    if (!config) throw Error('Choose a supported drawing family.');
    const legacy = drawing === 'LEGACY';
    const thickness = number(input.pavementThickness === undefined && legacy ? 9 : input.pavementThickness, 'Pavement thickness');
    if (!config.thicknesses.includes(thickness)) throw Error(`Choose a supported pavement thickness for ${drawing}.`);
    const roadwayPavement = input.roadwayPavement === undefined && legacy ? 'asphalt' : input.roadwayPavement;
    if (!['asphalt', 'concrete'].includes(roadwayPavement)) throw Error('Roadway pavement must be asphalt or concrete.');
    const groovingIncluded = input.groovingIncluded === undefined && legacy ? true : input.groovingIncluded;
    if (typeof groovingIncluded !== 'boolean') throw Error('Choose whether grooving is included in the project.');
    const railHeight = number(input.railHeight, 'Rail height');
    if (!config.railHeights.includes(railHeight)) throw Error(`The selected rail height is not supported by ${drawing}.`);
    const normalEdge = config.normalEdge;
    const railBaseWidth = railHeight === 0 ? 0.5 : drawing === 'SDBE-1' ? (railHeight === 37.5 ? 15 : 16) / 12 : [32, 33.5].includes(railHeight) ? 17 / 12 : 18 / 12;
    const railCut = railBaseWidth - normalEdge;
    const railLength = railHeight === 0 ? 0 : 20;
    let result;
    let bridgeExpansionJoint = 0;
    let roadwayExpansionJoint = 0;
    let bridgeJointSeal = 0;
    let interfaceLength;
    const notes = [];
    if (legacy) {
      result = calculateLegacy(input);
      interfaceLength = result.width / Math.cos(result.skew * 3.141593 / 180);
      bridgeExpansionJoint = result.expansionJoint;
      if (!groovingIncluded) result.grooving = 0;
      notes.push('Recovered AI 1.2 arithmetic: original approximate pi and decimal constants; each end is rounded to two decimals before project totals.');
      notes.push('The legacy joint quantity is preserved as its single reported span; roadway pavement type does not add another joint in this mode.');
    } else {
      const w1 = number(input.w1, 'W1');
      const w2 = number(input.w2, 'W2');
      const skew = number(input.skew, 'Skew');
      const widthBase = w1 + w2;
      if (w1 < 0 || w2 < 0 || widthBase <= 0 || !Number.isFinite(widthBase)) throw Error('W1 and W2 must be nonnegative with a positive combined width.');
      if (skew < 0 || skew >= 90) throw Error('Enter skew as a magnitude from 0 up to, but not including, 90 degrees.');
      const radians = skew * Math.PI / 180;
      const tangent = Math.tan(radians);
      const cosine = Math.cos(radians);
      const width = widthBase + 2 * railBaseWidth;
      const sideA = Math.max(10, 20 - (width / 2) * tangent);
      const sideB = sideA === 10 ? 10 + width * tangent : 20 + (width / 2) * tangent;
      const grossArea = ((sideA + sideB) / 2) * width / 9;
      const railDeduction = railCut * (sideA + sideB - 20) / 9;
      const pavement = grossArea - railDeduction;
      let grooving = 0;
      if (groovingIncluded && config.groovingMode === 'bare') grooving = pavement - railLength * railBaseWidth / 9;
      if (groovingIncluded && config.groovingMode === 'normal-strip') {
        const depth = 3 / cosine;
        const shortLength = sideA + railBaseWidth * tangent;
        const longLength = shortLength + widthBase * tangent;
        if (depth <= shortLength) grooving = depth * widthBase / 9;
        else if (depth >= longLength) grooving = (shortLength + longLength) / 2 * widthBase / 9;
        else {
          const crossing = (depth - shortLength) / tangent;
          grooving = ((shortLength + depth) / 2 * crossing + depth * (widthBase - crossing)) / 9;
        }
        if (depth > shortLength) notes.push('The three-foot strip intersects the roadway end at this skew; its area is clipped to the actual clear-pavement plan boundary.');
      }
      interfaceLength = width / cosine;
      bridgeExpansionJoint = config.jointMode === 'bridge-premolded' ? interfaceLength : 0;
      roadwayExpansionJoint = roadwayPavement === 'concrete' ? widthBase + 2 * normalEdge : 0;
      bridgeJointSeal = config.jointMode === 'bridge-seal' ? widthBase / cosine : 0;
      result = { w1, w2, skew, railHeight, widthBase, width, sideA, sideB, grossArea, pavement: round2(pavement), expansionJoint: 0, grooving: round2(grooving), clamped: sideA === 10, railDeduction, grooveDeduction: pavement - grooving };
      notes.push('Drawing-derived plan quantities use rational drawing dimensions and Math.PI; they are an extension of, rather than an exact match to, the legacy executable.');
      notes.push(`Paving follows the drawn perimeter: gross trapezoid less outer strips beyond the two ten-foot rails, retaining ${normalEdge === 0 ? 'no extra edge width' : 'six inches on each side'} past the rails. This area equation is a dimensional interpretation, not a printed pay formula.`);
      if (config.groovingMode === 'full-overlay') notes.push('The shown asphalt overlay covers the concrete surface: exposed-concrete grooving is zero. Project-specific grooving on other finishes is outside this drawing model.');
      if (config.groovingMode === 'bare') notes.push('When included, grooving is the exposed bare-concrete plan area excluding both rail footprints. SDBE-1A does not explicitly require grooving; inclusion is a project choice.');
      if (config.groovingMode === 'normal-strip') notes.push('Grooving covers the three-foot strip measured normal to the skewed bridge joint, between the bridge curb lines. The bridge-plan joint/seal span is separate from premolded expansion joints.');
      if (drawing.startsWith('SDBE-')) notes.push('The special slab sheet is marked preliminary / not for construction; verify the project-selected drawing and dimensions.');
      notes.push(roadwayPavement === 'concrete' ? 'A separate doweled roadway expansion joint is included across the normal roadway-end slab width.' : 'The conditional roadway expansion joint is omitted for asphalt roadway pavement.');
      if (drawing === 'BE-1') notes.push('BE-1 specifies no expansion joint at the bridge seat.');
      if (drawing === 'BE-2' || drawing === 'SDBE-1A') notes.push('The bridge-interface premolded joint is not doweled; its length follows the skewed slab interface.');
    }
    result.bridgeExpansionJoint = round2(bridgeExpansionJoint);
    result.roadwayExpansionJoint = round2(roadwayExpansionJoint);
    result.bridgeJointSeal = round2(bridgeJointSeal);
    if (!legacy) result.expansionJoint = round2(result.bridgeExpansionJoint + result.roadwayExpansionJoint);
    for (const [key, height] of railKeys) result[key] = railHeight === height ? 20 : 0;
    const railDetail = railHeight === 0 ? 'None' : drawing === 'SDBE-1' ? (railHeight === 37.5 ? 'SDBER-1' : 'SDBER-2') : drawing === 'BE-1' || drawing === 'BE-2' ? (railHeight === 33.5 ? 'BER-1' : 'BER-2') : `SDBEPR-${railHeight === 32 ? '1' : '1A'}-${thickness}`;
    Object.assign(result, { drawing, label: config.label, thickness, pavementThickness: thickness, roadwayPavement, groovingIncluded, normalEdge, railBaseWidth, railCut, groovingMode: config.groovingMode, interfaceLength, roadwayWidth: result.widthBase + 2 * normalEdge, railLength, railDetail, notes });
    if (!groovingIncluded) notes.push('Grooving is not included in this project record; its reported quantity is zero.');
    if (Object.values(result).some(value => typeof value === 'number' && (!Number.isFinite(value) || value < 0))) throw Error('These dimensions produce an invalid quantity. Check the widths and skew.');
    return result;
  }

  function totals(results) {
    if (!Array.isArray(results)) throw Error('Project quantities must be a list.');
    const total = {};
    for (const key of quantityKeys) {
      let cents = 0;
      for (const result of results) {
        const value = result && result[key];
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw Error('Project totals require valid calculated quantities.');
        cents += Math.round(value * 100);
        if (!Number.isSafeInteger(cents)) throw Error('Project quantities are too large to total accurately.');
      }
      total[key] = cents / 100;
    }
    return total;
  }

  return { calculate, totals, drawings, railKeys };
})();
if (typeof module === 'object' && module.exports) module.exports = BridgeEndPave;
