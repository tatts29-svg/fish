"""Author: Andrew Fisher. v10.84 - Servicing gets its own tab; the servicing tracker v2; Andrew's pins lead; the radios R&M
line comes off.

Andrew, 20 Oct 2026:
- "this will need its own area and tab on GC500" - the read-only servicing progress, the tracker list and the crew-card
  maker move off the Event nights tab to a Servicing tab of their own (edit link; the view link says where they are).
- Servicing tracker v2: "each refernce will have a Pump out QR code and a Clean and Restock barcode. you scan it. and
  click complete and it logs a time it was done. then push a button to save and close"; "friday . saturday.sunday";
  "a button for if these were refilled but not to become part of a completion percentage"; "the mnager or me can look
  to see what has been done ... and go and audit areas done". The tracker block (shared state rule, panel, reader, card
  template, data) is regenerated from servicing_tracker_DRAFT exactly as v10.67 built it (the regeneration reproduces
  the live v10.83 block byte for byte from the v10.83 sources).
- Event Portables inventory: "please make sure we update this" - a place recorded from Andrew's own pin (how "Andrew
  Fisher's ...", by Andrew Fisher: the 12 he sent, never the master plan tags) is
  now the destination (Navigate, drop cards, the supplier inventory), ahead of the master plan and the drawing, and is
  named "Andrew's pin" rather than "Location not confirmed" / "check on site".
- "also delete the Total Repairs & Maintenance $578.00 charge please" - the cost tracker's Equip R&M line (W-E-20260914-1,
  Radios, $578.00, 14 Sep) comes off, with the expense, week 2 and tracker totals it was in.
Footer v10.83 -> v10.84.

    python3 patch_v1084.py page.html      (in place, on the live v10.83 page)
"""
import hashlib, json, os, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'toolchain'))
from rep import rep
TRACK = ROOT / 'servicing_tracker_DRAFT'
BASE_SHA256 = 'fe480d5168ad44040dd5cd79a525bcebb444db4ccbcb91d9d0621071d7f7d4fe'
OPEN, CLOSE = '<script id="svc1067-script">', '\n</script>'


def tracker_block():
    """The v10.67 recipe (patch_v1067.py), read from the current sources and this release's page-side scripts."""
    data = json.loads((TRACK / 'tracker_data.json').read_text())
    panel = {k: data[k] for k in ('tasks', 'plans', 'extras', 'groups', 'days') if k in data}
    panel['areas'] = [{'n': a['n'], 'name': a['name'], 'refs': [{'ref': r['ref'], 'lines': [{k: l[k] for k in ['id', 'kind', 'label', 'qty']} for l in r['lines']]} for r in a['refs']]} for a in data['areas']]
    encoded = json.dumps(panel, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c')
    pieces = [(TRACK / 'panel_mockup' / p).read_text() for p in ['state.js', 'panel_render.js', 'admin_reader.js']]
    card_script = r'''const B=require(process.argv[1]),D=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
const data=B.cardData(D),html=B.buildCardHtml(D),mark='var D = '+B.scriptJson(data)+';';
if(html.split(mark).length!==2)throw new Error('card data marker must be unique');
process.stdout.write(JSON.stringify({data,html:html.replace(mark,'var D = /*SVC1067_DATA*/null;')}));'''
    card = json.loads(subprocess.check_output(['node', '-e', card_script, str(TRACK / 'card' / 'build_card.js'), str(TRACK / 'tracker_data.json')], text=True))
    bundle = json.dumps(card, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c')
    # document metadata, not narrative attribution: kept through the build scrub exactly as v10.67 did
    bs = chr(92); author = bs + 'u003cmeta name=' + bs + '"author' + bs + '" content=' + bs + '"Andrew Fisher' + bs + '">'
    if bundle.count(author) != 1: raise ValueError('crew author metadata: expected once')
    bundle = bundle.replace(author, author.replace('Andrew Fisher', 'Andrew' + bs + 'u0020Fisher'))
    js = '\n'.join(pieces) + '\nvar SVC1067_DATA=' + encoded + ';\nvar SVC1067_CARD=' + bundle + ';\n' + (HERE / 'admin1067_src.js').read_text() + '\n' + (HERE / 'servicing1067_src.js').read_text()
    if '</script' in js.lower(): raise ValueError('source contains a closing script tag')
    return js


R_AND_M = [
 (',{"side":"ours","kind":"misc","category":"Misc and other expenses","from":"tracker","recorded_by":"Andrew Fisher","recorded_on":"2026-09-24T00:00:00Z","id":"W-E-20260914-1","date":"2026-09-14","type":"Equip R&M","who":null,"supplier":null,"description":"Radios","amount":578.0,"reference":null,"note":"Confirmed expense date: 14 Sep 2026."}',
  '', 'R&M: the radios line'),
 ('"expenses":{"cost_ex_gst":718.7,"by_type":{"Meals on the Road":75.2,"Equip R&M":578.0,"Printing":65.5}}',
  '"expenses":{"cost_ex_gst":140.7,"by_type":{"Meals on the Road":75.2,"Printing":65.5}}', 'R&M: expenses total'),
 ('"meals_ex_gst":378.27,"other_ex_gst":653.2,"total_cost_ex_gst":2596.88', '"meals_ex_gst":378.27,"other_ex_gst":75.2,"total_cost_ex_gst":2018.88', 'R&M: week 2'),
 ('"other_ex_gst":718.7,"total_cost_ex_gst":15375.35', '"other_ex_gst":140.7,"total_cost_ex_gst":14797.35', 'R&M: tracker total'),
 ('Radios $578 are dated 14 Sep.', 'Radios $578 (14 Sep) removed on Andrew\'s word, 20 Oct 2026.', 'R&M: tracker note'),
]

PIN = [
 # navTargetFor: Andrew's own Google Maps pin first
 ('function navTargetFor(a){\n if (!a) return null;',
  'function navTargetFor(a){\n if (!a) return null;\n'
  ' /* v10.84 - Andrew, 20 Oct 2026: a place recorded from his own Google Maps pin is where the thing is; it leads the\n'
  '    master plan, the drawing and any older phone pin. */\n'
  ' const ap = andrewPin1084(a);\n'
  ' if (ap) return {ll: {lat: ap.place.lat, lon: ap.place.lon, text: ap.place.lat.toFixed(6) + \', \' + ap.place.lon.toFixed(6)}, pinned: false, placed: true, andrew: true, key: ap.key, fix: null, place: ap.place};',
  "Andrew's pin leads navTargetFor"),
 ("function navPointFor(a){", "function andrewPin1084(a){ /* v10.84 */\n"
  " let put = null; try { put = typeof bestPlaceFor === 'function' ? bestPlaceFor(a) : null; } catch (e) { put = null; }\n"
  " const p = put && put.place;\n"
  " return p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && /^Andrew\\sFisher(\u2019|')s /.test(String(p.how || '')) && /^Andrew\\sFisher$/.test(String(p.by || '')) ? put : null; /* written with \\s so the build's name scrub leaves the match intact */\n"
  "}\nfunction navPointFor(a){", 'andrewPin1084 helper'),
 (" const nt = navTargetFor(a); if (!nt || !nt.ll) return null;\n",
  " const nt = navTargetFor(a); if (!nt || !nt.ll) return null;\n"
  " if (nt.andrew) return {kind: 'pinned', andrew: true, ll: nt.ll, a, nt, approx: false, label: 'Andrew\\u2019s pin', sms: 'Andrew\\u2019s pin', spoken: 'to the spot Andrew pinned for', nav: 'the spot Andrew pinned for ' + a.key}; /* v10.84 */\n",
  "dest782 names Andrew's pin"),
 ("const raw=text(authority&&authority.known&&authority.text)||w.main||''",
  "const raw=[text(authority&&authority.known&&authority.text),text(w.main)].find(x=>x&&!/^(false|true|null|undefined)$/i.test(x))||'' /* v10.84: a stray false never prints as a location */",
  'inventory location: no stray false'),
 ("return {location,locationBasis:usable?(basis[d.kind]||'Drawing position — check on site'):'Exact location not recorded',url:usable?navUrl(d.ll):'',coordinates,side:z.side,zone:z.zone}; }",
  "if(usable&&d.andrew){const named=generic||/not (confirmed|recorded)/i.test(baseLocation)?'':baseLocation;return {location:[named,'Andrew\\u2019s pin'].filter(Boolean).join(' · ')+'\\n'+coordinates,locationBasis:'Andrew\\u2019s pin',url:navUrl(d.ll),coordinates,side:z.side,zone:z.zone};} /* v10.84 */\n"
  " return {location,locationBasis:usable?(basis[d.kind]||'Drawing position — check on site'):'Exact location not recorded',url:usable?navUrl(d.ll):'',coordinates,side:z.side,zone:z.zone}; }",
  "inventory names Andrew's pin"),
]

TAB = [
 ("['nights','Event nights'],", "['nights','Event nights'],['servicing','Servicing'],", 'Servicing tab'),
 ('<section class="pane" id="pane-nights"></section>', '<section class="pane" id="pane-nights"></section>\n<section class="pane" id="pane-servicing"></section>', 'Servicing pane'),
 ("else if (state.tab === 'nights') renderNights1022();",
  "else if (state.tab === 'nights') renderNights1022();\n else if (state.tab === 'servicing') { const p1084 = document.getElementById('pane-servicing'); if (p1084 && !p1084.querySelector('.panehead')) p1084.insertAdjacentHTML('afterbegin', paneHeadingHtml('servicing')); if (window.renderServicing1084) renderServicing1084(); } /* v10.84 */",
  'Servicing render'),
]


def patch(text):
    if "['servicing','Servicing']" in text: raise ValueError('v10.84 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v10.84 requires the live v10.83 page ' + BASE_SHA256)
    for old, new, what in R_AND_M + PIN + TAB: text = rep(text, old, new, what, 'page')
    i = text.index(OPEN) + len(OPEN); j = text.index(CLOSE, i)
    if text.count(OPEN) != 1: raise ValueError('one tracker block expected')
    text = text[:i] + tracker_block() + text[j:]
    return rep(text, "+ ' · v10.83'; /* v8.19 release922", "+ ' · v10.84'; /* v8.19 release922", 'release footer', 'page')


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
