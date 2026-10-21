/* Author: Andrew Fisher. Read-only Equipment completion from the same native scope as Today. */
(function(root){
'use strict';
const number=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const unique=rows=>[...new Map((rows||[]).filter(r=>r&&r.key).map(r=>[r.key,r])).values()];
const escape=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ratio=(done,total)=>number(done)&&number(total)&&total>0?(done<total?Math.min(100-Number.EPSILON*100,done/total*100):done/total*100):null;
function project(input,options){
 const o=options||{},health=o.health||{ready:true},rows=unique(input);
 const unknown=rows.some(r=>!number(r.quantity)),review=rows.some(r=>r.recordedComplete&&!r.complete||r.conflict);
 let total=unknown?null:rows.reduce((n,r)=>n+r.quantity,0),done=rows.reduce((n,r)=>n+(number(r.done)?r.done:0),0);
 let knownTotal=rows.reduce((n,r)=>n+(number(r.quantity)?r.quantity:number(r.knownQuantity)?r.knownQuantity:0),0);
 const canonical=o.canonical;
 if(canonical){total=number(canonical.total)?canonical.total:null;done=number(canonical.done)?canonical.done:null;knownTotal=number(canonical.knownTotal)?canonical.knownTotal:knownTotal;}
 const lowerBound=canonical?canonical.pctKind==='lower-bound':review;
 if(!health.ready){total=null;done=null;knownTotal=null;}
 const pct=number(total)&&total>0&&number(done)&&canonical&&number(canonical.pct)&&health.ready?canonical.pct:ratio(done,total);
 const complete=health.ready&&number(total)&&total>0&&done===total&&!lowerBound&&!unknown&&!o.unresolved;
 const received=health.ready&&number(o.received)?o.received:null,installed=health.ready&&number(o.installed)?o.installed:null;
 return {group:o.group||'',asOf:o.day||null,unit:o.unit||'units',total,knownTotal,done,pct,left:number(total)&&number(done)?Math.max(0,total-done):null,
  complete,lowerBound,unknown:total==null,health,filtered:!!o.filtered,received,installed,refs:rows.map(r=>r.key),
  excluded:[...new Set(o.excluded||[])],scopeNote:o.scopeNote||'',basis:'Confirmed completion · quantities, not supplied-description entries'};
}
function nativeEnvironment(){
 return {
  day:()=>todayIso(),health:()=>todayWorkHealth840(),
  metrics:day=>heldMemo('equipmentProgress1103|'+day,()=>{const areas=todayWorkMetrics840(day),groups=todayGroupDetails841(day,areas),summary=todayWorkSummary848(day,areas,groups);return {areas,summary,types:todayTypeMetrics843(day,groups,summary)};}),
  physical:list=>physicalCountAssets963(list).assets,
  includes:a=>CompletionScope1098.includes(a),moved:key=>movedAway(key),
  lines:a=>chargeLines(a),quantity:l=>qtyOf(l),delivery:(key,day)=>deliveryAsOf(key,day),shorts:a=>shortOf(a),
  boardCount:day=>root.VMSArrival1098?.count(day)
 };
}
function fallbackRows(assets,day,e){
 return assets.map(a=>{
  const lines=e.lines(a)||[],values=lines.map(l=>e.quantity(l));
  const unknown=!values.length||values.some(q=>!number(q)||!Number.isInteger(q));
  const quantity=values.reduce((n,q)=>n+(number(q)?q:0),0),d=e.delivery(a.key,day)||{};
  const conflict=!!d.done&&(e.shorts(a)||[]).some(s=>lines.some(l=>l.item===s.item));
  const complete=!!d.done&&!conflict;
  return {key:a.key,quantity:unknown?null:quantity,knownQuantity:quantity,done:complete?quantity:0,complete,recordedComplete:!!d.done,conflict};
 });
}
/* Non-headline trades still inherit native type uncertainty (for example an
 * unresolved physical unit). A numeric schedule cell alone cannot settle it. */
function typeRows(native,assets,day,e){
 const keys=new Set(assets.map(a=>a.key)),byKey=new Map(),seen=new Set();
 for(const type of Object.values(native.types?.byCard||{}).flat())for(const r of type.rows||[]){
  const identity=JSON.stringify([type.id||type.groupName||'',type.name||'',r.key]);
  if(!keys.has(r.key)||seen.has(identity))continue;seen.add(identity);
  if(!byKey.has(r.key))byKey.set(r.key,[]);byKey.get(r.key).push(r);
 }
 return assets.flatMap(a=>{
  const values=byKey.get(a.key);if(!values)return fallbackRows([a],day,e);
  const known=values.reduce((n,r)=>n+(number(r.quantity)?r.quantity:number(r.knownQuantity)?r.knownQuantity:0),0);
  return [{key:a.key,quantity:values.every(r=>number(r.quantity))?known:null,knownQuantity:known,
   done:values.reduce((n,r)=>n+(number(r.done)?r.done:0),0),complete:values.every(r=>r.complete),
   recordedComplete:values.some(r=>r.recordedComplete),conflict:values.some(r=>r.conflict)}];
 });
}
function model(group,list,options,environment){
 const o=options||{},e=environment||nativeEnvironment(),day=o.day||e.day(),health=e.health();
 const original=Array.isArray(list)?list:[],physical=e.physical(original),excluded=[];
 const assets=physical.filter(a=>{if(!e.includes(a)){excluded.push(a.key);return false;}return !a._cancelled&&!a.relocation&&!a.rest_of&&!e.moved(a.key);});
 if(group==='VMS boards'){
  const count=e.boardCount(day),supplied=Array.isArray(o.boards),keys=new Set(assets.map(a=>a.key));
  const boards=supplied?o.boards:(count?.boards||[]).filter(b=>!o.filtered||keys.has(b.delivery)||keys.has(b.key));
  const selected=unique(boards),rows=selected.map(b=>({key:b.key,quantity:1,done:b.done?1:0,complete:!!b.done}));
  return project(rows,{group,day,unit:'boards',health:!count&&!supplied?{...health,ready:false}:health,filtered:o.filtered,excluded,
   received:selected.filter(b=>typeof b.received==='boolean'?b.received:b.on).length,installed:selected.filter(b=>b.installed).length,
   unresolved:!count&&!supplied,scopeNote:o.filtered?'Selected boards':'Every board in the physical VMS register'});
 }
 const native=e.metrics(day),area=(native.areas||[]).find(a=>a.groupName===group),keys=new Set(assets.map(a=>a.key));
 let rows=area?(area.rows||[]).filter(r=>keys.has(r.key)||!o.filtered&&r.sourceOnly1016):typeRows(native,assets,day,e);
 const canonical=area&&!o.filtered&&assets.length?native.summary?.byId?.[area.id]:null;
 const allReceived=rows.length>0&&rows.every(r=>number(r.arrived962));
 return project(rows,{group,day,unit:area?.unit||'units',health,filtered:o.filtered,excluded,canonical,
  received:allReceived?rows.reduce((n,r)=>n+r.arrived962,0):null,
  scopeNote:canonical?.scopeNote960||canonical?.scope||(!area?'Registered item quantities':o.filtered?'Selected references':'Same completion scope as Today')});
}
function displayPct(m){
 if(!number(m.pct))return null;
 const rounded=m.lowerBound?Math.floor((m.pct+1e-9)*100)/100:Math.round(m.pct*100)/100;
 return (m.pct<100?Math.min(99.99,rounded):rounded).toLocaleString('en-AU',{maximumFractionDigits:2});
}
function summary(m){
 if(!m.health.ready)return m.health.loading?'Loading completion':'Completion unavailable';
 if(!number(m.total))return (number(m.done)?m.done+' confirmed complete · ':'')+'quantity to confirm';
 if(m.total===0)return 'No completion scope in this view';
 return (m.lowerBound?'At least ':'')+m.done+' of '+m.total+' '+m.unit+' confirmed complete'+(displayPct(m)==null?'':' · '+displayPct(m)+'%');
}
function html(m){
 const title=summary(m),width=number(m.pct)?Math.max(0,Math.min(100,m.pct)):0;
 const separate=[number(m.received)?m.received+' received':null,number(m.installed)?m.installed+' installed':null].filter(Boolean).join(' · ');
 const note=[m.filtered?'Selected view':null,m.scopeNote,m.excluded.length?m.excluded.length+' reference(s) outside completion scope':null,m.health.stale?'Last shared reading':null].filter(Boolean).join(' · ');
 return '<div class="prog" data-equipment-progress1103 role="img" aria-label="'+escape(title)+'"><div class="track"><i style="width:'+width+'%"></i></div><span>'+escape(title)+'</span></div>'+
  (separate?'<p class="sub" data-equipment-receipt1103>'+escape(separate)+'</p>':'')+
  (note?'<p class="sub" data-equipment-scope1103>'+escape(note)+'</p>':'');
}
const api=Object.freeze({project,model,fallbackRows,typeRows,summary,html,displayPct});
root.EquipmentProgress1103=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
