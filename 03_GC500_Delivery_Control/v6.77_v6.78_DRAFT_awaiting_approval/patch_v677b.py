#!/usr/bin/env python3
"""v6.77b (candidate, from v6.73 + patch_v677) - the rest of the approved re-audit list for the dashboard.
  D10  the header's sub-line on a gap day says the phase and day, not "before the programme" ("Race day" kept)
  D11  the next delivery day's box does not raise a warning for a day that has not happened
  D15  "nothing removes it" -> "return date not recorded"; "NO PROGRAMME WEEK" -> the phase and day
  D16  showcase scene 7 no longer sends people to "the next scene" for the crew; fence metres "on dockets"
  P1   photo cards load the server's small copy (thumbnail); the full photograph only when it is opened
  A1-A4, P6  accessibility and phone tab labels
  python3 patch_v677b.py <page.html> [builder.py]
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

CSS = """
/* v6.77 - accessibility (re-audit A3) and phone tab labels (P6) */
@media (max-width:420px){ nav.tabs [data-tab] .tl, nav.tabs [data-tab]{font-size:10.5px;letter-spacing:0} }
.cworktbl{table-layout:fixed;min-width:0} .cworktbl td{overflow-wrap:anywhere}
</style>"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    # D10
    t = R("""sub = wk ? weekWords(wk).split(' · ').slice(0, 2).join(' · ') : 'before the programme'; }""",
          """sub = wk ? weekWords(wk).split(' · ').slice(0, 2).join(' · ') : ((programmeDay(iso) || {}).short || 'before the programme'); }""", 'pod sub')
    # D11 - a day that has not started has nothing "not recorded" yet
    t = R("""${tile(notYet, 'not recorded on site', notYet ? splitWords : 'nothing outstanding', 'register', notYet ? 'gap' : '')}""",
          """${dayNow ? tile(notYet, 'not recorded on site', notYet ? splitWords : 'nothing outstanding', 'register', notYet ? 'gap' : '')
 : tile(notYet, 'still to come', notYet ? 'the day has not started yet' : 'nothing outstanding', 'timeline', '')}""", 'pod tile')
    t = R("""<div class="tsnote">${R.review || refs""",
          """<div class="tsnote">${!dayNow ? (refs ? `<b>${fmtNum(refs)}</b> row${refs === 1 ? '' : 's'} on that day ${refs === 1 ? 'needs a reference' : 'need references'} — nothing else to chase until the day starts.` : 'Nothing to chase yet — this day has not started.')
 : R.review || refs""", 'pod note')
    t = R("""${fig(f.notYet, 'Not recorded on site', f.subNot, 'plant', 'gap', f.notYet ? 'gap' : '')}""",
          """${f.dayNow ? fig(f.notYet, 'Not recorded on site', f.subNot, 'plant', 'gap', f.notYet ? 'gap' : '') : fig(f.notYet, 'Still to come', f.notYet ? 'the day has not started' : 'nothing outstanding', 'timeline', 'cal', '')}""", 'header pod tile')
    # D15
    t = R("""return '<span class="chip crit">nothing removes it</span>';""", """return '<span class="chip crit" title="no schedule row, demob row or rental off-hire date takes it off site yet">return date not recorded</span>';""", 'nothing removes it')
    t = R("""const week = d.sheet ? d.sheet.replace('Demob Week', 'Demob').toUpperCase() : 'NO PROGRAMME WEEK';""",
          """const week = d.sheet ? d.sheet.replace('Demob Week', 'Demob').toUpperCase() : (((programmeDay(d.iso) || {}).short || 'no programme sheet') + '').toUpperCase();""", 'no programme week')
    # D16
    t = R("""<div class="shrow"><span>Clean, installed</span>""", """<div class="shrow"><span>Clean, on dockets</span>""", 'show clean')
    t = R("""<div class="shrow"><span>Braced for scrim, installed</span>""", """<div class="shrow"><span>Braced for scrim, on dockets</span>""", 'show scrim')
    t = R("""${fine('Installed is what the crew’s dockets say by this day;""", """${fine('The metres are what the crew’s dockets say by this day — work done, not fence standing;""", 'show fine')
    t = R("""+ (fencingCrew().length ? ' Put in by ' + fencingCompany() + ' — meet the crew on the next scene.' : ''))}`;""",
          """+ (fencingCrew().length ? ' Put in by ' + fencingCompany() + '.' : ''))}`;""", 'show crew')
    # P1 - the small copy on cards, the original when opened
    t = R("""return {state: 'ready', url: f.url || SYNC.backend.fileUrl(f.id), file: f};""",
          """return {state: 'ready', url: f.url || SYNC.backend.fileUrl(f.id), file: f,
 /* v6.77 - the server keeps a small webp copy of every photograph; cards draw that, the original opens on a press */
 thumb: f.thumb === true && SYNC.backend.thumbUrl ? SYNC.backend.thumbUrl(f.id, f.sha256) : null};""", 'photoFor thumb')
    t = R("""if (sr && sr.state === 'ready' && sr.url) out.push({kind: 'drop', url: sr.url, open: SYNC.backend.fileUrl(shot.id),""",
          """if (sr && sr.state === 'ready' && sr.url) out.push({kind: 'drop', url: sr.thumb || sr.url, open: SYNC.backend.fileUrl(shot.id),""", 'found pics')
    t = R("""if (shot && sr.state === 'ready') return `<span class="eqpic"><img src="${esc(sr.url)}\"""",
          """if (shot && sr.state === 'ready') return `<span class="eqpic"><img src="${esc(sr.thumb || sr.url)}\"""", 'eqpic')
    t = R("""${url ? `<img src="${esc(url)}" alt="${esc(dropPhotoSays(key, ph))}" loading="lazy" data-dphopen="${esc(url)}" data-dphimg>`""",
          """${url ? `<img src="${esc(r.thumb || url)}" alt="${esc(dropPhotoSays(key, ph))}" loading="lazy" data-dphopen="${esc(url)}" data-dphimg>`""", 'drawer photo')
    t = R("""const shots = (typeof dropPhotosOf === 'function' ? dropPhotosOf(key) : []).map(ph => ({ph, url: dropPhotoUrl(ph)})).filter(x => x.url);""",
          """const shots = (typeof dropPhotosOf === 'function' ? dropPhotosOf(key) : []).map(ph => { const r = photoFor(ph); return {ph, url: r.state === 'ready' ? r.url : null, thumb: r.thumb || null}; }).filter(x => x.url);""", 'day card shots')
    t = R("""<a class="dcpic" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" title="${esc(dropPhotoSays(key, x.ph))}"><img src="${esc(x.url)}\"""",
          """<a class="dcpic" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" title="${esc(dropPhotoSays(key, x.ph))}"><img src="${esc(x.thumb || x.url)}\"""", 'day card img')
    t = R("""<div class="rs-shot">${r.state === 'ready' ? `<img src="${esc(r.url)}\"""", """<div class="rs-shot">${r.state === 'ready' ? `<img src="${esc(r.thumb || r.url)}\"""", 'result shot')
    i = t.find('</style>')
    if i >= 0: t = t[:i] + CSS + t[i + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
