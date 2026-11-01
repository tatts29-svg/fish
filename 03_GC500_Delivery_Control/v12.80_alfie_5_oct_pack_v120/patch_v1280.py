"""Author: Andrew Fisher. v12.80: the Costs & P&L tab on pack v1.20, with Alfie Harris's 5 Oct shift. Data only.

On 2 Nov 2026 Andrew answered the open item on Alfie Harris's 5 Oct night with "Oct 5  6'30-17:00". The shift went on the record that
morning (record 12729 -> 12734, record_02Nov2026_alfie_5_oct/), and pack v1.20 carries it (audit_pack.py 577/577). This patch puts the
v1.20 data into the live v12.79 P&L block and changes nothing else:

- the block's code (plf1279_src.js, plf1279.css, plf1279_find.js, plf1279_find.css) is the live v12.79 code, read from
  ../v12.79_pl_rehire_pack_v119_LIVE/, so the module is byte for byte what is live apart from the data and its hash;
- the data may differ from v1.19 only where the 5 Oct shift reaches: the pack and record stamps, open item 15, and Alfie Harris's KINP
  row in the labour journal (October worked and paid hours and the normal / x1.5 / x2 bands). Anything else refuses;
- the release footer, v12.79 -> v12.80.

    PLF_JSON_OLD=<pack v1.19>/GC500_PL_final.json PLF_JSON=<pack v1.20>/GC500_PL_final.json \
      toolchain/build.sh v12.80 v12.80_alfie_5_oct_pack_v120/patch_v1280.py
"""
import hashlib, importlib.util, json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIVE1279 = HERE.parent / 'v12.79_pl_rehire_pack_v119_LIVE'
BASE = '73df88aeb79bd4c3dccdeafd01a9d23f72aa3d7d87257220919b0464cb6be95f'        # live v12.79, uploaded 2 Nov 2026 02:03 AEST
OLD_SHA = 'fd38abeacaacf8983901a222427bdba01e5c96a8d153851a76e31c7889f482cc'     # pack v1.19, record 12727, in the live v12.79 block
NEW_SHA = 'e9a611d0265306fc43d5a7bdc5efe21129fdb075dfa404aaede0ad642e59a85c'     # pack v1.20, record 12734 (audit_pack.py 577/577)
FIND = ('plf1279_find.js', 'plf1279_find.css')

spec = importlib.util.spec_from_file_location('p1279', LIVE1279 / 'patch_v1279.py')
P1279 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1279)
P1277 = P1279.P1277

# the only places v1.20 may differ from v1.19 (the 5 Oct shift and the stamps)
ALLOWED = {('pack',), ('record',), ('source',), ('open', 14)} | {('labourJournal', 3, k) for k in ('oct', 'paidOct', 'normal', 'x15', 'x2')}


def diffs(a, b, path=()):
    if type(a) is not type(b): return [path]
    if isinstance(a, dict):
        out = []
        for k in sorted(set(a) | set(b)):
            out += [path + (k,)] if (k not in a or k not in b) else diffs(a[k], b[k], path + (k,))
        return out
    if isinstance(a, list):
        if len(a) != len(b): return [path]
        return [d for i, (x, y) in enumerate(zip(a, b)) for d in diffs(x, y, path + (i,))]
    return [] if a == b else [path]


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.79; rebuild and retest')
    old_J = P1279.load('PLF_JSON_OLD', OLD_SHA)
    P1277.PLF_SHA256 = NEW_SHA                   # the v12.77 tie checks, on the new data
    new_J, sha = P1277.pack_data()
    if (old_J.get('pack'), new_J.get('pack'), old_J.get('record'), new_J.get('record')) != ('v1.19', 'v1.20', 12727, 12734):
        raise ValueError('expected pack v1.19 on record 12727 -> v1.20 on record 12734')
    d = diffs(old_J, new_J)
    if set(d) - ALLOWED or not d: raise ValueError('pack v1.20 differs from v1.19 outside the 5 Oct shift: ' + repr(sorted(set(d) - ALLOWED))[:400])
    a19, a20 = old_J['labourJournal'][3], new_J['labourJournal'][3]
    if (a20['who'], a20['branch'], a20['kind']) != ('Alfie Harris', 'KINP', 'Coates wages'): raise ValueError('labour journal row 3 is not Alfie Harris at KINP')
    c = lambda x, y: abs(round(x, 2) - round(y, 2)) < 0.005
    if not (c(a20['oct'], a19['oct'] + 10.5) and c(a20['paidOct'], a19['paidOct'] + 10) and c(a20['normal'], a19['normal'] + 7.6)
            and c(a20['x15'], a19['x15'] + 2) and c(a20['x2'], a19['x2'] + 0.4)):
        raise ValueError('Alfie Harris at KINP did not move by exactly the 5 Oct shift (10.5 worked; 10 paid = 7.6 + 2 + 0.4)')
    if not (new_J['open'][14].startswith('Alfie Harris: his 5 Oct night now has his shift beside it') and 'King’s Birthday' in new_J['open'][14]):
        raise ValueError('open item 15 is not the v1.20 wording')
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    if text[a:b] != P1279.block(LIVE1279, 'plf1279_src.js', 'plf1279.css', old_J, OLD_SHA, FIND):
        raise ValueError('the live P&L block is not the v12.79 module on pack v1.19')
    text = text[:a] + P1279.block(LIVE1279, 'plf1279_src.js', 'plf1279.css', new_J, NEW_SHA, FIND) + text[b:]
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    found = P1277.FOOTER.findall(text)
    if found != ['v12.79']: raise ValueError('release footer: expected one v12.79 footer, found ' + repr(found))
    text = P1277.FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.80'), text, count=1)
    print('patch_v1280 applied: the P&L on pack v1.20 (data %s; Alfie Harris on 5 Oct; %d data paths changed, all allowed); footer v12.79 -> v12.80'
          % (NEW_SHA[:12], len(d)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
