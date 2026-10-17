#!/usr/bin/env python3
"""v6.86 - TWO PICTURES OF THE MASTER FOR EVERY UNIT IT PLACES (Andrew, 27 Sep 2026: "a couple for each - zoomed in
and zoomed out"). 278 crops of D001-26003-03, a close-up (~80 m across) and a wide view (~370 m across), each with a
red ring on the unit, held in the hosted media store and loaded only when a drawer opens.
Applied after patch_v685.py (built with the master_loc.json that carries each unit's two pictures).
  python3 patch_v686.py <page.html> <new_media.json> <manifest.json>
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, newf, manf, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    new = json.load(open(newf)); man = json.load(open(manf))
    ent = ','.join('"%s":%s' % (a['sha256'], json.dumps({'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}, separators=(',', ':'))) for a in new)
    i = t.find('},"hostedMedia":{"schema":"gc500-media-v1","manifest":"')
    assert i > 0 and t.count('},"hostedMedia":{"schema":"gc500-media-v1","manifest":"') == 1
    t = t[:i] + ',' + ent + t[i:]
    old = t[t.find('"hostedMedia":{"schema":"gc500-media-v1","manifest":"'):][:len('"hostedMedia":{"schema":"gc500-media-v1","manifest":"') + 64]
    t = t.replace(old, '"hostedMedia":{"schema":"gc500-media-v1","manifest":"' + man['sha256'], 1)
    t = R("""${others.length ? `<span class="w">The master also tags""", """${(mu.img || []).length === 2 && typeof DATA.media[mu.img[0]] === 'string' ? `<div class="mlocpics">${mu.img.map((s, i) => `<a href="${esc(DATA.media[s])}" target="_blank" rel="noopener noreferrer"><img src="${esc(DATA.media[s])}" decoding="async" alt="${esc(a.key)} on the master plan, ringed in red — ${i ? 'the area' : 'close up'}"><span>${i ? 'The area · about 370 m across' : 'Close up · about 80 m across'}</span></a>`).join('')}</div>` : ''}
 ${others.length ? `<span class="w">The master also tags""", 'drawer pics')
    css = """
/* v6.86 - the master's two pictures in a drawer */
.mlocpics{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;width:100%;margin:8px 0 4px}
.mlocpics a{display:flex;flex-direction:column;gap:4px;text-decoration:none;color:inherit}
.mlocpics img{width:100%;height:auto;aspect-ratio:11/7;object-fit:cover;border:1px solid var(--line,#ccc);border-radius:6px;background:#fff}
.mlocpics span{font-size:12px;color:var(--mute)}
</style>"""
    k = t.find('</style>'); t = t[:k] + css + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))



def patch2(path, need):
    """the drawer's header tiles and the Navigate button say where the position came from"""
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R(""" : 'No drawing';
 const mv = movedFor(a), pt = aerialPointFor(a);
 const loc = mv ? 'Changed · pin needs checking' : pt ? 'Needs confirmation'""",
          """ : masterUnit(a.key) ? 'D001 rev 03 · master' : 'No drawing';
 const mv = movedFor(a), pt = aerialPointFor(a);
 const loc = mv ? 'Changed · pin needs checking' : masterUnit(a.key) ? 'Master plan D001' : pt ? 'Needs confirmation'""", 'tiles')
    t = R("""'<span class="navpinned" aria-hidden="true">pinned</span>' : ''}<span class="vh"> ${(navTargetFor(a) || {}).pinned ? 'to the spot pinned on site for'""",
          """'<span class="navpinned" aria-hidden="true">' + (masterUnit(a && a.key) ? 'master plan' : 'pinned') + '</span>' : ''}<span class="vh"> ${(navTargetFor(a) || {}).pinned ? (masterUnit(a && a.key) ? 'to the spot on the master plan for' : 'to the spot pinned on site for')""", 'nav label')
    t = R("""if (t && t.pinned) {
 const f = t.fix, q = fixQuality(f.acc);""", """if (t && t.pinned && t.fix && t.fix.master) return 'Opens your maps app with driving directions to where the master plan D001-26003-03 puts ' + (a && a.key) + (masterWords(masterUnit(a && a.key)) ? ' — ' + masterWords(masterUnit(a && a.key)) : '') + '.';
 if (t && t.pinned) {
 const f = t.fix, q = fixQuality(f.acc);""", 'navSays')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok2', os.path.basename(path), n0, '->', len(t))

if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], sys.argv[3], True)
    patch2(sys.argv[1], True)
