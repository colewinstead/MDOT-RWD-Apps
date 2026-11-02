'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const f = (number, digits = 3) => number.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const emptyPipe = () => ({ span: 0, rise: 0, skew: 0, thickness: 0 });
  const newPipe = () => ({ span: 24, rise: 24, skew: 0, thickness: 3 });
  const newBox = (number, type = 'JB-1') => ({ type, number: String(number), station: '', side: 'L', height: null, pipes: [newPipe(), emptyPipe(), newPipe(), emptyPipe()] });
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let project = { schema: 'jb-project-v1', projectNumber: '', county: '', date, boxes: [newBox(1)] };
  let selected = 0;
  let dirty = false;
  let results = [];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function makePipeRows() {
    $('pipe-rows').innerHTML = [0, 1, 2, 3].map(i => `<tr data-side="${i}"><td><label><input type="checkbox" id="pipe-${i}-enabled" aria-label="Pipe on side ${i + 1}${i === 0 ? ', required outflow' : ''}" ${i === 0 ? 'disabled' : ''}><span>${i + 1}</span></label></td><td><select id="pipe-${i}-size" aria-label="Side ${i + 1} pipe size"></select></td><td><input id="pipe-${i}-skew" aria-label="Side ${i + 1} skew in degrees" type="number" step="any"></td><td><output id="pipe-${i}-thickness" aria-label="Side ${i + 1} pipe wall thickness in inches"></output></td></tr>`).join('');
  }
  function loadPipe(pipe, i) {
    const enabled = i === 0 || pipe.span !== 0;
    $(`pipe-${i}-enabled`).checked = enabled;
    const picker = $(`pipe-${i}-size`);
    picker.replaceChildren(...JB1.pipeSizes.map(size => new Option(size.label, size.id)));
    const size = JB1.pipeSizes.find(size => size.span === pipe.span && size.rise === pipe.rise && size.thickness === pipe.thickness);
    if (enabled && !size) picker.add(new Option(`Imported: ${pipe.span}\u2033 \u00d7 ${pipe.rise}\u2033`, 'imported'));
    picker.value = enabled ? (size?.id || 'imported') : '';
    picker.disabled = !enabled;
    $(`pipe-${i}-skew`).value = enabled ? pipe.skew : '';
    $(`pipe-${i}-skew`).disabled = !enabled;
    $(`pipe-${i}-thickness`).textContent = enabled ? `${pipe.thickness}\u2033` : '\u2014';
  }
  function loadForm() {
    const box = project.boxes[selected];
    $('project-number').value = project.projectNumber;
    $('county').value = project.county;
    $('report-date').value = project.date;
    $('box-number').value = box.number;
    $('station').value = box.station;
    $('road-side').value = box.side;
    $('height').value = box.height ?? '';
    $('box-type').value = box.type;
    box.pipes.forEach(loadPipe);
    render();
  }
  function readNumber(input, allowEmpty = false) {
    if (input.validity.badInput || (input.value === '' && !allowEmpty)) return null;
    return input.value === '' ? null : Number(input.value);
  }
  function readForm() {
    const previous = project.boxes[selected];
    const box = { type: $('box-type').value, number: $('box-number').value, station: $('station').value, side: $('road-side').value, height: readNumber($('height'), true), pipes: [] };
    for (let i = 0; i < 4; i++) {
      const enabled = $(`pipe-${i}-enabled`).checked;
      const size = JB1.pipeSizes.find(size => size.id === $(`pipe-${i}-size`).value) || previous.pipes[i];
      box.pipes.push(enabled ? {span: size.span, rise: size.rise, thickness: size.thickness, skew: readNumber($(`pipe-${i}-skew`))} : emptyPipe());
      $(`pipe-${i}-thickness`).textContent = enabled ? `${size.thickness}\u2033` : '\u2014';
    }
    // A bad numeric height is distinct from the deliberately blank automatic-height field.
    if ($('height').validity.badInput) box.height = NaN;
    project.boxes[selected] = box;
    project.projectNumber = $('project-number').value;
    project.county = $('county').value;
    project.date = $('report-date').value;
    dirty = true;
    $('file-status').textContent = 'Unsaved changes · save a project file to keep them';
    return previous;
  }
  function boxLabel(box, i) { return `${box.type} · Box ${box.number || i + 1}${box.station ? ` · ${box.station}` : ''}`; }
  function render() {
    const box = project.boxes[selected];
    const picker = $('box-select');
    picker.replaceChildren(...project.boxes.map((b, i) => new Option(boxLabel(b, i), i, false, i === selected)));
    $('remove-box').disabled = project.boxes.length === 1;
    $('add-box').disabled = project.boxes.length === 50;
    $('results-heading').textContent = `${box.type} · Box ${box.number || selected + 1}`;
    $('basis-note').textContent = box.type === 'JB-2' ? 'JB-2 traffic-load junction box · MDOT sheet 6506, August 1, 2017. Quantity calculation with the documented solid-wall bar-count convention.' : 'JB-1 calculation basis: supplied v5.0 executable, October 10, 2011. Preserves the recovered legacy calculations.';
    $('result-context').textContent = [box.station ? `Station ${box.station}` : 'Station not entered', box.side === 'L' ? 'Left' : 'Right'].join(' · ');
    results = project.boxes.map(b => {
      try { return { value: JB1.calculateBox(b) }; }
      catch (error) { return { error: error.message }; }
    });
    const current = results[selected];
    $('calculation-error').hidden = !current.error;
    $('current-results').hidden = !!current.error;
    $('calculation-error').textContent = current.error ? `${current.error} Correct the inputs to calculate this box.` : '';
    for (const input of $('box-form').querySelectorAll('input[type="number"]')) input.removeAttribute('aria-invalid');
    if (current.error) {
      for (const input of $('box-form').querySelectorAll('input[type="number"]:not(:disabled)')) {
        if (input.validity.badInput || (input.id !== 'height' && input.value === '')) input.setAttribute('aria-invalid', 'true');
      }
      $('height-help').textContent = 'Leave blank to use the calculated minimum.';
    } else {
      const r = current.value;
      $('height-help').textContent = `Calculated minimum: ${f(r.minimumHeightFeet)} ft. Leave blank to use it.`;
      $('height-mode').textContent = box.height === null ? 'Calculated minimum height' : 'Entered height';
      const quantities = [ ['W1–3', `${f(r.widthsFeet[0])} ft`], ['W2–4', `${f(r.widthsFeet[1])} ft`], ['Height', `${f(r.heightFeet)} ft`], ['Concrete, net', `${f(r.concreteCubicYards)} yd³`], ['Reinforcing steel', `${f(r.steelPounds, 2)} lb`], ['Opening deductions', `${f(r.openingDeductionCubicYards)} yd³`] ];
      $('quantity-list').innerHTML = quantities.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
      $('bar-rows').innerHTML = r.bars.map(bar => `<tr><td>${bar.mark}</td><td>#${bar.size || 4}</td><td>${bar.count}</td><td>${f(bar.lengthInches, 2)}</td><td>${f(bar.count * bar.lengthInches / 12, 2)}</td></tr>`).join('');
      const notes = [`Gross concrete ${f(r.grossConcreteCubicYards)} yd³, less ${f(r.openingDeductionCubicYards)} yd³ of pipe openings. ${box.type === 'JB-2' ? `All walls: ${r.wallThicknessInches} in. Steel includes 3.3 lb for the two lift bars.` : 'Steel includes the legacy 4 lb allowance.'}`, ...(r.warnings || [])];
      $('calculation-notes').innerHTML = notes.map(note => `<p>${escapeHTML(note)}</p>`).join('');
      drawDiagram(box, r);
    }
    const invalid = results.flatMap((r, i) => r.error ? [boxLabel(project.boxes[i], i)] : []);
    $('print-project').disabled = invalid.length > 0;
    $('save-project').disabled = invalid.length > 0;
    $('box-count').textContent = `${project.boxes.length} ${project.boxes.length === 1 ? 'box' : 'boxes'}`;
    $('project-totals').textContent = '';
    if (invalid.length) $('project-totals').textContent = `Totals unavailable: correct ${invalid.join(', ')}.`;
    else {
      const totals = JB1.totalQuantities(results.map(r => r.value));
      $('project-totals').innerHTML = `<span>Net concrete <strong>${f(totals.concreteCubicYards)} yd³</strong></span><span>Reinforcing steel <strong>${f(totals.steelPounds, 2)} lb</strong></span>`;
    }
  }

  function drawDiagram(box, r) {
    const svg = $('box-diagram');
    const w = r.widthsFeet[0] * 12;
    const h = r.widthsFeet[1] * 12;
    const scale = Math.min(290 / w, 190 / h);
    const dw = w * scale, dh = h * scale;
    const x = 360 - dw / 2, y = 190 - dh / 2;
    const wall = (r.wallThicknessInches || 6) * scale;
    let shapes = `<title id="diagram-title">Junction box plan</title><desc id="diagram-description">Box ${escapeHTML(box.number)}. W1–3 ${f(r.widthsFeet[0])} feet; W2–4 ${f(r.widthsFeet[1])} feet. Side 1 is outflow. Openings are shown centered for illustration. Positive skew turns clockwise from each wall's outward direction. ${box.pipes.map((pipe, i) => pipe.span ? `Side ${i + 1}: ${pipe.skew} degrees skew.` : `Side ${i + 1}: no pipe.`).join(' ')}</desc><rect class="box-wall" x="${x}" y="${y}" width="${dw}" height="${dh}"/><rect class="box-interior" x="${x + wall}" y="${y + wall}" width="${Math.max(0, dw - 2 * wall)}" height="${Math.max(0, dh - 2 * wall)}"/>`;
    box.pipes.forEach((pipe, i) => {
      const horizontal = i === 1 || i === 3;
      const connectionWidth = horizontal ? dh : dw;
      const radians = pipe.skew * Math.PI / 180;
      const cosine = Math.cos(radians), sine = Math.sin(radians);
      const size = pipe.span ? Math.min((pipe.span + 2 * pipe.thickness) / cosine * scale, connectionWidth - 2 * wall) : 0;
      const cx = i === 1 ? x : i === 3 ? x + dw : 360;
      const cy = i === 0 ? y + dh : i === 2 ? y : 190;
      if (pipe.span) {
        const half = size * cosine / 2;
        const inside = wall / cosine, cut = half * Math.tan(radians);
        const length = 45 + size * Math.abs(sine) / 2;
        // Cut the inner end along the wall; rotate the actual pipe width, not its projected opening.
        shapes += `<g class="pipe-connection" data-side="${i + 1}" transform="translate(${cx} ${cy}) rotate(${i * 90 + pipe.skew})"><polygon class="pipe" points="${-half},${-inside + cut} ${half},${-inside - cut} ${half},${length} ${-half},${length}"/><path class="pipe-axis" d="M0,${-inside}V${length + 3}"/>${i === 0 ? `<path class="flow-line" d="M0,${length + 33}v20 m-5,-6 l5,6 5,-6"/>` : ''}</g>`;
        if (i === 0) shapes += `<text class="flow-label" x="${cx - (length + 53) * sine + (sine < 0 ? -18 : 18)}" y="${cy + (length + 53) * cosine - 2}" text-anchor="${sine < 0 ? 'end' : 'start'}">OUTFLOW</text>`;
      }
      const labelX = i === 1 ? cx - 65 : i === 3 ? cx + 24 : i === 2 ? cx + size / 2 + 14 : 360;
      const labelY = i === 0 ? cy + 65 : i === 2 ? cy - 22 : i === 3 ? cy - size / 2 - 14 : 194;
      shapes += `<text class="diagram-side" x="${labelX}" y="${labelY}" text-anchor="${i === 2 || i === 3 ? 'start' : 'middle'}">${i + 1}</text>`;
    });
    svg.innerHTML = shapes;
    const pipes = svg.getBBox();
    const dimY = Math.min(y - 42, pipes.y - 22), dimX = Math.max(x + dw + 80, pipes.x + pipes.width + 30);
    svg.insertAdjacentHTML('beforeend', `<path class="dim-line" d="M${x},${y - 20}V${dimY - 8} M${x + dw},${y - 20}V${dimY - 8} M${x},${dimY}h${dw} M${x - 4},${dimY - 4}l8,8 M${x + dw - 4},${dimY - 4}l8,8"/><text class="diagram-dim" x="360" y="${dimY - 21}" text-anchor="middle">W1–3 · ${f(r.widthsFeet[0])} ft</text><path class="dim-line" d="M${x + dw + 20},${y}H${dimX + 9} M${x + dw + 20},${y + dh}H${dimX + 9} M${dimX},${y}v${dh} M${dimX - 4},${y - 4}l8,8 M${dimX - 4},${y + dh - 4}l8,8"/><text class="diagram-dim" transform="translate(${dimX + 25},190) rotate(90)" text-anchor="middle">W2–4 · ${f(r.widthsFeet[1])} ft</text>`);
    const bounds = svg.getBBox();
    const left = Math.min(100, bounds.x - 16), top = Math.min(0, bounds.y - 16);
    svg.setAttribute('viewBox', `${left} ${top} ${Math.max(640, bounds.x + bounds.width + 16) - left} ${Math.max(390, bounds.y + bounds.height + 16) - top}`);
  }

  function reportHTML() {
    if (results.some(r => r.error)) return '<h1>Report unavailable</h1><p>Correct all box inputs before printing quantities.</p>';
    const totals = JB1.totalQuantities(results.map(r => r.value));
    const heading = `<h1>JB · Junction box quantities</h1><p>Project: ${escapeHTML(project.projectNumber || 'Not entered')} · County: ${escapeHTML(project.county || 'Not entered')} · Date: ${escapeHTML(project.date || 'Not entered')}</p><p class="report-note">JB-1: recovered v5.0 calculations, October 10, 2011. JB-2: MDOT sheet 6506, August 1, 2017, with the documented solid-wall bar-count convention. Dimensions in decimal feet unless labeled.</p>`;
    const boxes = project.boxes.map((box, i) => {
      const r = results[i].value;
      return `<section class="report-box"><h2>${escapeHTML(boxLabel(box, i))} · ${box.side === 'L' ? 'Left' : 'Right'}</h2><table><thead><tr><th>W1–3 (ft)</th><th>W2–4 (ft)</th><th>H (ft)</th><th>Net concrete (yd³)</th><th>Steel (lb)</th></tr></thead><tbody><tr><td>${f(r.widthsFeet[0])}</td><td>${f(r.widthsFeet[1])}</td><td>${f(r.heightFeet)}</td><td>${f(r.concreteCubicYards)}</td><td>${f(r.steelPounds, 2)}</td></tr></tbody></table><p class="report-note">${box.height === null ? 'Calculated minimum' : 'Entered'} height; minimum ${f(r.minimumHeightFeet)} ft. Gross concrete ${f(r.grossConcreteCubicYards)} yd³ less opening deductions ${f(r.openingDeductionCubicYards)} yd³. ${box.type === 'JB-2' ? `All walls ${r.wallThicknessInches} in.; steel includes 3.3 lb for two lift bars.` : 'Steel includes the legacy 4 lb allowance.'}</p><table class="report-pipes"><thead><tr><th>Pipe side</th><th>Span (in.)</th><th>Rise (in.)</th><th>Skew (°)</th><th>Pipe wall (in.)</th></tr></thead><tbody>${box.pipes.map((p, n) => `<tr><td>${n + 1}${n === 0 ? ' · outflow' : ''}</td><td>${p.span ? f(p.span, 2) : 'None'}</td><td>${f(p.rise, 2)}</td><td>${f(p.skew, 2)}</td><td>${f(p.thickness, 2)}</td></tr>`).join('')}</tbody></table><table class="report-pipes"><thead><tr><th>Bar mark</th>${r.bars.map(b => `<th>${b.mark}</th>`).join('')}</tr></thead><tbody><tr><th>Size</th>${r.bars.map(b => `<td>#${b.size || 4}</td>`).join('')}</tr><tr><th>Number</th>${r.bars.map(b => `<td>${b.count}</td>`).join('')}</tr><tr><th>Length (in.)</th>${r.bars.map(b => `<td>${f(b.lengthInches, 2)}</td>`).join('')}</tr></tbody></table>${(r.warnings || []).map(note => `<p class="report-note">${escapeHTML(note)}</p>`).join('')}</section>`;
    }).join('');
    return heading + boxes + `<h2>Project totals · ${project.boxes.length} ${project.boxes.length === 1 ? 'box' : 'boxes'}</h2><p>Net concrete: <strong>${f(totals.concreteCubicYards)} yd³</strong> · Reinforcing steel: <strong>${f(totals.steelPounds, 2)} lb</strong></p>`;
  }
  function validateProject(data) {
    const text = (value, max) => typeof value === 'string' && value.length <= max;
    if (!data || !['jb1-project-v1', 'jb-project-v1'].includes(data.schema) || !text(data.projectNumber, 120) || !text(data.county, 120) || !text(data.date, 10) || !Array.isArray(data.boxes) || data.boxes.length < 1 || data.boxes.length > 50) throw new Error('Choose a JB project file containing between 1 and 50 boxes.');
    const boxes = data.boxes.map((box, i) => {
      if (!box || !text(box.number, 80) || !text(box.station, 80) || !['L', 'R'].includes(box.side)) throw new Error(`Box ${i + 1} has invalid identification fields.`);
      const type = data.schema === 'jb1-project-v1' ? 'JB-1' : box.type;
      if (!['JB-1', 'JB-2'].includes(type)) throw new Error(`Box ${i + 1}: choose JB-1 or JB-2.`);
      JB1.calculateBox({...box, type});
      return { type, number: box.number, station: box.station, side: box.side, height: box.height ?? null, pipes: box.pipes.map(p => ({ span: p.span, rise: p.rise, skew: p.skew, thickness: p.thickness })) };
    });
    if (data.date !== '' && (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(Date.parse(data.date)) || new Date(data.date).toISOString().slice(0, 10) !== data.date)) throw new Error('The project report date is invalid.');
    return { schema: 'jb-project-v1', projectNumber: data.projectNumber, county: data.county, date: data.date, boxes };
  }

  makePipeRows();
  for (let i = 0; i < 4; i++) {
    $(`pipe-${i}-enabled`).addEventListener('change', () => {
      const enabled = $(`pipe-${i}-enabled`).checked;
      loadPipe(enabled ? newPipe() : emptyPipe(), i);
      readForm(); render();
    });
  }
  $('box-form').addEventListener('submit', event => event.preventDefault());
  for (const input of [...$('box-form').querySelectorAll('input[type="number"],input[type="text"],select'), $('project-number'), $('county'), $('report-date')]) input.addEventListener('input', () => { readForm(); render(); });
  $('box-select').addEventListener('change', () => { selected = Number($('box-select').value); loadForm(); });
  $('add-box').addEventListener('click', () => { if (project.boxes.length >= 50) return; project.boxes.push(newBox(project.boxes.length + 1, project.boxes[selected].type)); selected = project.boxes.length - 1; dirty = true; $('file-status').textContent = 'Unsaved changes'; loadForm(); $('box-number').focus(); });
  $('remove-box').addEventListener('click', () => {
    if (project.boxes.length <= 1 || !confirm(`Remove ${boxLabel(project.boxes[selected], selected)} from this project?`)) return;
    project.boxes.splice(selected, 1); selected = Math.min(selected, project.boxes.length - 1); dirty = true; $('file-status').textContent = 'Unsaved changes'; loadForm();
  });
  $('save-project').addEventListener('click', () => {
    try {
      validateProject(project);
      const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2) + '\n'], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'JB-project.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      dirty = false; $('file-status').textContent = 'Project download requested · keep the JSON file';
    } catch (error) { alert(error.message); }
  });
  $('open-project').addEventListener('click', () => { $('project-file').value = ''; $('project-file').click(); });
  $('project-file').addEventListener('change', async () => {
    const file = $('project-file').files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('This file is too large. Choose a JB project JSON file smaller than 1 MB.');
      const restored = validateProject(JSON.parse(await file.text()));
      if (dirty && !confirm('Replace the unsaved inputs with this project? Save a project file first if you need to keep them.')) return;
      project = restored; selected = 0; dirty = false; loadForm(); $('file-status').textContent = `Opened ${file.name}`;
    } catch (error) { alert(`Could not open the project: ${error.message}`); }
  });
  window.addEventListener('beforeprint', () => { $('print-report').innerHTML = reportHTML(); });
  $('print-project').addEventListener('click', () => { $('print-report').innerHTML = reportHTML(); window.print(); });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  loadForm();
})();
