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
  week invoiced (v1.24), and Kyle Gover's November off (v1.25, record 12749). The patch holds an exact map of the 36 figures that move
  (each path, what it must be, and by how much) and refuses any other figure moving, any journal row but Kyle Gover's changing, any
  no-PO entry but his w/e 8 Nov going, and any text that still says the w/e 18 Oct amounts are to confirm or that Kyle works in November.
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
NEW_SHA = '10691c10fd5d6f65f4ff490346c11d0697c398750745744b7e2bb00f931189f0'     # pack v1.25, record 12749 (audit_pack.py 598/598)
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


# v1.25: every figure that moves from v1.22, by exactly how much; anything else must not move (the independent check, 2 Nov 2026)
EXPECT = {'accrue': -W18, 'journals[4].amount': -W18, 'lines[15].accrue': -W18, 'suppliers[5].accrue': -W18, 'monthEnd.rows[0].oct': W18, 'monthEnd.rows[1].oct': -W18,
          'branchLines.KINP[4][1]': -K8, 'branches[0].costs': -K8, 'branches[0].difference': K8, 'byAccount[9].holds[0].amount': -K8, 'byAccount[9].total': -K8,
          'categories[4].oct': -K8, 'categories[4].total': -K8, 'costs.oct': -K8, 'costs.total': -K8, 'difference': K8, 'facts[47][3]': -302385,
          'labourCharged.branches[0].installLabourHire': -K8, 'labourCharged.branches[0].left': K8, 'labourCharged.installTotal': -K8, 'labourCharged.leftTotal': K8,
          'labourHireBridge[7].cost': -K8, 'labourHireBridge[7].runningSheet': -K8, 'lines[18].oct': -K8, 'matchTotals.costs': -K8, 'matchTotals.notTied': -K8,
          'monthEnd.novLabourInOct.jobConnect': -K8, 'monthEnd.novLabourInOct.total': -K8, 'monthEnd.oct': -K8, 'monthEnd.rows[3].oct': -K8, 'notTied[0].amount': -K8,
          'poTotals.noPO': -K8, 'poTotals.total': -K8, 'suppliers[5].oct': -K8, 'suppliers[5].total': -K8, 'record': 10}


def nums(a, b, p=''):   # every number that differs between two same-shaped trees (lists of different length are left to their own checks)
    out = {}
    if isinstance(a, dict) and isinstance(b, dict):
        for k in a:
            if k in b: out.update(nums(a[k], b[k], (p + '.' + k) if p else k))
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (u, v) in enumerate(zip(a, b)): out.update(nums(u, v, '%s[%d]' % (p, i)))
    elif isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool) and a != b:
        out[p] = round(b - a, 2)
    return out


def check_delta(o, n):
    if (o.get('pack'), n.get('pack'), o.get('record'), n.get('record')) != ('v1.22', 'v1.25', 12739, 12749):
        raise ValueError('expected pack v1.22 on 12739 -> v1.25 on 12749')
    c = lambda x, y: abs(round(x, 2) - round(y, 2)) < 0.005
    # 1. the positions the map names hold what the map says they hold
    if not (n['branches'][0]['b'] == 'KINP' and n['categories'][4]['name'] == 'Labour hire' and n['byAccount'][9]['code'] == 'Installs – Temp Staff' and n['suppliers'][5]['name'].startswith('Job Connect')
            and n['lines'][15]['what'] == 'Running sheet w/e 18 Oct' and n['lines'][18]['what'] == 'Running sheet w/e 8 Nov' and n['facts'][47][0] == 18 and n['labourHireBridge'][7]['week'] == 'w/e 8 Nov'
            and n['branchLines']['KINP'][4][0].startswith('Labour hire') and n['journals'][4]['journal'].startswith('Accrual · Job Connect') and n['notTied'][0]['what'].startswith('Job Connect')
            and [x['state'] for x in n['monthEnd']['rows'][:4]] == ['Invoiced', 'Accrued at 31 Oct', 'Not accrued: manual accrual candidate', 'November labour, carried in October (not accrued)']
            and n['labourCharged']['branches'][0]['b'] == 'KINP'):
        raise ValueError('a position in the change map does not hold what it should')
    # 2. exactly the mapped figures move, each by exactly its amount (the journal rows' hours and the no-PO list are checked below)
    moved = {k: v for k, v in nums(o, n).items() if not k.startswith(('labourJournal', 'noPO'))}
    if set(moved) != set(EXPECT) or any(not c(moved[k], EXPECT[k]) for k in EXPECT):
        raise ValueError('figures moved outside the map, or by the wrong amount: ' + repr(sorted(set(moved) ^ set(EXPECT))[:8] or [(k, moved[k], EXPECT[k]) for k in EXPECT if not c(moved[k], EXPECT[k])][:8]))
    if n['revenue'] != o['revenue'] or n['monthEnd']['octWithoutNovLabour'] != o['monthEnd']['octWithoutNovLabour']: raise ValueError('revenue or October without November labour moved')
    # 3. the lists: only the no-PO list changes length, losing only Kyle Gover's w/e 8 Nov
    if [k for k in diffs(o, n) if k.endswith(' len') and k != 'noPO len']: raise ValueError('a list other than noPO changed length')
    np_o, np_n = [json.dumps(x, sort_keys=True) for x in o['noPO']], [json.dumps(x, sort_keys=True) for x in n['noPO']]
    gone = [json.loads(x) for x in np_o if x not in np_n]
    if len(np_n) != len(np_o) - 1 or [x for x in np_n if x not in np_o] or len(gone) != 1 or (gone[0]['what'], gone[0]['amount']) != ('Kyle Gover, w/e 8 Nov', K8):
        raise ValueError('the no-PO list: only Kyle Gover\'s w/e 8 Nov (3,023.85) may go, and nothing else may change')
    # 4. the journal rows: every row gains its November hours (v1.23); only Kyle Gover's rows change otherwise (v1.25), by his 2–6 Nov
    LJ, LO = n['labourJournal'], o['labourJournal']
    if len(LJ) != len(LO) or any('novInOct' in x or 'paidNovInOct' in x for x in LO): raise ValueError('the journal rows changed shape')
    for x, y in zip(LO, LJ):
        z = {k: v for k, v in y.items() if k not in ('novInOct', 'paidNovInOct')}
        if x['who'] != 'Kyle Gover' and z != x: raise ValueError('a journal row other than Kyle Gover\'s changed: ' + x['who'])
        if x['who'] == 'Kyle Gover' and x['branch'] == 'KINP' and not (c(x['oct'] - y['oct'], 52.5) and c(x['paidOct'] - y['paidOct'], 50) and c(x['labourHire'] - y['labourHire'], K8)
                                                                       and c(x['normal'] - y['normal'], 38) and c(x['x15'] - y['x15'], 10) and c(x['x2'] - y['x2'], 2)):
            raise ValueError('Kyle Gover\'s KINP row did not fall by exactly his 2–6 Nov (52.5 worked, 50 paid, 3,023.85)')
        if x['who'] == 'Kyle Gover' and x['branch'] != 'KINP' and z != x: raise ValueError('Kyle Gover\'s ' + x['branch'] + ' row changed')
        if not (isinstance(y.get('novInOct'), (int, float)) and isinstance(y.get('paidNovInOct'), (int, float)) and y['novInOct'] <= y['oct'] + 1e-9 and y['paidNovInOct'] <= y['paidOct'] + 1e-9 and y['paidNovInOct'] <= y['novInOct'] + 1e-9):
            raise ValueError('a journal row\'s November hours do not sit inside October\'s: ' + x['who'])
    if any(y['novInOct'] or y['paidNovInOct'] for y in LJ if y['who'] == 'Kyle Gover'): raise ValueError('Kyle Gover still has November hours')
    if (round(sum(x['novInOct'] for x in LJ), 2), round(sum(x['paidNovInOct'] for x in LJ), 2)) != (409.0, 390.0): raise ValueError('November hours, the job: expected 409.00 worked and 390.00 paid')
    # 5. the w/e 18 Oct and w/e 8 Nov lines, and the words
    l15, l18 = n['lines'][15], n['lines'][18]
    if not ((l15['state'], l15['status'], l15['accrue'], l15['oct']) == ('Invoiced', 'invoiced', 0, W18) and 'Daniel Gough 2,539.92, Eric Lucian 634.98, Kyle Gover 3,023.85' in l15['invoice']):
        raise ValueError('the w/e 18 Oct line is not invoiced at 6,198.75 with its three people')
    if not (c(l18['oct'], 3052.60) and 'Kyle Gover has no November work' in l18['invoice']): raise ValueError('w/e 8 Nov is not Daniel Gough\'s PO alone, 3,052.60')
    blob = json.dumps(n, ensure_ascii=False)
    if re.search(r'amounts? (are )?to confirm|amount to confirm', blob): raise ValueError('text still says an amount is to confirm (the w/e 18 Oct wording)')
    if 'Kyle Gover’s w/e 8 Nov' in blob or 'none yet (Kyle)' in blob or 'Kyle: not invoiced' in blob: raise ValueError('text still has Kyle Gover working w/e 8 Nov')
    return len(diffs(o, n))


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
