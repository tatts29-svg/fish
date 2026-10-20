/* Author: Andrew Fisher. Apply an explicitly approved value to one existing native P/O. */
'use strict';
const source = `
const clone=x=>JSON.parse(JSON.stringify(x));
const canonical=value=>fencePaperCanonical898(value);
function capture(spec){return holdAssets(()=>{
 const H=fh866Model(),M=moneySummary(),P=pl770Model();
 return clone({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
  po:poOf(spec.number),orders:poAll(),financePo:H.pos.find(o=>o.number===spec.number),poSum:H.poSum,receiptedSum:H.receiptedSum,
  financial:{revenue:M.charge,direct:M.cost,revNow:P.revNow,revJob:P.revJob,directNow:P.direct,directJob:P.directJob,financeCosts:H.costs},
  existingCostLines:poCostLines(spec.number),invoiceRecords:acc761Model('2026-10').invoiceRecords,
  financeText:fh866Text(H),financeCsv:fh866Csv(H)
 });
});}
function preflight(spec){
 if(!/^\\d{4,12}$/.test(spec.number)||!Number.isFinite(spec.amount)||spec.amount<0||Math.round(spec.amount*100)!==spec.amount*100)throw Error('Invalid approved P/O specification');
 const allowed=new Set(['number','amount','period','programme_sheet','confirmed','supplier_code','supplier_name','branch','stream','what','note']);
 if(Object.keys(spec).some(k=>!allowed.has(k)))throw Error('Unapproved P/O field');
 const po=poOf(spec.number);if(!po)throw Error('Existing P/O not found');
 if(po.amount!=null)throw Error('P/O already has a value; review before replacing it');
 for(const field of ['supplier_code','supplier_name','branch','period','programme_sheet'])if(po[field]!==spec[field])throw Error('Existing P/O '+field+' changed');
 if(po.invoice_no||po.receipted||po.receipted_amount!=null)throw Error('Receipt evidence changed; review before applying');
 if(poCostLines(spec.number).length)throw Error('Existing linked cost lines need reconciliation');
 return po;
}
`;
const prepare=new Function('return function(spec){'+source+`preflight(spec);const record=capture(spec);return {spec,before:record.docs,record};}`)();
const apply=new Function('return function(plan){'+source+`
 preflight(plan.spec);
 if(canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))!==canonical(plan.before))throw Error('Native record changed before staging');
 const patch=clone(plan.spec);delete patch.number;
 if(!setPo(plan.spec.number,patch))throw Error('Native P/O control refused the value');
 const record=capture(plan.spec);
 return clone({before:plan.before,after:record.docs,record,queue:SYNC.queue});
}`)();
const read=new Function('return function(spec){'+source+'return capture(spec);}')();
const canonical=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
function verify(staged,plan){
 const same=(a,b)=>canonical(a)===canonical(b),checks={},spec=plan.spec,r=staged.record,b=plan.record;
 const only=new Set(['purchaseOrders/'+spec.number,'stamps/po~2f~'+spec.number,'by/po~2f~'+spec.number]);
 const changed=[];
 for(const c of new Set([...Object.keys(plan.before),...Object.keys(staged.after)]))for(const id of new Set([...Object.keys(plan.before[c]||{}),...Object.keys(staged.after[c]||{})]))if(!same(plan.before[c]?.[id]??null,staged.after[c]?.[id]??null))changed.push(c+'/'+id);
 checks['only the approved PO and its audit fields changed']=changed.length===3&&changed.every(k=>only.has(k));
 checks['one matching purchase order']=r.orders.filter(o=>o.number===spec.number).length===1&&r.orders.length===b.orders.length;
 for(const field of Object.keys(spec))checks['saved '+field]=r.po[field]===spec[field];
 checks['native amount to the cent']=r.po.amount*100===spec.amount*100;
 checks['Finance uses the same value']=r.financePo.amount===spec.amount&&r.financePo.costedBranch===spec.branch;
 checks['PO total increases once']=Math.abs(r.poSum-b.poSum-spec.amount)<0.005;
 checks['receipt and payment not invented']=!r.po.invoice_no&&!r.po.receipted&&r.po.receipted_amount==null&&r.financePo.receipt.key==='unknown'&&r.receiptedSum===b.receiptedSum;
 checks['no duplicate Direct cost or Revenue']=same(r.financial,b.financial)&&same(r.existingCostLines,b.existingCostLines);
 checks['no new invoice claim']=same(r.invoiceRecords,b.invoiceRecords);
 checks['named audit author']=r.po.updated_by==='Andrew Fisher via Codex';
 checks['Finance text includes exact currency']=r.financeText.split('\n').some(line=>line.includes('PO '+spec.number)&&line.includes('$'+spec.amount.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2})));
 checks['Finance CSV includes same value']=r.financeCsv.split(/\r?\n/).some(line=>line.includes(spec.number)&&line.includes(String(spec.amount)));
 return {pass:Object.values(checks).every(Boolean),checks,changed};
}
module.exports={prepare,apply,read,verify};
