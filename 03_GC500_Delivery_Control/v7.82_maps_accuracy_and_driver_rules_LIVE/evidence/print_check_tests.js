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
  /* Codex review 2: a confirmation covers the VALUES it was given (drop-off, way in, times, order), not just that each one
     is filled in - change one complete value to another complete value and the check must be asked for again.
     Synthetic values only (made-up points and times on one reference of the day), each put back straight after. */
  const cv = await p.evaluate(async iso => { const d = programmeDays().find(x => x.iso === iso), mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} };
    const loads = dpLoads(d); let li = -1, ri = -1;
    loads.some((g, i) => (g.rows || []).some((r, j) => r.a && !report782(r.a) && !masterUnit(r.a.key) && (li = i, ri = j, true)));
    if (li < 0) loads.some((g, i) => (g.rows || []).some((r, j) => r.a && !report782(r.a) && (li = i, ri = j, true)));
    if (li < 0) return {skip: 'no reference on this day with its own drop-off'};
    const a = loads[li].rows[ri].a, out = {ref: a.key, load: li + 1, master: !!masterUnit(a.key)};
    const arm = () => { mc(); DRV782_OK = {iso, by: 'Test Person', at: drvStamp782(), bad: 0, t: Date.now(), snaps: drvSnaps782(iso, li)}; };
    const valid = () => { mc(); return drvValid782(iso, [li]); };
    const pin = (lat, lon, at) => ({lat, lon, acc: 4, at, by: 'Test Person', n: 5});
    const T0 = '2026-10-02T00:00:00.000Z', T1 = '2026-10-02T00:05:00.000Z';
    /* the way in: one pinned point, then another */
    const kE = S.entries; S.entries = Object.assign({}, kE || {}, {[a.key]: pin(-27.9700, 153.4300, T0)}); arm(); const e0 = valid();
    S.entries = Object.assign({}, kE || {}, {[a.key]: pin(-27.9750, 153.4320, T1)}); out.wayIn = {held: e0, afterMove: valid()}; S.entries = kE; mc();
    /* the drop-off: one phone pin, then a newer one somewhere else (a master-held reference keeps the master's spot - nothing printed moves) */
    const kF = S.fixes; S.fixes = Object.assign({}, kF || {}, {[a.key]: pin(-27.9600, 153.4300, T0)}); arm(); const f0 = valid(), w0 = JSON.stringify(dpPos(a));
    S.fixes = Object.assign({}, kF || {}, {[a.key]: pin(-27.9610, 153.4310, T1)}); mc(); const moved = JSON.stringify(dpPos(a)) !== w0; out.drop = {held: f0, printedMoved: moved, afterMove: valid()}; S.fixes = kF; mc();
    /* the time and the carrier: a load time on the schedule, one valid time to another; a carrier, one name to another.
       The first day of the programme with a load time on it (this day may have none). */
    { let D = null, L = -1, ev = null;
      programmeDays().some(x => dpLoads(x).some((g, i) => (g.rows || []).some(r => { const e = (r.events || []).find(e => dpT(e.load_time) && String(e.carrier || '').trim()); if (e) { D = x; L = i; ev = e; return true; } })));
      if (!ev) out.loadTime = out.carrier = {skip: 'no load time anywhere in the programme'};
      else { const armD = () => { mc(); DRV782_OK = {iso: D.iso, by: 'Test Person', at: drvStamp782(), bad: 0, t: Date.now(), snaps: drvSnaps782(D.iso, L)}; }, validD = () => { mc(); return drvValid782(D.iso, [L]); };
        const k = ev.load_time, t = dpT(k), [h, m] = t.split(':').map(Number), nt = String((h + (m >= 30 ? 1 : 0)) % 24).padStart(2, '0') + ':' + (m >= 30 ? '00' : '30');
        armD(); const t0 = validD(); ev.load_time = nt; out.loadTime = {day: D.iso, from: k, to: nt, held: t0, afterChange: validD()}; ev.load_time = k; mc();
        const c = ev.carrier; armD(); const c0 = validD(); ev.carrier = c + ' X'; out.carrier = {day: D.iso, from: c, held: c0, afterChange: validD()}; ev.carrier = c; mc(); } }
    /* nothing changed: the check holds, and the snapshot is the same twice over */
    arm(); out.same = {held: valid(), twice: JSON.stringify(drvSnaps782(iso, li)) === JSON.stringify(drvSnaps782(iso, li))};
    DRV782_OK = null; return out; }, iso);
  ok('P20 moving the way in from one pinned point to another voids the check', !!cv.skip || (cv.wayIn.held && !cv.wayIn.afterMove), JSON.stringify(cv));
  ok('P21 moving the drop-off from one pin to another voids the check (when the sheet\'s drop-off moves)', !!cv.skip || (cv.drop.held && (cv.drop.printedMoved ? !cv.drop.afterMove : cv.drop.afterMove)), JSON.stringify(cv.drop || cv));
  ok('P22 changing a load time from one valid time to another voids the check', !!cv.skip || !!cv.loadTime.skip || (cv.loadTime.held && !cv.loadTime.afterChange), JSON.stringify(cv.loadTime || cv));
  ok('P22b changing the carrier on a load from one name to another voids the check', !!cv.skip || !!cv.carrier.skip || (cv.carrier.held && !cv.carrier.afterChange), JSON.stringify(cv.carrier || cv));
  ok('P23 nothing changed: the check still holds (no false alarms), and it reads the same every time', !!cv.skip || (cv.same.held && cv.same.twice), JSON.stringify(cv.same || cv));
  /* and while the check is open: the way in moved before "Checked" is pressed - it comes back as it stands now */
  await p.evaluate(iso => { DRV782_OK = null; document.querySelector(`.dplate [data-pdf7="drivers"][data-iso="${iso}"][data-only="0"]`).click(); }, iso); await p.waitForSelector('#drv782');
  const reo2 = await p.evaluate(iso => { const cks = [...document.querySelectorAll('#drv782 input[type=checkbox]')]; cks.forEach(c => c.click()); const nm = document.querySelector('#drv782n'); nm.value = 'Test Person'; nm.dispatchEvent(new Event('input'));
    const g = dpLoads(programmeDays().find(x => x.iso === iso))[0], r = (g.rows || []).find(x => x.a && !report782(x.a)) || g.rows[0], a = r.a, mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} };
    const ref = report782(a) ? report782(a).ref : a.key, keep = S.entries, cur = entryOf(ref), base = cur && cur.lat != null ? cur : {lat: -27.97, lon: 153.43};
    S.entries = Object.assign({}, keep || {}, {[ref]: {lat: base.lat + 0.0015, lon: base.lon + 0.0015, acc: 4, at: '2026-10-02T00:09:00.000Z', by: 'Test Person', n: 5}}); mc();
    document.querySelector('#drv782 .b-go').click(); const again = !!document.querySelector('#drv782'), chg = !!document.querySelector('#drv782 .chg'), held = !!DRV782_OK; S.entries = keep; mc(); document.querySelectorAll('#drv782').forEach(e => e.remove()); try { pdf7Close(); } catch (e) {} DRV782_OK = null; return {ref, again, chg, held}; }, iso);
  ok('P24 the way in moved while the check is open: pressing the button shows it again as it stands now - nothing is made', reo2.again && reo2.chg && !reo2.held, JSON.stringify(reo2));
  /* Codex recheck 3: the printed sheet's way in follows the way in the check covers - the same words the text sends.
     Synthetic: one item's way in pinned at point A, then point B; and an item with no drop-off (the pit lane). */
  const wy = await p.evaluate(async iso => { const d = programmeDays().find(x => x.iso === iso), mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} };
    const loads = dpLoads(d); let li = -1, a = null; loads.some((g, i) => (g.rows || []).some(r => r.a && !report782(r.a) && (li = i, a = r.a, true)));
    if (!a) return {skip: 'no item with its own drop-off on this day'};
    const sheet = () => { mc(); const g = dpLoads(d)[li], box = document.createElement('div'); box.innerHTML = dpPage(d, g, 'drv', li + 1, loads.length); return box.textContent.replace(/\s+/g, ' '); };
    const access = () => { mc(); return ((/Site access: ([^\n]*)/.exec(dropSmsText(a)) || [])[1] || '').replace(/\.$/, ''); };
    const pin = (lat, lon, at) => ({lat, lon, acc: 4, at, by: 'Test Person', n: 5}), keep = S.entries, out = {ref: a.key};
    try { S.entries = Object.assign({}, keep || {}, {[a.key]: pin(-27.9700, 153.4300, '2026-10-02T00:00:00.000Z')});
      const s1 = sheet(), t1 = access();
      S.entries = Object.assign({}, keep || {}, {[a.key]: pin(-27.9750, 153.4320, '2026-10-02T00:05:00.000Z')});
      const s2 = sheet(), t2 = access();
      out.a = {text: t1, onSheet: !!t1 && s1.includes(t1)}; out.b = {text: t2, onSheet: !!t2 && s2.includes(t2), oldGone: !s2.includes(t1)}; }
    finally { S.entries = keep; mc(); }
    /* the pit lane: an item that reports there prints the pit lane's way in, the one its text gives */
    let rp = null; programmeDays().some(x => dpLoads(x).some((g, i) => (g.rows || []).some(r => { if (r.a && report782(r.a)) { rp = {d: x, g, i, a: r.a}; return true; } })));
    if (rp) { mc(); const box = document.createElement('div'); box.innerHTML = dpPage(rp.d, rp.g, 'drv', rp.i + 1, dpLoads(rp.d).length); const st = box.textContent.replace(/\s+/g, ' ');
      const ta = ((/Site access: ([^\n]*)/.exec(dropSmsText(rp.a)) || [])[1] || '').replace(/\.$/, ''), own = (zoneEntry782({key: rp.a.key, events: []}) || {}).sms || '';
      out.pit = {ref: rp.a.key, text: ta, onSheet: !!ta && st.includes(ta), wayIn: typeof wayIn782 === 'function' ? wayIn782(rp.a) : 'none on this page'}; }
    return out; }, iso);
  ok('P25 the printed sheet\'s way in is the one the text gives, and follows a change from one pinned point to another', !!wy.skip || (wy.a.onSheet && wy.b.onSheet && wy.b.oldGone), JSON.stringify(wy));
  ok('P26 an item that reports to the pit lane prints the pit lane\'s way in, the one its text gives', !!wy.skip || !wy.pit || wy.pit.onSheet, JSON.stringify(wy.pit || wy));
  ok('E1 no page errors', !s.errors.length, JSON.stringify(s.errors).slice(0, 200));
  const passed = T.filter(t => t.pass).length;
  T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + ' — ' + t.detail));
  console.log(passed + '/' + T.length + ' ' + (MOB ? 'phone' : 'desktop') + ' · day ' + iso);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, day: iso, passed, of: T.length, tests: T}, null, 1));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})();
