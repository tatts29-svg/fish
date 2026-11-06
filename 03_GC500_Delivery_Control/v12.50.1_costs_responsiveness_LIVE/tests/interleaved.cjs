/* Author: Andrew Fisher. Bounded same-browser ABBA navigation, exact bytes and frozen record. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const clock='2026-10-28T18:30:00.000Z';
const docs=page=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))));
async function navigate(page){return page.evaluate(async()=>{
 const paint=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 go('today');await paint();const start=performance.now();go('costs');const syncMs=performance.now()-start;await paint();
 return{syncMs,nextPaintMs:performance.now()-start,tab:state.tab,visible:document.getElementById('pane-costs').classList.contains('on')};
});}
(async()=>{
 assert(process.env.BASE&&process.env.CANDIDATE&&process.env.CANDIDATE_SHA&&process.env.STATE&&process.env.OUT);
 const out=path.resolve(process.env.OUT);assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep));fs.mkdirSync(out,{recursive:true});
 const files={base:process.env.BASE,candidate:process.env.CANDIDATE},raw=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,fs.readFileSync(p)]));
 assert.equal(sha(raw.base),'7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404');assert.equal(sha(raw.candidate),process.env.CANDIDATE_SHA);
 const pageFile=path.join(out,'served-exact-page.html');fs.writeFileSync(pageFile,raw.base);process.env.PAGE=pageFile;process.env.INITIAL_HASH='#today';
 const s=await openCandidate();
 try{
  const before=await docs(s.page),blocks=[];
  for(const [index,label]of ['base','candidate','candidate','base'].entries()){
   fs.writeFileSync(pageFile,raw[label]);assert.equal(sha(fs.readFileSync(pageFile)),sha(raw[label]));
   if(index)await s.page.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/?navigation-block12501='+index+'#today',{waitUntil:'load',timeout:180000});
   await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
   await s.page.clock.setFixedTime(new Date(clock));
   assert.equal(await docs(s.page),before,'Each reload must retain the exact pinned record');
   const actual=await s.page.evaluate(()=>({footer:document.getElementById('footL')?.textContent,reader:pl760Ticks.toString().includes('pl760Ticks12501')}));
   assert.equal(actual.reader,label==='candidate','Loaded implementation must match block');
   await navigate(s.page); // One identical warm navigation excluded from samples.
   const samples=[];for(let n=0;n<2;n++)samples.push(await navigate(s.page));
   assert(samples.every(x=>x.tab==='costs'&&x.visible));assert.equal(await docs(s.page),before);
   blocks.push({index,label,pageSha256:sha(raw[label]),samples});console.log(JSON.stringify(blocks.at(-1)));
  }
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  const median=xs=>{xs.sort((a,b)=>a-b);return(xs[1]+xs[2])/2;};
  const summary=Object.fromEntries(['base','candidate'].map(label=>[label,{syncMedianMs:median(blocks.filter(b=>b.label===label).flatMap(b=>b.samples.map(s=>s.syncMs))),nextPaintMedianMs:median(blocks.filter(b=>b.label===label).flatMap(b=>b.samples.map(s=>s.nextPaintMs)))}]));
  const result={author:'Andrew Fisher',method:'One browser, exact page reloads in ABBA order, same frozen record/clock, one excluded warm navigation and two measured native Today→Costs samples per block, no function replacement',mobile:process.env.MOB==='1',stateSha256:sha(fs.readFileSync(process.env.STATE)),clock,blocks,summary,docsPreserved:true,errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};
  fs.writeFileSync(path.join(out,'interleaved.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({summary,docsPreserved:true,errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
