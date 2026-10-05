/* Author: Andrew Fisher. Remaining labour revenue is a forecast, never a completed tick. */
function labourRevenue858(){
 return heldMemo('labourRevenue858',()=>holdAssets(()=>{
  const keys=new Set(['install','steps','levelling','demob']),sums={install:0,steps:0,levelling:0,demob:0},missing=[],seen=new Set();
  const r2=v=>Math.round((v+Number.EPSILON)*100)/100;
  for(const a of allAssets().filter(a=>!a._cancelled&&!a.rest_of&&!movedAway(a.key))){
   for(const line of chargeLines(a)){
    const qty=qtyOf(line),info=labourLinesFor(a.key,line.discipline,line.item,a.key,undefined,a);
    for(const item of info.lines.filter(x=>keys.has(x.key))){
     const identity=[a.key,line.discipline,line.item,item.key].join('|');
     if(seen.has(identity))continue;seen.add(identity);
     if(qty==null||!Number.isFinite(Number(item.rate))){missing.push(identity);continue;}
     sums[item.key]+=qty*item.rate;
    }
   }
  }
  for(const key of keys)sums[key]=r2(sums[key]);
  const M=moneySummary(),ticks=pl760Ticks();
  const recorded=r2((Number(M.charge.labour)||0)-(Number(ticks.fire_ext.amount)||0)-(Number(ticks.cleaning.amount)||0));
  const priced=r2(Object.values(sums).reduce((a,b)=>a+b,0)),job=Math.max(priced,recorded),remaining=r2(job-recorded);
  return {sums,priced,recorded,job,remaining,missing};
 }));
}

function labourAllowance858(){
 const record=(S.finance745||{}).labourAllowance858,amount=Number(record&&record.amount);
 return record&&record.basis==='forecast'&&Number.isFinite(amount)&&amount>=0?amount:0;
}
function labourAllowanceCard858(){
 const amount=labourAllowance858();if(!amount)return '';
 return '<details class="card"><summary><strong>Forecast salary uplift and living-away allowance</strong> · '+esc(money(amount))+'</summary><p>Included once in forecast employee cost. Base salary and unpriced employee wages remain separate costing gaps. Hotel accommodation remains a separate expense.</p></details>';
}

function rosterIncludes858(row){
 const window=(S.finance745||{}).labourRoster858;
 return !window||(!window.from||row.date>=window.from)&&(!window.to||row.date<=window.to);
}
