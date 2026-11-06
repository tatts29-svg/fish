#!/usr/bin/env python3
"""The Coates Way machine v5.84 — fire, heat, the real sound, and a phone layout that shows the car (Andrew Fisher,
26 Sep 2026: "check for bugs, and revisit and improve everything in the machine. We need to up the ante. Push your limits").

  * exhaust-fx.js (new): flames out of both side exits on a lift from high revs and a crackle on the limiter; headers that
    glow as they are worked. Wired into the frame loop; hidden in the cockpit view.
  * The approved 34-clip ElevenLabs sound pack is in dist/assets/audio/ at last (the links had lapsed before it was ever
    fetched, so the page had been on the synthesised stand-in); SampleBank loads it on Sound on as designed.
  * Phone (≤ 800 px): the 3D view ends above the drive dock instead of running under it — the dock covered the lower
    40 % of the car — and the studio is taller to pay for it; the rpm and cog-ratio readouts sit above the dock, not across
    the middle of the scene. Any width: the readouts leave the cockpit view, where the dash has its own instruments and the
    readout sat over the driver's hand.
Applied once to handover_machine/print/machine/dist."""
import os, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'handover_machine/print/machine/dist')

def rep(path, old, new, count=1):
    p = os.path.join(D, path); s = open(p, encoding='utf-8').read()
    n = s.count(old)
    if n != count: sys.exit(f'{path}: expected {count} of {old[:70]!r}, found {n}')
    open(p, 'w', encoding='utf-8').write(s.replace(old, new)); print('ok', path, old[:50].replace('\n', ' '))

rep('car-app.js', "import {buildCrew} from './crew.js';",
    "import {buildCrew} from './crew.js';\nimport {buildExhaustFX} from './exhaust-fx.js';let exfx=null;   /* v5.84 — fire and heat */")
rep('car-app.js', "engine=buildPowertrain(T,materials);fitCarMechanics(T,body,engine);",
    "engine=buildPowertrain(T,materials);fitCarMechanics(T,body,engine);try{exfx=buildExhaustFX(T,engine,{light:!/Mobi|Android/i.test(navigator.userAgent)});}catch(e){console.warn('Exhaust effects unavailable:',e.message);}")
rep('car-app.js', "service.update(dt*(slow?.15:1));powertrain();if(crew)crew.update(",
    "service.update(dt*(slow?.15:1));powertrain();if(exfx)exfx.update(dt*(slow?.15:1),{rpm:PT.rpm,throttle,running:drive.running,visible:view!=='cog'});if(crew)crew.update(")
rep('car-app.js', "service.update(step);powertrain();if(crew)crew.update(",
    "service.update(step);powertrain();if(exfx)exfx.update(step,{rpm:PT.rpm,throttle,running:drive.running,visible:view!=='cog'});if(crew)crew.update(")
rep('car-app.js', "window.__cw = {get crew(){return crew;},",
    "window.__cw = {get exhaust(){return exfx;},get crew(){return crew;},")

css = open(os.path.join(D, 'car.css'), encoding='utf-8').read()
if 'v5.84' not in css:
    css += """
/* v5.84 — on a phone the view ends above the dock instead of under it (the dock covered the lower 40 % of the car), the studio
   is taller to pay for it, and the readouts sit just above the dock rather than across the middle of the scene. In the cockpit
   the readouts go: the dash has its own instruments, and the readout sat over the driver's hand. */
@media(max-width:800px){
 .studio{height:min(88dvh,780px);min-height:600px;max-height:none}
 #viewport{bottom:196px}
 .telemetry{top:auto;bottom:200px;right:14px;gap:16px}
 .telemetry b{font-size:1rem}
 #toast,#exhibit{bottom:204px}
}
body:has([data-view="cog"].active) .telemetry{display:none}
"""
    open(os.path.join(D, 'car.css'), 'w', encoding='utf-8').write(css); print('ok car.css')
