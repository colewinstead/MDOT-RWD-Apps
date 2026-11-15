(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./calculations.js'));
  else root.StrExcExcel = factory(root.StrExc);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (calc) {
  'use strict';
  const xml = value => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const relationships = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  function cell(value, row, col, style = 0, formula) {
    const ref = `${String.fromCharCode(65+col)}${row}`;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('Excel requires finite quantities.');
      return `<c r="${ref}" s="${style}">${formula ? `<f>${xml(formula)}</f>` : ''}<v>${value}</v></c>`;
    }
    // Text stays text, including stations or IDs beginning with an Excel formula character.
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value ?? '')}</t></is></c>`;
  }
  function worksheet(project, results) {
    const rows = [], merges = [];
    function row(values, styles = 0, formulas = {}, height = 30) {
      const n = rows.length+1;
      rows.push(`<row r="${n}" ht="${height}" customHeight="1">${values.map((v,i) => cell(v,n,i,Array.isArray(styles) ? styles[i] : styles,formulas[i])).join('')}</row>`);
      return n;
    }
    row(['Structure excavation'],1,{},30); merges.push('A1:L1');
    row([`Project: ${project.name || 'Not entered'}    County: ${project.county || 'Not entered'}    Date: ${project.date || 'Not entered'}`],0,{},Math.max(30,Math.ceil((project.name.length+project.county.length+50)/120)*15)); merges.push('A2:L2');
    row(['Inputs: length and depth in feet; pipe diameter or arch span in inches. FES = flared end sections.'],0); merges.push('A3:L3');
    row(['Pipe ID','Station','Type','Size (in.)','Diameter / span (in.)','Length (ft)','Avg. excavation depth (ft)','FES count','FES factor (CY / ft / end)','Trench (CY)','FES (CY)','Excavation (CY)'],2,{},48);
    project.pipes.forEach((pipe,i) => {
      const r = results[i], n = rows.length+1;
      const height = Math.max(30,Math.ceil(pipe.id.length/14)*15,Math.ceil(pipe.station.length/16)*15);
      row([pipe.id,pipe.station,r.type,pipe.size,r.span,Number(pipe.length),Number(pipe.depth),Number(pipe.fes),r.factor,r.trench,r.ends,r.total],
        [0,0,0,0,3,3,3,0,3,3,3,3],{9:`((E${n}+24)/12)*F${n}*G${n}/27`,10:`H${n}*I${n}*G${n}`,11:`J${n}+K${n}`},height);
    });
    const last = rows.length, totals = calc.totals(results), n = last+1;
    row(['Total','','','','',totals.length,'','','',totals.trench,totals.ends,totals.total],
      [2,2,2,2,2,4,2,2,2,4,4,4],{5:`SUM(F5:F${last})`,9:`SUM(J5:J${last})`,10:`SUM(K5:K${last})`,11:`SUM(L5:L${last})`}); merges.push(`A${n}:E${n}`,`G${n}:I${n}`);
    const notes = [
      'Trench CY = ((diameter or span + 24) / 12) x length x average excavation depth / 27. FES CY = count x factor x depth.',
      'Source: Legacy/strexc.exe, Mississippi DOT Structure Excavation v1.1. Formula and allowance table recovered from its embedded script.',
      'Rows display 3 decimals; totals display 2 and sum unrounded values. Formula cells recalculate when numeric inputs are edited in Excel.',
      'Size, span and FES factor are exported values. Change pipe size in the app and export again to keep them consistent. Save JSON to reopen app inputs.',
    ];
    for (const note of notes) { const n = row([note],5,{},30); merges.push(`A${n}:L${n}`); }
    const widths = [16,18,10,15,14,14,16,10,16,16,16,18];
    const validation = [['decimal','F','0','1E+12'],['decimal','G','0','1E+12'],['whole','H','0','2']].map(([type,col,min,max]) => `<dataValidation type="${type}" operator="${col === 'H' ? 'between' : 'greaterThan'}" allowBlank="0" showErrorMessage="1" errorTitle="Invalid input" error="${col === 'H' ? 'Enter 0, 1 or 2.' : 'Enter a number greater than zero.'}" sqref="${col}5:${col}${last}"><formula1>${min}</formula1>${col === 'H' ? `<formula2>${max}</formula2>` : ''}</dataValidation>`).join('');
    return {lastRow:rows.length,sheet:`${declaration}<worksheet xmlns="${main}"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:L${rows.length}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane xSplit="2" ySplit="4" topLeftCell="C5" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="20"/><cols>${widths.map((width,i) => `<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData><autoFilter ref="A4:L${last}"/><mergeCells count="${merges.length}">${merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells><dataValidations count="3">${validation}</dataValidations><pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="5" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`};
  }
  function styles() {
    const formats = [[0,0,0],[1,0,0],[2,0,1],[0,164,0],[2,165,1],[3,0,0]];
    return `${declaration}<styleSheet xmlns="${main}"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.000"/><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="18"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="9"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE5ECEF"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFD6DDDF"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6">${formats.map(([font,num,fill]) => `<xf numFmtId="${num}" fontId="${font}" fillId="${fill ? 2 : 0}" borderId="1" xfId="0" applyAlignment="1" applyNumberFormat="1"><alignment vertical="center" wrapText="1"/></xf>`).join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }
  // ZIP writer reused from JB-1/xlsx.js; no runtime library or network service.
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
  function createWorkbook(input) {
    const project = calc.project(input);
    if (!project.pipes.length) throw new Error('Add at least one valid pipe before exporting.');
    const results = project.pipes.map(calc.calculate), {sheet,lastRow} = worksheet(project,results);
    return zip([
      ['[Content_Types].xml',`${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
      ['_rels/.rels',`${declaration}<Relationships xmlns="${relationships}"><Relationship Id="rId1" Type="${office}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ['xl/workbook.xml',`${declaration}<workbook xmlns="${main}" xmlns:r="${office}"><sheets><sheet name="Structure excavation" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">'Structure excavation'!$A$1:$L$${lastRow}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">'Structure excavation'!$1:$4</definedName></definedNames><calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`],
      ['xl/_rels/workbook.xml.rels',`${declaration}<Relationships xmlns="${relationships}"><Relationship Id="rId1" Type="${office}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${office}/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml',styles()],['xl/worksheets/sheet1.xml',sheet],
    ]);
  }
  return Object.freeze({createWorkbook});
});
