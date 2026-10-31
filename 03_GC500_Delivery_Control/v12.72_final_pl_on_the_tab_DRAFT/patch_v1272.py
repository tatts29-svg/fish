"""Author: Andrew Fisher. v12.72 - the final P&L on the P&L tab.

Andrew, 1 Nov 2026 (this chat): "make sure all the new P&L data this Becomes the new P&L in the GC500 p&L Tab we need thi Accurate
to the Cent please".

On the page after patch_v1271.py (the live v12.69 with v12.71's P&L fixes under it), this release:
1. puts the final P&L at the head of the Costs & P&L tab, inside the tab's own face (the pl1267 module), so it sits where the P&L
   always has and every re-render keeps it there: revenue, costs by month of work, by branch and by supplier, what to accrue at
   31 Oct, the difference, every cost line with its PO and invoice or receipt, the journals and the open items;
2. folds the live model the tab carried before (worked from the record as it stands) under it, named as the working figures,
   every card and button kept; the Finance, Fencing and Workings folds stay as they are;
3. gives the final P&L its own Print (the tab's print, A4 landscape): on paper the final P&L prints in full and the live model
   stays on the screen;
4. footer v12.71 -> v12.72.

Every figure is the pack's own: the final P&L pack's data (GC500_PL_final.json, written by
review_31Oct2026_october_month_end/build_monthend.py, checked against the pack's workbook to the cent by audit_pack.py). It is
private and is never committed; this patch holds no figure. It reads the file named by PLF_JSON, refuses any file but the reviewed
one (PLF_SHA256, below), checks it foots, and carries it into the page as it is. Nothing is typed; nothing is written to the record.

    PLF_JSON=<pack dir>/GC500_PL_final.json python3 patch_v1272.py page.html      (in place, after patch_v1271.py)
"""
import hashlib, json, os, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
PLF_SHA256 = '9bd37f36dbd6d2052f1617e7367299cf263ab3cc357d303153e1cb259818f0da'   # pack v1.10, record 12715 (audit_pack.py 247/247)
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")


def sub1(text, old, new, what):
    n = text.count(old)
    if n != 1: raise ValueError('%s: expected the anchor once, found %d: %r' % (what, n, old[:80]))
    return text.replace(old, new)


def pack_data():
    src = os.environ.get('PLF_JSON')
    if not src: raise ValueError('PLF_JSON must name the final P&L pack data (GC500_PL_final.json)')
    raw = Path(src).read_bytes()
    got = hashlib.sha256(raw).hexdigest()
    if got != PLF_SHA256: raise ValueError('the pack data is %s, not the reviewed %s - rebuild the pack, re-run audit_pack.py and pin the new hash' % (got, PLF_SHA256))
    J = json.loads(raw.decode('utf-8'))
    c = lambda a, b: abs(round(a, 2) - round(b, 2)) < 0.005
    for k in ('pack', 'record', 'asAt', 'basis', 'source', 'revenue', 'costs', 'difference', 'accrue', 'branches', 'branchLines', 'suppliers', 'lines', 'journals', 'moves', 'open'):
        if k not in J: raise ValueError('the pack data has no ' + k)
    R, C = J['revenue'], J['costs']
    checks = [('revenue = invoices + forecast', c(R['total'], R['invoices'] + R['novForecast'])),
              ('costs = Sep + Oct + Nov', c(C['total'], C['sep'] + C['oct'] + C['nov'])),
              ('difference = revenue - costs', c(J['difference'], R['total'] - C['total'])),
              ('branches add to the costs', c(sum(b['costs'] for b in J['branches']), C['total'])),
              ('branches add to the revenue', c(sum(b['revenue'] for b in J['branches']), R['total'])),
              ('suppliers add to the costs', c(sum(s['total'] for s in J['suppliers']), C['total'])),
              ('lines add to the costs by month', all(c(sum(l[m] for l in J['lines']), C[m]) for m in ('sep', 'oct', 'nov'))),
              ('lines add to the accruals', c(sum(l['accrue'] for l in J['lines']), J['accrue'])),
              ('journals add to the accruals', c(sum(j['amount'] for j in J['journals']), J['accrue'])),
              ('each branch\'s lines add to its costs', all(c(sum(v for _, v in J['branchLines'][b['b']]), b['costs']) for b in J['branches']))]
    bad = [n for n, ok in checks if not ok]
    if bad: raise ValueError('the pack data does not foot: ' + ', '.join(bad))
    return J, got


def patch(text):
    if 'pl1267-bridge' not in text or "+' · v12.71'; /* v8.19 release922" not in text: raise ValueError('apply patch_v1271.py first (the live v12.69 with v12.71 under it)')
    if 'PLF1272' in text: raise ValueError('the v12.72 changes are already applied')
    J, sha = pack_data()
    js = (HERE / 'plf1272_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'plf1272.css').read_text(encoding='utf-8').rstrip()
    data = json.dumps(J, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/')
    js = sub1(js, '__PLF1272_DATA__', data, 'the data slot')
    js = sub1(js, '__PLF1272_SHA__', sha, 'the hash slot')
    if '</script' in js.lower() or '</style' in css.lower(): raise ValueError('a closing tag inside the block')

    # 1. the module and its style, just before the P&L block, so the face finds it when it is built at load
    a = text.index('<style id="pl1267-style">')
    block = '<style id="plf1272-style">\n' + css + '\n</style>\n<script id="plf1272-script">\n' + js + '\n</script>\n'
    text = text[:a] + block + text[a:]

    # 2. inside the face (pl1267, as v12.71 built it): the final P&L first, the live model folded under it; its Print bound
    b0 = text.index('<script id="pl1267-script">'); b1 = text.index('</script>', b0)
    mod = text[b0:b1]
    if 'var PL1267' not in mod: raise ValueError('the pl1267 module is not where expected')
    mod = sub1(mod, "var wrap = D.createElement('div'); wrap.innerHTML = faceHtml(Mo);",
               "var wrap = D.createElement('div'); wrap.innerHTML = faceHtml(Mo);\n"
               "    /* v12.72 - the final P&L at the head of the tab; the face above (the live model) folds under it, as it is */\n"
               "    if (W.PLF1272) { try { wrap = W.PLF1272.wrap(wrap); } catch (e) { try { console.warn('PLF1272', e); } catch (_) {} } }", 'the face')
    mod = sub1(mod, "var pb = D.getElementById('pl1267-print'); if (pb) pb.onclick = function () { try { printCosts(); } catch (e) { try { console.warn('PL1267: print', e); } catch (_) {} } };",
               "var pb = D.getElementById('pl1267-print'); if (pb) pb.onclick = function () { try { printCosts(); } catch (e) { try { console.warn('PL1267: print', e); } catch (_) {} } };\n"
               "    if (W.PLF1272) { try { W.PLF1272.bind(); } catch (e) {} }", 'the print binding')
    text = text[:b0] + mod + text[b1:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the v12.72 block is not in once')

    # 3. footer
    found = FOOTER.findall(text)
    if found != ['v12.71']: raise ValueError('release footer: expected one v12.71 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.72'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1272 applied: the final P&L (pack data %s) at the head of the Costs & P&L tab; the live model folded under it; its Print; footer v12.71 -> v12.72' % PLF_SHA256[:12])
