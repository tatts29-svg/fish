#!/usr/bin/env python3
"""v6.62 - EVERY MOVE, DRIFT AND SLIDE, AND THE CAMERA THAT SELLS IT (Andrew Fisher, 26 Sep 2026: "improve the motion of every
move and drift and slide. And angle of camera to like a wow wow factor").

Motion (G.step):
  * The slide is a spring, not a glide. The tail steps out under power, runs a touch past its angle and is caught - the
    pendulum a real power slide has - instead of easing to a fixed angle and sitting there.
  * Weight transfer settles. Roll and pitch are damped springs as well, so the car squats out of a corner, dives on the
    brakes and rocks back once when it lets go, rather than sliding smoothly between two numbers.
  * The front wheels steer. Their angle is the corner's geometry less the slide, so in a drift they point along where the
    car is going - opposite lock - and straighten as it is caught.
Camera (angle / camStep / render):
  * The close rigs lean with the car (a dutch tilt from the slide and the roll; the driver's view rolls with the cockpit),
    the drone banks gently as it circles, and every tilt is cut, not faded, when the director cuts.
  * The lens breathes: close shots widen with speed and under throttle and tighten on the brakes.
  * The chase and low rigs are on an arm: the car pulls away on the throttle and comes back to the lens under brakes.
  * Trackside, grid, car-follow and brake-attack cameras carry a little hand-held float.
  * Reduced motion keeps all of it off (no tilt, no float).

  python3 patch_v662.py <page.html> <bundle gc3d_bundle.js>
"""
import os, re, sys
page, bundle = sys.argv[1:3]

def rep(text, old, new, what, path):
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

EDITS = [
 ('slip spring',
  "  m.slip+=(slipT-m.slip)*(1-Math.exp(-dt*(onPower?4.0:1.9)));",
  """  /* v6.62 - THE SLIDE IS A SPRING. Chasing the target exponentially eased the tail to an angle and parked it there. A real
     power slide steps out, runs a touch past and is caught: a damped spring, stiffer and quicker under power. */
  {const kS=onPower?30:10,cS=onPower?7.0:5.6;m.slipV=(m.slipV||0)+((slipT-m.slip)*kS-(m.slipV||0)*cS)*dt;m.slip+=m.slipV*dt;
   const lim=T.slipMax*1.12;if(m.slip>lim){m.slip=lim;m.slipV=Math.min(0,m.slipV);}else if(m.slip<-lim){m.slip=-lim;m.slipV=Math.max(0,m.slipV);}}"""),
 ('pitch and roll springs',
  """  m.pitch+=(pitchT-m.pitch)*(1-Math.exp(-dt*6));
  m.roll+=(roTgt-m.roll)*(1-Math.exp(-dt*5));""",
  """  /* v6.62 - WEIGHT TRANSFER SETTLES. Pitch and roll are damped springs: the car squats, dives and leans, and rocks back
     once when the load comes off, instead of gliding between two numbers. */
  m.pitchV=(m.pitchV||0)+((pitchT-m.pitch)*58-(m.pitchV||0)*8.6)*dt;m.pitch+=m.pitchV*dt;
  const latN=S.calmDrive?0:Math.max(-1.2,Math.min(1.2,k*m.v*m.v/Math.max(1e-6,T.aLat||1)));   /* the body leans on the load, about two degrees at the limit */
  m.rollV=(m.rollV||0)+((roTgt+latN*.034-m.roll)*46-(m.rollV||0)*7.8)*dt;m.roll+=m.rollV*dt;
  /* v6.62 - THE FRONT WHEELS STEER: the corner's own angle less the slide, so a drift shows opposite lock */
  {const kf=S.kAt?S.kAt(m.s+.7*T.carS):0,geo=Math.atan(1.11*T.carS*kf)*(go?1:0),want=S.calmDrive?0:Math.max(-.32,Math.min(.32,geo*1.6-m.slip*1.05));
   m.steer=(m.steer||0)+(want-(m.steer||0))*(1-Math.exp(-dt*9));}"""),
 ('reset clears the springs',
  "m.lat=0;m.slip=0;m.pitch=0;m.roll=0;",
  "m.lat=0;m.slip=0;m.pitch=0;m.roll=0;m.slipV=0;m.pitchV=0;m.rollV=0;m.steer=0;"),
 ('steer matrix',
  " const flash=Math.pow(.5+.5*Math.sin(S.clock*12.6),6);",
  " const flash=Math.pow(.5+.5*Math.sin(S.clock*12.6),6);\n /* v6.62 - a front wheel turns about its own upright */\n const sa=S.sim.steer||0,csa=Math.cos(sa),ssa=Math.sin(sa),steerAt=w=>new Float32Array([csa,0,ssa,0,0,1,0,0,-ssa,0,csa,0,w.x-(csa*w.x-ssa*w.z),0,w.z-(ssa*w.x+csa*w.z),1]);"),
 ('wheel key',
  "const w=part.wheel,key=w.x+':'+(w.y||0);",
  "const w=part.wheel,key=w.x+':'+(w.y||0)+':'+(w.z||0);"),
 ('wheel steers',
  "transform=G.matMul(M0,R);wt.set(key,transform);",
  "transform=G.matMul(w.z!==undefined&&w.x>0&&sa?G.matMul(M0,steerAt(w)):M0,R);wt.set(key,transform);"),
 ('camera arm',
  "  const side=lockedSide===1||lockedSide===-1?lockedSide:(m.slip>=0?1:-1);",
  "  const side=lockedSide===1||lockedSide===-1?lockedSide:(m.slip>=0?1:-1);\n  /* v6.62 - the chase and low rigs ride an arm: the car pulls away on the throttle and comes back under brakes */\n  const arm=S.reducedMotion?0:Math.max(-.40,Math.min(.60,(m.throttle||0)*.60*sp-(m.brake||0)*.40));"),
 ('low on the arm',
  "case 'low':       return {eye:behind(3.7+.8*sp,.72,.8),",
  "case 'low':       return {eye:behind(3.7+.8*sp+arm,.72,.8),"),
 ('chase on the arm',
  "case 'chase':     return {eye:behind(4.8+.7*sp,1.45,.35),",
  "case 'chase':     return {eye:behind(4.8+.7*sp+arm,1.45,.35),"),
 ('lens and tilt',
  "  S.camShake=[x,y,z];",
  """  /* v6.62 - THE LENS BREATHES AND THE FRAME LEANS. Close shots widen with speed and throttle and tighten on the brakes;
     the close rigs lean with the slide and the roll, the driver's view rolls with the cockpit, the drone banks as it
     circles. A cut cuts the tilt too. Trackside rigs get a little hand-held float. Reduced motion: none of it. */
  {const spd=Math.max(0,Math.min(1,m.v/S.tune.vmax)),close=isClose(name),t=S.clock,rm=!!S.reducedMotion;
   const fk=rm?0:close&&!/^(wheel|detail|frontdetail)$/.test(name)?(.08*spd*spd+.05*(m.throttle||0)*spd-.04*(m.brake||0)):0;
   S.fovKick=(S.fovKick||0)+(fk-(S.fovKick||0))*(1-Math.exp(-dt*2.2));
   let rl=0;
   if(rm)rl=0;else if(name==='onboard')rl=-(m.roll||0)*2.2;
   else if(close)rl=Math.max(-.085,Math.min(.085,(m.slip||0)*.19+(m.roll||0)*.8));
   else if(name==='heli'||name==='orbit')rl=.045*Math.sin(t*.23);
   const snap=hard&&S.camT<dt*1.5;S.camRoll=snap?rl:(S.camRoll||0)+(rl-(S.camRoll||0))*(1-Math.exp(-dt*2.6));
   if(!rm&&/^(trackside|grid|hero|brake)$/.test(name)){const q=S.tune.carS*.016;x+=Math.sin(t*1.7)*q+Math.sin(t*3.1)*q*.4;y+=Math.sin(t*2.3+1)*q*.6;z+=Math.cos(t*1.3)*q;}}
  S.camShake=[x,y,z];"""),
 ('fov kick applied',
  "tgt:[S.camBase.tgt[0]+x*.30,S.camBase.tgt[1]+y*.30,S.camBase.tgt[2]+z*.30],fov:S.camBase.fov};",
  "tgt:[S.camBase.tgt[0]+x*.30,S.camBase.tgt[1]+y*.30,S.camBase.tgt[2]+z*.30],fov:S.camBase.fov*(1+(S.fovKick||0))};"),
 ('camera up tilts',
  "VP=G.matMul(P,G.lookAt(cam.eye,cam.tgt,[0,1,0]));",
  "VP=G.matMul(P,G.lookAt(cam.eye,cam.tgt,G.camUp(cam,S.camRoll||0)));"),
 ('camUp',
  "/* put the canvas in a plate (the element the scene's backdrop lives in) */",
  "/* v6.62 - the up vector for a leaning frame: world up turned about the line of sight */\nG.camUp=function(cam,r){if(!r)return [0,1,0];const f=V.norm(V.sub(cam.tgt,cam.eye)),rt=V.norm(V.cross(f,[0,1,0])),c=Math.cos(r),s=Math.sin(r);return [s*rt[0],c+s*rt[1],s*rt[2]];};\n/* put the canvas in a plate (the element the scene's backdrop lives in) */"),
]

for path in [bundle, page]:
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    for what, old, new in EDITS: t = rep(t, old, new, what, path)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
