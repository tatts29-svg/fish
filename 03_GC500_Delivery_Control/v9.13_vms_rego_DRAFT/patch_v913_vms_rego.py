#!/usr/bin/env python3
# Author: Andrew Fisher. v9.13 - VMS boards: whose each board is, its fleet number and its rego.
#
# The project manager, on site, about 14:55 AEST 8 Oct 2026: "VMS10 is Subhired company is PremAir Hire Rego No V14221
# ASSET NO 120T. VMS BOARDS will also have rego numbers." (The disabled toilet for WC31 in the same message is not this
# release.)
#
# What it adds (code only - DATA, the footer, MASTER_LOC, markers, money, hire dates, counts and contract lines are untouched):
#  - a VMS board register on the Equipment tab, one row per VMS line on the contract source (family 'vms'): the board (its
#    VMS number where the contract names one, else the Coates asset number), whose it is (Coates, or the sub-hire company the
#    contract names; a company the project manager or an editor gives wins), its fleet number and its rego;
#  - one small form (edit link only) to enter or change the company, fleet number and rego of a board, saved as its own
#    synced collection 'vmsboard' - one document per board, with who and when - through the page's own write path
#    (mayWrite, whoAmI, stampIt, bump) exactly as the v7.44 sub-hire collection is;
#  - the project manager's word for VMS10 shown as his word until something is entered on the record; every other rego
#    reads "not given". Nothing is written on opening, viewing or printing;
#  - the rego and fleet number beside the board wherever the page names it for a driver: the Delivery card's rental lines
#    in the drawer (e.g. T0103), the Driver drop card, and the printed drop sheet.
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
for need in ('function subhire744One(', 'function eq796(', 'function eq796Fold(', 'const SYNC_COLLS = {', 'function mergeRecords('):
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

JS = r'''
/* v9.13 - VMS BOARDS: WHOSE, FLEET NUMBER AND REGO. Author: Andrew Fisher.
 The project manager, on site, about 14:55 AEST 8 Oct 2026: "VMS10 is Subhired company is PremAir Hire Rego No V14221
 ASSET NO 120T. VMS BOARDS will also have rego numbers."
 One row per VMS line on the contract source (family 'vms'), read only - no contract line, rate, hire date, count or
 position is changed, and the VMS plan reconciliation stays open. The register is its own shared collection, 'vmsboard':
 one document per board {co, fleet, rego, line, by, at}, written only from the form by an editor on the edit link, through
 mayWrite, whoAmI, stampIt and bump, like the v7.44 sub-hire collection. Nothing is written on opening, viewing or
 printing. A document on the record wins over the project manager's word, which is shown as his word until one exists. */
function vms913St(){ return vms913St.s || (vms913St.s = {draft: null, opened: false}); }
/* the project manager's word, shown as his word; anything entered on the record replaces it */
function vms913Word(){ return {VMS10: {co: 'PremAir Hire', fleet: '120T', rego: 'V14221', on: '8 Oct 2026', at: 'about 14:55 AEST'}}; }
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
 return (vms913Boards.b = rows.map(r => {
  const m = String(r.description || '').match(/\bVMS\s?0*(\d{1,3})\b/i), vms = m ? 'VMS' + String(+m[1]).padStart(2, '0') : null;
  const own = r.asset_no_is_plant_number === true && !r.subhired && /^\d{5,8}$/.test(String(r.asset_no || ''));
  let key = vms || (own ? String(r.asset_no) : 'L' + r.rental_contract + '-' + r.line);
  if (seen.has(key)) key = key + '-L' + r.line; seen.add(key);
  return {key, vms, name: vms || (own ? String(r.asset_no) : 'line ' + r.line), contract: String(r.rental_contract || ''), line: r.line,
   branch: r.branch_code || '', co: own ? 'Coates' : vms913CoOf(r), coates: own, asset: own ? String(r.asset_no) : null,
   load: (r.match && r.match.task_id) || null, docket: r.delivery_number || null, what: r.what || r.description || ''};
 }));
}
function vms913Rec(key){ const v = S.vmsboard; return v && Object.prototype.hasOwnProperty.call(v, key) && v[key] && typeof v[key] === 'object' ? v[key] : null; }
/* what the page shows for one board: the record, else the project manager's word, else the contract */
function vms913Of(b){
 const rec = vms913Rec(b.key), w = vms913Word()[b.key];
 if (rec) return {src: 'record', co: rec.co || b.co, fleet: rec.fleet || b.asset || null, rego: rec.rego || null, by: rec.by || null, at: rec.at || null};
 if (w) return {src: 'word', co: w.co, fleet: w.fleet, rego: w.rego, by: null, at: null};
 return {src: 'contract', co: b.co, fleet: b.asset || null, rego: null, by: null, at: null};
}
function vms913SrcHtml(b, v){
 const w = vms913Word()[b.key];
 return v.src === 'record' ? `<span class="vms913src rec">recorded${v.by ? ' by ' + esc(v.by) : ''}${v.at ? ' · ' + esc(fmtStamp(v.at)) : ''}</span>`
  : v.src === 'word' ? `<span class="vms913src word" title="Given on site by the project manager, ${esc(w.on)} ${esc(w.at)}. Anything entered on the record replaces it.">the project manager's word · ${esc(w.on)}</span>`
  : '<span class="vms913src">from the contract</span>';
}
/* validation: a rego is 1 to 9 letters or digits, kept in capitals; a fleet number follows the sub-hire rule */
function vms913Check(b, co, fleet, rego){
 co = String(co == null ? '' : co).trim().replace(/\s+/g, ' ');
 fleet = String(fleet == null ? '' : fleet).trim();
 rego = String(rego == null ? '' : rego).trim().toUpperCase();
 if (co && (co.length > 40 || !/^[A-Za-z0-9][A-Za-z0-9 &.'()\/-]*$/.test(co))) return {err: 'A company name is up to 40 letters, digits, spaces and & . \' ( ) / - only.'};
 if (fleet && !subNoRx(co || b.co).test(fleet)) return {err: (co || b.co).toLowerCase() === 'coates' ? 'A Coates fleet number is 3 to 12 letters, digits or hyphens.' : 'A fleet number is 1 to 12 letters, digits or hyphens.'};
 if (rego && !/^[A-Z0-9]{1,9}$/.test(rego)) return {err: 'A rego is 1 to 9 letters or digits - no spaces, dashes or other marks.'};
 if (!co && !fleet && !rego && !vms913Rec(b.key)) return {err: 'Give a company, a fleet number or a rego for ' + b.name + '.'};
 const others = vms913Boards().filter(x => x.key !== b.key);
 if (rego) { const o = others.find(x => (vms913Of(x).rego || '') === rego); if (o) return {err: 'Rego ' + rego + ' is already on ' + o.name + ' - change it there first.'}; }
 if (fleet) { const c2 = (co || b.co).toLowerCase(), o = others.find(x => { const v = vms913Of(x); return v.src !== 'contract' && String(v.fleet || '').toLowerCase() === fleet.toLowerCase() && String(v.co || '').toLowerCase() === c2; });
  if (o) return {err: 'Fleet number ' + fleet + ' is already on ' + o.name + ' - change it there first.'}; }
 return {co: co || null, fleet: fleet || null, rego: rego || null};
}
/* THE ONE WRITER: an editor, on the edit link, by name - one document in 'vmsboard' */
function vms913Save(key, co, fleet, rego){
 if (!mayWrite('a VMS board rego')) return false;
 const b = vms913Boards().find(x => x.key === key); if (!b) { flash('Choose a board first.'); return false; }
 const c = vms913Check(b, co, fleet, rego); if (c.err) { flash(c.err); return false; }
 const rec = vms913Rec(b.key);
 if (rec && (rec.co || null) === c.co && (rec.fleet || null) === c.fleet && (rec.rego || null) === c.rego) { flash('Nothing changed on ' + b.name + '.'); return false; }
 const who = whoAmI(); if (!who) return false;
 S.vmsboard = S.vmsboard || {};
 S.vmsboard[b.key] = {co: c.co, fleet: c.fleet, rego: c.rego, line: b.contract + '/' + b.line, by: who, at: new Date().toISOString()};
 stampIt('vmsboard', b.key, who);
 const v = vms913Of(b);
 vms913St().draft = {key: b.key, co: v.co || '', fleet: v.fleet || '', rego: v.rego || ''}; /* the form shows what was saved */
 bump();
 flash(b.name + ' saved: ' + v.co + ' · fleet no. ' + (v.fleet || 'not given') + ' · rego ' + (v.rego || 'not given') + '. By ' + who + '.');
 return true;
}
function vms913Pick(key){
 const bs = vms913Boards(), b = bs.find(x => x.key === key) || bs[0]; if (!b) return null;
 const v = vms913Of(b);
 return (vms913St().draft = {key: b.key, co: v.co || '', fleet: v.fleet || '', rego: v.rego || ''});
}
function vms913Html(bs){
 const ed = typeof capability === 'function' && capability() === 'edit';
 const given = bs.filter(b => vms913Of(b).rego).length, contracts = [...new Set(bs.map(b => b.contract + (b.branch ? ' (' + b.branch + ')' : '')))];
 const rows = bs.map(b => { const v = vms913Of(b);
  const sub = 'line ' + b.line + (b.load ? ' · ' + b.load : '') + (b.docket ? ' · docket ' + b.docket : '');
  return `<div class="vms913row" data-vms913-row="${esc(b.key)}" data-src="${v.src}">
 <span class="vms913c b" data-l="Board"><b>${esc(b.name)}</b><small>${esc(sub)}</small></span>
 <span class="vms913c" data-l="Whose">${esc(v.co)}${b.coates && v.co === 'Coates' ? '' : ' <small>sub-hire</small>'}</span>
 <span class="vms913c" data-l="Fleet no.">${v.fleet ? '<b class="mono">' + esc(v.fleet) + '</b>' : '<span class="todo">not given</span>'}</span>
 <span class="vms913c" data-l="Rego">${v.rego ? '<b class="mono">' + esc(v.rego) + '</b>' : '<span class="todo">not given</span>'}</span>
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
 <div class="f act"><button type="button" class="btn primary" data-vms913-save>Save to the record</button></div>
 </div><p class="vms913msg" role="alert" aria-live="polite"></p>`;
 }
 return `<p class="vms913note">One row per VMS line on contract ${esc(contracts.join(', '))} - ${bs.length} lines, ${given} rego${given === 1 ? '' : 's'} given.
 Whose it is and the fleet number come from the contract unless the project manager or an editor has given them; a rego is shown only where somebody has given one.
 Nothing here changes a rate, a hire date, a count or a position, and the VMS plan's own numbering is still being reconciled with the project manager.</p>
 ${form}<div class="vms913list${ed ? ' ed' : ''}"><div class="vms913row head" aria-hidden="true"><span>Board</span><span>Whose</span><span>Fleet no.</span><span>Rego</span><span>Source</span>${ed ? '<span></span>' : ''}</div>${rows}</div>`;
}
function vms913Bind(root){
 const st = vms913St(), $f = id => root.querySelector('#' + id);
 const fill = d => { if (!d) return; const s = $f('vms913Board'); if (s) s.value = d.key; [['vms913Co', 'co'], ['vms913Fleet', 'fleet'], ['vms913Rego', 'rego']].forEach(([id, k]) => { const el = $f(id); if (el) el.value = d[k]; });
  const b = vms913Boards().find(x => x.key === d.key), c = $f('vms913Co'); if (b && c) c.placeholder = b.co; const msg = root.querySelector('.vms913msg'); if (msg) msg.textContent = ''; };
 root.querySelectorAll('[data-vms913-edit]').forEach(btn => btn.onclick = () => {
  if (!mayWrite('a VMS board rego')) return; fill(vms913Pick(btn.dataset.vms913Edit));
  const f = root.querySelector('[data-vms913-form]'); if (f) { f.scrollIntoView({block: 'nearest'}); const r = $f('vms913Rego'); if (r) r.focus({preventScroll: true}); } });
 const sel = $f('vms913Board'); if (!sel) return;
 sel.onchange = () => fill(vms913Pick(sel.value));
 [['vms913Co', 'co'], ['vms913Fleet', 'fleet'], ['vms913Rego', 'rego']].forEach(([id, k]) => { const el = $f(id); if (el) el.oninput = () => { if (st.draft) st.draft[k] = el.value; }; });
 const go = root.querySelector('[data-vms913-save]');
 if (go) go.onclick = () => { const d = st.draft || vms913Pick(sel.value), b = vms913Boards().find(x => x.key === d.key);
  const c = b ? vms913Check(b, d.co, d.fleet, d.rego) : {err: 'Choose a board first.'};
  if (c.err) { const msg = root.querySelector('.vms913msg'); if (msg) msg.textContent = c.err; flash(c.err); return; }
  if (vms913Save(d.key, d.co, d.fleet, d.rego)) vms913Pick(d.key); };
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
 const fold = eq796Fold(name, bs.length + ' contract lines · whose, fleet number and rego · ' + given + ' rego' + (given === 1 ? '' : 's') + ' given', [box]);
 fold.setAttribute('data-vms913', ''); fold.classList.add('vms913fold');
 const refs = pane.querySelector(':scope > details.eqrefs'), rs = pane.querySelector(':scope > .regsum');
 if (refs) refs.after(fold); else if (rs) rs.before(fold); else pane.appendChild(fold);
 vms913Bind(fold);
}
/* FOR THE DRIVER: the boards a reference's rental lines carry, with their fleet number and rego */
function vms913BoardOfLine(x){ return x ? vms913Boards().find(b => b.contract === String(x.rental_contract || '') && b.line === x.line) || null : null; }
function vms913OnRef(a){
 try { const r = a && a.key ? rentalOf(a.key) : null; if (!r) return [];
  return [...new Set(r.lines.map(vms913BoardOfLine).filter(Boolean))]; } catch (e) { return []; }
}
function vms913Words(b){ const v = vms913Of(b); return {name: b.name, co: v.co, fleet: v.fleet || 'not given', rego: v.rego || 'not given', known: !!(v.rego || (v.src !== 'contract' && v.fleet)), word: v.src === 'word'}; }
function vms913LineHtml(x){
 const b = vms913BoardOfLine(x); if (!b) return '';
 const w = vms913Words(b);
 return ` <span class="vms913chip" data-vms913-line="${esc(b.key)}">${esc(w.co)} · fleet no. <b>${esc(w.fleet)}</b> · rego <b>${esc(w.rego)}</b>${w.word ? " <small>(the project manager's word)</small>" : ''}</span>`;
}
function vms913PillsHtml(a){
 const bs = vms913OnRef(a); if (!bs.length) return '';
 const ws = bs.map(vms913Words), known = ws.filter(w => w.known), rest = ws.length - known.length;
 return known.map(w => `<span class="pill plan" data-vms913-pill>${esc(w.name)} · ${esc(w.co)} · Fleet <b>${esc(w.fleet)}</b> · Rego <b>${esc(w.rego)}</b></span>`).join('')
  + (rest ? `<span class="pill none" data-vms913-pill>${rest} VMS board${rest === 1 ? '' : 's'} · rego not given</span>` : '');
}
function vms913SheetHtml(a){
 const bs = vms913OnRef(a); if (!bs.length) return '';
 return bs.map(b => { const w = vms913Words(b); return `<br><span class="rs-sup" data-vms913-sheet>${esc(w.name)} · ${esc(w.co)} · fleet no. ${esc(w.fleet)} · rego ${esc(w.rego)}</span>`; }).join('');
}
'''

CSS = '''
/* v9.13 - VMS boards: whose, fleet number and rego. Author: Andrew Fisher. */
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
.vms913row{display:grid;grid-template-columns:minmax(120px,1.2fr) minmax(110px,1.2fr) minmax(80px,.8fr) minmax(80px,.8fr) minmax(140px,1.6fr);gap:8px;align-items:center;padding:7px 2px;border-bottom:1px solid var(--rule2);font-size:13px;min-width:0}
.vms913list.ed .vms913row{grid-template-columns:minmax(120px,1.2fr) minmax(110px,1.2fr) minmax(80px,.8fr) minmax(80px,.8fr) minmax(140px,1.6fr) 96px}
.vms913row.head{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);font-weight:700;padding:8px 2px}
.vms913row:not(.head)[data-src="word"],.vms913row:not(.head)[data-src="record"]{background:var(--orange-soft)}
.vms913c{min-width:0;overflow-wrap:anywhere}
.vms913c.b b{display:block;font-size:14px}
.vms913c small{color:var(--mute);font-size:11px}
.vms913c.b small{display:block}
.vms913src{font-size:12px;color:var(--mute)}
.vms913src.word,.vms913src.rec{color:var(--orange-ink);font-weight:700}
.vms913chip{display:inline-block;max-width:100%;white-space:normal;overflow-wrap:anywhere;font-size:12px;color:var(--orange-ink);font-weight:600}
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
# for the driver: the delivery card's rental lines, the driver drop card, the printed drop sheet
change("<li>${assetNo(x.asset_no)} ${esc(x.description || '')}", "<li>${assetNo(x.asset_no)} ${esc(x.description || '')}${vms913LineHtml(x)}", 'delivery card rental line')
change('${supplierNumbersHtml744(a)}\n ${nums.length > 3', '${supplierNumbersHtml744(a)}${vms913PillsHtml(a)}\n ${nums.length > 3', 'driver drop card pills')
change("${field('Asset no.', assetBox + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : ''), 'rs-key')}",
       "${field('Asset no.', assetBox + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : '') + vms913SheetHtml(a), 'rs-key')}", 'printed drop sheet')

m2 = re.search(r'const DATA = (\{.*?\});\n', text)
assert m2 and m2.group(1) == DATA_TEXT, 'DATA changed - stopping'
assert re.findall(r" · v9\.\d+'", text) == FOOT, 'the footer changed - stopping'
assert '</script' not in JS, 'the code must not close its script'
open(path, 'w', encoding='utf-8').write(text)
print('ok v9.13', path, '- VMS lines on the contract source:', len(VMS))
