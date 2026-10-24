// Author: Andrew Fisher. v11.87 in the real Servicing tab, on the real tracker reading, sending nothing.
// The tracker is read with GET through a host-scoped helper (no key enters the browser's address bar or a command argument).
// Every /api/sms call is answered here by the test: no text leaves, nothing is written to the record.
//   PAGE=build/GC500_v11.87/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1187.cjs
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
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE;
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const sms = {configured: true, posts: [], statusReads: 0, gets: 0};
  try {
    await p.route('https://gc500-production.up.railway.app/api/**', async route => {
      const r = route.request(), u = new URL(r.url());
      if (r.method() === 'GET' && ['/api/version', '/api/ticks'].includes(u.pathname))
        return route.fulfill({status: 200, headers: {'content-type': 'application/json', 'cache-control': 'no-store'}, body: await read(r.url())});
      if (u.pathname === '/api/sms' && r.method() === 'GET') { sms.gets++; return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({configured: sms.configured, today: {left: 499, cap: 500}, max_characters: 480})}); }
      if (u.pathname === '/api/sms' && r.method() === 'POST') {
        const h = r.headers(), body = JSON.parse(r.postData() || '{}');
        sms.posts.push({body, token: !!h['x-gc500-token'], who: h['x-gc500-who'] || ''});
        return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({messages: body.to.map((to, i) => ({to, status: 'SUCCESS', message_id: 'test-' + i}))})});
      }
      if (u.pathname === '/api/sms/status') { sms.statusReads++; return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({messages: (u.searchParams.get('ids') || '').split(',').map((id, i) => ({message_id: id, to: ['+61491570006', '+61491570156'][i], delivery_status: 'delivered'}))})}); }
      return route.fallback();
    });
    await p.evaluate(() => {
      try { localStorage.removeItem('gc500.teams1187.numbers'); } catch (e) {}
      const update = SvcMap1099.update; SvcMap1099.update = function (host, M) { window.svcInput = M; return update.apply(this, arguments); };
      window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; go('servicing'); renderServicing1084();
    });
    await p.waitForFunction(() => window.svcInput && !window.svcInput.readStatus && !window.svcInput.test1164 && document.querySelector('#svc1067 .teams1187'), null, {timeout: 120000});
    await p.waitForTimeout(600);

    // The card: under the three job meters, five crews, the same numbers as the shared rules on the same reading.
    const card = await p.evaluate(() => {
      const M = window.gc500Teams1187.last(), c = document.querySelector('#svc1067 .teams1187'), jobs = document.querySelector('#svc1067 .svc1123-jobs');
      const rows = [...c.querySelectorAll('.teams1187-row')].map(r => ({key: r.getAttribute('data-svc1102-key'), text: r.innerText.replace(/\s+/g, ' '), button: r.querySelector('[data-teams1187]') ? r.querySelector('[data-teams1187]').textContent : ''}));
      const want = SvcTeams1187.crews().map(g => { const P = SvcTeams1187.plan(M, g.id); return {id: g.id, places: P.places, jobs: P.jobs, closed: P.closed}; });
      const cb = c.getBoundingClientRect(), jb = jobs.getBoundingClientRect();
      const between = [...document.getElementById('svc1067').children].filter(e => { const r = e.getBoundingClientRect(); return e !== c && e !== jobs && r.height > 0 && r.top >= jb.bottom - 1 && r.top < cb.top - 1; });
      return {rows, want, day: M.day, below: cb.top >= jb.bottom - 1, above: between.length === 0, overflow: c.scrollWidth > c.clientWidth + 1, head: c.querySelector('.teams1187-head').textContent.replace(/\s+/g, ' ')};
    });
    check(card.rows.length === 5 && card.rows.map(r => r.key).join() === 'teams1187-cleaners,teams1187-pump1,teams1187-pump2,teams1187-pump3,teams1187-water', 'five crew rows in the crew card order');
    check(card.rows.every((r, i) => card.want[i].jobs ? (card.want[i].places ? r.text.includes(card.want[i].places + (card.want[i].closed ? ' missed' : ' still to do')) : /All done|Nothing missed/.test(r.text)) : r.text.includes('No jobs')), 'each row reads the shared rules\' count');
    check(card.below && card.above, 'the card sits straight under the pump / clean / water meters');
    check(!card.overflow, 'no sideways scrolling in the card');
    check(/Message the teams/.test(card.head) && card.head.includes('night'), 'card heading names the night');
    if (dir) { fs.mkdirSync(dir, {recursive: true}); await p.locator('#svc1067 .teams1187').scrollIntoViewIfNeeded(); await p.locator('#svc1067 .teams1187').screenshot({path: path.join(dir, (mobile ? 'phone' : 'desktop') + '-card.png')}); }

    // The drawer for a pump truck: both people's numbers, the areas, the message from the shared rules.
    await p.locator('[data-teams1187="pump1"]').click();
    const dr = p.locator('.teams1187-drawer'); await dr.waitFor();
    await p.waitForFunction(() => document.querySelector('.teams1187-drawer #t1187go') && !document.querySelector('.teams1187-drawer #t1187go').hidden);
    const first = await p.evaluate(() => {
      const d = document.querySelector('.teams1187-drawer'), M = window.gc500Teams1187.last(), g = SvcTeams1187.crews().find(x => x.id === 'pump1');
      const P = SvcTeams1187.plan(M, 'pump1'), want = SvcTeams1187.compose(P, SvcTeams1187.people(g.label), {sign: (document.getElementById('who').value.trim().split(/\s+/)[0] || 'Andrew')});
      return {h: d.querySelector('h2').textContent, labels: [...d.querySelectorAll('.teams1187-nums label')].map(l => l.textContent), text: d.querySelector('#t1187tx').value, want,
        areas: d.querySelectorAll('[data-t1187-area]').length, wantAreas: P.areas.length, go: d.querySelector('#t1187go').disabled, count: d.querySelector('#t1187count').textContent, hint: !!d.querySelector('.teams1187-areas .hint')};
    });
    check(first.h === 'Message Pump truck · AJ & Kelly' && first.labels.join('|') === 'AJ’s mobile|Kelly’s mobile', 'drawer names the crew and both people');
    check(first.text.length > 0 && first.text.length <= 480 && /^[\n\x20-\x7e]*$/.test(first.text), 'message fits one service send and is plain text');
    check(first.areas === first.wantAreas && first.hint, 'every area with jobs left is ticked; the shared-pump hint shows');
    check(first.go === true, 'Send waits for the numbers');
    check(/of 480 characters/.test(first.count), 'character count shown');
    await dr.locator('#t1187n0').fill('0491 570 006');
    check(await dr.locator('#t1187go').isDisabled() === false && await dr.locator('#t1187go').innerText() === 'Send to AJ', 'one number: sends to that person, named');
    await dr.locator('#t1187n1').fill('0491 57');
    check(await dr.locator('#t1187go').isDisabled(), 'a half-typed number stops the send');
    await dr.locator('#t1187n1').fill('0491 570 156');
    check(await dr.locator('#t1187go').innerText() === 'Send to both' && !(await dr.locator('#t1187go').isDisabled()), 'two good numbers: Send to both');
    const href = await dr.locator('#t1187phone').getAttribute('href');
    check(href.includes('+61491570006,+61491570156') && href.includes('body='), 'Text from my phone carries both numbers and the words');
    check(await dr.locator('#t1187areasum').textContent() === 'all ' + first.wantAreas && !(await dr.locator('#t1187areas').getAttribute('open')), 'areas folded away by default: "all ' + first.wantAreas + '"');
    if (first.areas > 1) {
      await dr.locator('#t1187areas > summary').click();
      const before = await dr.locator('#t1187tx').inputValue();
      await dr.locator('[data-t1187-area]').first().uncheck();
      const after = await dr.locator('#t1187tx').inputValue();
      check(after !== before && /\(\d+ places\)/.test(after) && after.match(/\((\d+) places\)/)[1] < before.match(/\((\d+) places\)/)[1], 'unticking an area takes it out of the message and the count');
      check(await dr.locator('#t1187areasum').textContent() === (first.wantAreas - 1) + ' of ' + first.wantAreas, 'summary shows what is ticked');
      await dr.locator('[data-t1187-area]').first().check();
      check(await dr.locator('#t1187tx').inputValue() === before, 'ticking it back restores the message');
    }
    if (dir) await dr.screenshot({path: path.join(dir, (mobile ? 'phone' : 'desktop') + '-drawer.png')});
    const shown = await dr.locator('#t1187tx').inputValue();
    await dr.locator('#t1187go').click();
    await p.waitForFunction(() => /Sent to both/.test(document.querySelector('#t1187msg').textContent));
    check(sms.posts.length === 1, 'one send');
    const post = sms.posts[0];
    check(post.body.to.join() === '+61491570006,+61491570156' && post.body.dry_run === false && post.body.text === shown, 'the service gets both numbers and exactly the words shown');
    check(post.token && post.who.length > 0, 'sent on the edit link with the operator name, as the Text drawer');
    check(await dr.locator('[data-sm-recipient]').count() === 2, 'a result for each number');
    check(await dr.locator('#t1187go').isDisabled() && await dr.locator('#t1187again').isVisible(), 'locked after sending: no double send');
    await dr.locator('#t1187check').click();
    await p.waitForFunction(() => /Delivered to both phones/.test(document.querySelector('#t1187msg').textContent));
    check(sms.statusReads === 1, 'delivery checked once');
    const kept = await p.evaluate(() => localStorage.getItem('gc500.teams1187.numbers'));
    check(kept && JSON.parse(kept).pump1.join() === '0491 570 006,0491 570 156', 'numbers kept on this phone');
    await dr.locator('.close').click(); check(await dr.count() === 0, 'close removes the drawer');

    // Reopen: numbers come back; the record and the page never saw them.
    await p.locator('[data-teams1187="pump1"]').click(); await dr.waitFor();
    check(await dr.locator('#t1187n0').inputValue() === '0491 570 006' && await dr.locator('#t1187n1').inputValue() === '0491 570 156', 'numbers come back next time');
    await p.keyboard.press('Escape'); check(await dr.count() === 0, 'Escape closes');
    check(await p.evaluate(() => !document.documentElement.outerHTML.replace(/<textarea[\s\S]*?<\/textarea>/g, '').includes('0491 570 006') || !!document.querySelector('.teams1187-drawer')), 'no number left in the page once the drawer is shut');

    // Texting switched off: no Send button; the phone's Messages and Copy remain.
    sms.configured = false;
    await p.locator('[data-teams1187="water"]').click(); await dr.waitFor();
    await p.waitForFunction(() => /not switched on/.test(document.querySelector('#t1187msg').textContent));
    check(await dr.locator('#t1187go').isHidden() && await dr.locator('#t1187phone').isVisible() && await dr.locator('#t1187copy').isVisible(), 'texting off: phone and copy only');
    check(await dr.locator('#t1187n0').inputValue() === '', 'each crew keeps its own numbers');
    check(sms.posts.length === 1, 'nothing more sent');

    // Losing the edit link closes the drawer and the card with it.
    await p.evaluate(() => { window.capability = () => 'view'; SYNC.readonly = true; SYNC.level = 'view'; SYNC.claims = 'view'; applyCapability(); renderServicing1084(); });
    await p.waitForTimeout(400);
    check(await dr.count() === 0 && await p.locator('#svc1067 .teams1187').count() === 0, 'view-only: no card, no drawer');
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, day: card.day, rows: card.rows.map(r => r.text), sample: shown}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v11.87 native: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
