/* Author: Andrew Fisher. Native consumer regressions in an isolated VM; no browser/network/storage. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const input=JSON.parse(fs.readFileSync(0,'utf8'));let checks=0;
const eq=(a,b,msg)=>{assert.deepStrictEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),msg);checks++};
function native(s,name,end){const a=s.indexOf('function '+name+'('),b=s.indexOf(end,a);assert(a>=0&&b>a,name);return s.slice(a,b)}
function data(s){return JSON.parse(s.split('const DATA = ',2)[1].split('\n',1)[0].replace(/;\s*$/,''))}
function context(s){
 const DATA=data(s),FCOL=DATA.fence.columns, progSheetOf=week=>DATA.fencing.week_sheets.find(x=>x.sheet===DATA.fence.week_map.find(w=>w.week_2026===week)?.programme_sheet);
 const c={DATA,FCOL,progSheetOf,plannedFor:week=>progSheetOf(week)?.totals,
  allAssets:()=>[],breakdownsOpenAsOf:()=>[],docketsAsOf:()=>[],allDockets:()=>[],fenceByArea:()=>[],raceFirstDay:()=>null,weekOf:()=>null,
  todayIso:()=>'2026-10-09',
  // Explicit synthetic rate fixture tests the native forecast algebra and units.
  fenceRateFor:key=>({value:['removal','v_gates'].includes(key)?0:10}),
  fenceCostFor:key=>key==='relocation'?{value:null,source:'hourly'}:{value:5},
  cj771AddProgrammeForecast:()=>{},esc:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.createContext(c);
 const code=native(s,'plannedToDay','/* v5.59')+native(s,'fenceByWeek','/* Dockets rolled up')+native(s,'progressAsOf','/* a run of reference buttons')+native(s,'fenceTypes','/* temporary fence in metres')+native(s,'cj764Fencing','/* v7.65');
 vm.runInContext(code,c);
 if(s.includes('function fencingNotes951(')) vm.runInContext(fs.readFileSync(input.notes,'utf8'),c);
 return c;
}
const before=context(input.before),after=context(input.after);
const sourceSheet=after.DATA.fencing.week_sheets.find(w=>w.sheet==='DECON WK1');
const Sunday=sourceSheet.days.find(d=>d.date==='2026-10-25');
assert(Sunday);checks++;
const type='Temporary Fence (m) — Removal';
eq(after.plannedToDay(sourceSheet,'2026-10-24',type),0,'before first removal day');
eq(after.plannedToDay(sourceSheet,'2026-10-25',type),Sunday.totals[type],'native plannedToDay uses exact Sunday');
const allSunday=after.DATA.fencing.week_sheets.reduce((sum,w)=>sum+w.days.filter(d=>d.date<='2026-10-25').reduce((n,d)=>n+(d.totals[type]||0),0),0);
const p=after.progressAsOf('2026-10-25');
eq(p.fenceLines.find(l=>l.column==='removal').planned,allSunday,'native progressAsOf includes Sunday before mapped Monday');
eq(p.fenceLines.reduce((n,l)=>n+l.done,0),0,'source Complete marks do not become docket actuals');
const calcBuild=after.DATA.fencing.week_sheets.filter(w=>!/decon/i.test(w.sheet));
const expectedClean=calcBuild.reduce((n,w)=>n+(w.totals['Temporary Fence (m) — Clean']||0),0);
eq(after.fenceTypes(p).find(t=>t.key==='clean').total,expectedClean,'status/report installation denominator excludes demob reuse');
const demobClean=after.DATA.fencing.week_sheets.filter(w=>/decon/i.test(w.sheet)).reduce((n,w)=>n+(w.totals['Temporary Fence (m) — Clean']||0),0);
eq(demobClean,950,'demob clean movements remain in own plan');
// Independently calculate expected forecast per dated week/category at explicit fixture rates.
function independent(c){const out={cost:0,revenue:0,week:{}};for(const w of c.DATA.fencing.week_sheets){if(!w.rolled_forward)continue;let cost=0,revenue=0;for(const col of c.FCOL){const q=Math.max(0,w.totals[col.programme_type]||0);if(!q)continue;revenue+=q*(['removal','v_gates'].includes(col.key)?0:10);if(col.key!=='relocation')cost+=q*5;}const r=x=>Math.round(x*100)/100;out.week[w.sheet]={cost:r(cost),revenue:r(revenue)};out.cost=r(out.cost+r(cost));out.revenue=r(out.revenue+r(revenue));}return out}
const financial={};for(const [name,c] of [['before',before],['after',after]]){const native=c.cj764Fencing(),want=independent(c);eq(native.cost,want.cost,name+' native forecast direct costs equals task quantity × fixture rate');eq(native.revenue,want.revenue,name+' native forecast revenue equals task quantity × fixture rate');for(const w of native.weeks)eq({cost:w.cost,revenue:w.revenue},want.week[w.prog],name+' forecast '+w.prog);financial[name]={cost:native.cost,revenue:native.revenue}}
eq(before.allDockets(),after.allDockets(),'forecast change does not invent dockets');
const markup=after.fencingNotes951();eq(/<input|<select|<button|data-save|onclick=/i.test(markup),false,'read-only source notes');
assert(markup.includes('Held for review')&&markup.includes('2025-10-29')&&markup.includes('7:01am'));checks++;
const bad=after.DATA.fencing.week_sheets[0].programme_rows951[0];bad.location='<script>bad</script>';assert(!after.fencingNotes951().includes('<script>bad</script>'));checks++;
console.log(JSON.stringify({author:'Andrew Fisher',checks,sundayRemoval:Sunday.totals[type],cumulativeRemoval25Oct:allSunday,installationClean:expectedClean,demobCleanRetained:demobClean,forecastFixture:financial,network:false,recordWrites:0}));
