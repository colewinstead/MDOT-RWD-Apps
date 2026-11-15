'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const f = value => value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  const html = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sheets = typeof BridgeEndSheets === 'undefined' ? {} : BridgeEndSheets;
  const schema = 'bridge-end-pave-project-v2';
  const newEnd = id => ({id:String(id),station:'',drawing:'SDBE-1A',w1:30,w2:25,skew:10,railHeight:32,pavementThickness:9,roadwayPavement:'asphalt',groovingIncluded:false});
  const now = new Date(), date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  let project = {schema,projectNumber:'',county:'',preparedBy:'',date,ends:[newEnd(1)]};
  let selected = 0, dirty = false, results = [], total = null;
  const label = (end,index) => `End ${end.id || index+1}${end.station ? ` · ${end.station}` : ''}`;
  const metadata = [['project-number','projectNumber'],['county','county'],['prepared-by','preparedBy'],['report-date','date']];
  const endFields = [['end-id','id'],['station','station'],['drawing','drawing'],['w1','w1'],['w2','w2'],['skew','skew'],['rail-height','railHeight'],['pavement-thickness','pavementThickness'],['roadway-pavement','roadwayPavement']];
  const quantityFields = [['pavement','Bridge end pavement','SY'],['grooving','Transverse grooving','SY'],['bridgeExpansionJoint','Bridge expansion joint · not doweled','LF'],['roadwayExpansionJoint','Roadway expansion joint · doweled','LF'],['expansionJoint','Premolded expansion joints · total','LF'],['bridgeJointSeal','Bridge-plan joint / seal span','LF'],['railLength','Selected rail · both sides','LF']];
  const scheduleFields = ['pavement','grooving','bridgeExpansionJoint','roadwayExpansionJoint','bridgeJointSeal','railLength'];
  const head = '<tr><th>End / station</th><th>Drawing / rail</th><th>Pavement<br>SY</th><th>Grooving<br>SY</th><th>Bridge E.J.<br>LF</th><th>Roadway E.J.<br>LF</th><th>Bridge-plan seal<br>LF</th><th>Rail<br>LF</th></tr>';
  const configFor = end => BridgeEndPave.drawings.find(drawing => drawing.id === end.drawing);
  const mainSheet = drawing => drawing === 'LEGACY' ? 'SDBE-1A' : drawing;

  function markDirty() { dirty=true; $('file-status').textContent='Unsaved changes · save project to keep your work'; }
  function loadForm() {
    const end=project.ends[selected], config=configFor(end);
    $('rail-height').replaceChildren(...config.railHeights.map(height=>new Option(height===0?'0 · No rail':`${height} in.`,height)));
    $('pavement-thickness').replaceChildren(...config.thicknesses.map(thickness=>new Option(`${thickness} in.`,thickness)));
    for(const [id,key] of metadata) $(id).value=project[key];
    for(const [id,key] of endFields) $(id).value=end[key];
    $('grooving-included').checked=end.groovingIncluded;
    $('roadway-pavement').disabled=end.drawing==='LEGACY';
    $('family-status').textContent=config.description;
    render(); showSource(mainSheet(end.drawing));
  }
  function updateFromForm() {
    for(const [id,key] of metadata) project[key]=$(id).value;
    const end=project.ends[selected];
    for(const [id,key] of endFields) end[key]=['railHeight','pavementThickness'].includes(key)?Number($(id).value):$(id).value;
    end.groovingIncluded=$('grooving-included').checked;
  }
  function readForm() { updateFromForm();markDirty();render(); }
  function pointPath(points,px,py) { return points.map(([x,y],i)=>`${i?'L':'M'}${px(x).toFixed(2)} ${py(y).toFixed(2)}`).join(' ')+' Z'; }
  function planDiagram(r,id) {
    const left=155, top=85, bottom=325, sx=385/Math.max(r.sideA,r.sideB), sy=(bottom-top)/r.width;
    const px=x=>left+x*sx, py=y=>top+y*sy;
    const tangent=(r.sideB-r.sideA)/r.width;
    const c=r.railCut, allowance=(r.width-r.widthBase)/2;
    const paving=r.railHeight===0?[[0,0],[r.sideA,0],[r.sideB,r.width],[0,r.width]]:[[r.sideA-10,0],[r.sideA,0],[r.sideB,r.width],[r.sideB-10,r.width],[r.sideB-tangent*c-10,r.width-c],[0,r.width-c],[0,c],[r.sideA+tangent*c-10,c]];
    const outline=pointPath(paving,px,py), prefix=html(id), crown=allowance+r.w2;
    let groove='';
    if(r.groovingIncluded&&r.grooving>0) {
      if(r.groovingMode==='normal-strip') {
        const radians=r.skew*Math.PI/180, depth=3/Math.cos(radians), y0=allowance,y1=r.width-allowance;
        const x0=r.sideA+y0*tangent,x1=r.sideA+y1*tangent;
        const points=[[Math.max(0,x0-depth),y0],[x0,y0],[x1,y1],[Math.max(0,x1-depth),y1]];
        if(x0<depth&&x1>depth) points.push([0,y0+(depth-x0)/tangent]);
        groove=`<path class="groove-shape" d="${pointPath(points,px,py)}"/>`;
      } else groove=`<path class="groove-shape" d="${outline}"/>`;
    }
    let rails='';
    if(r.railHeight!==0) {
      for(const [y0,y1] of [[0,allowance],[r.width-allowance,r.width]]) {
        const x0=r.sideA+y0*tangent,x1=r.sideA+y1*tangent;
        rails+=`<path class="rail-shape" d="${pointPath([[x0-10,y0],[x0,y0],[x1,y1],[x1-10,y1]],px,py)}"/>`;
      }
    }
    const bridgeClass=r.bridgeJointSeal>0?'seal-line':r.bridgeExpansionJoint>0?'joint-line':'seat-line';
    const bridgeName=r.drawing==='LEGACY'?'Legacy joint span':r.bridgeJointSeal>0?'Bridge-plan joint / seal':r.bridgeExpansionJoint>0?'Bridge expansion joint':'Bridge seat · no expansion joint';
    const roadJoint=r.roadwayExpansionJoint>0?`<line class="road-joint-line" x1="${left}" y1="${py(c)}" x2="${left}" y2="${py(r.width-c)}"/>`:'';
    return `<svg ${id==='plan'?'id="plan-diagram" ':''}viewBox="0 0 800 440" role="img" aria-labelledby="${prefix}-title ${prefix}-description"><title id="${prefix}-title">${html(r.drawing)} bridge end plan</title><desc id="${prefix}-description">${html(r.label)}. Roadway on the left, bridge on the right. Side A ${f(r.sideA)} feet, side B ${f(r.sideB)} feet, overall width ${f(r.width)} feet, skew ${f(r.skew)} degrees. W2 above the crown line is ${f(r.w2)} feet; W1 below is ${f(r.w1)} feet. ${r.railHeight===0?'No rail.':`Two ten-foot ${r.railHeight}-inch rails.`} ${html(bridgeName)}. ${r.groovingIncluded?`Green indicates ${f(r.grooving)} square yards of exposed-concrete grooving.`:'Grooving is not included.'} Proportions are schematic.</desc><path class="envelope-line" d="${pointPath([[0,0],[r.sideA,0],[r.sideB,r.width],[0,r.width]],px,py)}"/><path class="paving-shape" d="${outline}"/>${groove}${rails}<line class="${bridgeClass}" x1="${px(r.sideA)}" y1="${top}" x2="${px(r.sideB)}" y2="${bottom}"/>${roadJoint}<line class="datum-line" x1="100" y1="${py(crown)}" x2="715" y2="${py(crown)}"/><text class="diagram-note" x="235" y="${py(crown)-9}">Crown line</text><text class="diagram-note" x="47" y="200" text-anchor="middle">ROADWAY</text><text class="diagram-note" x="615" y="67" text-anchor="middle">BRIDGE DECK</text><path class="dim-line" d="M${left} 73 V42 M${px(r.sideA)} 73 V42 M${left} 52 H${px(r.sideA)}"/><text class="diagram-label" x="${(left+px(r.sideA))/2}" y="32" text-anchor="middle">A = ${f(r.sideA)} ft</text><path class="dim-line" d="M${left} 338 V366 M${px(r.sideB)} 338 V366 M${left} 352 H${px(r.sideB)}"/><text class="diagram-label" x="${(left+px(r.sideB))/2}" y="378" text-anchor="middle">B = ${f(r.sideB)} ft</text><path class="dim-line" d="M140 ${top} H112 V${bottom} H140"/><text class="diagram-label" transform="translate(99 205) rotate(-90)" text-anchor="middle">W = ${f(r.width)} ft</text><path class="dim-line" d="M610 ${py(allowance)} H637 V${py(r.width-allowance)} H610 M610 ${py(crown)} H637 M692 ${py(allowance)} H715 V${py(r.width-allowance)} H692"/><text class="diagram-label" x="645" y="${(py(allowance)+py(crown))/2}">W2</text><text class="diagram-note" x="645" y="${(py(allowance)+py(crown))/2+19}">${f(r.w2)} ft</text><text class="diagram-label" x="645" y="${(py(crown)+py(r.width-allowance))/2}">W1</text><text class="diagram-note" x="645" y="${(py(crown)+py(r.width-allowance))/2+19}">${f(r.w1)} ft</text><text class="diagram-label" transform="translate(754 205) rotate(-90)" text-anchor="middle">WB = ${f(r.widthBase)} ft</text><line class="datum-line" x1="${px(r.sideA)}" y1="75" x2="${px(r.sideA)}" y2="145"/><text class="joint-label" x="${px(r.sideA)+10}" y="111">Z ${f(r.skew)}°</text><text class="diagram-note" x="400" y="405" text-anchor="middle">Orange: pavement · gray: rail · green: included grooving</text><text class="joint-label" x="400" y="429" text-anchor="middle">${html(bridgeName)} · interface ${f(r.interfaceLength)} ft</text></svg>`;
  }
  function widthDiagram(r) {
    return `<svg id="width-diagram" viewBox="0 0 680 175" role="img" aria-labelledby="width-title width-description"><title id="width-title">Width calculation</title><desc id="width-description">W1 ${f(r.w1)} plus W2 ${f(r.w2)} gives bridge width ${f(r.widthBase)} feet. The selected drawing adds ${f(r.width-r.widthBase)} feet to give ${f(r.width)} feet overall.</desc><rect class="width-one" x="35" y="25" width="170" height="65" rx="3"/><rect class="width-two" x="255" y="25" width="170" height="65" rx="3"/><rect class="paving-shape" x="475" y="25" width="170" height="65" rx="3"/><text class="diagram-label" x="120" y="50" text-anchor="middle">W1</text><text class="diagram-note" x="120" y="73" text-anchor="middle">${f(r.w1)} ft</text><text class="diagram-label" x="230" y="65" text-anchor="middle">+</text><text class="diagram-label" x="340" y="50" text-anchor="middle">W2</text><text class="diagram-note" x="340" y="73" text-anchor="middle">${f(r.w2)} ft</text><text class="diagram-label" x="450" y="65" text-anchor="middle">+</text><text class="diagram-label" x="560" y="50" text-anchor="middle">Allowance</text><text class="diagram-note" x="560" y="73" text-anchor="middle">${f(r.width-r.widthBase)} ft</text><path class="dim-line" d="M35 100 V112 H425 V100"/><text class="diagram-note" x="230" y="135" text-anchor="middle">WB = ${f(r.widthBase)} ft</text><text class="diagram-label" x="340" y="164" text-anchor="middle">W = ${f(r.width)} ft</text></svg>`;
  }
  function sectionDiagram(r) {
    if(r.drawing==='LEGACY') return `<svg id="section-diagram" viewBox="0 0 800 220" role="img" aria-labelledby="section-title section-description"><title id="section-title">Legacy joint quantity</title><desc id="section-description">The original executable reports one expansion-joint span of ${f(r.bridgeExpansionJoint)} linear feet. It does not identify the joint material, dowels, slab thickness, or construction section.</desc><path class="width-one" d="M90 95 H385 V145 H90 Z"/><path class="width-two" d="M415 95 H710 V145 H415 Z"/><line class="joint-line" x1="400" y1="85" x2="400" y2="155"/><text class="diagram-label" x="238" y="125" text-anchor="middle">Roadway side</text><text class="diagram-label" x="560" y="125" text-anchor="middle">Bridge side</text><text class="joint-label" x="400" y="54" text-anchor="middle">Legacy joint span: ${f(r.bridgeExpansionJoint)} LF</text><text class="diagram-note" x="400" y="198" text-anchor="middle">Construction detail is not defined by the original quantity calculation</text></svg>`;
    const overlay=['full-overlay','normal-strip'].includes(r.groovingMode), sleeper=['BE-1','SDBE-1'].includes(r.drawing);
    const overlayEnd=r.groovingMode==='normal-strip'?510:585;
    const surface=overlay?`<path class="overlay-shape" d="M40 108 H${overlayEnd} V98 H40 Z"/>${r.groovingMode==='normal-strip'?'<line class="groove-surface" x1="510" y1="108" x2="585" y2="108"/>':''}`:'';
    const seat=r.bridgeJointSeal>0?'Bridge-plan joint / seal':r.bridgeExpansionJoint>0?'1 in. expansion joint':'Seated interface';
    const sub=r.bridgeJointSeal>0?'See bridge joint detail':r.bridgeExpansionJoint>0?(r.drawing==='LEGACY'?'Legacy joint span':'Not doweled'):'No expansion joint';
    const joint=r.bridgeJointSeal>0?'seal-line':r.bridgeExpansionJoint>0?'joint-line':'seat-line';
    const roadwayJoint=r.roadwayExpansionJoint>0?'<line class="road-joint-line" x1="200" y1="101" x2="200" y2="163"/><text class="diagram-note" x="145" y="60" text-anchor="middle">1 in. doweled joint</text><path class="dim-line" d="M150 68 L195 95"/>':'';
    return `<svg id="section-diagram" viewBox="0 0 800 290" role="img" aria-labelledby="section-title section-description"><title id="section-title">${html(r.drawing)} longitudinal section</title><desc id="section-description">${r.pavementThickness}-inch pavement. ${overlay?'Asphalt overlay shown.':'Bare concrete pavement.'} ${sleeper?'Sleeper slab beneath the roadway end.':'No sleeper slab shown.'} ${html(seat)}: ${html(sub)}. ${r.roadwayExpansionJoint>0?'Separate doweled roadway joint included.':'No conditional roadway joint included.'} Schematic only.</desc>${surface}<path class="width-one" d="M40 110 H200 V160 H40 Z"/><path class="paving-shape" d="M200 110 H585 V160 H200 Z"/><path class="width-two" d="M610 110 H760 V160 H610 Z"/>${sleeper?'<path class="width-one" d="M155 160 H275 V192 H155 Z"/><text class="diagram-note" x="215" y="238" text-anchor="middle">Sleeper slab</text><path class="dim-line" d="M215 196 V219"/>':''}<line class="${joint}" x1="597" y1="103" x2="597" y2="170"/>${roadwayJoint}<text class="diagram-label" x="115" y="139" text-anchor="middle">Roadway</text><text class="diagram-label" x="392" y="139" text-anchor="middle">Bridge end pavement</text><text class="diagram-label" x="685" y="139" text-anchor="middle">Bridge deck</text><path class="dim-line" d="M597 94 L650 46 H765 M392 168 V202 H505"/><text class="joint-label" x="685" y="23" text-anchor="middle">${html(seat)}</text><text class="diagram-note" x="685" y="43" text-anchor="middle">${html(sub)}</text><text class="diagram-note" x="505" y="225" text-anchor="middle">${r.pavementThickness} in. concrete pavement</text>${overlay?`<text class="diagram-note" x="350" y="55" text-anchor="middle">Asphalt overlay${r.groovingMode==='normal-strip'?' · exposed 3 ft strip at bridge':''}</text><path class="dim-line" d="M350 64 V90"/>`:''}<text class="diagram-note" x="400" y="278" text-anchor="middle">${html(r.drawing)} · selected arrangement, not to scale</text></svg>`;
  }
  function railDiagram(r) {
    if(r.railHeight===0) return '<svg id="rail-diagram" viewBox="0 0 680 180" role="img" aria-labelledby="rail-title rail-description"><title id="rail-title">No rail · legacy case</title><desc id="rail-description">The original no-rail calculation adds one foot to the bridge width. It is not a standard or special railed drawing combination.</desc><path class="paving-shape" d="M100 65 H580 V115 H100 Z"/><text class="diagram-label" x="340" y="95" text-anchor="middle">Legacy no-rail pavement</text><text class="diagram-note" x="340" y="156" text-anchor="middle">6 in. normal edge allowance on each side</text></svg>';
    const base=r.railProfileBaseWidth===undefined?r.railBaseWidth:r.railProfileBaseWidth;
    return `<svg id="rail-diagram" viewBox="0 0 680 280" role="img" aria-labelledby="rail-title rail-description"><title id="rail-title">${r.railHeight}-inch rail · ${html(r.railDetail)}</title><desc id="rail-description">Selected rail height ${r.railHeight} inches, profile base ${f(base*12)} inches, nominal plan side allowance ${f(r.railBaseWidth*12)} inches. Two ten-foot rails give ${f(r.railLength)} linear feet per bridge end. Shape is schematic; full detail is available in the embedded drawing viewer.</desc><path class="rail-shape" d="M230 223 V175 L275 135 L292 38 Q310 18 330 38 L345 185 H390 V223 Z"/><path class="width-one" d="M215 225 H405 V245 H215 Z"/><path class="dim-line" d="M215 225 H170 V35 H280 M230 251 V266 H390 V251"/><text class="diagram-label" transform="translate(155 130) rotate(-90)" text-anchor="middle">${r.railHeight} in. rail height</text><text class="diagram-label" x="310" y="279" text-anchor="middle">${f(base*12)} in. base</text><text class="diagram-label" x="470" y="85">${html(r.railDetail)}</text><text class="diagram-note" x="470" y="119">10 ft each side</text><text class="diagram-note" x="470" y="146">${f(r.railLength)} LF per end</text><text class="diagram-note" x="470" y="190">Plan allowance:</text><text class="diagram-note" x="470" y="214">${f(r.railBaseWidth*12)} in. each side</text></svg>`;
  }
  const quantityTitle=(key,title,r)=>key==='bridgeExpansionJoint'&&r.drawing==='LEGACY'?'Legacy expansion joint span':title;
  function tableRow(end,r,index,interactive=false) {
    const name=`<strong>${html(end.id||index+1)}</strong><span>${html(end.station||'Station not entered')}</span>`;
    return `<tr><td>${interactive?`<button type="button" data-end="${index}" aria-label="Edit ${html(label(end,index))}">${name}</button>`:name}</td><td>${html(end.drawing)}<span>${end.railHeight===0?'No rail':`${html(end.railHeight)} in.`}</span></td>${scheduleFields.map(key=>`<td>${r?f(r[key]):'—'}</td>`).join('')}</tr>`;
  }
  function totalRow(value) { return `<tr><td colspan="2">Total · ${project.ends.length} end${project.ends.length===1?'':'s'}</td>${scheduleFields.map(key=>`<td>${f(value[key])}</td>`).join('')}</tr>`; }
  function railTotals(value) { return BridgeEndPave.railKeys.map(([key,height])=>`<span>${height} in. rail <strong>${f(value[key])} LF</strong></span>`).join(''); }
  function railDetailTotals() {
    const groups=new Map();
    for(const {value:r} of results) {
      if(!r||r.railHeight===0)continue;
      const detail=r.drawing==='LEGACY'?'Legacy original quantity':r.railDetail;
      const key=`${r.railHeight}|${detail}`, row=groups.get(key)||{height:r.railHeight,detail,length:0};
      row.length+=r.railLength;groups.set(key,row);
    }
    return [...groups.values()];
  }
  const railDetailMarkup=()=>railDetailTotals().map(row=>`<span>${row.height} in. · ${html(row.detail)} <strong>${f(row.length)} LF</strong></span>`).join('');
  function buildReport() {
    if(!total) { $('report').innerHTML='<h1>Report unavailable</h1><p>Correct all bridge end inputs before printing.</p>';return; }
    const meta=[['Project',project.projectNumber],['County',project.county],['Prepared by',project.preparedBy],['Report date',project.date]];
    $('report').innerHTML=`<p class="report-note">MISSISSIPPI ROADWAY DESIGN UTILITIES</p><h1>Bridge end pavement quantities</h1><div class="report-meta">${meta.map(([key,value])=>`<div><strong>${key}:</strong> ${html(value||'Not entered')}</div>`).join('')}</div><h2>Project quantity schedule</h2><table><thead>${head}</thead><tbody>${project.ends.map((end,i)=>tableRow(end,results[i].value,i)).join('')}</tbody><tfoot>${totalRow(total)}</tfoot></table><p class="report-note">Bridge E.J. follows the selected drawing; roadway E.J. is doweled. Legacy mode preserves the original reported joint span. Bridge-plan joint/seal spans are separate and are not added to the expansion-joint quantity.</p><p class="report-note">Premolded expansion joints total: ${f(total.expansionJoint)} LF. Grooving is counted only where included in each record. SY = square yards; LF = linear feet.</p><div class="rail-totals">${railTotals(total)}</div><h2>Rail totals by detail</h2><div class="rail-totals">${railDetailMarkup()}</div>${project.ends.map((end,i)=>{
      const r=results[i].value;
      return `<section class="report-end"><h2>${html(label(end,i))}</h2><p class="report-note">${html(r.label)} · ${html(r.railDetail)} · ${r.pavementThickness} in. pavement · ${html(r.roadwayPavement)} roadway${r.drawing==='LEGACY'?' (not used in legacy joint calculation)':''} · grooving ${r.groovingIncluded?'included':'not included'}</p><div class="report-end-details"><div><strong>W1 / W2:</strong> ${f(r.w1)} / ${f(r.w2)} ft</div><div><strong>Skew / rail:</strong> ${f(r.skew)}° / ${r.railHeight} in.</div><div><strong>WB / W:</strong> ${f(r.widthBase)} / ${f(r.width)} ft</div><div><strong>A / B:</strong> ${f(r.sideA)} / ${f(r.sideB)} ft</div>${quantityFields.map(([key,title,unit])=>`<div><strong>${quantityTitle(key,title,r)}:</strong> ${f(r[key])} ${unit}</div>`).join('')}</div>${planDiagram(r,`report-plan-${i}`)}<p class="report-note">${html(surfaceNote(r))} Paving perimeter deduction ${f(r.railDeduction)} SY. ${r.clamped?'Side A uses the 10 ft minimum. ':''}Nominal rail length is 10 ft on each side; rail length is not multiplied by bridge skew.</p></section>`;
    }).join('')}<p class="report-note">Standard and special drawing families use different widths, finishes, and joint requirements. Drawing-derived plan equations are dimensional interpretations of the selected sheets; project dimensions and grooving limits govern. Several special references are preliminary/not for construction. Legacy records retain the recovered AI 1.2 arithmetic. No volume, reinforcement, drainage, or structural-design quantity is included.</p>`;
  }
  function surfaceNote(r) {
    if(!r.groovingIncluded) return 'Transverse grooving is not included in this record.';
    if(r.groovingMode==='full-overlay') return 'The selected standard drawing covers the concrete with asphalt overlay; exposed-concrete grooving is zero.';
    if(r.groovingMode==='normal-strip') return 'Grooving follows the exposed 3 ft strip measured normal to the bridge joint, clipped at the clear pavement boundary.';
    return 'Grooving covers exposed bare concrete, excluding the two rail footprints when rails are present.';
  }
  function render() {
    results=project.ends.map(end=>{try{return {value:BridgeEndPave.calculate(end)};}catch(error){return {error:error.message};}});
    const end=project.ends[selected], current=results[selected], config=configFor(end);
    $('end-select').replaceChildren(...project.ends.map((item,i)=>new Option(label(item,i),i,false,i===selected)));
    $('add-end').disabled=project.ends.length>=200;$('remove-end').disabled=project.ends.length===1;
    $('results-heading').textContent=`Bridge end ${end.id||selected+1}`;
    $('result-context').textContent=`${end.station?`Abutment station ${end.station}`:'Abutment station not entered'} · ${end.drawing} · ${end.railHeight===0?'No rail':`${end.railHeight} in. rail`}`;
    $('input-error').hidden=!current.error;$('input-error').textContent=current.error||'';$('result-content').hidden=!current.value;
    $('rail-help').textContent=`${config.railHeights.map(height=>height===0?'No rail':`${height} in.`).join(' / ')} · only the combinations shown for this drawing family are offered.`;
    $('thickness-help').textContent='Thickness selects the reference section; these plan quantities do not calculate concrete volume.';
    $('roadway-help').textContent=end.drawing==='LEGACY'?'Legacy mode retains the original single joint span; roadway type does not add another joint.':'A separate doweled roadway joint is included only for concrete roadway pavement.';
    for(const id of ['w1','w2','skew']) {
      const value=$(id).value,bad=value.trim()===''||!Number.isFinite(Number(value))||Number(value)<0||(id==='skew'&&Number(value)>=90);
      $(id).setAttribute('aria-invalid',String(bad));$(id).setAttribute('aria-describedby',`${id==='skew'?'skew-help':'width-help'} input-error`);
    }
    if(current.value) {
      const r=current.value;
      for(const [id,key] of [['pavement','pavement'],['grooving','grooving'],['expansion-joint','expansionJoint'],['bridge-expansion-joint','bridgeExpansionJoint'],['roadway-expansion-joint','roadwayExpansionJoint'],['bridge-joint-seal','bridgeJointSeal'],['rail-length','railLength']]) $(id).textContent=f(r[key]);
      $('bridge-expansion-label').textContent=r.drawing==='LEGACY'?'Legacy expansion joint span':'Bridge expansion joint · not doweled';
      $('plan-heading').textContent=`${r.drawing} calculation plan`;
      $('plan-container').innerHTML=planDiagram(r,'plan');$('width-container').innerHTML=widthDiagram(r);$('section-container').innerHTML=sectionDiagram(r);$('rail-container').innerHTML=railDiagram(r);
      $('geometry-mode').textContent=r.clamped?'A held at 10 ft minimum':'20 ft nominal average depth';
      $('quantity-note').textContent=`${surfaceNote(r)} Rail detail: ${r.railDetail}. Bridge-plan joint/seal length is kept separate from premolded expansion joints.`;
      const rows=[['Bridge width WB',`${f(r.widthBase)} ft`],['Added total width',`${f(r.width-r.widthBase)} ft`],['Slab envelope width W',`${f(r.width)} ft`],['Normal roadway-end width',`${f(r.roadwayWidth)} ft`],['Side A / side B',`${f(r.sideA)} / ${f(r.sideB)} ft`],['Gross trapezoid envelope',`${f(r.grossArea)} SY`],['Paving perimeter deduction',`${f(r.railDeduction)} SY`],['Skewed full interface',`${f(r.interfaceLength)} ft`]];
      $('breakdown').innerHTML=rows.map(([key,value])=>`<div><dt>${key}</dt><dd>${value}</dd></div>`).join('');
      $('calculation-notes').innerHTML=r.notes.map(note=>`<p>${html(note)}</p>`).join('');
    }
    $('end-count').textContent=`${project.ends.length} end${project.ends.length===1?'':'s'}`;
    $('schedule-head').innerHTML=head;$('schedule-rows').innerHTML=project.ends.map((item,i)=>tableRow(item,results[i].value,i,true)).join('');
    total=null;let totalError='';
    if(results.every(r=>r.value)) { try { total=BridgeEndPave.totals(results.map(r=>r.value)); } catch(error) { totalError=error.message; } }
    $('schedule-total').innerHTML=total?totalRow(total):'';$('rail-totals').innerHTML=total?railTotals(total):'';$('rail-detail-totals').innerHTML=total?railDetailMarkup():'';
    $('project-note').textContent=totalError||(total?'Totals sum rounded per-end quantities. Bridge-plan joint/seal spans stay separate; rail totals are grouped by height.':results.map((r,i)=>r.error?`${label(project.ends[i],i)}: ${r.error}`:'').filter(Boolean).join(' '));
    for(const id of ['save-project','export-text','print-report']) $(id).disabled=!total;
    buildReport();
  }
  function showSource(id) {
    const chosen=sheets[id]?id:Object.keys(sheets)[0], sheet=sheets[chosen];
    if(!sheet) { $('source-caption').textContent='Drawing references were not loaded. Use the generated standalone HTML for offline sheets.';return; }
    $('source-sheet').value=chosen;$('source-image').src=sheet.image;$('source-image').alt=`${chosen}: ${sheet.title}`;
    $('source-caption').textContent=`${chosen} · ${sheet.title} · ${sheet.source}`;
    $('source-viewport').classList.remove('zoomed');$('source-zoom').textContent='Enlarge drawing';
  }
  $('drawing').replaceChildren(...BridgeEndPave.drawings.map(drawing=>new Option(drawing.label,drawing.id)));
  $('source-sheet').replaceChildren(...Object.entries(sheets).map(([id,sheet])=>new Option(`${id} · ${sheet.title}`,id)));
  $('source-sheet').addEventListener('change',()=>showSource($('source-sheet').value));
  $('source-zoom').addEventListener('click',()=>{const zoomed=$('source-viewport').classList.toggle('zoomed');$('source-zoom').textContent=zoomed?'Fit drawing':'Enlarge drawing';});
  for(const id of ['project-number','county','prepared-by','report-date','end-id','station','w1','w2','skew']) $(id).addEventListener('input',readForm);
  for(const id of ['rail-height','pavement-thickness','roadway-pavement','grooving-included']) $(id).addEventListener('change',readForm);
  $('drawing').addEventListener('change',()=>{
    updateFromForm();const end=project.ends[selected],config=configFor(end);
    const previousRail=end.railHeight,previousThickness=end.pavementThickness;
    if(!config.railHeights.includes(end.railHeight)) end.railHeight=config.railHeights[0];
    if(!config.thicknesses.includes(end.pavementThickness)) end.pavementThickness=config.thicknesses[0];
    if(end.drawing==='LEGACY') end.roadwayPavement='asphalt';
    markDirty();loadForm();
    if(previousRail!==end.railHeight||previousThickness!==end.pavementThickness) $('family-status').textContent+=` Compatible detail selected: ${end.railHeight} in. rail, ${end.pavementThickness} in. pavement. Other inputs were kept.`;
  });
  $('end-form').addEventListener('submit',event=>event.preventDefault());
  $('end-select').addEventListener('change',()=>{selected=Number($('end-select').value);loadForm();});
  $('schedule-rows').addEventListener('click',event=>{const button=event.target.closest('button[data-end]');if(button){selected=Number(button.dataset.end);loadForm();$('end-id').focus();}});
  $('add-end').addEventListener('click',()=>{if(project.ends.length>=200)return;const ids=new Set(project.ends.map(end=>end.id));let id=1;while(ids.has(String(id)))id++;project.ends.push(newEnd(id));selected=project.ends.length-1;markDirty();loadForm();$('end-id').focus();});
  $('remove-end').addEventListener('click',()=>{if(project.ends.length===1||!confirm(`Remove ${label(project.ends[selected],selected)} from this project?`))return;project.ends.splice(selected,1);selected=Math.min(selected,project.ends.length-1);markDirty();loadForm();});
  function download(content,type,extension) {
    const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');link.href=url;link.download=`BridgeEndPave-${(project.projectNumber||'project').replace(/[^a-z0-9_-]/gi,'_')}.${extension}`;
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  $('save-project').addEventListener('click',()=>{if(!total)return;download(JSON.stringify(project,null,2),'application/json','json');dirty=false;$('file-status').textContent='Project file downloaded · save again after editing';});
  $('export-text').addEventListener('click',()=>{
    if(!total)return;
    const lines=['ESTIMATED BRIDGE END PAVEMENT QUANTITIES',`Project: ${project.projectNumber}`,`County: ${project.county}`,`Prepared by: ${project.preparedBy}`,`Report date: ${project.date}`,''];
    project.ends.forEach((end,i)=>{const r=results[i].value;lines.push(label(end,i),`${r.label} | Rail detail ${r.railDetail} | ${r.pavementThickness} in. pavement | ${r.roadwayPavement} roadway | Grooving ${r.groovingIncluded?'included':'not included'}`,`W1 ${f(r.w1)} ft | W2 ${f(r.w2)} ft | WB ${f(r.widthBase)} ft | W ${f(r.width)} ft`,`A ${f(r.sideA)} ft | B ${f(r.sideB)} ft | Z ${f(r.skew)} degrees | Rail ${r.railHeight} in.`,...quantityFields.map(([key,title,unit])=>`${quantityTitle(key,title,r)}: ${f(r[key])} ${unit}`),surfaceNote(r),'');});
    lines.push('PROJECT TOTALS',...quantityFields.map(([key,title,unit])=>`${title}: ${f(total[key])} ${unit}`),'RAIL TOTALS BY HEIGHT',...BridgeEndPave.railKeys.map(([key,height])=>`${height} in. rail: ${f(total[key])} LF`),'RAIL TOTALS BY DETAIL',...railDetailTotals().map(row=>`${row.height} in. | ${row.detail}: ${f(row.length)} LF`),'','Bridge-plan joint/seal spans are not included in premolded expansion-joint totals.','Totals sum rounded per-end quantities; each record counted once.','Drawing-derived plan areas use interpreted perimeter dimensions. Check the applicable contract, drawing revision, and grooving limits. Several special references are preliminary/not for construction.');
    download(lines.join('\r\n'),'text/plain;charset=utf-8','txt');
  });
  function validateProject(input) {
    const legacy=input&&input.schema==='bridge-end-pave-project-v1';
    if(!input||(!legacy&&input.schema!==schema)||!Array.isArray(input.ends)||input.ends.length<1||input.ends.length>200)throw Error('Choose a Bridge End Pavement project JSON file containing 1–200 ends.');
    const text=(value,title,max=160)=>{if(typeof value!=='string'||value.length>max)throw Error(`${title} must be text of at most ${max} characters.`);return value;};
    const reportDate=text(input.date,'Report date',10);
    if(reportDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)||!Number.isFinite(Date.parse(reportDate))||new Date(reportDate).toISOString().slice(0,10)!==reportDate))throw Error('Report date must be a valid YYYY-MM-DD date.');
    const ends=input.ends.map((end,i)=>{
      if(!end||typeof end!=='object'||Array.isArray(end)||!['number','string'].includes(typeof end.w1)||!['number','string'].includes(typeof end.w2)||!['number','string'].includes(typeof end.skew)||typeof end.railHeight!=='number')throw Error(`End ${i+1} has invalid calculation inputs.`);
      if([end.w1,end.w2,end.skew].some(value=>String(value).length>80))throw Error(`End ${i+1} has an excessively long number.`);
      const clean={id:text(end.id,`End ${i+1} ID`,80),station:text(end.station,`End ${i+1} station`,80),w1:end.w1,w2:end.w2,skew:end.skew,railHeight:end.railHeight,drawing:legacy?'LEGACY':text(end.drawing,`End ${i+1} drawing`,20),pavementThickness:legacy?9:end.pavementThickness,roadwayPavement:legacy?'asphalt':text(end.roadwayPavement,`End ${i+1} roadway`,12),groovingIncluded:legacy?true:end.groovingIncluded};
      if(typeof clean.pavementThickness!=='number'||typeof clean.groovingIncluded!=='boolean')throw Error(`End ${i+1} has invalid detail options.`);
      BridgeEndPave.calculate(clean);return clean;
    });
    BridgeEndPave.totals(ends.map(end=>BridgeEndPave.calculate(end)));
    return {schema,projectNumber:text(input.projectNumber,'Project number'),county:text(input.county,'County'),preparedBy:text(input.preparedBy,'Prepared by'),date:reportDate,ends};
  }
  $('open-project').addEventListener('click',()=>$('open-file').click());
  $('open-file').addEventListener('change',async()=>{
    const file=$('open-file').files[0];if(!file)return;
    try {
      if(file.size>1024*1024)throw Error('Project file is too large (maximum 1 MB).');
      const parsed=JSON.parse(await file.text()),loaded=validateProject(parsed);
      if(dirty&&!confirm('Replace the unsaved project with this file? Save your current project first if you need to keep it.'))return;
      project=loaded;selected=0;dirty=false;loadForm();$('file-status').textContent=`Opened ${file.name}${parsed.schema!==schema?' · legacy quantities preserved; save to use the new project format':' · inputs restored'}`;
    } catch(error) { alert(`Could not open project. ${error.message}`); }
    finally { $('open-file').value=''; }
  });
  $('print-report').addEventListener('click',()=>{if(total)window.print();});
  window.addEventListener('beforeprint',render);
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  loadForm();
})();
