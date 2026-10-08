#!/usr/bin/env python3
# Author: Andrew Fisher. v9.14 - fire extinguishers: added by quantity on any location, no asset number, charged per piece.
#
# The project manager, on site, about 16:25 AEST 8 Oct 2026: "also on another note i see no option to add fire extinguishers.
# these dont have a asset no a remember they have a charge also".
#
# Why he saw no option (live v9.11, read only): the card's Fire Ext. column is priced on the portable buildings only (49 of 176
# references), and there it is a yes/no tick among the labour lines in the editors-only "Contract & charges" fold, assuming one
# per building; every other item type has it withheld by the v5.81 labour rule (0.00, no column, "N/A" or "Included"). The
# accessories form has no fire extinguisher type and is offered on buildings and toilets only (v7.43).
#
# What it adds (code only - DATA, the footer, MASTER_LOC, markers and every other collection are untouched):
#  - on EVERY location's drawer (building, toilet, container, generator, tower, barrier, furniture, plant line), in "Inside it
#    and asset numbers": a "Fire extinguishers" part. An editor sets the quantity with - and + and presses "Add fire
#    extinguisher" (or "Save quantity" / "Take off" once there are some). No asset number is asked for. One save writes one
#    document - the location's own 'accessories' document - through the page's guarded path (mayWrite, whoAmI, bump); the row
#    carries who and when (added_by/added_at, then edited_by/edited_at). Viewing never writes. The view link shows the count
#    and no control;
#  - "Fire extinguisher x n" shown on the drawer, the Equipment row (beside "N inside it") and the Drivers / Install sheets
#    (the accessories column, with a tick box on the Install sheet). The rows are kept out of the ordinary accessories list,
#    count and hire pricing, so each fact shows once and nothing is priced twice;
#  - THE CHARGE, per piece, through the page's existing fire_ext money path (labourMoney -> assetTotal -> moneySummary, the
#    P&L's pl760Ticks, the Accruals/Finance acc761Model, labourPlan, Pricing and the labour card), at the card's Fire Ext.
#    figure for the location's item type where the card prices it; where it does not (0.00, no column, N/A, Included) the
#    charge reads "rate to confirm" - money unknown, never nought - and the location's total is marked incomplete while every
#    other figure on it stays as it was;
#  - THE ONE RULE THAT CANNOT DOUBLE COUNT: an added quantity REPLACES the per-building fire_ext ticks and forecast for that
#    location (its tick box is disabled with the reason). A location with no added quantity works exactly as before.
#    On the record of 8 Oct 2026 no fire_ext tick is recorded anywhere, so no existing money moves.
#
#   python3 patch_v914_fire_ext.py <page>
import os, re, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
text = open(path, encoding='utf-8').read()
if 'function fire914Of(' in text or 'labourMoney914base' in text:
    sys.exit('v9.14 is already applied - stopping')
for need in ('function labourLinesFor(', 'function labourTicked(', 'function labourMoney(', 'function assetTotal(', 'function labourPlan(',
             'function pl760Ticks(', 'function acc761Model(', 'function acc761Labour(', 'function labourCard(', 'function labourTicksHtml(',
             'function drawer816(', 'function drawerTidy(', 'function dpAcc(', 'function contentsCell(', 'function moneySummary_(',
             'function cardRate(', 'function whoAmI(', 'function mayWrite(', 'function bump(', 'accessories: {kind: \'value\''):
    if need not in text:
        sys.exit('the base is missing ' + need + ' - stopping')

m = re.search(r'const DATA = (\{.*?\});\n', text)
assert m, 'DATA not found'
DATA_TEXT = m.group(1)
assert json.dumps(json.loads(DATA_TEXT), ensure_ascii=False, separators=(',', ':')) == DATA_TEXT, 'DATA must round-trip exactly - stopping'
FOOT = re.findall(r" · v9\.\d+'", text)
ML = re.search(r'const MASTER_LOC = (\{.*?\});\n', text)
assert ML, 'MASTER_LOC not found'
MASTER_TEXT = ML.group(1)

JS = r'''
/* v9.14 - FIRE EXTINGUISHERS, ADDED BY QUANTITY ON ANY LOCATION, CHARGED PER PIECE. Author: Andrew Fisher.
 The project manager, on site, about 16:25 AEST 8 Oct 2026: "also on another note i see no option to add fire extinguishers.
 these dont have a asset no a remember they have a charge also".
 A fire extinguisher is a row of type 'Fire extinguisher' in the location's own 'accessories' document (one document per
 reference, already synced): a quantity, no asset number, with who and when. It is kept out of the ordinary accessories list,
 count and hire pricing (it is not hired by the week), and charged per piece through the fire_ext line the card already has:
 at the card's Fire Ext. figure for the location's item type where the card prices one, else "rate to confirm" - unknown,
 never nought. An added quantity replaces that location's per-building fire_ext ticks and forecast, so nothing is counted
 twice; a location with none added works exactly as before. */
const FIRE914 = 'Fire extinguisher';
const FIRE914_DRAFT = {};
function fire914Is(x){ return !!x && x.type === FIRE914; }
function fire914Rows(key){ if (!key || movedAway(key)) return []; return (((typeof S !== 'undefined' && S.accessories) || {})[key] || []).filter(fire914Is); }
function fire914Qty(key){ return fire914Rows(key).reduce((n, x) => { const q = Number(x.qty); return n + (Number.isSafeInteger(q) && q > 0 ? q : 0); }, 0); }
function fire914Words(n){ return FIRE914 + ' × ' + n; }
function fire914Last(key){
 const rows = fire914Rows(key).slice().sort((p, q) => String(q.edited_at || q.added_at || '').localeCompare(String(p.edited_at || p.added_at || '')));
 const r = rows[0] || {}; return {by: r.edited_by || r.added_by || null, at: r.edited_at || r.added_at || null};
}
/* the card's Fire Ext. line for one charge line, only where the card prices it */
function fire914CardLine(l, key){
 const c = cardRate(l.discipline, l.item, key), lp = c && c.labour_per_piece, L = lp && (lp.lines || []).find(x => x.key === 'fire_ext');
 if (!L) return null;
 const m = L.money || (typeof L.rate === 'number' && L.rate > 0 ? 'rate' : 'absent');
 return m === 'rate' && typeof L.rate === 'number' && L.rate > 0 ? L : null;
}
/* the location's fire extinguishers and where their charge sits: the first charge line the card prices a Fire Ext. figure for,
   else the first charge line with no rate (rate to confirm). Null where none are added, or the location carries no charge
   of its own (cancelled, a follow-up delivery of another reference, a booking piece). */
function fire914Of(a){
 if (!a || a._cancelled || a.rest_of || a._bookingSource801) return null;
 const n = fire914Qty(a.key); if (!n) return null;
 const lines = chargeLines(a);
 let idx = lines.findIndex(l => fire914CardLine(l, a.key));
 const L = idx >= 0 ? fire914CardLine(lines[idx], a.key) : null;
 if (idx < 0) idx = lines.length ? 0 : -1;
 const rate = L ? L.rate : null;
 return {n, idx, host: idx >= 0 ? lines[idx] : null, rate, heading: L ? L.heading : null, year: L ? L.year : null,
  of_this_year: L ? !!L.of_this_year : false, amount: rate != null ? Math.round(rate * n * 100) / 100 : null, last: fire914Last(a.key)};
}
function fire914Host(a, l, F){
 const lines = chargeLines(a); let i = lines.indexOf(l);
 if (i < 0) i = lines.findIndex(x => x.discipline === l.discipline && x.item === l.item);
 return i >= 0 && i === F.idx;
}
/* the labour money on one charge line, with the location's fire extinguishers on its host line: one fire_ext entry carrying
   its own piece count (n) and the card's figure, or no figure (rate to confirm). A known figure adds to the line's total;
   an unknown one leaves the total as it was and marks the line (fire914Unknown), so known money stays known. */
function labourMoney(ref, l, key, asset){
 const m = labourMoney914base(ref, l, key, asset);
 const a = asset || allAssets().find(x => x.key === ref);
 const F = fire914Of(a);
 if (!F || !F.host || !fire914Host(a, l, F)) return m;
 const entry = {key: 'fire_ext', name: 'Fire extinguishers', heading: F.heading || 'no Fire Ext. figure on the card for this item',
  rate: F.rate, year: F.year, of_this_year: F.of_this_year, money: F.rate != null ? 'rate' : 'to confirm',
  money_note: F.rate != null ? 'per piece, the card’s Fire Ext. figure × ' + F.n : 'rate to confirm - the card carries no Fire Ext. figure for this item',
  ticked: true, by: F.last.by, at: F.last.at, n: F.n, fire914: true};
 const out = Object.assign({}, m, {ticked: (m.ticked || []).concat([entry]), fire914: {n: F.n, rate: F.rate, amount: F.amount, entry: entry}});
 if (m.total != null && F.amount != null) out.total = Math.round((m.total + F.amount) * 100) / 100;
 if (F.amount == null) out.fire914Unknown = true;
 return out;
}
/* the charges fold: what the fire extinguishers on this line come to */
function fire914Said(m){
 if (!m || !m.fire914) return '';
 const f = m.fire914;
 return ' · ' + esc(fire914Words(f.n)) + ': ' + (f.amount != null ? esc(money(f.amount)) + ' at the card’s Fire Ext. figure' + (f.entry && f.entry.year ? ' (headed ' + esc(String(f.entry.year)) + ' on the card)' : '') : 'rate to confirm');
}
/* Equipment: the count on the location's row */
function fire914Equip(a){ const n = a ? fire914Qty(a.key) : 0; return n ? `<div class="w" data-fire914-equip="${esc(a.key)}" style="font-size:11px;margin-top:2px"><b>${esc(fire914Words(n))}</b></div>` : ''; }
/* Drivers / Install sheets: one accessory line (a booking piece split over several trucks carries no accessories, as now) */
function fire914Dp(a){ if (!a || a._cancelled || Object.prototype.hasOwnProperty.call(a, '_bookingUnassignedAccessories801')) return []; const n = fire914Qty(a.key); return n ? [{t: fire914Words(n), q: 1, no: ''}] : []; }
/* the drawer's "Inside it" fold title */
function fire914Sub(key, ed){ const n = fire914Qty(key); if (n) return fire914Words(n); const a = ed ? assetOf(key) : null; return ed && a && !a.rest_of && !a._cancelled ? '+ fire extinguisher' : ''; }
/* the labour card: fire extinguishers added where the card has no figure, said as one row */
function fire914CardRow(live){
 const xs = live.map(a => fire914Of(a)).filter(F => F && F.host && F.rate == null);
 if (!xs.length) return '';
 const n = xs.reduce((s, F) => s + F.n, 0);
 return `<tr data-fire914-card><td>Any</td><td><b>Fire extinguishers added by quantity</b></td><td>Fire extinguisher</td><td class="num"><span class="norate">rate to confirm</span></td><td class="num"><b>${esc(String(n))}</b><div class="w" style="font-size:11px;color:var(--mute)">on ${esc(String(xs.length))} reference${xs.length === 1 ? '' : 's'} with no Fire Ext. figure on the card</div></td><td class="num"><span class="norate">unknown</span></td><td></td></tr>`;
}
/* the drawer part: every kind of location */
function fire914Block(a){
 if (!a || !a.key) return '';
 const key = a.key, n = fire914Qty(key), ed = canEdit();
 if (!n && !ed) return '';
 const lines = chargeLines(a), Lr = lines.map(l => fire914CardLine(l, key)), i = Lr.findIndex(Boolean);
 const item = i >= 0 ? lines[i].item : (lines[0] || {}).item || (a.item_types || [])[0] || 'this item';
 const last = fire914Last(key);
 const charge = a.rest_of ? 'A follow-up delivery of ' + a.rest_of + ': fire extinguishers are added and charged on ' + a.rest_of + '.'
  : a._cancelled ? 'Cancelled: nothing is charged here.'
  : i >= 0 ? (n ? 'Charged per piece' : 'Each one is charged per piece') + ' at the card’s Fire Ext. figure for ' + item + (Lr[i].year ? ' (the card heads that column ' + Lr[i].year + ')' : '') + '.'
  : 'Charge: rate to confirm. The card carries no Fire Ext. figure for ' + item + ', so the money reads unknown, never nought, until the project manager gives a rate.';
 const d = FIRE914_DRAFT[key] != null ? FIRE914_DRAFT[key] : (n || 1);
 const can = ed && !a.rest_of && !a._cancelled;
 return `<div class="sect contents fire914h">Fire extinguishers</div>
 <div class="fire914" data-fire914="${esc(key)}" style="margin:2px 0 10px">
 ${n ? `<div class="f914line"><b data-fire914-words>${esc(fire914Words(n))}</b> <span class="w" style="color:var(--mute)">no asset number - counted by quantity${last.by ? ' · ' + esc(last.by) : ''}${last.at ? ' · ' + esc(fmtStamp(last.at)) : ''}</span></div>` : ''}
 <div class="w" data-fire914-charge style="font-size:12px;color:var(--mute);margin-top:2px">${esc(charge)}</div>
 ${can ? `<div class="f914row editonly" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px">
 <span style="display:inline-flex;align-items:center;gap:6px"><button type="button" class="btn" data-fire914-minus aria-label="One fewer fire extinguisher" style="min-width:44px;min-height:44px;font-size:20px;line-height:1">−</button><output data-fire914-n aria-live="polite" style="min-width:2.2em;text-align:center;font-weight:700;font-size:18px">${esc(String(d))}</output><button type="button" class="btn" data-fire914-plus aria-label="One more fire extinguisher" style="min-width:44px;min-height:44px;font-size:20px;line-height:1">+</button></span>
 <button type="button" class="btn primary" data-fire914-save style="min-height:44px">${n ? 'Save quantity' : 'Add fire extinguisher' + (d > 1 ? ' × ' + esc(String(d)) : '')}</button>
 ${n ? '<button type="button" class="btn ghost" data-fire914-off style="min-height:44px">Take off</button>' : ''}
 </div>` : ''}
 </div>`;
}
/* the one save: the location's own accessories document, nothing else (no stamp, no tombstone) */
function fire914Save(key, q){
 if (!mayWrite('a fire extinguisher')) return false;
 if (!Number.isSafeInteger(q) || q < 0 || q > 99) { flash('A fire extinguisher count is a whole number from 0 to 99 - nothing saved.'); return false; }
 const a = allAssets().find(x => x.key === key);
 if (!a || a.rest_of || a._cancelled) { flash('Fire extinguishers are not recorded on ' + key + ' - nothing saved.'); return false; }
 const n = fire914Qty(key);
 if (q === n) { flash(key + ' already has ' + (n ? fire914Words(n) : 'no fire extinguishers') + ' - nothing to save.'); return false; }
 const who = whoAmI(); if (!who) return false;
 S.accessories = S.accessories || {};
 const rows = S.accessories[key] = S.accessories[key] || [];
 const mine = rows.filter(fire914Is), at = new Date().toISOString();
 if (!mine.length) rows.push({type: FIRE914, qty: q, qty_stated: true, as_written: FIRE914, asset_no: null,
  asset_no_state: 'not numbered - counted by quantity', origin: 'added in this page', source_task: null, _added: true, added_at: at, added_by: who});
 else mine.forEach((r, i) => { const v = i === 0 ? q : 0; if (Number(r.qty) !== v) { r.qty = v; r.qty_stated = true; r.edited_at = at; r.edited_by = who; } });
 delete FIRE914_DRAFT[key];
 bump();
 flash(q ? fire914Words(q) + ' on ' + key + ' - recorded by ' + who + '.' : 'Fire extinguishers taken off ' + key + ' by ' + who + '. Add puts them back.');
 return true;
}
function fire914Wire(a){
 const box = document.querySelector('#drawer [data-fire914]'); if (!box || !a) return;
 const key = a.key, n = fire914Qty(key), out = box.querySelector('[data-fire914-n]'), save = box.querySelector('[data-fire914-save]');
 const cur = () => { const v = Number(out && out.textContent); return Number.isSafeInteger(v) ? v : (n || 1); };
 const set = v => { FIRE914_DRAFT[key] = v; if (out) out.textContent = String(v); if (save && !n) save.textContent = 'Add fire extinguisher' + (v > 1 ? ' × ' + v : ''); };
 const mi = box.querySelector('[data-fire914-minus]'), pl = box.querySelector('[data-fire914-plus]'), off = box.querySelector('[data-fire914-off]');
 if (mi) mi.onclick = () => set(Math.max(n ? 0 : 1, cur() - 1));
 if (pl) pl.onclick = () => set(Math.min(99, cur() + 1));
 if (save) save.onclick = () => fire914Save(key, cur());
 if (off) off.onclick = () => fire914Save(key, 0);
}
'''

# 1. the helpers, and labourMoney becomes the wrapper over the page's own (renamed, unchanged)
text = rep(text, 'function labourMoney(ref, l, key, asset){', JS.strip('\n') + '\nfunction labourMoney914base(ref, l, key, asset){', 'labourMoney wrapper', path)
# 2. the replace rule: where a location has an added quantity, its fire_ext ticks do not count
text = rep(text, 'function labourTicked(ref, disc, item, line, unit, asset){\n if (movedAway(ref)) return false;',
           "function labourTicked(ref, disc, item, line, unit, asset){\n if (movedAway(ref)) return false;\n if (line === 'fire_ext' && fire914Qty(ref)) return false; /* v9.14 - an added quantity replaces the per-building tick */",
           'labourTicked replace rule', path)
# 3. the ordinary accessories (list, count, hire pricing, sheets) leave the fire extinguishers out; they are shown and charged their own way
text = rep(text, 'const own = gone ? [] : (S.accessories[a.key] || []);',
           'const own = gone ? [] : (S.accessories[a.key] || []).filter(x => !fire914Is(x)); /* v9.14 - fire extinguishers are counted and charged on their own */',
           'accessories without fire extinguishers', path)
# 4. assetTotal: an unknown fire charge leaves the location's total incomplete while the known labour stays known
text = rep(text, 'if (lab.total == null) labourKnown = false; else labourSum += lab.total;',
           'if (lab.total == null || lab.fire914Unknown) labourKnown = false; if (lab.total != null) labourSum += lab.total; /* v9.14 */',
           'assetTotal unknown fire', path)
# 5. moneySummary_: an unknown fire charge counts as unknown labour
text = rep(text, 'if (l.labour && l.labour.ticked.length) { labourTicks += l.labour.ticked.length; if (l.labour.total != null) labour += l.labour.total; else labourUnknown++; }',
           'if (l.labour && l.labour.ticked.length) { labourTicks += l.labour.ticked.length; if (l.labour.total != null) labour += l.labour.total; else labourUnknown++; if (l.labour.total != null && l.labour.fire914Unknown) labourUnknown++; /* v9.14 */ }',
           'moneySummary unknown fire', path)
# 6. pl760Ticks (the P&L): the added pieces at their own count; unknown when the card has no figure
text = rep(text, " const by = new Map(), put = (x, n) => { const k = by.get(x.key) || {grp: PL760_GROUP[x.key] || 'other', rate: x.rate || 0, n: 0, ticks: 0}; k.n += n; k.ticks++; by.set(x.key, k); };",
           " const by = new Map(), put = (x, n) => { const k = by.get(x.key) || {grp: PL760_GROUP[x.key] || 'other', rate: x.rate || 0, n: 0, ticks: 0}; k.n += n; k.ticks++; if (x.fire914 && x.rate == null) k.unk = true; by.set(x.key, k); }; /* v9.14 - unk: rate to confirm */",
           'pl760Ticks put', path)
text = rep(text, ' else lab.ticked.forEach(x => put(x, lab.qty || 0));\n by.forEach(k => { const amt = lab.total == null ? null :',
           ' else lab.ticked.forEach(x => put(x, x.fire914 ? x.n : (lab.qty || 0)));\n if (lab.perBuilding) (lab.ticked || []).filter(x => x.fire914).forEach(x => put(x, x.n)); /* v9.14 - the added pieces, at their own count */\n by.forEach(k => { const amt = lab.total == null || k.unk ? null :',
           'pl760Ticks fire pieces', path)
# 7. acc761Model (Accruals / Finance): the added pieces as their own unit
text = rep(text, 'const lab = line.labour || {}, units = lab.perBuilding ? (lab.units || []) : [{ticked: lab.ticked || [], quantity: lab.qty}];',
           'const lab = line.labour || {}, units = (lab.perBuilding ? (lab.units || []) : [{ticked: (lab.ticked || []).filter(t => !t.fire914), quantity: lab.qty}]).concat((lab.ticked || []).filter(t => t.fire914).map(t => ({ticked: [t], fire914: true, n: t.n}))); /* v9.14 */',
           'acc761Model units', path)
text = rep(text, 'const multiplier = lab.perBuilding ?', 'const multiplier = unit.fire914 ? acc762Money(unit.n) : lab.perBuilding ?', 'acc761Model multiplier', path)
# 8. labourPlan: an added quantity replaces the location's fire_ext forecast with one charged slot
text = rep(text, "const br = branchOf(a.key) || {}, code = br.code || '', on = !!onMap.get(a.key), units = labourUnits(a);",
           "const br = branchOf(a.key) || {}, code = br.code || '', on = !!onMap.get(a.key), units = labourUnits(a);\n const fire914 = fire914Of(a); /* v9.14 - the added pieces are one charged slot, at the card's figure or unpriced */\n if (fire914 && fire914.host) slots.push({ref: a.key, branch: code, item: fire914.host.item, disc: fire914.host.discipline, line: 'Fire extinguisher', key: 'fire_ext', unit: null, rate: fire914.rate, qty: fire914.n, value: fire914.amount, state: 'charged', by: fire914.last.by, at: fire914.last.at, fire914: true});",
           'labourPlan fire slot', path)
text = rep(text, "if (a.relocation && L.key === 'demob') return;",
           "if (fire914 && fire914.host && L.key === 'fire_ext') return; /* v9.14 - replaced by the added quantity */\n if (a.relocation && L.key === 'demob') return;",
           'labourPlan replace forecast', path)
# 9. the labour card on Costs: the added pieces on the Fire extinguisher row, and a row for those with no card figure
text = rep(text, 'const lm = labourMoney(a.key, l, a.key, a);',
           "const lm = labourMoney(a.key, l, a.key, a);\n if (L.key === 'fire_ext' && lm.fire914) { refsTouched++; anyTick = true; ticked++; units += lm.fire914.n; if (lm.fire914.amount != null) sub += lm.fire914.amount; else blocked++; return; } /* v9.14 */",
           'labourCard fire row', path)
text = rep(text, 'const lp = CB && CB.labour_per_piece;', "{ const fr = fire914CardRow(live); if (fr) rows.push(fr); } /* v9.14 */\n const lp = CB && CB.labour_per_piece;", 'labourCard unpriced fire row', path)
# 10. the charges fold: the per-building tick is disabled where a quantity is added, and the line says what the pieces come to
text = rep(text, "${L.ticked ? 'checked' : ''}>",
           "${L.ticked ? 'checked' : ''}${L.key === 'fire_ext' && fire914Qty(a.key) ? ' disabled title=\"counted by the fire extinguishers added on this location\"' : ''}>",
           'fire tick disabled', path)
text = rep(text, '${said}${expWords}', '${said}${fire914Said(m)}${expWords}', 'charges fold words', path)
# 11. the drawer: the part, its wiring, and the fold that holds it
UF = re.findall(r'\n( <details class="sfold" id="unitsFold"[^\n]*</details>)\n', text)
assert len(UF) == 1, 'the unitsFold line must be found once - stopping'
text = rep(text, UF[0], UF[0] + '\n ${fire914Block(a)}', 'drawer fire part', path)
text = rep(text, "if ($('#accAdd')) $('#accAdd').onclick = () => {", "fire914Wire(a); /* v9.14 */\n if ($('#accAdd')) $('#accAdd').onclick = () => {", 'drawer wiring', path)
text = rep(text, 'const showContents = ed || accN || unitN || nos.length > 1;', 'const showContents = ed || accN || unitN || nos.length > 1 || fire914Qty(key) > 0; /* v9.14 */', 'contents fold shown', path)
text = rep(text, "['contents', 'Inside it and asset numbers', [accN ? accN + ' inside' : '', nos.length ?",
           "['contents', 'Inside it and asset numbers', [accN ? accN + ' inside' : '', fire914Sub(key, ed), nos.length ?", 'contents fold title', path)
# 12. Equipment: the count on the row
text = rep(text, "+ (acc.length ? `<div class=\"w\" style=\"font-size:11px;color:var(--mute)\">${acc.reduce((s, x) => s + (x.qty || 1), 0)} inside it</div>` : ''); })()}</div></td>",
           "+ (acc.length ? `<div class=\"w\" style=\"font-size:11px;color:var(--mute)\">${acc.reduce((s, x) => s + (x.qty || 1), 0)} inside it</div>` : '') + fire914Equip(a); })()}</div></td>",
           'Equipment row', path)
# 13. the Drivers / Install sheets
text = rep(text, 'function dpAcc(a){ return (a.accessories || [])', 'function dpAcc(a){ return dpAcc914base(a).concat(fire914Dp(a)); } /* v9.14 */\nfunction dpAcc914base(a){ return (a.accessories || [])', 'sheets', path)

# nothing else moved
m2 = re.search(r'const DATA = (\{.*?\});\n', text)
assert m2 and m2.group(1) == DATA_TEXT, 'DATA changed - stopping'
ML2 = re.search(r'const MASTER_LOC = (\{.*?\});\n', text)
assert ML2 and ML2.group(1) == MASTER_TEXT, 'MASTER_LOC changed - stopping'
assert re.findall(r" · v9\.\d+'", text) == FOOT, 'the footer changed - stopping'
assert '</script' not in JS, 'the added code must not close the script'
open(path, 'w', encoding='utf-8').write(text)
print('v9.14 applied: fire extinguishers by quantity on every location, charged per piece; DATA, MASTER_LOC and the footer unchanged')
