/* Author: Andrew Fisher. Native read-only Demob weather continuity through real card renders. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {open}=require('../../toolchain/harness/open_page');
const OUT=process.env.OUT;assert(OUT&&path.isAbsolute(OUT));assert(process.env.PAGE||process.env.LIVE==='1');assert(!path.resolve(OUT).startsWith(path.resolve(__dirname,'../../..')+path.sep));fs.mkdirSync(OUT,{recursive:true,mode:0o700});
(async()=>{
 const s=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE,hash:'#demob',mobile:true,W:390,H:844,dpr:1});const p=s.page,consoleErrors=[];p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,180));});
 try{
  await p.waitForFunction(()=>window.WeatherReuse1300&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&!!wxfDay(todayIso()),null,{timeout:120000});
  const current='#pane-demob .dc996-day[data-dday816="'+await p.evaluate(()=>todayIso())+'"]';await p.locator(current).scrollIntoViewIfNeeded();await p.waitForTimeout(400);
  await p.evaluate(()=>{
   const all=()=>[...document.querySelectorAll('#pane-demob .dc996-day')];window.__weatherStability1300={all};
   __weatherStability1300.snapshot=()=>({at:performance.now(),record:JSON.stringify(S),cards:all().map(c=>({date:c.dataset.dday816,scene:c.querySelector('.wm-card-scene'),reading:c.querySelector('.bc984-weather-reading'),animations:c.querySelector('.wm-card-scene')?.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.currentTime)).map(a=>({target:a.effect.target,name:a.animationName,time:a.currentTime,running:a.playState==='running'}))||[]}))});
   __weatherStability1300.compare=(before)=>({nodesKept:before.cards.every(old=>{const c=all().find(c=>c.dataset.dday816===old.date);return c&&c.querySelector('.wm-card-scene')===old.scene&&c.querySelector('.bc984-weather-reading')===old.reading;}),recordUnchanged:JSON.stringify(S)===before.record,phases:before.cards.flatMap(old=>{const c=all().find(c=>c.dataset.dday816===old.date);return old.animations.map(a=>{const next=c.querySelector('.wm-card-scene').getAnimations({subtree:true}).find(n=>n.effect.target===a.target&&n.animationName===a.name);return {running:a.running,before:a.time,after:next?.currentTime??null,elapsed:performance.now()-before.at};});})});
  });
  const unchanged=await p.evaluate(()=>{const old=__weatherStability1300.snapshot();renderDemob816();return __weatherStability1300.compare(old);});
  assert(unchanged.nodesKept);assert(unchanged.recordUnchanged);assert(unchanged.phases.length>0);for(const a of unchanged.phases){assert(a.after!==null);assert(a.after>=a.before-1,'Animation phase must not restart');assert(a.after-a.before<=a.elapsed+120,'Animation phase cannot jump forward');}
  await p.evaluate(()=>{__weatherStability1300.beforeClick=__weatherStability1300.snapshot();});
  const past=p.locator('#pane-demob .dc996-day[data-dday816="2026-11-03"]');await past.scrollIntoViewIfNeeded();await past.click();await p.waitForFunction(()=>DM816.sel==='2026-11-03');
  const selection=await p.evaluate(()=>__weatherStability1300.compare(__weatherStability1300.beforeClick));assert(selection.nodesKept);assert(selection.recordUnchanged);
  const facts=await p.evaluate(()=>{
   const old=__weatherStability1300.snapshot(),native=DailyStaff988.day,day=todayIso();
   try{DailyStaff988.day=function(iso){return iso===day?{...native(iso),count:1,names:['Availability continuity check'],unnamed:0}:native(iso);};renderDemob816();const c=__weatherStability1300.all().find(c=>c.dataset.dday816===day);return {...__weatherStability1300.compare(old),freshNativeFacts:c.querySelector('.bc984-names').textContent.includes('Availability continuity check')};}
   finally{DailyStaff988.day=native;renderDemob816();}
  });assert(facts.nodesKept);assert(facts.freshNativeFacts);assert(facts.recordUnchanged);
  const changed=await p.evaluate(()=>{
   const before=__weatherStability1300.snapshot(),saved=WXF.days,day=todayIso(),original=saved[day];
   try{WXF.days={...saved,[day]:{...original,max_c:original.max_c+2,code:original.code===1000?1006:1000}};renderDemob816();const all=__weatherStability1300.all(),c=all.find(c=>c.dataset.dday816===day);return {currentChanged:c.querySelector('.wm-card-scene')!==before.cards.find(c=>c.date===day).scene,othersKept:before.cards.filter(c=>c.date!==day).every(old=>all.find(c=>c.dataset.dday816===old.date).querySelector('.wm-card-scene')===old.scene),freshReading:c.querySelector('.bc984-temperature').textContent.includes(Math.round(original.max_c+2)+'°'),recordUnchanged:JSON.stringify(S)===before.record};}
   finally{WXF.days=saved;renderDemob816();}
  });for(const [k,v]of Object.entries(changed))assert(v,k);
  await p.locator(current).scrollIntoViewIfNeeded();await p.locator(current).click();await p.waitForTimeout(300);
  await p.locator('[data-dc996-pause]').click();
  const paused=await p.evaluate(()=>{const old=__weatherStability1300.snapshot();renderDemob816();return {...__weatherStability1300.compare(old),allPaused:__weatherStability1300.all().every(c=>c.dataset.bc984Motion==='off')};});assert(paused.nodesKept);assert(paused.allPaused);for(const a of paused.phases)assert(Math.abs(a.after-a.before)<2,'Paused phase must stay fixed');
  await p.locator('[data-dc996-pause]').click();await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);assert(await p.evaluate(()=>__weatherStability1300.all().every(c=>c.dataset.bc984Motion==='off')));await p.emulateMedia({reducedMotion:'no-preference'});
  await p.evaluate(()=>{__weatherStability1300.beforeScroll=__weatherStability1300.snapshot();const strip=document.querySelector('#pane-demob .daystrip');__weatherStability1300.scroll=strip.scrollLeft;strip.scrollLeft=0;});await p.waitForTimeout(150);
  assert(await p.evaluate(()=>document.querySelector('#pane-demob .dc996-day[data-dday816="'+todayIso()+'"]').dataset.bc984Motion==='off'));
  await p.evaluate(()=>{document.querySelector('#pane-demob .daystrip').scrollLeft=__weatherStability1300.scroll;});await p.waitForTimeout(150);
  const offscreen=await p.evaluate(()=>({nodesKept:__weatherStability1300.compare(__weatherStability1300.beforeScroll).nodesKept,resumed:document.querySelector('#pane-demob .dc996-day[data-dday816="'+todayIso()+'"]').dataset.bc984Motion==='on'}));assert(offscreen.nodesKept);assert(offscreen.resumed);
  await p.locator(current).scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'current-day-continuous.png')});
  assert.deepEqual(s.errors,[]);assert.deepEqual(consoleErrors,[]);assert.equal(s.counts.blocked,0);
  const report={author:'Andrew Fisher',passed:true,candidateSha256:process.env.PAGE?crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'):null,live:process.env.LIVE==='1',unchanged,selection:{nodesKept:selection.nodesKept,recordUnchanged:selection.recordUnchanged},nativeFacts:{nodesKept:facts.nodesKept,fresh:facts.freshNativeFacts,recordUnchanged:facts.recordUnchanged},changed,paused:{nodesKept:paused.nodesKept,allPaused:paused.allPaused},offscreen,reducedMotion:true,report:await p.evaluate(()=>DemobCards996.weatherReuse()),errors:s.errors,consoleErrors,attemptedRecordWrites:s.counts.blocked};fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS native no-change render, day selection, weather phase continuity, fresh native facts, genuine forecast change and pause/reduced motion');
 }finally{await s.browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({message:e.message,stack:e.stack},null,2)+'\n');console.error(e.stack);process.exitCode=1;});
