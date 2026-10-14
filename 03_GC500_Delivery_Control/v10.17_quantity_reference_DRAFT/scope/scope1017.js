/* Author: Andrew Fisher. Planned quantity edits preserve the scope already received and installed. */
(function(root){
'use strict';
const KIND='quantityScope1017',key=ref=>KIND+'/'+ref;
const integer=v=>v!=null&&String(v).trim()!==''&&Number.isInteger(Number(v))&&Number(v)>=0?Number(v):null;
const day=at=>{const t=Date.parse(at);return Number.isFinite(t)?new Date(t+36000000).toISOString().slice(0,10):'';};
const sum=(rows,name)=>rows.reduce((n,r)=>n+r[name],0);
function unitEvidence(ref,discipline,item,labour,stamps){
 const rows={},suffix='|'+discipline+'|'+item+'|install';
 // Native unticking deletes the value but retains its audit stamp.
 const keys=new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]);
 for(const k of keys)if(k.startsWith(ref+'/u')&&k.endsWith(suffix)&&k!==ref+'/urest'+suffix)rows[k]={on:!!labour?.[k],at:stamps?.['labour/'+k]||''};
 return rows;
}
function project(old,e,quantity,asOf,at){
 if(!old||integer(quantity)==null)return null;
 const valid=t=>!!day(t)&&day(t)<=asOf;
 const newer=(t,before)=>t!==before&&valid(t)&&Date.parse(t)>=Date.parse(at);
 const receiptChanged=newer(e.suppliedAt,old.suppliedAt)&&integer(e.supplied)!=null;
 const onChanged=newer(e.onAt,old.onAt)&&e.on;
 const doneChanged=newer(e.doneAt,old.doneAt);
 let arrived=(old.receipts||[]).filter(r=>valid(r.at)).reduce((n,r)=>n+r.quantity,0);
 if(!(old.receipts||[]).length&&(old.receiptAt?valid(old.receiptAt):asOf>=day(at)))arrived=old.received;
 if(receiptChanged)arrived=e.supplied+e.rest;
 else if(onChanged||doneChanged&&e.done){arrived=integer(e.supplied)!=null?e.supplied+e.rest:quantity;}
 else if(e.rest>old.rest)arrived+=e.rest-old.rest;
 let done=(old.installAt?valid(old.installAt):asOf>=day(at))?old.installed:0;
 if(doneChanged)done=!e.done?0:receiptChanged&&Date.parse(e.doneAt)<Date.parse(e.suppliedAt)?Math.min(arrived,old.installed):arrived;
 if(newer(e.installAt,old.installAt))done=!e.install?0:receiptChanged&&Date.parse(e.installAt)<Date.parse(e.suppliedAt)?Math.min(arrived,old.installed):arrived;
 if(!doneChanged&&!newer(e.installAt,old.installAt)){
  for(const [k,u]of Object.entries(e.unitWork||{})){
   const was=old.unitWork?.[k];if(!newer(u.at,was?.at||''))continue;
   if(u.on&&!was?.on)done++;else if(!u.on&&was?.on)done--;
  }
 }
 arrived=Math.max(0,arrived);done=Math.max(0,Math.min(arrived,done));
 return {item:old.item,quantity,arrived,done,complete:quantity>0&&done>=quantity,
  conflict:false,reviewQuantity:0,held:Math.max(0,quantity-arrived),recordedComplete:done>=quantity,
  receiptDay:day(receiptChanged?e.suppliedAt:old.receiptAt)||null,
  installDay:day(doneChanged?e.doneAt:old.installAt)||null,
  explicitInstall:!!e.install,status:done+' of '+quantity+' installed · '+arrived+' received',
  basis:'Received and installed quantities retained when the planned quantity changed.'};
}
const api={kind:KIND,key,integer,project,unitEvidence};root.Scope1017=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const clone=x=>JSON.parse(JSON.stringify(x));
function record(a){const ref=typeof a==='string'?a:a?.key,r=(S.loads||{})[key(ref)];return r?.kind===KIND&&r.ref===ref&&Array.isArray(r.items)&&(r.typed??null)===((S.qtys||{})[ref]??null)?r:null;}
api.record=record;
api.has=a=>!!record(a);
function evidence(a,item,d){
 const lines=chargeLines(a),line=lines.find(l=>l.item===item),lk=a.key+'|'+line?.discipline+'|'+item+'|install';
 const receipts=((S.supplied||{})[a.key]?.items||[]).filter(r=>r.asked===item),r=receipts.length===1?receipts[0]:null;
 const unitWork=unitEvidence(a.key,line?.discipline,item,S.labour,S.stamps);
 return {supplied:integer(r?.qty_supplied),suppliedAt:(S.stamps||{})['supplied/'+a.key+'/'+item]||'',
  on:!!(d.recorded&&d.state==='on site'),onAt:d.set_at||'',done:!!d.done,doneAt:d.done_at||'',
  install:!!(S.labour||{})[lk],installAt:(S.stamps||{})['labour/'+lk]||'',rest:restArrived(a,item)||0,unitWork};
}
function read(a,item,d,asOf){
 const r=record(a),old=r?.items.find(x=>x.item===item);if(!old)return null;
 const lines=chargeLines(a).filter(l=>l.item===item),qs=lines.map(qtyOf);if(!qs.length||qs.some(q=>integer(q)==null))return null;
 return project(old,evidence(a,item,d),qs.reduce((n,q)=>n+q,0),asOf,r.at);
}
api.read=read;
const item0=toiletItem962;
toiletItem962=function(a,item,d,asOf,nativeOn){return read(a,item,d,asOf)||item0.apply(this,arguments);};
const items0=itemRows;
itemRows=function(a){
 const rows=items0.apply(this,arguments);if(!record(a))return rows;
 return rows.map(r=>{const x=read(a,r.asked,deliveryOf(a.key),todayIso());return x?{...r,qty_supplied:Math.max(0,x.arrived-(restArrived(a,r.asked)||0))}:r;});
};
api.capture=function(a){
 const lines=chargeLines(a),d=deliveryOf(a.key),asOf=todayIso(),irs=itemRows(a),items=[];
 let receipts=[];
 if(a.product==='Toilet'||a.discipline==='Toilets & amenities')receipts=Supplier996.model().receipts.filter(r=>r.ref===a.key);
 for(const item of [...new Set(lines.map(l=>l.item))]){
  const mine=lines.filter(l=>l.item===item),qs=mine.map(qtyOf);if(qs.some(q=>integer(q)==null))return null;
  const quantity=qs.reduce((n,q)=>n+q,0),ir=irs.find(r=>r.asked===item),e=evidence(a,item,d);
  const raw=invOnSite(a,asOf)?(integer(ir?.qty_supplied)??quantity)+(integer(ir?.qty_supplied)!=null?e.rest:0):0;
  const x=toiletItem962(a,item,d,asOf,raw);
  const received=CurrentStock996.received(a,item,asOf,x?x.arrived:raw);
  const split=typeof split900==='function'?split900(a,d,mine):null;
  const installed=x?x.done:d.done?Math.max(0,Math.min(received,quantity-(split?.withheld||0))):0;
  let parts=receipts.filter(r=>r.item===item&&r.count>0&&r.at).map(r=>({at:r.at,quantity:r.count}));
  const prior=record(a)?.items.find(r=>r.item===item);
  const firstOn=(histOf(a.key,'history')||[]).filter(h=>h.state==='on site'&&day(h.at)).map(h=>h.at).sort()[0]||'';
  const receiptAt=parts[0]?.at||prior?.receiptAt||e.suppliedAt||firstOn||(e.on?e.onAt:'')||'';
  if(!parts.length&&received&&receiptAt)parts=[{at:receiptAt,quantity:received}];
  items.push({item,quantity,received,installed,receipts:parts,receiptAt,
   ...e,installAt:x?.installDay?e.installAt||e.doneAt:e.doneAt||e.installAt,
   rest:e.rest});
 }
 return {kind:KIND,ref:a.key,firstQuantity:qtyOf(lines[0]),items};
};
api.allowed=function(snapshot,target){
 if(!snapshot?.items.length||integer(target)==null)return false;
 const first=snapshot.items[0],total=target+first.quantity-(snapshot.firstQuantity??first.quantity);
 return total>=Math.max(first.received,first.installed);
};
api.itemAllowed=function(a,target){
 const r=record(a),first=r?.items[0];if(!first||target===first.item)return true;
 const d=deliveryOf(a.key);return !(first.received||first.installed||d.done||d.state==='on site');
};
api.save=function(snapshot,by){
 if(!snapshot)return;
 S.loads=S.loads||{};const at=new Date().toISOString();S.loads[key(snapshot.ref)]={...clone(snapshot),typed:(S.qtys||{})[snapshot.ref]??null,at,by};
};
api.receiptBaseline=function(a,item,prior){
 const old=record(a)?.items.find(r=>r.item===item);
 return old?.receipts?.length?old.receipts.map(r=>({...r,basis:'Received before the planned quantity changed'})):prior;
};
api.rows=function(a,d,lines,asOf){return toiletRows962(a,d,lines,asOf);};
})(typeof window!=='undefined'?window:globalThis);
