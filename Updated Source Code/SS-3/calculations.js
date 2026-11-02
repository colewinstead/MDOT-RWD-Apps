'use strict';
const SS3 = (() => {
  const f = Math.fround;
  // Preserve the decimal constants and float32 stores in this exact legacy build.
  const rows3 = [
    ['18 in. round',3.5,.869,76], ['24 in. round',4.084,1.117,87],
    ['30 in. round',4.667,1.385,94], ['36 in. round',5.25,1.671,105],
    ['42 in. round',5.834,1.978,116], ['48 in. round',6.417,2.305,123],
    ['54 in. round',7,2.65,135], ['60 in. round',7.583,3.016,146],
    ['66 in. round',8.167,3.402,153], ['72 in. round',8.75,3.806,164],
    ['22 × 13 in. arch',3.125,.855,76], ['29 × 19 in. arch',3.583,1.085,83],
    ['36 × 23 in. arch',4.042,1.358,94], ['44 × 27 in. arch',4.468,1.631,101],
    ['51 × 31 in. arch',4.943,1.942,113], ['58 × 36 in. arch',5.417,2.269,120],
    ['65 × 40 in. arch',5.833,2.575,130], ['73 × 45 in. arch',6.333,2.966,139],
    ['88 × 54 in. arch',7.25,3.765,156]
  ];
  const rows4 = [['15 in. round',3.125,.64,31], ['18 in. round',3.4167,.67,31],
    ['24 in. round',4,.74,31], ['22 × 13 in. arch',3,.62,31]];
  function pipes(type) {
    if (type !== 'SS-3' && type !== 'SS-4') throw new Error('Choose SS-3 or SS-4.');
    return (type === 'SS-3' ? rows3 : rows4).map(([label,minHeight,baseConcrete,baseSteel],i) =>
      ({id:i+1,label,minHeight,baseConcrete,baseSteel}));
  }
  function calculate(input) {
    if (!input || typeof input !== 'object') throw new Error('Inlet inputs are required.');
    const pipe = pipes(input.type).find(p => p.id === input.pipeId);
    if (!pipe) throw new Error('Choose a supported pipe size.');
    if (!['number','string'].includes(typeof input.height) || String(input.height).trim() === '')
      throw new Error('Enter the inlet height in decimal feet.');
    const height = f(Number(input.height));
    if (!Number.isFinite(height) || height <= 0) throw new Error('Height must be a finite positive number.');
    // Modern input safeguard: the original accepts heights below its baseline without reducing quantities.
    if (height < f(pipe.minHeight)) throw new Error(`Height must be at least ${pipe.minHeight} ft for this pipe.`);
    const extraHeight = f(height - f(pipe.minHeight));
    const extraConcrete = f(extraHeight * (input.type === 'SS-3' ? .184 : .185));
    const extraSteel = input.type === 'SS-3' ? f(extraHeight * 17) : 0;
    const result = {type:input.type,pipeId:pipe.id,pipeLabel:pipe.label,height,minHeight:pipe.minHeight,
      baseConcrete:f(pipe.baseConcrete),baseSteel:f(pipe.baseSteel),extraHeight,extraConcrete,extraSteel,
      concrete:f(f(pipe.baseConcrete)+extraConcrete),steel:f(f(pipe.baseSteel)+extraSteel),
      grate:input.type === 'SS-3' ? 200 : 0,frame:input.type === 'SS-3' ? 244 : 0};
    if (!Object.values(result).every(v => typeof v !== 'number' || Number.isFinite(v)))
      throw new Error('Height exceeds the supported numerical range.');
    return result;
  }
  // Project totals are a new report convenience; sum unrounded per-inlet results.
  function totals(results) {
    return results.reduce((t,r) => ({count:t.count+1,concrete:t.concrete+r.concrete,
      steel:t.steel+r.steel,grate:t.grate+r.grate,frame:t.frame+r.frame}),
    {count:0,concrete:0,steel:0,grate:0,frame:0});
  }
  return Object.freeze({pipes,calculate,totals});
})();
if (typeof module !== 'undefined' && module.exports) module.exports = SS3;
