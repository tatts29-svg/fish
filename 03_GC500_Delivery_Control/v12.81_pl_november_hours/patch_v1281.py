"""Author: Andrew Fisher. v12.81: the Costs & P&L tab shows November's hours (1–13 Nov) beside October's, and Job Connect's w/e 18 Oct
as invoiced, on pack v1.24.

On 2 Nov 2026 Andrew sent the Labour journals and Paid hours tables from the live v12.80 tab and asked: "Also can we show what november
is made up of hrs too here". November's labour, to 13 Nov, is counted in October with the labour costs (Andrew, 1 Nov: "We want all
labour costs ... to all fall into october ... from november"), so the October columns stay as they are, "with 1–13 Nov". Each table
gains one column, "of which 1–13 Nov": the part of each person's October hours worked (Labour journals) and paid (Paid hours) on
1–13 Nov. No total, cost, month or branch figure moves.

Andrew then said, the same morning: "For w/e 18th oct its been invoiced". Job Connect's w/e 18 Oct (POs 4667755 and 4668970) is
invoiced, so it is no longer accrued; the invoice amounts are to confirm, so it stays at the running sheet, 6,198.75. The accruals
fall by exactly that (194,852.55 -> 188,653.80); October at month end moves it from accrued to invoiced; no cost moves.

- Pack v1.24 (audit_pack.py 594/594) is pack v1.22 plus two fields on each of the 16 labour journal rows, novInOct and paidNovInOct
  (worked 461.50 h and paid 440.00 h on 1–13 Nov, the job; v1.23), and the w/e 18 Oct week invoiced (v1.24). The patch refuses any
  other data difference, and any money change but the 6,198.75 moving from accrued to invoiced.
- The block's code is the live v12.79/v12.80 code with the two tables changed (plf1281_src.js, plf1281.css, here); the find files are
  the live ones, read from ../v12.79_pl_rehire_pack_v119_LIVE/. The patch checks the live block is v12.80's before it swaps it.
- The release footer, v12.80 -> v12.81.

    PLF_JSON_OLD=<pack v1.22>/GC500_PL_final.json PLF_JSON=<pack v1.24>/GC500_PL_final.json \
      toolchain/build.sh v12.81 v12.81_pl_november_hours/patch_v1281.py
"""
import hashlib, importlib.util, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIVE1279 = HERE.parent / 'v12.79_pl_rehire_pack_v119_LIVE'
BASE = '3f31d69e3de1966e9aee70d198a3f1faacf52faacd5c59abdcea0a1c080a45c8'        # live v12.80, uploaded 2 Nov 2026 04:55 AEST
OLD_SHA = '5029e24ce4ea151bf5a7f7abbaffcb617f15fa54faeabb8a585cfea927a9d9cc'     # pack v1.22, record 12739, in the live v12.80 block
NEW_SHA = '6f57969e000490815a847c2144727305044e034cd0b46cc1fdabdddec1aefca2'     # pack v1.24, record 12739 (audit_pack.py 594/594)
W18 = 6198.75                                                                    # Job Connect w/e 18 Oct, invoiced (amount to confirm)
FIND = ('plf1279_find.js', 'plf1279_find.css')

spec = importlib.util.spec_from_file_location('p1279', LIVE1279 / 'patch_v1279.py')
P1279 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1279)
P1277 = P1279.P1277

ALLOWED = [r'pack', r'labourJournal\[\d+\]\.(novInOct|paidNovInOct)',   # the name, and the two new fields on each journal row (v1.23)
           r'accrue', r'contracts\[\d+\]\.costs\[\d+\]\.status', r'journals\[\d+\]\.(amount|contract|journal|po)', r'labourHireBridge\[\d+\]\.invoice',
           r'lines\[\d+\]\.(accrue|basis|invoice|state|status)', r'monthEnd\.rows\[[01]\]\.oct', r'notTied\[0\]\.po', r'open\[4\]',
           r'purchaseOrders\[\d+\]\.status', r'suppliers\[\d+\]\.accrue']   # v1.24: Job Connect's w/e 18 Oct invoiced


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
    if (o.get('pack'), n.get('pack'), o.get('record'), n.get('record')) != ('v1.22', 'v1.24', 12739, 12739):
        raise ValueError('expected pack v1.22 -> v1.24, both on record 12739')
    d = diffs(o, n)
    bad = [x for x in d if not any(re.fullmatch(p, x) for p in ALLOWED)]
    if bad: raise ValueError('pack v1.23 differs from v1.22 outside the November hours: ' + repr(bad[:12]))
    LJ = n['labourJournal']
    if any('novInOct' in x or 'paidNovInOct' in x for x in o['labourJournal']): raise ValueError('v1.22 already had November fields')
    if not all(isinstance(x.get('novInOct'), (int, float)) and isinstance(x.get('paidNovInOct'), (int, float)) for x in LJ): raise ValueError('a journal row without its November hours')
    if not all(x['novInOct'] <= x['oct'] + 1e-9 and x['paidNovInOct'] <= x['paidOct'] + 1e-9 and x['paidNovInOct'] <= x['novInOct'] + 1e-9 for x in LJ):
        raise ValueError('November hours above October\'s, or paid above worked, on a row')
    tw, tp = round(sum(x['novInOct'] for x in LJ), 2), round(sum(x['paidNovInOct'] for x in LJ), 2)
    if (tw, tp) != (461.5, 440.0): raise ValueError('November hours, the job: %s worked, %s paid; expected 461.50 and 440.00' % (tw, tp))
    # v1.24: only the w/e 18 Oct line, its journal, its POs and the totals that carry its accrual; the money moves by exactly the week
    c = lambda x, y: abs(round(x, 2) - round(y, 2)) < 0.005
    if not (c(n['accrue'], o['accrue'] - W18) and n['costs'] == o['costs'] and n['revenue'] == o['revenue'] and n['difference'] == o['difference']): raise ValueError('the accruals did not fall by exactly the w/e 18 Oct week, or a total moved')
    lc = [i for i, (x, y) in enumerate(zip(o['lines'], n['lines'])) if x != y]
    if len(lc) != 1: raise ValueError('expected exactly one cost line to change: ' + repr(lc))
    lo, ln = o['lines'][lc[0]], n['lines'][lc[0]]
    if not (ln['supplier'].startswith('Job Connect') and ln['what'] == 'Running sheet w/e 18 Oct' and (lo['state'], lo['accrue']) == ('Accrued at 31 Oct', W18) and (ln['state'], ln['status'], ln['accrue']) == ('Invoiced', 'invoiced (amount to confirm)', 0)
            and all(ln[k] == lo[k] for k in ('sep', 'oct', 'nov', 'po', 'branch', 'account', 'category'))): raise ValueError('the changed line is not Job Connect w/e 18 Oct, accrued -> invoiced at the same cost')
    jc = [(x, y) for x, y in zip(o['journals'], n['journals']) if x != y]
    if len(jc) != 1 or not (jc[0][1]['journal'].startswith('Accrual · Job Connect') and c(jc[0][1]['amount'], jc[0][0]['amount'] - W18) and c(jc[0][1]['amount'], 3835.37) and '4667755' not in jc[0][1]['po']): raise ValueError('the Job Connect accrual journal is not w/e 1 Nov alone at 3,835.37')
    mo, mn = {x['state']: x['oct'] for x in o['monthEnd']['rows']}, {x['state']: x['oct'] for x in n['monthEnd']['rows']}
    if not (c(mn['Invoiced'], mo['Invoiced'] + W18) and c(mn['Accrued at 31 Oct'], mo['Accrued at 31 Oct'] - W18) and all(mn[k] == mo[k] for k in mo if k not in ('Invoiced', 'Accrued at 31 Oct')) and n['monthEnd']['oct'] == o['monthEnd']['oct']):
        raise ValueError('October at month end: the week must move from accrued to invoiced and nothing else')
    so = {x['name']: x for x in o['suppliers']}; sn = {x['name']: x for x in n['suppliers']}
    if not all(sn[k] == so[k] if not k.startswith('Job Connect') else (c(sn[k]['accrue'], so[k]['accrue'] - W18) and dict(sn[k], accrue=0) == dict(so[k], accrue=0)) for k in so): raise ValueError('a supplier other than Job Connect moved, or Job Connect by more than the week')
    po = [(x, y) for x, y in zip(o['purchaseOrders'], n['purchaseOrders']) if x != y]
    if sorted(y['po'] for x, y in po) != ['4667755', '4668970'] or not all(y['status'].startswith('invoiced (confirmed 2 Nov 2026)') and dict(y, status='') == dict(x, status='') for x, y in po): raise ValueError('only POs 4667755 and 4668970 may change, to invoiced')
    return len(d)


def block(J, sha):   # the v12.79 block, with this release's code and the live find files
    js = (HERE / 'plf1281_src.js').read_text(encoding='utf-8').rstrip(); css = (HERE / 'plf1281.css').read_text(encoding='utf-8').rstrip()
    fjs = (LIVE1279 / FIND[0]).read_text(encoding='utf-8').rstrip()
    if '__PLF1272_' in fjs or '__PLF1279_' in fjs: raise ValueError('a slot name inside the find file')
    js = P1279.sub1(js, '/*__PLF1279_FIND__*/', fjs, 'the find slot'); css = css + '\n' + (LIVE1279 / FIND[1]).read_text(encoding='utf-8').rstrip()
    js = P1279.sub1(P1279.sub1(js, '__PLF1272_DATA__', P1279.page_data(J), 'the data slot'), '__PLF1272_SHA__', sha, 'the hash slot')
    if '</script' in js.lower() or '</style' in css.lower(): raise ValueError('a closing tag inside the block')
    return '<style id="plf1272-style">\n' + css + '\n</style>\n<script id="plf1272-script">\n' + js + '\n</script>\n'


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.80; rebuild and retest')
    old_J = P1279.load('PLF_JSON_OLD', OLD_SHA)
    P1277.PLF_SHA256 = NEW_SHA                   # the v12.77 tie checks, on the new data
    new_J, sha = P1277.pack_data()
    nd = check_delta(old_J, new_J)
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    if text[a:b] != P1279.block(LIVE1279, 'plf1279_src.js', 'plf1279.css', old_J, OLD_SHA, FIND):
        raise ValueError('the live P&L block is not the v12.79 module on pack v1.22 (v12.80)')
    text = text[:a] + block(new_J, NEW_SHA) + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    found = P1277.FOOTER.findall(text)
    if found != ['v12.80']: raise ValueError('release footer: expected one v12.80 footer, found ' + repr(found))
    text = P1277.FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.81'), text, count=1)
    print('patch_v1281 applied: November\'s hours beside October\'s on the Labour journals and Paid hours tables, and Job Connect w/e 18 Oct invoiced, pack v1.24 (data %s; %d data paths, all allowed); footer v12.80 -> v12.81'
          % (NEW_SHA[:12], nd))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
