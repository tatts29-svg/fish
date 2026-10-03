#!/usr/bin/env python3
r"""v8.19 - meet points, site rules and the Event Portables load plan. Author: Andrew Fisher.

Andrew, 3 Oct 2026 (Claude chat), on the meet points: "This goes for all gear and equipment ... If we unsure they refer
back to entry pitlane" - "this now should be info for everything now"; on the island west parkland: "no one enter park.
Ensure spotters. Wild life. Extemly low branches. There is not much room hense sptters and excort is a must"; on Event
Portables: "We go by whats on the quote at the moment" - "deliries for next week we move to the 9th oct" - "The loads
that come in. Will have a run sheet where they go" - "I want qr codes done with direction to get to where they need to
go" - "We allocate everything to a WC number. Then at the end quote is this many. And we mention no WC allocation for
these" - "Nothing is to be picked up unless emptied" - "They can take early we can store in pit regardless".

What the patch does (DRAFT - not uploaded):
  1. writes the ten meet points (meet_points.json) and the load plan (event_portables_plan.json) into the page as data,
     after checking them: no money, no phone numbers, 5 loads of 24 = 120 FWF, every count down reaches 0, every
     directions link is the meet point at 6 decimals;
  2. meetPoint819(): the assignment rule, the same as the reference the supplier sheets were made with (mp819_src.js);
  3. the reference drawer: "Meet point: <name>", a QR for Google Maps driving directions to it, and the parkland box
     where it applies - under Where it is;
  4. the driver sheet (GC500-DRV-01): a Meet point section per load - each meet point with its QR - and the site rules;
  5. the Timeline: the Event Portables load plan card under the day - site rules (the one place on the page), the demob
     notice, the 5 loads with their stops and a Print run sheet each (one A4 page), Quote Q6845 against WC allocation
     with No WC allocation in Coates orange, and the cancelled list (ep819_src.js, v819.css);
  6. the footer and the release marker read v8.19.
Codex's Demob register, two-location cap, crane rules and equipment register are not touched.

    python3 patch_v819.py <page.html>     (built on live f3bb490b - the v8.18 selected-day weather release, which has not been on the board)"""
import json, os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, '..', 'toolchain'))
from rep import rep  # noqa: E402
MPDIR = os.path.join(here, '..', 'meet_points_03Oct2026')

p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function meetPoint819(' in t: sys.exit('v8.19 meet points already applied')
if 'const WX818 = ' not in t: sys.exit('v8.19 builds on the live weather release (v8.18, WX818, f3bb490b)')
for need in ('function drawer816(', 'function zone816(', 'function wayIn816(', 'function dest782(', 'function dpPage(', 'function qrSvg(', 'function navUrl(', 'function renderTimeline_held('):
    if need not in t: sys.exit('v8.19 needs ' + need + ' (live from v8.16)')

MP = json.load(open(os.path.join(MPDIR, 'meet_points.json'), encoding='utf-8'))
EP = json.load(open(os.path.join(MPDIR, 'event_portables_plan.json'), encoding='utf-8'))

# ---- the meet points. Names and ways in are the ones on the 3 Oct supplier sheets (delivery plan v8, "Directions to the
# meet points"); side and zone are the page's own zone816 for the WC pins that define each point (the reference table).
NAME = {'ISLAND_NORTH': 'Island north – by FREIGHT', 'ISLAND_WEST_PARK': 'Island west parkland entry – by the merch strip',
        'MEDIAN_PITSTOP': 'Median strip meet-up – pit stop, by FOAM', 'PITLANE': 'Pit lane entry',
        'COMMODORE': 'Commodore Park drop point (red dot)', 'HELEN_PARK': 'Helen Park drop point (red dot)',
        'HILL_A47': 'The Hill – entry point A47', 'MBP_LANDSIDE': 'Main Beach Pde land side – by T8 / A19',
        'SEASIDE_NORTH': 'Seaside north – between S21 and S22', 'MAIN_BEACH': 'Main Beach seaside – by the supply compound'}
SIDE = {'COMMODORE': ('gate2', 'outside', None), 'HILL_A47': ('mbp', 'outside', False), 'HELEN_PARK': ('gate1', 'outside', None),
        'MAIN_BEACH': ('mbp', 'outside', True), 'MBP_LANDSIDE': ('mbp', 'outside', False), 'SEASIDE_NORTH': ('mbp', 'outside', True),
        'ISLAND_WEST_PARK': ('island', 'inside', None), 'MEDIAN_PITSTOP': ('island', 'inside', None), 'ISLAND_NORTH': ('island', 'inside', None)}
WAY = {'ISLAND_WEST_PARK': 'Pit lane, in from GC Hwy (NW end)', 'ISLAND_NORTH': 'Macintosh Island area – in via the pit lane',
       'MBP_LANDSIDE': 'Land side – in from the Surfers end of Main Beach Pde, drive north (race direction)',
       'SEASIDE_NORTH': 'Seaside – in at the Seaworld Dr roundabout end of Main Beach Pde, drive south'}
pts = []
for q in MP['points']:
    z, s, sea = SIDE[q['id']]
    pt = {'id': q['id'], 'name': NAME[q['id']], 'll': [round(q['ll'][0], 6), round(q['ll'][1], 6)],
          'way': WAY.get(q['id']) or q['way_in'].replace(' - ', ' – '), 'zone': z, 'side': s, 'sea': sea}
    if q.get('area_polygon'): pt['poly'] = [[round(a, 6), round(b, 6)] for a, b in q['area_polygon']]; pt['area'] = 'island west parkland'
    pts.append(pt)
d = MP['default']
MP819 = {'def': {'id': 'PITLANE', 'name': NAME['PITLANE'], 'll': [round(d['ll'][0], 6), round(d['ll'][1], 6)], 'way': 'Pit lane, in from GC Hwy (NW end)', 'zone': 'island', 'side': 'inside', 'sea': None},
         'points': pts, 'park': 'ISLAND_WEST_PARK'}
assert len(pts) == 9 and len(pts) + 1 == 10, 'ten meet points: nine plus the pit lane default'
ALLP = {x['id']: x for x in pts + [MP819['def']]}

# ---- the load plan, checked before it goes in
def url(ll): return 'https://www.google.com/maps/dir/?api=1&destination=%.6f,%.6f&travelmode=driving' % (ll[0], ll[1])
loads = []
for L in EP['loads']:
    left = L['fwf']; stops = []
    for s in L['stops']:
        P = ALLP[s['meet_point_id']]
        assert s['ll'] == P['ll'] or [round(v, 6) for v in s['ll']] == P['ll'], ('stop not at its meet point', L['n'], s['stop'])
        assert s['directions_url'] == url(P['ll']), ('directions link is not the meet point', L['n'], s['stop'])
        assert s['meet_point_name'] == P['name'], ('meet point name differs from the supplier sheet', s['meet_point_name'], P['name'])
        assert s['way_in'] == P['way'], ('way in differs', s['way_in'], P['way'])
        assert s['fwf'] == sum(x['fwf'] for x in s['drops']), ('stop count', L['n'], s['stop'])
        left -= s['fwf']; assert s['left_on_truck'] == left, ('count down', L['n'], s['stop'])
        stops.append({'stop': s['stop'], 'meet_point_id': s['meet_point_id'], 'meet_point_name': s['meet_point_name'], 'll': P['ll'],
                      'directions_url': s['directions_url'], 'way_in': s['way_in'], 'fwf': s['fwf'], 'left_on_truck': s['left_on_truck'],
                      'drops': [{k: x[k] for k in ('ref', 'name', 'fwf', 'pee_panels', 'no_pin', 'no_wc_number', 'planned_date') if k in x} for x in s['drops']]})
    assert left == 0, ('load does not empty', L['n'])
    assert L.get('pee_panels', 0) == sum(x.get('pee_panels', 0) for s in L['stops'] for x in s['drops'])
    loads.append({'n': L['n'], 'date': L['date'], 'zone': L['zone'], 'fwf': L['fwf'], 'pee_panels': L.get('pee_panels', 0), 'stops': stops})
assert [l['fwf'] for l in loads] == [24] * 5 and sum(l['fwf'] for l in loads) == 120, 'the plan is 5 loads of 24 = 120 FWF'
Q = EP['quote_vs_allocation']
for r in Q['rows']: assert r['quote'] == r['allocated_to_wc'] + r['no_wc_allocation'], ('quote row does not add up', r['item'])
order = next(x for x in EP['source_notes'] if x.startswith('Stop order'))
early = re.sub(r'\s*\(Andrew[^)]*\)', '', EP['early_delivery_rule']).strip()   # the page carries the rule, not who said it
EP819 = {'version': EP['version'], 'prepared': EP['prepared'], 'loads': loads,
         'quote': {'quote': Q['quote'], 'rows': [{k: r[k] for k in ('item', 'quote', 'allocated_to_wc', 'allocated_detail', 'no_wc_allocation', 'note') if k in r} for r in Q['rows']],
                   'no_wc_note': Q['no_wc_allocation_note'], 'wc31_note': Q.get('wc31_note')},
         'cancelled': [{k: c[k] for k in ('ref', 'fwf', 'note', 'source') if k in c} for c in EP['cancelled']],
         'site_rules': EP['site_rules'], 'park': {'area': EP['park_rules']['area'], 'rules': EP['park_rules']['rules']},
         'demob': {'heading': EP['demob_notice']['heading'], 'lines': EP['demob_notice']['lines']}, 'order': order, 'early': early}
assert EP['park_rules']['meet_point_id'] == MP819['park']
data = 'const MP819 = ' + json.dumps(MP819, ensure_ascii=False, separators=(',', ':')) + ';\nconst EP819 = ' + json.dumps(EP819, ensure_ascii=False, separators=(',', ':')) + ';\n'
# no money, no phone numbers, no other brand, nothing that would close the script
for bad, what in ((r'\$\s?\d', 'a dollar figure'), (r'(?<!\d)(?:\+?61\s?|0)[2-478](?:[\s-]?\d){8}(?!\d)', 'a phone number'), (r'(?i)site\s?iq', 'SiteIQ'), (r'</script', 'a closing tag')):
    if re.search(bad, data): sys.exit('the plan data carries ' + what + ' - stopping')

js = data + open(os.path.join(here, 'mp819_src.js'), encoding='utf-8').read() + '\n' + open(os.path.join(here, 'ep819_src.js'), encoding='utf-8').read()
css = open(os.path.join(here, 'v819.css'), encoding='utf-8').read()
if '</script' in js or '</style' in css: sys.exit('a source file would close its own tag')

# 1. the drawer: the meet point under Where it is, after the v8.16 arrangement
t = rep(t, "try { drawer816(a); } catch (e) { try { console.warn('v8.16 drawer', e); } catch (x) {} } /* v8.16 - simple first */",
        "try { drawer816(a); } catch (e) { try { console.warn('v8.16 drawer', e); } catch (x) {} } /* v8.16 - simple first */\n try { mpDrawer819(a); } catch (e) { try { console.warn('v8.19 meet point', e); } catch (x) {} } /* v8.19 - the meet point and its directions */",
        'drawer meet point', p)
# 2. the driver sheet: a Meet point section after Where it goes
t = rep(t, "dpSec('Where it goes', dpWhere(g, doc, posOf) + dpDeliveryNotes798(g)), dpSec('Photos', dpPics(g, doc, posOf), 'dp-ph')];",
        "dpSec('Where it goes', dpWhere(g, doc, posOf) + dpDeliveryNotes798(g))].concat(doc === 'drv' && typeof mpDrvSec819 === 'function' ? [dpSec('Meet point · site rules', mpDrvSec819(g), 'mp819s')] : [], [dpSec('Photos', dpPics(g, doc, posOf), 'dp-ph')]); /* v8.19 - the meet point and the site rules on the driver sheet */",
        'driver sheet meet point', p)
# 3. the Timeline: the load plan card under the day
t = rep(t, """(idx >= 0 ? dayBlock(days[idx], true) : '<div class="empty">No scheduled dates in the register.</div>')}""",
        """(idx >= 0 ? dayBlock(days[idx], true) : '<div class="empty">No scheduled dates in the register.</div>')}
 ${typeof ep819Html === 'function' ? ep819Html() : ''}""", 'Timeline load plan card', p)
# 4. the footer and the release marker
t = rep(t, "$('#footL').textContent = DATA.brand.footer + ' · built ' + DATA.built + ' · ' + DATA.build_version;",
        "$('#footL').textContent = DATA.brand.footer + ' · built ' + DATA.built + ' · ' + DATA.build_version + ' · v8.19'; /* v8.19 */", 'footer release', p)
t = rep(t, '<meta name="gc500-release" content="v8.13">', '<meta name="gc500-release" content="v8.19">', 'release marker', p)
# 5. the code and the look
t = rep(t, 'function renderPass(){', '/* ================================================================== v8.19 - meet points and the Event Portables load plan  Author: Andrew Fisher. */\n' + js + '\nfunction renderPass(){', 'v8.19 code', p)
i = t.index('</style>')
t = t[:i] + css + t[i:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v8.19 applied: meet points, site rules and the Event Portables load plan')
