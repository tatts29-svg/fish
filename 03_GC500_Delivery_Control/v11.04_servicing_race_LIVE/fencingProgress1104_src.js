/* Author: Andrew Fisher. Installed fencing scope; source records remain unchanged. */
(function(root){
'use strict';
const list=value=>Array.isArray(value)?value:[],number=value=>typeof value==='number'&&Number.isFinite(value);
const installedTypes=['clean','ccb_event','ccb_demarc','flat_feet'];
function rows(summary,fencing){
 const result=list(summary?.fencingRows).map(row=>({...row}));
 const cleanRows=result.filter(row=>row.id==='clean');
 if(cleanRows.length!==1)return result;
 const source=list(fencing?.summaryRows),clean=source.filter(row=>row.id==='clean'),scrim=source.filter(row=>row.id==='scrim');
 const validPlan=row=>row?.unit==='m'&&number(row.planned)&&row.planned>=0&&!row.loading&&!row.missing&&!row.evidencePending&&!row.unquantifiedPlan&&!row.totalRange;
 const usable=clean.length===1&&scrim.length===1&&validPlan(clean[0])&&validPlan(scrim[0])&&
  number(clean[0].recorded)&&clean[0].recorded>=0&&!clean[0].doneRange&&!clean[0].recordedRange&&!clean[0].classificationPending;
 const target=cleanRows[0];
 if(!usable){
  Object.assign(target,{total:null,done:null,left:null,evidencePending:true});
  return result;
 }
 const total=Math.round((clean[0].planned+scrim[0].planned)*100)/100,done=clean[0].recorded;
 if(!number(total)){Object.assign(target,{total:null,done:null,left:null,evidencePending:true});return result;}
 Object.assign(target,{label:'Temporary fence (clean + braced)',unit:'m',total,done,recorded:done,left:Math.max(0,total-done),
  totalRange:null,doneRange:null,recordedRange:null,leftRange:null,pctRange:null,evidencePending:false,unquantifiedPlan:false,classificationPending:false,
  sourceProvisional:!!(target.sourceProvisional||clean[0].sourceProvisional||scrim[0].sourceProvisional),installedScope1104:true});
 return result;
}
const api={installedTypes,rows};root.FencingProgress1104=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
