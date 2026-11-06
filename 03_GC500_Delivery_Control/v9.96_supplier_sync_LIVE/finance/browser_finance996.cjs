// Author: Andrew Fisher. Run under the shared browser lock; every non-GET is blocked.
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const control=path.resolve(__dirname,'../..'),hp=path.join(control,'toolchain/harness/open_page.js'),m=new Module(hp,module);
m.filename=hp;m.paths=Module._nodeModulePaths(path.dirname(hp));m._compile(fs.readFileSync(hp,'utf8').replace(/const okPost = [^;]+;/,'const okPost=false;'),hp);require.cache[hp]=m;
const {open}=require(hp),out=process.env.OUT||'/workspace/private-finance996';
(async()=>{let s;try{
 s=await open({pageFile:process.env.PAGE,hash:'#costs',W:390,H:844,dpr:1,mobile:true});
 await s.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:55000});
 const proof=await s.page.evaluate(()=>{
  const checks=[],ok=(name,value)=>checks.push({name,pass:!!value}),r2=n=>Math.round((n+Number.EPSILON)*100)/100;
  const record=JSON.stringify(S),nativeAssets=JSON.stringify(allAssets()),assets=FinanceRequest996.assets,model=FinanceRequest996.model,resolver=Supplier996.resolveRequest;
  const capture=()=>{RENDER_MEMO.clear();return holdAssets(()=>({money:moneySummary(),cj:cj764Model(),pl:pl770Model(),rh:rh766Model(),branch:branchFinancial978(pl752Rows(),moneySummary()),finance:fh866Model(),labour:labourRevenue858(),slots:labourPlan().slots,accrual:acc761Labour(),transport:buildingTransportModel831(),source:FinanceRequest996.model()}));};
  FinanceRequest996.assets=()=>allAssets();FinanceRequest996.model=()=>({rows:[],issues:[],amount:0});const before=capture();FinanceRequest996.assets=assets;FinanceRequest996.model=model;const after=capture();
  ok('Existing current Revenue and Direct costs exactly preserved',JSON.stringify(after.money)===JSON.stringify(before.money));
  ok('All supplier costs exactly preserved',after.cj.job===before.cj.job&&after.rh.totals.cost===before.rh.totals.cost&&after.rh.totals.costJob===before.rh.totals.costJob);
  ok('Two source-row hire forecasts total180.14',after.source.rows.length===2&&after.source.amount===180.14);
  ok('Install and demob add145.76',r2(after.labour.job-before.labour.job)===145.76);
  ok('Delivery and pickup add190',r2(after.transport.uncoveredAdditional-before.transport.uncoveredAdditional)===190);
  ok('Whole-job forecast adds515.90 exactly',r2(after.cj.revenue.job-before.cj.revenue.job)===515.9);
  ok('P&L totals reconcile',Object.values(after.pl.checks).every(v=>v!==false));
  ok('All branch totals reconcile',Object.values(after.branch.checks).every(Boolean));
  ok('Finance handover reconciles',Object.values(after.finance.invCheck).every(Boolean));
  const slots=after.slots.filter(r=>r.ref.startsWith('EP-S7-'));
  ok('Four native labour slots with no completed charge',slots.length===4&&slots.every(r=>r.state!=='charged'&&r.qty===1&&r.branch==='KINP'));
  ok('Native labour slots agree with labour forecast',r2(slots.reduce((n,r)=>n+r.value,0))===145.76);
  const tr=after.transport.rows.filter(r=>r.ref.startsWith('EP-S7-'));
  ok('Four native transport legs with exact card rates',tr.length===4&&tr.every(r=>r.rate===47.5&&r.quantity===1&&r.branch==='KINP'));
  const b=after.branch.rows.find(r=>r.code==='KINP'),old=before.branch.rows.find(r=>r.code==='KINP');
  ok('All new forecast allocated toKINP',r2(b.revenueJob-old.revenueJob)===515.9);
  // Resolver fixtures do not write any operational data.
  Supplier996.resolveRequest=function(r){return r.id==='EP-S7-EW49'?{state:'cancelled',asset:null,key:null,matches:[]}:resolver.apply(this,arguments);};
  const cancelled=capture();ok('Cancellation removes only one source package',r2(after.cj.revenue.job-cancelled.cj.revenue.job)===257.95);
  Supplier996.resolveRequest=function(r){return r.id==='EP-S7-EW49'?{state:'ambiguous',asset:null,key:null,matches:[]}:resolver.apply(this,arguments);};
  const ambiguous=capture();ok('Ambiguous native alias held without duplicate package',r2(after.cj.revenue.job-ambiguous.cj.revenue.job)===257.95);
  Supplier996.resolveRequest=resolver;
  const future={rental_contract:'TEST-996',line:1,register_type:'FWF',quantity:1,rate_1:90.07,description:'Brad Jones Racing FWF',branch_code:'KINP',kind:'toilet',family:'toilet',charge_line:false,asset_no_is_plant_number:false};
  ONHIRE_ROWS.push(future);try{RENDER_MEMO.clear();const f=holdAssets(()=>FinanceRequest996.model());ok('Named future contract replaces one hire forecast',f.amount===90.07&&f.rows.find(r=>r.sourceRequest==='EP-S7-EW49').state==='covered');const demand=holdAssets(()=>otherTransportInput831()).buildings.find(r=>r.ref==='EP-S7-EW49');ok('Future exact contract alias carries transport coverage keys',demand.contracts.includes('TEST-996')&&demand.lineKeys.includes('TEST-996|1'));}finally{ONHIRE_ROWS.pop();RENDER_MEMO.clear();}
  const restored=capture();ok('Restored fixtures return identical financial projections',JSON.stringify(restored)===JSON.stringify(after));
  ok('Native record unchanged',JSON.stringify(S)===record);ok('Native operational asset list unchanged',JSON.stringify(allAssets())===nativeAssets);
  renderCosts();const detail=document.querySelector('[data-finance-request996]');ok('Source disclosure exists once',document.querySelectorAll('[data-finance-request996]').length===1);ok('Supporting source detail starts folded',detail&&!detail.open);if(detail){let p=detail.parentElement;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}detail.open=true;detail.scrollIntoView({block:'center'});}
  return {checks,delta:{hire:after.source.amount,installation:r2(after.labour.job-before.labour.job),transport:r2(after.transport.uncoveredAdditional-before.transport.uncoveredAdditional),total:r2(after.cj.revenue.job-before.cj.revenue.job)},source:after.source.rows.map(r=>({ref:r.ref,branch:r.branch,quantity:r.quantity,amount:r.amount,state:r.state}))};
 });
 fs.mkdirSync(out,{recursive:true});await s.page.screenshot({path:path.join(out,'finance996-phone.png')});
 const evidence={author:'Andrew Fisher',...proof,errors:s.errors,counts:s.counts,candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'finance996.js'))).digest('hex')};
 fs.writeFileSync(path.join(out,'browser-finance996.json'),JSON.stringify(evidence,null,2)+'\n');
 assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);for(const c of proof.checks)assert.ok(c.pass,c.name);
 console.log(JSON.stringify({checks:proof.checks.length,delta:proof.delta,errors:s.errors,counts:s.counts}));
 }finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
