const {open} = require('./lh3'); const OUT = '/tmp/claude-0/stage7/shots/';
const MOB = !!process.env.MOB, TAG = process.env.TAG || 'd699';
(async () => { const s = await open(MOB ? {pageFile: process.env.PAGE, W: 412, H: 915, dpr: 2, mobile: true} : {pageFile: process.env.PAGE}); const p = s.page; const res = {};
  await p.waitForFunction(() => typeof go === 'function' && typeof gc500PlanCard === 'function', null, {timeout: 120000}); await p.waitForTimeout(2500);
  res.tabLabel = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find(x => /Map explorer/.test(x.textContent) && x.offsetParent); return b ? b.textContent.replace(/\s+/g, ' ').trim() : null; });
  await p.evaluate(() => go('map'));
  await p.waitForFunction(() => { const f = document.querySelector('#expwrap iframe'); try { return f && f.contentWindow.__ready && f.contentWindow.GC500Explorer && f.contentWindow.GC500Explorer.mode3d; } catch (e) { return false; } }, null, {timeout: 240000});
  res.paneButtons = await p.evaluate(() => [...document.querySelectorAll('#pane-map button')].filter(b => b.offsetParent).map(b => b.textContent.trim()));
  const fr = () => p.frames().find(f => /explorer\/index\.html/.test(f.url()));
  // find GN04 in the explorer: card with status + photo + open
  await fr().evaluate(() => { const q = document.getElementById('q'); q.value = 'GN04'; q.dispatchEvent(new Event('input')); document.querySelector('#results [data-code]').click(); });
  await p.waitForTimeout(3000);
  res.card = await fr().evaluate(() => { const c = document.getElementById('xcard'); return c && !c.hidden ? {text: c.innerText.replace(/\s+/g, ' ').trim(), img: !!c.querySelector('img'), open: !!c.querySelector('[data-xopen]')} : null; });
  try { await p.screenshot({path: OUT + TAG + '_2d_card.jpg', type: 'jpeg', quality: 80, timeout: 150000}); } catch (e) { res.shot1 = 'timeout'; }
  await fr().evaluate(() => document.querySelector('#xcard [data-xopen]').click()); await p.waitForTimeout(1500);
  res.drawer = await p.evaluate(() => { const d = document.querySelector('#drawer'); return !!(d && (d.classList.contains('on') || d.getAttribute('aria-hidden') === 'false')); });
  await p.evaluate(() => { if (typeof closeDrawer === 'function') closeDrawer(); });
  // an old 3D link lands in the explorer's 3D mode
  await p.evaluate(() => { location.hash = '#sheet/__satellite3d'; }); await p.waitForTimeout(2500);
  await p.waitForFunction(() => { const f = document.querySelector('#expwrap iframe'); try { return f.contentDocument.body.classList.contains('in3d'); } catch (e) { return false; } }, null, {timeout: 60000}).catch(() => {});
  res.old3dLink = await p.evaluate(() => ({hash: location.hash, sheet: state.sheet, in3d: (() => { try { return document.querySelector('#expwrap iframe').contentDocument.body.classList.contains('in3d'); } catch (e) { return null; } })()}));
  await p.waitForTimeout(20000);
  try { await p.screenshot({path: OUT + TAG + '_3d.jpg', type: 'jpeg', quality: 80, timeout: 150000}); } catch (e) { res.shot2 = 'timeout'; }
  // Coates Way overlay offers no second map
  await p.evaluate(() => { if (typeof machineOpen === 'function') machineOpen('machine'); }); await p.waitForTimeout(1500);
  res.overlayPages = await p.evaluate(() => [...document.querySelectorAll('#machine [data-mpage]')].filter(b => b.offsetParent).map(b => b.textContent.trim()));
  await p.evaluate(() => { if (typeof machineClose === 'function') machineClose(); });
  res.errors = s.errors; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
