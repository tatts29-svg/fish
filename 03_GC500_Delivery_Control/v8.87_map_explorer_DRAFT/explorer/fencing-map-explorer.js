/* Author: Andrew Fisher. Read-only area relationships; no geometry, completion or cost allocation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC500FencingTrace837=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const list=x=>Array.isArray(x)?x:[],own=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k),hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const key=r=>JSON.stringify([r.book||'red',String(r.record_id||r.id||''),String(r.docket_no||'')]);
const canonical=x=>x==null?'null':Array.isArray(x)?'['+x.map(canonical).join(',')+']':typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const amount=n=>typeof n==='number'&&Number.isFinite(n)?n:null;
function documentState(proof,sources,files){
 if(!proof||typeof proof!=='object')return 'Source proof is missing';
 const matches=list(sources).filter(s=>s.id===proof.source_id);
 if(matches.length!==1)return 'Source identity needs review';
 const source=matches[0];
 if(!hash(proof.sha256)||source.sha256!==proof.sha256||!Number.isInteger(source.pages)||source.pages<1||!Number.isInteger(proof.page)||proof.page<1||proof.page>source.pages)return 'Source page or fingerprint changed';
 const f=own(files,source.id)?files[source.id]:null;
 if(!f||!hash(f.sha256))return 'Source links unavailable';
 return f.sha256===source.sha256?null:'Linked source file changed';
}
function money(record){
 const book=record.book||'red';
 if(book==='blue')return {supplier:null,revenue:null,supplier_state:'Counts only',revenue_state:'No automatic charge or credit'};
 if(book==='green')return {supplier:amount(record.cost),revenue:null,supplier_state:amount(record.cost)==null?'Rate not recorded':'Supplier labour estimate',revenue_state:'Cost only; no separate customer labour charge'};
 const total=(state,value,line)=>state==='priced'?amount(value):state==='partly priced'&&list(record.lines).some(l=>amount(l[line])!=null)?amount(value):null;
 return {supplier:total(record.paid_state,record.paid_total,'paid'),revenue:total(record.cost_state,record.cost_total,'cost'),supplier_state:record.paid_state||'Rate basis unavailable',revenue_state:record.cost_state||'Rate basis unavailable',supplier_unpriced:list(record.paid_unpriced).slice(),revenue_unpriced:list(record.unpriced).slice()};
}
function commercial(input,context,trace){
 const data=input.commercial,result={groups:[],additional:[]};if(!data||data.schema!==1)return result;
 const all=list(data.groups).flatMap(g=>list(g.allocations)).concat(list(data.additional)),counts=new Map();
 for(const a of all)for(const line of list(a.lines))counts.set(line.line_id,(counts.get(line.line_id)||0)+1);
 function allocation(a){
  let reason=documentState(a.source,input.sources,context.files);
  if(!Number.isSafeInteger(a.amount_cents)||!list(a.lines).length||a.lines.some(l=>!Number.isSafeInteger(l.amount_cents)||counts.get(l.line_id)!==1)||a.lines.reduce((s,l)=>s+l.amount_cents,0)!==a.amount_cents)reason='Supplier charge lines need review';
  if(!a.unallocated&&!list(a.records).length||a.unallocated&&list(a.records).length)reason='Supplier allocation identity needs review';
  for(const ref of list(a.records).concat(list(a.parents))){
   const row=trace.rows.find(r=>r.key===key(ref)),review=(context.reviews||{})[key(ref)];
   if(!row||row.state!=='current'||!review||review.state!=='current')reason='Supplier allocation record needs review';
   if(list(a.records).some(r=>key(r)===key(ref))&&(!review||!review.po||review.po.number!==a.number))reason='Supplier allocation P/O association changed';
  }
  if(a.parent_source)reason=reason||documentState(a.parent_source,input.sources,context.files);
  return {...a,state:reason?'unavailable':'current',reason,amount_cents:reason?null:a.amount_cents,link:!reason&&(context.sourceLinks||{})[a.source.source_id]||null};
 }
 for(const group of list(data.groups)){
  const allocations=list(group.allocations).map(allocation);
  let reason=documentState(group.source,input.sources,context.files);
  if(!Number.isSafeInteger(group.total_cents)||allocations.some(a=>a.state!=='current'||canonical(a.source)!==canonical(group.source)||a.number!==group.number||a.supplier!==group.supplier)||allocations.reduce((s,a)=>s+(a.amount_cents||0),0)!==group.total_cents)reason=reason||'Supplier allocation and residual need review';
  const pos=list(context.purchaseOrders).filter(p=>String(p.number)===group.number),po=pos.length===1?pos[0]:null;
  result.groups.push({...group,allocations,state:reason?'unavailable':'current',reason,total_cents:reason?null:group.total_cents,link:!reason&&(context.sourceLinks||{})[group.source.source_id]||null,native_amount:po?amount(po.amount):null,native_comparison:pos.length>1?'P/O identity is ambiguous':po&&po.supplier_code!==group.supplier?'Recorded supplier differs or is not confirmed':null,native_match:!reason&&po&&po.supplier_code===group.supplier&&amount(po.amount)!=null?Math.round(po.amount*100)===group.total_cents:null});
 }
 result.additional=list(data.additional).map(allocation);return result;
}
function model(input,context){
 const output={schema:1,areas:[],rows:[],relations:[],unmapped:[],orders:[],allocation:'not allocated'};
 if(!input||input.schema!==1||!context)return output;
 const areas=list(input.areas),records=list(context.records),sources=list(input.sources),canon=context.canonical||canonical;
 for(const a of areas){
  let reason=null;
  const gs=list(context.geometry).filter(g=>g.id===a.geometry_id),plans=list(context.sources).filter(s=>s.id===a.source_id);
  if(areas.filter(x=>x.id===a.id).length!==1||gs.length!==1||plans.length!==1)reason='Map identity needs review';
  else if(input.master_sha256!==context.master_sha256||a.master_sha256!==context.master_sha256||a.scope!=='area')reason='Map source or area scope changed';
  else {
   const g=gs[0],p=plans[0],projection=Object.fromEntries(Object.keys(a.expected_geometry||{}).map(k=>[k,g[k]]));
   if(canon(projection)!==canon(a.expected_geometry)||p.sha256!==a.source_sha256||p.revision!==a.source_revision||g.source_sha256!==a.source_sha256||g.source_page!==a.source_page)reason='Map annotation or source revision changed';
   else reason=documentState({source_id:p.document_file,sha256:p.sha256,page:a.source_page},sources,context.files);
  }
  output.areas.push({id:a.id,geometry_id:a.geometry_id,label:a.label,scope:'area',state:reason?'unavailable':'current',reason,basis:a.basis});
 }
 const orders=new Map();
 for(const row of list(input.rows)){
  const k=key(row),matches=records.filter(d=>String(d.id||'')===row.record_id||String(d.docket_no||'')===row.docket_no),duplicates=input.rows.filter(x=>x.record_id===row.record_id||x.docket_no===row.docket_no);
  let reason=null,record=null;
  if(matches.length!==1||duplicates.length!==1)reason='Docket identity is not unique';
  else {record=matches[0];if(key(record)!==k)reason='Docket identity changed';}
  if(!reason){const expected=row.expected||{},current=Object.fromEntries(Object.keys(expected).map(f=>[f,record[f]]));if(!Object.keys(expected).length||canon(expected)!==canon(current))reason='Recorded work changed since the area review';}
  const review=(context.reviews||{})[k]||{state:'none'};
  if(!reason&&['stale','ambiguous'].includes(review.state))reason='Docket source review needs updating';
  if(!reason){for(const proof of list(row.evidence)){reason=documentState(proof,sources,context.files);if(reason)break;}if(!row.evidence||!row.evidence.length)reason='Original source proof is missing';}
  const linked=list(row.area_ids).map(id=>output.areas.find(a=>a.id===id)).filter(Boolean);
  if(!reason&&(linked.length!==list(row.area_ids).length||linked.some(a=>a.state!=='current')))reason='Reviewed area link is unavailable';
  const result={key:k,record_id:row.record_id,docket_no:row.docket_no,book:row.book,state:reason?'unavailable':'current',reason,area_ids:list(row.area_ids).slice(),activity:row.activity,basis:row.basis,location:record&&record.location||row.location_as_written,date:record&&record.date||null,scope:'area',money:reason?null:money(record),review_state:review.state,query:review.state==='current'?review.query:null,po:null,links:list((context.links||{})[k]).filter(x=>!reason||x.kind==='original').map(x=>({...x}))};
  if(!reason&&review.state==='current'&&review.po){
   const no=review.po.number,poss=list(context.purchaseOrders).filter(p=>String(p.number)===no),po=poss.length===1?poss[0]:null,group=(po&&(po.supplier_code||po.supplier_name)||'supplier')+':'+no;
   result.po=group;
   if(!orders.has(group))orders.set(group,{key:group,number:no,association_basis:'source_summary',amount_basis:'native_po_record',supplier:po&&(po.supplier_name||po.supplier_code)||null,amount:po?amount(po.amount):null,invoice_no:po&&po.invoice_no||null,confirmed:!!(po&&po.confirmed),payment:'unknown',record_keys:[],area_ids:[]});
   const order=orders.get(group);order.record_keys.push(k);order.area_ids.push(...result.area_ids);
  }
  output.rows.push(result);
 }
 for(const order of orders.values()){order.record_keys=[...new Set(order.record_keys)];order.area_ids=[...new Set(order.area_ids)];output.orders.push(order);}
 output.relations=list(input.relations).filter(r=>output.rows.some(x=>x.record_id===r.child_record_id&&x.state==='current')&&output.rows.some(x=>x.record_id===r.parent_record_id&&x.state==='current')&&list(r.evidence).length&&r.evidence.every(p=>!documentState(p,sources,context.files))&&['child','parent'].every(which=>{const record=records.find(d=>d.id===r[which+'_record_id']),expected=r['expected_'+which];return record&&expected&&canon(Object.fromEntries(Object.keys(expected).map(f=>[f,record[f]])))===canon(expected);})).map(r=>({...r,evidence:undefined}));
 output.unmapped=list(input.unmapped).map(u=>{const matches=records.filter(r=>key(r)===key(u));return matches.length===1?{...u,key:key(u),location:matches[0].location||'Location not recorded'}:null;}).filter(Boolean);
 output.commercial=commercial(input,context,output);
 return output;
}
function selection(trace,geometryIds){
 const ids=new Set(list(geometryIds)),areas=list(trace&&trace.areas).filter(a=>ids.has(a.geometry_id)),areaIds=new Set(areas.map(a=>a.id));
 const rows=list(trace&&trace.rows).filter(r=>r.area_ids.some(id=>areaIds.has(id))),keys=new Set(rows.map(r=>r.key));
 return {areas,rows:[...new Map(rows.map(r=>[r.key,r])).values()],orders:list(trace&&trace.orders).filter(p=>p.record_keys.some(k=>keys.has(k))),relations:list(trace&&trace.relations).filter(r=>rows.some(x=>x.record_id===r.child_record_id||x.record_id===r.parent_record_id)),commercial:{groups:list(trace&&trace.commercial&&trace.commercial.groups).filter(g=>g.allocations.some(a=>a.records.some(r=>keys.has(key(r))))),additional:list(trace&&trace.commercial&&trace.commercial.additional).filter(a=>a.records.some(r=>keys.has(key(r))))},allocation:'not allocated'};
}
return {key,canonical,documentState,money,commercial,model,selection};
});

/* Author: Andrew Fisher. Existing map detail styling, explicit commercial bases. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC500FencingTraceView837=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=n=>typeof n==='number'&&Number.isFinite(n)?new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n):'Not priced';
const rateText=(value,state)=>value==null&&state==='nothing to price'?'No current priced lines':cash(value);
const safeLink=s=>{try{const u=new URL(s);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password&&(typeof location==='undefined'||u.origin===location.origin);}catch(_){return false;}};
const activity={install:'Installation',additional_bracing:'Additional bracing',relocate:'Relocation',remove:'Removal',collect:'Collection',stockpile:'Stockpile',service:'Service',unknown:'Recorded work'};
function rowHtml(row){
 const heading=`<h4>${e(activity[row.activity]||'Recorded work')} · ${e(row.docket_no)}</h4><p><small>${e(row.date||'Date not recorded')} · ${e(row.location)}</small></p>`;
 const button=`<button type="button" data-fmtrace-record="${e(row.key)}">Open docket ${e(row.docket_no)} →</button>`;
 if(row.state!=='current')return `<article class="fm-trace-row837">${heading}<p class="fm-note">Association needs review. ${e(row.reason)}</p><div class="fm-actions">${button}${(row.links||[]).filter(l=>l.kind==='original'&&safeLink(l.url)).map(l=>`<a href="${e(l.url)}" target="_blank" rel="noopener noreferrer">${e(l.label)}</a>`).join('')}</div></article>`;
 const m=row.money||{},basis=row.book==='blue'?'<p>Collection counts only. No automatic charge or credit.</p>':`<dl><dt>Supplier estimate</dt><dd>${rateText(m.supplier,m.supplier_state)}${m.supplier_state==='partly priced'&&m.supplier!=null?' · known subtotal; some rates missing':''}</dd>${row.book==='red'?`<dt>Customer Revenue</dt><dd>${rateText(m.revenue,m.revenue_state)}${m.revenue_state==='partly priced'&&m.revenue!=null?' · known subtotal; some rates missing':''}</dd>`:'<dd>Cost only; no separate customer labour charge.</dd>'}</dl>`;
 return `<article class="fm-trace-row837">${heading}${basis}${row.query&&row.query.open?`<p><b>Charges: query open.</b> ${e(row.query.text)}</p>`:''}<div class="fm-actions">${button}</div><details><summary>Source and charge basis</summary><p>${e(row.basis)}</p><div class="fm-actions">${(row.links||[]).filter(l=>safeLink(l.url)).map(l=>`<a href="${e(l.url)}" target="_blank" rel="noopener noreferrer">${e(l.label)}</a>`).join('')}</div></details>${row.po?'':'<p><small>No current reviewed P/O association.</small></p>'}</article>`;
}
function allocationHtml(a){
 if(a.state!=='current')return `<p class="fm-note">Supplier source allocation needs review. ${e(a.reason)}</p>`;
 return `<div class="fm-trace-allocation837"><b>${e(a.label)} · ${cash(a.amount_cents/100)}</b><small>${a.unallocated?'Unnumbered source activity · not allocated to a docket':'Supplier-summary area allocation'}</small><details><summary>Source lines and scope</summary><p>${e(a.note)}</p><dl>${a.lines.map(l=>`<dt>${e(l.category)} · ${e(l.quantity)} ${e(l.unit)}</dt><dd>${cash(l.amount_cents/100)}</dd>`).join('')}</dl><div class="fm-actions">${a.records.map(r=>`<button type="button" data-fmtrace-record="${e(JSON.stringify([r.book,r.record_id,r.docket_no]))}">Open docket ${e(r.docket_no)} →</button>`).join('')}${a.link&&safeLink(a.link.url)?`<a href="${e(a.link.url)}" target="_blank" rel="noopener noreferrer">Open supplier summary</a>`:''}</div></details></div>`;
}
function groupHtml(group){
 if(!group)return '';
 if(group.state!=='current')return `<p class="fm-note">Supplier-summary allocation needs review. ${e(group.reason)}</p>`;
 return `<details class="fm-trace-allocation837"><summary>Supplier summary allocation${group.native_match===true?' · matches recorded P/O total':''}</summary>${group.native_match!==true?`<p>Supplier summary total: <b>${cash(group.total_cents/100)}</b>${group.native_comparison?' · '+e(group.native_comparison):group.native_match===false?' · differs from the recorded P/O amount':''}.</p>`:''}${group.allocations.map(allocationHtml).join('')}<p><small>Source allocations include any unnumbered residual. They are an alternative charge basis, not an addition to the P/O or docket estimates.</small></p></details>`;
}
function orderHtml(order,group){
 return `<article class="fm-trace-order837"><h4>P/O ${e(order.number)} · shared order</h4><p>Association from the reviewed supplier summary. Covers ${order.record_keys.length} linked record${order.record_keys.length===1?'':'s'}${order.area_ids.length?' across '+order.area_ids.length+' reviewed area'+(order.area_ids.length===1?'':'s'):''}; the whole order can also cover other work.</p><dl><dt>Shared P/O total · recorded</dt><dd>${order.amount==null?'Amount not recorded':cash(order.amount)}</dd>${order.invoice_no?`<dt>Invoice reference recorded on P/O</dt><dd>${e(order.invoice_no)}</dd>`:''}</dl>${groupHtml(group)}</article>`;
}
function details(selection){
 if(!selection)return '';
 if(!selection.areas.length&&!selection.rows.length)return '<section class="fm-trace837"><h4>Recorded work and charges</h4><p>No reviewed docket association for this source section. Other work in the same vicinity is not inferred.</p></section>';
 return `<section class="fm-trace837"><h4>Recorded work and charges</h4><p>Area links show recorded work. Amounts cover whole dockets, not a measured fence line.</p>${selection.areas.filter(a=>a.state!=='current').map(a=>`<p class="fm-note">${e(a.label)}: ${e(a.reason)}</p>`).join('')}${selection.rows.map(rowHtml).join('')}${selection.relations.map(r=>`<p class="fm-note">${e(r.basis)}</p>`).join('')}${selection.orders.length?'<h4>Shared purchase orders</h4>'+selection.orders.map(o=>orderHtml(o,(selection.commercial&&selection.commercial.groups||[]).find(g=>g.number===o.number))).join('')+'<p class="fm-note">Order totals shown once; not added to docket estimates. Payment not confirmed.</p>':''}${selection.commercial&&selection.commercial.additional.length?'<h4>Supplier summary adjustment</h4>'+selection.commercial.additional.map(allocationHtml).join(''):''}</section>`;
}
function recordCommercial(trace,recordKey){
 const record=(trace&&trace.rows||[]).find(r=>r.key===recordKey);if(!record||record.state!=='current')return '';
 const owns=a=>(a.records||[]).some(r=>JSON.stringify([r.book,r.record_id,r.docket_no])===recordKey),commercial=trace.commercial||{},groups=(commercial.groups||[]).filter(g=>g.allocations.some(owns)),additional=(commercial.additional||[]).filter(owns);
 if(!groups.length&&!additional.length)return '';
 return `<div class="fp-review-detail fp-trace-commercial837"><details><summary>Supplier summary and shared P/O</summary>${groups.map(g=>{const orders=(trace.orders||[]).filter(o=>o.number===g.number);return orders.length===1?orderHtml(orders[0],g):`<h4>P/O ${e(g.number)} · supplier summary</h4>${groupHtml(g)}`;}).join('')}${additional.map(allocationHtml).join('')}<p>Order totals are shared; they are not added to docket estimates. Payment not confirmed.</p></details></div>`;
}
function areas(trace,query=''){
 const used=new Set((trace&&trace.rows||[]).filter(r=>r.state==='current').flatMap(r=>r.area_ids)),q=String(query).trim().toLowerCase();
 const rows=(trace&&trace.areas||[]).filter(a=>a.state==='current'&&used.has(a.id)&&(!q||String(a.label).toLowerCase().includes(q)));if(!rows.length)return '';
 return `<details class="fm-trace-areas837"><summary>Recorded work by area (${rows.length})</summary><p>Open a reviewed area to see its dockets and charges. An area link does not identify the exact fence line.</p>${rows.map(a=>`<button type="button" data-fmtrace-area="${e(a.geometry_id)}"><b>${e(a.label)}</b><small>Recorded work · area association</small></button>`).join('')}</details>`;
}
function unmapped(trace){
 const rows=trace&&trace.unmapped||[];if(!rows.length)return '';
 return `<details class="fm-unmapped837"><summary>Location not mapped (${rows.length})</summary><p>These records have no reviewed area location. No point or fence line has been guessed.</p>${rows.map(r=>`<button type="button" data-fmtrace-record="${e(r.key)}"><b>${e(r.docket_no||r.record_id)} · ${e(r.location)}</b><small>${e(r.reason)}</small></button>`).join('')}</details>`;
}
return {details,recordCommercial,areas,unmapped,rowHtml,orderHtml,groupHtml,allocationHtml};
});

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
let visCache=null,overlayDrawn=false,fcard=null;  /* v8.87 - the geometry on the map, worked out once per change; the phone's fencing card */
let filters={source:'all',day:'',status:'all',query:'',types:[]};
const button=document.createElement('button');button.id='fenceMode';button.textContent='Fencing';button.setAttribute('aria-pressed','false');button.setAttribute('aria-controls','fencePanel');
$('navBtn').insertAdjacentElement('afterend',button);
const panel=document.createElement('section');panel.id='fencePanel';panel.setAttribute('aria-label','Fencing plan and recorded progress');
panel.innerHTML=`<p class="fm-kicker">GC500 · SITE WORKS</p><h2>Fencing</h2><p>Fence runs, work areas and recorded progress.</p>
<label for="fmSource">Plan source</label><select id="fmSource"></select>
<div class="fm-grid"><div><label for="fmDay">Work day</label><select id="fmDay"><option value="">All days</option></select></div><div><label for="fmStatus">Show</label><select id="fmStatus"><option value="all">All work</option><option value="unmapped">Location to confirm</option><option value="complete">Section complete</option><option value="area">Areas marked complete</option><option value="confirm">Quantity to confirm</option><option value="hold">Prerequisites</option></select></div></div>
<label for="fmQuery">Find a work area</label><input id="fmQuery" type="search" autocomplete="off" placeholder="Park, grandstand or work…">
<div class="fm-types" aria-label="Fence type">${Object.keys(names).map(k=>`<button data-fmtype="${k}" style="--fence-type:${colour[k]}" aria-pressed="true">${names[k]}</button>`).join('')}</div>
<div class="fm-legend"><span class="fm-planned">Planned run</span><span class="fm-complete">Section complete</span><span class="fm-area">Area sign-off</span><span class="fm-recorded-work">Recorded work</span></div><p id="fmOverviewHelp">A green area marker is a recorded area sign-off, not a completed fence line.</p>
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
  let next;try{next=C.model(incoming,adapter.masterHash());}catch(_){snapshotKey='';model=null;selected=null;visCache=null;$('fmAlert').hidden=false;$('fmAlert').textContent='Fencing data could not be read. Reopen the map to retry or consult the source plan.';$('fmList').innerHTML='';$('fmDetails').hidden=true;$('fmSummary').textContent='Map data unavailable';adapter.requestPaint();return;}
  snapshotKey=signature;snapshot={...incoming,areaEvidence:Array.isArray(incoming.areaEvidence)?incoming.areaEvidence.filter(x=>x&&typeof x==='object'):[],conflicts:Array.isArray(incoming.conflicts)?incoming.conflicts.filter(x=>x&&typeof x==='object'):[]};model=next;visCache=null;
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
 const trace=snapshot.trace||{},used=new Set((trace.rows||[]).filter(r=>r.state==='current').flatMap(r=>r.area_ids)),reviewed=new Set((trace.areas||[]).filter(a=>a.state==='current'&&used.has(a.id)).map(a=>a.geometry_id));
 return model.geometry.filter(g=>g.role==='area-signoff'&&(filters.source==='all'||g.source_sha256===(source()||{}).sha256)).map(g=>({...g,traceRecorded:reviewed.has(g.id),areaRecords:(snapshot.areaEvidence||[]).filter(a=>a.done&&(g.area_evidence_names||[]).some(n=>C.key(n)===C.key(a.name)))})).filter(g=>(g.areaRecords.length||filters.status==='all'&&g.traceRecorded)&&(!filters.query||C.key(g.label).includes(C.key(filters.query))));
}
function render(){
  visCache=null;if(!model)return;const rs=rows(),s=C.stats(rs),src=source(),overview=filters.source==='all';
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
  $('fmList').insertAdjacentHTML('beforeend',window.GC500FencingTraceView837.areas(snapshot.trace,filters.query)+window.GC500FencingTraceView837.unmapped(snapshot.trace));
  renderDetails();if(fcard&&!fcard.hidden)fenceCard(selected);adapter.requestPaint();
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
 box.insertAdjacentHTML('beforeend',window.GC500FencingTraceView837.details(window.GC500FencingTrace837.selection(snapshot.trace,geoms.map(g=>g.id))));
 box.querySelectorAll('[data-fmtrace-record]').forEach(b=>b.onclick=()=>{if(parentCall('gc500FencingTraceDocket837',b.dataset.fmtraceRecord)!==true)adapter.toast('This record is unavailable. Reopen the fencing register to check it.');});
 box.querySelector('[data-fmzoom]')?.addEventListener('click',()=>locate(geoms));
 box.querySelector('[data-fmshowplan]')?.addEventListener('click',()=>switchSource(src.id));
 box.querySelector('[data-fmsource]').onclick=()=>{if(src)parentCall('gc500FencingMapSource',src.id,r?r.page:g.source_page);};
}
function revealDetails(){const box=$('fmDetails'),side=$('side');if(!box.hidden&&box.getBoundingClientRect&&side.getBoundingClientRect)side.scrollTop+=box.getBoundingClientRect().top-side.getBoundingClientRect().top-12;}
function locate(geoms){revealDetails();const b=C.bounds(geoms.flatMap(g=>g.points));if(!b)return;const pad=Math.max(12,Math.max(b[2]-b[0],b[3]-b[1])*.12);let view=[b[0]-pad,b[1]-pad,b[2]+pad,b[3]+pad];if(geoms.every(g=>g.kind==='anchor'||g.kind==='stockpile'&&g.points.length===1)){/* 200 drawing points gives roughly 140 m of local context in the current registered master; orientation only. */const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,rx=Math.max(100,(view[2]-view[0])/2),ry=Math.max(100,(view[3]-view[1])/2);view=[cx-rx,cy-ry,cx+rx,cy+ry];}adapter.goto(view,'Fencing · selected work');if(matchMedia('(max-width:900px)').matches)adapter.panel(false);}
function choose(id,zoom){selected=id;render();revealDetails();const r=model.rows.find(r=>r.id===id),g=model.geometry.find(g=>g.id===id)||overviewGeometry().find(g=>g.id===id);if(zoom)locate(r?r.geometry:g?[g]:[]);}
function visibleGeometryNow(){
 if(!model||!model.masterValid)return[];
 if(filters.source==='all')return [...overviewGeometry(),...areaMarkers()];
 const rs=rows(),ids=new Set(rs.map(r=>r.id)),lib=new Set(library().map(x=>x.id));return [...model.geometry.filter(g=>g.role!=='area-signoff'&&(g.task_ids.some(id=>ids.has(id))&&geometryMatches(g,rs.find(r=>g.task_ids.includes(r.id)))||lib.has(g.id))),...areaMarkers()];
}
/* v8.87 - THE GEOMETRY ON THE MAP IS WORKED OUT ONCE, NOT EVERY FRAME. It used to be rebuilt (filters, the duplicate check that turns
   every line into text twice, the task lookups) on every frame of a pan or a zoom, Fencing on or off. Now it is kept until a filter,
   a selection or the data changes (render and refresh clear it), with each line's task, colour and bounds worked out with it. */
function visibleGeometry(){
 if(visCache)return visCache.list;
 const list=visibleGeometryNow(),drawn=list.map(g=>{const row=model.rows.find(r=>g.task_ids.includes(r.id))||null,complete=!!(row&&row.status.state==='complete');
  const col=g.role==='area-signoff'?(g.areaRecords&&g.areaRecords.length?'#40db9a':'#ffad64'):complete?'#40db9a':g.role==='coverage'?'#f6be7b':colour[g.category||'unclassified'];
  return {g,row,complete,col,bounds:g.bounds||C.bounds(g.points)};});
 visCache={list,drawn};return list;
}
function drawnGeometry(){visibleGeometry();return visCache?visCache.drawn:[];}
function clearOverlay(){hits=[];if(!overlayDrawn)return;overlayDrawn=false;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);}
function paint(frame){
 if(!active||!model){clearOverlay();return;}
 if(overlay.width!==frame.width)overlay.width=frame.width;if(overlay.height!==frame.height)overlay.height=frame.height;
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);hits=[];drawGeometry(ctx,frame,true);overlayDrawn=true;
}
function drawGeometry(ctx,frame,picking){
 if(!active||!model)return;
 const ratio=frame.dpr,W=frame.width,H=frame.height,margin=130*ratio;
 for(const d of drawnGeometry()){
  const g=d.g,b=d.bounds;
  if(b){const c=[frame.project([b[0],b[1]],g.region),frame.project([b[2],b[1]],g.region),frame.project([b[0],b[3]],g.region),frame.project([b[2],b[3]],g.region)];let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const q of c){if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1];}if(x1<-margin||y1<-margin||x0>W+margin||y0>H+margin)continue;}  /* v8.87 - off the screen: not drawn, not a hit */
  const pts=g.points.map(p=>frame.project(p,g.region));if(!pts.length)continue;
  const row=d.row,complete=d.complete;
  const picked=selected===g.id||g.task_ids.includes(selected),col=d.col;
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=(picked?5:3)*ratio;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(complete?[]:[7*ratio,5*ratio]);
  if(g.kind==='anchor'||g.kind==='stockpile'&&pts.length===1){const[x,y]=pts[0];ctx.setLineDash([]);ctx.fillStyle='#151b20';ctx.beginPath();ctx.arc(x,y,(picked?9:7)*ratio,0,Math.PI*2);ctx.fill();ctx.stroke();}
  else{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(g.kind==='workarea'){ctx.closePath();ctx.fillStyle=col+'20';ctx.fill();}ctx.stroke();}
  if(g.role==='area-signoff'&&picked||g.role==='coverage'){ctx.setLineDash([]);ctx.font=`700 ${11*ratio}px system-ui`;ctx.fillStyle=col;ctx.fillText(g.role==='area-signoff'?(g.areaRecords&&g.areaRecords.length?'Area ✓':'Recorded work'):'p'+g.source_page,pts[0][0]+12*ratio,pts[0][1]+4*ratio);}
  ctx.restore();if(picking)hits.push({id:row?row.id:g.id,points:pts,kind:g.kind});
 }
}
function nearSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
function tap(ev){if(!active||!pointer||Math.hypot(ev.clientX-pointer.x,ev.clientY-pointer.y)>6){pointer=null;return;}pointer=null;const b=overlay.getBoundingClientRect(),ratio=overlay.width/b.width,p=[(ev.clientX-b.left)*ratio,(ev.clientY-b.top)*ratio];let best=null,dist=12*ratio;
 for(const h of hits){const ps=h.points;let d=ps.length===1?Math.hypot(p[0]-ps[0][0],p[1]-ps[0][1]):Infinity;for(let i=1;i<ps.length;i++)d=Math.min(d,nearSegment(p,ps[i-1],ps[i]));if(h.kind==='workarea')d=Math.min(d,nearSegment(p,ps[ps.length-1],ps[0]));if(d<dist){dist=d;best=h;}}
 /* v8.87 - THE STUCK POINTER. This used to stop the pointerup here, so the map's own pointer handling never saw the release: the map
    went on following the mouse, and the next finger read as a pinch. The release now reaches the map; the click that follows is
    the one swallowed, so the tap does not also pick a ring. A tap on the map away from any line closes the details. */
 if(best){swallowClick();choose(best.id,false);if(matchMedia('(max-width:900px)').matches)fenceCard(best.id);else adapter.panel(true);}
 else if(selected!=null){selected=null;render();}
}
function swallowClick(){let t=0;const h=e=>{e.stopImmediatePropagation();e.preventDefault();window.removeEventListener('click',h,true);clearTimeout(t);};window.addEventListener('click',h,true);t=setTimeout(()=>window.removeEventListener('click',h,true),500);}
/* v8.87 - on a phone a tapped fence line gets a card at the foot of the map, as a unit does, instead of the drawer over the map */
function fenceCard(id){
 const phone=matchMedia('(max-width:900px)').matches;
 if(!fcard){fcard=document.createElement('div');fcard.id='fmCard887';fcard.setAttribute('role','dialog');fcard.setAttribute('aria-label','Fencing selection');fcard.hidden=true;$('stage').parentElement.append(fcard);
  for(const ev of ['pointerdown','pointerup','click','dblclick'])fcard.addEventListener(ev,e=>e.stopPropagation());fcard.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
  fcard.addEventListener('click',e=>{if(e.target.closest('[data-fmcardx]')){selected=null;render();return;}if(e.target.closest('[data-fmcardmore]')){adapter.panel(true);revealDetails();}});}
 const r=id!=null&&model&&model.rows.find(r=>r.id===id),g=!r&&id!=null&&model&&(model.geometry.find(g=>g.id===id)||overviewGeometry().find(g=>g.id===id));
 if(!phone||(!r&&!g)){fcard.hidden=true;return;}
 const status=$('fmDetails').querySelector('.fm-status'),title=r?r.location:(g.label||'Source fence run');
 fcard.innerHTML=`<div class="fm-card-t"><b>${e(title)}</b><button type="button" class="fm-card-x" data-fmcardx aria-label="Close fencing details">×</button></div><div class="fm-card-s">${status?e(status.textContent):''}</div>${r?`<div class="fm-card-s">${e(r.description)}</div><div class="fm-card-s">Planned ${e(dateText(r.date))}</div>`:''}<div class="fm-card-a"><button type="button" data-fmcardmore>Details and records</button></div>`;
 fcard.hidden=false;
}
function revealTraceTarget837(id){
 if(!model||!model.rows.some(r=>r.id===id)&&!model.geometry.some(g=>g.id===id))return false;
 filters={source:'all',day:'',status:'all',query:'',types:[]};$('fmSource').value='all';$('fmStatus').value='all';$('fmQuery').value='';$('fmSourceLines').checked=true;panel.querySelectorAll('[data-fmtype]').forEach(b=>b.setAttribute('aria-pressed','true'));updateDays();choose(id,true);adapter.panel(true);return true;
}
function setActive(on,id){
 if(on===active){if(on){refresh(true);if(id)revealTraceTarget837(id);}return;}
 active=on;document.body.classList.toggle('fencing-map',on);$('navBtn').textContent=on?'Tasks':'Find';$('navBtn').setAttribute('aria-label',on?'Open fencing tasks':'Find a reference or adjust the map');button.setAttribute('aria-pressed',String(on));clearTimeout(timer);timer=0;
 if(on){hostVisible=parentCall('gc500FencingMapIsActive')!==false;previousMode=A.state.mode;if(A.mode3d)A.mode3d(false);adapter.clearSelection();adapter.setMode('satellite');$('fmPlan').checked=false;
  /* v8.87 - on a phone the map stays in view: the list is a tap away (List) and a fence line gets its card at the foot of the map */
  if(!matchMedia('(max-width:900px)').matches)adapter.panel(true);else adapter.toast('Fencing: tap a fence line for its details · List for the plan sources · Close or Escape to leave',5500);
  refresh(true);if(id&&model)revealTraceTarget837(id);schedule();}
 else{selected=null;visCache=null;clearOverlay();if(fcard)fcard.hidden=true;if(matchMedia('(max-width:900px)').matches)adapter.panel(false);if(previousMode)adapter.setMode(previousMode);adapter.requestPaint();}  /* v8.87 - one press leaves Fencing whole: the pick goes with it */
}
/* v8.87 - the dashboard nudges this layer on every redraw (setHostVisible), and that nudge is signature-checked, so a full rebuild
   happens only when the fencing data actually changed. The timer is now a 20 s safety check, run in idle time and never while a
   hand or a glide is moving the map. */
function schedule(){clearTimeout(timer);timer=0;if(active&&hostVisible&&!document.hidden)timer=setTimeout(pollTick,20000);}
function pollTick(){timer=0;if(!active||!hostVisible||document.hidden)return;
 if(typeof interacting!=='undefined'&&(interacting||zAnim||flingRAF)){timer=setTimeout(pollTick,700);return;}
 const run=()=>{if(!active)return;hostVisible=parentCall('gc500FencingMapIsActive')!==false;refresh(false);schedule();};
 if(window.requestIdleCallback)requestIdleCallback(run,{timeout:3000});else run();}
button.onclick=()=>setActive(!active);
panel.querySelectorAll('[data-fmtype]').forEach(b=>b.onclick=()=>{const all=Object.keys(names),k=b.dataset.fmtype;let chosen=filters.types.length?filters.types.filter(k=>all.includes(k)):[...all];chosen=chosen.includes(k)?chosen.filter(t=>t!==k):chosen.concat(k);filters.types=all.every(k=>chosen.includes(k))?[]:chosen.length?chosen:['__none'];selected=null;panel.querySelectorAll('[data-fmtype]').forEach(x=>x.setAttribute('aria-pressed',String(!filters.types.length||filters.types.includes(x.dataset.fmtype))));render();});
function switchSource(id){filters.source=id;$('fmSource').value=id;filters.day='';selected=null;updateDays();render();}
$('fmSource').onchange=()=>switchSource($('fmSource').value);
$('fmDay').onchange=()=>{filters.day=$('fmDay').value;selected=null;render();};$('fmStatus').onchange=()=>{filters.status=$('fmStatus').value;selected=null;render();};$('fmQuery').oninput=()=>{filters.query=$('fmQuery').value;selected=null;render();};
$('fmSourceLines').onchange=render;
$('fmPlan').onchange=()=>adapter.setMode($('fmPlan').checked?'hybrid':'satellite');
$('fmCoverage').onclick=ev=>{const b=ev.target.closest('[data-fmcoverage]');if(b)parentCall('gc500FencingMapSource',b.dataset.fmcoverage,Number(b.dataset.fmpage));};
$('fmRegister').onclick=()=>parentCall('gc500FencingMapRegister');$('fmList').onclick=ev=>{const area=ev.target.closest('[data-fmtrace-area]');if(area){if(!revealTraceTarget837(area.dataset.fmtraceArea))adapter.toast('This area is unavailable. Reopen the map to check it.');return;}const trace=ev.target.closest('[data-fmtrace-record]');if(trace){if(parentCall('gc500FencingTraceDocket837',trace.dataset.fmtraceRecord)!==true)adapter.toast('This record is unavailable. Reopen the fencing register to check it.');return;}const b=ev.target.closest('[data-fmrow]'),sw=ev.target.closest('[data-fmswitch]');if(b)choose(b.dataset.fmrow,false);else if(sw)switchSource(sw.dataset.fmswitch);};
$('stage').addEventListener('pointerdown',ev=>{pointer=ev.isPrimary?{x:ev.clientX,y:ev.clientY}:null;},{capture:true});$('stage').addEventListener('pointerup',tap,{capture:true});$('stage').addEventListener('pointercancel',()=>{pointer=null;});
document.querySelector('.modes').addEventListener('click',()=>{if(active)setActive(false);},true);
document.addEventListener('keydown',ev=>{if(active&&/^[1234]$/.test(ev.key)&&!/input|select|textarea/i.test(ev.target.tagName))setActive(false);},true);
document.addEventListener('visibilitychange',()=>{clearTimeout(timer);timer=0;if(active&&!document.hidden){refresh(true);schedule();}});
window.addEventListener('pagehide',()=>{clearTimeout(timer);timer=0;});
A.ready.then(()=>{if(active){adapter.setMode($('fmPlan').checked?'hybrid':'satellite');refresh(true);}});
window.GC500FencingMap=Object.freeze({open:id=>setActive(true,id),close:()=>setActive(false),
 /* v8.87 - a nudge from the dashboard: signature-checked, never a forced rebuild; the map itself is told whether it is on screen */
 setHostVisible:on=>{hostVisible=!!on;if(typeof A.setHostShown==='function')A.setHostShown(hostVisible);clearTimeout(timer);timer=0;if(active&&hostVisible){refresh(false);schedule();}},
 get active(){return active;},get selected(){return selected;},hits:()=>({ratio:overlay.width/((overlay.getBoundingClientRect().width)||1),list:hits.map(h=>({id:h.id,kind:h.kind,points:h.points}))}),
 refresh:()=>refresh(true),paint,exportLayer:(ctx,frame)=>{
 if(!active)return;drawGeometry(ctx,frame,false);ctx.save();ctx.setTransform(1,0,0,1,0,0);
 const ratio=frame.dpr,pad=12*ratio,lineHeight=21*ratio;ctx.font=`600 ${13*ratio}px system-ui`;
 const src=source(),scope=src?src.label+' · revision '+src.revision:'All source plans · multiple dates · planned / historical routes, not installed or additive totals';
 const paragraphs=['GC500 fencing · '+scope,'Green area markers: recorded area sign-offs only. Source-aligned for orientation, not set-out.'];
 const lines=[];for(const paragraph of paragraphs){let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>frame.width-pad*2){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);}
 ctx.fillStyle='#151b20';ctx.fillRect(0,0,frame.width,(lines.length+0.6)*lineHeight);ctx.fillStyle='#f6d4b5';lines.forEach((line,i)=>ctx.fillText(line,pad,(i+1)*lineHeight));ctx.restore();
},get state(){return{active,hostVisible,refreshPending:!!timer,source:filters.source,selected,stats:model?C.stats(rows()):null,rejected:model?model.rejected:[],geometryVisible:visibleGeometry().length};}});
})();
