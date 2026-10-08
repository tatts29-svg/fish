/* Author: Andrew Fisher. Door labels and inventory ownership read the existing physical-unit identities. */
(function(root){
'use strict';
const text=v=>String(v==null?'':v).trim();
const same=(a,b)=>text(a).toLowerCase().replace(/[^a-z0-9]+/g,'')===text(b).toLowerCase().replace(/[^a-z0-9]+/g,'');
const doorItem=item=>/toilet|\bfwf\b|pan\s*block|ablution|pee\s*panel|building|ticket\s*box|\bcont(?:ainer)?\b/i.test(item||'')&&!/tank/i.test(item||'');
function doorRows(rows,units){
 return rows.map(r=>{if(!r.no)return r;const matches=units.filter(u=>u.physical&&text(u.assetNo)===text(r.no));return matches.length===1&&doorItem(matches[0].item)&&!same(r.item,matches[0].item)?Object.assign({},r,{item:matches[0].item}):r;});
}
function allocation(units,item,on,company){
 const rows=units.filter(u=>u.physical&&same(u.item,item));
 // A partial arrival does not identify which of several units is on site.
 if(!(on>0)||rows.length!==on||new Set(rows.map(u=>u.id)).size!==rows.length)return null;
 const out={coates:0,sub:0,cos:{},nonum:0,numbers:[]};
 rows.forEach(u=>{if(u.owner==='coates'&&text(u.assetNo)){out.coates++;out.numbers.push(text(u.assetNo));}else if(u.owner&&u.owner!=='coates'&&u.owner!=='unknown'){const co=company(u.owner);out.sub++;out.cos[co]=(out.cos[co]||0)+1;}else out.nonum++;});
 return out;
}
function reconcileInventory(I,unitsOf,company){
 I.list.forEach(r=>{if(!same(r.item,'VMS'))return;Object.values(r.refs||{}).forEach(ref=>{
  const next=allocation(unitsOf(ref.key),r.item,ref.on,company);if(!next)return;
  r.coates+=next.coates-ref.coates;r.nonum+=next.nonum-ref.nonum;
  for(const [co,n] of Object.entries(ref.cos||{})){r.sub[co]=(r.sub[co]||0)-n;if(!r.sub[co])delete r.sub[co];}
  for(const [co,n] of Object.entries(next.cos))r.sub[co]=(r.sub[co]||0)+n;
  Object.assign(ref,{coates:next.coates,sub:next.sub,cos:next.cos,nonum:next.nonum});
 });});
 const cos={};I.list.forEach(r=>{for(const [co,n] of Object.entries(r.sub||{}))(cos[co]||(cos[co]={at:0,spare:0})).at+=n;for(const [co,n] of Object.entries(r.spareSub||{}))(cos[co]||(cos[co]={at:0,spare:0})).spare+=n;});I.cos=cos;
 return I;
}
const API={doorRows,allocation,reconcileInventory};root.Projection938=API;
if(typeof document==='undefined')return;
function physical(a){return a&&typeof gcUnits925==='function'?gcUnits925(a,{loading:false}):[];}
const loadingBefore=loading872Rows;
loading872Rows=function(a){const rows=loadingBefore(a);return rows.some(r=>r.no)?doorRows(rows,physical(a)):rows;};
const inventoryBefore=inventory;
inventory=function(){return reconcileInventory(inventoryBefore.apply(this,arguments),ref=>physical(assetOf(ref)),Units925.company);};
// Only the Inventory drill reads this helper; pricing and native asset lists keep their existing APIs.
root.inventoryNumbers938=function(a,item,on){if(a&&same(item,'VMS')){const next=allocation(physical(a),item,on,Units925.company);if(next)return next.numbers;}return invItemNums(a,item);};
})(typeof window!=='undefined'?window:globalThis);
