// Author: Andrew Fisher. Native load ordering with synthetic in-memory records only.
// Run with PAGE and private absolute EVIDENCE_DIR under flock /tmp/gc500-browser.lock.
// The shared harness is tightened before opening: every non-GET request is aborted.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), Module = require('module');
const checks = [];
function check(name, pass, detail) {
 checks.push({name, pass: !!pass, ...(detail === undefined ? {} : {detail})});
 if (!pass) console.log('FAIL ' + name);
}
async function run() {
 const pageFile = process.env.PAGE, output = process.env.EVIDENCE_DIR;
 if (!pageFile || !fs.existsSync(pageFile) || !output || !path.isAbsolute(output)) throw Error('PAGE and an absolute private EVIDENCE_DIR are required');
 fs.mkdirSync(output, {recursive: true});
 const source = fs.readFileSync(pageFile), harness = path.resolve(__dirname, '../../toolchain/harness/open_page.js');
 const originalHarness = fs.readFileSync(harness, 'utf8'), hardened = originalHarness.replace(/const okPost = [^;]+;/, 'const okPost = false;');
 if (hardened === originalHarness) throw Error('Harness non-GET guard was not found; refusing to open practice session');
 const strict = new Module(harness, module); strict.filename = harness; strict.paths = Module._nodeModulePaths(path.dirname(harness)); strict._compile(hardened, harness);
 const s = await strict.exports.open({pageFile, hash: '#timeline', W: 1440, H: 1100, gl: true}), p = s.page;
 const assetChecks = await require('./assets911.cjs')(s);
 const blocked = []; let context;
 try {
  // This second guard records attempted writes after startup without exposing URL query credentials.
  await p.context().route('**/*', route => {
   const request = route.request();
   if (request.method() !== 'GET') { const u = new URL(request.url()); blocked.push({method: request.method(), host: u.host, path: u.pathname}); return route.abort(); }
   return route.fallback();
  });
  await p.waitForFunction(() => typeof Drops911 !== 'undefined' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
  const version = await p.evaluate(() => SYNC.db.readVersion821());
  // Keep the read-only harness at the same record version while practising capability locally.
  await p.context().route('**/api/version', route => route.request().method() === 'GET' ? route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({level: 'edit', version})}) : route.abort());
  context = await p.evaluate(() => {
   const copy = value => JSON.parse(JSON.stringify(value));
   const t = window.ORDER_ACTUAL911 = {before: JSON.stringify(S), initialLoads: copy(S.loads || {}), moves: [], saves: [], bumps: [], flashes: [], unexpected: [], failure: false,
    original: {move: flow891Move, order: flow891SaveOrder, bump, save, capability, mayWrite, whoAmI, flash, doc: SYNC.db.doc}};
   // Capture every persistence entry point BEFORE granting any practice edit capability.
   save = () => { t.unexpected.push('save'); return false; };
   SYNC.db.doc = () => ({set: async () => { t.unexpected.push('database set'); }, delete: async () => { t.unexpected.push('database delete'); }});
   bump = () => { t.bumps.push(copy(S.loads)); bump.kept = !t.failure; document.body.classList.toggle('unsaved', t.failure); RENDER_MEMO.clear(); render(); };
   flow891Move = function (...args) { t.moves.push(copy(args)); return t.original.move.apply(this, args); };
   flow891SaveOrder = function (...args) { t.saves.push(copy(args)); return t.original.order.apply(this, args); };
   flash = text => t.flashes.push(String(text));
   capability = () => 'view'; mayWrite = () => false; whoAmI = () => 'Isolated order check'; SYNC.readonly = true; SYNC.level = 'view';
   const d = programmeDays().find(day => day.iso === '2026-10-07');
   if (!d || dpLoads(d).filter(g => g.kind === 'deliveries').length < 3) throw Error('Expected native 7 October day with at least three delivery loads');
   t.day = d.iso; t.orderKey = flow891OrderKey(t.day); t.availabilityKey = crew883Key(t.day);
   S.loads = copy(t.initialLoads);
   for (const [key, value] of Object.entries(S.loads)) if (value && value.day === t.day && (value.kind === 'crew883' || value.kind === 'flow891')) delete S.loads[key];
   RENDER_MEMO.clear();
   const native = dpLoads(programmeDays().find(day => day.iso === t.day)).filter(g => g.kind === 'deliveries');
   const refs = [...new Set(native.flatMap(g => g.rows.map(row => row.a.key)))];
   if (refs.length < 3) throw Error('Expected three distinct native references for Crew preservation test');
   // Only two current Crew plans exist: native ordering must not create plans for the others.
   t.planKeys = refs.slice(0, 2).map(ref => crew883Key(t.day, ref));
   refs.slice(0, 2).forEach((ref, i) => { S.loads[t.planKeys[i]] = {kind: 'crew883', day: t.day, ref, order: null, people: [{slot: null, roles: ['installer']}], start: i ? '' : '06:17', finish: i ? '' : '06:53', location: 'Practice area ' + i, by: 'Isolated fixture', at: '2026-10-01T00:00:00.000Z', fixture: 'preserve me'}; });
   S.loads[t.availabilityKey] = {kind: 'crew883', day: t.day, ref: '', count: 0, names: ['', '', 'Practice Spare'], by: 'Isolated fixture', at: '2026-10-01T00:00:00.000Z'};
   t.historyKeys = [crew883Key('2026-10-05'), crew883Key('2026-10-05', refs[0])];
   S.loads[t.historyKeys[0]] = {kind: 'crew883', day: '2026-10-05', ref: '', count: null, names: [], by: 'Isolated fixture', at: '2026-10-01T00:00:00.000Z'};
   S.loads[t.historyKeys[1]] = {kind: 'crew883', day: '2026-10-05', ref: refs[0], order: 7, people: [{slot: null, roles: ['spotter']}], start: '05:47', finish: '06:23', location: 'Historical practice area', by: 'Isolated fixture', at: '2026-10-01T00:00:00.000Z'};
   t.fixture = copy(S.loads); t.nonLoads = JSON.stringify(Object.fromEntries(Object.entries(S).filter(([key]) => key !== 'loads')));
   t.snapshot = () => {
    const d = programmeDays().find(day => day.iso === t.day), report = Drops911.report(), model = report.model;
    const native = dpLoads(d).map((g, i) => ({id: ldId(d, g), n: i + 1, kind: g.kind})).filter(g => g.kind === 'deliveries');
    const cards = [...document.querySelectorAll('#pane-timeline .ldlist[aria-label^="Due in"] .ldl[data-ld]')].map(e => ({id: e.dataset.ld, n: +e.querySelector('.ld-n b').textContent, open: e.getAttribute('aria-expanded') === 'true', selected: e.closest('.ld').classList.contains('drops911-selected')}));
    const rows = [...document.querySelectorAll('[data-drop911-select]')].map(e => ({id: e.dataset.drop911Select, n: +e.querySelector('.drops911-number').textContent, selected: e.getAttribute('aria-pressed') === 'true'}));
    const pins = [...document.querySelectorAll('[data-drop911-marker]')].map(e => ({id: e.dataset.drop911Marker, n: +e.querySelector('span').textContent, refs: e.querySelector('strong').textContent, selected: e.getAttribute('aria-pressed') === 'true'}));
    const expected = new Map(native.map(g => [g.id, g.n]));
    return {selected: report.selected, ids: native.map(g => g.id), numbersAgree: model.loads.length === native.length && model.loads.every(g => expected.get(g.id) === g.n) && rows.length === native.length && rows.every(g => expected.get(g.id) === g.n) && cards.length === native.length && cards.every(g => expected.get(g.id) === g.n) && pins.length === Drops911.markers(model).length && pins.every(g => expected.get(g.id) === g.n && g.refs), cards, rows, pins};
   };
   t.integrity = () => {
    const before = t.fixture, after = S.loads, allowed = new Set([t.orderKey, ...t.planKeys]);
    const unexpected = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => !allowed.has(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key]));
    const order = flow891OrderDoc(t.day), native = dpLoads(programmeDays().find(day => day.iso === t.day)).filter(g => g.kind === 'deliveries');
    const ranks = new Map(); native.forEach((g, i) => g.rows.forEach(row => { if (!ranks.has(row.a.key)) ranks.set(row.a.key, i + 1); }));
    const fields = value => Object.fromEntries(Object.entries(value).filter(([key]) => !['order', 'by', 'at'].includes(key)));
    return {unexpected, plansExpected: t.planKeys.every(key => JSON.stringify(fields(after[key])) === JSON.stringify(fields(before[key])) && after[key].order === ranks.get(after[key].ref) && after[key].by === 'Isolated order check' && Date.parse(after[key].at) > Date.parse(before[key].at)),
     orderExpected: !!order && order.kind === 'flow891' && order.by === 'Isolated order check' && JSON.stringify(order.ids) === JSON.stringify(native.map(g => ldId({iso: t.day}, g))),
     availabilityUnchanged: JSON.stringify(before[t.availabilityKey]) === JSON.stringify(after[t.availabilityKey]), historyUnchanged: t.historyKeys.every(key => JSON.stringify(before[key]) === JSON.stringify(after[key])),
     nonLoadsUnchanged: t.nonLoads === JSON.stringify(Object.fromEntries(Object.entries(S).filter(([key]) => key !== 'loads')))};
   };
   state.day = t.day; state.tlView = 'day'; state.q = ''; state.disc = ''; state.light = ''; state.tlLoad = ''; go('timeline'); render();
   return {day: t.day, loadCount: native.length, references: refs.length};
  });
  check('ordering map is closed until explicitly opened',await p.locator('.drops911:visible').count()===0);
  await p.locator('[data-drop911-open]').first().click();
  await p.waitForFunction(() => { const ids=[...document.querySelectorAll('[data-drop911-marker]')].map(e=>e.dataset.drop911Marker), expected=Drops911.markers(Drops911.report().model); return expected.length > 0 && expected.every(m=>ids.includes(m.id)); }, null, {timeout: 120000});
  await p.waitForTimeout(150);
  const readonly = await p.evaluate(() => {
   const t = ORDER_ACTUAL911, before = JSON.stringify(S.loads), buttons = [...document.querySelectorAll('[data-drop911-move]')];
   buttons.forEach(button => button.click());
   return {allDisabled: buttons.length === t.snapshot().ids.length * 2 && buttons.every(button => button.disabled), noCalls: !t.moves.length && !t.saves.length && !t.bumps.length, unchanged: before === JSON.stringify(S.loads)};
  });
  check('read-only order buttons are disabled and cannot change order', readonly.allDisabled && readonly.noCalls && readonly.unchanged, readonly);
  const selection = await p.evaluate(() => {
   const t = ORDER_ACTUAL911, before = JSON.stringify(S.loads), report = Drops911.report();
   const load = report.model.loads.find((g, i) => i < report.model.loads.length - 1 && g.refs.some(ref => ref.point));
   if (!load) throw Error('Need a mapped load before the last position');
   t.target = load.id; t.startIds = t.snapshot().ids; t.startIndex = t.startIds.indexOf(t.target);
   [...document.querySelectorAll('[data-drop911-marker]')].find(e => e.dataset.drop911Marker === t.target).click();
   const snapshot = t.snapshot();
   return {noCalls: !t.moves.length && !t.saves.length && !t.bumps.length, unchanged: before === JSON.stringify(S.loads), selected: snapshot.selected === t.target, workspace: Drops911.report().open};
  });
  check('pin selection identifies the load inside arranging without an order write', Object.values(selection).every(Boolean), selection);
  await p.evaluate(() => { capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; render(); });
  const clickMove = async direction => {
   await p.evaluate(direction => {
    const t = ORDER_ACTUAL911, button = [...document.querySelectorAll('[data-drop911-move]')].find(e => e.dataset.drop911Id === t.target && e.dataset.drop911Move === direction);
    if (!button || button.disabled) throw Error('Expected enabled ' + direction + ' action for selected load');
    // Measure only the synchronous native action: successful GET polling also updates SYNC.at.
    const syncState = () => JSON.parse(JSON.stringify({pending: SYNC.pending, queue: SYNC.queue, inflight: SYNC.inflight, last: SYNC.last, at: SYNC.at, status: SYNC.status}));
    const beforeSync = t.failure ? syncState() : null;
    button.click();
    if (t.failure) t.failureSync = {before: beforeSync, after: syncState()};
   }, direction);
   await p.waitForTimeout(120);
   return p.evaluate(() => ({snapshot: ORDER_ACTUAL911.snapshot(), integrity: ORDER_ACTUAL911.integrity(), calls: {moves: ORDER_ACTUAL911.moves.length, saves: ORDER_ACTUAL911.saves.length, bumps: ORDER_ACTUAL911.bumps.length}, target: ORDER_ACTUAL911.target, startIds: ORDER_ACTUAL911.startIds, startIndex: ORDER_ACTUAL911.startIndex}));
  };
  const down = await clickMove('down');
  check('down delegates once each to native Move, SaveOrder and bump', down.calls.moves === 1 && down.calls.saves === 1 && down.calls.bumps === 1, down.calls);
  check('down moves exactly one place and keeps the stable selected load ID', down.snapshot.ids.indexOf(down.target) === down.startIndex + 1 && down.snapshot.selected === down.target && down.snapshot.cards.some(g => g.id === down.target && g.selected));
  check('after down all native card, list and marker numbers match dpLoads', down.snapshot.numbersAgree);
  check('native order updates only the day order and existing Crew order fields', !down.integrity.unexpected.length && down.integrity.plansExpected && down.integrity.orderExpected, down.integrity);
  check('historical times, availability and every non-load record remain unchanged', down.integrity.historyUnchanged && down.integrity.availabilityUnchanged && down.integrity.nonLoadsUnchanged);
  const up = await clickMove('up');
  check('up delegates once each to native Move, SaveOrder and bump', up.calls.moves === 2 && up.calls.saves === 2 && up.calls.bumps === 2, up.calls);
  check('up restores original order with the same selected ID and matching numbers', JSON.stringify(up.snapshot.ids) === JSON.stringify(up.startIds) && up.snapshot.selected === up.target && up.snapshot.numbersAgree);
  check('after both moves existing Crew, history and availability retain expected fields', !up.integrity.unexpected.length && up.integrity.plansExpected && up.integrity.historyUnchanged && up.integrity.availabilityUnchanged && up.integrity.nonLoadsUnchanged, up.integrity);
  const boundary = await p.evaluate(() => {
   const t = ORDER_ACTUAL911, ids = t.snapshot().ids, buttons = [...document.querySelectorAll('[data-drop911-move]')];
   return buttons.find(e => e.dataset.drop911Id === ids[0] && e.dataset.drop911Move === 'up').disabled && buttons.find(e => e.dataset.drop911Id === ids.at(-1) && e.dataset.drop911Move === 'down').disabled;
  });
  check('first earlier and last later controls stay disabled', boundary);
  await p.locator('.drops911').screenshot({path: path.join(output, 'native-order-1440.png')});
  const previouslyOpen = await p.evaluate(() => {
   const t = ORDER_ACTUAL911, before = t.snapshot(), previous = t.target;
   // Reorder another row while the original native card is selected.
   t.target = before.ids.find((id, index) => id !== previous && index > 0);
   if (!t.target) throw Error('Need a second load with an earlier position available');
   t.startIds = before.ids; t.startIndex = before.ids.indexOf(t.target);
   return previous;
  });
  const crossRow = await clickMove('up');
  check('reordering another row selects that stable ID despite a previously open card', crossRow.calls.moves === 3 && crossRow.calls.saves === 3 && crossRow.calls.bumps === 3 && crossRow.target !== previouslyOpen && crossRow.snapshot.selected === crossRow.target && crossRow.snapshot.ids.indexOf(crossRow.target) === crossRow.startIndex - 1 && crossRow.snapshot.cards.some(g => g.id === crossRow.target && g.selected), {previouslyOpen, selected: crossRow.snapshot.selected, moved: crossRow.target});
  check('cross-row reorder keeps all numbers and native Crew updates correct', crossRow.snapshot.numbersAgree && crossRow.integrity.plansExpected && crossRow.integrity.orderExpected && !crossRow.integrity.unexpected.length && crossRow.integrity.historyUnchanged && crossRow.integrity.availabilityUnchanged);
  const guarded = await p.evaluate(() => {
   const t = ORDER_ACTUAL911, before = JSON.stringify(S.loads), calls = [t.moves.length, t.saves.length, t.bumps.length];
   SYNC.readonly = true;
   const button = [...document.querySelectorAll('[data-drop911-move]')].find(e => e.dataset.drop911Id === t.target && e.dataset.drop911Move === 'down'); button.click();
   const safe = before === JSON.stringify(S.loads) && JSON.stringify(calls) === JSON.stringify([t.moves.length, t.saves.length, t.bumps.length]);
   SYNC.readonly = false; return safe;
  });
  check('capability loss before redraw blocks an otherwise enabled order control', guarded);
  await p.evaluate(() => { const t = ORDER_ACTUAL911; t.failure = true; t.flashes = []; });
  const failed = await clickMove('down');
  const failure = await p.evaluate(() => {
   const t = ORDER_ACTUAL911, sync = t.failureSync, changed = Object.keys(sync.before).filter(key => JSON.stringify(sync.before[key]) !== JSON.stringify(sync.after[key]));
   return {kept: bump.kept, notice: t.flashes.at(-1), unsaved: document.body.classList.contains('unsaved'), noFakeSync: changed.length === 0, ...(changed.length ? {syncMismatch: {changed, before: sync.before, after: sync.after}} : {}), unexpected: t.unexpected};
  });
  check('failed local save delegates once and ends with an explicit unsaved warning', failed.calls.moves === 4 && failed.calls.saves === 4 && failed.calls.bumps === 4 && failure.kept === false && failure.unsaved && /not saved|unsaved/i.test(failure.notice), failure);
  check('failed local save does not pretend to sync or renumber a different load', failure.noFakeSync && failed.snapshot.selected === failed.target && failed.snapshot.numbersAgree && !failure.unexpected.length, {failure, selected: failed.snapshot.selected, target: failed.target, numbersAgree: failed.snapshot.numbersAgree});
  const restored = await p.evaluate(() => {
   const t = ORDER_ACTUAL911; S = JSON.parse(t.before); capability = () => 'view'; mayWrite = () => false; SYNC.readonly = true; SYNC.level = 'view'; document.body.classList.remove('unsaved'); RENDER_MEMO.clear(); render();
   // Keep the persistence captures installed until the browser closes.
   return {same: JSON.stringify(S) === t.before, capturedOnly: !t.unexpected.length, calls: {moves: t.moves.length, saves: t.saves.length, bumps: t.bumps.length}};
  });
  check('original in-memory record is restored exactly; persistence was captured throughout', restored.same && restored.capturedOnly, restored);
  check('no application-service write was attempted', blocked.every(request => request.host !== 'gc500-production.up.railway.app'), blocked);
  check('no browser JavaScript errors', s.errors.length === 0, s.errors);
  check('all master plan assets match the existing manifest',assetChecks.failures.length===0,assetChecks.failures);
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({author: 'Andrew Fisher', sha256: crypto.createHash('sha256').update(source).digest('hex'), context, checks, readonly, selection, down, up, crossRow, failed, failure, restored, counts: s.counts, blocked}, null, 2));
 } finally { await s.browser.close(); }
 console.log(checks.filter(check => check.pass).length + '/' + checks.length + ' checks passed');
 if (checks.some(check => !check.pass)) process.exitCode = 1;
}
run().catch(error => { console.error(String(error.stack || error).replace(/access_token=[^&\s]+/g, 'access_token=REDACTED')); process.exitCode = 1; });
