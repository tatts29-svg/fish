// read-only: final v12.56 candidate checks + P&L card and map screenshots, desktop and phone
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
const PAGE = process.env.PAGE || '/home/user/fish/03_GC500_Delivery_Control/build/GC500_v12.56/GC500_Delivery_Control_hosted.html';
const OUTDIR = process.env.OUTDIR || '/tmp/gc500-scratch/shots56';
fs.mkdirSync(OUTDIR, {recursive: true});
(async () => {
  const R = {};
  for (const [tag, W, H] of [['desktop', 1440, 1200], ['phone', 390, 844]]) {
    const h = await open({pageFile: PAGE, hash: '#costs', W, H, ...(tag === 'phone' ? {dpr: 2, mobile: true} : {})});
    const p = h.page; const r = {};
    try {
      await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
      await p.waitForTimeout(6000);
      r.tabs = await p.evaluate(() => ({ off: [...TABS_OFF], bar: [...document.querySelectorAll('.tabs button')].map(b => b.textContent.trim()).filter(Boolean), menu: [...document.querySelectorAll('#mmViews [data-goto]')].map(b => b.getAttribute('data-goto')), charge: moneySummary().charge.total, footer: (document.body.innerText.match(/v12\.\d+(?:\.\d+)?/g) || []).slice(-1)[0] }));
      const hide = () => p.evaluate(() => { [...document.querySelectorAll('body *')].forEach(el => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height < 200) el.style.visibility = 'hidden'; }); });
      const shotBy = async (key, finder, arg) => { try { const handle = await p.evaluateHandle(finder, arg); const el = handle.asElement(); if (!el) { r[key] = 'not found'; return; } await el.scrollIntoViewIfNeeded({timeout: 15000}); await p.waitForTimeout(1200); await el.screenshot({path: OUTDIR + '/' + tag + '-' + key + '.png', timeout: 60000, animations: 'disabled'}); r[key] = 'ok'; } catch (e) { r[key] = 'fail ' + String(e.message || e).slice(0, 100); } };
      await hide();
      await shotBy('pl_card', () => { const c = document.querySelector('.pl-cols'); if (!c) return null; const sec = c.closest('section, article, details, .card'); if (sec && sec.tagName === 'DETAILS') sec.open = true; return sec || c.parentElement; });
      // Today groups summary
      await p.evaluate(() => go('today')); await p.waitForTimeout(4000);
      await p.evaluate(() => { const row = [...document.querySelectorAll('section, article, div')].find(el => /Build complete/.test(el.textContent || '') && (el.textContent || '').length < 400 && el.querySelector('button')); const btn = row && [...row.querySelectorAll('button')].find(b => /show/i.test(b.textContent || '')); if (btn) btn.click(); });
      await p.waitForTimeout(2000);
      r.groups = await p.evaluate(() => [...document.querySelectorAll('.grp[data-disc]')].map(g => [g.getAttribute('data-disc'), g.className.replace('grp', '').trim(), (g.querySelector('.n') || {}).textContent]));
      // Map explorer before/after
      await p.evaluate(() => go('map')); await p.waitForTimeout(9000);
      r.mapBar = await p.evaluate(() => { const bar = document.getElementById('map1147-controls'); return bar ? {hasSwitch: !!bar.querySelector('#map1256-left'), checked: !!(bar.querySelector('#map1256-left') || {}).checked} : null; });
      const fr = await p.$('#expwrap iframe'); const frame = fr ? await fr.contentFrame() : null;
      const inside = async () => { if (!frame) return 'no frame'; try { return await frame.evaluate(() => ({ module: !!window.GC500MapLeft1256, showLeft: window.GC500MapLeft1256 ? GC500MapLeft1256.state.showLeft : null, keyHidden: (document.getElementById('map1256-key') || {}).hidden })); } catch (e) { return 'err ' + String(e.message).slice(0, 80); } };
      r.insideBefore = await inside();
      await hide();
      await shotBy('map_before', () => document.getElementById('expcard'));
      await p.evaluate(() => { const b = [...document.querySelectorAll('#expcard button')].find(x => /^satellite only$/i.test((x.textContent || '').trim())); if (b) b.click(); });
      await p.waitForTimeout(3500);
      await p.evaluate(() => { const c = document.getElementById('map1256-left'); if (c) { c.checked = true; c.dispatchEvent(new Event('change', {bubbles: true})); } });
      await p.waitForTimeout(3000);
      r.insideAfter = await inside();
      await shotBy('map_after', () => document.getElementById('expcard'));
      r.pageErrors = h.errors.length;
    } catch (e) { r.err = String(e).slice(0, 300); } finally { await h.browser.close(); }
    R[tag] = r;
  }
  fs.writeFileSync(OUTDIR + '/probe56c.json', JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1));
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(1); });
