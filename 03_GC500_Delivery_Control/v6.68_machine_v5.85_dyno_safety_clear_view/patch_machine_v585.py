#!/usr/bin/env python3
"""The Coates Way machine v5.85 (Andrew Fisher, 26 Sep 2026: "when we move around nothing blocks the visual view … high
detailed and very smooth … we need to see the wheels running at high speed when we throttle it … a safety control officer in
this area who makes sure everyone is safe … and what on earth are those connected to the tyres at the back").

  * The two exhaust-extraction hoses are gone. Their funnels met the side pipes where the pipes end — right at the front of
    the rear tyres — so they read as hoses bolted to the tyres, and they hung across the view. (The service kit's code that
    unhooked them still runs; there is nothing to show.) Their exhibit boxes go with them.
  * view-fx.js: anything in the hall between the camera and what it looks at fades to a ghost while it is in the way.
  * The dyno run you can see: with the V8 running and the throttle open, the box goes into first by itself, climbs through
    the gears on the limiter, and drops back to neutral after a few seconds off the throttle — unless you have shifted by hand
    in the last twelve seconds, which always wins. The rear wheels and the rollers spin up to the road speed the dials show
    (capped where the eye can still follow), and a blur disc fades over each rear wheel as it gets fast. The inspection drive,
    the parts and the dials are as they were.
  * The safety control officer: a seventh member of the crew, white helmet, hi-vis vest with SAFETY across front and back,
    patrolling the aisle round the cell, stopping to watch the car; he holds the line on the near side while the V8 runs.
  * Smoother: on the Laptop rung (the one phones and most laptops start on) the page lifts its 30 fps cap to 60 when the
    frames are cheap, and puts it back — for good — if the frame rate then sags.
Applied once to handover_machine/print/machine/dist, on top of v5.84."""
import os, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'handover_machine/print/machine/dist')

def rep(path, old, new, count=1):
    p = os.path.join(D, path); s = open(p, encoding='utf-8').read()
    n = s.count(old)
    if n != count: sys.exit(f'{path}: expected {count} of {old[:70]!r}, found {n}')
    open(p, 'w', encoding='utf-8').write(s.replace(old, new)); print('ok', path, old[:50].replace('\n', ' '))

# ---- the hoses ----
rep('pit-garage.js', "fittings.add(hose);", "/* v5.85 — the extraction hoses are not hung: they met the pipes at the front of the rear tyres and read as hoses on the tyres */")
rep('pit-garage.js', "exhibitBox(root, 'extraction', 1.2, 1.4, 1.0, 1.5, 1.1, -1.9); exhibitBox(root, 'extraction', 1.2, 1.4, 1.0, 1.5, 1.1, 1.9);", "")

# ---- the safety control officer ----
rep('crew.js', "  {id: 'driver', title: 'forklift operator', label: 5, height: 1.78, build: 1.06, helmet: 'crew', seed: 67, walk: 1.1},\n]);",
    "  {id: 'driver', title: 'forklift operator', label: 5, height: 1.78, build: 1.06, helmet: 'crew', seed: 67, walk: 1.1},\n"
    "  /* v5.85 — the safety control officer (Andrew Fisher, 26 Sep 2026): white helmet, a hi-vis vest over the suit (the vest carries his title; the suit's label under it is never seen) */\n"
    "  {id: 'safety', title: 'safety control officer', label: 4, height: 1.79, build: 1.0, helmet: 'lead', seed: 79, walk: 1.0},\n]);")
rep('crew.js', "  driver: {id: 'crewforklift',",
    "  safety: {id: 'crewsafety', name: 'The safety control officer', what: 'Walks the aisle round the cell the whole time the car is on the dyno: keeps everyone out of the line of the rollers and the rear wheels while the V8 runs, checks the zone is clear before a start, and watches every lift and every wheel that comes off. He can stop the job.', ...lifeSavingRule('Risk Assessment')},\n  driver: {id: 'crewforklift',")
rep('crew.js', "for (const id of ['operator', 'mechanic', 'tech', 'engine', 'lead'])",
    "for (const id of ['operator', 'mechanic', 'tech', 'engine', 'lead', 'safety'])")
rep('crew.js', "  const scripts = {operator: new Script(operator),",
    """  /* ---- v5.85 — the safety control officer: the vest, and the patrol ---- */
  { const m = men.safety, f = m.fig, B = f.bones; f.root.updateMatrixWorld(true);
    const P = b => new T3.Vector3().setFromMatrixPosition(b.matrixWorld), sp = P(B.spine), nk = P(B.neck), cl = P(B.armL), cr = P(B.armR);   /* the shoulder joints: the collarbones start together at the neck */
    const up = nk.clone().sub(sp), H = up.length(); up.normalize(); const side = cr.clone().sub(cl), W = side.length(); side.normalize(); const fw = new T3.Vector3().crossVectors(side, up).normalize();
    const vc = makeCanvas(512, 256), vg = vc && vc.getContext('2d');
    if (vg) { vg.fillStyle = '#c6f21a'; vg.fillRect(0, 0, 512, 256); vg.fillStyle = '#e9ecec'; for (const y of [150, 196]) vg.fillRect(0, y, 512, 16); for (const x of [96, 160, 352, 416]) vg.fillRect(x - 7, 0, 14, 150);
      vg.fillStyle = '#1b2226'; vg.font = '900 44px Arial, Helvetica, sans-serif'; vg.textAlign = 'center'; vg.textBaseline = 'middle'; for (const x of [128, 384]) vg.fillText('SAFETY', x, 96); }
    const vt = vc ? new T3.CanvasTexture(vc) : null; if (vt) vt.colorSpace = T3.SRGBColorSpace;
    const vest = new T3.Mesh(new T3.CylinderGeometry(1, .96, 1, 20, 1, true), new T3.MeshStandardMaterial({color: 0xffffff, map: vt, roughness: .75, metalness: 0, emissive: 0x1a2200, side: T3.DoubleSide}));
    vest.name = 'Safety officer hi-vis vest';
    const basis = new T3.Matrix4().makeBasis(side, up, fw); vest.quaternion.setFromRotationMatrix(basis); vest.scale.set(W * .63, H * 1.08, W * .47);
    vest.position.copy(sp).addScaledVector(up, H * .52); B.chest.attach(vest); }
  const PATROL = [[-4.8, 2.6], [-1.0, 2.85], [1.8, 2.95], [4.4, 2.6], [4.4, 0], [4.4, -2.6], [1.8, -2.95], [-1.0, -2.85], [-4.8, -2.6], [-4.8, 0]];
  function* safety() {
    const m = men.safety; let i = 0;
    for (;;) {
      if (S.running) {
        /* the V8 is running: he holds the line on the near side, square to the rear wheels and the rollers, watching them */
        yield* go(m, [1.8, 2.95], yawTo(-1.8, -2.95)); m.lookAt(V(XW, .5, 1.0));
        yield (t => dt => { t += dt; if (t > 2.5) { t = 0; m.lookAt(m.rand() < .6 ? V(XW, .45, .9) : V(-1.2, .8, 0)); } return !S.running; })(0);
        continue;
      }
      const to = PATROL[i % PATROL.length]; i++;
      yield* go(m, to, yawTo(-to[0], -to[1])); m.lookAt(V(0, .8, 0));
      yield sec(1.6 + m.rand() * 2.6);
      if (m.rand() < .18) { m.gesture('thumbs'); yield () => !m.gesturing; }
    }
  }
  const scripts = {safety: new Script(safety), operator: new Script(operator),""")
rep('crew.js', "for (const k of ['operator', 'engine', 'lead', 'tech', 'mechanic', 'driver'])", "for (const k of ['operator', 'engine', 'lead', 'tech', 'mechanic', 'driver', 'safety'])", 2)
rep('crew.js', "seatOperator(); seatDriver();", "seatOperator(); seatDriver(); men.safety.place(-4.8, 2.6, yawTo(4.8, -2.6));")

# ---- the app: the dyno run, the blur, the fading, the frame rate ----
rep('car-app.js', "let exfx=null;", "let exfx=null,wfx=null,occl=null,dynoSpin=0,dynoT=0,autoShifting=false,manualShiftAt=-99,autoGearAt=0,liftFor=0,frameCost=16,fastFrames=false,fastLocked=false;")
rep('car-app.js', "import {buildExhaustFX} from './exhaust-fx.js';", "import {buildExhaustFX} from './exhaust-fx.js';import {buildOcclusion,buildWheelBlur} from './view-fx.js';")
rep('car-app.js', "try{exfx=buildExhaustFX(T,engine,{light:!/Mobi|Android/i.test(navigator.userAgent)});}catch(e){console.warn('Exhaust effects unavailable:',e.message);}",
    "try{exfx=buildExhaustFX(T,engine,{light:!/Mobi|Android/i.test(navigator.userAgent)});}catch(e){console.warn('Exhaust effects unavailable:',e.message);}try{wfx=buildWheelBlur(T,body.wheels);}catch(e){console.warn('Wheel blur unavailable:',e.message);}")
rep('car-app.js', "function rollerSpeed(){",
    """/* v5.85 — THE DYNO RUN YOU CAN SEE. The inspection drive turns everything slowly on purpose, so the parts can be followed;
   with the V8 running and the throttle open, the rear wheels and the rollers also spin up towards the road speed the dials
   show (capped where the eye can still follow it), and the box shifts itself: into first on the throttle, up a gear on the
   limiter, back to neutral after a few seconds off it. A shift by hand in the last twelve seconds always wins. */
function autoShift(g){autoShifting=true;try{shiftTo(g);}finally{autoShifting=false;}}
function dynoStep(dt){if(dt<=0)return;dynoT+=dt;const now=dynoT,manual=now-manualShiftAt<12,top=COCKPIT.gears.length-1,run=drive.running&&!drive.starting&&drive.assembled&&service.phase==='ready';
 if(run&&!manual){if(cabin.gear===0&&throttle>.08&&now-autoGearAt>.6){autoGearAt=now;autoShift(1);toast('Into first — the rear wheels drive the rollers.');}
  else if(cabin.gear>0&&cabin.gear<top&&throttle>.6&&PT.rpm>7000&&now-autoGearAt>1.7){autoGearAt=now;autoShift(cabin.gear+1);}
  liftFor=throttle<.03?liftFor+dt:0;if(cabin.gear>0&&liftFor>2.8&&dynoSpin<4&&now-autoGearAt>1.2){autoGearAt=now;autoShift(0);}}
 const target=run&&PT.path?Math.min(38,(PT.kmhDial||0)/3.6/.33)*(.25+.75*Math.min(1,throttle*1.4)):0;
 dynoSpin+=(target-dynoSpin)*(1-Math.exp(-dt*(target>dynoSpin?.9:.45)));if(dynoSpin<.02&&target===0)dynoSpin=0;}
function rollerSpeed(){""")
rep('car-app.js', "function shiftTo(g){", "function shiftTo(g){if(!autoShifting)manualShiftAt=dynoT;")
rep('car-app.js', "sfx('dog-engage',.7);toast(g?", "sfx('dog-engage',.7);if(!autoShifting)toast(g?")
rep('car-app.js', "if(exfx)exfx.update(dt*(slow?.15:1),{rpm:PT.rpm,throttle,running:drive.running,visible:view!=='cog'});",
    "if(exfx)exfx.update(dt*(slow?.15:1),{rpm:PT.rpm,throttle,running:drive.running,visible:view!=='cog'});dynoStep(dt*(slow?.15:1));if(wfx)wfx.update(dynoSpin*(slow?.15:1));if(!occl&&studioRoot&&camera&&controls){try{occl=buildOcclusion(T,{camera,getTarget:()=>controls.target,roots:crew?[studioRoot,crew.root]:[studioRoot]});}catch(e){occl=false;}}if(occl)occl.update(dt);")
rep('car-app.js', "if(exfx)exfx.update(step,{rpm:PT.rpm,throttle,running:drive.running,visible:view!=='cog'});",
    "if(exfx)exfx.update(step,{rpm:PT.rpm,throttle,running:drive.running,visible:view!=='cog'});dynoStep(step);")
rep('car-app.js', "advanceWheel(wheel,/REAR/.test(wheel.userData.id)?-PT.wheelDelta:0,0,drive.engaged(i));",
    "advanceWheel(wheel,/REAR/.test(wheel.userData.id)?-(PT.wheelDelta+dynoSpin*lastDt*(slow?.15:1)):0,0,drive.engaged(i));")
rep('car-app.js', "wheelOmega:PT.wheel*(slow?.15:1)", "wheelOmega:(PT.wheel+dynoSpin)*(slow?.15:1)")
rep('car-app.js', "wheelSpeed:Math.min(1,PT.wheel/1.7)", "wheelSpeed:Math.min(1,PT.wheel/1.7+dynoSpin/40)")
rep('car-app.js', "const budget=quality==='laptop'?1000/30:1000/60;", "const budget=quality==='laptop'&&!fastFrames?1000/30:1000/60;")
rep('car-app.js', "function frame(now){",
    "/* v5.85 — smoother where it can be: the Laptop rung's 30 fps cap lifts to 60 while a frame costs under 8 ms, and comes back for good if the rate then sags */\n"
    "function frame(now){const t0=performance.now();frameBody(now);const c=performance.now()-t0;if(c>.25){frameCost+=(c-frameCost)*.08;if(!fastLocked)fastFrames=fastFrames?frameCost<13:frameCost<8;if(fastFrames&&fps&&fps<40&&now-lastFrameStart>8000){fastFrames=false;fastLocked=true;}}}\n"
    "function frameBody(now){")
rep('car-app.js', "window.__cw = {get exhaust(){return exfx;},", "window.__cw = {get exhaust(){return exfx;},get dyno(){return {spin:dynoSpin,gear:cabin.gear,fast:fastFrames,faded:occl?occl.fadedCount:0,blur:wfx?wfx.count:0};},")
