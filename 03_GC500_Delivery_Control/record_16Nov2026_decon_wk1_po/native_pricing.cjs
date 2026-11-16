/* Author: Andrew Fisher. Save a source-backed supplier breakdown through one existing native P/O. 23 Oct 2026 copy of record_14Oct2026_purchase_order/native_pricing.cjs: a receipted order may take its sheet (its receipt fields are asserted and must not move); the operator name. */
'use strict';
const source = `
const clone=x=>JSON.parse(JSON.stringify(x));
const canonical=value=>fencePaperCanonical898(value);
const cents=value=>Math.round(Number(value)*100);
function capture(spec){return holdAssets(()=>{
 const H=fh866Model(),M=moneySummary(),P=pl770Model(),supplier=supplierPricing1014();
 return clone({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
  po:poOf(spec.number),orders:poAll(),financePo:H.pos.find(o=>o.number===spec.number),poSum:H.poSum,receiptedSum:H.receiptedSum,
  supplierOrder:supplier.orders.find(o=>o.number===spec.number)||null,supplierIssues:supplier.issues,
  financial:{revenue:M.charge,direct:M.cost,revNow:P.revNow,revJob:P.revJob,directNow:P.direct,directJob:P.directJob,financeCosts:H.costs},
  existingCostLines:poCostLines(spec.number),invoiceRecords:acc761Model('2026-10').invoiceRecords,
  financeText:fh866Text(H),financeCsv:fh866Csv(H)
 });
});}
function preflight(spec){
 if(!spec||!/^[0-9]{4,12}$/.test(spec.number))throw Error('Invalid existing P/O reference');
 if(Object.keys(spec).some(k=>!['number','expected_po','supplier_pricing','expected','replace_pricing','po_patch'].includes(k)))throw Error('Unapproved operation field');
 if(typeof supplierPricing1014!=='function')throw Error('Supplier pricing release is not present');
 const po=poOf(spec.number),body=toDocs('purchaseOrders')[spec.number];
 if(!po||!body)throw Error('Saved P/O not found');
 /* 16 Nov 2026: replace_pricing - the order's saved breakdown may be replaced only when it is exactly the one stated (previous) and the
    order's amount is the stated previous_amount; po_patch may set amount and note in the same write */
 if(spec.po_patch&&Object.keys(spec.po_patch).some(k=>!['amount','note'].includes(k)))throw Error('po_patch may set amount and note only')
 if(spec.po_patch&&!spec.replace_pricing)throw Error('po_patch is only for a replacement')
 if(spec.replace_pricing){if(!(body.supplier_pricing&&po.supplier_pricing))throw Error('replace_pricing: the order has no saved breakdown');if(canonical(body.supplier_pricing)!==canonical(spec.replace_pricing.previous))throw Error('replace_pricing: the saved breakdown is not the one stated');if(cents(po.amount)!==cents(spec.replace_pricing.previous_amount))throw Error('replace_pricing: the order amount is not the stated previous amount')}
 else if(body.supplier_pricing||po.supplier_pricing)throw Error('P/O already has supplier pricing; review before replacing it');
 for(const [field,value]of Object.entries(spec.expected_po||{}))if((po[field]??null)!==(value??null))throw Error('Existing P/O '+field+' changed');
 if(poCostLines(spec.number).length)throw Error('P/O already carries cost lines; reconcile before applying');
 // 23 Oct 2026: a receipted order may take its sheet - the receipt state is asserted in expected_po and must not move
 for(const f of ['invoice_no','receipted','receipted_amount'])if(!Object.prototype.hasOwnProperty.call(spec.expected_po||{},f))throw Error('expected_po must state '+f);
 const pricing=spec.supplier_pricing,expected=spec.expected;
 if(!pricing||pricing.schema!==1||pricing.currency!=='AUD'||pricing.basis!=='ex GST'||!pricing.source?.file||!/^[a-f0-9]{64}$/.test(pricing.source.sha256||''))throw Error('Approved source provenance missing');
 if(pricing.supplier_code!==po.supplier_code||pricing.branch!==po.branch)throw Error('Source supplier or branch does not match P/O');
 if(!expected||!Array.isArray(pricing.records)||pricing.records.length!==expected.records||!Array.isArray(pricing.extras)||pricing.extras.length!==expected.extras)throw Error('Source component count changed');
 // 23 Oct 2026: a receipted order may carry a sheet that differs from it by a stated amount; the order stands as the cost
 if(!Number.isFinite(pricing.total))throw Error('Supplier source total missing');
 const target=spec.po_patch&&spec.po_patch.amount!=null?spec.po_patch.amount:po.amount
 if(cents(pricing.total)!==cents(target)&&!(po.receipted&&spec.expected&&Number.isFinite(spec.expected.difference)&&cents(pricing.total)-cents(po.amount)===cents(spec.expected.difference)))throw Error('Supplier source and approved P/O amount differ');
 const names={red:['fenceDockets','docket_no'],green:['serviceNotes','note_no'],blue:['fenceCollections','collection_no']},columns=new Set(['clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc','flat_feet','labour','team_leader','relocation','removal']);
 let total=0;const seen=new Set();
 function lineAmount(line){
  if(!line||!columns.has(line.column)||!Number.isFinite(line.qty)||!Number.isFinite(line.rate)||line.rate<0||line.qty<0&&line.column!=='clean')throw Error('Invalid approved supplier component');
  const amount=cents(line.qty*line.rate);
  if(line.amount!=null&&(!Number.isFinite(line.amount)||cents(line.amount)!==amount))throw Error('Supplier line arithmetic differs');
  return amount;
 }
 // 23 Oct 2026: the dockets of weeks 3-6 are the page's captured dockets (FCOM), not record documents, so identity is
 // checked against the same rows supplierPricing1014 matches: one row by book+id, the same row by book+number, same date, usable
 const rows1014=[];const addRow=(r,book,number,usable)=>rows1014.push({id:String(r.id),book,number:String(number||''),date:r.date,usable});
 for(const d of FCOM.dockets||[])addRow(d,'red',d.docket_no,d.usable===true&&!serviceWorkProblems898(d).length);
 for(const d of fenceDockets1003(S.fenceDockets,S.deleted))addRow(d,'red',d.docket_no,!docketProblems(d).length);
 for(const n of supplierBaseNotes1014())addRow(n,'green',n.note_no||n.docket_no,n.usable!==false);
 for(const c of collectionRows())addRow(c,'blue',c.collection_no||c.docket_no,c.usable!==false);
 for(const item of pricing.records){
  const key=item.book+'/'+item.id;
  if(!names[item.book]||seen.has(key)||!Array.isArray(item.lines))throw Error('Missing or duplicated source docket');
  seen.add(key);const byId=rows1014.filter(r=>r.book===item.book&&r.id===String(item.id)),byNo=rows1014.filter(r=>r.book===item.book&&r.number===String(item.number));
  if(byId.length!==1||byNo.length!==1||byId[0]!==byNo[0]||byId[0].date!==item.date||byId[0].usable===false)throw Error('Source docket identity/date changed: '+item.book+' '+item.id+' '+item.number+' '+item.date);
  total+=item.lines.reduce((sum,line)=>sum+lineAmount(line),0);
 }
 for(const extra of pricing.extras){
  const key='extra/'+extra.id;
  if(!extra.id||seen.has(key)||extra.column!=='team_leader'||extra.unit!=='day'||extra.qty<0)throw Error('Invalid separate daily supplier charge');
  seen.add(key);total+=lineAmount(extra);
 }
 if(total!==cents(pricing.total))throw Error('Supplier breakdown does not match P/O to the cent');
 return po;
}
`;
const prepare=new Function('return function(spec){'+source+'preflight(spec);const record=capture(spec);return {spec,before:record.docs,record};}')();
const apply=new Function('return function(plan){'+source+`
 preflight(plan.spec);
 if(canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))!==canonical(plan.before))throw Error('Native record changed before staging');
 if(!setPo(plan.spec.number,Object.assign({},clone(plan.spec.po_patch||{}),{supplier_pricing:clone(plan.spec.supplier_pricing)})))throw Error('Native P/O control refused supplier pricing');
 const record=capture(plan.spec);
 return clone({before:plan.before,after:record.docs,record,queue:SYNC.queue});
}`)();
const read=new Function('return function(spec){'+source+'return capture(spec);}')();
const canonical=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
function verify(staged,plan){
 const same=(a,b)=>canonical(a)===canonical(b),cents=value=>Math.round(Number(value)*100),checks={},spec=plan.spec,r=staged.record,b=plan.record,e=spec.expected;
 const only=new Set(['purchaseOrders/'+spec.number,'stamps/po~2f~'+spec.number,'by/po~2f~'+spec.number]),changed=[];
 for(const c of new Set([...Object.keys(plan.before),...Object.keys(staged.after)]))for(const id of new Set([...Object.keys(plan.before[c]||{}),...Object.keys(staged.after[c]||{})]))if(!same(plan.before[c]?.[id]??null,staged.after[c]?.[id]??null))changed.push(c+'/'+id);
 checks['only the existing PO and its audit fields changed']=[2,3].includes(changed.length)&&changed.includes('purchaseOrders/'+spec.number)&&changed.includes('stamps/po~2f~'+spec.number)&&changed.every(k=>only.has(k));
 const beforePo={...plan.before.purchaseOrders[spec.number]},afterPo={...staged.after.purchaseOrders[spec.number]};
 // the page's review rule clears a recorded "checked" tick when the order changes, for a person to re-check: reported, not hidden
 checks['recorded check: none before, or cleared by the page for re-checking']=beforePo.checked==null||afterPo.checked==null;
 for(const item of [beforePo,afterPo])for(const field of ['supplier_pricing','updated_at','updated_by','checked',...Object.keys(spec.po_patch||{})])delete item[field]
 if(spec.po_patch)for(const [k,v] of Object.entries(spec.po_patch))checks['po_patch '+k+' saved']=JSON.stringify(staged.after.purchaseOrders[spec.number][k]??null)===JSON.stringify(v??null);
 checks['all other existing PO fields retained']=same(beforePo,afterPo);
 checks['approved breakdown saved exactly']=same(staged.after.purchaseOrders[spec.number].supplier_pricing,spec.supplier_pricing);
 checks['one matching purchase order']=r.orders.filter(o=>o.number===spec.number).length===1&&r.orders.length===b.orders.length;
 checks['PO value and total retained, or moved by exactly the patched amount']=spec.po_patch&&spec.po_patch.amount!=null?(cents(r.po.amount)===cents(spec.po_patch.amount)&&cents(r.poSum)-cents(b.poSum)===cents(spec.po_patch.amount)-cents(b.po.amount)):(r.po.amount===b.po.amount&&r.poSum===b.poSum);
 for(const [field,value]of Object.entries(spec.expected_po))checks['retained '+field]=(r.po[field]??null)===(value??null);
 const matched=r.supplierOrder;
 checks['supplier breakdown valid']=!!matched&&matched.valid===true&&(!matched.errors||matched.errors.length===0);
 checks['supplier total against the PO is the stated difference']=!!matched&&cents(matched.total)-cents(r.po.amount)===cents(e.difference||0)&&cents(matched.difference)===cents(e.difference||0);
 checks['source book totals match']=!!matched&&cents(matched.red)===cents(e.red_total)&&cents(matched.green)===cents(e.green_total)&&cents(matched.extrasTotal)===cents(e.extra_total);
 checks['receipt fields unchanged']=(r.po.invoice_no??null)===(b.po.invoice_no??null)&&(r.po.receipted??null)===(b.po.receipted??null)&&(r.po.receipted_amount??null)===(b.po.receipted_amount??null)&&r.financePo.receipt.key===b.financePo.receipt.key&&r.receiptedSum===b.receiptedSum;
 /* 16 Nov 2026: since v12.19 (Andrew, 25 Oct 2026) the V8s are charged on Advanced's sheet quantities, so a sheet on a PO moves the
    customer charge; the move must be exactly the stated amount (spec.expected.revenue_delta, 0 when not stated) */
 checks['customer Revenue changes by exactly the stated amount']=cents(r.financial.revNow)-cents(b.financial.revNow)===cents(e.revenue_delta||0)&&cents(r.financial.revJob)-cents(b.financial.revJob)===cents(e.revenue_delta||0);
 checks['Direct costs change once to source total']=cents(r.financial.directNow)-cents(b.financial.directNow)===cents(e.direct_delta)&&cents(r.financial.directJob)-cents(b.financial.directJob)===cents(e.direct_delta);
 checks['no duplicate invoice cost or claim']=same(r.existingCostLines,b.existingCostLines)&&same(r.invoiceRecords,b.invoiceRecords);
 const beforeFencing=b.financial.financeCosts.find(x=>x.kind==='fencing'),afterFencing=r.financial.financeCosts.find(x=>x.kind==='fencing');
 checks['fencing supplier Direct costs change once']=!!beforeFencing&&!!afterFencing&&cents(afterFencing.job)-cents(beforeFencing.job)===cents(e.supplier_delta)&&cents(afterFencing.toDate)-cents(beforeFencing.toDate)===cents(e.supplier_delta)&&afterFencing.toCome===beforeFencing.toCome;
 checks['supplier branch carries exact change']=r.financePo.costedBranch===e.branch&&!!beforeFencing&&!!afterFencing&&cents(afterFencing.by[e.branch])-cents(beforeFencing.by[e.branch])===cents(e.supplier_delta);
 checks['other finance cost categories unchanged']=same(b.financial.financeCosts.filter(x=>x.kind!=='fencing'),r.financial.financeCosts.filter(x=>x.kind!=='fencing'));
 checks['physical dockets, quantities and customer rates untouched']=['fenceDockets','serviceNotes','fenceCollections','rates','costs'].every(k=>same(plan.before[k],staged.after[k]));
 checks['named audit author']=r.po.updated_by==='Andrew Fisher via Claude'&&staged.after.by?.['po~2f~'+spec.number]?.v==='Andrew Fisher via Claude';
 checks['Finance text retains exact currency']=r.financeText.split('\n').some(line=>line.includes('PO '+spec.number)&&line.includes('$'+Number(r.po.amount).toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2})));
 checks['Finance CSV retains same value']=r.financeCsv.split(/\r?\n/).some(line=>line.includes(spec.number)&&line.includes(String(r.po.amount)));
 return {pass:Object.values(checks).every(Boolean),checks,changed};
}
module.exports={prepare,apply,read,verify};
