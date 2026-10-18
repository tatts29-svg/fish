#!/usr/bin/env python3
"""Author: Andrew Fisher. Professional welcome, reference and navigation in Text it."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep as checked_rep

target = Path(sys.argv[1])
source = target.read_text()


def rep(text, old, new):
    return checked_rep(text, old, new, 'professional welcome and navigation', str(target), True)
if '/* text779 - welcome and navigation */' in source:
    raise SystemExit('v7.79 already applied')
if 'function sms777Results(' not in source or 'heldFresh775' not in source:
    raise SystemExit('Expected the reviewed v7.77 page with v7.75 included')

source = rep(source,
    "const L = ['Coates GC500: ' + text747What(a)].concat(text747Where(a));",
    "/* text779 - welcome and navigation */\n const L = ['Welcome to Coates GC500', text747What(a)].concat(text747Where(a));")
source = rep(source,
    "return ['GPS: ' + ll.lat.toFixed(6) + ', ' + ll.lon.toFixed(6) + ' (' + src + ')', 'Maps: ' + navUrl(ll)];",
    "return ['GPS: ' + ll.lat.toFixed(6) + ', ' + ll.lon.toFixed(6) + ' (' + src + ')', 'Navigate: ' + navUrl(ll)];")
source = rep(source,
    "'LOCATION CHANGED - the spot needs checking. Ring before you leave.'\n : 'GPS: none recorded yet - ring for the exact spot before you leave.'",
    "'Location changed. Please confirm the new location before departure.'\n : 'Location not yet confirmed. Please contact the site team before departure.'")
source = rep(source,
    "'Way in: off the Gold Coast Hwy at the paddock ramps into the pit lane, then up the lane (north-west).'",
    "'Site access: Gold Coast Hwy via paddock ramps; follow pit lane north-west.'")
source = rep(source,
    "'Way in: off the Gold Coast Hwy into the pit lane at its north-west end, then down it the way the race cars go.'",
    "'Site access: Gold Coast Hwy > north-west pit lane entry; follow race direction.'")
source = rep(source, "return 'Way in: turn in at ' + e.lat.toFixed(6)",
    "return 'Site access: turn in at ' + e.lat.toFixed(6)")
source = rep(source, "link ? 'Pictures: ' + link : ''", "link ? 'Delivery details: ' + link : ''")
source = rep(source,
    "'Goes from this service through ClickSend: what it is, the GPS, a Maps link and the way in' + (canPic ? ', and a picture of the map with the spot marked' : '') + '. The link opens the card with the pictures.'",
    "'A welcome to Coates GC500 with the reference, equipment and recorded location. Check the navigation and site access details before sending.' + (canPic ? ' Include the marked map picture below.' : '')")
source = rep(source, '<label for="smTx">The message</label>', '<label for="smTx">Message preview</label>')
source = rep(source, '<label>The picture of where it goes</label>', '<label>Map and reference</label>')
source = rep(source, 'Send the picture too — as a picture message (MMS). It costs more than a text.',
    'Include the map picture (MMS). Picture messages cost more than plain texts.')

target.write_text(source)
print('v7.79: welcome, reference, clear navigation and site access; map and delivery safeguards retained')
