/* Author: Andrew Fisher. Native fencing read adapter; no record writes or inferred section sign-offs. */
(function(){
'use strict';
const PRIVATE_INPUT = __FENCING_PRIVATE_INPUT_JSON__;
window.gc500FencingMapSnapshot = function(){
  const names=new Map();const addName=name=>{if(name)names.set(fenceAreaKey(name),name);};
  for(const week of DATA.fencing.week_sheets||[]) for(const day of (week.plan_update||{}).rows_by_day||[]) for(const row of day.rows||[]) addName(row.location);
  for(const row of Object.values(S.fenceDone||{})) if(row&&row.name) addName(row.name);
  for(const [key,row] of Object.entries(FCOM.areas_done||{})) addName(row.name||key);
  const areaEvidence=[...names.values()].filter(Boolean).map(name=>({name,...fenceAreaDone(name)}));
  return {schema:1,author:'Andrew Fisher',...PRIVATE_INPUT,weeks:DATA.fencing.week_sheets,
    areaEvidence,sectionEvidence:[],received_at:new Date().toISOString()};
};
window.gc500FencingMapIsActive = ()=>state.tab==='map';
window.gc500FencingMapVisibility = function(on){const w=expApi();if(w&&w.GC500FencingMap)w.GC500FencingMap.setHostVisible(!!on);};
window.gc500FencingMapSource = function(id,page){
  const s=PRIVATE_INPUT.sources.concat(PRIVATE_INPUT.reference_sources||[]).find(s=>s.id===id); if(!s)return false;
  const n=Math.max(1,Math.min(s.pages,Math.trunc(Number(page)||1)));
  const u=dpFileUrl(s.document_file); if(!u)return false;
  window.open(u.replace(/#.*$/,'')+'#page='+n,'_blank','noopener');return true;
};
window.gc500FencingMapRegister = function(){go('fencing');};
let pending=null,timer=0,failed=false;
function cancel(){clearTimeout(timer);timer=0;pending=null;}
function flush(){
  clearTimeout(timer);timer=0;if(!pending)return;
  if(state.tab!=='map'){cancel();return;}
  if(Date.now()-pending.at>30000){failed=true;cancel();flash('The fencing layer did not open. Choose View fencing on map again to retry.');return;}
  const w=expApi();
  if(w&&w.GC500FencingMap){const id=pending.id;failed=false;cancel();w.GC500FencingMap.open(id);return;}
  timer=setTimeout(flush,200);
}
window.gc500OpenFencingMap=function(id){
  if(!expOpen2d())return false;
  if(failed&&EXP.frame){EXP.loaded=false;EXP.frame.src=expUrl();failed=false;}
  pending={id:typeof id==='string'?id:null,at:Date.now()};flush();return true;
};
document.addEventListener('click',e=>{if(e.target.closest('[data-open-fencing-map]'))window.gc500OpenFencingMap();});
window.addEventListener('pagehide',cancel);
})();
