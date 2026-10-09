/* Author: Andrew Fisher. Read-only typed identity projection; quantities remain native. */
(function(root){
'use strict';
const text=v=>String(v==null?'':v).trim();
const normal=v=>text(v).toLowerCase().replace(/[^a-z0-9]+/g,'');
const same=(a,b)=>normal(a)===normal(b);
const uniqueItems=model=>new Set((model?.groups||[]).filter(g=>g.quantity!=null&&g.item).map(g=>normal(g.item)));
const managed=(model,item)=>uniqueItems(model).size>1||same(item,'VMS');
function allocation(model,item,on,company,ref){
 if(!managed(model,item)||!(on>0))return null;
 const quantityOnly=ref==='WC09'&&same(item,'Pee Panel');
 const rows=(model?.rows||[]).filter(u=>u.physical&&u.id&&same(u.item,item));
 const out={coates:0,sub:0,cos:{},nonum:quantityOnly?0:on,numbers:[],quantityOnly};
 // Full typed identity coverage is required: partial arrivals cannot tell us which units arrived.
 if(rows.length!==on||new Set(rows.map(u=>u.id)).size!==rows.length)return same(item,'VMS')?null:out;
 if(rows.some(u=>text(u.ref)&&u.ref!==ref))return out;
 const fleet=rows.filter(u=>text(u.assetNo)).map(u=>JSON.stringify([u.owner,text(u.assetNo)]));
 if(new Set(fleet).size!==fleet.length)return out;
 out.nonum=0;
 for(const u of rows){
  if(u.owner==='coates'&&text(u.assetNo)){out.coates++;out.numbers.push(text(u.assetNo));}
  else if(u.owner&&u.owner!=='coates'&&u.owner!=='unknown'){
   const co=company(u.owner);out.sub++;out.cos[co]=(out.cos[co]||0)+1;
  }else if(!quantityOnly)out.nonum++;
 }
 return out;
}
function reconcileInventory(I,modelOf,company){
 const cache=new Map(),model=key=>{if(!cache.has(key))cache.set(key,modelOf(key));return cache.get(key);};
 I.list.forEach(r=>{
  const refs=Object.values(r.refs||{});
  refs.forEach(ref=>{
   const next=allocation(model(ref.key),r.item,ref.on,company,ref.key);if(!next)return;
   r.coates+=next.coates-ref.coates;r.nonum+=next.nonum-ref.nonum;
   for(const [co,n] of Object.entries(ref.cos||{})){r.sub[co]=(r.sub[co]||0)-n;if(!r.sub[co])delete r.sub[co];}
   for(const [co,n] of Object.entries(next.cos))r.sub[co]=(r.sub[co]||0)+n;
   Object.assign(ref,{coates:next.coates,sub:next.sub,cos:next.cos,nonum:next.nonum,quantityOnly960:next.quantityOnly});
  });
  if(refs.length&&refs.every(ref=>ref.key==='WC09'&&same(r.item,'Pee Panel')))r.unnum=true;
 });
 const cos={};I.list.forEach(r=>{for(const [co,n] of Object.entries(r.sub||{}))(cos[co]||(cos[co]={at:0,spare:0})).at+=n;for(const [co,n] of Object.entries(r.spareSub||{}))(cos[co]||(cos[co]={at:0,spare:0})).spare+=n;});I.cos=cos;
 return I;
}
root.Inventory960={allocation,reconcileInventory,managed};
root.Inventory960.unitDescription=function(model,ref,owner,assetNo){
 const rows=(model?.rows||[]).filter(u=>u.physical&&u.id&&u.ref===ref&&u.owner===owner&&text(u.assetNo).toUpperCase()===text(assetNo).toUpperCase()&&text(assetNo));
 return rows.length===1?text(rows[0].item):'';
};
if(typeof document==='undefined')return;
const modelOf=key=>{const a=assetOf(key);return a?gcModel925(a,{loading:false}):{rows:[],groups:[]};};
const before=inventory;
inventory=function(){return reconcileInventory(before.apply(this,arguments),modelOf,Units925.company);};
const numbersBefore=inventoryNumbers938;
root.inventoryNumbers938=function(a,item,on){
 const model=a?modelOf(a.key):null,next=allocation(model,item,on,Units925.company,a?.key);
 return next?next.numbers:managed(model,item)&&!same(item,'VMS')?[]:numbersBefore.apply(this,arguments);
};
})(typeof window!=='undefined'?window:globalThis);
