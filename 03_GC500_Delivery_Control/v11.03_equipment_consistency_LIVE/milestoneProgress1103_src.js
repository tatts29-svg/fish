/* Author: Andrew Fisher. Milestone percentages use the selected-day qualified work scope. */
(function(root){
'use strict';
const number=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
function project(area,summary,percent){
 const a=area||{},s=summary||{},p=percent||root.ProgressPercent1012;
 const reading=s.byId?.[a.id],ready=!!s.health?.ready,stale=!!s.health?.stale;
 const supported=reading&&['confirmed','lower-bound','provisional-scope','recorded-scope'].includes(reading.pctKind);
 const total=ready&&number(reading?.total)?reading.total:null;
 const done=ready&&number(reading?.done)?reading.done:null;
 const known=ready&&supported&&total>0&&number(done)&&number(reading.pct);
 const lower=known&&reading.pctKind==='lower-bound';
 const provisional=known&&(reading.pctKind==='provisional-scope'||reading.pctKind==='recorded-scope'||!!reading.scopeProvisional960);
 // Raw quantities decide completion. A display rounding boundary cannot do so.
 const raw=known?Math.max(0,Math.min(done<total?100-Number.EPSILON*100:100,reading.pct)):null;
 const pct=raw===null?null:p.display(raw,lower);
 const complete=known&&!stale&&!lower&&!provisional&&reading.pctKind==='confirmed'&&done===total&&
  !reading.reviewQuantity&&!reading.unquantifiedRefs&&!a.shortConflictRefs&&!a.missing;
 const label=known?(lower?'≥':'')+p.text(raw,lower)+'%'+(provisional?' · provisional scope':''):'Percentage unconfirmed';
 return {ready,known,stale,total,done,left:total!==null&&done!==null?Math.max(0,total-done):null,
  pct,rawPct:raw,lower,provisional,confirmedComplete:complete,label,
  basis:reading?.scopeNote960||reading?.basis||a.basis||''};
}
function read(area,day){
 const at=day||todayIso();
 const summary=typeof heldMemo==='function'?heldMemo('milestoneProgress1103|'+at,()=>todayWorkSummary848(at)):todayWorkSummary848(at);
 return project(area,summary,root.ProgressPercent1012);
}
// Plain text only: callers escape this at the screen and print boundaries.
function summaryText(f){
 const p=f?.progress1103;
 if(!p?.known)return 'Completion quantity unconfirmed';
 return p.done+' of '+p.total+(f.unit?' '+f.unit:'')+' complete';
}
function unitsText(f){
 const p=f?.progress1103;
 if(!p?.known)return 'Completion quantity unconfirmed';
 return p.done+' of '+p.total+(f.unit?' '+f.unit:'')+' done · '+p.left+' left';
}
function remainingText(f){
 const p=f?.progress1103;
 if(!p?.known)return 'completion unconfirmed';
 if(f.reached)return 'complete';
 const references=number(f.total)&&number(f.complete)?Math.max(0,f.total-f.complete):null;
 if(references>0)return references+' reference'+(references===1?'':'s')+' to go';
 if(p.left>0)return p.left+(f.unit?' '+f.unit:' units')+' to go';
 return 'completion not verified';
}
const api=Object.freeze({project,read,summaryText,unitsText,remainingText});root.MilestoneProgress1103=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
