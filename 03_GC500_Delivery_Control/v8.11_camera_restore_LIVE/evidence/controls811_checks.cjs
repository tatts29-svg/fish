/* Author: Andrew Fisher. Real restored-camera controls, selection and recovery.
 * PAGE=absolute.html OUT=/private/evidence node controls811_checks.cjs
 * Service requests are GET only. Screenshots/full runtime evidence stay private.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),cf=require(path.join(root,'toolchain/harness/curlfetch'));
const fetch=cf.curlFetch;let blocked=0;cf.curlFetch=(u,h,m='GET',b)=>{if(m!=='GET'){blocked++;return Promise.reject(Error('Read-only camera check'));}return fetch(u,h,m,b);};
const {open}=require(path.join(root,'toolchain/harness/open_page'));
const file=process.env.PAGE,out=process.env.OUT;if(!file||!out)throw Error('PAGE and private OUT are required');fs.mkdirSync(out,{recursive:true});
const R={author:'Andrew Fisher',pageSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),checks:[],vehicles:[],errors:[],operationalWrites:0};
const check=(name,pass,detail)=>{console.log((pass?'PASS ':'FAIL ')+name);R.checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name);};
const save=()=>fs.writeFileSync(path.join(out,'controls811.json'),JSON.stringify(R,null,2)+'\n');
(async()=>{
 for(const mobile of (process.env.MOB==='1'?[true]:[false,true])){
  const device=mobile?'phone':'desktop',s=await open({pageFile:file,hash:'#today',mobile,W:mobile?390:1280,H:mobile?844:800,gl:true}),p=s.page;
  try{
   await p.waitForFunction(()=>typeof showOpen==='function'&&window.GC3D,null,{timeout:180000});
   await p.evaluate(()=>{localStorage.setItem('gc500.showview','tour');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showcarfocus','on');localStorage.setItem('gc500.showvehicle','car');});
   await p.click('#moreBtn');await p.click('#showcaseBtn',{noWaitAfter:true});
   await p.waitForFunction(()=>GC3D.S?.gl&&GC3D.S?.pose&&GC3D.S.cv.isConnected,null,{timeout:180000});
   const opened=await p.evaluate(()=>{window.__return811=SHOW.ret;if(SHOW.playing)showPause();GC3D.S.qualityChoice='manual';return{view:GC3D.S.view,stored:showViewGet(),choice:document.getElementById('showView').value,options:[...document.getElementById('showView').options].map(o=>[o.value,o.textContent]),fit:!!GC3D.vehicleCamera800,override:!!GC3D.camera794};});
   check(device+' former Tour preference opens original Car follow',opened.view==='hero'&&opened.stored==='hero'&&opened.choice==='hero',opened);
   check(device+' exactly nine original named choices',JSON.stringify(opened.options)===JSON.stringify([['hero','Car follow'],['auto','Auto — car cameras'],['onboard','Driver'],['chase','Chase'],['heli','Drone'],['top','Overhead'],['wide','Wide'],['detail','Car detail'],['frontdetail','Front detail']])&&!opened.fit&&!opened.override);
   await p.selectOption('#showView','chase');if(process.env.SKIP_REOPEN!=='1'){await p.keyboard.press('Escape');await p.click('#moreBtn');await p.click('#showcaseBtn',{noWaitAfter:true});
   await p.waitForFunction(()=>GC3D.S?.gl&&GC3D.S.cv.isConnected,null,{timeout:60000}).catch(async e=>{R.reopenFailureState=await p.evaluate(()=>({open:SHOW.open,back:showRenderer(),state:!!GC3D.S,canvas:!!GC3D.S?.cv?.isConnected,failed:GC3D.failed||null,plate:document.getElementById('showPlate').dataset.built,view:showViewGet()}));throw e;});}
   const reopened=await p.evaluate(()=>{window.__return811=SHOW.ret;if(SHOW.playing)showPause();GC3D.S.qualityChoice='manual';return{view:GC3D.S.view,stored:showViewGet(),choice:document.getElementById('showView').value};});
   check(device+(process.env.SKIP_REOPEN==='1'?' valid in-place selection':' valid selection survives close/reopen'),reopened.view==='chase'&&reopened.stored==='chase'&&reopened.choice==='chase',reopened);
   await p.selectOption('#showView','detail');await p.click('#seTrig');
   for(const kind of ['car','car_vms','car_loo','forklift','boom','scissor','tractor']){
    await p.click('#sePanel .se-item[data-v="'+kind+'"]');
    const result=await p.evaluate(()=>{const G=GC3D,S=G.S;G.renderAt(12,'detail');S.paused=true;S.needsRender=false;return{key:S.vehicleKey,choice:document.getElementById('showVehicle').value,view:S.view,shot:S.shotName,clock:S.clock,cam:S.cam,gl:S.gl.getError(),paused:S.paused};});
    R.vehicles.push({device,...result});check(device+' original detail renders '+kind,result.key===kind&&result.choice===kind&&result.paused&&result.gl===0&&result.cam.eye.concat(result.cam.tgt,[result.cam.fov]).every(Number.isFinite),result);
    await p.click('#sePanel .se-x');await p.screenshot({path:path.join(out,device+'-'+kind+'-detail.png')});await p.click('#seTrig');save();
   }
   await p.click('#sePanel .se-item[data-v="car"]');await p.click('#sePanel .se-x');await p.selectOption('#showView','hero');
   const night=await p.evaluate(()=>{const G=GC3D;G.renderAt(12,'hero');G.S.paused=true;G.S.needsRender=false;const before={s:G.S.sim.s,clock:G.S.clock,view:G.S.view};showSetBack('circuit3d');return{before,after:{s:G.S.sim.s,clock:G.S.clock,view:G.S.view},night:!G.S.look.day,paused:G.S.paused,gl:G.S.gl.getError()};});
   check(device+' day/night retains pose and restored camera choice',night.night&&night.paused&&night.gl===0&&JSON.stringify(night.before)===JSON.stringify(night.after),night);
   await p.evaluate(()=>{window.__restore811={ext:GC3D.S.gl.getExtension('WEBGL_lose_context'),s:GC3D.S.sim.s,view:GC3D.S.view};if(!__restore811.ext)throw Error('context-loss extension unavailable');__restore811.ext.loseContext();});
   await p.waitForFunction(()=>GC3D.S?.lost,null,{timeout:30000});await p.evaluate(()=>__restore811.ext.restoreContext());
   await p.waitForFunction(()=>GC3D.S?.gl&&!GC3D.S.lost&&!GC3D.S.gl.isContextLost()&&GC3D.S.cv.isConnected,null,{timeout:180000});
   const recovered=await p.evaluate(()=>{const G=GC3D;G.camStep(0);G.render();return{view:G.S.view,expectedView:__restore811.view,s:G.S.sim.s,expectedS:__restore811.s,paused:G.S.paused,gl:G.S.gl.getError(),cam:G.S.cam};});
   check(device+' context recovery retains paused pose and original camera choice',recovered.view===recovered.expectedView&&recovered.s===recovered.expectedS&&recovered.paused&&recovered.gl===0&&recovered.cam.eye.concat(recovered.cam.tgt).every(Number.isFinite),recovered);
   await p.selectOption('#showView','auto');
   await p.evaluate(()=>{showSetBack('circuit3d_day');GC3D.playback794.restart();if(SHOW.playing)showPause();GC3D.S.qualityChoice='manual';});
   for(const seconds of [18,20]){
    const motion=await p.evaluate(seconds=>{const G=GC3D,S=G.S;while(S.clock+1e-8<seconds)G.step(1/120);G.render();S.paused=true;S.needsRender=false;G.showcase794.paint(true);return{clock:S.clock,beat:S.sceneBeat,shot:S.shotName,view:S.view,lap:G.playback794.report(),s:S.sim.s,grid:S.gridS,M:G.M_PER_PT,gl:S.gl.getError()};},seconds);
    check(device+' native restarted Auto at '+seconds+'s has current lap progress and race cue',motion.view==='auto'&&motion.beat!=='whole-lap-tour'&&motion.gl===0&&Math.abs(motion.lap.distanceM-Math.max(0,(motion.s-motion.grid)*motion.M))<.001,motion);
    await p.screenshot({path:path.join(out,device+'-auto-'+seconds+'.png')});
   }
   await p.keyboard.press('Escape');const closed=await p.evaluate(()=>({closed:!SHOW.open&&document.getElementById('showcase').hidden,focusMatches:document.activeElement===__return811,expectedFocus:__return811&&(__return811.id||__return811.tagName),actualFocus:document.activeElement.id||document.activeElement.tagName,inert:[...document.body.children].some(e=>e.hasAttribute('inert')),listeners:!!(SHOW.onKey||SHOW.onVis||SHOW.onMotion)}));check(device+' Escape closes actual UI entry and clears inert/listeners',closed.closed&&!closed.inert&&!closed.listeners,closed);if(!closed.focusMatches){(R.findings||(R.findings=[])).push({name:device+' native focus return to hidden Tools menu item',detail:closed,scope:'Original showClose source unchanged; release-blocking finding reported separately.'});R.checks.push({name:device+' actual UI close returns focus',pass:false,detail:closed});}else check(device+' actual UI close returns focus',true,closed);
   check(device+' no page exceptions',s.errors.length===0,s.errors);
  }finally{R.errors.push(...s.errors);(R.networkCounts||(R.networkCounts=[])).push({device,...s.counts});R.blocked=(R.blocked||0)+s.counts.blocked;await s.browser.close();save();}
 }
 R.complete=true;R.blocked+=blocked;R.passed=R.checks.filter(c=>c.pass).length;process.exitCode=R.checks.some(c=>!c.pass)?1:0;save();console.log(JSON.stringify({passed:R.passed,failed:R.checks.filter(c=>!c.pass).length,errors:R.errors,sha:R.pageSha256}));
})().catch(e=>{R.failure=e.stack;save();console.error(e.stack);process.exitCode=1;});
