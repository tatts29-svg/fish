/* Author: Andrew Fisher. One generator hire calculation for the shared operational and financial views. */
(function(root){
'use strict';
const eventFrom='2026-10-23',offhire='2026-10-25',invoiceMonth='2026-10';
const cardRates=[[12,102.9382,51.46704],[20,122.2301,61.11711],[30,141.5323,70.76718],[40,158.105,79.3512],[45,175.8416,87.92286],[50,182.2791,91.13955],[60,193.0014,96.5007],[80,218.7308,109.36746],[100,225.1683,112.58415],[125,257.3352,128.6676],[150,268.0575,134.02875],[200,364.5582,182.2791],[250,418.1697,209.08485],[315,471.7812,235.8906]];
const cents=n=>Math.round((n+Number.EPSILON)*100)/100,known=n=>typeof n==='number'&&Number.isFinite(n),list=x=>Array.isArray(x)?x:[],key=r=>String(r.rental_contract)+':'+String(r.line);
function day(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;const n=Date.parse(value+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value?n:null;}
function windowOf(start){const a=day(start),fri=day(eventFrom),sun=day(offhire);if(a==null)return {standdownDays:null,eventDays:null,equivalentDays:null,offhire};const standdownDays=Math.max(0,Math.round((fri-a)/86400000)),eventDays=Math.max(0,Math.round((sun-Math.max(a,fri))/86400000)+1);return {standdownDays,eventDays,equivalentDays:standdownDays*.5+eventDays,offhire};}
function kva(text){const m=String(text||'').match(/(\d+(?:\.\d+)?)\s*kva/i);return m?Number(m[1]):null;}
function rate(input,row,env){
 const qty=row&&row.quantity,typed=row?env.lineRate('c|'+row.rental_contract+'|'+row.line):null;
 if(row&&known(row.rate_1)&&row.rate_1>=0){const daily=/^(D|DAILY|DAY)$/i.test(String(row.rate_type||''));return {dailyRate:daily?row.rate_1:row.rate_1/3,standdownRate:daily?row.rate_1/2:row.rate_1/6,rateSource:'Contract '+row.rental_contract+' line '+row.line+(daily?' · daily rate':' · whole-event Rate 1 ÷ 3 race days'),filled:null,rateState:'contract',rateInput:row.rate_1};}
 if(known(typed)&&typed>=0)return {dailyRate:typed/3,standdownRate:typed/6,rateSource:'Costs override · whole-event equivalent ÷ 3 race days',filled:'typed',rateState:'typed event equivalent',rateInput:typed};
 const weekly=env.weeklyRate(input.ref,input.item);
 if(known(weekly)&&weekly>=0)return {dailyRate:weekly/7,standdownRate:weekly/14,rateSource:'Recorded weekly item rate ÷ 7',filled:'typed',rateState:'typed weekly',rateInput:weekly};
 const asked=kva(input.item),sent=kva(row?.what||row?.description),size=asked||sent;
 if(size>=450)return {dailyRate:null,standdownRate:null,rateSource:'Street Rate Card 2026 · POA',filled:null,rateState:'unpriced'};
 const match=cardRates.filter(r=>size!=null&&r[0]<=size).at(-1);
 if(!match)return {dailyRate:null,rateSource:'Generator rate not recorded',filled:null,rateState:'unpriced'};
 return {dailyRate:match[1],standdownRate:match[2],rateSource:'Street Rate Card 2026 · Generator '+match[0]+' kVA'+(match[0]!==size?' · next size down from '+size+' kVA':'')+' · published Standby Rate before 23 Oct',filled:'card',rateState:'card',rateInput:match[1],requestedKva:size,pricedKva:match[0]};
}
function project(inputs,env){
 const rows=[],contracts=new Map(),unpriced=[];
 for(const input of inputs||[]){
  const sourceRows=list(input.contractRows),issues=list(input.issues).slice();
  if(input.cancelled){for(const r of sourceRows)contracts.set(key(r),{amount:0,actual:0,remaining:0,forecast:0,how:'cancelled',basis:'Cancelled generator reference; no hire charge',daily:false});continue;}
  const validQty=known(input.qty)&&input.qty>=0;
  const quantities=sourceRows.map(r=>known(r.quantity)&&r.quantity>0?r.quantity:null),contractQty=quantities.reduce((s,q)=>s+(q||0),0);
  const linked=sourceRows.length>0&&quantities.every(q=>q!=null)&&validQty&&contractQty===input.qty;
  if(!linked)issues.push(sourceRows.length?'Contract quantity needs allocation':'Contract allocation not recorded');
  const slices=sourceRows.length?sourceRows.map((r,i)=>({contract:r,qty:quantities[i]})):[{contract:null,qty:validQty?input.qty:null}];
  const output=[];
  for(const slice of slices){
   const r=slice.contract,delivery=r&&list(input.contractDeliveries).find(d=>d.id===key(r));
   const partial=known(input.actualQuantity)&&validQty&&input.actualQuantity<input.qty;
   const arrived=input.actualIsConfirmed===true&&(!partial||delivery?.actualIsConfirmed===true);
   const explicitDate=input.deliverySource==='Recorded hire start';
   const deliveredDate=arrived?(explicitDate?input.deliveredDate:delivery?.actualIsConfirmed&&delivery.deliveredDate?delivery.deliveredDate:partial?delivery?.deliveredDate:input.deliveredDate):null;
   const plannedDate=input.plannedDate||null,start=arrived?deliveredDate:plannedDate,w=windowOf(start),price=rate(input,r,env);
   const priced=known(price.dailyRate)&&known(slice.qty)&&known(w.equivalentDays)&&linked;
   const amount=priced?cents(slice.qty*(price.standdownRate*w.standdownDays+price.dailyRate*w.eventDays)):null;
   const actual=!linked?null:arrived?amount:0,remaining=!linked?null:arrived?0:amount;
   const standdownCharge=priced?cents(price.standdownRate*slice.qty*w.standdownDays):null;
   const raceCharge=priced?cents(amount-standdownCharge):null;
   const problems=issues.slice();if(!known(price.dailyRate))problems.push('Daily rate not recorded');if(!known(w.equivalentDays))problems.push(arrived?'Confirmed delivery date required':'Planned delivery date required');
   const basis=(arrived?'Confirmed delivery ':'Planned delivery ')+(start||'not recorded')+' to '+offhire+' · '+(w.standdownDays==null?'?':w.standdownDays)+' days at standdown rate + '+(w.eventDays==null?'?':w.eventDays)+' race days at 100% · no hire after 25 Oct · October invoice allocation';
   const pricedRow={...input,...price,...w,id:input.id+(sourceRows.length>1?':'+key(r):''),qty:slice.qty,assetNumbers:sourceRows.length===1?list(input.assetNumbers):list(input.assetNumbers).filter(n=>String(n)===String(r?.asset_no)),displayRef:input.refLabel||input.displayRef||input.ref||'Generator',deliveredDate,plannedDate,actual,remaining,forecast:amount,standdownCharge,raceCharge,standdownActual:arrived?standdownCharge:0,standdownRemaining:arrived?0:standdownCharge,actualIsConfirmed:arrived,status:arrived?'Arrived':amount===0?'Outside charge period':'Forecast',issues:[...new Set(problems)],basis,contractLines:r?['Contract '+r.rental_contract+' · line '+r.line]:[],contractIds:r?[key(r)]:[],ledger:r&&env.rehire(r)?'1010':'1005',invoiceMonth};
   output.push(pricedRow);
   if(r)contracts.set(key(r),{amount:actual,actual,remaining,forecast:amount,basis,how:'generator standdown',days:w.equivalentDays,daily:false,filled:price.filled,generator1004:true,from:start,to:offhire,standdownDays:w.standdownDays,eventDays:w.eventDays,dailyRate:price.dailyRate,standdownRate:price.standdownRate,rateSource:price.rateSource,ledger:pricedRow.ledger,branch:input.branch,ref:input.ref,arrived,issues:pricedRow.issues});
  }
  // Several identical units at one reference are one row; distinct receipts/rates remain visible.
  const groups=new Map();for(const r of output){const k=JSON.stringify([r.ref,r.item,r.branch,r.dailyRate,r.standdownRate,r.deliveredDate,r.plannedDate,r.actualIsConfirmed,r.ledger,r.issues]);if(!groups.has(k))groups.set(k,{...r});else{const g=groups.get(k);g.qty=known(g.qty)&&known(r.qty)?g.qty+r.qty:null;for(const field of ['actual','remaining','forecast','standdownCharge','raceCharge','standdownActual','standdownRemaining'])g[field]=known(g[field])&&known(r[field])?cents(g[field]+r[field]):null;g.contractLines.push(...r.contractLines);g.contractIds.push(...r.contractIds);g.assetNumbers=[...new Set(g.assetNumbers.concat(r.assetNumbers))];}}
  for(const r of groups.values()){if(groups.size===1&&r.qty===input.qty)r.assetNumbers=list(input.assetNumbers).slice();rows.push(r);if(r.actual==null||r.remaining==null||r.forecast==null)unpriced.push({id:r.id,ref:r.ref,issues:r.issues});}
 }
 const sum=(rs,k)=>cents(rs.reduce((s,r)=>s+(known(r[k])?r[k]:0),0));
 const branches=[...new Set(rows.map(r=>r.branch||'Allocation pending'))].sort(),byBranch=branches.map(branch=>{const rs=rows.filter(r=>(r.branch||'Allocation pending')===branch);return {branch,actual:sum(rs,'actual'),remaining:sum(rs,'remaining'),forecast:sum(rs,'forecast'),standdown:sum(rs,'standdownCharge'),unpriced:rs.filter(r=>r.forecast==null).length};});
 return {rows,standdown:sum(rows,'standdownCharge'),standdownActual:sum(rows,'standdownActual'),standdownRemaining:sum(rows,'standdownRemaining'),race:sum(rows,'raceCharge'),actual:sum(rows,'actual'),remaining:sum(rows,'remaining'),forecast:sum(rows,'forecast'),unpriced,byBranch,contracts,hireRemaining:sum(rows.filter(r=>r.ledger==='1005'),'remaining'),rehireRemaining:sum(rows.filter(r=>r.ledger==='1010'),'remaining'),offhire,eventFrom,invoiceMonth};
}
const api={eventFrom,offhire,invoiceMonth,cardRates,windowOf,rate,project,key,cents};root.GeneratorFinance1004=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);

function generatorModel1004(){return heldMemo('generatorModel1004',()=>holdAssets(()=>GeneratorFinance1004.project(generatorInputs1004(),{
 lineRate:lr748Typed,
 weeklyRate:(ref,item)=>{const v=(S.rates||{})['Generators|'+item];return v==null||String(v).trim()===''?null:safeNum(v,MAX_RATE);},
 rehire:r=>typeof finance928ContractOwner==='function'?!!finance928ContractOwner(r).rehire:!!r.subhired
})));}
function generatorContract1004(r){if(!r||r.charge_line||!(r.kind==='generator'||r.family==='generator'))return null;return generatorModel1004().contracts.get(GeneratorFinance1004.key(r))||{amount:null,forecast:null,remaining:null,actual:null,generator1004:true,daily:false,how:'generator allocation pending',basis:'Generator contract allocation needs review'};}
function generatorLine1004(a,l){if(!a||a.discipline!=='Generators'||!/\d\s*kva\b|generator/i.test(String(l.item||'')))return null;const rows=generatorModel1004().rows.filter(r=>r.ref===a.key&&r.item===l.item);if(!rows.length)return null;const total=k=>rows.every(r=>typeof r[k]==='number')?GeneratorFinance1004.cents(rows.reduce((s,r)=>s+r[k],0)):null,first=rows[0],same=rows.every(r=>r.dailyRate===first.dailyRate&&r.equivalentDays===first.equivalentDays);return {...first,qty:rows.reduce((s,r)=>s+(r.qty||0),0),actual:total('actual'),remaining:total('remaining'),forecast:total('forecast'),dailyRate:same?first.dailyRate:null,equivalentDays:same?first.equivalentDays:null,rows};}
function generatorDisplayCharge1004(r){const g=generatorContract1004(r);return g?{...g,amount:g.forecast,basis:g.basis+' · '+(g.arrived?'Actual hire for arrived equipment':'Remaining forecast; arrival not confirmed')}:contractCharge(r);}
function generatorForecastRows1004(){return generatorModel1004().byBranch.filter(r=>r.remaining>0).map(r=>({branch:r.branch,amount:r.remaining}));}

function generatorBranch1004(r){return generatorContract1004(r)?.branch||r.branch_code;}
