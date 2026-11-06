/* Author: Andrew Fisher. Exact native financial comparison on one frozen record.
 * HTTP writes are denied by the shared harness. Evidence stays in OUT, outside git.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const cents=v=>Math.round(v*100),canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const read=()=>holdAssets(()=>{
 const started=performance.now();
 RENDER_MEMO.clear();HELD_MEMO.clear();
 const M=moneySummary(),P=pl770Model(),LP=labourPlan(),R=recon888Model(),sv=servicing748();
 const docs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 return JSON.parse(JSON.stringify({customer:M.charge,direct:M.cost,categories:M.categories,streams:M.streams,
  revenue:P.rev.map(r=>({key:r.key,code:r.code,now:r.now,job:r.job})),costs:P.cost,ledger:{now:P.revNow,job:P.revJob,costNow:P.costNow,costJob:P.costJob},
  branch:branchFinancial978(pl752Rows(),M),ticks:pl760Ticks(),labour:labourRevenue858(),demobDetail:acc761Labour().demob,
  plan:{all:LP.all,slots:LP.slots,byBranch:[...LP.byBranch],byLine:[...LP.byLine]},heldReferences:allAssets().filter(a=>NotChargedHere1152.has(a.key)).map(a=>a.key),
  service:sv,supplier:sv.supplier1068,supplierModel:supplierService1068(),contracts:ONHIRE_ROWS,scope:scopeFigures(),
  reconciliation:{ok:R.ok,bad:R.bad,count:R.count,ties:R.ties},docs,
  queue:{inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)},
  footer:document.getElementById('footL')?.textContent,evaluationMs:performance.now()-started
 }));
});
async function optionalRegisterCapture(s){
 if(!process.env.ASSET_READER&&!process.env.REG_OUT)return;
 assert(process.env.ASSET_READER&&process.env.REG_OUT,'ASSET_READER and REG_OUT must both be supplied');
 const source=fs.readFileSync(process.env.ASSET_READER,'utf8');
 const payload=require('vm').runInNewContext('('+source+')');
 assert.equal(typeof payload,'function','Reviewed read-only asset reader must export one function');
 const value=await s.page.evaluate(payload);value.captureBaseline=s.baseline;
 fs.writeFileSync(process.env.REG_OUT,JSON.stringify(value,null,2)+'\n');
 console.log('PASS optional asset-register capture on the same frozen base session');
}
(async()=>{
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE&&process.env.OUT,'BASE, PAGE, STATE and private OUT required');
 const output=process.env.OUT,candidate=process.env.PAGE,result={};
 fs.mkdirSync(output,{recursive:true});
 for(const [key,page]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=page;const s=await openCandidate();
  try{
   result[key]=await s.page.evaluate(read);result[key].baseline=s.baseline;
   if(key==='base')await optionalRegisterCapture(s);
   if(key==='candidate'){
    await s.page.setViewportSize({width:390,height:844});
    await s.page.screenshot({path:path.join(output,'financial44-costs-phone.png'),fullPage:true});
    const wording=await s.page.evaluate(()=>{const p=document.getElementById('pane-costs');return {text:p?.textContent||'',water:pl767Servicing(),explanations:(moneySummary().caveats||[]).filter(x=>/water/i.test(x)),recovery:pl770Model().ratios?.filter(x=>/Consumables/.test(x.name))};});
    result.wording=wording;
   }
   result[key].pageErrors=s.errors;result[key].consoleErrors=s.consoleErrors;result[key].writeAttempts=s.counts.blocked;
  }finally{await s.browser.close();}
 }
 fs.writeFileSync(path.join(output,'financial-native.json'),JSON.stringify(result,null,2)+'\n');
 const b=result.base,a=result.candidate;let passed=0;
 const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
 const same=(name,x,y)=>check(name,()=>assert.deepEqual(x,y,name));
 const money=(name,x,y)=>same(name,cents(x),cents(y));
 for(const [key,value]of[['base',b],['candidate',a]]){
  same(key+' runtime errors',value.pageErrors,[]);same(key+' console errors',value.consoleErrors,[]);same(key+' HTTP writes',value.writeAttempts,0);
  same(key+' no queued or inflight writes',value.queue,{inflight:0,queued:0});same(key+' frozen docs match',value.baseline.docsMatch,true);
 }
 same('same frozen snapshot',a.baseline.stateSha256,b.baseline.stateSha256);same('same native version',a.baseline.version,b.baseline.version);
 same('source documents byte-equivalent',digest(a.docs),digest(b.docs));same('source contracts byte-equivalent',digest(a.contracts),digest(b.contracts));
 for(const k of ['supplier','supplierModel','direct','categories','costs','scope'])same(k+' unchanged',a[k],b[k]);
 const held=new Set(b.heldReferences);
 same('existing financial holds unchanged',a.heldReferences,b.heldReferences);
 same('only already-held financial slots removed',a.plan.slots,b.plan.slots.filter(s=>!held.has(s.ref)));
 same('supplier quote/card source intact',a.service.per1040,b.service.per1040);same('customer service card lines unchanged',a.service.card_lines,b.service.card_lines);
 const includedKeys=new Set(['service|Water Truck','service|Water Truck - Pre fill','service|Water delivery','service|3000 Ltr Free Drinking Water Tank']);
 const water=b.service.at_cost.filter(l=>includedKeys.has(l.key)).reduce((n,l)=>n+cents(l.amount),0)/100;
 money('headline servicing excludes included water once',a.customer.servicing,b.customer.servicing-water);
 money('headline total excludes included water once',a.customer.total,b.customer.total-water);
 for(const key of Object.keys(b.customer).filter(k=>!['servicing','total'].includes(k)))same('customer '+key+' unchanged',a.customer[key],b.customer[key]);
 same('ledger revenue/categories unchanged',a.revenue,b.revenue);same('ledger cent totals unchanged',a.ledger,b.ledger);
 money('headline equals current ledger',a.customer.total,a.ledger.now);
 const delta=(cents(b.customer.labour)-cents(b.ticks.total))/100;
 money('shared tick total agrees with headline labour',a.ticks.total,a.customer.labour);
 money('installation applies existing approved delta once',a.ticks.install.amount,b.ticks.install.amount+delta);
 for(const k of ['cleaning','fire_ext','other'])same(k+' tick category unchanged',a.ticks[k],b.ticks[k]);
 same('physical tick count unchanged',a.ticks.ticks,b.ticks.ticks);same('unknown tick count unchanged',a.ticks.unknown,b.ticks.unknown);
 same('FWF adjustment uses existing contract branch',a.ticks.fwf1244.branch,'KINP');
 for(const [code,row]of Object.entries(b.ticks.byBranch))if(code!=='KINP')same('unrelated '+code+' tick branch unchanged',a.ticks.byBranch[code],row);
 money('KINP install delta once',a.ticks.byBranch.KINP.install.amount,b.ticks.byBranch.KINP.install.amount+delta);
 money('KINP total delta once',a.ticks.byBranch.KINP.amount,b.ticks.byBranch.KINP.amount+delta);
 money('plan charged agrees with tick total',a.plan.all.charged,a.ticks.total);
 money('labour recorded agrees with installation',a.labour.recorded,a.ticks.install.amount);
 money('labour job applies approved delta',a.labour.job,b.labour.job+delta);
 money('remaining labour unchanged',a.labour.remaining,b.labour.remaining);
 same('individual install/demob split unchanged',a.labour.sums,b.labour.sums);
 same('demob-only detail marks unallocated combined adjustment',a.demobDetail.approvedCombinedSplitUnknown1244,true);
 same('demob-only detail is explicitly partial',a.demobDetail.complete,false);
 for(const row of b.branch.rows){const actual=a.branch.rows.find(r=>r.code===row.code)||(row.code==='Shared job / allocation pending'?{cost:0,costJob:0,revenue:0,revenueJob:0}:null);assert(actual,'Existing branch must remain: '+row.code);
  money(row.code+' cost unchanged',actual.cost,row.cost);money(row.code+' job cost unchanged',actual.costJob,row.costJob);
  if(row.code==='KINP'){money('KINP revenue reflects water and existing labour correction',actual.revenue,row.revenue-water+delta);money('KINP job revenue reflects same correction',actual.revenueJob,row.revenueJob-water+delta);}
  else if(row.code!=='Shared job / allocation pending'){money(row.code+' revenue unchanged',actual.revenue,row.revenue);money(row.code+' job revenue unchanged',actual.revenueJob,row.revenueJob);}
 }
 check('all reconciliation ties pass',()=>assert(a.reconciliation.ok,JSON.stringify(a.reconciliation.ties.filter(t=>!t.ok).map(t=>t.what))));
 check('all branch cent checks pass',()=>assert(Object.values(a.branch.checks).every(Boolean)));
 check('water explanation states included',()=>assert(/Water is included in the pump-out charges/.test(result.wording.water)));
 check('stale water pass-through explanation absent',()=>assert(!/water is at what Event Portables charge us|water services .*charged on at what Event Portables/i.test(result.wording.water+' '+result.wording.explanations.join(' '))));
 result.validation={passed,failed:0,ok:true};
 fs.writeFileSync(path.join(output,'financial-native.json'),JSON.stringify(result,null,2)+'\n');
 console.log(passed+' native financial consistency and preservation checks PASS');
})().catch(error=>{console.error('FAIL native financial gate: '+error.stack);process.exitCode=1;});
