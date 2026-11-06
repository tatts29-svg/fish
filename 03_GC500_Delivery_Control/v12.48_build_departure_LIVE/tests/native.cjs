/* Author: Andrew Fisher. Read-only native Build departure presentation gate.
 * Private PAGE/BASE/STATE/FIXTURE/OUT inputs never enter source control.
 */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const saved=()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0),inflight:Object.keys(SYNC.inflight||{}).length});
const populated=d=>Object.fromEntries(Object.entries(d).filter(([,v])=>Object.keys(v||{}).length));
const cards=()=>[...document.querySelectorAll('#pane-timeline [data-tl846-load]')].map(c=>({id:c.dataset.tl846Load,controls:[...c.querySelectorAll('button,input,select,textarea,a')].map(n=>({tag:n.tagName,text:n.matches('.b1247-location')?n.getAttribute('aria-label'):n.textContent,attrs:[...n.attributes].filter(a=>a.name!=='data-picture1247'&&(a.name.startsWith('data-')||['href','type','name','value'].includes(a.name))).map(a=>[a.name,a.value])})),maps:[...c.querySelectorAll('.b1247-location')].map(n=>n.dataset.build1247Key)}));
async function select(p,key){
 const day=await p.evaluate(k=>{const d=calendarDays().find(d=>d.iso<'2026-10-23'&&d.deliveries.some(r=>r.a.key===k));if(!d)return null;state.day=d.iso;state.tlView='day';state.tlLoad=null;renderTimeline();return d.iso;},key);
 assert(day,'Fixture reference has a native Build date');
 await p.waitForSelector('#pane-timeline [data-tl841-ref="'+key+'"]');
 await p.waitForTimeout(300);return day;
}
(async()=>{
 for(const name of ['PAGE','BASE','STATE','FIXTURE','OUT','EXPECTED_PAGE_SHA'])assert(process.env[name],name+' required');
 assert.equal(digest(process.env.PAGE),process.env.EXPECTED_PAGE_SHA);
 const frozen=JSON.parse(fs.readFileSync(process.env.STATE)),fixture=JSON.parse(fs.readFileSync(process.env.FIXTURE));
 fs.mkdirSync(process.env.OUT,{recursive:true});const s=await openCandidate(),p=s.page;
 try{
  const report={author:'Andrew Fisher',page_sha256:digest(process.env.PAGE),base_sha256:digest(process.env.BASE),state_sha256:digest(process.env.STATE),state_version:frozen.version,cases:[],baseline_cases:[]};
  assert.equal(s.baseline.pageSha256,process.env.EXPECTED_PAGE_SHA);
  const projected=await p.evaluate(()=>holdAssets(()=>allAssets().map(a=>{const dep=Departure1211.status(a.key),native=timeline841State(a),shown=BuildDeparture1248.state(a,native);return {key:a.key,dep,native,shown};})));
  const full=projected.filter(x=>BuildReliable(x.dep)&&x.dep.complete&&x.dep.remaining===0&&!x.native.blocked);
  assert(full.length>0);full.forEach(x=>{assert.equal(x.shown.label,'Left site');assert.equal(x.shown.departed1248,true);assert.equal(x.shown.stage,5);assert.equal(x.shown.why,'Left site · '+x.dep.last);});
  const unchanged=projected.filter(x=>!BuildReliable(x.dep)||x.native.blocked||!x.dep.collected);
  unchanged.forEach(x=>assert.deepEqual(x.shown,x.native));
  report.full_projection_count=full.length;report.unchanged_projection_count=unchanged.length;
  const cases=fixture.full.concat(fixture.partial||[]);const candidateDays={};
  for(const key of cases){
   const day=await select(p,key);const card=p.locator('#pane-timeline [data-tl841-ref="'+key+'"]').locator('xpath=ancestor::*[@data-tl846-load][1]');
   const got=await card.evaluate((c,key)=>{const ref=c.querySelector('[data-tl841-ref="'+key+'"]'),dep=Departure1211.status(key);return {key,dep,status:ref.querySelector('.tl841-status')?.textContent,stamp:ref.querySelector('.build1248-stamp')?.textContent||'',lamps:[...ref.querySelectorAll('.tl841-unit')].map(x=>({label:x.textContent,lit:!!x.querySelector('.is-on')})),fullIndicator:!!ref.querySelector('[data-build1248-departed]'),bookings:[...c.querySelectorAll('[data-bw1197-load]')].map(n=>({refs:n.dataset.bw1197Load,text:n.textContent})),expectedStamp:Stamp1232.left(key)?(()=>{const d=document.createElement('div');d.innerHTML=Stamp1232.html(Stamp1232.left(key));return d.textContent;})():'',mapKeys:[...c.querySelectorAll('.b1247-location')].map(n=>n.dataset.build1247Key)};},key);
   if(got.dep.complete){assert.equal(got.status,'Left site');assert.equal(got.stamp,got.expectedStamp);assert.equal(got.fullIndicator,true);assert.deepEqual(got.lamps,[{label:'Finished',lit:true}]);for(const band of got.bookings)assert(!band.refs.split('/').includes(key),'Departed reference excluded from booking band');}
   else{assert(got.status.includes('On site'));assert(got.status.includes(got.dep.collected+' of '+(got.dep.collected+got.dep.remaining)+' left'));assert.equal(got.fullIndicator,false);assert.equal(got.stamp,'');}
   assert(got.mapKeys.includes(key),'Approved compact map strip retained');
   candidateDays[day]={cards:await p.evaluate(cards),weather:await p.locator('.daystrip [data-day]').evaluateAll(ns=>ns.map(n=>({day:n.dataset.day,selected:n.classList.contains('on')})))};
   if(key===fixture.full[0]){for(const [label,width,height]of[['desktop',1440,1000],['phone',390,844]]){await p.setViewportSize({width,height});await card.scrollIntoViewIfNeeded();await card.screenshot({path:process.env.OUT+'/departed-'+label+'.png'});}await card.locator('.lc991-toggle').click();await p.waitForFunction(id=>document.querySelector('[data-tl846-load="'+id+'"] .lc991-detail')?.hidden===false,await card.getAttribute('data-tl846-load'));assert((await card.locator('.lc991-detail button,.lc991-detail input,.lc991-detail a').count())>0,'Expanded native details and controls remain');}
   report.cases.push(got);
  }
  const after=await p.evaluate(saved);assert.deepEqual(populated(after.docs),populated(frozen.docs));assert.equal(after.queued,0);assert.equal(after.inflight,0);
  assert.equal(s.errors.length,0);assert.equal(s.consoleErrors.length,0);assert.equal(s.counts.blocked,0);
  await p.route('https://gc500-production.up.railway.app/v/Coates-GC500-2026/',r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(process.env.BASE)}));
  await p.reload({waitUntil:'load',timeout:180000});await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  for(const key of fixture.full){const day=await select(p,key);const baseline=await p.locator('#pane-timeline [data-tl841-ref="'+key+'"] .tl841-status').textContent();report.baseline_cases.push({key,status:baseline});assert(baseline!=='Left site','Baseline reproduces wrong Build status');assert.deepEqual(await p.evaluate(cards),candidateDays[day].cards,'Original controls and map strips preserved');assert.deepEqual(await p.locator('.daystrip [data-day]').evaluateAll(ns=>ns.map(n=>({day:n.dataset.day,selected:n.classList.contains('on')}))),candidateDays[day].weather,'Date/weather order and selection preserved');}
  const final=await p.evaluate(saved);assert.deepEqual(populated(final.docs),populated(frozen.docs));assert.equal(final.queued,0);assert.equal(final.inflight,0);assert.equal(s.errors.length,0);assert.equal(s.consoleErrors.length,0);assert.equal(s.counts.blocked,0);
  report.records_preserved=true;report.errors=s.errors;report.console_errors=s.consoleErrors;report.operational_writes=s.counts.blocked;report.native_controls_maps_weather_preserved=true;fs.writeFileSync(process.env.OUT+'/native-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,cases:report.cases.length,fullProjection:full.length,unchanged:unchanged.length,errors:0,writes:0}));
 }finally{await s.browser.close();}
 function BuildReliable(d){return !!d&&d.known===true&&!d.unknown&&Array.isArray(d.issues)&&!d.issues.length&&Number.isFinite(d.collected)&&d.collected>0&&Number.isFinite(d.remaining)&&d.remaining>=0;}
})().catch(e=>{if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(process.env.OUT+'/failure.txt',e.stack||String(e));}console.error(e.message);process.exit(1);});
