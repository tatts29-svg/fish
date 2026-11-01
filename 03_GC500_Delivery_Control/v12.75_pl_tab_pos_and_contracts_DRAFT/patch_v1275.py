"""Author: Andrew Fisher. v12.75 - the P&L tab names every PO and every hire contract, and everything ties (pack v1.15).

Andrew, 1 Nov 2026 (this chat): "Please make sure we mentioned purchase order numbers. And hire contract numbers. Everything must talk to
each other. And all add up and match. We have the buisness that have eyes on this p&l billing and we need to ensure everything aligns."

On the live v12.74 page (BASE is its verified SHA-256), this release:
1. replaces the final P&L block (plf1272: its style and script, ids kept) with pack v1.15's data and the v12.74 module, plus
   - on every cost line, the hire contract it is charged on (beside its PO and invoice or receipt);
   - "Revenue by invoice": the 18 invoices, each with its hire contract, the V8s' PO and our POs against it, and the November forecast;
   - "By hire contract": what we charged on each contract and the costs and POs against it, then the costs not tied to one contract;
   - "Every purchase order in the costs": the 27 POs at their amounts in the P&L and every cost with no PO, adding to the job cost;
2. footer v12.74 -> v12.75.

No figure changes: pack v1.15 has v1.14's figures to the cent (audit_pack.py 460/460). The pack data is private and never committed;
this patch holds no figure. It reads PLF_JSON, refuses any file but the reviewed one (PLF_SHA256), checks it ties, and carries it into the
page as it is. Nothing is typed; nothing is written to the record.

    PLF_JSON=<pack dir>/GC500_PL_final.json python3 patch_v1275.py page.html      (in place, on the live v12.74 page)
"""
import hashlib, json, os, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '58695330689cd54cbb1bfa48b9b4a0489ca56398d6c08913a011daf1be635bc4'        # live v12.74, uploaded 1 Nov 2026 12:08 AEST
PLF_SHA256 = '423ccfd86110a83a923ab86083dbc099a14efc3e622d8c4e7e50afde448e238b'  # pack v1.15, record 12727 (audit_pack.py 460/460)
OLD_SHA = '0aa4987d81eb171d22f819e457fabf064098ae4f234922ce0819c6243df898a5'     # pack v1.14, in the live v12.74 block
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
              ('with a PO + no PO = the job cost', c(PT['withPO'] + PT['noPO'], C['total']) and c(PT['total'], C['total']))]
    bad = [n for n, ok in checks if not ok]
    if bad: raise ValueError('the pack data does not tie: ' + ', '.join(bad))
    return J, got


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.74; rebuild and retest')
    J, sha = pack_data()
    js = (HERE / 'plf1275_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'plf1275.css').read_text(encoding='utf-8').rstrip()
    js = sub1(js, '__PLF1272_DATA__', json.dumps(J, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/'), 'the data slot')
    js = sub1(js, '__PLF1272_SHA__', sha, 'the hash slot')
    if '</script' in js.lower() or '</style' in css.lower(): raise ValueError('a closing tag inside the block')
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    old = text[a:b]
    if old.count('<script') != 1 or old.count('<style') != 1 or 'var PLF1272' not in old or 'schedule17' not in old or OLD_SHA not in old or 'purchaseOrders' in old: raise ValueError('the plf1272 block is not the v12.74 one')
    text = text[:a] + '<style id="plf1272-style">\n' + css + '\n</style>\n<script id="plf1272-script">\n' + js + '\n</script>\n' + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    found = FOOTER.findall(text)
    if found != ['v12.74']: raise ValueError('release footer: expected one v12.74 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.75'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1275 applied: the final P&L on pack v1.15 (data %s): every PO and hire contract, and the ties; footer v12.74 -> v12.75' % PLF_SHA256[:12])
