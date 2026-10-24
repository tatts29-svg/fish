/* Author: Andrew Fisher. v11.43 - the Showcase opens quicker on a device that was slow: when the 3D circuit took longer
   than the v11.20 budget (1.5 s) to build here last time, the next opening on this device starts on the flat circuit at
   once, with a "3D circuit" button beside the backdrop choice that brings the 3D back for this opening with one press.
   Andrew, 23 Oct 2026: "showcase is lagging this morning its freezing" and, to the slow-device opening, "What ever makes
   it quicker please". Measured on live v11.41 at 4x CPU: the dialog in 1.9 s, then the 3D base circuit 8.6 s on the main
   thread, which is the freeze. The 3D circuit at night stays the never-chosen default on a device that builds it within
   budget (Andrew, 22 Oct: "I want the 3d race track as default"); a chosen 3D look is kept as the choice and returns with
   the button. Nothing is written to the record; the device's own last build time lives in its local storage. */
(function(root){
'use strict';
const KEY='gc500.show3d.mount', BUDGET=1500;
const F={applied:null,lastMs:null,why:'',playback:null};
const is3d=v=>/^circuit3d/.test(String(v||''));
function last(){ if(F.playback)return F.playback;try{ const j=JSON.parse(localStorage.getItem(KEY)||'null'); return j&&Number.isFinite(j.ms)?j:null; }catch(e){ return null; } }
function remember(ms){ F.playback=null;try{ localStorage.setItem(KEY, JSON.stringify({ms:Math.round(ms),at:new Date().toISOString()})); }catch(e){} }
/* the base circuit's build time on this device is kept (outside the v11.20 wrapper, so it sees the whole mount) */
if(root.GC3D&&typeof GC3D.mount==='function'){ const m=GC3D.mount; GC3D.mount=function(){ const t0=performance.now(); const r=m.apply(this,arguments); const dt=performance.now()-t0; if(/^mounted/.test(String(r))) remember(dt); return r; }; }
/* the backdrop the opening starts on: the flat circuit when this device was slow last time and nobody has pressed 3D circuit this opening */
const pref0=root.showBackPref;
if(typeof pref0==='function') root.showBackPref=function(){
 const v=pref0.apply(this,arguments); F.applied=null;
 if(!is3d(v)) return v;
 if(typeof SHOW!=='undefined'&&SHOW&&SHOW.want3d1143) return v;
 const l=last(); if(l&&(l.kind==='playback'||l.ms>BUDGET)){ F.applied=v; F.lastMs=l.ms; F.why=l.kind==='playback'?'3D playback remained too slow on this device':'the 3D circuit took '+(l.ms/1000).toFixed(1)+' s to build here last time'; return 'circuit'; }
 return v;
};
function button(){
 const lab=document.querySelector('#showcase .shbackl'); if(!lab) return;
 let b=document.getElementById('show3d1143');
 if(!b){ b=document.createElement('button'); b.className='shbtn'; b.id='show3d1143'; b.type='button';
  b.addEventListener('click',()=>{ if(typeof SHOW!=='undefined'&&SHOW) SHOW.want3d1143=true; try{ root.showApplyBack(); }catch(e){} try{ if(typeof showRender==='function') showRender(); }catch(e){} try{ if(typeof show3dSyncInner==='function') show3dSyncInner(false); }catch(e){} });
  lab.insertAdjacentElement('afterend', b); }
 b.hidden=!F.applied;
 if(F.applied){ b.textContent=last()?.kind==='playback'?'Try 3D circuit':'3D circuit · '+(F.lastMs/1000).toFixed(1)+' s here'; b.title='Opened on the flat circuit: '+F.why+'. Press for the 3D circuit now.'; }
}
const apply0=root.showApplyBack;
if(typeof apply0==='function') root.showApplyBack=function(){ const r=apply0.apply(this,arguments); try{ button(); }catch(e){} return r; };
/* a 3D look chosen from the backdrop list during a flat opening is wanted now, not snapped back to flat */
const set0=root.showSetBack;
if(typeof set0==='function') root.showSetBack=function(v){ if(is3d(v)&&typeof SHOW!=='undefined'&&SHOW) SHOW.want3d1143=true; return set0.apply(this,arguments); };
const close0=root.showClose;
if(typeof close0==='function') root.showClose=function(){ if(typeof SHOW!=='undefined'&&SHOW) SHOW.want3d1143=false; return close0.apply(this,arguments); };
// Author: Andrew Fisher. A measured severe playback stall at minimum quality
// hands back the existing flat circuit without overwriting the chosen backdrop.
function fallback(S,ms){
 if(!root.GC3D||GC3D.S!==S||GC3D.noGuard||typeof SHOW==='undefined'||!SHOW.open||document.hidden||S.paused)return false;
 if(!is3d(document.getElementById('showcase')?.getAttribute('data-back')))return false;
 F.playback={ms:Math.round(ms),at:new Date().toISOString(),kind:'playback'};
 try{localStorage.setItem(KEY,JSON.stringify(F.playback));}catch(e){}
 SHOW.want3d1143=false;root.showApplyBack();root.show3dSyncInner(!SHOW.playing);
 return true;
}
root.ShowcaseQuick1143={KEY,BUDGET,last,fallback,state:()=>({applied:F.applied,lastMs:F.lastMs,why:F.why,want3d:!!(typeof SHOW!=='undefined'&&SHOW&&SHOW.want3d1143)})};
})(window);
