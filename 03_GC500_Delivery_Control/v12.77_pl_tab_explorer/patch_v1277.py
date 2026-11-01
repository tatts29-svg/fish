"""Author: Andrew Fisher. v12.77 - find in the P&L: a category, branch and month filter and a search; the labour journals (pack v1.17).

Andrew, 1 Nov 2026 (this chat): "Make sure the P&l has a professional feel. And search function that makes sense. If you want to search
by category you can or by branch. Or by month have these options available. And its accurate to the cent. And we need to know labour
where everyone needs to be jornled to ... No stone unturned the finance want 0 mistakes and wrong numbera ... And layout is to be clean
and tidy". On the live v12.76 page (BASE is its verified SHA-256), this release replaces the P&L block (plf1272: its style and script,
ids kept) with pack v1.17's data and the v12.77 module:
1. "Find in the P&L", under the tiles: Category (the pack's ten), Branch (KINP, STPS, NVAC, MEAD), Month (job end, September, October
   with November's labour, November forecast) and a search (supplier, PO, hire contract, invoice, person), with Clear. Revenue, costs
   and the difference for the choice, each a sum in whole cents of the pack's own parts (DATA.facts: each cost line by branch and month;
   DATA.revFacts: each invoice and the November forecast), which the pack's build and audit_pack.py prove add to every total it prints;
   by category with no category or search (each opens its lines), else the matching cost lines, and the labour journals for a branch,
   a search or the Labour hire / Salary categories. Screen only: the print is unchanged.
2. Every cost line names its category.
3. A fold "Labour journals: where everyone's hours go": each person and type, home branch, the branch the hours are journaled to (and
   the contract outside KINP), September and October hours (November's, to 13 Nov, in October), labour hire $ (the running sheet's),
   hours by branch, and the labour hire bridge: the running sheet beside the costs, week by week, to the cent.
4. Footer v12.76 -> v12.77.

No figure changes: pack v1.17 has v1.16's figures to the cent (audit_pack.py 542/542). The pack data is private and never committed;
this patch holds no figure. It reads PLF_JSON, refuses any file but the reviewed one (PLF_SHA256), checks it ties, and carries it into
the page as it is. Nothing is typed; nothing is written to the record.

    PLF_JSON=<pack dir>/GC500_PL_final.json python3 patch_v1277.py page.html      (in place, on the live v12.76 page)
"""
import hashlib, json, os, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '30ab13155c21c7284cde18a4d9752fad7b07cb3d703114948162833d62d9fcc9'        # live v12.76, uploaded 1 Nov 2026 14:16 AEST
PLF_SHA256 = 'aa6cb02a0ca1780339058b40e90bf42b1039075cce8b145d2d5ac40c1cc9f18a'  # pack v1.18, record 12727 (audit_pack.py 545/545)
OLD_SHA = '797f99b9be5a98bf0dbd778e7a1b5f812c6c14b8b23d444d0833a5e34ad2e253'     # pack v1.16, in the live v12.76 block
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")


def sub1(text, old, new, what):
    n = text.count(old)
    if n != 1: raise ValueError('%s: expected the anchor once, found %d: %r' % (what, n, old[:80]))
    return text.replace(old, new)


def pack_data():
    src = os.environ.get('PLF_JSON')
    if not src: raise ValueError('PLF_JSON must name the final P&L pack data (GC500_PL_final.json)')
    raw = Path(src).read_bytes(); got = hashlib.sha256(raw).hexdigest()
    if got != PLF_SHA256: raise ValueError('the pack data is %s, not the reviewed %s - rebuild the pack, re-run audit_pack.py and pin the new hash' % (got, PLF_SHA256))
    J = json.loads(raw.decode('utf-8'))
    c = lambda a, b: abs(round(a, 2) - round(b, 2)) < 0.005
    R, C, L, S7, MT, PT = J['revenue'], J['costs'], J['labourCharged'], J['schedule17'], J['matchTotals'], J['poTotals']
    checks = [('revenue = invoices + forecast', c(R['total'], R['invoices'] + R['novForecast'])),
              ('costs = Sep + Oct + Nov', c(C['total'], C['sep'] + C['oct'] + C['nov'])),
              ('difference = revenue - costs', c(J['difference'], R['total'] - C['total'])),
              ('branches add to the costs', c(sum(b['costs'] for b in J['branches']), C['total'])),
              ('suppliers add to the costs', c(sum(s['total'] for s in J['suppliers']), C['total'])),
              ('lines add to the costs by month', all(c(sum(l[m] for l in J['lines']), C[m]) for m in ('sep', 'oct', 'nov'))),
              ('journals add to the accruals', c(sum(j['amount'] for j in J['journals']), J['accrue'])),
              ('labour lines add to labour charged', c(sum(x['amount'] for x in L['lines']), L['total'])),
              ('labour charged by branch adds up', c(sum(b['charged'] for b in L['branches']), L['total'])),
              ('left = charged - labour hire, each branch', all(c(b['left'], b['charged'] - b['installLabourHire']) for b in L['branches'])),
              ('labour line count', sum(b['lines'] for b in L['branches']) == len(L['lines'])),
              ('Schedule 17: net = figures less the forecasts they replace', c(S7['net'], S7['added'] - S7['forecastsReplaced'])),
              ('Schedule 17: the changes add to the net', c(sum(x['change'] for x in S7['changes']), S7['net'])),
              ('Schedule 17: the changes by branch add to the net', c(sum(S7['byBranch'].values()), S7['net'])),
              ('every cost line names its PO (or none) and its hire contract', all(str(l['po']).strip() and str(l['contract']).strip() for l in J['lines'])),
              ('the invoices add to the 18-invoice revenue', c(sum(x['ex'] for x in J['invoices']), R['invoices']) and len(J['invoices']) == 18),
              ('every invoice names its hire contract and the V8s PO', all(x['contract'] and x['customerPO'] for x in J['invoices'])),
              ('the forecast lines add to the November forecast', c(sum(x['amount'] for x in J['novForecastLines']), R['novForecast'])),
              ('the contracts carry the invoices', c(sum(x['revenue'] for x in J['contracts']), R['invoices']) and c(MT['invoices'], R['invoices'])),
              ('each contract: its costs add to its total', all(c(sum(y['amount'] or 0 for y in x['costs']), x['costTotal']) for x in J['contracts'])),
              ('tied + not tied = the job cost', c(sum(x['costTotal'] for x in J['contracts']) + sum(x['amount'] for x in J['notTied']), C['total']) and c(MT['costs'], C['total'])),
              ('the POs add to their total', c(sum(x['amount'] for x in J['purchaseOrders']), PT['withPO']) and PT['count'] == len(J['purchaseOrders'])),
              ('the costs with no PO add to their total', c(sum(x['amount'] for x in J['noPO']), PT['noPO'])),
              ('with a PO + no PO = the job cost', c(PT['withPO'] + PT['noPO'], C['total']) and c(PT['total'], C['total'])),
              # v1.17: the parts behind the finder, and the labour journals
              ('every cost line has a category, and the categories add to the costs', all(l.get('category') for l in J['lines']) and c(sum(x['total'] for x in J['categories']), C['total'])),
              ('the parts add to the costs, each month and each branch, in whole cents', sum(f[3] for f in J['facts']) == round(C['total'] * 100) and all(sum(f[3] for f in J['facts'] if f[2] == m.capitalize()) == round(C[m] * 100) for m in ('sep', 'oct', 'nov')) and all(sum(f[3] for f in J['facts'] if f[1] == b['b']) == round(b['costs'] * 100) for b in J['branches'])),
              ('each line\'s parts add to its months', all(sum(f[3] for f in J['facts'] if f[0] == i and f[2] == m.capitalize()) == round(l[m] * 100) for i, l in enumerate(J['lines']) for m in ('sep', 'oct', 'nov'))),
              ('the revenue parts add to the revenue and each branch\'s', sum(x[3] for x in J['revFacts']) == round(R['total'] * 100) and all(sum(x[3] for x in J['revFacts'] if x[1] == b['b']) == round(b['revenue'] * 100) for b in J['branches'])),
              ('the labour hire bridge: running sheet less costs, each week and in total; the costs = the Labour hire category; the running sheet = the journals\' labour hire', all(c(x['difference'], x['runningSheet'] - x['cost']) for x in J['labourHireBridge']) and c(sum(x['cost'] for x in J['labourHireBridge']), [x['total'] for x in J['categories'] if x['name'] == 'Labour hire'][0]) and c(sum(x['runningSheet'] for x in J['labourHireBridge']), sum(x['labourHire'] for x in J['labourJournal']))),
              ('every labour journal row has its kind', all(x.get('kind') in ('Coates wages', 'Salary', 'Labour hire') for x in J['labourJournal']))]
    bad = [n for n, ok in checks if not ok]
    if bad: raise ValueError('the pack data does not tie: ' + ', '.join(bad))
    return J, got


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.76; rebuild and retest')
    J, sha = pack_data()
    js = (HERE / 'plf1277_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'plf1277.css').read_text(encoding='utf-8').rstrip()
    data = json.dumps(J, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/')
    # the labour journals name each person (a who-field: toolchain/scrub_attributions.py keeps who-fields on the record's data, but reads this
    # block as code); the name is written with a JSON escape so the journal row keeps it, and it may appear nowhere else in the data
    if data.count('Andrew Fisher') != data.count('"who":"Andrew Fisher"'): raise ValueError('the name is in the pack data outside a who-field')
    data = data.replace('"who":"Andrew Fisher"', '"who":"Andrew\\u0020Fisher"')
    js = sub1(js, '__PLF1272_DATA__', data, 'the data slot')
    js = sub1(js, '__PLF1272_SHA__', sha, 'the hash slot')
    if '</script' in js.lower() or '</style' in css.lower(): raise ValueError('a closing tag inside the block')
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    old = text[a:b]
    if old.count('<script') != 1 or old.count('<style') != 1 or 'var PLF1272' not in old or 'JOB POSITION' not in old or OLD_SHA not in old or 'plx-cat' in old: raise ValueError('the plf1272 block is not the v12.76 one')
    text = text[:a] + '<style id="plf1272-style">\n' + css + '\n</style>\n<script id="plf1272-script">\n' + js + '\n</script>\n' + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    if 'body:has(#pane-costs.on) #ts1053-strip' not in text: raise ValueError('the live page has lost v12.76\'s strip rule')
    found = FOOTER.findall(text)
    if found != ['v12.76']: raise ValueError('release footer: expected one v12.76 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.77'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1277 applied: find in the P&L (category, branch, month, search) and the labour journals, on pack v1.17 (data %s); footer v12.76 -> v12.77' % PLF_SHA256[:12])
