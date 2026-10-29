"""Author: Andrew Fisher. v12.56 - the four fixes Andrew asked for on the evening of 29 Oct 2026, on top of v12.55.

Chained: build.sh applies patch_v1255.py (guarded to the exact live v12.59) and then this patch, which requires the
v12.55 footer and the covered-labour module to be present and refuses to apply twice. No money moves here.

 1. Servicing tracker: the "Previous nights" strip shows Fri 23, Sat 24 and Sun 25 only. The practice nights (Tue 20,
    Wed 21, Thu 22, tagged practice in the tracker's days) stay on the record and come off the strip.
    Andrew: "i asked i only want friday. saturday. sunday".
 2. VMS removals, Fence closures and Edit set aside (off the tab row, the Tools views and the menu; a link that still
    asks for one lands on Today and says so, as the other set-aside pages do). Edit comes off for the editing link
    too. Andrew: "Can we remove vms removals and fencing closures tabs"; "Can we remove the edit tab".
 3. Today, By group: where no completion was recorded for a type (furniture, track mats, fork extensions - nothing to
    install, or nothing the type instruments track), what is on site counts as completed. A partly recorded type keeps
    its recorded count. Andrew: "this is still not fixed" (Forklifts 11 of 12, Furniture 0 of 6, Track mat - of 30).
 4. Map explorer: the collection rings are off until "Show what has left" is ticked in the Map tools bar; a key on the
    map then says what the rings mean. Andrew: "this looks like a mess. What do these mean".
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

FOOT_A = "+' · v12.55'; /* v8.19 release922"
FOOT_B = "+' · v12.56'; /* v8.19 release922"

REPLACEMENTS = [
    ('tracker: practice nights off the strip',
     "var past1160 = operational1160 ? D.days.filter(function(d){return d.id < cur;}) : [];",
     "var past1160 = operational1160 ? D.days.filter(function(d){return d.id < cur && !d.practice && !/^Practice\\b/i.test(String(d.label || ''));}) : []; /* v12.56: the practice nights stay on the record and off the strip (Andrew, 29 Oct 2026: \"i only want friday. saturday. sunday\") */"),
    ('tabs: VMS removals and Fence closures set aside',
     "const TABS_OFF = new Set(['variances', 'journal', 'add', 'breakdowns', 'register', 'edit', 'progress', 'nights', 'change']);",
     "const TABS_OFF = new Set(['variances', 'journal', 'add', 'breakdowns', 'register', 'edit', 'progress', 'nights', 'change', 'vmsoff', 'fenceclose']); /* v12.56 - VMS removals and Fence closures set aside; Edit set aside for everyone (Andrew, 29 Oct 2026) */"),
    ('tabs: Edit off for the editing link too',
     "const editOk = k => k === 'edit' && typeof canEdit === 'function' && canEdit(); /* v5.99 */",
     "const editOk = k => false; /* v12.56 - Edit is set aside for everyone (Andrew, 29 Oct 2026: \"Can we remove the edit tab\"); v5.99 kept it open to an editing link */"),
    ('tabs: a link to a set-aside page lands on Today',
     "if (TABS_OFF.has(tab) && !(tab === 'edit' && typeof canEdit === 'function' && canEdit())) {",
     "if (TABS_OFF.has(tab)) { /* v12.56 - Edit included */"),
    ('Today By group: on site counts where no completion was recorded',
     "   x.asked += v; x.on += r.onBy.get(t)||0; x.known = x.known && reading?.done != null && reading.quantity != null && !reading.conflict; x.done += reading?.done||0;",
     "   const on1256 = r.onBy.get(t)||0, silent1256 = !reading || reading.done == null || reading.done === 0; /* v12.56: where no completion was recorded for a type (nothing to install, or nothing the instruments track), what is on site counts as completed; a partly recorded type keeps its count (Andrew, 29 Oct 2026: \"it should be 100%\") */\n   x.asked += v; x.on += on1256; x.known = x.known && (silent1256 || (reading.quantity != null && !reading.conflict)); x.done += silent1256 ? Math.min(on1256, v) : (reading.done||0);"),
    ('map: rings only when asked for',
     "const left=ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected);",
     "const left=window.GC500MapLeft1256?.state.showLeft?ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected):[]; /* v12.56: off until \"Show what has left\" is ticked */"),
    ('map: keep the choice on a redraw',
     "if(bar&&bar.parentNode===wrap.parentNode)return;if(bar)bar.remove();",
     "if(bar&&bar.parentNode===wrap.parentNode){win.GC500MapLeft1256?.controls();return;}if(bar)bar.remove();"),
    ('map: mount the choice in the bar',
     "wrap.before(bar);if(typeof W.expSize==='function')W.expSize();",
     "wrap.before(bar);win.GC500MapLeft1256?.controls();if(typeof W.expSize==='function')W.expSize();"),
]


def patch(text, path='page'):
    if FOOT_B in text or 'GC500MapLeft1256' in text:
        raise ValueError('v12.56 already applied')
    if FOOT_A not in text or 'CoveredLabour1255' not in text:
        raise ValueError('v12.56 is built on v12.55: apply patch_v1255.py first')
    styles = re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)
    for label, old, new in REPLACEMENTS:
        if text.count(old) != 1:
            raise ValueError(label + ': expected one exact occurrence, found %d' % text.count(old))
        text = text.replace(old, rep(old, old, new, label, path), 1)
    module = (ROOT / 'map_left1256.js').read_text(encoding='utf-8').rstrip()
    css = (ROOT / 'map_left1256.css').read_text(encoding='utf-8').rstrip()
    old = "  vmsIcons1211();"
    if text.count(old) != 1:
        raise ValueError('map: the explorer start-up call is expected once')
    text = text.replace(old, old + "\n" + module + "\n  mapLeftFrame1256();", 1)
    old = '<script id="mapunits1147-script">'
    if text.count(old) != 1:
        raise ValueError('map: the map units script tag is expected once')
    text = text.replace(old, '<style id="map1256-style">\n' + css + '\n</style>\n' + old, 1)
    if text.count(FOOT_A) != 1:
        raise ValueError('release footer: expected once')
    text = text.replace(FOOT_A, FOOT_B, 1)
    after = re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)
    added = [s for s in after if 'id="map1256-style"' in s]
    if len(added) != 1 or [s for s in after if s not in added] != styles:
        raise ValueError('existing styles changed')
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(encoding='utf-8'), str(page)), encoding='utf-8')
    print('patch_v1256 applied: tracker nights, three tabs set aside, By group on-site rule, map rings on request')
