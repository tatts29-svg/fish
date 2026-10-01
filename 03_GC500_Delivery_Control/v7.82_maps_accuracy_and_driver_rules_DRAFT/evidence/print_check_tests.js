// v7.82 - the check before driver sheets print. Author: Andrew Fisher. Read-only: GETs only, writes aborted by the harness, print stubbed.
//   PAGE=<built page> [MOB=1] [OUT=<json>] node print_check_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path');
(async () => {
  const MOB = !!process.env.MOB, s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}), p = s.page;
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)});
  await p.waitForFunction(() => typeof dpPrint === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  const iso = await p.evaluate(() => { try { localStorage.removeItem('gc500.printedBy'); } catch (e) {}
    const d = programmeDays().find(x => x.iso >= '2026-10-02' && dpLoads(x).length) || programmeDays().find(x => dpLoads(x).length); location.hash = '#day/' + d.iso; return d.iso; });
  const ALL = `.dplate [data-pdf7="drivers"][data-iso="${iso}"]:not([data-only])`;
  await p.waitForSelector('.dplate', {timeout: 60000});
  // the way a person does it: Drivers ▾, then All loads
  await p.evaluate(() => { const sm = [...document.querySelectorAll('.dplate details.dpm > summary')].find(x => /Drivers/.test(x.textContent)); if (sm) sm.click(); });
  await p.click(ALL);
  await p.waitForSelector('#drv782', {timeout: 10000});
  const shown = await p.evaluate(() => { const b = document.querySelector('#drv782'); const r = b.querySelector('.box').getBoundingClientRect();
    return {title: b.querySelector('h2').textContent, checks: b.querySelectorAll('input[type=checkbox]').length, goDisabled: b.querySelector('.b-go').disabled, facts: b.querySelector('.facts').textContent.trim().replace(/\s+/g, ' ').slice(0, 300), note: /Each driver sheet comes with an A4 location sign for every item on it\. Laminate it and fix it to the item/.test(b.textContent), rep: (b.querySelector('.facts.rep') || {}).textContent || '',
      panel: !!document.querySelector('#pdf7'), fits: r.left >= 0 && r.right <= innerWidth + 1, overflowX: document.documentElement.scrollWidth > innerWidth + 1}; });
  await p.screenshot({path: path.join(__dirname, 'print_check_' + (MOB ? 'phone' : 'desktop') + '.png')});
  ok('P1 Drivers ▾ > All loads opens the check first - no PDF is made yet', shown.title === 'Before these go to the drivers' && !shown.panel, JSON.stringify({title: shown.title, panel: shown.panel}));
  ok('P2 four plain checks and a name; the button is locked until all are done', shown.checks === 4 && shown.goDisabled, shown.checks + ' checks, locked ' + shown.goDisabled);
  ok('P3 the page states what it knows for these loads (drop-off pin and way in)', /Every item has firm directions|not ready to send/.test(shown.facts) && shown.note, shown.facts);
  ok('P4 fits the screen, no sideways scroll', shown.fits && !shown.overflowX, JSON.stringify({fits: shown.fits, overflowX: shown.overflowX}));
  await p.evaluate(() => { const cks = [...document.querySelectorAll('#drv782 input[type=checkbox]')]; cks.slice(0, 3).forEach(c => c.click()); const n = document.querySelector('#drv782n'); n.value = 'Test Person'; n.dispatchEvent(new Event('input')); });
  const part = await p.evaluate(() => document.querySelector('#drv782 .b-go').disabled);
  await p.evaluate(() => document.querySelector('#drv782 input[data-c="3"]').click());
  const all = await p.evaluate(() => document.querySelector('#drv782 .b-go').disabled);
  ok('P5 every check must be ticked (three of four stays locked; four unlocks)', part === true && all === false, 'three: ' + part + ' · four: ' + all);
  await p.click('#drv782 .b-go');
  await p.waitForFunction(() => window.__pdf707 && window.__pdf707.state && window.__pdf707.state !== 'making', null, {timeout: 240000}).catch(() => null);
  const made = await p.evaluate(() => ({gone: !document.querySelector('#drv782'), panel: !!document.querySelector('#pdf7'), state: (window.__pdf707 || {}).state, remembered: localStorage.getItem('gc500.printedBy'), files: (PDF7.files || []).map(f => ({role: f.role, pages: f.pages, label: f.label}))}));
  ok('P6 after the check the driver PDFs are made', made.gone && made.panel && made.state === 'ready', JSON.stringify(made));
  // the same layout the PDFs are photographed from: every sheet carries the name and time
  const st = await p.evaluate(async iso => { try { pdf7Close(); } catch (e) {} const L = await pdf7Layout('drivers', iso, null); const pages = [...L.wrap.querySelectorAll('.dp-page')], s = pages.map(pg => (pg.querySelector('.dp782') || {}).textContent || ''); try { L.done && L.done(); } catch (e) {}
    return {pages: pages.length, stamped: s.filter(x => /^Checked by Test Person · \d\d [A-Z][a-z]{2} \d{4}, \d\d:\d\d AEST · drop-off, way in, times and order$/.test(x)).length, sample: s[0]}; }, iso);
  ok('P7 every driver sheet carries "Checked by <name> · <date, time>"', st.pages > 0 && st.stamped === st.pages, JSON.stringify(st));
  const files = made.files || [];
  const sg = await p.evaluate(async iso => { const d = programmeDays().find(x => x.iso === iso), loads = dpLoads(d); const L = await pdf7Layout('drivers', iso, null);
    const pg = [...L.wrap.querySelectorAll('.dp-page')], seq = pg.map(x => x.classList.contains('pl782') ? 'S:' + x.dataset.pl : 'D' + x.dataset.load);
    const signs = pg.filter(x => x.classList.contains('pl782')), fit = signs.every(x => x.scrollHeight <= x.clientHeight + 1 && [...x.querySelectorAll('.pl-ref')].every(r => r.scrollWidth <= r.clientWidth + 1));
    const want = loads.reduce((n, g) => n + (g.kind === 'removals' ? 0 : g.rows.reduce((m, r) => m + Math.max(1, (r.events || []).filter(e => e.movement !== 'remove').length), 0)), 0);
    const words = signs[0] ? signs[0].textContent.replace(/\s+/g, ' ') : ''; try { L.done && L.done(); } catch (e) {} return {seq, n: signs.length, want, fit, words}; }, iso);
  ok('P12 every driver sheet is followed by an A4 location sign for each item on it (deliveries), and every sign fits its page', sg.n > 0 && sg.n === sg.want && sg.fit && /^D1/.test(sg.seq[0]) && /Location reference/i.test(sg.words) && /Laminate this sign and fix it to the item/.test(sg.words), JSON.stringify(sg));
  const loadsFiles = files.filter(f => f.role === 'load'), allFile = files.find(f => f.role === 'all');
  ok('P13 each load PDF holds its sheet and its signs; the all-loads PDF holds every page', loadsFiles.length > 0 && loadsFiles.every(f => f.pages >= 2 && /location sign/.test(f.label)) && (!allFile || allFile.pages === sg.seq.length), JSON.stringify(files));
  ok('P8 the name is remembered on this device for next time', made.remembered === 'Test Person', made.remembered);
  await p.evaluate(() => { try { pdf7Close(); } catch (e) {} document.querySelectorAll('#drv782').forEach(e => e.remove()); });
  await p.evaluate(sel => document.querySelector(sel).click(), `.dplate [data-pdf7="drivers"][data-iso="${iso}"][data-only="0"]`); await p.waitForSelector('#drv782');
  const pre = await p.evaluate(() => document.querySelector('#drv782n').value);
  await p.click('#drv782 .b-no'); await new Promise(r => setTimeout(r, 1200));
  const no = await p.evaluate(() => ({open: !!document.querySelector('#drv782'), panel: !!document.querySelector('#pdf7')}));
  ok('P9 one load asks too; "Not yet" closes it and nothing is made; the name is already filled in', !no.open && !no.panel && pre === 'Test Person', JSON.stringify(Object.assign(no, {pre})));
  const ins = await p.evaluate(iso => { const bi = document.querySelector(`.dplate [data-pdf7="install"][data-iso="${iso}"]`); if (!bi) return null; bi.click(); const a = !!document.querySelector('#drv782'), panel = !!document.querySelector('#pdf7'); try { pdf7Close(); } catch (e) {} document.querySelectorAll('#drv782').forEach(e => e.remove()); return {asked: a, panel}; }, iso);
  const fx = await p.evaluate(iso => { document.querySelector(`.dplate [data-pdf7="drivers"][data-iso="${iso}"]:not([data-only])`).click(); const b = document.querySelector('#drv782 .fx782'); if (!b) return {none: true}; const k = b.dataset.k; b.click(); return {k, hash: location.hash, open: !!document.querySelector('#drv782')}; }, iso);
  await new Promise(r => setTimeout(r, 1500));
  const fx2 = await p.evaluate(() => ({drawer: !!document.querySelector('[data-entry-pin], .drawer.open, #drawer.open, [aria-label*="drawer" i]'), way: [...document.querySelectorAll('button')].some(b => /Pin the way in/.test(b.textContent))}));
  ok('P11 each red item is one tap from Edit: "Fix in Edit" closes the check and opens that item (drop-off and Pin the way in)', fx.none || (fx.hash === '#asset/' + fx.k && !fx.open && fx2.way), JSON.stringify(Object.assign(fx, fx2)));
  ok('P10 the install-team sheets are not held up by the driver check', ins && !ins.asked && ins.panel, JSON.stringify(ins));
  /* Codex review: the check is bound to the loads it covered and to what they said; every way in asks for it */
  const bind = await p.evaluate(async iso => { const d = programmeDays().find(x => x.iso === iso), n = dpLoads(d).length; if (n < 2) return {skip: true};
    DRV782_OK = {iso, by: 'Test Person', at: drvStamp782(), bad: 0, t: Date.now(), snaps: drvSnaps782(iso, 0)}; /* load 1 checked */
    const one = drvValid782(iso, [0]), other = drvValid782(iso, [1]), all = drvValid782(iso, dpLoads(d).map((g, i) => i));
    const L = await pdf7Layout('drivers', iso, 1); const st = [...L.wrap.querySelectorAll('.dp-page .dp782')].length; try { L.done && L.done(); } catch (e) {}
    /* a changed location after the check: the check no longer holds */
    const a = dpLoads(d)[0].rows[0].a, keep = S.delivery; const mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} }; S.delivery = Object.assign({}, keep || {}, {[a.key]: Object.assign({}, (keep || {})[a.key] || {}, {eta: '11:45'})}); mc();
    const changed = drvValid782(iso, [0]); S.delivery = keep; mc(); const back = drvValid782(iso, [0]);
    return {one, other, all, otherStamped: st, changed, back}; }, iso);
  ok('P14 a check covers only the loads it was done for: load 1 checked does not stamp load 2 or "all loads"', bind.skip || (bind.one && !bind.other && !bind.all && bind.otherStamped === 0), JSON.stringify(bind));
  ok('P15 a change after the check (a time asked for, here) voids it until it is checked again', bind.skip || (!bind.changed && bind.back), JSON.stringify(bind));
  const mk = await p.evaluate(async iso => { const keep = S.delivery, a = dpLoads(programmeDays().find(x => x.iso === iso))[0].rows[0].a, mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} };
    DRV782_OK = {iso, by: 'Test Person', at: drvStamp782(), bad: 0, t: Date.now(), snaps: drvSnaps782(iso, 0)};
    S.delivery = Object.assign({}, keep || {}, {[a.key]: Object.assign({}, (keep || {})[a.key] || {}, {eta: '11:45'})}); mc();
    let err = null; try { PDF7.job++; await pdf7Make('drivers', iso, 0, {say: () => {}}, PDF7.job); } catch (e) { err = String(e.message || e); } finally { S.delivery = keep; mc(); }
    return err; }, iso);
  ok('P16 the PDF maker checks again after it syncs: changed data stops it with a plain message', /something changed since the check/.test(mk || ''), mk);
  /* the confirm button looks again: a change while the check is open brings it back, as it stands now */
  await p.evaluate(iso => { DRV782_OK = null; document.querySelector(`.dplate [data-pdf7="drivers"][data-iso="${iso}"][data-only="0"]`).click(); }, iso); await p.waitForSelector('#drv782');
  const reopen = await p.evaluate(iso => { const cks = [...document.querySelectorAll('#drv782 input[type=checkbox]')]; cks.forEach(c => c.click()); const nm = document.querySelector('#drv782n'); nm.value = 'Test Person'; nm.dispatchEvent(new Event('input'));
    const a = dpLoads(programmeDays().find(x => x.iso === iso))[0].rows[0].a, mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} }; window.__keepD = S.delivery; S.delivery = Object.assign({}, S.delivery || {}, {[a.key]: Object.assign({}, (S.delivery || {})[a.key] || {}, {eta: '11:45'})}); mc();
    document.querySelector('#drv782 .b-go').click(); const again = !!document.querySelector('#drv782'), chg = !!document.querySelector('#drv782 .chg'), ok = !!DRV782_OK; S.delivery = window.__keepD; mc(); document.querySelectorAll('#drv782').forEach(e => e.remove()); try { pdf7Close(); } catch (e) {} return {again, chg, ok}; }, iso);
  ok('P17 a change while the check is open: pressing the button shows it again as it stands now - nothing is made', reopen.again && reopen.chg && !reopen.ok, JSON.stringify(reopen));
  /* a direct print link asks too */
  await p.evaluate(iso => { DRV782_OK = null; dpFromLink('drivers', iso, null); }, iso); await new Promise(r => setTimeout(r, 2500));
  const link = await p.evaluate(() => ({asked: !!document.querySelector('#drv782')}));
  await p.evaluate(() => { document.querySelectorAll('#drv782').forEach(e => e.remove()); try { dpBarClose(); } catch (e) {} });
  ok('P18 a direct print link (#print/drivers/…) asks for the check first', link.asked, JSON.stringify(link));
  ok('P19 the time on the sheet is the project time (Brisbane, AEST), whatever the device says', /^\d\d [A-Z][a-z]{2} \d{4}, \d\d:\d\d AEST$/.test(await p.evaluate(() => drvStamp782())), await p.evaluate(() => drvStamp782()));
  ok('E1 no page errors', !s.errors.length, JSON.stringify(s.errors).slice(0, 200));
  const passed = T.filter(t => t.pass).length;
  T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + ' — ' + t.detail));
  console.log(passed + '/' + T.length + ' ' + (MOB ? 'phone' : 'desktop') + ' · day ' + iso);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, day: iso, passed, of: T.length, tests: T}, null, 1));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})();
