(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.JB1 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Recovered JB-1 v5.0 rules; see evidence/RECOVERY.md for addresses and limits.
  const f32 = Math.fround;
  const pi = 3.141593;
  const noncircular = new Map([
    [22, [2.5, 0.053]], [29, [3, 0.087]], [36, [3.5, 0.129]],
    [44, [4, 0.195]], [51, [4.5, 0.245]], [58, [5, 0.318]],
    [65, [5.5, 0.394]], [73, [6, 0.489]], [88, [7, 0.688]],
  ]);
  const supportedNoncircularSpans = Object.freeze(Array.from(noncircular.keys()));
  const pipeSizes = Object.freeze([
    [18, 18, 2.5, .053, .071], [24, 24, 3, .091, .121],
    [30, 30, 3.5, .138, .184], [36, 36, 4, .196, .261],
    [42, 42, 4.5, .263, .350], [48, 48, 5, null, .453],
    [54, 54, 5.5, null, .569], [60, 60, 6, null, .699],
    [66, 66, 6.5, null, .840], [72, 72, 7, null, .996],
    [22, 13, 2.5, .053, .071], [29, 18, 3, .087, .116],
    [36, 23, 3.5, .129, .172], [44, 27, 4, .185, .247],
    [51, 31, 4.5, null, .327], [58, 36, 5, null, .424],
    [65, 40, 5.5, null, .525], [73, 45, 6, null, .652],
  ].map(([span, rise, thickness, deduction6, deduction8]) => Object.freeze({
    id: `${span}x${rise}`, label: span === rise ? `${span}\u2033 circular` : `${span}\u2033 \u00d7 ${rise}\u2033 arch`,
    span, rise, thickness, deduction6, deduction8,
  })));

  function requireNumber(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`${label} must be a finite number.`);
    }
    const result = f32(value);
    if (!Number.isFinite(result) || (result === 0 && value !== 0)) {
      throw new Error(`${label} is outside the original calculator's numeric range.`);
    }
    return result;
  }

  function defaultThickness(span, rise) {
    span = requireNumber(span, "Pipe span");
    rise = requireNumber(rise, "Pipe rise");
    if (span < 0 || rise < 0 || (span === 0) !== (rise === 0)) {
      throw new Error("Pipe span and rise must both be positive, or both zero for no pipe.");
    }
    if (span === 0) return 0;
    if (span === rise) return f32((span / 6) * 0.5 + 1);
    if (!noncircular.has(span)) {
      throw new Error(`Noncircular span ${span} in. has no recovered JB-1 lookup value.`);
    }
    return noncircular.get(span)[0];
  }

  function calculateJB1Box(input) {
    if (!input || !Array.isArray(input.pipes) || input.pipes.length !== 4) {
      throw new Error("Enter exactly four pipe sides; side 1 is the outflow.");
    }
    const pipes = Array.from(input.pipes, (pipe, index) => {
      const label = `Side ${index + 1}`;
      if (!pipe || typeof pipe !== "object" || Array.isArray(pipe)) {
        throw new Error(`${label}: enter span, rise, skew, and thickness.`);
      }
      const span = requireNumber(pipe.span, `${label} span`);
      const rise = requireNumber(pipe.rise, `${label} rise`);
      const skew = requireNumber(pipe.skew, `${label} skew`);
      const thickness = requireNumber(pipe.thickness, `${label} thickness`);
      if (span === 0 && rise === 0 && skew === 0 && thickness === 0) {
        return { span, rise, skew, thickness };
      }
      if (span <= 0 || rise <= 0 || thickness <= 0) {
        throw new Error(`${label}: span, rise, and thickness must be positive. Use all zeros for no pipe.`);
      }
      if (Math.abs(pipe.skew) >= 90 || Math.abs(skew) >= 90) {
        throw new Error(`${label}: skew must be between -90 and 90 degrees, excluding the endpoints.`);
      }
      if (span !== rise && !noncircular.has(span)) {
        throw new Error(`${label}: noncircular span ${span} in. has no recovered JB-1 lookup value.`);
      }
      return { span, rise, skew, thickness };
    });
    if (pipes[0].span === 0) throw new Error("Side 1 must contain the outflow pipe.");

    const widthsInches = pipes.map(({ span, skew, thickness }) => {
      const radians = f32((skew * pi) / 180);
      return Math.max(30, f32((span + 2 * thickness) / Math.cos(radians) + 21));
    });
    widthsInches[0] = widthsInches[2] = Math.max(widthsInches[0], widthsInches[2]);
    widthsInches[1] = widthsInches[3] = Math.max(widthsInches[1], widthsInches[3]);
    const heightsInches = pipes.map(({ rise, thickness }, index) => {
      const extra = index !== 0 && rise !== pipes[0].rise ? pipes[0].thickness : 0;
      return f32(rise + 2 * thickness + 12 + extra);
    });
    const minimumHeightFeet = f32(Math.max(...heightsInches) / 12);
    const heightFeet = input.height == null
      ? minimumHeightFeet
      : requireNumber(input.height, "Box height");
    if (heightFeet < minimumHeightFeet) {
      throw new Error(`Box height must be at least ${minimumHeightFeet.toFixed(6)} ft.`);
    }

    const [w1, w2] = widthsInches;
    const maximumThickness = Math.max(...pipes.map(pipe => pipe.thickness));
    // Original x87 temporaries store selected intermediates as single precision.
    const top = w2 * f32(w1 * 5) + (w1 - 12.5) * (w2 - 12.5);
    const baseThickness = f32(maximumThickness + 6);
    const baseAndTop = w2 * f32(w1 * baseThickness) + top;
    const wallFactor = f32((f32(heightFeet * 12) - baseThickness) * 12);
    const grossInches = f32((w2 + f32(w1 - 12)) * wallFactor + baseAndTop);
    const grossConcreteCubicYards = f32(grossInches / 46656);
    let openingDeductionCubicYards = 0;
    for (const { span, rise, thickness } of pipes) {
      if (span === rise) {
        const radius = f32(span / 2) + thickness;
        openingDeductionCubicYards = f32(
          openingDeductionCubicYards + (radius ** 2 * pi * 6) / 46656,
        );
      } else {
        openingDeductionCubicYards = f32(
          openingDeductionCubicYards + f32(noncircular.get(span)[1]),
        );
      }
    }
    const concreteCubicYards = f32(grossConcreteCubicYards - openingDeductionCubicYards);
    const widthsFeet = widthsInches.map(width => f32(width / 12));
    const bars = widthsFeet.map((width, index) => ({
      mark: `A${index + 1}`,
      count: pipes[index].span === 0 ? 0 : 2,
      lengthInches: pipes[index].span === 0 ? 0 : f32(Math.sqrt((width * 6 + 2) ** 2 + 196)),
    }));
    bars.push(
      { mark: "B", count: 2, lengthInches: f32(widthsFeet[0] * 12 - 6) },
      { mark: "C", count: 2, lengthInches: f32(widthsFeet[1] * 12 - 6) },
      { mark: "D", count: 4, lengthInches: f32(heightFeet * 12 - 6) },
      { mark: "E", count: 2 * (Math.floor((widthsFeet[0] * 12) / 9 + 0.5) + 1), lengthInches: f32(widthsFeet[1] * 12 - 4) },
      { mark: "F", count: 2 * (Math.floor((widthsFeet[1] * 12) / 9 + 0.5) + 1), lengthInches: f32(widthsFeet[0] * 12 - 4) },
    );
    const barInches = f32(bars.reduce((sum, bar) => sum + f32(bar.count * bar.lengthInches), 0));
    const steelPounds = f32(barInches * 0.055663 + 4);
    if (![...widthsFeet, heightFeet, concreteCubicYards, grossConcreteCubicYards,
      openingDeductionCubicYards, steelPounds, ...bars.flatMap(bar => [bar.count, bar.lengthInches])]
      .every(Number.isFinite) || concreteCubicYards <= 0) {
      throw new Error("These dimensions do not produce finite, positive JB-1 quantities. Check the inputs.");
    }
    const warnings = [];
    if (pipes.some(pipe => pipe.span !== pipe.rise)) {
      warnings.push("Noncircular opening deductions use the original span lookup, independent of entered rise, thickness, and skew.");
    }
    return { widthsFeet, heightFeet, minimumHeightFeet, concreteCubicYards,
      grossConcreteCubicYards, openingDeductionCubicYards, steelPounds, bars, warnings };
  }

  function calculateJB2Box(input) {
    if (!Array.isArray(input.pipes) || input.pipes.length !== 4) {
      throw new Error("Enter exactly four pipe sides; side 1 is the outflow.");
    }
    const pipes = input.pipes.map((pipe, i) => {
      if (!pipe || typeof pipe !== 'object' || Array.isArray(pipe)) throw new Error(`Side ${i + 1}: choose a listed pipe size.`);
      if (['span', 'rise', 'thickness', 'skew'].every(key => pipe[key] === 0)) return null;
      const size = pipeSizes.find(size => size.span === pipe.span && size.rise === pipe.rise && size.thickness === pipe.thickness);
      if (!size) throw new Error(`Side ${i + 1}: JB-2 requires a pipe size and thickness from the common pipe table.`);
      if (typeof pipe.skew !== 'number' || !Number.isFinite(pipe.skew) || Math.abs(pipe.skew) >= 90) {
        throw new Error(`Side ${i + 1}: skew must be between -90 and 90 degrees, excluding the endpoints.`);
      }
      return {...size, skew: pipe.skew};
    });
    if (!pipes[0]) throw new Error('Side 1 must contain the outflow pipe.');
    const wallThicknessInches = pipes.some(pipe => pipe && pipe.deduction6 === null) ? 8 : 6;
    const widths = pipes.map(pipe => pipe ? Math.max(30, (pipe.span + 2 * pipe.thickness) / Math.cos(pipe.skew * Math.PI / 180) + 2 * wallThicknessInches + 9) : 30);
    const w1 = Math.max(widths[0], widths[2]), w2 = Math.max(widths[1], widths[3]);
    if (w1 > 111 || w2 > 111) throw new Error('JB-2 exceeds the drawing\'s maximum width of 9 ft 3 in. Reduce the pipe size or skew.');
    const t1 = pipes[0].thickness;
    const minimumHeightFeet = Math.max(...pipes.filter(Boolean).map(pipe => pipe.rise + 2 * pipe.thickness + 12 + (pipe.rise !== pipes[0].rise ? t1 : 0))) / 12;
    const heightFeet = input.height == null ? minimumHeightFeet : input.height;
    if (typeof heightFeet !== 'number' || !Number.isFinite(heightFeet) || heightFeet < minimumHeightFeet) {
      throw new Error(`Box height must be at least ${minimumHeightFeet.toFixed(6)} ft.`);
    }
    const h = heightFeet * 12, wall = wallThicknessInches;
    const q1 = 8 * w1 * w2 + (w1 - 2 * wall - .5) * (w2 - 2 * wall - .5) + (t1 + 6) * w1 * w2;
    const q2 = 2 * wall * (h - (t1 + 6)) * (w1 - 2 * wall + w2);
    const grossConcreteCubicYards = (q1 + q2) / 46656;
    const openingDeductionCubicYards = pipes.reduce((sum, pipe) => sum + (pipe ? pipe[wall === 6 ? 'deduction6' : 'deduction8'] : 0), 0);
    const concreteCubicYards = grossConcreteCubicYards - openingDeductionCubicYards;
    // User-confirmed convention: end bars are already counted; add only interior bars for <=12-in. spacing.
    const interiorBars = run => Math.max(0, Math.ceil(run / 12) - 1);
    const solid13 = [0, 2].filter(i => !pipes[i]).length;
    const solid24 = [1, 3].filter(i => !pipes[i]).length;
    const openingCount = pipes.filter(Boolean).length;
    const wallBarSize = wall === 6 ? 6 : 7;
    const bars = pipes.map((pipe, i) => ({mark: `A${i + 1}`, size: 4, count: pipe ? 2 : 0,
      lengthInches: pipe ? Math.sqrt(196 + ((i % 2 ? w2 : w1) / 2 + 2) ** 2) : 0}));
    bars.push(
      {mark: 'B', size: wallBarSize, count: 2 + (pipes[2] ? 2 : 0) + 1 + solid13 * interiorBars(h), lengthInches: w1 - 4},
      {mark: 'C', size: wallBarSize, count: 2 + 2 * [pipes[1], pipes[3]].filter(Boolean).length + solid24 * interiorBars(h), lengthInches: w2 - 4},
      {mark: 'D', size: wallBarSize, count: 4 + 2 * openingCount + solid13 * interiorBars(w1) + solid24 * interiorBars(w2), lengthInches: h},
      {mark: 'E', size: 6, count: 2 * (Math.round(w1 / 6) + 1), lengthInches: w2 - 4},
      {mark: 'F', size: 6, count: 2 * (Math.round(w2 / 6) + 1), lengthInches: w1 - 4},
    );
    const poundsPerFoot = {4: .668, 6: 1.502, 7: 2.044};
    const steelPounds = bars.reduce((sum, bar) => sum + bar.count * bar.lengthInches / 12 * poundsPerFoot[bar.size], 0) + 3.3;
    if (![h, concreteCubicYards, steelPounds, ...bars.flatMap(bar => [bar.count, bar.lengthInches])].every(Number.isFinite) || bars.some(bar => !Number.isSafeInteger(bar.count)) || concreteCubicYards <= 0) {
      throw new Error('These dimensions do not produce finite, positive JB-2 quantities. Check the inputs.');
    }
    const warnings = [];
    if (solid13 + solid24) warnings.push('Solid-wall bars use the agreed end-bar convention: ceil(run / 12 in.) - 1 interior bars per wall; H for B/C, the wall width for D.');
    if (pipes.some(pipe => pipe && Math.abs(pipe.skew) > 15)) warnings.push('JB-2 note 5 requires pipes over 15 degrees skew, or conflicting openings, to be broken back to the wall. This plan schematic does not detail that treatment.');
    return {type: 'JB-2', wallThicknessInches, widthsFeet: [w1 / 12, w2 / 12, w1 / 12, w2 / 12],
      heightFeet, minimumHeightFeet, concreteCubicYards, grossConcreteCubicYards, openingDeductionCubicYards,
      steelPounds, bars, warnings};
  }

  function calculateBox(input) {
    if (input?.type === 'JB-2') return calculateJB2Box(input);
    if (input?.type != null && input.type !== 'JB-1') throw new Error('Choose JB-1 or JB-2.');
    return calculateJB1Box(input);
  }

  function totalQuantities(results) {
    if (results.some(box => box.type === 'JB-2')) return {
      concreteCubicYards: results.reduce((sum, box) => sum + box.concreteCubicYards, 0),
      steelPounds: results.reduce((sum, box) => sum + box.steelPounds, 0),
    };
    return {
      concreteCubicYards: results.reduce((sum, box) => f32(sum + box.concreteCubicYards), 0),
      steelPounds: results.reduce((sum, box) => f32(sum + box.steelPounds), 0),
    };
  }

  return Object.freeze({ calculateBox, defaultThickness, supportedNoncircularSpans, pipeSizes, totalQuantities });
});
