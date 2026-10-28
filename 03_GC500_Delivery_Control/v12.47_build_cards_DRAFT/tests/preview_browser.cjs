/* Author: Andrew Fisher. Read-only actual-page preview preservation and capture.
 * BASE and PAGE are private complete HTMLs; STATE and OUT stay outside the repository.
 */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
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
async function capture(p,label){const card=p.locator('#pane-timeline .ld.tl846.lc991').first();for(const [view,width,height] of [['desktop',1440,1000],['phone',390,1000]]){await p.setViewportSize({width,height});await card.scrollIntoViewIfNeeded();await p.waitForTimeout(800);await card.screenshot({path:process.env.OUT+'/'+label+'-'+view+'-card.png'});await p.screenshot({path:process.env.OUT+'/'+label+'-'+view+'-context.png'});}}
(async()=>{assert(process.env.BASE&&process.env.OUT);const s=await openCandidate(),p=s.page;try{
 await select(p);await p.locator('#pane-timeline .ld.tl846.lc991').first().scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('.b1247-location img'),null,{timeout:30000});
 assert(await p.evaluate(mountIdentity),'Mounting/removing strips must preserve complete native closed DOM in the same render');
 const after=await p.evaluate(native);const dayStrip=await p.locator('#pane-timeline .daystrip [data-day]').evaluateAll(nodes=>nodes.map(n=>({day:n.dataset.day,tag:n.tagName,selected:n.classList.contains('on')})));
 await capture(p,'after');
 const dispatch=await p.evaluate(()=>{const b=document.querySelector('.b1247-location'),L=Find1176.locate({kind:'asset',key:b.dataset.build1247Key});const oldGo=go,oldZoom=gate1156Zoom,oldSheet=state.sheet,oldSel=state.sel;let called=null,tab=null;try{go=t=>{tab=t};window.gate1156Zoom=(lat,lon,id)=>{called={lat,lon,id}};b.click();return {tab,called,expected:{lat:L.lat,lon:L.lon,id:L.id}};}finally{go=oldGo;window.gate1156Zoom=oldZoom;state.sheet=oldSheet;state.sel=oldSel;}});
 assert.equal(dispatch.tab,'map');assert.deepEqual(dispatch.called,dispatch.expected);
 const stats=await p.evaluate(()=>BuildCards1247.stats());assert.equal(stats.peakActive,1);assert(stats.cached<=16);
 await p.locator('#pane-timeline .ld.tl846.lc991 .lc991-toggle').first().click();
 await p.waitForFunction(()=>document.querySelector('#pane-timeline .ld.tl846.lc991 .lc991-detail')?.hidden===false);
 assert(await p.evaluate(mountIdentity),'Mounting/removing strips must preserve complete native expanded DOM in the same render');
 const openAfter=await p.evaluate(native);
 await p.route('https://gc500-production.up.railway.app/v/Coates-GC500-2026/',route=>route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(process.env.BASE)}));
 await p.reload({waitUntil:'load',timeout:180000});
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await p.setViewportSize({width:1440,height:1000});await select(p);const before=await p.evaluate(native);assert.deepEqual(after,before,'All native closed card text, controls, labels and identifiers must remain exact');
 assert.deepEqual(await p.locator('#pane-timeline .daystrip [data-day]').evaluateAll(nodes=>nodes.map(n=>({day:n.dataset.day,tag:n.tagName,selected:n.classList.contains('on')}))),dayStrip,'Approved date/weather card order and selection must remain exact');
 await capture(p,'before');
 await p.locator('#pane-timeline .ld.tl846.lc991 .lc991-toggle').first().click();await p.waitForFunction(()=>document.querySelector('#pane-timeline .ld.tl846.lc991 .lc991-detail')?.hidden===false);
 assert.deepEqual(await p.evaluate(native),openAfter,'All native expanded fields and actions must remain exact');
 const docs=await p.evaluate(()=>JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))))),frozen=JSON.parse(fs.readFileSync(process.env.STATE));
 const populated=x=>Object.fromEntries(Object.entries(x).filter(([,v])=>Object.keys(v).length));assert.deepEqual(populated(docs),populated(frozen.docs));assert.equal(s.counts.blocked,0);assert.equal(s.errors.length,0);
 const report={baseline:s.baseline,nativeCardsCompared:after.length,closedMountRemoveExactDomIdentity:true,expandedMountRemoveExactDomIdentity:true,closedNativeTextAndControlsMatch:true,expandedNativeTextAndControlsMatch:true,dateWeatherCardOrderSelectionMatch:true,mapActionDispatchMatchesLocation:true,recordUnchanged:true,stats,errors:s.errors,blocked:s.counts.blocked};
 fs.writeFileSync(process.env.OUT+'/preview-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await s.browser.close();}})().catch(e=>{console.error(String(e.message).split('\n')[0]);process.exit(1)});
