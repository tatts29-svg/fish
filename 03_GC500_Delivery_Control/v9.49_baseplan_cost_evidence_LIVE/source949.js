/* Author: Andrew Fisher. Source-linked estimates of Direct costs; no operational record or source-rate writes. */
const Source949 = (() => {
 const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
 const rows = () => (DATA.rental_on_hire.supplier_cost_evidence949 || []);
 const evidence = row => rows().find(e => String(row.rental_contract) === e.contract && e.lines.includes(Number(row.line)) && row.supplier_sub_rental === e.supplierCode) || null;
 const token=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 function matches(cost,row,e){
  if(!cost||cost.usable===false||cost.side!=='ours'||typeof cost.amount!=='number'||!Number.isFinite(cost.amount)||cost.amount<0)return false;
  const supplier=token(cost.supplier||cost.company||cost.vendor||cost.supplier_code);
  if(!supplier||![e.supplierCode,e.supplierName,...(e.supplierAliases||[])].some(s=>token(s)===supplier))return false;
  const text=[cost.description,cost.reference,cost.note].filter(Boolean).join(' ');
  const writtenContract=text.match(/\bcontract\s*(?:no\.?\s*)?[:#]?\s*(\d{7})\b/i);
  const contract=String(cost.rental_contract||cost.contract||cost.contract_no||(writtenContract&&writtenContract[1])||'');
  if(contract!==String(row.rental_contract))return false;
  const writtenLine=text.match(/\bline\s*[:#]?\s*(\d+)\b/i);
  const line=cost.contract_line!=null?cost.contract_line:cost.line_no!=null?cost.line_no:writtenLine&&writtenLine[1];
  return line==null||String(line)===''||Number(line)===Number(row.line);
 }
 function calculate(row,e,charge,actuals){
  if(!e||!charge||charge.treatment||!['per day','whole event'].includes(charge.how))return null;
  const quantity=typeof row.quantity==='number'&&row.quantity>0?row.quantity:1;
  const daily=charge.how==='per day',units=daily?charge.days:1;
  if(!Number.isFinite(units)||units<=0)return null;
  const from=row.start_date||row.booked_delivery_date,to=row.term_date||row.expected_term_date||row.booked_pickup_date;
  const total=cents(e.costRate*quantity*units),matched=(actuals||[]).filter(c=>matches(c,row,e));
  const covered=new Set();let whole=false,partialEvent=false;
  for(const c of matched){
   const writtenPeriod=String(c.note||'').match(/\bperiod\s*(\d{4}-\d{2}-\d{2})\s*(?:to|→)\s*(\d{4}-\d{2}-\d{2})\b/i);
   const start=c.period_from||c.from_date||c.start_date||(writtenPeriod&&writtenPeriod[1]),end=c.period_to||c.to_date||c.end_date||(writtenPeriod&&writtenPeriod[2]);
   if(!start&&!end){whole=true;continue;}
   if(!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||!/^\d{4}-\d{2}-\d{2}$/.test(end||'')||end<=start)continue;
   if(daily){for(let i=0;i<units;i++){const day=new Date(Date.parse(from+'T00:00:00Z')+i*86400000).toISOString().slice(0,10);if(day>=start&&day<end)covered.add(i);}}
   else if(start<='2026-10-23'&&end>'2026-10-25')whole=true;else partialEvent=true;
  }
  // A whole-event rate cannot be allocated to a partial supplier period from these sources.
  // Hold that estimate for reconciliation; do not add it beside a potentially overlapping actual.
  const uncoveredDays=daily&&!whole&&!partialEvent?Array.from({length:units},(_,i)=>i).filter(i=>!covered.has(i)).map(i=>new Date(Date.parse(from+'T00:00:00Z')+i*86400000).toISOString().slice(0,10)):[];
  const remaining=whole||partialEvent?0:Math.max(0,units-covered.size),estimate=cents(e.costRate*quantity*remaining);

  return {id:'supplier949|'+row.rental_contract+'|'+row.line,contract:String(row.rental_contract),line:Number(row.line),supplier:e.supplierName,supplierCode:e.supplierCode,revenueBranch:row.branch_code,costBranch:e.salesAnalysisCode.split('-')[0],salesAnalysisCode:e.salesAnalysisCode,rate:e.costRate,quantity,daily,units,remaining,uncoveredDays,from:daily?from:null,to:daily?to:null,total,estimate,covered:units-remaining,actualIds:matched.map(c=>c.id).filter(Boolean),held:partialEvent&&!whole,basis:daily?'linked contract daily charge window':'linked contract whole-event charge basis',source:e};
 }
 const actuals=()=>{const read=()=>typeof ourCosts==='function'?ourCosts():[];return typeof heldMemo==='function'?heldMemo('supplier949ActualCosts',read):read();};
 const model=()=>{const read=()=>{const costs=actuals();return ONHIRE_ROWS.filter(r=>evidence(r)).map(r=>calculate(r,evidence(r),contractCharge(r),costs)).filter(Boolean);};return typeof heldMemo==='function'?heldMemo('supplier949Forecast',read):read();};
 const forRow=row=>{const e=evidence(row);return e?calculate(row,e,contractCharge(row),actuals()):null;};
 const words=f=>!f?'':`Estimated Direct costs: ${money(f.rate)} × ${f.quantity}${f.daily?' × '+f.remaining+' day'+(f.remaining===1?'':'s'):' once'} = ${money(f.estimate)}${f.daily?' ('+fmtDate(f.from)+' → '+fmtDate(f.to)+')':''}. ${f.supplier} (${f.supplierCode}); cost SA ${f.salesAnalysisCode}. Calculated from the linked contract basis; not a supplier invoice.${f.covered?' Recorded supplier coverage replaces '+f.covered+' '+(f.daily?'billed day(s)':'event charge')+'.':''}${f.held?' Partial-period actual present: whole-event estimate held to avoid overlap; uncovered supplier cost remains unresolved.':''} Source: ${f.source.sheet}!${f.source.rateCell}.`;
 const html=row=>{const f=forRow(row);return f?'<div class="w source949-cost" style="font-size:12px;color:var(--mute);white-space:normal">'+esc(words(f))+'</div>':'';};
 const discrepancy=ref=>{const d=(DATA.rental_on_hire.discrepancies949||[]).find(d=>d.ref===ref);if(!d)return '';const a=typeof assetOf==='function'&&assetOf(ref),ns=a&&typeof assetNumbersOf==='function'?assetNumbersOf(a):[];return `Current contract ${d.contract}, line ${d.line}, lists asset ${d.contractAsset}. The site record for ${ref}${ns.length?' identifies '+ns.join(', '):' has its own allocation'}. The contract source does not replace the recorded equipment or its photographs.`;};
 const note=ref=>{const text=discrepancy(ref);return text?'<p class="units925-note source949-discrepancy">'+esc(text)+'</p>':'';};
 const archive=()=>{const a=DATA.rental_on_hire.source_history949;if(!a||!a.rows.length)return '';return `<details class="onhire source949-archive"><summary>Previous source lines · ${a.rows.length}</summary><p class="hint">${esc(DATA.rental_on_hire.source_audit949.note)} ${DATA.rental_on_hire.source_audit949.overlappingNumberGroups} repeated-number groups remain in the source.</p><p class="hint">These lines are absent from the latest workbook and excluded from active contract totals. Their previous source information is retained here; this does not remove equipment or site history.</p><ul class="onhire-l">${a.rows.map(r=>`<li>${onhireLine(r)}</li>`).join('')}</ul></details>`;};
 const month=(f,m)=>f.daily?cents(f.uncoveredDays.filter(d=>d.slice(0,7)===m).length*f.rate*f.quantity):m==='2026-10'?f.estimate:0;
 return {evidence,matches,calculate,model,forRow,words,html,discrepancy,note,archive,month};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=Source949;
