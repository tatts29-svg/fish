// Author: Andrew Fisher. Read-only native source reconciliation and preservation checks.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const cents=n=>Math.round(Number(n||0)*100),key=r=>String(r.rental_contract)+'|'+r.line;
const root=path.resolve(__dirname,'../../..'),out=path.resolve(process.env.OUT||'');
assert(process.env.OUT&&!out.startsWith(root+path.sep),'Private OUT required');
(async()=>{const mobile=process.env.MOB==='1',s=await open({pageFile:process.env.PAGE,hash:'#costs',mobile,W:mobile?390:1440,H:mobile?844:1000});let checks=0;
const check=(name,f)=>{f();checks++;console.log('PASS '+name);};
try{
 await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&typeof ChargeAssurance1224!=='undefined',null,{timeout:180000});
 const raw=await s.page.evaluate(()=>holdAssets(()=>({at:new Date().toISOString(),footer:document.getElementById('footL').textContent,models:{
  money:moneySummary(),closeout:cj764Model(),pnl:pl770Model(),service:servicing748(),workPricing:workPricing1007(),assurance:ChargeAssurance1224.model(),
  contractRows:ONHIRE_ROWS.map(r=>({...r,computed_charge:contractCharge(r)})),sourceOwners:ONHIRE_ROWS.filter(r=>r.sourceAddition1225).map(r=>({key:String(r.rental_contract)+'|'+r.line,owner:finance928ContractOwner(r)})),
  fwfSlots:labourPlan().slots.filter(s=>s.item==='FWF'),
  fwfRows:FinanceRequest996.assets().flatMap(a=>chargeLines(a).filter(l=>l.item==='FWF').map(l=>({ref:a.key,line:l,charge:charge1006(a,l),delivery:deliveryOf(a.key),units:gcModel925(a,{loading:false})}))),
  branches:branchRollup(todayIso()),transport:buildingTransportModel831()
 }})));
 const data=JSON.parse(JSON.stringify(raw));
 const early=JSON.stringify(data,null,2),token=process.env.GC500_EDIT_TOKEN;assert(!token||!early.includes(token));fs.writeFileSync(out,early,{mode:0o600});
 const before=JSON.parse(fs.readFileSync(process.env.BASE_MODELS,'utf8')).models,now=data.models;
 const added=now.contractRows.filter(r=>r.sourceAddition1225),expected=new Map([[151,1],[152,1],[153,1],[155,1],[156,3],[157,1],[158,1]]);
 const delta=added.reduce((n,r)=>n+cents(r.computed_charge.amount),0);
 check('exact reviewed source lines use ordinary hire once',()=>{assert.equal(added.length,expected.size);assert.equal(new Set(now.contractRows.map(key)).size,now.contractRows.length);for(const r of added){assert.equal(r.rental_contract,'9968955');assert.equal(r.branch_code,'KINP');assert.equal(r.sales_analysis_code,'KINP-HIR');assert.equal(r.charge_line,false);assert.equal(r.register_type,'FWF');assert.equal(r.quantity,expected.get(r.line));assert.equal(cents(r.computed_charge.amount),cents(r.quantity*r.rate_1));assert.equal(r.computed_charge.filled==='typed',false);}});
 check('all earlier source rows and computed charges preserved',()=>{assert.equal(now.contractRows.length,before.contractRows.length+added.length);for(const old of before.contractRows)assert.deepEqual(now.contractRows.find(r=>key(r)===key(old)),old,key(old));});
 check('actual Revenue increases only by the restored source charges',()=>{assert.equal(cents(now.money.charge.total)-cents(before.money.charge.total),delta);assert.equal(cents(now.pnl.revNow)-cents(before.pnl.revNow),delta);assert.equal(cents(now.pnl.revJob)-cents(before.pnl.revJob),delta);assert.equal(cents(now.money.charge.contracts)-cents(before.money.charge.contracts),delta);});
 check('source delta retains the current ownership-based Hire/Rehire split',()=>{const rehire=added.filter(r=>now.sourceOwners.find(o=>o.key===key(r)).owner.rehire).reduce((n,r)=>n+cents(r.computed_charge.amount),0);for(const r of before.pnl.rev){const n=now.pnl.rev.find(x=>x.key===r.key);assert(n);assert.equal(cents(n.now)-cents(r.now),r.key==='hire'?delta-rehire:r.key==='rehire'?rehire:0,r.key);}});
 check('direct costs and overheads are unchanged',()=>{for(const k of ['direct','directJob','over','overJob','costNow','costJob'])assert.equal(cents(now.pnl[k]),cents(before.pnl[k]),k);assert.deepEqual(now.money.cost,before.money.cost);});
 check('all FWF install and demob slots are unchanged',()=>assert.deepEqual(now.fwfSlots,before.fwfSlots));
 check('current FWF quantities identities arrivals and work are unchanged',()=>{assert.equal(now.fwfRows.length,before.fwfRows.length);for(const r of now.fwfRows){const old=before.fwfRows.find(x=>x.asset.key===r.ref);assert(old);for(const k of ['line','charge','delivery','units'])assert.deepEqual(r[k],old[k],r.ref+' '+k);}});
 check('servicing quantities exclusions and explicit decisions are unchanged',()=>{assert.deepEqual(now.service,before.service);assert.deepEqual(now.money.excluded1152,before.money.excluded1152);});
 check('all shared cent checks pass',()=>{assert.equal(now.assurance.state,'pass');assert(now.assurance.checks.every(c=>c.variance===0));});
 check('priced combined work remains an allocation review without an invented amount',()=>{const beforeRefs=before.workPricing.filter(r=>r.item==='TL2'&&r.state==='unpriced').map(r=>r.ref).sort(),covered=now.workPricing.filter(r=>r.state==='contract_scope');assert(beforeRefs.length>0);assert.deepEqual(covered.map(r=>r.ref).sort(),beforeRefs);for(const r of covered){assert.equal(r.value,null);assert.equal(r.rate,null);assert(now.money.caveats.some(t=>t.includes(r.why)));assert(!now.money.missing.some(t=>t.includes(r.why)));assert(now.assurance.issues.some(i=>i.ref===r.ref&&i.reason===r.why));}});
 check('release footer is current',()=>assert(data.footer.includes('v12.25')));
 await s.page.evaluate(()=>go('costs'));
 await s.page.locator('#charge1224').waitFor({state:'visible'});
 if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});await s.page.locator('#charge1224').scrollIntoViewIfNeeded();await s.page.locator('#charge1224').screenshot({path:path.join(process.env.EVIDENCE,'charge-summary-'+(mobile?'phone':'desktop')+'.png')});}
 await s.page.evaluate(()=>openAsset('WC53'));
 assert.equal(await s.page.locator('#drawer').getAttribute('aria-hidden'),'false');
 check('restored source reference opens its existing drawer',()=>{});
 if(process.env.EVIDENCE){await s.page.screenshot({path:path.join(process.env.EVIDENCE,'fwf-source-'+(mobile?'phone':'desktop')+'.png')});}
 check('no page errors or attempted record writes',()=>{assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);});
 data.testResult={checks,mobile,errors:s.errors,blocked:s.counts.blocked};
 const encoded=JSON.stringify(data,null,2),secret=process.env.GC500_EDIT_TOKEN;assert(!secret||!encoded.includes(secret));fs.writeFileSync(out,encoded,{mode:0o600});
}finally{await s.browser.close();}})().catch(e=>{console.error('NATIVE AUDIT FAILED: '+String(e.stack||e).slice(0,650));process.exitCode=1;});
