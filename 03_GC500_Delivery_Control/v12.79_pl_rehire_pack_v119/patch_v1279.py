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
P51, 1,788.02) move to November, and two ESTIMATE rows come in: the trucks that ran by 31 Oct with no figure or row on the record (16,233.12,
October, a manual accrual candidate) and the pick-ups still to come for Coates gear on site (19,847.89, November). Revenue and the accruals
are unchanged; the costs and the difference change by 36,081.01. Each leg is in the pack's section 2h.

This patch holds no figure. On the live v12.78 page (BASE pinned) it swaps the P&L block's pack data for pack v1.19:
- it reads PLF_JSON_OLD (pack v1.18, pinned) and PLF_JSON (pack v1.19, pinned);
- it runs the v12.77 patch's tie checks on the new data;
- it finds the old data exactly once in the page, as v12.77 wrote it, and puts the new data in its place;
- it changes the block's data hash and the release footer, v12.78 -> v12.79.
Nothing else in the page changes.

    PLF_JSON_OLD=<pack v1.18>/GC500_PL_final.json PLF_JSON=<pack v1.19>/GC500_PL_final.json \
      toolchain/build.sh v12.79 v12.79_pl_rehire_pack_v119/patch_v1279.py
"""
import hashlib, importlib.util, json, os, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = '7bf7904784fa7e150bc92c252e987d07cb7cdc96e79e22824d8dbcf3f2b69de0'        # live v12.78, uploaded 1 Nov 2026 18:07 AEST
OLD_SHA = 'f896184a78c9c95ae665985a73980ce1231275acb0aca8b40b49c0eaf60b5f6d'     # pack v1.18, in the live v12.78 block
NEW_SHA = '3cdf64a240d46739b1bbe6395afaebf6bc62695e96f531b7351c199e7755c570'     # pack v1.19, record 12727 (audit_pack.py 563/563)

spec = importlib.util.spec_from_file_location('p1277', HERE.parent / 'v12.77_pl_tab_explorer_LIVE' / 'patch_v1277.py')
P1277 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1277)


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
    est = (16233.12, 19847.89, 1788.02)   # the transport estimate's October and November rows, and the four pick-ups moved to November
    if not (c(new_J['costs']['total'], old_J['costs']['total'] + est[0] + est[1]) and c(new_J['costs']['sep'], old_J['costs']['sep'])
            and c(new_J['costs']['oct'], old_J['costs']['oct'] - est[2] + est[0]) and c(new_J['costs']['nov'], old_J['costs']['nov'] + est[2] + est[1])
            and c(new_J['difference'], old_J['difference'] - est[0] - est[1])):
        raise ValueError('the costs did not move by exactly the transport estimate between v1.18 and v1.19')
    a = text.index('<script id="plf1272-script">'); b = text.index('</script>\n', a)
    block = text[a:b]
    old_d, new_d = 'var DATA = ' + page_data(old_J) + ';', 'var DATA = ' + page_data(new_J) + ';'
    old_s, new_s = "var SHA = '" + OLD_SHA + "';", "var SHA = '" + NEW_SHA + "';"
    for what, s_ in (('the v1.18 data', old_d), ('the v1.18 hash', old_s)):
        if block.count(s_) != 1 or text.count(s_) != 1: raise ValueError(what + ' is not in the P&L block exactly once')
    block = block.replace(old_d, new_d).replace(old_s, new_s)
    if '</script' in block[8:].lower(): raise ValueError('a closing tag inside the block')
    text = text[:a] + block + text[b:]
    found = P1277.FOOTER.findall(text)
    if found != ['v12.78']: raise ValueError('release footer: expected one v12.78 footer, found ' + repr(found))
    text = P1277.FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.79'), text, count=1)
    print('patch_v1279 applied: the P&L on pack v1.19 (data %s; Forklift rehire under Rehire; the transport estimate); footer v12.78 -> v12.79' % NEW_SHA[:12])
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
