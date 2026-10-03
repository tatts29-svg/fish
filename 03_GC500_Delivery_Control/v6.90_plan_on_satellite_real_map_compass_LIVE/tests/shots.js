// Plan on satellite: look at it. Fit, face north, face south, zoom on Surfers, the inset's true place; desk and phone
const {open, settle} = require('/tmp/claude-0/stage2/tools/harness2');
const V = process.argv[2] || 'after', PHONE = process.argv[3] === 'phone';
const DIRS = V === 'before' ? ['/tmp/claude-0/stage/work/before_site'] : ['/tmp/claude-0/stage2/explorer', '/tmp/claude-0/stage/work/before_site'];
(async () => { process.env.GL = '1';
  const s = await open({dirs: DIRS, W: PHONE ? 390 : 1440, H: PHONE ? 844 : 900, dpr: PHONE ? 3 : 1, mobile: PHONE, hash: '#hybrid', log: () => {}}); const p = s.page;
  await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000}); await settle(p); await p.waitForTimeout(1500);
  const tag = (V + '_' + (PHONE ? 'phone' : 'desk'));
  const shot = async n => { await settle(p, 90000); await p.waitForTimeout(600); await p.screenshot({path: `/tmp/claude-0/stage2/${tag}_${n}.png`, timeout: 120000}); };
  await shot('1_fit');
  const faceSel = f => V === 'before' ? null : `#dial [data-face="${f}"]`;
  if (V !== 'before') { await p.click(faceSel(0)); await p.waitForTimeout(900); await shot('2_north');
    await p.click(faceSel(180)); await p.waitForTimeout(900); await shot('3_south');
    await p.click(faceSel(90)); await p.waitForTimeout(900); }
  else { await p.evaluate(() => document.getElementById('northBtn').click()); await p.waitForTimeout(900); await shot('2_north'); }
  await p.evaluate(() => { const b = [...document.querySelectorAll('.jump')].find(x => /Inset plan/.test(x.textContent)); b.click(); }); await p.waitForTimeout(900); await shot('4_inset');
  await p.evaluate(() => { const b = [...document.querySelectorAll('.jump')].find(x => /Surfers Paradise/.test(x.textContent)); b.click(); }); await p.waitForTimeout(900); await shot('5_surfers');
  console.log(tag, 'errors', JSON.stringify(s.errors), await p.evaluate(() => document.getElementById('rotOut').textContent));
  await s.browser.close(); })();
