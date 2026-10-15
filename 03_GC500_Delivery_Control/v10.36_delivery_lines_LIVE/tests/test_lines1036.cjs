/* v10.36: a contract's "Delivery for Line Item(s) 7,14" names its units. Before (the v10.35 build) that line was unallocated
   and held every generator's delivery leg; after, it covers GN19 and GN04 and every other generator's delivery leg is the
   card's each-way charge. Read-only: pages served from the builds, every write aborted. Author: Andrew Fisher.
     BEFORE=build/GC500_v10.35/GC500_Delivery_Control_hosted.html PAGE=build/GC500_v10.36/GC500_Delivery_Control_hosted.html node v10.36_delivery_lines_LIVE/tests/test_lines1036.cjs */
const path = require('path');
const {open} = require(path.resolve(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
const results = []; const check = (name, ok, note) => { results.push({name, ok: !!ok}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : '')); };
const survey = async pageFile => {
  const s = await open({pageFile, hash: '#equipment', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await p.waitForTimeout(3000);
  const out = await p.evaluate(() => holdAssets(() => {
    const T = buildingTransportModel831();
    const src = (ONHIRE_ROWS || []).filter(r => r.charge_line && (r.kind === 'transport' || /^(delivery|pickup|pick-up|transport)$/i.test(String(r.item || '').trim()))).map(r => ({contract: String(r.rental_contract), line: r.line, desc: r.description, lineKeys: buildingTransportSource831(r).lineKeys}));
    const legs = (T.rows || []).map(r => ({id: r.id, ref: r.ref, family: r.family, leg: r.leg, state: r.state, additional: r.additional, reasons: r.reasons || [], coverage: r.coverage}));
    const sym = {}; for (const ref of ['GN01', 'GN19', 'GN04', 'GN20']) { const a = assetOf(ref); sym[ref] = a ? (st => ({delivery: st.delivery, pickup: st.pickup}))(sym1033State(ref)) : null; }
    return {src, legs, totals: {gross: T.grossEstimate, covered: T.coveredEstimate, held: T.heldEstimate, uncovered: T.uncoveredAdditional, actual: T.actualAdditional1006, remaining: T.remainingAdditional1006}, sym, footer: (document.body.innerText.match(/· v10\.\d\d/g) || []).slice(-1)[0]};
  }));
  await s.browser.close(); return out;
};
(async () => {
  const A = await survey(process.env.PAGE);
  check('footer v10.36', A.footer === '· v10.36', A.footer);
  const l50 = A.src.find(x => x.contract === '9961976' && x.line === 50);
  check('9961976 line 50 names hire lines 7 and 14', l50 && l50.lineKeys.join(',') === '9961976|7,9961976|14', l50 && l50.desc + ' → ' + l50.lineKeys.join(','));
  const ha = A.src.find(x => x.contract === '9973079' && x.line === 2);
  check('the HA spelling still reads', ha && ha.lineKeys.join(',') === '9973079|1,9973079|2');
  const others = A.src.filter(x => !(x.contract === '9961976' && x.line === 50) && !(x.contract === '9973079' && x.line === 2));
  check('every other transport line still names no hire line', others.every(x => x.lineKeys.length === 0), others.length + ' lines');
  const gd = A.legs.filter(r => /^generators$/i.test(r.family) && r.leg === 'delivery');
  const est = gd.filter(r => r.state === 'estimate'), cov = gd.filter(r => ['covered', 'held', 'included'].includes(r.state));
  check('generator delivery legs now carry the card charge', est.length >= 10, est.map(r => r.ref + ' $' + r.additional).join(', '));
  check('GN19 and GN04 deliveries are the contract line\'s (held: one line, two units, nothing added at the card), GN20 held (no card figure)', ['GN19', 'GN04', 'GN20'].every(k => cov.some(r => r.ref === k)) && cov.length === 3, cov.map(r => r.ref + ':' + r.state + ' [' + r.reasons.join('; ') + ']').join(' | '));
  const gp = A.legs.filter(r => /^generators$/i.test(r.family) && r.leg === 'pickup' && r.state === 'estimate');
  check('generator pick-up legs as before', gp.length >= 10, gp.length + ' estimates');
  check('the symbols: GN01 delivery and pick up both apply with a card charge', A.sym.GN01 && A.sym.GN01.delivery.applies && A.sym.GN01.delivery.charge > 0 && A.sym.GN01.pickup.charge > 0, JSON.stringify(A.sym.GN01));
  console.log('after totals', JSON.stringify(A.totals));
  if (process.env.BEFORE) {
    const B = await survey(process.env.BEFORE);
    const b50 = B.src.find(x => x.contract === '9961976' && x.line === 50);
    check('before: that line named no hire line (the fault)', b50 && b50.lineKeys.length === 0);
    const bd = B.legs.filter(r => /^generators$/i.test(r.family) && r.leg === 'delivery');
    check('before: every generator delivery leg was held', bd.length && bd.every(r => r.state === 'held' || r.state === 'excluded'), bd.length + ' legs');
    const diff = Math.round(((A.totals.remaining + A.totals.actual) - (B.totals.remaining + B.totals.actual)) * 100) / 100;
    const key = r => r.id; const bm = new Map(B.legs.map(r => [key(r), r])); /* a toilet reference has a row per block and per tank, so rows are keyed by id, not by reference */
    const changed = A.legs.filter(r => { const b = bm.get(key(r)); return !b || b.state !== r.state || b.additional !== r.additional; }).map(r => ({id: r.id, ref: r.ref, family: r.family, leg: r.leg, was: (bm.get(key(r)) || {}).state, wasWhy: ((bm.get(key(r)) || {}).reasons || []).join('; '), now: r.state, additional: r.additional}));
    const sumChanged = Math.round(changed.reduce((n, r) => n + (r.additional || 0) - ((bm.get(r.id) || {}).additional || 0), 0) * 100) / 100;
    console.log('changed legs:', JSON.stringify(changed));
    check('every leg that changed was a delivery leg the unread line held, and is now the card charge', changed.length && changed.every(r => r.leg === 'delivery' && r.was === 'held' && /no exact building allocation/.test(r.wasWhy) && r.now === 'estimate'), changed.length + ' legs: ' + changed.map(r => r.ref + ' $' + r.additional).join(', '));
    check('the transport additional rises by exactly those legs', Math.abs(diff - sumChanged) < 0.01, 'before ' + (B.totals.remaining + B.totals.actual).toFixed(2) + ' → after ' + (A.totals.remaining + A.totals.actual).toFixed(2) + ' = +' + diff + ' (changed legs ' + sumChanged + ')');
    console.log('before totals', JSON.stringify(B.totals));
  }
  const bad = results.filter(r => !r.ok).length;
  console.log(bad ? 'FAILED ' + bad + ' of ' + results.length : 'ALL ' + results.length + ' PASSED');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(2); });
