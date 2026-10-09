#!/usr/bin/env python3
"""Author: Andrew Fisher. Restore the pre-overhaul Showcase cameras only.

Component patch: retain the input release tag so the final integration owns it.
The original v8.01 camera implementation already remains below the two overlays.
"""
from pathlib import Path
import hashlib
import sys

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
sys.path.insert(0, str(PROJECT / 'toolchain'))
from rep import rep

MARKER = '<!-- Previous Showcase cameras restored v8.11 -->'
DEPENDENCIES = {
    'v7.94_showcase_lap_cameras_LIVE/camera794_src.js':
        'a41dc01d0281caa0e5813f93d789c804a5e3accec0ca090d23fa945ca6589c85',
    'v8.00_vehicle_visuals_LIVE/camera800_src.js':
        '34c657399b172e01047e3c9f7a8a10af7b9789504c13f0335b6d5ca3a00d4428',
}

DEFAULT_OVERRIDE = """/* Keep an explicitly selected camera. First-time viewers get the complete-lap director. */
showViewGet=function(){
 try{const v=localStorage.getItem(VIEW_KEY);return v&&G.VIEWS.some(x=>x[0]===v)?v:'tour';}
 catch(e){return 'tour';}
};
"""
CHOICE_OVERRIDE = """ const select=byId('showView');
 if(select&&!select.querySelector('option[value="tour"]')){
  if(!select.options.length)showViewFill();
  else{const option=document.createElement('option');option.value='tour';option.textContent='Circuit tour';select.prepend(option);}
  select.value=showViewGet();
 }
 const auto=select&&select.querySelector('option[value="auto"]');if(auto)auto.textContent='Auto — circuit cameras';
"""


def frozen(name):
    raw = (PROJECT / name).read_bytes()
    if hashlib.sha256(raw).hexdigest() != DEPENDENCIES[name]:
        raise SystemExit('v8.11 frozen camera dependency changed: ' + name)
    return raw.decode().rstrip('\n')


def replace_exact(text, old, new, label, path):
    if text.count(old) != 1:
        raise SystemExit('v8.11 exact camera anchor missing/ambiguous: ' + label)
    # The shared helper validates its whitespace-tolerant unique match. Use the
    # already verified literal span so a trailing newline cannot consume the
    # indentation of the following retained component.
    rep(text, old, new, label, path)
    return text.replace(old, new, 1)


def apply(text, path='GC500 page'):
    if MARKER in text:
        raise SystemExit('v8.11 camera restore already applied')
    for anchor in ('G.photoRefinement792=', 'G.raceCarVisual800=',
                   'G.plantVisuals800=true;', 'G.playback794=',
                   'G.corridorReport794=', 'uSurface800', 'G.selectSamples802='):
        if anchor not in text:
            raise SystemExit('v8.11 requires the reviewed current visuals: ' + anchor)
    text = replace_exact(text, frozen(next(iter(DEPENDENCIES))), '',
                         'Remove the v7.94 camera override only', path)
    fitting = ('<!-- Selected vehicle camera fitting v8.00 -->\n<script>\n' +
               frozen('v8.00_vehicle_visuals_LIVE/camera800_src.js') + '\n</script>\n')
    text = replace_exact(text, fitting, '', 'Remove v8.00 camera fitting only', path)
    for name, rig, spacing in [
        ('detail', '{eye:behind(2.50,.72,side*1.9),tgt:[car[0],car[1]+.27*Sx,car[2]],fov:30}', ' '),
        ('frontdetail', '{eye:behind(-2.70,.70,side*1.8),tgt:[car[0],car[1]+.27*Sx,car[2]],fov:32}', ''),
    ]:
        old = " case '"+name+"':return G.fitDetailCamera800?G.fitDetailCamera800(S,'"+name+"',"+rig+'):'+rig+';'
        new = " case '"+name+"':"+spacing+'return '+rig+';'
        text = replace_exact(text, old, new, 'Restore original '+name+' rig', path)
    text = replace_exact(text,
        "if(!/^(detail|frontdetail)$/.test(S.view||S.forceShot||'')&&S.towVms&&S.towKind==='loo'&&S.loo&&S.loo.ph!=='shut'&&S.trailer&&G.looShot)",
        " if(S.towVms&&S.towKind==='loo'&&S.loo&&S.loo.ph!=='shut'&&S.trailer&&G.looShot)",
        'Restore original open-portaloo camera priority', path)
    text = replace_exact(text, DEFAULT_OVERRIDE, '', 'Restore original remembered/default view', path)
    text = replace_exact(text, CHOICE_OVERRIDE, '', 'Restore original nine camera choices and labels', path)
    if not text.rstrip().endswith('</body></html>'):
        raise SystemExit('v8.11 host page suffix changed')
    at = text.rfind('</body></html>')
    return text[:at] + MARKER + '\n' + text[at:]


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text(), str(page)))
    print('v8.11 previous Showcase cameras restored; input release tag retained')
