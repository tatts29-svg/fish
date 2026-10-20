// Author: Andrew Fisher. Independent money/record review of the v9.14 fire extinguisher draft. Read only.
// Base (live) vs candidate, every model compare_money895 reads plus the P&L ticks, Accruals labour and revenue, labourRevenue858,
// under scenarios simulated in the browser only (S is changed in one synchronous step and put back; view link, so nothing can send).
// No dollar figure is printed: moves are multiples of F (the card's Fire Ext. figure for AA) and counts.
//   BASE=<base page> CAND=<candidate page> node review_money914.cjs
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const BASE = process.env.BASE, CAND = process.env.CAND;
const out = []; const say = s => { console.log(s); out.push(s); };
let fails = 0; const ok = (name, pass, detail) => { if (!pass) fails++; say((pass ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ' ' + JSON.stringify(detail).slice(0, 1800) : '')); };

const INSTALL = () => {
  const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (k === 'asAt' || k === 'at' || k === 'now' || k === 'generated') ? undefined : v));
  window.__snap = () => { RENDER_MEMO.clear(); return holdAssets(() => {
    const M = moneySummary(), X = cj764Model(), H = fh866Model(), P = pl770Model(), B = pl752Rows(), V = transport888View(), R = recon888Model(), RH = typeof rh766Model === 'function' ? rh766Model() : null, LP = labourPlan();
    const TK = pl760Ticks(), AL = acc761Labour(), LR = labourRevenue858();
    const A = ['2026-09', '2026-10', '2026-11'].map(m => { const x = acc761Model(m); return {revenueTotal: x.revenueTotal, forecastRevenueTotal: x.forecastRevenueTotal, costCandidateTotal: x.costCandidateTotal, forecastCostTotal: x.forecastCostTotal,
      unallocated: (x.unallocatedRevenue || []).length, unallocatedAmt: (x.unallocatedRevenue || []).reduce((s, r) => s + (r.amount || 0), 0), unallocatedUnpriced: (x.unallocatedRevenue || []).reduce((s, r) => s + ((r.extra && r.extra.unpricedCount) || 0), 0),
      fire: x.revenue.filter(r => /^Fire extinguishers/.test(r.stream)).map(r => ({amount: r.amount, n: r.extra.sourceCount, unpriced: r.extra.unpricedCount}))}; });
    return JSON.stringify({M: strip(M), X: strip(X), H: strip(H), P: strip(P), B: strip(B), V: {tot: V.tot, byBranch: V.byBranch, byCarrier: V.byCarrier, revenueTotal: V.revenueTotal, provisionalTotal: V.provisionalTotal, lines: V.lines.length},
      R: R.ties.map(t => ({what: t.what, ok: t.ok, parts: t.parts})), RH: strip(RH), LP: {all: LP.all, fireSlots: LP.slots.filter(s => s.key === 'fire_ext').length, fire914Slots: LP.slots.filter(s => s.fire914).length},
      TK, AL: strip(AL), LR: {sums: LR.sums, priced: LR.priced, recorded: LR.recorded, job: LR.job, remaining: LR.remaining, missing: LR.missing.length}, A});
  }); };
  const row = (n, at) => ({type: 'Fire extinguisher', qty: n, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, asset_no_state: 'not numbered - counted by quantity', origin: 'added in this page', source_task: null, _added: true, added_at: at || '2026-10-08T06:30:00.000Z', added_by: 'Practice Recorder'});
  window.__fireKeys = () => { const keys = []; holdAssets(() => allAssets().filter(a => !a._cancelled && !a.rest_of && !movedAway(a.key)).forEach(a => chargeLines(a).forEach(l => { const us = labourUnits(a, l.item);
    (us.length ? us : [undefined]).forEach(u => { const info = labourLinesFor(a.key, l.discipline, l.item, a.key, u, a); if (info.lines.some(L => L.key === 'fire_ext')) keys.push(labourKey(a.key, l.discipline, l.item, 'fire_ext', u)); }); }))); return [...new Set(keys)]; };
  // spec: {fire: {KEY: qty | [qty, qty]}, fireAll: qty, ticks: true, extra: 'js expression run after mutation'}
  window.__with = (spec, what) => { const accBak = JSON.stringify(S.accessories || {}), labBak = JSON.stringify(S.labour || {});
    try { S.accessories = S.accessories || {}; S.labour = S.labour || {};
      if (spec.ticks) { const ks = window.__fireKeys(); ks.forEach(k => { S.labour[k] = true; }); }
      const put = (k, q) => { const qs = Array.isArray(q) ? q : [q]; S.accessories[k] = (S.accessories[k] || []).filter(x => x.type !== 'Fire extinguisher').concat(qs.map((n, i) => row(n, '2026-10-08T06:3' + i + ':00.000Z'))); };
      if (spec.fireAll != null) allAssets().forEach(a => put(a.key, spec.fireAll));
      Object.entries(spec.fire || {}).forEach(([k, q]) => put(k, q));
      RENDER_MEMO.clear();
      return what === 'snap' ? window.__snap() : what === 'per' ? window.__per() : what === 'both' ? JSON.stringify({snap: window.__snap(), per: window.__per()}) : null;
    } finally { S.accessories = JSON.parse(accBak); S.labour = JSON.parse(labBak); RENDER_MEMO.clear(); } };
  // every location: where its fire extinguishers land in the money, line by line
  window.__per = () => { RENDER_MEMO.clear(); return JSON.stringify(holdAssets(() => allAssets().map(a => {
    const live = !a._cancelled && !a.rest_of && !movedAway(a.key); const t = assetTotal(a), lines = t.lines || [];
    const fireEntries = lines.flatMap(l => ((l.labour && l.labour.ticked) || []).filter(x => x.key === 'fire_ext'));
    const unitFire = lines.reduce((s, l) => s + (((l.labour && l.labour.units) || []).reduce((s2, u) => s2 + ((u.ticked || []).filter(x => x.key === 'fire_ext').length), 0)), 0);
    const F = typeof fire914Of === 'function' ? fire914Of(a) : null;
    return {key: a.key, kind: refKind(a), plant: typeof isPlantLine === 'function' && isPlantLine(a), live, cancelled: !!a._cancelled, rest_of: a.rest_of || null, added: !!a._added, nLines: lines.length,
      dupLines: lines.length - new Set(lines.map(l => l.discipline + '|' + l.item)).size,
      hosts: lines.filter(l => l.labour && l.labour.fire914).length, fire914Entries: fireEntries.filter(x => x.fire914).length, tickEntries: fireEntries.filter(x => !x.fire914).length, unitFire,
      n: F ? F.n : (typeof fire914Qty === 'function' ? fire914Qty(a.key) : 0), rate: F ? F.rate : null, hasF: !!F, host: !!(F && F.host), amount: F ? F.amount : null,
      lineAmt: lines.reduce((s, l) => s + ((l.labour && l.labour.fire914 && l.labour.fire914.amount) || 0), 0), unknownFlag: lines.some(l => l.labour && l.labour.fire914Unknown), total: t.total, labour: t.labour};
  }))); };
};

const run = async (pageFile, isCand) => {
  const s = await open({pageFile, W: 1440, H: 900}); const p = s.page; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 160)); });
  try {
    await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof transport888Core === 'function' && SYNC.first && SYNC.first.has('accessories') && SYNC.first.has('labour'), null, {timeout: 240000});
    await p.waitForTimeout(2500);
    await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0 && !!document.getElementById('recon888'); } catch (e) { return false; } }, null, {timeout: 90000}); await p.waitForTimeout(800);
    await p.evaluate(INSTALL);
    const meta = await p.evaluate(() => ({ver: (() => { try { return SYNC.backend.readVersion821(); } catch (e) { return null; } })(), day: todayIso(), cap: capability(), footer: ((document.getElementById('footL') || {}).textContent || '').slice(-8),
      fireRows: Object.values(S.accessories || {}).flat().filter(x => x && x.type === 'Fire extinguisher').length, fireTicks: Object.keys(S.labour || {}).filter(k => /\|fire_ext$/.test(k) && S.labour[k]).length, labourTicks: Object.keys(S.labour || {}).filter(k => S.labour[k]).length}));
    const R = {meta};
    R.S0 = await p.evaluate(() => window.__with({}, 'snap'));
    R.S1 = await p.evaluate(() => window.__with({ticks: true}, 'snap'));
    R.nFireKeys = await p.evaluate(() => window.__fireKeys().length);
    if (isCand) {
      R.F = await p.evaluate(() => { const l = chargeLines(assetOf('AA')).find(x => fire914CardLine(x, 'AA')); return l ? fire914CardLine(l, 'AA').rate : null; });
      R.aaTickValue = await p.evaluate(() => { const a = assetOf('AA'); return chargeLines(a).map(l => ({qty: qtyOf(l), units: labourUnits(a, l.item).length})); });
      R.S2 = await p.evaluate(() => window.__with({fire: {AA: 2}}, 'snap'));
      R.S3 = await p.evaluate(() => window.__with({fire: {AA: 2}, ticks: true}, 'snap'));
      R.S5 = await p.evaluate(() => window.__with({fire: {GN01: 2, WC09: 2}}, 'snap'));
      R.S6 = await p.evaluate(() => window.__with({fire: {AA: 0, GN01: 0}}, 'snap'));
      R.S7 = await p.evaluate(() => window.__with({fire: {AA: [2, 1]}}, 'snap'));
      R.S4 = await p.evaluate(() => window.__with({fireAll: 1, ticks: true}, 'both'));
      R.S4n = await p.evaluate(() => window.__with({fireAll: 1}, 'snap'));
      R.S4x3 = await p.evaluate(() => window.__with({fireAll: 3}, 'both'));
      R.after = await p.evaluate(() => ({fireRows: Object.values(S.accessories || {}).flat().filter(x => x && x.type === 'Fire extinguisher').length, fireTicks: Object.keys(S.labour || {}).filter(k => /\|fire_ext$/.test(k) && S.labour[k]).length}));
    }
    R.errors = s.errors; R.blocked = s.counts.blocked; R.cons = cons; return R;
  } finally { await s.browser.close(); }
};

const diff = (JA, JB, F) => { const diffs = [], structural = []; let same = 0;
  const walk = (x, y, path) => {
    if (typeof x === 'number' && typeof y === 'number') { if (Math.abs(x - y) < 1e-9) same++; else diffs.push({path, d: y - x, xF: F ? Math.round((y - x) / F * 10000) / 10000 : null, pct: x === 0 ? 'from nil' : y === 0 ? 'to nil' : (y > x ? 'up ' : 'down ') + (Math.abs((y - x) / x) * 100).toFixed(2) + '%'}); return; }
    if (Array.isArray(x) && Array.isArray(y)) { if (x.length !== y.length) structural.push(path + ' length ' + x.length + ' -> ' + y.length); for (let i = 0; i < Math.min(x.length, y.length); i++) walk(x[i], y[i], path + '[' + i + ']'); return; }
    if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { const sk = /^[A-Z][a-z]+ [A-Z][a-z]+/.test(k) ? '[name]' : k; if (!(k in x) || !(k in y)) { structural.push(path + '.' + sk + (k in x ? ' removed' : ' added')); continue; } walk(x[k], y[k], path + '.' + sk); } return; }
    if (typeof x === 'string' && typeof y === 'string') { if (x !== y) { const nx = (x.match(/-?\d[\d,]*(\.\d+)?/g) || []).join(), ny = (y.match(/-?\d[\d,]*(\.\d+)?/g) || []).join(); if (nx !== ny) diffs.push({path, text: true}); } return; }
    if (x !== y) structural.push(path + ' changed (' + (x === null ? 'null' : typeof x) + ' -> ' + (y === null ? 'null' : typeof y) + ')');
  };
  walk(JSON.parse(JA), JSON.parse(JB), ''); return {diffs, structural, same}; };
const isCount = p => /(tick|unpriced|unknown|Count|\.n(\.|$|\[)|\.n$|lines|missing|Slots|unallocated$|unallocatedUnpriced|refs|blocked)/i.test(p);
const show = (title, D) => { say(`-- ${title}: ${D.same} numbers the same, ${D.diffs.length} differ, ${D.structural.length} structural`);
  D.diffs.forEach(d => say('   ' + d.path + '  ' + (d.text ? 'a text carrying figures differs' : isCount(d.path) && Number.isInteger(d.d) && Math.abs(d.d) < 1000 ? 'count ' + (d.d > 0 ? '+' : '') + d.d : (d.xF != null ? (d.xF > 0 ? '+' : '') + d.xF + ' x F' : '') + ' (' + d.pct + ')')));
  D.structural.forEach(s => say('   structural: ' + s)); };

(async () => {
  const A = await run(BASE, false), B = await run(CAND, true);
  say(`base ${A.meta.footer} record ${A.meta.ver} (${A.meta.day}) cap ${A.meta.cap} | candidate ${B.meta.footer} record ${B.meta.ver} (${B.meta.day}) cap ${B.meta.cap}`);
  say(`record: ${B.meta.fireRows} fire extinguisher rows, ${B.meta.fireTicks} fire_ext ticks, ${B.meta.labourTicks} labour ticks of any kind; ${B.nFireKeys} fire_ext tick keys the card offers (every building / unit)`);
  ok('both pages read the same record version and day', A.meta.ver != null && A.meta.ver === B.meta.ver && A.meta.day === B.meta.day, {a: A.meta.ver, b: B.meta.ver});
  ok('both pages are on the view link (nothing can send)', A.meta.cap !== 'edit' && B.meta.cap !== 'edit', [A.meta.cap, B.meta.cap]);
  const F = B.F; ok("AA has a card Fire Ext. figure (F) to measure against", typeof F === 'number' && F > 0);
  // 1. nothing recorded: base and candidate identical
  let D = diff(A.S0, B.S0, F); show('base vs candidate, the record as it is', D);
  ok('base vs candidate with the record as it is: every money figure identical (compare_money895 semantics)', D.diffs.length === 0 && D.structural.length === 0);
  D = diff(A.S1, B.S1, F); show('base vs candidate, a fire_ext tick on every building/unit the card offers it (no quantities added)', D);
  ok('existing per-building ticks count exactly as before: base and candidate identical with every fire_ext tick set', D.diffs.length === 0 && D.structural.length === 0);
  const d01 = diff(B.S0, B.S1, F); say(`   (the ticks themselves move ${d01.diffs.length} figures on both pages alike - the rule the candidate keeps)`);
  // 2. a record of 2 on AA
  D = diff(A.S0, B.S2, F); show('base (record as it is) vs candidate with 2 fire extinguishers on AA', D);
  const money2 = D.diffs.filter(d => !d.text && !(isCount(d.path) && Number.isInteger(d.d) && Math.abs(d.d) < 1000));
  const allowed = [2, -1, 1]; const odd = money2.filter(d => !allowed.some(r => Math.abs(d.xF - r) < 1e-6) && !/breakeven|pct|percent|ratio|share|margin_pct|gm_pct|recovery/i.test(d.path));
  const wholeDollar = odd.filter(d => allowed.some(r => Math.abs(d.d - r * F) <= 1.0001));
  ok('AA x2: every money figure that moved moved by +2F (charged), -1F (AA\'s one forecast piece) or +1F (charged + forecast together); whole-dollar copies within a dollar', odd.length === wholeDollar.length, {odd: odd.filter(d => !wholeDollar.includes(d)).map(d => d.path + ' ' + d.xF)});
  const must2 = ['.M.charge.labour', '.M.charge.total', '.TK.fire_ext.amount', '.TK.total', '.AL.groups.fire_ext.charged'];
  ok('AA x2: the fire_ext group and the totals carrying it move by exactly +2F', must2.every(k => money2.some(d => d.path === k && Math.abs(d.xF - 2) < 1e-6)), must2.map(k => k + ':' + ((money2.find(d => d.path === k) || {}).xF)));
  ok('AA x2: no hire, rehire, transport, cost or tie-out figure moves', !money2.some(d => /^\.(B|RH|V|R)\b|^\.X\.(cost|transport)|^\.M\.cost|^\.LR\.(sums|priced|recorded)/.test(d.path)), money2.filter(d => /^\.(B|RH|V|R)\b|^\.X\.(cost|transport)|^\.M\.cost|^\.LR\./.test(d.path)).map(d => d.path));
  // 3. replace rule: ticks + quantity never double count
  D = diff(B.S1, B.S3, F); show('candidate: every fire_ext tick set, then 2 fire extinguishers added on AA', D);
  const tickPieces = (B.aaTickValue || []).reduce((s, l) => s + (l.units ? l.units : (l.qty || 0)), 0);
  const m3 = D.diffs.filter(d => !d.text && !(isCount(d.path) && Number.isInteger(d.d) && Math.abs(d.d) < 1000));
  ok(`replace rule: with AA's tick already counted (${tickPieces} piece(s) at F), adding 2 moves the charged totals by exactly ${2 - tickPieces} x F, never +2F on top`, ['.M.charge.labour', '.TK.fire_ext.amount'].every(k => { const d = m3.find(x => x.path === k); return (2 - tickPieces === 0) ? !d : d && Math.abs(d.xF - (2 - tickPieces)) < 1e-6; }), m3.filter(d => /charge\.labour|fire_ext\.amount/.test(d.path)).map(d => d.path + ' ' + d.xF));
  D = diff(B.S4n, JSON.parse(B.S4).snap, F); show('candidate: 1 fire extinguisher on EVERY location; with vs without every fire_ext tick also set', D);
  ok('replace rule everywhere: with a quantity on every location, setting every fire_ext tick changes no figure at all', D.diffs.length === 0 && D.structural.length === 0);
  // 4. every location, line by line
  const per = JSON.parse(JSON.parse(B.S4).per), per3 = JSON.parse(JSON.parse(B.S4x3).per);
  const live = per.filter(x => x.live), dead = per.filter(x => !x.live);
  const multiHost = live.filter(x => x.hosts > 1), tickLeft = live.filter(x => x.tickEntries || x.unitFire), entryMismatch = live.filter(x => x.fire914Entries !== x.hosts);
  const noHost = live.filter(x => x.n > 0 && !x.host), amtMismatch = live.filter(x => x.host && x.rate != null && Math.abs(x.lineAmt - x.amount) > 0.001);
  const dup = live.filter(x => x.dupLines > 0);
  say(`   locations: ${per.length} in the list, ${live.length} live, ${dead.length} cancelled / follow-up / moved; ${live.filter(x => x.host && x.rate != null).length} priced at the card, ${live.filter(x => x.host && x.rate == null).length} rate to confirm, ${noHost.length} with NO charge line to carry them`);
  say(`   live locations whose charge lines repeat a discipline+item: ${dup.length} ${JSON.stringify(dup.map(x => x.key + '(' + x.dupLines + ')'))}; added in this page: ${live.filter(x => x.added).length}`);
  ok('every live location carries its fire extinguishers on exactly one charge line (no line counts them twice)', multiHost.length === 0 && entryMismatch.length === 0, {multiHost: multiHost.map(x => x.key), entryMismatch: entryMismatch.map(x => x.key)});
  ok('no fire_ext tick survives on a location with a quantity (reference-level and per-building unit lists)', tickLeft.length === 0, tickLeft.map(x => x.key));
  ok('each priced location charges exactly its pieces x its card figure', amtMismatch.length === 0, amtMismatch.map(x => x.key));
  ok('cancelled, follow-up and moved-away locations charge nothing', dead.every(x => !x.hasF && x.hosts === 0), dead.filter(x => x.hosts || x.hasF).map(x => x.key));
  const S4 = JSON.parse(JSON.parse(B.S4).snap), S0 = JSON.parse(B.S0), S43 = JSON.parse(JSON.parse(B.S4x3).snap);
  const sumKnown = live.filter(x => x.host && x.rate != null).reduce((s, x) => s + x.amount, 0), nUnk = live.filter(x => x.host && x.rate == null).length, nHost = live.filter(x => x.host).length;
  const close = (a, b) => Math.abs(a - b) < 0.011;
  ok('P&L ticks: fire_ext amount = the sum of every priced location\'s pieces x card figure; one tick per location; unknown = the rate-to-confirm locations', close(S4.TK.fire_ext.amount - S0.TK.fire_ext.amount, sumKnown) && S4.TK.fire_ext.ticks - S0.TK.fire_ext.ticks === nHost && S4.TK.fire_ext.unknown - S0.TK.fire_ext.unknown === nUnk,
    {amountOk: close(S4.TK.fire_ext.amount - S0.TK.fire_ext.amount, sumKnown), ticks: S4.TK.fire_ext.ticks - S0.TK.fire_ext.ticks, nHost, unknown: S4.TK.fire_ext.unknown - S0.TK.fire_ext.unknown, nUnk});
  ok('Costs labour and the labour plan\'s charged move by that same sum, once', close(S4.M.charge.labour - S0.M.charge.labour, sumKnown) && close(S4.LP.all.charged - S0.LP.all.charged, sumKnown) && close(S4.M.charge.total - S0.M.charge.total, sumKnown));
  ok('labour plan: no fire_ext forecast left anywhere, one charged slot per location', S4.LP.fireSlots === nHost && S4.LP.fire914Slots === nHost, {fireSlots: S4.LP.fireSlots, fire914Slots: S4.LP.fire914Slots, nHost});
  ok('Accruals labour: fire_ext charged = the P&L ticks; nothing expected, to come or later', close(S4.AL.groups.fire_ext.charged, S4.TK.fire_ext.amount) && S4.AL.groups.fire_ext.expected === 0 && S4.AL.groups.fire_ext.tocome === 0 && S4.AL.groups.fire_ext.later === 0 && S4.AL.groups.fire_ext.complete === false,
    {charged: close(S4.AL.groups.fire_ext.charged, S4.TK.fire_ext.amount), expected: S4.AL.groups.fire_ext.expected, tocome: S4.AL.groups.fire_ext.tocome, later: S4.AL.groups.fire_ext.later, complete: S4.AL.groups.fire_ext.complete});
  const accFire = S => S.A.reduce((s, m) => s + m.fire.reduce((t, r) => t + (r.amount || 0), 0), 0);
  const accUnalloc = S => S.A[0].unallocatedAmt; /* unallocated rows are listed whole in every month */
  ok('Accruals revenue (Sep-Nov): fire extinguisher streams + their unallocated rows carry the same sum once', close(accFire(S4) - accFire(S0) + (accUnalloc(S4) - accUnalloc(S0)), sumKnown), {dated: close(accFire(S4) - accFire(S0), sumKnown)});
  ok('labourRevenue858 (install recorded) does not move', JSON.stringify(S4.LR.sums) === JSON.stringify(S0.LR.sums) && close(S4.LR.recorded, S0.LR.recorded));
  const sumKnown3 = per3.filter(x => x.live && x.host && x.rate != null).reduce((s, x) => s + x.amount, 0);
  ok('three on every location charges exactly three times one on every location', close(sumKnown3, 3 * sumKnown) && close(S43.TK.fire_ext.amount - S0.TK.fire_ext.amount, 3 * sumKnown) && close(S43.M.charge.labour - S0.M.charge.labour, 3 * sumKnown));
  if (noHost.length) say('   NOTE locations whose fire extinguishers reach NO money line (no charge line): ' + JSON.stringify(noHost.map(x => x.key + ':' + x.kind + (x.plant ? ':plant line' : '')).slice(0, 60)) + (noHost.length > 60 ? ' ...' : ''));
  // 5. no card figure: money unknown, never nought
  D = diff(B.S0, B.S5, F); show('candidate: 2 on GN01 (generator) and 2 on WC09 (toilet), no card figure', D);
  const m5 = D.diffs.filter(d => !d.text && !(isCount(d.path) && Number.isInteger(d.d) && Math.abs(d.d) < 1000));
  ok('no card figure: no money figure moves (nothing is charged at nought or at a guess)', m5.length === 0, m5.map(d => d.path));
  const S5 = JSON.parse(B.S5);
  ok('no card figure: Costs labour_unknown +2, P&L fire_ext unknown +2, labour plan unpriced +2, Accruals fire group incomplete', S5.M.charge.labour_unknown - S0.M.charge.labour_unknown === 2 && S5.TK.fire_ext.unknown - S0.TK.fire_ext.unknown === 2 && S5.LP.all.unpriced - S0.LP.all.unpriced === 2 && S5.AL.groups.fire_ext.complete === false,
    {lu: S5.M.charge.labour_unknown - S0.M.charge.labour_unknown, tk: S5.TK.fire_ext.unknown - S0.TK.fire_ext.unknown, lp: S5.LP.all.unpriced - S0.LP.all.unpriced, al: S5.AL.groups.fire_ext.complete});
  // 6. removal and merge
  D = diff(B.S0, B.S6, F); ok('taken off (rows kept at quantity 0): every figure identical to nothing recorded', D.diffs.length === 0 && D.structural.length === 0, D.diffs.map(d => d.path).slice(0, 10));
  D = diff(B.S0, B.S7, F); const m7 = D.diffs.filter(d => /^\.(M\.charge\.labour|TK\.fire_ext\.amount)$/.test(d.path));
  ok('two rows on AA (2 and 1, as two devices could leave it) count as 3 pieces, on one line', m7.length === 2 && m7.every(d => Math.abs(d.xF - 3) < 1e-6), m7.map(d => d.path + ' ' + d.xF));
  ok('the simulations were put back: no fire row or fire tick left in the page\'s record', B.after.fireRows === B.meta.fireRows && B.after.fireTicks === B.meta.fireTicks, B.after);
  ok('no page errors; the harness blocked no write on either page', !A.errors.length && !B.errors.length && !A.blocked && !B.blocked, {errA: A.errors, errB: B.errors, blocked: [A.blocked, B.blocked]});
  say(`console errors: base ${A.cons.length}, candidate ${B.cons.length}`);
  say(`RESULT ${fails ? fails + ' FAILED' : 'ALL PASS'}`);
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error('REVIEW FAIL', e); process.exit(2); });
