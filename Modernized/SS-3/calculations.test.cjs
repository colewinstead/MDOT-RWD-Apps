'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const calc = require('./calculations.js');
const f = Math.fround;
test('all 23 baseline choices match float32 immediates from native instructions', () => {
  const asm = fs.readFileSync(path.join(__dirname,'evidence/native-disassembly.txt'),'utf8');
  const entries = [...asm.matchAll(/([0-9a-f]+):[^\n]*mov\s+eax, dword ptr \[0x5b2b(4c|50|54)\]\n[^\n]*mov\s+edx, (0x[0-9a-f]+)/g)]
    .filter(m => parseInt(m[1],16)>=0x40d770 && parseInt(m[1],16)<=0x41555b)
    .map(m => {const b=Buffer.alloc(4);b.writeUInt32LE(Number(m[3]));return {address:parseInt(m[1],16),field:m[2],value:b.readFloatLE()};});
  const native3 = entries.filter(e=>e.address<0x413979);
  assert.equal(native3.length,57);
  calc.pipes('SS-3').forEach((p,i) => {
    const r=calc.calculate({type:'SS-3',pipeId:p.id,height:p.minHeight});
    assert.deepEqual([f(r.minHeight),r.concrete,r.steel],native3.slice(i*3,i*3+3).map(e=>e.value));
    assert.equal(r.grate,200);assert.equal(r.frame,244);
  });
  const native4=entries.filter(e=>e.address>=0x41483b);
  assert.equal(native4.length,8);
  calc.pipes('SS-4').forEach((p,i)=>{
    const r=calc.calculate({type:'SS-4',pipeId:p.id,height:p.minHeight});
    assert.deepEqual([f(r.minHeight),r.concrete],native4.slice(i*2,i*2+2).map(e=>e.value));
    assert.equal(r.steel,31);assert.equal(r.grate,0);assert.equal(r.frame,0);
  });
});
test('height additions preserve individual float32 stores, and never carry state between inlets',()=>{
  for(const type of ['SS-3','SS-4']) for(const p of calc.pipes(type)) {
    const input={type,pipeId:p.id,height:p.minHeight+2.125};
    const copy={...input};const r=calc.calculate(input);
    const delta=f(f(input.height)-f(p.minHeight));
    assert.equal(r.concrete,f(f(p.baseConcrete)+f(delta*(type==='SS-3'?.184:.185))));
    assert.equal(r.steel,type==='SS-3'?f(p.baseSteel+f(delta*17)):31);
    assert.deepEqual(input,copy);
    assert.equal(calc.calculate({...input,height:p.minHeight}).concrete,f(p.baseConcrete));
  }
});
test('invalid values cannot produce quantities',()=>{
  for(const height of ['', ' ',null,undefined,true,{},[],NaN,Infinity,-1,0,3.499,1e40])
    assert.throws(()=>calc.calculate({type:'SS-3',pipeId:1,height}));
  for(const type of ['ss-3','',null]) assert.throws(()=>calc.calculate({type,pipeId:1,height:4}));
  for(const pipeId of [0,20,'1',null]) assert.throws(()=>calc.calculate({type:'SS-3',pipeId,height:4}));
});
test('project totals sum unrounded results without mixing grate/frame with reinforcement',()=>{
  const a=calc.calculate({type:'SS-3',pipeId:1,height:3.5});
  const b=calc.calculate({type:'SS-4',pipeId:1,height:3.125});
  assert.deepEqual(calc.totals([a,b]),{count:2,concrete:a.concrete+b.concrete,steel:107,grate:200,frame:244});
});
test('46 real Windows cases match exact float32 quantity bytes',()=>{
  const cases=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/legacy-results.json'),'utf8')).cases;
  assert.equal(cases.length,46);
  let comparisons=0;
  for(const sample of cases) {
    const result=calc.calculate({type:sample.type,pipeId:sample.choice,height:sample.typedHeight ?? sample.height});
    assert.equal(result.height,Buffer.from(sample.observed.rawHex.height,'hex').readFloatLE(),
      `${sample.type} choice ${sample.choice}: input float32 height`);
    for(const field of ['concrete','steel',...(sample.type==='SS-3'?['grate','frame']:[])]) {
      const observed=Buffer.from(sample.observed.rawHex[field],'hex').readFloatLE();
      assert.equal(result[field],observed,`${sample.type} choice ${sample.choice}, height ${sample.height}, ${field}`);
      comparisons++;
    }
  }
  assert.equal(comparisons,168);
});
