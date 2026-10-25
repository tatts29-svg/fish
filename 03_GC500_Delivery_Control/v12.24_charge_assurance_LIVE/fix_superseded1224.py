"""Author: Andrew Fisher. Retire one superseded reservation from shared forecasts."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def apply(html):
    if 'superseded-forecast1224' in html:
        raise SystemExit('v12.24 superseded forecast fix is already present')
    if 'generator-scope1224' not in html:
        raise SystemExit('v12.24 generator scope fix must be applied first')
    path = 'GC500 page'
    html = rep(html, """function project(inputs,env){
 const c=config(),{eventFrom,offhire,invoiceMonth}=c;""", """// superseded-forecast1224: this is one reservation transition, not general asset deduplication.
function superseded1224(r,input,inputs,env){
 if(!r||key(r)!=='9961976:13'||String(r.asset_no)!=='1283681'||r.asset_no_is_plant_number!==true||r.quantity!==1||r.branch_code!=='NVAC'||r.charge_line||!(r.kind==='generator'||r.family==='generator'))return null;
 if(r.status_as_written!=='Pending'||r.delivered!==false||r.start_date||r.term_date||r.return_number||r.swap_from_line)return null;
 if(typeof env.lineRate==='function'&&env.lineRate('c|'+r.rental_contract+'|'+r.line)!=null)return null;
 if(input.ref||input.cancelled||input.qty!==1||input.branch!=='NVAC'||input.actualIsConfirmed!==false||input.actualQuantity!==0||input.deliveredDate)return null;
 if(list(input.contractRows).length!==1||list(input.contractDeliveries).some(d=>d.actualIsConfirmed||d.deliveredDate))return null;
 const matches=list(inputs).filter(i=>i.ref==='GN10');
 if(matches.length!==1)return null;
 const current=matches[0],sources=list(current.contractRows),c=config();
 if(current.cancelled||current.asset?._cancelled||current.asset?._movedTo||current.qty!==1||current.actualQuantity!==1||current.actualIsConfirmed!==true||current.branch!=='NVAC'||kva(current.item)!==20||day(current.deliveredDate)==null)return null;
 if(sources.length!==1||key(sources[0])!=='9961976:15'||sources[0].quantity!==1||sources[0].branch_code!=='NVAC'||sources[0].charge_line||!(sources[0].kind==='generator'||sources[0].family==='generator'))return null;
 const source=sources[0],decision=typeof env.treatment==='function'?env.treatment(source):null;
 if(decision&&decision.kind!=='pending_no_charge')return null;
 const delivery=list(current.contractDeliveries).find(d=>d.id===key(source));
 const start=current.deliverySource==='Recorded hire start'?current.deliveredDate:delivery?.actualIsConfirmed&&delivery.deliveredDate?delivery.deliveredDate:current.deliveredDate;
 const price=rate(current,source,env),window=windowOf(start);
 if(!c.invoiceValid||!known(price.dailyRate)||!known(price.standdownRate)||!known(window.equivalentDays))return null;
 const physical=typeof env.unitRows==='function'?list(env.unitRows('GN10')).filter(u=>u.physical===true&&u.active!==false):[];
 if(physical.length!==1||physical[0].ref!=='GN10'||physical[0].owner!=='coates'||String(physical[0].assetNo)!=='1283681'||!physical[0].id||physical[0].identityReview)return null;
 return {kind:'superseded_forecast',label:'Superseded reservation — not charged twice',basis:'Pending reservation is covered by the confirmed physical unit at GN10 and contract 9961976 line 15; its recorded hire remains unchanged'};
}
function project(inputs,env){
 const c=config(),{eventFrom,offhire,invoiceMonth}=c;""", 'Guard one superseded generator reservation', path)
    html = rep(html,
        "const decision=r&&typeof env.treatment==='function'?env.treatment(r):null;",
        "const decision=(r&&typeof env.treatment==='function'?env.treatment(r):null)||superseded1224(r,input,inputs,env);",
        'Use superseded reservation treatment in the shared projection', path)
    html = rep(html,
        'cardRates,windowOf,rate,project,key,cents};root.GeneratorFinance1004=api;',
        'cardRates,windowOf,rate,project,key,cents,superseded1224};root.GeneratorFinance1004=api;',
        'Expose pure reservation guard for regression checks', path)
    html = rep(html, """ treatment:r=>typeof contractTreatment747==='function'?contractTreatment747(r):null,
 lineRate:lr748Typed,""", """ treatment:r=>typeof contractTreatment747==='function'?contractTreatment747(r):null,
 unitRows:ref=>{const a=assetOf(ref);return a&&!a._cancelled&&!a._movedTo&&typeof gcModel925==='function'?gcModel925(a,{loading:false}).rows:[];},
 lineRate:lr748Typed,""", 'Read canonical physical identity without a financial-model call', path)
    return html
