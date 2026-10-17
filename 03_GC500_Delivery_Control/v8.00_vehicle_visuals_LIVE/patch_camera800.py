#!/usr/bin/env python3
"""Author: Andrew Fisher. Fit the existing selected-vehicle detail camera rigs."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARKER = '<!-- Selected vehicle camera fitting v8.00 -->'


def apply(text, path='Showcase HTML'):
    if MARKER in text or 'G.vehicleCamera800=' in text:
        raise SystemExit('v8.00 selected vehicle cameras already applied')
    for required in ('G.camera794=', 'G.plantVisuals800=true;', 'uSurface800'):
        if required not in text:
            raise SystemExit('v8.00 selected vehicle cameras require the complete visual component chain')
    for name, rig in [
        ('detail', '{eye:behind(2.50,.72,side*1.9),tgt:[car[0],car[1]+.27*Sx,car[2]],fov:30}'),
        ('frontdetail', '{eye:behind(-2.70,.70,side*1.8),tgt:[car[0],car[1]+.27*Sx,car[2]],fov:32}'),
    ]:
        text = rep(text, 'return '+rig+';',
                   "return G.fitDetailCamera800?G.fitDetailCamera800(S,'"+name+"',"+rig+'):'+rig+';',
                   'Selected vehicle camera '+name, path)
    source = (HERE / 'camera800_src.js').read_text().rstrip('\n')
    text = rep(text,
               "if(S.towVms&&S.towKind==='loo'&&S.loo&&S.loo.ph!=='shut'&&S.trailer&&G.looShot)",
               "if(!/^(detail|frontdetail)$/.test(S.view||S.forceShot||'')&&S.towVms&&S.towKind==='loo'&&S.loo&&S.loo.ph!=='shut'&&S.trailer&&G.looShot)",
               'Respect selected full-combination detail view during portaloo animation', path)
    # An embedded print template also contains a body/html terminator. Only the
    # verified page suffix is the host extension point.
    tail = '</body></html>'
    if not text.rstrip().endswith(tail):
        raise SystemExit('v8.00 selected vehicle cameras require the host page terminator')
    at = text.rfind(tail)
    return text[:at]+MARKER+'\n<script>\n'+source+'\n</script>\n'+text[at:]


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text(), str(page)))
    print('v8.00 selected vehicle camera fitting applied')
