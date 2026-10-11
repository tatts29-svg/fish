// Author: Andrew Fisher. Two user-confirmed installations, through native setters only.
function capture998(){return JSON.parse(JSON.stringify({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),state:S,model:Supplier996.model()}));}
function apply998(plan){
 const clone=x=>JSON.parse(JSON.stringify(x)),canon=fencePaperCanonical898,fail=s=>{throw Error(s);};
 if(plan.scope!=='confirmed-ep-installations-998'||plan.operator!=='Andrew Fisher via Codex'||whoAmI()!==plan.operator||!mayWrite('confirmed installations'))fail('Named correction authority missing');
 if(SYNC.readonly||SYNC.status!=='live'||SYNC.unkept||syncWaiting()!==0)fail('Shared record not settled');
 const targets=[['WC61',8,8],['WC69',6,12]];
 if(canon(plan.operations.map(o=>[o.ref,o.received,o.planned]))!==canon(targets))fail('Correction scope changed');
 const before=clone(S),beforeDocs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),beforeModel=Supplier996.model();
 for(const o of plan.operations){
  const row=beforeModel.rows.find(r=>r.ref===o.ref&&r.item==='FWF');
  if(!row||row.quantity!==o.planned||row.received!==0||canon([...row.numbers].sort())!==canon([...o.numbers].sort()))fail('Reviewed inventory changed: '+o.ref);
  for(const c of ['delivery','supplied'])if(canon(beforeDocs[c]?.[docIdOf(o.ref)]??null)!==canon(o.before[c]??null))fail('Reviewed native record changed: '+o.ref+'/'+c);
 }
 // Each setter retains its own attribution/audit. Their native 150ms debounce sends the final documents.
 for(const o of plan.operations){
  if(setLight(o.ref,'on site')!==true)fail('Receipt light rejected');
  setSupplied(o.ref,'FWF',{supplied:'FWF',qty_supplied:o.received});
  if(setLabour(o.ref,'Toilets & amenities','FWF','install',true)!==true)fail('Installation rejected');
  if(o.received===o.planned&&setDone(o.ref,true)!==true)fail('Complete confirmation rejected');
 }
 const afterDocs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),writes=[];
 const ids=new Set(targets.map(([r])=>docIdOf(r))),labourIds=new Set(targets.map(([r])=>docIdOf(labourKey(r,'Toilets & amenities','FWF','install'))));
 const stampIds=new Set(targets.flatMap(([r])=>[docIdOf('supplied/'+r+'/FWF'),docIdOf('labour/'+labourKey(r,'Toilets & amenities','FWF','install'))]));
 for(const c of Object.keys(afterDocs))for(const id of new Set([...Object.keys(beforeDocs[c]||{}),...Object.keys(afterDocs[c]||{})])){
  if(canon(beforeDocs[c]?.[id]??null)===canon(afterDocs[c]?.[id]??null))continue;
  const allowed=['delivery','supplied'].includes(c)?ids.has(id):c==='labour'?labourIds.has(id):['stamps','by'].includes(c)&&stampIds.has(id);
  if(!allowed||!afterDocs[c]?.[id])fail('Unexpected native change: '+c+'/'+id);
  writes.push({collection:c,id,body:clone(afterDocs[c][id])});
 }
 for(const key of new Set([...Object.keys(before),...Object.keys(S)]))if(!['delivery','supplied','labour','stamps','by','saved','changes'].includes(key)&&canon(before[key])!==canon(S[key]))fail('Unrelated local record changed: '+key);
 const afterModel=Supplier996.model();
 for(const [ref,n,q]of targets){const r=afterModel.rows.find(r=>r.ref===ref&&r.item==='FWF');if(r.received!==n||r.installed!==n||r.remaining!==q-n)fail('Receipt/install projection failed: '+ref);}
 if(afterModel.summary.onSite-beforeModel.summary.onSite!==14||beforeModel.summary.remaining-afterModel.summary.remaining!==14||afterModel.summary.fwf.unallocated!==beforeModel.summary.fwf.unallocated)fail('Supplier balance changed unexpectedly');
 if(deliveryOf('WC69').done)fail('Partial location must remain incomplete');
 return clone({author:'Andrew Fisher',operator:plan.operator,writes,before:beforeDocs,after:afterDocs,beforeSummary:beforeModel.summary,afterSummary:afterModel.summary});
}
module.exports={capture998,apply998};
