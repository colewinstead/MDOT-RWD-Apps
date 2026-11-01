'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const f=(n,d=3)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pipes=SS2.pipes();
 const today=new Date();
 const date=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 const fresh=n=>({id:String(n),station:'',side:'L',length:5,width:'4',height:'4',pavement:false,openings:[{pipeId:pipes[0].id,count:1}]});
 let project={schema:'ss2a-project-v1',projectNumber:'',county:'',preparedBy:'',date,inlets:[fresh(1)]},selected=0,dirty=false,results=[];
 const label=(i,n)=>`Inlet ${i.id||n+1}${i.station?' · '+i.station:''}`;
 function markDirty(){dirty=true;$('file-status').textContent='Unsaved changes · save project to keep your work';}
 function openingForm(){
  $('openings').replaceChildren();
  project.inlets[selected].openings.forEach((opening,i)=>{
   const row=document.createElement('div');row.className='opening-row';
   row.innerHTML=`<label>Pipe size<select data-pipe="${i}" aria-label="Pipe size ${i+1}">${pipes.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select></label><label>Count<input data-count="${i}" type="number" min="1" step="1" aria-label="Opening count ${i+1}"></label><button data-remove="${i}" aria-label="Remove pipe size ${i+1}">×</button>`;
   row.querySelector('select').value=String(opening.pipeId);row.querySelector('input').value=opening.count;$('openings').append(row);
  });
 }
 function loadForm(){
  const inlet=project.inlets[selected];
  for(const [id,key] of [['project-number','projectNumber'],['county','county'],['prepared-by','preparedBy'],['report-date','date']])$(id).value=project[key];
  for(const [id,key] of [['inlet-id','id'],['station','station'],['side','side'],['length','length'],['width','width'],['height','height'],['pavement','pavement']])$(id).value=String(inlet[key]);
  openingForm();render();
 }
 function readForm(){
  for(const [id,key] of [['project-number','projectNumber'],['county','county'],['prepared-by','preparedBy'],['report-date','date']])project[key]=$(id).value;
  Object.assign(project.inlets[selected],{id:$('inlet-id').value,station:$('station').value,side:$('side').value,length:Number($('length').value),width:$('width').value,height:$('height').value,pavement:$('pavement').value==='true'});markDirty();
 }
 const openingText=inlet=>inlet.openings.length?inlet.openings.map(o=>`${o.count} × ${pipes.find(p=>p.id===o.pipeId)?.label||o.pipeId}`).join('; '):'None';
 function scheduleRow(inlet,r,i,edit=false){return `<tr><td>${edit?`<button data-inlet="${i}">`:''}<strong>${esc(inlet.id||i+1)}</strong><span>${esc(inlet.station||'Station not entered')}</span>${edit?'</button>':''}</td><td>${esc(inlet.side)}</td><td>${esc(inlet.length)}</td><td>${esc(inlet.width)}</td><td>${esc(inlet.height)}</td><td>${inlet.pavement?'Yes':'No'}</td><td>${r?f(r.concrete):'—'}</td><td>${r?f(r.steel):'—'}</td></tr>`;}
 const totalRow=t=>`<tr class="report-total"><td colspan="6">Project total · ${project.inlets.length} inlets</td><td>${f(t.concrete)}</td><td>${f(t.steel)}</td></tr>`;
 function report(total,valid){
  if(!valid){$('report').innerHTML='<h1>Report unavailable</h1><p>Correct all inlet inputs before printing this project.</p>';return;}
  const metadata=[['Project',project.projectNumber],['County',project.county],['Prepared by',project.preparedBy],['Report date',project.date]];
  $('report').innerHTML=`<p class="report-kicker">ROADWAY DESIGN UTILITIES · SS-2A</p><h1>Storm sewer inlet quantities</h1><div class="report-meta">${metadata.map(([k,v])=>`<div><strong>${k}:</strong> ${esc(v||'Not entered')}</div>`).join('')}</div><h2>Project quantity schedule</h2><table><thead><tr><th>Inlet / station</th><th>Side</th><th>L (ft)</th><th>W (ft)</th><th>H (ft)</th><th>Pavement</th><th>Concrete (yd³)</th><th>Steel (lb)</th></tr></thead><tbody>${project.inlets.map((inlet,i)=>scheduleRow(inlet,results[i].value,i)).join('')}</tbody><tfoot>${totalRow(total)}</tfoot></table><p class="report-footnote">Dimensions are decimal feet. Pipe dimensions are inches. Project totals use unrounded inlet quantities.</p><h2>Inlet calculation details</h2>${project.inlets.map((inlet,i)=>{const r=results[i].value;return `<section class="report-inlet"><h2>Inlet ${esc(inlet.id||i+1)}</h2><div class="report-details"><div><strong>Station:</strong> ${esc(inlet.station||'Not entered')}</div><div><strong>Roadway side:</strong> ${inlet.side==='L'?'Left':'Right'}</div><div><strong>Length × width × height:</strong> ${esc(inlet.length)} × ${esc(inlet.width)} × ${esc(inlet.height)} ft</div><div><strong>Concrete pavement:</strong> ${inlet.pavement?'Yes':'No'}</div></div><p class="report-openings"><strong>Pipe openings:</strong> ${esc(openingText(inlet))}</p><table><thead><tr><th>Quantity</th><th>Concrete (yd³)</th><th>Steel (lb)</th></tr></thead><tbody><tr><td>Pipe-opening deductions</td><td>${f(r.concreteDeduction)}</td><td>${f(r.steelDeduction)}</td></tr><tr><td>Net inlet quantity</td><td>${f(r.concrete)}</td><td>${f(r.steel)}</td></tr></tbody></table></section>`;}).join('')}<div class="report-notes"><p>Reconstructed from the MDOT SS-2A.exe, version 6.0, October 10, 2011.</p></div>`;
 }
 function render(){
  results=project.inlets.map(inlet=>{try{return {value:SS2.calculate(inlet)};}catch(e){return {error:e.message};}});
  const current=results[selected],inlet=project.inlets[selected],valid=results.every(r=>r.value);
  $('inlet-select').replaceChildren(...project.inlets.map((i,n)=>new Option(label(i,n),n,false,n===selected)));
  $('remove-inlet').disabled=project.inlets.length===1;$('add-inlet').disabled=project.inlets.length>=50;
  $('results-heading').textContent=`Inlet ${inlet.id||selected+1}`;$('result-context').textContent=`${inlet.station?'Station '+inlet.station:'Station not entered'} · ${inlet.length} × ${inlet.width||'—'} × ${inlet.height||'—'} ft`;
  $('input-error').hidden=!current.error;$('input-error').textContent=current.error||'';$('result-content').hidden=!current.value;$('invalid-result').hidden=!!current.value;
  if(current.value){const r=current.value;$('concrete').textContent=f(r.concrete);$('steel').textContent=f(r.steel);$('deductions').textContent=`Pipe-opening deductions: ${f(r.concreteDeduction)} yd³ concrete · ${f(r.steelDeduction)} lb steel.`;}
  $('inlet-count').textContent=`${project.inlets.length} / 50 inlets`;$('schedule-rows').innerHTML=project.inlets.map((i,n)=>scheduleRow(i,results[n].value,n,true)).join('');
  const total=valid?results.reduce((t,r)=>({concrete:t.concrete+r.value.concrete,steel:t.steel+r.value.steel}),{concrete:0,steel:0}):null;
  $('schedule-total').innerHTML=total?totalRow(total):'';$('project-error').textContent=valid?'Totals use unrounded quantities.':results.map((r,i)=>r.error?`${label(project.inlets[i],i)}: ${r.error}`:'').filter(Boolean).join(' ');
  $('save-project').disabled=!valid;$('print-report').disabled=!valid;report(total,valid);
 }
 for(const id of ['project-number','county','prepared-by','report-date','inlet-id','station','width','height'])$(id).addEventListener('input',()=>{readForm();render();});
 for(const id of ['side','length','pavement'])$(id).addEventListener('change',()=>{readForm();render();});
 $('openings').addEventListener('change',event=>{const el=event.target,inlet=project.inlets[selected];if(el.dataset.pipe!==undefined){const p=pipes.find(p=>String(p.id)===el.value);inlet.openings[Number(el.dataset.pipe)].pipeId=p.id;}if(el.dataset.count!==undefined)inlet.openings[Number(el.dataset.count)].count=Number(el.value);markDirty();render();});
 $('openings').addEventListener('input',event=>{const el=event.target;if(el.dataset.count===undefined)return;project.inlets[selected].openings[Number(el.dataset.count)].count=Number(el.value);markDirty();render();});
 $('openings').addEventListener('click',event=>{const b=event.target.closest('button[data-remove]');if(!b)return;project.inlets[selected].openings.splice(Number(b.dataset.remove),1);markDirty();openingForm();render();});
 $('add-opening').addEventListener('click',()=>{if(project.inlets[selected].openings.length>=50)return;project.inlets[selected].openings.push({pipeId:pipes[0].id,count:1});markDirty();openingForm();render();});
 $('inlet-select').addEventListener('change',()=>{selected=Number($('inlet-select').value);loadForm();});
 $('schedule-rows').addEventListener('click',event=>{const b=event.target.closest('button[data-inlet]');if(b){selected=Number(b.dataset.inlet);loadForm();$('inlet-id').focus();}});
 $('add-inlet').addEventListener('click',()=>{if(project.inlets.length>=50)return;const used=new Set(project.inlets.map(i=>i.id));let n=1;while(used.has(String(n)))n++;project.inlets.push(fresh(n));selected=project.inlets.length-1;markDirty();loadForm();});
 $('remove-inlet').addEventListener('click',()=>{if(project.inlets.length<2||!confirm(`Remove ${label(project.inlets[selected],selected)}?`))return;project.inlets.splice(selected,1);selected=Math.min(selected,project.inlets.length-1);markDirty();loadForm();});
 $('save-project').addEventListener('click',()=>{if(results.some(r=>r.error))return;const url=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`SS-2A-${(project.projectNumber||'project').replace(/[^a-z0-9_-]/gi,'_')}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);dirty=false;$('file-status').textContent='Project file downloaded · save again after editing';});
 function validateProject(input){
  if(!input||input.schema!=='ss2a-project-v1'||!Array.isArray(input.inlets)||input.inlets.length<1||input.inlets.length>50)throw Error('Choose an SS-2A project containing 1–50 inlets.');
  const text=(v,k,max=160)=>{if(typeof v!=='string'||v.length>max)throw Error(`${k} must be text of at most ${max} characters.`);return v;};
  const scalar=(v,k)=>{if(!['string','number'].includes(typeof v)||String(v).length>80)throw Error(`${k} is invalid.`);return v;};
  const d=text(input.date,'Date',10);if(d&&(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d))throw Error('Use a valid YYYY-MM-DD date.');
  const inlets=input.inlets.map((i,n)=>{
   if(!i||typeof i!=='object'||!['L','R'].includes(i.side)||![5,10,15].includes(i.length)||typeof i.pavement!=='boolean'||!Array.isArray(i.openings)||i.openings.length>50)throw Error(`Inlet ${n+1} has invalid inputs.`);
   const openings=i.openings.map(o=>{if(!o||!pipes.some(p=>p.id===o.pipeId)||!Number.isInteger(o.count)||o.count<1)throw Error(`Inlet ${n+1} has an invalid pipe opening.`);return {pipeId:o.pipeId,count:o.count};});
   const clean={id:text(i.id,'Inlet ID',80),station:text(i.station,'Station',80),side:i.side,length:i.length,width:scalar(i.width,'Width'),height:scalar(i.height,'Height'),pavement:i.pavement,openings};SS2.calculate(clean);return clean;
  });return {schema:'ss2a-project-v1',projectNumber:text(input.projectNumber,'Project'),county:text(input.county,'County'),preparedBy:text(input.preparedBy,'Prepared by'),date:d,inlets};
 }
 $('open-project').addEventListener('click',()=>$('open-file').click());
 $('open-file').addEventListener('change',async()=>{const file=$('open-file').files[0];if(!file)return;try{if(file.size>1024*1024)throw Error('Maximum project file size is 1 MB.');const loaded=validateProject(JSON.parse(await file.text()));if(dirty&&!confirm('Replace the unsaved project? Save your current project first if you need to keep it.'))return;project=loaded;selected=0;dirty=false;loadForm();$('file-status').textContent=`Opened ${file.name} · inputs restored`;}catch(e){alert(`Could not open project. ${e.message}`);}finally{$('open-file').value='';}});
 $('print-report').addEventListener('click',()=>{if(results.every(r=>r.value))window.print();});window.addEventListener('beforeprint',render);window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});loadForm();
})();
