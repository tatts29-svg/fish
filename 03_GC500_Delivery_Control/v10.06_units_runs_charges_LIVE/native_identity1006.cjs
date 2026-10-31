// Author: Andrew Fisher. Confirmed 13 October supplier ownership and exact duplicate-number removals.
function prepare(){
 const refs=['WC10','WC34','WC38','WC39','WC40','WC68','WC69','WC70','WC72','WC73'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const before=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 const operations=refs.map(ref=>{
  const a=assetOf(ref),d=deliveryOf(ref),lines=a&&chargeLines(a).filter(l=>l.item);
  if(!a||!lines.length||lines.some(l=>l.item!=='FWF')||d.state!=='on site'||!d.done||!(d.history||[]).some(h=>h.state==='on site'&&isoIn(h.at)==='2026-10-13'))throw Error('Reviewed arrival changed: '+ref);
  const owner=subhireCo(ref);if(owner&&owner!=='Event Portables')throw Error('Another supplier now recorded: '+ref);
  return {ref,mark:owner!=='Event Portables'};
 });
 const removals=[];
 for(const [ref,no]of [['WC69','0592'],['WC72','0699']]){
  const rows=gcModel925(assetOf(ref),{loading:false}).rows.filter(r=>r.source!=='history'&&r.physical&&r.assetNo===no),ep=rows.filter(r=>r.owner==='event-portables'),coates=rows.filter(r=>r.owner==='coates');
  if(ep.length!==1||coates.length>1||rows.length!==ep.length+coates.length)throw Error('Reviewed duplicate identity changed: '+ref+'/'+no);
  if(coates.length)removals.push({ref,no,id:coates[0].id,token:UnitIdentity1006.token(coates[0])});
 }
 return clone({scope:'confirmed-ep-identity-13oct1006',operator:'Andrew Fisher via Codex',before,operations,removals});
}
function apply(plan){
 const clone=x=>JSON.parse(JSON.stringify(x)),canon=fencePaperCanonical898;
 if(plan.scope!=='confirmed-ep-identity-13oct1006'||plan.operator!=='Andrew Fisher via Codex'||whoAmI()!==plan.operator||!mayWrite('confirmed supplier ownership'))throw Error('Named correction authority missing');
 const before=clone(S),docs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 if(canon(docs)!==canon(plan.before))throw Error('Native records changed before correction');
 if(canon(plan.operations.map(o=>o.ref))!==canon(['WC10','WC34','WC38','WC39','WC40','WC68','WC69','WC70','WC72','WC73']))throw Error('Owned references changed');
 const actions=[];
 for(const r of plan.removals){if(![['WC69','0592'],['WC72','0699']].some(x=>x[0]===r.ref&&x[1]===r.no))throw Error('Unexpected removal');const result=UnitIdentity1006.remove(r.ref,r.id,r.token);if(!result.ok||!result.kept)throw Error('Native removal rejected: '+r.ref);actions.push({...r,key:result.key});}
 for(const o of plan.operations)if(o.mark&&subhireMark(o.ref,'Event Portables',false)!==true)throw Error('Native supplier correction rejected: '+o.ref);
 if(bump.kept===false||SYNC.unkept)throw Error('Native save failed');syncStage();
 for(const key of new Set([...Object.keys(before),...Object.keys(S)]))if(!['subhire','loads','assetNumbers','deleted','stamps','by','saved','changes'].includes(key)&&canon(before[key])!==canon(S[key]))throw Error('Unrelated state changed: '+key);
 const after=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 const numbers=plan.removals.map(r=>{const rows=gcModel925(assetOf(r.ref),{loading:false}).rows.filter(u=>u.source!=='history'&&u.physical&&u.assetNo===r.no);if(rows.length!==1||rows[0].owner!=='event-portables')throw Error('Number not unique after correction: '+r.ref);return{ref:r.ref,no:r.no,count:rows.length,owner:rows[0].owner};});
 if(plan.operations.some(o=>subhireCo(o.ref)!=='Event Portables'))throw Error('Supplier did not reconcile');
 return clone({before:docs,after,queue:SYNC.queue,actions,numbers,summary:Supplier996.model().summary});
}
function verify(staged,plan){
 const canonical=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
 const same=(a,b)=>canonical(a)===canonical(b),refs=new Set(plan.operations.map(o=>o.ref)),archiveKeys=new Set(staged.actions.map(a=>a.key));
 const diff=[];
 for(const c of new Set([...Object.keys(staged.before),...Object.keys(staged.after)]))for(const id of new Set([...Object.keys(staged.before[c]||{}),...Object.keys(staged.after[c]||{})])){
  const old=staged.before[c]?.[id]??null,next=staged.after[c]?.[id]??null;if(same(old,next))continue;
  const key=next?._k||old?._k||id;let allowed=false;
  if(c==='subhire'&&refs.has(key))allowed=next?.co==='Event Portables'&&next?.by===plan.operator&&next?.coates_off===null;
  if(c==='assetNumbers'&&key==='WC72')allowed=next===null||Array.isArray(next?.v)&&next.v.length===0;
  if(c==='loads'&&archiveKeys.has(key))allowed=next?.active===false&&next?.removedBy===plan.operator&&['0592','0699'].includes(next?.assetNo);
  if(c==='deleted')allowed=['num/WC72/0699','unit/WC72/0699'].includes(key)&&next!==null;
  if(c==='stamps'||c==='by')allowed=refs.has(key.replace(/^subhire\//,''))||[...archiveKeys].some(k=>key==='loads/'+k)||['deleted/num/WC72/0699','deleted/unit/WC72/0699'].includes(key);
  if(!allowed)throw Error('Unexpected native document change: '+c+'/'+key);
  if(c==='by'&&next?.v!==plan.operator)throw Error('Correction attribution missing');
  diff.push({collection:c,key});
 }
 return {author:'Andrew Fisher',pass:true,scope:plan.scope,changes:diff,numbers:staged.numbers};
}
module.exports={prepare,apply,verify};
