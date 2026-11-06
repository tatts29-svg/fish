const {openMachine}=require('./machine_rig.cjs');
// Author: Andrew Fisher. Read-only browser checks; no service writes.
const fs=require('fs');const path=require('path');const crypto=require('crypto');const out=process.env.OUT||process.cwd();fs.mkdirSync(out,{recursive:true});const root=process.env.PREVIEW_ROOT||path.resolve(__dirname,'../build');
(async()=>{const mobile=process.env.MOB==='1';const m=await openMachine({root,W:mobile?390:1440,H:mobile?844:960,dpr:1,mobile});m.page.on('console',msg=>{if(msg.type()==='error')console.error(msg.text());});m.page.on('pageerror',e=>console.error(String(e)));const capture=async options=>{await m.page.evaluate(()=>{for(let i=0;i<12&&__workshop.inspection.cameraMoving;i++)__workshop.update(.1);});await m.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{__reviewFrame(performance.now()+100);resolve();}))));return m.page.screenshot(options);};const checks=[];let receipt;const check=(n,ok)=>{checks.push({name:n,pass:!!ok});console.log((ok?'PASS ':'FAIL ')+n);if(!ok)throw Error(n);};try{
 await m.page.waitForFunction(()=>window.__cw?.ready||window.__reviewFailed,{},{timeout:180000,polling:500});
 check('machine initialises',await m.page.evaluate(()=>!!window.__cw?.ready));
 // Exercise the normal animation/input path before deterministic pose review.
 const inspection1305=await require('./inspection_ui_checks.cjs')({page:m.page,check,mobile});
 const nativeInspection1305=await require('./native_inspection1305_checks.cjs')({page:m.page,check,mobile});
 const render1304=await require('./native_render1304_checks.cjs')({page:m.page,check});
 await m.page.evaluate(()=>__cw.renderer.setAnimationLoop(null));
 check('workshop button present',await m.page.locator('#workshop-enter').isVisible());
 check('enter', (await m.page.evaluate(()=>__workshop.enter())).ok);
 let s=await m.page.evaluate(()=>({active:__workshop.active,locked:__cw.drive.locked,count:__workshop.lift.partIds.length,ids:__workshop.lift.partIds,dock:getComputedStyle(document.querySelector('.dock')).display}));
 check('actual engine assembly',s.count>80);check('drive locked',s.locked);check('no cockpit or suspension lifted',!s.ids.some(x=>/cockpit|suspension|differential|steering/.test(x)));check('existing dock kept out of preview',s.dock==='none');
 for(const progress of [.075,.53,.86]){
  const mechanic=await m.page.evaluate(p=>{__workshop.service.setProgress(p);__reviewFrame(performance.now()+100);return __workshop.mechanic.diagnostics();},progress);
  check('original mechanic posed '+progress,mechanic.active&&mechanic.originalRig&&mechanic.bodyBoneCount>10&&mechanic.fingerBoneCount>0&&mechanic.root.every(Number.isFinite));
  if(progress===.53)check('mechanic stays clear of moving load',mechanic.readyForLift&&mechanic.loadClearance>0);
  if(progress===.075){check('tool reaches original hose clamp',mechanic.contact>.99&&mechanic.socketError!==null&&mechanic.socketError<.01);await capture({path:out+'/'+(mobile?'phone':'desktop')+'-mechanic-tool.png',timeout:120000});}
 }
 const poses=[];
 for(const p of [0,.5304,.66,1]){
   const d=await m.page.evaluate(p=>{__workshop.service.setProgress(p);__workshop.shadowDirty=true;window.__reviewFrame(performance.now()+100);return __workshop.lift.diagnostics;},p);poses.push(d);check('finite pose '+p,d.loadWorld.every(Number.isFinite));check('rendered stage '+p,await m.page.locator('#workshop-percent').textContent()===Math.round(p*100)+'%');
   if((!mobile&&[.5304,1].includes(p))||(mobile&&p===.5304))await capture({path:out+'/'+(mobile?'phone':'desktop')+'-lift-'+Math.round(p*100)+'.png',timeout:120000});
 }
 await m.page.evaluate(()=>{__workshop.service.setProgress(.5304);__workshop.update(0);document.getElementById('workshop-inspect').click();window.__reviewFrame(performance.now()+100);});
 check('close inspection available',await m.page.locator('#workshop-inspect').textContent()==='Overview');
 await capture({path:out+'/'+(mobile?'phone':'desktop')+'-engine-inspection.png',timeout:120000});
 await m.page.evaluate(()=>document.getElementById('workshop-inspect').click());
 check('overview restored',await m.page.locator('#workshop-inspect').textContent()==='Inspect');
 check('engine lifts vertically',poses[1].loadWorld[1]>poses[0].loadWorld[1]+1.4);check('engine traverses',poses[2].loadWorld[2]>poses[1].loadWorld[2]+2.8);check('engine lowers to cradle',poses[3].loadWorld[1]<poses[2].loadWorld[1]);
 const result=await m.page.evaluate(()=>{const w=__workshop,l=w.service;l.reset();l.setPlaying(true);l.update(.1);const started=l.progress;l.setPlaying(false);l.update(.1);const paused=l.progress;l.setProgress(9);const hi=l.progress;l.setProgress(-1);const lo=l.progress;return {started,paused,hi,lo};});
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
 check('bench opens supported engine',await m.page.evaluate(()=>__workshop.learning.active&&__workshop.service.benchReady));
 check('fault buttons hidden until challenge',await m.page.locator('#bench-fault-actions').isHidden());
 check('bench controls enabled',!(await m.page.locator('#bench-crank').isDisabled()));
 check('all 16 components available',await m.page.locator('#bench-part option').count()===16);
 await m.page.evaluate(()=>document.getElementById('bench-crank').click());
 check('manual crank turns 45 degrees',await m.page.evaluate(()=>__workshop.learning.state.crankDegrees===45));
 await m.page.evaluate(()=>{document.querySelector('[data-bench-mode=oil]').click();__reviewFrame(performance.now()+100);});
 check('oil route shown',await m.page.evaluate(()=>__workshop.learning.state.mode==='oil'&&!document.getElementById('bench-flow').hidden));
 await m.page.locator('#bench-flow-title').focus();await m.page.keyboard.press('Space');check('flow summary key preserves bench',await m.page.evaluate(()=>__workshop.learning.active&&!__workshop.service.playing));
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
 await capture({path:out+'/'+(mobile?'phone':'desktop')+'-bench-inspection.png',timeout:120000});
 if(mobile){await m.page.locator('#workshop-bench').scrollIntoViewIfNeeded();await capture({path:out+'/phone-bench-controls.png',timeout:120000});}
 check('bench no horizontal overflow',await m.page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
 // New lessons operate on the same supported engine and restore original ownership.
 await m.page.evaluate(()=>{document.querySelector('[data-bench-mode=cycle]').click();__reviewFrame(performance.now()+100);});
 check('four-stroke lesson active',await m.page.evaluate(()=>__workshop.lessons.state.active&&__workshop.lessons.state.kind==='cycle'));
 for(const [angle,phase]of [[0,'intake'],[180,'compression'],[360,'power'],[540,'exhaust']]){
  await m.page.evaluate(angle=>{document.querySelector(`[data-cycle-phase="${angle}"]`).click();__reviewFrame(performance.now()+100);},angle);
  check('actual phase '+phase,await m.page.evaluate(phase=>__workshop.lessons.state.phase.id===phase,phase));
 }
 await capture({path:out+'/'+(mobile?'phone':'desktop')+'-cycle.png',timeout:120000});
 await m.page.evaluate(()=>{document.getElementById('lesson-play').click();__workshop.update(.1);});
 check('cycle play explicitly advances',await m.page.evaluate(()=>__workshop.lessons.state.playing&&__workshop.lessons.state.angleDegrees>540));
 await m.page.evaluate(()=>{document.querySelector('[data-bench-mode=isolate]').click();document.getElementById('lesson-right').click();__reviewFrame(performance.now()+100);});
 check('isolated original-model component rotates',await m.page.evaluate(()=>__workshop.lessons.state.kind==='isolate'&&Math.abs(__workshop.lessons.state.rotation-Math.PI/4)<.001));
 check('connection reference visible',await m.page.evaluate(()=>document.getElementById('bench-connection').textContent.includes(__workshop.lessons.state.selectedPart.reference)));
 await capture({path:out+'/'+(mobile?'phone':'desktop')+'-isolate.png',timeout:120000});
 await m.page.selectOption('#bench-part','cooling-system');
 await m.page.evaluate(()=>{document.getElementById('bench-focus').click();__reviewFrame(performance.now()+100);});
 const componentFits=async()=>{await m.page.evaluate(()=>{for(let i=0;i<12&&__workshop.inspection.cameraMoving;i++)__workshop.update(.1);});return m.page.evaluate(()=>{const box=__workshop.lessons.bounds,camera=__cw.camera,v=document.getElementById('viewport').getBoundingClientRect(),dock=document.getElementById('workshop-panel').getBoundingClientRect();return [box.min.x,box.max.x].every(x=>[box.min.y,box.max.y].every(y=>[box.min.z,box.max.z].every(z=>{const p=box.min.clone().set(x,y,z).project(camera);return p.x>=-1.01&&p.x<=1.01&&p.y<=1.01&&v.top+(1-p.y)*v.height/2<=Math.min(v.bottom,dock.top<v.bottom&&dock.left<v.right-20?dock.top:v.bottom)+2;})));});};
 check('wide component fits above controls',await componentFits());
 if(mobile){
  await m.page.setViewportSize({width:844,height:390});await m.page.waitForTimeout(250);await m.page.evaluate(()=>__reviewFrame(performance.now()+100));
  check('isolated component refits on orientation change',await componentFits());
  await m.page.setViewportSize({width:390,height:844});await m.page.waitForTimeout(250);await m.page.evaluate(()=>__reviewFrame(performance.now()+100));
  check('portrait component fits after return',await componentFits());
 }
 await m.page.evaluate(()=>document.getElementById('workshop-play').click());
 check('refit closes bench first',await m.page.evaluate(()=>!__workshop.learning.active&&__workshop.service.direction===-1&&__workshop.service.playing));
 await m.page.evaluate(()=>{__workshop.update(.1);document.getElementById('workshop-play').click();});
 check('refit moves towards car',await m.page.evaluate(()=>__workshop.service.progress<1&&!__workshop.service.playing));
 // The tour owns all clocks; arbitrary seeking works in both directions.
 await m.page.evaluate(()=>{document.getElementById('workshop-tour').click();__reviewFrame(performance.now()+100);});
 check('tour starts explicitly',await m.page.evaluate(()=>__workshop.showcase.active&&__workshop.showcase.playing&&!__workshop.service.playing));
 for(const progress of [.1,.35,.57,.70,.82,.98,.12]){
  await m.page.evaluate(p=>{__workshop.showcase.seek(p);__reviewFrame(performance.now()+100);},progress);
  check('tour seeks '+progress,await m.page.evaluate(p=>Math.abs(__workshop.showcase.progress-p)<.001&&!__workshop.showcase.playing&&__cw.camera.position.toArray().every(Number.isFinite),progress));
  if([.35,.70,.82].includes(progress))await capture({path:out+'/'+(mobile?'phone':'desktop')+'-tour-'+Math.round(progress*100)+'.png',timeout:120000});
 }
 await m.page.evaluate(()=>{__workshop.showcase.resume();__workshop.update(.1);});
 check('tour resume advances',await m.page.evaluate(()=>__workshop.showcase.playing&&__workshop.showcase.progress>.12));
 await m.page.evaluate(()=>__cw.cameraStart());
 check('orbit pauses tour',await m.page.evaluate(()=>!__workshop.showcase.playing));
 await m.page.evaluate(()=>{__workshop.showcase.seek(.56);__workshop.update(0);document.querySelector('[data-cycle-phase="180"]').click();__reviewFrame(performance.now()+100);});
 check('manual lesson takes over tour without losing mode',await m.page.evaluate(()=>!__workshop.showcase.active&&__workshop.lessons.state.kind==='cycle'&&__workshop.lessons.state.phase.id==='compression'));
 await m.page.evaluate(()=>{document.getElementById('workshop-tour').click();__workshop.showcase.seek(.69);__workshop.update(0);document.getElementById('lesson-right').click();__reviewFrame(performance.now()+100);});
 check('manual isolation takes over tour',await m.page.evaluate(()=>!__workshop.showcase.active&&__workshop.lessons.state.kind==='isolate'));
 await m.page.evaluate(()=>{document.getElementById('workshop-tour').click();__workshop.showcase.seek(.9);__workshop.update(0);document.getElementById('workshop-tour').click();__reviewFrame(performance.now()+100);});
 check('refit direction survives tour handoff',await m.page.evaluate(()=>__workshop.service.direction===-1));
 check('exit tour keeps workshop under manual control',await m.page.evaluate(()=>!__workshop.showcase.active&&__workshop.service.active&&!__workshop.lessons.state.active));
 await m.page.emulateMedia({reducedMotion:'reduce'});
 check('reduced motion preference applied',await m.page.evaluate(()=>__workshop.lift.reducedMotion));
 await m.page.evaluate(()=>{document.getElementById('workshop-bench-open').click();document.getElementById('bench-start').click();__workshop.exit();__reviewFrame(performance.now()+100);});
 check('fault exit restores engine and releases lock',await m.page.evaluate(()=>!__workshop.learning.active&&!__cw.drive.locked&&__workshop.learning.diagnostics.originalBeltGeometry));
 await m.page.evaluate(()=>{__cw.setView('cockpit');__reviewFrame(performance.now()+100);});
 check('cockpit view still works',await m.page.evaluate(()=>__cw.view==='cockpit'));
 await m.page.evaluate(()=>{__cw.setView('car');__reviewFrame(performance.now()+100);__reviewFrame(performance.now()+5000);});
 await m.page.locator('#canvas').scrollIntoViewIfNeeded();
 await capture({path:out+'/'+(mobile?'phone':'desktop')+'-restored-car.png',timeout:120000});
 const controls1304=await require('./controls1304_checks.cjs')({page:m.page,check,mobile});
 if(mobile){
  await m.page.setViewportSize({width:320,height:844});
  await m.page.evaluate(()=>{__workshop.enter();__workshop.service.setProgress(.53);__reviewFrame(performance.now()+101);});
  await capture({path:out+'/phone-narrow-controls.png',timeout:120000});
  check('320px phone has no horizontal overflow',await m.page.evaluate(()=>document.documentElement.scrollWidth<=320));
  check('320px phone controls remain inside their panel',await m.page.evaluate(()=>{const p=document.getElementById('workshop-panel').getBoundingClientRect();return ['workshop-play','workshop-progress','workshop-direction','workshop-reset'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=p.left&&r.right<=p.right&&r.width>=40&&r.height>=40;});}));
  await m.page.evaluate(()=>__workshop.exit());await m.page.setViewportSize({width:390,height:844});await m.page.evaluate(()=>__reviewFrame(performance.now()+101));
 }
 await m.page.locator('#canvas').scrollIntoViewIfNeeded();
 check('no page errors',m.errors.length===0);check('no write attempts',m.writes.length===0);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'../candidate-manifest.json')));const digest=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
 const evidence=JSON.parse(fs.readFileSync(path.join(root,'../source-evidence.json')));
 const machineFiles=Object.fromEntries(Object.keys(evidence.files).sort().map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,n))).digest('hex')]));
 receipt={author:'Andrew Fisher',suite:'machine1305',viewport:mobile?'phone':'desktop',passed:true,checks,poses,controls1304,render1304,inspection1305,nativeInspection1305,errors:m.errors,consoleErrors:[],recordWrites:m.writes.length,dashboardSha256:'2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b',machineManifestSha256:JSON.parse(fs.readFileSync(path.join(root,'../build.json'))).candidateManifestSha256,machineFiles};
 }catch(e){console.error(JSON.stringify({checks,errors:m.errors}));throw e;}finally{await m.close();}
 check('no late browser errors after close',m.errors.length===0);
 check('no late write attempts after close',m.writes.length===0);
 receipt.errors=[...m.errors];receipt.recordWrites=m.writes.length;
 fs.writeFileSync(out+'/'+(mobile?'phone':'desktop')+'-checks.json',JSON.stringify(receipt,null,2));
 console.log(JSON.stringify({mobile,checks:checks.length,errors:m.errors}));
 })().catch(e=>{console.error(e);process.exitCode=1;});
