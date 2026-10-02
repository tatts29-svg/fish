/* Author: Andrew Fisher. Read-only hosted camera, full-lap render and control checks. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE||path.resolve(__dirname,'../../build/GC500_v7.94/GC500_Delivery_Control_hosted.html');
const out=process.env.OUT||'/workspace/private-v794-browser';fs.mkdirSync(out,{recursive:true});
const result={author:'Andrew Fisher',candidate:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),checks:[],views:[],errors:[],blockedWrites:0};
const check=(name,pass,detail)=>{result.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)throw Error(name)};
async function run(phone){
 const name=phone?'phone':'desktop',s=await open({pageFile,W:phone?390:1280,H:phone?844:800,dpr:1,mobile:phone,gl:true}),p=s.page;
 try{
  p.setDefaultTimeout(180000);
  await p.waitForFunction(()=>typeof showOpen==='function'&&GC3D.showcase794&&SYNC.status==='live',null,{timeout:240000});
  await p.evaluate(()=>{localStorage.removeItem('gc500.showview');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showback','circuit3d_day');document.getElementById('showView').value=showViewGet();GC3D.noGuard=true;showOpen();});
  await p.waitForFunction(()=>GC3D.S&&GC3D.S.gl&&GC3D.S.camera794);
  const initial=await p.evaluate(()=>({view:GC3D.S.view,selected:document.getElementById('showView').value,options:[...document.getElementById('showView').options].map(o=>o.value),map:!document.getElementById('showLap794').hidden,gl:GC3D.S.gl.getError()}));
  check(name+': new viewers get Circuit tour and visible route progress',initial.view==='tour'&&initial.selected==='tour'&&initial.options.includes('top')&&initial.map&&initial.gl===0,initial);
  // Drive the real fixed-step frame function; skip GPU work between review frames.
  // Timer completion is separately exercised using the actual scheduler in the VM regression.
  await p.evaluate(()=>{if(SHOW.playing)showPause();window.__render794=GC3D.render;window.__time794=0;GC3D.setQuality('balanced');GC3D.S.qualityChoice='manual';});
  for(let section=0;section<=12;section++){
   const view=await p.evaluate(section=>{
    const G=GC3D,S=G.S,target=section*S.CL.L/12;
    S.paused=false;S.last=null;G.render=()=>{};
    let steps=0;while(S.sim.s-S.gridS<target&&steps++<36000){window.__time794+=1000/60;G.frame(window.__time794);}
    // Review the settled shot shortly after a distance-led handoff, not a black fade midpoint.
    if(section>0)for(let i=0;i<78;i++){window.__time794+=1000/60;G.frame(window.__time794);}
    G.render=window.__render794;S.paused=true;S.last=null;G.camStep(0);G.render();G.showcase794.paint(true);
    const c=G.cameraReport794(),r=G.playback794.report();return {section,distanceM:r.distanceM,progress:r.progress,view:c,gl:S.gl.getError(),finite:S.cam.eye.concat(S.cam.tgt,[S.cam.fov]).every(Number.isFinite)};
   },section);
   result.views.push({device:name,...view});
   check(name+': tour section '+section+' renders a finite clear camera',view.finite&&view.gl===0&&view.view.obstructionClear,view.view);
   await p.screenshot({path:path.join(out,name+'-tour-'+String(section).padStart(2,'0')+'.png'),timeout:180000});
  }
  check(name+': rendered every twelfth of the complete lap',result.views.filter(v=>v.device===name).at(-1).progress>=1);
  for(const camera of ['top','wide','chase','onboard','hero','heli']){
   await p.selectOption('#showView',camera);
   const c=await p.evaluate(()=>{const G=GC3D,S=G.S,start=S.sim.s;G.render=()=>{};for(let i=0;i<85;i++){window.__time794+=1000/60;G.frame(window.__time794);}G.render=window.__render794;G.render();return {camera:G.cameraReport794(),paused:S.paused,still:S.sim.s===start,gl:S.gl.getError()};});
   check(name+': paused '+camera+' selection settles without driving',c.paused&&c.still&&!c.camera.transitionActive&&c.gl===0,c.camera);
   if(camera==='top'||camera==='wide')check(name+': '+camera+' contains the complete route',c.camera.wholeCircuitInFrame,c.camera);
   if(camera==='top'||camera==='onboard')await p.screenshot({path:path.join(out,name+'-'+camera+'.png'),timeout:180000});
  }
  if(phone){
   const dimensions=await p.evaluate(()=>{const show=document.getElementById('showcase'),stage=show.querySelector('.shstage').getBoundingClientRect();return {height:stage.height,viewport:innerHeight,options:getComputedStyle(document.getElementById('showOptions794')).display,overflow:show.scrollWidth>innerWidth+1};});
   check('phone: camera controls leave most of the screen for the circuit',dimensions.height>dimensions.viewport*.60&&!dimensions.overflow&&dimensions.options!=='none',dimensions);
   await p.click('#showOptions794');
   check('phone: Options reveals backdrop and figures controls',await p.locator('#showBackdrop').isVisible()&&await p.locator('#showCarFocus').isVisible());
   await p.click('#showOptions794');
  }
  const appearance=await p.evaluate(()=>{const G=GC3D,old=G.S,start=old.sim.s,clock=old.clock,view=old.view;showSetBack('circuit3d');const S=G.S;G.render();return {newScene:S!==old,retained:S.sim.s===start&&S.clock===clock&&S.view===view,paused:S.paused,night:!S.look.day,disposed:!old.trackDetail781&&!old.architecture781,gl:S.gl.getError()};});
  check(name+': Day/Night retains lap camera and pause, releases old graphics',appearance.newScene&&appearance.retained&&appearance.paused&&appearance.night&&appearance.disposed&&appearance.gl===0,appearance);
  await p.evaluate(()=>{showSetBack('circuit3d_day');GC3D.render();});
  const loss=await p.evaluate(()=>{const S=GC3D.S;window.__loss794={s:S.sim.s,clock:S.clock,view:S.view,old:S};const ex=S.gl.getExtension('WEBGL_lose_context');if(!ex)return false;ex.loseContext();setTimeout(()=>ex.restoreContext(),100);return true;});
  if(loss){
   await p.waitForFunction(()=>GC3D.S&&GC3D.S!==window.__loss794.old&&!GC3D.S.lost,null,{timeout:180000});
   const recovered=await p.evaluate(()=>{const S=GC3D.S,b=window.__loss794;GC3D.render();return {same:S.sim.s===b.s&&S.clock===b.clock&&S.view===b.view,paused:S.paused,canvases:document.querySelectorAll('canvas.gc3d').length,gl:S.gl.getError()};});
   check(name+': graphics recovery preserves paused lap and camera once',recovered.same&&recovered.paused&&recovered.canvases===1&&recovered.gl===0,recovered);
  }
  const close=await p.evaluate(()=>{const S=GC3D.S;showClose();return {hidden:document.getElementById('showcase').hidden,map:document.getElementById('showLap794').hidden,disposed:!S.trackDetail781&&!S.architecture781};});
  check(name+': close releases graphics and hides orientation map',close.hidden&&close.map&&close.disposed,close);
 }finally{
  result.errors.push(...s.errors.map(message=>({device:name,message})));result.blockedWrites+=s.counts.blocked;await s.browser.close();fs.writeFileSync(path.join(out,'browser794_checks.json'),JSON.stringify(result,null,2)+'\n');
 }
}
(async()=>{try{const devices=process.env.PHONE_FIRST? [true,false]:[false,true];for(const phone of devices)await run(phone);check('no page errors or record writes',result.errors.length===0&&result.blockedWrites===0);result.complete=true;console.log(JSON.stringify({passed:result.checks.length,errors:result.errors.length}));}catch(e){result.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'browser794_checks.json'),JSON.stringify(result,null,2)+'\n');}})();
