// v10.31: the Event Portables run sheet proposes every overdue portaloo for today in loads of 24. Read-only.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs'); let fails = 0, n = 0;
const ok = (what, cond, more) => { n++; console.log((cond ? 'PASS ' : 'FAIL ') + what + (cond ? '' : ' :: ' + JSON.stringify(more || null).slice(0, 500))); if (!cond) fails++; };
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#subhired', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await p.waitForTimeout(3500);
  const X = await p.evaluate(() => {
    const M = Supplier996.model(); const today = todayIso();
    const days = [...new Set(M.remaining.map(r => r.date))].sort();
    const byDay = Object.fromEntries(days.map(d => [d, M.remaining.filter(r => r.date === d).reduce((t, r) => t + r.remaining, 0)]));
    const loads = Supplier996.inboundLoads(today).map(L => ({units: L.units, stops: L.stops.map(st => st.ref + ' ' + st.count)}));
    const pane = document.getElementById('pane-subhired'); pane.querySelectorAll('details').forEach(d => { d.open = true; });
    const txt = pane.innerText; const i = txt.indexOf('Daily deliveries'); const j = txt.indexOf('Demob · ', i); 
    const all = (ONHIRE_ROWS || []).map(r => { let c = null; try { c = contractCharge(r); } catch (e) {} return {key: r.rental_contract + '/' + r.line, amount: c && c.amount}; });
    return {today, days, byDay, remaining: M.summary.remaining, loads, text: txt.slice(i, j > i ? j : i + 4000), footer: (document.body.innerText.match(/v10\.\d+/g) || []).pop(), all};
  });
  const later = Object.entries(X.byDay).filter(([d]) => d > X.today);
  ok('every overdue portaloo is proposed for today; only loads the supplier plan dates after today stay on their day (' + X.remaining + ' remaining)', X.days[0] === X.today && X.byDay[X.today] >= 24 && later.every(([d, n]) => d > X.today), {days: X.days, byDay: X.byDay});
  ok('today is packed into loads of 24, as many as it needs (' + X.byDay[X.today] + ' today)', X.loads.length === Math.ceil(X.byDay[X.today] / 24) && X.loads[0].units === 24 && X.loads.reduce((t, l) => t + l.units, 0) === X.byDay[X.today], X.loads);
  ok('the Sub-hired tab says so', /Daily deliveries · 34 remaining/.test(X.text) && /Proposed load 1 · 24 portaloos/.test(X.text) && /Proposed load 2 · \d+ portaloos/.test(X.text) && !/Mon 19 Oct|Tue 20 Oct/.test(X.text), X.text.slice(0, 400));
  console.log('by day: ' + JSON.stringify(X.byDay) + ' · loads today: ' + X.loads.map(l => l.units + ' (' + l.stops.join(', ') + ')').join(' | '));
  ok('footer reads v10.31', X.footer === 'v10.31', X.footer);
  const S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/';
  if (fs.existsSync(S + 'charges_build29.json')) { const b = Object.fromEntries(JSON.parse(fs.readFileSync(S + 'charges_build29.json')).map(r => [r.key, r.amount])); const moved = X.all.filter(r => b[r.key] !== undefined && b[r.key] !== r.amount); ok('no contract line charge moves (' + X.all.length + ' lines)', moved.length === 0, moved.slice(0, 5)); }
  await p.screenshot({path: S + 'shots_wb/subhired_loads_1031.png'});
  await s.browser.close(); console.log(fails ? `${fails} of ${n} CHECKS FAILED` : `ALL ${n} CHECKS PASSED`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
