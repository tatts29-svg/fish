const {open} = require('./lh2'); const fs = require('fs');
const PAGE = process.env.PAGE, OUT = '/tmp/claude-0/stage4/shots/';
(async () => { const s = await open({pageFile: PAGE, hash: '#prestarts', gl: false}); const p = s.page; const res = {};
  await p.waitForFunction(() => typeof ps7Print === 'function' && document.querySelector('#pane-prestarts .ps7box'), null, {timeout: 120000}).catch(() => {});
  await p.waitForTimeout(3000);
  res.box = await p.evaluate(() => { const b = document.querySelector('#pane-prestarts .ps7box'); return b ? b.innerText.replace(/\n+/g, ' | ').slice(0, 900) : 'NO BOX'; });
  res.timelineButton = await p.evaluate(() => !!document.querySelector('[data-print-prestart]'));
  await p.evaluate(() => { const b = document.querySelector('#pane-prestarts .ps7box'); if (b) b.scrollIntoView({block: 'start'}); window.scrollBy(0, -80); });
  await p.screenshot({path: OUT + 'ps697_page.png'});
  for (const iso of ['2026-09-28', '2026-09-30', '2026-10-07', '2026-10-02']) {
    await p.evaluate(() => { window.print = () => {}; });
    await p.evaluate(i => ps7Print(i), iso); await p.waitForTimeout(1500);
    const pdf = await p.pdf({preferCSSPageSize: true, printBackground: true});
    const f = OUT + 'Prestart_Coates_' + iso + '.pdf'; fs.writeFileSync(f, pdf);
    res['pages_' + iso] = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  }
  res.errors = s.errors; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
