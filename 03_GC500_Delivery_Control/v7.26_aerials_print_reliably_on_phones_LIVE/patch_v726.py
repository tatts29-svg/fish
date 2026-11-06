#!/usr/bin/env python3
"""v7.26 - aerial photos on the day sheets, made reliable on a phone on site. Andrew Fisher, 28 Sep 2026, with a printed
install sheet for P38: "On the installs the aerial shots dont print" - Close-up and Around it read "The aerial photograph
could not be loaded" while the master-plan drawing printed. The same sheet made on a desk prints both aerials, so the
record is right; the phone did not get the one 2 MB, 4760 x 2994 aerial in time (a weak signal on site, or a phone short
of memory building seven pages), and the sheet gave up at the first failure.
 1. The aerial starts loading as soon as a Timeline day is on screen, so it is there before Print is pressed.
 2. A failed load is tried again, three times in all, 1.5 s and 3 s apart; the picture is decoded before it is used.
 3. If the full aerial still will not come, a lighter copy (60 %, about 40 % of the bytes) is used instead: the sheet
    gets its aerials, a little softer, rather than a grey box.
    python3 patch_v726.py <page.html> <kit media dir> <aerial_mid.webp>"""
import hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
page, kit_media, mid = sys.argv[1:4]

def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)

s = open(page, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿')
if 'aerial_mid' in s: sys.exit('v7.26 already applied')
OLD = """const AERIAL_SRC = (() => { let p = null; return () => p || (p = new Promise((res, rej) => {
 if (!DATA.aerial_hi) { rej(new Error('no aerial in this build')); return; }
 const im = new Image();
 im.onload = () => res(im);
 im.onerror = () => rej(new Error('the aerial would not decode'));
 im.src = DATA.aerial_hi;
}).catch(error => { p = null; throw error; })); })();"""
NEW = """/* v7.26 - tried three times, decoded before use, and a lighter copy if the full one will not come (see patch_v726.py) */
const AERIAL_SRC = (() => { let p = null;
 const load = (url, tries) => new Promise((res, rej) => { let n = 0;
  const fail = () => { if (++n < tries) setTimeout(once, n * 1500); else rej(new Error('the aerial would not load')); };
  const once = () => { const im = new Image(); im.decoding = 'async';
   im.onload = () => { if (!im.naturalWidth) { fail(); return; } (im.decode ? im.decode() : Promise.resolve()).then(() => res(im), fail); };
   im.onerror = fail; im.src = url; };
  once(); });
 return () => p || (p = (DATA.aerial_hi ? load(DATA.aerial_hi, 3) : Promise.reject(new Error('no aerial in this build')))
  .catch(e => DATA.aerial_mid ? load(DATA.aerial_mid, 2) : Promise.reject(e))
  .catch(error => { p = null; throw error; })); })();"""
if s.count(OLD) != 1: sys.exit('aerial loader not found once')
s = s.replace(OLD, NEW)
s = rep(s, "function dpWirePlate(pane){\n", "function dpWirePlate(pane){\n setTimeout(() => { try { AERIAL_SRC().catch(() => {}); } catch (e) {} }, 1200);   /* v7.26 - the aerial is fetched before Print is pressed */\n", 'prewarm', page, True)
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';')
obj = json.loads(line[len('const DATA = '):-1])
assert json.dumps(obj, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1], 'DATA does not round-trip'
raw = open(mid, 'rb').read(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.webp'
dst = os.path.join(kit_media, fn)
if not os.path.exists(dst): open(dst, 'wb').write(raw)
mp = os.path.join(kit_media, 'manifest.json'); man = json.load(open(mp))
if not any(a['sha256'] == sha for a in man['assets']): man['assets'].append({'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'image/webp'})
man['assets'].sort(key=lambda a: a['file'])
man['sha256'] = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': man['assets']}).encode('utf-8')).hexdigest()
obj['media'][sha] = {'file': fn, 'sha256': sha, 'type': 'image/webp', 'bytes': len(raw), 'scope': 'view'}
assert len(obj['media']) == len(man['assets']), (len(obj['media']), len(man['assets']))
obj['hostedMedia']['manifest'] = man['sha256']
obj['aerial_mid'] = {'media': sha}
from PIL import Image
obj['aerial_mid_px'] = list(Image.open(dst).size)
json.dump(man, open(mp, 'w'), indent=1)
s = s[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
open(page, 'w', encoding='utf-8').write(('﻿' if bom else '') + s)
print('ok · lighter aerial', fn[:16], len(raw) // 1024, 'KB · manifest', len(man['assets']), man['sha256'][:12])
