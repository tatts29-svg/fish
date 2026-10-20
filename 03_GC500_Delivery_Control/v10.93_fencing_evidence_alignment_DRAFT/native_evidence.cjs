/* Author: Andrew Fisher. Exact source-reviewed fencing corrections through native import and P/O controls. */
'use strict';
const source=`
const clone=x=>JSON.parse(JSON.stringify(x)),canonical=x=>fencePaperCanonical898(x),cents=x=>Math.round(Number(x)*100);
function ready(){const i=photoIndex();if(i.state!=='ready'||DOCS.busy)throw Error('Source catalogue not ready');return clone(i);}
function capture(spec){sharedCache975();return holdAssets(()=>{const ds=allDockets(),ns=serviceNoteRows(),cs=collectionRows(),M=moneySummary(),P=pl770Model(),H=fh866Model(),sp=supplierPricing1014();return clone({
 docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),sourceCatalogue:ready(),
 counts:{dockets:ds.length,notes:ns.length,collections:cs.length},
 records:spec.changes.map(c=>({collection:c.collection,id:c.id,record:(c.collection==='fenceDockets'?ds:c.collection==='serviceNotes'?ns:cs).find(r=>r.id===c.id)})),
 po:poOf(spec.po_number),pricing:sp.orders.find(p=>p.number===spec.po_number),supplierOrders:sp.orders,supplierIssues:sp.issues,
 rates:{customer:FCOL.map(c=>[c.key,fenceRateFor(c.key)]),supplier:FCOL.map(c=>[c.key,fenceCostFor(c.key)])},
 reviews:fenceProgrammeReviews958(ds).filter(r=>spec.changes.some(c=>c.id===r.row.record_id)),
 financial:{revenue:M.charge,direct:M.cost,revNow:P.revNow,revJob:P.revJob,directNow:P.direct,directJob:P.directJob,financeCosts:H.costs,fencing:fenceDerived(),split:fencePaidSplit(),forecast:cj764Fencing()},
 invoiceRecords:acc761Model('2026-10').invoiceRecords,existingCostLines:poCostLines(spec.po_number)
});});}
function strippedPricing(v){const p=clone(v);for(const r of [...(p.records||[]),...(p.extras||[]),...(p.source?.review_items||[])])delete r.linkage;return p;}
function preflight(spec){
 if(!spec||spec.schema!==1||!Array.isArray(spec.changes)||!spec.changes.length||!spec.expected_po||!spec.supplier_pricing_after)throw Error('Exact correction specification missing');
 const unique=new Set(),allowed={fenceDockets:['location','note','quantities','components'],serviceNotes:['location','note','metres'],fenceCollections:['location','note']};
 for(const c of spec.changes){
  if(!allowed[c.collection]||!c.id||!c.before||!c.after||!Array.isArray(c.changed_fields)||!c.changed_fields.length)throw Error('Invalid correction scope');
  const key=c.collection+'/'+c.id;if(unique.has(key))throw Error('Duplicate correction');unique.add(key);
  const rows=(S[c.collection]||[]).filter(r=>r.id===c.id);if(rows.length!==1||canonical(toDocs(c.collection)[docIdOf(c.id)])!==canonical(c.before))throw Error('Source record changed: '+key);
  if(!c.source?.file||!/^[a-f0-9]{64}$/.test(c.source.sha256||'')||!Number.isInteger(c.source.page)||c.source.page<1)throw Error('Original source evidence missing');
  const diff=Object.keys({...c.before,...c.after}).filter(k=>canonical(c.before[k]??null)!==canonical(c.after[k]??null)).sort();
  if(canonical(diff)!==canonical([...c.changed_fields].sort())||diff.some(k=>!allowed[c.collection].includes(k)))throw Error('Unapproved correction fields');
  for(const k of ['quantities','components'])if(diff.includes(k)&&(!c.after[k]||Object.values(c.after[k]).some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0)))throw Error('Invalid corrected quantity');
  if(diff.includes('metres')&&!(typeof c.after.metres==='number'&&Number.isFinite(c.after.metres)&&c.after.metres>=0))throw Error('Invalid moved metres');
  const record=clone(c.after);delete record._k;const bad=validateRecords({[c.collection]:[record]}).filter(x=>!x.startsWith('note: '));if(bad.length)throw Error('Native validation rejected correction: '+bad.join('; '));
 }
 if(canonical(toDocs('purchaseOrders')[spec.po_number])!==canonical(spec.expected_po))throw Error('Purchase order changed');
 if(canonical(strippedPricing(spec.expected_po.supplier_pricing))!==canonical(strippedPricing(spec.supplier_pricing_after)))throw Error('Only supplier evidence linkages may change');
 const p=supplierPricing1014().orders.find(r=>r.number===spec.po_number);if(!p?.valid||p.difference!==0||cents(p.total)!==cents(spec.expected.supplier_total))throw Error('Approved supplier allocation no longer reconciles');
 return true;
}
`;
const prepare=new Function('return function(spec){'+source+`ready();preflight(spec);const record=capture(spec);return clone({spec,before:record.docs,record});}`)();
const apply=new Function('return function(plan){'+source+`
 if(!mayWrite('reviewed fencing evidence correction')||whoAmI()!=='Andrew Fisher via Codex'||SYNC.readonly||SYNC.unkept)throw Error('Named native edit authority required');
 preflight(plan.spec);if(canonical(ready())!==canonical(plan.record.sourceCatalogue)||canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))!==canonical(plan.before))throw Error('Native record or source catalogue changed before staging');
 const records=clone(S);for(const c of plan.spec.changes){const next=clone(c.after);delete next._k;records[c.collection]=records[c.collection].map(r=>r.id===c.id?next:r);}
 if(!applyImport({records},'replace','Andrew Fisher: source-reviewed fencing evidence correction'))throw Error('Native correction import failed');
 for(const c of plan.spec.changes)stampIt(c.collection,c.id,'Andrew Fisher via Codex');
 if(!setPo(plan.spec.po_number,{supplier_pricing:clone(plan.spec.supplier_pricing_after)}))throw Error('Native P/O evidence control refused correction');
 if(!save()||SYNC.unkept)throw Error('Native correction was not kept');
 const record=capture(plan.spec);return clone({before:plan.before,after:record.docs,record,queue:SYNC.queue});
}`)();
const read=new Function('return function(spec){'+source+'return capture(spec);}')();
const practiceGuards=new Function('return function(spec){'+source+`
 const checks={},before=canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
 const reject=(label,edit)=>{const bad=clone(spec);edit(bad);try{preflight(bad);checks[label]=false;}catch(e){checks[label]=true;}};
 reject('stale original record rejected',s=>s.changes[0].before.location+=' stale');
 reject('unapproved field rejected',s=>{s.changes[0].after.date='2000-01-01';s.changes[0].changed_fields.push('date');});
 reject('hidden extra mutation rejected',s=>s.changes[0].after.unreviewed=true);
 reject('duplicate correction rejected',s=>s.changes.push(clone(s.changes[0])));
 reject('missing source hash rejected',s=>delete s.changes[0].source.sha256);
 reject('changed purchase order rejected',s=>s.expected_po.amount+=0.01);
 reject('changed supplier financial allocation rejected',s=>s.supplier_pricing_after.total+=0.01);
 checks['rejected plans leave all documents unchanged']=before===canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
 return checks;
}`)();

const canonical=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
const same=(a,b)=>canonical(a)===canonical(b),cent=n=>Math.round(Number(n)*100);
function deriveExpected(staged,plan){const a=staged.record.financial,b=plan.record.financial;return {revenue_delta:(cent(a.revNow)-cent(b.revNow))/100,revenue_job_delta:(cent(a.revJob)-cent(b.revJob))/100,direct_delta:(cent(a.directNow)-cent(b.directNow))/100,direct_job_delta:(cent(a.directJob)-cent(b.directJob))/100,supplier_delta:(cent(a.fencing.cost)-cent(b.fencing.cost))/100,forecast_revenue_delta:(cent(a.forecast.revenue)-cent(b.forecast.revenue))/100,forecast_cost_delta:(cent(a.forecast.cost)-cent(b.forecast.cost))/100};}
function freezeExpected(spec,observed){const out=JSON.parse(JSON.stringify(spec));for(const [k,v]of Object.entries(observed)){if(typeof v!=='number'||!Number.isFinite(v))throw Error('Missing projected delta');if(k in out.expected&&cent(out.expected[k])!==cent(v))throw Error('Expected delta differs: '+k);out.expected[k]=v;}return out;}
function verify(staged,plan){const s=plan.spec,b=plan.record,r=staged.record,checks={},allowed=new Set(),changed=[];
 for(const c of s.changes){/* Document keys are taken from the exact captured native map. */const actual=Object.keys(plan.before[c.collection]).find(k=>plan.before[c.collection][k].id===c.id);allowed.add(c.collection+'/'+actual);const audit=Object.keys(staged.after.stamps||{}).find(k=>staged.after.stamps[k]._k===c.collection+'/'+c.id);if(audit){allowed.add('stamps/'+audit);allowed.add('by/'+audit);}}
 const pa='po~2f~'+s.po_number;allowed.add('purchaseOrders/'+s.po_number);allowed.add('stamps/'+pa);allowed.add('by/'+pa);
 for(const c of new Set([...Object.keys(plan.before),...Object.keys(staged.after)]))for(const id of new Set([...Object.keys(plan.before[c]||{}),...Object.keys(staged.after[c]||{})]))if(!same(plan.before[c]?.[id]??null,staged.after[c]?.[id]??null))changed.push(c+'/'+id);
 checks['only approved records and audit documents change']=changed.every(k=>allowed.has(k));
 checks['every exact physical correction saved']=s.changes.every(c=>Object.values(staged.after[c.collection]||{}).some(v=>v.id===c.id&&same(v,c.after)));
 checks['physical paper counts unchanged']=same(b.counts,r.counts);
 checks['source catalogue retained']=same(b.sourceCatalogue,r.sourceCatalogue);
 checks['customer and supplier cards unchanged']=same(b.rates,r.rates);
 const strip=p=>{const x=JSON.parse(JSON.stringify(p));for(const k of ['supplier_pricing','updated_at','updated_by'])delete x[k];return x;};
 checks['PO fields and approved amount unchanged']=same(strip(b.po),strip(r.po))&&cent(r.po.amount)===cent(s.expected.supplier_total);
 checks['exact reviewed linkages saved']=same(staged.after.purchaseOrders[s.po_number].supplier_pricing,s.supplier_pricing_after);
 checks['supplier allocation remains valid and exact']=r.pricing?.valid===true&&r.pricing.difference===0&&cent(r.pricing.total)===cent(s.expected.supplier_total);
 checks['other supplier allocations unchanged']=same(b.supplierOrders.filter(x=>x.number!==s.po_number),r.supplierOrders.filter(x=>x.number!==s.po_number));
 checks['no invoice or receipt invented']=same(b.invoiceRecords,r.invoiceRecords)&&same(b.existingCostLines,r.existingCostLines)&&!r.po.invoice_no&&!r.po.receipted;
 const directExpected=JSON.parse(JSON.stringify(b.financial.direct));directExpected.fencing_margin=(cent(directExpected.fencing_margin)+cent(s.expected.revenue_delta))/100;
 checks['direct costs and branches unchanged; margin follows Revenue']=same(directExpected,r.financial.direct)&&same(b.financial.financeCosts,r.financial.financeCosts)&&same(b.financial.split,r.financial.split);
 checks['remaining physical forecast unchanged']=same(b.financial.forecast,r.financial.forecast);
 const observed=deriveExpected(staged,plan);for(const [k,v]of Object.entries(observed))checks['frozen '+k]=typeof s.expected[k]==='number'&&cent(s.expected[k])===cent(v);
 const re=JSON.parse(JSON.stringify(b.financial.revenue));re.fencing=(cent(re.fencing)+cent(s.expected.revenue_delta))/100;re.total=(cent(re.total)+cent(s.expected.revenue_delta))/100;
 checks['only fencing actual Revenue follows corrected quantity']=same(re,r.financial.revenue);
 const reviewIds=xs=>xs.map(x=>x.row.record_id).sort();
 checks['all changed catalogue snapshots remain matched']=Array.isArray(s.expected_catalogue_ids)&&same(reviewIds(b.reviews),[...s.expected_catalogue_ids].sort())&&same(reviewIds(r.reviews),[...s.expected_catalogue_ids].sort())&&r.reviews.every(x=>x.state==='matched');
 checks['all changes attributed to named operator']=s.changes.every(c=>Object.values(staged.after.by||{}).some(v=>v._k===c.collection+'/'+c.id&&v.v==='Andrew Fisher via Codex'))&&r.po.updated_by==='Andrew Fisher via Codex';
 return {author:'Andrew Fisher',pass:Object.values(checks).every(Boolean),checks,changed,delta:observed,financialBefore:b.financial,financialAfter:r.financial};
}
module.exports={prepare,apply,read,verify,deriveExpected,freezeExpected,practiceGuards};
