/* Author: Andrew Fisher. Current approved scope and one shared pee-panel hire price. */
(function(root){'use strict';
 const cents=n=>Math.round((n+Number.EPSILON)*100)/100,known=n=>typeof n==='number'&&Number.isFinite(n),norm=v=>String(v||'').trim().toLowerCase();
 const hireKey='hire|WC09|Pee Panel',supplierFloor=450;
 function validate(input){if(input!=null&&!['string','number'].includes(typeof input))return {ok:false,value:null,error:'Enter a valid full hire rate per panel.'};const raw=String(input==null?'':input).trim();if(!raw)return {ok:true,value:null,error:null};const value=Number(raw);if(!Number.isFinite(value)||value<0||value>1000000)return {ok:false,value:null,error:'Enter a valid full hire rate per panel.'};if(value<supplierFloor)return {ok:false,value:null,error:'Full hire must be at least $450 per panel to cover the approved supplier hire.'};return {ok:true,value,error:null};}
 function price({source,fullOverride,weeklyOverride,weeklyDays}){
  const entered=v=>v!=null&&String(v).trim()!=='',valid=v=>entered(v)&&['string','number'].includes(typeof v)&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1000000;
  let fullHireRate=source.hire,rateSource='Street Rate Card 2026 D22 · full hire per panel',requested=null,invalid=false,legacyWeekly=false;
  if(entered(fullOverride)){requested=valid(fullOverride)?Number(fullOverride):null;invalid=requested==null;}
  else if(entered(weeklyOverride)){legacyWeekly=true;requested=valid(weeklyOverride)&&known(weeklyDays)&&weeklyDays>=0?Number(weeklyOverride)*weeklyDays/7:null;invalid=requested==null;}
  const underFloor=requested!=null&&requested<supplierFloor;
  if(requested!=null&&!underFloor){fullHireRate=requested;rateSource=legacyWeekly?'Recorded weekly override × '+weeklyDays+' days ÷ 7':'Edited full hire per panel';}
  return {key:hireKey,rate:fullHireRate,fullHireRate,sourceRate:source.hire,daily:source.daily,sourceDaily:source.daily,supplierFloor,requested,underFloor,invalid,legacyWeekly,weeklyDays:legacyWeekly?weeklyDays:null,overridden:requested!=null&&!underFloor,rateSource,basis:rateSource+' · quantity counted once · ex GST'};
 }
 function pee(items,contracts,source,pricing){
  const empty=state=>({amount:0,actualAmount:0,remainingAmount:0,quantity:0,arrivedQuantity:0,state,source});
  const rows=(items||[]).filter(r=>r.ref==='WC09'&&norm(r.item)==='pee panel');
  if(rows.length!==1)return empty('scope changed');
  const quantity=rows[0].quantity,arrivedQuantity=rows[0].arrived;
  if(!Number.isSafeInteger(quantity)||quantity<0||!Number.isSafeInteger(arrivedQuantity)||arrivedQuantity<0||arrivedQuantity>quantity)return empty('scope changed');
  if((contracts||[]).some(r=>!r.charge_line&&/\bpee\s*panels?\b/i.test(r.description||r.register_type||'')))return empty('contract coverage needs allocation');
  const rate=pricing.fullHireRate,amount=cents(quantity*rate),actualAmount=cents(arrivedQuantity*rate);
  return {id:'hire979|WC09|Pee Panel',ref:'WC09',item:'Pee Panel',branch:'KINP',quantity,arrivedQuantity,rate,amount,actualAmount,remainingAmount:cents(amount-actualAmount),state:arrivedQuantity===quantity?'actual':arrivedQuantity>0?'part arrived':'forecast',ledger:'1010',supplierCostAdditional:0,source,pricing1010:pricing,basis:pricing.basis+'. Confirmed received quantity is actual; remaining approved quantity is forecast. Supplier hire remains in the existing approved quote.'};
 }
 function quantity(row,scope){
  // This exact source line is the independently verified over-allocation. Other
  // contract groups, especially numbered returns and later rehiring, are preserved.
  if(!row||String(row.rental_contract)!=='9968955'||Number(row.line)!==102||row.charge_line||row.asset_no_is_plant_number||norm(row.register_type)!=='fwf'||!/^WC09\b/i.test(String(row.description||'')))return null;
  if(!scope||scope.cancelled||!Number.isSafeInteger(scope.quantity)||scope.quantity<0||!known(row.quantity)||row.quantity<=scope.quantity)return null;
  return {ref:'WC09',item:'FWF',sourceQuantity:row.quantity,billableQuantity:scope.quantity,excludedQuantity:row.quantity-scope.quantity,reason:'Current approved WC09 FWF quantity replaces the older contract quantity; pee panels are a separate item.'};
 }
 function allocation(row,contracts,current){
  if(!row||String(row.rental_contract)!=='9968862'||row.charge_line||!row.asset_no_is_plant_number||row.kind!=='building'||row.quantity!==1)return null;
  const cases={94:{ref:'P46',primary:7,number:'1327213',replacement:100,replacementNumber:'1327215'},108:{ref:'P67',primary:93,number:'1189410'},110:{ref:'P65',primary:63,number:'1189412'}},rule=cases[row.line];
  if(!rule||String(row.asset_no)!==rule.number||!['pending','del req'].includes(norm(row.status_as_written))||row.start_date)return null;
  const primary=(contracts||[]).find(r=>String(r.rental_contract)==='9968862'&&Number(r.line)===rule.primary&&String(r.asset_no)===rule.number&&norm(r.status_as_written)==='delivered'&&r.start_date);
  if(!primary)return null;
  const amount=known(row.rate_1)&&row.rate_1>=0?cents(row.rate_1*row.quantity):null;
  if(rule.replacement){
   const replacement=(contracts||[]).find(r=>String(r.rental_contract)==='9968862'&&Number(r.line)===rule.replacement&&String(r.asset_no)===rule.replacementNumber);
   if(!replacement||!current||current.quantity!==1||!current.physicalNumbers?.includes(rule.replacementNumber))return null;
   return {ref:rule.ref,item:row.register_type,contract:'9968862',line:row.line,branch:row.branch_code,state:'duplicate-removed',sourceAmount:amount,actualAmount:0,remainingAmount:0,primary:rule.primary,replacement:rule.replacement,reason:'P46 is supplied by confirmed asset 1327215 on contract line 100. Old pending line 94 repeats P04 asset 1327213; no second P46 hire is added.'};
  }
  if(!current||current.quantity!==1||current.cancelled)return null;
  const physical=[...new Set(current.physicalNumbers||[])].filter(Boolean);
  if(current.arrived===1&&physical.length===1&&physical[0]!==rule.number){
   const named=(contracts||[]).filter(r=>r.asset_no_is_plant_number&&String(r.asset_no)===physical[0]&&!r.charge_line&&r!==row),matching=named.find(r=>norm(r.register_type)===norm(row.register_type)&&((r.match?.key||r.match?.task_id)===rule.ref||new RegExp('^'+rule.ref+'\\b','i').test(r.description||'')));
   if(matching)return {ref:rule.ref,item:row.register_type,contract:'9968862',line:row.line,branch:row.branch_code,state:'duplicate-removed',sourceAmount:amount,actualAmount:0,remainingAmount:0,primary:rule.primary,replacement:matching.line,reason:rule.ref+' is supplied by confirmed asset '+physical[0]+' on contract '+matching.rental_contract+' line '+matching.line+'. The old pending placeholder is not charged again.'};
   if(!named.length)return {ref:rule.ref,item:row.register_type,contract:'9968862',line:row.line,branch:row.branch_code,state:'current-scope-confirmed',sourceAmount:amount,actualAmount:amount,remainingAmount:0,currentAssetNumber:physical[0],sourceAssetNumber:rule.number,primary:rule.primary,reason:rule.ref+' has confirmed received asset '+physical[0]+'. Its existing reference hire rate is charged once; source asset '+rule.number+' is an older placeholder and needs correcting in Baseplan.'};
  }
  return {ref:rule.ref,item:row.register_type,contract:'9968862',line:row.line,branch:row.branch_code,state:'forecast-allocation-hold',sourceAmount:amount,actualAmount:null,remainingAmount:amount,primary:rule.primary,reason:rule.ref+' has one approved building. The pending contract repeats asset '+rule.number+' already supplied elsewhere. Keep its known hire as forecast; confirm its own asset before billing.'};
 }
 function periods(items,contracts){
  const sources=new Map((contracts||[]).map(r=>[r.rental_contract+'|'+r.line,r]));
  return (items||[]).map(item=>{
   const groups=new Map();for(const line of item.hire||[]){if(!line.assetNo)continue;const rs=groups.get(String(line.assetNo))||[];rs.push(line);groups.set(String(line.assetNo),rs);}
   const replace=new Map(),remove=new Set();
   for(const [assetNo,lines]of groups){if(lines.length<2||lines.some(l=>l.quantity!==1||!known(l.amount)))continue;
    const dated=lines.map(line=>{const r=sources.get(line.id);return {line,r,from:r?.start_date||r?.booked_delivery_date,to:r?.term_date||r?.expected_term_date||r?.booked_pickup_date};}).sort((a,b)=>String(a.from).localeCompare(String(b.from)));
    if(dated.some(d=>d.r?.kind!=='forklift'||!/^\d{4}-\d{2}-\d{2}$/.test(d.from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(d.to||'')||d.to<d.from)||dated.some((d,i)=>i>0&&dated[i-1].to>=d.from))continue;
    const first=lines[0],ids=lines.map(l=>l.id).sort();replace.set(first.id,{...first,id:'periods1010|'+ids.join('+'),quantity:1,amount:cents(lines.reduce((n,l)=>n+l.amount,0)),periodLines1010:ids,basis:'Separate non-overlapping hire periods for physical asset '+assetNo+'; equipment quantity counted once.'});for(const line of lines.slice(1))remove.add(line.id);
   }
   return {...item,hire:(item.hire||[]).filter(l=>!remove.has(l.id)).map(l=>replace.get(l.id)||l)};
  });
 }
 const api={price,pee,quantity,allocation,periods,validate,hireKey,supplierFloor,cents};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.Pricing1010=api;
})(typeof window!=='undefined'?window:null);

if(typeof window!=='undefined'){
 const oldCard1010=cardRate,oldRate1010=rateFor,oldCharge1010=contractCharge,oldItemProject1010=ItemCharges979.project;
 function scope1010(){const a=assetOf('WC09'),l=a&&chargeLines(a).find(r=>r.item==='FWF');return a&&l?{quantity:qtyOf(l),cancelled:!!(a._cancelled||a.rest_of)}:null;}
 window.contractQuantity1010=r=>r&&String(r.rental_contract)==='9968955'&&Number(r.line)===102?Pricing1010.quantity(r,scope1010()):null;
 window.validatePeeRate1010=input=>Pricing1010.validate(input);
 window.contractAllocation1010=function(r){if(!r||String(r.rental_contract)!=='9968862'||![94,108,110].includes(Number(r.line)))return null;
  const ref={94:'P46',108:'P67',110:'P65'}[r.line],a=assetOf(ref),l=a&&chargeLines(a).find(l=>l.item===r.register_type),current=a&&l?{quantity:qtyOf(l),arrived:receivedChargeQty1006(a,l),cancelled:!!(a._cancelled||a.rest_of),physicalNumbers:gcModel925(a).rows.filter(u=>u.physical&&u.item===l.item).map(u=>String(u.assetNo||''))}:null;
  const source=r.allocationConfirmed1010?ONHIRE_ROWS.find(x=>String(x.rental_contract)===String(r.rental_contract)&&Number(x.line)===Number(r.line))||r:r;
  return Pricing1010.allocation(source,ONHIRE_ROWS,current);
 };
 window.pricingForecast1010=function(){return heldMemo('pricingForecast1010',()=>{const holds=ONHIRE_ROWS.map(contractAllocation1010).filter(Boolean),rows=holds.filter(r=>r.state==='forecast-allocation-hold'&&r.remainingAmount!=null).map(r=>({ref:r.ref,item:r.item,branch:r.branch,amount:r.remainingAmount,contract:r.contract,line:r.line,reason:r.reason}));return {rows,holds,total:Pricing1010.cents(rows.reduce((n,r)=>n+r.amount,0)),excluded:Pricing1010.cents(holds.filter(r=>r.state==='duplicate-removed').reduce((n,r)=>n+(r.sourceAmount||0),0))};});};
 contractCharge=function(r){const decision=contractAllocation1010(r);if(decision){const original=oldCharge1010(r);return {...original,amount:decision.actualAmount,actual:decision.actualAmount,remaining:decision.remainingAmount,forecast:decision.state==='current-scope-confirmed'?decision.actualAmount:decision.remainingAmount,allocation1010:decision,how:decision.state==='duplicate-removed'?'Replaced source line':decision.state==='current-scope-confirmed'?'Current site scope':'Forecast — asset allocation pending',basis:decision.reason};}
  const allocation=contractQuantity1010(r);if(!allocation)return oldCharge1010.apply(this,arguments);
  const original=oldCharge1010(r),value=oldCharge1010({...r,quantity:allocation.billableQuantity});
  // contractCharge's legacy default treats zero as one, so an explicitly removed
  // scope gets zero here rather than silently recovering a phantom unit.
  if(allocation.billableQuantity===0)value.amount=0;
  return {...value,sourceQuantity1010:allocation.sourceQuantity,billableQuantity1010:allocation.billableQuantity,sourceAmount1010:original.amount,excludedAmount1010:typeof original.amount==='number'&&typeof value.amount==='number'?Pricing1010.cents(original.amount-value.amount):null,basis:value.basis+' · Current site scope '+allocation.billableQuantity+' FWF; source contract records '+allocation.sourceQuantity+'. '+allocation.reason};
 };
 ItemCharges979.project=function(ref,item,contracts,readCharge,workCard,costEvidence){const result=oldItemProject1010.apply(this,arguments);return {...result,lines:result.lines.map(l=>{const r=(contracts||[]).find(r=>String(r.rental_contract)===String(l.contract)&&Number(r.line)===Number(l.line)),allocation=r&&contractQuantity1010(r);return allocation?{...l,sourceQuantity1010:allocation.sourceQuantity,quantity:allocation.billableQuantity}:l;})};};
 const previousIdentity1010=ItemIdentity979.select;ItemIdentity979.select=function(ref,item,contracts,current){const selected=previousIdentity1010.apply(this,arguments);if(!['P65','P67'].includes(ref))return selected;for(const row of contracts||[]){const decision=contractAllocation1010(row);if(decision?.state!=='current-scope-confirmed'||decision.ref!==ref||decision.item!==item||selected.some(r=>String(r.rental_contract)===String(row.rental_contract)&&Number(r.line)===Number(row.line)))continue;selected.push({...row,asset_no:decision.currentAssetNumber,sourceAssetNumber1010:row.asset_no,match:{...row.match,key:ref},allocationConfirmed1010:true});}return selected;};
 if(typeof OnsiteComplete979!=='undefined'){const previous=OnsiteComplete979.project;OnsiteComplete979.project=function(items,transport){return previous(Pricing1010.periods(items,ONHIRE_ROWS),transport);};}
 window.peePrice1010=function(){
  const a=assetOf('WC09'),key='Toilets & amenities|Pee Panel',weeklyOverride=S.rates?.[key],typedMin=S.minDays?.[key];
  let min=oldCard1010('Toilets & amenities','Pee Panel','WC09')?.minimum_hire;
  if(typedMin!=null&&String(typedMin).trim()!==''){const n=Number(typedMin);min=Number.isFinite(n)&&n>=0&&n<=MAX_MIN_DAYS?{days:n}:{invalid:true};}
  const weeklyDays=a?chargedDays(chargeSpanOf(a),min).days:null;
  const p=Pricing1010.price({source:PeeHire979.source,fullOverride:S.lineRates?.[Pricing1010.hireKey],weeklyOverride,weeklyDays}),l=a&&chargeLines(a).find(r=>r.item==='Pee Panel'),quantity=l?qtyOf(l):0,arrived=l?receivedChargeQty1006(a,l):0;
  return {...p,quantity,arrivedQuantity:arrived,amount:Number.isFinite(quantity)?Pricing1010.cents(p.fullHireRate*quantity):null,actualAmount:Number.isFinite(arrived)?Pricing1010.cents(p.fullHireRate*arrived):null,floor:p.supplierFloor};
 };
 PeeHire979.forecast=(items,contracts)=>Pricing1010.pee(items,contracts,PeeHire979.source,peePrice1010());
 cardRate=function(disc,item,key){const card=oldCard1010.apply(this,arguments);if(disc!=='Toilets & amenities'||String(item).trim().toLowerCase()!=='pee panel')return card;const p=peePrice1010();return {...card,kind:'flat',rate:p.fullHireRate,hire_rate:p.fullHireRate,source:p.overridden?'typed':'card',basis:p.basis,why:'Full hire per individual pee panel from the original card, or its recorded override. Quantity is applied once.',pricing1010:p};};
 rateFor=function(disc,item,key){if(disc!=='Toilets & amenities'||String(item).trim().toLowerCase()!=='pee panel')return oldRate1010.apply(this,arguments);const card=cardRate(disc,item,key);return {value:card.rate,per:'flat',source:card.source,card};};
}
