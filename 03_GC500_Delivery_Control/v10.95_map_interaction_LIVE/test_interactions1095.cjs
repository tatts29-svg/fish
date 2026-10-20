/* Author: Andrew Fisher. Private GET-only map interaction baseline, no site writes. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const tc=path.resolve(__dirname,'../toolchain');
// Mutable index responses have Cache-Control:no-cache. The shared rig's static cache
// currently ignores that header, so use a fresh GET key for those index responses only.
const transport=require(tc+'/harness/curlfetch'),fetchOriginal=transport.curlFetch;
transport.curlFetch=(url,headers,method,body)=>{const u=new URL(url);if(method==='GET'&&u.origin==='https://gc500-production.up.railway.app'&&/^\/w\/Coates-GC500-2026\/.+index\.html$/.test(u.pathname)){u.searchParams.set('mapreview1095',String(Date.now()));url=u.href;}return fetchOriginal(url,headers,method,body);};
const {open}=require(tc+'/harness/open_page');
const mobile=process.env.MOB==='1',out=path.resolve(process.env.OUT||'.');
const repo=path.resolve(__dirname,'../..');if(!process.env.OUT||out===repo||out.startsWith(repo+path.sep))throw Error('OUT must point to a private directory outside the repository');
fs.mkdirSync(out,{recursive:true});
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#map',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1,gl:true});const p=h.page;
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&window.GC500Refresh904?.report().settled&&typeof EXP!=='undefined'&&EXP.frame?.contentWindow?.GC500Shape1060?.state.available,null,{timeout:180000});
 const f=await(await p.$('#expFrame')).contentFrame();await f.evaluate(()=>GC500Explorer.ready);
 await p.emulateMedia({reducedMotion:'reduce'});
 const meta=await f.evaluate(()=>({scripts:[...document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')),maxZoom:MAX_Z,minZoom:MIN_Z,mode,shape:GC500Shape1060.state}));
 if(process.env.HOST_CAPTURE_MODULE){const capture=require(path.resolve(process.env.HOST_CAPTURE_MODULE));fs.writeFileSync(path.join(out,'host-model.json'),JSON.stringify(await p.evaluate(capture)));}
 const approvedRefs=await p.evaluate(()=>holdAssets(()=>allAssets().filter(a=>andrewPin1084(a)).map(a=>a.key)));
 fs.writeFileSync(path.join(out,'child-model.json'),JSON.stringify(await f.evaluate(keys=>({items:ITEMS.filter(r=>keys.includes(r.code)),hostPlaced:HOST.placed.filter(r=>keys.includes(r.key)),hostItems:HOST.items.filter(r=>keys.includes(r.key))}),approvedRefs)));
 fs.writeFileSync(path.join(out,'location-model.json'),JSON.stringify(await p.evaluate(()=>holdAssets(()=>allAssets().map(a=>({ref:a.key,active:!a._cancelled,destination:destinationOf(a),where:whereText(a),zone:zone816(a),navigation:navPoint917(a),supplier:Supplier996.where(a)}))))));
 const code=await f.evaluate(()=>{const sh=parent.gc500MapShapes1060();return ITEMS.find(i=>i.places.length===1&&sh.refs[i.code]&&!sh.refs[i.code].shared&&sh.refs[i.code].comps.length>2)?.code||ITEMS.find(i=>i.places.length===1&&sh.refs[i.code]&&!sh.refs[i.code].shared)?.code;});assert(code);
 await f.evaluate(code=>GC500Explorer.find(code),code);await f.waitForFunction(()=>!gotoAnim887&&!zAnim,null,{timeout:20000});
 await p.waitForTimeout(1500);
 const cdp=await p.context().newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 await f.evaluate(()=>{window.__mapReview={draw:[],long:[],frames:[]};const old=drawMarks;window.drawMarks=function(v){const t=performance.now();try{return old(v)}finally{__mapReview.draw.push(performance.now()-t)}};window.drawMarks.__shape1060=true;new PerformanceObserver(l=>l.getEntries().forEach(e=>__mapReview.long.push({t:e.startTime,ms:e.duration}))).observe({type:'longtask'});});
 const cases=[];
 for(const mode of ['original','hybrid'])for(const zoom of [8,32,160]){
  const detailStart=Date.now();await f.evaluate(mode=>setMode(mode),mode);await f.evaluate(code=>{const it=ITEMS.find(i=>i.code===code);showCategory(it.cat.id);return GC500Explorer.find(code);},code);await f.waitForFunction(()=>!gotoAnim887&&!zAnim,null,{timeout:20000});await f.evaluate(zoom=>GC500Explorer.zoom(zoom),zoom);
  let detailReady=true;try{await f.waitForFunction(({mode,zoom})=>{const x=__frames.at(-1);return x&&x.mode===mode&&Math.abs(x.z-zoom)<.001&&!x.vtMiss&&(mode==='original'||(!x.satMiss&&!x.satBlank));},{mode,zoom},{timeout:8000,polling:100});}catch(_){detailReady=false;}const detailWaitMs=Date.now()-detailStart;
  const r=await f.evaluate(async()=>{__mapReview.draw=[];__mapReview.long=[];__frames.length=0;const frameBefore=0,raf=[],start=performance.now(),M=sheetToDevice(currentView().scale,sw,sh),a=screenToSource(sw*.43,sh*.47),selectedCode=selected?.code;if(!selectedCode||!marks.length)throw Error('Selected reference must be drawn for performance measurement');
   for(let i=0;i<36;i++){await new Promise(resolve=>requestAnimationFrame(t=>{raf.push(t);camera.cx+=Math.sin(i/5)*3/currentView().scale;camera.cy+=Math.cos(i/5)*2/currentView().scale;touchInteraction();changeView(false);resolve();}));}
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   return {elapsed:performance.now()-start,raf:raf.slice(1).map((v,i)=>v-raf[i]),draw:__mapReview.draw.slice(),render:__frames.slice(frameBefore).map(x=>({ms:x.ms,z:x.z,vtMiss:x.vtMiss,satBlank:x.satBlank})),long:__mapReview.long.slice(),dimensions:[canvas.width,canvas.height,sw,sh,dpr],shape:GC500Shape1060.state,selectionPreserved:selected?.code===selectedCode};
  });cases.push({mode,zoom,detailReady,detailWaitMs,...r});
 }
 const profile=(await cdp.send('Profiler.stop')).profile;fs.writeFileSync(path.join(out,'cpu-profile.json'),JSON.stringify(profile));
 const before=await f.evaluate(()=>({camera:JSON.stringify(camera),selected:selected?.code}));await p.evaluate(()=>syncFooter());await f.evaluate(()=>{complete897Pull();GC500Shape1060.pull();GC500Explorer.refresh(true);});await p.waitForTimeout(500);
 const after=await f.evaluate(()=>({camera:JSON.stringify(camera),selected:selected?.code}));
 const idleStart=await f.evaluate(()=>({at:performance.now(),frames:__frames.length}));await p.waitForTimeout(2000);
 const idle=await f.evaluate(start=>({frames:__frames.slice(start.frames),long:__mapReview.long.filter(x=>x.t>=start.at),shape:GC500Shape1060.state}),idleStart);
 await p.evaluate(()=>go('today'));await p.waitForTimeout(250);const hiddenStart=await f.evaluate(()=>GC500Shape1060.state.paints);await p.waitForTimeout(1200);const hiddenEnd=await f.evaluate(()=>GC500Shape1060.state.paints);await p.evaluate(()=>go('map'));await p.waitForTimeout(250);
 let updateChecks=null,updateError=null;if(process.env.EXPECT_PIN_FIX==='1'){const test=require('./tests/runtime_updates1095.cjs');try{updateChecks=await test(p,f);}catch(e){updateError=e;updateChecks={pass:false,error:e.message};}}
 let focused=null;if(process.env.FOCUS_REF){const test=require('./tests/focus_reference1095.cjs');focused=await test(p,f,process.env.FOCUS_REF,out,process.env.SCREENSHOT==='1');}
 const report={sourceSha256:process.env.PAGE?crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'):process.env.GC500_VERIFIED_PUBLIC_SHA||null,actualPublicReadback:!process.env.PAGE&&!!process.env.GC500_VERIFIED_PUBLIC_SHA,environment:{browser:await h.browser.version(),softwareGraphics:true,viewport:mobile?'390x844 DPR2':'1440x1000 DPR1'},focused,updateChecks,author:'Andrew Fisher',mobile,meta,cases,refreshPreserved:JSON.stringify(before)===JSON.stringify(after),idle,hiddenPaints:hiddenEnd-hiddenStart,errors:h.errors,counts:h.counts};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
 const stats=a=>{a=a.slice().sort((a,b)=>a-b);return {n:a.length,median:a[Math.floor(a.length/2)]||0,p95:a[Math.floor(a.length*.95)]||0,max:a.at(-1)||0}};
 console.log(JSON.stringify({mobile,cases:cases.map(x=>({mode:x.mode,zoom:x.zoom,detailReady:x.detailReady,detailWaitMs:x.detailWaitMs,draw:stats(x.draw),raf:stats(x.raf),render:stats(x.render.map(y=>y.ms)),dimensions:x.dimensions,visible:x.shape.drawn,selectionPreserved:x.selectionPreserved})),updateChecks,refreshPreserved:report.refreshPreserved,hiddenPaints:report.hiddenPaints,errors:h.errors,counts:h.counts},null,2));
 assert.equal(h.errors.length,0,'No page errors during map review');assert.equal(h.counts.blocked,0,'No record write attempts');
 if(updateError)throw updateError;
 if(process.env.SCREENSHOT==='1')await p.locator('#expFrame').screenshot({path:path.join(out,'map.png')});
 }finally{if(h)await h.browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
