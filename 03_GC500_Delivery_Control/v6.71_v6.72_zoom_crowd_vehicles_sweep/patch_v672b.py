#!/usr/bin/env python3
"""v6.72b - the sweep's fixes (26 Sep 2026: "deep look into any bugs, any load issues, any scroll issues, any navigation issues").
  * Closing a record's drawer or the showcase nudged the page 10-16 px: focus went back to the button that opened it with
    the browser's scroll-into-view, which on a page with a sticky header always moves. Focus goes back without scrolling.
  * A link with a hash that is not a page (#nothing-here) opened Today but kept the wrong hash in the address bar, so a
    reload or a share carried it on. It is replaced with #today.
  * On a small phone (360 px) four things ran past the edge of the screen: the working table under "Show the working",
    a long item code in the day's outstanding list, the branch-code buttons on Plant and the delivery card's footer line.
    The table scrolls inside its own box, the long code wraps, the buttons wrap and the footer line wraps.
  python3 patch_v672b.py <page.html> [builder.py]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep
CSS = """
/* v6.72 - nothing runs past the edge of a small phone */
.cwork{max-width:100%;overflow-x:auto}
.ogrid .ano,.oday li{overflow-wrap:anywhere} .ano.misc{white-space:normal}
.row2>*{min-width:0} .row2 .btn,.row2 button{white-space:normal;max-width:100%}
@media (max-width:760px){ .dcfl{white-space:normal;letter-spacing:.06em;min-width:0} }
"""
def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, "if (rt && rt.focus && document.contains(rt)) try { rt.focus(); } catch (e) {} };",
               "if (rt && rt.focus && document.contains(rt)) try { rt.focus({preventScroll: true}); } catch (e) {} };   /* v6.72 - no nudge on close */", 'drawer focus', path, need)
    A = "if (r && r.focus && document.contains(r)) try { r.focus(); } catch (e) {}"
    if need and t.count(A) < 1: sys.exit('show focus')
    t = t.replace(A, "if (r && r.focus && document.contains(r)) try { r.focus({preventScroll: true}); } catch (e) {}   /* v6.72 - no nudge on close */")
    t = rep(t, "else go(h && TABS.some(([k]) => k === h) ? h : 'today');",
               "else { const ok = h && TABS.some(([k]) => k === h); go(ok ? h : 'today'); if (h && !ok) { try { history.replaceState(history.state, '', '#today'); } catch (e) {} } }   /* v6.72 - an unknown page's hash is not kept */", 'unknown hash', path, need)
    t = rep(t, ".row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}", ".row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}" + CSS, 'css', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
patch(sys.argv[1], True)
if len(sys.argv) > 2: patch(sys.argv[2], False)
