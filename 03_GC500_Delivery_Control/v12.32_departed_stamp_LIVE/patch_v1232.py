"""Author: Andrew Fisher. v12.32 - the departed stamp, and asset numbers and known sizes on every Demob line.

Andrew, 26 Oct 2026: "Asset no 1277089 left 60kva trailer left 810AM. Need to update everywhere and we create a departed stamp some
how please. I want asset numbers and known size and dimensions please. Need this to be really good and look really good".

  - A DEPARTED ink stamp with the date and time it left (the departure record, Departure1211): on the Demob pick-up list beside the
    green light, and big at the top of the reference's drawer with what left (units, asset numbers) and who recorded it; the drawer's
    state card reads Departed with the time it left, not In transit.
  - Everywhere the page puts a reference's state into words (deliveryView's short, label and said: search, the finder, unit lines,
    the driver card, the light's title), a reference that has left in full reads "Departed" with the time instead of "In transit".
    Only the words change; the light, its colour, the counts and every rule that reads the state are untouched.
  - Every Demob line shows its asset numbers and the size the page holds, or says plainly "Size not on record" / "Asset no. and
    size not on record" rather than showing nothing.
Read only: no record, plan, charge, QR or tracker change. Every edit must find its text exactly once on the verified v12.31 page.
Footer v12.31 -> v12.32.
    python3 patch_v1232.py page.html      (in place, on the live v12.31 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'ab553fe31de9fd4a3e857db17b83dfd2b6943a26ef47fb1bf1ec3ba969564315'
FOOT_OLD, FOOT_NEW = "+' · v12.31'; /* v8.19 release922", "+' · v12.32'; /* v8.19 release922"
TAIL = '</body>\n</html>\n'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()
GONE_OLD = """if (x.s === 'gone') return '<td data-label="Status" class="st1231 s-gone">' + L + line('gone', 'Picked up', '<b>' + e1231(when(x.g.at) || (x.g.date ? day(x.g.date) + ' · time not recorded' : 'time not recorded')) + '</b>' + (x.g.by ? ' · ' + e1231(x.g.by) : '')) + '</td>';"""
GONE_NEW = """if (x.s === 'gone') return '<td data-label="Status" class="st1231 s-gone">' + L + (W.Stamp1232 ? W.Stamp1232.html({at: x.g.at, date: x.g.date, by: x.g.by}) : line('gone', 'Picked up', '<b>' + e1231(when(x.g.at) || (x.g.date ? day(x.g.date) + ' · time not recorded' : 'time not recorded')) + '</b>' + (x.g.by ? ' · ' + e1231(x.g.by) : ''))) + '</td>';"""
EDITS = [
 ('the departed stamp on the Demob list', GONE_OLD, GONE_NEW),
 ('nothing on record says so', "const s = specs(r); if (!s.nos.length && !s.facts.length) return '';",
  "const s = specs(r); if (!s.nos.length && !s.facts.length) return '<div class=\"sp1231\"><div class=\"fx1231 none\">Asset no. and size not on record</div></div>';"),
 ('no size on record says so', """(s.facts.length ? '<div class="fx1231">' + s.facts.slice(0, 3).map(f => e1231(word(f))).join(' · ') + '</div>' : '') + '</div>';""",
  """(s.facts.length ? '<div class="fx1231">' + s.facts.slice(0, 3).map(f => e1231(word(f))).join(' · ') + '</div>' : '<div class="fx1231 none">Size not on record</div>') + '</div>';"""),
 ('the drawer\'s state card says Departed', "const word = a._cancelled ? 'Cancelled' : partial962 ? partial962.status : d.recorded ? ((LIGHT[d.state] || {}).label || d.state) : (v.label || 'No light set');",
  "const word = a._cancelled ? 'Cancelled' : v.departed1232 ? 'Departed' : partial962 ? partial962.status : d.recorded ? ((LIGHT[d.state] || {}).label || d.state) : (v.label || 'No light set');"),
 ('and when it left', "const sinceW = partial962 ? esc(Information1013.partialWords(partial962)) : d.recorded ? [d.set_at ? 'recorded ' + esc(fmtStamp(d.set_at,d)) : '', d.by ? recorderDisplay772(d.by) : ''].filter(Boolean).join(' · ') : esc(v.why || 'nobody has set a light yet');",
  "const sinceW = (v.departed1232 ? esc(String(v.said).replace(/^Departed - /, '')) + ' · ' : '') + (partial962 ? esc(Information1013.partialWords(partial962)) : d.recorded ? [d.set_at ? 'recorded ' + esc(fmtStamp(d.set_at,d)) : '', d.by ? recorderDisplay772(d.by) : ''].filter(Boolean).join(' · ') : esc(v.why || 'nobody has set a light yet'));"),
]


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.31; rebuild and retest')
    if 'departed1232-script' in text: raise ValueError('v12.32 is already on the page')
    for label, old, new in EDITS:
        if text.count(old) != 1: raise ValueError(f'{label}: expected text found {text.count(old)} times, not once')
        text = text.replace(old, new)
    if not text.endswith(TAIL): raise ValueError('the page does not end with </body></html>')
    text = text[:-len(TAIL)] + (HERE / 'departed1232_src.js').read_text(encoding='utf-8').rstrip() + '\n' + TAIL
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.31 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print(f'patch_v1232 applied: {len(EDITS)} edits + departed1232; the departed stamp on the Demob list and the drawer, Departed in words everywhere, sizes or "not on record" on every line; footer v12.31 -> v12.32')
