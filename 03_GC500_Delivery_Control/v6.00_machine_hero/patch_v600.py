#!/usr/bin/env python3
"""v6.00 - THE MACHINE'S HERO IS A LOOP (25 Sep 2026). Andrew Fisher: "the picture we have for the machine looks bad. need
to be like a looping 3d of the cog coming apart and spinning around". The Coates Way card now carries a 14 s loop captured
from the cog exhibit itself (print/machine, mechanism.html?hero=1): the cog running on its stand, released into its exploded
view while the camera circles it, and put back together - seamless, muted, playing inline on a phone. The still stays as the
poster (the first frame) and for anyone who asked their device for reduced motion.

The clip is hosted media like the banner's film: three files under kit media (webm, mp4, poster webp), listed in the kit's
media manifest and in the page's media table (DATA.media, keyed by SHA-256; hostedMedia() turns each into /m/<token>/<file>),
the manifest digest recomputed the service's way (canonical JSON of {schema, assets}, sorted by file).

  python3 patch_v600.py <page.html> <kit media dir> <hero dir with machine_hero.webm/.mp4/machine_hero_poster.webp> [builder.py]
"""
import hashlib, json, os, shutil, sys

page, kit_media, hero_dir = sys.argv[1], sys.argv[2], sys.argv[3]
builder = sys.argv[4] if len(sys.argv) > 4 else None

def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)

TYPES = {'webm': 'video/webm', 'mp4': 'video/mp4', 'webp': 'image/webp'}
files = {'mp4': 'machine_hero.mp4', 'webm': 'machine_hero.webm', 'poster': 'machine_hero_poster.webp'}   # mp4 first (3.0 MB, plays everywhere); the VP9 webm (3.1 MB) for a browser without H.264
added = {}
for role, name in files.items():
    b = open(os.path.join(hero_dir, name), 'rb').read(); sha = hashlib.sha256(b).hexdigest(); ext = name.rsplit('.', 1)[1]
    fn = sha + '.' + ext; dst = os.path.join(kit_media, fn)
    if not os.path.exists(dst): shutil.copyfile(os.path.join(hero_dir, name), dst)
    added[role] = {'bytes': len(b), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': TYPES[ext]}
    print(role, fn, len(b), 'bytes')

# 1. the kit's media manifest
mp = os.path.join(kit_media, 'manifest.json'); man = json.load(open(mp))
assert man['schema'] == 'gc500-media-v1'
have = {a['file'] for a in man['assets']}
for a in added.values():
    if a['file'] not in have: man['assets'].append(a)
man['assets'].sort(key=lambda a: a['file'])
man['sha256'] = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': man['assets']}).encode('utf-8')).hexdigest()
json.dump(man, open(mp, 'w'), indent=1); print('manifest', len(man['assets']), 'assets, digest', man['sha256'][:12])

# 2. the page: DATA (media table, manifest digest, the machine's hero), then the card's markup, style and wiring
s = open(page, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿'); n0 = len(s)
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';')
obj = json.loads(line[len('const DATA = '):-1])
assert json.dumps(obj, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1], 'DATA would not re-serialise byte for byte'
for a in added.values(): obj['media'][a['sha256']] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}
assert len(obj['media']) == len(man['assets']), (len(obj['media']), len(man['assets']))
obj['hostedMedia']['manifest'] = man['sha256']
h = obj['machine']['hero']
obj['machine']['hero'] = {'src': {'media': added['poster']['sha256']}, 'poster': {'media': added['poster']['sha256']}, 'webm': {'media': added['webm']['sha256']},
                          'mp4': {'media': added['mp4']['sha256']}, 'width': 1440, 'height': 896, 'still': h.get('src'), 'still_width': h.get('width'), 'still_height': h.get('height'),
                          'is': 'The Coates Way cog on its motor stand: running, released into its exploded view while the camera circles it, and put back together - a 14 s loop captured from the machine itself, 25 Sep 2026'}
s = s[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
print('DATA: media', len(obj['media']), 'hero', {k: v for k, v in obj['machine']['hero'].items() if k not in ('still',)})

import re
def rep(text, old, new, what):
    # indent-tolerant: the hosted page and the builder indent the same lines differently
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

OLD_IMG = """      <img src="${hero.src}" width="${hero.width}" height="${hero.height}" alt="The Coates Way cog as the steering wheel of the Coates #26, from the driver's seat — every word on it readable, the hall beyond the windscreen">"""
NEW_IMG = """      ${hero.webm || hero.mp4 ? `<video class="cwloop" muted loop playsinline preload="metadata" width="${hero.width}" height="${hero.height}" poster="${hero.poster || hero.src}" aria-label="${esc(hero.is || 'The Coates Way cog, running, coming apart and going back together')}">${
        hero.mp4 ? `<source src="${hero.mp4}" type="video/mp4">` : ''}${hero.webm ? `<source src="${hero.webm}" type="video/webm">` : ''}</video>`
      : `<img src="${hero.src}" width="${hero.width}" height="${hero.height}" alt="The Coates Way cog as the steering wheel of the Coates #26, from the driver's seat — every word on it readable, the hall beyond the windscreen">`}   /* v6.00 - the hero is the cog's own loop; the still is its poster */"""
OLD_CSS = ".cwhero img{display:block;width:100%;height:100%;object-fit:cover}\n.cwhero.opens{cursor:pointer}"
NEW_CSS = ".cwhero img,.cwhero video{display:block;width:100%;height:100%;object-fit:cover;background:#0b0f12}\n.cwhero.opens{cursor:pointer}"
OLD_CD = ".hzcd{max-width:236px;min-width:0}"
NEW_CD = ".hzcd{max-width:236px;min-width:0}\n@media(max-width:640px){.hzpod .num small.cdt{display:block;margin:5px 0 0;font-size:15px}}   /* v6.00 - on a phone the clock sits under the days, whole; it was clipped by the pod's edge */"
OLD_WIRE = "  if (pic && pic.tagName === 'BUTTON') pic.onclick = () => machineOpen();"
NEW_WIRE = """  if (pic && pic.tagName === 'BUTTON') pic.onclick = () => machineOpen();
  /* v6.00 - the loop plays by itself, muted, once it is on screen; it rests when the card is scrolled away, and stays on its
     poster for anyone who asked their device for reduced motion */
  const loop = pic && pic.querySelector('video.cwloop');
  if (loop) {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still) {
      const play = () => { const p = loop.play(); if (p && p.catch) p.catch(() => {}); };
      if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? play() : loop.pause()), {threshold: .15}).observe(loop);
      else play();
    }
  }"""
for what, old, new in (('img', OLD_IMG, NEW_IMG), ('css', OLD_CSS, NEW_CSS), ('wire', OLD_WIRE, NEW_WIRE), ('countdown', OLD_CD, NEW_CD)):
    s = rep(s, old, new, what)
open(page, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('page ok', n0, '->', len(s))

if builder:
    b = open(builder, encoding='utf-8').read(); n0 = len(b)
    for what, old, new in (('img', OLD_IMG, NEW_IMG), ('css', OLD_CSS, NEW_CSS), ('wire', OLD_WIRE, NEW_WIRE), ('countdown', OLD_CD, NEW_CD)):
        b = rep(b, old, new, 'builder ' + what)
    open(builder, 'w', encoding='utf-8').write(b); print('builder ok', n0, '->', len(b))
