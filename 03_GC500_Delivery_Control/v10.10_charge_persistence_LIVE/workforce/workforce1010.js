/* Author: Andrew Fisher. Six editable workers, one source roster; quoted supplier cost is separate from customer Revenue. */
(function(root){'use strict';
const GROUP='Fencing crew ×6',GROUP_ID='W-P-fencing-crew-6';
const DATES=['2026-10-23','2026-10-24','2026-10-25'];
const NAMES=Array.from({length:6},(_,n)=>'Fencing '+(n+1));
const QUOTE={number:'27172',date:'04 Jun 2026',supplier:'Advanced Temporary Fencing',rate:142,minimumHours:4};
const clone=x=>JSON.parse(JSON.stringify(x)),personId=name=>'W-P-'+name.toLowerCase().replace(/ /g,'-');
const shiftId=(name,date)=>'W-L-'+name.toLowerCase().replace(/ /g,'-')+'-'+date.replace(/-/g,'');
const isPerson=name=>NAMES.includes(name),isShift=row=>!!row&&isPerson(row.person)&&DATES.includes(row.date)&&row.kind==='labour';
/* Native individual entries win. Native tombstones suppress a projected person/shift, including after refresh.
   The four aggregate documents remain in native history and source detail, but are never costed alongside their six workers. */
function nightCovered(row,rows){return row.kind==='labour'&&row.person==='Night person — TBC'&&DATES.includes(row.date)&&row.start==null&&row.finish==null&&row.hours==null&&rows.some(n=>n.kind==='labour'&&n.person==='Kyle Gover'&&n.date===row.date&&/^Night shift confirmed(?: by [^,\r\n]+,)? 13 Oct 2026\./.test(String(n.note||'')));}
function overlaps(date,papers){return (papers||[]).filter(row=>row&&row.date===date&&row.usable!==false&&Number(row.labour_hours)>0&&(Number.isFinite(row.cost)||Number.isFinite(row.paid_total))).map(row=>row.id||row.note_no||row.docket_no).filter(Boolean);}
function expand(rows,deleted=()=>false){
 rows=rows.filter(row=>!nightCovered(row,rows));
 const group=rows.find(row=>row.kind==='person'&&row.id===GROUP_ID&&row.person===GROUP);
 const shifts=rows.filter(row=>row.kind==='labour'&&row.person===GROUP&&Number(row.crew_count)===6&&DATES.includes(row.date));
 if(!group||!shifts.length)return rows;
 const oldIds=new Set([group.id,...shifts.map(row=>row.id)]),out=rows.filter(row=>!oldIds.has(row.id)),existing=new Set(out.map(row=>row.id));
 for(const name of NAMES){
  const pid=personId(name);if(deleted(pid))continue;
  if(!existing.has(pid))out.push({...clone(group),id:pid,_k:pid,person:name,employer:QUOTE.supplier,pay_rate:QUOTE.rate,charged_as:null,
   workforce1010:{sourceId:group.id,sourcePayRate:group.pay_rate??null,quote:QUOTE.number},
   note:'Supplier quote 27172: race days $142/person/hour, minimum 4 hours. Customer Revenue is in the event labour scope.'});
  for(const source of shifts){const id=shiftId(name,source.date);if(existing.has(id)||deleted(id))continue;
   out.push({...clone(source),id,_k:id,person:name,crew_count:1,workforce1010:{sourceId:source.id,quote:QUOTE.number},
    note:'Forecast · '+(source.start&&source.finish?source.start+'–'+source.finish:'hours not recorded')+' · supplier quote 27172. Shared crew source retained in More info.'});
  }
 }
 return out;
}
function supplierHours(row,worked){
 if(!isShift(row)||!Number.isFinite(worked)||worked<0)return null;
 const raw=row.break_min,breakHours=raw!=null&&String(raw).trim()!==''&&Number.isFinite(Number(raw))?Math.max(0,Number(raw))/60:0;
 const hours=Math.max(0,worked-breakHours);return hours>0?Math.max(QUOTE.minimumHours,hours):0;
}
function scopePeople(line){
 if(!line||line.key!=='fence')return [];
 return NAMES.map((name,index)=>({name,index,rate:line.rate,days:line.days.map(day=>({...day,active:index<day.people,people:index<day.people?1:0,hours:index<day.people?day.per:0})),
  hours:line.days.reduce((sum,day)=>sum+(index<day.people?day.per:0),0)}));
}
const api={GROUP,GROUP_ID,DATES,NAMES,QUOTE,expand,isPerson,isShift,personId,shiftId,supplierHours,scopePeople,nightCovered,overlaps};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.Workforce1010=api;
if(typeof document==='undefined')return;
const priorOurCosts=ourCosts,priorOurRaw=ourRawOf;
ourCosts=function(){return expand(priorOurCosts.apply(this,arguments),tombedHere);};
ourRawOf=function(id){const native=priorOurRaw.apply(this,arguments);if(native)return native;return ourCosts().find(row=>row.id===String(id))||null;};
const priorBreak=runBreak,priorHours=runHours;
runBreak=function(row){if(isShift(row)&&!(row.break_min!=null&&String(row.break_min).trim()!==''))return 0;return priorBreak.apply(this,arguments);};
runHours=function(row){if(isShift(row))return supplierHours(row,runWorked(row));return priorHours.apply(this,arguments);};
api.overlaps=date=>heldMemo('workforce1010-overlap-'+date,()=>overlaps(date,[...priorOurCosts().filter(row=>row.kind==='misc'&&Number.isFinite(row.amount)&&/advanced|fencing/i.test([row.supplier,row.type,row.description].join(' '))&&/labour|crew|race/i.test([row.type,row.description].join(' '))).map(row=>({...row,labour_hours:1,cost:row.amount})),...(typeof serviceNoteRows==='function'?serviceNoteRows():[]),...(typeof allDockets==='function'?allDockets().filter(row=>(row.quantities?.labour||0)>0).map(row=>({...row,labour_hours:row.quantities.labour})):[])]));
api.split=function(hours,date,type,name){if(isPerson(name)&&DATES.includes(date)){const held=api.overlaps(date);return {ordinary:hours,at_1_5:0,at_2:0,contractorQuote1010:true,...(held.length?{unknownType834:true,overlapIds1010:held}:{})};}return splitHoursFor(hours,date,type);};
api.source=function(){const rows=priorOurCosts();return rows.filter(row=>row.person===GROUP&&['labour','person'].includes(row.kind)||nightCovered(row,rows));};
api.sourceCard=function(){
 const rows=api.source();if(!rows.length)return '';
 const group=rows.find(row=>row.kind==='person'),shifts=rows.filter(row=>row.kind==='labour'),customer=scopeFigures()?.lines.find(line=>line.key==='fence');
 return '<details class="sfold" data-sfold="runsheet|fencing-source1010"><summary>Fencing cost basis · quote 27172</summary><div class="sfoldbody"><p>Supplier forecast: $142 per person/hour, minimum 4 hours per shift. No employee overtime multiplier. Team-leader daily charges remain separate and unallocated.</p><p>Customer rate: '+esc(customer?money(customer.rate):'Not recorded')+' per person/hour. The original crew pay field '+esc(group&&group.pay_rate!=null?money(group.pay_rate):'unpriced')+' is retained below as source evidence; it is not the supplier rate.</p><div class="tblwrap"><table class="progtbl"><thead><tr><th>Original record</th><th>Date</th><th>Start</th><th>Finish</th><th>Hours</th></tr></thead><tbody>'+shifts.map(row=>'<tr><td>'+esc(row.id)+'</td><td>'+esc(fmtDate(row.date))+'</td><td>'+esc(row.start||'Not recorded')+'</td><td>'+esc(row.finish||'Not recorded')+'</td><td>'+esc(row.hours==null?'Not recorded':String(row.hours))+'</td></tr>').join('')+'</tbody></table></div></div></details>';
};
/* Finance already owns review/actual status. Only the quoted forecast rate basis is labelled here. */
const priorFinance=fin745Rows;
fin745Rows=function(){return priorFinance.apply(this,arguments).map(row=>{
 if(!isPerson(row.person)||!DATES.includes(row.date))return row;
 const person=ourCostOf(personId(row.person)),override=fin745Latest('rate',row.person);
 const quoted=person?.workforce1010?.quote===QUOTE.number&&!override&&person.pay_rate===QUOTE.rate,overlapIds=api.overlaps(row.date);
 return {...row,rateBasis:overlapIds.length?'Supplier labour already recorded for this date · allocation review: '+overlapIds.join(', '):quoted?'Advanced quote 27172 · race-day supplier rate, 4 h minimum':row.rateBasis,overlapIds1010:overlapIds};
});};
/* The event card reads Kyle's saved night-shift confirmation, never the old unconfirmed-source label. */
const priorEventModel=eventStaffingModel833;
eventStaffingModel833=function(){const m=priorEventModel.apply(this,arguments);m.placeholders=m.placeholders.filter(row=>!/fencing crew/i.test(row.role)&&!(/night/i.test(row.role)&&(m.confirmedNights||[]).some(n=>n.name==='Kyle Gover')));const confirmedIds=new Set((m.confirmedNights||[]).flatMap(row=>row.shiftIds));m.additional=m.additional.filter(row=>!confirmedIds.has(row.id));return m;};
api.summary=function(){const rows=ourCosts().filter(isShift),missing=rows.filter(row=>!Number.isFinite(runHours(row))),held=rows.filter(row=>api.overlaps(row.date).length);return {rows:rows.length,missing:missing.length,held:held.length,days:[...new Set(rows.map(row=>row.date))]};};
api.scopeRows=function(line,ro){
 return scopePeople(line).map(row=>'<tr data-scope-person1010="'+esc(row.name)+'"><td><b>'+esc(row.name)+'</b></td><td class="num">'+esc(money(row.rate))+'</td>'+row.days.map(day=>'<td class="num">'+(day.active?'<b>'+esc(String(day.hours))+' h</b>':'Not rostered')+'</td>').join('')+'<td class="num"><b>'+esc(String(row.hours))+' h</b></td></tr>').join('')+
 '<tr data-scope-line="fence"><td><b>Fencing total</b></td><td>'+ (ro?'': '<input class="rate scopein" inputmode="decimal" data-scope="rate|fence|" value="'+(line.rate_typed?esc(String(line.rate)):'')+'" placeholder="'+esc(String(line.rate))+'" aria-label="Customer fencing rate per person per hour">')+'</td>'+line.days.map(day=>'<td class="num">'+(ro?esc(String(day.hours))+' h':'<input class="rate scopein hrs" inputmode="decimal" data-scope="hours|fence|'+esc(day.day)+'" value="'+(day.per_typed?esc(String(day.per)):'')+'" placeholder="'+esc(String(day.per))+'" aria-label="Customer hours per fencing person on '+esc(day.day)+'"> h each')+'</td>').join('')+'<td class="num"><b>'+esc(String(line.hours))+' h</b><br>'+esc(money(line.amount))+'</td></tr>';
};
})(typeof window!=='undefined'?window:globalThis);
