'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const calc = require('./calculations.js');
const excel = require('./xlsx.js');
const pipe = {id:'P-1',station:'001+00',size:'18',length:90,depth:3,fes:0};
const project = pipes => ({app:'StrExc',version:1,name:'Test',county:'Test county',date:'2026-11-14',pipes});
const near = (a,b) => assert.ok(Math.abs(a-b) < 1e-9,`${a} != ${b}`);

test('all 20 sizes and allowances match the recovered EXE script', () => {
  const script = fs.readFileSync(path.join(__dirname,'evidence/recovered-script.au3'),'utf8');
  const records = [...script.matchAll(/If GUICtrlRead \( \$COMBO_DS \) == "([\dx]+)" Then\s+\$DIAMETERSPAN = "(Round|Arch)"\s+\$CY = ([\d.]+)/g)];
  assert.equal(records.length,20);
  assert.deepEqual(calc.sizes.map(s=>[s.size,s.type,s.factor]),records.map(m=>[m[1],m[2],Number(m[3])]));
  for (const [,size,,factor] of records) {
    for (const length of [0.25,54,1234.567]) for (const depth of [0.125,3,18.52]) for (const fes of [0,1,2]) {
      const actual = calc.calculate({...pipe,size,length,depth,fes});
      const expected = (((parseFloat(size)+24)/12)*length*depth)/27+fes*Number(factor)*depth;
      near(actual.total,expected);
    }
  }
});
test('hand calculations cover round, arch and FES additions', () => {
  const round = calc.calculate(pipe); near(round.width,3.5); near(round.total,35);
  const arch = calc.calculate({...pipe,size:'22x13',length:54,depth:3,fes:2});
  near(arch.trench,23); near(arch.ends,7.2); near(arch.total,30.2);
  const large = calc.calculate({...pipe,size:'84',length:27,depth:1,fes:2}); near(large.total,20.72);
  const withEnds = calc.calculate({...pipe,size:'24',length:100,depth:5,fes:2}); near(withEnds.total,88.17407407407407);
});
test('reject missing, unsupported and unsafe inputs', () => {
  for (const value of ['',null,true,[],{},'1e3','12 feet','-1',NaN,Infinity,0,-1]) {
    assert.throws(()=>calc.calculate({...pipe,length:value}));
    assert.throws(()=>calc.calculate({...pipe,depth:value}));
  }
  for (const value of [3,-1,0.5,true,'',null]) assert.throws(()=>calc.calculate({...pipe,fes:value}));
  for (const size of ['15','22X13','22 x 13',18,'__proto__']) assert.throws(()=>calc.calculate({...pipe,size}));
  assert.throws(()=>calc.calculate({...pipe,length:1e308,depth:1e308}));
  near(calc.calculate({...pipe,length:'90.00',depth:'.5'}).total,35/6);
});
test('totals add unrounded values and repeated edits do not append quantities', () => {
  const first = calc.calculate({...pipe,length:1,depth:1}), second = calc.calculate({...pipe,length:2,depth:1});
  near(calc.totals([first,second]).total,3.5/9);
  near(calc.totals([second]).total,7/27);
  assert.throws(()=>calc.totals([{length:1,trench:Infinity,ends:0,total:Infinity}]));
});
test('project import validates before replacing data and permits blank drafts', () => {
  assert.deepEqual(calc.project(project([pipe])),project([pipe]));
  assert.equal(calc.project(project([{...pipe,length:'',depth:''}])).pipes[0].length,'');
  for (const change of [{version:2},{app:'JB'},{pipes:null},{name:true},{pipes:Array(501).fill(pipe)}]) assert.throws(()=>calc.project({...project([pipe]),...change}));
  for (const change of [{id:''},{id:'x'.repeat(81)},{station:null},{size:'15'},{length:0},{length:true},{depth:-1},{fes:3}]) assert.throws(()=>calc.project(project([{...pipe,...change}])));
  assert.equal(calc.project(project(Array(500).fill(pipe))).pipes.length,500);
  assert.throws(()=>excel.createWorkbook(project([])));
  assert.throws(()=>excel.createWorkbook(project([{...pipe,length:''}])));
  assert.equal(excel.createWorkbook(project([pipe]))[0],0x50);
});
