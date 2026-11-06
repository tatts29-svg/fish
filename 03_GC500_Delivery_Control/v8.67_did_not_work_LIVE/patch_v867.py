# Author: Andrew Fisher. v8.67 Did not work: a button on the running sheet that takes a person's shift off the day, and puts it back.
# Andrew (6 Oct 2026): "in the place where we do hours can we have a remove button if someone or people did not work ... so i can fix".
import hashlib, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
p = Path(sys.argv[1])
BASES = {'6fa8a9f3b71191b3e268272aa80a052cdf1855188e86348642da9f03adef16e4': 'v8.66'}  # live v8.66
h = hashlib.sha256(p.read_bytes()).hexdigest()
assert h in BASES, 'Wrong live base ' + h
s = p.read_text(encoding='utf-8-sig')
def rep(a, b, what):
    global s
    s = replace(s, a, b, what, str(p))

# D1. THE WRITES. A shift taken off is tombstoned (S.deleted), the way every removal on this record travels; the line itself
# stays, so Put back is one tap. ourCosts() hides a tombstoned line, so the day, the whole-job roster table, the Finance
# review and the P&L forecast all drop it together. Nothing is priced differently; a line is simply off or on.
rep("function runAddPerson(name, type){", r"""/* v8.67 - did not work: the shift comes off the day (a tombstone, as every removal on this record), and can be put back */
function runShiftId867(person, iso){ return 'W-L-' + ourSlug(person) + '-' + String(iso).replace(/-/g, ''); }
function runOffCell867(r, iso, ed){
 if (!ed) return '';
 const id = runShiftId867(r.name, iso), raw = ourRawOf(id);
 if (r.shift) return `<button class="btn ghost sm" data-rsoff="${esc(r.name)}" title="Take this shift off the record — ${esc(r.name)} did not work this day. It comes off every total and the forecast; Put back is one tap.">Did not work</button>`;
 if (raw && tombedHere(id)) return `<button class="btn ghost sm" data-rson="${esc(r.name)}" title="Put the shift back on the record">Put back</button>`;
 return '';
}
function runShiftOff867(person, iso){
 const id = runShiftId867(person, iso);
 if (!ourRawOf(id) || tombedHere(id)) return false;
 if (!mayWrite('the shift')) return false;
 const who = whoAmI(); if (!who) return false;
 tomb(id, who); save();
 flash(`${person}, ${fmtDay(iso).dm}: shift taken off by ${who} — it is off every total and the forecast. Put back is on the row.`);
 return true;
}
function runShiftBack867(person, iso){
 const id = runShiftId867(person, iso);
 if (!ourRawOf(id) || !tombedHere(id)) return false;
 if (!mayWrite('the shift')) return false;
 const who = whoAmI(); if (!who) return false;
 untomb(id, who); save();
 flash(`${person}, ${fmtDay(iso).dm}: shift put back by ${who}.`);
 return true;
}
function runAddPerson(name, type){""", 'D1 the writes')

# D2. THE DAY TABLE. One more column at the end of the day's running sheet, for editors only: Did not work on a row with a
# shift, Put back on a row whose shift was taken off. View-only links see nothing new.
rep('<th class="num">Day total</th><th>Note</th></tr></thead><tbody>', '<th class="num">Day total</th><th>Note</th><th class="rsoff867"></th></tr></thead><tbody>', 'D2a header')
rep("data-rsf=\"note\" data-rsp=\"${n}\"`, r.shift && r.shift.note, '', 130)}</td></tr>`; }).join('')}",
    "data-rsf=\"note\" data-rsp=\"${n}\"`, r.shift && r.shift.note, '', 130)}</td><td class=\"rsoff867\">${runOffCell867(r, iso, ed)}</td></tr>`; }).join('')}", 'D2b row cell')
rep(" <td class=\"num\"><b>${mz(tot('total'))}</b></td><td></td></tr>", " <td class=\"num\"><b>${mz(tot('total'))}</b></td><td></td><td class=\"rsoff867\"></td></tr>", 'D2c total row')
rep("pane.querySelectorAll('[data-rsf]').forEach(i => i.onchange = () => { runSetShift(i.dataset.rsp, iso, {[i.dataset.rsf]: i.value}); render(); });",
    """pane.querySelectorAll('[data-rsf]').forEach(i => i.onchange = () => { runSetShift(i.dataset.rsp, iso, {[i.dataset.rsf]: i.value}); render(); });
 pane.querySelectorAll('[data-rsoff]').forEach(b => b.onclick = () => { const who = b.dataset.rsoff; if (!confirm(`${who} did not work on ${fmtDay(iso).dm} — take the shift off? It comes off every total and the forecast. Put back stays on the row.`)) return; if (runShiftOff867(who, iso)) render(); }); /* v8.67 */
 pane.querySelectorAll('[data-rson]').forEach(b => b.onclick = () => { if (runShiftBack867(b.dataset.rson, iso)) render(); });""", 'D2d handlers')

rep('<style id="flicker863">', """<style id="didnotwork867">
/* v8.67 Did not work */
.rstbl td.rsoff867{white-space:nowrap}
.rstbl td.rsoff867 .btn.sm{font-size:12px;padding:4px 9px}
</style>
<style id="flicker863">""", 'D3 style')
rep('· v8.66', '· v8.67', 'footer version')
p.write_text(s, encoding='utf-8-sig')
