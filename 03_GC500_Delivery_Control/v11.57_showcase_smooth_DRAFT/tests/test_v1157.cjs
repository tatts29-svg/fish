/* Author: Andrew Fisher. Read-only functional and geometry checks. */
'use strict';
const fs=require('fs'),path=require('path');
const {open}=require('../../toolchain/harness/open_page');
const phone=process.env.MOB==='1',live=process.env.LIVE==='1';
const out=process.env.OUT||'/tmp/gc500-1157';fs.mkdirSync(out,{recursive:true});
const checks=[];function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' '+JSON.stringify(detail)));}
(async()=>{const h=await open({pageFile:live?undefined:process.env.PAGE,W:phone?390:1440,H:phone?844:900,mobile:phone,dpr:phone?2:1,gl:true});const p=h.page;
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.ShowcaseSmooth1157,null,{timeout:180000});
 const before=await p.evaluate(()=>JSON.stringify(S));
 check('expected release',await p.evaluate(()=>document.body.innerText.includes('v11.57')));
 // Avoid software GPU raster time in the constructor equivalence test. A separate
 // playback probe restores the real frame function and observes actual drawing.
 await p.evaluate(()=>{window.actualFrame1157=GC3D.frame;GC3D.frame=()=>{};localStorage.removeItem('gc500.showback');localStorage.removeItem('gc500.show3d.mount');});
 const opened=await p.evaluate(()=>{const m=document.querySelector('.app main');if(m)m.scrollTop=200;window.savedScroll1157=m?.scrollTop;const start=performance.now();showOpen();return {ms:performance.now()-start,back:document.getElementById('showcase').dataset.back,hidden:getComputedStyle(document.querySelector('.app')).display,pending:ShowcaseSmooth1157.state().pending};});
 check('3D night choice starts cooperative preparation',opened.back==='circuit3d'&&opened.pending,opened);
 check('covered dashboard has no layout or paint',opened.hidden==='none',opened);
 const cancelled=await p.evaluate(()=>{showClose();return {state:ShowcaseSmooth1157.state(),scene:!!GC3D.S,hidden:document.getElementById('showcase').hidden,display:getComputedStyle(document.querySelector('.app')).display,scroll:document.querySelector('.app main')?.scrollTop,saved:savedScroll1157};});
 check('close cancels preparation and restores dashboard',!cancelled.state.pending&&!cancelled.scene&&cancelled.hidden&&cancelled.display!=='none',cancelled);
 check('dashboard scroll preserved',cancelled.scroll===cancelled.saved,cancelled);
 await p.waitForTimeout(300);
 check('cancelled preparation cannot mount later',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending));
 await p.evaluate(()=>{showOpen();showPause();});
 await p.waitForFunction(()=>ShowcaseSmooth1157.state().completed>=1||ShowcaseSmooth1157.state().error,null,{timeout:180000});
 let state=await p.evaluate(()=>ShowcaseSmooth1157.state());check('circuit completes without error',state.completed===1&&!state.error,state);
 check('pause during preparation is honoured at completion',await p.evaluate(()=>!!GC3D.S&&GC3D.S.paused&&!SHOW.playing));
 const fingerprint=async()=>p.evaluate(async()=>{
  const Q=GC3D.S,digest=async data=>{const bytes=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');},meshes={};
  for(const [k,v] of Object.entries(Q)){
   if(v instanceof GC3D.MeshBatch)meshes[k]={v:await digest(new Float32Array(v.v)),i:await digest(new Uint32Array(v.i)),nv:v.nv,ni:v.ni};
   else if(v instanceof GC3D.LineBatch)meshes[k]={data:await digest(v.data.slice(0,v.n*17)),n:v.n};
  }
  return {meshes,car:Q.raceCarStats,stands:Q.standStats,buildings:Q.bCount,trees:Q.treeGeometry,grid:Q.grid,track:Q.trackDetailReport,road:Q.roadWidth};
 });
 const cooperative=await fingerprint();
 const selected=await p.evaluate(()=>{showSetBack('circuit3d_day');return {pending:ShowcaseSmooth1157.state().pending,pref:localStorage.getItem('gc500.showback'),scene:!!GC3D.S};});
 check('day choice starts cooperative replacement',selected.pending&&selected.pref==='circuit3d_day'&&!selected.scene,selected);
 await p.evaluate(()=>showSetBack('black'));
 check('switching away cancels without changing choice',await p.evaluate(()=>!ShowcaseSmooth1157.state().pending&&!GC3D.S&&localStorage.getItem('gc500.showback')==='black'));
 await p.evaluate(()=>{showClose();GC3D.mount(DATA.surrounds,'dark');});
 const synchronous=await fingerprint();
 check('all static mesh and line bytes, car and circuit statistics match the original constructors',JSON.stringify(cooperative)===JSON.stringify(synchronous),Object.keys(cooperative.meshes).filter(k=>JSON.stringify(cooperative.meshes[k])!==JSON.stringify(synchronous.meshes[k])));
 await p.evaluate(()=>{show3dStop();localStorage.setItem('gc500.showback','circuit');showOpen();SHOW.i=1;showRender();});
 const scene=await p.evaluate(()=>({i:SHOW.i,html:document.getElementById('showBody').innerHTML}));
 await p.evaluate(()=>{showMove(1);showPause();});
 check('scene navigation and playback controls still work',await p.evaluate(i=>SHOW.i===i+1&&!SHOW.playing,scene.i));
 await p.screenshot({path:path.join(out,(phone?'phone':'desktop')+'-showcase.png'),timeout:60000});
 await p.evaluate(()=>showClose());
 check('record untouched',before===await p.evaluate(()=>JSON.stringify(S)));
 check('no page errors',h.errors.length===0,h.errors);
 check('no writes attempted',h.counts.blocked===0,h.counts);
}finally{await h.browser.close();}
fs.writeFileSync(path.join(out,(phone?'phone':'desktop')+'-checks.json'),JSON.stringify(checks,null,2));
console.log(checks.filter(x=>x.ok).length+'/'+checks.length);process.exit(checks.every(x=>x.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
