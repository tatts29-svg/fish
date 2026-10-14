/* Author: Andrew Fisher. One supplier projection, shared by dockets, direct costs and Finance. */
const supplierBaseDocket1014=costDocket,supplierBaseNotes1014=serviceNoteRows,supplierBaseDerived1014=fenceDerived;
function supplierPricing1014(){
 const cache='supplierPricing1014';if(RENDER_MEMO.has(cache))return RENDER_MEMO.get(cache);
 const rows=[];
 const add=(r,book,number,usable)=>rows.push({id:r.id,book,number:String(number||''),date:r.date,usable,location:r.location||'',map_ref:r.map_ref||''});
 for(const d of FCOM.dockets||[])add(d,'red',d.docket_no,d.usable===true&&!serviceWorkProblems898(d).length);
 for(const d of fenceDockets1003(S.fenceDockets,S.deleted))add(d,'red',d.docket_no,!docketProblems(d).length);
 for(const n of supplierBaseNotes1014())add(n,'green',n.note_no||n.docket_no,n.usable!==false);
 for(const c of collectionRows())add(c,'blue',c.collection_no||c.docket_no,c.usable!==false);
 const orders=poAll().map(o=>{const local=S.purchaseOrders?.[o.number],committed=COMMITTED.purchase_orders?.[o.number];return {...o,supplier_pricing:Object.prototype.hasOwnProperty.call(local||{},'supplier_pricing')?local.supplier_pricing:committed?.supplier_pricing};});
 const result=SupplierPo1014.calculate(orders,rows,{supplier_code:PO_SRC.supplier?.code,branch:pl760FencingBranch()});RENDER_MEMO.set(cache,result);return result;
}
function supplierExtras1014(){return supplierPricing1014().extras;}
function supplierEntry1014(book,id){return supplierPricing1014().records.get(SupplierPo1014.key(book,id))||null;}
costDocket=function(d){
 const base=supplierBaseDocket1014.apply(this,arguments),priced=supplierEntry1014('red',d.id);
 if(!priced||priced.date!==d.date)return base;
 return {...base,paid_total:priced.amount,paid_unpriced:[],paid_state:'priced',supplier_pricing_basis:'approved supplier pricing',supplier_lines:priced.lines,supplier_po:priced.po,supplier_branch:priced.branch,
 margin:base.cost_state==='priced'?Math.round((base.cost_total-priced.amount)*100)/100:null};
};
serviceNoteRows=function(){return supplierBaseNotes1014.apply(this,arguments).map(n=>{
 const p=supplierEntry1014('green',n.id);if(!p||p.date!==n.date)return n;
 const sameHours=p.lines.reduce((a,l)=>a+l.qty,0)===n.labour_hours,rate=p.lines.length&&p.lines.every(l=>l.rate===p.lines[0].rate)?p.lines[0].rate:null;
 return {...n,cost:p.amount,cost_rate:sameHours?rate:null,cost_rate_source:'approved supplier pricing',supplier_lines:p.lines,supplier_po:p.po,supplier_branch:p.branch};
});};
greenBookTotals=function(){
 const rows=serviceNoteRows().filter(r=>r.usable!==false),priced=rows.filter(r=>r.cost!=null),rates=[...new Set(priced.map(r=>r.cost_rate))];
 return {notes:rows.length,hours:Math.round(rows.reduce((v,r)=>v+(r.labour_hours||0),0)*100)/100,amount:Math.round(priced.reduce((v,r)=>v+r.cost,0)*100)/100,
 priced:priced.length,unpriced:rows.length-priced.length,rate:rates.length===1?rates[0]:null,rate_source:rows.some(r=>r.supplier_po)?'source-backed notes and current rates':fenceCostFor('labour').source,rate_by:fenceCostFor('labour').by};
};
fenceDerived=function(){const old=supplierBaseDerived1014.apply(this,arguments),extras=supplierExtras1014(),amount=extras.reduce((n,x)=>n+x.cents,0)/100;return {...old,cost:Math.round((old.cost+amount)*100)/100,margin:old.margin==null?null:Math.round((old.margin-amount)*100)/100,supplier_extras:extras,supplier_extras_total:amount};};
function supplierGreenText1014(G){return hoursTxt(G.hours)+' h · '+(G.priced?money(G.amount)+(G.unpriced?' · '+G.unpriced+' notes unpriced':''):'No supplier rate')+' · '+(G.rate!=null?money(G.rate)+' / h':'rates on individual notes');}
function supplierRecordDetail1014(d){
 if(!d.supplier_lines)return '';
 return `<div class="fp-review-detail"><b>Supplier charge · P/O ${poLabel1014(d.supplier_po)}</b><p>Approved billed quantities below. Site quantities and customer Revenue remain separate.</p>${d.supplier_lines.map(l=>`<div class="fp-rate-line"><b>${esc(l.name)}</b><span>${esc(fmtQty(l.qty,l.unit))} × ${esc(rateMoney(l.rate))}</span><span>${esc(money(l.paid))}</span></div>`).join('')}<p><b>Supplier subtotal ${esc(money(d.supplier_lines.reduce((n,l)=>n+l.cents,0)/100))}</b> · ${esc(d.supplier_branch||'Branch not set')} · ex GST</p></div>`;
}
function supplierProgramme1014(r){
 if(r.book!=='red'||typeof FENCE_PROGRAMME958==='undefined'||!FENCE_PROGRAMME958.rows.some(x=>x.record_id===r.id&&x.docket_no===r.number))return '';
 const mk='supplierProgrammeReviews1014';let reviews=RENDER_MEMO.get(mk);if(!reviews){reviews=fenceProgrammeReviews958(allDockets());RENDER_MEMO.set(mk,reviews);}
 const review=reviews.find(x=>x.row.record_id===r.id&&x.row.docket_no===r.number);if(!review)return '';
 if(review.state!=='matched')return '<br><small>Schedule link needs review</small>';
 const p=review.row.programme,task=review.row.attribution?.expected_task,date=task?.date||p.expected.date;
 const schedule='<br><small>Schedule: '+esc(p.sheet+' · row '+p.row+(date?' · '+date:''))+'<br>'+esc(p.expected.description)+'</small>';
 const sources=review.row.source_ids.map(id=>FENCE_PROGRAMME958.sources.find(x=>x.id===id)).filter(x=>x&&(/\.xlsx$/i.test(x.id)||/installation plan/i.test(x.title)&&/\.pdf$/i.test(x.id)));
 const links=sources.map(src=>{const workbook=/\.xlsx$/i.test(src.id),page=workbook?null:task?.page||null,label=src.title+(workbook?' · '+p.sheet+' row '+p.row:page?' · page '+page:''),link=fenceTraceLink837(photoFor({id:src.id}),label,page);return link?'<br><a class="fp-paper" href="'+esc(link.url)+'" target="_blank" rel="noopener noreferrer">'+esc(link.label)+'</a>':'';}).join('');
 return schedule+links;
}
function supplierLocation1014(r){
 const area=`<span>${esc(r.current_location||'Area not recorded')}</span>`,reference=r.current_reference?`<br><span>Reference: ${esc(r.current_reference)}</span>`:'',programme=supplierProgramme1014(r),base=area+reference+programme;
 if(typeof FENCE_TRACE837==='undefined'||!window.GC500FencingTrace837)return base;
 const key=window.GC500FencingTrace837.key({book:r.book,id:r.id,docket_no:r.number});
 if(!FENCE_TRACE837.rows.some(x=>window.GC500FencingTrace837.key(x)===key))return base;
 const mk='supplierLocationTrace1014';let trace=RENDER_MEMO.get(mk);if(!trace){trace=fenceTraceCurrent837();RENDER_MEMO.set(mk,trace);}
 const row=trace.rows.find(x=>x.key===key&&x.state==='current');if(!row)return base;
 const areas=trace.areas.filter(a=>a.state==='current'&&row.area_ids.includes(a.id));
 return base+areas.map(a=>`<br><button type="button" class="btn" data-ro data-fence-trace-map="${esc(key)}" data-fence-trace-area="${esc(a.id)}">Map area · ${esc(a.label)}</button>`).join('');
}
function poSupplierBlock1014(number){
 const p=supplierPricing1014().orders.find(o=>o.number===String(number));if(!p)return '';
 const label=!p.valid?'Supplier pricing needs review':p.difference===0?'✓ Supplier dockets match P/O':p.difference==null?'Supplier priced · P/O value needed':'P/O difference '+money(p.difference);
 const rows=p.records.map(r=>`<tr><td>${esc(r.number)} · ${esc(r.book==='red'?'Hire agreement':r.book==='green'?'Labour note':'Collection')}</td><td>${esc(r.date)}</td><td>${supplierLocation1014(r)}</td><td>${r.lines.length?r.lines.map(l=>esc(l.name)+' · '+esc(fmtQty(l.qty,l.unit))+' × '+esc(rateMoney(l.rate))+' = '+esc(money(l.paid))).join('<br>'):'Counts only · no additional charge'}</td><td class="num">${esc(money(r.amount))}</td></tr>`).join('');
 const extras=p.extras.map(x=>`<tr><td>${esc(x.name||'Team leader')}</td><td>${esc(x.date)}</td><td>Daily crew cost</td><td>${esc(fmtQty(x.qty,x.unit))} × ${esc(rateMoney(x.rate))}</td><td class="num">${esc(money(x.paid))}</td></tr>`).join('');
 return `<div class="po-supplier1014"><b class="${p.valid&&p.difference===0?'':'todo'}">${esc(label)}</b><details><summary>More info · supplier pricing</summary>${p.errors.length?`<p class="todo">${p.errors.map(esc).join('<br>')} · source allocation is not applied.</p>`:''}<p>${esc(p.source.file||'Source not recorded')} · ${esc(p.source.date||'')} · ${esc(p.branch||'Branch needed')} · AUD ex GST</p><div class="tblwrap"><table><thead><tr><th>Source</th><th>Work date</th><th>Current area / reference</th><th>Supplier billed quantities</th><th>Direct cost</th></tr></thead><tbody>${rows}${extras}</tbody></table></div><p>Hire agreements ${esc(money(p.red))} + labour notes ${esc(money(p.green))} + team leaders ${esc(money(p.extrasTotal))} = <b>${esc(money(p.total))}</b>.</p><p>These are supplier costs. Customer rates, physical counts and payment status are separate. Editing the P/O value shows any difference; it does not change the source charges.</p></details></div>`;
}
if(typeof sharedCache975==='function')sharedCache975();
