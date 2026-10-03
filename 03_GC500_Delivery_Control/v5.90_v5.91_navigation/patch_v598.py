#!/usr/bin/env python3
"""v5.98 - RELOCATION IS PAID BY THE HOUR, NOT THE METRE (settled 25 Sep 2026). The tracker's $100 on the relocation
line is Advanced's hourly rate; the page had read it as $100 a metre and printed a −$91.35 a metre margin and a
per-metre paid figure on every relocation docket. The line now says $100.00 an hour, no per-metre cost is put on
relocation metres (their hours are on the green book), the margin is a dash, and a typed per-metre cost still
overrides.  python3 patch_v598.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
import re as _r
def rep(old, new, label, count=1):
    """exact-once; if the built page carries a different indentation, match by lines with leading space ignored"""
    global s
    if s.count(old) == count: s = s.replace(old, new); print('ok', label); return
    lines = old.split('\n'); pat = '\n'.join(r'[ \t]*' + _r.escape(l.lstrip()) for l in lines)
    ms = list(_r.finditer(pat, s)); assert len(ms) == count, (label, s.count(old), len(ms))
    m = ms[0]; indent = _r.match(r'[ \t]*', s[m.start():]).group(0); base = _r.match(r'[ \t]*', lines[0]).group(0)
    fixed = '\n'.join((indent + l[len(base):]) if l.startswith(base) else l for l in new.split('\n'))
    s = s[:m.start()] + fixed + s[m.end():]; print('ok', label, '(indent-matched)')
rep("""const FCOL = FENCE.columns || [];""", """const FCOL = FENCE.columns || [];
/* v5.98 - settled 25 Sep 2026: Advanced bill relocation by the hour; the card charges it by the metre. The tracker's
   $100 on that line is an hourly rate and is never a per-metre cost. */
FCOL.forEach(c => { if (c.key === 'relocation' && c.cost_unit == null && c.unit !== 'hr') c.cost_unit = 'hr'; });""", 'relocation cost unit')
import re as _re
_pat = _re.compile(r"^(\s*)if \(c\.cost_rate != null\) return \{value: c\.cost_rate, source: 'tracker', by: null, at: null, card: c\};$", _re.M)
assert len(_pat.findall(s)) == 1, ('hourly is not per metre', len(_pat.findall(s)))
s = _pat.sub(lambda m: m.group(1) + "if (c.cost_unit && c.cost_unit !== c.unit && c.cost_rate != null) return {value: null, source: 'hourly', hourly: c.cost_rate, by: null, at: null, card: c};   /* v5.98 - a rate in another unit is not a per-unit cost */\n" + m.group(0), s); print('ok hourly is not per metre')
rep("""        <td class="num frs">${c.cost_rate != null ? `<span class="w">tracker ${esc(money(c.cost_rate))}</span>` : '<span class="norate">no tracker rate</span>'}""",
    """        <td class="num frs">${pr.source === 'hourly' ? `<span class="w">tracker ${esc(money(pr.hourly))} an hour</span>` : c.cost_rate != null ? `<span class="w">tracker ${esc(money(c.cost_rate))}</span>` : '<span class="norate">no tracker rate</span>'}""", 'paid source words')
rep("""          ${pr.value != null ? `<b>${esc(money(pr.value))}</b><span class="w">${esc(per)}${pr.source === 'typed' ? ' · typed' : ''}</span>` : '<span class="norate">not costed</span>'}""",
    """          ${pr.value != null ? `<b>${esc(money(pr.value))}</b><span class="w">${esc(per)}${pr.source === 'typed' ? ' · typed' : ''}</span>` : pr.source === 'hourly' ? `<b>${esc(money(pr.hourly))}</b><span class="w"> an hour · by the hour, not the metre</span>` : '<span class="norate">not costed</span>'}""", 'paid figure')
rep("""          return t.length > 160 ? `<div class="clamp">${t}</div><button type="button" class="linkish clampbtn" data-clamp>more</button>` : t; })()}</td></tr>`; }).join('')}</tbody></table></div>""",
    """          const tt = pr.source === 'hourly' ? t + ' · the crew bill this by the hour and the card charges it by the metre, so no per-metre cost is put on it; the hours are on the green book. Type a per-metre cost over it if one is agreed.' : t;
          return tt.length > 160 ? `<div class="clamp">${tt}</div><button type="button" class="linkish clampbtn" data-clamp>more</button>` : tt; })()}</td></tr>`; }).join('')}</tbody></table></div>""", 'where it comes from')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.98', n0, '->', len(s))
