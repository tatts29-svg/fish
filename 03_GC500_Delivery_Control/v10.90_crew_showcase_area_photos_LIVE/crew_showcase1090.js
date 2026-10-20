/* Author: Andrew Fisher. Both crews' recorded work, read from the shared models.
 * No native writes, duplicated counters, new imagery or inferred trips/attendance. */
(function(root){
'use strict';
const TITLES={
 install_buildings1090:'Buildings and containers',install_toilets1090:'Toilets and amenities',
 install_checks1090:'Positioning, levelling and steps',install_vms1090:'VMS boards',
 install_water1090:'Water barriers',delivery_context1090:'Delivery messages and receipts',
 fence_length1090:'Kilometres of fencing work',fence_panels1090:'Panels, feet and blocks',
 fence_fixings1090:'Clamps, braces and gate hardware',fence_ccb1090:'Crowd-control barriers',
 fence_repeat1090:'Scrim and repeat work',fence_areas1090:'Work across reviewed map areas',
 work_dates1090:'The dated work record',weather_context1090:'Weather during the build period',
 crews_finish1090:'Both crews, one build'
};
const ORDER=['countdown','lead','crew','equipment','complete',
 'install_buildings1090','install_toilets1090','install_checks1090','install_vms1090','install_water1090','delivery_context1090',
 'fencing','fence','fenceprog','fence_length1090','fence_panels1090','fence_fixings1090','fence_ccb1090','fence_repeat1090','fence_areas1090',
 'effort','work_dates1090','weather_context1090','site','crews_finish1090'];
const KEYS=Object.keys(TITLES), RETAINED=['countdown','lead','crew','equipment','complete','fencing','fence','fenceprog','effort','site'];
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
const list=x=>Array.isArray(x)?x:[];
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>finite(n)==null?'Unconfirmed':new Intl.NumberFormat('en-AU',{maximumFractionDigits:3}).format(n);
const validDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x);
function weatherModel(rows,day,metadata){
 const eligible=list(rows).filter(r=>validDay(r?.date)&&r.date<=day).sort((a,b)=>a.date.localeCompare(b.date));
 const rain=eligible.filter(r=>finite(r.rain_to_9am_mm)!=null), wet=rain.filter(r=>r.rain_to_9am_mm>0);
 const max=(field)=>{const v=eligible.map(r=>finite(r[field])).filter(v=>v!=null);return v.length?Math.max(...v):null;};
 const lows=eligible.map(r=>r.min_c).filter(v=>typeof v==='number'&&Number.isFinite(v));
 return {first:eligible[0]?.date||null,last:eligible.at(-1)?.date||null,dates:eligible.length,
  rainPeriods:rain.length,wetPeriods:wet.length,rainMm:rain.length?Math.round(rain.reduce((s,r)=>s+r.rain_to_9am_mm,0)*1000)/1000:null,
  maxC:max('max_c'),minC:lows.length?Math.min(...lows):null,gust:max('gust_kph'),metadata:metadata||null};
}
function bookingsModel(units,day,exportAt){
 const groups=new Map();
 list(units).forEach(u=>{if(!u||!u.id)return;const id=String(u.id);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(u);});
 let delivered=0,conflicts=0,first=null,last=null;
 for(const copies of groups.values()){
  const signatures=new Set(copies.map(u=>JSON.stringify([u.d,u.td,u.t,u.nb,u.x])));
  if(signatures.size!==1){conflicts++;continue;}
  const u=copies[0],at=u.td||u.d;
  if(u.nb||u.x||!u.t||!validDay(at)||at>day)continue;
  delivered++;first=!first||at<first?at:first;last=!last||at>last?at:last;
 }
 return {available:Array.isArray(units),delivered,conflicts,first,last,exportAt:typeof exportAt==='string'?exportAt:null};
}
function areaModel(linked){
 if(!linked||linked.state!=='ready')return {ready:false,areas:[],unmapped:null};
 const areas=new Map();let unmapped=0;
 for(const d of list(linked.dockets)){
  if(!d.areas?.length){unmapped++;continue;}
  for(const a of d.areas){if(!a.id)continue;if(!areas.has(a.id))areas.set(a.id,{id:a.id,label:a.label||a.id,records:new Set()});
   areas.get(a.id).records.add(d.key||d.id||d.number);}
 }
 return {ready:true,unmapped,areas:[...areas.values()].map(a=>({id:a.id,label:a.label,records:a.records.size})).sort((a,b)=>b.records-a.records||a.label.localeCompare(b.label))};
}
function datesModel(rows,day){
 const days=new Map();
 for(const r of list(rows)){if(!validDay(r.date)||r.date>day)continue;
  if(!days.has(r.date))days.set(r.date,new Set());days.get(r.date).add(r.number||r.recordId);}
 return [...days].map(([day,records])=>({day,records:records.size})).sort((a,b)=>b.day.localeCompare(a.day));
}
function model(input){
 const base=input.base||{ready:false,areas:[],components:[],fences:[],checks:{}};
 return {...base,day:input.day||base.day,weather:weatherModel(input.weather,input.day||base.day,input.weatherMetadata),
  bookings:bookingsModel(input.bookings,input.day||base.day,input.bookingExport),
  links:areaModel(input.linked),dates:datesModel(input.componentRows,input.day||base.day),
  receipt:input.receipt||null,vms:input.vms||null};
}
function html(key,m){
 if(!KEYS.includes(key))return null;
 const kick=t=>'<p class="shk">'+esc(t)+'</p>',fine=t=>'<p class="shf">'+esc(t)+'</p>';
 const row=(name,value)=>'<div class="shrow"><span>'+esc(name)+'</span><b>'+value+'</b></div>';
 const val=(n,u)=>esc(fmt(n))+(finite(n)!=null&&u?' '+esc(u):'');
 const big=(n,label)=>'<div class="shbig" data-crew1090-count>'+esc(fmt(n))+'<small>'+esc(label)+'</small></div>';
 const heading=(k,title)=>kick(k)+'<h2>'+title+'</h2>';
 const area=id=>list(m.areas).find(a=>a.id===id)||{};
 const comp=id=>list(m.components).find(a=>a.id===id)||{};
 const fence=id=>list(m.fences).find(a=>a.id===id)||{};
 const count=(id)=>{const c=comp(id);return val(c.quantity)+(c.quantity!=null&&!c.completeCoverage?' <span class="shof">partial record</span>':'');};
 const completion=(a,u)=>val(a.done)+' <span class="shof">of '+esc(fmt(a.total))+' '+esc(u||a.unit||'units')+'</span>';
 const date='As at '+m.day+'. '+(m.stale?'Shared record may be stale. ':'');
 const remain=a=>row('Completion still to record',val(a.left,a.unit||'units'));
 if(!m.ready)return heading('The shared work record','Progress<br>is loading.')+fine('Waiting for shared records. No completed work or missing quantity is inferred.');
 if(key==='install_buildings1090'){
  const a=area('buildings');
  return heading('The installation crew','A place for<br>the event to work.')+big(a.done,'building, ticket-box and container units complete')+
   row('Complete / current scope',completion(a,'units'))+row('Remaining',val(a.left,'units'))+
   row('References with levelling checked',val(list(a.rows).filter(r=>r.levelled).length))+
   fine(date+'These are recorded complete units, including containers. Completion and levelling are separate recorded checks; this is not a count of trucks, crane lifts or forklift movements.');
 }
 if(key==='install_toilets1090'){
  const a=area('toilets'),types=new Map();
  for(const r of list(a.rows))for(const item of list(r.items962)){if(finite(item.done)!=null)types.set(item.item,(types.get(item.item)||0)+item.done);}
  return heading('The installation crew','Amenities,<br>ready for people.')+big(m.toiletArrived,'toilet units recorded on site')+
   row('Recorded complete',completion(a))+
   [...types].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,n])=>row(name+' · complete',val(n,'units'))).join('')+
   remain(a)+fine(date+'Blocks, trailers and individual toilets each count as units; this is not a pan count. Tanks and separate accessories are excluded. Arrival and completion remain separate records.');
 }
 if(key==='install_checks1090'){
  return heading('The installation crew','The checks<br>behind the finish.')+big(m.checks?.steps,'references with steps installation checked')+
   row('Positioned and levelled',val(m.checks?.levelled)+' <span class="shof">reference checks</span>')+
   row('References recorded complete',val(m.checks?.done)+' <span class="shof">of '+esc(fmt(m.checks?.total))+'</span>')+
   fine(date+'Levelling and steps are separate checks. One reference can contain several units. These are not physical stair quantities, forklift lifts or walking steps; unticked work stays unticked.');
 }
 if(key==='install_vms1090'){
  const a=area('vms');
  return heading('The installation crew','Boards in place.<br>The record so far.')+big(a.done,'VMS boards recorded complete')+
   row('Complete / current board register',completion(a,'boards'))+
   row('Recorded on site',val(m.vms?.on,'boards'))+row('Still to arrive',val(m.vms?.total!=null&&m.vms?.on!=null?m.vms.total-m.vms.on:null,'boards'))+
   remain(a)+fine(date+'Counted by board number, including boards awaiting arrival. Reassignment of a board is not a towing log, so no tow-trip or distance total is claimed.');
 }
 if(key==='install_water1090'){
  const a=area('barriers');
  return heading('The installation crew · water barriers','Placed for<br>the next stage.')+big(a.done,'water-barrier completion units recorded')+
   row('Complete / current placement scope',completion(a,'barriers'))+remain(a)+
   fine(date+'Water-filled barriers remain separate from fencing crew crowd-control barriers. The programme can include reinstatement of existing barriers; placement scope is not a count of unique stock or unloading movements.');
 }
 if(key==='delivery_context1090'){
  const b=m.bookings,r=m.receipt;
  return heading('Getting the build onto site','Messages behind<br>the deliveries.')+big(b.available?b.delivered:null,'eligible bookings with a delivered message')+
   row('Message archive',esc(b.exportAt||'Archive date unavailable'))+
   (r?.verified?row('Selected-day receipts',val(r.completed)+' <span class="shof">of '+esc(fmt(r.total))+' '+esc(r.metric==='loads'?'scheduled load groups':'scheduled references')+'</span>'):row('Selected-day receipts',esc(r?.source||'No verified receipt reading')))+
   (b.conflicts?row('Conflicting booking copies excluded',val(b.conflicts)):'')+
   fine(date+'Bookings are counted once by booking ID through the selected day, using delivered-message dates. The archive ends at its stated export. These are bookings and receipt groups, not counted truck arrivals, journeys, unloading lifts or people carried.');
 }
 if(key==='fence_length1090'){
  const f=fence('clean');
  return heading('The fencing crew','Kilometres<br>of recorded work.')+big(finite(f.recorded)==null?null:f.recorded/1000,'kilometres of clean-fence work recorded')+
   row('The same work in metres',val(f.recorded,'m'))+row('Dated hire agreements with component records',val(m.dockets))+
   row('Recorded dates represented',val(m.docketDays))+
   fine(date+'Gross clean-fence activity from the physical record. Repeat work may concern the same fence. Bracing, scrim, barriers and movements stay separate; no unique standing length or distance walked is inferred.');
 }
 if(key==='fence_panels1090'){
  return heading('The fencing crew','Panel by panel.<br>Foot by foot.')+big(comp('mesh_panel').quantity,'fence panels in dated component records')+
   row('Feet / blocks recorded',count('base'))+row('Panel source coverage',esc(comp('mesh_panel').completeCoverage?'Complete for included records':'Partial recorded counts'))+
   row('Feet / blocks · relevant records missing counts',val(comp('base').missingRecordCount))+
   fine(date+'Counts written on numbered hire agreements, with duplicate checks. They are gross component activities, not unique stock or proven manual lifts. Missing feet counts are not estimated; separately billed bases are not added.');
 }
 if(key==='fence_fixings1090'){
  return heading('The fencing crew','The small pieces.<br>The big effort.')+big(comp('clamp').quantity,comp('clamp').completeCoverage?'clamps in dated component records':'clamps recorded · partial source coverage')+
   row('Braces / stays',count('brace'))+row('Gate wheels',count('wheels'))+
   row('Dated pedestrian-gate work',val(fence('ped_gates').recorded,'each'))+
   row('Dated vehicle-gate work',val(fence('v_gates').recorded,'each'))+
   fine(date+'Clamps and braces retain missing-count warnings. Wheels, gate panels and gate openings are different things. Undated work stays outside dated totals; no gate count is derived from wheels.');
 }
 if(key==='fence_ccb1090'){
  const category=id=>{const f=fence(id),r=f.recordedRange;
   return f.classificationPending?(r&&finite(r.min)!=null&&finite(r.max)!=null?val(r.min)+'–'+val(r.max,'m')+' <span class="shof">category pending</span>':'Category pending'):val(f.recorded,'m');};
  return heading('The fencing crew · crowd-control barriers','Crowd control.<br>Every section matters.')+big(comp('cc_barrier').quantity,'standard crowd-control barrier units recorded')+
   row('Flat-feet CCB units',count('flat_feet_ccb'))+
   row('Event CCB activity',category('ccb_event'))+row('Demarcation CCB activity',category('ccb_demarc'))+
   fine(date+'Physical barrier units and programme metres are shown separately. Standard and flat-feet CCB are not water barriers. Pending event/demarcation ranges share unallocated work; do not add their limits or convert units using an assumed width.');
 }
 if(key==='fence_repeat1090'){
  return heading('The fencing crew','More than<br>the first install.')+big(fence('relocation').recorded,'metres of relocation work recorded')+
   row('Scrim / bracing activity',val(fence('scrim').recorded,'m'))+
   row('Scrim applied to existing fence',val(fence('scrim_existing').recorded,'m'))+
   row('Removed or stacked down',val(fence('removal').recorded,'m'))+
   fine(date+'These are separate, potentially overlapping activities. Scrim/bracing includes work on existing fence. Stack-down is not necessarily removal from site. No combined new-fence length or unique stock total is claimed.');
 }
 if(key==='fence_areas1090'){
  return heading('The fencing crew','Across<br>the reviewed areas.')+big(m.links.ready?m.links.areas.length:null,'reviewed map areas linked to clean-fence records')+
   m.links.areas.slice(0,5).map(a=>row(a.label,val(a.records)+' <span class="shof">linked records</span>')).join('')+
   (m.links.ready?row('Records without a current area link',val(m.links.unmapped)):'')+
   fine(date+'Reviewed physical-record links, not priced supplier lines. A record can relate to more than one area; area counts do not allocate metres, prove completion, or describe exact routes. Existing photos and backdrops are unchanged.');
 }
 if(key==='work_dates1090'){
  return heading('Both crews · the dated evidence','The build<br>takes days.')+big(m.dates.length,'dates with included fencing hire agreements')+
   m.dates.slice(0,4).map(d=>row(d.day,val(d.records)+' <span class="shof">hire agreements</span>')).join('')+
   row('Installation references recorded complete',val(m.checks?.done))+
   fine(date+'Dated fencing records and the installation checks show different parts of the work. A recorded date is not a shift, attendance day or labour-hour total. Record timestamps are not silently treated as the time a truck or person moved.');
 }
 if(key==='weather_context1090'){
  const w=m.weather;
  return heading('Historical weather · build-period context','Through the<br>changing weather.')+big(w.rainMm,'mm across archived station rain periods')+
   row('Archive dates available',esc(w.first&&w.last?w.first+' to '+w.last:'No historical observations available'))+
   row('Periods with rain recorded',val(w.rainPeriods?w.wetPeriods:null)+' <span class="shof">of '+esc(fmt(w.rainPeriods))+' observations</span>')+
   row('Highest recorded gust',val(w.gust,'km/h'))+
   fine('Bureau of Meteorology · Gold Coast Seaway. Rain is measured over 24 hours ending 09:00 AEST, not a calendar workday. This is station context, not crew exposure, wet-work hours or proof somebody worked in rain. Missing archive days remain unknown.');
 }
 if(key==='crews_finish1090'){
  const complete=list(m.areas).filter(a=>a.complete),pending=list(m.areas).filter(a=>!a.complete);
  return heading('The installation crew + the fencing crew','Both crews.<br>One build.')+big(m.completeAreas,'equipment categories recorded complete')+
   row('Categories complete',esc(complete.map(a=>a.id==='buildings'?'Buildings & containers':a.name).join(' · ')||'None recorded complete'))+
   pending.map(a=>row(a.name+' · completion remaining',val(a.left,a.unit))).join('')+
   row('Fencing clean-work activity',val(fence('clean').recorded,'m'))+
   fine(date+'Thank you to both crews for the work recorded. Remaining work and incomplete evidence stay visible. No totals for truck trips, forklift lifts, towing distance or walking steps are invented.');
 }
 return null;
}
function programme(turns,mapping,order,loopStart){
 const original=list(turns),map={},first=[],loop=[];
 for(const key of order){
  if(RETAINED.includes(key)){
   for(const t of original.filter(t=>mapping[t.slot]===key&&t.slot<loopStart)){first.push({...t});map[t.slot]=key;}
  }else{const slot=1000+order.indexOf(key);first.push({slot,secs:14,audio:null,section:1000,standin:false});map[slot]=key;}
 }
 for(const t of original.filter(t=>t.slot>=loopStart&&mapping[t.slot]==='countdown')){loop.push({...t});map[t.slot]='countdown';}
 const sequence=first.concat(loop),next={};
 sequence.forEach((t,i)=>{next[t.slot]=sequence[i+1]?.slot??4;});
 return {turns:sequence,map,next,first:first[0]?.slot,bodyLast:first.at(-1)?.slot,loopFirst:loop[0]?.slot};
}
const api={keys:KEYS,order:ORDER,titles:TITLES,model,html,weatherModel,bookingsModel,areaModel,datesModel,programme};
if(typeof module==='object'&&module.exports)module.exports=api;
if(!root?.document)return;
if(root.CrewShowcase1090)throw Error('Crew Showcase already installed');
function read(day,key){
 const base=ShowcaseActuals1089.read(day),input={day,base};
 if(key==='install_vms1090')input.vms=vmsCount1076(day,todayWorkMetrics840(day).find(a=>a.id==='vms')?.rows);
 if(key==='fence_areas1090')input.linked=todayLinkedFencing848('clean',day);
 if(key==='work_dates1090')input.componentRows=fenceComponents849(day).rows;
 if(key==='weather_context1090'&&root.BuildHistory984){
  input.weather=root.BuildHistory984.dates().filter(d=>d<=day).map(d=>root.BuildHistory984.get(d));
  input.weatherMetadata=root.BuildHistory984.metadata;
 }
 if(key==='delivery_context1090'){
  input.bookings=root.ontime1057?.units;input.bookingExport=root.ontime1057?.exportAt;
  input.receipt=root.BuildCardData984?.day(day,todayIso(),{iso:day})?.loads;
 }
 return model(input);
}
api.read=(day,key)=>holdAssets(()=>read(day,key));
root.CrewShowcase1090=api;
const originalTurns=bcTurns(),originalMap={...bcScenes()},voice=programme(originalTurns,originalMap,ORDER,BC_LOOP);
SHOW_ORDER.splice(0,SHOW_ORDER.length,...ORDER);
Object.assign(SHOW_TITLE,TITLES);
KEYS.forEach(key=>{SHOW_HOLD[key]=14000;});
bcTurns=function(){return voice.turns;};
bcScenes=function(){return voice.map;};
bcNextSlot=function(slot){return slot===voice.bodyLast&&!SHOW.loop?-1090:voice.next[slot]??-1090;};
api.broadcast=voice;
const beforeScene=showScene;
showScene=function(key,day){return KEYS.includes(key)?holdAssets(()=>html(key,read(day,key))):beforeScene.apply(this,arguments);};
const beforeRender=showRender;
showRender=function(){
 const body=document.getElementById('showBody'),key=SHOW_ORDER[SHOW.i];
 if(body)body.toggleAttribute('data-crew1090',KEYS.includes(key));
 if(BC.on&&voice.map[BC.i]!==key)bcStop();
 return beforeRender.apply(this,arguments);
};
const REFRESH_KEYS=KEYS.concat(ShowcaseActuals1089.keys);
let queued=false;
function refreshOpen(){
 queued=false;
 const body=document.getElementById('showBody'),key=SHOW_ORDER[SHOW.i],wrap=body?.querySelector('.shwrap');
 if(!SHOW.open||!REFRESH_KEYS.includes(key)||!wrap)return false;
 const day=validDay(state.asOf)?state.asOf:todayIso();
 const next=holdAssets(()=>showScene(key,day));
 if(wrap.innerHTML===next)return false;
 const top=body.scrollTop;
 wrap.innerHTML=next;showFit();body.scrollTop=Math.min(top,Math.max(0,body.scrollHeight-body.clientHeight));
 return true;
}
function scheduleRefresh(){
 if(!queued&&SHOW.open&&REFRESH_KEYS.includes(SHOW_ORDER[SHOW.i])){queued=true;queueMicrotask(refreshOpen);}
}
const cache=sharedCache975;
sharedCache975=function(){const result=cache.apply(this,arguments);scheduleRefresh();return result;};
const renderBefore=render;
render=function(){const result=renderBefore.apply(this,arguments);scheduleRefresh();return result;};
api.refreshOpen=refreshOpen;
})(typeof window==='object'?window:null);
