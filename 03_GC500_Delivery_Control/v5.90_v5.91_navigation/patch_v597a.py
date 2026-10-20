#!/usr/bin/env python3
"""v5.97 (part A) - the by-lines that printed a person's name beside a date ("settled · Andrew Fisher, 24 Sep
2026", "Andrew Fisher · 19 Sep 2026", "The hours rule is Andrew Fisher's, …") now print the date alone. The
record still holds who said it; the page no longer says so on every card.  python3 patch_v597a.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)
rep("""  return `<span class="chip act" title="${esc((c.stated_by || '') + ', ' + fmtDate(c.stated_on || ''))}">moved to ${esc(fmtDay(m.to).dow + ' ' + fmtDay(m.to).dm)}</span> <b>${esc(m.key)}</b> ${esc(m.what)} — ${esc(c.stated_by || '')}, ${esc(fmtDate(c.stated_on || ''))}`;""",
    """  return `<span class="chip act" title="${esc('stated ' + fmtDate(c.stated_on || ''))}">moved to ${esc(fmtDay(m.to).dow + ' ' + fmtDay(m.to).dm)}</span> <b>${esc(m.key)}</b> ${esc(m.what)} — ${esc(fmtDate(c.stated_on || ''))}`;""", 'moved chip')
rep("""      <span class="w" style="font-size:12px;color:var(--mute)">${esc(CLO.supplied_by || '')}${CLO.received ? ' · ' + esc(CLO.received) : ''}</span></div>""",
    """      <span class="w" style="font-size:12px;color:var(--mute)">${CLO.received ? esc(CLO.received) : ''}</span></div>""", 'closure by-line')
rep("""    <p class="sub">${esc(CLO.for_whom || '')}. Times and order are ${esc(CLO.supplied_by || 'Andrew Fisher')}'s own hand on the plan; everything here is copied as written.</p>""",
    """    <p class="sub">${esc(CLO.for_whom || '')}. Times and order are written by hand on the plan; everything here is copied as written.</p>""", 'closure words')
rep("""with the race-weekend closure times and closure order written on it by ${esc(CLO.supplied_by || 'Andrew Fisher')}" loading="lazy\"""",
    """with the race-weekend closure times and closure order written on it by hand" loading="lazy\"""", 'closure alt')
rep("""        const stateChip = c.settled_by ? `<span class="chip ok" title="${esc(c.settled_said || '')}">settled · ${esc(c.settled_by)}, ${esc(fmtDate(c.settled_on) || c.settled_on || '')}</span>`""",
    """        const stateChip = c.settled_by ? `<span class="chip ok" title="${esc(c.settled_said || '')}">settled · ${esc(fmtDate(c.settled_on) || c.settled_on || '')}</span>`""", 'settled chip')
rep("""        <td style="font-size:12px;color:var(--mute)">${c.settled_by ? esc(c.settled_by) + ', ' + esc(fmtDate(c.settled_on) || c.settled_on || '') + ': ' + esc(c.settled_said || '')""",
    """        <td style="font-size:12px;color:var(--mute)">${c.settled_by ? 'settled ' + esc(fmtDate(c.settled_on) || c.settled_on || '') + ': ' + esc(c.settled_said || '')""", 'settled words')
rep("""— approved by ${rqAuth.stated_by} on ${fmtDay(rqAuth.stated_on).dm}, with the final total still able to change`""",
    """— approved on ${fmtDay(rqAuth.stated_on).dm}, with the final total still able to change`""", 'approved on')
rep("""<p class="hint">The hours rule is ${esc(WF.hours_rule.stated_by || 'Andrew Fisher')}'s, ${esc(fmtDate(WF.hours_rule.stated_on || '2026-09-24'))}: a standard day""",
    """<p class="hint">The hours rule, stated ${esc(fmtDate(WF.hours_rule.stated_on || '2026-09-24'))}: a standard day""", 'hours rule')
rep("""  const who = t.time_meaning ? ` (${esc(t.time_meaning.stated_by)}, ${esc(t.time_meaning.stated_on)})` : '';""",
    """  const who = t.time_meaning ? ` (stated ${esc(t.time_meaning.stated_on)})` : '';""", 'time meaning')
rep("""      ${esc(a.stated_by)}, ${esc(a.stated_on)} — ${esc(a.as_stated)}.` : '') +""",
    """      stated ${esc(a.stated_on)} — ${esc(a.as_stated)}.` : '') +""", 'as stated')
rep("""as most loads' origin: ${esc(DATA.depot.stated_by)}, ${esc(DATA.depot.stated_on)}` : ''}""",
    """as most loads' origin, stated ${esc(DATA.depot.stated_on)}` : ''}""", 'depot origin')
rep("""title="${esc((r.date_correction.stated_by || '') + ', ' + fmtDate(r.date_correction.stated_on || ''))}">moved from""",
    """title="${esc('stated ' + fmtDate(r.date_correction.stated_on || ''))}">moved from""", 'moved from chip')
rep("""fmtDay(m.to).dm + ' (' + (m.corr.stated_by || '') + ', ' + fmtDate(m.corr.stated_on || '') + ')').join('; '))}\"""",
    """fmtDay(m.to).dm + ' (stated ' + fmtDate(m.corr.stated_on || '') + ')').join('; '))}\"""", 'moved off chip')
rep("""title="${esc(o.subhire.stated_by || 'a person on site')} said so on ${esc(fmtDate(o.subhire.stated_on || '') || o.subhire.stated_on || '')} — a subhire has no Coates asset number\"""",
    """title="stated on site ${esc(fmtDate(o.subhire.stated_on || '') || o.subhire.stated_on || '')} — a subhire has no Coates asset number\"""", 'subhire chip')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.97a', n0, '->', len(s))
