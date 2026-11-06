/* Author: Andrew Fisher. Native mobile ledger disclosure; read-only service harness. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
(async()=>{
 assert(process.env.PAGE&&process.env.STATE&&process.env.PAGE_SHA&&process.env.OUT&&process.env.FIXED_TIME&&process.env.MOB==='1','Exact page, private record/output, fixed time and mobile context required');
 const out=path.resolve(process.env.OUT);assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep),'Evidence stays outside the repository');fs.mkdirSync(out,{recursive:true});
 assert.equal(sha(fs.readFileSync(process.env.PAGE)),process.env.PAGE_SHA);const instant=new Date(process.env.FIXED_TIME);assert(Number.isFinite(instant.getTime()));
 const s=await openCandidate();try{
  await s.page.clock.setFixedTime(instant);
  const before=await s.page.evaluate(()=>holdAssets(()=>({docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),ledger:pl770Model().rev.find(x=>x.code==='1047')})));
  await s.page.locator('#pl770 > details > summary').filter({hasText:'More info · ledger lines and sources'}).click();
  await s.page.locator('#pl770 > details[open] > details > summary').filter({hasText:/^Other Revenue$/}).click();
  const card=s.page.locator('#pl770 article.card').filter({has:s.page.locator('b > .chip').filter({hasText:/^1047$/})});assert.equal(await card.count(),1,'One actual Installation ledger card');
  await card.scrollIntoViewIfNeeded();
  const visible=await card.evaluate(node=>{const box=node.getBoundingClientRect();return{text:node.innerText,left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:innerWidth,height:innerHeight};});
  fs.writeFileSync(path.join(out,'phone-ledger-visible.json'),JSON.stringify({author:'Andrew Fisher',baseline:s.baseline,visible,ledger:before.ledger},null,2)+'\n');
  await s.page.screenshot({path:path.join(out,'installation-1047-phone.png'),fullPage:false});
  const cash=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
  assert(/1047\s+Installation/.test(visible.text),'Native ledger code and business term must be visible');
  assert(visible.text.includes('Current record\n'+cash(before.ledger.now)),'Current record cents displayed');
  assert(visible.text.includes('Job total\n'+cash(before.ledger.job)),'Current native Job total label and cents displayed');
  assert(visible.left>=0&&visible.right<=visible.width&&visible.top>=0&&visible.bottom<=visible.height,'Actual Installation card fits phone viewport');
  const after=await s.page.evaluate(()=>holdAssets(()=>({docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),ledger:pl770Model().rev.find(x=>x.code==='1047'),queue:{inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}})));
  assert.equal(after.docs,before.docs);assert.deepEqual(after.ledger,before.ledger);assert.deepEqual(after.queue,{inflight:0,queued:0});assert.deepEqual([s.errors,s.consoleErrors,s.counts.blocked],[[],[],0]);
  const result={author:'Andrew Fisher',baseline:s.baseline,fixedTime:instant.toISOString(),visible,ledger:after.ledger,documentsUnchanged:true,noWrites:true,noErrors:true,passed:9};fs.writeFileSync(path.join(out,'phone-ledger.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS native phone Installation1047 disclosure, exact cents, viewport, unchanged documents/ledger and zero errors/writes');
 }finally{await s.browser.close();}
})().catch(e=>{console.error('FAIL '+e.stack);process.exitCode=1;});
