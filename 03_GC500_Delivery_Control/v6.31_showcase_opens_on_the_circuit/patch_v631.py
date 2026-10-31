#!/usr/bin/env python3
"""v6.31 - THE SHOWCASE OPENS ON THE CIRCUIT, WITH THE CAR (Andrew Fisher, 26 Sep 2026: "where is the showcase gone with my
day and night / where is my race car gone from showcase").

Nothing had gone: the showcase, its day and night circuit and the #26 car are all on the page, behind "Start showcase" on
Where we are, with the Backdrop chooser inside it. What a fresh browser got was the BLACK backdrop, which has no circuit
and no car, and the chooser sits in the control bar under the scene, which is not where anybody looks for a car. Two
changes:

  1. A device that has never chosen a backdrop opens the showcase on THE CIRCUIT IN 3D, NIGHT (the car on the track) when
     the scene can run; Black stays for a page that cannot run it and for anyone who chose Black. Day is one pick away as it
     always was, and a choice made on a device is still kept on that device.
  2. "Start showcase" is in the Tools menu too, under This page, so it is reachable from every tab and not only from
     Where we are.

  python3 patch_v631.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

OLD_PREF = """  } catch (e) {}
  return 'black';
}
function showSetBack(v){"""
NEW_PREF = """  } catch (e) {}
  /* v6.31 - never chosen on this device: the circuit at night with the car, when the scene can run (Andrew Fisher,
     26 Sep 2026). Black stays for a page without the scene, and for anyone who chose it. */
  return show3dAvailable() ? 'circuit3d' : 'black';
}
function showSetBack(v){"""

OLD_MENU = """       <div class="mmsec">This page</div>
       <button class="btn" role="menuitem" id="motionBtn" aria-pressed="false">Motion: Subtle</button>"""
NEW_MENU = """       <div class="mmsec">This page</div>
       <button class="btn" role="menuitem" id="showcaseBtn" title="the job on a screen, for a room — the circuit in 3D, day or night, with the #26; it changes nothing">Start showcase</button>
       <button class="btn" role="menuitem" id="motionBtn" aria-pressed="false">Motion: Subtle</button>"""

OLD_WIRE = """$('#motionBtn').onclick = () => motionToggle();"""
NEW_WIRE = """$('#motionBtn').onclick = () => motionToggle();
/* v6.31 - the showcase from the Tools menu, on every tab */
if ($('#showcaseBtn')) $('#showcaseBtn').onclick = () => { moreClose(); showOpen(); };"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_PREF, NEW_PREF, 'default backdrop')
    t = rep(t, OLD_MENU, NEW_MENU, 'tools menu')
    t = rep(t, OLD_WIRE, NEW_WIRE, 'wire')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
