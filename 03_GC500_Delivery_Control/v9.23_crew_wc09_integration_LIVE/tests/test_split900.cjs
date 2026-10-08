// Author: Andrew Fisher. v9.00 part C (publishes in v9.05) - the WC09 count. Opens the base page and the built page, one after the
// other, at the live address, reading the live record (every write is aborted by the harness; nothing here sends anything), and
// checks:
//   1. the record is as the release found it: WC09 on site and ticked complete, both recorded Thu 8 Oct (AEST);
//   2. on Thu 8 Oct (page clock) WC09's Today work row reads 2 of 12, not complete, with the reason once on its own sub-line
//      ("2 of 12 · 4 FWF, 6 Pee Panel due Fri 9 Oct (Event Portables Load 1)."), and the base read 12 of 12, recorded complete;
//      the group card's item types and the type breakdown agree with it (FWF 0 of 4, Pee Panel 0 of 6, 6 m blocks 2 of 2);
//   3. the whole Today work model, every group, is the base's on 8 Oct apart from WC09: every other reference's row (work rows
//      and type rows), every other group, the summaries and Where we are, with the Toilets figures moved by WC09's ten only;
//   4. with the page clock on Fri 9 Oct and the record unchanged, WC09 still reads 2 of 12, its FWF and pee panels due;
//   5. with a simulated record (in the page only, put back straight after, never sent) where WC09 was set on site on Fri 9 Oct,
//      or ticked complete again that day, it reads 12 of 12; set in transit that day, it stays 2 of 12; the record is unchanged after;
//   6. Today, as drawn: the Toilets breakdown shows WC09 with 10 not confirmed complete and the reason once, no "Requiring
//      review", and 2 confirmed complete; the base showed 12;
//   7. money identical: moneySummary(), cj764Model(), fh866Model() and pl770Model() read the same, as JSON, on both pages;
//   8. both pages read the same record version, no page or console errors, no writes attempted.
//   PAGE=<build> [BASE=<base page; default base_live.html beside PAGE>] [MOB=1] [OUT=<dir for screenshots>]
//   node v9.00_crew_vms_counts_DRAFT/tests/test_split900.cjs
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
const PAGE = process.env.PAGE, BASE = process.env.BASE || path.join(path.dirname(PAGE), 'base_live.html'), MOB = !!process.env.MOB;
const W = MOB ? 390 : Number(process.env.W || 1440), H = MOB ? 844 : Number(process.env.H || 900);
const THU = '2026-10-08T06:00:00Z', FRI = '2026-10-08T23:00:00Z';     // Thu 8 Oct 16:00 AEST, Fri 9 Oct 09:00 AEST
const REASON = '2 of 12 · 4 FWF, 6 Pee Panel due Fri 9 Oct (Event Portables Load 1).';

/* in the page: the Today work models for a day, under a page clock, in one synchronous run (no timer, poll or save can run in it) */
function inPage({THU, FRI}) {
  const realNow = Date.now, out = {};
  const clock = iso => { Date.now = () => Date.parse(iso); TODAY_ISO.v = ''; };
  const plain = v => JSON.parse(JSON.stringify(v, (k, x) => x instanceof Map ? Object.fromEntries(x) : x instanceof Set ? [...x] : x));
  const build = day => holdAssets(() => {
    const areas = todayWorkMetrics840(day), groups = todayGroupDetails841(day, areas);
    const summary = todayWorkSummary848(day, areas, groups, todayFencingSummary848(day));
    const types = todayTypeMetrics843(day, groups, summary), where = progress881Model(day, summary);
    return plain({areas, groups, summary, types, where});
  });
  const pick = m => {
    const t = (m.areas.find(a => a.id === 'toilets') || {rows: []});
    const row = t.rows.find(r => r.key === 'WC09') || null;
    const types = (m.types.byCard.toilets || []).filter(i => (i.keys || []).includes('WC09'))
      .map(i => ({name: i.name, row: (i.rows || []).find(r => r.key === 'WC09') || null}));
    const g = ((m.groups.toilets || {}).groups || []).flatMap(x => x.types || []).filter(x => (x.keys || []).includes('WC09'))
      .map(x => ({name: x.name, knownComplete: x.knownComplete, knownQuantity: x.knownQuantity, complete: x.complete}));
    return {row, types, groupTypes: g, toilets: {total: t.total, done: t.done, completeRefs: t.completeRefs}};
  };
  const key = 'WC09';
  try {
    const d = deliveryOf(key);
    out.record = {state: d.state, recorded: d.recorded, done: d.done, set_day: d.set_at ? isoIn(d.set_at) : null, done_day: d.done_at ? isoIn(d.done_at) : null, where: d.where};
    out.version = (() => { try { return SYNC.backend.readVersion821(); } catch (e) { return null; } })();
    out.realDay = todayIso();
    clock(THU); out.thuDay = todayIso(); out.thu = build('2026-10-08'); out.thuPick = pick(out.thu);
    clock(FRI); out.friDay = todayIso(); out.friPick = pick(build(todayIso()));
    /* simulated records: WC09's local document copied, changed, read and put back in the same run; nothing is stamped or saved */
    S.delivery = S.delivery || {};
    const had = Object.prototype.hasOwnProperty.call(S.delivery, key), orig = S.delivery[key];
    const before = JSON.stringify(orig === undefined ? null : orig), committed = JSON.stringify(((CROW.get(key) || {}).delivery) || null);
    const sim = patch => { S.delivery[key] = Object.assign(JSON.parse(orig === undefined ? committed : before) || {}, patch);
      try { return pick(build(todayIso())); } finally { if (had) S.delivery[key] = orig; else delete S.delivery[key]; } };
    out.simOnSite = sim({state: 'on site', set_at: '2026-10-08T23:30:00.000Z'});
    out.simTicked = sim({done: true, done_at: '2026-10-08T23:31:00.000Z'});
    out.simTransit = sim({state: 'in transit', set_at: '2026-10-08T23:30:00.000Z'});
    out.recordAfter = JSON.stringify(S.delivery[key] === undefined ? null : S.delivery[key]) === before && had === Object.prototype.hasOwnProperty.call(S.delivery, key);
    /* Today as drawn on Fri 9 Oct (page clock): redraw, open the Toilets breakdown, read WC09, close, and put the clock back */
    try { renderToday(); const b = document.querySelector('[data-tw840-detail=toilets][data-tw840-mode=left]');
      if (b) { b.click(); const dl = document.querySelector('dialog[open]'), art = dl && dl.querySelector('[data-tw844-reference="WC09"]');
        out.friDom = {day: dl && (dl.querySelector('[data-tw844-selected-day]') || {dataset: {}}).dataset.tw844SelectedDay || null,
          value: art ? (art.querySelector('[data-tw844-quantity]') || {}).textContent : null,
          status: art ? (art.querySelector('.tw844-breakdown-status') || {}).textContent : null};
        if (dl) dl.close(); } else out.friDom = {missing: true}; } catch (e) { out.friDom = {error: String(e && e.message || e)}; }
  } finally { Date.now = realNow; TODAY_ISO.v = ''; try { renderToday(); } catch (e) {} }
  return out;
}

async function read(pageFile, tag) {
  const s = await open({pageFile, W, H, mobile: MOB, dpr: MOB ? 2 : 1}); const p = s.page, cons = [];
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) cons.push(m.text().slice(0, 200)); });
  try {
    await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof todayWorkMetrics840 === 'function'
      && todayWorkHealth840().ready && todayGroupHealth841().ready, null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const M = await p.evaluate(inPage, {THU, FRI});
    /* Today as drawn on the real day: the Toilets breakdown, not-confirmed and confirmed views */
    await p.evaluate(() => go('today')); await p.waitForTimeout(1200);
    const dom = {};
    for (const mode of ['left', 'done']) {
      const sel = '[data-tw840-detail=toilets][data-tw840-mode=' + mode + ']';
      await p.waitForSelector(sel, {state: 'attached', timeout: 60000});
      await p.evaluate(s => document.querySelector(s).click(), sel);
      await p.waitForSelector('dialog[open] #tw840-dialog-title', {timeout: 30000}); await p.waitForTimeout(400);
      dom[mode] = await p.evaluate(() => { const dl = document.querySelector('dialog[open]'), art = dl.querySelector('[data-tw844-reference="WC09"]');
        return {title: (dl.querySelector('#tw840-dialog-title') || {}).textContent || '', present: !!art,
          value: art ? (art.querySelector('[data-tw844-quantity]') || {}).textContent : null,
          status: art ? (art.querySelector('.tw844-breakdown-status') || {}).textContent : null,
          review: art ? !!art.querySelector('.tw842-review-label') : null}; });
      if (process.env.OUT && mode === 'left') { fs.mkdirSync(process.env.OUT, {recursive: true});
        await p.evaluate(() => { const a = document.querySelector('dialog[open] [data-tw844-reference="WC09"]'); if (a) a.scrollIntoView({block: 'center'}); });
        await p.waitForTimeout(300); await p.screenshot({path: path.join(process.env.OUT, 'split900-' + tag + '-' + (MOB ? 'phone' : W) + '.png')}); }
      await p.evaluate(() => { const dl = document.querySelector('dialog[open]'); if (dl) dl.close(); }); await p.waitForTimeout(300);
    }
    /* money: the four models, as JSON, with their time stamps left out */
    await p.evaluate(() => go('costs'));
    await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0; } catch (e) { return false; } }, null, {timeout: 60000}); await p.waitForTimeout(800);
    const money = await p.evaluate(() => holdAssets(() => { const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (k === 'asAt' || k === 'at' || k === 'now' || k === 'generated') ? undefined : v));
      return JSON.stringify({M: strip(moneySummary()), X: strip(cj764Model()), H: strip(fh866Model()), P: strip(pl770Model())}); }));
    const footer = await p.evaluate(() => (document.getElementById('footL') || {}).textContent || ''), has = await p.evaluate(() => typeof split900 === 'function');
    return {M, dom, money, footer, has, errors: s.errors.slice(), cons, blocked: s.counts.blocked};
  } finally { await s.browser.close(); }
}

const J = v => JSON.stringify(v === undefined ? null : v);
const byKey = rows => new Map((rows || []).map(r => [r.key == null ? 'label:' + (r.label || r.name) : r.key, r]));
const without = (o, keys) => { const c = Object.assign({}, o); keys.forEach(k => delete c[k]); return c; };

(async () => {
  let a = await read(BASE, 'base'), b = await read(PAGE, 'candidate'), tries = 0;
  /* the live record can move between the two reads; read again (twice at most) until both pages hold the same version */
  while ((a.M.version == null || a.M.version !== b.M.version) && tries++ < 2) { a = await read(BASE, 'base'); if (a.M.version !== b.M.version) b = await read(PAGE, 'candidate'); }
  const R = [], ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  ok('both pages read the same shared record (version ' + a.M.version + ')', a.M.version != null && a.M.version === b.M.version, {base: a.M.version, cand: b.M.version});
  ok('the candidate carries split900 and the base does not; the footer is the base\'s, untouched', b.has && !a.has && a.footer === b.footer, {base: a.footer.slice(-12), cand: b.footer.slice(-12)});

  /* 1. the record as the release found it */
  const rec = b.M.record;
  ok('the record: WC09 on site and ticked complete, both recorded Thu 8 Oct (AEST)', rec.state === 'on site' && rec.recorded && rec.done && rec.set_day === '2026-10-08' && rec.done_day === '2026-10-08', rec);

  /* 2. Thu 8 Oct: WC09 2 of 12, not complete, with the reason once; the base read 12 of 12 */
  const w8 = b.M.thuPick.row, w8b = a.M.thuPick.row;
  ok('page clock on Thu 8 Oct for both reads', a.M.thuDay === '2026-10-08' && b.M.thuDay === '2026-10-08', {base: a.M.thuDay, cand: b.M.thuDay});
  ok('base, 8 Oct: WC09 read 12 of 12, complete, "Recorded complete" (the fault)', w8b && w8b.quantity === 12 && w8b.done === 12 && w8b.complete === true && w8b.status === 'Recorded complete', w8b);
  ok('8 Oct: WC09 reads 2 of 12, 10 left, not complete, and is not flagged as a review', w8 && w8.quantity === 12 && w8.done === 2 && w8.remaining === 10 && w8.complete === false && w8.recordedComplete === false, w8);
  ok('8 Oct: the status says what the record covers ("Recorded complete for the rows due by Thu 8 Oct")', w8 && w8.status === 'Recorded complete for the rows due by Thu 8 Oct', w8 && w8.status);
  ok('8 Oct: the reason is on WC09\'s own sub-line, once: "' + REASON + '"', w8 && w8.detail.startsWith(REASON) && w8.detail.split('Event Portables Load 1').length === 2
    && w8.detail.slice(REASON.length) === ' ' + w8b.detail, w8 && w8.detail);
  ok('8 Oct: the row names the rows due (T0101 4 FWF, T0259 6 Pee Panel, Fri 9 Oct, Load 1)', w8 && w8.split900 && J(w8.split900.due.map(x => [x.task, x.item, x.quantity, x.date, x.load]))
    === J([['T0101', 'FWF', 4, '2026-10-09', 'Event Portables Load 1'], ['T0259', 'Pee Panel', 6, '2026-10-09', 'Event Portables Load 1']]) && w8.split900.by === '2026-10-08', w8 && w8.split900);
  const gt = Object.fromEntries(b.M.thuPick.types.map(t => [t.name, t.row])), gtb = Object.fromEntries(a.M.thuPick.types.map(t => [t.name, t.row]));
  ok('8 Oct, type breakdown: WC09 FWF 0 of 4 and Pee Panel 0 of 6, due Fri 9 Oct; 6 m blocks 2 of 2 confirmed complete (base: all complete)',
    gt.FWF && gt.FWF.done === 0 && gt.FWF.quantity === 4 && gt.FWF.complete === false && gt.FWF.status === '4 FWF due Fri 9 Oct (Event Portables Load 1)'
    && gt['Pee Panel'] && gt['Pee Panel'].done === 0 && gt['Pee Panel'].quantity === 6 && gt['Pee Panel'].status === '6 Pee Panel due Fri 9 Oct (Event Portables Load 1)'
    && gt['Toilet Block 6m'] && gt['Toilet Block 6m'].done === 2 && gt['Toilet Block 6m'].complete === true && gt['Toilet Block 6m'].status === 'Confirmed complete'
    && Object.values(gtb).every(r => r && r.complete === true), {cand: gt, base: Object.fromEntries(Object.entries(gtb).map(([k, r]) => [k, r && r.done]))});
  const gg = Object.fromEntries(b.M.thuPick.groupTypes.map(t => [t.name, t])), ggb = Object.fromEntries(a.M.thuPick.groupTypes.map(t => [t.name, t]));
  ok('8 Oct, group card item types: FWF and Pee Panel complete fall by 4 and 6, the 6 m blocks unchanged',
    gg.FWF && ggb.FWF.knownComplete - gg.FWF.knownComplete === 4 && ggb['Pee Panel'].knownComplete - gg['Pee Panel'].knownComplete === 6
    && ggb['Toilet Block 6m'].knownComplete === gg['Toilet Block 6m'].knownComplete, {cand: gg, base: ggb});

  /* 3. the whole Today work model on 8 Oct: identical apart from WC09 */
  const A = a.M.thu, B = b.M.thu, diffs = [];
  if (J(A.areas.map(x => x.id)) !== J(B.areas.map(x => x.id))) diffs.push('area list');
  for (const x of A.areas) { const y = B.areas.find(z => z.id === x.id); if (!y) { diffs.push('area ' + x.id + ' missing'); continue; }
    const ka = byKey(x.rows), kb = byKey(y.rows);
    if (J([...ka.keys()]) !== J([...kb.keys()])) diffs.push(x.id + ': row keys');
    for (const [k, r] of ka) if (k !== 'WC09' && J(r) !== J(kb.get(k))) diffs.push(x.id + ': row ' + k);
    if (x.id !== 'toilets') { if (J(x) !== J(y)) diffs.push('area ' + x.id); continue; }
    const agg = ['rows', 'done', 'remaining', 'pct', 'unitsComplete', 'left', 'completeRefs'];
    if (J(without(x, agg)) !== J(without(y, agg))) diffs.push('toilets: aggregates other than the count');
    if (x.done - y.done !== 10 || x.completeRefs - y.completeRefs !== 1) diffs.push('toilets: done ' + x.done + '->' + y.done + ', complete refs ' + x.completeRefs + '->' + y.completeRefs);
    if (x.remaining == null ? y.remaining != null : y.remaining - x.remaining !== 10) diffs.push('toilets: remaining');
  }
  ok('8 Oct, work rows: every reference other than WC09, in every group, reads as the base; every other group is the base\'s; Toilets done moves by 10 and complete references by 1', !diffs.length, diffs.slice(0, 12));
  const tdiff = [];
  const insts = m => new Map((m.types.instruments || []).map(i => [i.id, i]));
  const ia = insts(A), ib = insts(B);
  if (J([...ia.keys()]) !== J([...ib.keys()])) tdiff.push('instrument list');
  for (const [id, x] of ia) { const y = ib.get(id); if (!y) continue;
    const ra = byKey(x.rows), rb = byKey(y.rows);
    for (const [k, r] of ra) if (k !== 'WC09' && J(r) !== J(rb.get(k))) tdiff.push(x.name + ': row ' + k);
    if (!(x.keys || []).includes('WC09') && J(x) !== J(y)) tdiff.push('type ' + x.cardId + '/' + x.name);
  }
  if (J(A.types.coverage) !== J(B.types.coverage)) tdiff.push('type coverage');
  ok('8 Oct, type breakdown: every row other than WC09\'s reads as the base; every type without WC09 is the base\'s; coverage and reconciliation unchanged', !tdiff.length, tdiff.slice(0, 12));
  const gdiff = [];
  for (const id of Object.keys(A.groups)) { if (id === 'toilets') continue; if (J(A.groups[id]) !== J(B.groups[id])) gdiff.push('card ' + id); }
  const tg = c => J(Object.assign({}, c, {groups: (c.groups || []).map(g => Object.assign({}, g, {types: (g.types || []).map(t => (t.keys || []).includes('WC09') && ['FWF', 'Pee Panel'].includes(t.name)
    ? without(t, ['knownComplete', 'complete', 'remaining']) : t)}))}));
  if (tg(A.groups.toilets) !== tg(B.groups.toilets)) gdiff.push('toilets card beyond the FWF and Pee Panel complete figures');
  ok('8 Oct, group cards: every card is the base\'s; Toilets differs only in the FWF and Pee Panel complete figures', !gdiff.length, gdiff);
  const sdiff = [];
  for (const id of Object.keys(A.summary.byId || {})) { const x = A.summary.byId[id], y = B.summary.byId[id];
    if (id !== 'toilets') { if (J(x) !== J(y)) sdiff.push('summary ' + id); continue; }
    if (x.done - y.done !== 10 || J(x.reviewRefs) !== J(y.reviewRefs) || x.total !== y.total || x.pctKind !== y.pctKind) sdiff.push('summary toilets ' + J({done: [x.done, y.done], review: [x.reviewRefs, y.reviewRefs], kind: [x.pctKind, y.pctKind]}));
    if ((y.reviewRefs || []).includes('WC09')) sdiff.push('WC09 is listed for review');
  }
  for (const r of A.where.rows || []) { const y = (B.where.rows || []).find(z => z.id === r.id); if (r.id !== 'toilets' && J(r) !== J(y)) sdiff.push('Where we are ' + r.id); }
  ok('8 Oct, summaries and Where we are: every group the base\'s; Toilets done 10 lower, its review list and percentage kind unchanged', !sdiff.length, sdiff);

  /* 4. Fri 9 Oct, record unchanged */
  const w9 = b.M.friPick.row;
  ok('page clock on Fri 9 Oct, record unchanged: WC09 still reads 2 of 12, its FWF and pee panels due', b.M.friDay === '2026-10-09' && w9 && w9.done === 2 && w9.quantity === 12 && w9.complete === false
    && w9.detail.startsWith(REASON), {day: b.M.friDay, row: w9 && {done: w9.done, quantity: w9.quantity, status: w9.status, detail: w9.detail}});

  /* 5. simulated records (in the page only) */
  const so = b.M.simOnSite.row, st = b.M.simTicked.row, sx = b.M.simTransit.row;
  ok('simulated: WC09 set on site on Fri 9 Oct -> 12 of 12, recorded complete, no reason', so && so.done === 12 && so.complete === true && so.status === 'Recorded complete' && !so.split900 && so.detail === w8b.detail, so);
  ok('simulated: WC09 ticked complete again on Fri 9 Oct -> 12 of 12', st && st.done === 12 && st.complete === true && !st.split900, st);
  ok('simulated: WC09 set in transit on Fri 9 Oct -> still 2 of 12 (only on site or complete counts)', sx && sx.done === 2 && sx.complete === false, sx && {done: sx.done, status: sx.status});
  ok('simulated: the type breakdown and group card follow (WC09\'s FWF, Pee Panel and 6 m blocks all complete; the item types read as the base did with all twelve)',
    b.M.simOnSite.types.length === 3 && b.M.simOnSite.types.every(t => t.row && t.row.complete === true)
    && J(b.M.simOnSite.groupTypes) === J(a.M.thuPick.groupTypes), {sim: b.M.simOnSite.groupTypes, base: a.M.thuPick.groupTypes});
  ok('simulated records were read in the page only and put back: WC09\'s record is as read', b.M.recordAfter === true && a.M.recordAfter === true, {base: a.M.recordAfter, cand: b.M.recordAfter});
  const fd = b.M.friDom || {};
  ok('Today as drawn on Fri 9 Oct (page clock): the Toilets breakdown shows WC09 with 10 not confirmed complete and the reason', fd.day === '2026-10-09' && String(fd.value).trim() === '10' && String(fd.status || '').includes(REASON), fd);

  /* 6. Today as drawn on the real day */
  const dl = b.dom.left, dd = b.dom.done, bd = a.dom.done;
  ok('Today, Toilets "not confirmed complete": WC09 shows 10, the reason once, and no "Requiring review"', dl.present && String(dl.value).trim() === '10' && !dl.review
    && String(dl.status).split('Event Portables Load 1').length === 2 && String(dl.status).includes(REASON), dl);
  ok('Today, Toilets "confirmed complete": WC09 shows 2 (the base showed 12)', dd.present && String(dd.value).trim() === '2' && bd.present && String(bd.value).trim() === '12', {cand: dd.value, base: bd.value});
  ok('Today, base: WC09 was not in the Toilets "not confirmed complete" list', a.dom.left.present === false, a.dom.left);

  /* 7. money */
  ok('money identical: moneySummary(), cj764Model(), fh866Model() and pl770Model(), as JSON (' + Math.round(a.money.length / 1024) + ' KB)', a.money === b.money && a.money.length > 1000, {same: a.money === b.money});

  /* 8. errors and writes */
  ok('no page errors and no console errors on either page', !a.errors.length && !b.errors.length && !a.cons.length && !b.cons.length, {base: [a.errors, a.cons], cand: [b.errors, b.cons]});
  ok('no writes attempted (counts.blocked 0 on both)', a.blocked === 0 && b.blocked === 0, {base: a.blocked, cand: b.blocked});

  R.forEach(r => console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).replace(/\$\s?[0-9][0-9,]*(\.[0-9]+)?/g, '$—').slice(0, 900)}`));
  /* for the record (no check): the Toilets reading and Where we are, base and candidate, on 8 Oct */
  const tw = m => { const t = m.summary.byId.toilets || {}, w = (m.where.rows || []).find(r => r.id === 'toilets') || {};
    return {done: t.done, total: t.total, pct: t.pct, kind: t.pctKind, where: m.where.pct ? [Math.round(m.where.pct.min * 100) / 100, Math.round(m.where.pct.max * 100) / 100] : null, whereToilets: w.min}; };
  console.log('info  8 Oct Toilets and Where we are, base ' + J(tw(A)) + ' -> candidate ' + J(tw(B)));
  const fails = R.filter(r => !r.pass).length;
  console.log(`${MOB ? 'phone' : 'laptop ' + W}: ${R.length - fails}/${R.length} (record ${b.M.version}, real day ${b.M.realDay})`);
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error('TEST FAIL', e); process.exit(2); });
