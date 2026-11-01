"""Author: Andrew Fisher. v12.80: the Costs & P&L tab on pack v1.21. Data only.

On 2 Nov 2026 Andrew said Alfie Harris did not work or stay on Mon 5 Oct, the King's Birthday ("No one did"), and that Job Connect is
already coded to Installs – Temp Staff on Baseplan. His 5 Oct night came off the record (record 12739,
record_02Nov2026_alfie_5_oct_off/), and pack v1.21 carries both (audit_pack.py 579/579). This patch puts the v1.21 data into the live
v12.79 P&L block and changes nothing else:

- the block's code (plf1279_src.js, plf1279.css, plf1279_find.js, plf1279_find.css) is the live v12.79 code, read from
  ../v12.79_pl_rehire_pack_v119_LIVE/, so the module is byte for byte what is live apart from the data and its hash;
- the data may differ from v1.19 only where the night and the account name reach (ALLOWED below), and every money change must be
  exactly the 223.63 night (costs, October, KINP, accommodation and the accrual down; the difference up). Anything else refuses;
- the release footer, v12.79 -> v12.80.

(A first v12.80, 8d919df1…, on a pack v1.20 that carried a 5 Oct shift for Alfie, was withdrawn before upload when Andrew said he did
not work that day.)

    PLF_JSON_OLD=<pack v1.19>/GC500_PL_final.json PLF_JSON=<pack v1.21>/GC500_PL_final.json \
      toolchain/build.sh v12.80 v12.80_pack_v121_alfie_night_off/patch_v1280.py
"""
import hashlib, importlib.util, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIVE1279 = HERE.parent / 'v12.79_pl_rehire_pack_v119_LIVE'
BASE = '73df88aeb79bd4c3dccdeafd01a9d23f72aa3d7d87257220919b0464cb6be95f'        # live v12.79, uploaded 2 Nov 2026 02:03 AEST
OLD_SHA = 'fd38abeacaacf8983901a222427bdba01e5c96a8d153851a76e31c7889f482cc'     # pack v1.19, record 12727, in the live v12.79 block
NEW_SHA = 'b98d222537353bf98d9073b1e417e0f9c71dd7334a01a409e97db2562153c232'     # pack v1.21, record 12739 (audit_pack.py 579/579)
FIND = ('plf1279_find.js', 'plf1279_find.css')
NIGHT = 223.63
JC_ACCT = 'Installs – Temp Staff'

spec = importlib.util.spec_from_file_location('p1279', LIVE1279 / 'patch_v1279.py')
P1279 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1279)
P1277 = P1279.P1277

# every data path v1.21 may differ from v1.19 on: the stamps; the night (totals, KINP, accommodation, Alfie's line, the month end,
# the not-tied and no-PO totals, the facts, one journal fewer); the account name (Job Connect's nine lines, its journal and its move)
ALLOWED = [r'pack', r'record', r'source', r'accrue', r'costs\.(total|oct)', r'difference',
           r'branchLines\.KINP\[\d+\]\[1\]', r'branches\[0\]\.(costs|difference)', r'byAccount\[\d+\]\.(holds\[0\]\.amount|total|code|name)',
           r'categories\[\d+\]\.(oct|total)', r'facts( len|\[\d+\]\[\d\])', r'journals( len|\[\d+\]\.account)', r'lines\[\d+\]\.account',
           r'lines\[20\]\.what', r'lines\[22\]\.(accrue|oct|state|status|what)', r'matchTotals\.(costs|notTied)',
           r'monthEnd\.(oct|octWithoutNovLabour|rows\[1\]\.oct)', r'moves\[\d+\]\.account', r'noPO\[10\]\.what', r'noPO\[12\]\.(amount|what)',
           r'notTied\[\d+\]\.amount', r'open\[14\]', r'poTotals\.(noPO|total)', r'suppliers\[\d+\]\.(accrue|oct|total)']


def diffs(a, b, path=''):
    if type(a) is not type(b): return [path]
    if isinstance(a, dict):
        out = []
        for k in sorted(set(a) | set(b)):
            p = (path + '.' + k) if path else k
            out += [p] if (k not in a or k not in b) else diffs(a[k], b[k], p)
        return out
    if isinstance(a, list):
        out = [path + ' len'] if len(a) != len(b) else []
        return out + [d for i, (x, y) in enumerate(zip(a, b)) for d in diffs(x, y, '%s[%d]' % (path, i))]
    return [] if a == b else [path]


def check_delta(o, n):
    c = lambda x, y: abs(round(x, 2) - round(y, 2)) < 0.005
    if (o.get('pack'), n.get('pack'), o.get('record'), n.get('record')) != ('v1.19', 'v1.21', 12727, 12739):
        raise ValueError('expected pack v1.19 on record 12727 -> v1.21 on record 12739')
    bad = [d for d in diffs(o, n) if not any(re.fullmatch(p, d) for p in ALLOWED)]
    if bad: raise ValueError('pack v1.21 differs from v1.19 outside the night and the account name: ' + repr(bad[:12]))
    if n['revenue'] != o['revenue'] or n['labourJournal'] != o['labourJournal']: raise ValueError('revenue or labour moved')
    if not (c(n['costs']['total'], o['costs']['total'] - NIGHT) and c(n['costs']['oct'], o['costs']['oct'] - NIGHT) and c(n['accrue'], o['accrue'] - NIGHT)
            and c(n['difference'], o['difference'] + NIGHT) and n['costs']['sep'] == o['costs']['sep'] and n['costs']['nov'] == o['costs']['nov']):
        raise ValueError('the totals did not move by exactly the 223.63 night')
    bo, bn = {x['b']: x for x in o['branches']}, {x['b']: x for x in n['branches']}
    if not (c(bn['KINP']['costs'], bo['KINP']['costs'] - NIGHT) and all(bn[b] == bo[b] for b in bo if b != 'KINP')): raise ValueError('a branch other than KINP moved')
    co, cn = {x['name']: x for x in o['categories']}, {x['name']: x for x in n['categories']}
    if not (c(cn['Accommodation']['total'], co['Accommodation']['total'] - NIGHT) and all(cn[k] == co[k] for k in co if k != 'Accommodation')): raise ValueError('a category other than accommodation moved')
    gone = [j for j in o['journals'] if j not in [dict(x, account='Installs (as coded)') if x['account'] == JC_ACCT else x for x in n['journals']]]
    if len(gone) != 1 or 'Alfie Harris' not in gone[0]['journal'] or not c(gone[0]['amount'], NIGHT): raise ValueError('expected exactly Alfie Harris\'s 223.63 accrual journal gone: ' + repr(gone)[:200])
    fo, fn = {json.dumps(x[1:]) + '#' + str(o['lines'][x[0]]['what'])[:40] for x in o['facts']}, {json.dumps(x[1:]) + '#' + str(n['lines'][x[0]]['what'])[:40] for x in n['facts']}
    if len(o['facts']) - len(n['facts']) != 1: raise ValueError('expected one fact fewer (his October night)')
    rn = [l for l in n['lines'] if l['what'].startswith('Alfie Harris: 4 nights')]
    if len(rn) != 1 or (rn[0]['oct'], rn[0]['accrue'], rn[0]['nov'], rn[0]['state']) != (0.0, 0, 894.52, 'November forecast'): raise ValueError('Alfie Harris\'s line is not 4 November nights with nothing accrued')
    jc = [l for l in n['lines'] if l['supplier'].startswith('Job Connect')] + [x for x in n['journals'] + n['moves'] if x['account'] == JC_ACCT]
    if len(jc) != 11 or not all(x['account'] == JC_ACCT for x in jc) or 'Installs (as coded)' in json.dumps(n, ensure_ascii=False): raise ValueError('Job Connect\'s account is not Installs – Temp Staff throughout')
    if not n['open'][14].startswith('Alfie Harris: 4 nights, all in November'): raise ValueError('open item 15 is not the v1.21 wording')
    return len(diffs(o, n))


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.79; rebuild and retest')
    old_J = P1279.load('PLF_JSON_OLD', OLD_SHA)
    P1277.PLF_SHA256 = NEW_SHA                   # the v12.77 tie checks, on the new data
    new_J, sha = P1277.pack_data()
    nd = check_delta(old_J, new_J)
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    if text[a:b] != P1279.block(LIVE1279, 'plf1279_src.js', 'plf1279.css', old_J, OLD_SHA, FIND):
        raise ValueError('the live P&L block is not the v12.79 module on pack v1.19')
    text = text[:a] + P1279.block(LIVE1279, 'plf1279_src.js', 'plf1279.css', new_J, NEW_SHA, FIND) + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    found = P1277.FOOTER.findall(text)
    if found != ['v12.79']: raise ValueError('release footer: expected one v12.79 footer, found ' + repr(found))
    text = P1277.FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.80'), text, count=1)
    print('patch_v1280 applied: the P&L on pack v1.21 (data %s; Alfie Harris\'s 5 Oct night off, Job Connect on Installs – Temp Staff; %d data paths, all allowed); footer v12.79 -> v12.80'
          % (NEW_SHA[:12], nd))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
