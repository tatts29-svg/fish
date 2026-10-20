/* Author: Andrew Fisher. Six explicitly assigned identifiers on existing quantity-owned units; no delivery or cost edits. */
'use strict';
const source=`
const clone=x=>JSON.parse(JSON.stringify(x)),canonical=value=>fencePaperCanonical898(value);
function capture(){
 return holdAssets(()=>clone({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
  supplier:Supplier996.model(),quantityOwnership:quantitySubhire964List(),
  financial:{money:moneySummary(),ledger:pl770Model(),own:ourCosts(),service:supplierService1068()}}));
}
function preflight(spec){
 if(spec.by!=='Andrew Fisher via Codex'||Object.keys(spec).sort().join(',')!=='by,ops'||!Array.isArray(spec.ops)||spec.ops.length!==6)throw Error('Expected six approved native identifier operations');
 const fields=['item','label','no','note','op','owner','ref'].sort().join(',');
 const numbers=[];
 for(const op of spec.ops){
  if(Object.keys(op).sort().join(',')!==fields||op.op!=='unit_reidentify'||op.ref!=='WC09'||op.item!=='Pee Panel'||op.label!==op.item||op.owner!=='event-portables'||op.note!=='Andrew-assigned site asset number.'||!/^[A-Z0-9]{3,12}$/.test(op.no))throw Error('Identifier operation is outside reviewed scope');
  numbers.push(op.no);
 }
 if(new Set(numbers).size!==6)throw Error('Duplicate requested identifiers');
 if(typeof quantitySubhireIdentified1094!=='function')throw Error('Reviewed identity compatibility release is required');
 if(whoAmI()!==spec.by||!mayWrite('an asset number'))throw Error('Named native editor required');
 const current=Supplier996.model(),row=current.inventory.find(r=>r.ref==='WC09'&&r.item==='Pee Panel');
 if(!row||row.quantity!==6||row.received!==6||row.onSite!==6||row.installed!==6||row.numbers.length||row.collected||row.locationConflict)throw Error('Existing quantity, receipt or identity baseline changed');
 const qty=quantitySubhire964Read('WC09','Pee Panel');
 if(!qty.valid||qty.row.quantity!==6||qty.row.received!==6||qty.row.installed!==6)throw Error('Existing retained quantity record is not reconciled');
 const duplicates=allAssets().flatMap(a=>gcModel925(a,{loading:false}).rows).filter(r=>r.source!=='history'&&r.active!==false&&numbers.includes(String(r.assetNo).trim().toUpperCase()));
 if(duplicates.length)throw Error('An approved identifier already exists; do not overwrite or retry');
 return current;
}
`;
const prepare=new Function('return function(spec){'+source+'preflight(spec);const record=capture();return {spec,before:record.docs,record};}')();
const apply=new Function('return function(plan){'+source+`
 preflight(plan.spec);
 if(canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))!==canonical(plan.before))throw Error('Shared record changed before staging');
 const results=[];
 for(const op of plan.spec.ops){
  const result=unit925Save(op.ref,{item:op.item,owner:op.owner,assetNo:op.no,label:op.label,branch:'',note:op.note,sourceKey:''},'','null','');
  if(!result||!result.ok)throw Error('Native identifier save refused: '+JSON.stringify(result));
  results.push(result);
 }
 const record=capture();
 return clone({before:plan.before,after:record.docs,record,results,queue:SYNC.queue});
}`)();
const read=new Function('return function(){'+source+'return capture();}')();
const canonical=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
function verify(staged,plan){
 const same=(a,b)=>canonical(a)===canonical(b),checks={},changed=[],numbers=plan.spec.ops.map(o=>o.no),before=plan.before,after=staged.after;
 for(const c of new Set([...Object.keys(before),...Object.keys(after)]))for(const id of new Set([...Object.keys(before[c]||{}),...Object.keys(after[c]||{})])){
  const old=before[c]?.[id]??null,next=after[c]?.[id]??null;
  if(!same(old,next))changed.push({collection:c,id,before:old,after:next});
 }
 const units=changed.filter(d=>d.collection==='loads'),allowed=new Set();
 for(const d of units){
  allowed.add('loads/'+d.id);allowed.add('stamps/loads~2f~'+d.id);allowed.add('by/loads~2f~'+d.id);
 }
 checks['exactly six new unit documents and twelve audit documents']=changed.length===18&&units.length===6&&changed.every(d=>d.before===null&&d.after!==null&&allowed.has(d.collection+'/'+d.id));
 checks['six approved distinct numbers']=same(units.map(d=>d.after.assetNo).sort(),numbers.slice().sort());
 checks['native unit scope and named attribution']=units.every(d=>{
  const u=d.after,op=plan.spec.ops.find(o=>o.no===u.assetNo);
  return op&&d.id==='unit925~2f~'+u.uuid&&u.kind==='unit925-record'&&u.ref===op.ref&&u.item===op.item&&u.owner===op.owner&&u.label===op.label&&u.note===op.note&&u.branch===''&&u.active===true&&u.by===plan.spec.by&&Number.isFinite(Date.parse(u.at))&&u.sourceKey===''&&u.sourceSnapshot===''&&u.nativeId==='slot:'+u.uuid;
 });
 checks['audit authors and timestamps match new units']=units.every(d=>{
  const u=d.after,b=after.by?.['loads~2f~'+d.id],s=after.stamps?.['loads~2f~'+d.id];
  return b?.v===plan.spec.by&&b?._k==='loads/'+u._k&&s?._k==='loads/'+u._k&&s?.v===u.at;
 });
 const previous=plan.record.supplier,current=staged.record.supplier;
 const stable=s=>{const x=JSON.parse(JSON.stringify(s));delete x.identified;delete x.quantityOnly;return x;};
 checks['all equipment, receipt, reference and scope counts unchanged']=same(stable(previous.summary),stable(current.summary));
 checks['six existing units now have identifiers']=current.summary.identified===previous.summary.identified+6&&current.summary.quantityOnly===previous.summary.quantityOnly-6;
 const beforeRow=previous.inventory.find(r=>r.ref==='WC09'&&r.item==='Pee Panel'),afterRow=current.inventory.find(r=>r.ref==='WC09'&&r.item==='Pee Panel');
 checks['existing receipt and installed quantities unchanged']=afterRow&&['quantity','received','installed','collected','onSite','remaining'].every(k=>afterRow[k]===beforeRow[k]);
 checks['current supplier view has approved identifiers exactly once']=afterRow&&same(afterRow.numbers.slice().sort(),numbers.slice().sort())&&same(afterRow.remainingNumbers.slice().sort(),numbers.slice().sort())&&afterRow.quantityOnly===false;
 checks['all financial models unchanged']=same(plan.record.financial,staged.record.financial);
 checks['no stale quantity ownership warning']=staged.record.quantityOwnership.issues.every(r=>!(r.ref==='WC09'&&r.item==='Pee Panel'));
 checks['other supplier allocations unchanged']=same(previous.inventory.filter(r=>!(r.ref==='WC09'&&r.item==='Pee Panel')),current.inventory.filter(r=>!(r.ref==='WC09'&&r.item==='Pee Panel')));
 return {pass:Object.values(checks).every(Boolean),checks,changed:changed.map(d=>d.collection+'/'+d.id)};
}
module.exports={prepare,apply,read,verify};
