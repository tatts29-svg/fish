/* Author: Andrew Fisher. Actual rendered preview inspection; no network or records. */
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const project=path.resolve(__dirname,'../..'),file=process.env.PREVIEW||path.join(project,'build/GC500_v7.92/full_lap_preview.html');
const out=process.env.OUT||'/workspace/private-v792-smoke';fs.mkdirSync(out,{recursive:true});
(async()=>{let browser;const errors=[];try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await context.route('**/*',r=>r.request().url()==='https://preview.test/'?r.fulfill({contentType:'text/html',body:fs.readFileSync(file)}):r.abort());
 const p=await context.newPage();p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto('https://preview.test/');
 const report=await p.evaluate(()=>{const ok=startFullLap788();pauseFullLap788(true);const G=GC3D,S=G.S;S.qualityChoice='manual';G.render();return {ok,full:G.fullLapReport788(),smooth:G.smoothnessReport792(),error:S.gl.getError(),initialised:!!S.trackDetail781};});
 if(!report.initialised||report.error||errors.length)throw Error(JSON.stringify({report,errors}));
 await p.screenshot({path:path.join(out,'start.png')});
 await p.evaluate(()=>{const G=GC3D,S=G.S;for(let i=0;i<120*20;i++)G.step(1/120);G.setView('onboard');S.camBase=null;G.camStep(0);G.render();});
 await p.screenshot({path:path.join(out,'track-level.png')});
 fs.writeFileSync(path.join(out,'render-smoke.json'),JSON.stringify({report,errors},null,2));
 console.log(JSON.stringify({ok:report.ok,glError:report.error,pitModules:report.full.track.photoStructures.modules,labels:report.full.track.signage792.labels,errors}));
}finally{if(browser)await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
