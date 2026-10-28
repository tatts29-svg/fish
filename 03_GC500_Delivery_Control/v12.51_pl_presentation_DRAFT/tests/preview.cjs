/* Author: Andrew Fisher. Native P&L preview preservation and visible-phone check; writes denied. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const fixed=new Date(process.env.FIXED_TIME||'2026-10-28T18:30:00.000Z');
async function capture(file,label,preview,mobile){
 process.env.PAGE=file;process.env.MOB=mobile?'1':'0';
 const s=await openCandidate();
 try{
  s.page.setDefaultTimeout(15000);console.log('OPEN '+label+' '+(preview?'preview':'baseline'));
  await s.page.clock.setFixedTime(fixed);
  await s.page.evaluate(()=>render());
  if(preview)await s.page.waitForSelector('#pl1251-preview');
  const models=await s.page.evaluate(()=>holdAssets(()=>{RENDER_MEMO.clear();HELD_MEMO.clear();return{
   docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),
   money:moneySummary(),ledger:pl770Model(),branches:branchFinancial978(pl752Rows(),moneySummary()),branchRows:pl752Rows(),scope:scopeFigures(),closeout:cj764Model(),rehire:rh766Model(),financeRows:fin745Rows(),financeSummary:fin745Summary(fin745SelectedMonth()),charges:ONHIRE_ROWS.map(r=>contractCharge(r)),
   build:allAssets().map(a=>[a.key,tradeCharges(a)]),
   functions:{printCosts:printCosts.toString(),pricing:renderPricing.toString(),finance:fin745Html.toString()}
  };}));
  const evidence={label,mobile,pageSha256:digest(fs.readFileSync(file)),models};
  if(preview){
   const ui=await s.page.evaluate(()=>{
    const root=document.getElementById('pl1251-preview'),pane=document.getElementById('pane-costs'),sources=pane.querySelector('[data-pl1251-sources]');
    return{lines:[...root.querySelectorAll('[data-pl1251-line]')].map(r=>({key:r.dataset.pl1251Line,cells:[...r.children].map(c=>c.textContent)})),branches:[...root.querySelectorAll('[data-pl1251-branch]')].map(r=>({code:r.dataset.pl1251Branch,cells:[...r.children].map(c=>c.textContent)})),totals:[...root.querySelectorAll('[data-pl1251-total]')].map(r=>({key:r.dataset.pl1251Total,cells:[...r.children].map(c=>c.textContent)})),accruals:pane.querySelectorAll('#accruals761,[data-costs-audit="accruals761"]').length,sourceClosed:!!sources&&!sources.open,originalLedgerRetained:!!sources.querySelector('#pl770'),originalFinanceRetained:!!sources.querySelector('#finance745'),printReady:typeof pane.querySelector('#printCosts')?.onclick==='function',overflow:document.documentElement.scrollWidth>innerWidth,firstContent:pane.querySelector(':scope > .pl1251-preview')?.id,fenceInSources:!!sources.querySelector('#fence-allin12423'),outsideSourceCards:[...pane.children].filter(n=>!n.matches('.hubhead,.finance857-nav,.rochip,.panehead,#pl1251-preview,[data-pl1251-sources]')).map(n=>n.id||n.className),summary:[...root.querySelectorAll('.pl1251-summary strong')].map(n=>{const r=n.getBoundingClientRect();return{text:n.textContent,left:r.left,right:r.right,width:innerWidth,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth};})};
   });
   assert.equal(ui.accruals,0);assert(ui.sourceClosed&&ui.originalLedgerRetained&&ui.originalFinanceRetained&&ui.printReady);assert(!ui.overflow,'Preview page must not overflow horizontally');assert.equal(ui.firstContent,'pl1251-preview');assert(ui.fenceInSources,'Native fencing summary is inside folded sources');assert.deepEqual(ui.outsideSourceCards,[],'No late native source cards before the preview');
   assert.equal(ui.lines.length,models.ledger.rev.length+models.ledger.cost.length+2);
   for(const r of models.ledger.rev){const row=ui.lines.find(x=>x.key==='revenue:'+r.key);assert(row);for(const [i,key] of [[2,'now'],[3,'job']])assert.equal(row.cells[i],typeof r[key]==='number'?new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(r[key]):'Unpriced');}
   const cents=n=>Math.round(n*100),sum=rows=>rows.reduce((n,r)=>n+(typeof r.now==='number'?cents(r.now):0),0),sumJob=rows=>rows.reduce((n,r)=>n+(typeof r.job==='number'?cents(r.job):0),0);
   assert.equal(sum(models.ledger.rev),cents(models.ledger.revNow));assert.equal(sumJob(models.ledger.rev),cents(models.ledger.revJob));
   assert.equal(sum(models.ledger.cost)+cents(models.ledger.over),cents(models.ledger.costNow));assert.equal(sumJob(models.ledger.cost)+cents(models.ledger.overJob),cents(models.ledger.costJob));assert.equal(cents(models.ledger.revNow)-cents(models.ledger.costNow),cents(models.money.difference));
   assert.equal(sum(models.ledger.cost)+cents(models.ledger.over)+cents(models.ledger.wages.toDate),cents(models.branches.total.cost));
   assert.equal(sumJob(models.ledger.cost)+cents(models.ledger.overJob)+cents(models.ledger.wages.job),cents(models.branches.total.costJob));
   assert.equal(cents(models.branches.total.revenue)-cents(models.branches.total.cost),cents(models.branches.total.contribution));
   for(const r of models.ledger.cost){const row=ui.lines.find(x=>x.key==='cost:'+r.key);assert(row);for(const [i,key] of [[2,'now'],[3,'job']])assert.equal(row.cells[i],typeof r[key]==='number'?new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(r[key]):'Unpriced');}
   for(const [key,values] of [['overheads',[models.ledger.over,models.ledger.overJob]],['wages',[models.ledger.wages.toDate,models.ledger.wages.job]]]){const row=ui.lines.find(x=>x.key==='cost:'+key);assert(row);assert.equal(row.cells[2],new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(values[0]));assert.equal(row.cells[3],new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(values[1]));}
   const aggregateExpected={revenue:[models.ledger.revNow,models.ledger.revJob],direct:[models.ledger.direct,models.ledger.directJob],'costs-before-wages':[models.ledger.costNow,models.ledger.costJob],costs:[models.branches.total.cost,models.branches.total.costJob],difference:[models.branches.total.contribution,models.branches.total.contributionJob]};
   for(const [key,pair] of Object.entries(aggregateExpected)){const row=ui.totals.find(x=>x.key===key);assert(row);assert.equal(row.cells[2],new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(pair[0]));assert.equal(row.cells[3],new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(pair[1]));}
   for(const b of models.branches.rows){const row=ui.branches.find(x=>x.code===b.code);assert(row);for(const [i,key] of [[1,'revenue'],[2,'cost'],[3,'contribution']])assert.equal(row.cells[i],new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(b[key]));}
   assert.deepEqual(ui.summary.map(x=>x.text),[models.ledger.revNow,models.ledger.costNow,models.money.difference].map(n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n)),'Headline preserves native before-wages values exactly');
   assert(ui.summary.every(x=>x.left>=0&&x.right<=x.width&&x.scrollWidth<=x.clientWidth+1),'Complete headline cents fit viewport');
   evidence.ui=ui;
   await s.page.evaluate(()=>window.scrollTo(0,0));
   await s.page.screenshot({path:path.join(process.env.OUT,'pl51-'+label+'-top.png'),fullPage:false});
   console.log('SCREENSHOT '+label+' top');
   if(mobile){await s.page.locator('#pl1251-ledger-title').scrollIntoViewIfNeeded();await s.page.screenshot({path:path.join(process.env.OUT,'pl51-phone-ledger.png'),fullPage:false});}
   await s.page.locator('#pl1251-branches-title').scrollIntoViewIfNeeded();await s.page.screenshot({path:path.join(process.env.OUT,'pl51-'+label+'-branches.png'),fullPage:false});
   // Existing source controls remain reachable after moving their original nodes.
   await s.page.locator('[data-pl1251-sources] > summary').click();
   assert(await s.page.locator('#pl770').isVisible());
   await s.page.waitForFunction(()=>SFOLD_OPEN.has('pl1251|sources'));
   await s.page.evaluate(()=>render());assert(await s.page.locator('#pl770').isVisible(),'Native fold choice survives re-render');
   await s.page.locator('[data-pl1251-sources] > summary').click();
   await s.page.locator('.finance857-nav [data-finance857="pricing"]').click();
   assert.equal(await s.page.locator('#pl1251-preview').count(),0,'Other finance views remain native');assert.equal(await s.page.locator('#pane-costs[data-pl1251-preview]').count(),0,'Summary styling removed from native finance subview');
   await s.page.locator('.finance857-nav [data-finance857="summary"]').click();
   await s.page.waitForSelector('#pl1251-preview');
   await s.page.evaluate(()=>renderCosts());assert.equal(await s.page.locator('#pl1251-preview').count(),1);
   await s.page.evaluate(()=>{go('today');go('costs');});await s.page.waitForSelector('#pl1251-preview');assert.equal(await s.page.locator('#pl1251-preview').count(),1);
   const after=await s.page.evaluate(()=>holdAssets(()=>({docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),ledger:pl770Model(),branches:branchFinancial978(pl752Rows(),moneySummary())})));
   assert.equal(after.docs,models.docs);assert.deepEqual(after.ledger,models.ledger);assert.deepEqual(after.branches,models.branches);evidence.navigation='Pricing/summary, direct renderCosts and Today/Costs re-entry passed';
  }else{await s.page.screenshot({path:path.join(process.env.OUT,'pl51-'+label+'-before.png'),fullPage:false});}
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);evidence.errors=s.errors;evidence.consoleErrors=s.consoleErrors;evidence.writeAttempts=s.counts.blocked;return evidence;
 }finally{await s.browser.close();}
}
(async()=>{
 assert(process.env.BASE&&process.env.CANDIDATE&&process.env.STATE&&process.env.OUT);fs.mkdirSync(process.env.OUT,{recursive:true});
 const base=await capture(process.env.BASE,'desktop',false,false);
 const desktop=await capture(process.env.CANDIDATE,'desktop',true,false),phone=await capture(process.env.CANDIDATE,'phone',true,true);
 assert.deepEqual(desktop.models,base.models,'All native financial/data functions unchanged desktop');assert.deepEqual(phone.models,base.models,'All native financial/data functions unchanged phone');
 const out={author:'Andrew Fisher',status:'PASS',fixedTime:fixed.toISOString(),stateSha256:digest(fs.readFileSync(process.env.STATE)),base,desktop,phone};fs.writeFileSync(path.join(process.env.OUT,'preview-validation.json'),JSON.stringify(out,null,2)+'\n');console.log('PASS exact native financial and record preservation; desktop/phone presentation and native re-entry');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
