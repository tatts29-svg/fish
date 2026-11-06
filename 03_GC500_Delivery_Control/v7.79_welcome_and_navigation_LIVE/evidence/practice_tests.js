// Author: Andrew Fisher.
// PAGE=<candidate> OUT=<private evidence directory> [MOB=1] node practice_tests.js
// Reads the live record. Every messaging request is locally intercepted; no message or record is sent.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert').strict;
const {open} = require('../../toolchain/harness/open_page');

const pageFile = process.env.PAGE;
if (!pageFile) throw new Error('PAGE must name the frozen candidate');
const mobile = !!process.env.MOB;
const out = process.env.OUT || '/workspace/private-gc500-v779-review';
fs.mkdirSync(out, {recursive: true});
const source = fs.readFileSync(pageFile);
const baselineFile = process.env.BASE || path.resolve(path.dirname(pageFile), 'base_live.html');
const baseline = fs.readFileSync(baselineFile, 'utf8');
function span(start, end) {
  const a = baseline.indexOf(start), b = baseline.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error('The baseline SMS formatter could not be found');
  return baseline.slice(a, b);
}
// A closure preserves the old where/access/drop formatter while both versions read exactly the same S snapshot.
const baselineFormatter = span('function text747Where(a){', 'function text747When(a){')
  + span('function dropSmsText(a){', '/* the Text box:') + '\nreturn dropSmsText;';
const report = {author: 'Andrew Fisher', device: mobile ? 'phone' : 'desktop',
  sha256: crypto.createHash('sha256').update(source).digest('hex'), bytes: source.length,
  tests: [], productionMessagingWrites: 0, recordWrites: 0};
const syntheticNumber = '+61400000001';

(async () => {
  const session = await open({pageFile, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 900, dpr: mobile ? 2 : 1});
  const p = session.page;
  const captures = [];
  let unexpectedPosts = 0;
  await p.route('**/api/version*', route => route.fulfill({status: 200, contentType: 'application/json',
    body: JSON.stringify({version: 1, level: 'edit', readonly: false})}));
  await p.route(/\/api\/(sms|mms)(?:[/?]|$)/, async route => {
    const req = route.request(), url = new URL(req.url());
    const json = body => route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
    if (req.method() === 'GET') return json({configured: true, from_needed: false, today: {left: 20, cap: 20}});
    if (req.method() !== 'POST') return route.abort('blockedbyclient');
    const body = req.postDataJSON();
    if (!body.dry_run || body.to.length !== 1 || body.to[0] !== syntheticNumber) {
      unexpectedPosts++; return route.abort('blockedbyclient');
    }
    captures.push({pathname: url.pathname, body}); // In memory only; report contains no recipients or text.
    return json({dry_run: true, messages: 1, shape: {parts: 3}, picture: {bytes: 1234}});
  });
  async function test(name, fn) {
    try { await fn(); report.tests.push({name, pass: true}); }
    catch (e) { report.tests.push({name, pass: false, error: String(e.message).slice(0, 650)}); }
  }
  try {
    await p.waitForFunction(() => typeof allAssets === 'function' && typeof dropSmsText === 'function');
    await p.waitForFunction(() => SYNC.status === 'live', null, {timeout: 90000});
    const assets = await p.evaluate(baselineSource => {
      const oldDropSmsText = new Function(baselineSource)();
      const rows = allAssets().map(a => {
        const text = dropSmsText(a), shape = smsShape(text), nt = navTargetFor(a), e = entryOf(a.key);
        const old = oldDropSmsText(a), link = text747Link(a), due = old.split('\n').find(line => line.startsWith('Due '));
        const mu = masterUnit(a.key);
        return {length: text.length, units: shape.units, plain: shape.encoding === 'GSM-7',
          welcome: text.startsWith('Welcome to Coates GC500\n' + text747Plain(text747What(a))),
          navigation: nt ? text.includes('Navigate: ' + navUrl(nt.ll)) : !text.includes('https://www.google.com/maps/dir/'),
          gps: nt ? text.includes('GPS: ' + nt.ll.lat.toFixed(6) + ', ' + nt.ll.lon.toFixed(6)) : !text.includes('GPS:'),
          master: !mu || !!(nt && nt.fix && nt.fix.master && nt.ll.lat === mu.ll[0] && nt.ll.lon === mu.ll[1]),
          provenance: !nt || !nt.fix || !nt.fix.master || text.includes('(master plan)'),
          access: !e ? !text.includes('Site access:') : e.took === 'the pit lane rule'
            ? text.includes(e.end === 'south' ? 'Site access: Gold Coast Hwy via paddock ramps; follow pit lane north-west.'
              : 'Site access: Gold Coast Hwy > north-west pit lane entry; follow race direction.')
            : e.lat == null || e.lon == null || text.includes('Site access: turn in at ' + e.lat.toFixed(6) + ', ' + e.lon.toFixed(6) + '.'),
          unknown: !!nt || /Location (?:changed|not yet confirmed)/.test(text),
          attachedClaim: /picture (?:is )?attached/i.test(text), details: text.includes('Delivery details:'),
          oldDetails: !!link && old.includes(link), oldDue: !!due,
          preservedDetails: !link || !old.includes(link) || text.includes(link), preservedDue: !due || text.includes(due),
          resolved: !!nt};
      });
      return {count: rows.length, maxCharacters: Math.max(...rows.map(x => x.length)),
        maxGsmUnits: Math.max(...rows.map(x => x.units)), resolved: rows.filter(x => x.resolved).length,
        details: rows.filter(x => x.details).length,
        baselineDetails: rows.filter(x => x.oldDetails).length, baselineDue: rows.filter(x => x.oldDue).length,
        valid: Object.fromEntries(['plain','welcome','navigation','gps','master','provenance','access','unknown','preservedDetails','preservedDue'].map(k => [k, rows.every(x => x[k])])),
        attachmentClaims: rows.filter(x => x.attachedClaim).length};
    }, baselineFormatter);
    report.assets = assets;
    await test('Every current reference fits the GSM and service budgets', () => {
      assert.ok(assets.count > 0); assert.ok(assets.maxGsmUnits <= 459); assert.ok(assets.maxCharacters <= 480); assert.ok(assets.valid.plain);
    });
    for (const [key, name] of Object.entries({welcome: 'Every reference opens with the welcome and equipment',
      navigation: 'Every navigation link retains the exact recorded coordinates and appropriate label',
      gps: 'GPS values agree with the navigation destination', master: 'Master-plan unit positions retain priority',
      provenance: 'Master-plan provenance stays explicit', access: 'Site access retains recorded entry or the applicable pit-lane direction',
      unknown: 'Unresolved destinations retain a clear confirmation instruction',
      preservedDetails: 'Every delivery-details link that fitted the baseline still fits this candidate',
      preservedDue: 'Every due-date line that fitted the baseline still fits this candidate'})) {
      await test(name, () => assert.ok(assets.valid[key]));
    }
    await test('The message does not claim a picture is attached when it can be unticked', () => assert.equal(assets.attachmentClaims, 0));

    const synthetic = await p.evaluate(() => {
      const original = {navTargetFor, movedFor, entryOf};
      const a = {key: 'SYNTHETIC', discipline: 'Generators', item_types: ['60 kVA'], name: 'Generator'};
      const ll = {lat: -27.123456, lon: 153.654321};
      const run = (nt, moved = false) => { navTargetFor = () => nt; movedFor = () => moved; return text747Where(a).join('\n'); };
      const access = e => {entryOf = () => e; return text747WayIn(a);};
      try { return {
        placed: run({ll, pinned: false, placed: true}), area: run({ll, pinned: false}),
        pinned: run({ll, pinned: true, fix: {acc: 6}}), master: run({ll, pinned: true, fix: {master: true}}),
        missing: run(null), moved: run(null, true), url: navUrl(ll),
        north: access({took: 'the pit lane rule', end: 'north'}), south: access({took: 'the pit lane rule', end: 'south'}),
        explicit: access({lat: ll.lat, lon: ll.lon}), outside: access(null)
      }; } finally {navTargetFor = original.navTargetFor; movedFor = original.movedFor; entryOf = original.entryOf;}
    });
    await test('Placed location is labelled mapped and not checked on site', () => {
      assert.ok(synthetic.placed.includes('Navigate: ' + synthetic.url));
      assert.match(synthetic.placed, /placed on the map, not yet checked on site/); assert.doesNotMatch(synthetic.placed, /exact spot/);
    });
    await test('Approximate area is not described as an exact delivery location', () => {
      assert.ok(synthetic.area.includes('Navigate: ' + synthetic.url));
      assert.match(synthetic.area, /the area, not the exact spot/);
    });
    await test('A pin preserves its accuracy and a master target preserves its source', () => {
      assert.match(synthetic.pinned, /pinned on site, within 6 m/); assert.match(synthetic.master, /master plan/);
      assert.ok(synthetic.pinned.includes('Navigate: ' + synthetic.url));
    });
    await test('Missing and moved destinations have no fabricated navigation or GPS', () => {
      assert.match(synthetic.missing, /Location not yet confirmed/); assert.match(synthetic.moved, /Location changed/);
      assert.doesNotMatch(synthetic.missing + synthetic.moved, /https:|GPS:|Navigate:/);
    });
    await test('North, south and recorded turn-in instructions retain their distinct meaning', () => {
      assert.match(synthetic.north, /north-west pit lane entry; follow race direction/);
      assert.match(synthetic.south, /paddock ramps; follow pit lane north-west/);
      assert.equal(synthetic.explicit, 'Site access: turn in at -27.123456, 153.654321.');
      assert.equal(synthetic.outside, '');
    });

    await p.evaluate(() => {
      window.capability = () => 'edit'; window.mayWrite = () => true;
      // The public-page poll can restore readonly while the click awaits layout. Keep this local fixture stable.
      Object.defineProperty(SYNC, 'readonly', {configurable: true, get: () => false, set: () => {}});
      SYNC.level = 'edit'; tokenOf = () => 'synthetic-test-token';
      S.operator = 'Synthetic test operator'; openAsset('P41');
    });
    await p.locator('#textDrop').click();
    await p.locator('#smTx').waitFor();
    const drawer = p.locator('[role="dialog"]').filter({has: p.locator('#smTx')});
    await test('Actual Text it button opens the professional preview', async () => {
      assert.match(await p.locator('#smTx').inputValue(), /^Welcome to Coates GC500\nP41/);
      assert.equal((await p.locator('label[for="smTx"]').textContent()).trim(), 'Message preview');
    });
    await test('The real map picture renders and remains selected by default', async () => {
      await p.waitForFunction(() => {const d = document.querySelector('#smTx')?.closest('[role="dialog"]'); return !!(d && (d._pic || d._picError));}, null, {timeout: 90000});
      assert.equal(await p.locator('#smPic').isChecked(), true);
      assert.equal(await p.locator('#smPicImg').isVisible(), true);
      const picture = await drawer.evaluate(d => ({error: d._picError || null, bytes: d._pic && d._pic.bytes, width: d._pic && d._pic.w, height: d._pic && d._pic.h}));
      assert.equal(picture.error, null); assert.ok(picture.bytes > 1000 && picture.bytes <= 250000);
      assert.equal(picture.width, 1000); assert.equal(picture.height, 824); report.picture = picture;
    });
    await test('Phone and desktop message controls have no horizontal overflow', async () => {
      const size = await drawer.evaluate(d => ({left: d.getBoundingClientRect().left, right: d.getBoundingClientRect().right,
        viewport: document.documentElement.clientWidth, scroll: d.scrollWidth, client: d.clientWidth}));
      assert.ok(size.left >= -1 && size.right <= size.viewport + 1 && size.scroll <= size.client + 1);
    });
    await drawer.screenshot({path: path.join(out, mobile ? 'phone.png' : 'desktop.png')});
    let expectedText = await p.locator('#smTx').inputValue();
    await test('Full details returns to the same welcome message', async () => {
      await p.locator('#smLong').click(); assert.notEqual(await p.locator('#smTx').inputValue(), expectedText);
      await p.locator('#smLong').click();
      expectedText = await p.evaluate(() => dropSmsText(assetOf('P41')));
      assert.ok((await p.locator('#smTx').inputValue()) === expectedText, 'Short-text return must match the current welcome formatter');
    });
    await p.locator('#smTo').fill(syntheticNumber);
    await test('Picture format check captures the full welcome and JPEG without a live POST', async () => {
      await p.locator('#smDry').click();
      await p.waitForFunction(() => document.querySelector('#smMsg').textContent.includes('passed the format check'));
      assert.equal(captures.length, 1); assert.equal(captures[0].pathname, '/api/mms');
      assert.equal(captures[0].body.dry_run, true); assert.ok(captures[0].body.text === expectedText, 'MMS dry-run must preserve the preview');
      assert.match(captures[0].body.picture, /^data:image\/jpeg;base64,/);
      assert.ok(captures[0].body.subject.length <= 20);
      assert.match(await p.locator('#smMsg').innerText(), /Nothing was sent by this check/);
    });
    await test('Unticking the picture keeps the welcome and navigation in a plain-text check', async () => {
      await p.locator('#smPic').uncheck(); await p.locator('#smDry').click();
      await p.waitForTimeout(150);
      assert.equal(captures.length, 2); assert.equal(captures[1].pathname, '/api/sms');
      assert.ok(captures[1].body.text === expectedText, 'SMS dry-run must preserve the preview'); assert.equal(captures[1].body.picture, undefined);
      assert.equal(captures[1].body.dry_run, true);
    });
    await test('No unexpected message submissions, project writes or page errors occurred', () => {
      assert.equal(unexpectedPosts, 0); assert.equal(session.counts.blocked, 0); assert.deepEqual(session.errors, []);
    });
    report.requests = {syntheticDryRuns: captures.length, unexpectedPosts, blockedWrites: session.counts.blocked, readRequests: session.counts.live};
    report.pageErrors = session.errors;
  } finally {await session.browser.close();}
  report.passed = report.tests.filter(t => t.pass).length; report.total = report.tests.length;
  fs.writeFileSync(path.join(out, mobile ? 'practice-phone.json' : 'practice-desktop.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (report.passed !== report.total) process.exitCode = 1;
})().catch(e => {console.error(String(e.message).slice(0, 650)); process.exitCode = 1;});
