"""v12.42.25 - Map explorer: a departed item keeps its own icon shape with a pulsing "off site" ring round it,
instead of the big green LEFT SITE badge. Andrew, 28 Oct 2026: "the left site is to big it needs to be the shap of
the icon then have a Off Site Pulsating Circle arfound it". Part pick-ups get a dashed ring (no pulse), a departure
needing review a red ring. Reduced-motion: the ring stays, without the pulse. Display only: no record, charge, count
or hire changes. Author: Andrew Fisher. Footer v12.42.25.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

STATUS_A = ",shape:d.complete?'octagon':'diamond',glyph:d.complete?'↗':'↗',colour:d.issues.length?'#ffaaa3':'#7fffc1',fill:d.issues.length?'#742923':'#075239',departure1211:d};"
STATUS_B = ",...(d.issues.length?{shape:'diamond',glyph:'!',colour:'#ffaaa3',fill:'#742923'}:{}),offsite1225:true,departure1211:d}; /* v12.42.25: a departed item keeps its own icon; the ring says it is off site */"

LABEL_A = "d.complete?'LEFT SITE':d.remaining+' to leave'"
LABEL_B = "d.complete?'OFF SITE':d.remaining+' to leave'"

DRAW_A = """  show(mcanvas,true);marksDrawn=true;const ctx=mctx,M=sheetToDevice(dpr*v.scale,canvas.width,canvas.height);ctx.save();ctx.setTransform(1,0,0,1,0,0);
  for(const it of left)for(const b of it.places){const p=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),c=applyM(M,p.x,p.y);if(c.x<0||c.y<0||c.x>canvas.width||c.y>canvas.height)continue;const d=states.get(key(it));
   ctx.fillStyle=d.issues.length?'#742923':'#075239';ctx.strokeStyle='#b5ffe0';ctx.lineWidth=2*dpr;ctx.beginPath();ctx.roundRect(c.x-28*dpr,c.y-22*dpr,56*dpr,19*dpr,4*dpr);ctx.fill();ctx.stroke();ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 '+10*dpr+'px Inter,sans-serif';ctx.fillText(d.issues.length?'REVIEW':d.complete?'LEFT SITE':d.collected+' LEFT',c.x,c.y-12*dpr);
  }ctx.restore();return result;
 };"""
DRAW_B = """  show(mcanvas,true);marksDrawn=true;const M=sheetToDevice(dpr*v.scale,canvas.width,canvas.height),pts=[];
  for(const it of left)for(const b of it.places){const p=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),c=applyM(M,p.x,p.y);if(c.x<-40||c.y<-40||c.x>canvas.width+40||c.y>canvas.height+40)continue;const d=states.get(key(it));
   pts.push({x:c.x,y:c.y,kind:d.issues.length?'review':d.complete?'off':'part'});}
  Offsite1225.set(pts,v.scale);return result;
 };
 /* v12.42.25: the off-site ring, on its own layer over the marks: a steady ring and, for a full departure, a pulse
    going out from it. It runs only while rings are on screen and the page is visible; reduced motion keeps the ring
    and drops the pulse. */
 const Offsite1225=(()=>{const cv=document.createElement('canvas');cv.id='offsite1225';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  mcanvas.parentNode.insertBefore(cv,mcanvas.nextSibling);const st=document.createElement('style');st.textContent='body.in3d #offsite1225,body.fencing-map #offsite1225{display:none!important}';document.head.appendChild(st);
  const g=cv.getContext('2d'),still=matchMedia('(prefers-reduced-motion: reduce)');let P=[],SC=1,raf=0;const C={off:'#7fffc1',part:'#7fffc1',review:'#ffaaa3'},PERIOD=1800;
  function frame(t){raf=0;if(cv.width!==mcanvas.width||cv.height!==mcanvas.height){cv.width=mcanvas.width;cv.height=mcanvas.height;}g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);if(!P.length)return;
   /* the ring grows with the zoom, as the icons do: 5 px across the whole plan, 16 px once zoomed in */
   const r0=dpr*Math.max(5,Math.min(16,5+4.5*Math.log2(Math.max(1,SC/0.07)))),w=r0<9*dpr?1.4*dpr:2*dpr,ph=still.matches?-1:(t%PERIOD)/PERIOD;
   for(const q of P){g.save();g.strokeStyle='rgba(6,10,12,.55)';g.lineWidth=w+2.5*dpr;g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.stroke();
    g.strokeStyle=C[q.kind];g.lineWidth=w;if(q.kind==='part')g.setLineDash([4*dpr,3*dpr]);g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.stroke();g.setLineDash([]);
    if(ph>=0&&q.kind!=='part'){g.globalAlpha=(1-ph)*0.75;g.lineWidth=w*1.2;g.beginPath();g.arc(q.x,q.y,r0+ph*r0,0,Math.PI*2);g.stroke();}g.restore();}
   if(ph>=0&&!document.hidden&&P.some(q=>q.kind!=='part'))raf=requestAnimationFrame(frame);}
  const kick=()=>{if(!raf)raf=requestAnimationFrame(frame);};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick();});still.addEventListener?.('change',kick);
  return Object.freeze({set(pts,sc){P=pts;SC=sc||1;kick();},get points(){return P.map(q=>({...q}));},get radius(){return dpr*Math.max(5,Math.min(16,5+4.5*Math.log2(Math.max(1,SC/0.07))));}});})();"""

FOOT = ("+' · v12.42.24'; /* v8.19 release922", "+' · v12.42.25'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((STATUS_A, STATUS_B, 'departed status keeps its icon'), (LABEL_A, LABEL_B, 'label OFF SITE'), (DRAW_A, DRAW_B, 'off-site ring'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124225 applied')
