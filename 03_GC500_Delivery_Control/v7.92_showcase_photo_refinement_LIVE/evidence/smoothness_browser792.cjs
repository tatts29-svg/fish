/* Author: Andrew Fisher. Real WebGL checks and bounded software-rendering comparison. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{chromium}=require('playwright');
const project=path.resolve(__dirname,'../..');
const files={baseline:process.env.BASELINE||path.join(project,'build/GC500_v7.88/full_lap_preview.html'),candidate:process.env.PREVIEW||path.join(project,'build/GC500_v7.92/full_lap_preview.html')};
const output=process.env.OUT||path.join(__dirname,'smoothness_browser792.json');
const hosted=process.env.PAGE||path.join(project,'build/GC500_v7.92/GC500_Delivery_Control_hosted.html');
const report={author:'Andrew Fisher',method:'Identical 640 × 360 Balanced track-level views; eight fixed-state renders per version after two warm-ups; each timed render includes gl.finish() and a one-pixel readback',limitations:['Chromium uses software SwiftShader, not a physical desktop or phone GPU','Times describe these bounded renders, not real-device FPS','Lifecycle callbacks use a controlled animation-frame queue; context loss/restoration uses the real WebGL extension'],files:{},checks:[],errors:[],cases:{}};
for(const [k,f]of Object.entries(files)){const bytes=fs.readFileSync(f);report.files[k]={bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};}
{const bytes=fs.readFileSync(hosted);report.files.hosted={bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};}
function save(){fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail});save();console.log((pass?'PASS ':'FAIL ')+name);if(!pass)throw Error(name);}
async function open(browser,key,file,viewport){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
 await context.route('**/*',r=>r.request().url()==='https://smoothness.test/'?r.fulfill({contentType:'text/html',body:fs.readFileSync(file)}):r.abort());
 await context.addInitScript(()=>{
  let seq=0;const queue=new Map();window.requestAnimationFrame=f=>{queue.set(++seq,f);return seq;};window.cancelAnimationFrame=id=>queue.delete(id);
  window.__raf792={flush(t){const jobs=Array.from(queue.values());queue.clear();jobs.forEach(f=>f(t));return queue.size;},size:()=>queue.size};
  const proto=WebGL2RenderingContext.prototype,parameter=proto.getParameter,buffer=proto.bufferData;
  const counts=window.__glCounts792={limits:0,bufferData:0};
  proto.getParameter=function(p){if(p===this.MAX_TEXTURE_SIZE||p===this.MAX_RENDERBUFFER_SIZE)counts.limits++;return parameter.apply(this,arguments);};
  proto.bufferData=function(){counts.bufferData++;return buffer.apply(this,arguments);};
 });
 const p=await context.newPage();p.setDefaultTimeout(120000);
 p.on('pageerror',e=>report.errors.push({case:key,type:'page',message:e.message}));
 p.on('console',m=>{if(m.type()==='error'||/INVALID_(?:OPERATION|VALUE|ENUM)/.test(m.text()))report.errors.push({case:key,type:m.type(),message:m.text().slice(0,500)});});
 await p.goto('https://smoothness.test/',{waitUntil:'domcontentloaded'});
 const start=await p.evaluate(()=>{const ok=startFullLap788();pauseFullLap788(true);const G=GC3D,S=G.S;if(!ok||!S)return {ok};S.qualityChoice='manual';G.setQuality('balanced');S.qualityChoice='manual';S.exportSize=[640,360];G.simReset();for(let i=0;i<120*20;i++)G.step(1/120);G.setView('onboard');S.camBase=null;G.camStep(0);pauseFullLap788(true);return {ok,clock:S.clock,s:S.sim.s,view:S.view,quality:S.quality.name};});
 check(key+': starts with the original drive and requested fixed view',start.ok&&start.view==='onboard'&&start.quality==='balanced',start);
 return {p,context};
}
async function measure(browser,key,file){
 const {p,context}=await open(browser,key,file,{width:640,height:360});
 try{
  await p.evaluate(()=>{const gl=GC3D.S.gl,pixel=new Uint8Array(4);for(let i=0;i<2;i++){GC3D.render();gl.finish();gl.readPixels(320,180,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);}GC3D.S.needsRender=false;});
  const samples=[];
  for(let i=0;i<8;i++){
   samples.push(await p.evaluate(()=>{const G=GC3D,S=G.S,c=__glCounts792,before={...c},pixel=new Uint8Array(4),t=performance.now();G.render();S.gl.finish();S.gl.readPixels(320,180,1,1,S.gl.RGBA,S.gl.UNSIGNED_BYTE,pixel);const ms=performance.now()-t;return {ms,pixel:Array.from(pixel),limitQueries:c.limits-before.limits,bufferData:c.bufferData-before.bufferData,glError:S.gl.getError(),resolution:[S.cv.width,S.cv.height],s:S.sim.s,clock:S.clock,detail:!!S.detail781Enabled};}));
   console.log(key+' render '+(i+1)+'/8 '+samples.at(-1).ms.toFixed(1)+' ms');
  }
  const sorted=samples.map(s=>s.ms).sort((a,b)=>a-b),result=report.cases[key]={samples,medianMs:(sorted[3]+sorted[4])/2,p95Ms:sorted.at(-1),meanMs:samples.reduce((n,s)=>n+s.ms,0)/samples.length};save();
  check(key+': every measured render retains detail and has no GL error',samples.every(s=>s.glError===0&&s.detail&&s.resolution[0]===640&&s.resolution[1]===360),result);
  check(key+': repeated draws do not advance the simulation',samples.every(s=>s.s===samples[0].s&&s.clock===samples[0].clock));
  if(key==='candidate'){
   check('candidate: capability queries are absent after warm-up',samples.every(s=>s.limitQueries===0),samples.map(s=>s.limitQueries));
   check('candidate: dynamic buffers do not reallocate at a steady scene size',samples.every(s=>s.bufferData===0),samples.map(s=>s.bufferData));
   await lifecycle(p,'desktop');
  }
 }finally{await context.close();}
}
async function lifecycle(p,label){
 const state=await p.evaluate(()=>{
  const G=GC3D,S=G.S;pauseFullLap788(true);document.querySelector('#restart').click();const restart={paused:S.paused,button:document.querySelector('#play').textContent,clock:S.clock};
  pauseFullLap788(false);S.last=1;const before={clock:S.clock,s:S.sim.s};S.lost=true;G.frame(900000);const lostGuard=S.clock===before.clock&&S.sim.s===before.s&&S.last===null;S.lost=false;
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));__raf792.flush(1000);const hidden={paused:S.paused,clock:S.clock,s:S.sim.s};
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));__raf792.flush(900000);const resume={paused:S.paused,clock:S.clock,s:S.sim.s};
  __raf792.flush(900017);const next={clock:S.clock,s:S.sim.s};pauseFullLap788(true);
  const hiddenEvent=new Event('pagehide');Object.defineProperty(hiddenEvent,'persisted',{value:true});window.dispatchEvent(hiddenEvent);const stopped=__raf792.size();
  const shownEvent=new Event('pageshow');Object.defineProperty(shownEvent,'persisted',{value:true});window.dispatchEvent(shownEvent);const scheduled=__raf792.size();__raf792.flush(999000);
  const bfcache={stopped,scheduled,paused:S.paused,clock:S.clock,queue:__raf792.size()};
  const original={quality:S.quality.name,scale:S.o.ss,view:S.view,sim:S.sim,cam:S.cam};G.setQuality('balanced');S.o.ss=1;
  const ladder=[];for(let i=0;i<4;i++){G.stepDown();ladder.push({scale:S.o.ss,shadowOff:!!S.shadowOff,bloom:S.bloom!==false,detail:S.detail781Enabled});}
  G.setQuality(original.quality);S.o.ss=original.scale;
  return {restart,lostGuard,before,hidden,resume,next,bfcache,ladder,unchanged:original.sim===S.sim&&original.cam===S.cam&&S.view===original.view};
 });
 check(label+': restarting while paused preserves the pause button and state',state.restart.paused&&state.restart.button==='Play'&&state.restart.clock===0,state.restart);
 check(label+': lost-context frame guard does not render or advance',state.lostGuard);
 check(label+': hidden time is excluded and resume starts without a simulation jump',state.hidden.paused&&!state.resume.paused&&state.resume.clock===state.before.clock&&state.resume.s===state.before.s&&state.next.clock>state.resume.clock&&state.next.clock-state.resume.clock<.03,state);
 check(label+': Back/Forward restoration restarts one callback while preserving pause',state.bfcache.stopped===0&&state.bfcache.scheduled===1&&state.bfcache.queue===1&&state.bfcache.paused,state.bfcache);
 check(label+': adaptive ladder reduces resolution before sunlight or detail',state.ladder.slice(0,3).every((x,i)=>x.scale===[.85,.70,.60][i]&&!x.shadowOff&&x.bloom&&x.detail)&&state.ladder[3].shadowOff&&state.unchanged,state.ladder);
 const supported=await p.evaluate(()=>!!GC3D.S.gl.getExtension('WEBGL_lose_context'));
 check(label+': real context-loss extension is available',supported);
 await p.evaluate(()=>{const S=GC3D.S;window.__beforeLoss792={canvas:S.cv,s:S.sim.s,clock:S.clock,view:S.view,paused:S.paused};window.__contextLossExt792=S.gl.getExtension('WEBGL_lose_context');__contextLossExt792.loseContext();});
 await p.waitForFunction(()=>GC3D.S&&GC3D.S.lost===true);
 const during=await p.evaluate(()=>({disabled:Array.from(document.querySelectorAll('.controls button,.controls select')).every(b=>b.disabled),state:document.querySelector('#state').textContent}));
 check(label+': controls cannot render against a lost context',during.disabled&&during.state.includes('RESTORING'),during);
 await p.evaluate(()=>__contextLossExt792.restoreContext());
 await p.waitForFunction(()=>GC3D.S&&GC3D.S.cv!==__beforeLoss792.canvas&&!GC3D.S.lost,{},{timeout:120000});
 const restored=await p.evaluate(()=>{const G=GC3D,S=G.S,b=__beforeLoss792;S.exportSize=[640,360];G.render();S.gl.finish();S.needsRender=false;return {s:S.sim.s,clock:S.clock,view:S.view,paused:S.paused,before:{s:b.s,clock:b.clock,view:b.view,paused:b.paused},glError:S.gl.getError(),controls:Array.from(document.querySelectorAll('.controls button,.controls select')).every(b=>!b.disabled),detail:S.detail781Enabled,canvasCount:document.querySelectorAll('#stage canvas').length,queue:__raf792.size()};});
 check(label+': graphics restoration retains lap position, view and pause without duplicate canvas/loop',restored.s===restored.before.s&&restored.clock===restored.before.clock&&restored.view===restored.before.view&&restored.paused===restored.before.paused&&restored.glError===0&&restored.controls&&restored.detail&&restored.canvasCount===1&&restored.queue===1,restored);
}
async function productionRecovery(){
 const {open}=require('../../toolchain/harness/open_page');
 const session=await open({pageFile:hosted,W:640,H:540,dpr:1,gl:true}),p=session.page;
 try{
  p.on('console',m=>{if(m.type()==='error'||/INVALID_(?:OPERATION|VALUE|ENUM)/.test(m.text()))report.errors.push({case:'production',type:m.type(),message:m.text().slice(0,500)});});
  await p.waitForFunction(()=>typeof showOpen==='function'&&window.GC3D&&typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});
  await p.evaluate(()=>{
   const G=GC3D,init=G.init;G.init=function(){const result=init.apply(this,arguments);if(G.S)G.S.exportSize=[640,360];return result;};
   G.noGuard=true;localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showview','hero');localStorage.setItem('gc500.showback','circuit3d_day');
   showOpen();if(SHOW.playing)showPause();showClear();
  });
  await p.waitForFunction(()=>GC3D.S&&GC3D.S.gl&&!GC3D.S.lost,null,{timeout:120000});
  const before=await p.evaluate(()=>{const G=GC3D,S=G.S;S.paused=true;G.setQuality('balanced');G.setView('onboard');for(let i=0;i<120*15;i++)G.step(1/120);S.camBase=null;G.camStep(0);G.render();S.gl.finish();
   const state={s:S.sim.s,clock:S.clock,view:S.view,paused:S.paused,scale:S.o.ss,quality:S.quality.name,cam:JSON.stringify(S.cam)};
   window.__productionLoss792={old:S,state,ext:S.gl.getExtension('WEBGL_lose_context')};return state;});
  await p.evaluate(()=>__productionLoss792.ext.loseContext());await p.waitForFunction(()=>GC3D.S&&GC3D.S.lost);
  await p.evaluate(()=>__productionLoss792.ext.restoreContext());await p.waitForFunction(()=>GC3D.S&&GC3D.S!==__productionLoss792.old&&!GC3D.S.lost,null,{timeout:120000});
  const after=await p.evaluate(()=>{const G=GC3D,S=G.S,old=__productionLoss792.old;G.render();S.gl.finish();return {s:S.sim.s,clock:S.clock,view:S.view,paused:S.paused,scale:S.o.ss,quality:S.quality.name,cam:JSON.stringify(S.cam),glError:S.gl.getError(),detail:S.detail781Enabled,oldReleased:!old.trackDetail781&&!old.architecture781&&!old.vegetation781&&!old.sky781&&!old.rt};});
  check('production: actual context restoration retains lap, camera, pause and quality',Object.keys(before).every(k=>before[k]===after[k])&&after.glError===0&&after.detail&&after.oldReleased,{before,after});
  await p.evaluate(()=>showClose());
  check('production: recovery test performs no service writes',session.counts.blocked===0,session.counts);
 }finally{report.errors.push(...session.errors.map(message=>({case:'production',type:'page',message})));await session.browser.close();save();}
}
(async()=>{let browser;try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 await measure(browser,'baseline',files.baseline);await measure(browser,'candidate',files.candidate);
 report.comparison={medianRatio:report.cases.candidate.medianMs/report.cases.baseline.medianMs,baselineMedianMs:report.cases.baseline.medianMs,candidateMedianMs:report.cases.candidate.medianMs};save();
 const {p,context}=await open(browser,'phone',files.candidate,{width:390,height:844});try{await p.evaluate(()=>{GC3D.S.exportSize=[360,640];GC3D.render();GC3D.S.gl.finish();GC3D.S.needsRender=false;});await lifecycle(p,'phone');}finally{await context.close();}
 await browser.close();browser=null;await productionRecovery();
 check('no unexpected page, console or WebGL errors',report.errors.length===0,report.errors);report.complete=true;save();console.log(JSON.stringify({passed:report.checks.filter(c=>c.pass).length,total:report.checks.length,comparison:report.comparison}));
 }catch(e){report.failure=e.stack||String(e);save();throw e;}finally{if(browser)await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
