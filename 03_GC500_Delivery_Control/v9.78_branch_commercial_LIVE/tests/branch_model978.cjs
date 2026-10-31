// Author: Andrew Fisher. Reconciliation, allocation and input preservation.
const assert=require('assert/strict'),{model}=require('../branch978');
const i={branches:[{code:'A',total:100.01},{code:'B',total:200}],ticks:{byBranch:{}},toiletBranch:'A',servicing:10,fencingByBranch:{B:20},fencingBranch:'B',fencingRemaining:30,costAllocations:[{branch:'A',recorded:11,job:15},{branch:'B',recorded:12,job:16}],revenueAllocations:[{branch:'A',recorded:5,job:5}],revenueForecastRows:[{branch:'A',amount:7}],total:{revenue:335.01,revenueJob:372.01,cost:23,costJob:31}};
const before=JSON.stringify(i),m=model(i);assert.equal(JSON.stringify(i),before);assert(Object.values(m.checks).every(Boolean));assert.equal(m.rows.length,2);assert.equal(m.total.contributionJob,341.01);assert.equal(m.rows.find(r=>r.code==='A').revenueJob,122.01);
const unresolved=model({...i,total:{...i.total,cost:25}});assert.equal(unresolved.rows.find(r=>r.code==='Shared job / allocation pending').cost,2);assert(Object.values(unresolved.checks).every(Boolean));
console.log('7 branch allocation checks passed');
