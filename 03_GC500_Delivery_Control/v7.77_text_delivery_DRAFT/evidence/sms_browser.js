// Author: Andrew Fisher
// Run with PAGE=<candidate> OUT=<private evidence folder> [MOB=1] node sms_browser.js.
// All SMS/MMS requests are local fixtures. The shared harness blocks production writes.
const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;
const {open} = require('../../toolchain/harness/open_page');

const NUMBERS = ['+61400000001', '+61400000002', '+61400000003'];
const TEXT = 'Synthetic delivery check. No real recipient or project record.';
const report = {author: 'Andrew Fisher', device: process.env.MOB ? 'phone 390x844' : 'desktop 1440x900', tests: [], productionMessagingWrites: 0};
const out = process.env.OUT || '/tmp/gc500-sms-browser';
fs.mkdirSync(out, {recursive: true});

function reply(messages, extra = {}) {
  return {sent: messages.filter(m => m.status === 'SUCCESS').length, of: messages.length,
    messages, clicksend: {http: 200, response_code: 'SUCCESS'}, ...extra};
}
function accepted(n = 0) { return {to: NUMBERS[n], status: 'SUCCESS', message_id: 'synthetic-message-' + n}; }
function delivery(n, state, extra = {}) {
  return {message_id: 'synthetic-message-' + n, to: NUMBERS[n], kind: 'sms', submission_status: 'SUCCESS',
    delivery_status: state, checked_at: '2026-10-01T12:00:00.000Z', ...extra};
}

(async () => {
  const mobile = !!process.env.MOB;
  const session = await open({pageFile: process.env.PAGE, W: mobile ? 390 : 1440, H: mobile ? 844 : 900, mobile, dpr: mobile ? 2 : 1});
  const p = session.page;
  let fixture = {}, requests = [];
  await p.route('**/api/version*', route => route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({version: 1, level: 'edit', readonly: false})}));
  await p.route(/\/api\/(sms|mms)(?:[/?]|$)/, async route => {
    const req = route.request(), url = new URL(req.url()), method = req.method();
    requests.push({method, pathname: url.pathname, ids: url.searchParams.get('ids'), body: method === 'POST' ? req.postDataJSON() : null});
    const json = (body, status = 200) => route.fulfill({status, contentType: 'application/json', body: JSON.stringify(body)});
    if (url.pathname.endsWith('/status')) {
      assert.equal(method, 'GET');
      if (fixture.statusAbort) return route.abort('timedout');
      return json(fixture.status || {messages: [delivery(0, 'pending')]}, fixture.statusHttp || 200);
    }
    if (method === 'GET') return json({configured: fixture.configured !== false, from_needed: false, today: {left: 20, cap: 20}});
    if (method !== 'POST') return route.abort('blockedbyclient');
    // The fixtures reject accidental project data. These are local fulfillments, never forwards.
    const body = req.postDataJSON();
    assert.ok(body.to.every(n => NUMBERS.includes(n) || /^040000000[123]$/.test(n)), 'Only synthetic phone numbers may be tested');
    assert.ok(body.text.startsWith('Synthetic'), 'Only synthetic message bodies may be tested');
    if (fixture.gate) await fixture.gate;
    if (fixture.abort) return route.abort('timedout');
    if (body.dry_run) return json({dry_run: true, messages: body.to.length, to: body.to, shape: {parts: 1}, picture: {bytes: 1234}});
    return json(fixture.post || reply([accepted()]), fixture.postHttp || 200);
  });
  try {
    await p.waitForFunction(() => typeof smsDropBox === 'function' && typeof SYNC === 'object', null, {timeout: 150000});
    await p.evaluate(({text}) => {
      window.capability = () => 'edit'; window.mayWrite = () => true;
      SYNC.readonly = false; SYNC.level = 'edit';
      tokenOf = () => 'synthetic-test-token';
      dropSmsText = () => text; dropSmsLong = () => text + ' Full details.';
      navTargetFor = () => null;
      S.operator = 'Synthetic test operator';
    }, {text: TEXT});

    const drawer = () => p.locator('[role="dialog"]').filter({has: p.locator('#smTx')});
    const sendRequests = () => requests.filter(r => r.method === 'POST' && !r.body.dry_run);
    async function openBox(f = {}, numbers = [NUMBERS[0]]) {
      fixture = f; requests = [];
      await p.evaluate(async () => {
        document.querySelectorAll('[role="dialog"]').forEach(el => {if (el.querySelector('#smTx')) el.remove();});
        SYNC.readonly = false; SYNC.level = 'edit';
        await smsDropBox({key: 'TEST-SMS', what: 'Synthetic equipment'});
      });
      await p.locator('#smTx').waitFor();
      if (f.configured !== false) await p.locator('#smTo').fill(numbers.join(', '));
    }
    async function settle() { await p.waitForTimeout(150); }
    async function send() { await p.locator('#smGo').click(); await settle(); }
    async function refresh() { await p.locator('#smRefresh').click(); await settle(); }
    async function results() { return p.locator('#smResults').innerText(); }
    async function recipient(n) {
      const item = p.locator('#smResults [data-sm-recipient]').filter({hasText: NUMBERS[n]});
      if (await item.count()) return item.first().innerText();
      // Keep compatibility with an accessible list/table if the optional data hook is absent.
      const lines = (await results()).split('\n');
      const start = lines.findIndex(line => line.includes(NUMBERS[n]));
      assert.notEqual(start, -1, 'Recipient must have its own visible status');
      return lines.slice(start, start + 3).join(' ');
    }
    async function test(name, fn) {
      try { await fn(); report.tests.push({name, pass: true}); }
      catch (e) { report.tests.push({name, pass: false, error: String(e.message).slice(0, 800)}); }
    }

    await test('Acceptance is pending; dialog stays open and never claims delivered', async () => {
      await openBox(); await send();
      assert.match(await results(), /accepted|pending|awaiting/i);
      assert.doesNotMatch(await results(), /delivered to (?:the )?phone|delivery confirmed/i);
      assert.equal(sendRequests().length, 1);
      await p.waitForTimeout(2800);
      assert.equal(await drawer().count(), 1, 'Result must remain readable beyond the old auto-close timer');
      assert.equal(requests.filter(r => r.pathname.endsWith('/status')).length, 0, 'Refresh is explicit');
    });
    await test('Explicit refresh confirms delivered by message ID, without resending', async () => {
      await openBox({status: {messages: [delivery(0, 'delivered')]}}); await send(); await refresh();
      assert.match(await recipient(0), /delivered|delivery confirmed/i);
      assert.equal(sendRequests().length, 1);
      const calls = requests.filter(r => r.pathname.endsWith('/status'));
      assert.equal(calls.length, 1); assert.equal(calls[0].method, 'GET');
      assert.ok(calls[0].ids.includes('synthetic-message-0'));
    });
    await test('A failed delivery report is visibly failed', async () => {
      await openBox({status: {messages: [delivery(0, 'failed', {error_code: 'SYNTHETIC_UNREACHABLE'})]}});
      await send(); await refresh(); assert.match(await recipient(0), /failed|not delivered/i);
      assert.equal(sendRequests().length, 1);
    });
    await test('Mixed accepted and rejected recipients keep separate results', async () => {
      await openBox({post: reply([accepted(), {to: NUMBERS[1], status: 'INVALID_RECIPIENT', message_id: null}])}, NUMBERS.slice(0, 2));
      await send(); assert.match(await recipient(0), /accepted|pending|awaiting/i);
      assert.match(await recipient(1), /rejected|refused|failed|invalid/i);
      await drawer().screenshot({path: path.join(out, 'sms-mixed-' + (mobile ? 'phone' : 'desktop') + '.png')});
    });
    await test('SUCCESS is exact: UNSUCCESSFUL never counts as acceptance', async () => {
      await openBox({post: reply([{to: NUMBERS[0], status: 'UNSUCCESSFUL', message_id: null}])}); await send();
      assert.match(await recipient(0), /rejected|refused|failed|unsuccessful|unknown/i);
      assert.doesNotMatch(await recipient(0), /(?:^|\n)Accepted|delivery confirmed/i);
    });
    await test('Timeout is unknown and duplicate send remains blocked after editing', async () => {
      await openBox({abort: true}); await send();
      assert.match((await p.locator('#smMsg').innerText()) + ' ' + await results(), /unknown|cannot confirm|could not confirm/i);
      assert.doesNotMatch(await p.locator('#smMsg').innerText(), /nothing was sent/i);
      await p.locator('#smTx').fill(TEXT + ' Edited.');
      await p.locator('#smLong').click();
      assert.ok(await p.locator('#smGo').isDisabled());
      await p.locator('#smGo').evaluate(el => el.click()); await settle();
      assert.equal(sendRequests().length, 1);
    });
    await test('Accepted send cannot be duplicated through edits or Full details', async () => {
      await openBox(); await send(); await p.locator('#smTx').fill(TEXT + ' Edited.');
      await p.locator('#smLong').click(); assert.ok(await p.locator('#smGo').isDisabled());
      await p.locator('#smGo').evaluate(el => el.click()); await settle(); assert.equal(sendRequests().length, 1);
    });
    await test('Unsupported status endpoint preserves acceptance and says delivery is unavailable', async () => {
      await openBox({statusHttp: 404, status: {error: 'Not found'}}); await send(); await refresh();
      assert.match((await p.locator('#smMsg').innerText()) + ' ' + await results(), /unavailable|not available|not supported|unsupported|cannot confirm|could not confirm/i);
      assert.match(await recipient(0), /accepted|pending|unknown|unavailable|unsupported/i);
      assert.equal(sendRequests().length, 1);
    });
    await test('Delivery lookup timeout does not mark accepted text as failed or resend', async () => {
      await openBox({statusAbort: true}); await send(); await refresh();
      assert.match((await p.locator('#smMsg').innerText()) + ' ' + await results(), /unknown|could not|cannot|unavailable|not confirmed|lost its connection/i);
      assert.equal(sendRequests().length, 1);
    });
    await test('Dry-run remains explicitly unsent and allows a later actual send', async () => {
      await openBox(); await p.locator('#smDry').click(); await settle();
      assert.match(await p.locator('#smMsg').innerText(), /nothing (?:has been|was) sent|send nothing|not sent/i);
      assert.match(await p.locator('#smMsg').innerText(), /passed the format check/i);
      assert.equal(sendRequests().length, 0); assert.ok(!(await p.locator('#smGo').isDisabled()));
      await send(); assert.equal(sendRequests().length, 1);
    });
    await test('Rapid double click makes one submission while response is pending', async () => {
      let release; const gate = new Promise(resolve => {release = resolve;});
      await openBox({gate});
      await p.locator('#smGo').evaluate(el => {el.click(); el.click();}); await settle();
      assert.equal(sendRequests().length, 1); assert.ok(await p.locator('#smGo').isDisabled());
      assert.ok(await p.locator('#smDry').isDisabled()); release(); await settle();
      assert.equal(sendRequests().length, 1);
    });
    await test('Prepare another message requires confirmation for unresolved result', async () => {
      await openBox({abort: true}); await send();
      p.once('dialog', dialog => dialog.dismiss()); await p.locator('#smAgain').click();
      assert.ok(await p.locator('#smGo').isDisabled());
      p.once('dialog', dialog => dialog.accept()); await p.locator('#smAgain').click();
      assert.ok(!(await p.locator('#smGo').isDisabled())); assert.equal(sendRequests().length, 1);
    });
    await test('Out-of-order delivery reports reconcile by ID, not recipient order', async () => {
      await openBox({post: reply([accepted(), accepted(1)]), status: {messages: [delivery(1, 'failed'), delivery(0, 'delivered')]}}, NUMBERS.slice(0, 2));
      await send(); await refresh(); assert.match(await recipient(0), /delivered/i); assert.match(await recipient(1), /failed|not delivered/i);
    });
    await test('Missing or foreign report rows cannot confirm an unrelated delivery', async () => {
      await openBox({status: {messages: [{...delivery(2, 'delivered'), message_id: 'unrelated-id'}]}}); await send(); await refresh();
      assert.doesNotMatch(await recipient(0), /delivery confirmed|^.*\bDelivered\b/);
      assert.match(await recipient(0), /pending|accepted|unknown|unavailable/i);
    });
    await test('HTTP failure with provider UNKNOWN never asserts nothing was sent', async () => {
      await openBox({postHttp: 502, post: reply([{to: NUMBERS[0], status: 'UNKNOWN', message_id: null}], {error: 'The provider request timed out'})}); await send();
      assert.match(await recipient(0), /unknown|cannot confirm|could not confirm/i);
      assert.doesNotMatch(await p.locator('#smMsg').innerText(), /nothing was sent/i);
    });
    await test('Recipient numbers with spaces remain one number per comma/semicolon', async () => {
      await openBox({post: reply([accepted(), accepted(1)])});
      await p.locator('#smTo').fill('0400 000 001; 0400 000 002'); await send();
      assert.deepEqual(sendRequests()[0].body.to, ['0400000001', '0400000002']);
    });
    await test('No recipient makes no messaging request', async () => {
      await openBox(); await p.locator('#smTo').fill(''); await send();
      assert.equal(sendRequests().length, 0); assert.match(await p.locator('#smMsg').innerText(), /number|recipient/i);
    });
    await test('Unconfigured messaging keeps manual copy/open fallback', async () => {
      await openBox({configured: false}); assert.equal(await p.locator('#smGo').count(), 0);
      assert.ok(await p.locator('#smCopy').isVisible());
      assert.match(await p.locator('#smOpen').getAttribute('href'), /^sms:/);
      assert.equal(sendRequests().length, 0);
    });
    await test('Result and controls stay within the viewport', async () => {
      await openBox(); await send();
      const geometry = await drawer().evaluate(el => ({right: el.getBoundingClientRect().right, left: el.getBoundingClientRect().left,
        width: document.documentElement.clientWidth, scroll: el.scrollWidth, client: el.clientWidth}));
      assert.ok(geometry.left >= -1 && geometry.right <= geometry.width + 1, JSON.stringify(geometry));
      assert.ok(geometry.scroll <= geometry.client + 1, JSON.stringify(geometry));
    });
    report.pageErrors = session.errors;
    report.passed = report.tests.filter(t => t.pass).length; report.total = report.tests.length;
    report.productionMessagingWrites = 0; // All SMS/MMS routes above fulfill/abort; none continue.
  } finally { await session.browser.close(); }
  fs.writeFileSync(path.join(out, 'sms-browser-' + (mobile ? 'phone' : 'desktop') + '.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (report.passed !== report.total || report.pageErrors.length) process.exitCode = 1;
})().catch(e => {console.error(e.stack); process.exitCode = 1;});
