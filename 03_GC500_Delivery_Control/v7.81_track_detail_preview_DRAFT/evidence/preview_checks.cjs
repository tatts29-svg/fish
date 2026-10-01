// Author: Andrew Fisher.
// Standalone preview checks. File reads only; every HTTP(S) request is blocked.
// Screenshots and results stay in OUT (default /workspace/private-showcase781).
// No claims about physical-device FPS: Chromium uses software rendering here.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium,devices}=require('playwright');
const pageFile=path.resolve(process.env.PREVIEW_FILE||path.join(__dirname,'../../build/GC500_v7.81/track_detail_preview.html'));
const out=path.resolve(process.env.OUT||'/workspace/private-showcase781');
const results={author:'Andrew Fisher',preview:path.basename(pageFile),rendering:'Software-rendered Chromium; not a physical-device performance benchmark',checks:[],errors:[],externalRequests:[],screenshots:[]};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(name,pass,detail){results.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)throw Error(name);}
function writeResults(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'preview-checks.json'),JSON.stringify(results,null,2));}
async function openCase(browser,name,options){
 const context=await browser.newContext({locale:'en-AU',timezoneId:'Australia/Brisbane',...options});
 await context.route('**/*',route=>{
  const u=route.request().url();
  if(/^(file:|data:|blob:)/.test(u))return route.continue();
  results.externalRequests.push({case:name,method:route.request().method(),origin:(()=>{try{return new URL(u).origin;}catch{return 'unknown';}})()});return route.abort();
 });
 const p=await context.newPage();p.setDefaultTimeout(60000);p.setDefaultNavigationTimeout(180000);
 p.on('pageerror',e=>results.errors.push({case:name,kind:'page',message:e.message}));
 p.on('console',m=>{if(m.type()==='error'||/INVALID_(?:OPERATION|VALUE|ENUM)|shader.*(?:error|fail)|program.*link.*fail/i.test(m.text()))results.errors.push({case:name,kind:m.type(),message:m.text().slice(0,500)});});
 await p.setContent(fs.readFileSync(pageFile,'utf8'),{waitUntil:'domcontentloaded',timeout:180000});
 await p.waitForFunction(()=>typeof startPreview781==='function'&&typeof pausePreview781==='function');
 const unopened=await p.evaluate(()=>({scene:!!GC3D.S,disabled:document.querySelector('#play').disabled,gate:!document.querySelector('#start').hidden}));
 check(name+': opens behind explicit start control',!unopened.scene&&unopened.disabled&&unopened.gate,unopened);
 return {context,p};
}
async function begin(p,name,paused=true){
 const state=await p.evaluate(shouldPause=>{
  const started=startPreview781();if(!started)return {started:false};
  if(shouldPause)pausePreview781(true);
  const G=GC3D,S=G.S;G.setQuality(innerWidth<700?'balanced':'high');S.qualityChoice='manual';
  G.render();
  return {started,enabled:S.detail781Enabled,track:S.trackDetail781&&S.trackDetail781.stats,
   architecture:S.architecture781&&S.architecture781.stats,meshes:(S.detail781ShadowMeshes||[]).length,
   glError:S.gl.getError(),links:[S.trackDetail781&&S.trackDetail781.program,S.architecture781&&S.architecture781.program].filter(Boolean).map(x=>S.gl.getProgramParameter(x.p,S.gl.LINK_STATUS)),
   canvas:[S.cv.width,S.cv.height],paused:S.paused,reduced:S.reducedMotion};
 },paused);
 check(name+': WebGL scene starts',state.started,state);
 check(name+': new geometry installed',state.enabled&&state.track&&state.track.triangles>1000&&state.architecture&&state.meshes>=2);
 check(name+': shader programs linked',state.links.length>=1&&state.links.every(Boolean),state.links);
 check(name+': no WebGL error after first render',state.glError===0,state.glError);
 check(name+': canvas has drawable dimensions',state.canvas[0]>100&&state.canvas[1]>100,state.canvas);
 return state;
}
async function screenshot(p,name,canvasOnly=false){
 const file=path.join(out,name+'.png');const bytes=canvasOnly?await p.locator('#stage canvas').screenshot({path:file,timeout:120000}):await p.screenshot({path:file,timeout:120000});
 results.screenshots.push({name,path:file,sha256:hash(bytes)});return hash(bytes);
}
async function desktop(browser){
 const {context,p}=await openCase(browser,'desktop',{viewport:{width:1440,height:900},deviceScaleFactor:1});
 try{
  await begin(p,'desktop');
  await p.evaluate(()=>{const S=GC3D.S;window.__saved781={car:S.car,parts:S.raceCarParts,carStats:JSON.stringify(S.raceCarStats),position:S.sim.s,clock:S.clock,vehicle:S.vehicle||'car'};});
  const on=await screenshot(p,'desktop-detail-on',true);
  await p.locator('#compare').click();
  const off=await screenshot(p,'desktop-current',true);
  const preserved=await p.evaluate(()=>{const S=GC3D.S,A=window.__saved781;return {disabled:!S.detail781Enabled,car:S.car===A.car,parts:S.raceCarParts===A.parts,stats:JSON.stringify(S.raceCarStats)===A.carStats,position:S.sim.s===A.position,clock:S.clock===A.clock,vehicle:(S.vehicle||'car')===A.vehicle,ui:document.querySelector('#compare').getAttribute('aria-pressed')};});
  check('desktop: comparison changes rendered canvas',on!==off);
  check('desktop: comparison preserves car model and position',Object.entries(preserved).every(([k,v])=>k==='ui'?v==='false':v),preserved);
  await p.locator('#compare').click();
  check('desktop: comparison restores detail',await p.evaluate(()=>GC3D.S.detail781Enabled&&document.querySelector('#compare').getAttribute('aria-pressed')==='true'));
  const cameras=[];
  for(const camera of ['chase','onboard','hero','heli']){
   await p.locator('[data-camera="'+camera+'"]').click();
   cameras.push(await p.evaluate(name=>({name,requested:GC3D.preview781.camera,view:GC3D.S.view,eye:GC3D.S.cam.eye.slice(),target:GC3D.S.cam.tgt.slice(),active:document.querySelector('[data-camera="'+name+'"]').getAttribute('aria-pressed')}),camera));
  }
  check('desktop: all four camera controls select finite rigs',cameras.every(x=>x.requested===x.name&&x.view===x.name&&x.active==='true'&&x.eye.concat(x.target).every(Number.isFinite)),cameras);
  check('desktop: cameras produce different viewpoints',new Set(cameras.map(x=>x.eye.map(v=>v.toFixed(3)).join(','))).size===4);
  await p.locator('[data-camera="chase"]').click();
  const before=await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock}));
  await p.locator('#play').click();
  await p.waitForFunction(t=>GC3D.S.clock>t+.04,before.clock,{timeout:60000});
  await p.evaluate(()=>pausePreview781(true));
  const advanced=await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock}));
  check('desktop: animation advances the existing simulation',advanced.clock>before.clock&&advanced.s!==before.s,{before,advanced});
  await p.waitForTimeout(180);
  check('desktop: pause holds simulation position',await p.evaluate(a=>GC3D.S.paused&&GC3D.S.sim.s===a.s&&GC3D.S.clock===a.clock,advanced));
  await p.locator('#restart').click();
  check('desktop: replay returns to section start without unpausing',await p.evaluate(()=>Math.abs(GC3D.S.sim.s-window.__saved781.position)<1e-8&&GC3D.S.paused));
  // The explicit short simulation advance chooses a representative in-section frame, without network input.
  await p.evaluate(()=>{for(let i=0;i<500;i++)GC3D.step(1/120);GC3D.render();});
  await screenshot(p,'desktop-preview');
  check('desktop: no final WebGL error',await p.evaluate(()=>GC3D.S.gl.getError())===0);
 }finally{await context.close();}
}
async function phone(browser){
 const {context,p}=await openCase(browser,'phone',{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1});
 try{
  await begin(p,'phone');
  const layout=await p.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,
   controls:[...document.querySelectorAll('.controls button,.controls select')].map(b=>{const r=b.getBoundingClientRect();return {label:b.textContent.trim(),x:r.x,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height,disabled:b.disabled};})}));
  check('phone: no horizontal page overflow',layout.documentWidth<=layout.width+1,layout);
  check('phone: touch controls stay inside viewport',layout.controls.every(r=>r.x>=0&&r.right<=390.5&&r.top>=0&&r.bottom<=844.5&&!r.disabled),layout.controls);
  check('phone: controls have at least 40px touch height',layout.controls.every(r=>r.h>=39.5));
  await p.locator('#compare').tap();
  check('phone: comparison responds to touch',await p.evaluate(()=>!GC3D.S.detail781Enabled));
  await p.locator('#compare').tap();await p.locator('[data-camera="onboard"]').tap();
  check('phone: camera responds to touch',await p.evaluate(()=>GC3D.S.view==='onboard'));
  await p.locator('[data-camera="chase"]').tap();
  await p.evaluate(()=>{for(let i=0;i<500;i++)GC3D.step(1/120);GC3D.render();});
  await screenshot(p,'phone-preview');
  check('phone: no WebGL error',await p.evaluate(()=>GC3D.S.gl.getError())===0);
 }finally{await context.close();}
}
async function reducedMotion(browser){
 const {context,p}=await openCase(browser,'reduced-motion',{viewport:{width:1000,height:700},deviceScaleFactor:1,reducedMotion:'reduce'});
 try{
  const state=await begin(p,'reduced-motion',false);
  check('reduced-motion: initial scene is paused',state.paused&&state.reduced,state);
  const clock=await p.evaluate(()=>GC3D.S.clock);await p.waitForTimeout(180);
  check('reduced-motion: initial still does not advance',await p.evaluate(t=>GC3D.S.clock===t&&document.querySelector('#play').textContent==='Play',clock));
 }finally{await context.close();}
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});check('standalone preview exists',fs.existsSync(pageFile));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{await desktop(browser);await phone(browser);await reducedMotion(browser);
  check('offline preview requests no external resources',results.externalRequests.length===0,results.externalRequests);
  check('no page, shader or console errors',results.errors.length===0,results.errors);
 }finally{await browser.close();writeResults();}
 console.log(JSON.stringify({passed:results.checks.filter(x=>x.pass).length,total:results.checks.length,errors:results.errors.length,externalRequests:results.externalRequests.length,results:path.join(out,'preview-checks.json'),screenshots:results.screenshots}));
})().catch(e=>{results.failure=e.message;writeResults();console.error(JSON.stringify({failure:e.message,results:path.join(out,'preview-checks.json')}));process.exitCode=1;});
