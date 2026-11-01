#!/usr/bin/env python3
"""v12.79: the P&L tab on pack v1.19: Forklift rehire under Rehire, and the transport estimate of 1 Nov.

Author: Andrew Fisher.

Andrew, 1 Nov 2026: "Forklift r3hire should that not go to rehire". Queensland Forklifts' rehire (POs 4647983 and
4654789) is coded 2126, like the other rehire, so pack v1.19 puts it in the Rehire category. It is still Coates' own use,
not charged to the V8s. Pack v1.19 also corrects the transport open item's "36 planned movements ... and 17 unpriced demob
movements": the 17 are part of the 36, and Schedule 17 prices two of them, so 34 are not in the costs.

The categories go from ten to nine; Rehire becomes 3,886.73 + 3,770.00.

Transport (Andrew, 1 Nov 2026: "The transport we work out by what ever had a transport pick up cost. And is still onsite. Thats the amount we
move"; "What ever is left onsite is left onsite"; "What u think we do both ?"): the four October pick-ups still on site (WC60, GN18, P46,
P51, 1,788.02) move to November, and two ESTIMATE rows come in: the trucks that ran by 31 Oct with no figure or row on the record (16,083.79,
October, a manual accrual candidate) and the pick-ups still to come for Coates gear on site (19,847.89, November). Revenue and the accruals
are unchanged; the costs and the difference change by 35,931.68. Each leg is in the pack's section 2h.

This patch holds no figure. On the live v12.78 page (BASE pinned) it replaces the P&L block (the module and its data):
- it reads PLF_JSON_OLD (pack v1.18, pinned) and PLF_JSON (pack v1.19, pinned);
- it runs the v12.77 patch's tie checks on the new data;
- it rebuilds the live block from the v12.77 module and the v1.18 data and requires it to equal the page's block byte for byte;
- it puts in the block built from this folder's module (plf1279_src.js, plf1279.css: the tab's presentation for Finance and the
  Transport estimate fold) and the v1.19 data; then the release footer, v12.78 -> v12.79.
Nothing outside the block changes.

    PLF_JSON_OLD=<pack v1.18>/GC500_PL_final.json PLF_JSON=<pack v1.19>/GC500_PL_final.json \
      toolchain/build.sh v12.79 v12.79_pl_rehire_pack_v119/patch_v1279.py
"""
import hashlib, importlib.util, json, os, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = '7bf7904784fa7e150bc92c252e987d07cb7cdc96e79e22824d8dbcf3f2b69de0'        # live v12.78, uploaded 1 Nov 2026 18:07 AEST
OLD_SHA = 'f896184a78c9c95ae665985a73980ce1231275acb0aca8b40b49c0eaf60b5f6d'     # pack v1.18, in the live v12.78 block
NEW_SHA = '416d2022aa185ff007b481f28e2af131b6118de939fbef83f890717db6351772'     # pack v1.19, record 12727 (audit_pack.py 563/563)

spec = importlib.util.spec_from_file_location('p1277', HERE.parent / 'v12.77_pl_tab_explorer_LIVE' / 'patch_v1277.py')
P1277 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1277)


def sub1(text, old, new, what):
    if text.count(old) != 1: raise ValueError('%s: expected the anchor once, found %d' % (what, text.count(old)))
    return text.replace(old, new)


def block(folder, js_name, css_name, J, sha):   # the block exactly as patch_v1277 writes it
    js = (folder / js_name).read_text(encoding='utf-8').rstrip(); css = (folder / css_name).read_text(encoding='utf-8').rstrip()
    js = sub1(sub1(js, '__PLF1272_DATA__', page_data(J), 'the data slot'), '__PLF1272_SHA__', sha, 'the hash slot')
    if '</script' in js.lower() or '</style' in css.lower(): raise ValueError('a closing tag inside the block')
    return '<style id="plf1272-style">\n' + css + '\n</style>\n<script id="plf1272-script">\n' + js + '\n</script>\n'


def page_data(J):
    # exactly as v12.77 writes it into the block (patch_v1277.patch)
    data = json.dumps(J, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/')
    if data.count('Andrew Fisher') != data.count('"who":"Andrew Fisher"'): raise ValueError('the name is in the pack data outside a who-field')
    return data.replace('"who":"Andrew Fisher"', '"who":"Andrew\\u0020Fisher"')


def load(env, pin):
    src = os.environ.get(env)
    if not src: raise ValueError(env + ' must name a GC500_PL_final.json')
    raw = Path(src).read_bytes(); got = hashlib.sha256(raw).hexdigest()
    if got != pin: raise ValueError('%s is %s, not the pinned %s' % (env, got, pin))
    return json.loads(raw.decode('utf-8'))


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.78; rebuild and retest')
    old_J = load('PLF_JSON_OLD', OLD_SHA)
    P1277.PLF_SHA256 = NEW_SHA                   # the v12.77 tie checks, on the new data
    new_J, sha = P1277.pack_data()
    if new_J.get('pack') != 'v1.19' or old_J.get('pack') != 'v1.18': raise ValueError('expected pack v1.18 -> v1.19')
    if [c['name'] for c in new_J['categories']].count('Forklift rehire') or not any(l['supplier'] == 'Queensland Forklifts' and l['category'] == 'Rehire' for l in new_J['lines']):
        raise ValueError('pack v1.19 should carry Queensland Forklifts under Rehire')
    for k in ('revenue', 'accrue'):
        if new_J[k] != old_J[k]: raise ValueError('a total changed between v1.18 and v1.19: ' + k)
    c = lambda a, b: abs(round(a, 2) - round(b, 2)) < 0.005
    est = (16083.79, 19847.89, 1788.02)   # the transport estimate's October and November rows, and the four pick-ups moved to November
    if not (c(new_J['costs']['total'], old_J['costs']['total'] + est[0] + est[1]) and c(new_J['costs']['sep'], old_J['costs']['sep'])
            and c(new_J['costs']['oct'], old_J['costs']['oct'] - est[2] + est[0]) and c(new_J['costs']['nov'], old_J['costs']['nov'] + est[2] + est[1])
            and c(new_J['difference'], old_J['difference'] - est[0] - est[1])):
        raise ValueError('the costs did not move by exactly the transport estimate between v1.18 and v1.19')
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    if text[a:b] != block(HERE.parent / 'v12.77_pl_tab_explorer_LIVE', 'plf1277_src.js', 'plf1277.css', old_J, OLD_SHA):
        raise ValueError('the live P&L block is not the v12.77 module on pack v1.18')
    text = text[:a] + block(HERE, 'plf1279_src.js', 'plf1279.css', new_J, NEW_SHA) + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    found = P1277.FOOTER.findall(text)
    if found != ['v12.78']: raise ValueError('release footer: expected one v12.78 footer, found ' + repr(found))
    text = P1277.FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.79'), text, count=1)
    print('patch_v1279 applied: the P&L on pack v1.19 (data %s; Forklift rehire under Rehire; the transport estimate); footer v12.78 -> v12.79' % NEW_SHA[:12])
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
