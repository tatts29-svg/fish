#!/usr/bin/env python3
"""Author: Andrew Fisher. v8.90 Map explorer, machine part: the explorer code pointed at the 2 Oct issue of D001-26003-03.

    python3 patch_explorer890.py <dir holding the explorer code files> <assets dir> <out dir>

The input is the explorer code as it is about to be registered: the live v8.64 files, or the v8.87 output (which this
patch is written to follow). Every replacement is anchored on text both carry and must match exactly once (three times
for the attribution line that appears three times); the patch refuses to run twice. Every file of the input directory
is copied to <out dir>, with index.html and explorer.js changed:
  explorer.js  - the fencing layer checks the drawing's frame hash (frame_sha256: the 17 Sep issue the lines were traced
                 on, which the aligned 2 Oct scene keeps), not the PDF hash alone;
               - attribution reads "D001 rev 03 · issued 2 Oct" on the map, in the export stamp and in the Sources legend,
                 which also states the frame;
               - the scene, manifest, labels, underlay, classification, overview and georeferencing are asked for with a
                 version token (the new scene's hash), so a browser still holding last hour's files cannot mix the issues.
  index.html   - the same strings and tokens, and a fresh content-hash token for explorer.js.
Nothing here uploads or registers anything.
"""
import hashlib, json, re, shutil, sys
from pathlib import Path

SRC, ASSETS, OUT = (Path(p) for p in sys.argv[1:4])
sha = lambda b: hashlib.sha256(b).hexdigest()
TOKEN = sha((ASSETS / 'drawing-scene.bin').read_bytes())[:12]
meta = json.loads((ASSETS / 'vt' / 'boot.json').read_text())['meta'] if (ASSETS / 'vt' / 'boot.json').exists() else json.loads((ASSETS / 'vt' / 'manifest.json').read_text())['boot']['meta']
assert meta.get('issued') == '2 Oct 2026' and meta.get('frame_sha256', '').startswith('37792f0a'), 'the assets are not the v8.90 set'


def once(text, old, new, what, n=1):
    c = text.count(old)
    if c != n: sys.exit(f'{what}: expected the anchor {n} time(s), found {c}: {old[:90]!r}')
    return text.replace(old, new)


js = (SRC / 'explorer.js').read_text(encoding='utf-8'); html = (SRC / 'index.html').read_text(encoding='utf-8')
if 'issued 2 Oct' in js or 'issued 2 Oct' in html: sys.exit('already applied')
# 1. the fencing layer's master hash: the frame the lines were traced on
js = once(js, "masterHash:()=>P&&P.meta&&P.meta.sha256,",
          "masterHash:()=>P&&P.meta&&(P.meta.frame_sha256||P.meta.sha256),/* v8.90 - the fencing lines were traced on the 17 Sep issue; the 2 Oct issue is drawn in that frame */", 'masterHash')
# 2. attribution
js = once(js, "'Drawing © iEDM · D001 rev 03'", "'Drawing © iEDM · D001 rev 03 · issued 2 Oct'", 'attribution (original)')
js = once(js, "Drawing © iEDM D001 rev 03", "Drawing © iEDM D001 rev 03 · issued 2 Oct", 'attribution (satellite modes, export stamp)', 3)
js = once(js, "revision ${esc(P.meta.revision)}<br>PDF SHA-256 ${esc(P.meta.sha256)}</p>",
          "revision ${esc(P.meta.revision)}${P.meta.issued ? ' · issued ' + esc(P.meta.issued) : ''}<br>PDF SHA-256 ${esc(P.meta.sha256)}"
          "${P.meta.frame_sha256 ? '<br>Drawn in the frame of the 17 Sep issue (' + esc(P.meta.frame_sha256.slice(0, 12)) + '…): its main plan sits 9 mm further left on its own paper and is moved back, so the fencing lines traced on the 17 Sep issue and the satellite registration still hold.' : ''}</p>", 'legend source')
# 3. version tokens on the assets this release replaces
for name, n_js, n_html in (('assets/vt/manifest.json', 1, 1), ('assets/source-labels.json', 1, 1), ('assets/georeferencing.json', 1, 1), ('assets/sheet-overview.webp', 1, 1),
                           ('assets/underlay/manifest.json', 1, 0), ('assets/classification.json', 1, 0), ('assets/drawing-scene.bin', 1, 0)):
    js = once(js, "'" + name + "'", "'" + name + "?v=" + TOKEN + "'", 'token ' + name, n_js)
    if n_html: html = once(html, "'" + name + "'", "'" + name + "?v=" + TOKEN + "'", 'token ' + name + ' (index)', n_html)
# 4. index.html wording
html = once(html, "D001 rev 03 · Master Layout Plan", "D001 rev 03 · issued 2 Oct · Master Layout Plan", 'subtitle')
html = once(html, "revision 03 · iEDM", "revision 03 · issued 2 Oct 2026 · iEDM", 'sources card')
html = once(html, 'Drawing © iEDM · D001 rev 03</div>', 'Drawing © iEDM · D001 rev 03 · issued 2 Oct</div>', 'attrib div')
# 5. a fresh cache token for explorer.js
OUT.mkdir(parents=True, exist_ok=True)
for f in sorted(SRC.iterdir()):
    if f.is_file() and f.name not in ('explorer.js', 'index.html'): shutil.copy(f, OUT / f.name)
(OUT / 'explorer.js').write_text(js, encoding='utf-8')
tok = sha((OUT / 'explorer.js').read_bytes())[:12]
html, n = re.subn(r'src="explorer\.js\?v=[0-9a-f]{12}"', 'src="explorer.js?v=' + tok + '"', html)
if n != 1: sys.exit('index.html: expected one explorer.js script tag with a token, found %d' % n)
(OUT / 'index.html').write_text(html, encoding='utf-8')
out = {f.name: {'bytes': f.stat().st_size, 'sha256': sha(f.read_bytes())} for f in sorted(OUT.iterdir()) if f.is_file()}
json.dump(out, open(OUT / 'prepared890.json', 'w'), indent=1)
print('scene token', TOKEN, '· explorer.js token', tok)
for k, v in out.items(): print('%-28s %8d %s' % (k, v['bytes'], v['sha256'][:12]))
