/* Author: Andrew Fisher. Actual native table money visibility and model preservation. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const BASE_SHA='378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c';
const selector='#card748 > .tblwrap:has(> table.t748 > thead > tr > th:nth-child(2).num)';
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=()=>holdAssets(()=>JSON.parse(JSON.stringify({
 docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
 money:moneySummary(),branch:branchFinancial978(pl752Rows(),moneySummary()),
 finance:fh866Model(),servicing:servicing748(),contracts:ONHIRE_ROWS
})));
async function showTable(s){
 await s.page.locator('.finance857-nav [data-finance857="summary"]').click();
 await s.page.waitForFunction(()=>state.tab==='costs'&&state.financeView857==='summary');
 const card=s.page.locator('#card748');
 while(await card.locator('xpath=ancestor::details[not(@open)]').count())
  await card.locator('xpath=ancestor::details[not(@open)]').first().locator(':scope > summary').click();
 const wrap=s.page.locator(selector);assert.equal(await wrap.count(),1,'Exactly the native servicing table is targeted');
 assert.equal((await wrap.locator('thead th').first().textContent()).trim(),'Servicing');
 return wrap;
}
async function visibleMoney(cell){
 await cell.scrollIntoViewIfNeeded();
 return cell.evaluate(async n=>{
  const p=n.closest('.tblwrap'),range=document.createRange();range.selectNodeContents(n.querySelector('b')||n);
  let r=range.getBoundingClientRect(),clip=p.getBoundingClientRect();
  p.scrollLeft+=(r.left+r.right-clip.left-clip.right)/2;
  window.scrollBy(0,n.getBoundingClientRect().top-innerHeight/3);
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  r=range.getBoundingClientRect();clip=p.getBoundingClientRect();
  const points=[.01,.25,.5,.75,.99].map(t=>{
   const hit=document.elementFromPoint(r.left+r.width*t,r.top+r.height/2);
   return hit===n||n.contains(hit);
  });
  return{text:range.toString().trim(),left:r.left,right:r.right,top:r.top,bottom:r.bottom,
   viewport:[innerWidth,innerHeight],clip:[clip.left,clip.right],points,
   visible:points.every(Boolean)&&r.left>=Math.max(0,clip.left)&&r.right<=Math.min(innerWidth,clip.right)&&r.top>=0&&r.bottom<=innerHeight};
 });
}
(async()=>{
 assert(process.env.BASE&&process.env.CANDIDATE&&process.env.CANDIDATE_SHA&&process.env.STATE&&process.env.OUT);
 assert.equal(hash(process.env.BASE),BASE_SHA);assert.equal(hash(process.env.CANDIDATE),process.env.CANDIDATE_SHA);
 const out=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');assert(!out.startsWith(repo+path.sep),'Evidence stays private');
 fs.mkdirSync(out,{recursive:true});process.env.MOB='1';
 const result={author:'Andrew Fisher',status:'RUNNING',baseSha256:BASE_SHA,candidateSha256:process.env.CANDIDATE_SHA,widths:[],screens:[]};
 let before,baseline;
 process.env.PAGE=process.env.BASE;const b=await openCandidate();
 try{await b.page.clock.setFixedTime(new Date('2026-10-28T18:30:00Z'));before=await b.page.evaluate(read);baseline=b.baseline;assert.deepEqual([b.errors,b.consoleErrors,b.counts.blocked],[[],[],0]);}
 finally{await b.browser.close();}
 process.env.PAGE=process.env.CANDIDATE;const s=await openCandidate();
 try{
  await s.page.clock.setFixedTime(new Date('2026-10-28T18:30:00Z'));
  assert.equal(s.baseline.stateSha256,baseline.stateSha256);assert.deepEqual(await s.page.evaluate(read),before,'All financial, source and record models match exact54');
  for(const width of [390,360,640,641,1440]){
   await s.page.setViewportSize({width,height:844});const wrap=await showTable(s);
   const first=wrap.locator('tbody tr').first().locator('td').first();
   assert.equal(await first.evaluate(n=>getComputedStyle(n).position),width<=640?'static':'sticky','Phone-only scoped sticky correction');
   const other=s.page.locator('#card748 .tblwrap').filter({has:s.page.locator('thead th').first().filter({hasText:'Contract'})});
   const contractTables=await other.count();assert(contractTables>0,'Existing contract tables must be checked, not skipped');
   for(let i=0;i<contractTables;i++)assert.equal(await other.nth(i).locator('thead th').first().evaluate(n=>getComputedStyle(n).position),'sticky','Contract-table IDs retain their sticky behaviour');
   const checks=[];
   if(width<=640){
    const cells=wrap.locator('tbody td.num');
    for(let i=0;i<await cells.count();i++){
     const cell=cells.nth(i),text=(await cell.textContent()).trim();
     if(!/^\$[\d,]+\.\d{2}$/.test(text))continue;
     const proof=await visibleMoney(cell);checks.push(proof);
     assert(proof.visible,'Complete monetary text is clipped or obscured at '+width+'px cell '+i);
    }
    assert(checks.length>=5,'Actual servicing money rows must be checked');
    const name='servicing-money-'+width+'.png';await s.page.screenshot({path:path.join(out,name),fullPage:false});result.screens.push(name);
    await first.scrollIntoViewIfNeeded();await wrap.evaluate(n=>{n.scrollLeft=0;});
    const left='servicing-description-'+width+'.png';await s.page.screenshot({path:path.join(out,left),fullPage:false});result.screens.push(left);
   }
   result.widths.push({width,moneyCells:checks.length,contractTables,checks});
  }
  await s.page.setViewportSize({width:390,height:844});
  await s.page.emulateMedia({media:'print'});assert.equal(await s.page.locator(selector+' tbody td').first().evaluate(n=>getComputedStyle(n).position),'sticky','Print behaviour retained even at phone width');await s.page.emulateMedia({media:'screen'});
  await s.page.evaluate(()=>{go('today');go('costs');});await showTable(s);
  assert.deepEqual(await s.page.evaluate(read),before,'Complete native models preserved after resize, scrolling and re-entry');
  assert.deepEqual([s.errors,s.consoleErrors,s.counts.blocked],[[],[],0]);
  result.status='PASS';result.baseline=s.baseline;result.errors=s.errors;result.consoleErrors=s.consoleErrors;result.writes=s.counts.blocked;
 }finally{fs.writeFileSync(path.join(out,'visibility.json'),JSON.stringify(result,null,2)+'\n');await s.browser.close();}
 console.log(JSON.stringify({status:result.status,widths:result.widths.map(x=>({width:x.width,moneyCells:x.moneyCells})),modelPreservation:true,writes:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
