"""Author: Andrew Fisher. v12.38 - the Demob tab, one card per asset, with its Ready light and its booked pick-up.

Andrew, 26 Oct 2026: "i want a spot someon can add the date and time when it will be picked up"; "lets not pre date anything";
"i dont like this have singles each asset is a single item ... exception will be barriers and what is inside a building";
"excpetion is waste tank and toilet"; "take out our coates toilest blocks and aset and put in our list"; "i want everything showing
no ready unless i have ticked it or stated it has been picked up"; "i want the icons to be what the equipment is"; "2 pic for each";
"lets mention date or arrival"; "date selction should bring up a calendar . time selction should be manual entry or with ease use a
clock"; "nothing should be on the Demob card unless we have put that date on i or its been departed on that date"; "ensure we add
all VMS boards"; "the grapgh i want light of even the 5 stars"; "we want colour and glow and pulsate in this demob area".

Everything on site shows one card per unit (singles1238_src.js); a day shows only what was booked for it or left on it; the
day cards count only bookings and departures, with each reference and its asset numbers; the progress card glows, with five
stars (glow1238_src.js). Two new fields on the reference's delivery record, each unit on its own clock:
    ready1238_units    {unit: {on, at, by, why}}       the unit's own Ready / Not ready tick
    pickup1238_units   {unit: {at, note, by, set}}     the unit's booked pick-up ("" at once cleared); set is its clock
with their histories (ready1238_history, pickup1238_history, 400 at most). mergeRecords keeps, unit by unit, the later stamp;
the histories join; a record holding only these is kept (deliveryEmpty). v12.36's master-plan overview and progress card give
way to the new ones; its count names assets; its watcher leaves the new parts alone. No departure, Emptied, charge, QR or
tracker change. Every edit must find its text exactly once on the verified live v12.37 page (Codex's supplier crew actuals on v12.36). Footer -> v12.38.
    python3 patch_v1238.py page.html      (in place, on the live v12.37 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'd0c7d444d9b9c1aef434478a283bb4fc5b0cbafeb70a329cc1a561f982bb986a'
FOOT_OLD, FOOT_NEW = "+' · v12.37'; /* v8.19 release922", "+' · v12.38'; /* v8.19 release922"
TAIL = '</body>\n</html>\n'
SRC = ('singles1238_src.js', 'glow1238_src.js')
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

READY_MERGE = "if (rw1231) Object.assign(m, rw1231);"
UNIT_MERGE = READY_MERGE + """
 /* v12.38 - each unit's Ready tick and booked pick-up merge on their own clocks, unit by unit: the later stamp wins, a tie goes to the larger record */
 const um1238 = (x, y, t) => { const o = Object.assign({}, x && typeof x === 'object' ? x : {}); Object.keys(y && typeof y === 'object' ? y : {}).forEach(u => { const p = o[u], q = y[u]; if (!q || typeof q !== 'object') return; const s1 = String(q[t] || ''), s0 = p ? String(p[t] || '') : ''; if (!p || s1 > s0 || (s1 === s0 && J(q) > J(p))) o[u] = q; }); return o; };
 if (a.ready1238_units || b.ready1238_units) m.ready1238_units = um1238(a.ready1238_units, b.ready1238_units, 'at');
 if (a.pickup1238_units || b.pickup1238_units) m.pickup1238_units = um1238(a.pickup1238_units, b.pickup1238_units, 'set');"""
RH_OLD = "const RH1231 = hist(a.ready1231_history, b.ready1231_history, h => h.ready + '|' + h.at); if (RH1231.length) m.ready1231_history = RH1231; /* v12.31 */"
RH_NEW = RH_OLD + """
 const RUH1238 = hist(a.ready1238_history, b.ready1238_history, h => (h.unit || '') + '|' + h.ready + '|' + h.at); if (RUH1238.length) m.ready1238_history = RUH1238; /* v12.38 */
 const PKH1238 = hist(a.pickup1238_history, b.pickup1238_history, h => (h.unit || '') + '|' + (h.pickup || '') + '|' + h.at); if (PKH1238.length) m.pickup1238_history = PKH1238; /* v12.38 */"""
OV_OLD = "function overview() {\n const pane = D.getElementById('pane-demob'); if (!pane) return;\n const old = pane.querySelector('.ov1236')"
OV_NEW = "function overview() {\n const pane = D.getElementById('pane-demob'); if (!pane) return;\n if (W.Singles1238) { const o = pane.querySelector('.ov1236'); if (o) o.remove(); return; } /* v12.38 - the cards carry their own map pictures */\n const old = pane.querySelector('.ov1236')"
PG_OLD = "function progress() {\n const pane = D.getElementById('pane-demob'); if (!pane) return;\n const card = pane.querySelector('.dmday816'); if (!card) return;"
PG_NEW = PG_OLD + "\n if (W.Glow1238) { const o = card.querySelector('.pg1236'); if (o) o.remove(); return; } /* v12.38 - the progress card lit up draws it */"
BT_OLD = " const bt = 'Everything on site · ' + mine.length;"
BT_NEW = " const bt = 'Everything on site · ' + (W.Singles1238 ? Singles1238.count() + ' assets' : mine.length); /* v12.38 */"
H3_OLD = "h.textContent = 'Everything on site · ' + mine.length + (mine.length === 1 ? ' reference' : ' references');"
H3_NEW = "h.textContent = 'Everything on site · ' + (W.Singles1238 ? Singles1238.count() + ' assets' : mine.length + (mine.length === 1 ? ' reference' : ' references'));"
WATCH_OLD = "mo = new MutationObserver(ms => { if (ms.every(m => m.target && m.target.closest && m.target.closest('.ov1236,.mpf1236'))) return; soon(); });"
WATCH_NEW = "mo = new MutationObserver(ms => { if (ms.every(m => m.target && m.target.closest && m.target.closest('.ov1236,.mpf1236,.sgv1238,.pg1238,.dl1238'))) return; soon(); }); /* v12.38 - the new cards, progress and day lists look after themselves */"

EDITS = [
 ('the unit ticks and bookings merge unit by unit', READY_MERGE, UNIT_MERGE),
 ('their histories merge', RH_OLD, RH_NEW),
 ('a record holding only these is kept', "typeof d.ready1231 !== 'boolean' && !d.date_off_at", "typeof d.ready1231 !== 'boolean' && !d.ready1238_units && !d.pickup1238_units && !d.date_off_at"),
 ('v12.36 overview gives way', OV_OLD, OV_NEW),
 ('v12.36 progress gives way', PG_OLD, PG_NEW),
 ('the everything button counts assets', BT_OLD, BT_NEW),
 ('the everything heading counts assets', H3_OLD, H3_NEW),
 ('v12.36 leaves the new parts to themselves', WATCH_OLD, WATCH_NEW),
]


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.37; rebuild and retest')
    if 'singles1238-script' in text or 'glow1238-script' in text: raise ValueError('v12.38 is already on the page')
    for label, old, new in EDITS:
        if text.count(old) != 1: raise ValueError(f'{label}: expected text found {text.count(old)} times, not once')
        text = text.replace(old, new)
    if not text.endswith(TAIL): raise ValueError('the page does not end with </body></html>')
    text = text[:-len(TAIL)] + ''.join((HERE / f).read_text(encoding='utf-8').rstrip() + '\n' for f in SRC) + TAIL
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.37 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print(f'patch_v1238 applied: {len(EDITS)} edits + singles1238 + glow1238; one card per asset with its Ready light, booked pick-up, '
          'two map pictures and arrival; days from bookings and departures; the progress card lit up; footer v12.37 -> v12.38')
