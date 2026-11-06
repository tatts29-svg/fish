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
