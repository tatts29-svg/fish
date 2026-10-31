/* Author: Andrew Fisher. Synthetic independent transfer-oracle regressions. */
'use strict';
const assert = require('node:assert/strict');
const {expectedTransfers, assertTransfers, allocateScope} = require('./revenue_transfer_oracle.cjs');
const clone = x => JSON.parse(JSON.stringify(x)), checks = [];
function test(name, fn) { try { fn(); checks.push({name,pass:true}); } catch (e) { checks.push({name,pass:false,error:e.message}); } }
function fixture() {
  return {
    branches:[
      {code:'ALPHA',revenue:100,revenueJob:130,cost:40,costJob:45,contribution:60,contributionJob:85},
      {code:'BETA',revenue:200,revenueJob:200,cost:20,costJob:20,contribution:180,contributionJob:180},
      {code:'Shared job / allocation pending',revenue:3,revenueJob:3,cost:0,costJob:0,contribution:3,contributionJob:3}
    ],
    invoices:[
      {branch:'ALPHA',onRecord:100,job:130,toCome:30,billed:12,unbilled:88},
      {branch:'BETA',onRecord:200,job:200,toCome:0,billed:8,unbilled:192},
      {branch:'Shared job / allocation pending',onRecord:3,job:3,toCome:0,billed:0,unbilled:3}
    ],
    contracts:[{key:'c|SYNTHETIC|1',branch:'ALPHA',amount:20.15,owner:{rehire:true},category:'Rehire',source:{quantity:1}}],
    forecastRows:[{contract:'SYNTHETIC',line:1,branch:'ALPHA',amount:7.85,ledger:'1010'}],
    scope:{people:30,at:11,lines:[{key:'main',amount_exact:2,amount:2},{key:'extra',amount_exact:1,amount:1}]},
    roleBranches:{main:'ALPHA',extra:'BETA'},
    targets:[{key:'c|SYNTHETIC|1',branch:'BETA'}]
  };
}
const actual = e => clone({branches:e.branches,invoices:e.invoices,contracts:e.contracts,forecastRows:e.forecastRows,scope:e.scope});
const row = (e, branch) => e.branches.find(r => r.code === branch);
function syncInvoice(a, branch) {
  const b=row(a,branch),i=a.invoices.find(i=>i.branch===branch);
  b.contribution=Math.round((b.revenue-b.cost)*100)/100;b.contributionJob=Math.round((b.revenueJob-b.costJob)*100)/100;
  i.onRecord=b.revenue;i.job=b.revenueJob;i.toCome=Math.round((b.revenueJob-b.revenue)*100)/100;i.unbilled=Math.round((b.revenue-i.billed)*100)/100;
}
test('ordinary actual moves once and matching remaining forecast moves job only',()=>{
  const e=expectedTransfers(fixture());assert.equal(row(e,'ALPHA').revenue,79.85);assert.equal(row(e,'ALPHA').revenueJob,102);
  assert.equal(row(e,'BETA').revenue,220.15);assert.equal(row(e,'BETA').revenueJob,228);assertTransfers(e,actual(e));
});
test('oracle leaves every supplied input unchanged',()=>{const f=fixture(),before=clone(f);expectedTransfers(f);assert.deepEqual(f,before);});
test('unrelated residual and supplier cost branches remain exact',()=>{const e=expectedTransfers(fixture());assert.deepEqual(row(e,'Shared job / allocation pending'),fixture().branches[2]);assert.equal(row(e,'ALPHA').cost,40);assert.equal(row(e,'BETA').costJob,20);});
test('billed money stays with its original branch while unbilled follows Revenue',()=>{const e=expectedTransfers(fixture()),a=e.invoices.find(r=>r.branch==='ALPHA'),b=e.invoices.find(r=>r.branch==='BETA');assert.equal(a.billed,12);assert.equal(a.unbilled,67.85);assert.equal(b.billed,8);assert.equal(b.unbilled,212.15);});
test('remaining forecast uses its own baseline branch',()=>{const f=fixture();f.forecastRows[0].branch='BETA';const e=expectedTransfers(f);assert.equal(row(e,'ALPHA').revenueJob,109.85);assert.equal(row(e,'BETA').revenueJob,220.15);});
test('unpriced current contribution moves no actual and does not invent one',()=>{const f=fixture();f.contracts[0].amount=null;const e=expectedTransfers(f);assert.equal(row(e,'ALPHA').revenue,100);assert.equal(row(e,'ALPHA').revenueJob,122.15);});
test('same-branch confirmation causes no numeric transfer',()=>{const f=fixture();f.targets[0].branch='ALPHA';const e=expectedTransfers(f);assert.deepEqual(e.branches,f.branches.sort((a,b)=>a.code.localeCompare(b.code)));});
test('combined contract and role targets add independent deltas',()=>{const f=fixture();f.targets.push({key:'scope|extra',branch:'ALPHA'});const e=expectedTransfers(f);assert.equal(row(e,'ALPHA').revenue,89.85);assert.equal(row(e,'BETA').revenue,210.15);assert.equal(e.scope.at,11);});
test('aggregate people override is allocated by weights, not displayed role amount',()=>{const f=fixture();f.scope.people=12;f.targets=[{key:'scope|extra',branch:'ALPHA'}];const e=expectedTransfers(f);assert.equal(row(e,'ALPHA').revenue,104);assert.equal(row(e,'BETA').revenue,196);assert.equal(e.scope.lines[1].amount,1);});
test('fractional exact role weights override rounded displayed amounts',()=>{const s={people:1,lines:[{key:'x',amount_exact:1.4,amount:1},{key:'y',amount_exact:.6,amount:1}]};assert.deepEqual(allocateScope(s,{x:'ALPHA',y:'BETA'}),{ALPHA:.7,BETA:.3});});
test('equal largest scope weights assign rounding remainder to first encountered branch',()=>{const s={people:1,lines:[{key:'x',amount:1},{key:'y',amount:1},{key:'z',amount:1}]};assert.deepEqual(allocateScope(s,{x:'ALPHA',y:'BETA',z:'GAMMA'}),{ALPHA:.34,BETA:.33,GAMMA:.33});});
test('largest scope weight receives negative rounding correction',()=>{const s={people:.02,lines:[{key:'x',amount:2},{key:'y',amount:1},{key:'z',amount:1}]};assert.deepEqual(allocateScope(s,{x:'ALPHA',y:'BETA',z:'GAMMA'}),{ALPHA:0,BETA:.01,GAMMA:.01});});
test('zero people and zero weights follow existing allocation convention',()=>{assert.deepEqual(allocateScope({people:0,lines:[{key:'x',amount:1}]},{x:'ALPHA'}),{});assert.deepEqual(allocateScope({people:1,lines:[{key:'x',amount:0}]},{x:'ALPHA'}),{'—':1});});
test('unselected ordinary role retains its branch when the extra role moves',()=>{const f=fixture();f.targets=[{key:'scope|extra',branch:'ALPHA'}];const e=expectedTransfers(f);assert.deepEqual(e.scopeBefore,{ALPHA:20,BETA:10});assert.deepEqual(e.scopeAfter,{ALPHA:30});});
test('missing transfer cannot pass through active decision metadata alone',()=>{const f=fixture(),e=expectedTransfers(f);assert.throws(()=>assertTransfers(e,{branches:f.branches,invoices:f.invoices}),/Branch transfer/);});
for(const [name,factor]of[['partial',-.5],['duplicate',1],['reversed',-2]])test(name+' transfer rejected despite unchanged combined total',()=>{const e=expectedTransfers(fixture()),a=actual(e);row(a,'ALPHA').revenue-=20.15*factor;row(a,'BETA').revenue+=20.15*factor;assert.throws(()=>assertTransfers(e,a));});
test('wrong destination rejected even if total and invoice rows reconcile',()=>{const e=expectedTransfers(fixture()),a=actual(e);row(a,'BETA').revenue-=20.15;row(a,'Shared job / allocation pending').revenue+=20.15;syncInvoice(a,'BETA');syncInvoice(a,'Shared job / allocation pending');assert.throws(()=>assertTransfers(e,a),/Branch transfer/);});
test('residual bucket cannot conceal omitted job Revenue transfer',()=>{const e=expectedTransfers(fixture()),a=actual(e);row(a,'BETA').revenueJob-=7.85;row(a,'Shared job / allocation pending').revenueJob+=7.85;syncInvoice(a,'BETA');syncInvoice(a,'Shared job / allocation pending');assert.throws(()=>assertTransfers(e,a),/Branch transfer/);});
test('cost reallocation is rejected even if combined costs stay equal',()=>{const e=expectedTransfers(fixture()),a=actual(e);row(a,'ALPHA').cost--;row(a,'BETA').cost++;assert.throws(()=>assertTransfers(e,a),/Branch transfer/);});
for(const invalid of [undefined,NaN,Infinity,'0'])test('invalid zero-valued branch field '+String(invalid)+' is not treated as zero',()=>{const e=expectedTransfers(fixture()),a=actual(e);row(a,'Shared job / allocation pending').cost=invalid;assert.throws(()=>assertTransfers(e,a));});
for(const field of ['onRecord','job','toCome','billed','unbilled'])test('Finance '+field+' mismatch rejected',()=>{const e=expectedTransfers(fixture()),a=actual(e);a.invoices[0][field]+=.01;assert.throws(()=>assertTransfers(e,a),/Finance invoice/);});
test('missing Finance branch is rejected',()=>{const e=expectedTransfers(fixture()),a=actual(e);a.invoices.pop();assert.throws(()=>assertTransfers(e,a),/Finance invoice branches/);});
test('duplicate output branch and duplicate invoice branch are rejected',()=>{const e=expectedTransfers(fixture()),a=actual(e);a.branches.push(clone(a.branches[0]));assert.throws(()=>assertTransfers(e,a),/Duplicate actual branch/);const b=actual(e);b.invoices.push(clone(b.invoices[0]));assert.throws(()=>assertTransfers(e,b),/Duplicate actual invoice/);});
for(const field of ['amount','owner','category','source'])test('contract '+field+' preservation is enforced',()=>{const e=expectedTransfers(fixture()),a=actual(e);a.contracts[0][field]=field==='amount'?999:'Changed';assert.throws(()=>assertTransfers(e,a),/Contract amount/);});
test('source scope and forecast category preservation are enforced',()=>{const e=expectedTransfers(fixture()),a=actual(e);a.scope.people++;assert.throws(()=>assertTransfers(e,a),/Customer event scope/);const b=actual(e);b.forecastRows[0].ledger='OTHER';assert.throws(()=>assertTransfers(e,b),/Forecast amount/);});
for(const [name,change]of[
  ['target',f=>f.targets.push(clone(f.targets[0]))],['contract',f=>f.contracts.push(clone(f.contracts[0]))],
  ['forecast contribution',f=>f.forecastRows.push(clone(f.forecastRows[0]))],['scope role',f=>f.scope.lines.push(clone(f.scope.lines[0]))]
])test('duplicate '+name+' cannot silently double count',()=>{const f=fixture();change(f);assert.throws(()=>expectedTransfers(f),/Duplicate/);});
test('unknown target and conflicting forecast identity refuse an oracle',()=>{const f=fixture();f.targets[0].key='c|MISSING|1';assert.throws(()=>expectedTransfers(f),/Missing exact/);const g=fixture();g.forecastRows[0].key='c|OTHER|1';assert.throws(()=>expectedTransfers(g),/Conflicting forecast/);});
test('non-cent contract amount is refused rather than choosing a new pricing rule',()=>{const f=fixture();f.contracts[0].amount=1.005;assert.throws(()=>expectedTransfers(f),/already rounded/);});
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:checks.filter(c=>c.pass).length,total:checks.length},null,2));
if(checks.some(c=>!c.pass))process.exitCode=1;
