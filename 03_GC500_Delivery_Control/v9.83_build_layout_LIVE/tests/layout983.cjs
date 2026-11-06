// Author: Andrew Fisher. Read-only Build layout and navigation checks.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
let servedHash;
if(process.env.PUBLIC==='1') {const fetcher=require('../../toolchain/harness/curlfetch'),original=fetcher.curlFetch;fetcher.curlFetch=async function(url,...args){const r=await original(url,...args);if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))servedHash=crypto.createHash('sha256').update(r.body).digest('hex');return r;};}
const {open}=require('../../toolchain/harness/open_page');
(async()=>{const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1';if(!publicMode)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.EXPECTED_SHA);
const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#timeline',mobile,W:mobile?390:1440,H:900}),p=h.page;let checks=0;const check=(x,t)=>{assert(x,t);checks++};try{
await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});await p.evaluate(()=>go('timeline'));await p.waitForTimeout(250);
const before=await p.evaluate(()=>({native:JSON.stringify(S),dates:calendarDays().map(d=>({iso:d.iso,in:d.deliveries.map(r=>r.a.key),out:d.removals.map(r=>r.a.key)})),money:JSON.stringify(pl770Model())}));
if(publicMode){check(h.counts.page===0,'No HTML substitution');check(servedHash===process.env.EXPECTED_SHA,'Exact public source');}
check(await p.evaluate(()=>TABS.find(t=>t[0]==='timeline')[1]==='Build'),'Navigation label Build');
check((await p.locator('#panehead-timeline').textContent()).startsWith('Build —'),'Accessible heading Build');
const geometry=await p.evaluate(()=>{const s=document.querySelector('#pane-timeline .day.on'),r=s.getBoundingClientRect(),f=s.querySelector('.dface').getBoundingClientRect(),weather=s.querySelector('.dwx').getBoundingClientRect(),data=s.querySelector('.dpan').getBoundingClientRect();return {width:r.width,height:r.height,weatherRight:weather.right,faceRight:f.right,dataRight:data.right,pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,phaseWhiteSpace:getComputedStyle(s.querySelector('.dwk')).whiteSpace};});
if(process.env.OUTDIR){fs.mkdirSync(process.env.OUTDIR,{recursive:true});await p.screenshot({path:process.env.OUTDIR+'/initial.png'});}
check(geometry.width>=280,'Wider date cards');check(geometry.pageWidth<=geometry.viewport+1,'No page horizontal overflow');check(geometry.weatherRight<=geometry.faceRight+1&&geometry.dataRight<=geometry.faceRight+1,'Weather and counts fit');check(geometry.phaseWhiteSpace==='normal','Phase can wrap');
check(await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .day .dwx')].every(el=>el.firstElementChild.getBoundingClientRect().right<=el.closest('.dface').getBoundingClientRect().right+1)),'All forecast and no-forecast plates fit');
const weather=p.locator('#pane-timeline .day.on[data-weather-card]');
if(await weather.count()){
 check(await p.evaluate(()=>{const r=WX818.report();return r.cards.filter(c=>c.selected).length<=1;}),'At most one active weather scene');
 if(!mobile){const box=await weather.boundingBox();await p.mouse.move(box.x+box.width*.8,box.y+box.height*.35);await p.waitForTimeout(150);check(await weather.evaluate(el=>el.style.getPropertyValue('--wx983-yaw')!==''),'Pointer-driven weather depth');await p.mouse.move(0,0);await p.waitForTimeout(100);check(await weather.evaluate(el=>el.style.getPropertyValue('--wx983-yaw')===''),'Depth resets on leave');}
}
const day=await p.locator('#pane-timeline .day.on').getAttribute('data-day'),scrollBefore=await p.locator('#pane-timeline .daystrip').evaluate(x=>x.scrollLeft);
await p.locator('#pane-timeline .daynav [data-day-step="1"]').click();await p.waitForTimeout(450);
check(await p.evaluate(d=>state.day!==d,day),'Next changes day');
check(await p.locator('#pane-timeline .day.on').evaluate(el=>{const r=el.getBoundingClientRect(),s=el.closest('.daystrip').getBoundingClientRect();return r.left>=s.left-2&&r.right<=s.right+2;}),'Selected day visible after motion');
if(!mobile)check(Math.abs(await p.locator('#pane-timeline .daystrip').evaluate(x=>x.scrollLeft)-scrollBefore)<2,'No strip jump for adjacent visible day');
await p.locator('#pane-timeline .daynav [data-day-step="-1"]').click();await p.waitForTimeout(450);check(await p.evaluate(d=>state.day===d,day),'Previous returns to day');
await p.emulateMedia({reducedMotion:'reduce'});check(await p.evaluate(()=>Build983.reduced()),'Reduced motion recognised');await p.locator('#pane-timeline .daynav [data-day-step="1"]').click();await p.waitForTimeout(200);
check(await p.locator('#pane-timeline .day.on').evaluate(el=>el.getAnimations().filter(a=>a.effect?.getKeyframes().some(k=>k.transform==='translateY(3px)')).length===0),'No navigation animation under reduced motion');
await p.emulateMedia({reducedMotion:'no-preference'});
await p.evaluate(d=>{state.day=d;renderTimeline();},day);
const after=await p.evaluate(()=>({native:JSON.stringify(S),dates:calendarDays().map(d=>({iso:d.iso,in:d.deliveries.map(r=>r.a.key),out:d.removals.map(r=>r.a.key)})),money:JSON.stringify(pl770Model())}));
check(before.native===after.native,'Native record unchanged');check(JSON.stringify(before.dates)===JSON.stringify(after.dates),'Programme rows unchanged');check(before.money===after.money,'Financial amounts unchanged');check(h.errors.length===0,'No errors');check(h.counts.blocked===0,'No service writes');
if(process.env.OUTDIR){fs.mkdirSync(process.env.OUTDIR,{recursive:true});await p.screenshot({path:process.env.OUTDIR+'/build.png'});const list=p.locator('#pane-timeline .ld.tl846').first();if(await list.count()){await list.scrollIntoViewIfNeeded();await p.screenshot({path:process.env.OUTDIR+'/item.png'});}}
const result={author:'Andrew Fisher',pass:true,checks,mobile,actualPublic:publicMode,sha256:process.env.EXPECTED_SHA,geometry,errors:h.errors.length,writes:h.counts.blocked};if(process.env.OUTDIR)fs.writeFileSync(process.env.OUTDIR+'/layout.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
