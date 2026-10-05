/* Author: Andrew Fisher. Read-only fencing layer on the existing Map explorer camera. */
(function(){
'use strict';
const C=window.GC500FencingCore, A=window.GC500Explorer;
if(!C||!A||!A.fencingAdapter)return;
const adapter=A.fencingAdapter;
const $=id=>document.getElementById(id);
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colour={clean:'#ffad64',scrim:'#bd9afa',ccb:'#6ed6f0',relocation:'#f0d37d',other:'#c9c0b5',unclassified:'#c9c0b5'};
const names={clean:'Clean',scrim:'Braced for scrim',ccb:'CCB',relocation:'Move / remove',other:'Other',unclassified:'Type unconfirmed'};
let hostVisible=true;
let active=false,model=null,snapshot=null,selected=null,timer=0,previousMode=null,snapshotKey='',hits=[],pointer=null;
let filters={source:'all',day:'',status:'all',query:'',types:[]};
const button=document.createElement('button');button.id='fenceMode';button.textContent='Fencing';button.setAttribute('aria-pressed','false');button.setAttribute('aria-controls','fencePanel');
$('navBtn').insertAdjacentElement('afterend',button);
const panel=document.createElement('section');panel.id='fencePanel';panel.setAttribute('aria-label','Fencing plan and recorded progress');
panel.innerHTML=`<p class="fm-kicker">GC500 · SITE WORKS</p><h2>Fencing</h2><p>Fence runs, work areas and recorded progress.</p>
<label for="fmSource">Plan source</label><select id="fmSource"></select>
<div class="fm-grid"><div><label for="fmDay">Work day</label><select id="fmDay"><option value="">All days</option></select></div><div><label for="fmStatus">Show</label><select id="fmStatus"><option value="all">All work</option><option value="unmapped">Location to confirm</option><option value="complete">Section complete</option><option value="area">Areas marked complete</option><option value="confirm">Quantity to confirm</option><option value="hold">Prerequisites</option></select></div></div>
<label for="fmQuery">Find a work area</label><input id="fmQuery" type="search" autocomplete="off" placeholder="Park, grandstand or work…">
<div class="fm-types" aria-label="Fence type">${Object.keys(names).map(k=>`<button data-fmtype="${k}" style="--fence-type:${colour[k]}" aria-pressed="true">${names[k]}</button>`).join('')}</div>
<div class="fm-legend"><span class="fm-planned">Planned run</span><span class="fm-complete">Section complete</span><span class="fm-area">Area sign-off</span></div><p id="fmOverviewHelp">A green area marker is a recorded area sign-off, not a completed fence line.</p>
<label class="chk"><input id="fmSourceLines" type="checkbox" checked> Show fencing overlays</label>
<label class="chk"><input id="fmPlan" type="checkbox"> Show master plan labels</label>
<div id="fmAlert" role="status" hidden></div><div id="fmSummary" aria-live="polite"></div>
<details id="fmCoverage"></details><div id="fmDetails" hidden></div><div id="fmList"></div>
<details id="fmRecorded"><summary>Recorded area sign-offs</summary><p>Area sign-offs do not confirm every fence run or later revision.</p><div id="fmAreas"></div></details>
<button id="fmRegister" type="button">Open fencing register →</button><p id="fmFooter">Author: Andrew Fisher · Plan alignment is for site orientation, not set-out. Satellite imagery is not live.</p>`;
$('side').prepend(panel);
const overlay=document.createElement('canvas');overlay.id='fenceOverlay';overlay.setAttribute('aria-hidden','true');$('stage').append(overlay);const ctx=overlay.getContext('2d');
const badge=document.createElement('div');badge.id='fenceMapBadge';$('stage').parentElement.append(badge);
function parentCall(name,...args){try{if(window.parent!==window&&typeof window.parent[name]==='function')return window.parent[name](...args);}catch(_){}return null;}
function dateText(s){return /^\d{4}-\d{2}-\d{2}/.test(s||'')?new Date(s.slice(0,10)+'T12:00:00+10:00').toLocaleDateString('en-AU',{timeZone:'Australia/Brisbane',day:'numeric',month:'short'}):s||'Date not recorded';}
function option(value,label){return `<option value="${e(value)}">${e(label)}</option>`;}
function refresh(force){
  if(!active||document.hidden||!hostVisible)return;
  let incoming=parentCall('gc500FencingMapSnapshot');
  if(!incoming&&window.GC500FencingPreviewSnapshot)incoming=window.GC500FencingPreviewSnapshot();
  if(!incoming){$('fmAlert').hidden=false;$('fmAlert').textContent='Open Fencing from the GC500 dashboard to see the shared plan and current record.';return;}
  const signature=JSON.stringify({...incoming,received_at:undefined})+'|'+adapter.masterHash();
  if(!force&&signature===snapshotKey)return;
  let next;try{next=C.model(incoming,adapter.masterHash());}catch(_){snapshotKey='';model=null;selected=null;$('fmAlert').hidden=false;$('fmAlert').textContent='Fencing data could not be read. Reopen the map to retry or consult the source plan.';$('fmList').innerHTML='';$('fmDetails').hidden=true;$('fmSummary').textContent='Map data unavailable';adapter.requestPaint();return;}
  snapshotKey=signature;snapshot={...incoming,areaEvidence:Array.isArray(incoming.areaEvidence)?incoming.areaEvidence.filter(x=>x&&typeof x==='object'):[],conflicts:Array.isArray(incoming.conflicts)?incoming.conflicts.filter(x=>x&&typeof x==='object'):[]};model=next;
  if(filters.source!=='all'&&(!filters.source||!model.sources.some(s=>s.id===filters.source)))filters.source=model.currentSource;
  if(selected&&!model.rows.some(r=>r.id===selected)&&!model.geometry.some(g=>g.id===selected))selected=null;
  $('fmSource').innerHTML=option('all','All source plans · master fencing view')+model.sources.map(s=>option(s.id,`${s.label} · ${dateText(s.revision)}`)).join('');$('fmSource').value=filters.source;
  updateDays();render();
}
function updateDays(){
  const days=[...new Set(model.rows.filter(r=>filters.source==='all'||r.source_id===filters.source).map(r=>r.date))].sort();
  if(!days.includes(filters.day))filters.day='';
  $('fmDay').innerHTML=option('','All days')+days.map(d=>option(d,dateText(d))).join('');$('fmDay').value=filters.day;
}
function rows(){if(!model||filters.source==='all')return[];return C.filterRows(model,{...filters,types:[]}).filter(r=>!filters.types.length||r.kind==='notice'||r.categories.some(k=>filters.types.includes(k))||r.geometry.some(g=>filters.types.includes(g.category||'unclassified')));}
function source(){return model&&model.sources.find(s=>s.id===filters.source);}
function geometryMatches(g,task){
 if(!$('fmSourceLines').checked||filters.status==='area'||filters.status==='unmapped')return false;
 if(filters.status!=='all'&&(!task||task.status.state!==filters.status))return false;
 if(filters.day&&(g.source_planned_date||task&&task.date)!==filters.day)return false;
 if(filters.types.length&&!filters.types.includes(g.category||'unclassified'))return false;
 if(filters.query&&!C.key((g.label||'')+' '+(g.source_file||'')+' '+(task?task.location+' '+task.description:'')).includes(C.key(filters.query)))return false;
 return true;
}
function library(){const src=source();return src?model.geometry.filter(g=>g.source_sha256===src.sha256&&g.role!=='area-signoff'&&!g.task_ids.length&&geometryMatches(g)):[];}
function overviewGeometry(){
 if(!model||!model.masterValid)return[];
 return C.dedupeGeometry(model.geometry.filter(g=>g.role!=='area-signoff'&&geometryMatches(g,model.rows.find(r=>g.task_ids.includes(r.id)))));
}
function areaMarkers(){
 if(!model||!model.masterValid||!$('fmSourceLines').checked||filters.status!=='all'&&filters.status!=='area'||filters.day||filters.types.length)return[];
 return model.geometry.filter(g=>g.role==='area-signoff'&&(filters.source==='all'||g.source_sha256===(source()||{}).sha256)).map(g=>({...g,areaRecords:(snapshot.areaEvidence||[]).filter(a=>a.done&&(g.area_evidence_names||[]).some(n=>C.key(n)===C.key(a.name)))})).filter(g=>g.areaRecords.length&&(!filters.query||C.key(g.label).includes(C.key(filters.query))));
}
function render(){
  if(!model)return;const rs=rows(),s=C.stats(rs),src=source(),overview=filters.source==='all';
  const warnings=[...(model.issues||[])];if(!model.masterValid)warnings.push('Master drawing changed: overlays are hidden pending alignment review.');
  if(model.rejected.length)warnings.push(`${model.rejected.length} overlay${model.rejected.length===1?'':'s'} held back by source checks.`);
  if(src&&src.id!==model.currentSource)warnings.push('Earlier source plan. Its fence runs are not added to the current plan totals.');
  if(src&&src.note)warnings.push(src.note);
  $('fmAlert').hidden=!warnings.length;$('fmAlert').textContent=warnings.join(' ');
  $('fmSummary').textContent=overview?`${model.sources.length} source plans · ${overviewGeometry().length} source annotations / anchors. Earlier and current routes are shown together; no additive fence totals.`:`${s.tasks} work tasks · ${s.mapped} map references · ${s.unmapped} locations to confirm`+(s.notices?` · ${s.notices} notice`:'');
  badge.textContent=overview?'Earlier + current plans · no installed totals':`${src?src.short_label:'Fencing'} · ${filters.status==='area'?'area sign-offs':filters.status==='complete'?'confirmed sections':'planned fencing'}`;
  $('fmList').innerHTML=(overview?model.sources.map(x=>`<button data-fmswitch="${e(x.id)}"><b>${e(x.label)}</b><small>${model.geometry.filter(g=>g.source_sha256===x.sha256).length} aligned annotations / anchors · ${e(dateText(x.revision))}</small></button>`).join(''):'')+rs.map(r=>`<button data-fmrow="${e(r.id)}" aria-current="${selected===r.id}"><b><span class="fm-dot" style="--fence-state:${r.status.state==='complete'?'#40db9a':r.status.state==='hold'?'#ffcf73':'#ffad64'}"></span>${e(r.location)}</b><small>${e(r.description)}</small><small>${e(dateText(r.date))} · ${e(r.kind==='notice'?'Notice':r.geometry.length?r.geometry.every(g=>g.kind==='anchor')?'Area marker · line not mapped':'Source geometry': 'Location to confirm')}</small></button>`).join('')+
    library().map(g=>`<button data-fmrow="${e(g.id)}" aria-current="${selected===g.id}"><b>${e(g.label||'Source fence run')}</b><small>${e(names[g.category||'unclassified'])} · source page ${g.source_page}</small></button>`).join('')+
    (!overview&&!rs.length&&!library().length?'<p>No work matches these filters.</p>':'');
  const areaRows=(snapshot.areaEvidence||[]).filter(a=>a.done),visibleAreas=areaRows.filter(a=>!filters.query||C.key(a.name).includes(C.key(filters.query)));
  $('fmAreas').innerHTML=visibleAreas.map(a=>`<p><b>${e(a.name)}</b><br><small>Area marked complete · ${e(dateText(a.at))}</small></p>`).join('')||(areaRows.length?'<p>No recorded areas match this search.</p>':'<p>No area sign-off recorded.</p>');
  $('fmRecorded').querySelector('summary').textContent=`Recorded area sign-offs (${visibleAreas.length}${filters.query?' of '+areaRows.length:''})`;
  const covered=(model.coverage||[]).filter(p=>overview||p.source_id===filters.source);$('fmCoverage').hidden=!covered.length;$('fmCoverage').innerHTML=`<summary>Source coverage · ${covered.filter(p=>p.mapping_status==='mapped').length} of ${covered.length} map panels</summary><p>Selected source annotations are mapped. This does not mean every fence task or metre has a mapped line.</p>${covered.filter(p=>p.mapping_status==='unmapped').map(p=>`<p>${e((model.sources.find(s=>s.id===p.source_id)||{}).short_label)} · page ${p.source_page}: no defensible fence route traced.</p><button type="button" data-fmcoverage="${e(p.source_id)}" data-fmpage="${p.source_page}">Review source page →</button>`).join('')}`;
  renderDetails();adapter.requestPaint();
}
function renderDetails(){
 const box=$('fmDetails'),r=model&&model.rows.find(r=>r.id===selected),g=!r&&model&&(model.geometry.find(g=>g.id===selected)||overviewGeometry().find(g=>g.id===selected));if(!r&&!g){box.hidden=true;box.innerHTML='';return;}box.hidden=false;
 const src=model.sources.concat(model.referenceSources||[]).find(s=>s.sha256===(r?r.source_sha256:g.source_sha256)),geoms=r?r.geometry:[g];
 const shared=filters.source==='all'&&g?overviewGeometry().find(x=>x.id===g.id):null;
 const areaRecords=g&&g.role==='area-signoff'?(snapshot.areaEvidence||[]).filter(a=>a.done&&(g.area_evidence_names||[]).some(n=>C.key(n)===C.key(a.name))):[];
 const geometryNotes=[...new Set(geoms.flatMap(x=>[x.source_date_conflict,x.type_conflict,!(r&&r.conflicts.length)&&x.quantity_conflict&&x.source_geometry_note,!(r&&r.conflicts.length)&&x.kind==='stockpile'&&x.source_geometry_note,...(Array.isArray(x.source_conflicts)?x.source_conflicts.map(c=>typeof c==='string'?c:c&&typeof c==='object'?[c.description,c.resolution].filter(t=>typeof t==='string').join(' '):''):[])]).filter(note=>typeof note==='string'&&note))];
 const conflicts=r?(r.conflicts||[]).map(c=>{const id=typeof c==='string'?c:c.id;return (snapshot.conflicts||[]).find(c=>c.id===id)||c;}):[];
 const quant=r?Object.entries(r.fields).filter(([,v])=>v!=null).map(([k,v])=>`<dt>${e(k)}</dt><dd>${e(v)}</dd>`).join(''):'';
 box.innerHTML=`<h3>${e(r?r.location:g.label)}</h3><span class="fm-status">${e(r?r.status.label:areaRecords.length?'Area marked complete · fence extent unconfirmed':g.role==='coverage'?'Source-page coverage · select its plan to inspect':'Source plan · completion not linked to this run')}</span>${r?`<p>${e(r.description)}</p>`:''}
 ${areaRecords.length?`<ul>${areaRecords.map(a=>`<li>${e(a.name)} · ${e(dateText(a.at))}</li>`).join('')}</ul><p class="fm-note">Each area sign-off is retained. Neither identifies completed metres or the extent of this source line.</p>`:''}${r&&r.row_issues.length?`<p class="fm-note">${r.row_issues.map(e).join(' ')}</p>`:''}<dl>${r?`<dt>Planned day</dt><dd>${e(dateText(r.date))}</dd>`:''}${quant}<dt>Map evidence</dt><dd>${geoms.length?[...new Set(geoms.map(x=>e(x.kind==='anchor'?'Area marker only — fence line not mapped':x.kind==='workarea'?'Work area — not a measured fence run':x.kind==='stockpile'?'Stockpile — not an installed run':'Source-aligned fence line')+' · '+e(x.kind==='anchor'?'Reference point only':'Approximate source alignment')))].join('<br>'):'Location to confirm; no fence line has been guessed.'}</dd></dl>
 ${r&&r.status.area?`<p class="fm-note">Area marked complete · ${e(dateText(r.status.area.at))}. This area record does not certify this planned section or revision.</p>`:''}
 ${r&&r.note?`<p class="fm-note">${e(r.note)}</p>`:''}
 ${r&&r.requirements.length?`<b>Before work</b><ul>${r.requirements.map(x=>`<li>${e(x.text)}</li>`).join('')}</ul>`:''}
 ${geometryNotes.length?`<b>Map source notes</b><ul>${geometryNotes.map(note=>`<li>${e(note)}</li>`).join('')}</ul>`:''}
 ${conflicts.length?`<b>Needs confirmation</b><ul>${conflicts.map(c=>`<li>${e(typeof c==='string'?c:(c.description||'Source difference')+': '+(c.summary||'')+' / '+(c.detail||''))}</li>`).join('')}</ul>`:''}
 <p><small>${e(src?src.label:'Source')} · rev ${e(src?src.revision:'')} · page ${r?r.page:g.source_page}</small></p>${shared&&shared.source_refs.length>1?`<p class="fm-note">Same plotted geometry appears in ${shared.source_refs.length} source annotations. Shown once; quantities are not added.<br>${shared.source_refs.map(ref=>e((model.sources.find(s=>s.sha256===ref.sha256)||{}).label)+' · p'+ref.page).join('<br>')}</p>`:''}
 <div class="fm-actions">${g&&g.role==='coverage'?'<button data-fmshowplan>Inspect this plan</button>':''}${geoms.length?'<button data-fmzoom>Locate on map</button>':''}<button data-fmsource>Open source plan</button></div>`;
 box.querySelector('[data-fmzoom]')?.addEventListener('click',()=>locate(geoms));
 box.querySelector('[data-fmshowplan]')?.addEventListener('click',()=>switchSource(src.id));
 box.querySelector('[data-fmsource]').onclick=()=>{if(src)parentCall('gc500FencingMapSource',src.id,r?r.page:g.source_page);};
}
function revealDetails(){const box=$('fmDetails'),side=$('side');if(!box.hidden&&box.getBoundingClientRect&&side.getBoundingClientRect)side.scrollTop+=box.getBoundingClientRect().top-side.getBoundingClientRect().top-12;}
function locate(geoms){revealDetails();const b=C.bounds(geoms.flatMap(g=>g.points));if(!b)return;const pad=Math.max(12,Math.max(b[2]-b[0],b[3]-b[1])*.12);let view=[b[0]-pad,b[1]-pad,b[2]+pad,b[3]+pad];if(geoms.every(g=>g.kind==='anchor'||g.kind==='stockpile'&&g.points.length===1)){/* 200 drawing points gives roughly 140 m of local context in the current registered master; orientation only. */const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,rx=Math.max(100,(view[2]-view[0])/2),ry=Math.max(100,(view[3]-view[1])/2);view=[cx-rx,cy-ry,cx+rx,cy+ry];}adapter.goto(view,'Fencing · selected work');if(matchMedia('(max-width:900px)').matches)adapter.panel(false);}
function choose(id,zoom){selected=id;render();revealDetails();const r=model.rows.find(r=>r.id===id),g=model.geometry.find(g=>g.id===id)||overviewGeometry().find(g=>g.id===id);if(zoom)locate(r?r.geometry:g?[g]:[]);}
function visibleGeometry(){
 if(!model||!model.masterValid)return[];
 if(filters.source==='all')return [...overviewGeometry(),...areaMarkers()];
 const rs=rows(),ids=new Set(rs.map(r=>r.id));return [...model.geometry.filter(g=>g.role!=='area-signoff'&&(g.task_ids.some(id=>ids.has(id))&&geometryMatches(g,rs.find(r=>g.task_ids.includes(r.id)))||library().some(x=>x.id===g.id))),...areaMarkers()];
}
function paint(frame){
 if(overlay.width!==frame.width)overlay.width=frame.width;if(overlay.height!==frame.height)overlay.height=frame.height;
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);hits=[];drawGeometry(ctx,frame,true);
}
function drawGeometry(ctx,frame,picking){
 if(!active||!model)return;
 const ratio=frame.dpr;
 for(const g of visibleGeometry()){
  const pts=g.points.map(p=>frame.project(p,g.region));if(!pts.length)continue;
  const row=model.rows.find(r=>g.task_ids.includes(r.id));const complete=row&&row.status.state==='complete';
  const picked=selected===g.id||g.task_ids.includes(selected);const col=g.role==='area-signoff'||complete?'#40db9a':g.role==='coverage'?'#f6be7b':colour[g.category||'unclassified'];
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=(picked?5:3)*ratio;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(complete?[]:[7*ratio,5*ratio]);
  if(g.kind==='anchor'||g.kind==='stockpile'&&pts.length===1){const[x,y]=pts[0];ctx.setLineDash([]);ctx.fillStyle='#151b20';ctx.beginPath();ctx.arc(x,y,(picked?9:7)*ratio,0,Math.PI*2);ctx.fill();ctx.stroke();}
  else{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(g.kind==='workarea'){ctx.closePath();ctx.fillStyle=col+'20';ctx.fill();}ctx.stroke();}
  if(g.role==='area-signoff'&&picked||g.role==='coverage'){ctx.setLineDash([]);ctx.font=`700 ${11*ratio}px system-ui`;ctx.fillStyle=col;ctx.fillText(g.role==='area-signoff'?'Area ✓':'p'+g.source_page,pts[0][0]+12*ratio,pts[0][1]+4*ratio);}
  ctx.restore();if(picking)hits.push({id:row?row.id:g.id,points:pts,kind:g.kind});
 }
}
function nearSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
function tap(ev){if(!active||!pointer||Math.hypot(ev.clientX-pointer.x,ev.clientY-pointer.y)>6){pointer=null;return;}pointer=null;const b=overlay.getBoundingClientRect(),ratio=overlay.width/b.width,p=[(ev.clientX-b.left)*ratio,(ev.clientY-b.top)*ratio];let best=null,dist=12*ratio;
 for(const h of hits){const ps=h.points;let d=ps.length===1?Math.hypot(p[0]-ps[0][0],p[1]-ps[0][1]):Infinity;for(let i=1;i<ps.length;i++)d=Math.min(d,nearSegment(p,ps[i-1],ps[i]));if(h.kind==='workarea')d=Math.min(d,nearSegment(p,ps[ps.length-1],ps[0]));if(d<dist){dist=d;best=h;}}
 if(best){ev.preventDefault();ev.stopImmediatePropagation();choose(best.id,false);adapter.panel(true);}
}
function setActive(on,id){
 if(on===active){if(on){refresh(true);if(id)choose(id,true);}return;}
 active=on;document.body.classList.toggle('fencing-map',on);$('navBtn').textContent=on?'Tasks':'Find';$('navBtn').setAttribute('aria-label',on?'Open fencing tasks':'Find a reference or adjust the map');button.setAttribute('aria-pressed',String(on));clearTimeout(timer);timer=0;
 if(on){hostVisible=parentCall('gc500FencingMapIsActive')!==false;previousMode=A.state.mode;if(A.mode3d)A.mode3d(false);adapter.clearSelection();adapter.setMode('satellite');$('fmPlan').checked=false;adapter.panel(true);refresh(true);if(id&&model)choose(id,true);schedule();}
 else{if(previousMode)adapter.setMode(previousMode);adapter.requestPaint();}
}
function schedule(){clearTimeout(timer);timer=0;if(active&&hostVisible&&!document.hidden)timer=setTimeout(()=>{hostVisible=parentCall('gc500FencingMapIsActive')!==false;refresh(false);schedule();},4000);}
button.onclick=()=>setActive(!active);
panel.querySelectorAll('[data-fmtype]').forEach(b=>b.onclick=()=>{const all=Object.keys(names),k=b.dataset.fmtype;let chosen=filters.types.length?filters.types.filter(k=>all.includes(k)):[...all];chosen=chosen.includes(k)?chosen.filter(t=>t!==k):chosen.concat(k);filters.types=all.every(k=>chosen.includes(k))?[]:chosen.length?chosen:['__none'];selected=null;panel.querySelectorAll('[data-fmtype]').forEach(x=>x.setAttribute('aria-pressed',String(!filters.types.length||filters.types.includes(x.dataset.fmtype))));render();});
function switchSource(id){filters.source=id;$('fmSource').value=id;filters.day='';selected=null;updateDays();render();}
$('fmSource').onchange=()=>switchSource($('fmSource').value);
$('fmDay').onchange=()=>{filters.day=$('fmDay').value;selected=null;render();};$('fmStatus').onchange=()=>{filters.status=$('fmStatus').value;selected=null;render();};$('fmQuery').oninput=()=>{filters.query=$('fmQuery').value;selected=null;render();};
$('fmSourceLines').onchange=render;
$('fmPlan').onchange=()=>adapter.setMode($('fmPlan').checked?'hybrid':'satellite');
$('fmCoverage').onclick=ev=>{const b=ev.target.closest('[data-fmcoverage]');if(b)parentCall('gc500FencingMapSource',b.dataset.fmcoverage,Number(b.dataset.fmpage));};
$('fmRegister').onclick=()=>parentCall('gc500FencingMapRegister');$('fmList').onclick=ev=>{const b=ev.target.closest('[data-fmrow]'),sw=ev.target.closest('[data-fmswitch]');if(b)choose(b.dataset.fmrow,false);else if(sw)switchSource(sw.dataset.fmswitch);};
$('stage').addEventListener('pointerdown',ev=>{pointer=ev.isPrimary?{x:ev.clientX,y:ev.clientY}:null;},{capture:true});$('stage').addEventListener('pointerup',tap,{capture:true});$('stage').addEventListener('pointercancel',()=>{pointer=null;});
document.querySelector('.modes').addEventListener('click',()=>{if(active)setActive(false);},true);
document.addEventListener('keydown',ev=>{if(active&&/^[1234]$/.test(ev.key)&&!/input|select|textarea/i.test(ev.target.tagName))setActive(false);},true);
document.addEventListener('visibilitychange',()=>{clearTimeout(timer);timer=0;if(active&&!document.hidden){refresh(true);schedule();}});
window.addEventListener('pagehide',()=>{clearTimeout(timer);timer=0;});
A.ready.then(()=>{if(active){adapter.setMode($('fmPlan').checked?'hybrid':'satellite');refresh(true);}});
window.GC500FencingMap=Object.freeze({open:id=>setActive(true,id),close:()=>setActive(false),setHostVisible:on=>{hostVisible=!!on;clearTimeout(timer);timer=0;if(active&&hostVisible){refresh(true);schedule();}},refresh:()=>refresh(true),paint,exportLayer:(ctx,frame)=>{
 if(!active)return;drawGeometry(ctx,frame,false);ctx.save();ctx.setTransform(1,0,0,1,0,0);
 const ratio=frame.dpr,pad=12*ratio,lineHeight=21*ratio;ctx.font=`600 ${13*ratio}px system-ui`;
 const src=source(),scope=src?src.label+' · revision '+src.revision:'All source plans · multiple dates · planned / historical routes, not installed or additive totals';
 const paragraphs=['GC500 fencing · '+scope,'Green area markers: recorded area sign-offs only. Source-aligned for orientation, not set-out.'];
 const lines=[];for(const paragraph of paragraphs){let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>frame.width-pad*2){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);}
 ctx.fillStyle='#151b20';ctx.fillRect(0,0,frame.width,(lines.length+0.6)*lineHeight);ctx.fillStyle='#f6d4b5';lines.forEach((line,i)=>ctx.fillText(line,pad,(i+1)*lineHeight));ctx.restore();
},get state(){return{active,hostVisible,refreshPending:!!timer,source:filters.source,selected,stats:model?C.stats(rows()):null,rejected:model?model.rejected:[],geometryVisible:visibleGeometry().length};}});
})();
