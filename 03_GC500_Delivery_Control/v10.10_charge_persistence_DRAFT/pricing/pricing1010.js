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
  return {id:'hire979|WC09|Pee Panel',ref:'WC09',item:'Pee Panel',branch:pricing.branch||'no branch',quantity,arrivedQuantity,rate,amount,actualAmount,remainingAmount:cents(amount-actualAmount),state:arrivedQuantity===quantity?'actual':arrivedQuantity>0?'part arrived':'forecast',ledger:'1010',supplierCostAdditional:0,source,pricing1010:pricing,basis:pricing.basis+'. Confirmed received quantity is actual; remaining approved quantity is forecast. Supplier hire remains in the existing approved quote.'};
 }
 function referenceBranch(row,matches,billableQuantity){
  const source=row?.branch_code||null,candidates=(matches||[]).filter(m=>m.active!==false),refs=[...new Set(candidates.map(m=>m.ref).filter(Boolean))];
  if(!row||row.charge_line||refs.length!==1)return source;
  const current=candidates.find(m=>m.ref===refs[0]),qty=billableQuantity??row.quantity;
  if(!['local','committed'].includes(current.where)||!current.branch||!known(qty)||!known(current.quantity)||qty>current.quantity)return source;
  return current.branch;
 }
 function owner(rows,scope,units){
  rows=Array.isArray(rows)?rows:[rows];if(!rows.length||!scope?.ref||!Number.isSafeInteger(scope.quantity)||scope.quantity<=0||scope.arrived!==scope.quantity)return null;
  if(rows.some(r=>!r||r.charge_line||r.asset_no_is_plant_number||r.subhired||r.supplier_sub_rental||norm(r.register_type)!=='fwf'||!Number.isSafeInteger(r.quantity)||r.quantity<=0))return null;
  if(new Set(rows.map(r=>r.rental_contract+'|'+r.line)).size!==rows.length||rows.reduce((n,r)=>n+(quantity(r,scope)?.billableQuantity??r.quantity),0)!==scope.quantity)return null;
  const current=(units||[]).filter(u=>u.physical&&u.source!=='history'&&norm(u.item)==='fwf'),numbers=new Set(current.map(u=>String(u.assetNo||'').trim()).filter(Boolean)),owners=[...new Set(current.map(u=>u.owner))];
  if(current.length!==scope.quantity||numbers.size!==scope.quantity||owners.length!==1||typeof owners[0]!=='string'||!owners[0].trim()||/unknown|supplier-not-named/.test(owners[0]))return null;
  return {owner:owners[0],rehire:owners[0]!=='coates',basis:'Current approved '+scope.ref+' FWF quantity and uniquely identified physical-unit ownership',ref:scope.ref};
 }
 function quantity(row,scope){
  // This exact source line is the independently verified over-allocation. Other
  // contract groups, especially numbered returns and later rehiring, are preserved.
  if(!row||String(row.rental_contract)!=='9968955'||Number(row.line)!==102||row.charge_line||row.asset_no_is_plant_number||norm(row.register_type)!=='fwf'||!/^WC09\b/i.test(String(row.description||'')))return null;
  if(!scope||scope.cancelled||!Number.isSafeInteger(scope.quantity)||scope.quantity<0||!known(row.quantity)||row.quantity<=scope.quantity)return null;
  return {ref:'WC09',item:'FWF',sourceQuantity:row.quantity,billableQuantity:scope.quantity,excludedQuantity:row.quantity-scope.quantity,reason:'Current approved WC09 FWF quantity replaces the older contract quantity; pee panels are a separate item.'};
 }
 // SOURCE_ROWS1010_START
 function sourceRows(rows){
  const rules={4:{was:'1322579',asset:'1327212',ref:'P03',serial:'261178',row:4,description:'P03 Portable Building Shell 12.0M x 3.0M - Cyclonic Ra'},94:{was:'1327213',asset:'1322579',ref:'P51',serial:'7856.B120.3',row:62,description:'P51 Portable Building Shell 12.0M x 3.0M - Cyclonic Rated'},100:{was:'1327215',asset:'1327215',ref:'P46',serial:'261181',row:64,description:'P46 Portable Building Shell 12.0M x 3.0M - Cyclonic Rated'}};
  const projected=(rows||[]).map(r=>{const rule=String(r.rental_contract)==='9968862'&&rules[r.line];if(!rule||r.sourceAllocation1010||String(r.asset_no)!==rule.was||r.quantity!==1||r.rate_1!==1951.46||r.kind!=='building')return r;
   return {...r,item:rule.asset,asset_no:rule.asset,serial:rule.serial,description:rule.description,match:{...r.match,state:'current source and confirmed site',key:rule.ref,task_id:null,to:'asset',via:'confirmed asset number and updated Baseplan',basis:'Updated Baseplan 9968862-KINP row '+rule.row+' matches the confirmed site asset '+rule.asset+' at '+rule.ref},sourceAllocation1010:{file:'Baseplan SuperCars (1).xlsx',sha256:'6f6a20a3567d99ff0f1e0e97c8387d5a94907a358711c7d52cf5b1043e54956d',sheet:'9968862-KINP',row:rule.row,cells:'A'+rule.row+',D'+rule.row+',F'+rule.row+',BD'+rule.row,sourceStatus:'Delivered',original:{asset_no:r.asset_no,item:r.item,serial:r.serial,description:r.description,match:r.match},basis:'Identity allocation only. Rates, quantities, contract dates and native delivery records are unchanged.'}};
  });
  // The updated source has a new priced P45 line. Its asset field is blank;
  // keep that fact and link its explicit reference to the confirmed site scope.
  // This replaces P45's existing drawer fallback; it is not a second unit.
  if(!projected.some(r=>String(r.rental_contract)==='9968862'&&Number(r.line)===131))projected.push({rental_contract:'9968862',branch_code:'KINP',line:131,item_type_code:1,item:null,asset_no:null,asset_no_is_plant_number:false,serial:null,description:'P45 Portable Building Shell 6.0M x 3.0M',what:'Portable Building Shell 6.0M x 3.0M',register_type:'Building 6m',family:'building',quantity:1,status_as_written:'Del Req',contract_start:'2026-09-14',booked_delivery_date:'2026-09-14',delivery_number:'26122823',return_number:null,expected_term_date:'2026-11-13',term_date:null,booked_pickup_date:'2026-11-13',location:null,delivered:false,start_date:null,start_time:null,demob_date:'2026-11-13',rate_1:1426.07,rate_2:0,rate_3:0,rate_4:0,rate_5:0,flat_monthly_charge:null,rate_type:'W',rate_classification:'no rates',rate_id:'128767',price:0,sell_price:null,number_of_days:7,minimum_days:0,term_number:null,billing_option:null,hold_billing:false,start_time_as_written:'07:00',expected_offrental_time:null,main_item:false,package_name:null,swap_from_line:null,billed_amount:0,last_total_amount:0,billed_units:0,total_inc_sd_dw_gst:0,sales_analysis_code:'KINP-HIR',supplier_sub_rental:null,subhired:false,subhire_rule:null,charge_line:false,kind:'building',match:{state:'explicit source reference and confirmed site',to:'asset',key:'P45',task_id:null,via:'reference and item',basis:'Updated Baseplan line 131 explicitly names P45, Building 6m, quantity 1. Site records confirm asset 107135 received on 12 October; the source asset number and pending status are not treated as site truth.'},sourceAddition1010:{file:'Baseplan SuperCars (1).xlsx',sha256:'6f6a20a3567d99ff0f1e0e97c8387d5a94907a358711c7d52cf5b1043e54956d',sheet:'9968862-KINP',row:83,cells:'A83,B83,D83,F83,G83,J83',basis:'One full event hire at the published source line rate. Native site quantity, asset number and arrival remain authoritative.'}});
  return projected;
 }
 // SOURCE_ROWS1010_END
 function allocation(row,contracts,current){
  if(!row||String(row.rental_contract)!=='9968862'||row.charge_line||!row.asset_no_is_plant_number||row.kind!=='building'||row.quantity!==1)return null;
  const cases={108:{ref:'P67',primary:93,number:'1189410'},110:{ref:'P65',primary:63,number:'1189412'}},rule=cases[row.line];
  if(!rule||String(row.asset_no)!==rule.number||!['pending','del req'].includes(norm(row.status_as_written))||row.start_date)return null;
  const primary=(contracts||[]).find(r=>String(r.rental_contract)==='9968862'&&Number(r.line)===rule.primary&&String(r.asset_no)===rule.number&&norm(r.status_as_written)==='delivered'&&r.start_date);
  if(!primary)return null;
  const amount=known(row.rate_1)&&row.rate_1>=0?cents(row.rate_1*row.quantity):null;
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
 function reviewHolds(items){const holds=[];for(const i of items||[]){if(!(i.arrived>0))continue;
  const unmatched={AA:{item:'Building 6m',asset:'142514'},WC42:{item:'FWF',asset:'EP0141'},WC81:{item:'FWF',asset:'EP0124'}}[i.ref];if(unmatched&&norm(i.item)===norm(unmatched.item)&&(i.physicalNumbers||[]).some(n=>String(n).replace(/^EP/i,'')===unmatched.asset.replace(/^EP/i,''))&&!i.exactContract)holds.push({ref:i.ref,item:i.item,charge:'Hire allocation / existing coverage to confirm',reason:i.ref+' asset '+unmatched.asset+' has a card estimate but no exact source contract match. Check existing bulk hire coverage before adding any customer revenue; do not bill the same equipment twice.',source:{asset:unmatched.asset},amount:null});
  if(i.ref==='GN?'&&norm(i.item)==='200kva & cables')holds.push({ref:i.ref,item:i.item,charge:'Cable hire basis / period to confirm',reason:'Concert cables: 2 sets of 5. Baseplan 9961976 line 46 quotes 115.14 and 104.03 with an unresolved charging period. Line 47 is the 10 included cable components, not another charge. Generator hire remains separate.',source:{contract:'9961976',line:46,quantity:2,contents:10,includedChild:47,rate1:115.14,rate2:104.03,rateType:'W'},amount:null});
  if(i.ref==='T0109'&&(i.physicalNumbers||[]).includes('1281615'))holds.push({ref:i.ref,item:i.item,charge:'Forklift type / dates / branch to reconcile',reason:'Asset 1281615 is recorded on site as 2.5T Forklift STD, NVAC, arrived 28 September. New Baseplan 9987005 line 7 says rough-terrain, MEAD, 13–27 October at 185.40. Keep site facts; confirm the correct contract before replacing the current card estimate or adding hire.',source:{contract:'9987005',line:7,asset:'1281615',rate:185.4,from:'2026-10-13',to:'2026-10-27',branch:'MEAD'},amount:null});
 }return holds;}
 const api={price,pee,quantity,referenceBranch,owner,sourceRows,allocation,periods,reviewHolds,validate,hireKey,supplierFloor,cents};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.Pricing1010=api;
})(typeof window!=='undefined'?window:null);

if(typeof window!=='undefined'){
 const oldCard1010=cardRate,oldRate1010=rateFor,oldCharge1010=contractCharge,oldItemProject1010=ItemCharges979.project;
 function scope1010(){const a=assetOf('WC09'),l=a&&chargeLines(a).find(r=>r.item==='FWF');return a&&l?{quantity:qtyOf(l),cancelled:!!(a._cancelled||a.rest_of)}:null;}
 window.contractQuantity1010=r=>r&&String(r.rental_contract)==='9968955'&&Number(r.line)===102?Pricing1010.quantity(r,scope1010()):null;
 window.contractBillingQuantity1010=r=>contractQuantity1010(r)?.billableQuantity??r.quantity;
 const sourceOwner1010=finance928ContractOwner;finance928ContractOwner=function(r){if(String(r?.register_type).trim().toLowerCase()==='fwf'&&!r.charge_line&&!r.asset_no_is_plant_number){const decision=currentFwfOwners1010().get(r.rental_contract+'|'+r.line);if(decision)return decision;}return sourceOwner1010.apply(this,arguments);};
 window.validatePeeRate1010=input=>Pricing1010.validate(input);
 window.contractAllocation1010=function(r){if(!r||String(r.rental_contract)!=='9968862'||![108,110].includes(Number(r.line)))return null;
  const ref={108:'P67',110:'P65'}[r.line],a=assetOf(ref),l=a&&chargeLines(a).find(l=>l.item===r.register_type),current=a&&l?{quantity:qtyOf(l),arrived:receivedChargeQty1006(a,l),cancelled:!!(a._cancelled||a.rest_of),physicalNumbers:gcModel925(a).rows.filter(u=>u.physical&&u.item===l.item).map(u=>String(u.assetNo||''))}:null;
  const source=r.allocationConfirmed1010?ONHIRE_ROWS.find(x=>String(x.rental_contract)===String(r.rental_contract)&&Number(x.line)===Number(r.line))||r:r;
  const result=Pricing1010.allocation(source,ONHIRE_ROWS,current),b=branchOf(ref);return result&&['local','committed'].includes(b?.where)&&b.code?{...result,branch:b.code,sourceBranch1010:result.branch}:result;
 };
 const sourceBranch1010=generatorBranch1004;
 window.contractReferenceBranches1010=function(){return heldMemo('contractReferenceBranches1010',()=>{
  const by=new Map();for(const a of allAssets()){if(a._cancelled||a.rest_of||movedAway(a.key))continue;const b=branchOf(a.key),units=gcModel925(a).rows;
   for(const l of chargeLines(a))for(const r of ItemIdentity979.select(a.key,l.item,ONHIRE_ROWS,units)){const key=r.rental_contract+'|'+r.line,list=by.get(key)||[];list.push({ref:a.key,item:l.item,quantity:qtyOf(l),branch:b.code,where:b.where});by.set(key,list);}
  }return by;
 });};
 window.currentFwfOwners1010=function(){return heldMemo('currentFwfOwners1010',()=>{const groups=new Map(),out=new Map();for(const [id,matches]of contractReferenceBranches1010()){if(new Set(matches.map(m=>m.ref)).size!==1||matches[0].item!=='FWF')continue;const ref=matches[0].ref,r=ONHIRE_ROWS.find(r=>r.rental_contract+'|'+r.line===id),list=groups.get(ref)||[];if(r){list.push(r);groups.set(ref,list);}}
  for(const [ref,rows]of groups){const a=assetOf(ref),l=chargeLines(a).find(l=>l.item==='FWF'),decision=Pricing1010.owner(rows,{ref,quantity:qtyOf(l),arrived:receivedChargeQty1006(a,l)},gcModel925(a).rows);if(decision)for(const r of rows)out.set(r.rental_contract+'|'+r.line,decision);}return out;
 });};
 generatorBranch1004=function(r){const original=sourceBranch1010(r);if(generatorContract1004(r))return original;const allocation=contractAllocation1010(r);if(allocation)return allocation.branch;return Pricing1010.referenceBranch(r,contractReferenceBranches1010().get(r.rental_contract+'|'+r.line),contractQuantity1010(r)?.billableQuantity)||original;};
 window.rehireBranches1010=function(groups){const out={};const put=branch=>out[branch]=out[branch]||{branch,groups:0,revJob:0,costJob:0,costMissing:0,forecastMissing:0};
  for(const g of groups){const allocation=new Map(),add=(branch,amount)=>{if(Number.isFinite(amount)&&amount)allocation.set(branch||'no branch',Pricing1010.cents((allocation.get(branch||'no branch')||0)+amount));};let assigned=0;
   for(const key of g.revenueLines1010||[]){const r=ONHIRE_ROWS.find(r=>r.rental_contract+'|'+r.line===key);if(!r)continue;const ch=contractCharge(r),amount=Pricing1010.cents((ch.amount||0)+(ch.generator1004?ch.remaining||0:0));add(generatorBranch1004(r),amount);assigned=Pricing1010.cents(assigned+amount);}
   const pee=g.uncontractedHire979;if(pee){add(pee.branch,pee.amount);assigned=Pricing1010.cents(assigned+pee.amount);}
   for(const r of g.sourceHire996?.rows||[]){add(r.branch,r.amount);assigned=Pricing1010.cents(assigned+r.amount);}
   add(g.branch,Pricing1010.cents((g.revJob||0)-assigned));g.revenueBranches1010=[...allocation].map(([branch,amount])=>({branch,amount}));
   const costBranch=g.costEvidence949?.costBranch||(g.what==='Toilets — Event Portables'?pl760ToiletBranch():g.branch);g.costBranch1010=costBranch;const own=put(costBranch);own.groups++;own.costJob=Pricing1010.cents(own.costJob+(g.costJob||0));if(g.cost==null)own.costMissing++;if(g.costJob==null)own.forecastMissing++;
   for(const part of g.revenueBranches1010){const b=put(part.branch);b.revJob=Pricing1010.cents(b.revJob+part.amount);}
  }return out;
 };
 const previousSupplierBranch1010=supplierBranchWords961;supplierBranchWords961=function(g){const parts=g.revenueBranches1010||[];if(!parts.some(p=>p.branch!==g.branch))return previousSupplierBranch1010(g);const cost=g.costEvidence949?.costBranch||(g.what==='Toilets — Event Portables'?pl760ToiletBranch():null);return 'Revenue '+parts.map(p=>p.branch+' '+money(p.amount)).join(' · ')+'. '+(cost?'Direct cost branch '+cost+' is unchanged.':'Supplier Direct cost allocation is unchanged.');};
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
 window.pricingReviewHolds1010=function(){return Pricing1010.reviewHolds(['GN?','T0109','AA','WC42','WC81'].flatMap(ref=>{const a=assetOf(ref);if(!a||a._cancelled||a.rest_of)return [];const current=gcModel925(a).rows;return chargeLines(a).map(l=>({ref,item:l.item,arrived:receivedChargeQty1006(a,l),physicalNumbers:current.filter(u=>u.physical&&u.item===l.item).map(u=>String(u.assetNo||'')),exactContract:ItemIdentity979.select(ref,l.item,ONHIRE_ROWS,current).length>0}));}));};
 if(typeof OnsiteComplete979!=='undefined'){const previous=OnsiteComplete979.project;OnsiteComplete979.project=function(items,transport){const result=previous(Pricing1010.periods(items,ONHIRE_ROWS),transport);for(const hold of pricingReviewHolds1010()){const row=result.rows.find(r=>r.ref===hold.ref&&r.item===hold.item);if(!row||row.pending.includes(hold.charge))continue;row.pending.push(hold.charge);result.holds.push(hold);const branch=result.byBranch.find(b=>b.branch===row.branch);if(branch)branch.holds++;}if(result.holds.length){result.complete=false;result.total=null;}return result;};}
 window.peePrice1010=function(){
  const a=assetOf('WC09'),key='Toilets & amenities|Pee Panel',weeklyOverride=S.rates?.[key],typedMin=S.minDays?.[key];
  let min=oldCard1010('Toilets & amenities','Pee Panel','WC09')?.minimum_hire;
  if(typedMin!=null&&String(typedMin).trim()!==''){const n=Number(typedMin);min=Number.isFinite(n)&&n>=0&&n<=MAX_MIN_DAYS?{days:n}:{invalid:true};}
  const weeklyDays=a?chargedDays(chargeSpanOf(a),min).days:null;
  const p=Pricing1010.price({source:PeeHire979.source,fullOverride:S.lineRates?.[Pricing1010.hireKey],weeklyOverride,weeklyDays}),l=a&&chargeLines(a).find(r=>r.item==='Pee Panel'),quantity=l?qtyOf(l):0,arrived=l?receivedChargeQty1006(a,l):0;
  return {...p,branch:branchOf('WC09').code||'no branch',quantity,arrivedQuantity:arrived,amount:Number.isFinite(quantity)?Pricing1010.cents(p.fullHireRate*quantity):null,actualAmount:Number.isFinite(arrived)?Pricing1010.cents(p.fullHireRate*arrived):null,floor:p.supplierFloor};
 };
 PeeHire979.forecast=(items,contracts)=>Pricing1010.pee(items,contracts,PeeHire979.source,peePrice1010());
 cardRate=function(disc,item,key){const card=oldCard1010.apply(this,arguments);if(disc!=='Toilets & amenities'||String(item).trim().toLowerCase()!=='pee panel')return card;const p=peePrice1010();return {...card,kind:'flat',rate:p.fullHireRate,hire_rate:p.fullHireRate,source:p.overridden?'typed':'card',basis:p.basis,why:'Full hire per individual pee panel from the original card, or its recorded override. Quantity is applied once.',pricing1010:p};};
 rateFor=function(disc,item,key){if(disc!=='Toilets & amenities'||String(item).trim().toLowerCase()!=='pee panel')return oldRate1010.apply(this,arguments);const card=cardRate(disc,item,key);return {value:card.rate,per:'flat',source:card.source,card};};
}
