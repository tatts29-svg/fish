// Author: Andrew Fisher. Private-plan native correction primitives. No execution at import.
function capture996(){return JSON.parse(JSON.stringify({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),state:S,financial:{actual:fenceDerived(),forecast:cj764Fencing()}}));}
function apply996(plan){
 const clone=x=>JSON.parse(JSON.stringify(x)),canonical=x=>fencePaperCanonical898(x),fail=s=>{throw Error(s);};
 if(plan.scope!=='fencing-source-corrections-996'||plan.operations.length!==2||!mayWrite('reviewed fencing component corrections')||whoAmI()!==plan.operator)fail('Correction scope or named edit authority missing');
 const exact=[['components-36589','F-AFV-0032','F-AFV-0032',{components:{base:12,clamp:12}}],['gate-36560','F-AFV-0002','F-AFV-0002',{quantities:{ped_gates:1}}]];
 if(plan.operator!=='Andrew Fisher via Codex'||canonical(plan.operations.map(o=>[o.id,o.record_id,o.document_id,o.changes]))!==canonical(exact))fail('Reviewed correction fields changed');
 if(SYNC.readonly||SYNC.status!=='live'||SYNC.unkept||syncWaiting()!==0)fail('Shared record is not settled and writable');
 const before=clone(S),beforeDocs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 const actualBefore=fenceDerived(),forecastBefore=cj764Fencing(),expectedRecords=new Map();
 const allowedIds=new Set(),allowedStampIds=new Set();
 for(const operation of plan.operations){
  const found=(S.fenceDockets||[]).filter(d=>d.id===operation.record_id);
  if(found.length!==1||docIdOf(found[0].id)!==operation.document_id||canonical(beforeDocs.fenceDockets[operation.document_id])!==canonical(operation.before))fail('Original record changed: '+operation.id);
  const next=clone(found[0]);
  for(const [field,changes]of Object.entries(operation.changes)){
   if(!['components','quantities'].includes(field))fail('Unsupported field');
   next[field]={...next[field],...changes};
  }
  const a=costDocket(found[0]),b=costDocket(next),money=x=>Math.round(x*100);
  const expected=operation.id==='gate-36560'?[3618,3600]:operation.id==='components-36589'?[0,0]:fail('Unsupported correction');
  if(money(b.cost_total-a.cost_total)!==expected[0]||money(b.paid_total-a.paid_total)!==expected[1])fail('Unexpected native financial delta: '+operation.id);
  if(canonical(a.unpriced)!==canonical(b.unpriced)||canonical(a.paid_unpriced)!==canonical(b.paid_unpriced))fail('Pricing completeness changed');
  expectedRecords.set(operation.record_id,next);allowedIds.add(operation.document_id);allowedStampIds.add(docIdOf('fenceDockets/'+operation.record_id));
 }
 // All source and pricing guards pass before staging the two native corrections.
 S.fenceDockets=S.fenceDockets.map(record=>expectedRecords.get(record.id)||record);
 for(const operation of plan.operations)stampIt('fenceDockets',operation.record_id,plan.operator);
 bump();
 if(bump.kept===false||SYNC.unkept)fail('Native save did not keep the corrected record');
 const afterDocs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),writes=[];
 for(const collection of Object.keys(afterDocs))for(const id of new Set([...Object.keys(beforeDocs[collection]||{}),...Object.keys(afterDocs[collection]||{})])){
  if(canonical(beforeDocs[collection]?.[id])===canonical(afterDocs[collection]?.[id]))continue;
  const allowed=collection==='fenceDockets'?allowedIds.has(id):['stamps','by'].includes(collection)&&allowedStampIds.has(id);
  const body=afterDocs[collection]?.[id];if(!allowed||!body)fail('Unexpected changed shared document: '+collection+'/'+id);
  if(collection==='fenceDockets'){
   const expected={...expectedRecords.get(body.id),_k:body.id};if(canonical(body)!==canonical(expected))fail('Unexpected corrected record payload');
  }else if(collection==='by'&&body.v!==plan.operator)fail('Correction attribution missing');
  else if(collection==='stamps'&&!Number.isFinite(Date.parse(body.v)))fail('Correction timestamp missing');
  writes.push({collection,id,body:clone(body)});
 }
 for(const id of allowedIds)if(!writes.some(w=>w.collection==='fenceDockets'&&w.id===id))fail('An owned correction was not staged');
 for(const id of allowedStampIds)if(!writes.some(w=>w.collection==='stamps'&&w.id===id)||afterDocs.by?.[id]?.v!==plan.operator)fail('An owned correction lacks new attribution');
 for(const key of new Set([...Object.keys(before),...Object.keys(S)]))if(!['fenceDockets','stamps','by','saved','changes'].includes(key)&&canonical(before[key])!==canonical(S[key]))fail('Unrelated local state changed: '+key);
 const actualAfter=fenceDerived(),forecastAfter=cj764Fencing();
 if(Math.round((actualAfter.charged-actualBefore.charged)*100)!==3618||Math.round((actualAfter.cost-actualBefore.cost)*100)!==3600)fail('Unexpected total actual delta');
 if(Math.round((forecastAfter.revenue-forecastBefore.revenue)*100)!==-3618||Math.round((forecastAfter.cost-forecastBefore.cost)*100)!==-3600)fail('Unexpected remaining forecast delta');
 return clone({author:'Andrew Fisher',operator:plan.operator,writes,before:beforeDocs,after:afterDocs,financial:{actualBefore,actualAfter,forecastBefore,forecastAfter}});
}
module.exports={capture996,apply996};
