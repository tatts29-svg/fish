/* Author: Andrew Fisher. Preserve visible scene detail while avoiding repeated
   frustum allocations and hidden Today media/animation work. */
(function(root){
 'use strict';
 function createVisibility971(){
  // Existing 1.3 side-plane margin, with the same near/far planes. Each cell is
  // accepted when its most positive corner reaches every plane. One reusable
  // buffer replaces eight corner transforms and sixteen temporary arrays/cell.
  const planes=new Float64Array(24);let matrix=null,valid=false;
  return function visibleCell971(VP,q){
   if(VP!==matrix){
    matrix=VP;valid=!!(VP&&VP.length===16);
    if(valid)for(let i=0;i<16;i++)if(!Number.isFinite(VP[i])){valid=false;break;}
    if(valid)for(let plane=0;plane<6;plane++){
     const axis=plane<2?0:plane<4?1:2,sign=plane%2?-1:1,margin=plane<4?1.3:1;
     for(let c=0;c<4;c++)planes[plane*4+c]=sign*VP[c*4+axis]+margin*VP[c*4+3];
    }
   }
   if(!valid||!q)return false;
   for(let i=0;i<24;i+=4){
    const a=planes[i],b=planes[i+1],c=planes[i+2],d=planes[i+3];
    if(!(a*(a>=0?q.maxX:q.minX)+b*(b>=0?q.maxY:q.minY)+c*(c>=0?q.maxZ:q.minZ)+d>=0))return false;
   }
   return true;
  };
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={createVisibility971};
 const G=root.GC3D,doc=root.document;if(!G||!doc||G.playbackRuntime971)return;
 G.visibleCell971=createVisibility971();
 const pausedVideos=new Map();let active=false;
 const isShowing=()=>!!(root.SHOW&&root.SHOW.open)||doc.body.classList.contains('showing');
 const videoSource=v=>v.currentSrc||v.getAttribute('src')||'';
 const isTodayVideo=v=>!!(v&&v.tagName==='VIDEO'&&v.closest('#pane-today'));
 function pauseVideo(v){
  if(!active||!isTodayVideo(v)||v.paused||v.ended)return;
  const board=v.closest('.bhero');
  // A pending native Play is not yet playback. Its playing handler establishes
  // intent before our captured playing event pauses it, without aborting load.
  if(board&&!board.classList.contains('playing'))return;
  if(!pausedVideos.has(v))pausedVideos.set(v,{source:videoSource(v),board,wasBoardPlaying:!!(board&&board.classList.contains('playing'))});
  try{v.pause();}catch(e){}
 }
 function reconcileBoard(){try{if(typeof BOARD_RUN!=='undefined'&&typeof BOARD_RUN.reconcile==='function')BOARD_RUN.reconcile();}catch(e){}}
 function suspend(){
  active=true;
  doc.querySelectorAll('#pane-today video').forEach(pauseVideo);
  reconcileBoard();
 }
 function resume(){
  if(isShowing())return;
  active=false;reconcileBoard();
  if(doc.hidden)return;
  for(const [v,s] of pausedVideos){
   pausedVideos.delete(v);
   const pane=v.closest('.pane');
   if(!v.isConnected||v.ended||videoSource(v)!==s.source||!pane||!pane.classList.contains('on'))continue;
   // An explicit stop, native media error, folded banner or changed item is
   // authoritative. Only resume the same clip whose play intent is still live.
   if(s.board&&(!s.wasBoardPlaying||!s.board.classList.contains('playing')||s.board.classList.contains('folded')||s.board.closest('details:not([open])')))continue;
   if(v.paused){try{const p=v.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}}
  }
 }
 // Capture precedes the board's playing handler; defer one task so its handler
 // and play promise settle before pausing, without aborting an explicit Play.
 doc.addEventListener('playing',e=>{if(active&&isTodayVideo(e.target))setTimeout(()=>pauseVideo(e.target),0);},true);
 doc.addEventListener('visibilitychange',()=>{if(active)suspend();else if(pausedVideos.size)resume();});
 root.addEventListener('pagehide',()=>{active=false;pausedVideos.clear();});
 const style=doc.createElement('style');style.id='showcase971-background-style';
 style.textContent='body.showing #pane-today *,body.showing #pane-today *::before,body.showing #pane-today *::after{animation-play-state:paused!important}';
 doc.head.appendChild(style);
 G.playbackRuntime971={suspend,resume,report:()=>({active,pausedVideos:pausedVideos.size,sceneGeometryChanged:false,preferencesChanged:false})};
})(typeof window!=='undefined'?window:globalThis);
