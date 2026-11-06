"""Author: Andrew Fisher. v12.88 - departed equipment follows its source plan outline.

Parent-only presentation patch on the exact live v12.86 page. Reuses the native
shape guards, camera projection and master door strokes. Departure quantities
remain reference totals: no per-unit slot assignment or record write is added.
Unknown/shared outlines use an explicit reference tag, never a guessed footprint.
"""
from pathlib import Path
import hashlib
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '92c1a3163ecf76e05e42d47ce4c94c78dea8d60e28d5b506b0cec560c7ce2865'

REPLACEMENTS = [
    ('let obstacles1069=[], projected1069=new Map(), keptDone1069=[];',
     r"""let obstacles1069=[], projected1069=new Map(), keptDone1069=[], departedShaped1288=[], drawnDeparture1288=[], tagObstacles1288=[], hudObstacles1288=[], hudKey1288='';
  /* Author: Andrew Fisher. v12.88: collection colours the reference, never invented individual slots. */
  const departure1288=it=>{const s=mapStatus1009(it);return s?.offsite1225&&s.departure1211?.collected>0?s:null;};""",
     'departure-only read model'),
    ('return {parts, box: {x0: mx + (x0 - mx) * k, y0: my + (y0 - my) * k, x1: mx + (x1 - mx) * k, y1: my + (y1 - my) * k}, mx, my};',
     'return {parts, box: {x0: mx + (x0 - mx) * k, y0: my + (y0 - my) * k, x1: mx + (x1 - mx) * k, y1: my + (y1 - my) * k}, mx, my, minScale:k};',
     'read-only projection scale'),
    ('paints++; BEAT.sel = null; BEAT.done = [];',
     'paints++; BEAT.sel = null; BEAT.done = []; drawnDeparture1288=[];',
     'visible footprint diagnostics'),
    ("const sel = selected === m.it, col = sel ? '#ff821f' : m.c,status = mapStatus1009(m.it), L = projected1069.get(m.it) || project(sh, M, dpr);",
     "const sel = selected === m.it, status = mapStatus1009(m.it), dep = departure1288(m.it), col = sel ? '#ff821f' : dep ? status.colour : m.c, L = projected1069.get(m.it) || project(sh, M, dpr);",
     'colour every departed shape by shared status'),
    (r"""n++;
    /* the tick and the reference:""",
     r"""n++; if(dep)drawnDeparture1288.push(m.it.code);
    /* the tick and the reference:""",
     'track actually visible departed footprints'),
    ('if (!plan) { plan = planBest(m, L, status, sel, show, s); plan.ax = L.mx;',
     "if (!plan) { plan = dep ? {how:'departed reference',fill:false,ticks:[],labels:[],plain:[],tickIn:false,u:0,along:0,across:0,parts:L.parts.length,of:L.parts.length} : planBest(m, L, status, sel, show, s); plan.ax = L.mx;",
     'one reference count, no duplicate in each unit or opaque fill over doors'),
    ('if (c.std) g.setLineDash([4 * dpr, 3 * dpr]);',
     'if (c.std || dep && !dep.departure1211.complete) g.setLineDash([4 * dpr, 3 * dpr]);',
     'preserve catalogue dashes and show partial group outline'),
    ("g.fillStyle = c.tank ? '#9aa4ad80' : col + (sel ? 'b3' : '66'); g.fill();",
     "g.fillStyle = c.tank ? '#9aa4ad80' : dep ? col + (!dep.departure1211.complete ? '12' : sel ? '55' : '2e') : col + (sel ? 'b3' : '66'); g.fill();",
     'light departure fill leaves plan and door detail legible'),
    ("/* the door: the master's swing where it has one; for an FWF the chevron on its edge (its door) */",
     "/* The master's recorded swing/leaf/landing; chevrons remain plan marks, not an inferred door side. */",
     'do not interpret unexplained plan chevrons as doors'),
    ('if (!dr.arcs.some(a => a.length > 1) && !dr.leaves.some(l => l.length > 1) && dr.mid && dr.out)',
     'if (!dep && !dr.arcs.some(a => a.length > 1) && !dr.leaves.some(l => l.length > 1) && dr.mid && dr.out)',
     'departures draw only sourced door strokes'),
    ('if (fencing() || !SNAP) { doneShaped = []; obstacles1069=[]; projected1069.clear(); keptDone1069=[]; try { paint(v, []); } catch (e) { failed++; } return nativeDraw(v); }',
     r"""if (fencing() || !SNAP) { doneShaped = []; departedShaped1288=[]; obstacles1069=[]; projected1069.clear(); keptDone1069=[]; try { paint(v, []); } catch (e) { failed++; }
    if(fencing())return nativeDraw(v);
    const all=marks;marks=all.filter(m=>!departure1288(m.it));frameDn=nativeDone().filter(it=>!departure1288(it));
    try{return nativeDraw(v);}finally{marks=all;frameDn=null;}
   }""",
     'missing source uses honest tags without duplicate circles'),
    ('if (sel || (m.done && BEAT.done.length < 160))',
     'if (sel || (!dep && m.done && BEAT.done.length < 160))',
     'departure state is not repainted by the install Done pulse'),
    ('for (const m of all) { codes.add(m.it.code); const sh = shapeFor(m.it); if (sh) shaped.push([m, sh]); else rest.push(m); }',
     'for (const m of all) { codes.add(m.it.code); const sh = shapeFor(m.it); if (sh) shaped.push([m, sh]); else if(!departure1288(m.it))rest.push(m); }',
     'no native circles for departed refs without an assigned outline'),
    ("for (const it of dn) { const sh = shapeFor(it); if (!sh) dnRest.push(it); else if (!codes.has(it.code)) doneShaped.push([{it, c: it.cat && it.cat.c || '#2bd46b', done: true}, sh]); }",
     r"""for (const it of dn) { const sh = shapeFor(it); if (!sh) { if(!departure1288(it))dnRest.push(it); } else if (!codes.has(it.code)) doneShaped.push([{it, c: it.cat && it.cat.c || '#2bd46b', done: true}, sh]); }
   departedShaped1288=[];
   const already1288=new Set([...codes,...doneShaped.map(p=>p[0].it.code)]);
   for(const it of ITEMS){if(already1288.has(it.code))continue;const status=departure1288(it),sh=status&&shapeFor(it);if(sh){departedShaped1288.push([{it,c:status.colour,departed1288:true},sh]);already1288.add(it.code);}}
""",
     'show eligible departed footprints before selection'),
    ('for(const [m,sh] of doneShaped.concat(shaped)){',
     'for(const [m,sh] of doneShaped.concat(departedShaped1288,shaped)){',
     'reserve every departed source footprint'),
    ('try { paint(v, doneShaped.concat(shaped)); }',
     'try { paint(v, doneShaped.concat(departedShaped1288,shaped)); }',
     'paint unselected departed footprints with the native geometry'),
    (r"""const all=marks,lb=labelBounds1010,rest=all.filter(m=>!shapeFor(m.it));
   const visible=all.concat(doneShaped.map(p=>p[0]));""",
     r"""const all=marks,lb=labelBounds1010,rest=all.filter(m=>!shapeFor(m.it)&&!departure1288(m.it));
   const visible=all.concat(doneShaped.map(p=>p[0]),departedShaped1288.map(p=>p[0]));""",
     'hit-test all visible departed polygons'),
    ('labelBounds1010=[];try{return nativeMarkAt(x,y);}finally{labelBounds1010=lb;}',
     'labelBounds1010=[];marks=all.filter(m=>!departure1288(m.it));try{return nativeMarkAt(x,y);}finally{labelBounds1010=lb;marks=all;}',
     'remove invisible departed circle hit targets'),
    ('const m = hit(x, y, marks) || hit(x, y, doneShaped.map(p => p[0]));',
     'const m = hit(x, y, marks) || hit(x, y, doneShaped.map(p => p[0])) || hit(x,y,departedShaped1288.map(p=>p[0]));',
     'native item picking includes unselected departure footprints'),
    ("window.GC500Shape1060 = Object.freeze({version: 'v10.60', clarity1069: true, pull,",
     r"""  /* The existing label-clearance rules also protect the exact door ink. */
  function beginTags1288(){
   const hud=[...document.querySelectorAll('.hud > .pill,.console,#rose,#qual,#attrib')];
   const signature=[canvas.width,canvas.height,dpr,...hud.map(e=>e.id+'|'+e.hidden+'|'+e.style.display+'|'+e.textContent)].join('~');
   if(signature!==hudKey1288){
    hudKey1288=signature;hudObstacles1288=[];const origin=layer.getBoundingClientRect();
    for(const e of hud){if(e.hidden||e.style.display==='none')continue;const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;
     const x=(r.left-origin.left)*dpr-3*dpr,y=(r.top-origin.top)*dpr-3*dpr,w=r.width*dpr+6*dpr,h=r.height*dpr+6*dpr;
     hudObstacles1288.push({code:'__map_hud1288',box:{x,y,w,h},parts:[[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]]});
    }
   }
   tagObstacles1288=hudObstacles1288.slice();
   for(const [it,L] of projected1069)for(const part of L.parts)for(const d of part.c.doors){
    const pts=[...d.arcs,...d.leaves,...d.landing].flat().map(part.P);if(!pts.length)continue;
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs)-2*dpr,y=Math.min(...ys)-2*dpr,w=Math.max(...xs)-x+2*dpr,h=Math.max(...ys)-y+2*dpr;
    tagObstacles1288.push({code:it.code,box:{x,y,w,h},parts:[[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]]});
   }
  }
  function placeTag1288(code,box,anchor,selectedTag){
   const b=MapPick1069.place(box,anchor,code,obstacles1069.concat(tagObstacles1288),{w:canvas.width,h:canvas.height},dpr,selectedTag);
   if(b)tagObstacles1288.push({code,box:b,parts:[[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}]]});
   return b?{...b}:null;
  }
  /* Read-only diagnostics use the same guards and camera as visible ink. No unit-slot assignment is implied. */
  function reason1288(code){
   const it=ITEMS.find(x=>x.code===code);if(!it)return 'reference unavailable';
   if(typeof it.placedHow==='string'&&it.placedHow.startsWith('Andrew’s pin'))return 'recorded pin; plan outline unassigned';
   const sh=SNAP?.refs[it.code];if(!sh)return 'plan outline unavailable';
   if(sh.shared)return 'shared plan outline';
   if(it.cat?.name==='Furniture')return 'contents; separate outline unassigned';
   if(!Array.isArray(it.places)||it.places.length!==1)return 'multiple locations; outline unassigned';
   return shapeFor(it)?'':'location outside source outline';
  }
  function projected1288(code,device=false){
   const it=ITEMS.find(x=>x.code===code),sh=it&&shapeFor(it);if(!sh)return null;
   const v=currentView(),px=device?dpr:1,L=project(sh,sheetToDevice(px*v.scale,device?canvas.width:sw,device?canvas.height:shHeight1288()),px);
   const dep=departure1288(it)?.departure1211,standard=sh.comps.filter(c=>c.std).length;
   const point=q=>({x:q.x,y:q.y}),line=(a,P)=>a.map(f=>point(P(f)));
   return {code,x:L.mx,y:L.my,box:{...L.box},minScale:L.minScale,provenance:standard===sh.comps.length?'catalogue':standard?'mixed':'master',
    parts:L.parts.map(({c,pts,P})=>({kind:c.kind,standard:c.std,tank:c.tank,sourcePoly:c.poly.map(p=>p.slice()),points:pts.map(point),doors:c.doors.map(dr=>({arcs:dr.arcs.map(a=>line(a,P)),leaves:dr.leaves.map(a=>line(a,P)),landing:dr.landing.map(a=>line(a,P))})),chevrons:c.chev.map(a=>line(a,P))})),
    departure:dep?{n:dep.collected,total:Number.isFinite(dep.remaining)&&dep.remaining>=0?dep.collected+dep.remaining:null,complete:!!dep.complete,kind:dep.issues.length?'review':dep.complete?'off':'part'}:null};
  }
  /* Avoid shadowing the explorer's CSS-height global with a source-shape local. */
  const shHeight1288=()=>sh;
  window.GC500Shape1060 = Object.freeze({version: 'v10.60', clarity1069: true, pull, projected1288, reason1288, beginTags1288, placeTag1288, departed1288:()=>drawnDeparture1288.slice(),""",
     'read-only source and projection diagnostics'),
    (r""" const draw=drawMarks;drawMarks=function(v){const left=ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected); /* v12.61: always on - the mark says what it is, that it has gone and how many */if(left.length)marksDrawn=true;const result=draw.apply(this,arguments);if(!left.length){Offsite1225.set([],v.scale);return result;}
  show(mcanvas,true);marksDrawn=true;const M=sheetToDevice(dpr*v.scale,canvas.width,canvas.height),pts=[],own1261=new Set((typeof marks!=='undefined'&&Array.isArray(marks)?marks:[]).map(m=>m.it)); /* v12.61: a searched or selected reference already carries its own badge; every other departed reference gets the symbol inside its ring */
  for(const it of left)for(const b of it.places){const p=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),c=applyM(M,p.x,p.y);if(c.x<-40||c.y<-40||c.x>canvas.width+40||c.y>canvas.height+40)continue;const d=states.get(key(it));
   pts.push({x:c.x,y:c.y,kind:d.issues.length?'review':d.complete?'off':'part',n:d.collected,total:(Number.isFinite(d.remaining)&&d.remaining>=0)?d.collected+d.remaining:null,glyph:sym1261(it,mapStatus1009(it)),own:own1261.has(it)});}
  Offsite1225.set(pts,v.scale);return result;
 };""",
     r""" const draw=drawMarks;drawMarks=function(v){
  const left=ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected);
  const result=draw.apply(this,arguments);if(!left.length){Offsite1225.set([],v.scale);return result;}
  show(mcanvas,true);marksDrawn=true;
  const M=sheetToDevice(dpr*v.scale,canvas.width,canvas.height),pts=[];
  for(const it of left){
   const d=states.get(key(it)),shape=window.GC500Shape1060?.projected1288(it.code,true);
   const common={code:it.code,kind:d.issues.length?'review':d.complete?'off':'part',n:d.collected,total:Number.isFinite(d.remaining)&&d.remaining>=0?d.collected+d.remaining:null};
   if(shape){const b=shape.box;if(b.x1<-60||b.y1<-60||b.x0>canvas.width+60||b.y0>canvas.height+60)continue;pts.push({...common,x:shape.x,y:shape.y,shape:true,box:b,provenance:shape.provenance,parts:shape.parts});}
   else for(const b of it.places){const p=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),c=applyM(M,p.x,p.y);if(c.x<-60||c.y<-60||c.x>canvas.width+60||c.y>canvas.height+60)continue;pts.push({...common,x:c.x,y:c.y,shape:false,reason:window.GC500Shape1060?.reason1288(it.code)||'plan outline unavailable'});}
  }
  Offsite1225.set(pts,v.scale);return result;
 };""",
     'replace circular offsite marks with footprint-attached reference counts'),
    (r""" const Offsite1225=/* Author: Andrew Fisher. The approved off-site ring, with visibility-bound animation. */
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
  for(const q of P){g.save();if(!q.own){g.fillStyle='#0f1b21';g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.fill();if(q.glyph&&r0>=8*dpr){g.fillStyle=C[q.kind];g.font='400 '+Math.round(r0*1.45)+'px GC500MapUnits1147,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(q.glyph,q.x,q.y+0.5*dpr);}} /* v12.61: the equipment's own symbol on a dark disc inside the ring (Andrew, 30 Oct 2026: "The icon is always the shape of the description") */g.strokeStyle='rgba(6,10,12,.55)';g.lineWidth=w+2.5*dpr;g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.stroke();
   g.strokeStyle=C[q.kind];g.lineWidth=w;if(q.kind==='part')g.setLineDash([4*dpr,3*dpr]);g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.stroke();g.setLineDash([]);
   if(ph>=0&&q.kind!=='part'){g.globalAlpha=(1-ph)*0.75;g.lineWidth=w*1.2;g.beginPath();g.arc(q.x,q.y,r0+ph*r0,0,Math.PI*2);g.stroke();}
   if(Number.isFinite(q.n)&&q.n>0){const txt=q.total&&q.total>q.n?q.n+'/'+q.total:String(q.n),rb=Math.max(7*dpr,r0*0.62),bx=q.x+r0*0.95,by=q.y-r0*0.95;g.globalAlpha=1;g.setLineDash([]);g.font='800 '+Math.round(rb*1.25)+'px Inter,sans-serif';const tw=g.measureText(txt).width,bw=Math.max(rb*2,tw+rb*0.9);g.fillStyle=q.kind==='review'?'#ffaaa3':'#7fffc1';g.strokeStyle='rgba(6,10,12,.8)';g.lineWidth=1.5*dpr;g.beginPath();if(g.roundRect)g.roundRect(bx-bw/2,by-rb,bw,rb*2,rb);else g.rect(bx-bw/2,by-rb,bw,rb*2);g.fill();g.stroke();g.fillStyle='#06110c';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,bx,by+0.5*dpr);} /* v12.61: how many have gone */
   g.restore();}
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
})();""",
     r""" const Offsite1225=/* Author: Andrew Fisher. v12.88: one reference count beside sourced plan ink; no circle stands in for equipment. */
(()=>{
 const cv=document.createElement('canvas');cv.id='offsite1225';cv.setAttribute('aria-hidden','true');
 cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';mcanvas.parentNode.insertBefore(cv,mcanvas.nextSibling);
 const st=document.createElement('style');st.textContent='body.in3d #offsite1225,body.fencing-map #offsite1225{display:none!important}';document.head.appendChild(st);
 const g=cv.getContext('2d'),C={off:'#7fffc1',part:'#7fffc1',review:'#ffaaa3'};
 let P=[],B=[],SC=1,raf=0,inView=typeof IntersectionObserver!=='function',hostInView=true,pageHidden=false,disposed=false;
 const observers=[];let hostDoc=null,hostFrame=null;
 try{hostFrame=window.frameElement;hostDoc=hostFrame?.ownerDocument||null;}catch(e){}
 function allowed(){return P.length&&!disposed&&!pageHidden&&!document.hidden&&!hostDoc?.hidden&&inView&&hostInView&&!document.body.classList.contains('in3d')&&!document.body.classList.contains('fencing-map');}
 function clear(){g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);B=[];}
 function stop(){if(raf){cancelAnimationFrame(raf);raf=0;}clear();}
 const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function frame(){
  raf=0;if(!allowed()){stop();return;}
  if(cv.width!==mcanvas.width||cv.height!==mcanvas.height){cv.width=mcanvas.width;cv.height=mcanvas.height;}
  clear();
  const px=dpr,small=SC<0.24;window.GC500Shape1060?.beginTags1288();
  for(const q of P.slice().sort((a,b)=>Number(a.shape)-Number(b.shape))){
   const count=q.total&&q.total>q.n?q.n+'/'+q.total:String(q.n),standard=q.shape&&q.provenance!=='master';
   const label=q.code+' · '+count,sub=!q.shape?'Outline unassigned':q.provenance==='mixed'?'Includes catalogue':standard?'Catalogue outline':'';
   const f=(small?9:10)*px,pad=5*px,h=(sub?29:19)*px;g.font='800 '+f+'px Inter,sans-serif';
   const width=Math.max(g.measureText(label).width+2*pad,sub?(sub.length*4.5+10)*px:0),doorPoints=q.parts?.flatMap(p=>p.doors.flatMap(d=>[...d.arcs,...d.leaves,...d.landing].flat()))||[];
   const bx=q.shape?Math.max(q.box.x1,...doorPoints.map(p=>p.x)):q.x,by=q.shape?Math.min(q.box.y0,...doorPoints.map(p=>p.y)):q.y;
   let box={x:Math.max(2*px,Math.min(cv.width-width-2*px,bx+4*px)),y:Math.max(2*px,Math.min(cv.height-h-2*px,by-h-4*px)),w:width,h};
   const ax=q.shape?Math.min(q.box.x0,...doorPoints.map(p=>p.x)):q.x,ay=q.shape?Math.min(q.box.y0,...doorPoints.map(p=>p.y)):q.y;
   const ex=q.shape?Math.max(q.box.x1,...doorPoints.map(p=>p.x)):q.x,ey=q.shape?Math.max(q.box.y1,...doorPoints.map(p=>p.y)):q.y;
   if(window.GC500Shape1060?.placeTag1288){
    box=GC500Shape1060.placeTag1288(q.code,box,{x:ax,y:ay,w:Math.max(px,ex-ax),h:Math.max(px,ey-ay)},q.code===selected?.code||!q.shape);
    if(!box)continue; // At crowded overview, the footprint stays visible; its label returns on zoom or selection.
   }else for(let j=0;j<5&&B.some(b=>overlaps(box,b));j++)box.y=Math.max(2*px,Math.min(cv.height-h-2*px,box.y+h+3*px));
   g.save();g.globalAlpha=.96;g.lineWidth=px;g.strokeStyle=C[q.kind];
   // A screen-aligned label and a fine leader identify a reference, never an invented unit footprint.
   g.beginPath();g.moveTo(q.shape?bx:q.x,q.shape?by:q.y);g.lineTo(box.x,Math.max(box.y,Math.min(box.y+h,q.shape?by:q.y)));g.stroke();
   g.fillStyle='#102129';if(!q.shape)g.setLineDash([3*px,2*px]);g.beginPath();g.roundRect(box.x,box.y,box.w,box.h,4*px);g.fill();g.stroke();g.setLineDash([]);
   g.font='800 '+f+'px Inter,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=C[q.kind];g.fillText(label,box.x+box.w/2,box.y+(sub?9:9.5)*px);
   if(sub){g.font='500 '+8*px+'px Inter,sans-serif';g.fillStyle='#c2d1d6';g.fillText(sub,box.x+box.w/2,box.y+21*px);}
   g.restore();B.push({...box,code:q.code});
  }
  // Static labels: pan/zoom/status and visibility events repaint; no idle animation loop.
 }
 function kick(){if(!allowed()){stop();return;}if(!raf)raf=requestAnimationFrame(frame);}
 document.addEventListener('visibilitychange',kick);hostDoc?.addEventListener('visibilitychange',kick);
 if(typeof IntersectionObserver==='function'){const o=new IntersectionObserver(es=>{const e=es.find(e=>e.target===cv);if(e){inView=e.isIntersecting&&e.intersectionRatio>0;kick();}});observers.push(o);o.observe(cv);}
 if(hostFrame&&hostDoc?.defaultView?.IntersectionObserver){hostInView=false;const o=new hostDoc.defaultView.IntersectionObserver(es=>{const e=es.find(e=>e.target===hostFrame);if(e){hostInView=e.isIntersecting&&e.intersectionRatio>0;kick();}});observers.push(o);o.observe(hostFrame);}
 if(typeof MutationObserver==='function'){const o=new MutationObserver(kick);observers.push(o);o.observe(document.body,{attributes:true,attributeFilter:['class']});}
 window.addEventListener('pagehide',e=>{pageHidden=true;stop();if(!e.persisted){disposed=true;observers.forEach(o=>o.disconnect());hostDoc?.removeEventListener('visibilitychange',kick);}});
 window.addEventListener('pageshow',()=>{pageHidden=false;kick();});
 return Object.freeze({set(pts,sc){P=pts;SC=sc||1;kick();},hit(x,y){if(!allowed())return null;return B.slice().reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)?.code||null;},get points(){return P.map(q=>({code:q.code,x:q.x/dpr,y:q.y/dpr,kind:q.kind,n:q.n,total:q.total,shape:q.shape,reason:q.reason||'',provenance:q.provenance||'',tag:B.filter(b=>b.code===q.code).map(b=>({x:b.x/dpr,y:b.y/dpr,w:b.w/dpr,h:b.h/dpr}))}));}});
})();
 const mark1288=markAt,item1288=itemAt887;
 const tagItem1288=(x,y)=>{const code=Offsite1225.hit(x*dpr,y*dpr);return code?ITEMS.find(it=>it.code===code):null;};
 markAt=function(x,y){const it=tagItem1288(x,y);return it?{it,c:mapStatus1009(it)?.colour||it.cat?.c}:mark1288.apply(this,arguments);};
 itemAt887=function(x,y){const it=tagItem1288(x,y);return it?{it,c:mapStatus1009(it)?.colour||it.cat?.c}:item1288.apply(this,arguments);};""",
     'static honest reference tags with native hit testing'),
    ('window.GC500Departure1211=Object.freeze({get state(){',
     'window.GC500Departure1211=Object.freeze({get markers1288(){return Offsite1225.points;},get state(){',
     'read-only departure marker diagnostics'),
    ('Left site: the symbol says what it is, the green pulse that it has gone, the badge how many (n/total = part gone); dashed = part gone; red = needs review',
     'Left site: green outline · dashed = part collected or catalogue · red = review. Counts apply to each reference.',
     'accurate concise map legend'),
    ("+' · v12.86';",
     "+' · v12.88';",
     'release footer'),
 ]

def apply(text):
    if 'function projected1288(' in text:
        raise ValueError('v12.88 departed footprints already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('Expected exact live v12.86 page; rebuild and retest if live changed')
    for old, new, label in REPLACEMENTS:
        text = rep(text, old, new, label, 'v12.88')
    return text

if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text()), encoding='utf-8')
