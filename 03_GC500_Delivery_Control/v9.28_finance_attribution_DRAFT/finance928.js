/* Author: Andrew Fisher. Source-scoped finance attribution; no record migration. */
function finance928Owner(row,units){
 const named=String(row.supplier_sub_rental||'').trim();
 if(named&&row.subhired)return {owner:named,basis:'explicit contract supplier',rehire:true};
 const number=String(row.asset_no||'').trim(),ref=row.match&&(row.match.key||row.match.task_id);
 const matches=number?(units||[]).filter(u=>u.physical&&u.source!=='history'&&String(u.assetNo||'')===number&&(!ref||u.ref===ref)):[];
 if(matches.length===1&&matches[0].owner&&matches[0].owner!=='unknown'&&!/supplier-not-named/.test(matches[0].owner))return {owner:matches[0].owner,basis:'current physical-unit owner',rehire:matches[0].owner!=='coates'};
 if(matches.length>1)return {owner:'unknown',basis:'conflicting current unit ownership',rehire:false};
 if(row.asset_no_is_plant_number)return {owner:'coates',basis:'contract Coates plant number',rehire:false};
 return {owner:'unknown',basis:'supplier ownership not established',rehire:false};
}
function finance928ContractOwner(row){
 const ref=row.match&&(row.match.key||row.match.task_id),a=ref&&typeof assetOf==='function'&&assetOf(ref);
 const read=()=>gcModel925(a).rows;
 const units=a&&typeof gcModel925==='function'?(typeof heldMemo==='function'?heldMemo('finance928units|'+ref,read):read()):[];
 return finance928Owner(row,units);
}
function finance928Demand(event,lines){
 const item=String(event.item||'').trim(),matches=(lines||[]).filter(l=>l.item===item);
 const raw=event.quantity_raw!=null?event.quantity_raw:event.quantity_display;
 const quantity=raw!=null&&String(raw).trim()!==''&&/^\d+(?:\.\d+)?$/.test(String(raw).trim())?Number(raw):null;
 if(!item||matches.length!==1||quantity==null)return {known:false,amount:0,reason:'Load item or quantity needs confirmation'};
 const l=matches[0],rate=l.transport_cost;
 if(typeof rate!=='number'||!Number.isFinite(rate)||rate<0)return {known:false,amount:0,reason:'Transport cost for this equipment is not priced'};
 if(typeof l.qty==='number'&&quantity>l.qty)return {known:false,amount:0,reason:'Load quantity exceeds the reference demand'};
 return {known:true,amount:rate*quantity,reason:'Card transport cost for this load’s item and quantity'};
}
function finance928LoadDemands(rows,lines,contextRows){
 const plans=rows.map(r=>finance928Demand(r.e,lines)),groups=new Map(),context=contextRows||rows;
 rows.forEach((r,i)=>{const key=JSON.stringify([r.leg,r.e.item||'']),g=groups.get(key)||[];g.push(i);groups.set(key,g);});
 for(const ids of groups.values()){
  const item=rows[ids[0]].e.item,l=(lines||[]).find(l=>l.item===item);
  const scope=context.filter(r=>r.leg===rows[ids[0]].leg&&r.e.item===item);
  const quantity=scope.reduce((n,r)=>{const raw=r.e.quantity_raw!=null?r.e.quantity_raw:r.e.quantity_display;return n+(raw!=null&&/^\d+(?:\.\d+)?$/.test(String(raw).trim())?Number(raw):NaN);},0);
  if(scope.length>1&&l&&typeof l.qty==='number'&&(!Number.isFinite(quantity)||quantity>l.qty))for(const i of ids)plans[i]={known:false,amount:0,reason:'Overlapping or ambiguous load quantities need allocation'};
 }
 return plans;
}
function finance928LegacyToiletBranch(){
 const counts={};ONHIRE_ROWS.forEach(r=>{if(r.family==='toilet'&&!r.subhired){const k=r.branch_code||'no branch';counts[k]=(counts[k]||0)+1;}});
 return Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0]||'KINP';
}
if(typeof module!=='undefined'&&module.exports)module.exports={owner:finance928Owner,demand:finance928Demand,loadDemands:finance928LoadDemands};
