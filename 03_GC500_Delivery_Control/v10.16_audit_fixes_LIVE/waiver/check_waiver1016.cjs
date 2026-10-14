/* Author: Andrew Fisher. Optional waiver is not added or required; explicit charge paths remain intact. */
'use strict';
const fs=require('fs');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>{
  const originalState=JSON.stringify(S),originalLedger=pl770Model,checks=[],cases={},check=(name,value)=>checks.push({name,pass:!!value}),eq=(a,b)=>Math.round(a*100)===Math.round(b*100);
  const restore=()=>{S=JSON.parse(originalState);pl770Model=originalLedger;sharedCache975();};
  const read=()=>holdAssets(()=>{const money=moneySummary(),pl=pl770Model(),branches=branchFinancial978(pl752Rows(),money),onsite=onsiteComplete979();return {recorded:money.charge.total,forecast:pl.revJob,direct:pl.direct,directJob:pl.directJob,branches,supplier:supplierPricing1014(),onsite,waiver:pl.rev.find(r=>r.key==='waiver'),checks:pl.checks};});
  const withWaiver=update=>{pl770Model=function(){const p=originalLedger();return {...p,rev:p.rev.map(r=>r.key==='waiver'?update({...r}):r)};};sharedCache975();return read();};
  try{
   cases.current=read();check('waiver stays uncharged',cases.current.waiver.now===null&&cases.current.waiver.job===null);check('optional default is explained',cases.current.waiver.optional===true&&cases.current.waiver.basis==='No automatic damage waiver is applied. An agreed charge requires an explicit entry.');check('unselected waiver is not a missing charge',!cases.current.onsite.holds.some(r=>r.item==='Damage waiver'));
   cases.oldDefault=withWaiver(r=>{delete r.optional;return r;});check('old default hold reproduced',cases.oldDefault.onsite.holds.some(r=>r.item==='Damage waiver'));check('only optional waiver hold removed',JSON.stringify(cases.oldDefault.onsite.holds.filter(r=>r.item!=='Damage waiver'))===JSON.stringify(cases.current.onsite.holds));
   for(const key of ['recorded','forecast','direct','directJob'])check(key+' unchanged by optional policy',eq(cases.current[key],cases.oldDefault[key]));
   check('supplier pricing unchanged',JSON.stringify(cases.current.supplier)===JSON.stringify(cases.oldDefault.supplier));check('branch allocations unchanged',JSON.stringify(cases.current.branches)===JSON.stringify(cases.oldDefault.branches));check('priced onsite subtotal unchanged',eq(cases.current.onsite.known,cases.oldDefault.onsite.known));check('required missing rates still prevent complete billing',cases.current.onsite.holds.length>0&&cases.current.onsite.complete===false&&cases.current.onsite.total===null);
   restore();cases.explicitRequired=withWaiver(r=>({...r,required:true}));check('future explicit requirement retains unpriced hold',cases.explicitRequired.onsite.holds.some(r=>r.item==='Damage waiver'));
   restore();cases.explicitEnabled=withWaiver(r=>({...r,enabled:true}));check('future explicitly enabled unpriced waiver retains hold',cases.explicitEnabled.onsite.holds.some(r=>r.item==='Damage waiver'));
   restore();cases.explicitPriced=withWaiver(r=>({...r,enabled:true,now:12.34,job:12.34}));check('future priced waiver is not suppressed',cases.explicitPriced.waiver.now===12.34&&cases.explicitPriced.waiver.job===12.34&&!cases.explicitPriced.onsite.holds.some(r=>r.item==='Damage waiver'));
   restore();S.costs.push({id:'AUDIT-OPTIONAL-WAIVER',kind:'other',category:COST_CATS.find(c=>/other/i.test(c))||COST_CATS[0],description:'Explicit agreed damage waiver - isolated audit only',amount:12.34,date:todayIso(),recorded_by:'Read-only audit',branch:'KINP'});sharedCache975();cases.entered=read();check('explicit charge entry remains included once',eq(cases.entered.recorded-cases.current.recorded,12.34)&&eq(cases.entered.forecast-cases.current.forecast,12.34));check('explicit customer charge leaves Direct costs unchanged',eq(cases.entered.direct,cases.current.direct)&&eq(cases.entered.directJob,cases.current.directJob));check('entered charge reaches selected branch',eq(cases.entered.branches.rows.find(r=>r.code==='KINP').revenue-cases.current.branches.rows.find(r=>r.code==='KINP').revenue,12.34));
   S.costs.find(r=>r.id==='AUDIT-OPTIONAL-WAIVER').amount=23.45;sharedCache975();cases.edited=read();check('explicit entry remains editable',eq(cases.edited.recorded-cases.current.recorded,23.45)&&eq(cases.edited.forecast-cases.current.forecast,23.45));check('edited values still reconcile',Object.values(cases.edited.checks).every(Boolean)&&Object.values(cases.edited.branches.checks).every(Boolean));
  }finally{restore();}
  check('all in-memory state restored',JSON.stringify(S)===originalState);return {checks,cases,nativeVersion:SYNC.backend.readVersion821()};
 });
 result.checks.push({name:'no browser errors or operational writes',pass:!h.errors.length&&!h.counts.blocked});
 fs.writeFileSync(process.env.OUT,JSON.stringify({author:'Andrew Fisher',...result,errors:h.errors,counts:h.counts},null,2)+'\n');console.log(JSON.stringify({checks:result.checks.length,failures:result.checks.filter(r=>!r.pass),nativeVersion:result.nativeVersion,errors:h.errors,counts:h.counts}));if(result.checks.some(r=>!r.pass))process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
