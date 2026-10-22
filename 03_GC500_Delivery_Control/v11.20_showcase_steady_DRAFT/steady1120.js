/* Author: Andrew Fisher. v11.20 - the Showcase opens at once and the 3D circuit is built a beat later, within the device's means.

 Measured on the live v11.19 page (read-only probes, this machine unthrottled): opening the Showcase on a 3D backdrop ran
 GC3D.mount() inside showOpen() for 3.2 s before the dialog could paint, then the static detail (track detail 1.5 s,
 vegetation 1.2 s, architecture 0.5 s) in three more blocks, each a frozen page; under 4x CPU the first block was 15.8 s.
 The 3D scene held 497 MB of heap against 98 MB on the flat circuit. The scenes themselves cost 0.1-0.25 s each.

 Two rules, neither of which changes what the scene draws when the device can carry it:
 1. The dialog paints first. The first 3D mount of an opening is deferred by a short timer, so the countdown, the words and
    the flat circuit are on screen before the heavy build starts. Nothing else about the sync changes.
 2. The base circuit is timed as it builds. When it took longer than the budget, the static detail stages are not attempted
    on this device (the scene's own "limited by device" path, which it already uses when a stage fails): the circuit, the
    car and the stands stay; trees, facades and kerb detail are left out, and the report says why.
 The 3D circuit at night stays the never-chosen default on every device (Andrew, 22 Oct 2026: "I want the 3d race track as
 default"). The scene warm-up pacing (one scene per 400 ms, first at 1.5 s) is a text change on the v11.10 module beside this. */
(function(root){
'use strict';
if(typeof show3dSyncInner!=='function'||!root.GC3D||typeof GC3D.mount!=='function')return;
const STEADY={pending:0,still:false,deferred:0,mountMs:null,detail:null,budgetMs:1500,delayMs:150};
const G=root.GC3D;
/* 2. the mount, timed; the detail budget decided from what this device just did. The mount itself (circuit, car, city,
   kerbs, grandstands) is left whole: a build that left the grandstands out did not survive its checks. */
const mount=G.mount;
G.mount=function(){
 const t0=performance.now(),r=mount.apply(this,arguments),dt=performance.now()-t0;
 STEADY.mountMs=Math.round(dt);
 try{
  const S=G.S;
  if(/^mounted/.test(String(r))&&S&&dt>STEADY.budgetMs&&!S.fullLapFailed788){
   S.fullLapFailed788='detail skipped: the base circuit took '+(dt/1000).toFixed(1)+' s to build on this device (budget '+(STEADY.budgetMs/1000).toFixed(1)+' s)';
   S.detail781Enabled=false;STEADY.detail='skipped';
  }else if(S)STEADY.detail='kept';
 }catch(e){}
 return r;
};
/* 1. the first mount of an opening waits for the dialog to paint */
const syncInner=show3dSyncInner;
show3dSyncInner=function(still){
 const back=document.getElementById('showcase')&&document.getElementById('showcase').getAttribute('data-back');
 const wants3d=typeof is3dBack==='function'&&is3dBack(back)&&typeof show3dAvailable==='function'&&show3dAvailable();
 if(wants3d&&!G.S&&!G.failed&&typeof SHOW!=='undefined'&&SHOW.open&&!document.hidden){
  STEADY.still=!!still;
  if(STEADY.pending)return;
  STEADY.deferred++;
  STEADY.pending=setTimeout(()=>{STEADY.pending=0;if(typeof SHOW==='undefined'||!SHOW.open)return;try{syncInner(STEADY.still);}finally{if(typeof show3dNote==='function')try{show3dNote();}catch(e){}}},STEADY.delayMs);
  return;
 }
 return syncInner.apply(this,arguments);
};
const closeBefore=showClose;
showClose=function(){if(STEADY.pending){clearTimeout(STEADY.pending);STEADY.pending=0;}return closeBefore.apply(this,arguments);};
root.ShowcaseSteady1120={state:()=>({pending:!!STEADY.pending,deferred:STEADY.deferred,mountMs:STEADY.mountMs,detail:STEADY.detail,budgetMs:STEADY.budgetMs,delayMs:STEADY.delayMs})};
})(window);
