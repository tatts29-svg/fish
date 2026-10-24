/* Author: Andrew Fisher. Synthetic saved-progress presentation and stable meter checks. No network or record writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert');
const {chromium}=require('playwright');
const root=__dirname,source=fs.readFileSync(path.join(root,'progress1102_src.js'),'utf8'),css=fs.readFileSync(path.join(root,'progress1102.css'),'utf8'),panel=fs.readFileSync(path.join(root,'panel1102_src.js'),'utf8');
const oldCSS=fs.readFileSync(path.join(root,'../servicing_tracker_DRAFT/panel_mockup/panel.css'),'utf8').replaceAll('svc1063','svc1067'),stateSrc=fs.readFileSync(path.join(root,'../servicing_tracker_DRAFT/panel_mockup/state.js'),'utf8');
const helper=require('./progress1102_src.js');let checks=0;function check(ok,name){assert(ok,name);checks++;console.log('PASS '+name);}
function options(pct,extra={}){return {pct,d:pct,w:100,refsDone:pct===100?5:0,refs:5,savedDone:pct===100,key:'test',label:'Synthetic servicing',...extra};}
for(const [pct,reached]of [[0,0],[19,0],[20,1],[39,1],[40,2],[60,3],[80,4],[99,4],[100,5]])check(helper.state(options(pct)).reached===reached,'race-light milestone '+pct+'%');
check(!helper.state(options(100,{pending:true})).done&&helper.state(options(100,{pending:true})).reached===4,'pending100 never green');
check(!helper.state(options(100,{savedDone:false})).done,'unconfirmed100 never green');
check(!helper.state(options(100,{w:0,d:0,refs:0,refsDone:0})).done,'empty scope never green');
check(!helper.state(options(100,{d:99})).done,'rounded100 cannot hide unfinished jobs');
check(helper.state(options(99.5,{savedDone:false})).pct===99.5,'display does not recalculate shared percentage');
check(helper.html(options(60))===helper.html(options(60))&&!/\bid=/.test(helper.html(options(60))),'repeat rendering is stable and has no generated IDs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox'],env:Object.fromEntries(Object.entries(process.env).filter(([k])=>!/TOKEN|SECRET|PASSWORD|KEY/i.test(k)))});try{
const context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage();let requests=0;const errors=[];await page.route(/^https?:/,r=>{requests++;r.abort();});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('OVERFLOW'))console.log(m.text());});
await page.setContent('<style>body{font:16px Arial;margin:18px;--rule:#d8e1e7;--rule2:#e4eaf0;--ink:#183143;--ink2:#334c5e;--slate:#536775;--green:#007d51;--tint2:#eef4f7;--green-soft:#ecfff5}.card{max-width:760px;padding:18px;border:1px solid #bbcbd5}'+oldCSS+css+'</style><div class="card" id="svc1067"></div><div id="standalone"></div><script>'+stateSrc+'\n'+source+'\n'+panel+`\n
var day='2026-10-23',next='2026-10-24',now=Date.parse('2026-10-23T12:00:00Z');
var D={tasks:{pump:'Pump out',clean:'Clean',refill:'Water refill'},days:[{id:day,label:'Fri 23',plan:'night'},{id:next,label:'Sat 24',plan:'night'}],extras:['refill'],plans:{fwf:{night:['pump','clean','refill']},tank:{night:['pump']}},areas:[{n:1,name:'Area 1 — North',refs:[{ref:'QA1',lines:[{id:'L1',kind:'fwf',qty:3,label:'3 toilets'}]},{ref:'QA2',lines:[{id:'L2',kind:'tank',qty:1,label:'1 tank'}]}]},{n:2,name:'Area 2 — South',refs:[{ref:'QA3',lines:[{id:'L3',kind:'tank',qty:2,label:'2 tanks'}]}]}]};
var events=[{id:'a',line:'L1',task:'pump',day,at:'2026-10-23T12:00:00Z',done:true},{id:'b',line:'L1',task:'clean',day,at:'2026-10-23T12:01:00Z',done:true},{id:'c',line:'L2',task:'pump',day,at:'2026-10-23T12:02:00Z',done:true},{id:'d',line:'L3',task:'pump',day,at:'2026-10-23T12:03:00Z',done:true}];
var M={D,S:SvcState,events:[],now,day,lastRead:now,open:{}};window.render=()=>{document.querySelector('#svc1067').innerHTML=SvcPanel.svcPanelHtml(M).replace(/svc1063/g,'svc1067');};render();
var opts={pct:0,d:0,w:9,refsDone:0,refs:3,savedDone:false,key:'standalone',label:'Synthetic servicing'};SvcProgress1102.update(document.querySelector('#standalone'),opts);
</script>`);
const frame=()=>page.evaluate(()=>new Promise(requestAnimationFrame));
check(await page.locator('.svc-all .svc-big b').innerText()==='0%','native overall selector retained');
check(await page.locator('details[data-svc-area]').count()===2,'native area folds retained');
check(await page.locator('.svc1102-lamp.is-on').count()===0,'zero progress leaves every lamp dim');
await page.evaluate(()=>{M.events=events.slice(0,1);render();});
check(await page.locator('.svc-all .svc-pct').innerText()==='33%'&&await page.locator('[data-svc-area="1"] .svc-pct').innerText()==='42%','native whole-night and area percentages use weighted state');
check(await page.locator('.svc-all .svc1102-job-count').innerText()==='3 / 9 jobs','native shared job counts are unchanged');
await page.evaluate(()=>{M.events=events.slice(0,1).concat({id:'extra',line:'L1',task:'refill',day,at:'2026-10-23T12:05:00Z',done:true});render();});
check(await page.locator('.svc-all .svc-pct').innerText()==='33%','extra jobs remain outside completion percentage');
await page.evaluate(()=>{M.events=events.map(e=>({...e,local:true}));render();});
check(await page.locator('.svc-all .svc-pct').innerText()==='100%'&&await page.locator('.svc-all .svc1102-lamp.is-finished').count()===0&&await page.locator('.svc-all .svc1102-lamp.is-on').count()===4,'pending full native panel does not claim saved completion');
await page.evaluate(()=>{M.events=events;render();});
check(await page.locator('.svc-all .svc1102-lamp.is-finished').count()===5&&await page.locator('[data-svc-area="1"] .svc1102-lamp.is-finished').count()===5,'verified completion lights all five lamps green');
check(await page.locator('.svc-all [role="progressbar"]').getAttribute('aria-valuenow')==='100','accessible progress value matches visible value');
await page.evaluate(()=>{M.D={...D,plans:{...D.plans,unplanned:{night:[]}},areas:D.areas.concat({n:3,name:'Unplanned area',refs:[{ref:'QA4',lines:[{id:'L4',kind:'unplanned',qty:1,label:'No required jobs'}]}]})};render();});
check(await page.locator('.svc-all .svc-pct').innerText()==='100%'&&await page.locator('.svc-all .svc1102-lamp.is-finished').count()===0&&await page.locator('.svc-all .svc1102-finished').count()===0,'no-job reference prevents inconsistent All finished claim');
await page.evaluate(()=>{M.D=D;render();});

await page.evaluate(()=>{M.events=events.concat({id:'undo',line:'L1',task:'clean',day,done:false,undoes:['b']});render();});
check(await page.locator('.svc-all .svc-pct').innerText()==='66%'&&await page.locator('.svc-all .svc1102-lamp.is-finished').count()===0,'undo immediately removes completion and restores true percentage');
await page.evaluate(()=>{M.events=events;M.day=next;render();});
check(await page.locator('.svc-all .svc-pct').innerText()==='0%','selected night has its own percentage');
await page.evaluate(()=>{M.day=day;render();});await page.locator('[data-svc-area="1"] summary').click();
check(await page.locator('[data-svc-area="1"]').evaluate(e=>e.open)&&await page.locator('[data-svc-area="1"] table th[scope="col"]').count()>=2,'area folds retain accessible reference table');
await page.evaluate(()=>{window.meter=document.querySelector('#standalone .svc1102-meter');window.lamps=[...meter.querySelectorAll('.svc1102-lamp')];window.svg=[...meter.querySelectorAll('svg')];window.mutations=[];window.mo=new MutationObserver(ms=>mutations.push(...ms));mo.observe(meter,{subtree:true,childList:true,attributes:true,characterData:true});for(let i=0;i<40;i++)SvcProgress1102.update(meter,opts);});await frame();
check(await page.evaluate(()=>mutations.length===0),'unchanged progress causes no DOM mutation');
await page.evaluate(()=>{opts={...opts,pct:100,d:9,refsDone:3,savedDone:true};SvcProgress1102.update(meter,opts);});
check(await page.evaluate(()=>lamps.every(n=>n.isConnected)&&svg.every(n=>n.isConnected)&&document.querySelector('#standalone .svc-pct').textContent==='100%'),'changed progress preserves every lamp and SVG node');
await page.emulateMedia({reducedMotion:'reduce'});check(await page.locator('#standalone .svc1102-dots').first().evaluate(e=>getComputedStyle(e).transitionDuration==='0s'),'reduced motion disables transitions');await page.emulateMedia({reducedMotion:'no-preference'});
await page.evaluate(()=>SvcProgress1102.pause(meter,true));check(await page.locator('#standalone .svc1102-dots').first().evaluate(e=>getComputedStyle(e).transitionDuration==='0s'),'hidden-panel pause disables transitions');
check(await page.locator('.svc1102-lamp').first().evaluate(e=>getComputedStyle(e).animationName==='none'),'meters have no continuous animation loop');
check(await page.locator('details .svc1102-meter').evaluateAll(es=>es.every(e=>e.querySelector('.svc-pct').getBoundingClientRect().right+3<=e.querySelector('.svc1102-lights').getBoundingClientRect().left)),'area percentages have clear separation from lamps');

for(const width of [360,390,768,1440]){await page.setViewportSize({width,height:900});await frame();check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow at '+width+'px');check(await page.locator('.svc1102-meter').evaluateAll(es=>es.every(e=>{const a=e.getBoundingClientRect();return [...e.querySelectorAll('.svc1102-lights,.svc-pct')].every(n=>{const b=n.getBoundingClientRect();if(!(b.left>=a.left-1&&b.right<=a.right+1))console.log('OVERFLOW',e.dataset.svc1102Key,n.className,JSON.stringify({a:a.toJSON(),b:b.toJSON()}));return b.left>=a.left-1&&b.right<=a.right+1;});})),'percentages and lamps fit at '+width+'px');}
const output=process.env.PROGRESS1102_EVIDENCE;if(output){fs.mkdirSync(output,{recursive:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'phone.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});}
check(requests===0,'zero network requests');check(errors.length===0,'zero page errors');await context.close();console.log(JSON.stringify({passed:checks,failed:0,synthetic:true}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
