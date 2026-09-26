// read-only data integrity audit of the running sheet, tracker, labour plan, questions and page text
const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const p = await (await b.newContext({viewport: {width: 1440, height: 900}})).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push('CE ' + m.text().slice(0, 160)); });
  await p.goto(process.argv[2] + '#today', {waitUntil: 'load', timeout: 120000}); await p.waitForTimeout(6000);
  const R = await p.evaluate(() => { const out = {issues: [], stats: {}}; const I = (k, x) => out.issues.push(k + ': ' + (typeof x === 'string' ? x : JSON.stringify(x)));
    const r2 = n => Math.round(n * 100) / 100; const L = ourCosts();
    const people = L.filter(c => c.kind === 'person'); out.stats.people = people.map(p => [p.person, p.type, p.usable, p.pay_rate ?? null, p.accommodation_rate ?? null]);
    const pmap = new Map(people.filter(p => p.usable).map(p => [p.person, p]));
    const shifts = L.filter(c => c.kind === 'labour'); out.stats.shifts = shifts.length; out.stats.unusable = shifts.filter(s => !s.usable).map(s => [s.id, s.problems || s.why]);
    const toMin = t => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; };
    const seen = new Map(); const byDate = {};
    shifts.filter(s => s.usable).forEach(s => {
      const k = s.person + '|' + s.date; if (seen.has(k)) I('duplicate shift', k); seen.set(k, s);
      if (!pmap.has(s.person)) I('shift for person not on list', s.person);
      const a = toMin(s.start), f = toMin(s.finish);
      const w = runWorked(s), ph = runHours(s), br = runBreak(s), dow = new Date(s.date + 'T00:00:00').getDay();
      if (a != null && f != null) { if (f <= a) I('finish not after start', [s.id, s.start, s.finish]); const exp = (f - a) / 60; if (Math.abs(exp - w) > 0.001) I('worked != finish-start', [s.id, exp, w]);
        const expP = exp - ((dow === 0 || dow === 6) && (s.break_min == null || s.break_min === '') ? 0 : (s.break_min != null && s.break_min !== '' ? Number(s.break_min) : runRule('wd_break'))) / 60; if (Math.abs(expP - ph) > 0.001) I('paid mismatch', [s.id, expP, ph]); }
      else I('shift without times', [s.id, s.hours]);
      if (s.hours !== undefined && s.hours != null && Math.abs(Number(s.hours) - w) > 0.001) I('graded hours != worked', [s.id, s.hours, w]);
      if (w > 16) I('long shift > 16h', [s.id, w]); if (typeof runRule('wd_break') !== 'number') I('rule not number', typeof runRule('wd_break'));
      const P = pmap.get(s.person) || {}; const sp = splitHoursFor(ph, s.date, P.type); const sum = r2(sp.ordinary + sp.at_1_5 + sp.at_2);
      if (Math.abs(sum - ph) > 0.011) I('split sum != paid', [s.id, sum, ph]);
      const t = runType(P.type); if (!t) I('person with no type', s.person);
      if (t !== 'salary') { if (dow === 0 && (sp.ordinary || sp.at_1_5)) I('sunday not all x2', s.id); if (dow === 6 && (sp.ordinary || sp.at_1_5 > 2)) I('saturday split', s.id);
        if (dow > 0 && dow < 6) { const o = t === 'hire' ? 7.5 : 7.6; if (Math.abs(sp.ordinary - Math.min(ph, o)) > 0.011) I('weekday ordinary', [s.id, sp]); } }
      byDate[s.date] = byDate[s.date] || {w: 0, p: 0}; byDate[s.date].w += w; byDate[s.date].p += ph; });
    // runDay for every date vs totals
    let dw = 0, dp = 0; const days = Object.keys(byDate).sort(); out.stats.days = [days[0], days[days.length - 1], days.length];
    days.forEach(d => { const D = runDay(d); const w = D.rows.reduce((s, r) => s + (r.worked || 0), 0), ph = D.rows.reduce((s, r) => s + (r.hours || 0), 0); dw += w; dp += ph;
      if (Math.abs(w - byDate[d].w) > 0.01) I('runDay worked', [d, w, byDate[d].w]); if (Math.abs(ph - byDate[d].p) > 0.01) I('runDay paid', [d, ph, byDate[d].p]);
      D.rows.forEach(r => { if (r.total != null && !Number.isFinite(r.total)) I('day total NaN', [d, r.name]); }); });
    const T = runTotals(), TF = trackerFigures();
    out.stats.totals = {runWorked: T.all.worked, runPaid: T.all.hours, daysW: r2(dw), daysP: r2(dp), trackerHours: TF.labour.hours, race: TF.race.hours, split: [TF.labour.ordinary, TF.labour.at_1_5, TF.labour.at_2], toDate: TF.labour.to_date, planned: TF.labour.planned};
    if (Math.abs(T.all.worked - dw) > 0.01) I('totals worked != sum of days', [T.all.worked, dw]);
    if (Math.abs(T.all.worked - TF.labour.hours - TF.race.hours) > 0.01) I('running sheet worked != tracker + race', [T.all.worked, TF.labour.hours, TF.race.hours]);
    if (Math.abs(TF.labour.to_date + TF.labour.planned - TF.labour.hours) > 0.01) I('to date + planned != hours', 0);
    // per person tracker vs running totals
    T.rows.forEach(x => { const q = TF.people && (Array.isArray(TF.people) ? TF.people.find(p => p.name === x.name) : null); if (q && Math.abs((q.hours + q.race) - x.worked) > 0.01) I('person hours differ', [x.name, q.hours + q.race, x.worked]); });
    // accommodation / meals
    const nights = L.filter(c => c.kind === 'accommodation' && c.usable); out.stats.nights = {n: nights.length, unpriced: nights.filter(n => n.amount == null).length, amount: r2(nights.reduce((s, n) => s + (n.amount || 0), 0))};
    const dupN = new Map(); nights.forEach(n => { const k = n.person + '|' + n.date; dupN.set(k, (dupN.get(k) || 0) + 1); }); [...dupN].filter(([, v]) => v > 1).forEach(([k]) => I('duplicate night', k));
    if (Math.abs(TF.accommodation.amount - out.stats.nights.amount) > 0.01) I('accommodation total', [TF.accommodation.amount, out.stats.nights.amount]);
    if (Math.abs(T.all.accommodation - out.stats.nights.amount) > 0.01) I('runsheet accommodation total', [T.all.accommodation, out.stats.nights.amount]);
    if (Math.abs(T.all.meals - TF.meals.amount) > 0.01) I('meals total', [T.all.meals, TF.meals.amount]);
    // labour plan
    const LP = labourPlan(); const A = LP.all; const sumB = {}, sumL = {}; ['charged', 'expected', 'tocome', 'later'].forEach(k => { sumB[k] = r2([...LP.byBranch.values()].reduce((s, o) => s + o[k], 0)); sumL[k] = r2([...LP.byLine.values()].reduce((s, o) => s + o[k], 0)); });
    out.stats.labour = {all: [A.charged, r2(A.expected), r2(A.tocome), r2(A.later)], n: A.n, unpriced: A.unpriced, byBranch: sumB, byLine: sumL, charge: moneySummary(todayIso()).charge.labour, slots: LP.slots.length, noBranch: (LP.byBranch.get('') || {}).n};
    ['expected', 'tocome', 'later'].forEach(k => { if (Math.abs(sumB[k] - A[k]) > 0.05) I('labour byBranch ' + k, [sumB[k], A[k]]); if (Math.abs(sumL[k] - A[k]) > 0.05) I('labour byLine ' + k, [sumL[k], A[k]]); });
    const slotCharged = r2(LP.slots.filter(s => s.state === 'charged' && s.value != null).reduce((s, x) => s + x.value, 0)); out.stats.labour.slotCharged = slotCharged;
    const dupSlot = new Map(); LP.slots.forEach(s => { const k = s.key + '|' + (s.unit || ''); dupSlot.set(k, (dupSlot.get(k) || 0) + 1); }); out.stats.labour.dupSlots = [...dupSlot].filter(([, v]) => v > 1).length;
    LP.slots.forEach(s => { if (s.value != null && !Number.isFinite(s.value)) I('slot NaN', s.key); });
    // questions
    const Q = questionsList(); const qk = new Map(); Q.forEach(x => { const k = x.q; qk.set(k, (qk.get(k) || 0) + 1); if (!x.q || !x.group) I('question missing text/group', x); });
    out.stats.questions = {n: Q.length, dups: [...qk].filter(([, v]) => v > 1).map(([k]) => k.slice(0, 80))};
    // money summary internal
    try { const m = moneySummary(todayIso()); out.stats.money = {charge: m.charge, cost: m.cost && Object.fromEntries(Object.entries(m.cost).filter(([, v]) => typeof v === 'number'))}; } catch (e) { I('moneySummary threw', String(e)); }
    return out; });
  // page text scan across every tab and tools pane
  const tabs = await p.evaluate(() => (typeof TABS !== 'undefined' ? TABS.map(t => t[0]) : []).concat(['today', 'progress', 'timeline', 'plant', 'map', 'docs', 'coatesway', 'runsheet', 'questions', 'pricing', 'costs', 'about']));
  const bad = {}; const seenT = new Set();
  for (const t of tabs) { if (seenT.has(t)) continue; seenT.add(t); try { await p.evaluate(t => go(t), t); } catch (e) { bad[t] = 'go failed'; continue; } await p.waitForTimeout(1300);
    const hits = await p.evaluate(() => { const pn = document.querySelector('.pane.on'); if (!pn) return ['no pane']; const tx = pn.innerText; const re = /(NaN|undefined|\[object Object\]|Infinity|\bnull\b|\$-0|-\$0\.00)/g; const h = []; let m; while ((m = re.exec(tx)) && h.length < 6) h.push(tx.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, ' ')); 
      const imgs = [...pn.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src').slice(0, 60));
      return h.concat(imgs.map(s => 'broken img ' + s)); });
    if (hits.length) bad[t] = hits; }
  // running sheet on every day of the job (render only)
  const rsErr = await p.evaluate(async () => { const out = []; const L = ourCosts().filter(c => c.kind === 'labour').map(c => c.date).sort(); let d = L[0]; const end = L[L.length - 1]; let n = 0;
    while (d <= end && n < 120) { state.runDay = d; try { go('runsheet'); renderRunsheet(); const tx = document.querySelector('#pane-runsheet').innerText; if (/NaN|undefined|\[object Object\]/.test(tx)) out.push(d); } catch (e) { out.push(d + ' ' + e); } d = runShiftDay(d, 1); n++; } return {checked: n, bad: out}; });
  console.log(JSON.stringify({data: R, textHits: bad, runsheetDays: rsErr, errs}, null, 1)); await b.close(); })();
