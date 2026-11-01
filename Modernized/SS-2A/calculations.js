'use strict';
const SS2 = (() => {
  const f = Math.fround;
  const pipeRows = [
    ['15 in. round',.0384],['18 in. round',.0534],['24 in. round',.091],
    ['30 in. round',.1383],['36 in. round',.1955],['42 in. round',.2627],
    ['48 in. round',.3398],['54 in. round',.4267],['60 in. round',.5236],
    ['66 in. round',.6304],['72 in. round',.747],['22 × 13 in. arch',.053],
    ['29 × 19 in. arch',.087],['36 × 23 in. arch',.129],['44 × 27 in. arch',.185],
    ['51 × 31 in. arch',.245],['58 × 36 in. arch',.318],['65 × 40 in. arch',.394],
    ['73 × 45 in. arch',.489]
  ];
  const bases = {5:[14.611,121,73],10:[38.641,231,100],15:[62.671,341,127]};
  function pipes() { return pipeRows.map(([label,deduction],i)=>({id:i+1,label,deduction:f(deduction)})); }
  function number(value,label) {
    if (!['number','string'].includes(typeof value) || String(value).trim()==='' || !Number.isFinite(Number(value))) throw Error(`Enter a finite ${label}.`);
    return Number(value);
  }
  function calculate(input) {
    if (!input || typeof input!=='object') throw Error('Inlet inputs are required.');
    const length=number(input.length,'length');
    if (![5,10,15].includes(length)) throw Error('Length must be 5, 10 or 15 feet.');
    const width=number(input.width,'width'),height=number(input.height,'height');
    if (width<=0 || height<=.5) throw Error('Width must be positive and height must exceed 0.5 ft.');
    if (typeof input.pavement!=='boolean') throw Error('Choose whether concrete pavement is used.');
    if (!Array.isArray(input.openings)) throw Error('Pipe openings must be a list.');
    const h=f(height-.5);
    if (!Number.isFinite(h)) throw Error('Height exceeds the numerical range.');
    const [baseConcrete,baseSteel,pavementSteel]=bases[length];
    const grossConcrete=f((width*h+5.5*width+6*h+f(baseConcrete))/27);
    const grossSteel=f(width*8.68+h*9.350001+f(Math.floor(width+.5))*3.79+f(Math.floor(h-1.58+.5))*7.57+baseSteel);
    let concreteDeduction=0,openingCount=0;
    const openingDetails=input.openings.map(opening=>{
      if (!opening || !Number.isInteger(opening.pipeId) || !pipeRows[opening.pipeId-1]) throw Error('Choose a supported pipe size.');
      if (!Number.isInteger(opening.count) || opening.count<1 || opening.count>50) throw Error('Each pipe count must be a whole number from 1 to 50.');
      openingCount+=opening.count;
      if (openingCount>50) throw Error('Use at most 50 pipe openings per inlet.');
      const [label,constant]=pipeRows[opening.pipeId-1];
      for(let i=0;i<opening.count;i++) concreteDeduction=f(concreteDeduction+f(constant));
      return {pipeId:opening.pipeId,label,count:opening.count,deductionEach:f(constant)};
    });
    const concrete=f(grossConcrete-concreteDeduction);
    const pavementAddition=input.pavement?pavementSteel:0;
    const steel=f(grossSteel+pavementAddition);
    if (![concrete,steel,grossConcrete,grossSteel].every(Number.isFinite) || concrete<=0 || steel<=0) throw Error('Dimensions and opening deductions must leave positive finite quantities.');
    return {length,width,height,calculationHeight:h,pavement:input.pavement,concrete,steel,grossConcrete,grossSteel,
      concreteDeduction,steelDeduction:0,pavementSteel:pavementAddition,openingCount,openingDetails};
  }
  function totals(results) {return results.reduce((t,r)=>({concrete:f(t.concrete+r.concrete),steel:f(t.steel+r.steel),count:t.count+1}),{concrete:0,steel:0,count:0});}
  return Object.freeze({pipes,calculate,totals});
})();
if(typeof module!=='undefined'&&module.exports) module.exports=SS2;
