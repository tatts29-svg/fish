#!/usr/bin/env python3
"""v6.33 - THE SHOWCASE SAYS WHY IT IS STILL, AND OFFERS THE SWITCH (Andrew Fisher, 26 Sep 2026: "It use to work. On
phones fine").

Nothing in the page turns motion off by itself: the only two ways are the phone's own reduced-motion setting and the
Motion button under Tools, which one mis-tap in a menu can flip and which then stays flipped in that browser. Either way
the showcase used to say just "Reduced motion" and offer nothing, and Tools is out of reach while the showcase is open.
Now the footer line names the cause in plain words, and when it is the page's own switch a button right there turns
motion back on and runs the lap. When it is the phone's setting the line says where that lives; the page keeps honouring
it.

  python3 patch_v633.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

OLD_MARK = """      <p class="shstate" id="showState"></p>"""
NEW_MARK = """      <p class="shstate" id="showState"></p>
      <button class="shbtn shmotion" id="showMotionOn" hidden title="Motion is off under Tools on this device; this turns it on and runs the lap">Turn motion on · run the lap</button>"""

OLD_STATE = """  if (st) st.textContent = SHOW.reduced ? 'Reduced motion · manual scenes · the circuit holds a still frame · countdown still running'"""
NEW_STATE = """  /* v6.33 - the cause in words, and the switch when it is ours (Andrew Fisher, 26 Sep 2026) */
  const ownOff = motionPref() === 'off';
  const mo = $('#showMotionOn'); if (mo) mo.hidden = !(SHOW.reduced && ownOff);
  if (st) st.textContent = SHOW.reduced ? (ownOff ? 'Motion is off — the Motion button under Tools on this device'
                                                  : 'This device asks for reduced motion — its own accessibility setting (Reduce Motion / Remove animations)')
                                          + ' · manual scenes · the circuit holds a still frame · countdown still running'"""

OLD_WIRE = """  on('machineClose', () => machineClose());"""
NEW_WIRE = """  on('machineClose', () => machineClose());
  /* v6.33 - motion back on from inside the showcase, and the lap runs at once because that is what was asked */
  on('showMotionOn', () => { if (motionPref() === 'off') motionToggle(); const p = $('#showPause'); if (p && !p.disabled && !SHOW.playing) p.click(); });"""

OLD_CSS = """.shstate{margin:0;font-size:12px;color:#adb9ae}"""
NEW_CSS = """.shstate{margin:0;font-size:12px;color:#adb9ae}
.shbtn.shmotion{margin-top:8px;border-color:var(--orange);background:#7c310a;color:#fff}"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_MARK, NEW_MARK, 'markup')
    t = rep(t, OLD_STATE, NEW_STATE, 'state line')
    t = rep(t, OLD_WIRE, NEW_WIRE, 'wire')
    t = rep(t, OLD_CSS, NEW_CSS, 'css')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
