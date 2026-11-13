'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const f = (value, digits = 3) => value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const html = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const weight = value => value === null || value === undefined ? '—' : `${f(value)} lb`;
  const minText = value => String(Number(value.toFixed(4)));
  const newInlet = number => ({ id: String(number), station: '', type: 'SS-3', pipeId: 1, height: minText(SS3.pipes('SS-3')[0].minHeight) });
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let project = { schema: 'ss3-project-v1', projectNumber: '', county: '', preparedBy: '', date, inlets: [newInlet(1)] };
  let selected = 0;
  let dirty = false;
  let results = [];

  function inletLabel(inlet, index) { return `Inlet ${inlet.id || index + 1}${inlet.station ? ` · ${inlet.station}` : ''}`; }
  function fillPipes() {
    const inlet = project.inlets[selected];
    $('pipe-size').replaceChildren(...SS3.pipes(inlet.type).map(pipe => new Option(pipe.label, pipe.id, false, pipe.id === inlet.pipeId)));
  }
  function loadForm() {
    const inlet = project.inlets[selected];
    $('project-number').value = project.projectNumber;
    $('county').value = project.county;
    $('prepared-by').value = project.preparedBy;
    $('report-date').value = project.date;
    $('inlet-id').value = inlet.id;
    $('station').value = inlet.station;
    $('inlet-type').value = inlet.type;
    fillPipes();
    $('height').value = inlet.height;
    render();
  }
  function markDirty() {
    dirty = true;
    $('file-status').textContent = 'Unsaved changes · save project to keep your work';
  }
  function readForm() {
    Object.assign(project, { projectNumber: $('project-number').value, county: $('county').value, preparedBy: $('prepared-by').value, date: $('report-date').value });
    Object.assign(project.inlets[selected], { id: $('inlet-id').value, station: $('station').value, type: $('inlet-type').value, pipeId: Number($('pipe-size').value), height: $('height').value });
    markDirty();
  }
  function calculateAll() {
    return project.inlets.map(inlet => {
      try { return { value: SS3.calculate(inlet) }; }
      catch (error) { return { error: error.message }; }
    });
  }
  function breakdown(result) {
    return `<tr><td>At listed minimum (${html(minText(result.minHeight))} ft)</td><td>${f(result.baseConcrete)}</td><td>${f(result.baseSteel)}</td></tr><tr><td>Additional height (${f(result.extraHeight, 4)} ft)</td><td>${f(result.extraConcrete)}</td><td>${f(result.extraSteel)}</td></tr><tr><td>Inlet quantity</td><td>${f(result.concrete)}</td><td>${f(result.steel)}</td></tr>`;
  }
  function tableRow(inlet, result, index, interactive = false) {
    const label = `<strong>${html(inlet.id || index + 1)}</strong><span>${html(inlet.station || 'Station not entered')}</span>`;
    return `<tr><td>${interactive ? `<button data-inlet="${index}" aria-label="Edit inlet ${html(inlet.id || index + 1)}">${label}</button>` : label}</td><td>${html(inlet.type)}</td><td>${html(result?.pipeLabel || SS3.pipes(inlet.type).find(p => p.id === inlet.pipeId)?.label || 'Invalid pipe')}</td><td>${result ? html(inlet.height) : 'Check input'}</td><td>${result ? f(result.concrete) : '—'}</td><td>${result ? f(result.steel) : '—'}</td><td>${!result || result.type === 'SS-4' ? '—' : f(result.grate)}</td><td>${!result || result.type === 'SS-4' ? '—' : f(result.frame)}</td></tr>`;
  }
  function totalRow(total) {
    return `<tr class="report-total"><td colspan="4">Project total · ${project.inlets.length} inlet${project.inlets.length === 1 ? '' : 's'}</td><td>${f(total.concrete)}</td><td>${f(total.steel)}</td><td>${f(total.grate)}</td><td>${f(total.frame)}</td></tr>`;
  }
  function calculationNote(result) {
    return result.type === 'SS-3' ? 'Additional height uses 0.184 yd³/ft of concrete and 17 lb/ft of reinforcement. Grate and frame weights are fixed at 200 lb and 244 lb per SS-3 inlet.' : 'Additional height increases concrete by 0.185 yd³/ft only. Reinforcement stays at 31 lb in the original SS-4 calculation. Grate and frame weights are not reported for SS-4.';
  }
  function buildReport(total, valid) {
    if (!valid) {
      $('report').innerHTML = '<h1>Report unavailable</h1><p>Correct all inlet inputs before printing this project.</p>';
      return;
    }
    const metadata = [['Project', project.projectNumber], ['County', project.county], ['Prepared by', project.preparedBy], ['Report date', project.date]];
    $('report').innerHTML = `<p class="report-kicker">ROADWAY DESIGN UTILITIES · SS-3 / SS-4</p><h1>Storm sewer inlet quantities</h1><div class="report-meta">${metadata.map(([key, value]) => `<div><strong>${key}:</strong> ${html(value || 'Not entered')}</div>`).join('')}</div><h2>Project quantity schedule</h2><table><thead><tr><th>Inlet / station</th><th>Type</th><th>Pipe</th><th>Height (ft)</th><th>Concrete (yd³)</th><th>Steel (lb)</th><th>Grate (lb)</th><th>Frame (lb)</th></tr></thead><tbody>${project.inlets.map((inlet, i) => tableRow(inlet, results[i].value, i)).join('')}</tbody><tfoot>${totalRow(total)}</tfoot></table><p class="report-footnote">One pipe-opening deduction per inlet is included. SS-4 grate and frame weights are not reported; project grate/frame totals include SS-3 inlets only. Totals use unrounded inlet quantities; displayed values are rounded to three decimals.</p><h2>Inlet calculation details</h2>${project.inlets.map((inlet, i) => {
      const result = results[i].value;
      return `<section class="report-inlet"><h2>Inlet ${html(inlet.id || i + 1)} · ${html(result.type)}</h2><div class="report-details"><div><strong>Station:</strong> ${html(inlet.station || 'Not entered')}</div><div><strong>Pipe:</strong> ${html(result.pipeLabel)}</div><div><strong>Entered height:</strong> ${html(inlet.height)} ft</div><div><strong>Listed minimum:</strong> ${html(minText(result.minHeight))} ft</div><div><strong>Grate:</strong> ${result.type === 'SS-4' ? '—' : weight(result.grate)}</div><div><strong>Frame:</strong> ${result.type === 'SS-4' ? '—' : weight(result.frame)}</div></div><table><thead><tr><th>Component</th><th>Concrete (yd³)</th><th>Reinforcing steel (lb)</th></tr></thead><tbody>${breakdown(result)}</tbody></table><p>${calculationNote(result)}</p></section>`;
    }).join('')}<div class="report-notes"><strong>Calculation basis and limits</strong><p>Reconstructed from the MDOT SS-3.exe, version 3.0, October 10, 2011. Heights below the listed minimum are blocked as a modern input safeguard.</p></div>`;
  }
  function render() {
    const inlet = project.inlets[selected];
    results = calculateAll();
    const current = results[selected];
    const valid = results.every(result => result.value);
    $('inlet-select').replaceChildren(...project.inlets.map((item, i) => new Option(inletLabel(item, i), i, false, i === selected)));
    $('remove-inlet').disabled = project.inlets.length === 1;
    $('add-inlet').disabled = project.inlets.length >= 200;
    $('results-heading').textContent = `Inlet ${inlet.id || selected + 1}`;
    $('result-context').textContent = `${inlet.station ? `Station ${inlet.station}` : 'Station not entered'} · ${SS3.pipes(inlet.type).find(pipe => pipe.id === inlet.pipeId)?.label || 'Select a pipe'}`;
    $('type-badge').textContent = inlet.type;
    const minimum = SS3.pipes(inlet.type).find(pipe => pipe.id === inlet.pipeId)?.minHeight;
    $('height-hint').textContent = minimum == null ? 'Select a pipe size.' : `Original listed minimum: ${minText(minimum)} ft. Higher inlets use the original height additions.`;
    $('height').min = minimum == null ? '0' : minText(minimum);
    $('height').setAttribute('aria-invalid', current.error ? 'true' : 'false');
    $('input-error').hidden = !current.error;
    $('input-error').textContent = current.error || '';
    $('result-content').hidden = !current.value;
    $('invalid-result').hidden = !!current.value;
    if (current.value) {
      const result = current.value;
      $('concrete').textContent = f(result.concrete);
      $('steel').textContent = f(result.steel);
      $('grate').textContent = result.type === 'SS-4' ? '—' : weight(result.grate);
      $('frame').textContent = result.type === 'SS-4' ? '—' : weight(result.frame);
      $('breakdown-rows').innerHTML = breakdown(result);
      $('calculation-note').textContent = calculationNote(result);
    }
    $('inlet-count').textContent = `${project.inlets.length} inlet${project.inlets.length === 1 ? '' : 's'}`;
    $('schedule-rows').innerHTML = project.inlets.map((item, i) => tableRow(item, results[i].value, i, true)).join('');
    const total = valid ? SS3.totals(results.map(result => result.value)) : null;
    $('schedule-total').innerHTML = total ? totalRow(total) : '';
    $('project-error').textContent = valid ? 'Totals use unrounded quantities. Grate and frame totals include SS-3 inlets only; a dash means not reported for SS-4.' : results.map((result, i) => result.error ? `${inletLabel(project.inlets[i], i)}: ${result.error}` : '').filter(Boolean).join(' ');
    $('save-project').disabled = !valid;
    $('print-report').disabled = !valid;
    buildReport(total, valid);
  }
  function resetHeight() {
    const inlet = project.inlets[selected];
    const minimum = SS3.pipes(inlet.type).find(pipe => pipe.id === inlet.pipeId).minHeight;
    inlet.height = minText(minimum);
    $('height').value = inlet.height;
  }
  for (const id of ['project-number', 'county', 'prepared-by', 'report-date', 'inlet-id', 'station', 'height']) {
    $(id).addEventListener('input', () => { readForm(); render(); });
  }
  $('inlet-type').addEventListener('change', () => {
    readForm();
    project.inlets[selected].pipeId = 1;
    fillPipes(); resetHeight(); render();
  });
  $('pipe-size').addEventListener('change', () => { readForm(); resetHeight(); render(); });
  $('use-minimum').addEventListener('click', () => { resetHeight(); markDirty(); render(); });
  $('inlet-select').addEventListener('change', () => { selected = Number($('inlet-select').value); loadForm(); });
  $('schedule-rows').addEventListener('click', event => {
    const button = event.target.closest('button[data-inlet]');
    if (!button) return;
    selected = Number(button.dataset.inlet); loadForm(); $('inlet-id').focus();
  });
  $('add-inlet').addEventListener('click', () => {
    if (project.inlets.length >= 200) return;
    const used = new Set(project.inlets.map(inlet => inlet.id));
    let number = 1;
    while (used.has(String(number))) number++;
    project.inlets.push(newInlet(number)); selected = project.inlets.length - 1; markDirty(); loadForm(); $('inlet-id').focus();
  });
  $('remove-inlet').addEventListener('click', () => {
    if (project.inlets.length < 2 || !confirm(`Remove ${inletLabel(project.inlets[selected], selected)} from this project?`)) return;
    project.inlets.splice(selected, 1); selected = Math.min(selected, project.inlets.length - 1); markDirty(); loadForm();
  });
  $('save-project').addEventListener('click', () => {
    if (results.some(result => result.error)) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = `SS-3-${(project.projectNumber || 'project').replace(/[^a-z0-9_-]/gi, '_')}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    dirty = false; $('file-status').textContent = 'Project file downloaded · save again after editing';
  });
  function validateProject(input) {
    if (!input || input.schema !== 'ss3-project-v1' || !Array.isArray(input.inlets) || input.inlets.length < 1 || input.inlets.length > 200) throw Error('Choose an SS-3 project JSON file containing 1–200 inlets.');
    const text = (value, label, max = 160) => {
      if (typeof value !== 'string' || value.length > max) throw Error(`${label} must be text of at most ${max} characters.`);
      return value;
    };
    const reportDate = text(input.date, 'Report date', 10);
    if (reportDate && (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || !Number.isFinite(Date.parse(reportDate)) || new Date(reportDate).toISOString().slice(0, 10) !== reportDate)) throw Error('Report date must be a valid YYYY-MM-DD date.');
    const inlets = input.inlets.map((inlet, i) => {
      if (!inlet || typeof inlet !== 'object' || (inlet.type !== 'SS-3' && inlet.type !== 'SS-4') || !Number.isInteger(inlet.pipeId) || !['number', 'string'].includes(typeof inlet.height)) throw Error(`Inlet ${i + 1} has invalid calculation inputs.`);
      if (String(inlet.height).length > 80) throw Error(`Inlet ${i + 1} height is too long.`);
      const clean = { id: text(inlet.id, `Inlet ${i + 1} ID`, 80), station: text(inlet.station, `Inlet ${i + 1} station`, 80), type: inlet.type, pipeId: inlet.pipeId, height: inlet.height };
      SS3.calculate(clean);
      return clean;
    });
    return { schema: 'ss3-project-v1', projectNumber: text(input.projectNumber, 'Project number'), county: text(input.county, 'County'), preparedBy: text(input.preparedBy, 'Prepared by'), date: reportDate, inlets };
  }
  $('open-project').addEventListener('click', () => $('open-file').click());
  $('open-file').addEventListener('change', async () => {
    const file = $('open-file').files[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw Error('Project file is too large (maximum 1 MB).');
      const loaded = validateProject(JSON.parse(await file.text()));
      if (dirty && !confirm('Replace the unsaved project with this file? Save your current project first if you need to keep it.')) return;
      project = loaded; selected = 0; dirty = false; loadForm();
      $('file-status').textContent = `Opened ${file.name} · inputs restored`;
    } catch (error) { alert(`Could not open project. ${error.message}`); }
    finally { $('open-file').value = ''; }
  });
  $('print-report').addEventListener('click', () => { if (results.every(result => result.value)) window.print(); });
  window.addEventListener('beforeprint', () => render());
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  loadForm();
})();
