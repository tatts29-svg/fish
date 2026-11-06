"""Author: Andrew Fisher. v11.24 - job icons that show what the jobs are.

Andrew, 22 Oct 2026: "Lets make some really good icon symbols for these.. left get rid of the race car lights. And lets do
icons for what they actually are".

On the live v11.23 page the three job icons (a tanker that read as a race car, a sparkle, a drop) become line icons drawn for
the job: Pump out - a holding tank with the liquid being drawn up and out; Clean & restock - a spray bottle; Water checked /
refilled - a tap with a drop; the final lock-up keeps its padlock. The same four icons everywhere they appear: the crew
card's three rings, sticky header, area chips, per-area job list and job buttons, and the page's servicing panel rings and
chips. They are stroked, so the colour rules that filled the old shapes now colour the stroke (fill -> color); nothing else
on the page changes. Footer v11.23 -> v11.24.

    python3 patch_v1124.py page.html      (in place, on the live v11.23 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.23_three_jobs_LIVE')); sys.path.insert(0, str(HERE.parent / 'v11.22_water_tally_LIVE'))
from rep import rep
import patch_v1123 as V23   # the v11.23 icon block and style this release replaces, byte for byte
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V23.E
OLD_PUMP_PATH = 'M3 11h10a3 3 0 0 1 3 3v4H3z'   # the v11.23 tanker that read as a race car

def svg(inner):
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'

ICONS = {
    # a holding tank, open at the top, with the liquid drawn up and out
    'pump': svg('<path d="M3 12.5h18V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M6.5 17c1.8-1.5 3.7-1.5 5.5 0s3.7 1.5 5.5 0" stroke-width="2"/><path d="M12 12.5V3"/><path d="M8.5 6.5 12 3l3.5 3.5"/>'),
    # a spray bottle
    'clean': svg('<path d="M7 10.5h7.5l1.5 2.5v7a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20v-7z"/><path d="M10.5 10.5V7a2.5 2.5 0 0 1 2.5-2.5h3"/><path d="M16 3v3"/><path d="M19.5 3h.01M21.5 6.5h.01M19.5 10h.01" stroke-width="3"/>'),
    # a tap with a drop
    'refill': svg('<path d="M3 9.5h10a4 4 0 0 1 4 4V15"/><path d="M6 9.5V5.5"/><path d="M3.5 5.5h5"/><path d="M14.5 15h5"/><path d="M17 17c-1.3 1.8-2 3-2 3.9a2 2 0 0 0 4 0c0-.9-.7-2.1-2-3.9z" fill="currentColor" stroke="none"/>'),
    # a padlock
    'lockup': svg('<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 15.5v2" stroke-width="2.6"/>'),
}
ICON_JS = '{\n' + ',\n'.join("  %s: '%s'" % (k, v) for k, v in ICONS.items()) + '\n}'
for v in ICONS.values():
    if "'" in v or '\\' in v: raise ValueError('an icon contains a quote or backslash')

# the icons are stroked: the rules that filled the old shapes now colour the stroke
CARD_CSS = V23.CARD_CSS.replace('fill:', 'color:')
PANEL_CSS = V23.PANEL_CSS.replace('fill:', 'color:')
if CARD_CSS.count('color:') - V23.CARD_CSS.count('color:') != 20 or PANEL_CSS.count('color:') - V23.PANEL_CSS.count('color:') != 2: raise ValueError('the v11.23 style has a different number of icon fills than expected')


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.24 requires the live v11.23 page ' + BASE_SHA256)
    if OLD_PUMP_PATH not in text: raise ValueError('the v11.23 icons are not on this page')
    text = rep(text, V23.ICON_JS, ICON_JS, 'panel: job icons', 'page')
    text = rep(text, E(V23.ICON_JS), E(ICON_JS), 'card: job icons', 'page')
    text = rep(text, V23.PANEL_CSS, PANEL_CSS, 'panel: icon colour on the stroke', 'page')
    text = rep(text, E(V23.CARD_CSS), E(CARD_CSS), 'card: icon colour on the stroke', 'page')
    text = rep(text, "+' · v11.23'; /* v8.19 release922", "+' · v11.24'; /* v8.19 release922", 'release footer', 'page')
    if OLD_PUMP_PATH in text: raise ValueError('the old pump icon is still on the page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    if card['html'].count('<script') != 1 or '/*SVC1067_DATA*/null' not in card['html'] or card['html'].count('stroke="currentColor"') != 4 or 'svg{fill:' in card['html']: raise ValueError('the crew card template did not take the icons cleanly')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1124 applied: tank, spray bottle, tap and padlock icons on the card and the panel; footer v11.23 -> v11.24')
