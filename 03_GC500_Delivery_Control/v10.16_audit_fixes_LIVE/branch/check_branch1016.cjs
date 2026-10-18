/* Author: Andrew Fisher. Customer-charge branch propagation; all native edits remain isolated in memory. */
'use strict';
const fs=require('fs');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>{
  const originalState=JSON.stringify(S),checks=[],cases={},check=(name,value)=>checks.push({name,pass:!!value}),eq=(a,b)=>Math.round(a*100)===Math.round(b*100),round=n=>Math.round(n*100)/100;
  const restore=()=>{S=JSON.parse(originalState);sharedCache975();};
  const read=()=>holdAssets(()=>{const money=moneySummary(),pl=pl770Model(),branches=branchFinancial978(pl752Rows(),money),finance=fh866Model();return {recorded:money.charge.total,forecast:pl.revJob,direct:pl.direct,directJob:pl.directJob,branches,finance:{rows:finance.inv,total:finance.invTotal,checks:finance.invCheck},supplier:supplierPricing1014(),checks:pl.checks,allocations:manualChargeBranches1016()};});
  const row=(state,code)=>state.branches.rows.find(r=>r.code===code)||{revenue:0,revenueJob:0};
  const change=(state,code,key='revenue')=>round(row(state,code)[key]-row(cases.baseline,code)[key]);
  const input={id:'AUDIT-MANUAL-BRANCH',kind:'other',category:COST_CATS.find(c=>/other/i.test(c))||COST_CATS[0],description:'Isolated customer charge branch audit',amount:12.34,date:todayIso(),recorded_by:'Read-only audit',branch:'KINP'};
  const run=(name,updates={},extras=[])=>{restore();S.costs.push({...input,...updates},...extras);sharedCache975();const state=read();cases[name]=state;check(name+': combined branch sums reconcile',Object.values(state.branches.checks).every(Boolean));check(name+': Finance and P&L reconcile',Object.values(state.finance.checks).every(Boolean)&&Object.values(state.checks).every(Boolean));return state;};
  try{
   cases.baseline=read();
   const baselineAllocations=manualChargeBranches1016;
   try{manualChargeBranches1016=()=>[];sharedCache975();cases.priorAllocation=read();}finally{manualChargeBranches1016=baselineAllocations;sharedCache975();}
   check('all current saved totals and branch rows unchanged',JSON.stringify(cases.baseline)===JSON.stringify(cases.priorAllocation));
   let state=run('explicitBranch');
   check('explicit charge reaches selected branch once',eq(change(state,'KINP'),12.34)&&eq(change(state,'KINP','revenueJob'),12.34));
   check('explicit charge increases combined Revenue once',eq(state.recorded-cases.baseline.recorded,12.34)&&eq(state.forecast-cases.baseline.forecast,12.34));
   check('customer charge does not change Direct costs or supplier pricing',eq(state.direct,cases.baseline.direct)&&eq(state.directJob,cases.baseline.directJob)&&JSON.stringify(state.supplier)===JSON.stringify(cases.baseline.supplier));
   check('Finance customer charge reaches selected branch',eq(state.finance.rows.find(r=>r.branch==='KINP').onRecord-cases.baseline.finance.rows.find(r=>r.branch==='KINP').onRecord,12.34));
   S.costs.find(r=>r.id===input.id).amount=23.45;sharedCache975();cases.edited=state=read();check('editing amount updates branch and combined model once',eq(change(state,'KINP'),23.45)&&eq(change(state,'KINP','revenueJob'),23.45)&&eq(state.recorded-cases.baseline.recorded,23.45)&&eq(state.forecast-cases.baseline.forecast,23.45));
   S.costs.find(r=>r.id===input.id).branch='NVAC';sharedCache975();cases.reassigned=state=read();check('branch reassignment removes old allocation and adds new',eq(change(state,'KINP'),0)&&eq(change(state,'NVAC'),23.45)&&eq(change(state,'NVAC','revenueJob'),23.45));
   S.costs=S.costs.filter(r=>r.id!==input.id);sharedCache975();cases.removed=read();check('removing charge restores all baseline projections',JSON.stringify(cases.removed)===JSON.stringify(cases.baseline));
   state=run('unassigned',{branch:''});check('missing branch remains shared without guessing',eq(change(state,'Shared job / allocation pending'),12.34)&&eq(change(state,'KINP'),0));
   const inherited=costBranchOf({...input,branch:'',ref:'WC09'}).code;check('reference fixture has a known inherited branch',!!inherited);
   state=run('referenceBranch',{branch:'',ref:'WC09'});check('reference branch used when no explicit branch',eq(change(state,inherited),12.34));
   state=run('explicitOverridesReference',{branch:'NVAC',ref:'WC09'});check('explicit branch takes precedence over reference',eq(change(state,'NVAC'),12.34)&&eq(change(state,inherited),inherited==='NVAC'?12.34:0));
   state=run('stringAmountAndNormalisedBranch',{amount:'12.34',branch:'kinp'});check('graded numeric amounts and existing branch normalisation retained',eq(change(state,'KINP'),12.34));
   state=run('zero',{amount:0});check('zero adds no Revenue or branch charge',eq(state.recorded,cases.baseline.recorded)&&eq(state.forecast,cases.baseline.forecast)&&JSON.stringify(state.branches)===JSON.stringify(cases.baseline.branches));
   state=run('negative',{amount:-12.34});check('unsupported negative amount remains rejected and uncharged',allCosts().find(c=>c.id===input.id).usable===false&&eq(state.recorded,cases.baseline.recorded)&&JSON.stringify(state.branches)===JSON.stringify(cases.baseline.branches));
   state=run('futureDate',{date:'2026-12-01'});check('branch matches unchanged ledger date semantics',eq(change(state,'KINP'),state.recorded-cases.baseline.recorded)&&eq(change(state,'KINP','revenueJob'),state.forecast-cases.baseline.forecast));
   state=run('multipleBranches',{},[{...input,id:'AUDIT-MANUAL-BRANCH-2',amount:23.45,branch:'NVAC'},{...input,id:'AUDIT-MANUAL-BRANCH-3',amount:0.01,branch:'KINP'},{...input,id:'AUDIT-MANUAL-BRANCH-4',amount:7.89,branch:''}]);check('multiple branches and unassigned charges each count once to the cent',eq(change(state,'KINP'),12.35)&&eq(change(state,'NVAC'),23.45)&&eq(change(state,'Shared job / allocation pending'),7.89)&&eq(state.recorded-cases.baseline.recorded,43.69));
   const chargedIds=allCosts().filter(c=>c.usable&&c.from!=='record').map(c=>c.id);check('manual source excludes derived docket charges',docketCostLines().every(c=>!chargedIds.includes(c.id)));
  }finally{restore();}
  check('all in-memory native state restored',JSON.stringify(S)===originalState);return {checks,cases,nativeVersion:SYNC.backend.readVersion821()};
 });
 result.checks.push({name:'no browser errors or operational writes',pass:!h.errors.length&&!h.counts.blocked});
 fs.writeFileSync(process.env.OUT,JSON.stringify({author:'Andrew Fisher',...result,errors:h.errors,counts:h.counts},null,2)+'\n');console.log(JSON.stringify({checks:result.checks.length,failures:result.checks.filter(r=>!r.pass),nativeVersion:result.nativeVersion,errors:h.errors,counts:h.counts}));if(result.checks.some(r=>!r.pass))process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
