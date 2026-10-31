/* Author: Andrew Fisher. Existing customer hire classified by confirmed receipt; unknown work is never free. */
(function(root){'use strict';
 const cents=n=>Math.round((n+Number.EPSILON)*100)/100,norm=v=>String(v||'').trim().toLowerCase();
 function pee(items,contracts,source){
  const empty=state=>({amount:0,actualAmount:0,remainingAmount:0,quantity:0,arrivedQuantity:0,state,source});
  const rows=(items||[]).filter(r=>r.ref==='WC09'&&norm(r.item)==='pee panel');
  if(rows.length!==1||rows[0].quantity!==6||!Number.isFinite(rows[0].arrived)||rows[0].arrived<0||rows[0].arrived>6)return empty('scope changed');
  // Retain the existing coverage guard: a new contract must be allocated before any fallback is used.
  if((contracts||[]).some(r=>!r.charge_line&&/\bpee\s*panels?\b/i.test(r.description||r.register_type||'')))return empty('contract coverage needs allocation');
  const quantity=6,arrivedQuantity=rows[0].arrived,amount=cents(quantity*source.hire),actualAmount=cents(arrivedQuantity*source.hire);
  return {id:'hire979|WC09|Pee Panel',ref:'WC09',item:'Pee Panel',branch:'KINP',quantity,arrivedQuantity,rate:source.hire,amount,actualAmount,remainingAmount:cents(amount-actualAmount),state:arrivedQuantity===quantity?'actual':arrivedQuantity>0?'part arrived':'forecast',ledger:'1010',supplierCostAdditional:0,source,basis:'Street Rate Card 2026 D22 whole-event hire, once per pee panel. Confirmed received quantity is actual; the remainder is forecast. Existing approved supplier hire cost is unchanged.'};
 }
 function workGap(input){
  const i=input||{},item=norm(i.item);if(!(i.received>0)||i.ownUse)return null;
  // These families were source-reviewed. Absence of a work mapping is not a zero rate.
  const family=item==='fwf trailer'?'trailer':/^(?:3\.0m cont|event container)$/.test(item)?'container':item==='tl2'?'barrier':null;
  if(!family)return null;
  const work=i.card?.labour_per_piece||{},lines=work.lines||[],keys=new Set(['install','levelling','cleaning','demob']);
  const relevant=lines.filter(l=>keys.has(l.key));
  const supplied=relevant.some(l=>l.money==='rate'&&Number.isFinite(l.rate)||l.money==='zero'||l.money==='included');
  if(supplied||/\bincluded\b/i.test(work.state||''))return null;
  const why=family==='barrier'?'Applicable installation / removal scope and rate need confirmation; the source card lists Armorzone labour as POA. No labour amount has been assumed.':'No matching work-rate line. Confirm applicable install, level, clean and demob charges or included services. Hire is recorded separately.';
  return {ref:i.ref,item:i.item,branch:i.branch||'no branch',quantity:i.received,key:'work_scope1007',name:'Work scope / rate to confirm',state:'unpriced',rate:null,value:null,why,source:family==='barrier'?'Street Rate Card 2026 B90 · Labour POA':'2026 rate-card mapping: no matching work line'};
 }
 const api={pee,workGap,cents};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.Finance1007=api;
})(typeof window!=='undefined'?window:null);

if(typeof window!=='undefined'){
 PeeHire979.forecast=(items,contracts)=>Finance1007.pee(items,contracts,PeeHire979.source);
 window.workGap1007=function(a,l){
  if(!a||!l||a._cancelled||a.rest_of||movedAway(a.key))return null;
  const received=receivedChargeQty1006(a,l);if(!(received>0))return null;
  if(!/^(?:FWF Trailer|3\.0m Cont|Event Container|TL2)$/i.test(String(l.item||'')))return null;
  const selected=ItemIdentity979.select(a.key,l.item,ONHIRE_ROWS,gcModel925(a).rows),ownUse=selected.length>0&&selected.every(r=>contractCharge(r).treatment==='own_use');
  return Finance1007.workGap({ref:a.key,item:l.item,received,ownUse,branch:branchOf(a.key).code,card:cardRate(l.discipline,l.item,a.key)});
 };
 window.workPricing1007=function(){return heldMemo('workPricing1007',()=>holdAssets(()=>allAssets().flatMap(a=>chargeLines(a).map(l=>workGap1007(a,l)).filter(Boolean))));};
 const previousRows1007=arrivedChargeRows975;
 arrivedChargeRows975=function(a){return previousRows1007.apply(this,arguments).map(r=>{const l=chargeLines(a).find(l=>l.item===r.item),gap=workGap1007(a,l);return gap?{...r,charges:r.charges.concat([{...gap,qty:r.arrived,orderedQty:r.ordered,orderedValue:null,automaticCharge1006:false}]),total:null}:r;});};
 const previousBranches1007=pl752Rows;
 pl752Rows=function(){const rows=previousBranches1007.apply(this,arguments).map(r=>({...r})),p=peeHireForecast979();if(p.actualAmount>0){let b=rows.find(r=>r.code===p.branch);if(!b){b={code:p.branch,lines:0,contract:0,card:0,cardLines:0,none:0,decided:0,transport:0,rehire:0,subLines:0,suppliers:[],rehireLines:0,rehireUnits:0,rehireCharge:0,rehireCoatesNos:0,rehireUnrated:0,plantLines:0,plantCharge:0,plantUnrated:0,plantWhat:[],total:0};rows.push(b);}b.card=Finance1007.cents(b.card+p.actualAmount);b.total=Finance1007.cents(b.total+p.actualAmount);b.rehireCharge=Finance1007.cents(b.rehireCharge+p.actualAmount);b.uncontractedHire1007=p.actualAmount;}return rows.sort((a,b)=>b.total-a.total);};
}
