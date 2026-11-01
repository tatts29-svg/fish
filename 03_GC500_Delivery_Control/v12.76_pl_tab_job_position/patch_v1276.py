"""Author: Andrew Fisher. v12.76 - the P&L tab as the dated job position, and the print-edge rule printed whole (pack v1.16).

The independent recheck of pack v1.15 and live v12.75 (review_31Oct2026_pl_independent/PACK_v115_RECHECK.md, 1 Nov 2026) asked for
wording, not figures (item 4), and for the twin-steer rule down the edge of the paper to print whole (item 6). On the live v12.75 page
(BASE is its verified SHA-256), this release:
1. replaces the P&L block (plf1272: its style and script, ids kept) with pack v1.16's data and the v12.76 module:
   - the heading is the job position at 31 Oct 2026, not "final";
   - "Difference so far", not a margin yet; Coates' own wages hours only, not yet costed, and the estimates named;
   - "Accruals through 31 Oct": the journals prepared for Finance, not a record of what is posted, with September's part of a line
     in them as a catch-up named, and the classes not in them (carrier loads, the consumables and forklift POs) for Finance to confirm;
   - the invoices and the November forecast shown apart;
2. gives the twin-steer strip room to print whole: it starts 3 mm above the bottom of the printable area (was a box 12 mm in from top
   and bottom, which cut the end of the rule off: its last letter on the P&L print, more on the others) and runs up the edge, 1.5 mm in
   from it (clear of the P&L print's frame); on the P&L print it stops 14 mm short of the top, clear of its first-page header. When
   "Checked by" makes it longer than the edge, it wraps to a second line rather than cutting off. The rule's words, size and colour
   are unchanged;
3. footer v12.75 -> v12.76.

No figure changes: pack v1.16 has v1.15's figures to the cent (audit_pack.py). The pack data is private and never committed; this patch
holds no figure. It reads PLF_JSON, refuses any file but the reviewed one (PLF_SHA256), checks it ties, and carries it into the page as
it is. Nothing is typed; nothing is written to the record.

    PLF_JSON=<pack dir>/GC500_PL_final.json python3 patch_v1276.py page.html      (in place, on the live v12.75 page)
"""
import hashlib, json, os, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '0b32aebda051d1e48ef5e2319b589a2acd0afeff97418a05ff7c365606b891dc'        # live v12.75, uploaded 1 Nov 2026 12:39 AEST
PLF_SHA256 = 'e51b72b7604be8dbdce34e9c5d7f636977b1de94d278e72fc7ca5f3c4bd96eb1'  # pack v1.16, record 12727 (audit_pack.py)
OLD_SHA = '31b9a283e41058556aab1c6c226a5c165ba66b6b28244f89f8ce5c12b6b64065'     # pack v1.15, in the live v12.75 block
STRIP_OLD = 'left:4mm;top:12mm;bottom:12mm;width:4mm;writing-mode:vertical-rl;transform:rotate(180deg);font:6.5pt/1 Arial,sans-serif;color:#a00;text-align:center;z-index:2147483647;white-space:nowrap;overflow:hidden}'
STRIP_NEW = ('left:1.5mm;top:auto;bottom:3mm;width:auto;max-width:14mm;writing-mode:vertical-rl;transform:rotate(180deg);font:6.5pt/1.15 Arial,sans-serif;color:#a00;text-align:start;z-index:2147483647;white-space:normal;overflow:visible}'
             'html.ts1053-armed:not(#ts1053x):not(#ts1053y):not(#ts1053z) body.printing-costs #ts1053-strip{max-height:181mm}')   # the costs print (A4 landscape, 6 mm margins: 198 mm tall): clear of its first-page header
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
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.75; rebuild and retest')
    J, sha = pack_data()
    js = (HERE / 'plf1276_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'plf1276.css').read_text(encoding='utf-8').rstrip()
    js = sub1(js, '__PLF1272_DATA__', json.dumps(J, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/'), 'the data slot')
    js = sub1(js, '__PLF1272_SHA__', sha, 'the hash slot')
    if '</script' in js.lower() or '</style' in css.lower(): raise ValueError('a closing tag inside the block')
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    old = text[a:b]
    if old.count('<script') != 1 or old.count('<style') != 1 or 'var PLF1272' not in old or 'purchaseOrders' not in old or OLD_SHA not in old or 'JOB POSITION' in old: raise ValueError('the plf1272 block is not the v12.75 one')
    text = text[:a] + '<style id="plf1272-style">\n' + css + '\n</style>\n<script id="plf1272-script">\n' + js + '\n</script>\n' + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    text = sub1(text, "#ts1053-strip{display:block!important;position:fixed;" + STRIP_OLD, "#ts1053-strip{display:block!important;position:fixed;" + STRIP_NEW, 'the twin-steer strip')
    found = FOOTER.findall(text)
    if found != ['v12.75']: raise ValueError('release footer: expected one v12.75 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.76'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1276 applied: the P&L job position on pack v1.16 (data %s); the twin-steer strip prints whole; footer v12.75 -> v12.76' % PLF_SHA256[:12])
