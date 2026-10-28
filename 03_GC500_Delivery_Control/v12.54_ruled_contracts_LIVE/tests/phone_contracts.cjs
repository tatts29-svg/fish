/* Author: Andrew Fisher. Existing Costs/Pricing/Finance phone controls, read-only. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
(async()=>{
 assert(process.env.PAGE&&process.env.PAGE_SHA&&process.env.STATE&&process.env.OUT);assert.equal(process.env.MOB,'1');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.PAGE_SHA);
 fs.mkdirSync(process.env.OUT,{recursive:true});const s=await openCandidate(),screens=[];
 try{
  await s.page.clock.setFixedTime(new Date('2026-10-28T18:30:00.000Z'));
  const read=()=>holdAssets(()=>({docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),money:moneySummary(),branch:branchFinancial978(pl752Rows(),moneySummary()),finance:fh866Model()}));
  const before=await s.page.evaluate(read);
  for(const[view,id]of(process.env.FOCUSED==='1'?[]:[['summary','#pl770'],['pricing','#finance857-section'],['handover','#handover866'],['summary','#pl770']])){
   await s.page.locator('.finance857-nav [data-finance857="'+view+'"]').click();
   await s.page.waitForFunction(view=>state.tab==='costs'&&state.financeView857===view,view);
   const section=s.page.locator(id);assert(await section.isVisible(),view+' native section remains visible');
   await section.evaluate(n=>n.scrollIntoView({block:'start'}));await s.page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   if(view==='handover'){assert(await s.page.locator('#handover866 table').count());assert(!(await section.textContent()).includes('could not be worked out'));}
   const name=view+'-'+screens.length+'-phone.png';await s.page.screenshot({path:path.join(process.env.OUT,name),fullPage:false});screens.push(name);
  }
  await s.page.locator('.finance857-nav [data-finance857="summary"]').click();
  await s.page.waitForFunction(()=>state.tab==='costs'&&state.financeView857==='summary');
  const card=s.page.locator('#card748');assert.equal(await card.count(),1);
  while(await card.locator('xpath=ancestor::details[not(@open)]').count())
   await card.locator('xpath=ancestor::details[not(@open)]').first().locator(':scope > summary').click();
  const sewer=card.locator('tbody > tr').filter({has:s.page.locator('td:first-child').filter({hasText:'Sewer Connect Units Clean & Restock'})});
  assert.equal(await sewer.count(),1,'One native customer sewer servicing row');
  const cells=await sewer.locator('td').allTextContents();
  assert(cells[0].includes('no customer charge on the approved contract line'));
  assert(!cells[0].includes('a night'),'No old priced-night wording on approved-zero line');
  assert.equal(cells[1].trim(),'24');assert.equal(cells[2].trim(),'Approved contract: no customer charge');
  assert.equal(cells[3].trim(),'$0.00');assert.equal(cells[4].trim(),'$0.00');
  const first=sewer.locator('td').first();await first.scrollIntoViewIfNeeded();
  await first.evaluate(n=>{let p=n.parentElement;while(p&&!(p.scrollWidth>p.clientWidth+1&&/auto|scroll/.test(getComputedStyle(p).overflowX)))p=p.parentElement;if(p)p.scrollLeft=0;window.scrollBy(0,n.getBoundingClientRect().top-innerHeight/3);});
  await s.page.screenshot({path:path.join(process.env.OUT,'sewer-approved-source-phone.png'),fullPage:false});screens.push('sewer-approved-source-phone.png');
  const amount=sewer.locator('td').nth(4);await amount.scrollIntoViewIfNeeded();
  const shown=await amount.evaluate(async n=>{
   let p=n.parentElement;while(p&&!(p.scrollWidth>p.clientWidth+1&&/auto|scroll/.test(getComputedStyle(p).overflowX)))p=p.parentElement;
   if(p)p.scrollLeft=p.scrollWidth;window.scrollBy(0,n.getBoundingClientRect().top-innerHeight/3);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const bold=n.querySelector('b'),range=document.createRange();range.selectNodeContents(bold||n);
   const r=range.getBoundingClientRect(),clip=p.getBoundingClientRect(),fixed=n.parentElement.cells[0].getBoundingClientRect();
   const points=[0.05,0.5,0.95].map(t=>{const x=r.left+r.width*t,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);return{x,y,unobscured:hit===n||n.contains(hit),hit:hit?hit.tagName+'.'+hit.className:null};});
   return{text:range.toString(),left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,clipLeft:clip.left,clipRight:clip.right,stickyRight:fixed.right,scrollLeft:p.scrollLeft,points};
  });
  await s.page.screenshot({path:path.join(process.env.OUT,'sewer-approved-amount-phone.png'),fullPage:false});screens.push('sewer-approved-amount-phone.png');
  fs.writeFileSync(path.join(process.env.OUT,'amount-visibility.json'),JSON.stringify({shown,cells,errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked},null,2)+'\n');
  const fullTextVisible=shown.text==='$0.00'&&shown.points.every(p=>p.unobscured)&&shown.left>=Math.max(0,shown.clipLeft,shown.stickyRight)&&shown.right<=Math.min(shown.width,shown.clipRight)&&shown.top>=0&&shown.bottom<=shown.height;
  let knownLimitation=null;
  if(!fullTextVisible){
   assert(process.env.BASELINE_PHONE&&process.env.BASE,'Clipped amount requires exact predecessor evidence; never report full text visibility');
   const baselineRun=JSON.parse(fs.readFileSync(path.join(process.env.BASELINE_PHONE,'phone.json'),'utf8'));
   const baselineVisibility=JSON.parse(fs.readFileSync(path.join(process.env.BASELINE_PHONE,'amount-visibility.json'),'utf8')).shown;
   const baseSha='69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2';
   assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.BASE)).digest('hex'),baseSha);
   assert.equal(baselineRun.baseline.pageSha256,baseSha);assert.equal(baselineRun.baseline.stateSha256,s.baseline.stateSha256);
   assert.equal(baselineRun.status,'PASS');assert.deepEqual([baselineRun.errors,baselineRun.consoleErrors,baselineRun.writes],[[],[],0]);
   for(const key of ['width','height','clipLeft','clipRight','scrollLeft'])assert.equal(shown[key],baselineVisibility[key],'Same native table/view geometry '+key);
   assert.deepEqual(shown.points.map(p=>p.unobscured),baselineVisibility.points.map(p=>p.unobscured),'Same inherited numeric overlap pattern');
   assert(!baselineVisibility.points.every(p=>p.unobscured)&&baselineVisibility.left<baselineVisibility.stickyRight,'Predecessor amount was already obscured');
   const styles=file=>fs.readFileSync(file,'utf8').match(/<style\b[^>]*>[\s\S]*?<\/style>/g);
   assert.deepEqual(styles(process.env.PAGE),styles(process.env.BASE),'Candidate has no style changes');
   knownLimitation={kind:'inherited_sticky_source_column',fullAmountTextVisible:false,baselinePageSha256:baseSha,baselineText:baselineVisibility.text,baselineStickyRight:baselineVisibility.stickyRight,candidateStickyRight:shown.stickyRight,note:'The existing first sticky column obscures the amount on this phone width. The approved no-customer-charge wording is visible; this is not a full numeric visibility pass.'};
  }
  const source143=await s.page.evaluate(()=>{const r=ONHIRE_ROWS.find(r=>r.rental_contract==='9968955'&&r.line===143);return {quantity:r.quantity,price:r.price,charge:contractCharge(r),treatment:contractTreatment747(r),renderer:contractMoneyWords(r),stillUnpriced:!r.charge_line&&!r.subhired&&typeof r.rate_1!=='number'&&!lr748Decided(r)};});
  assert.equal(source143.quantity,24);assert.equal(source143.price,260.25);assert.equal(source143.charge.amount,0);assert.equal(source143.treatment.kind,'approved_zero');assert.equal(source143.stillUnpriced,false);assert(source143.renderer.includes('No customer charge'));
  fs.writeFileSync(path.join(process.env.OUT,'approved-zero-ui.json'),JSON.stringify({author:'Andrew Fisher',actualServiceCells:cells,amountVisibility:shown,source143,proof:'Actual native service table and contract charge-treatment renderer; source143 is excluded from still-unpriced rows.'},null,2)+'\n');
  await s.page.evaluate(()=>{go('today');go('costs');});assert(await s.page.locator('#pl770').isVisible());
  assert.deepEqual(await s.page.evaluate(read),before,'Native documents and complete models remain exact after real controls/re-entry');
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  const result={author:'Andrew Fisher',status:knownLimitation?'PASS WITH EXISTING VISIBILITY LIMITATION':'PASS',amountVisibility:{fullTextVisible,knownLimitation},baseline:s.baseline,screens,checks:['Approved-zero native servicing row and preserved source143 treatment',...(process.env.FOCUSED==='1'?[]:['Actual summary, pricing and Finance clicks','Native sections and Finance tables visible']),'Today/Costs re-entry','Complete native models and documents unchanged'],focused:process.env.FOCUSED==='1',errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};
  fs.writeFileSync(path.join(process.env.OUT,'phone.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
