/* Author: Andrew Fisher.
 * Independent full-circuit checks. No live records or network access.
 * The full-lap sweep advances the ORIGINAL 120 Hz physics one step at a time;
 * it does not assign distance, move the car, replace the camera, or reset midlap.
 * Physics checkpoints are every 50 m; screenshots default to 100 m intervals.
 * BASE=... PAGE=... PREVIEW=... OUT=... [CASES=desktop,phone] node full_lap_checks.cjs
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium,devices}=require('playwright');
const project=path.resolve(__dirname,'../..');
const baseFile=path.resolve(process.env.BASE||path.join(project,'build/GC500_v7.88/base_live.html'));
const pageFile=path.resolve(process.env.PAGE||path.join(project,'build/GC500_v7.88/GC500_Delivery_Control_hosted.html'));
const previewFile=path.resolve(process.env.PREVIEW||path.join(project,'build/GC500_v7.88/full_lap_preview.html'));
const out=path.resolve(process.env.OUT||'/workspace/private-v788-full-lap');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const captureEvery=Math.max(50,Number(process.env.CAPTURE_EVERY_M)||100);
const result={captureEveryMetres:captureEvery,author:'Andrew Fisher',method:'Original fixed-step physics; continuous lap checked every 50 m, rendered at the recorded screenshot interval',
 limitations:['Software-rendered Chromium, not a physical-device performance benchmark','Continuous simulation is accelerated; screenshots sample distance, not every rendered video frame','Geometry coverage is not proof of surveyed landmark accuracy'],
 files:{},checks:[],errors:[],externalRequests:[],cases:{}};
fs.mkdirSync(out,{recursive:true});
function save(){fs.writeFileSync(path.join(out,'full-lap-checks.json'),JSON.stringify(result,null,2)+'\n');}
function check(name,pass,detail,fatal=true){result.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});save();console.log((pass?'PASS ':'FAIL ')+name);if(!pass&&fatal)throw Error(name);}
function extractFunction(source,name){
 const start=source.indexOf('G.'+name+'=function');
 if(start<0)throw Error('Missing original function '+name);
 const end=source.indexOf('\n};',start);
 if(end<0)throw Error('Missing function terminator '+name);
 const expression=source.slice(source.indexOf('function',start),end+2);
 // A truncated function fails syntax validation instead of weakening the comparison.
 Function('return ('+expression+');');
 return expression;
}
function visualData(source){
 const line=source.split('\n').find(x=>/const DATA\s*=/.test(x));
 if(!line)throw Error('No DATA assignment');
 return JSON.parse(line.replace(/^.*?const DATA\s*=\s*/,'').replace(/;\s*$/,''));
}
const texts={base:fs.readFileSync(baseFile,'utf8'),page:fs.readFileSync(pageFile,'utf8'),preview:fs.readFileSync(previewFile,'utf8')};
for(const [name,file]of Object.entries({base:baseFile,page:pageFile,preview:previewFile}))result.files[name]={name:path.basename(file),bytes:fs.statSync(file).size,sha256:hash(fs.readFileSync(file))};
const originals={};
for(const name of ['simReset','pose','step','camStep','frame','renderAt','carModel']){
 originals[name]=extractFunction(texts.base,name);
 check('source: original '+name+' unchanged in candidate and preview',extractFunction(texts.page,name)===originals[name]&&extractFunction(texts.preview,name)===originals[name],{sha256:hash(originals[name])});
}
const baseData=visualData(texts.base),pageData=visualData(texts.page),previewData=visualData(texts.preview);
for(const key of ['circuit','surrounds'])check('source: complete '+key+' data preserved',JSON.stringify(baseData[key])===JSON.stringify(pageData[key])&&JSON.stringify(baseData[key])===JSON.stringify(previewData[key]));
check('source: offline preview contains visual data only',Object.keys(previewData).sort().join(',')==='circuit,surrounds');
check('source: old short-loop override removed',!texts.preview.includes('G.restartPreview781=')&&!texts.preview.includes('G.preview781=')&&!texts.preview.includes('previewLoop781=true'));

async function open(browser,name,options){
 const context=await browser.newContext({locale:'en-AU',timezoneId:'Australia/Brisbane',...options});
 await context.route('**/*',route=>{const req=route.request();if(req.url()==='https://gc500-preview.test/')return route.fulfill({status:200,contentType:'text/html',body:texts.preview});if(/^(data:|blob:)/.test(req.url()))return route.continue();result.externalRequests.push({case:name,method:req.method(),origin:new URL(req.url()).origin});return route.abort();});
 const p=await context.newPage();p.setDefaultTimeout(120000);
 p.on('pageerror',e=>result.errors.push({case:name,kind:'page',message:e.message}));
 p.on('console',m=>{if(m.type()==='error'||/INVALID_(?:OPERATION|VALUE|ENUM)|shader.*(?:error|fail)|program.*link.*fail/i.test(m.text()))result.errors.push({case:name,kind:m.type(),message:m.text().slice(0,500)});});
 await p.goto('https://gc500-preview.test/',{waitUntil:'domcontentloaded',timeout:180000});
 await p.waitForFunction(()=>typeof startFullLap788==='function'&&typeof pauseFullLap788==='function');
 check(name+': explicit start gate before graphics initialise',await p.evaluate(()=>!GC3D.S&&!document.querySelector('#start').hidden&&document.querySelector('#play').disabled));
 const functions=await p.evaluate(names=>Object.fromEntries(names.map(n=>[n,GC3D[n].toString()])),Object.keys(originals));
 check(name+': runtime original drive/camera/car functions not overridden',Object.keys(originals).every(n=>functions[n]===originals[n]));
 return {context,p};
}
async function begin(p,name){
 const info=await p.evaluate(()=>{
  const started=startFullLap788();if(!started)return {started};pauseFullLap788(true);
  const G=GC3D,S=G.S;S.qualityChoice='manual';G.render();
  window.__lapAudit788={startS:S.sim.s,startClock:S.clock,previousS:S.sim.s,previousClock:S.clock,steps:0,maxDistanceError:0,maxStepMetres:0,maxPoseStepMetres:0,minStepMetres:Infinity,nonfinite:0,reverseSteps:0,clockRewinds:0,unexpectedLapResets:0,car:S.car,kerb:S.kerb,kerbVertices:JSON.stringify(S.kerb.v),kerbIndices:JSON.stringify(S.kerb.i),line:JSON.stringify(S.CL.p),outer:JSON.stringify(S.outer),inner:JSON.stringify(S.inner),normalDrive:!S.calmDrive};
  const tr=S.trackDetail781&&S.trackDetail781.stats;
  return {started,paused:S.paused,normalDrive:!S.calmDrive,detail:S.detail781Enabled,track:tr,architecture:S.architecture781&&S.architecture781.stats,vegetation:S.vegetation781&&S.vegetation781.stats,canvas:[S.cv.width,S.cv.height],glError:S.gl.getError(),links:[S.trackDetail781,S.architecture781].filter(Boolean).map(x=>S.gl.getProgramParameter(x.program.p,S.gl.LINK_STATUS))};
 });
 check(name+': full circuit starts with normal original drive',info.started&&info.normalDrive&&info.detail,info);
 check(name+': both complete closed boundaries are detailed',info.track&&info.track.boundaries.length===2&&info.track.boundaries.every(b=>b.coveredSegments===b.sourceSegments&&Math.abs(b.coveredLengthM-b.lengthM)<1e-6),info.track&&info.track.boundaries);
 check(name+': detail covers every diagnostic twelfth of the lap',info.track.coverageBins===12&&info.track.coverageFraction>.999999,info.track.sectors);
 check(name+': programs link and WebGL is clean',info.glError===0&&info.links.length>=1&&info.links.every(Boolean),{glError:info.glError,links:info.links});
 return info;
}
async function capture(p,name,label,rendered=true){
 const data=await p.evaluate(rendered=>{
  const G=GC3D,S=G.S,A=window.__lapAudit788,M=G.M_PER_PT||6;
  const gl=S.gl;let pixelHash=2166136261,lit=0,count=0;
  if(rendered){G.render();S.needsRender=false;const pixels=new Uint8Array(S.cv.width*S.cv.height*4);gl.readPixels(0,0,S.cv.width,S.cv.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   for(let i=0;i<pixels.length;i+=4*97){pixelHash=Math.imul(pixelHash^pixels[i],16777619);pixelHash=Math.imul(pixelHash^pixels[i+1],16777619);pixelHash=Math.imul(pixelHash^pixels[i+2],16777619);if(pixels[i]+pixels[i+1]+pixels[i+2]>24)lit++;count++;}}
  let nearby=Infinity;const v=S.trackDetail781.mesh.v,p=S.pose.pos;for(let i=0;i<v.length;i+=12)nearby=Math.min(nearby,Math.hypot(p[0]-v[i],p[2]-v[i+2])*M);
  return {rendered,distanceM:(S.sim.s-A.startS)*M,simulationTimeS:S.clock,lap:S.sim.lap,carPosition:S.pose.pos.slice(),speedMps:S.sim.v*M/(S.tune.tc||1),camera:S.view,eye:S.cam.eye.slice(),target:S.cam.tgt.slice(),nearbyDetailM:nearby,glError:gl.getError(),pixelHash:rendered?(pixelHash>>>0).toString(16):null,nonblackFraction:rendered?lit/count:null,detail:S.detail781Enabled,fullLapReport:G.fullLapReport788(),continuity:{steps:A.steps,maxDistanceError:A.maxDistanceError,maxStepMetres:A.maxStepMetres,maxPoseStepMetres:A.maxPoseStepMetres,reverseSteps:A.reverseSteps,clockRewinds:A.clockRewinds,nonfinite:A.nonfinite,unexpectedLapResets:A.unexpectedLapResets}};
 },rendered);
 if(rendered){const filename=name+'-'+label+'.png',bytes=await p.locator('#stage canvas').screenshot({path:path.join(out,filename),timeout:180000});
 data.screenshot={file:filename,sha256:hash(bytes)};}
 return data;
}
async function advance(p,target){
 return p.evaluate(targetM=>{
  const G=GC3D,S=G.S,A=window.__lapAudit788,M=G.M_PER_PT||6,dt=1/120;
  let n=0;
  while((S.sim.s-A.startS)*M<targetM&&n<120*600){
   const previousS=S.sim.s,clock=S.clock,lap=S.sim.lap,previousPose=S.pose.pos.slice();G.step(dt);n++;A.steps++;
   const ds=S.sim.s-previousS,error=Math.abs(ds-S.sim.v*dt);A.maxDistanceError=Math.max(A.maxDistanceError,error);
   A.maxStepMetres=Math.max(A.maxStepMetres,ds*M);A.maxPoseStepMetres=Math.max(A.maxPoseStepMetres,Math.hypot(...S.pose.pos.map((v,i)=>v-previousPose[i]))*M);A.minStepMetres=Math.min(A.minStepMetres,ds*M);
   if(ds<-1e-10)A.reverseSteps++;if(S.clock<=clock)A.clockRewinds++;if(S.sim.lap<lap)A.unexpectedLapResets++;
   if(![S.sim.s,S.sim.v,S.clock,...S.pose.pos,...S.cam.eye,...S.cam.tgt].every(Number.isFinite))A.nonfinite++;
  }
  return {reached:(S.sim.s-A.startS)*M>=targetM,steps:n,distanceM:(S.sim.s-A.startS)*M};
 },target);
}
async function lapCase(browser,name,options){
 const {context,p}=await open(browser,name,options);
 try{
  const info=await begin(p,name),lapM=info.track.lapLengthM;
  const run=result.cases[name]={viewport:options.viewport,quality:name==='phone'?'balanced':'high',lapLengthM:lapM,samples:[]};
  run.samples.push(await capture(p,name,'0000m'));
  // Full fixed-step lap plus a little past the finish proves it never returns to
  // the old short section. No reset or renderAt is used inside this sequence.
  const targets=[];for(let metres=50;metres<lapM+25;metres+=50)targets.push(metres);targets.push(lapM+25);
  for(const metres of targets){
   const moved=await advance(p,metres);if(!moved.reached)throw Error(name+': original drive failed to reach '+metres+' m');
   const sample=await capture(p,name,String(Math.round(metres)).padStart(4,'0')+'m',metres===targets[targets.length-1]||metres%captureEvery===0);run.samples.push(sample);save();
   if(sample.glError||!sample.detail||!Number.isFinite(sample.nearbyDetailM))throw Error(name+': invalid rendering at '+metres+' m');
  }
  const final=run.samples[run.samples.length-1],a=final.continuity;
  check(name+': original physics completes the whole lap without resetting',final.lap>=1&&final.distanceM>=lapM&&a.reverseSteps===0&&a.clockRewinds===0&&a.unexpectedLapResets===0&&a.nonfinite===0,a);
  check(name+': each physics step matches speed times dt; no teleport',a.maxDistanceError<1e-8&&a.maxStepMetres<2&&a.maxPoseStepMetres<3,{maxDistanceError:a.maxDistanceError,maxStepMetres:a.maxStepMetres,maxPoseStepMetres:a.maxPoseStepMetres,steps:a.steps});
  check(name+': simulation checkpoints cover the whole lap at 50 m intervals',run.samples.length>=Math.floor(lapM/50)&&run.samples.every((s,i)=>!i||s.distanceM-run.samples[i-1].distanceM<52),{samples:run.samples.length,lastMetres:final.distanceM});
  check(name+': added geometry remains beside every sampled section',run.samples.every(s=>s.nearbyDetailM<60),{maxNearestDetailM:Math.max(...run.samples.map(s=>s.nearbyDetailM))});
  check(name+': every full-lap frame draws without GL errors',run.samples.every(s=>s.glError===0&&(!s.rendered||s.nonblackFraction>.25)),{uniquePixelHashes:new Set(run.samples.filter(s=>s.rendered).map(s=>s.pixelHash)).size});
  check(name+': scene changes through the lap',new Set(run.samples.filter(s=>s.rendered).map(s=>s.pixelHash)).size>run.samples.filter(s=>s.rendered).length*.9);
  const unchanged=await p.evaluate(()=>{const S=GC3D.S,A=window.__lapAudit788;return S.car===A.car&&S.kerb===A.kerb&&JSON.stringify(S.kerb.v)===A.kerbVertices&&JSON.stringify(S.kerb.i)===A.kerbIndices&&JSON.stringify(S.CL.p)===A.line&&JSON.stringify(S.outer)===A.outer&&JSON.stringify(S.inner)===A.inner;});
  check(name+': full drive preserves original car, kerbs and complete circuit arrays',unchanged);
  const cameraStates=[];
  for(const camera of ['chase','onboard','hero','heli']){
   await p.locator('[data-camera="'+camera+'"]').click();
   cameraStates.push(await p.evaluate(camera=>({camera,view:GC3D.S.view,pressed:document.querySelector('[data-camera="'+camera+'"]').getAttribute('aria-pressed'),eye:GC3D.S.cam.eye.slice(),target:GC3D.S.cam.tgt.slice(),s:GC3D.S.sim.s,clock:GC3D.S.clock}),camera));
  }
  check(name+': all four original cameras work without moving the car',cameraStates.every(c=>c.view===c.camera&&c.pressed==='true'&&c.eye.concat(c.target).every(Number.isFinite)&&c.s===cameraStates[0].s&&c.clock===cameraStates[0].clock)&&new Set(cameraStates.map(c=>JSON.stringify(c.eye))).size===4,cameraStates);
  const position=await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock}));
  await p.locator('#compare').click();
  const off=await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock,off:!GC3D.S.detail781Enabled,disposed:!GC3D.S.trackDetail781&&!GC3D.S.architecture781&&!GC3D.S.vegetation781}));
  check(name+': original-scene comparison keeps complete-lap position and releases detail',off.off&&off.disposed&&off.s===position.s&&off.clock===position.clock,off);
  await p.locator('#compare').click();
  check(name+': restoring upgraded scene keeps full-lap position',await p.evaluate(before=>GC3D.S.detail781Enabled&&GC3D.S.sim.s===before.s&&GC3D.S.clock===before.clock,position));
  await p.locator('[data-camera="chase"]').click();
  await p.screenshot({path:path.join(out,name+'-controls.png'),timeout:180000});
  const controls=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,items:[...document.querySelectorAll('.controls button,.controls select')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,visible:r.width>0&&r.height>0&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1};})}));
  check(name+': preview controls fit the screen and remain usable',!controls.overflow&&controls.items.every(x=>x.visible),controls);
  // Real requestAnimationFrame loop smoke check follows the continuous lap.
  await p.evaluate(()=>pauseFullLap788(false));await p.waitForTimeout(2000);await p.evaluate(()=>pauseFullLap788(true));
  const raf=await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock}));
  check(name+': normal animation loop advances the original drive',raf.s>position.s&&raf.clock>position.clock);
  await p.waitForTimeout(300);const paused=await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock}));
  check(name+': pause holds position and clock',paused.s===raf.s&&paused.clock===raf.clock);
  run.final=final;run.finished=true;save();
 }finally{await context.close();}
}
async function reducedCase(browser){
 const {context,p}=await open(browser,'reduced-motion',{viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'});
 try{await begin(p,'reduced-motion');const before=await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock,paused:GC3D.S.paused,reduced:GC3D.S.reducedMotion}));await p.waitForTimeout(300);const after=await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock}));check('reduced motion: starts still and does not drive automatically',before.paused&&before.reduced&&before.s===after.s&&before.clock===after.clock);}finally{await context.close();}
}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const cases=(process.env.CASES||'desktop,phone,reduced').split(',');
  if(cases.includes('desktop'))await lapCase(browser,'desktop',{viewport:{width:1280,height:720},deviceScaleFactor:1});
  if(cases.includes('phone'))await lapCase(browser,'phone',{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:2});
  if(cases.includes('reduced'))await reducedCase(browser);
  check('all cases: no page, shader, program or console errors',result.errors.length===0,result.errors);
  check('all cases: no external requests or record access',result.externalRequests.length===0,result.externalRequests);
  result.complete=true;save();console.log(JSON.stringify({passed:result.checks.filter(c=>c.pass).length,total:result.checks.length,out}));
 }catch(e){result.failure=e.stack||String(e);save();console.error(result.failure);process.exitCode=1;}finally{if(browser)await browser.close();}
})();
