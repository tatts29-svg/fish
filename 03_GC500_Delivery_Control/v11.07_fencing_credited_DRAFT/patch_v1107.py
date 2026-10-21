"""Author: Andrew Fisher. v11.07 - the fencing metres headline credits each type only up to its own programme.

Andrew, 21 Oct 2026: "Fencing is still not complete its not 100% yet". Today's Fencing card read "13,302.5 of 12,359.5 m
of fence work on dockets - 100%": fenceMetres() added clean fence (11,577.5 m docketed against a 7,965 m programme) and
braced-for-scrim (1,725 of 4,394.5 m), so the clean over-run hid the scrim shortfall. The Build index already applied the
rule "each type counts up to its own programme total; extra work cannot cover another type's shortfall" (85.1-85.4%);
the metres headline, the Showcase fence scene, the milestone %, the "left" figure and the copy text did not.

fenceMetres().done is now the credited sum (each type capped at its programme); .docketed is the raw docket sum. Every
reader of .done - Today card, Design headline, Showcase scene, milestones, left-to-do, copy text - follows. The per-type
table is unchanged. Today's card and the copy text also say the docketed figure. Footer v11.06 -> v11.07.

    python3 patch_v1107.py page.html      (in place, on the live v11.06 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '7c3f21cef9a5d161bcd1dbf317465707b7f93df9e70fa873c3f1505e32e94716'

def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.07 requires the live v11.06 page ' + BASE_SHA256)
    text = rep(text,
        "return {done: ft.reduce((s, t) => s + t.done, 0), planned: ft.reduce((s, t) => s + (t.planned || 0), 0), total: ft.reduce((s, t) => s + t.total, 0),",
        "/* v11.07 (Andrew, 21 Oct 2026: \"Fencing is still not complete its not 100% yet\"): .done credits each type only up to its own programme, so extra clean fence cannot cover the scrim shortfall; .docketed is the raw docket sum */\n"
        "  return {done: ft.reduce((s, t) => s + Math.min(t.done, t.total || 0), 0), docketed: ft.reduce((s, t) => s + t.done, 0), planned: ft.reduce((s, t) => s + (t.planned || 0), 0), total: ft.reduce((s, t) => s + t.total, 0),",
        'fenceMetres credits per type', 'page')
    text = rep(text,
        "<small> of ${esc(fmtNum(F.total))} m of fence work on dockets</small></div>  ${gauge(F.done, F.total, F.planned ? `${esc(fmtNum(F.planned))} m planned by this day` : 'nothing planned by this day', null)}",
        "<small> of ${esc(fmtNum(F.total))} m of fence work credited</small></div>  ${gauge(F.done, F.total, (F.planned ? `${esc(fmtNum(F.planned))} m planned by this day` : 'nothing planned by this day') + (F.docketed > F.done ? ` · ${esc(fmtNum(F.docketed))} m on dockets; a type's extra does not credit another type` : ''), null)}",
        'Today fencing card says credited and docketed', 'page')
    text = rep(text,
        "`FENCING: ${fmtNum(F.done)} of ${fmtNum(F.total)}m of fence work on dockets${F.planned ?",
        "`FENCING: ${fmtNum(F.done)} of ${fmtNum(F.total)}m of fence work credited${F.docketed > F.done ? ` (${fmtNum(F.docketed)} m on dockets; each type counts up to its own programme)` : ''}${F.planned ?",
        'copy text says credited', 'page')
    return rep(text, "+' · v11.06'; /* v8.19 release922", "+' · v11.07'; /* v8.19 release922", 'release footer', 'page')

if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
