// Author: Andrew Fisher. Real decoding and lazy playback; every operational write is blocked.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=JSON.parse(fs.readFileSync(process.env.MACHINE995_TEST_MEDIA,'utf8'));
const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1',requests=[];
const catalogue=new Map(Object.values(files.roles).map(r=>[r.file,r]));
for(const row of catalogue.values()){const body=fs.readFileSync(row.path);assert.equal(sha(body),row.sha256);assert.equal(body.length,row.bytes);}
let publicHash,versionReads=0;
const fetcher=require('../../toolchain/harness/curlfetch'),original=fetcher.curlFetch;
fetcher.curlFetch=async(url,headers={},method='GET',body)=>{
 const parsed=new URL(url),row=catalogue.get(path.basename(parsed.pathname));
 if(parsed.pathname==='/api/version'&&method==='GET')versionReads++;
 if(parsed.origin==='https://gc500-production.up.railway.app'&&row&&method==='GET'){
  requests.push({file:row.file,range:headers.range||null});
  if(!publicMode){
   const bytes=fs.readFileSync(row.path),h={'content-type':row.type,'accept-ranges':'bytes','cache-control':'no-store','access-control-allow-origin':'*'};
   const match=/^bytes=(\d+)-(\d*)$/.exec(headers.range||'');
   if(match){const start=+match[1],end=match[2]?Math.min(+match[2],bytes.length-1):bytes.length-1;return{status:206,headers:{...h,'content-range':`bytes ${start}-${end}/${bytes.length}`},body:bytes.subarray(start,end+1)};}
   return{status:200,headers:h,body:bytes};
  }
 }
 const response=await original(url,headers,method,body);
 if(publicMode&&/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))publicHash=sha(response.body);
 return response;
};
const{open}=require('../../toolchain/harness/open_page');
const checks=[];function check(ok,name){checks.push({name,pass:!!ok});assert(ok,name);}
const out=process.env.OUTDIR||'/workspace/private-gc500-integration995/'+(mobile?'phone':'desktop');fs.mkdirSync(out,{recursive:true});
(async()=>{
 if(!publicMode)assert.equal(sha(fs.readFileSync(process.env.PAGE)),process.env.EXPECTED_SHA);
 const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#today',mobile,W:mobile?390:1440,H:mobile?844:960}),p=h.page;
 const evidence={author:'Andrew Fisher',scope:files.scope,mobile,actualPublic:publicMode,sha256:process.env.EXPECTED_SHA,checks};
 const report=()=>p.evaluate(()=>MachineFilm995.report());
 const play=async()=>{await p.locator('#cwHero').scrollIntoViewIfNeeded();await p.waitForFunction(()=>{const v=document.querySelector('#cwHero video');return v&&!v.paused&&v.readyState>=2&&v.currentTime>.15},null,{timeout:30000});};
 const paused=()=>p.waitForFunction(()=>document.querySelector('#cwHero video')?.paused,null,{timeout:5000});
 const videoRequests=()=>requests.filter(r=>r.file.endsWith('.mp4'));
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  if(publicMode){check(h.counts.page===0,'Actual public HTML, no substitution');check(publicHash===process.env.EXPECTED_SHA,'Public bytes match verified candidate');}
  const before=await p.evaluate(()=>({record:JSON.stringify(S),money:JSON.stringify(pl770Model())}));
  check(videoRequests().length===0,'Other initial page downloads no machine movie');
  await p.evaluate(()=>{localStorage.setItem('gc500.motion','off');motionApply();go('coatesway');});
  await p.waitForSelector('#cwHero video');await p.locator('#cwHero').scrollIntoViewIfNeeded();
  check(await p.locator('#cwHero video').evaluate(v=>v.preload==='none'&&!v.getAttribute('src')&&v.querySelectorAll('source').length===0&&v.muted&&v.loop&&v.playsInline),'One lazy muted inline looping video; no eager source');
  check(videoRequests().length===0,'Motion off shows native poster without movie download');
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{localStorage.removeItem('gc500.motion');motionApply();});
  check(await p.locator('#cwHero video').evaluate(v=>v.paused&&!v.getAttribute('src')&&!!v.poster),'Reduced motion retains poster and no film source');
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>motionApply());await play();
  const selected=mobile?'preview':'full',row=files.roles[selected],first=await report();
  check(first.quality===selected&&first.sourceLoads===1,'CSS viewport chooses one '+selected+' source');
  check(await p.locator('#cwHero video').evaluate((v,row)=>v.currentSrc.endsWith(row.file)&&v.videoWidth===row.width&&v.videoHeight===row.height,row),'Selected media actually decodes at declared dimensions');
  check(videoRequests().every(r=>r.file===row.file),'Only the chosen movie is fetched');
  const start=await p.locator('#cwHero video').evaluate(v=>({time:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames}));
  await p.waitForFunction(s=>{const v=document.querySelector('#cwHero video');return v.currentTime>s.time+.2&&v.getVideoPlaybackQuality().totalVideoFrames>s.frames},start,{timeout:10000});
  check(true,'Actual decoded frames and playback time advance');
  const settled=await report(),pollsBefore=versionReads;
  await p.waitForTimeout(16500);
  const sustained=await report();evidence.steadyLoop={seconds:16.5,versionPolls:versionReads-pollsBefore,before:settled,after:sustained};
  check(versionReads-pollsBefore>=3&&sustained.mounts===settled.mounts&&sustained.disposals===settled.disposals&&sustained.sourceLoads===1&&!sustained.paused,'Film remains mounted and playing through16seconds and3nativeversionpolls');
  await p.locator('#cwHero video').evaluate(v=>{v.currentTime=v.duration-.12;});
  await p.waitForFunction(()=>{const v=document.querySelector('#cwHero video');return !v.paused&&v.currentTime<1},null,{timeout:10000});
  check(true,'Actual media loops across the end without stopping');
  check(await p.locator('#cwHero').evaluate(n=>!n.querySelector('.gc-media-status')&&!n.querySelector('video').classList.contains('gc-media-wait')),'Decoded film is visible without an incorrect picture-loading overlay');
  await p.screenshot({path:path.join(out,'coates-way-film.png')});
  await p.evaluate(()=>{document.querySelector('#pane-coatesway').lastElementChild.scrollIntoView({block:'end'});document.querySelector('main').scrollTop=document.querySelector('main').scrollHeight;window.scrollTo(0,document.documentElement.scrollHeight);});await paused();check((await report()).paused,'Film pauses when card leaves the viewport');
  await play();
  await p.evaluate(()=>{localStorage.setItem('gc500.motion','off');motionApply();});await paused();check((await report()).paused,'Tools Motion off pauses active film');
  await p.evaluate(()=>{localStorage.removeItem('gc500.motion');motionApply();});await play();
  await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await paused();check((await report()).paused,'Print pauses film');
  await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await play();
  // Browser visibility is read-only; this local property fixture exercises the same native event handler.
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await paused();check((await report()).paused,'Hidden document pauses film');
  await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await play();
  await p.waitForFunction(()=>!document.querySelector('#cwOpenMachine')?.disabled,null,{timeout:30000});
  await p.locator('#cwHero').click();await p.waitForFunction(()=>MACHINE.open,null,{timeout:10000});await paused();
  check((await report()).paused,'Native Open machine pauses background film');
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!MACHINE.open,null,{timeout:10000});await play();
  check(await p.evaluate(()=>!MACHINE.open&&document.activeElement?.id==='cwHero'),'Native Escape closes machine and returns original hero focus');
  for(let i=0;i<3;i++){
   await p.evaluate(()=>go('today'));await paused();
   const off=await report();check(off.paused&&!off.allowed,'Tab exit '+(i+1)+' pauses film');
   await p.evaluate(()=>go('coatesway'));await play();
   const now=await report();check(now.active===1&&now.mounts-now.disposals===1&&now.sourceLoads===1,'Return '+(i+1)+' has one owned lifecycle and one source');
  }
  await p.emulateMedia({reducedMotion:'reduce'});await paused();check((await report()).paused,'Live OS reduced-motion change pauses film');
  await p.emulateMedia({reducedMotion:'no-preference'});await play();
  if(!mobile){
   const loads=(await report()).sourceLoads;
   await p.evaluate(()=>{localStorage.setItem('gc500.motion','off');motionApply();document.querySelector('#cwHero video').dispatchEvent(new Event('error'));});await paused();
   check((await report()).sourceLoads===loads,'A full-source error while motion is off does not start a hidden download');
   await p.evaluate(()=>{localStorage.removeItem('gc500.motion');motionApply();});await play();
   const fallback=await report();check(fallback.quality==='preview'&&fallback.sourceLoads===loads+1,'Returning to an allowed view applies the pending one-time preview fallback');
  }
  const after=await p.evaluate(b=>({record:JSON.stringify(S)===b.record,money:JSON.stringify(pl770Model())===b.money}),before);
  check(after.record&&after.money,'Film leaves operational records and P&L unchanged');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal document overflow');
  check(h.errors.length===0,'No browser errors');check(h.counts.blocked===0,'No operational writes');
  evidence.pass=true;evidence.lifecycle=await report();evidence.requests=requests;evidence.errors=h.errors;evidence.writes=h.counts.blocked;
 }catch(error){evidence.pass=false;evidence.error=String(error.stack||error);evidence.lifecycle=await report().catch(()=>null);evidence.errors=h.errors;throw error;}
 finally{fs.writeFileSync(path.join(out,'player995.json'),JSON.stringify(evidence,null,2));await h.browser.close();console.log(JSON.stringify({pass:evidence.pass,mobile,scope:files.scope,checks:checks.length}));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
