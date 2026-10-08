/* Author: Andrew Fisher. Private original-source oracle required; logs contain counts only. */
'use strict';
const assert=require('assert/strict');
module.exports=function audit(b,a,oracle,expected){let checks=0;const eq=(x,y,name)=>{assert.deepEqual(x,y,name);checks++;},near=(x,y,name)=>{assert(Math.abs(x-y)<0.015,name);checks++;};
 const B=b.models,A=a.models,delta=oracle.summary.delta,forecast=expected.forecastTotal,transport=expected.provisionalTransport;
 eq(a.contracts.length,320,'active source rows');
 const actual=new Map(a.contracts.map(r=>[r.rental+'/'+r.line,r]));
 for(const r of oracle.after){const x=actual.get(r.key);assert(x,'missing source line');for(const k of ['amount','how','days','daily','filled'])eq(x.charge[k],r.charge[k],r.key+' '+k);}
 eq(a.units,b.units,'all native unit data');eq(a.photos,b.photos,'all canonical photo bindings');
 for(const key of ['quotes','labourRevenue','labourAllowance','costRows','costTotals','assets'])eq(A[key],B[key],key+' unchanged');
 eq(A.money.cost,B.money.cost,'recorded Direct costs unchanged');
 near(A.money.charge.total-B.money.charge.total,delta,'Revenue source delta');near(A.contracts.charge-B.contracts.charge,delta,'contract source delta');
 for(const k of ['labour','race','fencing','other','servicing'])eq(A.money.charge[k],B.money.charge[k],k+' Revenue unchanged');
 near(A.forecastBuildings.uncoveredAdditional-B.forecastBuildings.uncoveredAdditional,transport,'existing provisional transport released');
 near(A.costsJob.known,B.costsJob.known,'known costs unchanged');near(A.costsJob.job-B.costsJob.job,forecast,'job costs estimate');near(A.costsJob.toCome-B.costsJob.toCome,forecast,'forecast costs estimate');
 near(A.rehire.totals.costJob-B.rehire.totals.costJob,forecast,'Rehire uses same estimate');near(A.rehire.totals.cost,B.rehire.totals.cost,'Rehire recorded costs unchanged');
 near(A.pnl.revNow-B.pnl.revNow,delta,'P&L current Revenue');near(A.pnl.revJob-B.pnl.revJob,delta+transport,'P&L job Revenue');
 near(A.pnl.costNow,B.pnl.costNow,'P&L current costs unchanged');near(A.pnl.costJob-B.pnl.costJob,forecast,'P&L job costs');
 near(A.handover.costTotal.job-B.handover.costTotal.job,forecast,'Finance handover same costs');
 eq(A.handover.pos,B.handover.pos,'purchase orders unchanged');eq(A.handover.people,B.handover.people,'people unchanged');
 near(a.estimates.reduce((s,f)=>s+f.estimate,0),forecast,'nine source estimates');eq(a.estimates.length,9,'nine linked lines');
 eq(a.estimates.filter(f=>f.daily).reduce((s,f)=>s+f.remaining,0),68,'native VMS billed days');
 for(const branch of Object.keys(expected.byCostBranch)){const rows=A.handover.costs.filter(r=>r.kind==='rehire');near(rows.reduce((s,r)=>s+(r.by[branch]||0),0),expected.byCostBranch[branch],'supplier cost branch');}
 for(const branch of A.branches){const sum=rs=>rs.filter(r=>r.branch===branch.code).reduce((s,r)=>s+(r.charge.amount||0),0);near(branch.total-B.branches.find(r=>r.code===branch.code).total,sum(oracle.after)-sum(oracle.before),'branch source delta');}
 for(const month of Object.keys(a.accounts)){near(a.accounts[month].costAccrue,b.accounts[month].costAccrue,'monthly actuals unchanged');near(a.accounts[month].forecastCostTotal-b.accounts[month].forecastCostTotal,month==='2026-10'?forecast:0,'monthly forecast only');}
 const ties=A.reconciliation.ties;eq(ties.length,17,'tie count');eq(ties.every(t=>t.ok),true,'all native ties');
 return {checks,passed:true,models:16,unitIdentities:a.units.length,nativeTies:ties.length};
};
