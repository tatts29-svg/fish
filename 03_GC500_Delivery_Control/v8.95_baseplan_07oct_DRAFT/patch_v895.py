# Author: Andrew Fisher. v8.95 - the page's contract source moves from the 6 Oct Baseplan export (v8.71) to the 7 Oct export.
#
# Andrew supplied Baseplan_SuperCars_07Oct.xlsx on 7 Oct 2026 (inputs_07Oct2026/). The costs must read the latest source
# (the independent review asked for a "source-freshness disposition"); Andrew: "all cost align and correct", "everything must talk".
#
# Data only: DATA.rental_on_hire and what v8.71's logic derives from it (the contract lines, the per-contract summaries,
# the assignments, the summary counts, the plant lines' copies of their contract lines), plus Andrew's one correction to the
# register (P52's number 13227211 -> 1327211, in the four places DATA holds it) and to WC07's as-supplied record (1317743 ->
# 1317643, so contract line 9968955/38 joins WC07). The builder is baseplan895.py -
# v8.71's own logic as a module - run on the 7 Oct export; the same builder on the 6 Oct export reproduces the live DATA
# exactly (tests/test_identity895.py proves the delta). Nothing else on the page changes: no code, no MASTER_LOC, no media.
#
# Chains after v8.94 (or any of v8.89 .. v8.93):
#   V895_BASEPLAN=<path to Baseplan_SuperCars_07Oct.xlsx> toolchain/build.sh v8.95 <the full chain ... patch_v894.py> v8.95_baseplan_07oct_DRAFT/patch_v895.py
import hashlib, json, os, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
sys.path.insert(0, str(here))
from rep import rep
import baseplan895 as B

BASEPLAN_SHA = '8a18bd1f0df331d339d0fa27d81bdf22b238b1de0f1f5f5c342b208eed4b3bd7'   # Baseplan_SuperCars_07Oct.xlsx, 7 Oct 2026
MATCHES_SHA = hashlib.sha256((here / 'andrew_4370.json').read_bytes()).hexdigest()
EXPORT_DAY = '2026-10-07'
WORKBOOK = 'Baseplan_SuperCars_07Oct.xlsx'
# ANDREW'S RECORD IS THE AUTHORITY OVER BASEPLAN (Andrew, 6 Oct 2026: "What I have matched up and completed is correct").
# v8.71's record step stays on: a numbered line his record carries on a reference joins that reference even where the
# export did not touch the line. Against the record of 7 Oct that is two lines - 9968862/50 (1105053) to P37 and
# 9968862/79 (1327211) to P52 - and the patch refuses to run if the record step would move anything else.
REJOIN_RECORD = True
RECORD_JOINS = {'9968862/50': 'P37', '9968862/79': 'P52'}

p = Path(sys.argv[1]); raw = p.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); s = raw.decode('utf-8-sig')


def bound(env, sha):
    q = Path(os.environ.get(env) or '')
    if not q.is_file():
        sys.exit(f'{env} must name the workbook (SHA-256 {sha[:16]}...)')
    got = hashlib.sha256(q.read_bytes()).hexdigest()
    if got != sha:
        sys.exit(f'{env}: checksum mismatch ({got[:16]}...)')
    return q


BP = bound('V895_BASEPLAN', BASEPLAN_SHA)

# the base: the page's contract source is v8.71's 6 Oct export; v8.95 not applied already; the footer carries one of v8.89 .. v8.94
m = re.search(r'const DATA = (\{.*?\});\n', s); assert m, 'DATA not found'
D = json.loads(m.group(1)); ORIG = json.loads(m.group(1))
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == m.group(1), 'DATA must round-trip exactly - stopping'
R = D['rental_on_hire']
assert R['record_id'] == 'baseplan-contracts-2026-10-06' and R['supplied_on'] == '2026-10-06', 'the base must carry the 6 Oct export (v8.71)'
assert not any(x.get('applied') == 'v8.95' for x in R.get('supplements') or []), 'v8.95 is already applied'
marks = re.findall(r' · v8\.(?:89|9[0-4])\b', s)
assert len(marks) == 1 and s.count(marks[0]) == 1, 'expected one footer marker once, found %r' % marks

# ANDREW'S MATCHES WIN (Andrew, 6 Oct 2026). The numbers he has typed or recorded on the shared record, as it stood at
# version 4370 (7 Oct 2026 22:40 AEST), read back read-only through the page's own functions; a fresher snapshot may be
# given as V895_MATCHES (a reference -> numbers map), as v8.71 allowed. The as-supplied record he committed on 22 Sep is
# read from DATA.ops by the builder.
matches_path = os.environ.get('V895_MATCHES')
MATCHES = json.loads(Path(matches_path).read_text()) if matches_path else json.loads((here / 'andrew_4370.json').read_text())

# ANDREW'S CORRECTION TO THE REGISTER (8 Oct 2026, about 05:40 AEST: "1327211 is correct"). The schedule's register wrote
# P52's building as 13227211 - one digit too many; the contract line (9968862/79) and his typed number carry 1327211. The
# four places the page's DATA holds the wrong number, all on P52, are corrected before the contract source is rebuilt, and
# each must read exactly 13227211 as found, or the patch refuses.
WRONG, RIGHT, REF = '13227211', '1327211', 'P52'
ANDREW_SAID = {'by': 'Andrew Fisher', 'on': '2026-10-08', 'at': 'about 05:40 AEST', 'words': '1327211 is correct'}
LOG_REG = []


def correct(container, index, path, owner_key):
    got = container[index]
    assert got == WRONG, f'{path}: expected {WRONG!r} as found, got {got!r} - stopping'
    assert owner_key == REF, f'{path}: belongs to {owner_key}, not {REF} - stopping'
    container[index] = RIGHT
    LOG_REG.append({'path': path, 'ref': REF, 'was': WRONG, 'now': RIGHT, 'andrew': ANDREW_SAID})


a_i = [i for i, a in enumerate(D['assets']) if a['key'] == REF]
o_i = [i for i, r in enumerate(D['ops']['rows']) if r['key'] == REF]
assert len(a_i) == 1 and len(o_i) == 1, 'P52 must be one register row and one as-supplied row'
A52, O52 = D['assets'][a_i[0]], D['ops']['rows'][o_i[0]]
assert A52['asset_numbers'] == [WRONG] and len(A52['events']) >= 1, 'P52 register row is not as found'
bk = A52['events'][0].get('booking801') or {}
assert bk.get('asset_text') == WRONG and bk.get('loads') and bk['loads'][0].get('asset_numbers') == [WRONG], 'P52 booking is not as found'
assert O52.get('asset_numbers_scheduled') == [WRONG], 'P52 as-supplied row is not as found'
correct(A52['asset_numbers'], 0, f'DATA.assets[{a_i[0]}].asset_numbers[0]', A52['key'])
correct(bk, 'asset_text', f'DATA.assets[{a_i[0]}].events[0].booking801.asset_text', A52['key'])
correct(bk['loads'][0]['asset_numbers'], 0, f'DATA.assets[{a_i[0]}].events[0].booking801.loads[0].asset_numbers[0]', A52['key'])
correct(O52['asset_numbers_scheduled'], 0, f'DATA.ops.rows[{o_i[0]}].asset_numbers_scheduled[0]', O52['key'])
assert WRONG not in json.dumps(D, ensure_ascii=False), 'the wrong number is still somewhere in DATA - stopping'
assert json.dumps(ORIG, ensure_ascii=False).count(WRONG) == 4, 'the base carries the wrong number other than in the four places - stopping'

# ANDREW'S SECOND CORRECTION (8 Oct 2026, about 09:30 AEST: "1317643 is the correct number Remove 1317743"). His as-supplied
# record of 22 Sep (DATA.ops, WC07's 20 FWF) wrote one number as 1317743; Baseplan's line 9968955/38 (serial F4790) carries
# 1317643, which he confirms. The one place DATA holds 1317743 is corrected before the contract source is rebuilt, so line 38
# joins WC07 like the other 19. It must read exactly 1317743 as found, once, on WC07, or the patch refuses.
WRONG2, RIGHT2, REF2 = '1317743', '1317643', 'WC07'
ANDREW_SAID2 = {'by': 'Andrew Fisher', 'on': '2026-10-08', 'at': 'about 09:30 AEST', 'words': '1317643 is the correct number Remove 1317743'}
o7 = [i for i, r in enumerate(D['ops']['rows']) if r['key'] == REF2]
assert len(o7) == 1, 'WC07 must be one as-supplied row'
SUP7 = D['ops']['rows'][o7[0]].get('asset_numbers_supplied') or []
assert SUP7.count(WRONG2) == 1 and RIGHT2 not in SUP7, 'WC07 as-supplied numbers are not as found'
assert json.dumps(ORIG, ensure_ascii=False).count(WRONG2) == 1, 'the base carries 1317743 somewhere other than WC07 - stopping'
J7 = SUP7.index(WRONG2); SUP7[J7] = RIGHT2
LOG_REG.append({'path': f'DATA.ops.rows[{o7[0]}].asset_numbers_supplied[{J7}]', 'ref': REF2, 'was': WRONG2, 'now': RIGHT2, 'andrew': ANDREW_SAID2})
assert WRONG2 not in json.dumps(D, ensure_ascii=False), '1317743 is still somewhere in DATA - stopping'

NEW, TABS = B.read_export(BP)
assert len(TABS) == 11 and len(NEW) == 323, f'the 7 Oct export should carry 11 contracts and 323 lines, read {len(TABS)} and {len(NEW)}'
LOG = B.apply(D, NEW, TABS, MATCHES, rejoin_record=REJOIN_RECORD)

R.update({'record_id': 'baseplan-contracts-' + EXPORT_DAY, 'supplied_on': EXPORT_DAY, 'workbook': WORKBOOK,
          'source': f'The {len(TABS)} hire contracts exported from Baseplan by the project manager on {EXPORT_DAY}, one tab per contract; the tab name is the contract number and the branch code.'})
R['supplements'] = list(R.get('supplements') or []) + [{
    'source': WORKBOOK + ' (export of ' + EXPORT_DAY + ')', 'sha256': BASEPLAN_SHA, 'supplied_on': EXPORT_DAY, 'applied': 'v8.95',
    'lines_added': [x['line'] for x in LOG['added']], 'lines_removed': [x['line'] for x in LOG['removed']],
    'lines_changed': len(LOG['changed']), 'lines_rejoined': [x['line'] for x in LOG['rejoined']], 'lines_held': [x['line'] for x in LOG['held']],
    'lines_joined_from_record': [x['line'] for x in LOG['record_joined']],
    # the page carries the right number only; the exact old value is in evidence/changes_v895.json (register_corrected)
    'register_corrected': [{'ref': x['ref'], 'now': x['now'], 'path': x['path']} for x in LOG_REG],
    'register_correction_basis': "the register wrote P52's building number with one digit too many (Andrew Fisher, 8 Oct 2026: \"1327211 is correct\"); the 22 Sep as-supplied record had one of WC07's 20 FWF one digit out where Baseplan carries 1317643 (Andrew Fisher, 8 Oct 2026: \"1317643 is the correct number\")",
    'recorded_matches': 'shared record version 4370 (7 Oct 2026) and the as-supplied record of 22 Sep 2026; his record is the authority over Baseplan (6 Oct 2026)',
    'basis': "Every line refreshed from the export field by field with v8.71's rules; joins kept where the number did not change, re-made by Andrew's recorded number, then the register's number, then the delivery docket where it did."}]

# only the contract source and the plant lines' copies may change, plus Andrew's one correction to P52's number: with the
# four corrected values put back, the register and the as-supplied record are identical to the base; everything else is identical
import copy
CHK = copy.deepcopy(D)
CHK['assets'][a_i[0]]['asset_numbers'][0] = WRONG; CHK['assets'][a_i[0]]['events'][0]['booking801']['asset_text'] = WRONG
CHK['assets'][a_i[0]]['events'][0]['booking801']['loads'][0]['asset_numbers'][0] = WRONG; CHK['ops']['rows'][o_i[0]]['asset_numbers_scheduled'][0] = WRONG
CHK['ops']['rows'][o7[0]]['asset_numbers_supplied'][J7] = WRONG2
for k in D:
    if k not in ('rental_on_hire', 'plant_lines'):
        assert CHK[k] == ORIG[k], 'DATA.' + k + ' changed beyond the P52 and WC07 corrections - stopping'
assert set(D) == set(ORIG)
LOG['register_corrected'] = LOG_REG
assert len(R['rows']) == 323 and len(LOG['added']) == 2 and not LOG['removed'], 'the 7 Oct export adds two lines and takes none off'
assert {x['line']: x['now'] for x in LOG['record_joined']} == RECORD_JOINS and not LOG['record_would_move'], 'the record step must join exactly 9968862/50 to P37 and 9968862/79 to P52: ' + json.dumps([(x['line'], x['now']) for x in LOG['record_joined']])
log_text = json.dumps(LOG, ensure_ascii=False, default=str)
assert not re.search(r'\$\s?\d', log_text) and not re.search(r'"rate_\d"', log_text), 'the change log carries no money'

assert WRONG not in json.dumps(D, ensure_ascii=False) and WRONG2 not in json.dumps(D, ensure_ascii=False), 'a wrong number must appear nowhere in DATA, the supplement included - stopping'
out = s[:m.start(1)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
assert WRONG not in out and WRONG2 not in out, 'a wrong number must appear nowhere on the page - stopping'
out = rep(out, marks[0], ' · v8.95', 'release footer', str(p))
p.write_bytes((b'\xef\xbb\xbf' if bom else b'') + out.encode('utf-8'))
log = Path(os.environ.get('V895_LOG') or (here / 'evidence' / 'changes_v895.json'))
log.parent.mkdir(parents=True, exist_ok=True)
log.write_text(json.dumps(LOG, indent=1, ensure_ascii=False, default=str))
print(f"v8.95 applied: contracts {len(TABS)}, lines {len(R['rows'])} (+{len(LOG['added'])} -{len(LOG['removed'])}, {len(LOG['changed'])} changed, "
      f"{len(LOG['rejoined'])} rejoined, {len(LOG['held'])} held); joined from Andrew's record {len(LOG['record_joined'])}; register corrected {len(LOG_REG)} (P52 x4, WC07 x1); flags {len(LOG['flags'])}; "
      f"matches {MATCHES_SHA[:12]}; footer {marks[0].strip()} -> v8.95")
