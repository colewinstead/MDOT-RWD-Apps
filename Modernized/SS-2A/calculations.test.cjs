'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const SS2=require('./calculations.js');
const f=Math.fround;
const sample={length:5,width:4,height:4,pavement:false,openings:[{pipeId:1,count:1}]};
test('all 19 opening constants match actual native float32 immediates',()=>{
 const asm=fs.readFileSync(path.join(__dirname,'evidence/native-disassembly.txt'),'utf8');
 const values=[...asm.matchAll(/([0-9a-f]+):[^\n]*mov\s+edx, (0x[0-9a-f]+)/g)]
  .filter(m=>parseInt(m[1],16)>=0x416bb6&&parseInt(m[1],16)<=0x418c32)
  .map(m=>{const b=Buffer.alloc(4);b.writeUInt32LE(Number(m[2]));return b.readFloatLE();});
 assert.equal(values.length,19);
 assert.deepEqual(SS2.pipes().map(p=>p.deduction),values);
});
test('first actual Windows case matches exact quantities',()=>{
 const r=SS2.calculate(sample);
 assert.equal(r.concrete,Buffer.from('79492740','hex').readFloatLE());
 assert.equal(r.steel,Buffer.from('b9be5a43','hex').readFloatLE());
});
test('all lengths and pavement additions, repeated deductions and immutable inputs',()=>{
 for(const [length,extra] of [[5,73],[10,100],[15,127]]) {
  const a=SS2.calculate({...sample,length}),b=SS2.calculate({...sample,length,pavement:true});
  assert.equal(a.concrete,b.concrete);assert.equal(b.steel,f(a.steel+extra));
 }
 const input={...sample,openings:[{pipeId:1,count:3},{pipeId:12,count:2}]};
 const before=JSON.stringify(input);const r=SS2.calculate(input);
 let deduction=0;for(const d of [.0384,.0384,.0384,.053,.053])deduction=f(deduction+f(d));
 assert.equal(r.concreteDeduction,deduction);assert.equal(JSON.stringify(input),before);
});
test('invalid input cannot produce quantities',()=>{
 for(const width of ['',true,null,NaN,Infinity,0,-1,1e40])assert.throws(()=>SS2.calculate({...sample,width}));
 for(const height of ['',true,null,NaN,Infinity,0,.5,-1,1e40])assert.throws(()=>SS2.calculate({...sample,height}));
 for(const length of [0,6,20,{},null])assert.throws(()=>SS2.calculate({...sample,length}));
 for(const openings of [null,[{pipeId:20,count:1}],[{pipeId:1,count:0}],[{pipeId:'1',count:1}],[{pipeId:1,count:1.5}],[{pipeId:1,count:51}]])assert.throws(()=>SS2.calculate({...sample,openings}));
 assert.throws(()=>SS2.calculate({...sample,pavement:'N'}));
 assert.throws(()=>SS2.calculate({...sample,openings:[{pipeId:11,count:50}]}));
});
test('real Windows grid matches exact stored quantities',()=>{
 const cases=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/legacy-grid-results.json'),'utf8')).cases;
 assert.equal(cases.length,8,'Complete grid capture required');
 for(const [i,s] of cases.entries()) {
  assert.ok(Number.isInteger(s.resultIndex) && s.resultIndex>0,'Runtime fixture declares result index');
  const r=SS2.calculate({...s,openings:s.openings.map(([count,row,col])=>({count,pipeId:(col?12:1)+row}))});
  for(const field of ['concrete','steel']) {
   const values=Buffer.from(s.observed.rawHex[field],'hex');
   assert.equal(r[field],values.readFloatLE(s.resultIndex*4),`case ${i+1} ${field}`);
  }
 }
});
test('project totals retain original sequential float32 accumulation',()=>{
 const rows=[{concrete:16777216,steel:16777216},{concrete:1,steel:1},{concrete:1,steel:1}];
 assert.deepEqual(SS2.totals(rows),{count:3,concrete:16777216,steel:16777216});
});
