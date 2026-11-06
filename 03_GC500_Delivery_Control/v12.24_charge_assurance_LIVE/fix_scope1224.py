"""Author: Andrew Fisher. Respect existing charge decisions in shared forecasts."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def apply(html):
    if 'source-scope1224' in html:
        raise SystemExit('v12.24 scope fixes are already present')
    path = 'GC500 page'
    html = rep(html, """function project(inputs,contracts,readCharge,card){
 const rows=[],issues=[];
 const claims=new Map();
 for(const input of inputs){const key=input.resolution.state==='active'&&input.resolution.key;if(key){if(!claims.has(key))claims.set(key,new Set());claims.get(key).add(input.request.id);}}
 for(const input of inputs){""", """function project(inputs,contracts,readCharge,card,exclude){
 // source-scope1224: the existing exclusion decision governs this forecast too.
 const rows=[],issues=[],excluded=[];
 const chargeable=(inputs||[]).filter(input=>{const ref=input.resolution.key||input.request.id,reason=typeof exclude==='function'?exclude(ref):null;if(!reason)return true;excluded.push({request:input.request.id,ref,reason});return false;});
 const claims=new Map();
 for(const input of chargeable){const key=input.resolution.state==='active'&&input.resolution.key;if(key){if(!claims.has(key))claims.set(key,new Set());claims.get(key).add(input.request.id);}}
 for(const input of chargeable){""", 'Source-request forecast scope', path)
    html = rep(html,
        "return {rows,issues,amount:cents(rows.reduce((n,r)=>n+r.amount,0)),supplierCostAdditional:0};",
        "return {rows,issues,excluded,amount:cents(rows.reduce((n,r)=>n+r.amount,0)),supplierCostAdditional:0};",
        'Retain source exclusions for audit', path)
    html = rep(html,
        "function model(){return heldMemo('financeRequest996',()=>project(inputs(),ONHIRE_ROWS,contractCharge,cardRate('Toilets & amenities','FWF')));}",
        "function model(){return heldMemo('financeRequest996',()=>project(inputs(),ONHIRE_ROWS,contractCharge,cardRate('Toilets & amenities','FWF'),ref=>typeof NotChargedHere1152==='undefined'?null:NotChargedHere1152.why(ref)));}",
        'Use existing source exclusion authority', path)
    html = rep(html, """   const arrived=input.actualIsConfirmed===true&&(!partial||delivery?.actualIsConfirmed===true);
   const explicitDate=input.deliverySource==='Recorded hire start';""", """   const arrived=input.actualIsConfirmed===true&&(!partial||delivery?.actualIsConfirmed===true);
   // generator-scope1224: use the existing decision, never a second exclusion list.
   // A confirmed receipt is the same native evidence used below to price arrived hire.
   // It satisfies a conditional no-charge-unless-called-off decision even if the source still says Pending.
   const decision=r&&typeof env.treatment==='function'?env.treatment(r):null;
   const treatment=decision&&(decision.kind!=='pending_no_charge'||!arrived)?decision:null;
   if(treatment){
    const ledger=r&&env.rehire(r)?'1010':'1005',basis=treatment.basis||treatment.label,common={actual:0,remaining:0,forecast:0,treatment:treatment.kind,approved_by:treatment.approved_by,approved_on:treatment.approved_on,basis};
    output.push({...input,...common,id:input.id+(sourceRows.length>1?':'+key(r):''),qty:slice.qty,assetNumbers:sourceRows.length===1?list(input.assetNumbers):list(input.assetNumbers).filter(n=>String(n)===String(r.asset_no)),displayRef:input.refLabel||input.displayRef||input.ref||'Generator',deliveredDate:arrived?(delivery?.deliveredDate||input.deliveredDate):null,dailyRate:null,standdownRate:null,rateSource:basis,standdownDays:0,eventDays:0,equivalentDays:0,standdownCharge:0,raceCharge:0,standdownActual:0,standdownRemaining:0,actualIsConfirmed:arrived,status:treatment.label||'Not charged',issues:[],contractLines:['Contract '+r.rental_contract+' · line '+r.line],contractIds:[key(r)],ledger,invoiceMonth});
    contracts.set(key(r),{...common,amount:0,how:treatment.label||'Not charged',days:0,daily:false,generator1004:true,from:null,to:offhire,standdownDays:0,eventDays:0,dailyRate:null,standdownRate:null,rateSource:basis,ledger,branch:input.branch,ref:input.ref,arrived,issues:[]});
    continue;
   }
   const explicitDate=input.deliverySource==='Recorded hire start';""", 'Apply generator charge treatment before forecasting', path)
    html = rep(html,
        "const k=JSON.stringify([r.ref,r.item,r.branch,r.dailyRate,r.standdownRate,r.deliveredDate,r.plannedDate,r.actualIsConfirmed,r.ledger,r.issues]);",
        "const k=JSON.stringify([r.ref,r.item,r.branch,r.dailyRate,r.standdownRate,r.deliveredDate,r.plannedDate,r.actualIsConfirmed,r.ledger,r.issues,r.treatment||null]);",
        'Keep different generator treatments separate', path)
    html = rep(html, """function generatorModel1004(){return heldMemo('generatorModel1004',()=>holdAssets(()=>GeneratorFinance1004.project(generatorInputs1004(),{
 lineRate:lr748Typed,""", """function generatorModel1004(){return heldMemo('generatorModel1004',()=>holdAssets(()=>GeneratorFinance1004.project(generatorInputs1004(),{
 treatment:r=>typeof contractTreatment747==='function'?contractTreatment747(r):null,
 lineRate:lr748Typed,""", 'Connect canonical generator treatment', path)
    return html
