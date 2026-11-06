/* Author: Andrew Fisher. Read-only actual-page preview preservation and capture.
 * BASE and PAGE are private complete HTMLs; STATE and OUT stay outside the repository.
 */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const native=()=>[...document.querySelectorAll('#pane-timeline .ld.tl846.lc991')].map(card=>{
 const clone=card.cloneNode(true);clone.querySelectorAll('.b1247-location').forEach(n=>n.remove());
 return {id:card.dataset.tl846Load,text:clone.textContent,controls:[...clone.querySelectorAll('button,input,select,textarea,a,summary')].map(n=>({tag:n.tagName,text:n.textContent,attributes:[...n.attributes].filter(a=>a.name.startsWith('data-')||['role','aria-label','type','href'].includes(a.name)).map(a=>[a.name,a.value])}))};
});
const mountIdentity=()=>{
 const cards=[...document.querySelectorAll('#pane-timeline .ld.tl846.lc991')];
 cards.forEach(c=>c.querySelectorAll('.b1247-location').forEach(n=>n.remove()));
 const before=cards.map(c=>c.outerHTML);BuildCards1247.mount();
 const after=cards.map(c=>{const clone=c.cloneNode(true);clone.querySelectorAll('.b1247-location').forEach(n=>n.remove());return clone.outerHTML;});
 return JSON.stringify(before)===JSON.stringify(after);
};
async function select(p){await p.evaluate(()=>{state.day='2026-10-21';state.tlView='day';renderTimeline();});await p.waitForSelector('#pane-timeline .ld.tl846.lc991');await p.waitForTimeout(250);}
async function recordsUnchanged(p,frozen){
 const result=await p.evaluate(()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}));
 const populated=x=>Object.fromEntries(Object.entries(x).filter(([,v])=>Object.keys(v).length));
 assert.deepEqual(populated(result.docs),populated(frozen.docs),'Native documents must remain exact in candidate and baseline');
 assert.equal(result.inflight,0,'No writes in flight');assert.equal(result.queued,0,'No queued document writes');
}
async function nativeLifecycle(p){
 const results=[];
 for(const [view,width,height] of [['desktop',1440,1000],['phone',390,1000]]){
  await p.setViewportSize({width,height});await select(p);
  const card=p.locator('#pane-timeline .ld.tl846.lc991').first();await card.scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>{const im=document.querySelector('#pane-timeline .ld.tl846.lc991 .b1247-location img');return im?.complete&&im.naturalWidth>0;},null,{timeout:15000});
  await p.waitForFunction(()=>{const s=BuildCards1247.stats();return s.active===0&&s.queued===0;},null,{timeout:15000});
  const before=await p.evaluate(()=>{const b=document.querySelector('#pane-timeline .ld.tl846.lc991 .b1247-location');window.__b1247EvictionProbe=b.querySelector('img');return {key:b.dataset.build1247Key,stats:BuildCards1247.stats()};});
  await p.evaluate(()=>{let node=document.getElementById('pane-timeline').parentElement;while(node&&node!==document.body&&!/auto|scroll/.test(getComputedStyle(node).overflowY))node=node.parentElement;node=node&&node!==document.body?node:document.scrollingElement;window.__b1247ScrollProbe={node,top:node.scrollTop};node.scrollTop=0;});
  await p.waitForFunction(()=>{const b=document.querySelector('#pane-timeline .ld.tl846.lc991 .b1247-location');return !b?.querySelector('img');},null,{timeout:10000});
  assert(await p.evaluate(()=>!window.__b1247EvictionProbe.getAttribute('src')&&!window.__b1247EvictionProbe.isConnected),'Scrolled-off native image must lose source and DOM attachment');
  await p.evaluate(()=>{const s=window.__b1247ScrollProbe;s.node.scrollTop=s.top;});
  await p.waitForFunction(()=>{const im=document.querySelector('#pane-timeline .ld.tl846.lc991 .b1247-location img');return im?.complete&&im.naturalWidth>0;},null,{timeout:15000});
  await p.waitForFunction(()=>{const s=BuildCards1247.stats();return s.active===0&&s.queued===0;},null,{timeout:15000});
  const returned=await p.evaluate(()=>BuildCards1247.stats());assert.equal(returned.drawn,before.stats.drawn,'Scroll reentry must reuse the retained thumbnail');
  await p.evaluate(()=>go('today'));
  await p.waitForFunction(()=>BuildCards1247.stats().attached===0&&BuildCards1247.stats().queued===0&&document.querySelectorAll('#pane-timeline .b1247-location img').length===0,null,{timeout:10000});
  await p.evaluate(()=>{state.day='2026-10-21';go('timeline');const s=window.__b1247ScrollProbe;if(s.node.isConnected)s.node.scrollTop=s.top;});
  await p.locator('#pane-timeline .ld.tl846.lc991').first().scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>{const im=document.querySelector('#pane-timeline .ld.tl846.lc991 .b1247-location img');return im?.complete&&im.naturalWidth>0;},null,{timeout:15000});
  await p.waitForFunction(()=>{const s=BuildCards1247.stats();return s.active===0&&s.queued===0;},null,{timeout:15000});
  const after=await p.evaluate(()=>({key:document.querySelector('#pane-timeline .ld.tl846.lc991 .b1247-location').dataset.build1247Key,stats:BuildCards1247.stats(),images:document.querySelectorAll('#pane-timeline .b1247-location img').length}));
  assert.equal(after.key,before.key,'Native tab return preserves the selected reference');assert.equal(after.stats.drawn,returned.drawn,'Tab return must reuse the retained thumbnail');
  assert(after.stats.cached<=16&&after.stats.attached<=16&&after.images<=16,'Native cache and image budgets');assert.equal(after.stats.peakActive,1,'One native draw including compaction');
  results.push({view,scrollSourceRemoved:true,scrollReentryReused:true,tabImagesEvicted:true,tabReentryReused:true,stats:after.stats});
 }
 await p.evaluate(()=>{delete window.__b1247EvictionProbe;delete window.__b1247ScrollProbe;});return results;
}
async function capture(p,label){const card=p.locator('#pane-timeline .ld.tl846.lc991').first();for(const [view,width,height] of [['desktop',1440,1000],['phone',390,1000]]){await p.setViewportSize({width,height});await card.scrollIntoViewIfNeeded();if(label==='after')await p.waitForFunction(()=>{const im=document.querySelector('#pane-timeline .ld.tl846.lc991 .b1247-location img');const s=BuildCards1247.stats();return im?.complete&&im.naturalWidth>0&&s.active===0&&s.queued===0;},null,{timeout:15000});await card.screenshot({path:process.env.OUT+'/'+label+'-'+view+'-card.png'});await p.screenshot({path:process.env.OUT+'/'+label+'-'+view+'-context.png'});}}
(async()=>{assert(process.env.BASE&&process.env.OUT&&process.env.STATE&&process.env.EXPECTED_PAGE_SHA&&process.env.EXPECTED_STATE_VERSION);
 fs.mkdirSync(process.env.OUT,{recursive:true});
 const pageBytes=fs.readFileSync(process.env.PAGE),baseBytes=fs.readFileSync(process.env.BASE),frozen=JSON.parse(fs.readFileSync(process.env.STATE));
 assert.equal(crypto.createHash('sha256').update(pageBytes).digest('hex'),process.env.EXPECTED_PAGE_SHA,'Exact reviewed preview required');
 assert.equal(frozen.version,Number(process.env.EXPECTED_STATE_VERSION),'Exact pinned record version required');
 let stripped=pageBytes.toString().replace(/<style id="buildcards1247-style">[\s\S]*?<\/style>\n/,'').replace(/<script id="buildcards1247-script">[\s\S]*?<\/script>\n/,'');
 if(process.env.PRODUCTION==='1'){
  assert(process.env.EXPECTED_BASE_SHA&&process.env.EXPECTED_BASE_VERSION,'Production base pin required');
  assert.equal(crypto.createHash('sha256').update(baseBytes).digest('hex'),process.env.EXPECTED_BASE_SHA,'Exact production predecessor required');
  const footer="+' · v12.47';",previous="+' · v"+process.env.EXPECTED_BASE_VERSION+"';";
  assert.equal(stripped.split(footer).length-1,1,'Production footer must occur once');stripped=stripped.replace(footer,previous);
  assert(!pageBytes.toString().includes('Build map-strip preview · not live'),'Production candidate must omit the preview-only notice');
 }
 assert.equal(stripped,baseBytes.toString(),'Removing added modules and only the intentional release footer must recover every original source/style byte');
 const s=await openCandidate(),p=s.page;try{
 assert.equal(s.baseline.pageSha256,process.env.EXPECTED_PAGE_SHA);assert.equal(s.baseline.version,Number(process.env.EXPECTED_STATE_VERSION));
 if(process.env.PRODUCTION==='1'){
  assert.equal(await p.evaluate(()=>BuildCards1247.release),'v12.47','Production module version');
  assert.equal(await p.locator('#pane-timeline .b1247-preview-note').count(),0,'No production preview notice');
  assert((await p.locator('#footL').textContent()).endsWith(' · v12.47'),'Runtime footer is v12.47');
 }
 console.log('Loaded exact candidate and pinned read-only record');
 await select(p);await p.locator('#pane-timeline .ld.tl846.lc991').first().scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('.b1247-location img'),null,{timeout:30000});
 assert(await p.evaluate(mountIdentity),'Mounting/removing strips must preserve complete native closed DOM in the same render');
 if(process.env.PRODUCTION==='1')assert.equal(await p.locator('#pane-timeline .b1247-preview-note').count(),0,'Mount must not create a production preview notice');
 const after=await p.evaluate(native);const dayStrip=await p.locator('#pane-timeline .daystrip [data-day]').evaluateAll(nodes=>nodes.map(n=>({day:n.dataset.day,tag:n.tagName,selected:n.classList.contains('on')})));
 await capture(p,'after');
 console.log('Captured current candidate and passed closed same-render DOM identity');
 const dispatch=await p.evaluate(()=>{const b=document.querySelector('.b1247-location'),L=Find1176.locate({kind:'asset',key:b.dataset.build1247Key});const oldGo=go,oldZoom=gate1156Zoom,oldSheet=state.sheet,oldSel=state.sel;let called=null,tab=null;try{go=t=>{tab=t};window.gate1156Zoom=(lat,lon,id)=>{called={lat,lon,id}};b.click();return {tab,called,expected:{lat:L.lat,lon:L.lon,id:L.id}};}finally{go=oldGo;window.gate1156Zoom=oldZoom;state.sheet=oldSheet;state.sel=oldSel;}});
 assert.equal(dispatch.tab,'map');assert.deepEqual(dispatch.called,dispatch.expected);
 const lifecycle=await nativeLifecycle(p);console.log('Native desktop/phone scroll and tab eviction/reentry passed');
 await p.setViewportSize({width:390,height:1000});await select(p);await p.locator('#pane-timeline .ld.tl846.lc991').first().scrollIntoViewIfNeeded();
 const stats=await p.evaluate(()=>BuildCards1247.stats());assert.equal(stats.peakActive,1);assert(stats.cached<=16);
 await p.locator('#pane-timeline .ld.tl846.lc991 .lc991-toggle').first().click();
 await p.waitForFunction(()=>document.querySelector('#pane-timeline .ld.tl846.lc991 .lc991-detail')?.hidden===false);
 assert(await p.evaluate(mountIdentity),'Mounting/removing strips must preserve complete native expanded DOM in the same render');
 const openAfter=await p.evaluate(native);
 await recordsUnchanged(p,frozen);assert.equal(s.counts.blocked,0);assert.equal(s.errors.length,0);console.log('Candidate expanded DOM identity and unchanged records passed');
 await p.route('https://gc500-production.up.railway.app/v/Coates-GC500-2026/',route=>route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(process.env.BASE)}));
 await p.reload({waitUntil:'load',timeout:180000});
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await p.setViewportSize({width:1440,height:1000});await select(p);const before=await p.evaluate(native);assert.deepEqual(after,before,'All native closed card text, controls, labels and identifiers must remain exact');
 assert.deepEqual(await p.locator('#pane-timeline .daystrip [data-day]').evaluateAll(nodes=>nodes.map(n=>({day:n.dataset.day,tag:n.tagName,selected:n.classList.contains('on')}))),dayStrip,'Approved date/weather card order and selection must remain exact');
 await capture(p,'before');
 await p.locator('#pane-timeline .ld.tl846.lc991 .lc991-toggle').first().click();await p.waitForFunction(()=>document.querySelector('#pane-timeline .ld.tl846.lc991 .lc991-detail')?.hidden===false);
 assert.deepEqual(await p.evaluate(native),openAfter,'All native expanded fields and actions must remain exact');
 await recordsUnchanged(p,frozen);assert.equal(s.counts.blocked,0);assert.equal(s.errors.length,0);
 const report={baseline:s.baseline,production:process.env.PRODUCTION==='1',productionPreviewNoticeAbsent:process.env.PRODUCTION==='1'?true:undefined,exactOriginalSourceAndStylesMatch:true,lifecycle,nativeCardsCompared:after.length,closedMountRemoveExactDomIdentity:true,expandedMountRemoveExactDomIdentity:true,closedNativeTextAndControlsMatch:true,expandedNativeTextAndControlsMatch:true,dateWeatherCardOrderSelectionMatch:true,mapActionDispatchMatchesLocation:true,candidateAndBaselineRecordsUnchanged:true,stats,errors:s.errors,blocked:s.counts.blocked};
 fs.writeFileSync(process.env.OUT+'/preview-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await s.browser.close();}})().catch(e=>{if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(process.env.OUT+'/failure-private.txt',e.stack||String(e));}console.error(String(e.message).split('\n')[0]);process.exit(1)});
