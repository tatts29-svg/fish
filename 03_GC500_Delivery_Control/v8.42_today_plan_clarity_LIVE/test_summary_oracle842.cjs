// Author: Andrew Fisher. Independent native-input summary and dated-plan oracle.
// Generic logic only. Native inputs and browser evidence stay in private OUT.
'use strict';
const round=n=>Math.round(n*100)/100;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
async function summaryInputs842(page,day){return page.evaluate(asOf=>({asOf,today:todayIso(),
 rows:dsnState(asOf).rows.map(r=>({key:r.a.key,date:r.st?.in,done:!!r.d.done,recorded:!!r.d.recorded,state:r.d.state,where:r.d.where})),
 columns:FCOL.map(c=>({key:c.key,unit:c.unit,programme_type:c.programme_type})),
 weeks:(DATA.weeks||[]).map(w=>{const s=progSheetOf(w.sheet);return {sheet:w.sheet,phase:w.phase,start:w.start,end:w.end,plan:s?{sheet:s.sheet,year:s.year,rolled_forward:s.rolled_forward,totals:s.totals||{},days:s.days||[]}:null};})
}),day);}
function referencePlan842(keys,input){
 const rows=new Map(input.rows.map(r=>[r.key,r]));
 const due=[],arrived=[],early=[],undated=[],unrecorded=[],rental=[];
 for(const key of keys){const r=rows.get(key);if(!r){undated.push(key);continue;}
  const evidence=r.done||r.recorded&&r.state==='on site'&&r.where!=='rental';
  if(r.recorded&&r.state==='on site'&&r.where==='rental'&&!r.done)rental.push(key);
  if(!iso(r.date)){undated.push(key);continue;}
  if(r.date<=input.asOf){due.push(key);if(evidence)arrived.push(key);else if(!r.recorded)unrecorded.push(key);}
  else if(evidence)early.push(key);
 }
 const missing=due.filter(k=>!arrived.includes(k)),dated=keys.length-undated.length;
 return {unit:'references',planned:due.length,actual:arrived.length,behind:missing.length,early:early.length,delta:missing.length?-missing.length:early.length,
  status:missing.length?'behind':undated.length||!dated?'unknown':early.length?'ahead':'on-plan',overdueRefs:missing,earlyRefs:early,undatedRefs:undated,unrecordedRefs:unrecorded,rentalOnlyRefs:rental};
}
function dailyPlan842(row,input){
 const base={planned:null,actual:row.recorded,delta:null,behind:null,early:null,status:'unknown',unit:row.unit,provisional:false};
 const mappings=input.columns.filter(c=>c.key===row.id&&c.programme_type&&c.unit===row.unit),weeks=input.weeks.filter(w=>w.phase==='Build');
 if(mappings.length!==1||!weeks.length)return base;
 const type=mappings[0].programme_type,seen=new Set();let total=0;
 for(const w of weeks){
  if(!iso(w.start))return base;
  if(w.start>input.asOf)continue;
  const p=w.plan;if(!p?.sheet||!p.rolled_forward||seen.has(p.sheet)||!p.days.length)return base;seen.add(p.sheet);
  const full=p.totals[type],dates=new Set();let sum=0,selected=0;
  if(!finite(full)||full<0)return base;
  for(const d of p.days){const n=d.totals?.[type];if(!iso(d.date)||dates.has(d.date)||n!=null&&(!finite(n)||n<0||row.unit==='each'&&!Number.isInteger(n)))return base;dates.add(d.date);sum+=n||0;if(d.date<=input.asOf){selected+=n||0;if(n>0&&/source\s+conflicts?\s+awaiting\s+confirmation/i.test(String(d.basis||'')))base.provisional=true;}}
  if(Math.abs(sum-full)>0.005)return base;total+=round(selected);
 }
 if(!finite(row.recorded))return base;
 const planned=round(total),delta=round(row.recorded-planned);
 return {...base,planned,delta,behind:Math.max(0,-delta),early:Math.max(0,delta),status:delta<0?'behind':delta>0?'ahead':'on-plan'};
}
function summaryOracle842(input,areas,fencing){
 const byId={};
 for(const a of areas){
  const conflicts=a.id==='fencing'?[]:a.rows.filter(r=>r.recordedComplete&&!r.complete),lower=conflicts.length>0||(a.shortConflictRefs||0)>0;
  const total=finite(a.total)?a.total:null,done=finite(a.done)?a.done:null;
  const pct=a.id!=='fencing'&&total>0&&done!=null?(lower?Math.floor(done/total*10000)/100:round(done/total*100)):null;
  byId[a.id]={total:a.id==='fencing'?null:total,done:a.id==='fencing'?null:done,left:a.id!=='fencing'&&total!=null&&done!=null?round(Math.max(0,total-done)):null,pct,pctKind:pct==null?'unknown':lower?'lower-bound':'confirmed',reviewQuantity:conflicts.every(r=>finite(r.quantity))?round(conflicts.reduce((n,r)=>n+r.quantity,0)):null,reviewRefs:conflicts.map(r=>r.key),unquantifiedRefs:a.unknownQuantityRefs||0,knownTotal:finite(a.knownTotal)?a.knownTotal:null,
   plan:a.id==='fencing'?null:referencePlan842(a.rows.map(r=>r.key),input)};
 }
 const fencingRows=fencing.map(row=>({id:row.id,unit:row.unit,total:row.planned,done:row.recorded,left:row.planned==null||row.recorded==null?null:round(Math.max(0,row.planned-row.recorded)),pct:row.planned>0&&row.recorded!=null?round(row.recorded/row.planned*100):null,plannedByDay:dailyPlan842(row,input).planned,plan:dailyPlan842(row,input)}));
 return {byId,fencingRows};
}
function assertSummary842(check,label,actual,expected){
 const pick=(value,shape)=>Object.fromEntries(Object.keys(shape).map(k=>[k,value?.[k]]));
 for(const [id,want] of Object.entries(expected.byId)){
  const {plan,...scalars}=want,got=actual.byId[id];
  check(label+' '+id+' total confirmed done left and percentage reconcile independently',same(pick(got,scalars),scalars),{expected:scalars,actual:pick(got,scalars)});
  if(plan){check(label+' '+id+' reference plan uses explicit due arrival evidence and keeps early separate',same(pick(got.plan,plan),plan),{expected:plan,actual:got.plan});
   check(label+' '+id+' plan labels reference scope and excludes installation inference',/references/.test(got.plan.basis)&&/not an installation deadline/.test(got.plan.basis)&&/Rental-only/.test(got.plan.basis),got.plan.basis);}
  if(got.pctKind==='lower-bound')check(label+' '+id+' lower bound never rounds above the confirmed ratio',got.pct<=got.done/got.total*100&&got.pctKind==='lower-bound'&&got.left===got.total-got.done,{pct:got.pct,ratio:got.done/got.total*100,left:got.left});
 }
 for(const row of expected.fencingRows){const got=actual.fencingRows.find(r=>r.id===row.id),{plan,...scalars}=row;
  check(label+' '+row.id+' independent Build quantities and dated programme reconcile',same(pick(got,scalars),scalars)&&same(pick(got?.plan,plan),plan),{expected:row,actual:got});
  if(plan.provisional)check(label+' '+row.id+' conflicted dated source keeps numerical comparison explicitly provisional',got.plan.provisional&&/^Provisional:/.test(got.plan.label)&&/current dated Build plan/.test(got.plan.label)&&got.plan.issues.some(i=>/conflicts awaiting confirmation/.test(i)),got.plan);
 }
}
module.exports={summaryInputs842,referencePlan842,dailyPlan842,summaryOracle842,assertSummary842,iso};
