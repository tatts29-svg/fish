"""Author: Andrew Fisher. v12.29 - a departed icon on the main maps.

Andrew, 26 Oct 2026 (this chat), after GN10's generator 1283681 was recorded as left site at 07:40: "And we want a departed icon
now too on the main maps too please". The Map explorer marks LEFT SITE (v12.11). The other maps showed nothing once equipment
had gone: GN10 stood on the satellite map of VMS boards, generators and gates as if it were still there.

  - The satellite map (SatMap1141: the Map tab's "VMS, generators & gates" and the VMS tab's board map): a departed generator or
    board is drawn faded with a ↗ on a green disc, its label reads "GN10 · LEFT SITE" (a part pick-up "3 LEFT"), its title the
    time; the list under the map says "↗ Left site · 26 Oct 07:40" on its row; one line under the buttons names what has left.
  - The drawing sheets' reference pills (renderMap_held): the same ↗ disc on the pill's free corner (bottom left), the pill dashed
    once everything on it has left, the title and the accessible name saying so.
  - The Map explorer's card read "Left site · Qty 0" for a reference that had left in full (the quantity still to leave). It now
    shows what left (Departure1211.project carries the collected quantities as taken1229; the explorer frame reads them). The same
    card said "In transit ... Still to come: On site → At location → Installed → Finished" once the last units had gone (the light
    reads in transit); it now says "Left site · 26 Oct 07:40 ... nothing still to come on site" (Departed1229 wraps gc500PlanCard).

Everything is read from the page's own departure record (Departure1211, typed collection quantities with the actual time) through
Departed1229 (departed1229_src.js, inserted before the satellite map's script): one read per record change, of the references
whose delivery history holds a collection entry. Read only; no record, charge, count or hire changes. Every edit must find its
text exactly once on the verified v12.28 page. Footer v12.28 -> v12.29.
    python3 patch_v1229.py page.html      (in place, on the live v12.28 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'c8057284f1b0f42f7eef336a4def584574e7baea8146239c5273fbcee0c497d3'
FOOT_OLD, FOOT_NEW = "+' · v12.28'; /* v8.19 release922", "+' · v12.29'; /* v8.19 release922"
ANCHOR = '<script id="satmap1141-script">'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

PIN_OLD = """M.shown().forEach(i => { const [bx, by] = pt(i.lat, i.lon); const gen = i.kind === 'gen';
  h += `<g class="s1141-pin ${gen ? 'gen' : 'vms'}" data-s1141-nav="${esc(i.lat)},${esc(i.lon)}" data-id="${esc(i.id)}"><title>${esc(i.label)} · ${esc(i.name)}</title>`;
  if (gen) h += `<rect x="${bx - r}" y="${by - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.22}" fill="${i.colour}" stroke="#101418" stroke-width="${lw}"/>`;
  else h += `<circle cx="${bx}" cy="${by}" r="${r}" fill="${i.colour}" stroke="#101418" stroke-width="${lw}"/>`;
  h += `<text x="${bx}" y="${by + f * 0.36}" text-anchor="middle" font-size="${f * (i.num.length > 2 ? 0.8 : 1)}" font-weight="700" fill="#101418" class="s1141-num">${esc(i.num)}</text><text x="${bx + r * 1.25}" y="${by + f * 0.38}" font-size="${f}" fill="#fff" stroke="#000" stroke-width="${f * 0.28}" paint-order="stroke" class="s1141-lbl">${esc(i.label)}</text></g>`; });"""
PIN_NEW = """M.shown().forEach(i => { const [bx, by] = pt(i.lat, i.lon); const gen = i.kind === 'gen', left = left1229(i, DS1229), dim = left && left.complete ? ' fill-opacity=".45"' : '';
  h += `<g class="s1141-pin ${gen ? 'gen' : 'vms'}${left ? ' s1141-left' + (left.complete ? ' gone' : '') : ''}" data-s1141-nav="${esc(i.lat)},${esc(i.lon)}" data-id="${esc(i.id)}"><title>${esc(i.label)} · ${esc(i.name)}${left ? ' · ' + esc(left.words) : ''}</title>`;
  if (gen) h += `<rect x="${bx - r}" y="${by - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.22}" fill="${i.colour}"${dim} stroke="#101418" stroke-width="${lw}"/>`;
  else h += `<circle cx="${bx}" cy="${by}" r="${r}" fill="${i.colour}"${dim} stroke="#101418" stroke-width="${lw}"/>`;
  h += `<text x="${bx}" y="${by + f * 0.36}" text-anchor="middle" font-size="${f * (i.num.length > 2 ? 0.8 : 1)}" font-weight="700" fill="#101418" class="s1141-num">${esc(i.num)}</text><text x="${bx + r * 1.25}" y="${by + f * 0.38}" font-size="${f}" fill="#fff" stroke="#000" stroke-width="${f * 0.28}" paint-order="stroke" class="s1141-lbl">${esc(i.label)}${left ? ' · ' + esc(left.tag) : ''}</text>${left ? W.Departed1229.badge(bx - r * 0.95, by - r * 0.95, r * 0.8, u) : ''}</g>`; });"""

EDITS = [
 # 1. the satellite map: the departure of a generator (its reference) or a board (its plan position), read once a draw
 ('satellite map helpers',
  "function pinsHtml(M, svg){\n const u = unit(M, svg), r = 12 * u, f = 11.5 * u, lw = 2 * u; let h = '';",
  "/* v12.29 - a departed icon (Andrew, 26 Oct 2026: \"we want a departed icon now too on the main maps too please\"): the page's own\n"
  "   departure record for a generator (its reference) or a VMS board (its plan position), from one Departed1229 snapshot */\n"
  "function left1229(i, DS){ if (!DS || !i) return null; return i.kind === 'gen' ? DS.refs.get(String(i.id)) || null : i.kind === 'vms' ? DS.boards.get(String(i.id)) || null : null; }\n"
  "function key1229(M){ const DS = W.Departed1229 ? W.Departed1229.snapshot() : null; if (!DS) return ''; const gone = M.items.map(i => [i, left1229(i, DS)]).filter(x => x[1]);\n"
  " return gone.length ? '<b aria-hidden=\"true\">↗</b>' + (gone.length === 1 ? 'Left site: ' : 'Left site (' + gone.length + '): ') + gone.map(x => esc(x[0].label) + (x[1].complete ? '' : ' (' + esc(x[1].tag.toLowerCase()) + ')') + (x[1].short ? ' ' + esc(x[1].short) : '')).join(' · ') : ''; }\n"
  "function keyLine1229(M){ const k = key1229(M); return '<p class=\"dep1229-key\"' + (k ? '' : ' hidden') + '>' + k + '</p>'; }\n"
  "/* the card is built once and kept across redraws: when the departure record changes, its key line, its rows and its pins follow */\n"
  "function refresh1229(m){ const M = live[m.key], svg = M && M.svg(); if (!svg) return; const card = svg.closest('.s1141-map'), DS = W.Departed1229 ? W.Departed1229.snapshot() : null, sig = DS ? DS.sig : '';\n"
  " if (!card || card.__dep1229 === sig) return; card.__dep1229 = sig;\n"
  " const kp = card.querySelector('.dep1229-key'), kh = key1229(M); if (kp) { kp.innerHTML = kh; kp.hidden = !kh; }\n"
  " card.querySelectorAll('.s1141-list li[data-id]').forEach(li => { const i = M.items.find(x => String(x.id) === li.dataset.id && x.kind === li.dataset.kind), old = li.querySelector('.dep1229-row'), b = li.querySelector('b'), d = i ? left1229(i, DS) : null;\n"
  "  if (old) old.remove(); if (d && b) b.insertAdjacentHTML('afterend', W.Departed1229.rowHtml(d)); });\n"
  " apply(M, svg); }\n"
  "function pinsHtml(M, svg){\n const u = unit(M, svg), r = 12 * u, f = 11.5 * u, lw = 2 * u, DS1229 = W.Departed1229 ? W.Departed1229.snapshot() : null; let h = '';"),
 # 2. the satellite map's pins: faded, LEFT SITE on the label, the time in the title, the ↗ disc
 ('satellite map pins', PIN_OLD, PIN_NEW),
 # 3. the satellite map's list: the row says it has left, with the time
 ('satellite map list rows',
  "const row = i => `<li data-kind=\"${esc(i.kind)}\"><i class=\"s1141-chip ${i.kind}\" style=\"background:${esc(i.colour)}\"></i><div><b>${esc(i.label)}</b> · ${esc(i.name)}",
  "const DS1229 = W.Departed1229 ? W.Departed1229.snapshot() : null, dep1229 = i => (W.Departed1229 ? W.Departed1229.rowHtml(left1229(i, DS1229)) : ''); /* v12.29 */\n"
  " const row = i => `<li data-kind=\"${esc(i.kind)}\" data-id=\"${esc(i.id)}\"><i class=\"s1141-chip ${i.kind}\" style=\"background:${esc(i.colour)}\"></i><div><b>${esc(i.label)}</b>${dep1229(i)} · ${esc(i.name)}"),
 ('satellite map unplaced rows',
  "const noneRow = i => `<li class=\"s1141-none\" data-kind=\"${esc(i.kind)}\"><i class=\"s1141-chip ${i.kind} none\"></i><div><b>${esc(i.label)}</b> · ${esc(i.name)}",
  "const noneRow = i => `<li class=\"s1141-none\" data-kind=\"${esc(i.kind)}\" data-id=\"${esc(i.id)}\"><i class=\"s1141-chip ${i.kind} none\"></i><div><b>${esc(i.label)}</b>${dep1229(i)} · ${esc(i.name)}"),
 # 4. one line under the buttons: what has left on this map
 ('satellite map key',
  "${filt}</div>\n <div class=\"s1141-view\">",
  "${filt}</div>${keyLine1229(M)}\n <div class=\"s1141-view\">"),
 # 4b. a redraw of the tab brings the kept card up to the departure record
 ('satellite map refresh',
  "function wrap(name, m){ const r0 = W[name]; if (typeof r0 !== 'function') return false; W[name] = function(){ const r = r0.apply(this, arguments); try { watch(m); inject(m, 0); } catch (e) {} return r; }; return true; }",
  "function wrap(name, m){ const r0 = W[name]; if (typeof r0 !== 'function') return false; W[name] = function(){ const r = r0.apply(this, arguments); try { watch(m); inject(m, 0); refresh1229(m); } catch (e) {} return r; }; return true; }"),
 # 5. the drawing sheets: one snapshot a draw ...
 ('sheet snapshot',
  "const mks = sh.markers.map((m, i) => {",
  "const DS1229 = typeof Departed1229 === 'object' ? Departed1229.snapshot() : null; /* v12.29 - the departed icon, read once a draw */\n"
  " const mks = sh.markers.map((m, i) => {"),
 # 6. ... the pill dashed once everything on it has left ...
 ('sheet pill class',
  " if (movedKeys.length) cls.push('movedloc');",
  " if (movedKeys.length) cls.push('movedloc');\n"
  " const left1229 = DS1229 && linked && linked.length ? Departed1229.keysIn(DS1229, linked) : null; if (left1229 && left1229.all) cls.push('mkleft1229'); /* v12.29 */"),
 # 7. ... its title and accessible name say so ...
 ('sheet pill title',
  " data-keys=\"${esc((linked||[]).join(','))}\"${unit ? ` data-unit=\"${esc(unit.label || '')}\"` : ''} title=\"${esc(t)}\"",
  " data-keys=\"${esc((linked||[]).join(','))}\"${unit ? ` data-unit=\"${esc(unit.label || '')}\"` : ''} title=\"${esc(t + (left1229 ? ' — LEFT SITE: ' + left1229.words : ''))}\"${left1229 ? ' data-left1229=\"' + (left1229.all ? 'all' : 'part') + '\"' : ''}"),
 ('sheet pill name',
  "aria-label=\"${esc(name + (lightWords ? ' — ' + lightWords : '') + doneWords + lvlWords + stpWords + bdWords + movedWord + offWords)}\">",
  "aria-label=\"${esc(name + (lightWords ? ' — ' + lightWords : '') + doneWords + lvlWords + stpWords + bdWords + movedWord + offWords + (left1229 ? ' — left site: ' + left1229.words : ''))}\">"),
 # 8. ... and the ↗ disc on the pill's free corner
 ('sheet pill icon',
  "offKeys.length ? `<i class=\"nox\" title=\"cancelled\">${noGlyph(12)}</i>` : ''}</button>`;",
  "offKeys.length ? `<i class=\"nox\" title=\"cancelled\">${noGlyph(12)}</i>` : ''}${left1229 ? `<i class=\"leftx1229\" title=\"${esc(left1229.words)}\" aria-hidden=\"true\">↗</i>` : ''}</button>`;"),
 # 9. the explorer's card: a reference that has left shows what left, not the 0 still to leave
 ('departure carries what left',
  "items:r.remaining,events,",
  "items:r.remaining,taken1229:r.collected,events,"),
 ('a departed board carries what left',
  "items:[{type:'VMS',n:0}],label:'Left site',last:b.departure1211.at});",
  "items:[{type:'VMS',n:0}],taken1229:[{type:'VMS',n:1}],label:'Left site',last:b.departure1211.at});"),
 ('explorer card quantity',
  "const quantities={items:d.items.map(i=>({item:i.type,quantity:i.n}))};",
  "const quantities={items:(d.complete&&Array.isArray(d.taken1229)?d.taken1229:d.items).map(i=>({item:i.type,quantity:i.n}))};"),
]


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.28; rebuild and retest')
    if 'departed1229-script' in text: raise ValueError('Departed1229 is already on the page')
    for label, old, new in EDITS:
        if text.count(old) != 1: raise ValueError(f'{label}: expected text found {text.count(old)} times, not once')
        text = text.replace(old, new)
    if text.count(ANCHOR) != 1: raise ValueError('the satellite map script is not on the page once')
    text = text.replace(ANCHOR, (HERE / 'departed1229_src.js').read_text(encoding='utf-8').rstrip() + '\n' + ANCHOR)
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.28 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print(f'patch_v1229 applied: {len(EDITS)} edits + Departed1229; a departed icon on the satellite map and the drawing sheets, the explorer card shows what left; footer v12.28 -> v12.29')
