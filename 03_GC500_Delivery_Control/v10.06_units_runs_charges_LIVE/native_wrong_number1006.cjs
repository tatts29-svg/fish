// Author: Andrew Fisher. Remove only the explicitly confirmed wrong WC69 number.
function prepare(){
 const key='unit925/4e746c11-4aa1-4f97-8f05-726087e3b291',ref='WC69',no='0689',rec=S.loads[key];
 if(!rec||rec.ref!==ref||rec.assetNo!==no||rec.owner!=='event-portables'||rec.active===false)throw Error('Reviewed wrong-number record changed');
 const rows=gcModel925(assetOf(ref),{loading:false}).rows.filter(u=>u.physical&&u.source!=='history'&&u.assetNo===no);
 if(rows.length!==1)throw Error('Wrong number does not identify one active entry');
 const supplier=Supplier996.model().rows.find(r=>r.ref===ref&&r.item==='FWF');
 if(supplier.onSite!==12||supplier.remaining!==0)throw Error('WC69 confirmed quantity changed');
 const expectedNumbers=gcModel925(assetOf(ref),{loading:false}).rows.filter(u=>u.physical&&u.source!=='history'&&u.assetNo&&u.assetNo!==no).map(u=>u.assetNo).sort();
 if(expectedNumbers.length!==12||new Set(expectedNumbers).size!==12)throw Error('The other 12 confirmed numbers are not unique');
 return JSON.parse(JSON.stringify({scope:'remove-confirmed-wrong-number-WC69-0689',key,ref,no,id:rows[0].id,token:UnitIdentity1006.token(rows[0]),expectedNumbers,before:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))}));
}
function apply(plan){
 const clone=v=>JSON.parse(JSON.stringify(v)),canon=fencePaperCanonical898,docs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 if(plan.scope!=='remove-confirmed-wrong-number-WC69-0689'||plan.ref!=='WC69'||plan.no!=='0689'||whoAmI()!=='Andrew Fisher via Codex'||canon(docs)!==canon(plan.before))throw Error('Wrong-number authority or source changed');
 const result=UnitIdentity1006.remove(plan.ref,plan.id,plan.token);
 if(!result.ok||!result.kept||result.key!==plan.key||SYNC.unkept)throw Error('Native removal failed');
 syncStage();RENDER_MEMO.clear();
 const active=gcModel925(assetOf(plan.ref),{loading:false}).rows.filter(u=>u.source!=='history'&&u.physical),supplier=Supplier996.model().rows.find(r=>r.ref===plan.ref&&r.item==='FWF');
 if(active.some(u=>u.assetNo===plan.no)||supplier.numbers.includes(plan.no)||supplier.onSite!==12||supplier.remaining!==0)throw Error('Wrong number still active or quantities changed');
 return clone({before:docs,after:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),queue:SYNC.queue,activeNumbers:active.map(u=>u.assetNo).filter(Boolean),onSite:supplier.onSite,remaining:supplier.remaining});
}
function verify(staged,plan){
 const canonical=v=>JSON.stringify((function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x})(v));
 const changes=[];
 for(const c of new Set([...Object.keys(staged.before),...Object.keys(staged.after)]))for(const id of new Set([...Object.keys(staged.before[c]||{}),...Object.keys(staged.after[c]||{})])){
  const old=staged.before[c]?.[id]??null,next=staged.after[c]?.[id]??null;if(canonical(old)===canonical(next))continue;
  const key=next?._k||old?._k||id;
  const allowed=c==='loads'&&key===plan.key&&next?.active===false&&next?.assetNo==='0689'&&next?.removedBy==='Andrew Fisher via Codex'||['stamps','by'].includes(c)&&key==='loads/'+plan.key;
  if(!allowed)throw Error('Unrelated native document changed: '+c+'/'+key);
  if(c==='by'&&next?.v!=='Andrew Fisher via Codex')throw Error('Removal attribution missing');
  changes.push({collection:c,key});
 }
 if(staged.activeNumbers.length!==12||canonical(staged.activeNumbers.slice().sort())!==canonical(plan.expectedNumbers)||staged.onSite!==12||staged.remaining!==0||!changes.some(c=>c.collection==='loads'&&c.key===plan.key))throw Error('WC69 does not retain exactly the other 12 confirmed numbers and units');
 return {author:'Andrew Fisher',pass:true,scope:plan.scope,changes,activeCount:staged.activeNumbers.length,onSite:staged.onSite,remaining:staged.remaining};
}
module.exports={prepare,apply,verify};
