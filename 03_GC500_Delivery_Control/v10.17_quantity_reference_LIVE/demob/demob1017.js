/* Author: Andrew Fisher. Collection planning uses canonical references and current VMS assignments. */
(function(root){
'use strict';
function eligible(canonical,unavailable){
 return canonical.filter(a=>!a._cancelled&&!a.relocation&&!a.rest_of&&!unavailable(a.key));
}
function units(asset,rows,project){
 return rows.map(row=>{
  if(row.type!=='VMS'||row.unknown||!Number.isFinite(row.n))return row;
  const n=project(asset,row.type,row.n);
  return Number.isFinite(n)&&n>=0&&n!==row.n?{...row,n,movement1017:{receivedOrPlanned:row.n,currentScope:n}}:row;
 });
}
function description(row,format){
 if(!row.units.some(u=>u.movement1017))return format(row.a);
 // The original schedule's "VMS × 8" remains in source history; it must not
 // override the seven boards now awaiting collection from this reference.
 const name=String(row.a.name||'').split(/\s*·\s*/).filter(s=>!/^\s*VMS(?:\s*[x×]\s*\d+(?:\.\d+)?)?\s*$/i.test(s)).join(' · ');
 const item_types=row.units.map(u=>u.unknown?u.type:u.type+' × '+u.n);
 return format({...row.a,name,item_types});
}
const api={eligible,units,description};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root)return;
if(root.DemobScope1017)throw Error('Demob scope projection already installed');
root.DemobScope1017=api;
const before=units816;
units816=function(a){return units(a,before.apply(this,arguments),(asset,item,n)=>VmsAssignment1016.quantity(asset,item,todayIso(),n));};
})(typeof window!=='undefined'?window:null);
