/* Author: Andrew Fisher. One departure projection from native typed collection evidence. Historical hire scope stays intact. */
(function(W){
 'use strict';
 const normal=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' '),list=x=>Array.isArray(x)?x:[];
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function read(key,day=todayIso()){return heldMemo('departure1211:'+key+':'+day,()=>W.DemobCollection996.read(key,day));}
 function stamp(event){
  const t=event?.departedAt1211;
  return t&&Number.isFinite(Date.parse(t))?new Date(t).toLocaleString('en-AU',{timeZone:'Australia/Brisbane',hour12:false})+' AEST':event?.date?event.date+' · departure time not recorded':'Departure time not recorded';
 }
 function project(r){
  if(!r)return null;
  const events=list(r.events),n=xs=>list(xs).reduce((sum,x)=>sum+(Number(x.n)||0),0),collected=n(r.collected),remaining=n(r.remaining);
  return {collected,remaining,complete:r.complete,unknown:r.unknown,issues:[...r.issues],arrival:!!r.arrival,items:r.remaining,events,
   label:r.issues.length?'Departure record needs review':r.complete?'Left site':collected?collected+' left · '+remaining+' to leave':'Still to leave',
   last:events.length?stamp(events.at(-1)):'No collection recorded',known:!r.issues.length};
 }
 function status(key,day){return project(read(key,day));}
 function unit(key,id,day){const r=read(key,day);if(!r||r.issues.length)return null;return r.events.find(c=>c.items.some(i=>list(i.unitIds).includes(id)))||(r.complete?r.events.at(-1):null);}
 function remainingModel(a,model,day){const r=read(a.key,day);if(!r?.recorded||r.issues.length)return model;return {...model,rows:model.rows.filter(u=>!u.physical||!unit(a.key,u.id,day))};}
 function all(){return holdAssets(()=>demob816().refs.map(r=>({key:r.key,...status(r.key)})));}
 function unitHtml(key,id){const c=unit(key,id);return c?'<p class="departure1211-unit" style="padding:8px;border:1px solid #168958;border-radius:6px;color:#08643f;background:#e4f7ec"><b>↗ LEFT SITE</b> · '+escape(stamp(c))+'</p>':'';}
 function vms(model,day){
  if(!model?.boards)return model;
  const boards=model.boards.map(b=>{
   if(!b.delivery)return b;const r=read(b.delivery,day);if(!r?.recorded||r.issues.length)return b;
   const native=vms913Boards().find(x=>x.key===b.key),id=native&&vms913Of(native),owner=id&&Units925.owner(id.co),number=String(id?.fleet||'');
   const event=r.events.find(c=>c.items.some(i=>normal(i.type)==='vms'&&list(i.physicalUnits).some(u=>u.owner===owner&&String(u.number)===number&&number)))||(r.complete?r.events.at(-1):null);
   return event?{...b,on:false,done:false,installed:false,received:true,state:'not on site',departure1211:{label:'Left site',at:stamp(event)}}:b;
  });
  return {...model,boards,on:boards.filter(b=>b.on).length,done:boards.filter(b=>b.done).length,installed:boards.filter(b=>b.installed).length};
 }
 function open(key,preset){return W.DemobCollection996.open(key,preset);}
 W.Departure1211=Object.freeze({read,status,project,stamp,unit,unitHtml,remainingModel,all,vms,open});
})(window);
