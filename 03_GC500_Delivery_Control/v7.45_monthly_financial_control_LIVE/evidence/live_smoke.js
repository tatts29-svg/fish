// Author: Andrew Fisher. Actual public page, GET-only harness, never an edit link.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {execFileSync} = require('child_process');
const {open} = require('../../toolchain/harness/open_page');
const publicUrl = 'https://gc500-production.up.railway.app/v/Coates-GC500-2026';
const build = path.resolve(__dirname, '../../build/GC500_v7.45/GC500_Delivery_Control_hosted.html');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function run(mobile) {
 const s = await open({hash: '#costs', mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: 1});
 try {
  const p = s.page, consoleErrors = [];
  p.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await p.waitForFunction(() => typeof fin745ModelMarker === 'function' && SYNC.status === 'live', null, {timeout: 180000});
  const before = await p.evaluate(() => JSON.stringify(S));
  await p.evaluate(() => { go('costs'); FIN745_UI.month = '2026-09'; render(); });
  const month = p.locator('#fin745Month');
  const enabled = await month.isEnabled();
  await month.fill('2026-10'); await month.dispatchEvent('change');
  const october = await p.locator('#finance745').innerText();
  await p.locator('#fin745Month').fill('2026-09'); await p.locator('#fin745Month').dispatchEvent('change');
  const data = await p.evaluate(() => {
   const root = document.getElementById('finance745'), box = root.getBoundingClientRect();
   return {marker: fin745ModelMarker(), financeEvents: Object.keys(S.finance745 || {}).length, sourceShifts: fin745Rows().length, confirmedHours: fin745Summary().confirmedHours, unpricedShifts: fin745Summary().unpricedCount,
    guarded: [...root.querySelectorAll('[data-f745="billing"], [data-f745="rate"], [data-f745="journal"]')].every(b => b.disabled), readOnly: !canEdit(), restoredMonth: fin745SelectedMonth(), noOverflow: root.scrollWidth <= root.clientWidth + 1 && box.left >= -1 && box.right <= innerWidth + 1, record: JSON.stringify(S)};
  });
  const checks = {publicPage: s.counts.page === 0, monthNavigation: enabled && /October 2026/.test(october) && data.restoredMonth === '2026-09', viewOnly: data.guarded && data.readOnly, sourceAvailable: data.sourceShifts > 0, noRecordChanges: before === data.record, noOverflow: data.noOverflow, noPageErrors: s.errors.length === 0, noConsoleErrors: consoleErrors.length === 0, noWriteAttempts: s.counts.blocked === 0};
  delete data.record;
  await p.locator('#finance745 .fin745-metrics').scrollIntoViewIfNeeded();
  await p.screenshot({path: path.join(__dirname, 'live_finance_' + (mobile ? 'phone' : 'desktop') + '.png'), animations: 'disabled'});
  return {mobile, checks, data, pageErrors: s.errors, consoleErrors, recordWriteAttempts: s.counts.blocked};
 } finally { await s.browser.close(); }
}
(async () => {
 const bytes = execFileSync('curl', ['-fsS', '--max-time', '60', publicUrl], {maxBuffer: 20 * 1024 * 1024});
 const result = {author: 'Andrew Fisher', checkedAt: new Date().toISOString(), bytes: bytes.length, sha256: sha(bytes), servedTestedBuild: sha(bytes) === sha(fs.readFileSync(build)), runs: await Promise.all([run(false), run(true)])};
 fs.writeFileSync(path.join(__dirname, 'live_smoke.json'), JSON.stringify(result, null, 2) + '\n');
 console.log(JSON.stringify(result));
 if (!result.servedTestedBuild || result.runs.some(r => Object.values(r.checks).some(v => !v))) process.exitCode = 1;
})().catch(e => { console.error(e.message); process.exitCode = 1; });
