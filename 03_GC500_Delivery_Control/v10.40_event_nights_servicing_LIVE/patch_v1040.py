"""Author: Andrew Fisher. v10.40 - event-night servicing charged per unit, per night (Andrew, 16 Oct 2026: "here is a new
charge for these areas to add in. This gets charged Friday, Saturday and Sunday night for each unit. FWF Pump out &
Clean & Restock $72.87; these will be the waste tanks - Tank Pump Out & Clean & Restock $624.60; these will be toilet
blocks with no bottom waste tanks - Sewer Connect Units Clean & Restock $260.25. So we need to add this to each asset
or item of this ... mention the charge for each night then a total for all 3 nights." Then: "the charges I mentioned is
what we charge the V8s. We pay Event Portables for their service.")

The servicing charged to the V8s used to take its quantities from the Event Portables quote Q6844 (780 FWF services,
24 tank pump-outs, 51 block cleans) at these card rates. It now counts what is on each reference:
  - every FWF unit: FWF Pump out & Clean & Restock, each event night;
  - every waste tank: Tank Pump Out & Clean & Restock, each event night;
  - every toilet block on a reference with no waste tank (sewer connect): Sewer Connect Units Clean & Restock, each night.
The nights are the event days the page already holds (EventConfig1013: Fri 23, Sat 24, Sun 25 Oct). A rate typed on the
Pricing tab still stands in for the card rate. The quote's water lines (charged at what Event Portables charge us) are
unchanged, and so is the cost side - what we pay Event Portables stays on Costs as rehire cost.
Each reference's drawer shows its servicing: the charge each night and the total for the three nights. The Pricing
servicing table and the P&L follow the same figures - one money path, nothing counted twice.
Footer v10.39 -> v10.40. No record changes.

    python3 patch_v1040.py path/to/page.html   (on the live v10.39 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARK = '/* v10.40 - nights-1040 */'
NEW = r'''/* v10.40 - nights-1040: event-night servicing charged to the V8s per unit, per night (Andrew, 16 Oct 2026). FWF units,
 waste tanks, and toilet blocks on a reference with no waste tank; Fri, Sat and Sun night from the event days. */
const NIGHT1040 = [{kind: 'fwf', card_line: 'FWF Pump out & Clean & Restock', rate: 72.87, unit: 'FWF', units: 'FWF'},
 {kind: 'tank', card_line: 'Tank Pump Out & Clean & Restock', rate: 624.6, unit: 'waste tank', units: 'waste tanks'},
 {kind: 'sewer', card_line: 'Sewer Connect Units Clean & Restock', rate: 260.25, unit: 'toilet block (sewer connect)', units: 'toilet blocks (sewer connect)'}];
function nights1040(){
 let days = null; try { const C = window.EventConfig1013 && EventConfig1013.current ? EventConfig1013.current() : null; days = C && Array.isArray(C.eventDays) && C.eventDays.length ? C.eventDays.slice(0, 3) : null; } catch (e) {}
 days = days || ['2026-10-23', '2026-10-24', '2026-10-25'];
 return days.map(d => { const dt = new Date(d + 'T00:00:00'); return {date: d, day: dt.toLocaleDateString('en-AU', {weekday: 'short'}), label: dt.toLocaleDateString('en-AU', {weekday: 'long', day: 'numeric', month: 'short'}) + ' night'}; });
}
function nightRates1040(){ const b = servicing748base1040(), m = {}; NIGHT1040.forEach(L => { const l = b && (b.card_lines || []).find(x => x.card_line === L.card_line); m[L.kind] = l && l.rate != null ? l.rate : L.rate; }); return m; }
function nightService1040(a, rates){
 if (!a || a._cancelled || (typeof movedAway === 'function' && movedAway(a.key))) return null;
 const N = nights1040(), first = N[0] && N[0].date;
 try { const e = typeof effectiveDates === 'function' ? effectiveDates(a) : null; if (e && e.out_plan && first && e.out_plan < first) return null; } catch (e) {}
 const ls = chargeLines(a) || [], q = re => ls.filter(l => re.test(String(l.item || ''))).reduce((n, l) => n + (Number(qtyOf(l)) || 0), 0);
 const n = {fwf: q(/^FWF$/i), tank: q(/waste\s*tank|holding\s*tank|sewage/i), blocks: q(/block/i)};
 const R = rates || nightRates1040(), cents = v => Math.round(v * 100) / 100, out = [];
 const add = (kind, units) => { if (!units) return; const L = NIGHT1040.find(x => x.kind === kind), rate = R[kind], per = cents(units * rate);
  out.push({kind, card_line: L.card_line, unit: L.unit, units, rate, per_night: per, nights: N.map(x => Object.assign({}, x, {amount: per})), total: cents(per * N.length)}); };
 add('fwf', n.fwf); add('tank', n.tank); if (!n.tank) add('sewer', n.blocks);
 return out.length ? {ref: a.key, nights: N, lines: out, per_night: cents(out.reduce((t, l) => t + l.per_night, 0)), total: cents(out.reduce((t, l) => t + l.total, 0))} : null;
}
function servicing748(){
 const base = servicing748base1040(); if (!base) return base;
 const cents = v => Math.round(v * 100) / 100, N = nights1040(), R = nightRates1040();
 const per = (typeof holdAssets === 'function' ? holdAssets(() => allAssets()) : allAssets()).map(a => nightService1040(a, R)).filter(Boolean);
 const by = {}; per.forEach(r => r.lines.forEach(l => { const b = by[l.card_line] || (by[l.card_line] = {units: 0, refs: 0}); b.units += l.units; b.refs++; }));
 const lines = (base.card_lines || []).map(l => { const L = NIGHT1040.find(x => x.card_line === l.card_line); if (!L) return l; const b = by[l.card_line] || {units: 0, refs: 0}, qty = b.units * N.length;
  return Object.assign({}, l, {quote_qty1040: l.qty, qty, units1040: b.units, refs1040: b.refs, per_night1040: cents(b.units * l.rate),
   description: l.card_line + ' · ' + b.units + ' ' + (b.units === 1 ? L.unit : L.units) + ' × ' + N.length + ' nights (' + N.map(x => x.day).join(', ') + ') · ' + money(cents(b.units * l.rate)) + ' a night',
   amount: cents(qty * l.rate)}); });
 const all = lines.concat(base.at_cost || []);
 return Object.assign({}, base, {lines: all, card_lines: lines, total: cents(all.reduce((t, l) => t + l.amount, 0)), card_total: cents(lines.reduce((t, l) => t + l.amount, 0)), per1040: per, nights1040: N});
}
/* the drawer: what this reference is charged for servicing on the event nights */
function nightsHtml1040(ref){
 const a = typeof assetOf === 'function' ? assetOf(ref) : null; const s = a && nightService1040(a); if (!s) return '';
 const e = v => esc(String(v)); const head = s.nights.map(n => '<th class="num">' + e(n.day) + ' night</th>').join('');
 const rows = s.lines.map(l => '<tr><td>' + e(l.card_line) + '<br><span class="w">' + e(l.units) + ' × ' + e(money(l.rate)) + '</span></td>' + l.nights.map(n => '<td class="num">' + e(money(n.amount)) + '</td>').join('') + '<td class="num"><b>' + e(money(l.total)) + '</b></td></tr>').join('');
 const tot = s.lines.length > 1 ? '<tr class="tot"><td>Each night · all three</td>' + s.nights.map(() => '<td class="num">' + e(money(s.per_night)) + '</td>').join('') + '<td class="num"><b>' + e(money(s.total)) + '</b></td></tr>' : '';
 return '<div class="ns1040"><div class="sect">Event nights servicing · charged to the V8s</div><div class="tblwrap"><table class="tbl"><thead><tr><th>Service</th>' + head + '<th class="num">' + s.nights.length + ' nights</th></tr></thead><tbody>' + rows + tot + '</tbody></table></div><p class="w">Per unit, per night, at the card. What we pay Event Portables for their service is on Costs.</p></div>';
}
(function(W){ if (typeof W.openAsset !== 'function') return; const orig = W.openAsset;
 const put = ref => { try { const dr = document.getElementById('drawer'); if (!dr || !dr.classList.contains('on')) return; const db = dr.querySelector('.db') || dr; if (db.querySelector('.ns1040')) return; const h = nightsHtml1040(ref); if (!h) return; const box = document.createElement('div'); box.innerHTML = h; const isl = db.querySelector('.cmp816'); if (isl && isl.parentNode) isl.parentNode.insertBefore(box.firstChild, isl.nextSibling); else db.appendChild(box.firstChild); } catch (e) {} };
 W.openAsset = function(key){ const r = orig.apply(this, arguments); put(key); setTimeout(() => put(key), 600); return r; }; })(window);
function servicing748Total(){ const s = servicing748(); return s ? s.total : 0; }'''

REPLACEMENTS = [
    ('the quote-based servicing becomes the base', "function servicing748(){\n const TS = DATA.toilet_servicing;", "function servicing748base1040(){ " + MARK + "\n const TS = DATA.toilet_servicing;"),
    ('per-unit, per-night servicing', "function servicing748Total(){ const s = servicing748(); return s ? s.total : 0; }", NEW),
    ('drawer styling', "/* v9.13 - VMS boards: whose, fleet number, rego and delivery. Author: Andrew Fisher. */",
     ".ns1040{margin:12px 0}.ns1040 .tbl td,.ns1040 .tbl th{white-space:nowrap}.ns1040 .w{color:var(--mute);font-size:12px} /* v10.40 */ /* v9.13 - VMS boards: whose, fleet number, rego and delivery. Author: Andrew Fisher. */"),
    ('Release footer', "+ ' · v10.39'", "+ ' · v10.40'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if MARK in html: sys.exit('patch_v1040 refuses a repeat')
    if "+ ' · v10.39'" not in html: sys.exit('patch_v1040: not the v10.39 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1040 applied: event-night servicing per unit per night (FWF, waste tanks, sewer-connect blocks), drawer shows each night and the total; footer v10.39 -> v10.40')


if __name__ == '__main__':
    main()
