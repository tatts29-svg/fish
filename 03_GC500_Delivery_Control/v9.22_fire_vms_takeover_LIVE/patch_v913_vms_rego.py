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
#    path (mayWrite, whoAmI, stampIt, bump) exactly as the v7.44 sub-hire collection is. Only the fields the editor changed
#    are stored; a form left open while another device changes the board is refreshed (the editor's own changes kept) and a
#    save from a stale form is refused; a save that changes nothing writes nothing; Save waits for the shared record;
#  - the project manager's word shown as his word until something is entered on the record, field by field: VMS10 is
#    PremAir Hire, fleet number 120T, rego V14221; T0103 carries VMS09 and VMS10. Every other rego reads "not given".
#    Nothing is written on opening, viewing or printing;
#  - 8 Oct 2026, about 13:50 AEST: "1211404 is VMS09", and about 23:20 AEST: "take off that location and put on new
#    location". Board 1211404 IS VMS09 and is on T0103 by his word (the record still overrides): contract line 1 (on T0001
#    since 7 Sep) and line 12 (VMS09) carry the same number, so they are one board and one register row. T0001 shows its
#    7 Coates boards and one line "1211404 moved to T0103 (VMS09) — the project manager, 8 Oct". Editors only see what is
#    left to do: the record still lists 1211404 among T0001's asset numbers (remove it on T0001's Change form), and the
#    contract still lists the board on line 1 and line 12 (check line 1 was off-hired or transferred). Nothing on the
#    record is changed;
#  - a board is on a delivery by (in this order) the record, the project manager's word, or the contract (the line's match
#    by asset number or delivery docket). Nothing is guessed: a VMS delivery no board is linked to says "boards not named yet";
#  - the boards BY NAME, with fleet number and rego, wherever a VMS delivery is shown: the Timeline load card and its
#    "Every day" row, the delivery cards, the drawer's Delivery card and Driver drop card, the printed drop sheet, the
#    Drivers and Install PDFs (in the booked numbers cell), the installers' daily page, and the driver's texts (the short
#    text gets one Boards line only while it stays within three texts). A Coates board whose only fact is its asset number,
#    already shown beside it, is counted rather than repeated;
#  - a row saved here but not yet on the shared record says so; a record for a board no longer on the contract is listed;
#    an import checks the collection.
# The VMS plan reconciliation (VMS001-26003-01) stays open with the project manager; nothing is renumbered.
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
             'function bookingNosLine801(', 'function loading872AssetHtml(', 'function dpTruckBefore801(', 'function dayRows(', 'StaffNames910',
             'function dropSmsText(', 'const TEXT747_MAX = ', 'function validateRecords(', 'function docIdOf(', 'function dpNums('):
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
 printing. Field by field, the record wins over the project manager's word, which wins over the contract; a field the
 record leaves null says nothing, and '' means an editor cleared it. Only the fields an editor changed are stored.
 Which delivery (VMS plant line) carries a board: the record's "on" (a plant line, or 'none' when an editor took it off),
 else the project manager's word, else the contract (the line's match by asset number or delivery docket). Nothing is
 guessed: a VMS delivery with no board linked says "boards not named yet". */
const VMS913_WORD = "the project manager's word";
const VMS913_WAIT = 'Wait a moment - the shared record is still loading. Save works once it has arrived.';
function vms913St(){ return vms913St.s || (vms913St.s = {draft: null, opened: false, said: ''}); }
/* the project manager's word, shown as his word; anything entered on the record replaces it, field by field */
/* VMS09 (8 Oct 2026): "1211404 is VMS09" (about 13:50 AEST) and, of 1211404 on T0001, "take off that location and put on
   new location" (about 23:20 AEST). 'asset' says the Coates asset number IS this board, so any other contract line carrying
   it is the same board, folded into its row; 'from' is the delivery it was taken off. */
function vms913Word(){ return {
 VMS09: {on: 'T0103', said: '8 Oct 2026', at: 'about 15:35 AEST', day: '8 Oct', asset: '1211404', from: 'T0001'},
 VMS10: {co: 'PremAir Hire', fleet: '120T', rego: 'V14221', on: 'T0103', said: '8 Oct 2026', at: 'about 14:55 AEST'}}; }
function vms913WordOf(key){ const w = vms913Word(); return Object.prototype.hasOwnProperty.call(w, key) ? w[key] : {}; }
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
  const mt = r.match || {}, via = mt.task_id ? (mt.via === 'delivery docket' ? 'delivery docket' : mt.via === 'asset number' ? 'asset number' : (mt.via || 'matched')) : null;
  return {key, vms, name: vms || (own ? String(r.asset_no) : 'line ' + r.line), contract: String(r.rental_contract || ''), line: r.line,
   branch: r.branch_code || '', co: own ? 'Coates' : vms913CoOf(r), coates: own, asset: own ? String(r.asset_no) : null,
   load: mt.task_id || null, via, docket: r.delivery_number ? String(r.delivery_number) : null, what: r.what || r.description || '',
   start: r.start_date || r.contract_start || null, ended: !!(r.term_date || r.return_number)};
 });
 /* the project manager's word that a Coates asset number IS a named board ("1211404 is VMS09", 8 Oct): every other contract
    line carrying that number is the same board, folded into the named board's row - one board, one row, never two */
 const W = vms913Word();
 Object.keys(W).forEach(k => { const w = W[k], b = w.asset ? out.find(x => x.key === k) : null; if (!b || b.asset !== w.asset) return;
  const same = out.filter(x => x !== b && x.asset === w.asset); if (!same.length) return;
  b.folded = same.map(x => ({key: x.key, line: x.line, docket: x.docket, load: x.load, via: x.via, start: x.start, ended: x.ended}));
  same.forEach(x => out.splice(out.indexOf(x), 1)); });
 /* any other Coates asset number on two lines is said, never resolved here (the VMS plan reconciliation is open) */
 out.forEach(b => { if (b.asset) b.twin = out.filter(x => x !== b && x.asset === b.asset).map(x => x.line); });
 return (vms913Boards.b = out);
}
/* every contract line the register covers: a board's own line and any line folded into it */
function vms913LineCount(){ return vms913Boards().reduce((n, b) => n + 1 + (b.folded || []).length, 0); }
function vms913Day(iso){ const m = String(iso || '').match(/^\d{4}-(\d{2})-(\d{2})/); return m ? (+m[2]) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[1] - 1] : ''; }
function vms913Rec(key){ const v = S.vmsboard; return v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, key) && v[key] && typeof v[key] === 'object' ? v[key] : null; }
/* what the page shows for one board, field by field: the record, else the project manager's word, else the contract */
function vms913Of(b){
 const rec = vms913Rec(b.key), w = vms913WordOf(b.key), src = {};
 const pick = (k, contract) => {
  if (rec && rec[k] != null && !(k === 'co' && rec[k] === '')) { src[k] = 'record'; return rec[k] === '' ? null : String(rec[k]); }
  if (w[k]) { src[k] = 'word'; return w[k]; }
  src[k] = 'contract'; return contract;
 };
 const co = pick('co', b.co), fleet = pick('fleet', b.asset || null), rego = pick('rego', null), all = [src.co, src.fleet, src.rego];
 return {src: all.includes('record') ? 'record' : all.includes('word') ? 'word' : 'contract', mixed: all.includes('record') && all.includes('word'),
  fields: src, co, fleet, rego, by: (rec && rec.by) || null, at: (rec && rec.at) || null};
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
function vms913ByDocket(b){ if (!b.docket) return null; const l = vms913PlantLines().find(x => (x.events || []).some(e => e && e.dd != null && String(e.dd) === b.docket)); return l ? l.key : null; }
/* which delivery carries this board, and on whose say-so */
function vms913OnOf(b){
 const rec = vms913Rec(b.key);
 if (rec && rec.on != null && rec.on !== '') {
  if (String(rec.on).toLowerCase() === 'none') return {on: null, src: 'record', off: true, by: rec.by || null, at: rec.at || null};
  const t = vms913TaskOf(rec.on); return t ? {on: t, src: 'record', by: rec.by || null, at: rec.at || null} : {on: null, src: 'record', bad: String(rec.on).slice(0, 24)};
 }
 const w = vms913WordOf(b.key); if (w.on && vms913Line(w.on)) return {on: w.on, src: 'word', said: w.said, at: w.at};
 if (b.load && vms913Line(b.load)) return {on: b.load, src: 'contract', via: b.via};
 const d = vms913ByDocket(b); if (d) return {on: d, src: 'contract', via: 'delivery docket'};
 return {on: null, src: null};
}
/* the link without the record: what the page would show if nothing were recorded */
function vms913OnBase(b){ const w = vms913WordOf(b.key); if (w.on && vms913Line(w.on)) return w.on; if (b.load && vms913Line(b.load)) return b.load; return vms913ByDocket(b); }
/* the VMS delivery a reference is; null when it is not a VMS delivery at all */
function vms913TidOf(a){
 if (!a || !a.key) return null;
 const pl = typeof plantLineOf === 'function' ? plantLineOf(a.key) : null, tid = pl ? pl.key : (a.task_id || a.key);
 return vms913Line(tid) ? tid : null;
}
/* the boards a VMS delivery carries; null when the reference is not a VMS delivery at all */
function vms913BoardsOn(a){ const tid = vms913TidOf(a); return tid ? vms913Boards().filter(b => vms913OnOf(b).on === tid) : null; }
/* a board taken off a delivery its folded contract line still names (1211404 off T0001, now VMS09 on T0103): said once on
   the delivery it left, "1211404 moved to T0103 (VMS09) — the project manager, 8 Oct" */
function vms913MovedOff(tid){
 const out = [];
 vms913Boards().forEach(b => (b.folded || []).forEach(f => { if (f.load !== tid) return; const o = vms913OnOf(b); if (o.on === tid) return;
  const w = vms913WordOf(b.key), by = o.src === 'word' ? 'the project manager, ' + (w.day || w.said) : o.src === 'record' ? 'on the record' : '';
  out.push({key: b.key, asset: b.asset, text: (b.asset || 'line ' + f.line) + (o.on ? ' moved to ' + vms913ShownKey(o.on) : ' moved off ' + vms913ShownKey(tid)) + ' (' + b.name + ')' + (by ? ' — ' + by : '')}); }));
 return out;
}
/* texts keep to plain characters (a dash, not a long dash) */
function vms913Plain(s){ return String(s).replace(/ — /g, ' - '); }
/* one board in words. Screens and sheets: "VMS09 (Coates 1211404 · rego not given)", "VMS10 (PremAir Hire 120T · rego
   V14221)". Texts leave out what is not given: 'sms' "VMS10 PremAir Hire 120T rego V14221", 'short' "VMS10 rego V14221" */
function vms913Say(b, mode){
 const v = vms913Of(b), fl = v.fleet && v.fleet !== b.name ? ' ' + v.fleet : '';
 if (mode === 'short') return b.name + (v.rego ? ' rego ' + v.rego : '');
 if (mode === 'sms') return b.name + ' ' + v.co + fl + (v.rego ? ' rego ' + v.rego : '');
 const fleet = fl || (!v.fleet && !b.coates ? ' · fleet no. not given' : '');
 return b.name + ' (' + v.co + fleet + ' · rego ' + (v.rego || 'not given') + vms913TwinWords(b) + ')';
}
/* the same Coates asset number on two lines is carried to the driver too, never resolved here: "asset no. also on T0001 -
   to confirm" (the project manager has the question) */
function vms913TwinWords(b){
 if (!b.twin || !b.twin.length) return '';
 const tw = vms913Boards().filter(x => x !== b && x.asset && x.asset === b.asset).map(x => { const o = vms913OnOf(x).on; return o ? vms913ShownKey(o) : 'line ' + x.line; });
 return tw.length ? ' · asset no. also on ' + [...new Set(tw)].join(', ') + ' - to confirm' : '';
}
/* the asset numbers a surface already shows beside the boards: known(n) is true only for a number of this reference that
   is also in what the surface drew */
function vms913KnownOf(a, shown){
 let K = []; try { K = (typeof dpNums === 'function' ? dpNums(a) : []) || []; } catch (e) { K = []; }
 const set = new Set(K.concat(a && Array.isArray(a.asset_numbers) ? a.asset_numbers : []).map(String)), s = shown == null ? null : String(shown);
 return n => set.has(String(n)) && (s == null || s.includes(String(n)));
}
/* a Coates board whose only fact is its asset number, already shown on the same surface: counted, never repeated */
function vms913Repeat(b, known){ if (!known || b.vms || !b.asset || b.name !== b.asset || (b.twin && b.twin.length) || !known(b.asset)) return false;
 const v = vms913Of(b); return !v.rego && v.co === 'Coates' && (!v.fleet || v.fleet === b.asset); }
function vms913LoadOf(a, known){
 const bs = vms913BoardsOn(a); if (!bs) return null;
 const word = bs.some(b => vms913Of(b).src === 'word' || vms913OnOf(b).src === 'word');
 const rep = bs.filter(b => vms913Repeat(b, known)), parts = bs.filter(b => !rep.includes(b)).map(b => vms913Say(b));
 if (rep.length) parts.push(rep.length + ' Coates board' + (rep.length === 1 ? ' by the asset no.' : 's by the asset nos.') + ' shown (rego not given)');
 const mv = vms913MovedOff(vms913TidOf(a));
 return {key: a.key, boards: bs, word, text: bs.length ? parts.join(' · ') : 'boards not named yet', moved: mv.map(m => m.text), movedNos: mv.map(m => m.asset).filter(Boolean)};
}
function vms913LoadHtml(a, cls, known){
 const L = vms913LoadOf(a, known); if (!L) return '';
 return `<span class="vms913load${cls ? ' ' + cls : ''}" data-vms913-load="${esc(a.key)}">${L.boards.length ? '<b>Boards</b> ' + esc(L.text) : '<b>VMS boards not named yet</b>'}${L.word ? ' <small>(' + VMS913_WORD + ')</small>' : ''}${L.moved.map(m => `<span class="vms913mv" data-vms913-moved>${esc(m)}</span>`).join('')}</span>`;
}
/* is a board's document on the shared record yet? 'shared' when the store holds exactly it and nothing is travelling;
   'pending' while it waits or travels; 'refused' when the link lost its right to write; 'local' with no shared record */
function vms913Shared(key){
 const rec = vms913Rec(key); if (!rec) return null;
 if (typeof SYNC === 'undefined' || !SYNC.on || !(SYNC.first instanceof Set) || !SYNC.first.has('vmsboard')) return 'local';
 const id = docIdOf(key), j = JSON.stringify(Object.assign({}, rec, {_k: key})), last = ((SYNC.last || {}).vmsboard || {})[id];
 const q = ((SYNC.queue || {}).vmsboard || {}), queued = Object.prototype.hasOwnProperty.call(q, id), fly = (SYNC.inflight || {})['vmsboard/' + id] !== undefined;
 if (last === j && !queued && !fly) return 'shared';
 return SYNC.readonly ? 'refused' : 'pending';
}
function vms913ByWords(key, by, at){
 const st = vms913Shared(key), who = by ? ' by ' + by : '', when = at ? ' · ' + fmtStamp(at) : '';
 return st === 'shared' ? 'recorded' + who + when
  : st === 'refused' ? 'saved on this device only' + who + when + ' - the shared record did not take it'
  : st === 'pending' ? 'saved on this device' + who + when + ' - not on the shared record yet'
  : 'kept in this browser' + who + when + ' - not on a shared record';
}
function vms913SrcHtml(b, v){
 const w = vms913WordOf(b.key);
 if (v.src === 'record') return `<span class="vms913src rec" data-vms913-state="${esc(vms913Shared(b.key) || '')}">${esc(vms913ByWords(b.key, v.by, v.at))}${v.mixed ? '; the rest ' + VMS913_WORD : ''}</span>`;
 if (v.src === 'word') return `<span class="vms913src word" title="Given on site by the project manager, ${esc(w.said)} ${esc(w.at)}. Anything entered on the record replaces it.">${VMS913_WORD} · ${esc(w.said)}</span>`;
 return '';
}
/* On delivery: the plant line, and on whose say-so only when that differs from the row's Source */
function vms913OnHtml(b, v){
 const o = vms913OnOf(b);
 if (o.on) { const by = o.src === 'record' ? (v.src === 'record' ? '' : vms913ByWords(b.key, o.by, o.at)) : o.src === 'word' ? (v.src === 'word' ? '' : VMS913_WORD) : (v.src === 'contract' ? 'by ' + (o.via || 'match') : 'contract · by ' + (o.via || 'match'));
  return `<b class="mono">${esc(vms913ShownKey(o.on))}</b>${by ? '<small>' + esc(by) + '</small>' : ''}`; }
 return `<span class="todo">not named yet</span>${o.off ? '<small>taken off by the record</small>' : o.bad ? '<small>the record names ' + esc(o.bad) + ', not a VMS delivery here</small>' : ''}`;
}
/* validation: a rego is 1 to 9 letters or digits, kept in capitals; a fleet number follows the sub-hire rule; the delivery
   is one of the VMS deliveries on this page, and never more boards than the schedule row says it carries. Only what the
   editor changed (touched) is checked against the other boards. */
function vms913Check(b, co, fleet, rego, on, touched){
 const t = touched || {co: true, fleet: true, rego: true, on: true};
 co = String(co == null ? '' : co).trim().replace(/\s+/g, ' ');
 fleet = String(fleet == null ? '' : fleet).trim();
 rego = String(rego == null ? '' : rego).trim().toUpperCase();
 on = String(on == null ? '' : on).trim().toUpperCase();
 const coNow = co || vms913Of(b).co;
 if (co && (co.length > 40 || !/^[A-Za-z0-9][A-Za-z0-9 &.'()\/-]*$/.test(co))) return {err: 'A company name is up to 40 letters, digits, spaces and & . \' ( ) / - only.'};
 if (fleet && !subNoRx(coNow).test(fleet)) return {err: coNow.toLowerCase() === 'coates' ? 'A Coates fleet number is 3 to 12 letters, digits or hyphens.' : 'A fleet number is 1 to 12 letters, digits or hyphens.'};
 if (rego && !/^[A-Z0-9]{1,9}$/.test(rego)) return {err: 'A rego is 1 to 9 letters or digits - no spaces, dashes or other marks.'};
 let tid = null;
 if (on) { tid = vms913TaskOf(on); if (!tid) return {err: on + ' is not one of the VMS deliveries on this page (' + vms913PlantLines().map(l => vms913ShownKey(l.key)).join(', ') + ').'}; }
 if (t.on && tid && tid !== vms913OnOf(b).on) { const cap = vms913Cap(tid), here = vms913Boards().filter(x => x.key !== b.key && vms913OnOf(x).on === tid);
  if (cap != null && here.length + 1 > cap) return {err: vms913ShownKey(tid) + ' carries ' + cap + ' board' + (cap === 1 ? '' : 's') + ' on the schedule and already has ' + here.map(x => x.name).join(', ') + ' - take one off it first.'}; }
 const others = vms913Boards().filter(x => x.key !== b.key);
 if (t.rego && rego) { const o = others.find(x => (vms913Of(x).rego || '') === rego); if (o) return {err: 'Rego ' + rego + ' is already on ' + o.name + ' - change it there first.'}; }
 if (t.fleet && fleet) { const c2 = coNow.toLowerCase(), o = others.find(x => { const v = vms913Of(x); return v.src !== 'contract' && String(v.fleet || '').toLowerCase() === fleet.toLowerCase() && String(v.co || '').toLowerCase() === c2; });
  if (o) return {err: 'Fleet number ' + fleet + ' is already on ' + o.name + ' - change it there first.'}; }
 return {co: co || null, fleet: fleet || null, rego: rego || null, on: tid};
}
/* the document a save writes: the record as it stands now, with only the fields the editor changed. A changed field that
   matches what would show without the record (his word, else the contract) is stored as null - it says nothing new */
function vms913Next(b, c, touched){
 const rec = vms913Rec(b.key) || {}, w = vms913WordOf(b.key), same = (x, y) => String(x || '').toLowerCase() === String(y || '').toLowerCase();
 const fb = {co: w.co || b.co, fleet: w.fleet || b.asset || null, rego: w.rego || null, on: vms913OnBase(b)};
 const was = {co: rec.co == null || rec.co === '' ? null : rec.co, fleet: rec.fleet == null ? null : rec.fleet, rego: rec.rego == null ? null : rec.rego, on: rec.on == null || rec.on === '' ? null : rec.on};
 const next = Object.assign({}, was);
 if (touched.co) next.co = !c.co || same(c.co, fb.co) ? null : c.co;
 if (touched.fleet) next.fleet = c.fleet ? (same(c.fleet, fb.fleet) ? null : c.fleet) : (w.fleet ? '' : null);
 if (touched.rego) next.rego = c.rego ? (c.rego === fb.rego ? null : c.rego) : (w.rego ? '' : null);
 if (touched.on) next.on = c.on ? (c.on === fb.on ? null : c.on) : (fb.on ? 'none' : null);
 return {next, changed: ['co', 'fleet', 'rego', 'on'].some(k => next[k] !== was[k])};
}
/* Save waits for the shared record, the way the daily message waits */
function vms913Ready(){ if (typeof SYNC === 'undefined') return true; const hosted = !!(SYNC.on || SYNC.db || SYNC.backend);
 return !hosted || (SYNC.first instanceof Set && SYNC.first.has('vmsboard')); }
/* THE ONE WRITER: an editor, on the edit link, by name - one document in 'vmsboard' */
function vms913Save(key, co, fleet, rego, on, touched, quiet){
 const st = vms913St(), tell = m => { st.said = m; if (!quiet) flash(m); }; st.said = '';
 if (!mayWrite('a VMS board rego')) return false;
 const b = vms913Boards().find(x => x.key === key); if (!b) { flash('Choose a board first.'); return false; }
 if (!vms913Ready()) { tell(VMS913_WAIT); return false; }
 const t = touched || {co: true, fleet: true, rego: true, on: true};
 const c = vms913Check(b, co, fleet, rego, on, t); if (c.err) { tell(c.err); return false; }
 const {next, changed} = vms913Next(b, c, t);
 if (!changed) { tell('Nothing changed on ' + b.name + ' - nothing was saved.'); return false; }
 const who = whoAmI(); if (!who) return false;
 S.vmsboard = S.vmsboard || {};
 /* back to what would show without the record: the document goes, rather than a record that says nothing */
 if (['co', 'fleet', 'rego', 'on'].every(k => next[k] == null)) delete S.vmsboard[b.key];
 else S.vmsboard[b.key] = {co: next.co, fleet: next.fleet, rego: next.rego, on: next.on, line: b.contract + '/' + b.line, by: who, at: new Date().toISOString()};
 stampIt('vmsboard', b.key, who);
 vms913Pick(b.key); /* the form shows what was saved */
 const v = vms913Of(b), o = vms913OnOf(b);
 bump();
 flash(b.name + ' saved: ' + v.co + ' · fleet no. ' + (v.fleet || 'not given') + ' · rego ' + (v.rego || 'not given') + ' · ' + (o.on ? 'on ' + vms913ShownKey(o.on) : 'not on a delivery') + '. By ' + who + '.');
 return true;
}
/* the form's draft remembers the record it was filled from (base) and which fields the editor has changed (touched) */
function vms913Pick(key){
 const bs = vms913Boards(), b = bs.find(x => x.key === key) || bs[0]; if (!b) return null;
 const v = vms913Of(b), o = vms913OnOf(b);
 return (vms913St().draft = {key: b.key, co: v.co || '', fleet: v.fleet || '', rego: v.rego || '', on: o.on || '', base: JSON.stringify(vms913Rec(b.key)), touched: {}, msg: ''});
}
/* another device changed the board while the form was open: refill what the editor has not changed, keep what he has,
   and say so. True when the form was stale. */
function vms913Fresh(root){
 const d = vms913St().draft; if (!d) return false;
 const now = JSON.stringify(vms913Rec(d.key)); if (now === d.base) return false;
 const b = vms913Boards().find(x => x.key === d.key); if (!b) return false;
 const v = vms913Of(b), o = vms913OnOf(b), cur = {co: v.co || '', fleet: v.fleet || '', rego: v.rego || '', on: o.on || ''}, r = vms913Rec(d.key);
 const mine = ['co', 'fleet', 'rego', 'on'].filter(k => d.touched[k]);
 ['co', 'fleet', 'rego', 'on'].forEach(k => { if (!d.touched[k]) d[k] = cur[k]; });
 d.base = now;
 d.msg = b.name + ' was changed on another device' + (r && r.by ? ' by ' + r.by : '') + (r && r.at ? ' at ' + fmtStamp(r.at) : '') + ' - the form now shows that'
  + (mine.length ? ', with your own changes kept' : '') + '. Check it, then save.';
 if (root) { const F = {co: 'vms913Co', fleet: 'vms913Fleet', rego: 'vms913Rego', on: 'vms913On'};
  if (root.querySelector('#vms913Board') && root.querySelector('#vms913Board').value === d.key) Object.entries(F).forEach(([k, id]) => { const el = root.querySelector('#' + id); if (el && !d.touched[k]) el.value = d[k]; });
  const msg = root.querySelector('.vms913msg'); if (msg) msg.textContent = d.msg; }
 return true;
}
function vms913LineOpt(l, sel){ const ev = (l.events || [])[0] || {};
 return `<option value="${esc(l.key)}"${l.key === sel ? ' selected' : ''}>${esc(vms913ShownKey(l.key) + (ev.date ? ' - ' + fmtDay(ev.date).dm : '') + ' - ' + (l.name || 'VMS'))}</option>`; }
/* a record whose board is no longer on the contract (a refresh renamed or renumbered the line) is still shown */
function vms913Orphans(){ const v = S.vmsboard, keys = new Set(vms913Boards().map(b => b.key));
 return v && typeof v === 'object' ? Object.keys(v).filter(k => !keys.has(k) && v[k] && typeof v[k] === 'object') : []; }
function vms913OrphansHtml(){
 const ks = vms913Orphans(); if (!ks.length) return '';
 return `<div class="vms913orph" data-vms913-orphans><b>On the record for a board no longer on the contract</b>${ks.map(k => { const r = S.vmsboard[k];
  const f = [r.co ? 'whose ' + r.co : '', r.fleet ? 'fleet no. ' + r.fleet : '', r.rego ? 'rego ' + r.rego : '', r.on ? 'on delivery ' + r.on : ''].filter(Boolean).join(' · ');
  return `<div data-vms913-orphan="${esc(k)}">${esc(k)}${r.line ? ' · line ' + esc(String(r.line)) : ''}${f ? ' · ' + esc(f) : ''}<small>${esc(vms913ByWords(k, r.by, r.at))}</small></div>`; }).join('')}</div>`;
}
/* EDITORS ONLY: what is left to do after a board was moved by the project manager's word, while it is still left to do -
   the record still lists the number on the delivery it left, and the contract still lists the board on both lines */
function vms913EdNotes(){
 const out = [];
 vms913Boards().forEach(b => (b.folded || []).forEach(f => {
  if (!f.load || vms913OnOf(b).on === f.load) return;
  const from = vms913ShownKey(f.load), a = vms913AssetOf(from) || vms913AssetOf(f.load);
  let nos = []; try { nos = ((a && a.asset_numbers) || []).concat((a && typeof dpNums === 'function' && dpNums(a)) || []).map(String); } catch (e) { nos = []; }
  if (b.asset && nos.includes(b.asset)) out.push('The record still lists ' + b.asset + ' among ' + from + "'s asset numbers — remove it on " + from + "'s Change form.");
  if (!f.ended) out.push('Contract ' + b.contract + ' lists the board on line ' + f.line + ' (' + from + (f.start ? ', from ' + vms913Day(f.start) : '') + ') and line ' + b.line + ' (' + b.name + ') — check line ' + f.line + ' was off-hired or transferred.');
 }));
 return out;
}
function vms913Html(bs){
 const ed = typeof capability === 'function' && capability() === 'edit';
 const rows = bs.map(b => { const v = vms913Of(b), on = vms913OnOf(b).on;
  const fold = (b.folded || []).map(f => f.load && on !== f.load ? ' · moved from ' + vms913ShownKey(f.load) + ' (line ' + f.line + ')' : ' · and line ' + f.line).join('');
  const sub = 'line ' + b.line + (b.docket ? ' · docket ' + b.docket : '') + fold + (b.twin && b.twin.length ? ' · asset no. also on line ' + b.twin.join(', ') : '');
  return `<div class="vms913row" data-vms913-row="${esc(b.key)}" data-src="${v.src}">
 <span class="vms913c b" data-l="Board"><b>${esc(b.name)}</b><small>${esc(sub)}</small></span>
 <span class="vms913c" data-l="Whose">${esc(v.co)}${b.coates && v.co === 'Coates' ? '' : ' <small>sub-hire</small>'}</span>
 <span class="vms913c" data-l="Fleet no.">${v.fleet ? (v.fleet === b.name ? '<span class="vms913same">same as board</span>' : '<b class="mono">' + esc(v.fleet) + '</b>') : '<span class="todo">not given</span>'}</span>
 <span class="vms913c" data-l="Rego">${v.rego ? '<b class="mono">' + esc(v.rego) + '</b>' : '<span class="todo">not given</span>'}</span>
 <span class="vms913c o" data-l="On delivery">${vms913OnHtml(b, v)}</span>
 <span class="vms913c s" data-l="Source">${vms913SrcHtml(b, v)}</span>
 ${ed ? `<span class="vms913c e"><button type="button" class="btn sm" data-vms913-edit="${esc(b.key)}" aria-label="Change ${esc(b.name)}">Change</button></span>` : ''}
 </div>`; }).join('');
 let form = '';
 if (ed) {
  if (!(vms913St().draft && bs.some(x => x.key === vms913St().draft.key))) vms913Pick(bs[0].key);
  vms913Fresh(null);
  const d = vms913St().draft, cur = bs.find(x => x.key === d.key), ready = vms913Ready();
  form = `<div class="vms913form" data-vms913-form>
 <div class="f"><label for="vms913Board">Board</label><select id="vms913Board">${bs.map(b => `<option value="${esc(b.key)}"${b.key === d.key ? ' selected' : ''}>${esc(b.name + ' - line ' + b.line)}</option>`).join('')}</select></div>
 <div class="f"><label for="vms913Co">Whose (company)</label><input id="vms913Co" autocomplete="off" value="${esc(d.co)}" placeholder="${esc(cur.co)}"></div>
 <div class="f"><label for="vms913Fleet">Fleet number</label><input id="vms913Fleet" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(d.fleet)}" placeholder="not given"></div>
 <div class="f"><label for="vms913Rego">Rego</label><input id="vms913Rego" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(d.rego)}" placeholder="not given"></div>
 <div class="f"><label for="vms913On">On delivery</label><select id="vms913On"><option value=""${d.on ? '' : ' selected'}>not on a delivery yet</option>${vms913PlantLines().map(l => vms913LineOpt(l, d.on)).join('')}</select></div>
 <div class="f act"><button type="button" class="btn primary" data-vms913-save${ready ? '' : ' disabled title="' + esc(VMS913_WAIT) + '"'}>Save to the record</button></div>
 </div><p class="vms913msg" role="alert" aria-live="polite">${esc(d.msg || (ready ? '' : VMS913_WAIT))}</p>`;
 }
 const notes = ed ? vms913EdNotes() : [];
 const edNote = notes.length ? `<div class="vms913ed" data-vms913-ednote><b>For editors</b>${notes.map(n => '<p>' + esc(n) + '</p>').join('')}</div>` : '';
 return `<p class="vms913note">From the contract unless a row says otherwise. A rego shows only where somebody has given one, and a board is on a delivery only where the record, the project manager or the contract puts it.</p>
 ${form}${edNote}<div class="vms913list${ed ? ' ed' : ''}"><div class="vms913row head" aria-hidden="true"><span>Board</span><span>Whose</span><span>Fleet no.</span><span>Rego</span><span>On delivery</span><span>Source</span>${ed ? '<span></span>' : ''}</div>${rows}</div>${vms913OrphansHtml()}`;
}
function vms913Bind(root){
 const st = vms913St(), $f = id => root.querySelector('#' + id), F = [['vms913Co', 'co'], ['vms913Fleet', 'fleet'], ['vms913Rego', 'rego'], ['vms913On', 'on']];
 const say = t => { const msg = root.querySelector('.vms913msg'); if (msg) msg.textContent = t || ''; };
 const fill = d => { if (!d) return; const s = $f('vms913Board'); if (s) s.value = d.key; F.forEach(([id, k]) => { const el = $f(id); if (el) el.value = d[k]; });
  const b = vms913Boards().find(x => x.key === d.key), c = $f('vms913Co'); if (b && c) c.placeholder = b.co; say(d.msg); };
 root.querySelectorAll('[data-vms913-edit]').forEach(btn => btn.onclick = () => {
  if (!mayWrite('a VMS board rego')) return; fill(vms913Pick(btn.dataset.vms913Edit));
  const f = root.querySelector('[data-vms913-form]'); if (f) { f.scrollIntoView({block: 'nearest'}); const r = $f('vms913Rego'); if (r) r.focus({preventScroll: true}); } });
 const sel = $f('vms913Board'); if (!sel) return;
 vms913Fresh(root);
 sel.onchange = () => fill(vms913Pick(sel.value));
 F.forEach(([id, k]) => { const el = $f(id); if (el) el.oninput = el.onchange = () => { if (st.draft) { st.draft[k] = el.value; st.draft.touched[k] = true; } }; });
 const go = root.querySelector('[data-vms913-save]'); if (!go) return;
 if (go.disabled) { let n = 0; const t = setInterval(() => { n++; if (!document.contains(go) || n > 120) return clearInterval(t);
  if (vms913Ready()) { go.disabled = false; go.removeAttribute('title'); say(''); clearInterval(t); } }, 1000); }
 go.onclick = () => { const d = st.draft || vms913Pick(sel.value);
  if (vms913Fresh(root)) return; /* a stale form never writes; the form says why */
  const ok = vms913Save(d.key, d.co, d.fleet, d.rego, d.on, d.touched, true);
  if (!ok && st.said) say(st.said); };
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
 const fold = eq796Fold(name, vms913LineCount() + ' contract lines · whose, fleet number, rego and delivery · ' + given + ' rego' + (given === 1 ? '' : 's') + ' given', [box]);
 fold.setAttribute('data-vms913', ''); fold.classList.add('vms913fold');
 const refs = pane.querySelector(':scope > details.eqrefs'), rs = pane.querySelector(':scope > .regsum');
 if (refs) refs.after(fold); else if (rs) rs.before(fold); else pane.appendChild(fold);
 vms913Bind(fold);
}
/* FOR THE DRIVER AND THE INSTALLER: the boards a delivery carries, by name, with fleet number and rego */
function vms913BoardOfLine(x){ if (!x) return null; const c = String(x.rental_contract || '');
 return vms913Boards().find(b => b.contract === c && (b.line === x.line || (b.folded || []).some(f => f.line === x.line))) || null; }
/* a rental line's own board (only where no Boards line is drawn in the same card); the asset number is never repeated as
   a fleet number */
function vms913LineHtml(x){
 const b = vms913BoardOfLine(x); if (!b) return '';
 const v = vms913Of(b), fleet = v.fleet && v.fleet !== b.asset && v.fleet !== b.name ? ' · fleet no. <b>' + esc(v.fleet) + '</b>' : (!v.fleet && !b.coates ? ' · fleet no. not given' : '');
 return ` <span class="vms913chip" data-vms913-line="${esc(b.key)}">${esc(v.co)}${fleet} · rego <b>${esc(v.rego || 'not given')}</b>${v.src === 'word' ? ' <small>(' + VMS913_WORD + ')</small>' : ''}</span>`;
}
function vms913PillsHtml(a){
 const L = vms913LoadOf(a); if (!L) return '';
 const said = L.boards.filter(b => vms913Of(b).src === 'word' || vms913OnOf(b).src === 'word').map(b => b.name);
 const moved = L.moved.map(m => `<small class="vms913pnote" data-vms913-pill data-vms913-moved>${esc(m)}</small>`).join('');
 return (L.boards.length ? L.boards.map(b => `<span class="pill plan" data-vms913-pill="${esc(b.key)}">${esc(vms913Say(b))}</span>`).join('')
  + (said.length ? `<small class="vms913pnote" data-vms913-pill>${esc(said.length > 1 ? said.slice(0, -1).join(', ') + ' and ' + said[said.length - 1] : said[0])}: ${VMS913_WORD}</small>` : '')
  : '<span class="pill none" data-vms913-pill>VMS boards not named yet</span>') + moved;
}
/* the driver drop card's plain asset pills leave out a number a board pill already carries, or the moved line names */
function vms913Rest(a, nums){
 let L = null; try { L = vms913LoadOf(a); } catch (e) { L = null; } if (!L || !(L.boards.length || L.movedNos.length)) return nums;
 const named = new Set(L.movedNos.map(String)); L.boards.forEach(b => { named.add(b.name); if (b.asset) named.add(b.asset); const f = vms913Of(b).fleet; if (f) named.add(f); });
 return nums.filter(n => !named.has(String(n)));
}
function vms913SheetHtml(a, shown){
 const L = vms913LoadOf(a, vms913KnownOf(a, shown)); if (!L) return '';
 return `<br><span class="rs-sup" data-vms913-sheet>${L.boards.length ? 'Boards: ' + esc(L.text) + (L.word ? ' (' + VMS913_WORD + ')' : '') : 'VMS boards not named yet'}${L.moved.map(m => '<br>' + esc(m)).join('')}</span>`;
}
/* the Drivers and Install PDFs: in the booked / recorded numbers cell a driver reads */
function vms913CellHtml(a){
 let shown = []; try { shown = dpNums(a) || []; } catch (e) { shown = []; }
 const L = vms913LoadOf(a, vms913KnownOf(a, shown.join(' '))); if (!L) return '';
 return `<span class="dp-sub vms913cell" data-vms913-truck="${esc(a.key)}">${L.boards.length ? 'Boards: ' + esc(L.text) + (L.word ? ' (' + VMS913_WORD + ')' : '') : 'VMS boards not named yet'}${L.moved.map(m => '<br>' + esc(m)).join('')}</span>`;
}
function vms913AssetOf(key){ try { return (typeof assetOf === 'function' && assetOf(key)) || allAssets().find(x => x.key === key) || null; } catch (e) { return null; } }
/* import: the collection is checked like the others - the key is a board, a rego is 1 to 9 letters or digits, a fleet
   number follows the sub-hire rule, and "on" is a VMS delivery, 'none' or nothing */
function vms913Validate(rec, bad){
 if (!('vmsboard' in rec)) return;
 const v = rec.vmsboard; if (!v || typeof v !== 'object' || Array.isArray(v)) { bad.push('vmsboard is not a set of boards'); return; }
 const boards = vms913Boards();
 Object.entries(v).forEach(([k, d]) => {
  const b = boards.find(x => x.key === k);
  if (!b) { bad.push('VMS board ' + String(k).slice(0, 40) + ' is not a board on the contract'); return; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) { bad.push('VMS board ' + k + ' is not a record'); return; }
  const co = d.co == null ? '' : d.co;
  if (typeof co !== 'string' || (co && (co.length > 40 || !/^[A-Za-z0-9][A-Za-z0-9 &.'()\/-]*$/.test(co)))) bad.push('VMS board ' + k + ': the company is not plain text');
  if (d.rego != null && d.rego !== '' && !(typeof d.rego === 'string' && /^[A-Z0-9]{1,9}$/.test(d.rego))) bad.push('VMS board ' + k + ': the rego is not 1 to 9 capital letters or digits');
  if (d.fleet != null && d.fleet !== '' && !(typeof d.fleet === 'string' && subNoRx(co || b.co).test(d.fleet))) bad.push('VMS board ' + k + ': the fleet number does not follow the sub-hire rule');
  if (d.on != null && d.on !== '' && String(d.on).toLowerCase() !== 'none' && !vms913TaskOf(d.on)) bad.push('VMS board ' + k + ': ' + String(d.on).slice(0, 24) + ' is not a VMS delivery');
  ['by', 'line'].forEach(f => { if (d[f] != null && (typeof d[f] !== 'string' || d[f].length > 120)) bad.push('VMS board ' + k + ': ' + f + ' is not short text'); });
  if (d.at != null && (typeof d.at !== 'string' || isNaN(Date.parse(d.at)))) bad.push('VMS board ' + k + ': the time is not a time');
 });
}
'''

# The surfaces built late in the page (the Timeline load card, the delivery cards, the drawer's Delivery card, the driver's
# texts and the installers' daily page) are wrapped once, after every earlier wrapper, in a script of their own - the way
# the page's later releases wrap them. Each wrapper only adds the boards to a VMS delivery and returns the original output
# untouched for anything else.
LATE = r'''<script id="vms913-script">
/* v9.13 - VMS boards by name, with fleet number and rego, wherever a VMS delivery is shown. Author: Andrew Fisher.
 The project manager, 8 Oct 2026: "T0103 this is VMS09 and VMS10 ... vms boards have number plates too". Every wrapper
 adds to a VMS delivery only and hands back what it was given for anything else; nothing is written. */
(function(){
 /* the Timeline load card, under the asset number */
 const tl = loading872AssetHtml; loading872AssetHtml = function(a){ const h = tl.apply(this, arguments); try { return h + vms913LoadHtml(a, 'tl913', vms913KnownOf(a, h)); } catch (e) { return h; } };
 /* the delivery cards (a Timeline load opened): under "Asset no." - hidden where the load card above already says it */
 const nos = bookingNosLine801; bookingNosLine801 = function(a){ const h = nos.apply(this, arguments); try { const L = vms913LoadHtml(a, 'dc913', vms913KnownOf(a, h)); return L ? (h || '<span class="todo">none supplied</span>') + L : h; } catch (e) { return h; } };
 /* the drawer's Delivery card: under its rental lines (the part of the card the drawer keeps); the rental lines' own board
    chips are left off there, so each fact shows once. A VMS delivery with no rental line is named on the drawer's Driver
    drop card instead */
 const dc = deliveryCard; deliveryCard = function(a){ const h = dc.apply(this, arguments); try { const k = 'On hire — Coates rental system</div>', i = h.indexOf(k), j = i >= 0 ? h.indexOf('</ul>', i) : -1;
  if (!(j > i && h.indexOf(k, i + 1) < 0)) return h;
  const L = vms913LoadHtml(a, 'dcl913', vms913KnownOf(a, h)); if (!L) return h;
  const x = h.slice(0, j + 5).replace(/ <span class="vms913chip"[^>]*>[\s\S]*?<\/span>/g, '');
  return x + '<p class="vms913dcl">' + L + '</p>' + h.slice(j + 5); } catch (e) { return h; } };
 /* the Timeline's "Every day" rows: under the asset numbers in the GC500 ID cell */
 const dr = dayRows; dayRows = function(rows){ let h = dr.apply(this, arguments); try { (rows || []).forEach(r => { if (!r || !r.a) return;
  const i = h.indexOf('data-k="' + esc(r.a.key) + '"'), j = i >= 0 ? h.indexOf('<div class="anos">', i) : -1, k = j >= 0 ? h.indexOf('</div>', j) : -1;
  if (!(k > j && j > i)) return; const L = vms913LoadHtml(r.a, 'row913', vms913KnownOf(r.a, h.slice(j, k))); if (!L) return;
  h = h.slice(0, k) + L + h.slice(k); }); } catch (e) {} return h; };
 /* the driver's short text: one Boards line after what it is, only while the text stays within three texts and the
    service's limit - the full form, then the short one, then the names, then a pointer to Full details */
 const sm = dropSmsText; dropSmsText = function(a){ const h = sm.apply(this, arguments); try { const L = vms913LoadOf(a); if (!L) return h;
  const P = String(h).split('\n'), at = Math.min(2, P.length), bs = L.boards;
  const forms = bs.length ? [bs.map(b => vms913Say(b, 'sms')).join('; '), bs.map(b => vms913Say(b, 'short')).join('; '), bs.map(b => b.name).join(', '), 'see Full details'] : ['not named yet'];
  for (const f of forms) { const t = text747Plain(P.slice(0, at).concat(['Boards: ' + f], P.slice(at)).join('\n')), sh = smsShape(t);
   if (sh.units <= TEXT747_MAX && sh.parts <= 3 && t.length <= TEXT747_SERVICE_MAX) return t; }
  return h; } catch (e) { return h; } };
 /* the driver's full details: a Boards line after the asset numbers */
 const dt = dropText; dropText = function(a){ const h = dt.apply(this, arguments); try { const L = vms913LoadOf(a, vms913KnownOf(a, h)); if (!L) return h; const P = String(h).split('\n'), i = P.findIndex(x => /^Map location: /.test(x));
  P.splice(i >= 0 ? Math.min(P.length, i + 2) : 1, 0, L.boards.length ? 'Boards: ' + L.text + (L.word ? ' (' + VMS913_WORD + ')' : '') : 'VMS boards not named yet', ...L.moved.map(vms913Plain)); return P.join('\n'); } catch (e) { return h; } };
 /* a write the shared record refused (the link lost its right to write): the register is drawn again at once, so a board
    saved only here says so instead of keeping the edit-link wording */
 const se = syncError; syncError = function(e, what){ const r = se.apply(this, arguments); try { if (SYNC.readonly && /^(save|remove) vmsboard /.test(String(what || ''))) { const f = document.querySelector('#pane-plant [data-vms913]'); if (f) { f.remove(); vms913Mount(); } } } catch (x) {} return r; };
 /* the installers' daily page: the boards as the first note on the delivery */
 const dm = daily821Model; daily821Model = function(iso){ const m = dm.apply(this, arguments); try { ((m && m.loads) || []).forEach(l => (l.rows || []).forEach(r => { const a = vms913AssetOf(r.key), L = a && vms913LoadOf(a, vms913KnownOf(a, r.assets || ''));
  if (L) { r.boards913 = L.text; r.notes = [L.boards.length ? 'Boards: ' + L.text + (L.word ? ' (' + VMS913_WORD + ')' : '') : 'VMS boards not named yet'].concat(L.moved, Array.isArray(r.notes) ? r.notes : []); } })); } catch (e) {} return m; };
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
.vms913same{font-size:12px;color:var(--mute)}
.vms913src{font-size:12px;color:var(--mute)}
.vms913src.word,.vms913src.rec{color:var(--orange-ink);font-weight:700}
.vms913orph{margin:10px 0 0;padding:8px 10px;border:1px dashed var(--rule);border-radius:8px;font-size:12.5px}
.vms913orph > div{padding:4px 0}
.vms913orph small{display:block;color:var(--mute);font-size:11px}
.vms913pnote{flex-basis:100%;font-size:11px;color:var(--mute)}
.pill[data-vms913-pill]{white-space:normal;max-width:100%;overflow-wrap:anywhere;text-align:left}
.vms913chip{display:inline-block;max-width:100%;white-space:normal;overflow-wrap:anywhere;font-size:12px;color:var(--orange-ink);font-weight:600}
.vms913load{display:block;max-width:100%;white-space:normal;overflow-wrap:anywhere;font-size:12px;line-height:1.4;font-weight:400;letter-spacing:0;text-transform:none}
.vms913load b{font-weight:700}
.vms913load small{font-size:11px;opacity:.8}
.vms913load.tl913{margin-top:4px}
.vms913mv{display:block}
.vms913ed{margin:0 0 10px;padding:8px 10px;border-left:3px solid var(--orange);background:var(--tint2);font-size:12.5px;line-height:1.45;color:var(--ink)}
.vms913ed p{margin:4px 0 0}
.ld:has(.vms913load.tl913) .vms913load.dc913{display:none}
.vms913dcl{margin:6px 0 0;color:var(--orange-ink)}
.vms913cell{overflow-wrap:anywhere}
@media (max-width:720px){
 .vms913row,.vms913list.ed .vms913row{grid-template-columns:1fr 1fr;gap:4px 10px;padding:10px 2px}
 .vms913row.head{display:none}
 .vms913c.b,.vms913c.s{grid-column:1 / -1}
 .vms913c.s:empty,.vms913c.e{display:none}
 .vms913c:not(.b):not(.e)::before{content:attr(data-l);display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);font-weight:700}
}
/* the Equipment tab's skin keeps its folds white in dark mode; the register's own fold takes light-panel tokens, the way
   .fin745/.pl752/.cj765 do, so its text stays readable. No other component is restyled. */
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #pane-plant.refresh-equipment details.vms913fold{--paper:#fff;--tint2:#fcfbfa;--ink:#14181d;--ink2:#2f3841;--mute:#4b535b;--slate:#4a5560;--rule:#e4e0dc;--rule2:#f1eeec;--orange-ink:#9a3f0a;--orange-soft:#fdf0e6;--red:#b42318;color:var(--ink)}}
body.viewonly [data-vms913-form],body.viewonly [data-vms913-edit],body.viewonly [data-vms913-ednote]{display:none!important}
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
# an import checks the collection (a known part, validated board by board)
change("'answers', 'finance745'];", "'answers', 'finance745', 'vmsboard'];", 'import knows vmsboard')
change('/* a labour tick is only ever true; hours are a number of hours in a day */',
       '/* v9.13 - VMS boards: each entry is a board on the contract, with a valid rego, fleet number and delivery */\n try { vms913Validate(rec, bad); } catch (e) { bad.push(\'the VMS boards could not be checked\'); }\n /* a labour tick is only ever true; hours are a number of hours in a day */', 'import checks vmsboard')
# for the driver: the delivery card's rental lines, the driver drop card, the printed drop sheet (stable code, exactly once)
change("<li>${assetNo(x.asset_no)} ${esc(x.description || '')}", "<li>${assetNo(x.asset_no)} ${esc(x.description || '')}${vms913LineHtml(x)}", 'delivery card rental line')
change("${nums.length ? nums.slice(0, 3).map(n => `<span class=\"pill plan\">Asset <b>${esc(n)}</b></span>`).join('')",
       "${vms913PillsHtml(a)}${nums.length ? vms913Rest(a, nums).slice(0, 3).map(n => `<span class=\"pill plan\">Asset <b>${esc(n)}</b></span>`).join('')", 'driver drop card: board pills, and the asset pills leave out what a board pill carries')
change("${nums.length > 3 ? `<span class=\"pill none\">and ${nums.length - 3} more</span>` : ''}",
       "${vms913Rest(a, nums).length > 3 ? `<span class=\"pill none\">and ${vms913Rest(a, nums).length - 3} more</span>` : ''}", 'driver drop card: "and N more" counts what is left')
change("${field('Asset no.', assetBox + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : ''), 'rs-key')}",
       "${field('Asset no.', assetBox + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : '') + vms913SheetHtml(a, assetBox), 'rs-key')}", 'printed drop sheet')
# the Drivers and Install PDFs (run sheets): in the booked / recorded numbers cell, where the driver reads the numbers
change("})()}</td>\n <td>${acc.length ? acc.map(x => doc === 'ins'", "})()}${vms913CellHtml(r.a)}</td>\n <td>${acc.length ? acc.map(x => doc === 'ins'", 'run sheet booked numbers cell')
# the surfaces built late (Timeline load card, delivery cards, drawer, texts, installers' daily page): one script of
# wrappers, before the v9.10 staff names script, so it runs after every earlier wrapper of those functions
change('<script id="staff910-script">', LATE + '<script id="staff910-script">', 'v9.13 wrappers before the v9.10 script')

m2 = re.search(r'const DATA = (\{.*?\});\n', text)
assert m2 and m2.group(1) == DATA_TEXT, 'DATA changed - stopping'
assert re.findall(r" · v9\.\d+'", text) == FOOT, 'the footer changed - stopping'
assert '</script' not in JS and LATE.count('</script') == 1 and LATE.count('<script') == 1, 'each block closes only its own script'
m3 = re.search(r'const MASTER_LOC = (\{.*?\});\n', text)
assert m3 and m3.group(1) == MASTER_TEXT, 'MASTER_LOC changed - stopping'
open(path, 'w', encoding='utf-8').write(text)
print('ok v9.13', path, '- VMS lines on the contract source:', len(VMS))
