"""Author: Andrew Fisher. v12.81: the Costs & P&L tab shows November's hours (1–13 Nov) beside October's, and Job Connect's w/e 18 Oct
as invoiced, and Kyle Gover's November shifts off, on pack v1.25.

On 2 Nov 2026 Andrew sent the Labour journals and Paid hours tables from the live v12.80 tab and asked: "Also can we show what november
is made up of hrs too here". November's labour, to 13 Nov, is counted in October with the labour costs (Andrew, 1 Nov: "We want all
labour costs ... to all fall into october ... from november"), so the October columns stay as they are, "with 1–13 Nov". Each table
gains one column, "of which 1–13 Nov": the part of each person's October hours worked (Labour journals) and paid (Paid hours) on
1–13 Nov. No total, cost, month or branch figure moves.

Andrew then said, the same morning: "For w/e 18th oct its been invoiced". Job Connect's w/e 18 Oct (POs 4667755 and 4668970) is
invoiced, so it is no longer accrued; Andrew: "work off his hrs worked and hrly rate", so it is taken at each person's hours and
hourly rate on the running sheet, 6,198.75. The accruals fall by exactly that (194,852.55 -> 188,653.80); October at month end moves
it from accrued to invoiced; no cost moves.

And: "Kyle wont be doing any works in november". His 2–6 Nov shifts came off the record (12739 -> 12749,
../record_02Nov2026_kyle_november_off/). His w/e 8 Nov on the running sheet, 3,023.85, is no longer a cost; November's labour is in
October, so October and the job each fall by exactly that, on KINP, labour hire; the accruals do not move.

- Pack v1.25 is pack v1.22 plus two fields on each of the 16 labour journal rows, novInOct and paidNovInOct (v1.23), the w/e 18 Oct
  week invoiced (v1.24), and Kyle Gover's November off (v1.25, record 12749). The patch refuses any money change that is not exactly
  the 6,198.75 accrual or Kyle's 3,023.85, any branch but KINP moving, any category but labour hire, and any journal row but Kyle's.
- The block's code is the live v12.79/v12.80 code with the two tables changed (plf1281_src.js, plf1281.css, here); the find files are
  the live ones, read from ../v12.79_pl_rehire_pack_v119_LIVE/. The patch checks the live block is v12.80's before it swaps it.
- The release footer, v12.80 -> v12.81.

    PLF_JSON_OLD=<pack v1.22>/GC500_PL_final.json PLF_JSON=<pack v1.25>/GC500_PL_final.json \
      toolchain/build.sh v12.81 v12.81_pl_november_hours/patch_v1281.py
"""
import hashlib, importlib.util, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIVE1279 = HERE.parent / 'v12.79_pl_rehire_pack_v119_LIVE'
BASE = '3f31d69e3de1966e9aee70d198a3f1faacf52faacd5c59abdcea0a1c080a45c8'        # live v12.80, uploaded 2 Nov 2026 04:55 AEST
OLD_SHA = '5029e24ce4ea151bf5a7f7abbaffcb617f15fa54faeabb8a585cfea927a9d9cc'     # pack v1.22, record 12739, in the live v12.80 block
NEW_SHA = '__V125__'     # pack v1.25, record 12749
W18 = 6198.75                                                                    # Job Connect w/e 18 Oct, invoiced, at the running sheet's hours and rates
K8 = 3023.85                                                                     # Kyle Gover's w/e 8 Nov on the running sheet (off the record, 12749)
FIND = ('plf1279_find.js', 'plf1279_find.css')

spec = importlib.util.spec_from_file_location('p1279', LIVE1279 / 'patch_v1279.py')
P1279 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1279)
P1277 = P1279.P1277



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
    if (o.get('pack'), n.get('pack'), o.get('record'), n.get('record')) != ('v1.22', 'v1.25', 12739, 12749):
        raise ValueError('expected pack v1.22 on 12739 -> v1.25 on 12749')
    c = lambda x, y: abs(round(x, 2) - round(y, 2)) < 0.005
    d = diffs(o, n)
    def at(obj, path):   # a value by its diff path, e.g. 'byAccount[7].holds[0].amount'
        for k, i in re.findall(r'([^.\[\]]+)|\[(\d+)\]', path):
            obj = obj[int(i)] if i else obj[k]
        return obj
    # every money figure that moved (outside the journal rows' hours, the facts, the journals and the text) moved by exactly one of the two
    for x in d:
        if x.endswith(' len') or x.startswith(('labourJournal', 'facts', 'journals', 'open', 'record', 'pack', 'source')): continue
        u, v = at(o, x), at(n, x)
        if isinstance(u, (int, float)) and isinstance(v, (int, float)) and not isinstance(u, bool):
            dv = abs(round(v - u, 2))
            if not any(abs(dv - k) < 0.005 for k in (W18, K8)): raise ValueError('%s moved by %s, not by the w/e 18 Oct accrual or Kyle Gover\'s week' % (x, round(v - u, 2)))
    if n['revenue'] != o['revenue']: raise ValueError('revenue moved')
    if not (c(n['accrue'], o['accrue'] - W18) and c(n['costs']['total'], o['costs']['total'] - K8) and c(n['costs']['oct'], o['costs']['oct'] - K8)
            and n['costs']['sep'] == o['costs']['sep'] and n['costs']['nov'] == o['costs']['nov'] and c(n['difference'], o['difference'] + K8)):
        raise ValueError('the totals: accruals must fall by 6,198.75, the job and October by 3,023.85, the difference rise by 3,023.85')
    bo, bn = {x['b']: x for x in o['branches']}, {x['b']: x for x in n['branches']}
    if not (c(bn['KINP']['costs'], bo['KINP']['costs'] - K8) and all(bn[b] == bo[b] for b in bo if b != 'KINP')): raise ValueError('a branch other than KINP moved')
    co, cn = {x['name']: x for x in o['categories']}, {x['name']: x for x in n['categories']}
    if not (c(cn['Labour hire']['total'], co['Labour hire']['total'] - K8) and all(cn[k] == co[k] for k in co if k != 'Labour hire')): raise ValueError('a category other than labour hire moved')
    # the journal rows: every row gains its November hours (v1.23); only Kyle Gover's rows change otherwise (v1.25)
    LJ, LO = n['labourJournal'], o['labourJournal']
    if len(LJ) != len(LO) or any('novInOct' in x or 'paidNovInOct' in x for x in LO): raise ValueError('the journal rows changed shape')
    for x, y in zip(LO, LJ):
        z = {k: v for k, v in y.items() if k not in ('novInOct', 'paidNovInOct')}
        if x['who'] != 'Kyle Gover' and z != x: raise ValueError('a journal row other than Kyle Gover\'s changed: ' + x['who'])
        if not (isinstance(y.get('novInOct'), (int, float)) and isinstance(y.get('paidNovInOct'), (int, float)) and y['novInOct'] <= y['oct'] + 1e-9 and y['paidNovInOct'] <= y['paidOct'] + 1e-9 and y['paidNovInOct'] <= y['novInOct'] + 1e-9):
            raise ValueError('a journal row\'s November hours do not sit inside October\'s: ' + x['who'])
    kn = [y for y in LJ if y['who'] == 'Kyle Gover']
    if not kn or any(y['novInOct'] or y['paidNovInOct'] for y in kn): raise ValueError('Kyle Gover still has November hours')
    tw, tp = round(sum(x['novInOct'] for x in LJ), 2), round(sum(x['paidNovInOct'] for x in LJ), 2)
    if (tw, tp) != (409.0, 390.0): raise ValueError('November hours, the job: %s worked, %s paid; expected 409.00 and 390.00' % (tw, tp))
    # the w/e 18 Oct line: accrued -> invoiced at the same cost; the Job Connect accrual journal is w/e 1 Nov alone
    l18 = [(x, y) for x, y in zip(o['lines'], n['lines']) if y['what'] == 'Running sheet w/e 18 Oct' and y['supplier'].startswith('Job Connect')]
    if len(l18) != 1 or not ((l18[0][0]['state'], l18[0][0]['accrue']) == ('Accrued at 31 Oct', W18) and (l18[0][1]['state'], l18[0][1]['status'], l18[0][1]['accrue']) == ('Invoiced', 'invoiced', 0) and l18[0][1]['oct'] == l18[0][0]['oct'] == W18):
        raise ValueError('the w/e 18 Oct line is not accrued -> invoiced at 6,198.75')
    l8 = [(x, y) for x, y in zip(o['lines'], n['lines']) if y['what'] == 'Running sheet w/e 8 Nov' and y['supplier'].startswith('Job Connect')]
    if len(l8) != 1 or not c(l8[0][1]['oct'], l8[0][0]['oct'] - K8) or not c(l8[0][1]['oct'], 3052.60): raise ValueError('w/e 8 Nov is not Daniel Gough\'s PO alone, 3,052.60')
    changed = [i for i, (x, y) in enumerate(zip(o['lines'], n['lines'])) if x != y]
    if len(o['lines']) != len(n['lines']) or sorted(n['lines'][i]['what'] for i in changed) != ['Running sheet w/e 18 Oct', 'Running sheet w/e 8 Nov']: raise ValueError('a cost line other than the two Job Connect weeks changed')
    jc = [(x, y) for x, y in zip(o['journals'], n['journals']) if x != y]
    if len(o['journals']) != len(n['journals']) or len(jc) != 1 or not (jc[0][1]['journal'].startswith('Accrual · Job Connect') and c(jc[0][1]['amount'], 3835.37) and '4667755' not in jc[0][1]['po']): raise ValueError('the Job Connect accrual journal is not w/e 1 Nov alone at 3,835.37')
    mo, mn = {x['state']: x['oct'] for x in o['monthEnd']['rows']}, {x['state']: x['oct'] for x in n['monthEnd']['rows']}
    nl = 'November labour, carried in October (not accrued)'
    if not (c(mn['Invoiced'], mo['Invoiced'] + W18) and c(mn['Accrued at 31 Oct'], mo['Accrued at 31 Oct'] - W18) and c(mn[nl], mo[nl] - K8) and all(mn[k] == mo[k] for k in mo if k not in ('Invoiced', 'Accrued at 31 Oct', nl))):
        raise ValueError('October at month end: only the w/e 18 Oct move and Kyle Gover\'s week may change')
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
    print('patch_v1281 applied: November\'s hours beside October\'s on the Labour journals and Paid hours tables, Job Connect w/e 18 Oct invoiced, Kyle Gover\'s November off; pack v1.25 (data %s; %d data paths checked); footer v12.80 -> v12.81'
          % (NEW_SHA[:12], nd))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
