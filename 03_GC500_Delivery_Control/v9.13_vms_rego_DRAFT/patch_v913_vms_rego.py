#!/usr/bin/env python3
# Author: Andrew Fisher. v9.13 - VMS boards: whose each board is, its fleet number, its rego, and the delivery it is on.
#
# The project manager, on site, about 14:55 AEST 8 Oct 2026: "VMS10 is Subhired company is PremAir Hire Rego No V14221
# ASSET NO 120T. VMS BOARDS will also have rego numbers." (The disabled toilet for WC31 in the same message is not this
# release.) And about 15:35 AEST: "also need to fix things like this T0103 this is VMS09 and VMS10 VMS is the number i gave
# you and the VMS10 is the subhire number i gave you . vms boards have number plates too i told you this".
#
# What it adds (code only - DATA, the footer, MASTER_LOC, markers, money, hire dates, counts and contract lines are untouched):
#  - a VMS board register on the Equipment tab, one row per VMS line on the contract source (family 'vms'): the board (its
#    VMS number where the contract names one, else the Coates asset number), whose it is (Coates, or the sub-hire company the
#    contract names; a company the project manager or an editor gives wins), its fleet number, its rego and the delivery
#    (VMS plant line, e.g. T0103) it is on;
#  - one small form (edit link only) to enter or change the company, fleet number, rego and "On delivery" of a board, saved
#    as its own synced collection 'vmsboard' - one document per board, with who and when - through the page's own write
#    path (mayWrite, whoAmI, stampIt, bump) exactly as the v7.44 sub-hire collection is;
#  - the project manager's word shown as his word until something is entered on the record: VMS10 is PremAir Hire, fleet
#    number 120T, rego V14221; T0103 carries VMS09 and VMS10. Every other rego reads "not given". Nothing is written on
#    opening, viewing or printing;
#  - a board is on a delivery by (in this order) the record, the project manager's word, or the contract (the line's match
#    by asset number or delivery docket). Nothing is guessed: a VMS delivery no board is linked to says "boards not named yet";
#  - the boards BY NAME, with fleet number and rego, wherever a VMS delivery is shown: the Timeline load card, the delivery
#    cards (Timeline and Today), the drawer's Delivery card, the driver drop card, the printed drop sheet, the Drivers and
#    Install PDFs (run sheets), the installers' daily page, and the driver's text (short and full).
# The VMS plan reconciliation (VMS001-26003-01, 24 numbered boards) stays open with the project manager; nothing is renumbered.
#
#   python3 patch_v913_vms_rego.py <page>
import os, re, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
text = open(path, encoding='utf-8').read()
if 'function vms913Mount(' in text or 'vmsboard' in text:
    sys.exit('v9.13 is already applied - stopping')
for need in ('function subhire744One(', 'function eq796(', 'function eq796Fold(', 'const SYNC_COLLS = {', 'function mergeRecords(',
             'function plantLineOf(', 'function text747What(', 'function dropText(', 'function deliveryCard(', 'function daily821Model(',
             'function bookingNosLine801(', 'function loading872AssetHtml(', 'function dpTruckBefore801(', 'StaffNames910'):
    if need not in text:
        sys.exit('the base is missing ' + need + ' - stopping')

m = re.search(r'const DATA = (\{.*?\});\n', text)
assert m, 'DATA not found'
DATA_TEXT = m.group(1)
D = json.loads(DATA_TEXT)
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == DATA_TEXT, 'DATA must round-trip exactly - stopping'
VMS = [r for r in D['rental_on_hire']['rows'] if r.get('family') == 'vms']
assert VMS, 'no VMS lines on the contract source - stopping'
V10 = [r for r in VMS if re.search(r'\bVMS10\b', r.get('description') or '')]
assert len(V10) == 1, 'expected exactly one contract line naming VMS10 - stopping'
FOOT = re.findall(r" · v9\.\d+'", text)
ML = re.search(r'const MASTER_LOC = (\{.*?\});\n', text)
assert ML, 'MASTER_LOC not found'
MASTER_TEXT = ML.group(1)

JS = r'''
/* v9.13 - VMS BOARDS: WHOSE, FLEET NUMBER, REGO AND THE DELIVERY EACH IS ON. Author: Andrew Fisher.
 The project manager, on site, about 14:55 AEST 8 Oct 2026: "VMS10 is Subhired company is PremAir Hire Rego No V14221
 ASSET NO 120T. VMS BOARDS will also have rego numbers." And about 15:35 AEST: "also need to fix things like this T0103
 this is VMS09 and VMS10 ... vms boards have number plates too".
 One row per VMS line on the contract source (family 'vms'), read only - no contract line, rate, hire date, count or
 position is changed, and the VMS plan reconciliation stays open. The register is its own shared collection, 'vmsboard':
 one document per board {co, fleet, rego, on, line, by, at}, written only from the form by an editor on the edit link,
 through mayWrite, whoAmI, stampIt and bump, like the v7.44 sub-hire collection. Nothing is written on opening, viewing or
 printing. A document on the record wins over the project manager's word, which is shown as his word until one exists.
 Which delivery (VMS plant line) carries a board: the record's "on" (a plant line, or 'none' when an editor took it off),
 else the project manager's word, else the contract (the line's match by asset number or delivery docket). Nothing is
 guessed: a VMS delivery with no board linked says "boards not named yet". */
const VMS913_WORD = "the project manager's word";
function vms913St(){ return vms913St.s || (vms913St.s = {draft: null, opened: false}); }
/* the project manager's word, shown as his word; anything entered on the record replaces it */
function vms913Word(){ return {
 VMS09: {on: 'T0103', said: '8 Oct 2026', at: 'about 15:35 AEST'},
 VMS10: {co: 'PremAir Hire', fleet: '120T', rego: 'V14221', on: 'T0103', said: '8 Oct 2026', at: 'about 14:55 AEST'}}; }
function vms913CoOf(r){
 const d = String((r && r.description) || '');
 if (/premi\s?air/i.test(d)) return 'Premiair';
 if (/\bRPM\b/i.test(d)) return 'RPM';
 return r && r.supplier_sub_rental ? 'sub-hire supplier ' + r.supplier_sub_rental : 'sub-hire, company not named';
}
/* the boards: every VMS line on the contract source, once, in contract-line order */
function vms913Boards(){
 if (vms913Boards.b) return vms913Boards.b;
 const rows = (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []).filter(r => r && r.family === 'vms')
  .slice().sort((x, y) => String(x.rental_contract).localeCompare(String(y.rental_contract)) || (x.line - y.line));
 const seen = new Set();
 const out = rows.map(r => {
  const m = String(r.description || '').match(/\bVMS\s?0*(\d{1,3})\b/i), vms = m ? 'VMS' + String(+m[1]).padStart(2, '0') : null;
  const own = r.asset_no_is_plant_number === true && !r.subhired && /^\d{5,8}$/.test(String(r.asset_no || ''));
  let key = vms || (own ? String(r.asset_no) : 'L' + r.rental_contract + '-' + r.line);
  if (seen.has(key)) key = key + '-L' + r.line; seen.add(key);
  const mt = r.match || {}, via = mt.task_id ? (mt.via === 'delivery docket' && r.delivery_number ? 'delivery docket ' + r.delivery_number : mt.via === 'asset number' ? 'asset number ' + r.asset_no : (mt.via || 'matched')) : null;
  return {key, vms, name: vms || (own ? String(r.asset_no) : 'line ' + r.line), contract: String(r.rental_contract || ''), line: r.line,
   branch: r.branch_code || '', co: own ? 'Coates' : vms913CoOf(r), coates: own, asset: own ? String(r.asset_no) : null,
   load: mt.task_id || null, via, docket: r.delivery_number ? String(r.delivery_number) : null, what: r.what || r.description || ''};
 });
 /* the same Coates asset number on two lines is said, never resolved here (the VMS plan reconciliation is open) */
 out.forEach(b => { if (b.asset) b.twin = out.filter(x => x !== b && x.asset === b.asset).map(x => x.line); });
 return (vms913Boards.b = out);
}
function vms913Rec(key){ const v = S.vmsboard; return v && Object.prototype.hasOwnProperty.call(v, key) && v[key] && typeof v[key] === 'object' ? v[key] : null; }
/* what the page shows for one board: the record, else the project manager's word, else the contract */
function vms913Of(b){
 const rec = vms913Rec(b.key), w = vms913Word()[b.key], wd = w && (w.co || w.fleet || w.rego) ? w : null;
 if (rec) return {src: 'record', co: rec.co || b.co, fleet: rec.fleet || b.asset || null, rego: rec.rego || null, by: rec.by || null, at: rec.at || null};
 if (wd) return {src: 'word', co: wd.co || b.co, fleet: wd.fleet || b.asset || null, rego: wd.rego || null, by: null, at: null};
 return {src: 'contract', co: b.co, fleet: b.asset || null, rego: null, by: null, at: null};
}
/* THE VMS DELIVERIES: the plant lines carrying VMS boards (T0001, T0103 ...), under a given reference where one was given */
function vms913PlantLines(){ return vms913PlantLines.l || (vms913PlantLines.l = (typeof PLANT_LINES !== 'undefined' ? PLANT_LINES : [])
 .filter(l => l && (/^VMS$/i.test(String(l.product || '')) || /message sign/i.test(String(l.discipline || ''))))); }
function vms913Line(tid){ return vms913PlantLines().find(l => l.key === tid) || null; }
function vms913ShownKey(tid){ const g = typeof givenRefOf === 'function' ? givenRefOf(tid) : null; return g && g.ref ? g.ref : tid; }
function vms913TaskOf(k){
 k = String(k == null ? '' : k).trim().toUpperCase(); if (!k) return null;
 if (vms913Line(k)) return k;
 const t = typeof taskIdOfRef === 'function' ? taskIdOfRef(k) : null; return t && vms913Line(t) ? t : null;
}
/* how many boards the schedule says a delivery carries ("VMS x 2"); unknown when the row does not say */
function vms913Cap(tid){ const l = vms913Line(tid), m = l && String(l.name || '').match(/×\s*(\d+)/); return m ? +m[1] : null; }
/* which delivery carries this board, and on whose say-so */
function vms913OnOf(b){
 const rec = vms913Rec(b.key);
 if (rec && rec.on != null && rec.on !== '') {
  if (String(rec.on).toLowerCase() === 'none') return {on: null, src: 'record', off: true, by: rec.by || null, at: rec.at || null};
  const t = vms913TaskOf(rec.on); return t ? {on: t, src: 'record', by: rec.by || null, at: rec.at || null} : {on: null, src: 'record', bad: String(rec.on).slice(0, 24)};
 }
 const w = vms913Word()[b.key]; if (w && w.on && vms913Line(w.on)) return {on: w.on, src: 'word', said: w.said, at: w.at};
 if (b.load && vms913Line(b.load)) return {on: b.load, src: 'contract', via: b.via};
 if (b.docket) { const l = vms913PlantLines().find(x => (x.events || []).some(e => e && e.dd != null && String(e.dd) === b.docket)); if (l) return {on: l.key, src: 'contract', via: 'delivery docket ' + b.docket}; }
 return {on: null, src: null};
}
/* the link without the record: what the page would show if nothing were recorded */
function vms913OnBase(b){ const w = vms913Word()[b.key]; if (w && w.on && vms913Line(w.on)) return w.on; if (b.load && vms913Line(b.load)) return b.load;
 if (b.docket) { const l = vms913PlantLines().find(x => (x.events || []).some(e => e && e.dd != null && String(e.dd) === b.docket)); if (l) return l.key; } return null; }
/* the boards a VMS delivery carries; null when the reference is not a VMS delivery at all */
function vms913BoardsOn(a){
 if (!a || !a.key) return null;
 const pl = typeof plantLineOf === 'function' ? plantLineOf(a.key) : null, tid = pl ? pl.key : (a.task_id || a.key);
 if (!vms913Line(tid)) return null;
 return vms913Boards().filter(b => vms913OnOf(b).on === tid);
}
/* one board in words: "VMS09 (Coates 1211404 · rego not given)", "VMS10 (PremAir Hire 120T · rego V14221)" */
function vms913Say(b, sms){
 const v = vms913Of(b), sep = sms ? ', ' : ' · ';
 const fleet = v.fleet && v.fleet !== b.name ? ' ' + v.fleet : (!v.fleet && !b.coates ? sep + 'fleet no. not given' : '');
 return b.name + ' (' + v.co + fleet + sep + 'rego ' + (v.rego || 'not given') + ')';
}
function vms913LoadOf(a){
 const bs = vms913BoardsOn(a); if (!bs) return null;
 const word = bs.some(b => vms913Of(b).src === 'word' || vms913OnOf(b).src === 'word');
 return {key: a.key, boards: bs, word, text: bs.length ? bs.map(b => vms913Say(b)).join(' · ') : 'boards not named yet',
  sms: bs.length ? bs.map(b => vms913Say(b, true)).join('; ') : 'boards not named yet'};
}
function vms913LoadHtml(a, cls){
 const L = vms913LoadOf(a); if (!L) return '';
 return `<span class="vms913load${cls ? ' ' + cls : ''}" data-vms913-load="${esc(a.key)}">${L.boards.length ? '<b>Boards</b> ' + esc(L.text) : '<b>VMS boards not named yet</b>'}${L.word ? ' <small>(' + VMS913_WORD + ')</small>' : ''}</span>`;
}
function vms913SrcHtml(b, v){
 const w = vms913Word()[b.key];
 return v.src === 'record' ? `<span class="vms913src rec">recorded${v.by ? ' by ' + esc(v.by) : ''}${v.at ? ' · ' + esc(fmtStamp(v.at)) : ''}</span>`
  : v.src === 'word' ? `<span class="vms913src word" title="Given on site by the project manager, ${esc(w.said)} ${esc(w.at)}. Anything entered on the record replaces it.">${VMS913_WORD} · ${esc(w.said)}</span>`
  : '<span class="vms913src">from the contract</span>';
}
function vms913OnHtml(b){
 const o = vms913OnOf(b);
 if (o.on) return `<b class="mono">${esc(vms913ShownKey(o.on))}</b><small>${o.src === 'record' ? 'recorded' : o.src === 'word' ? VMS913_WORD : 'contract · ' + esc(o.via || 'matched')}</small>`;
 return `<span class="todo">not named yet</span>${o.off ? '<small>taken off by the record</small>' : o.bad ? '<small>the record names ' + esc(o.bad) + ', not a VMS delivery here</small>' : ''}`;
}
/* validation: a rego is 1 to 9 letters or digits, kept in capitals; a fleet number follows the sub-hire rule; the delivery
   is one of the VMS deliveries on this page, and never more boards than the schedule row says it carries */
function vms913Check(b, co, fleet, rego, on){
 co = String(co == null ? '' : co).trim().replace(/\s+/g, ' ');
 fleet = String(fleet == null ? '' : fleet).trim();
 rego = String(rego == null ? '' : rego).trim().toUpperCase();
 on = String(on == null ? '' : on).trim().toUpperCase();
 if (co && (co.length > 40 || !/^[A-Za-z0-9][A-Za-z0-9 &.'()\/-]*$/.test(co))) return {err: 'A company name is up to 40 letters, digits, spaces and & . \' ( ) / - only.'};
 if (fleet && !subNoRx(co || b.co).test(fleet)) return {err: (co || b.co).toLowerCase() === 'coates' ? 'A Coates fleet number is 3 to 12 letters, digits or hyphens.' : 'A fleet number is 1 to 12 letters, digits or hyphens.'};
 if (rego && !/^[A-Z0-9]{1,9}$/.test(rego)) return {err: 'A rego is 1 to 9 letters or digits - no spaces, dashes or other marks.'};
 let tid = null;
 if (on) { tid = vms913TaskOf(on); if (!tid) return {err: on + ' is not one of the VMS deliveries on this page (' + vms913PlantLines().map(l => vms913ShownKey(l.key)).join(', ') + ').'}; }
 if (tid) { const cap = vms913Cap(tid), here = vms913Boards().filter(x => x.key !== b.key && vms913OnOf(x).on === tid);
  if (cap != null && here.length + 1 > cap) return {err: vms913ShownKey(tid) + ' carries ' + cap + ' board' + (cap === 1 ? '' : 's') + ' on the schedule and already has ' + here.map(x => x.name).join(', ') + ' - take one off it first.'}; }
 if (!co && !fleet && !rego && !tid && !vms913Rec(b.key)) return {err: 'Give a company, a fleet number, a rego or a delivery for ' + b.name + '.'};
 const others = vms913Boards().filter(x => x.key !== b.key);
 if (rego) { const o = others.find(x => (vms913Of(x).rego || '') === rego); if (o) return {err: 'Rego ' + rego + ' is already on ' + o.name + ' - change it there first.'}; }
 if (fleet) { const c2 = (co || b.co).toLowerCase(), o = others.find(x => { const v = vms913Of(x); return v.src !== 'contract' && String(v.fleet || '').toLowerCase() === fleet.toLowerCase() && String(v.co || '').toLowerCase() === c2; });
  if (o) return {err: 'Fleet number ' + fleet + ' is already on ' + o.name + ' - change it there first.'}; }
 /* no delivery chosen: 'none' only when the page would otherwise put the board on one (the editor took it off) */
 return {co: co || null, fleet: fleet || null, rego: rego || null, on: tid || (vms913OnBase(b) ? 'none' : null)};
}
/* THE ONE WRITER: an editor, on the edit link, by name - one document in 'vmsboard' */
function vms913Save(key, co, fleet, rego, on){
 if (!mayWrite('a VMS board rego')) return false;
 const b = vms913Boards().find(x => x.key === key); if (!b) { flash('Choose a board first.'); return false; }
 const c = vms913Check(b, co, fleet, rego, on); if (c.err) { flash(c.err); return false; }
 const rec = vms913Rec(b.key);
 if (rec && (rec.co || null) === c.co && (rec.fleet || null) === c.fleet && (rec.rego || null) === c.rego && (rec.on || null) === c.on) { flash('Nothing changed on ' + b.name + '.'); return false; }
 const who = whoAmI(); if (!who) return false;
 S.vmsboard = S.vmsboard || {};
 S.vmsboard[b.key] = {co: c.co, fleet: c.fleet, rego: c.rego, on: c.on, line: b.contract + '/' + b.line, by: who, at: new Date().toISOString()};
 stampIt('vmsboard', b.key, who);
 const v = vms913Of(b), o = vms913OnOf(b);
 vms913St().draft = {key: b.key, co: v.co || '', fleet: v.fleet || '', rego: v.rego || '', on: o.on || ''}; /* the form shows what was saved */
 bump();
 flash(b.name + ' saved: ' + v.co + ' · fleet no. ' + (v.fleet || 'not given') + ' · rego ' + (v.rego || 'not given') + ' · ' + (o.on ? 'on ' + vms913ShownKey(o.on) : 'not on a delivery') + '. By ' + who + '.');
 return true;
}
function vms913Pick(key){
 const bs = vms913Boards(), b = bs.find(x => x.key === key) || bs[0]; if (!b) return null;
 const v = vms913Of(b), o = vms913OnOf(b);
 return (vms913St().draft = {key: b.key, co: v.co || '', fleet: v.fleet || '', rego: v.rego || '', on: o.on || ''});
}
function vms913LineOpt(l, sel){ const ev = (l.events || [])[0] || {};
 return `<option value="${esc(l.key)}"${l.key === sel ? ' selected' : ''}>${esc(vms913ShownKey(l.key) + ' - ' + (l.name || 'VMS') + (ev.date ? ' - ' + fmtDate(ev.date) : ''))}</option>`; }
function vms913Html(bs){
 const ed = typeof capability === 'function' && capability() === 'edit';
 const given = bs.filter(b => vms913Of(b).rego).length, contracts = [...new Set(bs.map(b => b.contract + (b.branch ? ' (' + b.branch + ')' : '')))];
 const rows = bs.map(b => { const v = vms913Of(b);
  const sub = 'line ' + b.line + (b.docket ? ' · docket ' + b.docket : '') + (b.twin && b.twin.length ? ' · asset no. also on line ' + b.twin.join(', ') : '');
  return `<div class="vms913row" data-vms913-row="${esc(b.key)}" data-src="${v.src}">
 <span class="vms913c b" data-l="Board"><b>${esc(b.name)}</b><small>${esc(sub)}</small></span>
 <span class="vms913c" data-l="Whose">${esc(v.co)}${b.coates && v.co === 'Coates' ? '' : ' <small>sub-hire</small>'}</span>
 <span class="vms913c" data-l="Fleet no.">${v.fleet ? '<b class="mono">' + esc(v.fleet) + '</b>' : '<span class="todo">not given</span>'}</span>
 <span class="vms913c" data-l="Rego">${v.rego ? '<b class="mono">' + esc(v.rego) + '</b>' : '<span class="todo">not given</span>'}</span>
 <span class="vms913c o" data-l="On delivery">${vms913OnHtml(b)}</span>
 <span class="vms913c s" data-l="Source">${vms913SrcHtml(b, v)}</span>
 ${ed ? `<span class="vms913c e"><button type="button" class="btn sm" data-vms913-edit="${esc(b.key)}" aria-label="Change ${esc(b.name)}">Change</button></span>` : ''}
 </div>`; }).join('');
 let form = '';
 if (ed) {
  const d = vms913St().draft && bs.some(x => x.key === vms913St().draft.key) ? vms913St().draft : vms913Pick(bs[0].key), cur = bs.find(x => x.key === d.key);
  form = `<div class="vms913form" data-vms913-form>
 <div class="f"><label for="vms913Board">Board</label><select id="vms913Board">${bs.map(b => `<option value="${esc(b.key)}"${b.key === d.key ? ' selected' : ''}>${esc(b.name + ' - line ' + b.line + ' - ' + vms913Of(b).co)}</option>`).join('')}</select></div>
 <div class="f"><label for="vms913Co">Whose (company)</label><input id="vms913Co" autocomplete="off" value="${esc(d.co)}" placeholder="${esc(cur.co)}"></div>
 <div class="f"><label for="vms913Fleet">Fleet number</label><input id="vms913Fleet" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(d.fleet)}" placeholder="not given"></div>
 <div class="f"><label for="vms913Rego">Rego</label><input id="vms913Rego" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(d.rego)}" placeholder="not given"></div>
 <div class="f"><label for="vms913On">On delivery</label><select id="vms913On"><option value=""${d.on ? '' : ' selected'}>not on a delivery yet</option>${vms913PlantLines().map(l => vms913LineOpt(l, d.on)).join('')}</select></div>
 <div class="f act"><button type="button" class="btn primary" data-vms913-save>Save to the record</button></div>
 </div><p class="vms913msg" role="alert" aria-live="polite"></p>`;
 }
 return `<p class="vms913note">One row per VMS line on contract ${esc(contracts.join(', '))} - ${bs.length} lines, ${given} rego${given === 1 ? '' : 's'} given.
 Whose it is and the fleet number come from the contract unless the project manager or an editor has given them; a rego is shown only where somebody has given one.
 A board is on a delivery where the record, the project manager or the contract (asset number or delivery docket) puts it - never guessed.
 Nothing here changes a rate, a hire date, a count or a position, and the VMS plan's own numbering is still being reconciled with the project manager.</p>
 ${form}<div class="vms913list${ed ? ' ed' : ''}"><div class="vms913row head" aria-hidden="true"><span>Board</span><span>Whose</span><span>Fleet no.</span><span>Rego</span><span>On delivery</span><span>Source</span>${ed ? '<span></span>' : ''}</div>${rows}</div>`;
}
function vms913Bind(root){
 const st = vms913St(), $f = id => root.querySelector('#' + id), F = [['vms913Co', 'co'], ['vms913Fleet', 'fleet'], ['vms913Rego', 'rego'], ['vms913On', 'on']];
 const fill = d => { if (!d) return; const s = $f('vms913Board'); if (s) s.value = d.key; F.forEach(([id, k]) => { const el = $f(id); if (el) el.value = d[k]; });
  const b = vms913Boards().find(x => x.key === d.key), c = $f('vms913Co'); if (b && c) c.placeholder = b.co; const msg = root.querySelector('.vms913msg'); if (msg) msg.textContent = ''; };
 root.querySelectorAll('[data-vms913-edit]').forEach(btn => btn.onclick = () => {
  if (!mayWrite('a VMS board rego')) return; fill(vms913Pick(btn.dataset.vms913Edit));
  const f = root.querySelector('[data-vms913-form]'); if (f) { f.scrollIntoView({block: 'nearest'}); const r = $f('vms913Rego'); if (r) r.focus({preventScroll: true}); } });
 const sel = $f('vms913Board'); if (!sel) return;
 sel.onchange = () => fill(vms913Pick(sel.value));
 F.forEach(([id, k]) => { const el = $f(id); if (el) el.oninput = el.onchange = () => { if (st.draft) st.draft[k] = el.value; }; });
 const go = root.querySelector('[data-vms913-save]');
 if (go) go.onclick = () => { const d = st.draft || vms913Pick(sel.value), b = vms913Boards().find(x => x.key === d.key);
  const c = b ? vms913Check(b, d.co, d.fleet, d.rego, d.on) : {err: 'Choose a board first.'};
  if (c.err) { const msg = root.querySelector('.vms913msg'); if (msg) msg.textContent = c.err; flash(c.err); return; }
  if (vms913Save(d.key, d.co, d.fleet, d.rego, d.on)) vms913Pick(d.key); };
}
/* on the Equipment tab, under every reference, while VMS boards (or every trade) is shown */
function vms913Mount(){
 const pane = document.getElementById('pane-plant'); if (!pane || pane.querySelector('[data-vms913]')) return;
 const g = state.plantGroup; if (g && g !== 'VMS boards') return;
 const bs = vms913Boards(); if (!bs.length) return;
 const name = 'VMS board register', st = vms913St();
 if (!st.opened && g === 'VMS boards' && typeof eq796s === 'function') { st.opened = true; eq796s().open.add(name); }
 const given = bs.filter(b => vms913Of(b).rego).length;
 const box = document.createElement('div'); box.className = 'vms913'; box.innerHTML = vms913Html(bs);
 const fold = eq796Fold(name, bs.length + ' contract lines · whose, fleet number, rego and delivery · ' + given + ' rego' + (given === 1 ? '' : 's') + ' given', [box]);
 fold.setAttribute('data-vms913', ''); fold.classList.add('vms913fold');
 const refs = pane.querySelector(':scope > details.eqrefs'), rs = pane.querySelector(':scope > .regsum');
 if (refs) refs.after(fold); else if (rs) rs.before(fold); else pane.appendChild(fold);
 vms913Bind(fold);
}
/* FOR THE DRIVER AND THE INSTALLER: the boards a delivery carries, by name, with fleet number and rego */
function vms913BoardOfLine(x){ return x ? vms913Boards().find(b => b.contract === String(x.rental_contract || '') && b.line === x.line) || null : null; }
function vms913LineHtml(x){
 const b = vms913BoardOfLine(x); if (!b) return '';
 const v = vms913Of(b);
 return ` <span class="vms913chip" data-vms913-line="${esc(b.key)}">${esc(v.co)} · fleet no. <b>${esc(v.fleet || 'not given')}</b> · rego <b>${esc(v.rego || 'not given')}</b>${v.src === 'word' ? ' <small>(' + VMS913_WORD + ')</small>' : ''}</span>`;
}
function vms913PillsHtml(a){
 const L = vms913LoadOf(a); if (!L) return '';
 return L.boards.length ? L.boards.map(b => `<span class="pill plan" data-vms913-pill="${esc(b.key)}">${esc(vms913Say(b))}</span>`).join('') + (L.word ? `<span class="pill none" data-vms913-pill>${VMS913_WORD}</span>` : '')
  : '<span class="pill none" data-vms913-pill>VMS boards not named yet</span>';
}
function vms913SheetHtml(a){
 const L = vms913LoadOf(a); if (!L) return '';
 return `<br><span class="rs-sup" data-vms913-sheet>${L.boards.length ? 'Boards: ' + esc(L.text) + (L.word ? ' (' + VMS913_WORD + ')' : '') : 'VMS boards not named yet'}</span>`;
}
function vms913TruckHtml(a){
 const L = vms913LoadOf(a); if (!L) return '';
 return `<div class="dp-lines" data-vms913-truck="${esc(a.key)}"><div class="dp-l dp-w"><label>${esc(a.key)}</label><div>${L.boards.length ? 'Boards: ' + esc(L.text) + (L.word ? ' (' + VMS913_WORD + ')' : '') : 'VMS boards not named yet'}</div></div></div>`;
}
function vms913AssetOf(key){ try { return (typeof assetOf === 'function' && assetOf(key)) || allAssets().find(x => x.key === key) || null; } catch (e) { return null; } }
'''

# The surfaces built late in the page (the Timeline load card, the delivery cards, the drawer's Delivery card, the driver's
# texts, the Drivers and Install PDFs and the installers' daily page) are wrapped once, after every earlier wrapper, in a
# script of their own - the way the page's later releases wrap them. Each wrapper only adds the boards line to a VMS
# delivery and returns the original output untouched for anything else.
LATE = r'''<script id="vms913-script">
/* v9.13 - VMS boards by name, with fleet number and rego, wherever a VMS delivery is shown. Author: Andrew Fisher.
 The project manager, 8 Oct 2026: "T0103 this is VMS09 and VMS10 ... vms boards have number plates too". Every wrapper
 adds to a VMS delivery only and hands back what it was given for anything else; nothing is written. */
(function(){
 /* the Timeline load card, under the asset number */
 const tl = loading872AssetHtml; loading872AssetHtml = function(a){ const h = tl.apply(this, arguments); try { return h + vms913LoadHtml(a, 'tl'); } catch (e) { return h; } };
 /* the delivery cards (Timeline loads opened, Today): under "Asset no." */
 const nos = bookingNosLine801; bookingNosLine801 = function(a){ const h = nos.apply(this, arguments); try { const L = vms913LoadHtml(a, 'dc'); return L ? (h || '<span class="todo">none supplied</span>') + '<br>' + L : h; } catch (e) { return h; } };
 /* the drawer's Delivery card, under its heading */
 const dc = deliveryCard; deliveryCard = function(a){ const h = dc.apply(this, arguments); try { const L = vms913LoadHtml(a, 'dcard'), k = '<h3>Delivery</h3>', i = h.indexOf(k);
  return L && i >= 0 && h.indexOf(k, i + 1) < 0 ? h.slice(0, i + k.length) + '<p class="vms913dcard">' + L + '</p>' + h.slice(i + k.length) : h; } catch (e) { return h; } };
 /* the Drivers and Install PDFs (the run sheets): a line per VMS delivery on the truck */
 const tr = dpTruck; dpTruck = function(g){ const h = tr.apply(this, arguments); try { return h + ((g && g.rows) || []).map(r => vms913TruckHtml(r.a)).join(''); } catch (e) { return h; } };
 /* the driver's text: the boards after what it is (plain characters, so it stays three texts) */
 const wt = text747What; text747What = function(a){ const h = wt.apply(this, arguments); try { const L = vms913LoadOf(a); return L ? h + ': ' + (L.boards.length ? L.sms : 'VMS boards not named yet') : h; } catch (e) { return h; } };
 /* the driver's full details: a Boards line after the asset numbers */
 const dt = dropText; dropText = function(a){ const h = dt.apply(this, arguments); try { const L = vms913LoadOf(a); if (!L) return h; const P = String(h).split('\n'), i = P.findIndex(x => /^Map location: /.test(x));
  P.splice(i >= 0 ? Math.min(P.length, i + 2) : 1, 0, L.boards.length ? 'Boards: ' + L.text + (L.word ? ' (' + VMS913_WORD + ')' : '') : 'VMS boards not named yet'); return P.join('\n'); } catch (e) { return h; } };
 /* the installers' daily page: the boards as the first note on the delivery */
 const dm = daily821Model; daily821Model = function(iso){ const m = dm.apply(this, arguments); try { ((m && m.loads) || []).forEach(l => (l.rows || []).forEach(r => { const a = vms913AssetOf(r.key), L = a && vms913LoadOf(a);
  if (L) { r.boards913 = L.text; r.notes = [L.boards.length ? 'Boards: ' + L.text + (L.word ? ' (' + VMS913_WORD + ')' : '') : 'VMS boards not named yet'].concat(Array.isArray(r.notes) ? r.notes : []); } })); } catch (e) {} return m; };
})();
</script>
'''

CSS = '''
/* v9.13 - VMS boards: whose, fleet number, rego and delivery. Author: Andrew Fisher. */
#pane-plant details.vms913fold > summary{flex-wrap:wrap;row-gap:2px}
.vms913{padding:0 0 12px}
.vms913note{font-size:12.5px;color:var(--mute);margin:0 0 10px;line-height:1.5}
.vms913form{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;align-items:end;border:1px solid var(--orange);border-radius:10px;padding:12px;margin:0 0 6px;background:var(--tint2)}
.vms913form .f{display:grid;gap:4px;min-width:0}
.vms913form label{font-size:12px;font-weight:700;color:var(--ink2)}
.vms913form input,.vms913form select{box-sizing:border-box;width:100%;min-width:0;min-height:44px;font-size:16px}
.vms913form .btn,.vms913 .vms913row .btn{min-height:44px;min-width:44px}
.vms913form .act .btn{width:100%}
.vms913msg{min-height:1em;margin:0 0 8px;font-size:13px;color:var(--red);font-weight:600}
.vms913list{border-top:1px solid var(--rule)}
.vms913row{display:grid;grid-template-columns:minmax(120px,1.2fr) minmax(110px,1.1fr) minmax(80px,.8fr) minmax(80px,.8fr) minmax(90px,1fr) minmax(130px,1.4fr);gap:8px;align-items:center;padding:7px 2px;border-bottom:1px solid var(--rule2);font-size:13px;min-width:0}
.vms913list.ed .vms913row{grid-template-columns:minmax(120px,1.2fr) minmax(110px,1.1fr) minmax(80px,.8fr) minmax(80px,.8fr) minmax(90px,1fr) minmax(130px,1.4fr) 96px}
.vms913row.head{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);font-weight:700;padding:8px 2px}
.vms913row:not(.head)[data-src="word"],.vms913row:not(.head)[data-src="record"]{background:var(--orange-soft)}
.vms913c{min-width:0;overflow-wrap:anywhere}
.vms913c.b b{display:block;font-size:14px}
.vms913c small{color:var(--mute);font-size:11px}
.vms913c.b small,.vms913c.o small{display:block}
.vms913src{font-size:12px;color:var(--mute)}
.vms913src.word,.vms913src.rec{color:var(--orange-ink);font-weight:700}
.vms913chip{display:inline-block;max-width:100%;white-space:normal;overflow-wrap:anywhere;font-size:12px;color:var(--orange-ink);font-weight:600}
.vms913load{display:block;max-width:100%;white-space:normal;overflow-wrap:anywhere;font-size:12px;line-height:1.4;font-weight:400;letter-spacing:0;text-transform:none}
.vms913load b{font-weight:700}
.vms913load small{font-size:11px;opacity:.8}
.vms913load.tl{margin-top:4px}
.vms913dcard{margin:0 0 10px;color:var(--orange-ink)}
@media (max-width:720px){
 .vms913row,.vms913list.ed .vms913row{grid-template-columns:1fr 1fr;gap:4px 10px;padding:10px 2px}
 .vms913row.head{display:none}
 .vms913c.b,.vms913c.s{grid-column:1 / -1}
 .vms913c.e{grid-column:1 / -1}
 .vms913c.e .btn{width:100%}
 .vms913c:not(.b):not(.e)::before{content:attr(data-l);display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);font-weight:700}
}
body.viewonly [data-vms913-form],body.viewonly [data-vms913-edit]{display:none!important}
'''



def change(old, new, what):
    global text
    text = rep(text, old, new, what, path, True)


change('function renderPlant(){ return holdAssets(renderPlant_held); }', JS.strip() + '\nfunction renderPlant(){ return holdAssets(renderPlant_held); }', 'v9.13 code before renderPlant')
change('eq796(); /* v7.96 - Plant and Inventory as one Equipment tab */\n plantPump();',
       'eq796(); /* v7.96 - Plant and Inventory as one Equipment tab */\n vms913Mount(); /* v9.13 - VMS boards, board by board */\n plantPump();', 'Equipment tab mounts the register')
change('.notice.subhirebanner .subhireacts{margin-top:2px}', '.notice.subhirebanner .subhireacts{margin-top:2px}\n' + CSS.strip(), 'v9.13 styles')
# the new collection travels like 'subhire': blank record, sync list, merge, import and export
change('weeks:{}, spares:{}, subhire:{},', 'weeks:{}, spares:{}, subhire:{}, vmsboard:{},', 'blank record carries vmsboard')
change(" subhire: {kind: 'map', get: () => S.subhire, set: v => S.subhire = v},\n",
       " subhire: {kind: 'map', get: () => S.subhire, set: v => S.subhire = v},\n /* v9.13 - VMS boards: whose, fleet number and rego, one document per board */\n vmsboard: {kind: 'map', get: () => S.vmsboard, set: v => S.vmsboard = v},\n", 'sync list carries vmsboard')
change("'spares', 'subhire', 'finance745'].forEach(f =>", "'spares', 'subhire', 'vmsboard', 'finance745'].forEach(f =>", 'merge carries vmsboard')
change("f === 'subhire' ? 'the sub-hired location' :", "f === 'subhire' ? 'the sub-hired location' : f === 'vmsboard' ? 'the VMS board' :", 'merge names a vmsboard clash')
change('subhire: (j && j.subhire) || {},', 'subhire: (j && j.subhire) || {}, vmsboard: (j && j.vmsboard) || {},', 'import carries vmsboard')
change(' subhire: S.subhire || {},\n', ' subhire: S.subhire || {},\n vmsboard: S.vmsboard || {},\n', 'export carries vmsboard')
# for the driver: the delivery card's rental lines, the driver drop card, the printed drop sheet (stable code, exactly once)
change("<li>${assetNo(x.asset_no)} ${esc(x.description || '')}", "<li>${assetNo(x.asset_no)} ${esc(x.description || '')}${vms913LineHtml(x)}", 'delivery card rental line')
change('${supplierNumbersHtml744(a)}\n ${nums.length > 3', '${supplierNumbersHtml744(a)}${vms913PillsHtml(a)}\n ${nums.length > 3', 'driver drop card pills')
change("${field('Asset no.', assetBox + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : ''), 'rs-key')}",
       "${field('Asset no.', assetBox + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : '') + vms913SheetHtml(a), 'rs-key')}", 'printed drop sheet')
# the surfaces built late (Timeline load card, delivery cards, drawer, Drivers / Install PDFs, texts, installers' daily page):
# one script of wrappers, before the v9.10 staff names script, so it runs after every earlier wrapper of those functions
change('<script id="staff910-script">', LATE + '<script id="staff910-script">', 'v9.13 wrappers before the v9.10 script')

m2 = re.search(r'const DATA = (\{.*?\});\n', text)
assert m2 and m2.group(1) == DATA_TEXT, 'DATA changed - stopping'
assert re.findall(r" · v9\.\d+'", text) == FOOT, 'the footer changed - stopping'
assert '</script' not in JS and LATE.count('</script') == 1 and LATE.count('<script') == 1, 'each block closes only its own script'
m3 = re.search(r'const MASTER_LOC = (\{.*?\});\n', text)
assert m3 and m3.group(1) == MASTER_TEXT, 'MASTER_LOC changed - stopping'
open(path, 'w', encoding='utf-8').write(text)
print('ok v9.13', path, '- VMS lines on the contract source:', len(VMS))
