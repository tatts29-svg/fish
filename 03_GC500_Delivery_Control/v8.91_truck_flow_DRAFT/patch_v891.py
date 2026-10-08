# Author: Andrew Fisher. v8.91 Truck flow: daily runs that get trucks in early, in order, and never over-crowd an area.
# Builds on the full chain (v8.84 to v8.89, with v8.93 / v8.94 where they are in the chain). Footer: the one ' · v8.89', ' · v8.90',
# ' · v8.93' or ' · v8.94' marker becomes ' · v8.91'.
#   toolchain/build.sh v8.91 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
#     v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py \
#     v8.89_master_map_DRAFT/patch_v889.py v8.91_truck_flow_DRAFT/patch_v891.py
import sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text()

# the base: the chain applied; the functions this release wraps; not applied already
assert 'where885-style' in s and 'today884-style' in s, 'v8.84 and v8.85 must be applied first'
for fn in ['function crew883Plan(', 'function crew883SaveDay(', 'function crew883Key(', 'function crew883Transport(', 'function dpLoads(', 'function ldLine(', 'function ldId(',
           'function dpPage(', 'function pl782Pages(', 'function dropPage(', 'function checkDialog826(', 'function checks826(', 'function daily821Model(', 'function daily821Html(',
           'function daily861Body(', 'function dayPanels(', 'function pdf7Open(', 'function dpPrint(', 'function meetPoint819(', 'function zone816(', 'function drvStamp782(',
           'function hhmm782(', 'function clock782(', 'function run782(', 'const PEAKS782', 'const LOAD_BY782', 'const UNLOAD_MIN782', 'const GUIDE826', 'function motionOff816(',
           'function ldScroller(', 'function dpBx(', 'function navUrl(', 'function assetOf(', 'function whereText(', 'function hasTank782(', 'function dpItemsWords(', 'function save(', 'function dpCut(', 'function dpFail(']:
    assert fn in s, 'base is missing ' + fn
assert 'flow891-style' not in s and 'function flow891Build(' not in s, 'v8.91 is already applied'

# 1. the release footer: exactly one of the chain's markers, once, becomes v8.91
marks = [m for m in (' · v8.89', ' · v8.90', ' · v8.93', ' · v8.94') if m in s]
assert len(marks) == 1 and s.count(marks[0]) == 1, f'expected one footer marker once, found {[(m, s.count(m)) for m in marks]}'
s = rep(s, marks[0], ' · v8.91', 'release footer', str(p))

# 2. the pre-dispatch check (v8.26) asks for a first AND last name: it prints as Checked by and Printed by on every sheet
s = rep(s, "const valid=()=>cks.every(c=>c.checked)&&nm.value.trim().length>=2;",
        "const valid=()=>cks.every(c=>c.checked)&&flow891FullName(nm.value);", 'check dialog: full name', str(p))
s = rep(s, """<input id="drv782n" autocomplete="name" placeholder="Your name" value="'+esc(name)+'"><small>Your name and time print on these sheets. Manual check; no slot or crew reservation.</small>""",
        """<input id="drv782n" autocomplete="name" placeholder="First and last name" value="'+esc(flow891FullName(name)?name:(flow891FullName(S.operator||'')?String(S.operator).trim():name))+'"><small>Your first and last name and the time print on every sheet (Checked by · Printed by). Manual check; no slot or crew reservation.</small>""",
        'check dialog: name field', str(p))

# 3. Keep the native daily-run model's exact stable load identity through filtering and ordering.
# Matching references, times or array positions cannot distinguish two trucks carrying the same reference.
s = rep(s, "loads:groups.map((g,i)=>({n:i+1,iso,time:g.time||'',carrier:g.carrier||'',",
        "loads:groups.map((g,i)=>({id:ldId(clean,g),n:i+1,iso,time:g.time||'',carrier:g.carrier||'',",
        'daily run: stable load identity', str(p))

# 3a. Only this exact new metadata schema bypasses the legacy day#number load-key rule.
# Existing Crew/day-order import compatibility is a separate pre-existing issue.
legacy_load = " if (!/^\\d{4}-\\d{2}-\\d{2}#\\d{1,4}$/.test(id)) bad.push('load ' + id + ' is not a load id (a day and a number)');"
window_load = r""" const window891 = /^flow891\/(\d{4}-\d{2}-\d{2})\/window\/(.+)$/.exec(id);
 if (window891) {
  const fields = ['kind', 'day', 'ref', 'loadId', 'start', 'finish', 'by', 'at'];
  let encoded891 = null; if (typeof r.loadId === 'string') { try { encoded891 = encodeURIComponent(r.loadId); } catch (e) {} }
  const ident = encoded891 != null && typeof r.loadId === 'string' && r.loadId.startsWith(window891[1] + '|deliveries|') && r.loadId.length > 22 && !/[\u0000-\u001f\u007f]/.test(r.loadId);
  const times = typeof r.start === 'string' && typeof r.finish === 'string' && /^\d{2}:[0-5]\d$/.test(r.start) && /^\d{2}:[0-5]\d$/.test(r.finish) && hhmm782(r.start) != null && hhmm782(r.finish) != null && hhmm782(r.finish) > hhmm782(r.start);
  if (r.kind !== 'flow891' || r.ref !== '' || r.day !== window891[1] || !day(r.day) || !ident || (ident && encoded891 !== window891[2]) || docIdOf(id).length >= 180 || !times || typeof r.by !== 'string' || !r.by.trim() || typeof r.at !== 'string' || !iso(r.at) || Object.keys(r).some(k => !fields.includes(k))) bad.push('load ' + id + ' is not a valid Truck flow window');
  text(r.loadId, 'load ' + id + ' identity'); text(r.by, 'load ' + id + ' by');
  return;
 }
""" + legacy_load
s = rep(s, legacy_load, window_load, 'record import: validated load window metadata', str(p))

# 4. style before the first </head>, script before the last </body> (every function it wraps is defined by then)
s = s.replace('</head>', '<style id="flow891-style">' + (here / 'flow891.css').read_text() + '</style>\n</head>', 1)
js = (here / 'flow891_src.js').read_text()
assert '</script' not in js
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="flow891-script">\n' + js + '</script>\n' + tag + tail
p.write_text(s)
print('v8.91 applied')
