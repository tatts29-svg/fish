const {openMachine}=require('./machine_rig.cjs');
// Author: Andrew Fisher. Read-only browser checks; no service writes.
const fs=require('fs');const path=require('path');const out=process.env.OUT||process.cwd();fs.mkdirSync(out,{recursive:true});const root=process.env.PREVIEW_ROOT||path.resolve(__dirname,'../build');
(async()=>{const mobile=process.env.MOB==='1';const m=await openMachine({root,W:mobile?390:1440,H:mobile?844:960,dpr:1,mobile});const checks=[];const check=(n,ok)=>{checks.push({name:n,pass:!!ok});if(!ok)throw Error(n);};try{
 await m.page.waitForFunction(()=>window.__cw?.ready,{},{timeout:180000});
 await m.page.evaluate(()=>__cw.renderer.setAnimationLoop(null));
 check('preview button present',await m.page.locator('#workshop-enter').isVisible());
 check('enter', (await m.page.evaluate(()=>__workshop.enter())).ok);
 let s=await m.page.evaluate(()=>({active:__workshop.active,locked:__cw.drive.locked,count:__workshop.lift.partIds.length,ids:__workshop.lift.partIds,dock:getComputedStyle(document.querySelector('.dock')).display}));
 check('actual engine assembly',s.count>80);check('drive locked',s.locked);check('no cockpit or suspension lifted',!s.ids.some(x=>/cockpit|suspension|differential|steering/.test(x)));check('existing dock kept out of preview',s.dock==='none');
 const poses=[];
 for(const p of [0,.48,.75,1]){
   const d=await m.page.evaluate(p=>{__workshop.lift.setProgress(p);__workshop.shadowDirty=true;window.__reviewFrame(performance.now()+100);return __workshop.lift.diagnostics;},p);poses.push(d);check('finite pose '+p,d.loadWorld.every(Number.isFinite));
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
 check('no page errors',m.errors.length===0);
 fs.writeFileSync(out+'/'+(mobile?'phone':'desktop')+'-checks.json',JSON.stringify({checks,poses,errors:m.errors},null,2));console.log(JSON.stringify({mobile,checks:checks.length,errors:m.errors}));
 }finally{await m.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
