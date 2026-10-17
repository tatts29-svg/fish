/* Author: Andrew Fisher. Read-only Showcase integration and resource checks. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE||path.resolve(__dirname,'../../build/GC500_v7.92/GC500_Delivery_Control_hosted.html');
const out=process.env.OUT||'/workspace/private-v792-integration';fs.mkdirSync(out,{recursive:true});
const result={author:'Andrew Fisher',candidate:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),checks:[],errors:[],blockedWrites:0};
const check=(name,pass,detail)=>{result.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)throw Error(name)};
async function run(phone){
 const name=phone?'phone':'desktop',s=await open({pageFile,W:phone?390:1280,H:phone?844:720,dpr:1,mobile:phone,gl:true}),p=s.page;
 try{
  await p.waitForFunction(()=>typeof showOpen==='function'&&window.GC3D&&typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:240000});
  p.setDefaultTimeout(120000);
  const initial=await p.evaluate(()=>({button:!!document.getElementById('detail781Button'),old:typeof GC3D.restartPreview781,views:[...document.getElementById('showView').options].map(o=>({value:o.value,hidden:o.hidden,disabled:o.disabled})),day:!!GC3D.fullLap788}));
  check(name+': obsolete short scene absent and original cameras offered',!initial.button&&initial.old==='undefined'&&initial.day,initial);
  await p.evaluate(()=>{GC3D.noGuard=true;localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showview','hero');localStorage.setItem('gc500.showback','circuit3d_day');showOpen();if(SHOW.playing)showPause();showClear();});
  await p.waitForFunction(()=>GC3D.S&&GC3D.S.gl&&!GC3D.S.lost);
  const scene=await p.evaluate(()=>{const G=GC3D,S=G.S;S.paused=true;G.setQuality('balanced');S.qualityChoice='manual';G.render();return{detail:S.detail781Enabled,report:G.fullLapReport788(),view:S.view,loop:!!S.previewLoop781,gl:S.gl.getError(),views:[...document.getElementById('showView').options].map(o=>({value:o.value,hidden:o.hidden,disabled:o.disabled}))}});
  check(name+': full-page original day scene receives full-circuit detail',scene.detail&&scene.report.track.coverageFraction===1&&scene.report.vegetation.fullEligibleCoverage&&scene.report.architecture.fullEligibleCoverage,scene.report);
  check(name+': original camera selection and pause retained',scene.view==='hero'&&!scene.loop&&scene.views.filter(o=>!o.hidden&&!o.disabled).length>4);
  check(name+': full-page render has no GL error',scene.gl===0);
  const shadow=await p.evaluate(()=>{const G=GC3D,S=G.S;G.render();const R=S.sunShadow,texture=R.tex,fb=R.fb,start=S.sim.s,M=G.M_PER_PT||6;let steps=0;while((S.sim.s-start)*M<130&&steps<30000){G.step(1/120);steps++;}G.render();return {advanced:(S.sim.s-start)*M,textureReused:S.sunShadow.tex===texture,fbReused:S.sunShadow.fb===fb,shadowComplete:S.sunShadow.ok,gl:S.gl.getError()};});
  check(name+': moving sunlight reuses its framebuffer and texture',shadow.advanced>=130&&shadow.textureReused&&shadow.fbReused&&shadow.shadowComplete&&shadow.gl===0,shadow);
  const fallback=await p.evaluate(()=>{const G=GC3D,S=G.S;S.shadowOff=true;if(S.sunShadow)S.sunShadow.ok=false;const before=S.sim.s;for(let i=0;i<120*5;i++)G.step(1/120);G.render();const off=!S.sunShadow.ok&&S.shadowOff;G.setQuality('balanced');G.render();return {off,recovered:S.sunShadow.ok&&!S.shadowOff,gl:S.gl.getError(),moved:S.sim.s>before};});
  check(name+': shadow fallback stays off while moving and can be restored',fallback.off&&fallback.recovered&&fallback.gl===0&&fallback.moved,fallback);

  await p.screenshot({path:path.join(out,name+'-showcase.png'),timeout:180000});
  const lifecycle=await p.evaluate(()=>{const G=GC3D,old=G.S;window.__old788=old;showSetBack('circuit3d');if(SHOW.playing)showPause();showClear();return {newScene:G.S!==old,oldDisposed:!old.trackDetail781&&!old.architecture781&&!old.vegetation781&&!old.sky781,selected:document.getElementById('showBackdrop').value};});
  check(name+': original day/night remount disposes the old enhancement resources',lifecycle.newScene&&lifecycle.oldDisposed,lifecycle);
  const night=await p.evaluate(()=>{const G=GC3D,S=G.S;S.paused=true;G.render();return {look:S.look.name,day:S.look.day,detail:S.detail781Enabled,gl:S.gl.getError()};});
  check(name+': original night backdrop remains selectable',!night.day&&night.gl===0,night);
  const disposed=await p.evaluate(()=>{const S=GC3D.S;showSetBack('black');return !S.trackDetail781&&!S.architecture781&&!S.vegetation781&&!S.sky781;});
  check(name+': switching away disposes added resources',disposed);
  await p.evaluate(()=>{showSetBack('circuit3d_day');if(SHOW.playing)showPause();showClear();GC3D.S.paused=true;GC3D.render();});
  check(name+': day remount restores all full-lap resources',await p.evaluate(()=>!!(GC3D.S.trackDetail781&&GC3D.S.architecture781&&GC3D.S.vegetation781&&GC3D.S.sky781)));
  const closed=await p.evaluate(()=>{const S=GC3D.S;showClose();return {hidden:document.getElementById('showcase').hidden,disposed:!S.trackDetail781&&!S.architecture781&&!S.vegetation781&&!S.sky781};});
  check(name+': closing Showcase releases added detail',closed.hidden&&closed.disposed,closed);
 }finally{
  result.errors.push(...s.errors.map(message=>({case:name,message})));result.blockedWrites+=s.counts.blocked;await s.browser.close();fs.writeFileSync(path.join(out,'full-page-checks.json'),JSON.stringify(result,null,2)+'\n');
 }
}
(async()=>{try{await run(false);await run(true);check('no page errors or writes',!result.errors.length&&result.blockedWrites===0);result.complete=true;console.log(JSON.stringify({passed:result.checks.filter(c=>c.pass).length,total:result.checks.length}));}catch(e){result.failure=e.stack||String(e);console.error(result.failure);process.exitCode=1}finally{fs.writeFileSync(path.join(out,'full-page-checks.json'),JSON.stringify(result,null,2)+'\n')}})();
