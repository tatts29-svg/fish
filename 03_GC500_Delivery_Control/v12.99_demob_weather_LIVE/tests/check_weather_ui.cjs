/* Author: Andrew Fisher. Native read-only weather checks; all screenshots stay private.
 * Run with flock /tmp/gc500-browser.lock and PAGE=... OUT=/private/path.
 * LIVE=1 reads the real public page without a page override. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const OUT=process.env.OUT;assert(OUT&&path.isAbsolute(OUT),'Private absolute OUT required');assert(process.env.PAGE||process.env.LIVE==='1');
assert(!path.resolve(OUT).startsWith(path.resolve(__dirname,'../../..')+path.sep),'Screenshots must stay outside repository');fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const init=`(()=>{window.__weather1299={requests:[]};const native=window.fetch;window.fetch=function(input,...rest){const url=typeof input==='string'?input:input?.url||'';const source=url.includes('/api/weather/forecast')?'native':url.startsWith('https://api.open-meteo.com/v1/forecast')?'open-meteo':null;if(source)__weather1299.requests.push({source});return native.call(this,input,...rest);};})();`;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const phone=process.env.MOB!=='0',s=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE,hash:'#demob',W:phone?390:1440,H:phone?844:1000,mobile:phone,dpr:1,init});
 const p=s.page,consoleErrors=[];p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,180));});
 try{
  await p.waitForFunction(()=>window.WeatherCards1299&&window.DemobCards996&&window.BuildHistory984&&document.querySelector('#pane-demob .dc996-day'),null,{timeout:120000});
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
  assert.equal(await p.evaluate(()=>state.tab),'demob','Fresh entry must remain directly on Demob');
  await p.waitForFunction(()=>!!wxfDay(todayIso())&&document.querySelector('#pane-demob .dc996-day[data-dday816="'+todayIso()+'"] .bc984-weather-reading')?.textContent.includes('FORECAST'),null,{timeout:45000});
  const facts=await p.evaluate(()=>({today:todayIso(),archiveDates:BuildHistory984.dates().length,history:BuildCards984.weather('2026-11-03'),partial:BuildCards984.weather('2026-11-04'),current:BuildCards984.weather(todayIso()),requests:__weather1299.requests}));
  assert.equal(facts.archiveDates,59);assert.equal(facts.history.tag,'BOM RECORDED');assert(facts.history.source.historical);assert.equal(facts.history.source.date,'2026-11-03');
  assert.equal(facts.partial.tag,'BOM PARTIAL');assert.equal(facts.partial.hi,null);assert.equal(facts.partial.lo,19);assert.equal(facts.partial.source.max_c,null);assert.equal(facts.partial.source.gust_kph,null);
  assert.equal(facts.current.tag,'FORECAST');assert(facts.requests.some(r=>r.source==='native'));assert(facts.requests.some(r=>r.source==='open-meteo'));
  const select=async day=>{const selector='#pane-demob .dc996-day[data-dday816="'+day+'"]';const c=p.locator(selector);await c.scrollIntoViewIfNeeded();await c.click();await p.waitForFunction(day=>DM816.sel===day&&document.querySelector('#pane-demob .dc996-day.on')?.dataset.dday816===day,day);return p.locator(selector);};
  const past=await select('2026-11-03');assert((await past.locator('.bc984-weather-reading').innerText()).includes('BOM RECORDED'));await past.screenshot({path:path.join(OUT,'past-day.png')});
  const partial=await select('2026-11-04');const partialText=await partial.locator('.bc984-weather-reading').innerText();assert(partialText.includes('BOM PARTIAL'));assert(partialText.includes('min'));assert(!partialText.includes('33°'),'Instantaneous15:00 reading must not become daily high');await partial.screenshot({path:path.join(OUT,'partial-day.png')});
  const current=await select(facts.today);await current.screenshot({path:path.join(OUT,'current-day.png')});
  const stable=await p.evaluate(async()=>{
   const cards=[...document.querySelectorAll('#pane-demob .dc996-day')],before=new Map(cards.map(c=>[c.dataset.dday816,{node:c.querySelector('.wm-card-scene'),reading:c.querySelector('.bc984-weather-reading')} ]));
   let changes=0;const observer=new MutationObserver(ms=>{changes+=ms.filter(m=>m.target.closest?.('.wm-card-scene,.bc984-weather-reading,.bc984-weather-foreground')).length;});observer.observe(document.getElementById('pane-demob'),{childList:true,subtree:true});
   const requests=__weather1299.requests.length;for(let i=0;i<6;i++)wxfPaint();await Promise.resolve();observer.disconnect();
   return {nodesKept:cards.every(c=>before.get(c.dataset.dday816).node===c.querySelector('.wm-card-scene')&&before.get(c.dataset.dday816).reading===c.querySelector('.bc984-weather-reading')),changes,requestDelta:__weather1299.requests.length-requests};
  });
  assert.equal(stable.nodesKept,true);assert.equal(stable.changes,0);assert.equal(stable.requestDelta,0);
  const changed=await p.evaluate(()=>{
   const day=todayIso(),current=document.querySelector('#pane-demob .dc996-day[data-dday816="'+day+'"]'),past=document.querySelector('#pane-demob .dc996-day[data-dday816="2026-11-03"]');
   const before=current.querySelector('.wm-card-scene'),pastBefore=past.querySelector('.wm-card-scene'),saved=WXF.days,stateBefore=JSON.stringify(S),original=wxfDay(day);
   if(!saved?.[day])throw Error('Native forecast missing for isolated repaint test');
   const revised={...saved[day],code:saved[day].code===1000?1006:1000,text:saved[day].code===1000?'Cloudy':'Sunny',max_c:original.max_c+2};
   try{WXF.days={...saved,[day]:revised};wxfPaint();return {currentReplaced:current.querySelector('.wm-card-scene')!==before,pastKept:past.querySelector('.wm-card-scene')===pastBefore,temperatureMatches:current.querySelector('.bc984-temperature').textContent.includes(Math.round(revised.max_c)+'°'),ariaMatches:current.getAttribute('aria-label').endsWith('Weather: '+BuildCards984.weather(day).label),recordUnchanged:JSON.stringify(S)===stateBefore};}
   finally{WXF.days=saved;wxfPaint();}
  });
  for(const [key,value]of Object.entries(changed))assert.equal(value,true,key);
  await p.emulateMedia({reducedMotion:'reduce'});await delay(100);const reduced=await p.evaluate(()=>[...document.querySelectorAll('#pane-demob .dc996-day')].every(c=>c.dataset.bc984Motion==='off'));assert(reduced);
  await p.emulateMedia({reducedMotion:'no-preference'});
  await p.evaluate(()=>{window.__savedWeatherHidden1299=Object.getOwnPropertyDescriptor(document,'hidden');Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  try{await delay(80);assert(await p.evaluate(()=>[...document.querySelectorAll('#pane-demob .dc996-day')].every(c=>c.dataset.bc984Motion==='off')));}
  finally{await p.evaluate(()=>{if(window.__savedWeatherHidden1299)Object.defineProperty(document,'hidden',window.__savedWeatherHidden1299);else delete document.hidden;delete window.__savedWeatherHidden1299;document.dispatchEvent(new Event('visibilitychange'));});}
  assert.equal(s.counts.blocked,0);assert.deepEqual(s.errors,[]);assert.deepEqual(consoleErrors,[]);
  const report={author:'Andrew Fisher',passed:true,mode:phone?'phone':'desktop',live:process.env.LIVE==='1',candidateSha256:process.env.LIVE!=='1'&&process.env.PAGE?crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'):null,historyRows:59,partialDate:'2026-11-04',directForecastRequests:facts.requests,unchangedPaint:stable,changedForecast:changed,reducedMotion:true,hiddenPaused:true,errors:s.errors,consoleErrors,attemptedRecordWrites:s.counts.blocked};
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS direct Demob forecast, historical and partial observations, stable repaint and read-only motion lifecycle');
 }finally{await s.browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({message:e.message,stack:e.stack},null,2));console.error(e.stack);process.exitCode=1;});
