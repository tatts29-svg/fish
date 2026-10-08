// Author: Andrew Fisher. Actual public GET-only smoke, without a substituted page.
const fs=require('fs'),path=require('path'),{open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
(async()=>{
 const phone=process.env.MOB==='1',s=await open({gl:true,mobile:phone,W:phone?390:1280,H:phone?844:800,dpr:1}),p=s.page;
 await p.evaluate(()=>{localStorage.setItem('gc500.showback','circuit3d_day');showOpen();});
 await p.waitForFunction(()=>!!GC3D.S?.trackDetailReport?.photoTrack920,null,{timeout:120000});
 const r=await p.evaluate(()=>{const S=GC3D.S,r=S.trackDetailReport;const playing=SHOW.playing;showPause();return {photo:r.photoTrack920,playing,paused:!SHOW.playing,quality:GC3D.openingQuality(),loop:SHOW.loop,failed:GC3D.failed||null};});
 if(process.env.SHOT)await p.screenshot({path:process.env.SHOT,timeout:120000});
 await p.goBack();await p.waitForTimeout(300);r.closed=await p.evaluate(()=>!SHOW.open&&!GC3D.S&&!GC3D._raceCarModels);r.errors=s.errors;r.writes=s.counts.blocked;
 fs.writeFileSync(process.env.OUT,JSON.stringify(r,null,2));console.log(JSON.stringify(r));await s.browser.close();
 if(!r.photo||!r.playing||!r.paused||!r.closed||!r.loop||r.quality!=='balanced'||r.failed||r.errors.length||r.writes)process.exit(1);
})().catch(e=>{console.error(e.stack);process.exit(1)});
