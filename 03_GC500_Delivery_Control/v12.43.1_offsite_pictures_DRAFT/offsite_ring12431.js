/* Author: Andrew Fisher. The approved off-site ring, with visibility-bound animation. */
(()=>{
 const cv=document.createElement('canvas');cv.id='offsite1225';cv.setAttribute('aria-hidden','true');
 cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
 mcanvas.parentNode.insertBefore(cv,mcanvas.nextSibling);
 const st=document.createElement('style');st.textContent='body.in3d #offsite1225,body.fencing-map #offsite1225{display:none!important}';document.head.appendChild(st);
 const g=cv.getContext('2d'),still=matchMedia('(prefers-reduced-motion: reduce)');
 const C={off:'#7fffc1',part:'#7fffc1',review:'#ffaaa3'},PERIOD=1800;
 let P=[],SC=1,raf=0,inView=typeof IntersectionObserver!=='function',hostInView=true,pageHidden=false,disposed=false;
 const observers=[];
 let hostDoc=null,hostFrame=null;
 try{hostFrame=window.frameElement;hostDoc=hostFrame?.ownerDocument||null;}catch(e){/* Cross-origin embedding uses the local visibility observer. */}
 function allowed(){return P.length&&!disposed&&!pageHidden&&!document.hidden&&!hostDoc?.hidden&&inView&&hostInView&&!document.body.classList.contains('in3d')&&!document.body.classList.contains('fencing-map');}
 function clear(){g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);}
 function stop(){if(raf){cancelAnimationFrame(raf);raf=0;}clear();}
 function radius(){return dpr*Math.max(5,Math.min(16,5+4.5*Math.log2(Math.max(1,SC/0.07))));}
 function frame(t){
  raf=0;if(!allowed())return;
  if(cv.width!==mcanvas.width||cv.height!==mcanvas.height){cv.width=mcanvas.width;cv.height=mcanvas.height;}
  clear();
  const r0=radius(),w=r0<9*dpr?1.4*dpr:2*dpr,ph=still.matches?-1:(t%PERIOD)/PERIOD;
  for(const q of P){g.save();g.strokeStyle='rgba(6,10,12,.55)';g.lineWidth=w+2.5*dpr;g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.stroke();
   g.strokeStyle=C[q.kind];g.lineWidth=w;if(q.kind==='part')g.setLineDash([4*dpr,3*dpr]);g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.stroke();g.setLineDash([]);
   if(ph>=0&&q.kind!=='part'){g.globalAlpha=(1-ph)*0.75;g.lineWidth=w*1.2;g.beginPath();g.arc(q.x,q.y,r0+ph*r0,0,Math.PI*2);g.stroke();}g.restore();}
  if(ph>=0&&P.some(q=>q.kind!=='part')&&allowed())raf=requestAnimationFrame(frame);
 }
 function kick(){if(!allowed()){stop();return;}if(!raf)raf=requestAnimationFrame(frame);}
 document.addEventListener('visibilitychange',kick);hostDoc?.addEventListener('visibilitychange',kick);
 still.addEventListener?.('change',kick);
 // Visibility callbacks, not layout reads inside the draw loop, govern animation.
 if(typeof IntersectionObserver==='function'){const observer=new IntersectionObserver(entries=>{const entry=entries.find(e=>e.target===cv);if(entry){inView=entry.isIntersecting&&entry.intersectionRatio>0;kick();}});observers.push(observer);observer.observe(cv);}
 if(hostFrame&&hostDoc?.defaultView?.IntersectionObserver){hostInView=false;const observer=new hostDoc.defaultView.IntersectionObserver(entries=>{const entry=entries.find(e=>e.target===hostFrame);if(entry){hostInView=entry.isIntersecting&&entry.intersectionRatio>0;kick();}});observers.push(observer);observer.observe(hostFrame);}
 if(typeof MutationObserver==='function'){const observer=new MutationObserver(kick);observers.push(observer);observer.observe(document.body,{attributes:true,attributeFilter:['class']});}
 window.addEventListener('pagehide',event=>{pageHidden=true;stop();if(!event.persisted){disposed=true;observers.forEach(o=>o.disconnect());hostDoc?.removeEventListener('visibilitychange',kick);}});
 window.addEventListener('pageshow',()=>{pageHidden=false;kick();});
 return Object.freeze({set(pts,sc){P=pts;SC=sc||1;kick();},get points(){return P.map(q=>({...q}));},get radius(){return radius();}});
})()
