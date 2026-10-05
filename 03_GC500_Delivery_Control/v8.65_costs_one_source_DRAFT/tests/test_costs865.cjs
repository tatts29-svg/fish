// Author: Andrew Fisher. v8.65 Costs & P&L checks, read-only against the live record (every write is aborted by open_page).
//   PAGE=build/GC500_v8.65/GC500_Delivery_Control_hosted.html [MOB=1] node v8.65_costs_one_source_DRAFT/tests/test_costs865.cjs
const {open} = require('../../toolchain/harness/open_page');
(async () => { const MOB = !!process.env.MOB, R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0; } catch (e) { return false; } }, null, {timeout: 30000}); await p.waitForTimeout(1500);
  const M = await p.evaluate(() => holdAssets(() => { const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
    const money = moneySummary(), L = labourRevenue858(), T = pl760Ticks(), A = acc761Labour(), LP = labourPlan(), P = pl770Model(), X = cj764Model();
    const inst = P.rev.find(r => r.code === '1047'); const race = money.charge.race || {};
    const planInstallGroup = r2(LP.all.charged + ['Install', 'Steps', 'Levelling', 'Demob'].reduce((s, k) => { const b = LP.byLine.get ? LP.byLine.get(k) : LP.byLine[k]; return s + (b ? b.expected + b.tocome + b.later : 0); }, 0));
    const lines = []; for (const a of allAssets().filter(a => !a._cancelled && !a.rest_of)) for (const l of (assetTotal(a).lines || [])) if (l.labour && l.labour.total != null && l.labour.ticked.length) lines.push(l.labour.total);
    const halfCents = lines.filter(v => Math.abs(v * 100 - Math.round(v * 100)) > 1e-6).length;
    document.querySelectorAll('#pane-costs details').forEach(d => d.open = true); const glance = document.getElementById('costs765'); const gt = glance ? glance.innerText : '';
    const tiles = glance ? [...glance.querySelectorAll('.cj765-tile')].map(t => t.querySelector('span').textContent.trim()) : [];
    const labTile = glance ? [...glance.querySelectorAll('.cj765-tile')].find(t => /Labour per piece/.test(t.textContent)) : null;
    const labTileNums = labTile ? (labTile.innerText.match(/\$[\d,]+\.\d\d/g) || []) : [];
    const plCard = document.getElementById('pl770'); const plt = plCard ? plCard.textContent : '';
    return {chargeLabour: money.charge.labour, ticksTotal: T.total, ticks: T.ticks, rev858: L, accInstallTotal: A.groups.install.total, accCharged: A.per.charged, planCharged: LP.all.charged, planInstallGroup,
      movedRow: LP.byLine.get ? LP.byLine.get('Relocated or moved units') : LP.byLine['Relocated or moved units'], halfCents, instNow: inst && inst.now, instJob: inst && inst.job, racePeople: race.people_amount,
      revJob: P.revJob, glanceRevJob: X.revenue.job, labourToCome: X.revenue.labourToCome, checks: P.checks, wages: X.wages, gt, tiles, labTileNums, plt: plt.slice(0, 4000),
      relocDemob: LP.slots.filter(sl => sl.key === 'demob' && (allAssets().find(a => a.key === sl.ref) || {}).relocation).length, relocInstall: LP.slots.filter(sl => sl.key === 'install' && (allAssets().find(a => a.key === sl.ref) || {}).relocation).length}; }));
  const near = (a, b, eps = 0.005) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < eps;
  ok('labour ticked: pl760Ticks total equals the P&L charge to the cent', near(M.ticksTotal, M.chargeLabour), {ticks: M.ticksTotal, charge: M.chargeLabour});
  ok('labour ticked: every line total is whole cents', M.halfCents === 0, {halfCents: M.halfCents});
  ok('labour ticked: no phantom "Relocated or moved units" row', !M.movedRow || Math.abs(M.movedRow.charged) < 0.005, M.movedRow || {row: 'none'});
  ok('labour ticked: Accruals card charged equals the P&L charge', near(M.accCharged, M.chargeLabour) && near(M.planCharged, M.chargeLabour), {acc: M.accCharged, plan: M.planCharged, charge: M.chargeLabour});
  ok('one labour forecast: labourRevenue858 job equals the Accruals Labour Install total', near(M.rev858.job, M.accInstallTotal), {rev858: M.rev858.job, accInstall: M.accInstallTotal, planInstallGroup: M.planInstallGroup});
  ok('one labour forecast: P&L Installation to job end = labour if all ticked + event people', near(M.instJob, M.rev858.job + M.racePeople), {instJob: M.instJob, sum: M.rev858.job + M.racePeople});
  ok('one labour forecast: P&L Installation on the record = labour ticked + event people', near(M.instNow, M.chargeLabour + M.racePeople), {instNow: M.instNow});
  ok('relocation rule: install forecast on a relocation, demob not', M.relocInstall > 0 && M.relocDemob === 0, {relocInstall: M.relocInstall, relocDemob: M.relocDemob});
  ok('P&L reconciles: revenue, costs, job end', M.checks.revenue === true && M.checks.costs === true && M.checks.revenueJob === true && M.checks.costsJob === true, M.checks);
  ok('glance revenue to job end equals the P&L', near(M.revJob, M.glanceRevJob), {revJob: M.revJob, glance: M.glanceRevJob});
  ok('glance says labour to tick is inside Revenue to job end, with its amount', !/not carried/.test(M.gt) && new RegExp(M.labourToCome.toLocaleString('en-AU', {minimumFractionDigits: 2}).replace(/[.,]/g, '\\$&')).test(M.gt), {labourToCome: M.labourToCome});
  ok('glance has a Labour per piece tile', M.tiles.includes('Labour per piece'), {tiles: M.tiles});
  ok('Labour tile shows ticked so far and if-all-ticked, matching the models', labNum(M.labTileNums, M.chargeLabour) && labNum(M.labTileNums, M.rev858.job) && labNum(M.labTileNums, M.rev858.remaining), {nums: M.labTileNums, charge: M.chargeLabour, job: M.rev858.job, remaining: M.rev858.remaining});
  ok('glance wages note splits Job Connect from the salary allowance', /Job Connect \$[\d,]+\.\d\d/.test(M.gt) && (!M.wages.allowanceForecast || /salary allowance forecast \$14,700\.00/.test(M.gt)), {snippet: (M.gt.match(/Priced wages[^\n]*/) || [''])[0].slice(0, 200)});
  ok('P&L card names the ledger gross margin as such', /Ledger gross margin/.test(M.plt) && !/Difference before overheads/.test(M.plt), {});
  const D = await p.evaluate(() => { const pane = document.getElementById('pane-costs'); document.querySelectorAll('#pane-costs details').forEach(d => d.open = true); const txt = pane.innerText;
    const rev = money(moneySummary().charge.total), n = (txt.match(new RegExp(rev.replace(/[$.,]/g, '\\$&'), 'g')) || []).length;
    return {kpis: pane.querySelectorAll('#pl752 .pl-kpis').length, diffLine: pane.querySelectorAll('#pl752 .pl-ln.diff').length, metrics: [...pane.querySelectorAll('#pl770 .fin745-metric span')].map(x => x.textContent.trim().slice(0, 40)), revCount: n, rev, flag: !!window.gc500CostsOnce865}; });
  ok('one place: Forecast P&L header tiles and its Difference line are gone', D.kpis === 0 && D.diffLine === 0 && D.flag, D);
  ok('one place: the P&L-lines card keeps only the ledger gross margin card', D.metrics.length === 1 && /^Ledger gross margin/.test(D.metrics[0]), D.metrics);
  ok('one place: revenue on the record is printed at most 3 times on the page (glance, two table totals)', D.revCount <= 3, {revCount: D.revCount, rev: D.rev});
  const LB = await p.evaluate(() => holdAssets(() => { const c = document.getElementById('labour865'); if (!c) return {none: true}; const cell = (re, col) => { const tr = [...c.querySelectorAll('tr')].find(t => re.test(t.textContent)); return tr ? tr.children[col].textContent.trim() : null; };
    const ev = new Set(EVENT_DAYS), rows = fin745Rows(todayIso()); const race = rows.filter(r => ev.has(r.date)); const paid = race.reduce((s, r) => s + (Number(r.paid) || 0), 0);
    const inst = pl770Model().rev.find(r => r.code === '1047'), W = cj764Model().wages;
    return {chargeNow: cell(/Total labour we charge/, 1), chargeJob: cell(/Total labour we charge/, 3), costJob: cell(/Total labour cost priced/, 3), raceRow: cell(/^Race weekend — (?!the people)/, 4), racePaid: paid, instNow: money(inst.now), instJob: money(inst.job), wagesJob: money(W.job), evInCats: !!document.querySelector('details[data-sfold="costs765|cats"] details[data-sfold="costs765|event833"]'), titles: [...document.querySelectorAll('#pane-costs .costs-audit-fold > summary b')].map(b => b.textContent)}; }));
  ok('labour card: total labour we charge = P&L Installation, now and to job end', LB.chargeNow === LB.instNow && LB.chargeJob === LB.instJob, LB);
  ok('labour card: total labour cost priced = wages priced to job end', LB.costJob === LB.wagesJob, {costJob: LB.costJob, wagesJob: LB.wagesJob});
  ok('labour card: race weekend cost row carries the running sheet’s race-day paid hours', !!LB.raceRow && new RegExp(LB.racePaid.toLocaleString('en-AU') + ' h paid').test(LB.raceRow), {raceRow: LB.raceRow, racePaid: LB.racePaid});
  ok('Event crew card moved into the working, under the people', LB.evInCats, {});
  ok('fold titles in plain words', LB.titles.some(t => /^By branch — who bills what/.test(t)) && LB.titles.some(t => /^To job end — /.test(t)) && LB.titles.some(t => /^Hired-in gear/.test(t)), LB.titles);
  for (const v of ['pricing', 'runsheet']) { await p.evaluate(v => { const b = document.querySelector(`[data-finance857="${v}"]`); if (b) b.click(); }, v); await p.waitForTimeout(900);
    const h = await p.evaluate(() => { const el = document.querySelector('#finance857-section .panehead'); return el ? el.textContent : ''; });
    ok(`sub-view ${v} heading reads as its button does`, v === 'pricing' ? /^Customer rates & charges — /.test(h) : /^Workforce costs — /.test(h), {h}); }
  // Codex's v8.62 contract: no money on the operational tabs
  for (const tab of ['today', 'timeline', 'plant', 'demob', 'coatesway']) { await p.evaluate(t => go(t), tab); await p.waitForTimeout(300);
    const n = await p.evaluate(() => { const root = document.getElementById('pane-' + state.tab); return [...root.querySelectorAll('*')].filter(x => !x.children.length && /\$\s*[\d,]+/.test(x.textContent)).length; });
    ok(`no money on ${tab}`, n === 0, {n}); }
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 4));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  for (const r of R) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + ' ' + JSON.stringify(r.detail === undefined ? null : r.detail).slice(0, 300));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'desktop'}: ${R.length - fails}/${R.length} pass`); await s.browser.close(); process.exit(fails ? 1 : 0);
  function labNum(list, v) { const t = '$' + v.toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2}); return list.includes(t); }
})().catch(e => { console.error('FAIL', e.stack); process.exit(2); });
