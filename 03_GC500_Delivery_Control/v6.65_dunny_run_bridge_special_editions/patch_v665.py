#!/usr/bin/env python3
"""v6.65 - THE DUNNY RUN, THE OVERHEAD BRIDGE, THE CROWD BEHIND THE BARRIERS, AND THE SPECIAL EDITIONS (Andrew Fisher,
26 Sep 2026: "a funny one too - V8 towing a trailer with a portaloo, strapped and chained to standard, door comes open on
each main corner and you see someone sitting in there, then he closes the door ... make sure the crowd are behind barriers
... don't forget people in the stands ... the overhead structures ... name the different vehicles special editions and have
these down the bottom right of the page, almost like you won't open it unless you've been told where it is").

  * loo_v665.js: the portaloo trailer, its door and the bloke's arm on springs, and the shot that looks in while it is open.
  * bridge_v665.js: a truss footbridge over the longest straight, wrapped orange with a black border and white capitals
    (COATES GC500 2026), stair towers behind the barriers, people crossing.
  * Behind the barriers, by rule: a spectator is only drawn where the ground is off the track band and at least the width
    of the concrete beyond the barrier line; the stands and marshal posts are set back to the barrier line before placing.
  * The vehicle chooser leaves the controls: a faint chequered square at the bottom right of the page opens Special
    Editions - Coates #26, Message Board, Dunny Run, Pallet Rocket, Boom Time, Scissor Kick, Paddock Basher.

  python3 patch_v665.py <page.html> <bundle gc3d_bundle.js> <loo_v665.js> <bridge_v665.js> [builder.py]
"""
import os, re, sys
page, bundle, loo, bridge = sys.argv[1:5]; builder = sys.argv[5] if len(sys.argv) > 5 else None
LOO = open(loo, encoding='utf-8').read(); BRIDGE = open(bridge, encoding='utf-8').read()

def rep(text, old, new, what, path):
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]
def ins(text, anchor, new, what, path, after=False):
    if text.count(anchor) != 1: sys.exit(f'{what}: anchor count {text.count(anchor)} in {os.path.basename(path)}')
    return text.replace(anchor, anchor + new, 1) if after else text.replace(anchor, new + anchor, 1)

BARRIER = """/* v6.65 - BEHIND THE BARRIERS (Andrew: make sure the crowd are behind barriers). A spectator stands only where the ground
   is off the track band and clear of the barrier line by more than the concrete is thick; stands and marshal posts are set
   back to that line before they are placed. */
G.behindBarrier=function(S,x,z){if(!S.outer||!S.inner)return true;const c=[x,z];if(G.inPoly(c,S.outer)&&!G.inPoly(c,S.inner))return false;
  let bd=1e9;for(const P of [S.outer,S.inner])for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/l2)),ex=a[0]+dx*t-x,ez=a[1]+dz*t-z;bd=Math.min(bd,ex*ex+ez*ez);}
  return bd>=.36;};
G.barrierGap=function(S,p,n,min){if(!S.outer||!S.inner)return min;for(let d=p[2]/2;d<p[2]/2+6;d+=.04){const c=[p[0]+n[0]*d,p[1]+n[1]*d];if(!(G.inPoly(c,S.outer)&&!G.inPoly(c,S.inner)))return Math.max(min,d+.72);}return min;};
"""

BUNDLE_EDITS = [
 ('VMS without its stabiliser legs',
  "for(const [x,z] of [[-.58,-.42],[-.58,.42],[.58,-.42],[.58,.42]]){tube(st,[x,.34,z],[x,.04,z],.025,8);box(blk,x-.05,x+.05,.02,.04,z-.05,z+.05);tube(st,[x,.34,z],[x,.40,z],.015,6);}",
  "/* v6.65 - no stabiliser legs on the VMS: wound up and stowed while it is towed (Andrew: remove the stabiliser jacks) */"),
 ('setVehicle knows the loo',
  "const S=G.S,tow=kind==='car_vms',k=tow?'car':(G.PLANT[kind]?kind:'car'),key=tow?'car_vms':k;",
  "const S=G.S,tow=kind==='car_vms'||kind==='car_loo',k=tow?'car':(G.PLANT[kind]?kind:'car'),key=tow?kind:k;   /* v6.65 - and 'car_loo', the Dunny Run */"),
 ('tow kind',
  "S.towVms=tow;if(!tow){S.trailer=null;}",
  "S.towVms=tow;S.towKind=kind==='car_loo'?'loo':'vms';if(!tow||S.vehicleKey!==key){S.trailer=null;S.loo=null;}"),
 ('door and arm on their hinges',
  "if(part.sway&&sw)transform=G.swayMatrix(transform,part.sway,sw);",
  "if(part.sway&&sw)transform=G.swayMatrix(transform,part.sway,sw);\n  if(part.door&&S.loo)transform=G.hingeY(transform,part.door.p,-S.loo.a);if(part.arm&&S.loo)transform=G.hingeZ(transform,part.arm.p,-S.loo.arm*.95);   /* v6.65 */"),
 ('trailer of either kind',
  "if(S.trailerQ!==lv||!S.trailerParts){releaseParts(gl,S.trailerParts);S.trailerParts=G.vmsModel(lv).parts.map(",
  "const tk=lv+':'+(S.towKind||'vms');if(S.towKind==='loo'&&G.looStep)G.looStep(S);\n   if(S.trailerQ!==tk||!S.trailerParts){releaseParts(gl,S.trailerParts);S.trailerParts=(S.towKind==='loo'&&G.looModel?G.looModel(lv):G.vmsModel(lv)).parts.map("),
 ('trailer parts carry the hinges',
  "vmsFace:q.vmsFace,batch:b};});S.trailerQ=lv;}",
  "vmsFace:q.vmsFace,door:q.door,arm:q.arm,batch:b};});S.trailerQ=tk;}"),
 ('person stands behind the barrier',
  "const person=(p,rnd,scale)=>{",
  "const person=(p,rnd,scale,free)=>{if(!free&&G.behindBarrier&&!G.behindBarrier(S,p[0],p[2]))return;   /* v6.65 */"),
 ('stands set back to the barrier line',
  "const n=[-t[1]*sg,t[0]*sg],c=[p[0]+n[0]*(p[2]/2+GAP),p[1]+n[1]*(p[2]/2+GAP)];",
  "const n=[-t[1]*sg,t[0]*sg],gb=G.barrierGap?G.barrierGap(S,p,n,p[2]/2+GAP):p[2]/2+GAP,c=[p[0]+n[0]*gb,p[1]+n[1]*gb];   /* v6.65 */"),
 ('stand floor behind the barrier',
  "if(S.distToTrack(x,z)<CL.at(0)[2]*.5+.4)return false;",
  "if(S.distToTrack(x,z)<CL.at(0)[2]*.5+.4)return false;if(G.behindBarrier&&!G.behindBarrier(S,x,z))return false;"),
 ('marshal posts behind the barrier',
  "const n=[-t[1]*sg,t[0]*sg],gap=p[2]/2+1.6,",
  "const n=[-t[1]*sg,t[0]*sg],gap=G.barrierGap?G.barrierGap(S,p,n,p[2]/2+1.6):p[2]/2+1.6,"),
]

SE_HTML = """<style>
/* v6.65 - special editions: the vehicle chooser lives behind a faint chequered square, bottom right */
.shvehl{display:none!important}
.se-trig{position:fixed;right:10px;bottom:10px;z-index:60;width:30px;height:30px;border-radius:8px;border:1px solid rgba(127,127,127,.18);background:rgba(0,0,0,.12);opacity:.22;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:opacity .2s}
.se-trig:hover,.se-trig:focus-visible{opacity:.9}
.se-trig[hidden],.se-panel[hidden]{display:none!important}
.se-panel{position:fixed;right:10px;bottom:48px;z-index:61;width:min(300px,calc(100vw - 20px));background:#111417;color:#f2f2f0;border:1px solid #2a2f35;border-top:3px solid #ff6a13;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.45);padding:10px 10px 8px;font:13px/1.3 Inter,system-ui,sans-serif}
.se-h{display:flex;justify-content:space-between;align-items:center}.se-h b{letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:#ff6a13}
.se-x{background:none;border:0;color:#aaa;font-size:20px;cursor:pointer;line-height:1;padding:0 4px}
.se-sub{margin:4px 0 8px;color:#9aa3ab;font-size:11.5px}
.se-list{display:grid;gap:4px}
.se-item{display:flex;flex-direction:column;align-items:flex-start;text-align:left;background:#1a1f24;border:1px solid #262c33;border-radius:7px;color:inherit;padding:7px 9px;cursor:pointer;font:inherit}
.se-item b{font-size:12.5px}.se-item span{font-size:11px;color:#9aa3ab}
.se-item.on{border-color:#ff6a13;background:#24190f}
</style><button type="button" id="seTrig" class="se-trig" hidden aria-label="Special editions"><svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true"><rect width="12" height="12" fill="#fff"/><rect width="6" height="6" fill="#111"/><rect x="6" y="6" width="6" height="6" fill="#111"/></svg></button><div id="sePanel" class="se-panel" hidden role="dialog" aria-label="Special editions"><div class="se-h"><b>Special Editions</b><button type="button" class="se-x" aria-label="Close">&times;</button></div><p class="se-sub">You found the garage. Pick a ride.</p><div class="se-list"></div></div>"""

SE_JS = """
  /* v6.65 - Special Editions: the vehicles by name, behind the chequered square at the bottom right */
  { const t = $('#seTrig'), p = $('#sePanel'); if (t && p) {
      t.onclick = () => { p.hidden = !p.hidden; if (!p.hidden) seRender(); };
      p.querySelector('.se-x').onclick = () => { p.hidden = true; };
      p.addEventListener('click', e => { const b = e.target.closest('.se-item'); if (!b) return; const v = b.dataset.v, sv = $('#showVehicle'); if (sv) sv.value = v; showVehicleSet(v); seRender(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') p.hidden = true; }); } }"""
SE_FN = """const SE_LIST = [['car', 'Coates #26', 'Race spec'], ['car_vms', 'Message Board', '#26 towing the VMS'], ['car_loo', 'Dunny Run', '#26 towing the portaloo'], ['forklift', 'Pallet Rocket', 'Rough-terrain forklift'], ['boom', 'Boom Time', '4WD articulating boom'], ['scissor', 'Scissor Kick', 'Rough-terrain scissor lift'], ['tractor', 'Paddock Basher', 'Tractor']];
function seRender(){ const L = document.querySelector('#sePanel .se-list'); if (!L) return; const cur = showVehicleGet();
  L.innerHTML = SE_LIST.map(([v, n, d]) => `<button type="button" class="se-item${v === cur ? ' on' : ''}" data-v="${v}"><b>${v === 'car' ? '' : 'SE · '}${n}</b><span>${d}</span></button>`).join(''); }
"""

PAGE_EDITS = [
 ('loo option', '<option value="tractor">Tractor</option></select></label>',
  '<option value="tractor">Tractor</option></select></label>' + SE_HTML),
 ('loo option in the select', '<option value="car_vms">Coates #26 towing the VMS</option>',
  '<option value="car_vms">Coates #26 towing the VMS</option><option value="car_loo">Coates #26 towing the portaloo</option>'),
 ('pref accepts the loo', "(v === 'car' || v === 'car_vms' || GC3D.PLANT[v])", "(v === 'car' || v === 'car_vms' || v === 'car_loo' || GC3D.PLANT[v])"),
 ('SE wiring', "{ const sv = $('#showVehicle'); if (sv) sv.onchange = () => showVehicleSet(sv.value); }",
  "{ const sv = $('#showVehicle'); if (sv) sv.onchange = () => showVehicleSet(sv.value); }" + SE_JS),
 ('SE shows with the 3D', "const vl = $('#showVehicleL'); if (vl) { vl.hidden = !on;",
  "{ const st = $('#seTrig'); if (st) st.hidden = !on; if (!on) { const sp = $('#sePanel'); if (sp) sp.hidden = true; } }   /* v6.65 */\n  const vl = $('#showVehicleL'); if (vl) { vl.hidden = !on;"),
 ('SE list', "function showVehicleGet(){", SE_FN + "function showVehicleGet(){"),
]

for path in [bundle, page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if path != builder:
        t = ins(t, '/* the vehicle on the circuit:', LOO, 'loo', path)
        t = ins(t, 'G.inPoly=function(p,P){', BARRIER, 'barrier helpers', path)
        t = ins(t, 'stats.corners=corners.map(', BRIDGE.lstrip() + '  ', 'bridge', path)
        t = ins(t, '/* v6.64 - the fireworks take the picture', "/* v6.65 - while the portaloo door is open, the camera is behind the trailer looking in */\n  if(S.towVms&&S.towKind==='loo'&&S.loo&&S.loo.ph!=='shut'&&S.trailer&&G.looShot){if(!S._looCut){S._looCut=true;S.camBase=null;}name='chase';cur=G.looShot(S);}\n  else if(S._looCut){S._looCut=false;S.camBase=null;}\n  ", 'loo camera', path)
        for what, old, new in BUNDLE_EDITS: t = rep(t, old, new, what, path)
    if path != bundle:
        for what, old, new in PAGE_EDITS: t = ins(t, old, new[len(old):] if new.startswith(old) else '', what, path, after=True) if new.startswith(old) else rep(t, old, new, what, path)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
