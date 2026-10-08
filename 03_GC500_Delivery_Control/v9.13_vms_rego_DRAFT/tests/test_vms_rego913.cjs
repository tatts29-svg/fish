// Author: Andrew Fisher. v9.13 practice tests - VMS boards: whose, fleet number, rego, and the delivery each is on, shown by
// name wherever a VMS delivery is shown (T0103 is VMS09 and VMS10 on the project manager's word).
// Read only. The page is the build, served at the live address by the harness, reading the live record by GET. Every write
// the page tries to /api/doc is captured in page.route and aborted there (or answered 403 in the refusal check), so the
// harness blocks nothing and nothing reaches the service; a fresh GET of the record before and after proves it. Edit
// capability is practised by answering /api/version and /api/state with level 'edit' in the browser only, and a record
// arriving from another device is practised the same way (the GET answer is changed in the browser only).
//   PAGE=<build> [MOB=1] node tests/test_vms_rego913.cjs        (screenshots go to ../evidence/)
// RIG NOTE: run with TMPDIR on a memory disk (e.g. TMPDIR=/dev/shm/v913tmp) and CHROMIUM_PATH set to an installed Chromium
// (e.g. /opt/pw-browsers/chromium-1194/chrome-linux/chrome); headless Chromium crashes on large pictures when the temp
// directory's disk is full.
const path = require('path'), fs = require('fs'), {execFileSync} = require('child_process');
const {open} = require('../../toolchain/harness/open_page');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const MOB = process.env.MOB === '1', PAGE = process.env.PAGE, EVID = path.join(__dirname, '..', 'evidence'), TAG = MOB ? 'phone' : 'laptop';
const HOST = 'https://gc500-production.up.railway.app';
const checks = []; const ok = (name, pass, detail) => { checks.push({name, pass: !!pass}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ' ' + JSON.stringify(detail).slice(0, 1200) : '')); };
const info = (name, detail) => console.log('INFO ' + name + (detail !== undefined ? ' ' + JSON.stringify(detail).slice(0, 1600) : ''));
const W = MOB ? 390 : 1440, H = MOB ? 844 : 900;
const recordNow = () => JSON.parse(execFileSync('curl', ['-sS', '--max-time', '60', '-H', 'x-gc500-token: Coates-GC500-2026', HOST + '/api/state'], {maxBuffer: 1 << 28}).toString());
const vmsDocs = r => (r.docs && r.docs.vmsboard) ? Object.keys(r.docs.vmsboard) : [];
const W103 = 'VMS09 (Coates 1211404 · rego not given · asset no. also on T0001 - to confirm) · VMS10 (PremAir Hire 120T · rego V14221)';
const WORD = "the project manager's word";

/* one browser with a controllable service in front of it (edit level, an incoming record, a refusal) */
async function rig(opts) {
  const s = await open({pageFile: PAGE, mobile: MOB, W, H, dpr: MOB ? 2 : 1}); const p = s.page;
  if (opts.dark) await p.emulateMedia({colorScheme: 'dark'});
  const ctl = {edit: !!opts.edit, view403: false, inject: null, bump: 0, refuse: null, captured: []};
  await p.route(/\/api\/(version|state)(\?|$)/, async route => { const r = route.request(); const res = await curlFetch(r.url(), r.headers(), 'GET');
    let body = res.body; if (res.status === 200) { const j = JSON.parse(body.toString());
      if (ctl.edit && !ctl.view403) j.level = 'edit'; if (ctl.view403) j.level = 'view';
      if (ctl.inject) { j.version = j.version + 1000000 + ctl.bump; if (j.docs) j.docs.vmsboard = ctl.inject; }
      body = Buffer.from(JSON.stringify(j)); }
    await route.fulfill({status: res.status, headers: res.headers, body}); });
  await p.route('**/api/doc/**', async route => { const r = route.request(); ctl.captured.push({method: r.method(), url: decodeURIComponent(r.url().replace(HOST, '')), body: r.postData()});
    if (ctl.refuse && ctl.refuse.test(decodeURIComponent(r.url()))) return route.fulfill({status: 403, headers: {'content-type': 'application/json'}, body: JSON.stringify({error: 'view only'})});
    return route.abort(); });
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.waitForFunction(edit => typeof vms913Mount === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length && typeof go === 'function' && (!edit || capability() === 'edit'), !!opts.edit, {timeout: 240000});
  await p.evaluate(() => { const f = flash; window.__fl = []; window.flash = function(m){ window.__fl.push(String(m)); return f.apply(this, arguments); }; });
  return {s, p, ctl, errs};
}
const showVms = async p => { await p.evaluate(() => { go('plant'); state.plantGroup = 'VMS boards'; render(); }); await p.waitForSelector('[data-vms913]', {timeout: 30000});
  await p.evaluate(() => { const d = document.querySelector('[data-vms913]'); d.open = true; }); await p.waitForTimeout(400); };
const rowsOf = p => p.evaluate(() => [...document.querySelectorAll('[data-vms913] .vms913row:not(.head)')].map(r => ({key: r.dataset.vms913Row, src: r.dataset.src,
  cells: [...r.querySelectorAll('.vms913c')].map(c => c.textContent.replace(/\s+/g, ' ').trim())})));
const rowText = (p, k) => p.evaluate(k => { const r = document.querySelector('[data-vms913-row="' + k + '"]'); return r ? r.textContent.replace(/\s+/g, ' ') : null; }, k);
const flashN = p => p.evaluate(() => (window.__fl || []).length);
const flashSince = (p, n) => p.evaluate(n => (window.__fl || []).slice(n).join(' || '), n);
const hideFlash = p => p.evaluate(() => { const f = document.querySelector('#flash'); if (f) { f.hidden = true; f.style.display = 'none'; } });
const viewShot = async (p, file, sel, block) => { await p.evaluate(([s, b]) => { const e = document.querySelector(s); if (e) e.scrollIntoView({block: b || 'center'}); }, [sel, block]); await p.waitForTimeout(500); await hideFlash(p);
  const dollars = await p.evaluate(() => { const vis = [...document.querySelectorAll('[data-vms913] *, #drawer *, .ld *')].filter(e => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && e.children.length === 0; }); return vis.some(e => /\$/.test(e.textContent)); });
  await p.screenshot({path: path.join(EVID, file), animations: 'disabled'}); return {dollars}; };
/* contrast of every piece of text inside a root (WCAG ratio against the first solid background behind it) */
const CONTRAST = sel => { const root = document.querySelector(sel); if (!root) return {missing: sel};
  const lum = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a] = m[1].split(',').map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return {L: 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b), a: a === undefined ? 1 : a}; };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; const l = lum(cs.backgroundColor); if (l && l.a > 0.5) return l.L; } return 1; };
  const low = []; let n = 0;
  root.querySelectorAll('*').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return; if (![...e.childNodes].some(x => x.nodeType === 3 && x.textContent.trim())) return;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden') return; const fg = lum(cs.color); if (!fg) return; const bg = bgOf(e); if (bg == null) return; n++; const cr = (Math.max(fg.L, bg) + 0.05) / (Math.min(fg.L, bg) + 0.05);
    const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700); if (cr < (large ? 3 : 4.5)) low.push({t: e.textContent.trim().slice(0, 40), cr: Math.round(cr * 100) / 100, fg: cs.color}); });
  return {n, low: low.slice(0, 12), nLow: low.length}; };

// A. THE VIEW LINK: the register, every surface that names the boards, the texts, nothing written
async function sessionA() {
  const before = recordNow();
  ok('the record holds no vmsboard documents before the test', vmsDocs(before).length === 0, {version: before.version});
  const {s, p, ctl, errs} = await rig({edit: false}); const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  try {
    const sync = await p.evaluate(() => ({inList: !!SYNC_COLLS.vmsboard, kind: SYNC_COLLS.vmsboard && SYNC_COLLS.vmsboard.kind, likeSub: SYNC_COLLS.subhire.kind, first: SYNC.first.has('vmsboard'), readonly: SYNC.readonly, rec: JSON.stringify(S.vmsboard || {})}));
    ok('vmsboard is a synced collection like subhire (map), read on opening', sync.inList && sync.kind === 'map' && sync.likeSub === 'map' && sync.first, sync);
    await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0 && !!document.getElementById('recon888'); } catch (e) { return false; } }, null, {timeout: 90000});
    await showVms(p);
    const rows = await rowsOf(p);
    const lines = await p.evaluate(() => ONHIRE_ROWS.filter(r => r.family === 'vms').map(r => r.rental_contract + '/' + r.line));
    const boardLines = await p.evaluate(() => vms913Boards().map(b => b.contract + '/' + b.line));
    ok('every VMS contract line has exactly one register row', rows.length === lines.length && lines.length === 23 && new Set(boardLines).size === lines.length && lines.every(l => boardLines.includes(l)) && new Set(rows.map(r => r.key)).size === rows.length, {rows: rows.length, lines: lines.length});
    const R = Object.fromEntries(rows.map(r => [r.key, r]));
    const t10 = R.VMS10.cells.join(' | ');
    ok("VMS10 shows PremAir Hire, fleet 120T, rego V14221 as the project manager's word, said once in the row", R.VMS10.src === 'word' && /PremAir Hire/.test(t10) && /120T/.test(t10) && /V14221/.test(t10) && t10.split(WORD).length === 2, t10);
    const others = rows.filter(r => r.key !== 'VMS10');
    ok('every other board reads rego "not given" (no rego invented)', others.length === 22 && others.every(r => /not given/.test(r.cells[3]) && r.src === 'contract'), others.filter(r => !/not given/.test(r.cells[3])).map(r => r.key));
    ok('whose: Coates boards say Coates, sub-hire boards name the contract company', /^Coates$/.test(R['1211404'].cells[1]) && /^Coates$/.test(R.VMS12.cells[1]) && /^Premiair/.test(R.VMS11.cells[1]) && /^RPM/.test(R.VMS13.cells[1]) && /^Premiair/.test(R.VMS23.cells[1]));
    const coatesNoVms = ['1211404', '1211370', '1211354', '1182999', '1191877', '1211359', '1211383', '1271129'];
    ok('an asset number is not repeated in its own row: Fleet no. reads "same as board", On delivery reads "by asset number" with no number', coatesNoVms.every(k => R[k].cells[2] === 'same as board' && R[k].cells[4] === 'T0001by asset number' && R[k].cells.join(' ').split(k).length === 2), coatesNoVms.map(k => R[k].cells.join(' | ')).slice(0, 2));
    ok('fleet number: the Coates asset number where the board has a VMS number, not given for sub-hire boards without one', /1211404/.test(R.VMS09.cells[2]) && /not given/.test(R.VMS13.cells[2]), {VMS09: R.VMS09.cells[2], VMS13: R.VMS13.cells[2]});
    ok("On delivery: VMS09 on T0103 as the project manager's word; VMS10 on T0103 with the word said once in Source; the rest not named yet",
      R.VMS09.cells[4] === "T0103the project manager's word" && R.VMS10.cells[4] === 'T0103' && rows.filter(r => !['VMS09', 'VMS10'].concat(coatesNoVms).includes(r.key)).every(r => r.cells[4] === 'not named yet'), {VMS09: R.VMS09.cells[4], VMS10: R.VMS10.cells[4]});
    ok('the contract source is said once, in the note, not on every row', rows.filter(r => r.src === 'contract').every(r => r.cells[5] === '') && /From the contract unless a row says otherwise/.test(await p.evaluate(() => document.querySelector('.vms913note').textContent)));
    const note = await p.evaluate(() => document.querySelector('.vms913note').textContent.replace(/\s+/g, ' '));
    ok('the note carries no counts and does not talk about the VMS plan reconciliation', !/\d/.test(note) && !/reconcil|plan/i.test(note), note);
    ok('the same Coates asset number on two lines is said, not resolved (1211404 on lines 1 and 12)', /also on line 12/.test(R['1211404'].cells[0]) && /also on line 1\b/.test(R.VMS09.cells[0]));
    const view = await p.evaluate(() => { const f = document.querySelector('[data-vms913]'); const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
      return {form: !!f.querySelector('[data-vms913-form]'), edits: f.querySelectorAll('[data-vms913-edit]').length, visibleControls: [...f.querySelectorAll('input,select,textarea,button')].filter(vis).length, cap: capability(), dollars: /\$/.test(f.textContent)}; });
    ok('a view link shows no controls on the register, and no dollar figure', view.cap !== 'edit' && !view.form && view.edits === 0 && view.visibleControls === 0 && !view.dollars, view);
    const fit = await p.evaluate(() => ({page: document.documentElement.scrollWidth <= innerWidth + 1, fold: (() => { const f = document.querySelector('[data-vms913]'); return f.scrollWidth <= f.clientWidth + 1; })()}));
    ok('the register fits the screen (no sideways scroll)', fit.page && fit.fold, fit);
    const sh1 = await viewShot(p, `register_${TAG}.png`, '[data-vms913-row="VMS09"]');
    ok('screenshot of the register (light), no dollar figure in frame', !sh1.dollars);
    // orphan: a record for a board no longer on the contract is listed (in memory only; the view link writes nothing)
    const orph = await p.evaluate(() => { const keep = S.vmsboard; S.vmsboard = {VMS99: {co: 'Old Co', fleet: 'OLD1', rego: 'OLD99', on: null, line: '9961265/99', by: 'Practice Recorder', at: '2026-10-08T05:00:00.000Z'}};
      const html = vms913Html(vms913Boards()); S.vmsboard = keep; const d = document.createElement('div'); d.innerHTML = html; const o = d.querySelector('[data-vms913-orphan="VMS99"]'); return o ? o.textContent.replace(/\s+/g, ' ') : null; });
    ok('a record for a board no longer on the contract is shown, with its line, who and when', orph && /OLD99/.test(orph) && /9961265\/99/.test(orph) && /Practice Recorder/.test(orph), orph);
    // import: the collection is checked
    const imp = await p.evaluate(() => { const bad = validateRecords({vmsboard: {VMS12: {co: null, fleet: 'F12', rego: 'ABC123', on: 'T0103', by: 'X', at: '2026-10-08T05:00:00.000Z'}}});
      const worse = validateRecords({vmsboard: {VMS99: {rego: 'X'}, VMS12: {rego: 'ab-12', fleet: 'BAD FLEET!', on: 'WC09'}}}); return {good: bad, worse}; });
    ok('an import checks vmsboard: a good entry passes; an unknown board, a bad rego, a bad fleet number and a delivery that is not VMS are refused, in words',
      imp.good.length === 0 && ['is not a board on the contract', 'the rego is not', 'the fleet number does not', 'is not a VMS delivery'].every(w => imp.worse.some(x => x.includes(w))) && !imp.worse.some(x => /unknown/i.test(x)), imp);

    // (a)-(c) THE BOARDS BY NAME on every surface that shows a VMS delivery: T0103 is VMS09 and VMS10
    const sur = await p.evaluate(([W, WORD]) => { const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
      const A = k => allAssets().find(x => x.key === k), a = A('T0103'), t1 = A('T0001'), t158 = A('T0158'), wc = A('WC09');
      const d = programmeDays().find(x => x.iso === '2026-10-08'), loads = dpLoads(d), g = loads.find(x => (x.rows || []).some(r => r.a.key === 'T0103')), gw = loads.find(x => (x.rows || []).some(r => r.a.key === 'WC09'));
      const r103 = d.deliveries.find(x => x.a.key === 'T0103'), ev = (a.events || []).filter(e => e.movement !== 'remove');
      const m = daily821Model('2026-10-08'), row = m.loads.flatMap(l => l.rows).find(r => r.key === 'T0103'), roww = m.loads.flatMap(l => l.rows).find(r => r.key === 'WC09');
      const has = s => strip(s).includes(W);
      const dcH = deliveryCard(a), pillsOf = x => [...new DOMParser().parseFromString(driverCard(x), 'text/html').querySelectorAll('.dcpills > *')].map(e => e.textContent.replace(/\s+/g, ' ').trim());
      const cell = (dpTruck(g, 'drv').match(/<td>(?:(?!<td>)[\s\S])*?data-vms913-truck="T0103"[\s\S]*?<\/td>/) || [''])[0];
      return {
        loadCard: has(loading872AssetHtml(a)), deliveryCard: has(dayCards([r103], 'deliveries')), everyDay: has(dayRows([r103], 'deliveries')) && !/vms913/.test(dayRows(d.deliveries.filter(x => x.a.key === 'WC09'), 'deliveries')),
        drawer: has(dcH) && /vms913load dcl913/.test(dcH) && !/class="vms913load dcard"|vms913load tl"|vms913load row"|vms913load dc"/.test(dcH + loading872AssetHtml(a) + bookingNosLine801(a)), drawerChip: (dcH.match(/data-vms913-line=/g) || []).length,
        pills103: pillsOf(a), pills1: pillsOf(t1), dropSheet: has(dropPage(a, ev, 1, 1, d, 'deliveries')), drivers: has(dpPage(d, g, 'drv', 1, loads.length)), install: has(dpPage(d, g, 'ins', 1, loads.length)),
        cell: has(cell) && /Booked \/ recorded numbers/.test(dpTruck(g, 'drv')), oldTruckLines: /dp-lines" data-vms913-truck/.test(dpTruck(g, 'drv')),
        daily: !!row && row.notes[0] === 'Boards: ' + W + ' (' + WORD + ')' && has(daily821Html(m, {name: 'Practice'}, 1)),
        sms: dropSmsText(a), what: text747What(a), longText: dropText(a, {}).split('\n').find(l => /^Boards: /.test(l)) || null,
        t0001load: strip(loading872AssetHtml(t1)), t0001drop: strip(dropText(t1, {})).match(/Boards: [^\n]*?(?= Due|$)/) && dropText(t1, {}).split('\n').find(l => /^Boards/.test(l)),
        t0158: /VMS boards not named yet/.test(strip(loading872AssetHtml(t158))) && /VMS boards not named yet/.test(strip(driverCard(t158))) && /Boards: not named yet/.test(dropSmsText(t158)),
        others: !/vms913|Boards:/.test(loading872AssetHtml(wc) + bookingNosLine801(wc) + driverCard(wc) + deliveryCard(wc) + dropText(wc, {}) + dropSmsText(wc) + dpTruck(gw, 'drv')) && !/^Boards/.test((roww && roww.notes[0]) || '')};
    }, [W103, WORD]);
    ok('Timeline load card for T0103 names VMS09 and VMS10 with fleet number and rego', sur.loadCard, W103);
    ok('delivery card (the Timeline load opened) for T0103 names both boards', sur.deliveryCard);
    ok('the Timeline\'s "Every day" row for T0103 names both boards (WC09\'s rows untouched)', sur.everyDay);
    ok("drawer Delivery card names both boards in its own class (dcl913, not the page's .dcard), and its rental lines carry no repeat chip", sur.drawer && sur.drawerChip === 0, {drawer: sur.drawer, chips: sur.drawerChip});
    ok("driver drop card (T0103): one pill per board, his word as one small note naming the boards, the remaining asset pill kept",
      sur.pills103[0] === 'VMS09 (Coates 1211404 · rego not given · asset no. also on T0001 - to confirm)' && sur.pills103[1] === 'VMS10 (PremAir Hire 120T · rego V14221)' && sur.pills103[2] === "VMS09 and VMS10: " + WORD && sur.pills103.includes('Asset sub-17093'), sur.pills103);
    ok('driver drop card (T0001): no plain asset pill repeats a board pill, and no wrong "and N more"', sur.pills1.filter(x => /^Asset /.test(x)).length === 0 && !sur.pills1.some(x => /and \d+ more/.test(x)) && sur.pills1.filter(x => /\(Coates · rego not given/.test(x)).length === 8, sur.pills1);
    ok('printed drop sheet (run sheet) names both boards', sur.dropSheet);
    await p.evaluate(() => openAsset('T0103')); await p.waitForTimeout(1200);
    const pw = await p.evaluate(() => { const vw = document.documentElement.clientWidth; return [...document.querySelectorAll('#drawer [data-vms913-pill]')].filter(e => e.getBoundingClientRect().width > 0).map(e => { const r = e.getBoundingClientRect(), c = e.closest('.dcpills').getBoundingClientRect(); return {t: e.textContent.slice(0, 30), right: Math.round(r.right), box: Math.round(c.right), vw}; }); });
    await p.evaluate(() => { const c = document.querySelector('#dclose'); if (c) c.click(); });
    ok('the board pills on the drawn driver drop card wrap inside the card (nothing cut off)', pw.length >= 2 && pw.every(x => x.right <= x.box + 1 && x.right <= x.vw), pw);
    ok('Drivers PDF and Install PDF pages for the T0103 truck name both boards, in the booked / recorded numbers cell (not a separate block)', sur.drivers && sur.install && sur.cell && !sur.oldTruckLines, {drivers: sur.drivers, install: sur.install, cell: sur.cell});
    ok("installers' daily page carries the boards as T0103's first note", sur.daily);
    ok('driver text (short): the boards on their own line, rego only where given, the Delivery details link kept; the map-picture title (text747What) untouched',
      /\nBoards: VMS09[^\n]*VMS10[^\n]*V14221/.test(sur.sms) && !/rego not given/.test(sur.sms) && /Delivery details: /.test(sur.sms) && !/Boards|VMS09/.test(sur.what), {sms: sur.sms.split('\n').slice(0, 3), what: sur.what});
    ok('driver text (full details) carries a Boards line', sur.longText === 'Boards: ' + W103 + ' (' + WORD + ')', sur.longText);
    ok('T0001: the load card counts its eight Coates boards against the asset numbers shown instead of repeating them; the twin board is named',
      /Boards 1211404 \(Coates · rego not given · asset no\. also on T0103 - to confirm\) · 7 Coates boards by the asset nos\. shown \(rego not given\)/.test(sur.t0001load), sur.t0001load);
    ok('a VMS delivery with no board linked says "boards not named yet" (T0158) - nothing guessed', sur.t0158);
    ok('a delivery that is not VMS (WC09) is untouched on every surface', sur.others);
    // the driver's short text for every VMS delivery, today and with each delivery's full count of boards linked (in memory only)
    const sms = await p.evaluate(() => { const A = k => allAssets().find(x => x.key === k), out = [];
      const one = (tag) => vms913PlantLines().forEach(l => { const a = A(vms913ShownKey(l.key)) || A(l.key); if (!a) return; const t = dropSmsText(a), sh = smsShape(t); out.push({tag, key: a.key, units: sh.units, parts: sh.parts, len: t.length, boards: (t.split('\n').find(x => /^Boards/.test(x)) || null), link: /Delivery details: /.test(t)}); });
      one('today');
      const keep = S.vmsboard, bs = vms913Boards().filter(b => !['VMS09', 'VMS10'].includes(b.key)), sim = {}; let i = 0;
      [['T0158', 9], ['T0159', 5], ['T0128', 2]].forEach(([t, n]) => { for (let k = 0; k < n && i < bs.length; k++, i++) sim[bs[i].key] = {co: null, fleet: 'F' + bs[i].key.slice(3), rego: 'R' + bs[i].key.slice(3) + 'ABC', on: t, line: bs[i].contract + '/' + bs[i].line, by: 'Probe', at: '2026-10-08T09:00:00.000Z'}; });
      S.vmsboard = sim; one('full counts'); const counts = {T0158: vms913BoardsOn(A('T0158')).length, T0159: vms913BoardsOn(A('T0159')).length, T0128: vms913BoardsOn(A('T0128')).length}; S.vmsboard = keep; return {out, counts}; });
    const over = sms.out.filter(x => x.units > 459 || x.parts > 3 || x.len > 480);
    ok('the short text for each of the 7 VMS deliveries stays within 459 units, 3 texts and 480 characters - today, and with T0158 9, T0159 5 and T0128 2 boards linked (in memory only)',
      sms.out.length === 14 && over.length === 0 && sms.counts.T0158 === 9 && sms.counts.T0159 === 5 && sms.counts.T0128 === 2 && sms.out.every(x => x.boards), {over, counts: sms.counts, rows: sms.out.map(x => x.tag + ' ' + x.key + ' ' + x.units + '/' + x.parts + ' ' + x.boards)});
    // the open Timeline load: the boards line shows once (the load card's), not again in the delivery card under it
    const once = await p.evaluate(() => { const d = programmeDays().find(x => x.iso === '2026-10-08'), r = d.deliveries.find(x => x.a.key === 'T0103');
      const box = document.createElement('div'); box.className = 'ld'; box.innerHTML = loading872AssetHtml(r.a) + dayCards([r], 'deliveries'); document.querySelector('main').appendChild(box);
      const vis = [...box.querySelectorAll('[data-vms913-load]')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0).length, all = box.querySelectorAll('[data-vms913-load]').length; box.remove(); return {vis, all}; });
    ok('an opened Timeline load shows the boards line once (the delivery card\'s copy is hidden inside the load)', once.all === 2 && once.vis === 1, once);
    // the Timeline as drawn: the T0103 load card on 8 Oct
    await p.evaluate(() => go('timeline')); await p.waitForTimeout(2500);
    const tlDom = await p.evaluate(() => { const e = document.querySelector('#pane-timeline [data-vms913-load="T0103"]'); return e ? e.textContent.replace(/\s+/g, ' ') : null; });
    ok('the Timeline shows the boards on the T0103 load card', tlDom && tlDom.includes(W103), tlDom);
    if (tlDom) { const sh3 = await viewShot(p, `timeline_T0103_${TAG}.png`, '#pane-timeline [data-vms913-load="T0103"]'); ok('screenshot of the T0103 load card, no dollar figure in frame', !sh3.dollars); }
    // the drawer, as drawn: the boards line is not a driver-card box
    await p.evaluate(() => openAsset('T0103')); await p.waitForTimeout(1500);
    const dst = await p.evaluate(() => { const d = document.querySelector('#drawer'); [...d.querySelectorAll('details')].forEach(x => x.open = true); const L = d.querySelector('[data-vms913-load]'); if (!L) return null; const cs = getComputedStyle(L);
      return {cls: L.className, border: cs.borderTopWidth, radius: cs.borderTopLeftRadius, shadow: cs.boxShadow, margin: cs.marginBottom, text: L.textContent.replace(/\s+/g, ' ')}; });
    ok("the drawer's boards line keeps its own look (no card border, radius, shadow or margin from the page's .dcard)", dst && /dcl913/.test(dst.cls) && !/\bdcard\b/.test(dst.cls) && dst.border === '0px' && dst.radius === '0px' && dst.shadow === 'none' && dst.margin === '0px', dst);
    await p.evaluate(() => { const c = document.querySelector('#dclose'); if (c) c.click(); });
    await p.evaluate(() => go('today')); await p.waitForTimeout(2000);
    info('Today: boards lines drawn on Today for T0103: ' + await p.evaluate(() => document.querySelectorAll('#pane-today [data-vms913-load="T0103"]').length) + ". Today's own delivery list is NOT DONE in this release (Today does not draw loads with the renderers wrapped here).");
    const quiet = await p.evaluate(() => JSON.stringify(S.vmsboard || {}));
    await p.waitForTimeout(1500);
    ok('opening, viewing and printing wrote nothing', s.counts.blocked === 0 && ctl.captured.length === 0 && quiet === '{}', {blocked: s.counts.blocked, captured: ctl.captured.length, vmsboard: quiet});
    ok('session A: no page errors', errs.length === 0 && s.errors.length === 0, errs.concat(s.errors));
  } finally { await s.browser.close(); }
}

// B. DARK MODE: the register (and the form) readable on a dark-mode phone and laptop
async function sessionDark() {
  const {s, p, ctl, errs} = await rig({edit: true, dark: true});
  try {
    await p.evaluate(() => { S.operator = 'Practice Editor'; });
    await showVms(p);
    const cR = await p.evaluate(CONTRAST, '[data-vms913]');
    ok('dark mode: no text in the register or its form is under 4.5:1 (3:1 large)', cR.n > 50 && cR.nLow === 0, cR);
    const col = await p.evaluate(() => { const g = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).color + ' on ' + getComputedStyle(e.closest('details')).backgroundColor : null; }; return {dark: matchMedia('(prefers-color-scheme: dark)').matches, pane: document.getElementById('pane-plant').className, board: g('[data-vms913-row="VMS09"] .vms913c.b b'), v10: getComputedStyle(document.querySelector('[data-vms913-row="VMS10"]')).backgroundColor}; });
    info('dark colours', col);
    for (const [sel, nm, b] of [['[data-vms913] > summary', 'top', 'start'], ['[data-vms913-row="VMS10"]', 'vms10', 'center'], ['[data-vms913-row="VMS20"]', 'end', 'center'], ['[data-vms913-form]', 'form', 'center']]) {
      const sh = await viewShot(p, `dark_${nm}_${TAG}.png`, sel, b); if (sh.dollars) ok('dark screenshot ' + nm + ' has no dollar figure', false); }
    ok('dark session: no writes, no page errors', ctl.captured.length === 0 && s.counts.blocked === 0 && errs.length === 0 && s.errors.length === 0, {captured: ctl.captured.length, errs});
  } finally { await s.browser.close(); }
}

// C. THE EDITOR (practice): the form, validation, one save, a save that changes nothing, Save waiting for the record
async function sessionEdit() {
  const before = recordNow();
  const {s, p, ctl, errs} = await rig({edit: true});
  try {
    await p.evaluate(() => { S.operator = 'Practice Editor'; });
    await p.waitForTimeout(4000);
    const quietWrites = ctl.captured.length;
    await showVms(p);
    const money0 = await p.evaluate(() => holdAssets(() => JSON.stringify({M: moneySummary(), P: pl770Model(), R: recon888Model().ties.map(t => t.ok)})));
    const form = await p.evaluate(() => { const f = document.querySelector('[data-vms913-form]'); if (!f) return null; const hs = [...f.querySelectorAll('input,select,button')].map(e => Math.round(e.getBoundingClientRect().height)), on = f.querySelector('#vms913On');
      const vis = e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
      return {heights: hs, on: !!on && [...on.options].map(o => o.value).join(',') === ',T0001,T0103,T0128,T0158,T0159,T0169,T0170', opts: [...on.options].map(o => o.textContent), edits: document.querySelectorAll('[data-vms913-edit]').length,
        editsShown: [...document.querySelectorAll('[data-vms913-edit]')].filter(vis).map(e => Math.round(e.getBoundingClientRect().height)), save: !f.querySelector('[data-vms913-save]').disabled}; });
    ok('the edit link shows one small form with 44 px taps (board, whose, fleet no., rego, On delivery, save); Change per board on a laptop, the board picker alone on a phone',
      form && form.heights.length === 6 && form.heights.every(h => h >= 44) && form.on && form.edits === 23 && (MOB ? form.editsShown.length === 0 : form.editsShown.length === 23 && form.editsShown.every(h => h >= 44)) && form.save, form);
    ok('the On delivery options are short (no year) and say a relocation', form.opts.every(o => !/2026/.test(o)) && form.opts.some(o => /T0159 - 19 Oct - VMS × 5 · Relocate/.test(o)), form.opts);
    // Save waits for the shared record
    const wait = await p.evaluate(() => { const keep = SYNC.first; SYNC.first = new Set([...keep].filter(x => x !== 'vmsboard')); const ready = vms913Ready(), d = document.createElement('div'); d.innerHTML = vms913Html(vms913Boards());
      const dis = d.querySelector('[data-vms913-save]').disabled, ret = vms913Save('VMS12', '', 'F12', 'ABC12', ''), rec = JSON.stringify(S.vmsboard || {}); SYNC.first = keep; return {ready, dis, ret, rec, readyAfter: vms913Ready()}; });
    ok('Save is disabled, and a save refused, until the shared record has arrived', wait.ready === false && wait.dis === true && wait.ret === false && wait.rec === '{}' && wait.readyAfter === true, wait);
    // validation: refused, said once (in the form, not again as a toast), nothing recorded
    const bad = [];
    for (const [co, fl, rg, why, on] of [['', 'F12', 'AB-12', 'rego with a dash'], ['', 'F12', 'TOOLONG1234', 'rego of 11'], ['', 'F12', 'AB 12', 'rego with a space'], ['', 'BAD FLEET!', 'ABC123', 'fleet with marks'], ['', 'THIRTEENCHARS', 'ABC123', 'fleet of 13'], ['<b>x</b>', 'F12', 'ABC123', 'company with markup'], ['', '', '', 'nothing changed'], ['', 'F12', 'V14221', 'rego already on VMS10'], ['', 'F12', 'ABC123', 'a third board on T0103 (VMS x 2)', 'T0103']]) {
      await p.selectOption('#vms913Board', 'VMS12'); await p.fill('#vms913Co', co); await p.fill('#vms913Fleet', fl); await p.fill('#vms913Rego', rg); await p.selectOption('#vms913On', on || '');
      const f0 = await flashN(p); await p.click('[data-vms913-save]'); await p.waitForTimeout(250);
      bad.push({why, msg: await p.evaluate(() => document.querySelector('.vms913msg').textContent), toast: await flashSince(p, f0), rec: await p.evaluate(() => JSON.stringify(S.vmsboard || {}))}); }
    ok('validation refuses bad input, says so once in the form, and records nothing', bad.length === 9 && bad.every(b => b.msg && !b.toast && b.rec === '{}') && /T0103 carries 2 boards on the schedule and already has VMS09, VMS10/.test(bad[8].msg) && /Nothing changed on VMS12/.test(bad[6].msg), bad);
    const badOn = await p.evaluate(() => { const b = vms913Boards().find(x => x.key === 'VMS12'); return [vms913Check(b, '', '', 'ABC1', 'T9999').err, vms913Check(b, '', '', 'ABC1', 'WC09').err, vms913Check(b, '', '', 'ABC1', '<x>').err]; });
    ok('validation refuses an On delivery that is not one of the VMS deliveries', badOn.every(e => /is not one of the VMS deliveries on this page/.test(e || '')), badOn);
    // Save with nothing changed: his word stays his word; a contract-only board writes nothing
    await p.selectOption('#vms913Board', 'VMS10'); const nA = ctl.captured.length; await p.click('[data-vms913-save]'); await p.waitForTimeout(1500);
    await p.selectOption('#vms913Board', '1211370'); await p.click('[data-vms913-save]'); await p.waitForTimeout(1500);
    const noop = {writes: ctl.captured.slice(nA).length, v10: await rowText(p, 'VMS10'), msg: await p.evaluate(() => document.querySelector('.vms913msg').textContent), rec: await p.evaluate(() => JSON.stringify(S.vmsboard || {}))};
    ok("Save with nothing changed writes nothing: VMS10 stays the project manager's word, 1211370 freezes nothing", noop.writes === 0 && noop.rec === '{}' && /the project manager's word/.test(noop.v10) && /Nothing changed on 1211370/.test(noop.msg), noop);
    await p.waitForTimeout(1500);
    const preWrites = ctl.captured.length;
    // one good save: VMS12 (a Coates board), from the form
    await p.selectOption('#vms913Board', 'VMS12'); await p.fill('#vms913Fleet', 'F12'); await p.fill('#vms913Rego', 'abc123'); await p.click('[data-vms913-save]');
    await p.waitForTimeout(6000);
    const vb = ctl.captured.filter(c => c.method === 'PUT' && /^\/api\/doc\/vmsboard\//.test(c.url));
    const ids = [...new Set(vb.map(c => c.url))], body = vb.length ? JSON.parse(vb[0].body) : {};
    ok('a simulated editor save writes exactly one document to vmsboard, with who and when, only the changed fields', ids.length === 1 && ids[0] === '/api/doc/vmsboard/VMS12' && vb.every(c => c.body === vb[0].body) && body.by === 'Practice Editor' && !isNaN(Date.parse(body.at)) && body.rego === 'ABC123' && body.fleet === 'F12' && body.co === null && body.on === null && body.line === '9961265/16' && body._k === 'VMS12', {ids, body, attempts: vb.length});
    const otherIds = [...new Set(ctl.captured.filter(c => !/\/vmsboard\//.test(c.url)).map(c => c.url))];
    ok("the only other writes are the page's own stamp and name for that document; nothing was written before it", quietWrites === 0 && preWrites === 0 && otherIds.every(u => /^\/api\/doc\/(stamps|by)\/vmsboard~2f~VMS12$/.test(u)), {quietWrites, preWrites, otherIds});
    ok('after the save the form shows what was saved, rego in capitals', await p.evaluate(() => document.querySelector('#vms913Rego').value === 'ABC123' && document.querySelector('#vms913Board').value === 'VMS12'));
    const r12 = await rowText(p, 'VMS12');
    ok('the register shows the save as on this device and not yet on the shared record (the write was aborted), never as recorded', /F12/.test(r12) && /ABC123/.test(r12) && /saved on this device by Practice Editor/.test(r12) && /not on the shared record yet/.test(r12) && !/recorded/.test(r12), r12);
    const sh2 = await viewShot(p, `register_editor_${TAG}.png`, '[data-vms913-form]'); ok('screenshot of the editor form (practice capability), no dollar figure in frame', !sh2.dollars);
    const money1 = await p.evaluate(() => holdAssets(() => JSON.stringify({M: moneySummary(), P: pl770Model(), R: recon888Model().ties.map(t => t.ok)})));
    ok('money identical before and after the save (P&L summary, P&L, tie-outs)', money0 === money1, {len: money0.length});
    const rec = recordNow();
    ok('the captured save never reached the service (fresh read has no vmsboard)', vmsDocs(before).length === 0 && vmsDocs(rec).length === 0, {before: before.version, after: rec.version});
    ok('session C: no page errors; the harness blocked nothing (every write was captured in page.route)', errs.length === 0 && s.errors.length === 0 && s.counts.blocked === 0, {errs, e: s.errors, c: s.counts});
  } finally { await s.browser.close(); }
}

// D. ANOTHER DEVICE: an incoming record shows without a reload; a stale form never loses it; a refused write is said
async function sessionOther() {
  const before = recordNow();
  const {s, p, ctl, errs} = await rig({edit: true});
  try {
    await p.evaluate(() => { S.operator = 'Practice Editor'; });
    await showVms(p);
    const r0 = await rowsOf(p); ok('session D opens with the preload on VMS10', (r0.find(r => r.key === 'VMS10') || {}).src === 'word');
    // the editor has VMS13 open in the form and T0103 open in the drawer
    await p.evaluate(() => { document.querySelector('[data-vms913-edit="VMS13"]').click(); document.activeElement && document.activeElement.blur(); });
    const formBefore = await p.evaluate(() => ({fleet: document.querySelector('#vms913Fleet').value, rego: document.querySelector('#vms913Rego').value}));
    await p.evaluate(() => { openAsset('T0103'); document.activeElement && document.activeElement.blur(); }); await p.waitForTimeout(800);
    ctl.inject = {VMS10: {co: 'Practice Co', fleet: 'P913', rego: 'PRAC913', on: 'T0103', line: '9961265/13', by: 'Other Device', at: '2026-10-08T05:10:00.000Z', _k: 'VMS10'},
      VMS13: {co: null, fleet: 'R13', rego: 'RPM13', on: null, line: '9961265/18', by: 'Other Device', at: '2026-10-08T05:11:00.000Z', _k: 'VMS13'},
      VMS09: {co: null, fleet: null, rego: null, on: 'none', line: '9961265/12', by: 'Other Device', at: '2026-10-08T05:12:00.000Z', _k: 'VMS09'}};
    const t0 = Date.now(); let shown = null;
    try { await p.waitForFunction(() => { const r = document.querySelector('[data-vms913-row="VMS13"]'), d = document.querySelector('#drawer [data-vms913-load="T0103"]'); return r && /RPM13/.test(r.textContent) && d && /PRAC913/.test(d.textContent); }, null, {timeout: 30000}); shown = Date.now() - t0; } catch (e) { shown = null; }
    ok('an incoming record from another device shows in the register and the open drawer with no reload and no manual redraw', shown !== null, {ms: shown});
    const formAfter = await p.evaluate(() => ({board: document.querySelector('#vms913Board').value, fleet: document.querySelector('#vms913Fleet').value, rego: document.querySelector('#vms913Rego').value, msg: document.querySelector('.vms913msg').textContent}));
    ok('the open form refills from the record and says the board was changed on another device', formBefore.fleet === '' && formBefore.rego === '' && formAfter.board === 'VMS13' && formAfter.fleet === 'R13' && formAfter.rego === 'RPM13' && /VMS13 was changed on another device by Other Device/.test(formAfter.msg), {formBefore, formAfter});
    const t10 = await rowText(p, 'VMS10'), t13 = await rowText(p, 'VMS13');
    ok("a record document overrides the project manager's word and shows as recorded (it is on the shared record)", /Practice Co/.test(t10) && /P913/.test(t10) && /PRAC913/.test(t10) && !/V14221|120T|PremAir/.test(t10) && /recorded by Other Device/.test(t10) && /^.*RPM.*R13.*RPM13/.test(t13), {t10, t13});
    const links = await p.evaluate(() => { const A = k => allAssets().find(x => x.key === k); return {t103: vms913LoadOf(A('T0103')).text, on09: (document.querySelector('[data-vms913-row="VMS09"] .vms913c.o') || {}).textContent}; });
    ok("a record's On delivery wins: VMS09 taken off T0103 by the record; every surface follows", links.t103 === 'VMS10 (Practice Co P913 · rego PRAC913)' && /not named yet/.test(links.on09 || '') && /taken off by the record/.test(links.on09 || ''), links);
    // the editor now changes only On delivery to T0158 and saves: the other device's fleet number and rego are kept
    await p.evaluate(() => { const c = document.querySelector('#dclose'); if (c) c.click(); });
    await p.selectOption('#vms913On', 'T0158');
    const n0 = ctl.captured.length; await p.click('[data-vms913-save]'); await p.waitForTimeout(6000);
    const vb = ctl.captured.slice(n0).filter(c => c.method === 'PUT' && /^\/api\/doc\/vmsboard\//.test(c.url)), body = vb.length ? JSON.parse(vb[0].body) : {};
    ok("saving only On delivery keeps the other device's fleet number and rego (no lost update)", [...new Set(vb.map(c => c.url))].join() === '/api/doc/vmsboard/VMS13' && body.fleet === 'R13' && body.rego === 'RPM13' && body.on === 'T0158' && body.co === null && body.by === 'Practice Editor', {body});
    // a stale form: the record changes while the page has not redrawn (in memory only) - the save is refused, said, nothing sent
    await p.evaluate(() => { document.querySelector('#vms913Board').value = 'VMS15'; document.querySelector('#vms913Board').onchange(); });
    await p.fill('#vms913Rego', 'ABC15');
    await p.evaluate(() => { S.vmsboard = Object.assign({}, S.vmsboard, {VMS15: {co: null, fleet: 'X15', rego: 'OTHER15', on: null, line: '9961265/21', by: 'Other Device', at: '2026-10-08T05:20:00.000Z'}}); });
    const n1 = ctl.captured.length; await p.click('[data-vms913-save]'); await p.waitForTimeout(2500);
    const stale = {sent: ctl.captured.slice(n1).filter(c => /vmsboard/.test(c.url)).length, msg: await p.evaluate(() => document.querySelector('.vms913msg').textContent), rego: await p.evaluate(() => document.querySelector('#vms913Rego').value), fleet: await p.evaluate(() => document.querySelector('#vms913Fleet').value), rec: await p.evaluate(() => S.vmsboard.VMS15.rego)};
    ok('a save from a stale form is refused and says so; the form shows the other device\'s fleet number with the editor\'s own rego kept; nothing is sent', stale.sent === 0 && /VMS15 was changed on another device by Other Device/.test(stale.msg) && stale.fleet === 'X15' && stale.rego === 'ABC15' && stale.rec === 'OTHER15', stale);
    await p.evaluate(() => { const v = Object.assign({}, S.vmsboard); delete v.VMS15; S.vmsboard = v; vms913Pick('VMS14'); render(); });
    // a write the service refuses (403): said out loud, the page goes view only, and the row is not presented as recorded
    ctl.refuse = /vmsboard(\/|~2f~)VMS14$/;
    await showVms(p); await p.evaluate(() => { const sel = document.querySelector('#vms913Board'); sel.value = 'VMS14'; sel.onchange(); });
    await p.fill('#vms913Rego', 'ABC14');
    const f1 = await flashN(p); await p.click('[data-vms913-save]'); ctl.view403 = true; await p.waitForTimeout(9000);
    const fl = await flashSince(p, f1), row14 = await rowText(p, 'VMS14');
    const st = await p.evaluate(() => ({cap: capability(), ro: SYNC.readonly, rec14: S.vmsboard && S.vmsboard.VMS14 ? S.vmsboard.VMS14.rego : null}));
    ok('a refused write is said out loud and the page goes view only', /View only/.test(fl) && st.cap === 'view' && st.ro === true, {fl, st});
    ok('after a refused write the register does not present the refused rego as recorded: it says the shared record did not take it', !st.rec14 || (/ABC14/.test(row14) && /the shared record did not take it/.test(row14) && !/recorded/.test(row14)), {row14, st});
    const rec = recordNow();
    ok('the live record holds no vmsboard document before or after (captured writes never reached the service)', vmsDocs(before).length === 0 && vmsDocs(rec).length === 0, {before: before.version, after: rec.version});
    ok('session D: no page errors; the harness blocked nothing', errs.length === 0 && s.errors.length === 0 && s.counts.blocked === 0, {errs, e: s.errors, c: s.counts});
  } finally { await s.browser.close(); }
}

(async () => {
  if (!PAGE || !fs.existsSync(PAGE)) throw new Error('PAGE must name the build');
  fs.mkdirSync(EVID, {recursive: true});
  const only = process.env.ONLY;
  if (!only || only === 'A') await sessionA();
  if (!only || only === 'dark') await sessionDark();
  if (!only || only === 'edit') await sessionEdit();
  if (!only || only === 'other') await sessionOther();
  const n = checks.filter(c => c.pass).length; console.log(`RESULT ${n}/${checks.length} ${TAG}`);
  process.exit(n === checks.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(2); });
