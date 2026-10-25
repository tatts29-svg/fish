"""Author: Andrew Fisher. v12.26 - "Not in it yet" folds repeated provisional notes like the other lines.

Andrew, 25 Oct 2026 (this chat): "i want this the amount of info shortened no one is going to read all this we just want
Figures". v12.24 and v12.25 moved the 13 water-barrier notes into the Provisional lines ("WBxx · TL2: Contract 9994996 line 1
includes ..."); v12.22's short list only folded plain lines, so it showed 13 again. figures1220_src.js now folds a provisional
note that repeats for several references into one ("Provisional: 13 × TL2 (WB01–WB07, WB13–WB18) — ..."). Presentation only:
the full list under "Show the workings" is unchanged.

The v12.22 block on the live page is replaced whole; it must be exactly the block v12.22 published (BLOCK). Footer v12.25 -> v12.26.
    python3 patch_v1226.py page.html      (in place, on the live v12.25 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '25a68311ca34ba367d6d4f6b9c44e4867d65dbe4a66a9d1196c424663a04e221'
BLOCK = '69e17ac4fb381ebdf16ad8019e905d339bbc8f72e2f8b7a64f8c9b2a6ebe2833'
FOOT_OLD, FOOT_NEW = "+' · v12.25'; /* v8.19 release922", "+' · v12.26'; /* v8.19 release922"
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.25; rebuild and retest')
    a = text.find('<style id="figures1220-style">'); m = text.find('W.Figures1220 = Object.freeze(', a); b = text.find('</script>', m) + len('</script>')
    if a < 0 or m < 0 or text.count('<style id="figures1220-style">') != 1: raise ValueError('the v12.22 block is not on the page once')
    if sha(text[a:b]) != BLOCK: raise ValueError('the v12.22 block on the page is not the one v12.22 published')
    text = text[:a] + (HERE / 'figures1220_src.js').read_text(encoding='utf-8').rstrip() + text[b:]
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.25 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1226 applied: provisional notes fold in Not in it yet; footer v12.25 -> v12.26')
