// v10.29 checks: the card governs NVAC's generator and tower lines again. Read-only: every write the page tries is
// aborted by the harness. Run: PAGE=build/GC500_v10.29/GC500_Delivery_Control_hosted.html node tests/test_rates1029.cjs
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
let fails = 0, n = 0;
const ok = (what, cond, more) => { n++; console.log((cond ? 'PASS ' : 'FAIL ') + what + (cond ? '' : ' :: ' + JSON.stringify(more || null).slice(0, 400))); if (!cond) fails++; };
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 900});
  const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await p.waitForTimeout(3000);
  const X = await p.evaluate(() => {
    const rows = (ONHIRE_ROWS || []).filter(r => r.branch_code === 'NVAC' && ['generator', 'lighting tower', 'lighting'].includes(r.kind) && !r.charge_line);
    const held = rows.filter(r => r.rate_1_keyed1029 != null);
    const charges = held.map(r => { let c = null; try { c = contractCharge(r); } catch (e) { c = {error: String(e)}; } return {line: r.line, kind: r.kind, status: r.status_as_written, rate_1: r.rate_1, keyed: r.rate_1_keyed1029, amount: c && c.amount, how: c && c.how, filled: c && c.filled, basis: c && c.basis}; });
    const all = (ONHIRE_ROWS || []).map(r => { let c = null; try { c = contractCharge(r); } catch (e) { c = {error: String(e)}; } return {key: r.rental_contract + '/' + r.line, amount: c && c.amount}; });
    const hold = DATA.rate_hold1029;
    const gm = generatorModel1004();
    const gen = Object.fromEntries(['GN06', 'GN13', 'GN24', 'GN21'].map(k => { const r = gm.rows.find(x => x.ref === k); return [k, r && {status: r.status, forecast: r.forecast, actual: r.actual, issues: r.issues, lines: r.contractLines, rateState: r.rateState}]; }));
    const spares = (ONHIRE_ROWS || []).filter(r => r.rental_contract == '9961976' && [13, 45].includes(r.line)).map(r => ({line: r.line, state: r.match && r.match.state, key: r.match && r.match.key, from: r.unjoined1029 && r.unjoined1029.from}));
    const asg = {GN06: DATA.rental_on_hire.assignments.GN06.lines, GN13: DATA.rental_on_hire.assignments.GN13.lines};
    const footer = (document.body.innerText.match(/v10\.\d+/g) || []).pop();
    const costs = (document.getElementById('pane-costs') || {}).innerText || '';
    return {gen, spares, asg, rows: rows.length, held: held.length, charges, all, hold: hold && {lines: hold.held.length, by: hold.decided_by, words: hold.words}, footer,
      numericRate: rows.filter(r => typeof r.rate_1 === 'number').map(r => r.line), costsHasNvac: /NVAC/.test(costs)};
  });
  ok('24 NVAC generator and tower lines carry their keyed rate aside (rate_1_keyed1029) and no Rate 1', X.held === 24 && X.numericRate.length === 0, {held: X.held, numeric: X.numericRate});
  ok('every held line prices from the card (filled card) or is outside the charge window at $0', X.charges.every(c => c.filled === 'card' || c.amount === 0 || c.amount === null), X.charges.filter(c => !(c.filled === 'card' || c.amount === 0 || c.amount === null)));
  ok('no held line prices at the keyed weekly figure', X.charges.every(c => c.amount !== c.keyed), X.charges.filter(c => c.amount === c.keyed));
  ok('DATA.rate_hold1029 names the decision: 24 lines, Andrew Fisher, "We go by our rate cards at the moment."', X.hold && X.hold.lines === 24 && /project manager|Andrew Fisher/.test(X.hold.by) && /rate cards/.test(X.hold.words), X.hold);
  ok('footer reads v10.29', X.footer === 'v10.29', X.footer);
  ok('spare lines 13 and 45 are unjoined (no reference) and remember they came off GN06 and GN13', X.spares.length === 2 && X.spares.every(s => s.state === 'unmatched' && !s.key) && X.spares.map(s => s.from).sort().join() === 'GN06,GN13', X.spares);
  ok('GN06 and GN13 each hold their one line (48, 44)', X.asg.GN06.join() === '9961976/48' && X.asg.GN13.join() === '9961976/44', X.asg);
  ok('GN13 (delivered 12 Oct) prices again from the card: actual hire, no allocation issue', X.gen.GN13 && X.gen.GN13.status === 'Arrived' && X.gen.GN13.actual > 0 && X.gen.GN13.issues.length === 0 && X.gen.GN13.rateState === 'card', X.gen.GN13);
  ok('GN06 (Del Req 19 Oct) is a priced forecast again, no allocation issue', X.gen.GN06 && X.gen.GN06.forecast > 0 && X.gen.GN06.issues.length === 0 && X.gen.GN06.rateState === 'card', X.gen.GN06);
  ok('GN24 is left as the branch\'s question: two lines for one unit, quantity to allocate', X.gen.GN24 && X.gen.GN24.issues.includes('Contract quantity needs allocation'), X.gen.GN24);
  ok('GN21 is untouched', X.gen.GN21 && X.gen.GN21.actual === 2798.52, X.gen.GN21);
  // against the live v10.27 (card) and v10.28 (keyed) dumps when they are beside the test
  const S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/';
  if (fs.existsSync(S + 'charges_build28.json') && fs.existsSync(S + 'charges_live27.json')) {
    const b28 = Object.fromEntries(JSON.parse(fs.readFileSync(S + 'charges_build28.json')).map(r => [r.key, r]));
    const l27 = Object.fromEntries(JSON.parse(fs.readFileSync(S + 'charges_live27.json')).map(r => [r.key, r]));
    const touched = new Set(X.charges.map(c => '9961976/' + c.line).concat(['9961976/13', '9961976/45']));
    const others = X.all.filter(r => !touched.has(r.key));
    const moved = others.filter(r => b28[r.key] && b28[r.key].amount !== r.amount);
    ok('every line outside the 24 held and the 2 unjoined charges exactly what v10.28 charged (' + others.length + ' lines)', moved.length === 0, moved.slice(0, 8));
    const sameStatus = X.charges.filter(c => l27['9961976/' + c.line] && l27['9961976/' + c.line].status === c.status && b28['9961976/' + c.line] && b28['9961976/' + c.line].amount !== null);
    const differ = sameStatus.filter(c => l27['9961976/' + c.line].amount !== c.amount);
    ok('held lines whose status did not change since v10.27 charge what the card charged on v10.27 (' + sameStatus.length + ' lines)', differ.length === 0, differ.slice(0, 8));
    const moveHeld = X.charges.reduce((t, c) => t + ((b28['9961976/' + c.line] || {}).amount || 0) - (c.amount || 0), 0);
    console.log('the 24 held lines moved ' + moveHeld.toFixed(2) + ' off the v10.28 total; GN13 line 44 now ' + (X.all.find(r => r.key === '9961976/44') || {}).amount + ', GN06 line 48 now ' + (X.all.find(r => r.key === '9961976/48') || {}).amount + ' (forecast ' + (X.gen.GN06 || {}).forecast + ')');
    const sum = a => a.reduce((t, r) => t + (typeof r.amount === 'number' ? r.amount : 0), 0);
    const nv29 = sum(X.all.filter(r => r.key.startsWith('9961976/'))), nv28 = sum(Object.values(b28).filter(r => r.key.startsWith('9961976/'))), nv27 = sum(Object.values(l27).filter(r => r.key.startsWith('9961976/')));
    console.log('NVAC priced: live v10.27 ' + nv27.toFixed(2) + ' · v10.28 ' + nv28.toFixed(2) + ' · v10.29 ' + nv29.toFixed(2));
    console.log('all contract lines: v10.28 ' + sum(Object.values(b28)).toFixed(2) + ' · v10.29 ' + sum(X.all).toFixed(2));
    ok('the whole NVAC movement from v10.28 is on the 24 held lines (GN13 line 44 and GN06 line 48 are among them)', Math.abs((nv28 - nv29) - moveHeld) < 0.02, {nv28, nv29, moveHeld});
  }
  await s.browser.close();
  console.log(fails ? `${fails} of ${n} CHECKS FAILED` : `ALL ${n} CHECKS PASSED`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
