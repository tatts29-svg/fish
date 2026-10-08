// Author: Andrew Fisher. v9.13 practice tests - VMS boards: whose, fleet number, rego, and the delivery each is on, shown by
// name wherever a VMS delivery is shown (T0103 is VMS09 and VMS10 on the project manager's word).
// Read only. The page is the build, served at the live address by the harness, reading the live record by GET. Every write
// the page tries is aborted. The one editor save in session A is captured in page.route and aborted there, and a fresh
// read of the record afterwards proves it never reached the service. Session B simulates a record arriving from the
// service by changing the GET answer in the browser only.
//   PAGE=<build> [MOB=1] node tests/test_vms_rego913.cjs        (screenshots go to ../evidence/)
const path = require('path'), fs = require('fs'), {execFileSync} = require('child_process');
const {open} = require('../../toolchain/harness/open_page');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const MOB = process.env.MOB === '1', PAGE = process.env.PAGE, EVID = path.join(__dirname, '..', 'evidence');
const HOST = 'https://gc500-production.up.railway.app';
const checks = []; const ok = (name, pass, detail) => { checks.push({name, pass: !!pass}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ' ' + JSON.stringify(detail).slice(0, 900) : '')); };
const W = MOB ? 390 : 1440, H = MOB ? 844 : 900;
const recordNow = () => JSON.parse(execFileSync('curl', ['-sS', '--max-time', '60', '-H', 'x-gc500-token: Coates-GC500-2026', HOST + '/api/state'], {maxBuffer: 1 << 28}).toString());
const ready = p => p.waitForFunction(() => typeof vms913Mount === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('vmsboard') && typeof go === 'function', null, {timeout: 240000});
const showVms = async p => { await p.evaluate(() => { go('plant'); state.plantGroup = 'VMS boards'; render(); }); await p.waitForSelector('[data-vms913]', {timeout: 30000});
  await p.evaluate(() => { const d = document.querySelector('[data-vms913]'); d.open = true; }); await p.waitForTimeout(400); };
const rowsOf = p => p.evaluate(() => [...document.querySelectorAll('[data-vms913] .vms913row:not(.head)')].map(r => ({key: r.dataset.vms913Row, src: r.dataset.src,
  cells: [...r.querySelectorAll('.vms913c')].map(c => c.innerText.replace(/\s+/g, ' ').trim())})));
const shot = async (p, file, anchor) => { /* the frame is the register only, cut to what is on screen, with the anchor in view */
  await p.evaluate(a => { const f = document.querySelector('#flash'); if (f) { f.hidden = true; f.style.display = 'none'; } const el = document.querySelector(a); if (el) el.scrollIntoView({block: 'center'}); }, anchor);
  await p.waitForTimeout(500);
  const box = await p.evaluate(() => { const r = document.querySelector('[data-vms913]').getBoundingClientRect(), m = document.querySelector('main').getBoundingClientRect(), fb = (document.getElementById('footL') || {}).parentElement, ft = fb ? fb.getBoundingClientRect().top : innerHeight;
    const top = Math.max(0, r.top, m.top), bottom = Math.min(innerHeight, r.bottom, m.bottom, ft > top ? ft : innerHeight);
    const inFrame = [...document.querySelectorAll('[data-vms913] *')].filter(e => { const q = e.getBoundingClientRect(); return q.bottom > top && q.top < bottom && e.children.length === 0; }).map(e => e.textContent).join(' ');
    return {x: Math.max(0, r.left), y: top, width: Math.min(innerWidth, r.right) - Math.max(0, r.left), height: bottom - top, dollars: /\$/.test(inFrame)}; });
  await p.screenshot({path: path.join(EVID, file), clip: {x: box.x, y: box.y, width: box.width, height: box.height}, animations: 'disabled'});
  return box; };
const shotEl = async (p, file, sel, up) => { /* one element (or its nearest 'up' ancestor), cut to the screen */
  await p.evaluate(s => { const f = document.querySelector('#flash'); if (f) { f.hidden = true; f.style.display = 'none'; } const el = document.querySelector(s); if (el) el.scrollIntoView({block: 'center'}); }, sel);
  await p.waitForTimeout(600);
  const box = await p.evaluate(([s, u]) => { const e0 = document.querySelector(s), e = (u && e0.closest(u)) || e0, r = e.getBoundingClientRect();
    const top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom); return {x: Math.max(0, r.left), y: top, width: Math.min(innerWidth, r.right) - Math.max(0, r.left), height: bottom - top, dollars: /\$/.test(e.innerText)}; }, [sel, up]);
  await p.screenshot({path: path.join(EVID, file), clip: {x: box.x, y: box.y, width: box.width, height: box.height}, animations: 'disabled'});
  return box; };
const MONEY = () => holdAssets(() => { const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (k === 'asAt' || k === 'at' || k === 'now' || k === 'generated') ? undefined : v));
  const V = transport888View(), R = recon888Model();
  return JSON.stringify({M: strip(moneySummary()), X: strip(cj764Model()), H: strip(fh866Model()), P: strip(pl770Model()), B: strip(pl752Rows()),
    V: {tot: V.tot, byBranch: V.byBranch, byCarrier: V.byCarrier, revenueTotal: V.revenueTotal, provisionalTotal: V.provisionalTotal, lines: V.lines.length},
    R: R.ties.map(t => ({what: t.what, ok: t.ok, parts: t.parts})), RH: typeof rh766Model === 'function' ? strip(rh766Model()) : null, LP: {all: labourPlan().all}}); });

async function sessionA() {
  const before = recordNow();
  ok('the record holds no vmsboard documents before the test', !(before.docs && before.docs.vmsboard && Object.keys(before.docs.vmsboard).length), {version: before.version});
  const s = await open({pageFile: PAGE, mobile: MOB, W, H, dpr: MOB ? 2 : 1}); const p = s.page; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  const bad4 = []; p.on('response', r => { if (r.status() >= 400) bad4.push(r.status() + ' ' + r.request().method() + ' ' + r.url().replace(HOST, '').split('?')[0]); });
  try {
    await ready(p);
    const sync = await p.evaluate(() => ({inList: !!SYNC_COLLS.vmsboard, kind: SYNC_COLLS.vmsboard && SYNC_COLLS.vmsboard.kind, likeSub: SYNC_COLLS.subhire.kind, first: SYNC.first.has('vmsboard'), all: SYNC.first.size === Object.keys(SYNC_COLLS).length, readonly: SYNC.readonly, rec: JSON.stringify(S.vmsboard || {})}));
    ok('vmsboard is a synced collection like subhire (map), read on opening', sync.inList && sync.kind === 'map' && sync.likeSub === 'map' && sync.first && sync.all, sync);
    await p.evaluate(() => { go('costs'); }); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0 && !!document.getElementById('recon888'); } catch (e) { return false; } }, null, {timeout: 90000});
    const money0 = await p.evaluate(MONEY);
    await showVms(p);
    const rows = await rowsOf(p);
    const lines = await p.evaluate(() => ONHIRE_ROWS.filter(r => r.family === 'vms').map(r => r.rental_contract + '/' + r.line));
    const boardLines = await p.evaluate(() => vms913Boards().map(b => b.contract + '/' + b.line));
    ok('every VMS contract line has exactly one register row', rows.length === lines.length && lines.length === 23 && new Set(boardLines).size === lines.length && lines.every(l => boardLines.includes(l)) && new Set(rows.map(r => r.key)).size === rows.length, {rows: rows.length, lines: lines.length});
    const v10 = rows.find(r => r.key === 'VMS10') || {cells: []}, t10 = v10.cells.join(' | ');
    ok("VMS10 shows PremAir Hire, fleet 120T, rego V14221 as the project manager's word", v10.src === 'word' && /PremAir Hire/.test(t10) && /120T/.test(t10) && /V14221/.test(t10) && /the project manager's word/.test(t10), t10);
    const others = rows.filter(r => r.key !== 'VMS10');
    ok('every other board reads rego "not given" (no rego invented)', others.length === 22 && others.every(r => /not given/.test(r.cells[3]) && r.src === 'contract'), others.filter(r => !/not given/.test(r.cells[3])).map(r => r.key));
    const whose = Object.fromEntries(rows.map(r => [r.key, r.cells[1]]));
    ok('whose: Coates boards say Coates, sub-hire boards name the contract company', /^Coates$/.test(whose['1211404']) && /^Coates$/.test(whose['VMS12']) && /^Premiair/.test(whose['VMS11']) && /^RPM/.test(whose['VMS13']) && /^RPM/.test(whose['VMS17']) && /^Premiair/.test(whose['VMS23']), whose);
    const fleet = Object.fromEntries(rows.map(r => [r.key, r.cells[2]]));
    ok('fleet number: the Coates asset number for Coates boards, not given for sub-hire boards without one', /1211404/.test(fleet['VMS09']) && /1271129/.test(fleet['1271129']) && /not given/.test(fleet['VMS13']), {VMS09: fleet['VMS09'], VMS13: fleet['VMS13']});
    const onc = Object.fromEntries(rows.map(r => [r.key, r.cells[4]]));
    ok("On delivery: VMS09 and VMS10 on T0103 as the project manager's word; T0001's eight Coates boards by asset number; the rest not named yet",
      /^T0103 the project manager's word$/.test(onc['VMS09']) && /^T0103 the project manager's word$/.test(onc['VMS10']) && ['1211404', '1211370', '1211354', '1182999', '1191877', '1211359', '1211383', '1271129'].every(k => /^T0001 contract · asset number \d+$/.test(onc[k]))
      && rows.filter(r => !/^(VMS09|VMS10|1211404|1211370|1211354|1182999|1191877|1211359|1211383|1271129)$/.test(r.key)).every(r => /^not named yet$/.test(r.cells[4])), onc);
    ok('the same Coates asset number on two lines is said, not resolved (1211404 on lines 1 and 12)', /also on line 12/.test(rows.find(r => r.key === '1211404').cells[0]) && /also on line 1\b/.test(rows.find(r => r.key === 'VMS09').cells[0]));
    const view = await p.evaluate(() => { const f = document.querySelector('[data-vms913]'); const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
      return {form: !!f.querySelector('[data-vms913-form]'), edits: f.querySelectorAll('[data-vms913-edit]').length, visibleControls: [...f.querySelectorAll('input,select,textarea,button')].filter(vis).length, cap: capability(), dollars: /\$/.test(f.innerText)}; });
    ok('a view link shows no controls on the register', view.cap !== 'edit' && !view.form && view.edits === 0 && view.visibleControls === 0, view);
    ok('no dollar figure in the register', !view.dollars);
    const sh = await shot(p, MOB ? 'register_phone.png' : 'register_laptop.png', '[data-vms913-row="VMS10"]');
    ok('screenshot of the register, VMS10 in frame, no dollar figure in frame', !sh.dollars && sh.height > 200, sh);
    const fit = await p.evaluate(() => ({page: document.documentElement.scrollWidth <= innerWidth + 1, fold: (() => { const f = document.querySelector('[data-vms913]'); return f.scrollWidth <= f.clientWidth + 1; })()}));
    ok('the register fits the screen (no sideways scroll)', fit.page && fit.fold, fit);
    // (a)-(c) THE BOARDS BY NAME on every surface that shows a VMS delivery: T0103 is VMS09 and VMS10
    const W103 = 'VMS09 (Coates 1211404 · rego not given) · VMS10 (PremAir Hire 120T · rego V14221)';
    const S103 = 'VMS09 (Coates 1211404, rego not given); VMS10 (PremAir Hire 120T, rego V14221)';
    const sur = await p.evaluate(W => { const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
      const A = k => allAssets().find(x => x.key === k), a = A('T0103'), t1 = A('T0001'), t158 = A('T0158'), wc = A('WC09');
      const d = programmeDays().find(x => x.iso === '2026-10-08'), loads = dpLoads(d), g = loads.find(x => (x.rows || []).some(r => r.a.key === 'T0103')), gw = loads.find(x => (x.rows || []).some(r => r.a.key === 'WC09'));
      const r103 = d.deliveries.find(x => x.a.key === 'T0103'), ev = (a.events || []).filter(e => e.movement !== 'remove');
      const m = daily821Model('2026-10-08'), row = m.loads.flatMap(l => l.rows).find(r => r.key === 'T0103'), roww = m.loads.flatMap(l => l.rows).find(r => r.key === 'WC09');
      openAsset('T0103'); const dr = document.querySelector('#drawer [data-vms913-load="T0103"]'), drLi = document.querySelector('#drawer [data-vms913-line="VMS10"]');
      const has = s => strip(s).includes(W);
      return {
        loadCard: has(loading872AssetHtml(a)), deliveryCard: has(dayCards([r103], 'deliveries')), everyDay: has(dayRows([r103], 'deliveries')) && !/vms913/.test(dayRows(d.deliveries.filter(x => x.a.key === 'WC09'), 'deliveries')), drawer: dr ? strip(dr.innerHTML).includes(W) && /the project manager's word/.test(dr.innerText) : false,
        drawerLine: drLi ? /PremAir Hire · fleet no\. 120T · rego V14221/.test(drLi.innerText) : false,
        driverCard: ['VMS09 (Coates 1211404 · rego not given)', 'VMS10 (PremAir Hire 120T · rego V14221)'].every(x => strip(driverCard(a)).includes(x)) && /the project manager's word/.test(strip(driverCard(a))), dropSheet: has(dropPage(a, ev, 1, 1, d, 'deliveries')), drivers: has(dpPage(d, g, 'drv', 1, loads.length)), install: has(dpPage(d, g, 'ins', 1, loads.length)),
        daily: !!row && row.notes[0] === 'Boards: ' + W + " (the project manager's word)" && has(daily821Html(m, {name: 'Practice'}, 1)),
        sms: dropSmsText(a), smsUnits: smsShape(dropSmsText(a)).units, longText: dropText(a, {}).split('\n').find(l => /^Boards: /.test(l)) || null,
        t0001: strip(driverCard(t1)).includes('1211370 (Coates · rego not given)') && strip(loading872AssetHtml(t1)).includes('1271129 (Coates · rego not given)'),
        t0158: /VMS boards not named yet/.test(strip(loading872AssetHtml(t158))) && /VMS boards not named yet/.test(strip(driverCard(t158))) && /boards not named yet/.test(dropSmsText(t158)),
        others: !/vms913|Boards:/.test(loading872AssetHtml(wc) + bookingNosLine801(wc) + driverCard(wc) + dropText(wc, {}) + dpTruck(gw, 'drv')) && !/^Boards/.test((roww && roww.notes[0]) || '') && dropSmsText(wc) === dropSmsText(wc) && !/:\s*VMS|boards not named/.test(text747What(wc))};
    }, W103);
    ok('Timeline load card for T0103 names VMS09 and VMS10 with fleet number and rego', sur.loadCard, W103);
    ok('delivery card (Timeline / Today) for T0103 names both boards', sur.deliveryCard);
    ok('the Timeline\'s "Every day" row for T0103 names both boards (WC09\'s rows untouched)', sur.everyDay);
    ok("drawer: the Delivery card's rental lines name both boards as the project manager's word; VMS10's own line keeps its fleet number and rego", sur.drawer && sur.drawerLine, sur);
    ok("driver drop card (drawer) names both boards, one pill each, as the project manager's word", sur.driverCard);
    ok('printed drop sheet (run sheet) names both boards', sur.dropSheet);
    ok('Drivers PDF and Install PDF pages for the T0103 truck name both boards', sur.drivers && sur.install, {drivers: sur.drivers, install: sur.install});
    ok("installers' daily page carries the boards as T0103's first note", sur.daily);
    ok('driver text (short) names both boards in plain characters and stays within three texts', sur.sms.includes('T0103 - Variable message signs (VMS) x 2: ' + S103) && sur.smsUnits <= 459, {units: sur.smsUnits, sms: sur.sms.split('\n').slice(0, 2)});
    ok('driver text (full details) carries a Boards line', sur.longText === 'Boards: ' + W103 + " (the project manager's word)", sur.longText);
    ok("T0001 names its eight Coates boards by asset number (the contract's own match)", sur.t0001);
    ok('a VMS delivery with no board linked says "boards not named yet" (T0158) - nothing guessed', sur.t0158);
    ok('a delivery that is not VMS (WC09) is untouched on every surface', sur.others);
    // the Timeline as drawn: the T0103 load card on 8 Oct
    await p.evaluate(() => { const c = document.querySelector('#dclose'); if (c) c.click(); go('timeline'); }); await p.waitForTimeout(2500);
    const tlDom = await p.evaluate(() => { const e = document.querySelector('#pane-timeline [data-vms913-load="T0103"]'); return e ? e.innerText.replace(/\s+/g, ' ') : null; });
    ok('the Timeline shows the boards on the T0103 load card', tlDom && tlDom.includes(W103), tlDom);
    if (tlDom) { const sh3 = await shotEl(p, MOB ? 'timeline_T0103_phone.png' : 'timeline_T0103_laptop.png', '#pane-timeline [data-vms913-load="T0103"]', '.ld');
      ok('screenshot of the T0103 load card, no dollar figure in frame', !sh3.dollars, sh3); }
    await p.evaluate(() => go('today')); await p.waitForTimeout(2000);
    const today = await p.evaluate(() => ({cards: document.querySelectorAll('#pane-today [data-vms913-load="T0103"]').length, listed: /T0103/.test((document.getElementById('pane-today') || {}).innerText || '')}));
    console.log('INFO Today: T0103 load cards drawn on Today now: ' + today.cards + ' (T0103 is recorded complete, so Today lists it only in its "What went in today" log; Today draws loads with the same card renderers checked above)');
    // the day's drop sheets (Print the day) are one dropPage per delivery: T0103 must be one of 8 Oct's deliveries
    const day = await p.evaluate(W => { const d = programmeDays().find(x => x.iso === '2026-10-08');
      const r = d && d.deliveries.find(x => x.a.key === 'T0103'); return {inDay: !!r, sheet: r ? String(dropPage(r.a, r.events, 1, d.deliveries.length, d, 'deliveries')).replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ').includes('Boards: ' + W) : false}; }, W103);
    ok("8 Oct's drop sheets (Print the day) carry both boards on T0103's page", day.inDay && day.sheet, day);
    const quiet = await p.evaluate(() => JSON.stringify(S.vmsboard || {}));
    ok('opening, viewing and printing wrote nothing', s.counts.blocked === 0 && quiet === '{}' , {blocked: s.counts.blocked, vmsboard: quiet});

    // THE EDITOR: practice edit capability; every write is captured in page.route and aborted there
    const captured = [];
    await p.route('**/api/doc/**', async route => { const r = route.request(); captured.push({method: r.method(), url: r.url().replace(HOST, ''), body: r.postData()}); await route.abort(); });
    await p.evaluate(() => { window.capability = () => 'edit'; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Practice Editor';
      const original = window.fetch; window.fetch = async (u, o) => { const r = await original(u, o); if (/\/api\/(version|state)(\?|$)/.test(String(u)) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; };
      document.body.classList.remove('viewonly'); });
    await p.waitForTimeout(5000);
    const quietWrites = captured.length;
    ok('no dialog stands over the register in edit mode', await p.evaluate(() => !document.getElementById('drv782')));
    await showVms(p);
    const form = await p.evaluate(() => { const f = document.querySelector('[data-vms913-form]'); if (!f) return null; const hs = [...f.querySelectorAll('input,select,button')].map(e => Math.round(e.getBoundingClientRect().height)), on = f.querySelector('#vms913On'); return {heights: hs, on: !!on && [...on.options].map(o => o.value).join(',') === ',T0001,T0103,T0128,T0158,T0159,T0169,T0170', edits: document.querySelectorAll('[data-vms913-edit]').length}; });
    ok('the edit link shows one small form with 44 px taps (board, whose, fleet no., rego, On delivery, save) and a Change button per board', form && form.heights.length === 6 && form.heights.every(h => h >= 44) && form.on && form.edits === 23, form);
    const bad = [];
    for (const [co, fl, rg, why, on] of [['', 'F12', 'AB-12', 'rego with a dash'], ['', 'F12', 'TOOLONG1234', 'rego of 11'], ['', 'F12', 'AB 12', 'rego with a space'], ['', 'BAD FLEET!', 'ABC123', 'fleet with marks'], ['', 'THIRTEENCHARS', 'ABC123', 'fleet of 13'], ['<b>x</b>', 'F12', 'ABC123', 'company with markup'], ['', '', '', 'nothing given'], ['', 'F12', 'V14221', 'rego already on VMS10'], ['', 'F12', 'ABC123', 'a third board on T0103 (VMS x 2)', 'T0103']]) {
      await p.selectOption('#vms913Board', 'VMS12'); await p.fill('#vms913Co', co); await p.fill('#vms913Fleet', fl); await p.fill('#vms913Rego', rg); await p.selectOption('#vms913On', on || ''); await p.click('[data-vms913-save]'); await p.waitForTimeout(250);
      bad.push({why, msg: await p.evaluate(() => document.querySelector('.vms913msg').textContent), rec: await p.evaluate(() => JSON.stringify(S.vmsboard || {}))}); }
    ok('validation refuses bad input and records nothing', bad.length === 9 && bad.every(b => b.msg && b.rec === '{}') && /T0103 carries 2 boards on the schedule and already has VMS09, VMS10/.test(bad[8].msg), bad);
    const badOn = await p.evaluate(() => { const b = vms913Boards().find(x => x.key === 'VMS12'); return [vms913Check(b, '', '', 'ABC1', 'T9999').err, vms913Check(b, '', '', 'ABC1', 'WC09').err, vms913Check(b, '', '', 'ABC1', '<x>').err]; });
    ok('validation refuses an On delivery that is not one of the VMS deliveries', badOn.every(e => /is not one of the VMS deliveries on this page/.test(e || '')), badOn);
    await p.waitForTimeout(1500);
    const preWrites = captured.filter(c => /\/vmsboard/.test(decodeURIComponent(c.url))).length;
    // one good save: VMS12 (a Coates board), from the form
    await p.selectOption('#vms913Board', 'VMS12'); await p.fill('#vms913Co', ''); await p.fill('#vms913Fleet', 'F12'); await p.fill('#vms913Rego', 'abc123'); await p.selectOption('#vms913On', ''); await p.click('[data-vms913-save]');
    await p.waitForTimeout(6000);
    const vb = captured.filter(c => c.method === 'PUT' && /^\/api\/doc\/vmsboard\//.test(c.url));
    const ids = [...new Set(vb.map(c => c.url))], body = vb.length ? JSON.parse(vb[0].body) : {};
    ok('a simulated editor save writes exactly one document to vmsboard, with who and when', ids.length === 1 && ids[0] === '/api/doc/vmsboard/VMS12' && vb.every(c => c.body === vb[0].body) && body.by === 'Practice Editor' && !isNaN(Date.parse(body.at)) && body.rego === 'ABC123' && body.fleet === 'F12' && 'on' in body && body.on === null && body.line === '9961265/16' && body._k === 'VMS12', {ids, body, attempts: vb.length});
    const otherColls = [...new Set(captured.map(c => decodeURIComponent(c.url).split('/')[3]))];
    const otherIds = [...new Set(captured.filter(c => !/\/vmsboard\//.test(c.url)).map(c => decodeURIComponent(c.url)))];
    ok('the only other writes are the page\'s own stamp and name for that document', quietWrites === 0 && preWrites === 0 && otherIds.every(u => /^\/api\/doc\/(stamps|by)\/vmsboard~2f~VMS12$/.test(u)), {quietWrites, preWrites, otherColls, otherIds});
    ok('after the save the form shows what was saved, rego in capitals', await p.evaluate(() => document.querySelector('#vms913Rego').value === 'ABC123' && document.querySelector('#vms913Board').value === 'VMS12'));
    const after = await rowsOf(p), r12 = (after.find(r => r.key === 'VMS12') || {cells: []}).cells.join(' | ');
    ok('the register shows the saved board as recorded, with who', /F12/.test(r12) && /ABC123/.test(r12) && /recorded by Practice Editor/.test(r12) && /not named yet/.test(r12), r12);
    const sh2 = await shot(p, MOB ? 'register_editor_phone.png' : 'register_editor_laptop.png', '[data-vms913-form]');
    ok('screenshot of the editor form (practice capability), no dollar figure in frame', !sh2.dollars, sh2);
    const money1 = await p.evaluate(MONEY);
    ok('money identical before and after the save (P&L, costs to job end, Finance, transport, tie-outs, rehire, labour)', money0 === money1, {len: money0.length});
    const rec = recordNow();
    ok('the captured save never reached the service (fresh read has no vmsboard)', !(rec.docs && rec.docs.vmsboard && Object.keys(rec.docs.vmsboard).length), {version: rec.version});
    ok('no page errors', s.errors.length === 0, s.errors);
    const fails = [...new Set(bad4)];
    ok('no refused request concerns the register: the only 404s are the map explorer\'s own tile files, which this release does not touch', fails.every(u => /^404 GET \/w\/Coates-GC500-2026\/explorer\/assets\//.test(u)) && !fails.some(u => /vmsboard|\/api\/doc/.test(u)), {n: fails.length, sample: fails.slice(0, 3)});
    ok('no console errors other than those refusals and the aborted practice writes', cons.filter(t => !/status of 40[34]|net::ERR_FAILED/.test(t)).length === 0 && cons.filter(t => /status of 40[34]/.test(t)).length <= bad4.length, cons.slice(0, 5));
    ok('the harness blocked nothing (the only writes were captured and aborted in page.route)', s.counts.blocked === 0, s.counts);
  } finally { await s.browser.close(); }
}

async function sessionB() {
  const s = await open({pageFile: PAGE, mobile: MOB, W, H, dpr: MOB ? 2 : 1}); const p = s.page; let inject = false;
  const DOCS = {VMS10: {co: 'Practice Co', fleet: 'P913', rego: 'PRAC913', on: 'T0103', line: '9961265/13', by: 'Practice Recorder', at: '2026-10-08T05:10:00.000Z', _k: 'VMS10'},
    VMS13: {co: null, fleet: 'R13', rego: 'RPM13', on: 'T0158', line: '9961265/18', by: 'Practice Recorder', at: '2026-10-08T05:11:00.000Z', _k: 'VMS13'},
    VMS09: {co: null, fleet: null, rego: null, on: 'none', line: '9961265/12', by: 'Practice Recorder', at: '2026-10-08T05:12:00.000Z', _k: 'VMS09'}};
  await p.route(/\/api\/(version|state)(\?|$)/, async route => { const r = route.request(); const res = await curlFetch(r.url(), r.headers(), 'GET');
    let body = res.body; if (inject && res.status === 200) { const j = JSON.parse(body.toString()); j.version = j.version + 1000000; if (j.docs) j.docs.vmsboard = DOCS; body = Buffer.from(JSON.stringify(j)); }
    await route.fulfill({status: res.status, headers: res.headers, body}); });
  try {
    await ready(p); await showVms(p);
    const r0 = await rowsOf(p); ok('session B opens with the preload on VMS10', (r0.find(r => r.key === 'VMS10') || {}).src === 'word');
    inject = true;
    await p.waitForFunction(() => S.vmsboard && S.vmsboard.VMS10 && S.vmsboard.VMS13, null, {timeout: 30000});
    await p.waitForTimeout(1200); await showVms(p);
    const r1 = await rowsOf(p), v10 = r1.find(r => r.key === 'VMS10') || {cells: []}, t10 = v10.cells.join(' | '), v13 = (r1.find(r => r.key === 'VMS13') || {cells: []}).cells.join(' | ');
    ok("an incoming record syncs in like subhire, and a record document overrides the project manager's word", v10.src === 'record' && /Practice Co/.test(t10) && /P913/.test(t10) && /PRAC913/.test(t10) && !/V14221|120T|PremAir/.test(t10) && /recorded by Practice Recorder/.test(t10), t10);
    ok('a record with no company keeps the contract company and shows its rego', /^RPM/.test(v13.split(' | ')[1] || '') && /RPM13/.test(v13) && /R13/.test(v13), v13);
    const drv = await p.evaluate(() => { const a = allAssets().find(x => x.key === 'T0103' || x.task_id === 'T0103'); openAsset(a.key); const li = document.querySelector('#drawer [data-vms913-line="VMS10"]'); return li ? li.innerText : null; });
    ok('the delivery card follows the record', drv && /PRAC913/.test(drv) && /P913/.test(drv) && !/V14221/.test(drv), drv);
    const links = await p.evaluate(() => { const A = k => allAssets().find(x => x.key === k), strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
      return {t103: vms913LoadOf(A('T0103')).text, t158: vms913LoadOf(A('T0158')).text, sms158: dropSmsText(A('T0158')).split('\n')[1], card158: strip(loading872AssetHtml(A('T0158'))),
        on09: (document.querySelector('[data-vms913-row="VMS09"] .vms913c.o') || {}).innerText}; });
    ok("a record's On delivery wins: VMS09 taken off T0103 by the record, VMS13 put on T0158; each surface follows", links.t103 === 'VMS10 (Practice Co P913 · rego PRAC913)' && links.t158 === 'VMS13 (RPM R13 · rego RPM13)'
      && /VMS13 \(RPM R13, rego RPM13\)/.test(links.sms158) && links.card158.includes('VMS13 (RPM R13 · rego RPM13)') && /not named yet/.test(links.on09 || '') && /taken off by the record/.test(links.on09 || ''), links);
    ok('session B: no page errors, nothing written', s.errors.length === 0 && s.counts.blocked === 0, {errors: s.errors, counts: s.counts});
  } finally { await s.browser.close(); }
}

(async () => {
  if (!PAGE || !fs.existsSync(PAGE)) throw new Error('PAGE must name the build');
  fs.mkdirSync(EVID, {recursive: true});
  await sessionA(); await sessionB();
  const n = checks.filter(c => c.pass).length; console.log(`RESULT ${n}/${checks.length} ${MOB ? 'phone' : 'laptop'}`);
  process.exit(n === checks.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(2); });
