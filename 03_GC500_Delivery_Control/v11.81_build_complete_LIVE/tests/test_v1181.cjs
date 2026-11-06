'use strict';
// v11.81 - the fencing build complete at the docket numbers. Read-only: GET only, every write the page tries is aborted by the harness.
// Opens the page twice in turn (never two at once): with the real clock, then with the page clock at Tue 27 Oct 2026. Fencing must
// read 100% at race weekend with the programme line kept beside each closed type; an earlier day must read as before; the event
// week's leftovers must leave the forecast and the demob programme must stay; the re-voiced turns must play their new takes.
//   PAGE=build/GC500_v11.81/GC500_Delivery_Control_hosted.html node tests/test_v1181.cjs        (desktop; MOB=1 for phone)
//   node tests/test_v1181.cjs                                                                   (the live page)
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page.js');
const HERE = path.resolve(__dirname, '..');
const CLOCKS = ['', '2026-10-27T10:00:00+10:00'];
const shift = c => c ? `(()=>{const RD=Date,off=RD.parse(${JSON.stringify(c)})-RD.now();function FD(...a){if(!new.target)return new RD(RD.now()+off).toString();return a.length?new RD(...a):new RD(RD.now()+off);}FD.prototype=RD.prototype;FD.now=()=>RD.now()+off;FD.parse=RD.parse;FD.UTC=RD.UTC;globalThis.Date=FD;})();` : '';
const CLOSED = {scrim: 4394.5, v_gates: 135, ped_gates: 34, ccb_demarc: 5205, relocation: 989, removal: 1133};
const TAKES = fs.existsSync(path.join(HERE, 'takes', 'takes.json')) ? JSON.parse(fs.readFileSync(path.join(HERE, 'takes', 'takes.json'), 'utf8')) : [];
const LINES = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, 'turns_changes.json'), 'utf8')).turns.map(t => [t.slot, t]));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
async function read(clock) {
 const MOB = !!process.env.MOB;
 const h = await open(Object.assign(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 1000}, {hash: '#today', init: shift(clock)}, process.env.PAGE ? {pageFile: process.env.PAGE} : {}));
 const p = h.page, cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof go === 'function', null, {timeout: 240000});
  await p.waitForTimeout(7000);
  const r = await p.evaluate(slots => {
   const out = {errors: []}, t = (k, f) => { try { out[k] = f(); } catch (e) { out.errors.push(k + ': ' + String(e && e.message || e).slice(0, 300)); } };
   const r2 = n => typeof n === 'number' ? Math.round(n * 100) / 100 : n;
   t('today', () => todayIso());
   t('footer', () => (document.body.innerText.match(/v11\.\d\d/g) || []).slice(-1)[0]);
   t('ruling', () => window.FENCE_BUILD_CLOSED1181 && window.FENCE_BUILD_CLOSED1181.on);
   t('fence', () => { const f = fenceOverall853(); return {state: f.state, min: r2(f.pct && f.pct.min), max: r2(f.pct && f.pct.max), provisional: f.provisional, pending: f.classificationPending,
    total: f.total, credited: f.credited, left: f.left, complete: f.scopeComplete1012, gates: f.gates.map(g => [g.id, g.done, g.total, g.left])}; });
   t('index', () => { const m = progress881Model(); const fr = m.rows.find(x => x.id === 'fencing'); return {min: r2(m.pct && m.pct.min), max: r2(m.pct && m.pct.max), fencing: [r2(fr.min), r2(fr.max), fr.provisional]}; });
   t('rows', () => Object.fromEntries(todayWorkSummary848().fencingRows.map(x => [x.id, {done: x.done, total: x.total, left: x.left, closed: x.closedBuild1181 ? x.closedBuild1181.programme : null, prov: !!x.sourceProvisional, label: x.plan && x.plan.label}])));
   t('earlier', () => Object.fromEntries(todayWorkSummary848('2026-10-16').fencingRows.filter(x => ['scrim', 'ccb_demarc', 'relocation'].includes(x.id)).map(x => [x.id, {done: x.done, total: x.total, left: x.left, closed: !!x.closedBuild1181}])));
   t('source', () => Object.fromEntries(todayFencingSummary848().summaryRows.filter(x => ['clean', 'scrim'].includes(x.id)).map(x => [x.id, x.planned])));
   t('ccb', () => { const s = todayFencingSummary848().classification; return {pending: s.pendingCount, conf: s.confirmedByType}; });
   t('reviews', () => Object.fromEntries(['36766', '36768'].map(no => { const d = allDockets().find(x => String(x.docket_no) === no); const v = d ? fenceCcbReview847(d) : null; return [no, v ? [v.state, v.confirmedType] : null]; })));
   t('evidence', () => { const e = fenceProgressEvidence848(); return {state: e.state, pending: e.pending.length, op: (e.operations.find(o => o.id === 'physical-relocation-24492') || {}).quantity || null}; });
   t('lines', () => Object.fromEntries(progressAsOf('2026-10-23').fenceLines.map(l => [l.column, [l.planned, l.done, l.behind, l.closedBuild1181 ? l.closedBuild1181.behind : null]])));
   t('forecast', () => { const F = cj764Fencing(); return {revenue: F.revenue, cost: F.cost, weeks: F.weeks.map(w => w.prog || w.week)}; });
   t('money', () => FinancialPresentation976.fenceSummary(fencePaidSplit(), fenceDerived(), cj764Fencing()).map(x => [x.label, r2(x.recorded), r2(x.remaining), r2(x.job)]));
   t('turns', () => { const B = DATA.broadcast; return slots.map(s => { const x = B.turns.find(t => t.slot === s); return {slot: s, text: x.text, sha: x.sha256, media: !!DATA.media[x.sha256], url: typeof mediaUrl === 'function' ? null : null}; }); });
   t('manifest', () => DATA.hostedMedia && DATA.hostedMedia.manifest);
   t('mediaCount', () => Object.keys(DATA.media).length);
   return out;
  }, TAKES.map(x => x.slot));
  await p.evaluate(() => go('today')); await p.waitForTimeout(3500);
  r.todayText = await p.evaluate(() => { const el = document.getElementById('pane-today'); if (!el) return ''; el.querySelectorAll('details').forEach(d => d.open = true); return el.innerText; });
  await p.evaluate(() => go('fencing')); await p.waitForTimeout(3500);
  r.fencingText = await p.evaluate(() => { const el = document.getElementById('pane-fencing'); if (!el) return ''; const c = el.querySelector('[data-financial976]'); if (c) c.querySelectorAll('details').forEach(d => d.open = true); return el.innerText.slice(0, 6000); });
  r.takeFetch = [];
  for (const x of TAKES) {
   const res = await p.evaluate(async sha => { const v = DATA.media[sha]; const u = typeof v === 'string' ? v : v && v.file ? '/m/Coates-GC500-2026/' + v.file : null; if (!u) return null;
    try { const q = await fetch(u); const b = await q.arrayBuffer(); return {status: q.status, type: q.headers.get('content-type'), bytes: b.byteLength}; } catch (e) { return {err: String(e)}; } }, x.sha256);
   r.takeFetch.push([x.slot, res]);
  }
  r.pageErrors = h.errors.slice(); r.cons = cons; r.counts = h.counts;
  return r;
 } finally { await h.browser.close(); }
}
(async () => {
 const R = [];
 for (const c of CLOCKS) { console.log('== reading with the page clock at ' + (c || 'now') + (process.env.MOB ? ' (phone)' : ' (desktop)')); R.push(await read(c)); }
 for (const [k, r] of R.entries()) {
  console.log('== ' + (k ? 'page clock Tue 27 Oct 2026' : 'the real clock (' + r.today + ')'));
  ok(r.errors.length === 0 && r.pageErrors.length === 0 && r.cons.length === 0, 'no page errors, no console errors, every reading ran ' + JSON.stringify(r.errors.concat(r.pageErrors, r.cons)).slice(0, 300));
  ok(r.counts.blocked === 0, 'no write attempted (' + r.counts.blocked + ' blocked)');
  ok(r.footer === 'v11.81' && r.ruling === '2026-10-24', 'footer ' + r.footer + ', ruling of ' + r.ruling);
  ok(r.fence.state === 'ready' && r.fence.min === 100 && r.fence.max === 100 && !r.fence.provisional && !r.fence.pending && r.fence.complete === true,
   'fencing reads 100%, one figure, not provisional, scope complete (' + JSON.stringify(r.fence.credited) + ' of ' + r.fence.total + ' m)');
  ok(r.fence.total === 20098.5 && r.fence.left.min === 0 && r.fence.left.max === 0, 'programme metres 20,098.5 = 12,617 + 2,163 + 5,062.5 + 256; nothing left');
  ok(JSON.stringify(r.fence.gates) === JSON.stringify([['v_gates', 133, 133, 0], ['ped_gates', 22, 22, 0]]), 'gates 133 of 133 and 22 of 22 ' + JSON.stringify(r.fence.gates));
  ok(r.index.min === 100 && r.index.max === 100 && r.index.fencing[0] === 100 && r.index.fencing[2] === false, 'the seven-group index reads 100% with fencing at 100% ' + JSON.stringify(r.index));
  const rowsOk = Object.entries(CLOSED).every(([id, prog]) => r.rows[id] && r.rows[id].closed === prog && r.rows[id].left === 0 && r.rows[id].done === r.rows[id].total);
  ok(rowsOk, 'each short type reads done = programme with its programme line kept: ' + Object.keys(CLOSED).map(id => id + ' ' + (r.rows[id] || {}).done + '/' + (r.rows[id] || {}).closed).join(', '));
  ok(r.rows.relocation.done === 612.5 && r.rows.scrim.done === 3977.5 && r.rows.ccb_demarc.done === 5062.5 && r.rows.removal.done === 1102.5, 'relocations 612.5 m (24492 counted), scrim 3,977.5, demarcation 5,062.5, removals 1,102.5');
  ok(r.rows.clean.total === 12617 && r.rows.clean.done === 13270 && r.rows.clean.closed === null && r.rows.ccb_event.done === 2195 && r.rows.ccb_event.total === 2163 && r.rows.flat_feet.done === 270,
   'types over their line untouched: temporary fence 13,270 of 12,617; event CCB 2,195 of 2,163; flat feet 270');
  ok(!Object.values(r.rows).some(x => x.prov) && !Object.values(r.rows).some(x => /^Provisional/.test(x.label || '')), 'no fencing row reads provisional');
  ok(r.source.clean === 8222.5 && r.source.scrim === 4394.5, 'the source programme summary is unchanged (clean 8,222.5 + braced 4,394.5)');
  ok(Object.values(r.earlier).every(x => !x.closed) && r.earlier.scrim.left > 0, 'an earlier day (16 Oct) reads as before ' + JSON.stringify(r.earlier));
  ok(r.ccb.pending === 0 && r.ccb.conf.ccb_event === 2195 && r.ccb.conf.ccb_demarc === 5062.5, 'no crowd-control docket waits on a category ' + JSON.stringify(r.ccb.conf));
  ok(JSON.stringify(r.reviews) === JSON.stringify({36766: ['confirmed', 'ccb_event'], 36768: ['confirmed', 'ccb_event']}), '36766 and 36768 confirmed Event ' + JSON.stringify(r.reviews));
  ok(r.evidence.state === 'ready' && r.evidence.pending === 0 && r.evidence.op === 30, 'evidence ready, 24492 counted 30 m ' + JSON.stringify(r.evidence));
  ok(r.lines.scrim[2] === 0 && r.lines.scrim[3] === 417 && r.lines.ccb_demarc[3] === 142.5 && r.lines.scrim[0] === 4394.5, 'programme/docket table: planned kept, nothing not yet docketed ' + JSON.stringify(r.lines.scrim));
  ok(!r.forecast.weeks.includes('EVENT WEEK') && r.forecast.weeks.join() === 'DECON WK1,DECON WK2,DECON WK3' && r.forecast.revenue === 26522.4 && r.forecast.cost === 10350,
   'forecast carries the demob programme only: ' + r.forecast.weeks.join(', ') + ' $' + r.forecast.revenue + ' / $' + r.forecast.cost);
  ok(JSON.stringify(r.money) === JSON.stringify([['Charges to V8 Supercars', 405150.96, 26522.4, 431673.36], ['Advanced Fencing subcontract cost', 261123.2, 10350, 271473.2]]), 'fencing money ' + JSON.stringify(r.money));
  ok(/Scrim fitted \(on the fence above\) m\t3,977\.5\t0\t3,977\.5/.test(r.todayText) && /Relocations m\t612\.5\t0\t612\.5/.test(r.todayText) && /Crowd control · demarcation m\t5,062\.5\t0\t5,062\.5/.test(r.todayText),
   'Where we are reads the closed rows');
  ok(/Build complete at the docket numbers/i.test(r.todayText) && /none · build complete/i.test(r.todayText) && !/Scrim m\s+4394\.5 m\s+3977\.5 m\s+417 m/.test(r.todayText) && !/CCB Demarc m\s+5205 m\s+5062\.5 m\s+142\.5 m/.test(r.todayText), 'Today names the ruling; nothing reads as not yet docketed');
  ok(/demob programme still to come/.test(r.fencingText) && /\$26,522\.40/.test(r.fencingText) && /\$10,350\.00/.test(r.fencingText), 'Fencing tab money card: the demob programme is what remains');
  for (const x of TAKES) {
   const t = r.turns.find(y => y.slot === x.slot), f = r.takeFetch.find(y => y[0] === x.slot)[1];
   ok(t && t.text === LINES[x.slot].text && t.sha === x.sha256 && t.media, 'turn ' + x.slot + ' carries its v11.81 line and take ' + x.sha256.slice(0, 12));
   ok(f && f.status === 200 && /audio\/mpeg/.test(f.type || '') && f.bytes === x.bytes, 'turn ' + x.slot + ' take is served ' + JSON.stringify(f));
  }
 }
 console.log('\n' + pass + ' passed, ' + fail + ' failed');
 process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
