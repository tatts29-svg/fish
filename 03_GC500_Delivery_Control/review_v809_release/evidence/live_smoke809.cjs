// Author: Andrew Fisher. Read-only smoke of the current public host and registered machine.
// PREPARED ONLY: run after registration and when the shared browser/GPU slot is free.
// OUT=/absolute/private/directory EXPECTED_PAGE_SHA256=<current published host hash>
//   NODE_PATH=... CHROMIUM_PATH=... node live_smoke809.cjs
// Uses the actual public page (no pageFile override), a newly created fetch cache,
// native Open/Back controls, and one browser at a time. All artifacts stay outside Git.
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const crypto = require('node:crypto');
const repo = path.resolve(__dirname, '../../..');
assert.ok(process.env.OUT && path.isAbsolute(process.env.OUT), 'OUT must be an absolute private directory');
assert.match(process.env.EXPECTED_PAGE_SHA256 || '', /^[a-f0-9]{64}$/, 'EXPECTED_PAGE_SHA256 must bind the current published host');
const requested = path.resolve(process.env.OUT);
fs.mkdirSync(requested, {recursive: true, mode: 0o700});
const OUT = fs.realpathSync(requested);
assert.ok(OUT !== repo && !OUT.startsWith(repo + path.sep), 'OUT must resolve outside the repository');
process.umask(0o077);
// Set before requiring curlfetch/open_page: the module captures this location once.
process.env.GC500_CACHE = fs.mkdtempSync(path.join(OUT, 'fresh-machine-cache-'));
const {open} = require('../../toolchain/harness/open_page');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const HOST = 'https://gc500-production.up.railway.app', VIEW = 'Coates-GC500-2026';
const EXPECTED_MACHINE = '7d2ff39f645696c212197f1bf0c7dfe8e4a01c232c4e3ca1dbea359b53500a1e';
const EXPECTED_APP = 'd2964c3138eb1b2429a542cfb598adb507ae345b6b92858c78231fdbe49ff3c8';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const report = {author: 'Andrew Fisher', machineSha256: EXPECTED_MACHINE, publicPageSha256: null, devices: [], failures: []};
function check(out, name, pass) { out.checks.push({name, pass: !!pass}); if (!pass) report.failures.push(out.device + ': ' + name); }

(async () => {
  const headers = {'x-gc500-token': VIEW, 'Cache-Control': 'no-cache'};
  const status = await curlFetch(HOST + '/api/machine', headers, 'GET');
  assert.equal(status.status, 200); const machine = JSON.parse(status.body);
  assert.equal(machine.sha256, EXPECTED_MACHINE); assert.equal(machine.files, 226); assert.equal(machine.ready, true);
  const host = await curlFetch(HOST + '/v/' + VIEW + '/', headers, 'GET');
  assert.equal(host.status, 200); report.publicPageSha256 = sha(host.body);
  assert.equal(report.publicPageSha256, process.env.EXPECTED_PAGE_SHA256);
  for (const [device, opts] of [['desktop', {W: 1440, H: 900}], ['phone', {W: 390, H: 844, dpr: 2, mobile: true}]]) {
    process.stdout.write(device + ': opening the current public host and machine\n');
    const out = {device, checks: [], pageErrors: [], consoleErrors: [], appSha256: null}; report.devices.push(out);
    let session;
    try {
      session = await open({hash: '#coatesway', ...opts, gl: true}); const p = session.page;
      p.on('console', m => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
      const appReads = [];
      p.on('response', response => {
        if (new URL(response.url()).pathname === '/w/' + VIEW + '/car-app.js') {
          appReads.push(response.body().then(b => { out.appSha256 = sha(b); }).catch(() => {}));
        }
      });
      await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.level === 'view' &&
        typeof MACHINE !== 'undefined' && MACHINE.status && MACHINE.status.ready &&
        document.querySelector('#cwOpenMachine') && !document.querySelector('#cwOpenMachine').disabled,
        null, {timeout: 180000});
      check(out, 'Host reports the expected machine set', await p.evaluate(expected => MACHINE.status.sha256 === expected, EXPECTED_MACHINE));
      await p.locator('#cwOpenMachine').click();
      await p.locator('#machineFrame iframe').waitFor({state: 'attached', timeout: 30000});
      const iframe = await p.locator('#machineFrame iframe').elementHandle(); const frame = await iframe.contentFrame();
      assert.ok(frame);
      await frame.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 300000});
      await frame.waitForFunction(() => !window.__cw.tween, null, {timeout: 120000});
      check(out, 'Machine runtime and visible canvas are ready', await frame.evaluate(() => {
        const cw = window.__cw, cv = document.querySelector('#canvas'), fallback = document.querySelector('#fallback');
        return !!(cw && cw.ready && cw.scene && cw.scene.children.length && typeof cw.pickAt === 'function' &&
          cv && cv.width > 0 && cv.height > 0 && cv.getBoundingClientRect().width > 0 && !cv.hidden && fallback && fallback.hidden);
      }));
      await Promise.all(appReads);
      check(out, 'Fresh served machine application matches the audited source', out.appSha256 === EXPECTED_APP);
      check(out, 'Native machine dialog is open', await p.evaluate(() => MACHINE.open && !document.querySelector('#machine').hidden));
      await p.screenshot({path: path.join(OUT, device + '-machine-open.png')});
      await p.locator('#machineClose').click();
      await p.waitForFunction(() => !MACHINE.open && document.querySelector('#machine').hidden && !document.querySelector('#machineFrame iframe'));
      check(out, 'Back closes and removes the machine frame', await p.evaluate(() =>
        !MACHINE.open && document.querySelector('#machine').hidden && !document.querySelector('#machineFrame iframe') && !document.body.classList.contains('machining')));
      check(out, 'Back returns focus to Open the machine', await p.evaluate(() => document.activeElement === document.querySelector('#cwOpenMachine')));
      check(out, 'Coates Way is usable after closing', await p.evaluate(() => state.tab === 'coatesway' &&
        !document.querySelector('#pane-coatesway').closest('[inert]') && !document.querySelector('#cwOpenMachine').disabled));
      await p.screenshot({path: path.join(OUT, device + '-machine-closed.png')});
      out.pageErrors = session.errors.slice(); out.blockedWrites = session.counts.blocked;
      check(out, 'No runtime page errors', out.pageErrors.length === 0);
      check(out, 'No machine console errors', out.consoleErrors.length === 0);
      check(out, 'No attempted operational writes', out.blockedWrites === 0);
    } catch (error) {
      out.privateError = String(error && error.stack || error);
      report.failures.push(device + ': smoke could not complete');
    } finally { if (session) await session.browser.close(); }
    process.stdout.write(device + ': ' + out.checks.filter(c => c.pass).length + '/' + out.checks.length + ' checks passed\n');
  }
})().catch(error => { report.privateError = String(error && error.stack || error); report.failures.push('Preflight did not match the registered machine/current host'); })
.finally(() => {
  fs.writeFileSync(path.join(OUT, 'live_smoke809_results.json'), JSON.stringify(report, null, 2) + '\n', {mode: 0o600});
  const checks = report.devices.flatMap(d => d.checks);
  process.stdout.write(JSON.stringify({author: report.author, publicPageSha256: report.publicPageSha256,
    machineSha256: report.machineSha256, passed: checks.filter(c => c.pass).length, total: checks.length,
    failures: report.failures.length, pageErrors: report.devices.reduce((n, d) => n + d.pageErrors.length, 0),
    consoleErrors: report.devices.reduce((n, d) => n + d.consoleErrors.length, 0)}) + '\n');
  process.exitCode = report.failures.length ? 1 : 0;
});
