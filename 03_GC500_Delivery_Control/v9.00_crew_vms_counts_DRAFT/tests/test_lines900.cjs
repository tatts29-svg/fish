// Author: Andrew Fisher. v9.09 part E - WC09: a line for each 6 m toilet block. Opens the base page and the built page, one after
// the other, at the live address, reading the live record (every write is aborted by the harness; nothing here sends anything),
// and checks:
//   1. WC09 on the built page: the two numbers 1268858 and 1311146 count as Toilet Block 6m (lineNumbersOf, itemNumbersOf, the
//      Change form's "counts as", the inventory type of each number); FWF and Pee Panel carry no Coates number; the labour units
//      are the two blocks, each offered Install, Steps, Levelling, Cleaning and Demob; FWF and Pee Panel one set for the reference;
//   2. the reference drawer's labour section for WC09 shows two blocks, each with its own Install, Steps and Levelling ticks, and no
//      per-number ticks under Pee Panel; the drop photo groups are one per number, as on the base;
//   3. Equipment's inventory counts WC09's two numbers as Toilet Block 6m, not Pee Panel (the base counted them as Pee Panel);
//   4. every other reference with more than one charge-line item reads the same split as the base: lineNumbersOf, itemNumbersOf,
//      labour units and lines per unit, inventory numbers per item and the type of each number;
//   5. a person's choice still wins: with WC09's "counts as" set in the page's memory (put back in the same run, never saved)
//      to Pee Panel for 1268858, that number is the pee panels' and 1311146 stays the blocks'; and with both set to FWF, both FWF;
//   6. nothing recorded is lost: every labour tick on the record for these references is still read, on the same unit, as on the base;
//   7. money identical: moneySummary, cj764Model, fh866Model, pl770Model, pl752Rows, the Transport view, the tie-outs, Rehire by
//      branch and the labour plan read the same, as JSON, on both pages;
//   8. Codex's StaffNames910 is in the page byte for byte as on the base, and reads the same day model on both (read-only);
//   9. both pages read the same record version, no page or console errors, no writes attempted (counts.blocked 0).
//   PAGE=<build> [BASE=<base page; default base_live.html beside PAGE>] [MOB=1] [OUT=<dir for a screenshot>]
//   node v9.00_crew_vms_counts_DRAFT/tests/test_lines900.cjs
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
const PAGE = process.env.PAGE, BASE = process.env.BASE || path.join(path.dirname(PAGE), 'base_live.html'), MOB = !!process.env.MOB, OUT = process.env.OUT;
const W = MOB ? 390 : 1440, H = MOB ? 844 : 900;
const KEY = 'WC09', N1 = '1268858', N2 = '1311146', TB = 'Toilet Block 6m', DISC = 'Toilets & amenities';

/* in the page, one synchronous run: the split of every multi-item reference, WC09's simulated choices, ticks, money, StaffNames910 */
function inPage({KEY, N1, N2, TB}) {
  const plain = v => JSON.parse(JSON.stringify(v === undefined ? null : v, (k, x) => x instanceof Map ? Object.fromEntries(x) : x instanceof Set ? [...x] : x));
  const out = {version: (() => { try { return SYNC.backend.readVersion821(); } catch (e) { return null; } })(), day: todayIso(),
    footer: ((document.getElementById('footL') || {}).textContent || '').slice(-8)};
  const split = a => { const k = a.key, L = chargeLines(a).filter(l => l.item);
    const units = {}, lines = {};
    L.forEach(l => { const us = labourUnits(a, l.item); units[l.item] = us;
      lines[l.item] = (us.length ? us : [null]).map(u => ({u, lines: labourLinesFor(k, l.discipline, l.item, k, u || undefined, a).lines.map(x => x.key)})); });
    return plain({lineNumbersOf: lineNumbersOf(a), itemNumbersOf: itemNumbersOf(a), units, lines,
      inv: L.map(l => [l.item, invItemNums(a, l.item)]), types: buildingNumbersOf(a).map(n => [n, invTypeOfNumber(a, n), numberItemOf(a, n)])}); };
  holdAssets(() => {
    const refs = allAssets().filter(a => chargeLines(a).filter(l => l.item).length > 1);
    out.refs = {}; refs.forEach(a => { out.refs[a.key] = split(a); });
    const a = allAssets().find(x => x.key === KEY);
    out.wc09 = {nums: buildingNumbersOf(a), photoUnits: dropPhotoUnits(a), photos: dropPhotosOf(KEY).map(x => x.unit || null),
      sel: [N1, N2].map(n => { const m = /<option value="([^"]*)" selected>/.exec(chNumItemSel(a, n, '')); return m ? m[1] : null; }),
      plan: (a.events || []).map(e => [e.task_id, e.item, !!(e.date_correction && e.date_correction.plan886)])};
    /* the inventory: WC09's numbered units by type */
    const inv = inventory(), rows = (Array.isArray(inv) ? inv : inv.list || inv.rows || []);
    out.inv = rows.filter(r => r.refs && r.refs[KEY]).map(r => ({type: r.type, coates: r.refs[KEY].coates, on: r.refs[KEY].on, asked: r.refs[KEY].asked, nonum: r.refs[KEY].nonum}));
    /* every labour tick on the record for these references, as the page reads it */
    out.ticks = Object.keys(S.labour || {}).filter(k => S.labour[k] && refs.some(r => k.startsWith(r.key + '|') || k.startsWith(r.key + '/u'))).sort().map(k => {
      const [head, disc, item, line] = k.split('|'), m = /^(.*?)(?:\/u(.+))?$/.exec(head), ref = m[1], unit = m[2] || undefined;
      const r = allAssets().find(x => x.key === ref), us = r ? labourUnits(r, item) : [];
      return {k, read: labourTicked(ref, disc, item, line, unit, r), offered: unit ? us.includes(unit) : true}; });
    out.wc09Ticks = Object.keys(S.labour || {}).filter(k => k.startsWith(KEY + '|') || k.startsWith(KEY + '/u'));
    out.wc09Choices = plain((localSupplied(KEY).items || []).map(i => ({asked: i.asked, nums: i.nums || null})));
  });
  /* a person's choice, simulated in the page's memory: S.supplied[WC09] copied, changed, read and put back in this run */
  S.supplied = S.supplied || {};
  const had = Object.prototype.hasOwnProperty.call(S.supplied, KEY), orig = S.supplied[KEY], before = JSON.stringify(orig === undefined ? null : orig);
  const sim = items => { const base = JSON.parse(before) || {}; const cur = (base.items || []).filter(i => !items.some(x => x.asked === i.asked));
    S.supplied[KEY] = Object.assign(base, {items: cur.concat(items.map(x => Object.assign({}, (base.items || []).find(i => i.asked === x.asked) || {}, x)))});
    try { return holdAssets(() => { const a = allAssets().find(x => x.key === KEY); return plain({lineNumbersOf: lineNumbersOf(a), tb: labourUnits(a, TB), pp: labourUnits(a, 'Pee Panel'), fwf: labourUnits(a, 'FWF')}); }); }
    finally { if (had) S.supplied[KEY] = orig; else delete S.supplied[KEY]; } };
  out.simPee = sim([{asked: 'Pee Panel', nums: [N1]}]);
  out.simFwf = sim([{asked: 'FWF', nums: [N1, N2]}]);
  out.recordAfter = JSON.stringify(S.supplied[KEY] === undefined ? null : S.supplied[KEY]) === before && had === Object.prototype.hasOwnProperty.call(S.supplied, KEY);
  /* demob runs for WC09 (reported, not asserted) */
  try { const d = demobOf816(KEY); out.demob = d ? plain({streams: d.streams, ownerUnk: d.ownerUnk}) : null; } catch (e) { out.demob = String(e && e.message || e); }
  /* StaffNames910, read-only */
  try { const S9 = window.StaffNames910; out.staff = {api: S9 ? Object.keys(S9).sort() : null, day: S9 ? JSON.stringify(plain(S9.day(todayIso()))) : null}; }
  catch (e) { out.staff = {error: String(e && e.message || e)}; }
  return out;
}
/* money, as compare_money895.cjs reads it (go('costs') first, then every model in one held run) */
function money() {
  return holdAssets(() => { const M = moneySummary(), X = cj764Model(), Hh = fh866Model(), P = pl770Model(), B = pl752Rows(), V = transport888View(), R = recon888Model(), RH = typeof rh766Model === 'function' ? rh766Model() : null, LP = labourPlan();
    const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (k === 'asAt' || k === 'at' || k === 'now' || k === 'generated') ? undefined : v));
    return JSON.stringify({M: strip(M), X: strip(X), H: strip(Hh), P: strip(P), B: strip(B), V: {tot: V.tot, byBranch: V.byBranch, byCarrier: V.byCarrier, revenueTotal: V.revenueTotal, provisionalTotal: V.provisionalTotal, lines: V.lines.length}, R: R.ties.map(t => ({what: t.what, ok: t.ok, parts: t.parts})), RH: strip(RH), LP: {all: LP.all}}); });
}

async function read(pageFile, tag) {
  const s = await open({pageFile, W, H, mobile: MOB, dpr: MOB ? 2 : 1}); const p = s.page, cons = [];
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) cons.push(m.text().slice(0, 200)); });
  try {
    await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof transport888Core === 'function', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const r = await p.evaluate(inPage, {KEY, N1, N2, TB});
    /* the drawer, as drawn */
    r.drawer = await p.evaluate(({KEY, N1, N2, TB, DISC}) => {
      openAsset(KEY);
      const boxes = [...document.querySelectorAll('input[data-lab^="' + KEY + '"]')].map(x => x.dataset.lab);
      const unitHeads = [...document.querySelectorAll('.labunit .labunith')].map(x => x.textContent.trim());
      const per = n => ['install', 'steps', 'levelling', 'cleaning', 'demob'].filter(l => boxes.includes(KEY + '/u' + n + '|' + DISC + '|' + TB + '|' + l));
      const dph = [...document.querySelectorAll('[data-dphunit]')].map(x => x.dataset.dphunit);
      return {boxes, unitHeads, n1: per(N1), n2: per(N2), tbRef: boxes.filter(b => b.startsWith(KEY + '|' + DISC + '|' + TB + '|')),
        peeUnits: boxes.filter(b => b.startsWith(KEY + '/u') && b.includes('|Pee Panel|')), fwfUnits: boxes.filter(b => b.startsWith(KEY + '/u') && b.includes('|FWF|')), dph: [...new Set(dph)]};
    }, {KEY, N1, N2, TB, DISC});
    if (OUT && tag === 'built') { try { const el = await p.$('input[data-lab^="' + KEY + '/u' + N1 + '"]'); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
      fs.mkdirSync(OUT, {recursive: true}); await p.screenshot({path: path.join(OUT, 'wc09_labour_' + (MOB ? 'phone' : 'laptop') + '.png')}); } } catch (e) { r.shot = String(e.message).slice(0, 120); } }
    await p.keyboard.press('Escape').catch(() => {});
    await p.evaluate(() => go('costs'));
    await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0 && !!document.getElementById('recon888'); } catch (e) { return false; } }, null, {timeout: 60000});
    await p.waitForTimeout(800);
    r.money = await p.evaluate(money);
    r.versionAfter = await p.evaluate(() => { try { return SYNC.backend.readVersion821(); } catch (e) { return null; } });
    r.errors = s.errors.slice(); r.console = cons; r.counts = Object.assign({}, s.counts);
    return r;
  } finally { await s.browser.close(); }
}

(async () => {
  let base = await read(BASE, 'base'), built = await read(PAGE, 'built'), tries = 0;
  while ((base.version !== built.version || base.versionAfter !== built.versionAfter || base.version !== base.versionAfter) && tries++ < 2) { base = await read(BASE, 'base'); built = await read(PAGE, 'built'); }
  const res = []; const ok = (c, what, got) => { res.push(!!c); console.log((c ? 'PASS ' : 'FAIL ') + what + (c ? '' : ' :: ' + JSON.stringify(got).slice(0, 600))); };
  const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  console.log(`${MOB ? 'phone' : 'laptop'}: base ${base.footer.trim()} / built ${built.footer.trim()}; record ${base.version} / ${built.version}; day ${built.day}`);
  ok(base.version != null && base.version === built.version && base.versionAfter === built.versionAfter, 'both pages read the same record version', [base.version, built.version, base.versionAfter, built.versionAfter]);
  const B = built.refs[KEY], A = base.refs[KEY];
  ok(eq(built.wc09.nums.slice().sort(), [N1, N2]), 'WC09 carries the two recorded building numbers', built.wc09.nums);
  ok(eq(built.wc09.plan, [['T0101', 'FWF', true], ['T0102', TB, false], ['T0259', 'Pee Panel', true]]), 'WC09: FWF and pee panels on the Event Portables load, the blocks not', built.wc09.plan);
  ok(eq(A.lineNumbersOf, {FWF: [], 'Pee Panel': [N1, N2], [TB]: []}), 'base: the two numbers were dealt to Pee Panel (the fault)', A.lineNumbersOf);
  ok(eq(B.lineNumbersOf, {FWF: [], 'Pee Panel': [], [TB]: [N1, N2]}), 'built: lineNumbersOf(WC09) gives both numbers to Toilet Block 6m', B.lineNumbersOf);
  ok(eq(B.itemNumbersOf, {FWF: [], 'Pee Panel': [], [TB]: [N1, N2]}), 'built: itemNumbersOf(WC09) the same', B.itemNumbersOf);
  ok(eq(B.units, {FWF: [], 'Pee Panel': [], [TB]: [N1, N2]}), 'built: labour units - two blocks, FWF and Pee Panel one set for the reference', B.units);
  ok(eq(B.lines[TB], [{u: N1, lines: ['install', 'steps', 'levelling', 'cleaning', 'demob']}, {u: N2, lines: ['install', 'steps', 'levelling', 'cleaning', 'demob']}]), 'built: each block offered Install, Steps, Levelling, Cleaning, Demob', B.lines[TB]);
  ok(eq(B.lines.FWF, A.lines.FWF) && eq(B.lines['Pee Panel'], [{u: null, lines: []}]), 'built: FWF lines as the base, Pee Panel one set (the card prices no labour on it)', [B.lines.FWF, B.lines['Pee Panel']]);
  ok(eq(B.types.map(t => [t[0], t[2]]), [[N1, TB], [N2, TB]]) && B.types.every(t => /\|Toilet Block 6m$/.test(t[1])), 'built: each number counts as Toilet Block 6m (Change form and inventory type)', B.types);
  ok(eq(built.wc09.sel, [TB, TB]) && eq(base.wc09.sel, ['Pee Panel', 'Pee Panel']), 'Change form "counts as": Toilet Block 6m for both (base: Pee Panel)', [base.wc09.sel, built.wc09.sel]);
  ok(eq(B.inv, [['FWF', []], ['Pee Panel', []], [TB, [N1, N2]]]), 'built: the inventory numbers per item follow the split', B.inv);
  const invOf = (r, t) => (r.inv.find(x => x.type.endsWith('|' + t)) || {});
  ok(invOf(built, TB).coates === 2 && !invOf(built, 'Pee Panel').coates && invOf(base, 'Pee Panel').coates === 2 && !invOf(base, TB).coates,
    'Equipment counts WC09\'s two numbers as Toilet Block 6m (base: Pee Panel)', {base: base.inv, built: built.inv});
  const d = built.drawer;
  ok(eq(d.n1, ['install', 'steps', 'levelling', 'cleaning', 'demob']) && eq(d.n2, ['install', 'steps', 'levelling', 'cleaning', 'demob']) && !d.tbRef.length,
    'drawer: two blocks, each with its own Install, Steps, Levelling (and Cleaning, Demob)', d);
  ok(d.unitHeads.some(h => h.startsWith(N1)) && d.unitHeads.some(h => h.startsWith(N2)), 'drawer: each block headed by its number', d.unitHeads);
  ok(!d.peeUnits.length && !d.fwfUnits.length && base.drawer.tbRef.length > 0 && !base.drawer.n1.length && !base.drawer.n2.length,
    'drawer: no per-number ticks under Pee Panel or FWF; the base had one set for the reference under the blocks', {built: [d.peeUnits, d.fwfUnits], base: base.drawer.tbRef});
  ok(eq(d.dph.sort(), base.drawer.dph.sort()) && [N1, N2].every(n => d.dph.includes(n)) && eq(built.wc09.photoUnits, base.wc09.photoUnits),
    'drop photo groups: one per number, as on the base', {base: base.drawer.dph, built: d.dph});
  const others = Object.keys(base.refs).filter(k => k !== KEY);
  const diff = others.filter(k => !eq(base.refs[k], built.refs[k]));
  ok(eq(Object.keys(base.refs).sort(), Object.keys(built.refs).sort()) && !diff.length, `every other multi-item reference reads the base's split (${others.join(', ')})`, diff);
  ok(eq(built.simPee.lineNumbersOf, {FWF: [], 'Pee Panel': [N1], [TB]: [N2]}) && eq(built.simPee.tb, [N2, 'rest']),
    'a person\'s choice wins: 1268858 counted as Pee Panel stays the pee panels\'; 1311146 the blocks\'', built.simPee);
  ok(eq(built.simFwf.lineNumbersOf, {FWF: [N1, N2], 'Pee Panel': [], [TB]: []}), 'a person\'s choice wins: both counted as FWF go to FWF', built.simFwf);
  ok(built.recordAfter && base.recordAfter && eq(base.wc09Choices, built.wc09Choices), 'the simulated choices were put back; the record\'s choices are unchanged', [built.wc09Choices]);
  ok(eq(base.ticks, built.ticks) && built.ticks.every(t => t.read && t.offered), `every labour tick on these references still read on its unit (${built.ticks.length}; WC09 has ${built.wc09Ticks.length})`, {base: base.ticks, built: built.ticks});
  /* where the two differ: the path and the kind of change only, never an amount (compare_money895.cjs's walk) */
  const mdiff = []; const walk = (x, y, at) => {
    if (typeof x === 'number' && typeof y === 'number') { if (x !== y) mdiff.push(at + ' ' + (y > x ? 'up' : 'down')); return; }
    if (Array.isArray(x) && Array.isArray(y)) { if (x.length !== y.length) mdiff.push(at + ' length ' + x.length + ' -> ' + y.length); for (let i = 0; i < Math.min(x.length, y.length); i++) walk(x[i], y[i], at + '[' + i + ']'); return; }
    if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { if (!(k in x) || !(k in y)) mdiff.push(at + '.' + k + (k in x ? ' removed' : ' added')); else walk(x[k], y[k], at + '.' + k); } return; }
    if (x !== y) mdiff.push(at + (typeof x === 'string' && typeof y === 'string' ? ' text: ' + JSON.stringify(x.replace(/\d/g, '#')).slice(0, 160) + ' -> ' + JSON.stringify(y.replace(/\d/g, '#')).slice(0, 160) : ' changed'));
  };
  walk(JSON.parse(base.money), JSON.parse(built.money), '');
  ok(!mdiff.length && base.money.length > 1000, 'money identical: P&L summary, Costs to job end, Finance handover, P&L, business lines, Transport, tie-outs, Rehire by branch, labour plan', mdiff.slice(0, 20));
  ok(built.staff && built.staff.api && built.staff.api.includes('day') && built.staff.day && built.staff.day === base.staff.day, 'StaffNames910 present and reads the same day model (read-only)', [base.staff, built.staff].map(x => x && (x.error || (x.api || []).join(','))));
  const blk = f => { const t = fs.readFileSync(f, 'utf8'), i = t.indexOf('const StaffNames910 = '), j = t.indexOf('module.exports = StaffNames910;', i); return i > 0 && j > i ? t.slice(i, j) : null; };
  const sb = blk(BASE), sp = blk(PAGE);
  ok(sb && sp && sb === sp, 'StaffNames910 script byte for byte as on the base', [!!sb, !!sp]);
  ok(!base.errors.length && !built.errors.length && !base.console.length && !built.console.length, 'no page or console errors', {base: [base.errors, base.console], built: [built.errors, built.console]});
  ok(base.counts.blocked === 0 && built.counts.blocked === 0, 'no writes attempted (counts.blocked 0)', [base.counts, built.counts]);
  console.log('demob runs for WC09 (reported): base ' + JSON.stringify(base.demob) + ' / built ' + JSON.stringify(built.demob));
  const pass = res.filter(Boolean).length; console.log(`${pass}/${res.length} ${MOB ? 'phone' : 'laptop'}`);
  process.exitCode = pass === res.length ? 0 : 1;
})().catch(e => { console.error('TEST FAIL', e); process.exit(2); });
