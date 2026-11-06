/* Author: Andrew Fisher. Proposed outstanding portaloo deliveries: maximum 24 per calendar day. */
function dailyPlan1000(rows,asAt,reserved={}){
 const compare=(a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(sideOrder[a.side]??2)-(sideOrder[b.side]??2)||text(a.zone).localeCompare(text(b.zone))||a.ref.localeCompare(b.ref,undefined,{numeric:true})||a.item.localeCompare(b.item);
 const nextWork=iso=>{const d=new Date(iso+'T12:00:00Z');do{d.setUTCDate(d.getUTCDate()+1);}while(d.getUTCDay()===0||d.getUTCDay()===6);return d.toISOString().slice(0,10);};
 const used=new Map(Object.entries(reserved)),out=[];
 for(const row of rows.slice().sort(compare)){
  // Undated requests remain undated; other products retain their own transport rules.
  if(family(row.item)!=='single'||!date(row.date)||integer(row.remaining)===null||!row.remaining){out.push({...row});continue;}
  const sourceDate=row.sourceDate||row.date,numbered=row.received===0&&(row.numbers||[]).length===row.remaining&&new Set(row.numbers).size===row.remaining;
  let day=row.date,left=row.remaining,offset=0;
  if(date(asAt)&&day<asAt){day=asAt;const weekday=new Date(day+'T12:00:00Z').getUTCDay();if(weekday===0||weekday===6)day=nextWork(day);}
  while(left){
   const free=24-(used.get(day)||0);if(!free){day=nextWork(day);continue;}
   const n=Math.min(free,left),numbers=numbered?row.numbers.slice(offset,offset+n):(row.numbers||[]).slice();
   out.push({...row,date:day,sourceDate,remaining:n,numbers,dailyLimit:24});used.set(day,(used.get(day)||0)+n);left-=n;offset+=n;
   if(left)day=nextWork(day);
  }
 }
 return out.sort(compare);
}
function plannedRemaining1000(rows,asAt){
 const reserved={},pending=[];
 for(const row of rows){
  const parts=PLAN1000.filter(p=>p.ref===row.ref&&same(p.item,row.item)),raw=remainingDates(row);
  if(!parts.length){pending.push(...raw.map(p=>({...row,...p})));continue;}
  let consumed=Math.max(0,row.received-parts[0].received),left=Math.max(0,row.quantity-row.received),offset=0;
  const exact=row.received===0&&(row.numbers||[]).length===left&&new Set(row.numbers).size===left;
  const changed=date(row.movedDate)&&row.movedDate!==parts[0].movedDate;
  for(const part of parts){
   const taken=Math.min(consumed,part.count);consumed-=taken;
   reserved[part.date]=(reserved[part.date]||0)+taken;
   const n=Math.min(left,part.count-taken);if(!n||row.dispatchHold)continue;
   const rawPart=raw.find(p=>p.date===part.sourceDate)||raw[0],sourceDate=changed?row.movedDate:rawPart?.date||'';
   const target=changed?row.movedDate:sourceDate?(sourceDate>part.date?sourceDate:part.date):'';
   pending.push({...row,date:target,sourceDate,remaining:n,numbers:exact?row.numbers.slice(offset,offset+n):(row.numbers||[]).slice()});
   left-=n;offset+=n;
  }
  if(left&&!row.dispatchHold){const last=raw.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).pop();pending.push({...row,date:last?.date||'',sourceDate:last?.date||'',remaining:left,numbers:exact?row.numbers.slice(offset):(row.numbers||[]).slice()});}
 }
 return dailyPlan1000(pending,asAt,reserved);
}
function remainingIn1000(ref){
 const parts=api.model().remaining.filter(r=>r.ref===ref);if(!parts.length||!parts.some(r=>r.dailyLimit===24))return '';
 return '<p class="ctk">Remaining in</p><b>'+parts.map(r=>esc((r.date?dayWords816(r.date):'Date not recorded')+' · '+r.remaining+' × '+r.item)).join('<br>')+'</b><span>Proposed · maximum 24 portaloos per day</span>';
}

function remainingText1000(ref){
 const parts=api.model().remaining.filter(r=>r.ref===ref);return parts.some(r=>r.dailyLimit===24)?parts.map(r=>(r.date?dayWords816(r.date):'Date not recorded')+' · '+r.remaining+' × '+r.item).join('; ')+' (proposed)':'';
}
