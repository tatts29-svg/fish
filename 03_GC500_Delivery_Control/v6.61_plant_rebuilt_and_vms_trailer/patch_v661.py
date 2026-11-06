#!/usr/bin/env python3
"""v6.61 - THE PLANT REBUILT FROM THE PHOTOGRAPHS, AND THE #26 TOWING A COATES VMS (Andrew Fisher, 26 Sep 2026, with
photographs of Coates plant and a VMS trailer: "improve the quality of the vehicles ... Race car towing a vms board ... make
sure they are Coates and are orange, the vms board can say coates GC500 2026").

  * The forklift, scissor lift and boom lift are rebuilt from his photographs (plant_v661.js): rounded pressed panels,
    knobbly lugged tyres on coloured rims, guards over the wheels, the Coates wordmark from the car's own typeset atlas,
    hi-vis operators in hard hats, a turning amber beacon; the boom's basket swings on a spring through the corners.
    They travel the way plant travels on a site - platform down, boom stowed, operators inside the rails.
  * A new vehicle, "Coates #26 towing the VMS": a single-axle orange trailer with an A-frame drawbar, jockey wheel,
    stabiliser legs, mast, solar panel and a black board whose amber LED face reads COATES / GC500 / 2026 and glows at
    night. The trailer follows the tow ball the way a real one does, tracking inside on a corner and swinging out when the
    car slides, with its own contact shadow and wheels. The cameras sit higher and wider while towing so the car is not
    hidden behind the board.

  python3 patch_v661.py <page.html> <bundle gc3d_bundle.js> <plant_v661.js> <draw_v661.js> [builder.py]
"""
import os, re, sys
page, bundle, plant_js, draw_js = sys.argv[1:5]; builder = sys.argv[5] if len(sys.argv) > 5 else None
PLANT = open(plant_js, encoding='utf-8').read(); DRAW = open(draw_js, encoding='utf-8').read().rstrip('\n')

def rep(text, old, new, what, path):
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

def slice_rep(text, start_mark, end_mark, new, what, path, include_end=False):
    a = text.find(start_mark)
    if a < 0 or text.find(start_mark, a + 1) >= 0: sys.exit(f'{what} in {os.path.basename(path)}: start marker not unique/found')
    b = text.find(end_mark, a)
    if b < 0: sys.exit(f'{what} in {os.path.basename(path)}: end marker not found')
    if include_end: b += len(end_mark)
    return text[:a] + new + text[b:]

SETVEH = """G.setVehicle=function(kind){
  /* v6.61 - 'car_vms' is the car with the VMS trailer on its hitch */
  const S=G.S,tow=kind==='car_vms',k=tow?'car':(G.PLANT[kind]?kind:'car'),key=tow?'car_vms':k;G.vehicle=k;G.towVms=tow;if(!S)return key;
  S.towVms=tow;if(!tow){S.trailer=null;}
  if(S.vehicleKey===key)return key;S.vehicleKey=key;
  if(S.vehicle!==k){S.vehicle=k;S.raceCarGeometryQuality=null;}
  const T=S.tune;if(T.vmax0==null){T.vmax0=T.vmax;T.aLat0=T.aLat;}
  const V=tow?{speed:.86,grip:.92,note:1}:(G.PLANT[k]||{speed:1,grip:1,note:1});T.vmax=T.vmax0*V.speed;T.aLat=T.aLat0*V.grip;if(S.rebuildSpeed)S.rebuildSpeed();
  if(G.sound)G.sound.vRate=V.note;
  return key;
};"""

LINE_EDITS = [
 ('materials',
  "plant:[[1,.42,.08],.40,.10,3],plantBlack:[[.05,.055,.06],.55,.05,3],plantWhite:[[.95,.95,.93],.40,.05,3],steel:[[.50,.53,.57],.42,.55,4]};",
  "/* v6.61 - the plant's orange in the same linear light as the car's livery orange; the old value was the screen colour and read yellow in the sun */\n  plant:[[.92,.15,.010],.40,.10,3],plantBlack:[[.02,.022,.025],.55,.05,3],plantWhite:[[.86,.86,.84],.40,.05,3],steel:[[.26,.28,.31],.42,.55,4],\n  /* v6.61 - hi-vis, skin, the hazard yellow, the solar panel; the LED face (9, emissive, from its own texture) and the beacon (10, a turning flash) */\n  hivis:[[.55,.90,.02],.62,0,3],hivisPanel:[[.92,.62,.01],.5,0,3],skin:[[.58,.33,.21],.7,0,3],solar:[[.01,.015,.05],.16,.4,4],ledAmber:[[1,.30,.015],.5,0,9],beacon:[[1,.28,.01],.3,0,10]};"),
 ('upload item carries sway',
  "  const item={name:p.name,material:p.material,wheel:p.wheel,color:p.color,batch:b};uploaded.push(item);",
  "  const item={name:p.name,material:p.material,wheel:p.wheel,color:p.color,sway:p.sway,vmsFace:p.vmsFace,batch:b};uploaded.push(item);   /* v6.61 - the basket's spring and the LED face ride along */"),
 ('shader: atlas branch excludes the emissive kinds',
  " if(uKind>7.5){if(dot(normalize(vNormal),V)<=0.)discard;alpha=texture(uAtlas,vUV).r;if(alpha<.015)discard;}",
  " if(uKind>7.5&&uKind<9.5){if(dot(normalize(vNormal),V)<=0.)discard;alpha=texture(uAtlas,vUV).r;if(alpha<.015)discard;}"),
 ('shader: LED and beacon colour',
  " if(uKind>7.5)col=base*(.65+.35*nl)*mix(.65,1.,uDay);",
  " if(uKind>7.5)col=base*(.65+.35*nl)*mix(.65,1.,uDay);\n if(uKind>8.5&&uKind<9.5)col=uColor*mix(1.25,2.4,1.-uDay);\n if(uKind>9.5)col=uColor*(.30+2.6*uBrake)*mix(.9,1.7,1.-uDay);"),
 ('towing cameras',
  "  const side=lockedSide===1||lockedSide===-1?lockedSide:(m.slip>=0?1:-1);",
  """  const side=lockedSide===1||lockedSide===-1?lockedSide:(m.slip>=0?1:-1);
  /* v6.61 - towing the VMS: higher and wider, so the car is never hidden behind the board and the trailer is in the frame */
  if(S.towVms){if(name==='chase')return {eye:behind(9.4+.8*sp,3.3,side*2.4),tgt:[car[0]-cf[0]*.8*Sx,car[1]+.5*Sx,car[2]-cf[2]*.8*Sx],fov:38+3*sp};
    if(name==='low')return {eye:behind(3.2,1.0,side*3.6),tgt:[car[0]-cf[0]*1.7*Sx,car[1]+.6*Sx,car[2]-cf[2]*1.7*Sx],fov:46};
    if(name==='hero')return {eye:behind(-2.4,1.35,side*4.4),tgt:[car[0]-cf[0]*1.5*Sx,car[1]+.55*Sx,car[2]-cf[2]*1.5*Sx],fov:40};}"""),
 ('trailer contact shadow',
  "    for(let k=0;k<N2;k++){const j=(k+1)%N2;sh.tri(c,inner[k],inner[j]);sh.tri(inner[k],rim[k],rim[j]);sh.tri(inner[k],rim[j],inner[j]);}",
  """    for(let k=0;k<N2;k++){const j=(k+1)%N2;sh.tri(c,inner[k],inner[j]);sh.tri(inner[k],rim[k],rim[j]);sh.tri(inner[k],rim[j],inner[j]);}
    /* v6.61 - the trailer's own contact shadow */
    if(S.towVms&&G.trailerStep){const T=G.trailerStep(S);if(T){const c2=Math.cos(T.hd),s2=Math.sin(T.hd),tf=[c2,0,s2],tr=[-s2,0,c2],cx=T.ax+tf[0]*.3*Sx,cz=T.az+tf[2]*.3*Sx,LX2=1.05*Sx,LZ2=.74*Sx;
      const c0=sh.vert(cx,sy,cz,0,0,0,.55,0,0),ring=[];for(let k=0;k<N2;k++){const t=2*Math.PI*k/N2,ex=Math.cos(t)*LX2,ez=Math.sin(t)*LZ2;ring.push(sh.vert(cx+tf[0]*ex+tr[0]*ez,sy,cz+tf[2]*ex+tr[2]*ez,0,0,0,0,0,0));}
      for(let k=0;k<N2;k++)sh.tri(c0,ring[k],ring[(k+1)%N2]);}}"""),
]

PAGE_EDITS = [
 ('vehicle option',
  """<option value="car">Coates #26</option>""",
  """<option value="car">Coates #26</option><option value="car_vms">Coates #26 towing the VMS</option>"""),
 ('vehicle pref accepts the tow',
  """return v && window.GC3D && GC3D.PLANT && (v === 'car' || GC3D.PLANT[v]) ? v : 'car';""",
  """return v && window.GC3D && GC3D.PLANT && (v === 'car' || v === 'car_vms' || GC3D.PLANT[v]) ? v : 'car';"""),
]

for path in [bundle, page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if path != builder:
        t = slice_rep(t, 'G.PLANT={forklift:', '/* the vehicle on the circuit:', PLANT + '\n', 'plant models', path)
        t = slice_rep(t, 'G.setVehicle=function(kind){', '\n};', SETVEH, 'setVehicle', path, include_end=True)
        t = slice_rep(t, 'G.drawRaceCar=function(S,VP,fog){', '\n};', DRAW, 'drawRaceCar', path, include_end=True)
        for what, old, new in LINE_EDITS: t = rep(t, old, new, what, path)
    if path != bundle:
        for what, old, new in PAGE_EDITS: t = rep(t, old, new, what, path)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
