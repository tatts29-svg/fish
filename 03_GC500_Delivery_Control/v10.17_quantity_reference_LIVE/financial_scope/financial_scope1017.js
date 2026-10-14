/* Author: Andrew Fisher. A planned scope edit does not create an arrival or change the supplier of existing units. */
(function(root){
'use strict';
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
const key=r=>String(r.rental_contract)+'|'+r.line;
const originalCharge=contractCharge,originalQuantity=contractBillingQuantity1010,originalOwner=finance928ContractOwner;
function inputs(){return heldMemo('scopeFinancialInputs1017',()=>{
 const by=new Map(),claims=new Map();
 for(const a of allAssets()){
  const saved=Scope1017.record(a);if(!saved||a._cancelled||a.rest_of||movedAway(a.key))continue;
  const units=gcModel925(a).rows;
  for(const l of chargeLines(a)){
   const old=saved.items.find(x=>x.item===l.item),current=Scope1017.read(a,l.item,deliveryOf(a.key),todayIso());
   // Only an explicit quantity revision can extend this
   // known contract basis. Ambiguous source allocations retain existing holds.
   if(!old||!current||!(old.received>=0)||!(old.quantity>0)||current.quantity===old.quantity)continue;
   const rows=ItemIdentity979.select(a.key,l.item,ONHIRE_ROWS,units);
   if(rows.length!==1)continue;
   const r=rows[0],matches=contractReferenceBranches1010().get(key(r))||[];
   if(new Set(matches.map(m=>m.ref+'|'+m.item)).size!==1||matches[0]?.ref!==a.key||matches[0]?.item!==l.item)continue;
   if(r.charge_line||r.kind==='generator'||r.family==='generator'||contractAllocation1010(r)||CONTRACT_DAILY_KINDS.has(r.kind))continue;
   const actual=originalCharge({...r,quantity:current.arrived}),forecast=originalCharge({...r,quantity:current.quantity}),unit=originalCharge({...r,quantity:1});
   if(typeof actual.amount!=='number'||!Number.isFinite(forecast.amount)||!Number.isFinite(unit.amount)||unit.treatment||!(r.quantity>0))continue;
   const id=key(r);claims.set(id,(claims.get(id)||0)+1);
   by.set(id,{ref:a.key,item:l.item,old,current,row:r,units:units.filter(u=>u.physical&&u.source!=='history'&&u.item===l.item),actual:{...actual,amount:current.arrived===0?0:actual.amount},forecast:forecast.amount,rate:typeof r.rate_1==='number'?r.rate_1:lr748For(r)?.rate??unit.amount});
  }
 }
 for(const [id,n]of claims)if(n!==1)by.delete(id);
 return by;
});}
function input(r){return r&&!r.charge_line?inputs().get(key(r)):null;}
function owner(r){
 const p=input(r),baseline=p?.old.financial1017;
 if(p&&p.item==='FWF'&&baseline?.contract===key(r)&&baseline.owner){
  // A later explicit supplier always wins; snapshots retain existing confirmed
  // ownership, never infer an entire received group from one identified unit.
  if(Ownership944.named(String(r.supplier_sub_rental||'').trim())&&(r.subhired||r.subhired_machine))return originalOwner.apply(this,arguments);
  const numbers=p.units.map(u=>String(u.assetNo||'').trim()),owners=[...new Set(p.units.map(u=>u.owner))];
  if(numbers.length>=baseline.identified&&numbers.length<=p.current.arrived&&numbers.every(Boolean)&&new Set(numbers).size===numbers.length&&owners.length===1&&owners[0]===baseline.owner)return {owner:baseline.owner,rehire:baseline.rehire,ref:p.ref,basis:'Confirmed pre-edit supplier retained across the planned quantity change'};
 }
 return originalOwner.apply(this,arguments);
}
finance928ContractOwner=owner;
contractBillingQuantity1010=function(r){return input(r)?.current.arrived??originalQuantity.apply(this,arguments);};
contractCharge=function(r){
 const p=input(r);if(!p)return originalCharge.apply(this,arguments);
 const forecast=p.forecast,remaining=cents(Math.max(0,forecast-p.actual.amount));
 return {...p.actual,actual:p.actual.amount,remaining,forecast,billableQuantity1010:p.current.arrived,plannedQuantity1017:p.current.quantity,scope1017:true,
  basis:p.actual.basis+' · '+p.current.arrived+' received; '+Math.max(0,p.current.quantity-p.current.arrived)+' remaining units are forecast only.'};
};
function model(){return heldMemo('scopeHireForecast1017',()=>{
 const rows=[];for(const p of inputs().values()){
  const quantity=Math.max(0,p.current.quantity-p.current.arrived);if(!quantity)continue;
  const own=owner(p.row),branch=generatorBranch1004(p.row)||branchOf(p.ref)?.code||'no branch';
  rows.push({ref:p.ref,item:p.item,branch,contract:p.row.rental_contract,line:p.row.line,quantity,arrivedQuantity:p.current.arrived,rate:p.rate,amount:cents(Math.max(0,p.forecast-p.actual.amount)),ledger:own.rehire?'1010':'1005',owner:own.owner,scope1017:true,reason:'Unreceived planned quantity at the existing contract rate; no additional supplier cost or physical arrival.'});
 }
 const sum=rs=>cents(rs.reduce((n,r)=>n+r.amount,0));
 return {rows,total:sum(rows),hireTotal:sum(rows.filter(r=>r.ledger==='1005')),rehireTotal:sum(rows.filter(r=>r.ledger==='1010'))};
});}
const previousForecast=pricingForecast1010;
pricingForecast1010=function(){const before=previousForecast.apply(this,arguments),added=model();if(!added.rows.length)return before;return {...before,rows:before.rows.concat(added.rows),total:cents(before.total+added.total),hireTotal:cents(before.total+added.hireTotal),rehireTotal:added.rehireTotal,scope1017:added};};
const originalCapture=Scope1017.capture;
Scope1017.capture=function(a){
 const saved=originalCapture.apply(this,arguments);if(!saved)return saved;
 const units=gcModel925(a).rows;
 for(const item of saved.items){
  const contracts=ItemIdentity979.select(a.key,item.item,ONHIRE_ROWS,units);if(contracts.length!==1)continue;
  const r=contracts[0],prior=Scope1017.record(a)?.items.find(x=>x.item===item.item)?.financial1017;
  const actualOwner=owner(r),physical=units.filter(u=>u.physical&&u.source!=='history'&&u.item===item.item);
  item.financial1017=prior?.contract===key(r)&&actualOwner.owner===prior.owner?{...prior}:{contract:key(r),owner:actualOwner.owner,rehire:!!actualOwner.rehire,identified:physical.length};
  const line=chargeLines(a).find(l=>l.item===item.item),steps=line&&charge1006(a,line).rows.find(r=>r.key==='steps');
  item.financial1017.steps=steps?.qty??0;
 }
 return saved;
};
const previousItemProject=ItemCharges979.project;
ItemCharges979.project=function(ref,item,contracts,readCharge,workCard,costEvidence){
 const result=previousItemProject.apply(this,arguments);return {...result,lines:result.lines.map(line=>{
  const r=(contracts||[]).find(r=>key(r)===String(line.contract)+'|'+line.line),p=r&&input(r);
  return p?{...line,quantity:p.current.arrived,plannedQuantity1017:p.current.quantity}:line;
 })};
};
function recorded(a,l,amounts){
 const saved=Scope1017.record(a),old=saved?.items.find(x=>x.item===l.item),current=Scope1017.read(a,l.item,deliveryOf(a.key),todayIso());
 if(!old||!current)return amounts;
 const out={...amounts};for(const name of ['install','levelling','demob','cleaning','steps']){
  if(!Number.isFinite(out[name]))continue;
  const stamp=(S.stamps||{})['labour/'+a.key+'|'+l.discipline+'|'+l.item+'|'+name];
  const renewed=stamp&&Date.parse(stamp)>=Date.parse(saved.at);
  const cap=name==='steps'&&!renewed?Math.min(old.financial1017?.steps??old.received,current.arrived):current.arrived;
  out[name]=Math.min(out[name],cap);
 }
 return out;
}
root.ScopeFinance1017={inputs,model,recorded};
})(window);
