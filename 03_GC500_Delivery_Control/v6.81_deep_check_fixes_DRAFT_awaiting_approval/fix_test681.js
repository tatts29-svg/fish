const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const p = await (await b.newContext({viewport: {width: 1440, height: 900}})).newPage(); const errs = [], flashes = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200))); p.on('dialog', d => d.dismiss());
  await p.goto('http://127.0.0.1:8814/e/edittokenedittoken1/#runsheet', {waitUntil: 'load'}); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => { S.operator = 'Test Runner'; const w = document.querySelector('#who'); if (w) w.value = 'Test Runner';
    const out = {}; const _f = window.flash; window.flash = m => { (window.__fl = window.__fl || []).push(m); };
    // L6, L8
    out.L6 = shiftHours('07:00', '07:00', 0); out.L8 = runHours({start: '07:00', finish: '07:20', break_min: 30, date: '2026-09-24'}); out.L8b = runPaidOf({start: '07:00', finish: '07:20', break_min: 30, date: '2026-09-24', hours: 0.33});
    out.L9 = runType('Salaried');
    // M3: hours-only line survives a break being typed
    addOurCost('labour', {person: 'Kyle Gover', date: '2026-10-05', hours: '8'}); { const k0 = ourCosts().find(c => c.kind === 'labour' && c.person === 'Kyle Gover' && c.date === '2026-10-05'); out.M3a = {usable: k0.usable, hours: k0.hours}; } runSetShift('Kyle Gover', '2026-10-05', {break_min: '15'});
    const k = ourCosts().find(c => c.kind === 'labour' && c.person === 'Kyle Gover' && c.date === '2026-10-05'); out.M3 = k ? {usable: k.usable, hours: k.hours} : null;
    runSetShift('Kyle Gover', '2026-10-05', {start: '07:00'}); const k2 = ourCosts().find(c => c.kind === 'labour' && c.person === 'Kyle Gover' && c.date === '2026-10-05'); out.M3b = {usable: k2.usable, hours: k2.hours};
    runSetShift('Kyle Gover', '2026-10-05', {finish: '15:00'}); const k3 = ourCosts().find(c => c.kind === 'labour' && c.person === 'Kyle Gover' && c.date === '2026-10-05'); out.M3c = {usable: k3.usable, hours: k3.hours, worked: runWorked(k3), paid: runHours(k3)};
    // M4: clearing a night
    const n0 = ourCosts().filter(c => c.kind === 'accommodation' && c.usable && c.person === 'Andrew Fisher'); const d = n0[0].date;
    runSetMoney('accommodation', 'Andrew Fisher', d, ''); out.M4 = {before: n0.length, after: ourCosts().filter(c => c.kind === 'accommodation' && c.usable && c.person === 'Andrew Fisher').length};
    // L5
    runAddPerson('aaron.zelvis', 'hire'); out.L5 = {type: ourCosts().find(c => c.kind === 'person' && c.person === 'Aaron Zelvis').type, flash: (window.__fl || []).slice(-1)[0]};
    // L7
    setOurPerson('Kyle Gover', {pay_rate: 'abc'}); const T = runTotals(); out.L7 = {pay: T.all.pay, total: T.all.total}; setOurPerson('Kyle Gover', {pay_rate: '45'}); out.L7b = runTotals().all.pay;
    // M1 (stub the Costs figure a little above the rows)
    const ms = window.moneySummary; RENDER_MEMO.clear(); const real = ms(todayIso()); window.moneySummary = a => Object.assign({}, real, {charge: Object.assign({}, real.charge, {labour: real.charge.labour + 884.85})});
    try { RENDER_MEMO.delete('labourPlan'); const LP = labourPlan(); out.M1 = {all: LP.all.charged, moved: (LP.byBranch.get('~moved') || {}).charged, rowsBranch: Math.round([...LP.byBranch.values()].reduce((s, o) => s + o.charged, 0) * 100) / 100, rowsLine: Math.round([...LP.byLine.values()].reduce((s, o) => s + o.charged, 0) * 100) / 100}; } catch (e) { out.M1 = String(e); }
    window.moneySummary = ms; RENDER_MEMO.clear();
    // M2
    out.M2 = questionsList().filter(q => /^(br-diff|tr-miss|lb-miss)/.test(q.id)).map(q => q.id);
    render(); return out; });
  await p.evaluate(() => { state.runDay = '2026-10-05'; go('runsheet'); }); await p.waitForTimeout(800);
  const row = await p.evaluate(() => { const tr = [...document.querySelectorAll('#pane-runsheet .rstbl tbody tr')].find(t => t.cells[0].textContent.includes('Kyle')); return [...tr.cells].map(c => { const i = c.querySelector('input,select'); return i ? i.value : c.textContent.trim(); }); });
  await p.evaluate(() => go('pricing')); await p.waitForTimeout(800); await p.evaluate(() => go('costs')); await p.waitForTimeout(800);
  const rule = await p.evaluate(() => { const m = document.body.innerHTML.match(/The pay rule, as set on the running sheet[^<]{0,300}/); return m ? m[0] : null; });
  console.log(JSON.stringify({r, row, rule, errs}, null, 1)); await b.close(); })();
