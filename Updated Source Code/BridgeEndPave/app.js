'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const f = value => value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  const html = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const newEnd = id => ({id:String(id),station:'',w1:30,w2:25,skew:10,railHeight:32});
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  let project = {schema:'bridge-end-pave-project-v1',projectNumber:'',county:'',preparedBy:'',date,ends:[newEnd(1)]};
  let selected = 0, dirty = false, results = [];
  const label = (end, index) => `End ${end.id || index+1}${end.station ? ` · ${end.station}` : ''}`;
  const jointNote = 'SDBE-1A shows a 1 in. bridge-end joint. BE-1 uses a different bridge-seat detail; confirm project applicability.';
  const railNote = '32/42 in. rail options follow SDBE-1A and the SDBEPR detail families. Other plan sets use different rails; confirm the project detail.';
  const quantityFields = [['pavement','Bridge end pavement','SY'],['expansionJoint','Expansion joint','LF'],['grooving','Transverse grooving','SY'],['rail32','32 in. rail','LF'],['rail42','42 in. rail','LF']];

  function markDirty() {
    dirty = true;
    $('file-status').textContent = 'Unsaved changes · save project to keep your work';
  }
  function loadForm() {
    const end = project.ends[selected];
    for (const [id,key] of [['project-number','projectNumber'],['county','county'],['prepared-by','preparedBy'],['report-date','date']]) $(id).value = project[key];
    for (const [id,key] of [['end-id','id'],['station','station'],['w1','w1'],['w2','w2'],['skew','skew'],['rail-height','railHeight']]) $(id).value = end[key];
    render();
  }
  function readForm() {
    Object.assign(project,{projectNumber:$('project-number').value,county:$('county').value,preparedBy:$('prepared-by').value,date:$('report-date').value});
    Object.assign(project.ends[selected],{id:$('end-id').value,station:$('station').value,w1:$('w1').value,w2:$('w2').value,skew:$('skew').value,railHeight:Number($('rail-height').value)});
    markDirty(); render();
  }
  function planDiagram(r, id) {
    const left=165, top=85, bottom=290, scale=290/Math.max(r.sideA,r.sideB);
    const endA=left+r.sideA*scale, endB=left+r.sideB*scale;
    const crown=105+165*r.w2/r.widthBase;
    return `<svg ${id==='plan'?'id="plan-diagram" ':''}viewBox="0 0 690 385" role="img" aria-labelledby="${id}-title ${id}-description"><title id="${id}-title">SDBE-1A calculation plan</title><desc id="${id}-description">Roadway is on the left and the bridge on the right. The crown line divides W2 above and W1 below. Gross trapezoid calculation envelope: width W ${f(r.width)} feet, side A ${f(r.sideA)} feet above, side B ${f(r.sideB)} feet below. Skewed bridge interface ${f(r.expansionJoint)} feet at skew ${f(r.skew)} degrees. SDBE-1A shows a one-inch bridge-end joint along this interface. Confirm applicability against the project detail. ${r.clamped?'Side A is held to its ten-foot minimum.':''}Proportions are schematic.</desc><text class="diagram-note" x="45" y="183" text-anchor="middle">ROADWAY</text><text class="diagram-note" x="555" y="65" text-anchor="middle">BRIDGE DECK</text><path class="paving-shape" d="M${left} ${top} H${endA} L${endB} ${bottom} H${left} Z"/><line class="joint-line" x1="${endA}" y1="${top}" x2="${endB}" y2="${bottom}"/><line class="datum-line" x1="100" y1="${crown}" x2="570" y2="${crown}"/><text class="diagram-note" x="260" y="${crown-9}" text-anchor="middle">Crown line</text><text class="diagram-note" x="275" y="${Math.min(bottom-18,crown+37)}" text-anchor="middle">Pavement envelope</text><line class="datum-line" x1="${endA}" y1="70" x2="${endA}" y2="155"/><text class="joint-label" x="${Math.min(endA+18,465)}" y="110">Z ${f(r.skew)}°</text><path class="dim-line" d="M${left} 73 V40 M${endA} 73 V40 M${left} 50 H${endA} M${left-4} 54 L${left+4} 46 M${endA-4} 54 L${endA+4} 46"/><text class="diagram-label" x="${(left+endA)/2}" y="32" text-anchor="middle">A = ${f(r.sideA)} ft</text><path class="dim-line" d="M${left} 303 V337 M${endB} 303 V337 M${left} 325 H${endB} M${left-4} 329 L${left+4} 321 M${endB-4} 329 L${endB+4} 321"/><text class="diagram-label" x="${(left+endB)/2}" y="350" text-anchor="middle">B = ${f(r.sideB)} ft</text><path class="dim-line" d="M145 ${top} H115 V${bottom} H145 M110 ${top+4} L120 ${top-4} M110 ${bottom+4} L120 ${bottom-4}"/><text class="diagram-label" transform="translate(102 185) rotate(-90)" text-anchor="middle">W = ${f(r.width)} ft</text><path class="dim-line" d="M485 105 H515 V270 H485 M485 ${crown} H515 M535 105 H560 V270 H535"/><text class="diagram-label" x="524" y="${(105+crown)/2}" dominant-baseline="middle">W2</text><text class="diagram-note" x="524" y="${(105+crown)/2+19}">${f(r.w2)} ft</text><text class="diagram-label" x="524" y="${(crown+270)/2}" dominant-baseline="middle">W1</text><text class="diagram-note" x="524" y="${(crown+270)/2+19}">${f(r.w1)} ft</text><text class="diagram-label" transform="translate(612 188) rotate(-90)" text-anchor="middle">WB = ${f(r.widthBase)} ft</text><text class="joint-label" x="345" y="378" text-anchor="middle">Skewed bridge interface = ${f(r.expansionJoint)} ft</text></svg>`;
  }
  function widthDiagram(r) {
    const allowance=r.width-r.widthBase;
    return `<svg id="width-diagram" viewBox="0 0 620 185" role="img" aria-labelledby="width-title width-description"><title id="width-title">Width calculation breakdown</title><desc id="width-description">W1 ${f(r.w1)} feet plus W2 ${f(r.w2)} feet makes WB ${f(r.widthBase)} feet. Add ${f(allowance)} feet for the selected rail option to get W ${f(r.width)} feet. Blocks are symbolic and not to scale.</desc><rect class="width-one" x="35" y="30" width="155" height="60" rx="3"/><rect class="width-two" x="225" y="30" width="155" height="60" rx="3"/><rect class="paving-shape" x="415" y="30" width="170" height="60" rx="3"/><text class="diagram-label" x="112" y="55" text-anchor="middle">W1</text><text class="diagram-note" x="112" y="77" text-anchor="middle">${f(r.w1)} ft</text><text class="diagram-label" x="207" y="67" text-anchor="middle">+</text><text class="diagram-label" x="302" y="55" text-anchor="middle">W2</text><text class="diagram-note" x="302" y="77" text-anchor="middle">${f(r.w2)} ft</text><text class="diagram-label" x="397" y="67" text-anchor="middle">+</text><text class="diagram-label" x="500" y="55" text-anchor="middle">Allowance</text><text class="diagram-note" x="500" y="77" text-anchor="middle">${f(allowance)} ft</text><path class="dim-line" d="M35 100 V113 H380 V100"/><text class="diagram-note" x="207" y="138" text-anchor="middle">WB = ${f(r.widthBase)} ft</text><text class="diagram-note" x="500" y="120" text-anchor="middle">${r.railHeight===0?'No rail':`${r.railHeight} in. rail`}</text><text class="diagram-label" x="310" y="170" text-anchor="middle">W = W1 + W2 + allowance = ${f(r.width)} ft</text></svg>`;
  }
  function tableRow(end,r,index,interactive=false) {
    const name=`<strong>${html(end.id||index+1)}</strong><span>${html(end.station||'Station not entered')}</span>`;
    return `<tr><td>${interactive?`<button type="button" data-end="${index}" aria-label="Edit end ${html(end.id||index+1)}">${name}</button>`:name}</td><td>${html(end.railHeight)}</td>${quantityFields.map(([key])=>`<td>${r?f(r[key]):'—'}</td>`).join('')}</tr>`;
  }
  function totalRow(total) {
    return `<tr><td colspan="2">Total · ${project.ends.length} end${project.ends.length===1?'':'s'}</td>${quantityFields.map(([key])=>`<td>${f(total[key])}</td>`).join('')}</tr>`;
  }
  const scheduleHead='<tr><th>End / station</th><th>Rail (in.)</th><th>Pavement (SY)</th><th>Joint (LF)</th><th>Grooving (SY)</th><th>32 in. rail (LF)</th><th>42 in. rail (LF)</th></tr>';
  function buildReport(total) {
    if(!total) { $('report').innerHTML='<h1>Report unavailable</h1><p>Correct all bridge end inputs before printing.</p>'; return; }
    const metadata=[['Project',project.projectNumber],['County',project.county],['Prepared by',project.preparedBy],['Report date',project.date]];
    $('report').innerHTML=`<p class="report-note">MISSISSIPPI ROADWAY DESIGN UTILITIES</p><h1>Bridge end pavement quantities</h1><div class="report-meta">${metadata.map(([key,value])=>`<div><strong>${key}:</strong> ${html(value||'Not entered')}</div>`).join('')}</div><h2>Project quantity schedule</h2><table><thead>${scheduleHead}</thead><tbody>${project.ends.map((end,i)=>tableRow(end,results[i].value,i)).join('')}</tbody><tfoot>${totalRow(total)}</tfoot></table><p class="report-note">SY = square yards; LF = linear feet. Project totals sum the two-decimal quantities for each end. Each record is counted once.</p><p class="report-note">${jointNote}</p><p class="report-note">${railNote}</p>${project.ends.map((end,i)=>{
      const r=results[i].value;
      return `<section class="report-end"><h2>${html(label(end,i))}</h2><div class="report-end-details"><div><strong>W1 / W2:</strong> ${f(r.w1)} / ${f(r.w2)} ft</div><div><strong>Skew / rail:</strong> ${f(r.skew)}° / ${r.railHeight} in.</div><div><strong>WB / W:</strong> ${f(r.widthBase)} / ${f(r.width)} ft</div><div><strong>A / B:</strong> ${f(r.sideA)} / ${f(r.sideB)} ft</div>${quantityFields.map(([key,title,unit])=>`<div><strong>${title}:</strong> ${f(r[key])} ${unit}</div>`).join('')}</div>${planDiagram(r,`report-plan-${i}`)}<p class="report-note">Schematic; dimensions govern. ${r.clamped?'Side A uses the 10 ft minimum. ':''}Gross envelope ${f(r.grossArea)} SY; paving deduction ${f(r.railDeduction)} SY; additional grooving deduction ${f(r.grooveDeduction)} SY.</p></section>`;
    }).join('')}<p class="report-note">Calculation basis: recovered MDOT Bridge End Pavement, Version AI 1.2; geometry matches SDBE-1A. Nonnegative skew magnitude below 90° is required. W1/W2 datum and applicability require project-plan review. Diagrams are not construction details.</p>`;
  }
  function render() {
    results=project.ends.map(end=>{try{return {value:BridgeEndPave.calculate(end)};}catch(error){return {error:error.message};}});
    const current=results[selected], end=project.ends[selected], valid=results.every(r=>r.value);
    $('end-select').replaceChildren(...project.ends.map((item,i)=>new Option(label(item,i),i,false,i===selected)));
    $('add-end').disabled=project.ends.length>=200;
    $('remove-end').disabled=project.ends.length===1;
    $('results-heading').textContent=`Bridge end ${end.id||selected+1}`;
    $('result-context').textContent=`${end.station?`Abutment station ${end.station}`:'Abutment station not entered'} · ${end.railHeight===0?'No rail':`${end.railHeight} in. rail`}`;
    $('input-error').hidden=!current.error;
    $('input-error').textContent=current.error||'';
    $('result-content').hidden=!current.value;
    for(const id of ['w1','w2','skew']) {
      const value=$(id).value;
      const bad=value.trim()===''||!Number.isFinite(Number(value))||Number(value)<0||(id==='skew'&&Number(value)>=90);
      $(id).setAttribute('aria-invalid',String(bad));
      $(id).setAttribute('aria-describedby',`${id==='skew'?'skew-help':'width-help'} input-error`);
    }
    if(current.value) {
      const r=current.value;
      for(const [id,key] of [['pavement','pavement'],['expansion-joint','expansionJoint'],['grooving','grooving'],['rail32','rail32'],['rail42','rail42']]) $(id).textContent=f(r[key]);
      $('plan-container').innerHTML=planDiagram(r,'plan');
      $('width-container').innerHTML=widthDiagram(r);
      $('geometry-mode').textContent=r.clamped?'A held at 10 ft minimum':'20 ft nominal average depth';
      $('quantity-note').textContent=r.railHeight===0?'No rail deductions apply. Transverse grooving equals the paving area.':`${r.railHeight} in. rail applies a ${f(r.railDeduction)} SY paving deduction and a further ${f(r.grooveDeduction)} SY grooving deduction. Rail quantity is 20 LF for this end.`;
      const rows=[['Base width WB',`${f(r.widthBase)} ft`],['Added width',`${f(r.width-r.widthBase)} ft`],['Calculation width W',`${f(r.width)} ft`],['Side A / side B',`${f(r.sideA)} / ${f(r.sideB)} ft`],['Gross trapezoid area',`${f(r.grossArea)} SY`],['Paving area deduction',`${f(r.railDeduction)} SY`],['Additional grooving deduction',`${f(r.grooveDeduction)} SY`]];
      $('breakdown').innerHTML=rows.map(([key,value])=>`<div><dt>${key}</dt><dd>${value}</dd></div>`).join('');
    }
    $('end-count').textContent=`${project.ends.length} end${project.ends.length===1?'':'s'}`;
    $('schedule-rows').innerHTML=project.ends.map((item,i)=>tableRow(item,results[i].value,i,true)).join('');
    let total=null, totalError='';
    if(valid) { try { total=BridgeEndPave.totals(results.map(r=>r.value)); } catch(error) { totalError=error.message; } }
    $('schedule-total').innerHTML=total?totalRow(total):'';
    $('project-note').textContent=totalError||(valid?'Totals sum rounded per-end quantities. Editing a record updates its quantities; add a record only for another bridge end.':results.map((r,i)=>r.error?`${label(project.ends[i],i)}: ${r.error}`:'').filter(Boolean).join(' '));
    for(const id of ['save-project','export-text','print-report']) $(id).disabled=!total;
    buildReport(total);
  }
  for(const id of ['project-number','county','prepared-by','report-date','end-id','station','w1','w2','skew']) $(id).addEventListener('input',readForm);
  $('end-form').addEventListener('submit',event=>event.preventDefault());
  $('rail-height').addEventListener('change',readForm);
  $('end-select').addEventListener('change',()=>{selected=Number($('end-select').value);loadForm();});
  $('schedule-rows').addEventListener('click',event=>{const button=event.target.closest('button[data-end]');if(button){selected=Number(button.dataset.end);loadForm();$('end-id').focus();}});
  $('add-end').addEventListener('click',()=>{
    if(project.ends.length>=200)return;
    const ids=new Set(project.ends.map(end=>end.id));let id=1;while(ids.has(String(id)))id++;
    project.ends.push(newEnd(id));selected=project.ends.length-1;markDirty();loadForm();$('end-id').focus();
  });
  $('remove-end').addEventListener('click',()=>{
    if(project.ends.length===1||!confirm(`Remove ${label(project.ends[selected],selected)} from this project?`))return;
    project.ends.splice(selected,1);selected=Math.min(selected,project.ends.length-1);markDirty();loadForm();
  });
  function download(content,type,extension) {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const link=document.createElement('a');link.href=url;link.download=`BridgeEndPave-${(project.projectNumber||'project').replace(/[^a-z0-9_-]/gi,'_')}.${extension}`;
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  $('save-project').addEventListener('click',()=>{
    if(results.some(r=>r.error))return;
    download(JSON.stringify(project,null,2),'application/json','json');dirty=false;$('file-status').textContent='Project file downloaded · save again after editing';
  });
  $('export-text').addEventListener('click',()=>{
    if(results.some(r=>r.error))return;
    const lines=['ESTIMATED BRIDGE END PAVEMENT QUANTITIES',`Project: ${project.projectNumber}`,`County: ${project.county}`,`Prepared by: ${project.preparedBy}`,`Report date: ${project.date}`,''];
    project.ends.forEach((end,i)=>{const r=results[i].value;lines.push(label(end,i),`W1 ${f(r.w1)} ft | W2 ${f(r.w2)} ft | WB ${f(r.widthBase)} ft | W ${f(r.width)} ft`,`A ${f(r.sideA)} ft | B ${f(r.sideB)} ft | Z ${f(r.skew)} degrees | Rail ${r.railHeight} in.`,...quantityFields.map(([key,title,unit])=>`${title}: ${f(r[key])} ${unit}`),'');});
    const total=BridgeEndPave.totals(results.map(r=>r.value));
    lines.push('PROJECT TOTALS',...quantityFields.map(([key,title,unit])=>`${title}: ${f(total[key])} ${unit}`),'','Totals sum rounded per-end quantities. Each record counted once.','Basis: recovered MDOT Bridge End Pavement, Version AI 1.2; calculation geometry matches SDBE-1A.',jointNote,railNote,'Confirm width datum, plan applicability and construction details separately.');
    download(lines.join('\r\n'),'text/plain;charset=utf-8','txt');
  });
  function validateProject(input) {
    if(!input||input.schema!=='bridge-end-pave-project-v1'||!Array.isArray(input.ends)||input.ends.length<1||input.ends.length>200)throw Error('Choose a Bridge End Pavement JSON project containing 1–200 ends.');
    const text=(value,title,max=160)=>{if(typeof value!=='string'||value.length>max)throw Error(`${title} must be text of at most ${max} characters.`);return value;};
    const reportDate=text(input.date,'Report date',10);
    if(reportDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)||!Number.isFinite(Date.parse(reportDate))||new Date(reportDate).toISOString().slice(0,10)!==reportDate))throw Error('Report date must be a valid YYYY-MM-DD date.');
    const ends=input.ends.map((end,i)=>{
      if(!end||typeof end!=='object'||!['number','string'].includes(typeof end.w1)||!['number','string'].includes(typeof end.w2)||!['number','string'].includes(typeof end.skew)||![0,32,42].includes(end.railHeight))throw Error(`End ${i+1} has invalid calculation inputs.`);
      if([end.w1,end.w2,end.skew].some(value=>String(value).length>80))throw Error(`End ${i+1} has an excessively long number.`);
      const clean={id:text(end.id,`End ${i+1} ID`,80),station:text(end.station,`End ${i+1} station`,80),w1:end.w1,w2:end.w2,skew:end.skew,railHeight:end.railHeight};BridgeEndPave.calculate(clean);return clean;
    });
    BridgeEndPave.totals(ends.map(end=>BridgeEndPave.calculate(end)));
    return {schema:'bridge-end-pave-project-v1',projectNumber:text(input.projectNumber,'Project number'),county:text(input.county,'County'),preparedBy:text(input.preparedBy,'Prepared by'),date:reportDate,ends};
  }
  $('open-project').addEventListener('click',()=>$('open-file').click());
  $('open-file').addEventListener('change',async()=>{
    const file=$('open-file').files[0];if(!file)return;
    try {
      if(file.size>1024*1024)throw Error('Project file is too large (maximum 1 MB).');
      const loaded=validateProject(JSON.parse(await file.text()));
      if(dirty&&!confirm('Replace the unsaved project with this file? Save your current project first if you need to keep it.'))return;
      project=loaded;selected=0;dirty=false;loadForm();$('file-status').textContent=`Opened ${file.name} · inputs restored`;
    } catch(error) { alert(`Could not open project. ${error.message}`); }
    finally { $('open-file').value=''; }
  });
  $('print-report').addEventListener('click',()=>{if(results.every(r=>r.value))window.print();});
  window.addEventListener('beforeprint',render);
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  loadForm();
})();
