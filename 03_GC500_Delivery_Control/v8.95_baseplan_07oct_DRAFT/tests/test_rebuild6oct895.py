#!/usr/bin/env python3
# Author: Andrew Fisher. v8.95's builder is v8.71's logic: run on the 6 Oct export (the page's current source) it must
# reproduce the page's DATA exactly - every row, contract summary, assignment, summary count and plant line unchanged.
# Its record step (Andrew's record re-makes a join) is held off for that proof and then shown on its own: on the 6 Oct
# export it moves exactly the two lines his record carries since 6 Oct, and nothing else.
#   V871_BASEPLAN=<path to Baseplan_SuperCars_2026-10-06.xlsx> python3 test_rebuild6oct895.py <page carrying the 6 Oct export>
# The export is private (it carries rates); its SHA-256 is asserted, as v8.71 did.
import copy, hashlib, json, os, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent))
import baseplan895 as B

BASEPLAN_6OCT_SHA = '5f9e83aa63a76c31bc974d85d963800d7872191ffc18ef4e9ee255339aece090'
bp = Path(os.environ.get('V871_BASEPLAN') or '')
if not bp.is_file():
    sys.exit('V871_BASEPLAN must name the 6 Oct export (SHA-256 ' + BASEPLAN_6OCT_SHA[:16] + '...)')
got = hashlib.sha256(bp.read_bytes()).hexdigest()
if got != BASEPLAN_6OCT_SHA:
    sys.exit('V871_BASEPLAN: checksum mismatch (' + got[:16] + '...)')
page = Path(sys.argv[1])
s = page.read_text(encoding='utf-8-sig')
m = re.search(r'const DATA = (\{.*?\});\n', s)
D0 = json.loads(m.group(1))
fails = []
def check(name, ok, detail=''):
    print(('PASS ' if ok else 'FAIL ') + name + ('' if ok or not detail else '  ' + str(detail)[:500]))
    if not ok: fails.append(name)
check('the page carries the 6 Oct export as its contract source', D0['rental_on_hire']['record_id'] == 'baseplan-contracts-2026-10-06' and D0['rental_on_hire']['supplied_on'] == '2026-10-06')
check('DATA round-trips byte for byte', json.dumps(D0, ensure_ascii=False, separators=(',', ':')) == m.group(1))
D = copy.deepcopy(D0)
NEW, TABS = B.read_export(bp)
check('the 6 Oct export reads as 11 contracts and 321 lines', len(TABS) == 11 and len(NEW) == 321, (len(TABS), len(NEW)))
MATCHES = json.loads((here.parent / 'andrew_4370.json').read_text())
LOG = B.apply(D, NEW, TABS, MATCHES, rejoin_record=False)

def diff(a, b, path='DATA', out=None):
    out = [] if out is None else out
    if len(out) > 5000: return out
    if type(a) != type(b): out.append(path + ' type'); return out
    if isinstance(a, dict):
        for k in set(a) | set(b):
            if k not in a or k not in b: out.append(path + '.' + str(k) + ' key'); continue
            diff(a[k], b[k], path + '.' + str(k), out)
    elif isinstance(a, list):
        if len(a) != len(b): out.append(path + ' length %d -> %d' % (len(a), len(b)))
        for i, (x, y) in enumerate(zip(a, b)): diff(x, y, path + '[%d]' % i, out)
    elif a != b: out.append(path + ' value')
    return out

d = diff(D0, D)
check('the builder changes nothing: every row, contract, assignment, summary count and plant line identical (0 differences)', not d, d[:8])
check('it adds no line, removes none, changes none and re-joins none', not LOG['added'] and not LOG['removed'] and not LOG['changed'] and not LOG['rejoined'] and not LOG['held'] and not LOG['plant_line_copies'], {k: len(v) for k, v in LOG.items()})
check('the five two-line numbers v8.71 flagged are the same five', [f['asset_no'] for f in LOG['flags']] == ['1189410', '1189412', '1211404', '1272166', '1327213'], [f['asset_no'] for f in LOG['flags']])
check('with the record step off, what the record of 7 Oct would move is exactly the two lines Andrew matched after 6 Oct (9968862/50 to P37, 9968862/79 to P52)', sorted((x['line'], x['record']) for x in LOG['record_would_move']) == [('9968862/50', 'P37'), ('9968862/79', 'P52')], LOG['record_would_move'])
# the record step on its own (the patch's setting): the same two lines move, in their join only, and nothing else
D2 = copy.deepcopy(D0)
LOG2 = B.apply(D2, NEW, TABS, MATCHES, rejoin_record=True)
check('with the record step on, exactly 9968862/50 joins P37 and 9968862/79 joins P52 (record_joined), nothing from the export', [(x['line'], x['now']) for x in LOG2['record_joined']] == [('9968862/50', 'P37'), ('9968862/79', 'P52')] and not LOG2['rejoined'] and not LOG2['changed'] and not LOG2['added'] and not LOG2['removed'] and not LOG2['record_would_move'], {k: len(v) for k, v in LOG2.items()})
r0 = {(str(r['rental_contract']), r['line']): r for r in D0['rental_on_hire']['rows']}; r2 = {(str(r['rental_contract']), r['line']): r for r in D2['rental_on_hire']['rows']}
moved = {k: {f for f in r0[k] if r0[k].get(f) != r2[k].get(f)} for k in r0 if r0[k] != r2[k]}
check('those two lines change in their join only; every other line is identical', moved == {('9968862', 50): {'match'}, ('9968862', 79): {'match'}}, moved)
R0, R2 = D0['rental_on_hire'], D2['rental_on_hire']
check('beyond those joins only rental_on_hire moves: the assignments of P37 and P52, contract 9968862\'s summary and the summary counts',
      all(D0[k] == D2[k] for k in D0 if k != 'rental_on_hire') and {k for k in R0 if R0[k] != R2[k]} == {'rows', 'assignments', 'contracts', 'summary'}
      and {k for k in R0['assignments'] if R0['assignments'][k] != R2['assignments'].get(k)} == {'P37', 'P52'} and set(R0['assignments']) == set(R2['assignments'])
      and [c['rental_contract'] for c, d in zip(R0['contracts'], R2['contracts']) if c != d] == ['9968862']
      and R2['assignments']['P37']['lines'] == ['9968862/50'] and R2['assignments']['P52']['lines'] == ['9968862/79', '9968862/81'],
      {'keys': {k for k in R0 if R0[k] != R2[k]}, 'assignments': {k for k in R0['assignments'] if R0['assignments'][k] != R2['assignments'].get(k)}})
print('rebuild6oct895: ' + ('PASS - the same builder on the 6 Oct export reproduces the page\'s DATA exactly; its record step alone moves only the two lines his record carries' if not fails else 'FAIL - %d finding(s)' % len(fails)))
sys.exit(1 if fails else 0)
