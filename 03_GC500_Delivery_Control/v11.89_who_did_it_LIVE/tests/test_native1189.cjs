// Author: Andrew Fisher. v11.89 in the real Servicing tab, on the real tracker reading, writing nothing.
// The tracker is read with GET through a host-scoped helper (no key enters the browser's address bar or a command argument).
// Every /api/sms call is answered here by the test (none is expected): no text leaves, nothing is written to the record.
// Expectations come from the same reading the page shows, so the checks hold as crews tick tonight. Part 3b adds two made-up ticks
// to this test browser's own copy of the reading (never sent anywhere, never saved, no picture kept) to drive the crew paths before
// the crews have saved any tonight.
//   PAGE=build/GC500_v11.89/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1189.cjs
const assert = require('node:assert/strict'), {spawn} = require('node:child_process'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
function read(url) {
  return new Promise((resolve, reject) => {
    const source = "import os,sys,urllib.request,urllib.parse\nu=sys.argv[1];p=urllib.parse.urlsplit(u)\nassert p.scheme=='https' and p.netloc=='gc500-production.up.railway.app' and p.path in ('/api/version','/api/ticks')\nr=urllib.request.Request(u,headers={'x-gc500-token':os.environ['GC500_EDIT_TOKEN']},method='GET')\nwith urllib.request.urlopen(r,timeout=60) as f:sys.stdout.buffer.write(f.read())\n";
    const child = spawn('python3', ['-c', source, url], {env: process.env, stdio: ['ignore', 'pipe', 'pipe']}), chunks = [];
    child.stdout.on('data', d => chunks.push(d)); child.stderr.resume();
    child.on('error', () => reject(Error('read-only request unavailable'))); child.on('close', code => code ? reject(Error('read-only request failed')) : resolve(Buffer.concat(chunks)));
  });
}
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  let smsCalls = 0, inject = [];
  const sheet = p.locator('.who1189-drawer');
  const shot = async (loc, name) => { if (!dir) return; fs.mkdirSync(dir, {recursive: true}); const file = path.join(dir, tag + '-' + name + '.png');    // the sheet as the screen shows it
    await p.waitForTimeout(500);    // the page's own tap halo (interaction-halo1018) fades in 420 ms
    if (loc === sheet) return p.screenshot({path: file}); await loc.scrollIntoViewIfNeeded(); await loc.screenshot({path: file}); };
  try {
    await p.route('https://gc500-production.up.railway.app/api/**', async route => {
      const r = route.request(), u = new URL(r.url());
      if (r.method() === 'GET' && ['/api/version', '/api/ticks'].includes(u.pathname)) {
        let body = await read(r.url());
        if (inject.length && u.searchParams.get('token')) {
          const j = JSON.parse(body.toString('utf8'));
          if (j.load === 'servicing-tracker:GC500-2026' && Array.isArray(j.ticks)) { j.ticks = j.ticks.concat(inject); body = Buffer.from(JSON.stringify(j)); }
        }
        return route.fulfill({status: 200, headers: {'content-type': 'application/json', 'cache-control': 'no-store'}, body});
      }
      if (u.pathname.startsWith('/api/sms')) { smsCalls++; return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({configured: false})}); }
      return route.fallback();
    });
    await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; go('servicing'); renderServicing1084(); });
    await p.waitForFunction(() => window.gc500Teams1187 && window.gc500Teams1187.last() && document.querySelector('#svc1067 .who1189-tbl .who1189-ref'), null, {timeout: 120000});
    await p.waitForTimeout(600);
      const openOnly = async n => {    // one area table open at a time, as a person would look
      for (const d of await p.locator('#svc1067 details.svc-area[open]').all()) if (await d.getAttribute('data-svc-area') !== String(n)) await d.locator(':scope > summary').click();
      const want = p.locator('#svc1067 details[data-svc-area="' + n + '"]');
      if (await want.getAttribute('open') === null) await want.locator(':scope > summary').click();
    };
    const sheetIs = () => p.evaluate(() => { const M = window.gc500Teams1187.last(), d = document.querySelector('.who1189-drawer'), ref = d.querySelector('h2').textContent.replace(/ · who did it$/, '');
      return {ref, sub: d.querySelector('.sub').textContent, text: d.querySelector('.db').textContent, html: d.querySelector('.db').innerHTML, want: SvcWho1189.placeHtml(SvcWho1189.place(M, ref), M.S)}; });
    const looked = async () => (await p.evaluate(() => {
      const M = window.gc500Teams1187.last(), out = {withCrew: null, history: null};
      M.D.areas.forEach(a => a.refs.forEach(r => { const jobs = SvcWho1189.place(M, r.ref).lines.flatMap(l => l.jobs);
        const j = jobs.find(x => x.by.length); if (!out.withCrew && j) out.withCrew = {ref: r.ref, area: a.n, by: j.by.map(c => c.names)};
        const e = jobs.flatMap(x => x.log).find(x => x.crew); if (!out.history && e) out.history = {ref: r.ref, area: a.n, line: (e.undone ? 'ticked (later unticked)' : 'ticked') + ' · ' + e.crew.names}; }));
      return out; }));

    // 1. Tonight: every reference name is a button; the crew sits under the time as people's names; "Group not recorded" is gone.
    const now = await p.evaluate(() => {
      const M = window.gc500Teams1187.last(), S = M.S, D = M.D, cfg = {plans: D.plans, days: D.days, extras: D.extras}, st = S.jobStates(M.events, M.now);
      let refs = 0, named = 0;
      D.areas.forEach(a => a.refs.forEach(r => { refs++; r.lines.forEach(l => S.tasksFor(cfg, l, M.day).forEach(t => { const x = st[S.jobKey(l.id, t, M.day)]; if (x && !x.local && x.crews && x.crews.length) named++; })); }));
      const host = document.getElementById('svc1067'), tbls = [...host.querySelectorAll('.svc-tbl')];
      return {day: M.day, refs, named, buttons: host.querySelectorAll('.svc-tbl .who1189-ref').length, tables: tbls.length, tapTables: host.querySelectorAll('.who1189-tbl').length,
        names: host.querySelectorAll('.svc-tbl td.ok small.who1189-names').length, notRecorded: tbls.some(t => t.textContent.includes('Group not recorded')),
        did: [...host.querySelectorAll('.teams1187-row')].map(r => { const id = r.getAttribute('data-svc1102-key').replace('teams1187-', ''); return {id, btn: !!r.querySelector('.who1189-crew'), span: !!r.querySelector('span.teams1187-did'), want: SvcTeams1187.plan(M, id).doneRefs}; })};
    });
    check(now.buttons === now.refs && now.tables === now.tapTables, 'every place in the area tables is tappable (' + now.refs + ' places)');
    check(!now.notRecorded, 'no "Group not recorded" in the table cells');
    check(now.names === now.named, 'each completion saved with a crew shows the crew under its time (' + now.named + ')');
    check(now.did.length === 5 && now.did.every(r => r.want ? r.btn && !r.span : !r.btn), 'each crew\'s done count on Message the teams is a button when it has done places');

    // 2. Tonight's own record: a place done with a crew names it; a tick and untick are both shown, with the crew the tick carried.
    const real = await looked();
    for (const want of [real.withCrew, real.history].filter(Boolean)) {
      await openOnly(want.area);
      await p.locator('#svc1067 .who1189-ref[data-who1189="' + want.ref + '"]').click(); await sheet.waitFor();
      const got = await sheetIs();
      check(got.ref === want.ref && got.html === got.want, 'the sheet is the shared rules\' account of ' + want.ref);
      if (want.by) check(want.by.every(n => got.text.includes('By ' + n)), want.ref + ': names the crew saved with the completion (' + want.by.join(', ') + ')');
      if (want.line) check(got.text.includes(want.line), want.ref + ': history shows "' + want.line + '"');
      await shot(sheet, want.by ? 'tonight-done' : 'tonight-history');
      await sheet.locator('.close').click(); check(await sheet.count() === 0, 'close removes the sheet');
    }
    // 3. A crew's done count opens the places saved with that crew; the count tapped is the count listed.
    const crewSheet = async (id, want, keep) => {
      await p.locator('#svc1067 .who1189-crew[data-who1189-crew="' + id + '"]').click(); await sheet.waitFor();
      const c = await p.evaluate(id => { const M = window.gc500Teams1187.last(), C = SvcWho1189.crewPlaces(M, id), d = document.querySelector('.who1189-drawer');
        return {sub: d.querySelector('.sub').textContent, places: C.places, listed: C.areas.reduce((n, a) => n + a.refs.length, 0), buttons: d.querySelectorAll('.who1189-ref').length, other: C.other.length, first: (d.querySelector('.who1189-ref') || {}).textContent}; }, id);
      check(c.places === want && c.listed === want && c.buttons === want + c.other, id + ': ' + want + ' done, ' + c.listed + ' listed');
      check(c.sub.includes(want + (want === 1 ? ' place' : ' places') + ' saved with their name'), 'the sheet says how many');
      if (keep) await shot(sheet, 'crew');
      await sheet.locator('.who1189-ref').first().click();
      await p.waitForFunction(ref => { const h = document.querySelector('.who1189-drawer h2'); return h && h.textContent === ref + ' · who did it'; }, c.first);
      check(await sheet.count() === 1, 'a place in the crew list opens that place\'s history in the same sheet');
      return c.first;
    };
    const crew = now.did.find(r => r.want);
    if (crew) { await crewSheet(crew.id, crew.want, true); await p.keyboard.press('Escape'); check(await sheet.count() === 0, 'Escape closes'); }

    // 3b. Two made-up ticks with crews tonight, in this browser's copy of the reading only: the whole crew path in the real panel.
    const pick = await p.evaluate(() => { const M = window.gc500Teams1187.last(), S = M.S, cfg = {plans: M.D.plans, days: M.D.days, extras: M.D.extras}, st = S.jobStates(M.events, M.now), W = SvcWho1189.crewWords;
      for (const a of SvcScope1170.active(M.D).areas) for (const r of a.refs) { const l = r.lines[0]; if (r.lines.length === 1 && l.kind === 'fwf' && S.tasksFor(cfg, l, M.day).every(t => !st[S.jobKey(l.id, t, M.day)]))
        return {ref: r.ref, area: a.n, line: l.id, day: M.day, at: new Date(M.now - 300000).toISOString(), pump: W(null, 'pump2').names, clean: W(null, 'cleaners').names, water: W(null, 'water').names, labels: [W(null, 'pump2').label, W(null, 'cleaners').label]}; }
      return null; });
    check(!!pick, 'a place with nothing done tonight to borrow for the made-up ticks');
    const before = (now.did.find(r => r.id === 'cleaners') || {}).want || 0;
    inject = [{id: 'TEST1189-pump', line: pick.line, task: 'pump', day: pick.day, done: true, undoes: [], at: pick.at, tapped_at: pick.at, crew_group: 'pump2'},
      {id: 'TEST1189-clean', line: pick.line, task: 'clean', day: pick.day, done: true, undoes: [], at: pick.at, tapped_at: pick.at, crew_group: 'cleaners'}];
    await p.locator('#svc1067 [data-map-refresh]').click();
    await p.waitForFunction(() => { const M = window.gc500Teams1187.last(); return M && M.events.some(e => e.id === 'TEST1189-clean') && document.querySelector('#svc1067 .who1189-crew[data-who1189-crew="cleaners"]'); }, null, {timeout: 90000});
    await p.waitForTimeout(400);
    const cells = await p.evaluate(ref => { const tr = [...document.querySelectorAll('#svc1067 tr.svc-r1')].find(x => x.querySelector('[data-who1189="' + ref + '"]'));
      return tr ? [...tr.querySelectorAll('td.ok small.who1189-names')].map(x => x.textContent) : []; }, pick.ref);
    check(cells.join('|') === pick.pump + '|' + pick.clean, 'the table shows each crew\'s names under its time: ' + cells.join(', '));
    const rep = await p.evaluate(ref => { const r = SvcShift1168.snapshot(window.gc500Teams1187.last()).areas.flatMap(a => a.refs).find(x => x.ref === ref); return r ? r.lines[0].tasks.filter(t => t.done).map(t => t.crew) : []; }, pick.ref);
    check(rep.join('|') === pick.labels.join('|'), 'the shift report names the crews, not "Crew group …": ' + rep.join(', '));
    const opened = await crewSheet('cleaners', before + 1, false);
    if (opened !== pick.ref) { await p.evaluate(ref => window.gc500Who1189.openPlace(ref), pick.ref); }
    const made = await sheetIs();
    check(made.text.includes('By ' + pick.clean + ' · ') && made.text.includes('By ' + pick.pump + ' · ') && made.text.includes('Whose job: ' + pick.water), 'the place names both crews and whose job the water is');
    check(!made.text.includes('Crew not recorded'), 'no "not recorded" when the ticks carry their crews');
    await p.keyboard.press('Escape');
    inject = [];

    // 4. Last night (Fri 23, from Previous nights): jobs and times, "crew not recorded", never a guessed crew; missed jobs say whose job.
    await p.locator('#svc1067 details[data-svc-history] > summary').click();
    await p.locator('#svc1067 [data-svc-day="2026-10-23"]').click();
    await p.waitForFunction(() => window.gc500Teams1187.last() && window.gc500Teams1187.last().day === '2026-10-23' && document.querySelector('#svc1067 .who1189-tbl'));
    await p.waitForTimeout(400);
    const fri = await p.evaluate(() => {
      const M = window.gc500Teams1187.last(), out = {done: null, missed: null, group: null, closed: null, crewTicks: 0};
      M.D.areas.forEach(a => a.refs.forEach(r => {
        const P = SvcWho1189.place(M, r.ref), jobs = P.lines.flatMap(l => l.jobs); out.closed = P.closed;
        if (!out.done && r.lines.length === 1 && jobs.some(j => j.state === 'done')) out.done = {ref: r.ref, area: a.n};
        if (!out.missed && r.lines.length === 1 && jobs.some(j => j.state === 'missed')) out.missed = {ref: r.ref, area: a.n};
        if (!out.group && r.lines.length > 1) out.group = {ref: r.ref, area: a.n};
        out.crewTicks += jobs.filter(j => j.by.length).length;
      }));
      return out;
    });
    check(fri.closed && fri.done && fri.missed, 'Fri 23 is closed with done and missed places (' + fri.done.ref + ', ' + fri.missed.ref + ')');
    check(fri.crewTicks === 0, 'no Friday completion carries a crew (they were saved before crew names were kept)');
    await openOnly(fri.done.area);
    await p.locator('#svc1067 tr.svc-r1:has([data-who1189="' + fri.done.ref + '"]) td').first().click();    // a tap anywhere on the row, not only the name
    await sheet.waitFor();
    const fd = await sheetIs();
    check(fd.ref === fri.done.ref && fd.sub.startsWith('Fri 23 night') && fd.html === fd.want, 'tapping a done row opens that place on Fri 23 night');
    check(/✓ Done \d\d:\d\d/.test(fd.text) && fd.text.includes('Crew not recorded · saved before crew names were kept') && !/\bBy /.test(fd.text), 'done with its time, crew not recorded, no name guessed');
    check(fd.text.includes('the record does not say who did it, so no crew is guessed'), 'the sheet says why');
    await shot(sheet, 'friday-done');
    await sheet.locator('.close').click();
    await openOnly(fri.missed.area);
    await p.locator('#svc1067 .who1189-ref[data-who1189="' + fri.missed.ref + '"]').click(); await sheet.waitFor();
    const fm = await sheetIs();
    check(fm.ref === fri.missed.ref && fm.html === fm.want && fm.text.includes('Missed') && fm.text.includes('Whose job:'), fri.missed.ref + ': missed, and whose job it was');
    await shot(sheet, 'friday-missed');
    const layout = await p.evaluate(() => { const d = document.querySelector('.who1189-drawer'), r = d.getBoundingClientRect(); return {w: r.width, vw: innerWidth, over: d.scrollWidth > d.clientWidth + 1}; });
    check(layout.w <= layout.vw + 1 && !layout.over, 'the sheet fits the screen, no sideways scroll');
    await p.keyboard.press('Escape');
    if (fri.group) {
      await openOnly(fri.group.area);
      await p.locator('#svc1067 tr.svc-rg:has([data-who1189="' + fri.group.ref + '"]) + tr.svc-rl th').click(); await sheet.waitFor();
      check((await sheetIs()).ref === fri.group.ref, 'tapping one line of a grouped place opens the whole place (' + fri.group.ref + ')');
      check(await sheet.locator('.who1189-line h3').count() >= 2, 'each line of the place is shown');
      await p.keyboard.press('Escape');
    }
    await openOnly(fri.done.area);
    const tblOver = await p.evaluate(() => [...document.querySelectorAll('#svc1067 details.svc-area[open] .svc-tbl')].some(t => t.getBoundingClientRect().right > t.closest('details').getBoundingClientRect().right + 1));
    check(!tblOver, 'the open area table stays inside its card');
    if (dir) { await p.locator('#svc1067 details.svc-area[open] .svc-tbl').first().evaluate(t => t.scrollIntoView({block: 'start'})); await p.waitForTimeout(300); await p.screenshot({path: path.join(dir, tag + '-friday-table.png')}); }

    // 5. The servicing map: "Who did it" beside "Share map + jobs" on the selected place.
    await p.locator('#svc1067 .svc1099-references > summary').click();
    await p.locator('#svc1067 [data-svc1099-reference="' + fri.done.ref + '"]').click();
    const mapBtn = p.locator('#svc1067 .svc1099-detail [data-who1189="' + fri.done.ref + '"]');
    await mapBtn.waitFor();
    check(await p.locator('#svc1067 .svc1099-detail [data-share1164-ref="' + fri.done.ref + '"]').count() === 1 && await mapBtn.textContent() === 'Who did it', 'the map\'s selected place has Who did it beside Share map + jobs');
    await shot(p.locator('#svc1067 .svc1099-detail'), 'map-detail');
    await mapBtn.click(); await sheet.waitFor();
    check((await sheetIs()).ref === fri.done.ref, 'and it opens the same sheet');

    // 6. Losing the edit link closes the sheet; nothing was written or sent.
    await p.evaluate(() => { window.capability = () => 'view'; SYNC.readonly = true; SYNC.level = 'view'; SYNC.claims = 'view'; applyCapability(); renderServicing1084(); });
    await p.waitForTimeout(400);
    check(await sheet.count() === 0, 'view-only: the sheet closes');
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0 && smsCalls === 0, 'zero record writes, zero texts');
    console.log(JSON.stringify({checks, mobile, tonight: {day: now.day, places: now.refs, named: now.named, crews: now.did.filter(r => r.want).map(r => r.id + ':' + r.want), history: real.history && real.history.ref},
      borrowed: pick.ref, friday: {done: fri.done.ref, missed: fri.missed.ref, group: fri.group && fri.group.ref}}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v11.89 native: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
