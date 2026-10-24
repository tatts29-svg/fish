'use strict';
// v11.85 - the feet read as feet. Read-only: GET only, every write the page tries is aborted by the harness.
// The progress views' "Fence blocks 216" line must read "Feet / bases" with the hire agreements' component-box total (the count
// fenceComponents849 and the Showcase already show), on the Today table, its breakdown (every hire agreement with its feet) and the
// Progress table; the charge line must be unchanged; turn 30 must carry its cut take and line; nothing else in the programme moves;
// fencing still reads 100%, five green.
//   PAGE=build/GC500_v11.85/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.85/base_live.html node tests/test_v1185.cjs
//   node tests/test_v1185.cjs   (the live page; MOB=1 for phone)
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page.js');
const HERE = path.resolve(__dirname, '..');
const TAKES = JSON.parse(fs.readFileSync(path.join(HERE, 'takes', 'takes.json'), 'utf8'));
const LINES = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, 'turns_changes.json'), 'utf8')).turns.map(t => [t.slot, t]));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const dataOf = f => { const s = fs.readFileSync(f, 'utf8'), i = s.indexOf('const DATA = '), j = s.indexOf('\n', i); return JSON.parse(s.slice(i + 13, j - 1)); };
(async () => {
 const MOB = !!process.env.MOB, tag = (process.env.PAGE ? 'build' : 'live') + '_' + (MOB ? 'phone' : 'desktop');
 const h = await open(Object.assign(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 1000}, {hash: '#today'}, process.env.PAGE ? {pageFile: process.env.PAGE} : {}));
 const p = h.page, cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof go === 'function', null, {timeout: 240000});
  await p.waitForTimeout(7000);
  const m = await p.evaluate(() => {
   const s = todayFencingSummary848(), C = fenceComponents849(s.asOf), base = (C.recorded || []).find(t => t.id === 'base') || {};
   const row = s.summaryRows.find(r => r.id === 'fence_blocks') || null, w = todayWorkSummary848(), wr = (w.fencingRows || []).find(r => r.id === 'fence_blocks') || null;
   const P = progressAsOf(todayIso()), line = (P.fenceLines || []).find(l => l.column === 'fence_blocks') || null;
   const M = rwMergeP1163(progressAsOf(todayIso())), mline = (M.fenceLines || []).find(l => l.column === 'fence_blocks') || null;
   const L = todayLinkedFencing848('fence_blocks', s.asOf), col = FCOL.find(c => c.key === 'fence_blocks') || {};
   const f = fenceOverall853(), B = DATA.broadcast;
   return {footer: (document.body.innerText.match(/v11\.\d\d(\.\d)?/g) || []).slice(-1)[0], asOf: s.asOf,
    base: [C.state, base.quantity, base.sourceRecordCount, base.missingRecordCount],
    row: row && {label: row.label, recorded: row.recorded, count: row.recordCount, unit: row.unit, kind: row.kind, note: row.note, blocks: row.feet1185 && row.feet1185.blocks},
    labels: s.summaryRows.map(r => r.label), wr: wr && {label: wr.label, done: wr.done, total: wr.total},
    line: line && {name: line.name, done: line.done, planned: line.planned, behind: line.behind, blocks: line.feet1185 && line.feet1185.blocks},
    mline: mline && {name: mline.name, done: mline.done}, lineNames: (P.fenceLines || []).map(l => l.name),
    linked: {n: L.dockets.length, sum: L.dockets.reduce((a, d) => a + d.quantity, 0), unit: L.unit, labels: [...new Set(L.dockets.map(d => d.recordLabel))], has36566: (L.dockets.find(d => d.number === '36566') || {}).quantity,
     has36568: (L.dockets.find(d => d.number === '36568') || {}).quantity, papers: L.dockets.filter(d => d.papers.length).length, basis: L.basis, qualifier: L.qualifier},
    charge: {name: col.name_as_written, unit: col.unit, said: col.settled_said},
    early: (() => { const e = todayFencingSummary848('2026-09-20'), r = e.summaryRows.find(x => x.id === 'fence_blocks'), c = fenceComponents849('2026-09-20'), b = (c.recorded || []).find(t => t.id === 'base') || {};
     return {label: r && r.label, recorded: r && r.recorded, comp: b.quantity}; })(),
    fence: [f.state, f.pct && f.pct.min, f.pct && f.pct.max, !!f.allGreen],
    turns: B.turns.map(t => ({slot: t.slot, text: t.text, sha: t.sha256, scene: t.scene, url: DATA.media[t.sha256]})), slots: B.turns.map(t => t.slot), revision: B.revision};
  });
  ok(m.footer === 'v11.85', 'footer ' + m.footer);
  ok(m.base[0] === 'ready' && m.base[1] === 8235, 'the hire agreements carry 8,235 feet to race weekend ' + JSON.stringify(m.base));
  ok(m.row && m.row.label === 'Feet / bases' && m.row.recorded === m.base[1] && m.row.count === m.base[2] && m.row.unit === 'each' && m.row.kind === 'recorded-only',
   'Today summary line reads Feet / bases ' + JSON.stringify(m.row && [m.row.label, m.row.recorded, m.row.count]));
  ok(m.row && /feet, bases and blocks are one item/.test(m.row.note) && /The 216 on the card's Fence Blocks charge line \(docket 36566\) are these feet, counted once here/.test(m.row.note)
   && m.row.blocks && m.row.blocks.recorded === 216, 'its note says blocks are feet and the 216 are counted once: ' + (m.row && m.row.note));
  ok(!m.labels.includes('Fence blocks'), 'no line called Fence blocks in the fencing summary ' + JSON.stringify(m.labels));
  ok(m.wr && m.wr.label === 'Feet / bases' && m.wr.done === 8235, 'the Today work rows carry it ' + JSON.stringify(m.wr));
  ok(m.line && m.line.name === 'Feet / bases' && m.line.done === 8235 && m.line.planned === null && m.line.behind === null && m.line.blocks && m.line.blocks.done === 216,
   'Progress line reads Feet / bases 8,235, no plan ' + JSON.stringify(m.line));
  ok(m.mline && m.mline.name === 'Feet / bases' && m.mline.done === 8235 && !m.lineNames.includes('Fence blocks'), 'the race-weekend merge keeps it ' + JSON.stringify(m.mline));
  ok(m.linked.n === m.base[2] && m.linked.sum === 8235 && m.linked.unit === 'each' && m.linked.has36566 === 216 && m.linked.has36568 === 474 && m.linked.labels.join() === 'Hire agreement',
   'the breakdown lists every hire agreement with its feet ' + JSON.stringify([m.linked.n, m.linked.sum, m.linked.has36566, m.linked.has36568, m.linked.papers]));
  ok(/8,235 on \d+ hire agreements, each counted once/.test(m.linked.basis) && /not estimated|has its feet written/.test(m.linked.qualifier), 'the breakdown says what it counts: ' + m.linked.qualifier);
  ok(m.charge.name === 'Fence blocks' && m.charge.unit === 'each' && m.charge.said === 'charge as per what was used', 'the Fence Blocks charge line is unchanged');
  ok(m.early.label === 'Feet / bases' && m.early.recorded === m.early.comp && m.early.comp > 0, 'an earlier day (20 Sep, before 36566) shows its feet too ' + JSON.stringify(m.early));
  ok(m.fence[0] === 'ready' && m.fence[1] === 100 && m.fence[2] === 100 && m.fence[3] === true, 'fencing still reads 100%, five green ' + JSON.stringify(m.fence));
  ok(m.slots.length === 51 && JSON.stringify(m.slots) === JSON.stringify(Array.from({length: 51}, (_, i) => i + 1)), 'the programme still runs turns 1 to 51');
  for (const x of TAKES) {
   const t = m.turns.find(y => y.slot === x.slot);
   ok(t && t.text === LINES[x.slot].text && t.sha === x.sha256 && t.scene === LINES[x.slot].scene, 'turn ' + x.slot + ' carries its line and take ' + x.sha256.slice(0, 12));
   const f = await p.evaluate(async u => { if (typeof u !== 'string') return null; try { const q = await fetch(u); const b = await q.arrayBuffer(); return {status: q.status, type: q.headers.get('content-type'), bytes: b.byteLength}; } catch (e) { return {err: String(e)}; } }, t && t.url);
   ok(f && f.status === 200 && /audio\/mpeg/.test(f.type || '') && f.bytes === x.bytes, 'turn ' + x.slot + ' take served ' + JSON.stringify(f));
  }
  ok(!m.turns.some(t => /concrete/i.test(t.text)), 'no turn says concrete blocks');
  if (process.env.BASE) {
   const B0 = dataOf(process.env.BASE).broadcast, changed = new Set(TAKES.map(x => x.slot));
   ok(B0.turns.filter(t => !changed.has(t.slot)).every(t => { const n = m.turns.find(y => y.slot === t.slot); return n && n.text === t.text && n.sha === t.sha256; }), 'the other 50 turns are exactly as on the base page');
  }
  ok(/\(v11\.85\)/.test(m.revision), 'the programme note names the v11.85 revision');
  // on screen: the Today fencing table and its breakdown
  await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-today button, #pane-today [role="tab"]')].find(x => /^\s*Fencing\s*$/.test(x.textContent || '')); if (b) b.click(); });
  await p.waitForTimeout(2500);
  const t = await p.evaluate(() => { const r = document.querySelector('#pane-today [data-tw840-fence-row="fence_blocks"]'); if (!r) return null;
   for (let e = r; e; e = e.parentElement) if (e.tagName === 'DETAILS' && !e.open) e.open = true;
   r.scrollIntoView({block: 'center'});
   return {name: (r.querySelector('.tw846-type-name') || {}).textContent, done: (r.querySelector('[data-tw842-fence-value="done"]') || {}).textContent, text: r.textContent.replace(/\s+/g, ' ').trim(),
    blocks: /Fence blocks/.test(document.querySelector('#pane-today').textContent)}; });
  ok(t && t.name === 'Feet / bases' && /8,235/.test(t.done || '') && !t.blocks, 'Today table row on screen: ' + (t && t.text));
  await p.waitForTimeout(800);
  const rowEl = await p.$('#pane-today [data-tw840-fence-row="fence_blocks"]');
  if (rowEl) await rowEl.screenshot({path: path.join(HERE, 'evidence', tag + '_today_row.png')});
  await p.evaluate(() => { const b = document.querySelector('#pane-today [data-tw840-fence-row="fence_blocks"] [data-tw840-fence-detail]'); if (b) b.click(); });
  await p.waitForTimeout(2500);
  const d = await p.evaluate(() => { const g = [...document.querySelectorAll('dialog[open]')].find(x => /Feet \/ bases/.test(x.textContent)); if (!g) return null;
   return {title: (g.querySelector('#tw840-dialog-title') || {}).textContent, items: g.querySelectorAll('[data-tw844-docket^="feet1185:"]').length, text: g.textContent.replace(/\s+/g, ' ')}; });
  ok(d && d.title === 'Feet / bases' && d.items === m.base[2] && /8,235/.test(d.text) && /Hire agreement 36568/.test(d.text) && !/Fence blocks/.test(d.text) && !/\b216 each recorded/.test(d.text) && /8,?235 each recorded/.test(d.text),
   'the breakdown on screen lists ' + (d && d.items) + ' hire agreements under Feet / bases');
  const dlg = await p.$('dialog[open]');
  if (dlg) await dlg.screenshot({path: path.join(HERE, 'evidence', tag + '_today_breakdown.png')});
  await p.evaluate(() => { const c = document.querySelector('dialog[open] [data-tw840-close]'); if (c) c.click(); });
  await p.waitForTimeout(800);
  // on screen: the Progress tab's planned-against-docketed table
  await p.evaluate(() => go('progress'));
  await p.waitForTimeout(4000);
  const g = await p.evaluate(() => { const card = [...document.querySelectorAll('#pane-progress .card')].find(c => /Fencing — planned to date against done/.test(c.textContent)); if (!card) return null;
   for (let e = card; e; e = e.parentElement) if (e.tagName === 'DETAILS' && !e.open) e.open = true;
   const tr = [...card.querySelectorAll('tbody tr')].find(r => /Feet \/ bases/.test(r.textContent)); if (tr) tr.scrollIntoView({block: 'center'});
   return {row: tr ? tr.textContent.replace(/\s+/g, ' ').trim() : null, blocks: /Fence blocks/.test(card.textContent)}; });
  ok(g && g.row && /Feet \/ bases/.test(g.row) && /8,?235/.test(g.row) && !g.blocks, 'Progress table row on screen (the table writes whole numbers plain, as every row): ' + (g && g.row));
  await p.waitForTimeout(800);
  const card = await p.evaluateHandle(() => [...document.querySelectorAll('#pane-progress .card')].find(c => /Fencing — planned to date against done/.test(c.textContent)) || null);
  const el = card.asElement(); if (el) await el.screenshot({path: path.join(HERE, 'evidence', tag + '_progress_table.png')});
  ok(h.errors.length === 0 && cons.length === 0 && h.counts.blocked === 0, 'no page or console errors, no writes ' + JSON.stringify(h.errors.concat(cons)).slice(0, 200));
 } finally { await h.browser.close(); }
 console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
