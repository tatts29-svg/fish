// Author: Andrew Fisher. Changes are browser-only fixtures; no service writes.
const assert=require('assert/strict'),fs=require('fs');
assert.equal(require('crypto').createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.EXPECTED_SHA);
const {open}=require('../../toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#costs',mobile:process.env.MOB==='1',W:process.env.MOB==='1'?390:1440,H:844}),p=h.page;
try{
await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
await p.evaluate(()=>{SYNC.unsub.forEach(f=>f());SYNC.unsub=[];SYNC.on=false;window.syncPush=()=>{};window.folderWrite=()=>{};window.__native982=JSON.stringify(S);window.__costs982=JSON.parse(JSON.stringify(S.costs));state.financeView857='summary';go('costs');});
assert(await p.evaluate(()=>{const before=JSON.stringify(S),cases=[{amount:100,receipted:'part',receipted_amount:101},{amount:100,receipted:'part',receipted_amount:-1},{amount:100,receipted:'part',receipted_amount:''},{amount:-1,receipted:'full'}];return cases.every(c=>poReceiptIssue982(c)&&fh866Receipt(c).key==='unknown'&&fh866Receipt(c).amount===null)&&!poReceiptIssue982({amount:100,receipted:'part',receipted_amount:50})&&fh866Receipt({amount:100,receipted:'part',receipted_amount:50}).amount===50&&before===JSON.stringify(S);}), 'Invalid PO receipts cannot enter totals');
const baseline=await p.evaluate(()=>({P:pl770Model(),B:branchFinancial978(pl752Rows(),moneySummary()).total,H:fh866Model(),M:moneySummary(),kinds:OUR_KIND}));
fs.writeFileSync('/tmp/private-costs982/baseline.json',JSON.stringify(baseline));

const cost=await p.evaluate(()=>{const K=OUR_KIND.transport;return {id:'TEST982',side:'ours',kind:'transport',category:K.category,date:'2026-10-09',description:'Browser-only audit',supplier:'Audit carrier',amount:123.45,branch:'KINP',recorded_by:'Audit',from:'page'};});
await p.evaluate(c=>{SYNC.readonly=false;S.costs.push(c);save();SYNC.readonly=true;render();},cost);
const added=await p.evaluate(()=>({P:pl770Model(),B:branchFinancial978(pl752Rows(),moneySummary()).total,H:fh866Model(),M:moneySummary(),row:ourCosts().find(c=>c.id==='TEST982'),text:document.querySelector('#pane-costs').innerText}));

assert.equal(Math.round((added.P.costNow-baseline.P.costNow)*100),12345,'P&L cost changes once');
assert.equal(Math.round((added.B.cost-baseline.B.cost)*100),12345,'Branch costs update once');
assert.equal(Math.round((added.H.costTotal.job-baseline.H.costTotal.job)*100),12345,'Finance forecast updates once');
assert(added.text.includes(await p.evaluate(()=>money(pl770Model().direct))),'Rendered costs fresh');
for(const view of ['handover','transport','pricing','fencing','runsheet','summary','summary']){
await p.evaluate(v=>{financeHome857();state.financeView857=v;render();},view);
assert.equal(await p.locator('#pane-costs [data-pnl981-customer]').count(),1,'One customer header '+view);
assert.equal(await p.locator('#pane-costs [data-pnl981]').count(),view==='summary'?1:0,'No stale summary '+view);
}
await p.evaluate(()=>{const docs=Object.fromEntries(window.__costs982.map(c=>[docIdOf(c.id),{...c,_k:c.id}]));applyRemote('costs',{docs:Object.entries(docs).map(([id,data])=>({id,data:()=>data}))});});
await p.waitForTimeout(800);
assert.equal(await p.evaluate(()=>pl770Model().costNow),baseline.P.costNow,'Remote removal updates P&L');
assert.equal(await p.evaluate(()=>JSON.stringify(S.costs)),JSON.stringify([...JSON.parse(await p.evaluate(()=>JSON.stringify(window.__costs982)))].sort((a,b)=>String(a.id).localeCompare(String(b.id)))),'Remote replacement exact');

// A worker branch edit must reach monthly export and Finance from the same record.
const changedWorker=await p.evaluate(()=>{const worker=ourCosts().find(c=>c.kind==='person'&&c.usable&&fin745Rows().some(r=>r.person===c.person));if(!worker)throw Error('No worker fixture');const copy={...worker,branch:'MEAD'};S.costs=S.costs.filter(c=>c.id!==copy.id);S.costs.push(copy);SYNC.readonly=false;save();SYNC.readonly=true;return copy.person;});
await p.evaluate(name=>{FIN745_UI.month=fin745Rows().find(r=>r.person===name).month;},changedWorker);
assert(await p.evaluate(name=>fin745Csv().split('\r\n').some(line=>line.includes(name)&&line.includes('"MEAD","KINP"')),changedWorker),'Monthly export shares current branch');
assert(await p.evaluate(name=>fh866Model().people.rows.find(r=>r.person===name).home==='MEAD',changedWorker),'Finance shares worker branch');
const beforeAmounts=await p.evaluate(()=>pl770Model().costJob);
await p.evaluate(()=>{state.financeView857='summary';render();});
assert.equal(await p.evaluate(()=>pl770Model().costJob),beforeAmounts,'Branch presentation never changes money');
assert(await p.evaluate(()=>fin745Html().includes('data-monthly-branch982')),'Monthly table displays branch');
await p.evaluate(()=>{S=JSON.parse(window.__native982);sharedCache975();render();});
assert.equal(await p.evaluate(()=>JSON.stringify(S)),await p.evaluate(()=>window.__native982),'Fixture restored exactly');
if(process.env.OUTDIR){fs.mkdirSync(process.env.OUTDIR,{recursive:true});await p.locator('[data-pnl981]').scrollIntoViewIfNeeded();await p.screenshot({path:process.env.OUTDIR+'/costs-'+(process.env.MOB==='1'?'phone':'desktop')+'.png'});}
assert.equal(h.errors.length,0);assert.equal(h.counts.blocked,0);
const result={author:'Andrew Fisher',sha256:process.env.EXPECTED_SHA,pass:true,mobile:process.env.MOB==='1',localCostPropagation:true,remoteCostPropagation:true,branchPropagation:true,monthlyBranch:true,receiptValidation:true,allSixViews:true,nativeRestored:true,errors:h.errors,writes:h.counts.blocked};if(process.env.OUTDIR)fs.writeFileSync(process.env.OUTDIR+'/propagation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
