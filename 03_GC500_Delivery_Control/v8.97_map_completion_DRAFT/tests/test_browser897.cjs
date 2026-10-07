// Author: Andrew Fisher. Real-page map regression checks. GET-only rig; simulations only replace in-memory display readers.
// PAGE=... CODE=... ASSETS=... [MEDIA=...] [MOB=1] [REDUCED=1] OUT=... node tests/test_browser897.cjs
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const {openMap} = require('./open_map897.cjs');
let s, passed=0;
async function check(name, fn) { await fn();passed++;console.log('PASS',name); }
const OUT=process.env.OUT || path.join(require('os').tmpdir(),'gc500-map897-tests');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
  s=await openMap();const {page:p,f,MOB}=s;
  if(process.env.REDUCED) await p.emulateMedia({reducedMotion:'reduce'});
  await f.evaluate(()=>{GC500Explorer.setMode('original');GC500Explorer864.clear();complete897Pull();if(DONE782_ON)document.getElementById('done782').click();});
  await check('The page and explorer agree on every verified completion',async()=>{
    const expected=await p.evaluate(()=>gc500CompleteKeys897().map(k=>k.trim().toUpperCase()).sort());
    const actual=await f.evaluate(()=>GC500Explorer897.keys().sort());assert.deepEqual(actual,expected);
  });
  await check('No new global ticks while the selection is clear',async()=>assert.deepEqual(await f.evaluate(()=>GC500Explorer897.state.ticked),[]));
  await check('Complete results remain visible with all other category results',async()=>{
    const got=await f.evaluate(()=>{
      const cat=CATS_NOW.find(c=>c.name==='Portable buildings');showCategory(cat.id);
      return {wanted:ITEMS.filter(i=>i.cat.id===cat.id).map(i=>i.code).sort(), rows:[...document.querySelectorAll('#findList [data-code]')].map(b=>b.dataset.code).sort(),
        wantedMarks:ITEMS.filter(i=>i.cat.id===cat.id && i.places.length).map(i=>i.code).sort(),marks:marks.map(m=>m.it.code).sort(),
        rowsCorrect:[...document.querySelectorAll('#findList [data-code]')].every(b=>!!b.querySelector('.ok897')===GC500Explorer897.isComplete(b.dataset.code))};
    });assert.deepEqual(got.rows,got.wanted);assert.deepEqual(got.marks,got.wantedMarks);assert.equal(got.rowsCorrect,true);
  });
  await check('Selection retains the full category, the reference label and its pulse',async()=>{
    await f.evaluate(()=>selectCode('P12',0,true));await p.waitForTimeout(1200);
    const got=await f.evaluate(()=>({selected:selected.code, all:marks.length, expected:ITEMS.filter(i=>i.cat.id===selected.cat.id && i.places.length).length,pulse:!document.getElementById('pulse').hidden,card:document.querySelector('#xcard .xc-t b')?.textContent}));
    assert.equal(got.selected,'P12');assert.equal(got.all,got.expected);assert.equal(got.card,'P12');assert.equal(got.pulse,true);
  });
  await check('Review-required completion cannot claim verified Finished',async()=>{
    const got=await p.evaluate(()=>{const a=assetOf('WC31'),state=timeline841State(a);return {verified:gc500IsComplete897('WC31'),done:deliveryOf('WC31').done,stage:state.stage,conflict:!!state.conflict};});
    assert.equal(got.verified,got.done && got.stage===5 && !got.conflict);
    await f.evaluate(()=>selectCode('WC31',0,true));
    assert.equal(await f.locator('#xcard .ok897').count(),got.verified?1:0);
  });
  await check('Search keeps all matching asset rows and correct completion badges',async()=>{
    const got=await f.evaluate(()=>{const q=document.getElementById('q');q.value='Gate';search();const rows=[...document.querySelectorAll('#results [data-code]')];return {n:rows.length,allCorrect:rows.every(b=>!!b.querySelector('.ok897')===isComplete897(ITEMS.find(i=>i.code===b.dataset.code)))};});
    assert.ok(got.n>0);assert.equal(got.allCorrect,true);
  });
  await check('Unrelated category gets no ticks from completed buildings',async()=>{
    const got=await f.evaluate(()=>{const cat=CATS_NOW.find(c=>c.name==='Toilets & amenities');showCategory(cat.id);return {codes:marks.map(m=>m.it.code),ticks:GC500Explorer897.state.ticked};});
    assert.ok(got.ticks.every(k=>got.codes.includes(k)));assert.equal(got.ticks.includes('P12'),false);
  });
  await check('Done overlay suppresses duplicate ring ticks and remains optional',async()=>{
    const got=await f.evaluate(()=>{selectCode('P12',0,true);done782Pull();const prior=GC500Explorer897.state.ticked;document.getElementById('done782').click();const on=GC500Explorer897.state;const duplicate=on.ticked.some(k=>DONE782.has(k));document.getElementById('done782').click();return {prior,on,duplicate,after:GC500Explorer897.state};});
    assert.equal(got.on.doneLayer,true);assert.equal(got.duplicate,false);assert.equal(got.after.doneLayer,false);assert.deepEqual(got.after.ticked,got.prior);
  });
  await check('Live completion changes refresh card text, preserve focus and do not fly the camera',async()=>{
    await f.evaluate(()=>{selectCode('P12',0,true);stopPulse();});await p.waitForTimeout(700);
    await p.evaluate(()=>{window.__originalComplete897=gc500CompleteKeys897;window.__originalCard897=gc500PlanCard;
      window.gc500CompleteKeys897=()=>__originalComplete897().filter(k=>k!=='P12');
      window.gc500PlanCard=k=>{const info=__originalCard897(k);if(k!=='P12'||!info)return info;return {...info,stage:{...info.stage,n:4,label:'Installed',tone:'green'},left:'Still to come: Finished',lines:info.lines.map(l=>l.k==='Finished'?{...l,done:false,text:'Complete check still open'}:l)};};});
    const got=await f.evaluate(()=>{const before=JSON.stringify(camera),button=document.querySelector('#xcard [data-xopen]');button?.focus();complete897Pull();return {sameCamera:before===JSON.stringify(camera),pill:!!document.querySelector('#xcard .ok897'),stage:document.querySelector('#xcard .xc-st')?.textContent,remaining:document.querySelector('#xcard .xc-left')?.textContent,focus:document.activeElement.hasAttribute('data-xopen')};});
    assert.equal(got.sameCamera,true);assert.equal(got.pill,false);assert.equal(got.stage,'Installed');assert.equal(got.remaining,'Still to come: Finished');assert.equal(got.focus,true);
    await p.evaluate(()=>{window.gc500CompleteKeys897=__originalComplete897;window.gc500PlanCard=__originalCard897;delete window.__originalComplete897;delete window.__originalCard897;});
    await f.evaluate(()=>complete897Pull());
  });
  await check('Unavailable completion reader clears visible claims and recovers',async()=>{
    await p.evaluate(()=>{window.__originalComplete897=gc500CompleteKeys897;window.gc500CompleteKeys897=()=>null;
      const input=document.createElement('input');input.id='focus-test897';input.setAttribute('aria-label','Test focus');document.body.appendChild(input);input.focus();});
    const empty=await f.evaluate(()=>{complete897Pull();return {keys:GC500Explorer897.keys(),pills:document.querySelectorAll('.ok897').length};});assert.deepEqual(empty.keys,[]);assert.equal(empty.pills,0);
    assert.equal(await p.evaluate(()=>document.activeElement.id),'focus-test897');
    await p.evaluate(()=>{window.gc500CompleteKeys897=__originalComplete897;delete window.__originalComplete897;document.getElementById('focus-test897').remove();});await f.evaluate(()=>complete897Pull());
    assert.deepEqual(await f.evaluate(()=>GC500Explorer897.keys().sort()),await p.evaluate(()=>gc500CompleteKeys897().map(k=>k.trim().toUpperCase()).sort()));
  });
  await check('Completion pill and tick do not add motion',async()=>{
    const got=await f.evaluate(()=>{const badge=document.querySelector('#xcard .ok897');return badge?getComputedStyle(badge).animationName:'none';});assert.equal(got,'none');
    if(process.env.REDUCED) assert.equal(await f.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  });
  await check('Map and card are contained on this viewport',async()=>{
    const got=await f.evaluate(()=>{const r=document.getElementById('xcard').getBoundingClientRect();return {width:innerWidth,x:r.x,right:r.right,body:document.body.scrollWidth};});assert.ok(got.x>=0 && got.right<=got.width+1);assert.ok(got.body<=got.width+1);
  });
  const width=MOB?'phone':'laptop', reduced=!!process.env.REDUCED;
  const result={author:'Andrew Fisher',passed,failed:0,width,reduced,errors:s.errors,consoleErrors:s.consoleErrors,blocked:s.counts.blocked,liveExplorer:s.counts.liveExplorer,missing:s.counts.missing};
  fs.writeFileSync(path.join(OUT,`browser897_${width}${reduced?'_reduced':''}.json`),JSON.stringify(result,null,2));
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);assert.equal(s.counts.liveExplorer,0);assert.deepEqual(s.counts.missing,[]);
  console.log(JSON.stringify(result));
})().catch(e=>{console.error('FAIL',e.stack);process.exitCode=1;}).finally(async()=>{if(s)await s.browser.close();});
