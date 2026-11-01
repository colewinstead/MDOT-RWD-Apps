'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const f = (number, digits = 3) => number.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const emptyPipe = () => ({ span: 0, rise: 0, skew: 0, thickness: 0 });
  const newPipe = () => ({ span: 24, rise: 24, skew: 0, thickness: 3 });
  const newBox = number => ({ number: String(number), station: '', side: 'L', height: null, pipes: [newPipe(), emptyPipe(), newPipe(), emptyPipe()] });
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let project = { schema: 'jb1-project-v1', projectNumber: '', county: '', date, boxes: [newBox(1)] };
  let selected = 0;
  let dirty = false;
  let results = [];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function makePipeRows() {
    $('pipe-rows').innerHTML = [0, 1, 2, 3].map(i => `<tr data-side="${i}"><td><label><input type="checkbox" id="pipe-${i}-enabled" aria-label="Pipe on side ${i + 1}${i === 0 ? ', required outflow' : ''}" ${i === 0 ? 'disabled' : ''}><span>${i + 1}</span></label></td>${['span', 'rise', 'skew', 'thickness'].map(key => `<td><input id="pipe-${i}-${key}" aria-label="Side ${i + 1} ${key}${key === 'skew' ? ' in degrees' : ' in inches'}" type="number" step="any"${key !== 'skew' ? ' min="0"' : ''}></td>`).join('')}</tr>`).join('');
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
    box.pipes.forEach((pipe, i) => {
      const enabled = i === 0 || pipe.span !== 0;
      $(`pipe-${i}-enabled`).checked = enabled;
      for (const key of ['span', 'rise', 'skew', 'thickness']) {
        const input = $(`pipe-${i}-${key}`);
        input.value = enabled ? (pipe[key] ?? '') : '';
        input.disabled = !enabled;
      }
    });
    render();
  }
  function readNumber(input, allowEmpty = false) {
    if (input.validity.badInput || (input.value === '' && !allowEmpty)) return null;
    return input.value === '' ? null : Number(input.value);
  }
  function readForm() {
    const previous = project.boxes[selected];
    const box = { number: $('box-number').value, station: $('station').value, side: $('road-side').value, height: readNumber($('height'), true), pipes: [] };
    for (let i = 0; i < 4; i++) {
      const enabled = $(`pipe-${i}-enabled`).checked;
      box.pipes.push(enabled ? Object.fromEntries(['span', 'rise', 'skew', 'thickness'].map(key => [key, readNumber($(`pipe-${i}-${key}`))])) : emptyPipe());
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
  function boxLabel(box, i) { return `Box ${box.number || i + 1}${box.station ? ` · ${box.station}` : ''}`; }
  function render() {
    const box = project.boxes[selected];
    const picker = $('box-select');
    picker.replaceChildren(...project.boxes.map((b, i) => new Option(boxLabel(b, i), i, false, i === selected)));
    $('remove-box').disabled = project.boxes.length === 1;
    $('add-box').disabled = project.boxes.length === 50;
    $('results-heading').textContent = `Box ${box.number || selected + 1}`;
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
      $('bar-rows').innerHTML = r.bars.map(bar => `<tr><td>${bar.mark}</td><td>${bar.count}</td><td>${f(bar.lengthInches, 2)}</td><td>${f(bar.count * bar.lengthInches / 12, 2)}</td></tr>`).join('');
      const notes = [`Gross concrete ${f(r.grossConcreteCubicYards)} yd³, less ${f(r.openingDeductionCubicYards)} yd³ of pipe openings. Steel includes the legacy 4 lb allowance.`, ...(r.warnings || [])];
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
    const wall = 6 * scale;
    let shapes = `<title id="diagram-title">Junction box plan</title><desc id="diagram-description">Box ${escapeHTML(box.number)}. W1–3 ${f(r.widthsFeet[0])} feet; W2–4 ${f(r.widthsFeet[1])} feet. Side 1 is outflow. Openings are shown centered for illustration.</desc><rect class="box-wall" x="${x}" y="${y}" width="${dw}" height="${dh}"/><rect class="box-interior" x="${x + wall}" y="${y + wall}" width="${Math.max(0, dw - 2 * wall)}" height="${Math.max(0, dh - 2 * wall)}"/>`;
    box.pipes.forEach((pipe, i) => {
      const horizontal = i === 1 || i === 3;
      const connectionWidth = horizontal ? dh : dw;
      const size = pipe.span ? Math.min((pipe.span + 2 * pipe.thickness) / Math.cos(pipe.skew * 3.141593 / 180) * scale, connectionWidth - 2 * wall) : 0;
      const cx = i === 1 ? x : i === 3 ? x + dw : 360;
      const cy = i === 0 ? y + dh : i === 2 ? y : 190;
      if (pipe.span) {
        shapes += horizontal ? `<rect class="pipe" x="${i === 1 ? cx - 45 : cx - wall}" y="${cy - size / 2}" width="${45 + wall}" height="${size}"/><path class="pipe-axis" d="M${cx - 48},${cy}h${48 + wall}"/>` : `<rect class="pipe" x="${cx - size / 2}" y="${i === 2 ? cy - 45 : cy - wall}" width="${size}" height="${45 + wall}"/><path class="pipe-axis" d="M${cx},${cy - 48}v${48 + wall}"/>`;
      }
      const labelX = i === 1 ? cx - 65 : i === 3 ? cx + 24 : i === 2 ? cx + size / 2 + 14 : 360;
      const labelY = i === 0 ? cy + 65 : i === 2 ? cy - 22 : i === 3 ? cy - size / 2 - 14 : 194;
      shapes += `<text class="diagram-side" x="${labelX}" y="${labelY}" text-anchor="${i === 2 || i === 3 ? 'start' : 'middle'}">${i + 1}</text>`;
    });
    shapes += `<path class="dim-line" d="M${x},${y - 20}v-30 M${x + dw},${y - 20}v-30 M${x},${y - 42}h${dw} M${x - 4},${y - 46}l8,8 M${x + dw - 4},${y - 46}l8,8"/><text class="diagram-dim" x="360" y="${y - 63}" text-anchor="middle">W1–3 · ${f(r.widthsFeet[0])} ft</text><path class="dim-line" d="M${x + dw + 52},${y}h37 M${x + dw + 52},${y + dh}h37 M${x + dw + 80},${y}v${dh} M${x + dw + 76},${y - 4}l8,8 M${x + dw + 76},${y + dh - 4}l8,8"/><text class="diagram-dim" transform="translate(${x + dw + 105},190) rotate(90)" text-anchor="middle">W2–4 · ${f(r.widthsFeet[1])} ft</text><path class="flow-line" d="M360,${y + dh + 78}v20 m-5,-6 l5,6 5,-6"/><text class="flow-label" x="378" y="${y + dh + 96}">OUTFLOW</text>`;
    svg.innerHTML = shapes;
  }

  function reportHTML() {
    if (results.some(r => r.error)) return '<h1>Report unavailable</h1><p>Correct all box inputs before printing quantities.</p>';
    const totals = JB1.totalQuantities(results.map(r => r.value));
    const heading = `<h1>JB-1 · Junction box quantities</h1><p>Project: ${escapeHTML(project.projectNumber || 'Not entered')} · County: ${escapeHTML(project.county || 'Not entered')} · Date: ${escapeHTML(project.date || 'Not entered')}</p><p class="report-note">Legacy calculation basis: MDOT JB-1 v5.0, revised October 10, 2011. Dimensions in decimal feet unless labeled.</p>`;
    const boxes = project.boxes.map((box, i) => {
      const r = results[i].value;
      return `<section class="report-box"><h2>${escapeHTML(boxLabel(box, i))} · ${box.side === 'L' ? 'Left' : 'Right'}</h2><table><thead><tr><th>W1–3 (ft)</th><th>W2–4 (ft)</th><th>H (ft)</th><th>Net concrete (yd³)</th><th>Steel (lb)</th></tr></thead><tbody><tr><td>${f(r.widthsFeet[0])}</td><td>${f(r.widthsFeet[1])}</td><td>${f(r.heightFeet)}</td><td>${f(r.concreteCubicYards)}</td><td>${f(r.steelPounds, 2)}</td></tr></tbody></table><p class="report-note">${box.height === null ? 'Calculated minimum' : 'Entered'} height; minimum ${f(r.minimumHeightFeet)} ft. Gross concrete ${f(r.grossConcreteCubicYards)} yd³ less opening deductions ${f(r.openingDeductionCubicYards)} yd³. Steel includes legacy 4 lb allowance.</p><table class="report-pipes"><thead><tr><th>Pipe side</th><th>Span (in.)</th><th>Rise (in.)</th><th>Skew (°)</th><th>Wall (in.)</th></tr></thead><tbody>${box.pipes.map((p, n) => `<tr><td>${n + 1}${n === 0 ? ' · outflow' : ''}</td><td>${p.span ? f(p.span, 2) : 'None'}</td><td>${f(p.rise, 2)}</td><td>${f(p.skew, 2)}</td><td>${f(p.thickness, 2)}</td></tr>`).join('')}</tbody></table><table class="report-pipes"><thead><tr><th>Bar mark</th>${r.bars.map(b => `<th>${b.mark}</th>`).join('')}</tr></thead><tbody><tr><th>Number</th>${r.bars.map(b => `<td>${b.count}</td>`).join('')}</tr><tr><th>Length (in.)</th>${r.bars.map(b => `<td>${f(b.lengthInches, 2)}</td>`).join('')}</tr></tbody></table>${(r.warnings || []).map(note => `<p class="report-note">${escapeHTML(note)}</p>`).join('')}</section>`;
    }).join('');
    return heading + boxes + `<h2>Project totals · ${project.boxes.length} ${project.boxes.length === 1 ? 'box' : 'boxes'}</h2><p>Net concrete: <strong>${f(totals.concreteCubicYards)} yd³</strong> · Reinforcing steel: <strong>${f(totals.steelPounds, 2)} lb</strong></p>`;
  }
  function validateProject(data) {
    const text = (value, max) => typeof value === 'string' && value.length <= max;
    if (!data || data.schema !== 'jb1-project-v1' || !text(data.projectNumber, 120) || !text(data.county, 120) || !text(data.date, 10) || !Array.isArray(data.boxes) || data.boxes.length < 1 || data.boxes.length > 50) throw new Error('Choose a JB-1 project file containing between 1 and 50 boxes.');
    const boxes = data.boxes.map((box, i) => {
      if (!box || !text(box.number, 80) || !text(box.station, 80) || !['L', 'R'].includes(box.side)) throw new Error(`Box ${i + 1} has invalid identification fields.`);
      JB1.calculateBox(box);
      return { number: box.number, station: box.station, side: box.side, height: box.height ?? null, pipes: box.pipes.map(p => ({ span: p.span, rise: p.rise, skew: p.skew, thickness: p.thickness })) };
    });
    if (data.date !== '' && (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(Date.parse(data.date)) || new Date(data.date).toISOString().slice(0, 10) !== data.date)) throw new Error('The project report date is invalid.');
    return { schema: 'jb1-project-v1', projectNumber: data.projectNumber, county: data.county, date: data.date, boxes };
  }

  makePipeRows();
  for (let i = 0; i < 4; i++) {
    $(`pipe-${i}-enabled`).addEventListener('change', () => {
      const enabled = $(`pipe-${i}-enabled`).checked;
      for (const [key, value] of Object.entries(enabled ? newPipe() : emptyPipe())) {
        const input = $(`pipe-${i}-${key}`); input.disabled = !enabled; input.value = enabled ? value : '';
      }
      readForm(); render();
    });
    for (const key of ['span', 'rise']) $(`pipe-${i}-${key}`).addEventListener('input', () => {
      const old = project.boxes[selected].pipes[i];
      const span = readNumber($(`pipe-${i}-span`));
      const riseInput = $(`pipe-${i}-rise`);
      if (key === 'span' && old.span === old.rise && span !== null) riseInput.value = span;
      const rise = readNumber(riseInput);
      const thickness = $(`pipe-${i}-thickness`);
      try {
        if (span !== null && rise !== null && (old.thickness === JB1.defaultThickness(old.span, old.rise) || thickness.value === '')) {
          thickness.value = JB1.defaultThickness(span, rise);
        }
      } catch { /* Unsupported sizes are explained by the calculation's input error. */ }
    });
  }
  $('box-form').addEventListener('submit', event => event.preventDefault());
  for (const input of [...$('box-form').querySelectorAll('input[type="number"],input[type="text"],select'), $('project-number'), $('county'), $('report-date')]) input.addEventListener('input', () => { readForm(); render(); });
  $('box-select').addEventListener('change', () => { selected = Number($('box-select').value); loadForm(); });
  $('add-box').addEventListener('click', () => { if (project.boxes.length >= 50) return; project.boxes.push(newBox(project.boxes.length + 1)); selected = project.boxes.length - 1; dirty = true; $('file-status').textContent = 'Unsaved changes'; loadForm(); $('box-number').focus(); });
  $('remove-box').addEventListener('click', () => {
    if (project.boxes.length <= 1 || !confirm(`Remove ${boxLabel(project.boxes[selected], selected)} from this project?`)) return;
    project.boxes.splice(selected, 1); selected = Math.min(selected, project.boxes.length - 1); dirty = true; $('file-status').textContent = 'Unsaved changes'; loadForm();
  });
  $('save-project').addEventListener('click', () => {
    try {
      validateProject(project);
      const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2) + '\n'], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'JB-1-project.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      dirty = false; $('file-status').textContent = 'Project download requested · keep the JSON file';
    } catch (error) { alert(error.message); }
  });
  $('open-project').addEventListener('click', () => { $('project-file').value = ''; $('project-file').click(); });
  $('project-file').addEventListener('change', async () => {
    const file = $('project-file').files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('This file is too large. Choose a JB-1 project JSON file smaller than 1 MB.');
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
