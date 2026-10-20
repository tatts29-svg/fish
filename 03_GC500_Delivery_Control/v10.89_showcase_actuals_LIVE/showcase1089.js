/* Author: Andrew Fisher. Showcase reads the current work board and dated fencing
 * evidence. No record writes, plan-to-completion inference or combined fence total. */
(function(root){
'use strict';
const KEYS=['equipment','complete','fence','fenceprog','effort','site'];
const IDS=['buildings','toilets','barriers','generators','lighting','vms','equipment'];
const number=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0?x:null;
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>number(x)==null?'Unconfirmed':new Intl.NumberFormat('en-AU',{maximumFractionDigits:3}).format(x);
function model(input){
 const ready=!!input.health?.ready, stale=!!input.health?.stale;
 const areas=IDS.map(id=>{
  const a=(input.areas||[]).find(x=>x.id===id)||{};
  const total=ready?number(a.total):null, done=ready?number(a.done):null;
  const known=total!=null&&done!=null&&!a.missing&&!a.shortConflictRefs;
  return {id,name:id==='equipment'?'Forklifts & access':a.name||id,unit:a.unit||'units',total,done,left:known?Math.max(0,total-done):null,
   complete:known&&total>0&&done===total,known,rows:a.rows||[]};
 });
 const fences=(input.fencing?.summaryRows||[]).map(r=>({...r,
  recorded:ready&&!r.evidencePending?number(r.recorded):null,
  planned:ready&&!r.evidencePending?number(r.planned):null,
  remaining:ready&&!r.evidencePending&&!r.classificationPending?number(r.remaining):null}));
 const components=(input.components?.recorded||[]).map(r=>({...r,quantity:ready&&input.components?.state!=='unavailable'?number(r.quantity):null}));
 const rows=input.components?.rows||[], dates=[...new Set(rows.map(r=>r.date).filter(d=>d&&d<=input.day))].sort();
 const t=input.tally||{};
 const checks=Object.fromEntries(['done','total','levelled','steps','needLevel'].map(k=>[k,ready?number(t[k]):null]));
 return {day:input.day,ready,stale,areas,fences,components,checks,
  completeAreas:ready?areas.filter(a=>a.complete).length:null,
  toiletArrived:ready?number(input.toiletArrived):null,
  docketDays:ready?dates.length:null,dockets:ready?rows.length:null,
  componentIssues:!!input.components?.issues?.length,
  raceDays:number(input.raceDays)};
}
function html(key,m){
 const kick=w=>'<p class="shk">'+esc(w)+'</p>', fine=w=>'<p class="shf">'+esc(w)+'</p>';
 const row=(label,value)=>'<div class="shrow"><span>'+esc(label)+'</span><b>'+value+'</b></div>';
 const area=id=>m.areas.find(a=>a.id===id)||{}, fence=id=>m.fences.find(r=>r.id===id)||{};
 const value=(n,unit)=>esc(fmt(n))+(number(n)!=null&&unit?' '+esc(unit):'');
 const done=a=>value(a.done)+' <span class="shof">of '+esc(fmt(a.total))+' '+esc(a.unit||'units')+'</span>';
 const asof='As at '+m.day+'. '+(m.stale?'Shared record may be stale. ':'');
 const fvalue=r=>r.classificationPending?'Category unconfirmed':value(r.recorded,r.unit);
 const frow=(id,plan=false)=>{const r=fence(id);return row(r.label||id,fvalue(r)+(plan&&!r.classificationPending?' <span class="shof">/ '+value(r.planned,r.unit)+' planned</span>':''));};
 if(!KEYS.includes(key)) return null;
 if(!m.ready) return kick('Shared record')+'<h2>Progress<br>is loading.</h2>'+fine('Waiting for the shared work record. No completion or quantity is inferred.');
 if(key==='equipment') return kick('The install team’s work')+'<h2>The build<br>takes shape.</h2>'+
  '<div class="shbig">'+esc(fmt(m.toiletArrived))+'<small>toilet units recorded on site</small></div>'+
  row('Toilets · complete',done(area('toilets')))+row('Buildings & containers · complete',done({...area('buildings'),unit:'units'}))+
  row('Water barriers · complete',done(area('barriers')))+row('VMS boards · complete',done(area('vms')))+
  fine(asof+'Toilet units include blocks and trailers, not individual pans. On site and complete are separate records; planned deliveries are not counted as done.');
 if(key==='complete'){
  const t=m.checks;
  return kick('Recorded installation checks')+'<h2>Done,<br>and checked.</h2>'+
   '<div class="shbig">'+esc(fmt(t.done))+'<small>of '+esc(fmt(t.total))+' active references ticked complete</small></div>'+
   row('Positioned and levelled',value(t.levelled)+' <span class="shof">reference checks</span>')+
   row('Steps installed',value(t.steps)+' <span class="shof">reference checks</span>')+
   row('Equipment categories fully complete',value(m.completeAreas)+' <span class="shof">of '+m.areas.length+'</span>')+
   fine(asof+'A reference can contain several units. Levelled and steps are separate recorded checks, not counts of buildings or physical stair units. Unticked checks stay unticked.');
 }
 if(key==='fence'){
  const clean=fence('clean'), km=number(clean.recorded)==null?null:clean.recorded/1000;
  return kick('The fencing crew’s recorded work')+'<h2>Kilometres<br>of work.</h2>'+
   '<div class="shbig">'+esc(fmt(km))+'<small>'+(km==null?'clean-fence work awaiting review':'km of clean-fence work recorded')+'</small></div>'+
   frow('clean')+frow('scrim')+frow('scrim_existing')+
   fine(asof+'Dated Build and Event work. Clean fence, bracing and scrim can concern the same fence; these activities are not added together or described as unique fence standing.');
 }
 if(key==='fenceprog'){
  return kick('Fencing · each activity separately')+'<h2>Where the<br>work is up to.</h2>'+
   ['scrim','v_gates','ped_gates','ccb_event','ccb_demarc','relocation','removal'].map(id=>frow(id,true)).join('')+
   fine(asof+'Recorded work / installation scope, in each activity’s own units. CCB subtypes awaiting classification stay unconfirmed. Movements and bracing can overlap existing fence; no combined completion is inferred.');
 }
 if(key==='effort'){
  const component=id=>{const c=m.components.find(r=>r.id===id)||{};return row(c.label||id,value(c.quantity)+'<span class="shof">'+(c.quantity!=null&&!c.completeCoverage?' · partial record':'')+'</span>');};
  return kick('The work behind it')+'<h2>Carried,<br>placed and fixed.</h2>'+
   ['mesh_panel','base','clamp','brace','wheels','cc_barrier','flat_feet_ccb'].map(component).join('')+
   fine(asof+'Component counts written on '+fmt(m.dockets)+' dated hire agreements, across '+fmt(m.docketDays)+' recorded days. These are gross recorded activities, not unique stock. Missing counts stay unconfirmed; collections are separate.'+(m.componentIssues?' Some source records need review.':''));
 }
 if(key==='site'){
  const complete=m.areas.filter(a=>a.complete).map(a=>a.name), outstanding=m.areas.filter(a=>!a.complete);
  return kick('Where we are up to')+'<h2>The build,<br>so far.</h2>'+
   '<div class="shbig">'+esc(fmt(m.completeAreas))+'<small>of '+m.areas.length+' equipment categories complete</small></div>'+
   row('Complete',esc(complete.length?complete.join(' · '):'None recorded complete'))+
   outstanding.map(a=>row(a.name+' · completion remaining',value(a.left,a.unit))).join('')+
   (m.raceDays==null?'':row('Days until race day',value(m.raceDays)))+
   fine(asof+'Thank you to both crews for the work recorded. Equipment completion and fencing activities remain separate; pending work is still shown.');
 }
 return null;
}
function read(day){
 const health=typeof todayWorkHealth840==='function'?todayWorkHealth840():{ready:false};
 if(!health.ready) return model({day,health});
 const areas=todayWorkMetrics840(day), toilets=areas.find(a=>a.id==='toilets');
 let arrived=0, arrivalKnown=!!toilets&&!toilets.missing;
 for(const r of toilets?.rows||[]){
  if(number(r.arrived962)!=null) arrived+=r.arrived962;
  else arrivalKnown=false;
 }
 const active=physicalCountAssets963(allAssets()).assets.filter(a=>!a._cancelled&&!a.relocation&&!a.rest_of&&!(typeof movedAway==='function'&&movedAway(a.key)));
 const race=(DATA.race_days||[])[0], raceDays=race?Math.max(0,Math.round((Date.parse(race+'T00:00:00Z')-Date.parse(day+'T00:00:00Z'))/86400000)):null;
 return model({day,health,areas,toiletArrived:arrivalKnown?arrived:null,tally:lightTally(active,day),
  fencing:todayFencingSummary848(day),components:fenceComponents849(day),raceDays});
}
const api={model,html,read,keys:KEYS};
if(typeof module==='object'&&module.exports) module.exports=api;
if(root&&root.document){
 root.ShowcaseActuals1089=api;
 const previous=showScene;
 showScene=function(key,day){if(!KEYS.includes(key))return previous(key,day);return holdAssets(()=>html(key,read(day)));};
 const previousRender=showRender;
 showRender=function(){const body=document.getElementById('showBody');if(body)body.toggleAttribute('data-actuals1089',KEYS.includes(SHOW_ORDER[SHOW.i]));return previousRender.apply(this,arguments);};
 SHOW_TITLE.fence='Kilometres of fencing work';
 SHOW_TITLE.fenceprog='Fencing activities recorded';
}
})(typeof window==='object'?window:null);
