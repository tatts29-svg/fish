"""Author: Andrew Fisher. v12.09.1 (claimed as v12.07.1) - Servicing: the Night report gives the night just finished, not tonight's empty one.

Andrew, 25 Oct 2026 (this chat), at 08:2x, after Saturday's service night closed: "Can we not do a nice coates gc500 report
dor servicing when is the uodated one with stars."
At 08:00 the Servicing panel moves on to the new night (each night runs 08:00 to 08:00), so the v12.05 Night report button
offered Sun 25 -> Mon 26 at 0% "Well below standard so far" instead of Saturday's finished night (98%, five stars), which the
panel keeps under "Previous nights".
  report1202 (the report's own script): unless a night is picked in the panel, a night with nothing done yet gives way to
  the night before it, the one just finished, and the button says so ("Previous night · Sat 24 -> Sun 25 · 98% ·
  Exceptional"). Once tonight's first job is ticked the button follows tonight, as before. A night with nothing done never
  opens an empty report; the button says it has not started.
  svcNight1202 (the hook v12.05 put in the Servicing tab): also says whether the night was picked, so a picked night is
  always the one reported.
  Every figure, the rating, the report's look, QR codes, crew cards, trackers and records are unchanged. Footer -> v12.09.1.
  Claimed as v12.07.1; renumbered because Codex's v12.09 went live first (the footer never goes backwards).

    python3 patch_v12091.py page.html      (in place, on the live v12.09 page named by BASE)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '87102c753244e9243788c02f9eeabb652847b955a6ed5c733b71df651e4b5751'
FOOT_OLD, FOOT_NEW = "+' · v12.09'; /* v8.19 release922", "+' · v12.09.1'; /* v8.19 release922"
HOOK = "read: clockNow, day: pickedDay || SvcState.autoDay(data, now),"
HOOK_NEW = "read: clockNow, day: pickedDay || SvcState.autoDay(data, now), picked: !!pickedDay,"
EDITS = [
    ("const VERSION = 'v12.05',", "const VERSION = 'v12.09.1',", 'version'),
    ("function current() {\n"
     "  if (typeof root.svcNight1202 !== 'function' || typeof SvcState === 'undefined') return null;\n"
     "  const snap = root.svcNight1202(); if (!snap) return null;\n"
     "  return model({D: snap.D, S: SvcState, C: typeof SvcCrews1173 === 'object' ? SvcCrews1173 : null, crewData: typeof SVC1067_CARD === 'object' && SVC1067_CARD ? SVC1067_CARD.data : {},\n"
     "    events: snap.events, now: snap.now, read: snap.read, day: snap.day, meta: snap.meta});\n"
     "}",
     "function current() {\n"
     "  if (typeof root.svcNight1202 !== 'function' || typeof SvcState === 'undefined') return null;\n"
     "  const snap = root.svcNight1202(); if (!snap) return null;\n"
     "  const at = day => model({D: snap.D, S: SvcState, C: typeof SvcCrews1173 === 'object' ? SvcCrews1173 : null, crewData: typeof SVC1067_CARD === 'object' && SVC1067_CARD ? SVC1067_CARD.data : {},\n"
     "    events: snap.events, now: snap.now, read: snap.read, day: day, meta: snap.meta});\n"
     "  const R = at(snap.day);\n"
     "  /* v12.09.1 - at 08:00 the panel moves on to the new night before any crew has started it (Andrew, 25 Oct 2026: \"when is\n"
     "     the uodated one with stars\"). Unless a night is picked, a night with nothing done yet gives way to the night before\n"
     "     it, the one just finished; once tonight's first job is ticked, tonight is the night */\n"
     "  if (snap.picked || R.state !== 'now' || R.jobs.d > 0) return R;\n"
     "  const before = (snap.D.days || []).filter(d => d.id < R.day.id).sort((a, b) => a.id < b.id ? -1 : 1).pop();\n"
     "  const L = before ? at(before.id) : null;\n"
     "  return L && L.jobs.d > 0 ? Object.assign(L, {previous: true}) : R;\n"
     "}", 'the night it reports'),
    ("  if (R.state === 'future') { say('That night has not started. Pick a night that has.'); return; }",
     "  if (R.state !== 'ended' && !R.jobs.d) { say('That night has not started yet. Pick a finished night under Previous nights.'); return; }", 'no empty report'),
    ("  cap.textContent = R ? (R.day.label + ' → ' + shortDay(nextId(R.day.id)).replace(/ \\w+$/, '') + ' · ' + R.pct + '% · ' + R.band.word + (R.state === 'now' ? ' so far' : '')) : 'Print or save the night as a PDF';",
     "  const night = R ? R.day.label + ' → ' + shortDay(nextId(R.day.id)).replace(/ \\w+$/, '') : '';\n"
     "  cap.textContent = !R ? 'Print or save the night as a PDF' : R.state !== 'ended' && !R.jobs.d ? night + ' · not started yet'\n"
     "    : (R.previous ? 'Previous night · ' : '') + night + ' · ' + R.pct + '% · ' + R.band.word + (R.state === 'now' ? ' so far' : '');", 'the caption'),
]


def patch(html):
    if "const VERSION = 'v12.09.1'" in html or 'picked: !!pickedDay' in html: raise ValueError('v12.09.1 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v12.09.1 (expected v12.09 87102c75...)')
    k = html.index('<script id="report1202-script">'); e = html.index('</script>', k)
    for old, new, what in EDITS:
        if html.count(old) != 1: raise ValueError('%s: %r must be there exactly once' % (what, old[:70]))
        if not k < html.index(old) < e: raise ValueError('%s: not inside the report script' % what)
    for once in (HOOK, FOOT_OLD, 'W.renderServicing1084 = wake;'):
        if html.count(once) != 1: raise ValueError('%r must be there exactly once' % once[:60])
    h = html.index(HOOK)
    if not 0 < html.index('W.renderServicing1084 = wake;') - h < 600: raise ValueError('the hook is not the one in the Servicing tab')
    html = rep(html, HOOK, HOOK_NEW, 'Servicing tab: the hook says whether the night was picked', 'page')
    for old, new, what in EDITS: html = rep(html, old, new, 'Night report: ' + what, 'page')
    return rep(html, FOOT_OLD, FOOT_NEW, 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v12.09.1 Night report applied')
