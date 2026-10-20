/* Author: Andrew Fisher. Read-only financial reconciliation on the live record. */
'use strict';
const fs=require('fs'),assert=require('assert/strict'),path=require('path'),{open}=require('../../toolchain/harness/open_page.js');
(async()=>{const s=await open({pageFile:process.env.PAGE,hash:'#costs'});try{
 await s.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,{timeout:120000});
 const result=await s.page.evaluate(()=>holdAssets(()=>{
  const M=moneySummary(),X=cj764Model(),P=pl770Model(),B=pl752Rows(),H=fh866Model(),T=buildingTransportModel831(),V=transport888View(),R=recon888Model(),complete=onsiteComplete979(),C=contractFigures(ONHIRE_ROWS),cents=n=>Math.round(n*100)/100;
  const monthly=acc761Model('2026-10').revenue.filter(r=>r.stream==='Transport Revenue — October invoice allocation'),priorMonth=acc761Model('2026-09').revenue.filter(r=>r.stream==='Transport Revenue — October invoice allocation');
  return {version:SYNC.version,actual:T.actualAdditional1006,remaining:T.remainingAdditional1006,full:T.uncoveredAdditional,contractTransport:C.transport.charge,charge:M.charge,streams:M.streams.map(r=>({key:r.key,charge:r.charge})),difference:M.difference,costKnown:M.cost.known,pl:P.rev.find(r=>r.key==='transport'),branchTotal:cents(B.reduce((n,r)=>n+r.transport,0)),branchActual:T.byBranch.filter(b=>b.actualAdditional1006),handover:H.invCheck,view:V.checks,viewRevenue:V.revenueTotal,viewLineTotal:cents(V.lines.reduce((n,r)=>n+(r.charge||0),0)),viewProvisional:V.provisionalTotal,reconciliation:R.ties.filter(t=>t.group==='Transport'||t.group==='P&L'),completeTransport:cents(complete.rows.reduce((n,r)=>n+r.transport,0)),partial:T.rows.filter(r=>r.receivedQuantity1006>0&&r.receivedQuantity1006<r.quantity).slice(0,5),generators:T.rows.filter(r=>r.family==='Generators'),receivedHolds:T.rows.filter(r=>r.receivedQuantity1006>0&&r.state==='held').map(r=>({ref:r.ref,item:r.item,leg:r.leg,quantity:r.receivedQuantity1006,rate:r.rate,coveredQuantity:r.coveredQuantity,coverage:r.coverage,reasons:r.reasons})),monthly:monthly.map(r=>({branch:r.branch,amount:r.amount,forecast:r.extra.forecastAmount})),priorMonth:priorMonth.length,rows:T.rows.length,pickupsCompleted:allAssets().filter(a=>deliveryOf(a.key)?.pickedUp).length};
 }));
 if(process.env.OUTPUT)fs.writeFileSync(process.env.OUTPUT,JSON.stringify({...result,errors:s.errors,blocked:s.counts.blocked},null,2));
 const near=(a,b)=>assert.ok(Math.abs(a-b)<.011,`${a} != ${b}`);
 near(result.actual+result.remaining,result.full);
 near(result.charge.delivery,result.contractTransport+result.actual);
 near(result.charge.delivery,result.pl.now);near(result.pl.job,result.charge.delivery+result.remaining);
 near(result.branchTotal,result.charge.delivery);near(result.viewRevenue,result.charge.delivery);near(result.viewProvisional,result.remaining);
 near(result.viewLineTotal,result.charge.delivery);near(result.monthly.reduce((n,r)=>n+r.amount,0),result.full);near(result.monthly.reduce((n,r)=>n+r.forecast,0),result.remaining);assert.equal(result.priorMonth,0);
 near(result.streams.reduce((n,r)=>n+r.charge,0),result.charge.total);near(result.difference,result.charge.total-result.costKnown);
 assert.ok(Object.values(result.view).every(Boolean));assert.ok(Object.values(result.handover).every(Boolean));
 assert.deepEqual(result.reconciliation.filter(r=>!r.ok),[]);assert.deepEqual(s.errors,[]);assert.equal(s.counts.blocked,0);
 const output={...result,errors:s.errors,blocked:s.counts.blocked};
 if(process.env.OUTPUT)fs.writeFileSync(process.env.OUTPUT,JSON.stringify(output,null,2));
 console.log(JSON.stringify({actual:result.actual,remaining:result.remaining,full:result.full,transportRevenue:result.charge.delivery,branches:result.branchActual.map(b=>({branch:b.branch,actual:b.actualAdditional1006,remaining:b.remainingAdditional1006})),rows:result.rows,checks:result.reconciliation.length,errors:s.errors,blocked:s.counts.blocked},null,2));
 }finally{await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
