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

  function calculateBox(input) {
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

  function totalQuantities(results) {
    return {
      concreteCubicYards: results.reduce((sum, box) => f32(sum + box.concreteCubicYards), 0),
      steelPounds: results.reduce((sum, box) => f32(sum + box.steelPounds), 0),
    };
  }

  return Object.freeze({ calculateBox, defaultThickness, supportedNoncircularSpans, totalQuantities });
});
