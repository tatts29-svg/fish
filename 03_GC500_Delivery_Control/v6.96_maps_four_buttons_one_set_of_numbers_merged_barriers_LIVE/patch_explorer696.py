#!/usr/bin/env python3
"""v6.96 - Plan on satellite: one set of numbers. Opened from the dashboard (it always is: an iframe on the same
service), the Find chips are the master plan's own trades and layers, from gc500PlanItems() in the page that opened it -
the same references, places and counts as the Map. Andrew, 27 Sep 2026: "Numbers here are wrong" (46 of 55 portable
buildings, 0 of 14 generators, 0 of 19 light towers - it counted the codes D001 prints, and D001 prints none of those).
The drawing's own landmarks (stands, bars, Armco access, egress, over-track signage, bridges) stay as D001 prints them,
and Stands now include S22A. Opened on its own, it falls back to the register file and D001's labels as before.
   python3 patch_explorer696.py <explorer.js>"""
import sys
p = sys.argv[1]; t = open(p, encoding='utf-8').read()
if 'hostPlan()' in t: sys.exit('already applied')
def R(old, new, what, n=1):
    global t
    if t.count(old) != n: sys.exit('%s: %d' % (what, t.count(old)))
    t = t.replace(old, new)
R("{id: 'stands', name: 'Stands', c: '#f72585', pre: /^S\\d{2}$/}", "{id: 'stands', name: 'Stands', c: '#f72585', pre: /^S\\d{2}[A-Z]?$/}", 'stands S22A')
R("function catOf(code, product) {", r"""/* v6.96 - the master plan's own trades and layers, when the dashboard opened this page (see the header of patch_explorer696) */
const TRADE_C = {'Portable buildings': '#ff9a4d', 'Toilets & amenities': '#39e07a', 'Generators': '#ffd166', 'Lighting towers': '#ffffff', 'Water-filled barriers': '#4cc9f0', 'Access & plant': '#e27bd9', 'Furniture': '#d6b58c', 'Ground protection': '#9fb3c8'};
const LAYER_C = {vms: '#b98cf5', wb: '#ff8a3d', gate: '#6fdc8c', ep: '#3cc7e6', screen: '#7d9bff', gens: '#e27bd9', iface: '#ff6b5e', wcx: '#d9a05b'};
const LANDMARKS = new Set(['stands', 'bars', 'armco', 'egress', 'overtrack', 'bridges']);
let CATS_NOW = CATS, HOST = null, PLAN_SNAP = null;
/* live from the page that opened this one; in its own window, the snapshot taken from that same function when the set was built */
function hostPlan() { try { const w = window.parent; if (w && w !== window && typeof w.gc500PlanItems === 'function') { const h = w.gc500PlanItems(); if (h) return h; } } catch (e) {} return PLAN_SNAP && PLAN_SNAP.v === 1 ? PLAN_SNAP : null; }
const ptBox = pt => { const x = pt[0] * SHEET_W, y = pt[1] * SHEET_H; return [x - 1.2, y - .8, x + 1.2, y + .8]; };
function placeWord(it) { if (it.cat && it.cat.host) return it.places.length ? 'on the master plan' + (it.reg && it.reg.sec ? ' · ' + it.reg.sec : '') : 'no place on the master plan yet'; return it.places.length ? it.places.length + ' place' + (it.places.length === 1 ? '' : 's') + ' on D001' : 'not labelled on D001'; }
function catOf(code, product) {""", 'host helpers')
R("""  if (REG) for (const a of REG.assets) { const it = add(a.key); it.reg = a; }
  for (const it of byCode.values()) { it.cat = catOf(it.code.replace(' ', ''), it.reg && it.reg.product) || catOf(it.code, null); }
  ITEMS = [...byCode.values()].filter(it => it.cat).sort((x, y) => x.code.localeCompare(y.code, 'en', {numeric: true}));
  const counts = {}; for (const it of ITEMS) { const c = counts[it.cat.id] = counts[it.cat.id] || {n: 0, on: 0}; c.n++; if (it.places.length) c.on++; }
  $('chips').innerHTML = CATS.filter(c => counts[c.id]).map(c => `<button class="chip" data-cat="${c.id}" aria-pressed="false" style="--c:${c.c}"><i></i>${c.name} <small>${counts[c.id].on}${counts[c.id].on !== counts[c.id].n ? ' of ' + counts[c.id].n : ''}</small></button>`).join('');""",
"""  HOST = hostPlan();
  if (REG && !HOST) for (const a of REG.assets) { const it = add(a.key); it.reg = a; }
  for (const it of byCode.values()) { it.cat = catOf(it.code.replace(' ', ''), it.reg && it.reg.product) || catOf(it.code, null); }
  let list = [...byCode.values()].filter(it => it.cat); CATS_NOW = CATS;
  if (HOST) {   /* the Map's numbers: the master plan's trades, then its layers, then the drawing's own landmarks */
    list = list.filter(it => LANDMARKS.has(it.cat.id)); const cats = [];
    HOST.trades.forEach(tr => { const c = {id: 't' + cats.length, name: tr.name, c: TRADE_C[tr.name] || '#ff6a13', count: tr.count, host: 'trade'}; cats.push(c);
      HOST.items.filter(i => i.trade === tr.name).forEach(i => list.push({code: norm(i.key), places: [ptBox(i.pt)], reg: {name: i.name, asset_numbers: i.assets, sec: i.sec}, cat: c, names: []}));
      HOST.unplaced.filter(i => i.trade === tr.name).forEach(i => list.push({code: norm(i.key), places: [], reg: {name: i.name, drawing: i.drawing}, cat: c, names: []})); });
    HOST.layers.forEach(l => {
      /* v6.96 - Andrew, 27 Sep 2026: "Merge barriers". The barrier runs drawn on the K-sheets join the water-filled barriers
         on our schedule under one chip, so barriers are found in one place: 12 locations and the 20 runs they make up. */
      const wfb = l.id === 'wb' ? cats.find(x => x.host === 'trade' && /water.filled barrier/i.test(x.name)) : null;
      const c = wfb || {id: 'l' + cats.length, name: l.name, c: LAYER_C[l.id] || '#ff6a13', count: String(l.n), host: 'layer', why: l.why};
      if (wfb) { wfb.count = wfb.count + ' · ' + l.n + ' runs'; wfb.merged = l.why; } else cats.push(c);
      const seen = {}; l.marks.forEach(m => { const f = norm(m.face || l.name), k = seen[f] = (seen[f] || 0) + 1, dup = l.marks.filter(x => norm(x.face || l.name) === f).length > 1;
        list.push({code: dup ? f + ' ' + k : f, places: [ptBox(m.pt)], reg: {name: m.name && norm(m.name) !== f ? m.name : '', note: m.note}, cat: c, names: []}); }); });
    CATS_NOW = cats.concat(CATS.filter(c => LANDMARKS.has(c.id)));
  }
  ITEMS = list.sort((x, y) => x.code.localeCompare(y.code, 'en', {numeric: true}));
  const counts = {}; for (const it of ITEMS) { const c = counts[it.cat.id] = counts[it.cat.id] || {n: 0, on: 0}; c.n++; if (it.places.length) c.on++; }
  $('chips').innerHTML = CATS_NOW.filter(c => counts[c.id]).map(c => `<button class="chip" data-cat="${c.id}" aria-pressed="false" style="--c:${c.c}"><i></i>${esc(c.name)} <small>${c.host ? esc(c.count) : counts[c.id].on + (counts[c.id].on !== counts[c.id].n ? ' of ' + counts[c.id].n : '')}</small></button>`).join('');
  const fh = document.querySelector('#findCard h3'); if (fh) fh.textContent = HOST ? 'Find on the master plan' : 'Find on the drawing';
  const sh3 = $('q') && $('q').closest('div') && $('q').closest('div').parentElement.querySelector('h3'); if (sh3 && HOST) sh3.textContent = 'Search the master plan and the drawing';""", 'build items')
R("""  const cat = CATS.find(c => c.id === id), items""", """  const cat = CATS_NOW.find(c => c.id === id), items""", 'show cat')
R("""  L.innerHTML = `<div class="rh">${cat.name}: ${placed.length} labelled on D001${unplaced.length ? ' · ' + unplaced.length + ' in the register but not labelled on D001' : ''}. A ring is where the sheet prints the code, not a surveyed position.</div>` +
    placed.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>${it.reg ? ' · ' + esc(it.reg.name || it.reg.product) : ''}<small>${it.places.length} place${it.places.length === 1 ? '' : 's'} on D001${it.reg && it.reg.item_types ? ' · ' + esc(String(it.reg.item_types).replace(/[\\[\\]']/g, '')) : ''}</small></button>`).join('') +
    unplaced.map(it => `<button data-code="${esc(it.code)}" class="dim"><b>${esc(it.code)}</b> · ${esc(it.reg.name || it.reg.product)}<small>not labelled on D001${""",
"""  const head = cat.host === 'trade' ? `${esc(cat.name)}: ${esc(cat.count)} on the master plan, the same count as the Map${cat.merged ? ' — the barrier locations on our schedule and the runs drawn on the barrier sheets (' + esc(cat.merged) + '), in one list' : ''}${unplaced.length ? ' · ' + unplaced.length + ' more in the register with no place on it yet' : ''}. A ring is where the master plan puts it, not a surveyed position.`
    : cat.host === 'layer' ? `${esc(cat.name)}: ${esc(cat.count)} on the master plan, the same count as the Map — ${esc(cat.why || '')}.`
    : `${cat.name}: ${placed.length} labelled on D001${unplaced.length ? ' · ' + unplaced.length + ' in the register but not labelled on D001' : ''}. A ring is where the sheet prints the code, not a surveyed position.`;
  L.innerHTML = `<div class="rh">${head}</div>` +
    placed.map(it => `<button data-code="${esc(it.code)}"><b>${esc(it.code)}</b>${it.reg && (it.reg.name || it.reg.product) ? ' · ' + esc(it.reg.name || it.reg.product) : ''}<small>${esc(placeWord(it))}${it.reg && it.reg.item_types ? ' · ' + esc(String(it.reg.item_types).replace(/[\\[\\]']/g, '')) : ''}${it.reg && it.reg.asset_numbers && String(it.reg.asset_numbers) !== '[]' && cat.host ? ' · asset ' + esc(String(it.reg.asset_numbers)) : ''}</small></button>`).join('') +
    unplaced.map(it => `<button data-code="${esc(it.code)}" class="dim"><b>${esc(it.code)}</b> · ${esc(it.reg.name || it.reg.product)}<small>${esc(placeWord(it))}${""", 'list text')
R("""  else toast(it.code + ' is in the register but D001 does not label it' + (it.reg && it.reg.drawing ? '; it is keyed on ' + it.reg.drawing : '') + '.', 6000);""",
  """  else toast(it.code + (it.cat && it.cat.host ? ' is in the register but has no place on the master plan yet' : ' is in the register but D001 does not label it') + (it.reg && it.reg.drawing ? '; it is keyed on ' + it.reg.drawing : '') + '.', 6000);""", 'toast')
R("""<small>${it.cat.name}${it.places.length ? ' · ' + it.places.length + ' place' + (it.places.length === 1 ? '' : 's') + ' on D001' : ' · not labelled on D001'}""",
  """<small>${esc(it.cat.name)} · ${esc(placeWord(it))}""", 'search text')
R("    REG = await fetch('assets/register.json').then(r => r.ok ? r.json() : null).catch(() => null); buildItems();",
  "    REG = await fetch('assets/register.json').then(r => r.ok ? r.json() : null).catch(() => null);\n    PLAN_SNAP = await fetch('assets/plan_items.json', {cache: 'no-cache'}).then(r => r.ok ? r.json() : null).catch(() => null); buildItems();   /* v6.96 */", 'snapshot load')
open(p, 'w', encoding='utf-8').write(t); print('ok', p)
