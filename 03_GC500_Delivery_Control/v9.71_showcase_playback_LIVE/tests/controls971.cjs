// Author: Andrew Fisher. Read-only Showcase lifecycle and control checks.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
(async()=>{
 const phone=process.env.MOB==='1',s=await open({pageFile:process.env.PAGE,gl:true,W:phone?390:1440,H:phone?844:900,mobile:phone,dpr:1}),p=s.page,R={author:'Andrew Fisher',phone,checks:[]};
 try {
 const expected=process.env.EXPECTED_SHA;assert(expected&&process.env.PAGE);const actual=crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');assert.equal(actual,expected);
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});const originalS=await p.evaluate(()=>JSON.stringify(S));R.sha256=actual;R.bytes=fs.statSync(process.env.PAGE).size;R.defaults=await p.evaluate(()=>({back:showBackPref(),view:showViewGet(),quality:showQualityGet()}));
 const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');R.closedHeapMB=[];
 const check=(name,value)=>{R.checks.push({name,pass:!!value});if(!value)throw Error(name)};
 const evaluate=fn=>p.evaluate(fn);
 check('balanced opening',await evaluate(()=>GC3D.openingQuality()==='balanced'));
 check('loop default',await evaluate(()=>SHOW.loop));
 for(let i=0;i<Number(process.env.CYCLES||3);i++){
  const x=await evaluate(()=>{showOpen();if(SHOW.playing)showPause();return {open:SHOW.open,scene:!!GC3D.S,paused:!SHOW.playing};});
  check('open '+i,x.open&&x.scene&&x.paused);
  const c=await evaluate(()=>{showClose();return !SHOW.open&&!GC3D.S&&!GC3D._raceCarModels&&!LAPS.raf&&!SHOW.timer;});check('cleanup '+i,c);await cdp.send('HeapProfiler.collectGarbage');const metrics=await cdp.send('Performance.getMetrics');R.closedHeapMB.push(metrics.metrics.find(x=>x.name==='JSHeapUsedSize').value/1048576);console.log('cycle',i,R.closedHeapMB.at(-1).toFixed(1)+' MB');
 }
 await evaluate(()=>{showOpen();if(SHOW.playing)showPause();});
 check('quality floor keeps scene',await evaluate(()=>{for(let i=0;i<20;i++)GC3D.stepDown();return !!GC3D.S&&!GC3D.failed;}));
 check('manual quality remains available',await evaluate(()=>{const e=document.getElementById('showQuality');e.value='balanced';e.dispatchEvent(new Event('change',{bubbles:true}));return GC3D.S.quality.name==='balanced';}));
 check('pace works',await evaluate(()=>{const e=document.getElementById('showPace');e.value='0.5';e.dispatchEvent(new Event('change',{bubbles:true}));return GC3D.S.tune.tc===.5;}));
 const modes=await evaluate(()=>Array.from(document.getElementById('showView').options).map(o=>o.value));
 for(const mode of modes){check('camera '+mode,await p.evaluate(value=>{GC3D.setView(value);return !!GC3D.S;},mode));}
 const vehicles=await evaluate(()=>Array.from(document.getElementById('showVehicle').options).map(o=>o.value));
 for(const v of vehicles){check('vehicle '+v,await p.evaluate(value=>{const got=GC3D.setVehicle(value);return got===value;},v));}
 check('figures reveal',await evaluate(()=>{document.getElementById('showCarFocus').click();return !showCarFocusGet()&&!!document.querySelector('#showBody .shwrap');}));
 check('car focus returns',await evaluate(()=>{document.getElementById('showCarFocus').click();return showCarFocusGet();}));
 check('deferred redraw',await evaluate(()=>{render();return showPendingRender918;}));
 await evaluate(()=>{GC3D.setVehicle('car');GC3D.setView('hero');showPause();});
 await new Promise(r=>setTimeout(r,8000));
 check('still open and playing',await evaluate(()=>SHOW.open&&SHOW.playing&&!!GC3D.S&&!GC3D.failed));
 const vis=await evaluate(()=>GC3D.visibility918());check('visibility preparation active',vis.prepared>0&&vis.total>0&&vis.submitted<vis.total);R.visibility=vis;
 if(process.env.SHOT){await evaluate(()=>{if(SHOW.playing)showPause();});await p.screenshot({path:process.env.SHOT,timeout:120000});await evaluate(()=>{if(!SHOW.playing)showPause();});}
 await evaluate(()=>{const e=GC3D.S.gl.getExtension('WEBGL_lose_context');e.loseContext();});
 let seen=false;for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,200));if(await evaluate(()=>!document.getElementById('show3dNote').hidden)){seen=true;break;}}
 console.log('loss diagnostic',await evaluate(()=>({lost:GC3D.S&&GC3D.S.lost,note:document.getElementById('show3dNote').outerHTML,back:document.getElementById('showcase').dataset.back})));
 check('context loss explained',await evaluate(()=>!document.getElementById('show3dNote').hidden));
 let recovered=false;for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,250));if(await evaluate(()=>GC3D.S&&!GC3D.S.lost)){recovered=true;break;}}check('automatic context recovery',recovered);
 await evaluate(()=>show3dRetry());check('retry mounts scene',await evaluate(()=>!!GC3D.S&&!GC3D.S.lost));
 await p.goBack();await new Promise(r=>setTimeout(r,300));check('Back closes',await evaluate(()=>!SHOW.open));
 check('catch-up queued once',await evaluate(()=>!showPendingRender918));
 check('no page errors',s.errors.length===0);check('no operational writes',s.counts.blocked===0);R.errors=s.errors;R.counts=s.counts;
 R.recordUnchanged=await p.evaluate(value=>JSON.stringify(S)===value,originalS);assert(R.recordUnchanged,'Native S changed during controls check');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),expected);fs.writeFileSync(process.env.OUT,JSON.stringify(R,null,2));console.log(JSON.stringify({checks:R.checks.length,failed:R.checks.filter(x=>!x.pass),visibility:vis,errors:s.errors,writes:s.counts.blocked}));} finally {await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
