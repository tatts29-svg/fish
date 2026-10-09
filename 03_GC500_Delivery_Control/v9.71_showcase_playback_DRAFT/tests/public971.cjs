// Author: Andrew Fisher. Actual public bytes and UI, without page/state substitution.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
(async()=>{
 const phone=process.env.MOB==='1',s=await open({gl:true,mobile:phone,W:phone?390:1280,H:phone?844:800,dpr:1});
 const p=s.page;let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
 try{
  await p.waitForFunction(()=>typeof S!=='undefined'&&typeof showOpen==='function',null,{timeout:120000});
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
  const before=await p.evaluate(()=>JSON.stringify(S));
  ok(await p.evaluate(()=>document.body.innerText.includes('v9.71')),'public footer');
  await p.evaluate(()=>{localStorage.setItem('gc500.showback','circuit3d_day');showOpen();});
  await p.waitForFunction(()=>GC3D.startupReport971()?.shown&&GC3D.S?.trackDetailReport?.photoLandmarks970?.landmarks?.length===5,null,{timeout:120000});
  const r=await p.evaluate(()=>{const G=GC3D,S=G.S;const playing=SHOW.playing;showPause();return {landmarks:S.trackDetailReport.photoLandmarks970.landmarks.map(x=>x.id),earlierPhotoFinish:!!S.trackDetailReport.photoTrack920,startup:G.startupReport971(),burnFrom:S.tune.burnFrom_s,burnTo:S.tune.burnTo_s,maxOpeningSmoke:S.tune.maxOpeningSmoke,playing,paused:!SHOW.playing,quality:G.openingQuality(),loop:SHOW.loop,failed:G.failed||null,hiddenMedia:G.playbackRuntime971.report()};});
  ok(JSON.stringify(r.landmarks)===JSON.stringify(['PB1','PB2','OT4','PB3','OT5']),'five actual scene landmarks');
  ok(r.earlierPhotoFinish,'earlier concrete and fence detail retained');
  ok(r.startup.prepared&&r.startup.shown&&!r.startup.pending,'startup completed');
  ok(r.burnFrom===1.35&&r.burnTo===2.15&&r.maxOpeningSmoke===96,'opening tuning live');
  ok(r.playing&&r.paused&&r.loop&&r.quality==='balanced'&&!r.failed,'playback and saved defaults');
  ok(r.hiddenMedia.active,'background media suspended');
  if(process.env.SHOT)await p.screenshot({path:process.env.SHOT,timeout:120000});
  await p.goBack();await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!SHOW.open&&!GC3D.S&&!GC3D._raceCarModels&&!GC3D.playbackRuntime971.report().active),'Back closes and releases Showcase');
  ok((await p.evaluate(()=>JSON.stringify(S)))===before,'native record unchanged');
  ok(s.counts.page===0,'no substituted page');ok(s.errors.length===0,'zero page errors');ok(s.counts.blocked===0,'zero operational write attempts');
  const result={author:'Andrew Fisher',actualPublic:true,mobile:phone,checks,pass:true,...r,pageErrors:s.errors,writeAttempts:s.counts.blocked};
  if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({pass:true,checks,mobile:phone,actualPublic:true,landmarks:r.landmarks,writeAttempts:s.counts.blocked}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
