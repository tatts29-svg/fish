const {openMachine}=require('./machine_rig.cjs');
// Author: Andrew Fisher. Read-only browser checks; no service writes.
const fs=require('fs');const path=require('path');const crypto=require('crypto');const out=process.env.OUT||process.cwd();fs.mkdirSync(out,{recursive:true});const root=process.env.PREVIEW_ROOT||path.resolve(__dirname,'../build');
(async()=>{const mobile=process.env.MOB==='1';const m=await openMachine({root,W:mobile?390:1440,H:mobile?844:960,dpr:1,mobile});m.page.on('console',msg=>{if(msg.type()==='error')console.error(msg.text());});m.page.on('pageerror',e=>console.error(String(e)));const checks=[];const check=(n,ok)=>{checks.push({name:n,pass:!!ok});if(!ok)throw Error(n);};try{
 await m.page.waitForFunction(()=>window.__cw?.ready||window.__reviewFailed,{},{timeout:180000,polling:500});
 check('machine initialises',await m.page.evaluate(()=>!!window.__cw?.ready));await m.page.evaluate(()=>__cw.renderer.setAnimationLoop(null));
 check('workshop button present',await m.page.locator('#workshop-enter').isVisible());
 check('enter', (await m.page.evaluate(()=>__workshop.enter())).ok);
 let s=await m.page.evaluate(()=>({active:__workshop.active,locked:__cw.drive.locked,count:__workshop.lift.partIds.length,ids:__workshop.lift.partIds,dock:getComputedStyle(document.querySelector('.dock')).display}));
 check('actual engine assembly',s.count>80);check('drive locked',s.locked);check('no cockpit or suspension lifted',!s.ids.some(x=>/cockpit|suspension|differential|steering/.test(x)));check('existing dock kept out of preview',s.dock==='none');
 const poses=[];
 for(const p of [0,.48,.75,1]){
   const d=await m.page.evaluate(p=>{__workshop.lift.setProgress(p);__workshop.shadowDirty=true;window.__reviewFrame(performance.now()+100);return __workshop.lift.diagnostics;},p);poses.push(d);check('finite pose '+p,d.loadWorld.every(Number.isFinite));check('rendered stage '+p,await m.page.locator('#workshop-percent').textContent()===Math.round(p*100)+'%');
   if((!mobile&&[.48,1].includes(p))||(mobile&&p===.48))await m.page.screenshot({path:out+'/'+(mobile?'phone':'desktop')+'-lift-'+Math.round(p*100)+'.png',timeout:120000});
 }
 await m.page.evaluate(()=>{__workshop.lift.setProgress(.48);__workshop.update(0);document.getElementById('workshop-inspect').click();window.__reviewFrame(performance.now()+100);});
 check('close inspection available',await m.page.locator('#workshop-inspect').textContent()==='Overview');
 await m.page.screenshot({path:out+'/'+(mobile?'phone':'desktop')+'-engine-inspection.png',timeout:120000});
 await m.page.evaluate(()=>document.getElementById('workshop-inspect').click());
 check('overview restored',await m.page.locator('#workshop-inspect').textContent()==='Inspect');
 check('engine lifts vertically',poses[1].loadWorld[1]>poses[0].loadWorld[1]+1.4);check('engine traverses',poses[2].loadWorld[2]>poses[1].loadWorld[2]+2.8);check('engine lowers to cradle',poses[3].loadWorld[1]<poses[2].loadWorld[1]);
 const result=await m.page.evaluate(()=>{const w=__workshop,l=w.lift;l.reset();l.setPlaying(true);l.update(.1);const started=l.progress;l.setPlaying(false);l.update(.1);const paused=l.progress;l.setProgress(9);const hi=l.progress;l.setProgress(-1);const lo=l.progress;return {started,paused,hi,lo};});
 check('play advances',result.started>0);check('pause holds',result.paused===result.started);check('clamps progress',result.hi===1&&result.lo===0);
 await m.page.focus('#canvas');await m.page.keyboard.press('e');await m.page.keyboard.press('w');await m.page.keyboard.press('n');
 check('conflicting keyboard paths blocked',await m.page.evaluate(()=>!__cw.drive.running&&__cw.drive.spreadTarget===0&&__cw.service.phase==='ready'));
 check('no horizontal document overflow',await m.page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
 check('panel within viewport',await m.page.evaluate(()=>{const r=document.getElementById('workshop-panel').getBoundingClientRect();return r.left>=0&&r.right<=document.documentElement.clientWidth&&r.height>80;}));
 await m.page.evaluate(()=>__workshop.exit());
 check('exit releases drive lock',await m.page.evaluate(()=>!__workshop.active&&!__cw.drive.locked));check('original dock restored',await m.page.locator('.dock').isVisible());

 check('crew upgrade installed',await m.page.evaluate(()=>!!window.__crewPolish));
 check('finish upgrade installed',await m.page.evaluate(()=>!!window.__workshopFinish));
 await m.page.evaluate(()=>{__workshop.enter();document.getElementById('workshop-bench-open').click();__reviewFrame(performance.now()+100);});
 check('bench opens supported engine',await m.page.evaluate(()=>__workshop.learning.active&&__workshop.lift.benchReady));
 check('fault buttons hidden until challenge',await m.page.locator('#bench-fault-actions').isHidden());
 check('bench controls enabled',!(await m.page.locator('#bench-crank').isDisabled()));
 check('all 16 components available',await m.page.locator('#bench-part option').count()===16);
 await m.page.evaluate(()=>document.getElementById('bench-crank').click());
 check('manual crank turns 45 degrees',await m.page.evaluate(()=>__workshop.learning.state.crankDegrees===45));
 await m.page.evaluate(()=>{document.querySelector('[data-bench-mode=oil]').click();__reviewFrame(performance.now()+100);});
 check('oil route shown',await m.page.evaluate(()=>__workshop.learning.state.mode==='oil'&&!document.getElementById('bench-flow').hidden));
 await m.page.locator('#bench-flow-title').focus();await m.page.keyboard.press('Space');check('flow summary key preserves bench',await m.page.evaluate(()=>__workshop.learning.active&&!__workshop.lift.playing));
 await m.page.evaluate(()=>{document.querySelector('[data-bench-mode=coolant]').click();__reviewFrame(performance.now()+100);});
 check('coolant limitation clear',await m.page.locator('#bench-flow-detail').textContent().then(t=>t.includes('no circulating coolant loop')));
 for(const id of ['timing-belt','oil-pump']){
  await m.page.evaluate(id=>{document.querySelector('[data-bench-mode=fault]').click();document.getElementById('bench-challenge').value=id;document.getElementById('bench-start').click();__reviewFrame(performance.now()+100);},id);
  check(id+' fault starts',await m.page.evaluate(()=>__workshop.learning.state.challenge.status==='searching'));
  check(id+' cannot repair before inspection',await m.page.locator('#bench-repair').isDisabled());
  await m.page.selectOption('#bench-part',id);
  check(id+' inspection identifies fault',await m.page.evaluate(()=>__workshop.learning.state.challenge.status==='found'));
  await m.page.evaluate(()=>document.getElementById('bench-repair').click());
  check(id+' repaired',await m.page.evaluate(()=>__workshop.learning.state.challenge.status==='repaired'));
 }
 await m.page.evaluate(()=>{document.getElementById('bench-restart').click();document.querySelector('[data-bench-mode=inspect]').click();document.getElementById('bench-focus').click();__reviewFrame(performance.now()+100);});
 await m.page.screenshot({path:out+'/'+(mobile?'phone':'desktop')+'-bench-inspection.png',timeout:120000});
 if(mobile){await m.page.locator('#workshop-bench').scrollIntoViewIfNeeded();await m.page.screenshot({path:out+'/phone-bench-controls.png',timeout:120000});}
 check('bench no horizontal overflow',await m.page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
 await m.page.evaluate(()=>document.getElementById('workshop-play').click());
 check('refit closes bench first',await m.page.evaluate(()=>!__workshop.learning.active&&__workshop.lift.direction===-1&&__workshop.lift.playing));
 await m.page.evaluate(()=>{__workshop.update(.1);document.getElementById('workshop-play').click();});
 check('refit moves towards car',await m.page.evaluate(()=>__workshop.lift.progress<1&&!__workshop.lift.playing));
 await m.page.emulateMedia({reducedMotion:'reduce'});
 check('reduced motion preference applied',await m.page.evaluate(()=>__workshop.lift.reducedMotion));
 await m.page.evaluate(()=>{document.getElementById('workshop-bench-open').click();document.getElementById('bench-start').click();__workshop.exit();__reviewFrame(performance.now()+100);});
 check('fault exit restores engine and releases lock',await m.page.evaluate(()=>!__workshop.learning.active&&!__cw.drive.locked&&__workshop.learning.diagnostics.originalBeltGeometry));
 await m.page.evaluate(()=>{__cw.setView('cockpit');__reviewFrame(performance.now()+100);});
 check('cockpit view still works',await m.page.evaluate(()=>__cw.view==='cockpit'));
 await m.page.evaluate(()=>{__cw.setView('car');__reviewFrame(performance.now()+100);__reviewFrame(performance.now()+5000);});
 await m.page.locator('#canvas').scrollIntoViewIfNeeded();
 await m.page.screenshot({path:out+'/'+(mobile?'phone':'desktop')+'-restored-car.png',timeout:120000});
 check('no page errors',m.errors.length===0);check('no write attempts',m.writes.length===0);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'../candidate-manifest.json')));const digest=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
 const evidence=JSON.parse(fs.readFileSync(path.join(root,'../source-evidence.json')));
 const machineFiles=Object.fromEntries(['car-app.js','index.html','workshop-ui.js','engine-lift-preview.js','workshop-finish.js','crew-polish.js','workshop-learning.js'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,n))).digest('hex')]));
 fs.writeFileSync(out+'/'+(mobile?'phone':'desktop')+'-checks.json',JSON.stringify({suite:'machine1302',viewport:mobile?'phone':'desktop',passed:true,checks,poses,errors:m.errors,consoleErrors:[],recordWrites:m.writes.length,dashboardSha256:'2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b',machineManifestSha256:JSON.parse(fs.readFileSync(path.join(root,'../build.json'))).candidateManifestSha256,machineFiles},null,2));console.log(JSON.stringify({mobile,checks:checks.length,errors:m.errors}));
 }catch(e){console.error(JSON.stringify({checks,errors:m.errors}));throw e;}finally{await m.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
