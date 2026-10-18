/* Author: Andrew Fisher. v10.69: exact visible ink and nearby label clearance.
   Pure screen-space helpers. No world coordinates, pins, records or camera changes. */
const MapPick1069 = (() => {
 const inside = (x,y,pts) => {let yes=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
 const edge = (x,y,a,b) => {const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/n)):0;return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);};
 function badge(x,y,r,status,selected,done){
  const d=Math.hypot(x,y);
  // The surrounding glow and transparent interior are not opaque hit targets.
  if(!done&&(Math.abs(d-r)<=(selected?1.25:0.8)||(selected&&Math.abs(d-r-4)<=2.5)))return true;
  if(!status)return false;
  const k=done?1:Math.min(1,r*0.8/17.5),u=14*k,stroke=3.5*k;
  if(status.shape==='circle')return d<=u+stroke;
  const raw=status.shape==='octagon'?[[-.43,-1],[.43,-1],[1,-.43],[1,.43],[.43,1],[-.43,1],[-1,.43],[-1,-.43]]:status.shape==='diamond'?[[0,-1],[1,0],[0,1],[-1,0]]:[[0,-1],[1,.94],[-1,.94]];
  const pts=raw.map(([a,b])=>({x:a*u,y:b*u}));
  return inside(x,y,pts)||pts.some((a,i)=>edge(x,y,a,pts[(i+1)%pts.length])<=stroke);
 }
 const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function rectPoly(b,pts){
  const inRect=p=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;
  if(pts.some(inRect)||[[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]].some(([x,y])=>inside(x,y,pts)))return true;
  // Segment/rectangle clipping catches a thin or rotated part crossing the text.
  return pts.some((p,i)=>{const q=pts[(i+1)%pts.length],dx=q.x-p.x,dy=q.y-p.y;let lo=0,hi=1;
   for(const [a,c] of [[-dx,p.x-b.x],[dx,b.x+b.w-p.x],[-dy,p.y-b.y],[dy,b.y+b.h-p.y]]){if(a===0){if(c<0)return false;}else{const t=c/a;if(a<0){if(t>hi)return false;lo=Math.max(lo,t);}else{if(t<lo)return false;hi=Math.min(hi,t);}}}return true;});
 }
 function clear(b,owner,obstacles,pad=0){const box={x:b.x-pad,y:b.y-pad,w:b.w+2*pad,h:b.h+2*pad};return !obstacles.some(o=>o.code!==owner&&overlaps(box,o.box)&&o.parts.some(p=>rectPoly(box,p)));}
 function place(b,anchor,owner,obstacles,bounds,px,selected){
  const clamp=q=>({x:Math.max(4*px,Math.min(bounds.w-q.w-4*px,q.x)),y:Math.max(4*px,Math.min(bounds.h-q.h-4*px,q.y)),w:q.w,h:q.h});
  const candidates=[b];
  for(const gap of selected?[4,12,24,40]:[4]){const g=gap*px;
   candidates.push({x:anchor.x+(anchor.w-b.w)/2,y:anchor.y-b.h-g,w:b.w,h:b.h},{x:anchor.x+anchor.w+g,y:anchor.y+(anchor.h-b.h)/2,w:b.w,h:b.h},{x:anchor.x-b.w-g,y:anchor.y+(anchor.h-b.h)/2,w:b.w,h:b.h},{x:anchor.x+(anchor.w-b.w)/2,y:anchor.y+anchor.h+g,w:b.w,h:b.h});}
  for(const q of candidates.map(clamp))if(q.w<=bounds.w-8*px&&q.h<=bounds.h-8*px&&clear(q,owner,obstacles,2*px))return q;
  // A selected reference remains visible if a completely packed view has no gap.
  // Non-selected crowded text returns on the next zoom or when the item is picked.
  return selected?clamp(b):null;
 }
 return Object.freeze({badge,rectPoly,clear,place});
})();
