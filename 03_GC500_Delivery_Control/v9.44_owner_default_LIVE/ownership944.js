/* Author: Andrew Fisher. Latest ownership instruction: Coates unless a named supplier is recorded. */
(function(root){
'use strict';
const text=v=>String(v==null?'':v).trim();
function unspecified(value){const s=text(value).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').replace(/^other-/,'');return !s||['unknown','to-confirm','owner-to-confirm','supplier-not-named','supplier-not-on-the-record','not-recorded','unconfirmed'].includes(s);}
function coates(value){return /^(?:coates|coates[ -]hire)$/i.test(text(value));}
function named(value){return !unspecified(value)&&!coates(value);}
function owner(value){return unspecified(value)||coates(value)?'coates':value;}
function model(m){
 const by=new Map(),rows=m.rows.map(u=>{
  if(!unspecified(u.owner))return u;
  const next=Object.assign({},u,{recordedOwner944:u.owner,owner:'coates',ownerBasis944:'Andrew confirmed unassigned ownership as Coates, 9 Oct 2026'});
  // The original source key, token and unit ID remain stable for work and photographs.
  if(/^sub[- ]?hire\s*:\s*/i.test(text(next.label)))next.label=next.item||'Coates unit';
  by.set(u,next);return next;
 });
 return Object.assign({},m,{rows,groups:m.groups.map(g=>Object.assign({},g,{units:g.units.map(u=>by.get(u)||u)}))});
}
function runOwners(evtN,evtUnk,subs,site,coatesCount,planned){
 const supplier=subs.filter(s=>named(s.co)),whole=site&&named(site.co),plannedCount=planned.reduce((n,x)=>n+(Number.isFinite(x.n)?x.n:0),0);
 const names=[...new Set(supplier.map(s=>s.co).concat(whole?[site.co]:[]).concat(planned.length?['Event Portables']:[]))];
 const co=names.join(', ');
 if(evtUnk)return {streams:[{s:supplier.length||whole||planned.length?'sub':'coates',n:evtN}],ownerUnk:0,co};
 const sub=Math.min(evtN,Math.max(supplier.length,plannedCount,whole?Math.max(0,evtN-coatesCount):0)),own=evtN-sub;
 return {streams:[sub?{s:'sub',n:sub}:null,own?{s:'coates',n:own}:null].filter(Boolean),ownerUnk:0,co};
}
const api={unspecified,coates,named,owner,model,runOwners};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.Ownership944=api;
})(typeof window!=='undefined'?window:null);
