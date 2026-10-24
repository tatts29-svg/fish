/* Author: Andrew Fisher. Read-only lifecycle, choice and control checks; actual GPU playback is checked separately. */
'use strict';
const fs=require('fs'),path=require('path');
const {open}=require('../../toolchain/harness/open_page');
const phone=process.env.MOB==='1',live=process.env.LIVE==='1';
const out=process.env.OUT||'/tmp/gc500-1174';fs.mkdirSync(out,{recursive:true});
const checks=[];function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' '+JSON.stringify(detail)));}
(async()=>{const h=await open({pageFile:live?undefined:process.env.PAGE,W:phone?390:1440,H:phone?844:900,mobile:phone,dpr:phone?2:1,gl:true});const p=h.page;
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.ShowcaseSmooth1157,null,{timeout:180000});
 const before=await p.evaluate(()=>JSON.stringify(S));
 check('expected release and repaired GPU scheduler',await p.evaluate(()=>document.body.innerText.includes('v11.74')&&!!window.ShowcaseGPU1174));
 const info=await p.evaluate(()=>{const before=completionAsOf;let calls=0;completionAsOf=function(){calls++;return before.apply(this,arguments);};try{const text=['countdown','lead','crew','fencing'].map(k=>showScene(k,'2026-10-24'));return {calls,hasContent:text.every(x=>x.length>100)};}finally{completionAsOf=before;}});
 check('information scenes do not calculate unused equipment totals',info.calls===0&&info.hasContent,info);
 // Isolate lifecycle controls from software GPU raster cost. The separate real
 // playback probe exercises drawing; test_gpu1174 uses the unchanged actual clock.
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
 const fallback=await p.evaluate(()=>{const pref=localStorage.getItem('gc500.showback');showPause();const ok=ShowcaseQuick1143.fallback(GC3D.S,5000);return {ok,pref,after:localStorage.getItem('gc500.showback'),back:document.getElementById('showcase').dataset.back,scene:!!GC3D.S,retry:!document.getElementById('show3d1143').hidden};});
 check('severe playback fallback releases 3D and preserves chosen look',fallback.ok&&fallback.pref===fallback.after&&fallback.back==='circuit'&&!fallback.scene&&fallback.retry,fallback);
 await p.screenshot({path:path.join(out,(phone?'phone':'desktop')+'-fallback.png'),timeout:60000});
 await p.evaluate(()=>{showClose();showOpen();});
 check('next opening remembers the slow-device fallback',await p.evaluate(()=>document.getElementById('showcase').dataset.back==='circuit'&&!GC3D.S&&!ShowcaseSmooth1157.state().pending));
 await p.evaluate(()=>document.getElementById('show3d1143').click());
 check('retry restores the chosen 3D look',await p.evaluate(()=>document.getElementById('showcase').dataset.back==='circuit3d'&&ShowcaseSmooth1157.state().pending));
 const selected=await p.evaluate(()=>{showSetBack('circuit3d_day');return {pending:ShowcaseSmooth1157.state().pending,pref:localStorage.getItem('gc500.showback'),scene:!!GC3D.S};});
 check('day choice starts cooperative replacement',selected.pending&&selected.pref==='circuit3d_day'&&!selected.scene,selected);
 await p.evaluate(()=>showSetBack('black'));
 check('switching away cancels without changing choice',await p.evaluate(()=>!ShowcaseSmooth1157.state().pending&&!GC3D.S&&localStorage.getItem('gc500.showback')==='black'));
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
