/* Author: Andrew Fisher. A composited halo for existing remaining-equipment ink. */
function onsiteNeon1291(){
 'use strict';
 if(window.GC500OnsiteNeon1291)return;
 const stage=document.getElementById('stage'),source=document.getElementById('shape1060');
 if(!stage||!source)return;
 const halo=document.createElement('canvas');halo.id='onsite-halo1291';halo.hidden=true;halo.setAttribute('aria-hidden','true');
 source.before(halo);
 const css=document.createElement('style');css.id='onsite-neon1291-style';css.textContent=`
 #onsite-halo1291{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;filter:blur(3px) saturate(1.35) brightness(1.55);mix-blend-mode:screen;opacity:.68}
 #onsite-halo1291[hidden]{display:none!important}
 body.in3d #onsite-halo1291,body.fencing-map #onsite-halo1291{display:none!important}
 body.onsite1290 #onsite-halo1291{animation:onsite-halo1291 2.6s ease-in-out infinite;will-change:opacity}
 body.onsite1290 #vmsicons1211 button{--onsite-neon:#ff821f}
 body.onsite1290 #vmsicons1211 button[data-onsite-review=true]{--onsite-neon:#ffaaa3}
 body.onsite1290 #vmsicons1211 button>svg{filter:drop-shadow(0 0 3px var(--onsite-neon)) drop-shadow(0 0 7px var(--onsite-neon));animation:onsite-sign1291 2.6s ease-in-out infinite}
 body.onsite1290 #vmsicons1211 button b{box-shadow:0 0 5px color-mix(in srgb,var(--onsite-neon) 55%,transparent)}
 body.in3d #vmsicons1211 button>svg,body.fencing-map #vmsicons1211 button>svg{animation-play-state:paused}
 @keyframes onsite-halo1291{0%,100%{opacity:.35}50%{opacity:.9}}
 @keyframes onsite-sign1291{0%,100%{filter:drop-shadow(0 0 2px var(--onsite-neon)) drop-shadow(0 0 4px var(--onsite-neon))}50%{filter:drop-shadow(0 0 4px var(--onsite-neon)) drop-shadow(0 0 9px var(--onsite-neon))}}
 @media(prefers-reduced-motion:reduce){body.onsite1290 #onsite-halo1291,body.onsite1290 #vmsicons1211 button>svg{animation:none!important}body.onsite1290 #onsite-halo1291{opacity:.7}}
 `;document.head.appendChild(css);
 const g=halo.getContext('2d');let queued=0,paints=0;
 function visible(){return !!window.GC500StillOnSite1290?.active&&!document.hidden&&!document.body.classList.contains('fencing-map')&&!window.GC500Explorer?.is3d?.();}
 function paint(){
  queued=0;const show=visible();halo.hidden=!show;
  if(!show)return;
  if(halo.width!==source.width||halo.height!==source.height){halo.width=source.width;halo.height=source.height;}
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,halo.width,halo.height);
  // Copy already rendered geometry, preserving its exact placement and colour.
  // CSS animates this halo; the crisp source ink and all text remain untouched.
  g.drawImage(source,0,0);
  const scale=source.width/(source.clientWidth||stage.clientWidth||1);g.setTransform(scale,0,0,scale,0,0);
  for(const marker of window.GC500Departure1211?.markers1288||[]){
   if(marker.kind!=='onsite'&&marker.kind!=='review')continue;
   g.strokeStyle=marker.kind==='review'?'#ffaaa3':'#ff821f';g.lineWidth=2.8;
   for(const box of marker.tag||[]){if(!box.w||!box.h)continue;g.beginPath();g.roundRect(box.x,box.y,box.w,box.h,4);g.stroke();}
  }
  paints++;
 }
 function schedule(){if(!visible()){halo.hidden=true;return;}if(!queued)queued=requestAnimationFrame(paint);}
 const draw=drawMarks;drawMarks=function(){const result=draw.apply(this,arguments);schedule();return result;};
 document.addEventListener('visibilitychange',schedule);
 window.addEventListener('pagehide',()=>{if(queued)cancelAnimationFrame(queued);queued=0;halo.hidden=true;});
 window.GC500OnsiteNeon1291=Object.freeze({refresh:schedule,get state(){return {active:visible(),paintCount:paints,queued:!!queued,hidden:halo.hidden,width:halo.width,height:halo.height};}});
 schedule();
}
