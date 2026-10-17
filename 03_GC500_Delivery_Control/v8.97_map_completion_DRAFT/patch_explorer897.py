#!/usr/bin/env python3
"""Author: Andrew Fisher. v8.97 Map explorer, machine part: completion on the maps.

    python3 patch_explorer897.py <explorer code dir (the v8.93 machine_code_v887_v890_v893, or the v8.90 set)> <out dir>

Andrew, 8 Oct 2026: "Need to come up with a clean way to show completions on maps when we search for things example buildings.
We still want to show but something to highlight completion keeping in reference to same look as how its highlighted."

Every file of the input directory is copied to <out dir>; three change, by exact-once replacements anchored on text the v8.87,
v8.90 and v8.93 files all carry (the patch refuses a base without them and refuses to run twice):
  explorer.js        the v8.97 block (source/explorer897_src.js) beside the Done layer: the verified completion set, pulled from
                     the dashboard on the Done layer's own 4 s cadence (nothing while hidden, parked or moving); the ring renderer
                     draws one small static green tick on the lower-right edge of a complete result's ring; search and category
                     rows carry "✓ Complete". The Done layer, its chip and its badge are unchanged; where it is on, no second tick.
  explorer-merge.js  the unit card's title carries "✓ Complete" for a complete unit.
  index.html         fresh content-hash tokens for the two changed scripts. The asset tokens (?v=<scene hash>) are untouched.
Nothing here uploads or registers anything.
"""
import hashlib, json, re, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC, OUT = (Path(p) for p in sys.argv[1:3])
sha = lambda b: hashlib.sha256(b).hexdigest()


def once(text, old, new, what):
    n = text.count(old)
    if n != 1: sys.exit(f'{what}: expected the anchor once, found {n}: {old[:100]!r}')
    return text.replace(old, new)


js = (SRC / 'explorer.js').read_text(encoding='utf-8'); merge = (SRC / 'explorer-merge.js').read_text(encoding='utf-8'); html = (SRC / 'index.html').read_text(encoding='utf-8')
if 'ok897' in js or 'ok897' in merge: sys.exit('already applied')
for need, what in (('gradCache887', 'the v8.87 ring renderer'), ('function done782Loop()', 'the v8.87 Done poll'), ('issued 2 Oct', 'the v8.90 drawing (2 Oct issue)'), ('let marksDrawn = false;', 'the marks layer')):
    if need not in js: sys.exit(f'the base is not the v8.87 + v8.90 explorer: {what} is missing')
block = (HERE / 'source' / 'explorer897_src.js').read_text(encoding='utf-8')
for bad, what in ((r'\$\s?\d', 'a dollar figure'), (r'(?i)site\s?iq', 'SiteIQ'), (r'(?i)\b(?:codex|claude|chatgpt|openai|anthropic)\b', 'an agent name')):
    if re.search(bad, block): sys.exit('the v8.97 block carries ' + what)

# 1. the block, beside the Done layer it extends
js = once(js, 'let marksDrawn = false;', block.rstrip('\n') + '\nlet marksDrawn = false;', 'v8.97 block')
# 2. the ring renderer: the tick after the ring's own stroke (the glow, the ring, the pulse and the label are as they were)
js = once(js, "ctx.lineWidth = (sel ? 2.5 : 1.6) * dpr; ctx.strokeStyle = m.c; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();",
          "ctx.lineWidth = (sel ? 2.5 : 1.6) * dpr; ctx.strokeStyle = m.c; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke(); tick897(ctx, c.x, c.y, r, m.it);   /* v8.97 */", 'ring tick')
# 3. the Done layer's poll also pulls the verified set (same cadence, same pauses)
js = once(js, "if (!(interacting || zAnim || flingRAF)) done782Pull(); done782Timer = setTimeout(done782Loop, 4000); }",
          "if (!(interacting || zAnim || flingRAF)) { done782Pull(); complete897Pull(); /* v8.97 */ } done782Timer = setTimeout(done782Loop, 4000); }", 'poll')
# 4. the rows: search results, placed category results, unplaced category results
js = once(js, 'items.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>', 'items.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>${ok897(it)}', 'search rows')
js = once(js, 'placed.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>', 'placed.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>${ok897(it)}', 'category rows (placed)')
js = once(js, 'unplaced.map(it => `<button data-code="${esc(it.code)}" class="dim"><b>${esc(it.code)}</b>', 'unplaced.map(it => `<button data-code="${esc(it.code)}" class="dim"><b>${esc(it.code)}</b>${ok897(it)}', 'category rows (unplaced)')
# 5. the card's title
merge = once(merge, '<div class="xc-t"><b>${escH(code)}</b>', '<div class="xc-t"><b>${escH(code)}</b>${typeof ok897 === \'function\' ? ok897(it, \'card\') : \'\'}', 'card title')
# 6. write, with fresh content tokens for the two changed scripts
OUT.mkdir(parents=True, exist_ok=True)
for f in sorted(SRC.iterdir()):
    if f.is_file() and not f.name.startswith('prepared') and f.name not in ('explorer.js', 'explorer-merge.js', 'index.html'): shutil.copy(f, OUT / f.name)
(OUT / 'explorer.js').write_text(js, encoding='utf-8'); (OUT / 'explorer-merge.js').write_text(merge, encoding='utf-8')
for name in ('explorer.js', 'explorer-merge.js'):
    tok = sha((OUT / name).read_bytes())[:12]
    html, k = re.subn(r'src="' + re.escape(name) + r'\?v=[0-9a-f]{12}"', 'src="' + name + '?v=' + tok + '"', html)
    if k != 1: sys.exit(f'index.html: expected one script tag for {name}, found {k}')
(OUT / 'index.html').write_text(html, encoding='utf-8')
out = {'author': 'Andrew Fisher', 'release': 'v8.97', 'base': {f.name: sha(f.read_bytes()) for f in sorted(SRC.iterdir()) if f.is_file()},
       'files': {f.name: {'sha256': sha(f.read_bytes()), 'bytes': f.stat().st_size} for f in sorted(OUT.iterdir()) if f.is_file() and not f.name.startswith('prepared')}}
(OUT / 'prepared897.json').write_text(json.dumps(out, indent=1))
changed = [n for n in out['files'] if n not in out['base'] or out['base'][n] != out['files'][n]['sha256']]
print('v8.97 explorer: changed', ', '.join(changed), '|', len(out['files']), 'files written to', OUT)
