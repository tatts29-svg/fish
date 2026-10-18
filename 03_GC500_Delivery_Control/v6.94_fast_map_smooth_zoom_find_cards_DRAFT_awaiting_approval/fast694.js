const {open} = require('./lh2'); const OUT = '/tmp/claude-0/stage4/shots/';
const PAGE = process.env.PAGE, TAG = process.env.TAG, MOB = !!process.env.MOB;
(async () => { const s = await open(MOB ? {pageFile: PAGE, hash: '#sheet/__satellite', W: 412, H: 915, dpr: 2, mobile: true} : {pageFile: PAGE, hash: '#sheet/__satellite'}); const p = s.page; const res = {};
  await p.waitForFunction(() => { try { return LIVEMAP.board && LIVEMAP.board.loaded() && document.querySelector('.wowfind'); } catch (e) { return false; } }, null, {timeout: 240000});
  await p.waitForTimeout(8000);
  await p.evaluate(() => { const r = document.querySelector('.satwrap').getBoundingClientRect(); window.scrollBy(0, r.top - 120); });
  const inp = p.locator('.wowfind'); await inp.click(); await inp.type('GN0', {delay: 60}); await p.waitForTimeout(800);
  res.sugs = await p.evaluate(() => [...document.querySelectorAll('.wowsug [role=option], .wowsug li, .wowsug button')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).slice(0, 8));
  try { await p.screenshot({path: OUT + TAG + '_find.png', timeout: 150000}); } catch (e) { res.shot1 = 'timeout'; }
  await inp.type('4', {delay: 60}); await p.keyboard.press('Enter'); await p.waitForTimeout(9000);
  res.card = await p.evaluate(() => { const c = document.querySelector('.wowcard'); return c ? c.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : null; });
  try { await p.screenshot({path: OUT + TAG + '_card.png', timeout: 150000}); } catch (e) { res.shot2 = 'timeout'; }
  res.errors = s.errors; console.log(JSON.stringify(res)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
