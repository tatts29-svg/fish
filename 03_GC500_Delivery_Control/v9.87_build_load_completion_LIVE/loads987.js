/* Author: Andrew Fisher. Delivery receipt is separate from installation and truck allocation. */
(function(root){'use strict';
const list=x=>Array.isArray(x)?x:[],unique=x=>[...new Set(x)],valid=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x))&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const active=r=>r?.a?.key&&!r.a._cancelled;
function receipt(row,iso){
 const a=(typeof assetOf==='function'?assetOf(row.a.key):null)||row.a;
 if(a._cancelled)return {complete:false,reason:'Cancelled reference.'};
 const d=typeof deliveryAsOf==='function'?deliveryAsOf(a.key,iso):null;
 if(!d)return {complete:null,reason:'No dated delivery record.'};
 const cut=Date.parse(iso+'T23:59:59.999+10:00');
 const dated=at=>Number.isFinite(Date.parse(at))&&Date.parse(at)<=cut;
 if(d.recorded&&d.state!=='on site'){
  const named=unique(list(row.events).filter(e=>e.movement!=='remove').map(e=>e.item).filter(Boolean));
  const items=named.length?named:unique(typeof chargeLines==='function'?chargeLines(a).map(l=>l.item):[]);
  const supplied=typeof S==='undefined'?[]:list(S.supplied?.[a.key]?.items),stamps=typeof S==='undefined'?{}:S.stamps||{};
  const later=items.length&&Number.isFinite(Date.parse(d.set_at))&&items.every(item=>{
   const at=stamps['supplied/'+a.key+'/'+item],rs=supplied.filter(r=>r.asked===item);
   return rs.length===1&&rs[0].qty_supplied!=null&&String(rs[0].qty_supplied).trim()!==''&&Number.isInteger(Number(rs[0].qty_supplied))&&Number(rs[0].qty_supplied)>=0&&dated(at)&&Date.parse(at)>Date.parse(d.set_at);
  });
  if(!later)return {complete:false,source:'Dated delivery state.',reason:'The recorded delivery state is '+d.state+'.'};
 }
 // A booking piece carries only its truck share. Receipt quantities belong to the canonical asset.
 const canonical={...row,a};
 const toilet=typeof toiletDeliveryEntry962==='function'?toiletDeliveryEntry962(canonical,iso):null;
 if(typeof toilet==='boolean')return {complete:toilet,source:'Dated item receipts for this day’s delivery items.',reason:toilet?'':'Not all scheduled item quantities are recorded received.'};
 const current=typeof todayIso==='function'&&iso>=todayIso();
 if(d.recorded&&d.state==='on site')return {complete:current||dated(d.set_at)?true:null,source:d.where==='rental'?'Rental-system on-site record.':'Dated on-site record.',reason:current||dated(d.set_at)?'':'The on-site record has no date for this historical day.'};
 if(!d.recorded&&d.done&&dated(d.done_at))return {complete:true,source:'Installation recorded by this date confirms earlier delivery.'};
 return {complete:false,source:'Dated delivery record.',reason:d.recorded?'Not recorded received by this day’s close.':'No receipt recorded by this day’s close.'};
}
function create(env){
 return {day(iso,today,day={iso}){
  const future=iso>today,base={completed:null,total:null,verified:false,groupingVerified:false,percent:null,scheduledGroups:0,status:'unavailable',metric:'references',title:'DAY’S DELIVERIES',source:'',issues:[],details:[],pickups:0};
  if(!valid(iso)||!valid(today)||day.iso&&day.iso!==iso)return {...base,status:'invalid',issues:['Day model does not match the requested date.']};
  if(env.ready&&!env.ready())return {...base,status:'loading',source:'Shared delivery records are loading.'};
  const raw=env.loads?env.loads(day):null;
  if(!Array.isArray(raw))return {...base,source:'No programme load groups are available.'};
  // Empty groups are retained as allocation issues; groups whose rows are all cancelled are excluded.
  const live=raw.filter(g=>!list(g.rows).length||list(g.rows).some(active)).map(g=>({...g,rows:list(g.rows).filter(active)}));
  const incoming=live.filter(g=>g.kind==='deliveries'),outgoing=live.filter(g=>g.kind==='removals');
  const pickupRefs=unique(outgoing.flatMap(g=>g.rows.map(r=>r.a.key)));
  base.pickups=pickupRefs.length;
  if(!incoming.length){
   if(outgoing.length)return {...base,title:'DAY’S PICKUPS',total:pickupRefs.length||outgoing.length,scheduledGroups:outgoing.length,status:'scheduled',source:'Scheduled pickup references. Delivery or installation records do not establish collection.',details:pickupRefs.map(ref=>({refs:[ref],complete:null,source:'Pickup programme.'}))};
   const plans=raw.length&&!live.length?[]:list(day.loads);
   if(plans.length)return {...base,title:'DAY’S LOADS',metric:'loads',total:plans.length,scheduledGroups:plans.length,status:'scheduled',source:'Carrier loads on the programme; referenced arrival records are not linked.'};
   return {...base,completed:future?null:0,total:0,verified:true,groupingVerified:true,status:'none-scheduled',source:'No delivery or pickup groups are scheduled for this date.'};
  }
  const ids=incoming.map(g=>env.idOf?env.idOf(day,g):null);
  const physical=incoming.every((g,i)=>g.rows.length&&ids[i]&&['load','plan','booking'].includes(g.basis)&&(g.basis!=='booking'||g.truck_id))&&unique(ids).length===ids.length;
  let units;
  if(physical)units=incoming.map((g,i)=>({id:ids[i],rows:g.rows}));
  else {
   const refs=new Map();
   incoming.forEach(g=>g.rows.forEach(r=>{
    if(!refs.has(r.a.key))refs.set(r.a.key,{...r,events:[]});
    refs.get(r.a.key).events.push(...list(r.events));
   }));
   units=[...refs.values()].map(r=>({id:r.a.key,rows:[{...r,events:[...new Map(r.events.map(e=>[JSON.stringify(e),e])).values()]}]}));
   base.issues.push('The programme does not allocate every delivery reference to a distinct truck. The count uses delivery references.');
  }
  const total=units.length;
  if(!total)return {...base,status:'scheduled',metric:'loads',title:'DAY’S LOADS',total:incoming.length,scheduledGroups:incoming.length,source:'Scheduled groups have no referenced arrival records.'};
  let completed=0;
  const details=units.map(unit=>{
   const readings=future?[]:unit.rows.map(r=>{const x=env.receipt?env.receipt(r,iso):null;return {ref:r.a.key,...(typeof x==='boolean'?{complete:x}:x||{complete:null,reason:'Arrival record unavailable.'})};});
   const complete=future?null:readings.every(x=>x.complete===true);
   if(complete)completed++;
   return {id:unit.id,refs:unique(unit.rows.map(r=>r.a.key)),complete,readings};
  });
  return {...base,metric:physical?'loads':'references',title:physical?'DAY’S LOADS':'DAY’S DELIVERIES',completed:future?null:completed,total,verified:true,groupingVerified:physical,scheduledGroups:incoming.length,percent:future?null:completed/total*100,status:future?'scheduled':completed===total?'complete':'incomplete',details,
   source:(physical?'Recorded receipts against scheduled truck loads.':'Recorded receipts against scheduled delivery references.')+' '+(future?'Current programme.':'Received by this Brisbane day’s close; earlier receipt fulfils the delivery, while installation remains separate.')};
 }};
}
function view(l){
 const title=l.title||'DAY’S DELIVERIES';
 if(l.status==='loading')return {title,value:'Loading records',basis:'RECEIPTS'};
 if(l.status==='none-scheduled')return {title,value:'None scheduled',basis:'SCHEDULE'};
 if(l.status==='scheduled')return {title,value:l.total+' planned',basis:l.metric==='loads'?'LOADS SCHEDULED':'REFERENCES SCHEDULED'};
 if(l.verified&&l.total>0)return {title,value:l.completed+' / '+l.total,basis:l.metric==='loads'?'LOADS RECEIVED / SCHEDULED':'REFERENCES RECEIVED / SCHEDULED'};
 return {title,value:'No receipt record',basis:'RECEIPTS'};
}
function details(l){
 const e=x=>esc(String(x??''));
 return '<b>'+e(l.title||'Day’s deliveries')+'</b><p>'+e(l.source)+' '+e(list(l.issues).join(' '))+'</p>'+
 (l.details?.length?'<ul class="bc987-receipts">'+l.details.map((d,i)=>'<li><b>'+(l.metric==='loads'?'Load '+(i+1)+': ':'')+e(d.refs.join(', '))+'</b> · '+(d.complete===true?'Received':d.complete===false?'Receipt incomplete':'Scheduled')+(d.complete===false?' <small>'+e(unique(list(d.readings).filter(x=>x.complete!==true).map(x=>x.ref+': '+(x.reason||'No receipt recorded.'))).join(' '))+'</small>':'')+'</li>').join('')+'</ul>':'')+
 (l.pickups&&l.title!=='DAY’S PICKUPS'?'<p>Pickup references scheduled: '+l.pickups+'.</p>':'');
}
root.BuildLoads987={create,receipt,view,details};
})(typeof window!=='undefined'?window:globalThis);
