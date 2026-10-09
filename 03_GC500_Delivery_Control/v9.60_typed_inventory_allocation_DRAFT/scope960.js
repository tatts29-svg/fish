/* Author: Andrew Fisher. Shared source-scope reading; quantities remain unchanged. */
(function(root){
'use strict';
const escape=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function evidence(history,review,latest){
 const row=(history||[]).find(x=>x[0]==='R16'&&x[1]==='done'),words=row?.[3]||'',match=/\bSupply remains\s+(\d+)\s+VMS boards\b/i.exec(words)||/\b(\d+)\s+required\b/i.exec(row?.[2]||'');
 const date=/Confirmation recorded\s+([^.]*)/i.exec(words)?.[1]||'';
 return {requirement:match?Number(match[1]):null,confirmedOn:date,boq:review?.vms_boq??null,source:latest?.source||review?.source||'Current schedule',reviewed:latest?.reviewed||review?.reviewed||''};
}
function currentEvidence(){return evidence(typeof QHIST==='undefined'?[]:QHIST,typeof DATA==='undefined'?{}:DATA.schedule_review875,typeof DATA==='undefined'?{}:DATA.schedule_review950||DATA.schedule_review6);}
function vmsBasis(total,source){
 const e=source||currentEvidence(),req=e.requirement==null?'Recorded requirement is unresolved':'Earlier confirmed requirement: '+e.requirement+' boards'+(e.confirmedOn?' ('+e.confirmedOn+')':'');
 return 'Schedule basis: '+total+' boards. '+req+'. Latest source: '+e.source+(e.reviewed?' · reviewed '+e.reviewed:'')+'.'+(e.boq!=null?' BOQ history: '+e.boq+'.':'')+' Scope awaits reconciliation; no unit or hire is removed automatically. Relocations add no hire units.';
}
function applyScope(row,source){
 if(!row||!Number.isFinite(row.total))return row;
 const e=source||currentEvidence();row.scopeProvisional960=e.requirement==null||row.total!==e.requirement;
 if(!row.scopeProvisional960)return row;
 row.scopeNote960=vmsBasis(row.total,e);
 row.pctKind=Number.isFinite(row.pct)?'provisional-scope':row.pctKind;
 row.pctLabel='Complete against schedule · provisional scope';
 row.basis=(row.basis||'')+' '+row.scopeNote960;
 row.issues=[...new Set([...(row.issues||[]),row.scopeNote960])];
 return row;
}
function requirementHtml(total,source){
 const e=source||currentEvidence(),unknown=!Number.isFinite(total),provisional=unknown||e.requirement==null||e.requirement!==total;
 const title=e.requirement==null?'VMS requirement unresolved':'VMS recorded requirement: '+e.requirement+' boards';
 const basis=unknown?'Current schedule quantity unavailable. '+(e.confirmedOn?'Requirement confirmation recorded '+e.confirmedOn+'. ':'')+'Scope awaits reconciliation.':provisional?vmsBasis(total,e):'Current schedule and recorded requirement agree: '+total+' boards'+(e.confirmedOn?' · requirement recorded '+e.confirmedOn:'')+'. Relocations add no hire units.';
 return '<div class="notice" data-vms-requirement747><b>'+escape(title+(provisional?' · schedule scope unresolved':''))+'</b><p>'+escape(basis)+'</p></div>';
}
function lightingNote(row){
 const a=row?.scope894;if(!a?.confirmed)return '';
 const surplus=(a.surplus||[]).reduce((n,g)=>n+(Number(g.surplus)||0),0);
 return 'Approved D024 plan: '+row.done+' of '+row.total+' towers complete. Equipment inventory: '+a.complete+' complete of '+a.recorded+' recorded'+(surplus?' · '+surplus+' surplus against the plan':'')+'.';
}
root.Scope960={applyScope,vmsBasis,lightingNote,evidence,currentEvidence,requirementHtml};
})(typeof window!=='undefined'?window:globalThis);
