/* Author: Andrew Fisher. Synthetic completion, lifecycle and interaction regressions; no network. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert');
const {chromium}=require('playwright');
const source=fs.readFileSync(path.join(__dirname,'map1100_src.js'),'utf8'),css=fs.readFileSync(path.join(__dirname,'map1100.css'),'utf8'),state=fs.readFileSync(path.join(__dirname,'../servicing_tracker_DRAFT/panel_mockup/state.js'),'utf8');
const model=require('./map1100_src.js');
let checks=0;function check(ok,name){assert(ok,name);checks++;console.log('PASS '+name);}
check(JSON.stringify(model.hull([{x:0,y:0},{x:10,y:0},{x:5,y:5},{x:10,y:10},{x:0,y:10},{x:0,y:0}]))===JSON.stringify([{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}]),'hull excludes duplicates and interior points');
for(const pts of [[{x:0,y:0}],[{x:10,y:10},{x:90,y:10}]]){const p=model.envelope(pts,22,100,100);check(p.length>=3&&p.every(v=>v.x>=0&&v.x<=100&&v.y>=0&&v.y<=100),'single and collinear envelopes clip to drawing');}
const chain=Array.from({length:12},(_,i)=>({id:String(i),x:i*40,y:0})),groups=model.markerClusters(chain,54);
check(groups.length>1&&groups.every(g=>g.every(p=>g.every(q=>Math.hypot(p.x-q.x,p.y-q.y)<=54))),'marker clusters cannot chain beyond their diameter');
check(groups.flat().length===chain.length&&new Set(groups.flat().map(p=>p.id)).size===chain.length,'bounded clustering preserves each point exactly once');
check(JSON.stringify(groups)===JSON.stringify(model.markerClusters(chain.slice().reverse(),54)),'marker grouping is deterministic across input order');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox'],env:Object.fromEntries(Object.entries(process.env).filter(([k])=>!/TOKEN|SECRET|PASSWORD|KEY/i.test(k)))});try{
const context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage();let requests=0;const errors=[];
await page.route(/^https?:/,r=>{requests++;r.abort();});page.on('pageerror',e=>errors.push(e.message));
await page.setContent('<style>body{margin:0;font:16px Arial}'+css+'</style><div id="map"></div><script>'+state+'\n'+source+`\n
window.visible=false;window.docHidden=false;Object.defineProperty(document,'hidden',{get:()=>window.docHidden,configurable:true});
window.IntersectionObserver=class{constructor(cb){this.cb=cb;window.intersector=this;}observe(node){this.node=node;}disconnect(){this.disconnected=true;}set(v){this.cb([{isIntersecting:v}]);}};
var day='2026-10-23',next='2026-10-24',now=Date.parse('2026-10-24T12:00:00Z');
var D={days:[{id:day,label:'First',plan:'night'},{id:next,label:'Second',plan:'night'}],extras:['refill'],plans:{fwf:{night:['pump','clean','refill']},tank:{night:['pump']}},areas:[{n:1,name:'North',refs:[{ref:'QA1',lines:[{id:'L1',kind:'fwf',qty:2}]},{ref:'QA2',lines:[{id:'L2',kind:'tank',qty:1}]}]},{n:2,name:'South',refs:[{ref:'QA3',lines:[{id:'L3',kind:'tank',qty:1}]}]}]};
var image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600"><rect width="1000" height="600" fill="#eee"/><path d="M0 0L1000 600M0 600L1000 0" stroke="#777"/></svg>');
var G={rect:[0,0,1000,600],px:[1000,600],image,detailImage:image,detailPx:[1000,600],refs:{QA1:{title:'Toilets',lines:{L1:{type:'FWF',point:{x:250,y:250}}}},QA2:{lines:{L2:{type:'Waste tank',point:{x:400,y:280}}}},QA3:{lines:{L3:{type:'Waste tank',point:{x:800,y:400}}}}}};
var events=[{id:'a',line:'L1',task:'pump',day,at:'2026-10-23T12:00:00Z',done:true},{id:'b',line:'L1',task:'clean',day,at:'2026-10-23T12:00:00Z',done:true},{id:'c',line:'L2',task:'pump',day,at:'2026-10-23T12:00:00Z',done:true}];
var M={D,S:SvcState,now,day,geometry:G,events:[]};window.update=()=>SvcMap1099.update(document.getElementById('map'),M);update();
</script>`);
const frame=()=>page.evaluate(()=>new Promise(requestAnimationFrame));await frame();
check(await page.locator('.svc1100-detail').getAttribute('src')===null,'offscreen detail does not start decoding');
await page.evaluate(()=>intersector.set(true));await page.waitForFunction(()=>document.querySelector('.svc1100-detail').classList.contains('ready'));
check(await page.locator('.svc1100-detail').evaluate(e=>e.naturalWidth===1000),'visible detail decodes in original world');
check(await page.locator('.svc1100-base').evaluate(e=>getComputedStyle(e).visibility==='hidden'),'decoded detail avoids painting the preview twice');
check(await page.locator('.svc1100-region.done').count()===0,'empty progress has no completed area glow');
await page.evaluate(()=>{M.events=events.slice(0,1);update();});await frame();check(await page.locator('.svc1100-region.done').count()===0,'partial area is not complete');
await page.evaluate(()=>{M.events=events.map(e=>({...e,local:true}));update();});await frame();check(await page.locator('.svc1100-region.done').count()===0&&await page.locator('.svc1099-pin.done').count()===0,'pending completion is never saved-green');
await page.evaluate(()=>{M.events=events;update();});await frame();
check(await page.locator('.svc1100-region[data-region="1"].done').count()===1,'saved full area receives completion glow');
check(await page.locator('.svc1100-region[data-region="2"].done').count()===0,'other area remains incomplete');
check(await page.locator('.svc1100-region.done .svc1100-region-glow').evaluate(e=>getComputedStyle(e).animationIterationCount==='infinite'),'completed area pulse continues after arrival');
check(await page.locator('.svc1099-pin.done').first().evaluate(e=>getComputedStyle(e,'::before').animationName==='svc1100-marker-breathe'),'completed reference has pulse ring');
await page.emulateMedia({reducedMotion:'reduce'});check(await page.locator('.svc1100-region.done .svc1100-region-glow').evaluate(e=>getComputedStyle(e).animationName==='none')&&await page.locator('.svc1099-pin.done').first().evaluate(e=>getComputedStyle(e,'::before').animationName==='none'),'reduced motion retains completion without pulse');await page.emulateMedia({reducedMotion:'no-preference'});
await page.evaluate(()=>{window.docHidden=true;document.dispatchEvent(new Event('visibilitychange'));});check(await page.locator('.svc1100-region.done .svc1100-region-glow').evaluate(e=>getComputedStyle(e).animationPlayState==='paused'),'hidden document pauses animation');
await page.evaluate(()=>{window.docHidden=false;document.dispatchEvent(new Event('visibilitychange'));intersector.set(false);});check(await page.locator('.svc1100-region.done .svc1100-region-glow').evaluate(e=>getComputedStyle(e).animationPlayState==='paused'),'offscreen map pauses animation');await page.evaluate(()=>intersector.set(true));
await page.evaluate(()=>{window.nodes=[...document.querySelectorAll('.svc1099-pin')];window.badges=[...document.querySelectorAll('.svc1099-area-badge')];document.querySelector('.svc1099-view').focus();});
for(let i=0;i<10;i++){await page.keyboard.press('ArrowRight');await frame();}
check(await page.evaluate(()=>nodes.every(n=>n.isConnected)&&badges.every(n=>n.isConnected)&&document.activeElement===document.querySelector('.svc1099-view')),'pan keeps marker and badge nodes and keyboard focus');
check(await page.evaluate(()=>new Set([...document.querySelectorAll('.svc1099-pin')].map(n=>n.dataset.mapRefs)).size===document.querySelectorAll('.svc1099-pin').length),'no duplicate marker groups');
await page.evaluate(()=>{M.events=events.concat({id:'undo',line:'L1',task:'clean',day,done:false,undoes:['b']});update();});await frame();check(await page.locator('.svc1100-region.done').count()===0,'undo removes area completion');
await page.evaluate(()=>{M.events=events;M.day=next;update();});await frame();check(await page.locator('.svc1100-region.done').count()===0&&await page.locator('[data-svc1099-overall]').getAttribute('data-d')==='0','selected night resets visible completion');
await page.evaluate(()=>{M.geometry={...G,refs:{...G.refs,QA2:{lines:{L2:{type:'Waste tank',point:{x:800,y:100}}}}}};update();});await frame();
check(await page.locator('[data-region="1"]').count()===2&&await page.locator('[data-svc1099-area-badge="1"]').count()===1,'distant envelopes share one area badge');
await page.setViewportSize({width:390,height:844});await page.locator('[data-map-fit]').click();await frame();await frame();
check(await page.locator('.svc1099-area-badge:not([hidden])').evaluateAll(es=>es.length>0&&es.every(e=>e.classList.contains('compact')&&e.getBoundingClientRect().width<=34)),'phone overview uses compact area numbers');
check(await page.locator('.svc1099-pin:not([hidden])').evaluateAll(es=>es.length>0&&es.every(e=>e.getBoundingClientRect().width>=44&&e.querySelector('svg').getBoundingClientRect().width===28&&getComputedStyle(e.querySelector('.svc1099-pin-label')).display==='none')),'phone overview keeps 44px targets with compact symbols');
check(await page.locator('.svc1099-area-badge:not([hidden])').evaluateAll(es=>es.every((e,i)=>es.slice(i+1).every(f=>{const a=e.getBoundingClientRect(),b=f.getBoundingClientRect();return a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;}))),'visible area badges do not overlap');
await page.locator('[data-map-area]').selectOption('1');await frame();
check(await page.locator('.svc1099').evaluate(e=>!e.classList.contains('overview-compact'))&&await page.locator('.svc1099-pin:not([hidden])').evaluateAll(es=>es.every(e=>getComputedStyle(e.querySelector('.svc1099-pin-label')).display!=='none')),'area selection restores full reference labels');
await page.locator('[data-map-area]').selectOption('');await page.setViewportSize({width:1200,height:900});await frame();
await page.evaluate(()=>{window.decodeAttempts=0;window.decodeOriginal=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){if(this.src.includes('invalid'))decodeAttempts++;return decodeOriginal.call(this);};M.day=day;M.geometry={...G,detailImage:'data:image/png;base64,invalid'};update();});await page.waitForFunction(()=>document.querySelector('.svc1099').dataset.mapDetail==='preview');
check(await page.locator('.svc1100-base').evaluate(e=>e.complete&&e.naturalWidth>0&&getComputedStyle(e).visibility!=='hidden')&&!(await page.locator('.svc1100-detail').evaluate(e=>e.classList.contains('ready'))),'failed detail decoding keeps base map visible');
for(let i=0;i<4;i++){await page.evaluate(()=>update());await page.waitForTimeout(180);}
check(await page.evaluate(()=>decodeAttempts===1),'failed detail is not retried on progress polling');
await page.evaluate(()=>{HTMLImageElement.prototype.decode=decodeOriginal;});
await page.evaluate(()=>{M.refresh=()=>new Promise(r=>window.finishRefresh=r);update();});await page.locator('[data-map-refresh]').click();check(await page.locator('[data-map-refresh]').isDisabled()&&await page.locator('[data-map-refresh]').getAttribute('aria-busy')==='true','refresh acknowledges immediately and blocks duplicate clicks');
await page.evaluate(()=>finishRefresh());await page.waitForFunction(()=>!document.querySelector('[data-map-refresh]').disabled);check(await page.locator('[data-map-refresh]').innerText()==='Refresh progress','refresh settles without losing button');
await page.evaluate(()=>{M.refresh=()=>new Promise((r,j)=>window.failRefresh=j);update();});await page.locator('[data-map-refresh]').click();await page.evaluate(()=>{SvcMap1099.clear(document.getElementById('map'));failRefresh(Error('synthetic read error'));});await frame();check(await page.locator('.svc1099').count()===0,'destroy during pending refresh cleans map safely');
check(requests===0,'zero network requests');check(errors.length===0,'zero script or unhandled rejection errors');await context.close();
console.log(JSON.stringify({passed:checks,failed:0,synthetic:true}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
