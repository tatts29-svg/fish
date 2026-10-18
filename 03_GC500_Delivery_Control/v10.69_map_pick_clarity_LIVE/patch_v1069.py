"""Author: Andrew Fisher. Fix map hit priority and crowded reference labels.
Production entry accepts v10.68 only; apply_shape is for isolated v10.65 fixtures.
The explorer build pins and machine bytes are deliberately unchanged.
"""
from pathlib import Path
import re
import hashlib
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
MARKER='/* map-pick-clarity-1069 */'
EXPECTED_SHAPE_SHA256='2ed1461a29f678593b744e871d60489f46de97c49d4901a0670217fe8596f7d2'

def apply_shape(text):
    if MARKER in text: raise ValueError('v10.69 already applied')
    if 'shape1065: a new pick waits' not in text: raise ValueError('v10.65 ripple predecessor missing')
    match=re.search(r'(<script id="shapes1060-script">)(.*?)(</script>)',text,re.S)
    if not match: raise ValueError('exact shape script missing')
    old=match[2]; s=old
    if hashlib.sha256(old.encode()).hexdigest()!=EXPECTED_SHAPE_SHA256:raise ValueError('shape source/build pins differ from reviewed v10.65 predecessor')
    pins=re.findall(r"const EXPLORER_BUILD[^;]*;",old)
    if len(pins)!=3 or "[EXPLORER_BUILD, EXPLORER_BUILD_1064, EXPLORER_BUILD_1065].includes" not in old: raise ValueError('reviewed explorer allowlist changed')
    changes=[
     ('screen helpers', '  function pull(){', '  '+MARKER+'\n'+(HERE/'map_pick1069_src.js').read_text()+'\n  let obstacles1069=[], projected1069=new Map(), keptDone1069=[];\n  function reserveLabel1069(code,b){obstacles1069.push({code,box:b,parts:[[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}]]});}\n  function pull(){'),
     ('project once per paint', 'status = mapStatus1009(m.it), L = project(sh, M, dpr);', 'status = mapStatus1009(m.it), L = projected1069.get(m.it) || project(sh, M, dpr);'),
     ('status before text', '   for (const [plan, L, status, m, dx, dy] of later) drawPlan(plan, L, status, m, dx, dy);    /* second pass: the ticks and references, the selected last */', '''   for (const [P,L,status,m,dx,dy] of later) {
    if(P.fill&&status)L.parts.forEach(p=>{if(p.c.tank)return;path(g,p.pts);g.fillStyle=(status.colour||'#2fd06a')+'d9';g.fill();g.strokeStyle='#0b0908';g.lineWidth=1.4*dpr;g.stroke();});
   }
   for(const [P,L,status,m,dx,dy] of later)for(const tk of P.ticks)glyph(g,{x:tk.x+dx,y:tk.y+dy},tk.size,status);
   for (const [plan,L,status,m,dx,dy] of later) drawPlan(plan,L,status,m,dx,dy);    /* map1069: every status fill/tick precedes all reference text */'''),
     ('remove later status overpaint', "   if (P.fill && status) L.parts.forEach(p => { if (p.c.tank) return; path(g, p.pts); g.fillStyle = (status.colour || '#2fd06a') + 'd9'; g.fill(); g.strokeStyle = '#0b0908'; g.lineWidth = 1.4 * dpr; g.stroke(); });\n   for (const tk of P.ticks) glyph(g, {x: tk.x + dx, y: tk.y + dy}, tk.size, status);", ''),
     ('internal label clarity', '   for (const l of P.labels) {\n    g.save();', '''   for (const l of P.labels) {
    if(m.it!==selected&&!MapPick1069.clear({x:l.box.x+dx,y:l.box.y+dy,w:l.box.w,h:l.box.h},m.it.code,obstacles1069,2*dpr))continue;
    g.save();'''),
     ('selected outside label clearance', '   for (const tx of P.plain) {\n    g.save();', '''   for (const tx0 of P.plain) {
    const b=MapPick1069.place({x:tx0.x+dx-tx0.w/2,y:tx0.y+dy,w:tx0.w,h:tx0.px},{x:L.box.x0,y:L.box.y0,w:L.box.x1-L.box.x0,h:L.box.y1-L.box.y0},m.it.code,obstacles1069,{w:canvas.width,h:canvas.height},dpr,m.it===selected);
    if(!b)continue;const tx={...tx0,x:b.x+b.w/2-dx,y:b.y-dy};
    g.save();'''),
     ('reset projection on native view', 'if (fencing() || !SNAP) { doneShaped = []; try { paint(v, []); }', 'if (fencing() || !SNAP) { doneShaped = []; obstacles1069=[]; projected1069.clear(); keptDone1069=[]; try { paint(v, []); }'),
     ('shared projected obstacles', '   kept = rest.length;\n   marks = rest;', '''   kept = rest.length;keptDone1069=dnRest.filter(it=>!codes.has(it.code));
   projected1069=new Map();obstacles1069=[];
   const matrix1069=sheetToDevice(dpr*v.scale,canvas.width,canvas.height);
   for(const [m,sh] of doneShaped.concat(shaped)){
    const L=project(sh,matrix1069,dpr);projected1069.set(m.it,L);const b=L.box;
    if(b.x1>=-60&&b.y1>=-60&&b.x0<=canvas.width+60&&b.y0<=canvas.height+60)obstacles1069.push({code:m.it.code,box:{x:b.x0,y:b.y0,w:b.x1-b.x0,h:b.y1-b.y0},parts:L.parts.map(p=>p.pts)});
   }
   for(const m of keptDone1069.map(it=>({it,done:true})).concat(rest))for(const bb of m.it.places){
    const q=toGeo((bb[0]+bb[2])/2,(bb[1]+bb[3])/2),c=applyM(matrix1069,q.x,q.y),r=m.done?17.5*dpr:Math.max(14*dpr,Math.hypot(bb[2]-bb[0],bb[3]-bb[1])*dpr*v.scale*.7)+(m.it===selected?6.5:0.8)*dpr;
    if(c.x+r<0||c.y+r<0||c.x-r>canvas.width||c.y-r>canvas.height)continue;
    obstacles1069.push({code:m.it.code,box:{x:c.x-r,y:c.y-r,w:2*r,h:2*r},parts:[Array.from({length:32},(_,i)=>({x:c.x+r*Math.cos(i*Math.PI/16),y:c.y+r*Math.sin(i*Math.PI/16)}))]});
   }
   marks = rest;'''),
     ('kept reference avoids shape', "   const x = Math.min(Math.max(4 * dpr + wm / 2, c.x), canvas.width - 4 * dpr - wm / 2), y = Math.min(c.y + r + 4 * dpr, canvas.height - h - 4 * dpr);", '''   const oldX=Math.min(Math.max(4*dpr+wm/2,c.x),canvas.width-4*dpr-wm/2),oldY=Math.min(c.y+r+4*dpr,canvas.height-h-4*dpr);
   const box1069=MapPick1069.place({x:oldX-wm/2,y:oldY,w:wm,h},{x:c.x-r,y:c.y-r,w:2*r,h:2*r},it.code,obstacles1069,{w:canvas.width,h:canvas.height},dpr,sel);
   if(!box1069){ctx.restore();return;}const x=box1069.x+wm/2,y=box1069.y;'''),
     ('reserve kept label clearance', '   labelBounds1010.push({it, x: (x - wm / 2) / dpr, y: y / dpr, w: wm / dpr, h: h / dpr});', '   reserveLabel1069(it.code,{x:x-wm/2,y,w:wm,h});\n   labelBounds1010.push({it, x: (x - wm / 2) / dpr, y: y / dpr, w: wm / dpr, h: h / dpr});'),
     ('reserve shape label clearance', '    if (l.level) labelBounds1010.push', '    reserveLabel1069(m.it.code,{x:l.box.x+dx,y:l.box.y+dy,w:l.box.w,h:l.box.h});\n    if (l.level) labelBounds1010.push'),
    ]
    a=s.index('  window.markAt = function(x, y){')
    b=s.index('  window.itemAt887 = function',a)
    pick='''  function keptInk1069(x,y,list){
   const v=currentView(),M=sheetToDevice(v.scale,sw,sh);
   // Native markers paint after Done badges, with later markers above earlier ones.
   for(let i=list.length-1;i>=0;i--){const m=list[i],it=m.it;
    for(let j=it.places.length-1;j>=0;j--){const bb=it.places[j],q=toGeo((bb[0]+bb[2])/2,(bb[1]+bb[3])/2),c=applyM(M,q.x,q.y),r=Math.max(14,Math.hypot(bb[2]-bb[0],bb[3]-bb[1])*v.scale*.7);
     if(MapPick1069.badge(x-c.x,y-c.y,r,mapStatus1009(it),it===selected,!!m.done))return m;
    }
   }return null;
  }
  window.markAt = function(x,y){
   if(fencing()||!SNAP)return nativeMarkAt(x,y);
   const all=marks,lb=labelBounds1010,rest=all.filter(m=>!shapeFor(m.it));
   const visible=all.concat(doneShaped.map(p=>p[0]));
   const keptLabel=(()=>{labelBounds1010=lb.filter(b=>!b.it||!shapeFor(b.it));try{return labelHit1010(x,y);}finally{labelBounds1010=lb;}})();
   const ink=keptInk1069(x,y,keptDone1069.map(it=>({it,c:it.cat&&it.cat.c,done:true})).concat(rest));
   if(ink||keptLabel)return ink||keptLabel;
   const selectedVisible=visible.find(m=>m.it===selected),top=selectedVisible&&shapeFor(selected)?hit(x,y,[selectedVisible]):null;
   const own=top||hit(x,y,visible)||labelHit1010(x,y);if(own)return own;
   // Padding remains a useful finger target only where it covers no visible shape.
   labelBounds1010=[];try{return nativeMarkAt(x,y);}finally{labelBounds1010=lb;}
  };
'''
    changes.append(('visible shape beats empty marker padding',s[a:b],pick))
    changes.append(('diagnostic version', "version: 'v10.60', pull,", "version: 'v10.60', clarity1069: true, pull,"))
    for name,a,b in changes:
      if s.count(a)!=1:raise ValueError(f'{name}: expected one anchor, got {s.count(a)}')
    for name,a,b in changes:s=rep(s,a,b,name,'shapes1060-script')
    if re.findall(r"const EXPLORER_BUILD[^;]*;",s)!=pins:raise ValueError('explorer pins changed')
    return text[:match.start(2)]+s+text[match.end(2):]

def patch(text):
    if "+ ' · v10.68'" not in text or '/* supplier-cost-consistency-1068 */' not in text:raise ValueError('v10.69 requires final v10.68 predecessor')
    return rep(apply_shape(text),"+ ' · v10.68'","+ ' · v10.69'",'release footer','page')

if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()))
