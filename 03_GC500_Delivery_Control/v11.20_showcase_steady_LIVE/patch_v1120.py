"""Author: Andrew Fisher. v11.20 - the Showcase opens at once and builds the 3D circuit within the device's means.

Andrew, 22 Oct 2026: "can we look at the showcase. this still freezes up a lot". Measured on the live v11.19 page: the 3D
backdrop's build ran inside showOpen() for 3.2 s on this machine unthrottled (15.8 s at 4x CPU) before the dialog could
paint, then three more blocks for the static detail; 497 MB of heap against 98 MB on the flat circuit. The scenes cost
0.1-0.25 s each. On the live v11.19 page:

- steady1120.js (one module, appended before the page's last </body>): the first 3D mount of an opening is deferred past the
  dialog's paint; the base mount is timed and, over a 1.5 s budget, the static detail stages are skipped on that device
  through the scene's own limited-by-device path;
- the v11.10 warm loop paces one scene per 400 ms (was 40 ms), first at 1.5 s (was 250 ms);
- the never-chosen backdrop stays the 3D circuit at night on every device (Andrew, 22 Oct: "I want the 3d race track as default");
- footer v11.19 -> v11.20.

    python3 patch_v1120.py page.html      (in place, on the live v11.19 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = 'a7460b9e7d4f9180fdbbaf7fbc31610367fde437060664404314f7a07e37b23c'


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.20 requires the live v11.19 page ' + BASE_SHA256)
    js = (HERE / 'steady1120.js').read_text(encoding='utf-8')
    if 'ShowcaseSteady1120' in text: raise ValueError('the page already carries ShowcaseSteady1120')
    # the warm loop's pace (the v11.10 module)
    text = rep(text, 'warmTimer=setTimeout(warm,40);', 'warmTimer=setTimeout(warm,400);', 'warm loop pace', 'page')
    text = rep(text, 'function scheduleWarm(){if(warmTimer)clearTimeout(warmTimer);warmTimer=setTimeout(warm,250);}', 'function scheduleWarm(){if(warmTimer)clearTimeout(warmTimer);warmTimer=setTimeout(warm,1500);}', 'first warm', 'page')
    # the never-chosen default stays the 3D circuit at night on every device (Andrew, 22 Oct 2026: "I want the 3d race track as default")
    # the module, before the page's last </body>
    k = text.rfind('</body>')
    if k < 0: raise ValueError('no </body>')
    text = text[:k] + '<script>\n' + js + '</script>\n' + text[k:]
    text = rep(text, "+' · v11.19'; /* v8.19 release922", "+' · v11.20'; /* v8.19 release922", 'release footer', 'page')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1120 applied: steady1120 module, warm pace 400 ms, footer v11.19 -> v11.20')
