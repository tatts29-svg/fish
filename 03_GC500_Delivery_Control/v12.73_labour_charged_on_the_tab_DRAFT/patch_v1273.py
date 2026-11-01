"""Author: Andrew Fisher. v12.73 - labour charged by branch on the P&L tab, and the tab on pack v1.12.

Andrew, 1 Nov 2026 (this chat): "We Also Need to Understand How Much Labour We charged Each MEAD and NVAC and KINP and STPS if Any so
when we Journal Peoples cost into INSTALL we have a figure we know we are up against"; asked whether to put it on the P&L tab: "yes to 5".

On the live v12.72 page (BASE is its verified SHA-256), this release:
1. replaces the final P&L block (plf1272: its style and script, ids kept, so the tab's own face still finds it) with the pack v1.12
   data and a module that adds, under By branch, "labour we charged the V8s, by branch": every line the 18 invoices code LABOUR, the
   labour hire already in Installs and what is left for people's cost, with its notes; and a fold with every labour line;
2. footer v12.72 -> v12.73.

Every figure is the pack's own (GC500_PL_final.json, pack v1.12, record 12727; audit_pack.py 269/269). The file is private and never
committed; this patch holds no figure. It reads PLF_JSON, refuses any file but the reviewed one (PLF_SHA256), checks it foots, and carries
it into the page as it is. Nothing is typed; nothing is written to the record.

    PLF_JSON=<pack dir>/GC500_PL_final.json python3 patch_v1273.py page.html      (in place, on the live v12.72 page)
"""
import hashlib, json, os, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'f3d686a3929c945e4a6b181eea2e6976425ccecd7205bd8589ca2826962ec49b'        # live v12.72, uploaded 1 Nov 2026 09:25 AEST
PLF_SHA256 = '82bf67510b351057fab517613fa6cd4dc3ac3ae0cd8f9fd03b423576afd14a53'  # pack v1.12, record 12727 (audit_pack.py 269/269)
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
    R, C, L = J['revenue'], J['costs'], J['labourCharged']
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
              ('labour line count', sum(b['lines'] for b in L['branches']) == len(L['lines']))]
    bad = [n for n, ok in checks if not ok]
    if bad: raise ValueError('the pack data does not foot: ' + ', '.join(bad))
    return J, got


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.72; rebuild and retest')
    J, sha = pack_data()
    js = (HERE / 'plf1273_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'plf1273.css').read_text(encoding='utf-8').rstrip()
    js = sub1(js, '__PLF1272_DATA__', json.dumps(J, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/'), 'the data slot')
    js = sub1(js, '__PLF1272_SHA__', sha, 'the hash slot')
    if '</script' in js.lower() or '</style' in css.lower(): raise ValueError('a closing tag inside the block')
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    old = text[a:b]
    if old.count('<script') != 1 or old.count('<style') != 1 or 'var PLF1272' not in old or 'labourCharged' in old: raise ValueError('the plf1272 block is not the v12.72 one')
    text = text[:a] + '<style id="plf1272-style">\n' + css + '\n</style>\n<script id="plf1272-script">\n' + js + '\n</script>\n' + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    found = FOOTER.findall(text)
    if found != ['v12.72']: raise ValueError('release footer: expected one v12.72 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.73'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1273 applied: the final P&L on pack v1.12 (data %s) with labour charged by branch and every labour line; footer v12.72 -> v12.73' % PLF_SHA256[:12])
