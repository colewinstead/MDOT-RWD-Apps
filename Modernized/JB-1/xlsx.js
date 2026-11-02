(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JBExcel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const xml = value => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[c]));
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const relationships = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const marks = ['A1', 'A2', 'A3', 'A4', 'B', 'C', 'D', 'E', 'F'];
  function column(index) {
    let name = '';
    for (; index > 0; index = Math.floor((index - 1) / 26)) name = String.fromCharCode(65 + (index - 1) % 26) + name;
    return name;
  }
  function cell(value, row, col, style, formula) {
    const attributes = `r="${column(col)}${row}" s="${style}"`;
    if (value == null || value === '') return `<c ${attributes}/>`;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('Excel export requires finite quantities.');
      return `<c ${attributes}>${formula ? `<f>${xml(formula)}</f>` : ''}<v>${value}</v></c>`;
    }
    // Explicit text cells preserve stations/leading zeroes and never execute user text as formulas.
    return `<c ${attributes} t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  }
  function worksheet(project, results) {
    const rows = [], merges = [];
    const steelValues = [];
    const row = (values, styles, height, formulas = {}) => {
      const number = rows.length + 1;
      rows.push(`<row r="${number}" ht="${height}" customHeight="1">${Array.from({length: 47}, (_, i) => cell(values[i], number, i + 1, Array.isArray(styles) ? styles[i] : styles, formulas[i])).join('')}</row>`);
      return number;
    };
    row(['JUNCTION BOXES'], 1, 26); merges.push('A1:AU1');
    row([], 0, 24);
    const top = Array(47).fill(''), bottom = Array(47).fill('');
    ['WK. SH.\nNO.', 'BOX ID', 'TYPE', 'STATION', 'LT/RT'].forEach((label, i) => { top[i] = label; merges.push(`${column(i + 1)}3:${column(i + 1)}4`); });
    for (let side = 0; side < 4; side++) {
      const c = 5 + side * 2;
      top[c] = `SIDE ${side + 1}`; bottom[c] = 'SIZE (IN.)'; bottom[c + 1] = 'SKEW (DEG.)';
      merges.push(`${column(c + 1)}3:${column(c + 2)}3`);
    }
    ['SIDE W1-3\n(FT)', 'SIDE W2-4\n(FT)', 'H\n(FT)', 'CLASS "B"\nCONC. (C.Y.)', 'REINF.\nSTEEL (LB.)'].forEach((label, i) => {
      top[13 + i] = label; merges.push(`${column(14 + i)}3:${column(14 + i)}4`);
    });
    top[18] = 'BAR LIST: QUANTITY @ LENGTH (IN.)'; merges.push('S3:AS3');
    marks.forEach((mark, i) => { bottom[18 + i * 3] = mark; merges.push(`${column(19 + i * 3)}4:${column(21 + i * 3)}4`); });
    top[45] = 'TOTAL BAR\nLENGTH (IN.)'; top[46] = 'REMARKS'; merges.push('AT3:AT4', 'AU3:AU4');
    row(top, 2, 30); row(bottom, 2, 30);
    const dataStyles = [3, 3, 3, 3, 3, ...Array.from({length: 4}, () => [3, 4]).flat(), 4, 4, 4, 5, 4, ...marks.flatMap(() => [6, 3, 4]), 4, 7];
    project.boxes.forEach((box, i) => {
      const result = results[i];
      const remarks = [box.type === 'JB-2'
        ? `${result.wallThicknessInches}-in. box walls. A #4; B/C/D #${result.wallThicknessInches === 8 ? 7 : 6}; E/F #6.`
        : 'All bars #4.',
      box.type === 'JB-2' && box.pipes.some(pipe => pipe.span && Math.abs(pipe.skew) > 15) ? 'Breakback: drawing note 5.' : ''].filter(Boolean).join(' ');
      const bars = marks.map(mark => {
        const bar = result.bars.find(bar => bar.mark === mark);
        if (!bar) throw new Error(`Excel export is missing bar ${mark}.`);
        return bar;
      });
      const n = rows.length + 1;
      const terms = marks.map((_, i) => `${column(19 + i * 3)}${n}*${column(21 + i * 3)}${n}`);
      const barLength = bars.reduce((sum, bar) => sum + bar.count * bar.lengthInches, 0);
      const weights = {4: .668, 6: 1.502, 7: 2.044};
      const steel = box.type === 'JB-2'
        ? bars.reduce((sum, bar) => sum + bar.count * bar.lengthInches / 12 * weights[bar.size], 0) + 3.3
        : barLength * .055663;
      steelValues.push(steel);
      const formulas = {45: `SUM(${terms.join(',')})`, 17: box.type === 'JB-2'
        ? `SUM(${terms.map((term, i) => `${term}/12*${weights[bars[i].size]}`).join(',')})+3.3`
        : `AT${n}*0.055663`};
      const values = [box.worksheetNumber || '', box.number, box.type, box.station, box.side === 'L' ? 'LT' : 'RT',
        ...box.pipes.flatMap(pipe => pipe.span ? [pipe.span === pipe.rise ? pipe.span : `${pipe.span} x ${pipe.rise}`, pipe.skew] : ['', '']),
        result.widthsFeet[0], result.widthsFeet[1], result.heightFeet, result.concreteCubicYards, steel,
        ...bars.flatMap(bar => [bar.count, '@', bar.lengthInches]), barLength, remarks];
      row(values, dataStyles, Math.max(32, Math.ceil(remarks.length / 44) * 12 + 8, Math.ceil((box.worksheetNumber || '').length / 8) * 12 + 8, Math.ceil(box.number.length / 8) * 12 + 8, Math.ceil(box.station.length / 12) * 12 + 8), formulas);
    });
    const lastDetail = rows.length;
    for (const [label, concrete, steel] of [['UNITS', 'C.Y.', 'LB.'], ['TOTAL', results.reduce((sum, result) => sum + result.concreteCubicYards, 0), steelValues.reduce((sum, steel) => sum + steel, 0)]]) {
      const values = Array(47).fill(''); values[0] = label; values[16] = concrete; values[17] = steel;
      const formulas = label === 'TOTAL' ? {16: `SUM(Q5:Q${lastDetail})`, 17: `SUM(R5:R${lastDetail})`} : {};
      const n = row(values, [...Array(16).fill(11), 8, 8, ...Array(29).fill(9)], 20, formulas);
      merges.push(`A${n}:P${n}`, `S${n}:AU${n}`);
    }
    const notes = [
      `Project: ${project.projectNumber || 'Not entered'}    County: ${project.county || 'Not entered'}    Date: ${project.date || 'Not entered'}`,
      'Steel, total bar length and project totals use Excel formulas. You can adjust quantity cells or bar counts/lengths. Keep the separate project JSON to reopen the app inputs.',
      'Dimensions and concrete are exported values. Recalculate in the app for pipe or box-standard changes. Excel uses full-precision arithmetic; final digits may differ from JB-1 legacy float32 results.',
      'Bar lengths retain calculation precision. Total bar length includes the listed bars in inches. JB-1 steel is based on those bars only; JB-2 steel also includes 3.3 lb for its two lift bars.',
      'JB-1 uses recovered v5.0 geometry/concrete/bar rules. JB-2 uses MDOT sheet 6506 (August 1, 2017); solid walls add max(0, ceil(run / 12 in.) - 1) interior bars, H for B/C and the full wall width for D.',
    ];
    for (const note of notes) { const n = row([note], 10, 24); merges.push(`A${n}:AU${n}`); }
    const widths = [8, 8, 8, 12, 7, ...Array.from({length: 4}, () => [11, 7]).flat(), 8, 8, 8, 10, 10, ...marks.flatMap(() => [4, 4, 7]), 12, 48];
    const sheet = `${declaration}<worksheet xmlns="${main}"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:AU${rows.length}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0" zoomScale="85"><pane xSplit="5" ySplit="4" topLeftCell="F5" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="F5" sqref="F5"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData><mergeCells count="${merges.length}">${merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.3" bottom="0.3" header="0.15" footer="0.15"/><pageSetup paperSize="3" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
    return {sheet, lastRow: rows.length};
  }
  function styles() {
    const formats = [
      [0, 0, 0, 0, 'left'], [2, 0, 0, 1, 'center'], [1, 0, 0, 1, 'center'],
      [0, 0, 0, 1, 'center'], [0, 164, 0, 1, 'center'], [0, 165, 0, 1, 'center'],
      [0, 1, 0, 1, 'center'], [0, 0, 0, 1, 'left'], [1, 165, 0, 1, 'center'],
      [0, 0, 2, 1, 'center'], [3, 0, 0, 0, 'left'], [1, 0, 0, 1, 'center'],
    ];
    return `${declaration}<styleSheet xmlns="${main}"><numFmts count="2"><numFmt numFmtId="164" formatCode="0.00"/><numFmt numFmtId="165" formatCode="0.000"/></numFmts><fonts count="4"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font><font><b/><sz val="14"/><name val="Arial"/></font><font><sz val="9"/><color rgb="FF444444"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF000000"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${formats.length}">${formats.map(([font, num, fill, border, align]) => `<xf numFmtId="${num}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyAlignment="1" applyNumberFormat="1"><alignment horizontal="${align}" vertical="center" wrapText="1"/></xf>`).join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }
  function zip(files) {
    const encoder = new TextEncoder(), parts = [], directory = [];
    const table = Uint32Array.from({length: 256}, (_, value) => {
      for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      return value >>> 0;
    });
    let offset = 0;
    for (const [name, source] of files) {
      const filename = encoder.encode(name), data = encoder.encode(source);
      let crc = 0xffffffff;
      for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
      crc = (crc ^ 0xffffffff) >>> 0;
      const local = new Uint8Array(30 + filename.length), entry = new Uint8Array(46 + filename.length);
      const l = new DataView(local.buffer), e = new DataView(entry.buffer);
      l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true); l.setUint16(12, 33, true);
      l.setUint32(14, crc, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true); l.setUint16(26, filename.length, true); local.set(filename, 30);
      e.setUint32(0, 0x02014b50, true); e.setUint16(4, 20, true); e.setUint16(6, 20, true); e.setUint16(8, 0x800, true); e.setUint16(14, 33, true);
      e.setUint32(16, crc, true); e.setUint32(20, data.length, true); e.setUint32(24, data.length, true); e.setUint16(28, filename.length, true); e.setUint32(42, offset, true); entry.set(filename, 46);
      parts.push(local, data); directory.push(entry); offset += local.length + data.length;
    }
    const size = directory.reduce((sum, part) => sum + part.length, 0), end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, offset, true);
    const bytes = new Uint8Array(offset + size + end.length);
    let cursor = 0;
    for (const part of [...parts, ...directory, end]) { bytes.set(part, cursor); cursor += part.length; }
    return bytes;
  }
  function createWorkbook(project, results) {
    if (!project?.boxes?.length || project.boxes.length > 50 || project.boxes.length !== results.length) throw new Error('Excel export requires 1 to 50 valid boxes.');
    const {sheet, lastRow} = worksheet(project, results);
    return zip([
      ['[Content_Types].xml', `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
      ['_rels/.rels', `${declaration}<Relationships xmlns="${relationships}"><Relationship Id="rId1" Type="${office}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ['xl/workbook.xml', `${declaration}<workbook xmlns="${main}" xmlns:r="${office}"><sheets><sheet name="Junction Boxes" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">'Junction Boxes'!$A$1:$AU$${lastRow}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">'Junction Boxes'!$1:$4</definedName></definedNames><calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`],
      ['xl/_rels/workbook.xml.rels', `${declaration}<Relationships xmlns="${relationships}"><Relationship Id="rId1" Type="${office}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${office}/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', styles()], ['xl/worksheets/sheet1.xml', sheet],
    ]);
  }
  return Object.freeze({createWorkbook});
});
