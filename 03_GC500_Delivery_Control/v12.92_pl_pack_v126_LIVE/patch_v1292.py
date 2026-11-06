"""Author: Andrew Fisher. v12.92: the Costs & P&L tab on pack v1.26 (Andrew, 3 Nov 2026: "P&L Tab to 1.26").

Pack v1.26 (3 Nov 2026, record 12749, audit_pack.py 604/604) is pack v1.25 with October left as accrued and the new items in
November (Andrew, 3 Nov: "Everything we done in the P&L should be all covered for what we did. Anything now is invoiced or charged in
November"): Advanced's event-week sheet over the October accrual, 9,602.30 (PO 4647522, 80,762.00 with the 36766/36768 correction),
36784 600.00 and the demob week 1 forecast 3,675.00 (ESTIMATE), all STPS, November; and 9968955 L143, 6,246.00, as November revenue
(KINP). Costs +13,877.30, revenue +6,246.00, difference -7,631.30; October, the accruals and every other branch, category and
supplier figure stay as v1.25.

- The tab's code is the live v12.81 module (../v12.81_pl_november_hours_LIVE/plf1281_src.js, plf1281.css and the v12.79 find files);
  only its data and hash change. The patch checks the live block is exactly v12.81's on pack v1.25 before it swaps it.
- check_delta holds the exact map of the 27 figures that move (each path and by how much) and refuses any other figure moving, any
  list but the six named changing length, any old item going from those lists (the facts are compared with their line numbers
  following the three new lines), any new item but the six Advanced and L143 entries, and any text change outside the seven paths.
- The release footer moves from the live version to v12.92.

    PLF_JSON_OLD=<pack v1.25>/GC500_PL_final.json PLF_JSON=<pack v1.26>/GC500_PL_final.json \
      toolchain/build.sh v12.92 v12.92_pl_pack_v126_DRAFT/patch_v1292.py
"""
import hashlib, importlib.util, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
L1281 = HERE.parent / 'v12.81_pl_november_hours_LIVE'
BASE = {'ec56ffe5ef53670d286db566bd968366dfc366ad25edf6f2aa753076b10fc3e8': 'v12.90'}   # live v12.90 (Codex, Still on site), 3 Nov 2026 13:31 AEST
OLD_SHA = '10691c10fd5d6f65f4ff490346c11d0697c398750745744b7e2bb00f931189f0'     # pack v1.25, record 12749, in the live v12.81 block
NEW_SHA = 'f7ace6ffe093e611804da4d900ccbbbb374a2100fedd03520dbe24a779aba715'     # pack v1.26, record 12749 (audit_pack.py 604/604)
NOV_COSTS, L143 = 13877.30, 6246.00

spec = importlib.util.spec_from_file_location('p1281', L1281 / 'patch_v1281.py')
P1281 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1281)
P1279, P1277 = P1281.P1279, P1281.P1277

EXPECT = {'branches[0].difference': L143, 'branches[0].novForecast': L143, 'branches[0].revenue': L143,
          'branches[1].costs': NOV_COSTS, 'branches[1].difference': -NOV_COSTS,
          'byAccount[1].holds[0].amount': 11823.30, 'byAccount[1].total': 11823.30, 'byAccount[2].holds[0].amount': 2054.00, 'byAccount[2].total': 2054.00,
          'categories[0].nov': NOV_COSTS, 'categories[0].total': NOV_COSTS, 'categoryGroups[0].nov': NOV_COSTS, 'categoryGroups[0].total': NOV_COSTS,
          'contracts[13].costTotal': NOV_COSTS, 'costs.nov': NOV_COSTS, 'costs.total': NOV_COSTS, 'difference': L143 - NOV_COSTS,
          'matchTotals.costs': NOV_COSTS, 'matchTotals.tied': NOV_COSTS, 'poTotals.total': NOV_COSTS, 'poTotals.withPO': NOV_COSTS,
          'purchaseOrders[6].amount': 9602.30, 'purchaseOrders[7].amount': 4275.00, 'revenue.novForecast': L143, 'revenue.total': L143,
          'suppliers[0].nov': NOV_COSTS, 'suppliers[0].total': NOV_COSTS}
TEXT = {'open[0]', 'open[1]', 'open[16]', 'pack', 'purchaseOrders[6].status', 'purchaseOrders[6].what', 'purchaseOrders[7].what'}
LISTS = {'lines': 3, 'branchLines.STPS': 3, 'contracts[13].costs': 3, 'novForecastLines': 1, 'revFacts': 1, 'facts': 3}
J = lambda x: json.dumps(x, sort_keys=True, ensure_ascii=False)


def at(d, p):
    for part in re.findall(r'[^.\[\]]+|\[\d+\]', p): d = d[int(part[1:-1])] if part.startswith('[') else d[part]
    return d


def check_delta(o, n):
    if (o.get('pack'), n.get('pack'), o.get('record'), n.get('record')) != ('v1.25', 'v1.26', 12749, 12749):
        raise ValueError('expected pack v1.25 -> v1.26, both on record 12749')
    c = lambda x, y: abs(round(x, 2) - round(y, 2)) < 0.005
    # 1. the positions the map names hold what it says
    if not ([b['b'] for b in n['branches']] == ['KINP', 'STPS', 'NVAC', 'MEAD'] and n['categories'][0]['name'] == 'Rehire – fencing'
            and n['suppliers'][0]['name'] == 'Advanced Temporary Fencing' and [x['code'] for x in n['byAccount'][1:3]] == ['2126', '2142']
            and n['contracts'][13]['contract'] == '9990776' and str(n['purchaseOrders'][6]['po']).startswith('4647522')
            and str(n['purchaseOrders'][7]['po']).startswith('4647523')):
        raise ValueError('a position in the change map does not hold what it should')
    # 2. exactly the mapped figures move, by exactly their amounts
    moved = P1281.nums(o, n)
    if set(moved) != set(EXPECT) or any(not c(moved[k], EXPECT[k]) for k in EXPECT):
        raise ValueError('figures moved outside the map or by the wrong amount: %r' % (sorted(set(moved) ^ set(EXPECT))[:8] or [(k, moved[k], EXPECT[k]) for k in EXPECT if not c(moved[k], EXPECT[k])][:8]))
    if not c(n['costs']['oct'], o['costs']['oct']) or not c(n['costs']['sep'], o['costs']['sep']) or J(n['monthEnd']) != J(o['monthEnd']) or not c(n['accrue'], o['accrue']):
        raise ValueError('September, October, the month end or the accruals moved')
    # 3. the lists: only the six named grow, by exactly their count, losing nothing
    lens = sorted(k[:-4] for k in P1281.diffs(o, n) if k.endswith(' len'))
    if lens != sorted(LISTS): raise ValueError('lists changed length: %r' % lens)
    for p, k in LISTS.items():
        a, b = at(o, p), at(n, p)
        if len(b) - len(a) != k: raise ValueError(p + ' did not grow by exactly %d' % k)
        if p == 'facts': continue
        A, B = [J(x) for x in a], [J(x) for x in b]
        if any(x not in B for x in A): raise ValueError('an item left ' + p)
    old_l, new_l = [J(x) for x in o['lines']], [J(x) for x in n['lines']]
    remap = {i: new_l.index(s) for i, s in enumerate(old_l)}
    added = [i for i in range(len(new_l)) if i not in remap.values()]
    adds = [n['lines'][i] for i in added]
    if not (len(adds) == 3 and all(x['branch'] == 'STPS' and x['category'] == 'Rehire – fencing' and x['supplier'].startswith('Advanced') and x['sep'] == 0 and x['oct'] == 0 and x['accrue'] == 0 for x in adds)
            and sorted(round(x['nov'], 2) for x in adds) == [600.00, 3675.00, 9602.30]):
        raise ValueError('the three new lines are not Advanced\'s November 9,602.30, 600.00 and 3,675.00 on STPS')
    old_f = sorted(J([remap[f[0]]] + f[1:]) for f in o['facts']); new_f = [J(f) for f in n['facts']]
    rest = list(new_f)
    for f in old_f:
        if f not in rest: raise ValueError('a fact left (after the line renumbering): ' + f)
        rest.remove(f)
    if sorted(rest) != sorted(J([i, 'STPS', 'Nov', round(x['nov'] * 100), 0]) for i, x in zip(added, adds)): raise ValueError('the new facts are not the three new lines\' November cents')
    nf = [x for x in n['novForecastLines'] if J(x) not in [J(y) for y in o['novForecastLines']]]
    if not (len(nf) == 1 and (nf[0]['contract'], nf[0]['line'], nf[0]['branch'], nf[0]['amount']) == ('9968955', 'L143', 'KINP', L143)): raise ValueError('the new November revenue line is not 9968955 L143, 6,246.00, KINP')
    rf = [x for x in n['revFacts'] if J(x) not in [J(y) for y in o['revFacts']]]
    if rf != [['November forecast, 9968955 L143', 'KINP', 'Nov', 624600]]: raise ValueError('the new revenue fact is not L143\'s 624,600 cents')
    if sorted(round(x[1], 2) for x in n['branchLines']['STPS'] if J(x) not in [J(y) for y in o['branchLines']['STPS']]) != [600.00, 3675.00, 9602.30]: raise ValueError('STPS branch lines')
    if sorted(round(x['amount'], 2) for x in n['contracts'][13]['costs'] if J(x) not in [J(y) for y in o['contracts'][13]['costs']]) != [600.00, 3675.00, 9602.30]: raise ValueError('9990776 contract costs')
    # 4. the text: only the seven paths change
    other = {k for k in P1281.diffs(o, n) if not k.endswith(' len') and k not in moved and not any(k.startswith(l + '[') for l in LISTS)}
    if other != TEXT: raise ValueError('text changed outside the map: %r' % sorted(other ^ TEXT))
    blob = json.dumps(n, ensure_ascii=False)
    if '80,762.00' not in n['purchaseOrders'][6]['what'] or 'L143' in n['open'][16]: raise ValueError('the PO 4647522 or possible-extra-revenue wording')
    if re.search(r'\(Andrew,|\bruling\b|\bCodex\b|\bClaude\b', blob): raise ValueError('the data carries a name or word the pack never shows')
    return len(P1281.diffs(o, n))


def patch(text):
    base = hashlib.sha256(text.encode('utf-8')).hexdigest()
    if base not in BASE: raise ValueError('Live base is not a verified page for this release; rebuild and retest')
    old_J = P1279.load('PLF_JSON_OLD', OLD_SHA)
    P1277.PLF_SHA256 = NEW_SHA                   # the v12.77 tie checks, on the new data
    new_J, sha = P1277.pack_data()
    nd = check_delta(old_J, new_J)
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    if text[a:b] != P1281.block(old_J, OLD_SHA): raise ValueError('the live P&L block is not the v12.81 module on pack v1.25')
    text = text[:a] + P1281.block(new_J, NEW_SHA) + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    found = P1277.FOOTER.findall(text)
    if found != [BASE[base]]: raise ValueError('release footer: expected one %s footer, found %r' % (BASE[base], found))
    text = P1277.FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.92'), text, count=1)
    print('patch_v1292 applied: the P&L tab on pack v1.26 (data %s; %d data paths checked); footer %s -> v12.92' % (NEW_SHA[:12], nd, BASE[base]))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
