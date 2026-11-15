/* global StrExc, StrExcExcel */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const today = new Date();
  let project = {app:'StrExc', version:1, name:'', county:'', date:`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`, pipes:[]};
  let dirty = false;
  const format = (n, digits = 3) => n.toLocaleString('en-US', {minimumFractionDigits:digits, maximumFractionDigits:digits});
  function changed() { dirty = true; $('save-state').textContent = 'Unsaved changes. Save project to keep your inputs.'; }
  function status(message, error = false) { $('file-status').textContent = message; $('file-status').classList.toggle('error', error); }
  function download(data, name, type) {
    const link = document.createElement('a'), url = URL.createObjectURL(new Blob([data], {type}));
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  const filename = () => (project.name || 'structure-excavation').replace(/[^a-z0-9_-]+/gi,'-').slice(0,80);
  function control(tag, key, value, index) {
    const el = document.createElement(tag);
    el.dataset.key = key; el.setAttribute('aria-label', `${{id:'Pipe ID',station:'Station',size:'Pipe size',length:'Length (ft)',depth:'Average depth (ft)',fes:'FES count'}[key]}, row ${index+1}`);
    if (tag === 'input') {
      el.type = ['length','depth'].includes(key) ? 'number' : 'text';
      if (el.type === 'number') { el.min = '0'; el.step = 'any'; el.required = true; el.placeholder = 'Enter'; }
      else el.maxLength = 80;
      if (key === 'id') el.required = true;
    } else {
      const options = key === 'size' ? StrExc.sizes.map(spec => [spec.size, `${spec.size.replace('x',' x ')} ${spec.type.toLowerCase()}`]) : [0,1,2].map(n => [n,n]);
      for (const [value, label] of options) { const option = document.createElement('option'); option.value = value; option.textContent = label; el.append(option); }
    }
    el.value = value;
    return el;
  }
  function render() {
    $('project-name').value = project.name; $('county').value = project.county; $('date').value = project.date;
    $('pipes').replaceChildren();
    project.pipes.forEach((pipe,index) => {
      const tr = document.createElement('tr'); tr.dataset.index = index;
      for (const key of ['id','station','size','type','length','depth','fes','result','remove']) {
        const td = document.createElement('td');
        if (key === 'type') { td.className = 'type'; td.dataset.output = 'type'; }
        else if (key === 'result') { td.className = 'numeric'; td.dataset.output = 'result'; }
        else if (key === 'remove') {
          const button = document.createElement('button'); button.className = 'remove'; button.textContent = 'Remove'; button.setAttribute('aria-label', `Remove pipe ${pipe.id}`);
          button.addEventListener('click', () => {
            if (!confirm(`Remove pipe ${project.pipes[index].id}?`)) return;
            project.pipes.splice(index,1); changed(); render(); $('add-pipe').focus();
          }); td.append(button);
        } else td.append(control(['size','fes'].includes(key) ? 'select' : 'input',key,pipe[key],index));
        tr.append(td);
      }
      $('pipes').append(tr);
    });
    update();
  }
  function update() {
    let invalid = 0;
    const results = [];
    [...$('pipes').children].forEach((tr,index) => {
      const pipe = project.pipes[index], output = tr.querySelector('[data-output=result]');
      tr.querySelector('.remove').setAttribute('aria-label', `Remove pipe ${pipe.id}`);
      tr.querySelector('[data-output=type]').textContent = StrExc.sizes.find(s => s.size === pipe.size).type;
      for (const input of tr.querySelectorAll('input')) {
        const bad = input.dataset.key === 'id' ? !input.value.trim() : input.type === 'number' ? !(Number(input.value) > 0) || !input.validity.valid : false;
        input.setAttribute('aria-invalid', String(bad));
      }
      try {
        if (!pipe.id.trim()) throw new Error('Enter a pipe ID.');
        const result = StrExc.calculate(pipe); results.push(result); output.textContent = format(result.total);
      } catch (error) {
        invalid++; output.textContent = 'Pending'; const message = document.createElement('span'); message.className = 'row-error'; message.textContent = error.message; output.append(message);
      }
    });
    $('pipe-count').textContent = `${project.pipes.length} ${project.pipes.length === 1 ? 'pipe' : 'pipes'}`;
    $('empty-state').hidden = project.pipes.length > 0;
    $('add-pipe').disabled = project.pipes.length >= StrExc.MAX_PIPES;
    let total = null;
    if (!invalid && results.length) {
      try { total = StrExc.totals(results); } catch (error) { invalid++; $('validation').textContent = error.message; }
    }
    $('total-cy').textContent = total ? format(total.total,2) : 'Pending';
    $('total-length').textContent = total ? `${format(total.length,2)} ft of pipe` : '';
    $('export-excel').disabled = !total;
    if (invalid && !total) $('validation').textContent = `${invalid} ${invalid === 1 ? 'row needs' : 'rows need'} attention. Complete all rows before exporting.`;
    else $('validation').textContent = '';
  }
  function addPipe(markDirty = true) {
    if (project.pipes.length >= StrExc.MAX_PIPES) return;
    let n = project.pipes.length+1;
    while (project.pipes.some(pipe => pipe.id === `P-${n}`)) n++;
    project.pipes.push({id:`P-${n}`, station:'', size:'18', length:'', depth:'', fes:0});
    if (markDirty) changed(); render();
    if (markDirty) $('pipes').lastElementChild.querySelector('input').focus();
  }
  $('pipes').addEventListener('input', event => {
    const key = event.target.dataset.key; if (!key) return;
    const pipe = project.pipes[Number(event.target.closest('tr').dataset.index)];
    pipe[key] = event.target.value; changed(); update();
  });
  for (const [id,key] of [['project-name','name'],['county','county'],['date','date']]) $(id).addEventListener('input', () => { project[key] = $(id).value; changed(); });
  $('add-pipe').addEventListener('click', () => addPipe());
  $('save-project').addEventListener('click', () => {
    try {
      const saved = StrExc.project(project);
      download(JSON.stringify(saved,null,2), `${filename()}.strexc.json`, 'application/json');
      dirty = false; $('save-state').textContent = 'Project file downloaded. Save again after edits.'; status('Keep the JSON file. Use Open project to reopen it.');
    } catch (error) { status(error.message, true); }
  });
  $('open-project').addEventListener('click', () => $('open-file').click());
  $('open-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Project file is too large (maximum 2 MB).');
      const next = StrExc.project(JSON.parse(await file.text()));
      if (dirty && !confirm('Replace unsaved changes with this project? Save first if you want to keep them.')) return;
      project = next; dirty = false; render(); $('save-state').textContent = 'Project opened. Save again after edits.'; status(`Opened ${file.name}.`);
    } catch (error) { status(`Could not open project: ${error.message}`,true); }
    finally { event.target.value = ''; }
  });
  $('export-excel').addEventListener('click', () => {
    try { const valid = StrExc.project(project); download(StrExcExcel.createWorkbook(valid), `${filename()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); status('Excel schedule downloaded. Keep your JSON project for reopening app inputs.'); }
    catch (error) { status(error.message,true); }
  });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  addPipe(false);
})();
