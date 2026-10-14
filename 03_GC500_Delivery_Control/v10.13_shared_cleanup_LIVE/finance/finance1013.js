/* Author: Andrew Fisher. Shared current-scope allocation. Embedded source history and native records remain intact; ONHIRE_ROWS is the effective source projection. */
(function(root){'use strict';
 const norm=v=>String(v||'').trim().toLowerCase(),key=r=>String(r.rental_contract)+'|'+r.line,cents=n=>Math.round((n+Number.EPSILON)*100)/100;
 const active=s=>s&&!s.cancelled&&!s.relocation&&s.quantity===1&&s.arrived===1;
 const numbers=s=>[...new Set((s.units||[]).filter(u=>u.physical&&norm(u.owner)==='coates'&&norm(u.item)===norm(s.item)).map(u=>String(u.assetNo||'').trim()).filter(Boolean))];
 const revisions=Object.freeze([
  {ref:'P65',item:'Building 6m',contract:'9968862',currentLine:110,retiredLine:98,asset:'1327217',retiredRef:'P47',sourceRow:70},
  {ref:'P66',item:'Building 6m',contract:'9968862',currentLine:113,retiredLine:82,asset:'1327222',retiredRef:'P53',sourceRow:72}
 ]);
 function replacements(rows,scopes,rules=revisions){
  const result=new Map();
  for(const rule of rules){
   const rr=(rows||[]).filter(r=>String(r.rental_contract)===rule.contract&&r.line===rule.retiredLine),cc=(rows||[]).filter(r=>String(r.rental_contract)===rule.contract&&r.line===rule.currentLine),ss=(scopes||[]).filter(s=>s.ref===rule.ref&&norm(s.item)===norm(rule.item));
   if(rr.length!==1||cc.length!==1||ss.length!==1||!active(ss[0]))continue;
   const retired=rr[0],current=cc[0],scope=ss[0],ns=numbers(scope);
   if(ns.length!==1||ns[0]!==rule.asset||(scopes||[]).some(s=>s.ref===rule.retiredRef&&!s.cancelled))continue;
   if((scopes||[]).filter(s=>!s.cancelled&&numbers(s).includes(rule.asset)).length!==1)continue;
   if([retired,current].some(r=>r.kind!=='building'||r.charge_line||r.quantity!==1||norm(r.register_type)!==norm(rule.item)||!Number.isFinite(r.rate_1)||r.rate_1<0))continue;
   if(!retired.asset_no_is_plant_number||String(retired.asset_no)!==rule.asset||!String(retired.description).startsWith(rule.retiredRef+' ')||!String(current.description).startsWith(rule.ref+' '))continue;
   if(retired.start_date||current.start_date||![retired,current].every(r=>['pending','del req'].includes(norm(r.status_as_written))))continue;
   const reason=rule.ref+' · confirmed asset '+rule.asset+' · current Baseplan contract '+rule.contract+' line '+rule.currentLine+'. Older line '+rule.retiredLine+' for cancelled '+rule.retiredRef+' is absent from Baseplan SuperCars (2); one current building hire retained.';
   const common={ref:rule.ref,item:rule.item,contract:rule.contract,branch:scope.branch||current.branch_code,remainingAmount:0,currentAssetNumber:rule.asset,reason,source1013:{workbook:'Baseplan SuperCars (2)',sheet:rule.contract+'-KINP',row:rule.sourceRow,retiredLine:rule.retiredLine}};
   result.set(key(retired),{...common,line:retired.line,state:'duplicate-removed',sourceAmount:cents(retired.rate_1),actualAmount:0,replacement:current.line});
   result.set(key(current),{...common,line:current.line,state:'current-scope-confirmed',sourceAmount:cents(current.rate_1),actualAmount:cents(current.rate_1),sourceAssetNumber:current.asset_no});
  }
  return result;
 }
 const bindings=Object.freeze([{ref:'T0266',item:'6.0m Refrigerator Cont',contract:'9974042',line:2,asset:'920584',owner:'other:united-rentals-royal-wolf',source:{quantity:1,branch_code:'KINP',item:'SUB-2131',register_type:'Event Container',description:'Container - Refrigerated 6.0M x 2.4M',supplier_sub_rental:'ROY002',asset_no_is_plant_number:false},evidence:'Baseplan SuperCars (2), 9974042-KINP row3 and supplier B12; site identity confirmed 14 Oct 2026'}]);
 function links(rows,scopes){return bindings.flatMap(b=>{
  const rs=(rows||[]).filter(r=>String(r.rental_contract)===b.contract&&Number(r.line)===b.line&&!r.charge_line),ss=(scopes||[]).filter(s=>s.ref===b.ref&&norm(s.item)===norm(b.item));
  if(rs.length!==1||ss.length!==1||!active(ss[0])||!Object.keys(b.source).every(k=>rs[0][k]===b.source[k]))return [];
  const us=(ss[0].units||[]).filter(u=>u.physical&&norm(u.item)===norm(b.item));if(us.length!==1||String(us[0].assetNo)!==b.asset||us[0].owner!==b.owner)return [];
  if((scopes||[]).filter(s=>!s.cancelled&&(s.units||[]).some(u=>u.physical&&String(u.assetNo)===b.asset&&u.owner===b.owner)).length!==1)return [];
  return [{...b,row:rs[0],scope:ss[0]}];
 });}
 function fridgeSupplement(scope,rows,selected,price){
  const allowed=new Set(['1318501','1260164','1283996','1311992']),empty=state=>({ref:'T0265',item:'Fridge',branch:scope?.branch||null,quantity:0,arrivedQuantity:0,amount:0,actualAmount:0,remainingAmount:0,state});
  if(!scope||scope.cancelled||scope.relocation||scope.ref!=='T0265'||scope.item!=='Fridge'||!Number.isInteger(scope.quantity)||scope.quantity<1||scope.quantity>allowed.size)return empty('scope needs review');
  if(!scope.branch||norm(scope.branch)==='no branch')return empty('costing branch needs review');
  const us=(scope.units||[]).filter(u=>u.physical),ns=us.map(u=>String(u.assetNo||''));
  if(us.length!==scope.quantity||new Set(ns).size!==us.length||us.some(u=>norm(u.owner)!=='coates'||norm(u.item)!=='fridge'||!allowed.has(String(u.assetNo))))return empty('identity needs review');
  const fridge=r=>/fridge|refrigerator/i.test(String(r.register_type||'')+' '+String(r.description||''))&&!/container|refrigerated/i.test(String(r.description||''));
  const own=new Set((selected||[]).map(key)),uncertain=(rows||[]).filter(r=>!r.charge_line&&fridge(r)&&!own.has(key(r))&&!r.asset_no_is_plant_number&&!/^([A-Z]+\d+)\b/i.test(String(r.description||'')));
  if(uncertain.length)return empty('existing fridge coverage needs allocation');
  if((selected||[]).some(r=>!Number.isInteger(r.quantity)||r.quantity<1))return empty('contract quantity needs review');
  const covered=(selected||[]).reduce((n,r)=>n+r.quantity,0);if(covered>scope.quantity)return empty('overlapping contract coverage needs review');
  if(!Number.isFinite(price?.unit)||price.unit<0||!Number.isInteger(scope.arrived)||scope.arrived<0||scope.arrived>scope.quantity)return empty('rate or receipt needs review');
  const quantity=scope.quantity-covered,arrived=Math.max(0,scope.arrived-covered),amount=cents(quantity*price.unit),actualAmount=cents(arrived*price.unit);
  return {ref:scope.ref,item:scope.item,branch:scope.branch,quantity,arrivedQuantity:arrived,coveredQuantity:covered,rate:price.unit,amount,actualAmount,remainingAmount:cents(amount-actualAmount),state:quantity?'card estimate':'covered by source contract',basis:scope.ref+' · '+quantity+' uncovered fridges × current '+price.basis+'. Original Baseplan SuperCars (2) names other fridge scopes; no T0265/OP42 or bulk fridge line. Matched contract quantities replace this estimate once.'};
 }
 function sourceRows(rows){
  const source={file:'Baseplan SuperCars (2).xlsx',sha256:'3f103174c9cde2934f2de9f78189f1931a13d9bf277b12169e280b271d9daf96',sheet:'9968862-KINP'};
  const out=(rows||[]).map(r=>{const number=String(r.rental_contract)==='9968862'?{96:'1328959',102:'1328957'}[r.line]:null;if(!number||r.sourceIdentity1013||r.asset_no_is_plant_number||r.asset_no||r.quantity!==1||r.rate_1!==46.84||!/refrigerator/i.test(r.description||''))return r;
   return {...r,asset_no:number,item:number,asset_no_is_plant_number:true,sourceIdentity1013:{...source,previousAsset:r.asset_no,previousItem:r.item,previousNumbered:r.asset_no_is_plant_number,note:'Latest source supplies the physical number. Current placement comes from the recorded accessory identity.'}};
  });
  if(!out.some(r=>String(r.rental_contract)==='9968862'&&Number(r.line)===132)){
   const template=out.find(r=>String(r.rental_contract)==='9968862'&&r.line===96&&r.quantity===1&&r.rate_1===46.84&&r.register_type==='Fridge Lge');
   if(template)out.push({...template,line:132,item:'1272751',asset_no:'1272751',asset_no_is_plant_number:true,serial:'C524-160115071310030',description:'P46 Refrigerator',what:'P46 Refrigerator',status_as_written:'Pending',delivered:false,contract_start:'2026-09-14',start_date:null,booked_delivery_date:'2026-09-14',start_time:null,start_time_as_written:'07:00',delivery_number:null,return_number:null,expected_term_date:'2026-11-13',term_date:null,booked_pickup_date:'2026-11-13',demob_date:'2026-11-13',rate_1:46.84,rate_2:null,rate_3:null,rate_4:null,rate_5:null,number_of_days:7,minimum_days:0,rate_type:'W',rate_id:'128767',rate_classification:'no rates',price:0,sales_analysis_code:'KINP-HIR',billed_amount:null,billed_units:0,match:{state:'current physical identity',to:null,key:null,task_id:null,via:'asset number',basis:'Site confirms replacement1272751 at P46; current physical accessory placement is authoritative.'},sourceIdentity1013:{...source,row:84,note:'One additional source line132; no prebill imported.'}});
  }
  return out;
 }
 function includedTransport(card){return !!card?.transport&&norm(card.transport.cost)==='included'&&card.transport.charge==null&&/included/i.test(String(card.transport.state||''));}
 const api={replacements,revisions,links,bindings,fridgeSupplement,sourceRows,includedTransport,key,cents};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.Finance1013=api;
})(typeof window!=='undefined'?window:null);
if(typeof window!=='undefined'){
 // ONHIRE_ROWS is already a derived copy; DATA.rental_on_hire.rows / ONHIRE.rows stay unchanged.
 ONHIRE_ROWS.splice(0,ONHIRE_ROWS.length,...Finance1013.sourceRows(ONHIRE_ROWS));
 sharedCache975(); // Discard readers populated by the initial render before this projection loaded.
 window.financeScopes1013=function(){return holdAssets(()=>heldMemo('financeScopes1013',()=>allAssets().flatMap(a=>{
  if(a._cancelled||a.rest_of||movedAway(a.key))return [];
  const units=gcModel925(a,{loading:false}).rows;
  return chargeLines(a).map(l=>({ref:a.key,item:l.item,quantity:qtyOf(l),arrived:receivedChargeQty1006(a,l),cancelled:false,relocation:!!a.relocation,branch:branchOf(a.key)?.code,units:units.filter(u=>String(u.item).trim().toLowerCase()===String(l.item).trim().toLowerCase())}));
 })));};
 window.financeAllocations1013=function(){return holdAssets(()=>heldMemo('financeAllocations1013',()=>Finance1013.replacements(ONHIRE_ROWS,financeScopes1013())));};
 window.financeLinks1013=function(){return holdAssets(()=>heldMemo('financeLinks1013',()=>Finance1013.links(ONHIRE_ROWS,financeScopes1013())));};
 window.additionalHire1013=function(){return holdAssets(()=>heldMemo('additionalHire1013',()=>{
  const scope=financeScopes1013().find(s=>s.ref==='T0265'&&s.item==='Fridge'),a=scope&&assetOf(scope.ref),selected=scope?ItemIdentity979.select(scope.ref,scope.item,ONHIRE_ROWS,scope.units):[];
  const l=a&&assetTotal(a).lines.find(l=>l.item==='Fridge'),unit=l&&l.unit_resolved&&l.qty>0?lineMoney({value:l.rate,per:l.per},1,l.days):null;
  return Finance1013.fridgeSupplement(scope,ONHIRE_ROWS,selected,{unit,basis:l?.source==='typed'?'recorded hire rate':'Street Rate Card 2026 · Full Size Fridge flat rate'});
 }));};
 const previousAllocation1013=contractAllocation1010;
 contractAllocation1010=function(r){return financeAllocations1013().get(Finance1013.key(r))||previousAllocation1013.apply(this,arguments);};
 const previousIdentity1013=ItemIdentity979.select;
 ItemIdentity979.select=function(ref,item,rows,current){
  const candidates=item==='Fridge'?(rows||[]).map(r=>r.register_type==='Fridge Lge'?{...r,register_type:item}:r):rows;
  const allocations=financeAllocations1013(),selected=previousIdentity1013.call(this,ref,item,candidates,current).filter(r=>allocations.get(Finance1013.key(r))?.state!=='duplicate-removed');
  for(const decision of allocations.values())if(decision.ref===ref&&decision.item===item&&decision.state==='current-scope-confirmed'&&!selected.some(r=>Finance1013.key(r)===decision.contract+'|'+decision.line)){const source=(rows||[]).find(r=>Finance1013.key(r)===decision.contract+'|'+decision.line);if(source)selected.push({...source,asset_no:decision.currentAssetNumber,sourceAssetNumber1010:source.asset_no,match:{...source.match,key:ref},allocationConfirmed1010:true});}
  for(const link of financeLinks1013().filter(b=>b.ref===ref&&b.item===item))if(!selected.some(r=>Finance1013.key(r)===Finance1013.key(link.row)))selected.push({...link.row,register_type:item,match:{...link.row.match,key:ref,task_id:ref,to:'asset'},sourceLink1013:link.evidence});
  return selected;
 };
 const previousRate1013=rateFor;
 rateFor=function(disc,item,ref){const old=previousRate1013.apply(this,arguments);if(old.value!=null)return old;const link=financeLinks1013().find(b=>b.ref===ref&&b.item===item);if(!link)return old;const charge=contractCharge(link.row);return Number.isFinite(charge.amount)?{...old,value:charge.amount/link.row.quantity,per:'flat',source:'contract',sourceLink1013:link.evidence}:old;};
 const previousContainerKnown1013=transportContainerKnown977;
 transportContainerKnown977=function(a,rows){if(previousContainerKnown1013.apply(this,arguments))return true;return financeLinks1013().some(b=>b.ref===a?.key&&(rows||[]).some(r=>Finance1013.key(r)===Finance1013.key(b.row)));};
 const previousContainerOwners1013=transportContainerOwners977;
 transportContainerOwners977=function(hire,buildings){const old=previousContainerOwners1013.apply(this,arguments);if(old)return old;const link=financeLinks1013().find(b=>Finance1013.key(b.row)===Finance1013.key(hire));if(!link)return null;const owners=(buildings||[]).filter(b=>b.ref===link.ref&&b.item===link.item&&!b.exclusion&&b.quantity===1);if(owners.length!==1)return null;owners[0].contracts=[...new Set((owners[0].contracts||[]).concat(link.contract))];return owners;};
 const previousOtherTransport1013=otherTransportInput831;
 otherTransportInput831=function(){const model=previousOtherTransport1013.apply(this,arguments);for(const b of model.buildings||[]){const a=assetOf(b.ref);if(!a||a.discipline!=='Furniture'||b.exclusion)continue;const c=cardRate(a.discipline,b.item,a.key);if(!Finance1013.includedTransport(c))continue;b.included='Transport included on the current card';b.rateSource='Current '+CARD_WORD+' card · '+c.transport.line+' · Included';}return model;};
 const previousHolds1013=pricingReviewHolds1010;
 pricingReviewHolds1010=function(){const holds=previousHolds1013.apply(this,arguments);for(const link of financeLinks1013()){const rates=cardRate(assetOf(link.ref).discipline,link.item,link.ref).labour_per_piece?.lines||[];if(!rates.some(r=>['install','levelling','cleaning','demob'].includes(r.key)&&Number.isFinite(r.rate)))holds.push({ref:link.ref,item:link.item,charge:'Work scope / labour rates to confirm',reason:link.ref+' · existing hire and shared transport are allocated. No install, levelling, cleaning or demob price is supplied for this container; confirm which work applies and its agreed rate.',amount:null});}for(const s of financeScopes1013()){if(!(s.arrived>0)||s.item!=='Fridge')continue;const a=assetOf(s.ref);if(!a||a.discipline!=='Furniture'||(s.ref==='T0265'&&additionalHire1013().state==='card estimate')||ItemIdentity979.select(s.ref,s.item,ONHIRE_ROWS,s.units).length)continue;holds.push({ref:s.ref,item:s.item,charge:'Hire allocation / existing coverage to confirm',reason:s.ref+' · '+s.arrived+' received. The current card estimate is shown; confirm coverage in existing fridge contract lines before adding Revenue.',amount:null});}return holds;};
 const previousBranchRows1013=pl752Rows;
 pl752Rows=function(){return holdAssets(()=>{const rows=previousBranchRows1013.apply(this,arguments).map(r=>({...r})),p=additionalHire1013();if(p.actualAmount>0){let b=rows.find(r=>r.code===p.branch);if(!b){b={code:p.branch,lines:0,contract:0,card:0,cardLines:0,none:0,decided:0,transport:0,rehire:0,subLines:0,suppliers:[],rehireLines:0,rehireUnits:0,rehireCharge:0,rehireCoatesNos:0,rehireUnrated:0,plantLines:0,plantCharge:0,plantUnrated:0,plantWhat:[],total:0};rows.push(b);}b.card=Finance1013.cents(b.card+p.actualAmount);b.total=Finance1013.cents(b.total+p.actualAmount);b.uncontractedHire1013=p.actualAmount;}return rows.sort((a,b)=>b.total-a.total);});};
 const previousItemProject1013=ItemCharges979.project;
 ItemCharges979.project=function(ref,item,contracts,readCharge,workCard,costEvidence){const result=previousItemProject1013.apply(this,arguments);if(ref!=='T0265'||item!=='Fridge')return result;const p=additionalHire1013();if(!(p.amount>0))return result;const lines=result.lines.concat({id:'card1013|T0265|Fridge',contract:'Current card estimate',line:'T0265',description:'Full Size Fridge',quantity:p.quantity,amount:p.amount,basis:p.basis,source:'card'});return {...result,lines,amount:Finance1013.cents((result.amount||0)+p.amount)};};

}
