// Author: Andrew Fisher
// Read-only map-picture date regression: capture the actual canvas footer across Brisbane midnight.
// The shared harness blocks every service write. No SMS/MMS endpoint is called.
const fs = require('fs');
const path = require('path');
const {open} = require('../../toolchain/harness/open_page.js');

(async () => {
  const [pageFile, out = path.join(__dirname, 'date_boundary')] = process.argv.slice(2);
  fs.mkdirSync(out, {recursive: true});
  const s = await open({pageFile, W: 390, H: 844, mobile: true, dpr: 2});
  const p = s.page;
  const cases = [
    {at: '2026-09-30T13:59:58Z', day: '2026-09-30', footer: 'Wed 30 Sep 2026'},
    {at: '2026-09-30T14:00:02Z', day: '2026-10-01', footer: 'Thu 01 Oct 2026'},
    {at: '2026-09-30T23:59:58Z', day: '2026-10-01', footer: 'Thu 01 Oct 2026'},
    {at: '2026-10-01T00:00:02Z', day: '2026-10-01', footer: 'Thu 01 Oct 2026'},
  ];
  const result = {author: 'Andrew Fisher', cases: []};
  try {
    await p.waitForFunction(() => typeof mms757Picture === 'function' && allAssets().length > 50 && SYNC.status === 'live', null, {timeout: 240000});
    await p.waitForTimeout(1500);
    for (let i = 0; i < cases.length; i++) {
      const test = cases[i];
      await p.clock.setFixedTime(new Date(test.at));
      const actual = await p.evaluate(async () => {
        // Clear the existing one-second cache because the test deliberately resets the clock.
        TODAY_ISO.at = 0; TODAY_ISO.v = '';
        const original = CanvasRenderingContext2D.prototype.fillText;
        const footer = [];
        CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {
          if (this.canvas.width === MMS757.w && this.canvas.height === MMS757.h + MMS757.band && x === MMS757.w - 24 && y === MMS757.h + 78) footer.push(String(text));
          return original.call(this, text, x, y, ...rest);
        };
        try {
          const a = assetOf('GN03');
          const picture = await mms757Picture(a);
          return {day: todayIso(), isoIn: isoIn(new Date()), footer, pictureBytes: picture.bytes, dataUrl: picture.dataUrl};
        } finally { CanvasRenderingContext2D.prototype.fillText = original; }
      });
      fs.writeFileSync(path.join(out, `map_${i + 1}.jpg`), Buffer.from(actual.dataUrl.split(',')[1], 'base64'));
      delete actual.dataUrl;
      result.cases.push({...test, actual, passed: actual.day === test.day && actual.isoIn === test.day && actual.footer.length === 1 && actual.footer[0] === test.footer && actual.pictureBytes < 250000});
    }
    result.errors = s.errors;
    result.blockedWrites = s.counts.blocked;
    result.passed = result.cases.every(test => test.passed) && result.errors.length === 0;
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  } finally { await s.browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
