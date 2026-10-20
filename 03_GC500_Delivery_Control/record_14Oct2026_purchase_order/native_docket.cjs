/* Author: Andrew Fisher. A source-backed physical docket correction, separate from supplier pricing. */
'use strict';
const source=`
const clone=x=>JSON.parse(JSON.stringify(x)),canonical=x=>fencePaperCanonical898(x),cents=x=>Math.round(Number(x)*100);
function capture(spec){return holdAssets(()=>{
 const rows=allDockets(),M=moneySummary(),P=pl770Model(),H=fh866Model(),pricing=supplierPricing1014();
 return clone({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
  docket:rows.find(d=>d.id===spec.record_id),docketCount:rows.length,nativeCount:(S.fenceDockets||[]).length,
  week:fenceByWeek(rows).find(w=>w.week===spec.before.week),weekRaw:fenceByWeekBefore958(rows).find(w=>w.week===spec.before.week),attribution:fenceProgrammeReviews958(rows).find(r=>r.row.record_id===spec.record_id),pricing:pricing.orders.find(o=>o.number===spec.po_number),
  po:poOf(spec.po_number),rates:{customer:FCOL.map(c=>[c.key,fenceRateFor(c.key)]),supplier:FCOL.map(c=>[c.key,fenceCostFor(c.key)])},
  financial:{fencing:fenceDerived(),split:fencePaidSplit(),forecast:cj764Fencing(),revenue:M.charge,direct:M.cost,revNow:P.revNow,revJob:P.revJob,directNow:P.direct,directJob:P.directJob,financeCosts:H.costs}
 });});}
function preflight(spec){
 if(!spec||typeof spec!=='object'||!spec.record_id||!spec.docket_no||spec.document_id!==docIdOf(spec.record_id)||!spec.before)throw Error('Exact existing docket specification required');
 if(!spec.source||!spec.source.file||!/^[a-f0-9]{64}$/.test(spec.source.sha256||'')||!(spec.source.page>0))throw Error('Original source evidence missing');
 if(canonical(Object.keys(spec.changes||{}).sort())!==canonical(['components','quantities'])||canonical(Object.keys(spec.changes.quantities||{}))!==canonical(['clean'])||canonical(Object.keys(spec.changes.components||{}))!==canonical(['mesh_panel']))throw Error('Only reviewed clean metres and mesh panel quantities may change');
 for(const value of [spec.changes.quantities.clean,spec.changes.components.mesh_panel,spec.customer_rate,spec.revenue_before,spec.revenue_after,spec.supplier_amount,spec.po_amount])if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('Invalid reviewed numeric value');
 if(!Number.isInteger(spec.changes.components.mesh_panel))throw Error('Mesh panel count must be whole');
 const found=(S.fenceDockets||[]).filter(d=>d.id===spec.record_id),docs=toDocs('fenceDockets');
 if(found.length!==1||String(found[0].docket_no)!==spec.docket_no||canonical(docs[spec.document_id])!==canonical(spec.before))throw Error('Original docket changed; review the fresh source record');
 if(allDockets().filter(d=>String(d.docket_no)===spec.docket_no).length!==1)throw Error('Docket identity is ambiguous');
 if(typeof supplierPricing1014!=='function')throw Error('Reviewed supplier pricing release is required');
 const price=supplierPricing1014().orders.find(o=>o.number===spec.po_number),po=poOf(spec.po_number);
 if(!price||!price.valid||price.difference!==0||cents(price.total)!==cents(spec.po_amount)||cents(po.amount)!==cents(spec.po_amount))throw Error('Matching supplier pricing must be saved before the physical correction');
 const alloc=price.records.filter(r=>r.book==='red'&&r.id===spec.record_id);
 if(alloc.length!==1||cents(alloc[0].amount)!==cents(spec.supplier_amount))throw Error('Reviewed supplier docket allocation changed');
 const current=costDocket(found[0]),next=clone(found[0]);next.quantities={...next.quantities,...spec.changes.quantities};next.components={...next.components,...spec.changes.components};
 const pricedNext=costDocket(next),rate=fenceRateFor('clean');
 if(!rate||rate.value!==spec.customer_rate||cents(current.cost_total)!==cents(spec.revenue_before)||cents(pricedNext.cost_total)!==cents(spec.revenue_after))throw Error('Customer card or expected line rounding changed');
 if(cents(current.paid_total)!==cents(spec.supplier_amount)||cents(pricedNext.paid_total)!==cents(spec.supplier_amount))throw Error('Physical correction must not change the approved supplier amount');
 const problems=validateRecords({fenceDockets:[next]}).filter(x=>!x.startsWith('note: '));if(problems.length)throw Error('Native validation rejected correction: '+problems.join('; '));
 return next;
}
`;
const prepare=new Function('return function(spec){'+source+`const next=preflight(spec),record=capture(spec);return clone({spec,next,before:record.docs,record});}`)();
const apply=new Function('return function(plan){'+source+`
 if(!mayWrite('reviewed docket correction')||whoAmI()!=='Andrew Fisher via Codex'||SYNC.readonly||SYNC.unkept)throw Error('Named native edit authority is required');
 const next=preflight(plan.spec);
 if(canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))!==canonical(plan.before)||canonical(next)!==canonical(plan.next))throw Error('Native record changed before staging');
 const records=clone(S);records.fenceDockets=records.fenceDockets.map(d=>d.id===plan.spec.record_id?next:d);
 if(!applyImport({records},'replace','Andrew Fisher: source-backed correction to docket '+plan.spec.docket_no))throw Error('Native corrected-record import failed');
 stampIt('fenceDockets',plan.spec.record_id,'Andrew Fisher via Codex');
 if(!save()||SYNC.unkept)throw Error('Native corrected record was not kept');
 const record=capture(plan.spec);return clone({before:plan.before,after:record.docs,record,queue:SYNC.queue});
}`)();
const read=new Function('return function(spec){'+source+'return capture(spec);}')();
const canonical=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;})(x));
function verify(staged,plan){
 const same=(a,b)=>canonical(a)===canonical(b),cent=n=>Math.round(Number(n)*100),r=staged.record,b=plan.record,s=plan.spec,checks={},changed=[];
 const audit='fenceDockets~2f~'+s.record_id,allowed=new Set(['fenceDockets/'+s.document_id,'stamps/'+audit,'by/'+audit]);
 for(const c of new Set([...Object.keys(plan.before),...Object.keys(staged.after)]))for(const id of new Set([...Object.keys(plan.before[c]||{}),...Object.keys(staged.after[c]||{})]))if(!same(plan.before[c]?.[id]??null,staged.after[c]?.[id]??null))changed.push(c+'/'+id);
 checks['only docket and its two audit records change']=changed.length===3&&changed.every(k=>allowed.has(k));
 const intended={...s.before,quantities:{...s.before.quantities,...s.changes.quantities},components:{...s.before.components,...s.changes.components}};
 checks['exact source-backed corrected record']=same(staged.after.fenceDockets[s.document_id],intended);
 checks['docket counted once']=r.docketCount===b.docketCount&&r.nativeCount===b.nativeCount&&r.docket.id===s.record_id;
 checks['named audit attribution']=staged.after.by[audit]?.v==='Andrew Fisher via Codex';
 checks['new audit timestamp']=Number.isFinite(Date.parse(staged.after.stamps[audit]?.v))&&staged.after.stamps[audit]?.v!==plan.before.stamps?.[audit]?.v;
 checks['customer and supplier rate cards unchanged']=same(r.rates,b.rates);
 checks['PO and supplier allocation unchanged']=same(r.po,b.po)&&same(r.pricing,b.pricing)&&r.pricing.valid&&r.pricing.difference===0&&cent(r.pricing.total)===cent(s.po_amount);
 checks['supplier amount remains approved']=cent(r.docket.paid_total)===cent(s.supplier_amount)&&same(r.docket.supplier_lines,b.docket.supplier_lines);
 checks['customer line uses current card and proper rounding']=cent(r.docket.cost_total)===cent(s.revenue_after)&&r.docket.lines.find(l=>l.column==='clean')?.rate===s.customer_rate;
 const delta=cent(s.revenue_after)-cent(s.revenue_before),qtyDelta=s.changes.quantities.clean-s.before.quantities.clean;
 const weekExpected=JSON.parse(JSON.stringify(b.weekRaw));weekExpected.cost=(cent(weekExpected.cost)+delta)/100;
 const line=weekExpected.lines.find(l=>l.column==='clean');line.done+=qtyDelta;line.onPlan+=qtyDelta;if(line.remaining!=null)line.remaining-=qtyDelta;if(line.cost!=null)line.cost=(cent(line.cost)+delta)/100;
 checks['physical weekly metres and customer price update once']=same(r.weekRaw,weekExpected);
 checks['actual fencing Revenue rises by corrected line delta']=cent(r.financial.fencing.charged)-cent(b.financial.fencing.charged)===delta;
 checks['actual Direct costs and branch split unchanged']=cent(r.financial.fencing.cost)===cent(b.financial.fencing.cost)&&same(r.financial.split,b.financial.split)&&cent(r.financial.direct.known)===cent(b.financial.direct.known)&&cent(r.financial.directNow)===cent(b.financial.directNow);
 const revExpected=JSON.parse(JSON.stringify(b.financial.revenue));revExpected.fencing=(cent(revExpected.fencing)+delta)/100;revExpected.total=(cent(revExpected.total)+delta)/100;
 checks['only fencing actual Revenue changes']=same(r.financial.revenue,revExpected)&&cent(r.financial.revNow)-cent(b.financial.revNow)===delta;
 const futureRevenue=cent(r.financial.forecast.revenue)-cent(b.financial.forecast.revenue),futureCost=cent(r.financial.forecast.cost)-cent(b.financial.forecast.cost);
 checks['job Revenue follows corrected actual and remaining forecast']=cent(r.financial.revJob)-cent(b.financial.revJob)===delta+futureRevenue;
 checks['job Direct costs follow only remaining physical forecast']=cent(r.financial.directJob)-cent(b.financial.directJob)===futureCost;
 const financeBefore=b.financial.financeCosts.find(x=>x.kind==='fencing'),financeAfter=r.financial.financeCosts.find(x=>x.kind==='fencing');
 checks['Finance actual cost stays approved and forecast changes once']=!!financeBefore&&!!financeAfter&&financeAfter.toDate===financeBefore.toDate&&cent(financeAfter.toCome)-cent(financeBefore.toCome)===futureCost&&cent(financeAfter.job)-cent(financeBefore.job)===futureCost;
 checks['same fencing branch carries only remaining forecast change']=!!financeBefore&&!!financeAfter&&cent(financeAfter.by[r.pricing.branch])-cent(financeBefore.by[b.pricing.branch])===futureCost;
 checks['other Finance categories unchanged']=same(r.financial.financeCosts.filter(x=>x.kind!=='fencing'),b.financial.financeCosts.filter(x=>x.kind!=='fencing'));
 const ba=b.attribution,ra=r.attribution;
 checks['same reviewed programme task retains its capped allocation']=ba?.state==='matched'&&ra?.state==='matched'&&ba.attribution.target_id===ra.attribution.target_id&&ba.attribution.from_week===ra.attribution.from_week&&ba.attribution.to_week===ra.attribution.to_week&&ra.attribution.actual.clean===s.changes.quantities.clean&&ra.attribution.credit.clean===Math.min(s.changes.quantities.clean,ra.row.attribution.allowance.clean)&&ra.attribution.variance.clean===s.changes.quantities.clean-ra.attribution.credit.clean;
 const expectedForecast=JSON.parse(JSON.stringify(b.financial.forecast)),target=expectedForecast.weeks.find(w=>w.week===ba?.attribution?.to_week),cleanName=b.weekRaw.lines.find(l=>l.column==='clean').name;
 if(target&&ba?.attribution&&ra?.attribution){
  const fl=target.lines.find(l=>l.name===cleanName),creditDelta=ra.attribution.credit.clean-ba.attribution.credit.clean;
  if(fl){const oldCost=target.cost,oldRevenue=target.revenue,unitRev=fl.rev/fl.q,unitCost=fl.cost/fl.q;fl.q=Math.max(0,fl.q-creditDelta);fl.rev=fl.q*unitRev;fl.cost=fl.q*unitCost;
   target.lines=target.lines.filter(l=>l!==fl||fl.q>0);target.cost=cent(target.lines.reduce((a,l)=>a+(l.cost||0),0))/100;target.revenue=cent(target.lines.reduce((a,l)=>a+(l.rev||0),0))/100;
   expectedForecast.cost=(cent(expectedForecast.cost)+cent(target.cost)-cent(oldCost))/100;expectedForecast.revenue=(cent(expectedForecast.revenue)+cent(target.revenue)-cent(oldRevenue))/100;
   if(target.past){expectedForecast.behindCost=(cent(expectedForecast.behindCost)+cent(target.cost)-cent(oldCost))/100;expectedForecast.behindRevenue=(cent(expectedForecast.behindRevenue)+cent(target.revenue)-cent(oldRevenue))/100;}
  }
 }
 checks['remaining forecast only reduces by newly evidenced capped metres']=same(r.financial.forecast,expectedForecast);
 return {author:'Andrew Fisher',pass:Object.values(checks).every(Boolean),checks,changed,delta:{physicalMetres:qtyDelta,meshPanels:s.changes.components.mesh_panel-s.before.components.mesh_panel,actualRevenue:delta/100,supplierDocket:0,forecastRevenue:futureRevenue/100,forecastDirectCost:futureCost/100},financialBefore:b.financial,financialAfter:r.financial};
}
module.exports={prepare,apply,read,verify};
