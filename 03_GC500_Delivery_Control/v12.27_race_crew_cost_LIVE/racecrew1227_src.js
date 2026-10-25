<script id="racecrew1227-script">
/* Author: Andrew Fisher. v12.27 - the Advanced race-day crew is what Coates pays Advanced: a fencing cost on the P&L, not wages
   (the project manager, 25 Oct 2026: "For advanced. We pay advanced"). Fencing 1–6 on the race days are costed by the running sheet at
   Advanced's quote 27172 (Workforce1010), or at Finance's verified actual where one is recorded. The cost goes to the fencing category
   and stream, 2142 Installation — external contractors (Advanced's crew) and Costs to job end's fencing line, and is left out of the
   wages. The running sheet's own rule decides known or forecast: a planned shift (the forecast roster, 6 × 06:00–18:00 typed before the
   race) stays a forecast until its hours are recorded or Finance verifies the actual; Advanced bills from signed daily event dockets,
   and none for the race days are on the record. The V8 charge for this crew is the event labour scope's Fence team line, unchanged. */
(function(root){'use strict';
const r2=n=>Math.round((n+Number.EPSILON)*100)/100;
const isCrew=r=>!!r&&typeof Workforce1010!=='undefined'&&Workforce1010.isPerson(r.person)&&Workforce1010.DATES.includes(r.date);
function model(asOf){
 const day=asOf||todayIso(),key='racecrew1227:'+day;
 if(typeof RENDER_MEMO!=='undefined'&&RENDER_MEMO.has(key))return RENDER_MEMO.get(key);
 const Q=Workforce1010.QUOTE,o={shifts:0,hours:0,known:0,toCome:0,job:0,actual:0,actualShifts:0,plannedShifts:0,plannedHours:0,unpricedShifts:0,unpricedHours:0,people:0,days:[],rate:Q.rate,minimumHours:Q.minimumHours,quote:Q.number,supplier:Q.supplier,charge:null};
 let rows=[];try{rows=fin745Rows(day).filter(isCrew);}catch(e){rows=[];}
 const people=new Set(),days=new Set();
 rows.forEach(r=>{const paid=Number(r.paid)||0,actual=r.status==='confirmed'&&r.actualCost!=null,cost=actual?r.actualCost:r.calculatedCost;
  o.shifts++;o.hours+=paid;people.add(r.person);days.add(r.date);if(r.status==='forecast'){o.plannedShifts++;o.plannedHours+=paid;}
  if(cost==null){o.unpricedShifts++;o.unpricedHours+=paid;return;}
  if(actual){o.actual+=cost;o.actualShifts++;}
  if(r.date<=day&&r.status!=='forecast')o.known+=cost;else o.toCome+=cost;});
 ['hours','known','toCome','actual','plannedHours','unpricedHours'].forEach(k=>{o[k]=r2(o[k]);});
 o.job=r2(o.known+o.toCome);o.people=people.size;o.days=[...days].sort();
 try{const line=((typeof scopeFigures==='function'?scopeFigures():null)?.lines||[]).find(l=>l.key==='fence');if(line)o.charge={hours:line.hours,rate:line.rate,amount:line.amount};}catch(e){}
 if(typeof RENDER_MEMO!=='undefined')RENDER_MEMO.set(key,o);
 return o;
}
/* One sentence, figures first: the shifts, the hours, the basis and the dollars; with 'charge', what the V8s pay for the same crew. */
function words(m,how){
 if(!m||!m.shifts)return '';
 const quote='Advanced’s quote '+m.quote+' ('+money(m.rate)+'/h, '+m.minimumHours+' h minimum)',priced=m.shifts-m.unpricedShifts;
 const basis=m.actualShifts&&m.actualShifts===priced?'Finance’s verified actuals':m.actualShifts?fmtNum(m.actualShifts)+' at Finance’s verified actual, the rest at '+quote:quote;
 const hours=m.plannedShifts===m.shifts?fmtNum(m.hours)+' h planned':m.plannedShifts?fmtNum(m.hours)+' h ('+fmtNum(m.plannedHours)+' planned)':fmtNum(m.hours)+' h';
 let s='race-day crew (Fencing 1–6), '+fmtNum(m.shifts)+' shifts, '+hours+' at '+basis+' — '+money(m.job)+(m.known&&m.toCome?' ('+money(m.known)+' known, '+money(m.toCome)+' forecast)':m.toCome?' forecast':'');
 if(m.unpricedShifts)s+=' + '+fmtNum(m.unpricedHours)+' h with no rate, not in dollars';
 if(m.plannedShifts)s+='; Advanced’s race-day dockets are not on the record yet';
 else if(!m.actualShifts)s+='; no invoice on the record yet';
 if(how==='charge'&&m.charge)s+=' · the V8s pay for this crew in the event labour scope: Fence team '+fmtNum(m.charge.hours)+' h at '+money(m.charge.rate)+' = '+money(m.charge.amount);
 return s;
}
const api=Object.freeze({isCrew,model,words});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.RaceCrew1227=api;
})(typeof window!=='undefined'?window:globalThis);
</script>
