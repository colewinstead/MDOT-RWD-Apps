(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StrExc = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const sizes = Object.freeze([
    ['18',1.18],['24',1.41],['30',1.63],['36',2.34],['42',2.53],['48',2.71],
    ['54',2.94],['60',3.12],['66',3.31],['72',3.48],['84',5.86],
    ['22x13',1.2],['29x18',1.43],['36x26',1.66],['44x27',2.4],['51x31',2.59],
    ['58x36',2.8],['65x40',2.98],['73x45',3.19],['88x54',3.91],
  ].map(([size, factor]) => Object.freeze({size, factor, span: Number(size.split('x')[0]), type: size.includes('x') ? 'Arch' : 'Round'})));
  const MAX_PIPES = 500;
  function number(value, label) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(?:\.\d*)?$|^\.\d+$/.test(value.trim()))) throw new Error(`${label}: enter a number.`);
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`${label}: enter a finite number.`);
    return n;
  }
  function text(value, label, max = 120) {
    if (typeof value !== 'string' || value.length > max) throw new Error(`${label}: use up to ${max} characters.`);
    return value;
  }
  function calculate(pipe) {
    if (!pipe || typeof pipe !== 'object') throw new Error('Invalid pipe record.');
    const spec = sizes.find(item => item.size === pipe.size);
    if (!spec) throw new Error('Choose a listed pipe size.');
    const length = number(pipe.length, 'Length'), depth = number(pipe.depth, 'Depth'), fes = number(pipe.fes, 'FES');
    if (length <= 0) throw new Error('Length must be greater than zero.');
    if (depth <= 0) throw new Error('Depth must be greater than zero.');
    if (!Number.isInteger(fes) || fes < 0 || fes > 2) throw new Error('FES must be 0, 1 or 2.');
    const width = (spec.span + 24) / 12;
    const trench = width * length * depth / 27;
    const ends = fes * spec.factor * depth;
    const total = trench + ends;
    if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER / 1000) throw new Error('Quantity is too large to report to 0.001 CY.');
    return {type: spec.type, span: spec.span, factor: spec.factor, width, trench, ends, total, length};
  }
  function totals(results) {
    const sum = key => results.reduce((n, result) => n + result[key], 0);
    const result = {length: sum('length'), trench: sum('trench'), ends: sum('ends'), total: sum('total')};
    if (Object.values(result).some(n => !Number.isFinite(n) || n > Number.MAX_SAFE_INTEGER / 1000)) throw new Error('Project total is too large to report safely.');
    return result;
  }
  function project(data) {
    if (!data || data.app !== 'StrExc' || data.version !== 1 || !Array.isArray(data.pipes) || data.pipes.length > MAX_PIPES) throw new Error('Choose a StrExc version 1 project with up to 500 pipes.');
    return {app: 'StrExc', version: 1, name: text(data.name, 'Project'), county: text(data.county, 'County'), date: text(data.date, 'Date', 10), pipes: data.pipes.map(pipe => {
      if (!pipe || typeof pipe !== 'object') throw new Error('Invalid pipe record.');
      const id = text(pipe.id, 'Pipe ID', 80), station = text(pipe.station, 'Station', 80);
      if (!id.trim()) throw new Error('Each pipe needs an ID.');
      if (!sizes.some(item => item.size === pipe.size)) throw new Error('Unsupported pipe size in project.');
      const input = key => pipe[key] === '' ? '' : number(pipe[key], key);
      const length = input('length'), depth = input('depth'), fes = number(pipe.fes, 'FES');
      if ((length !== '' && length <= 0) || (depth !== '' && depth <= 0) || !Number.isInteger(fes) || fes < 0 || fes > 2) throw new Error('Project contains invalid length, depth or FES values.');
      if (length !== '' && depth !== '') calculate({...pipe, length, depth, fes});
      return {id, station, size: pipe.size, length, depth, fes};
    })};
  }
  return Object.freeze({sizes, MAX_PIPES, calculate, totals, project});
});
