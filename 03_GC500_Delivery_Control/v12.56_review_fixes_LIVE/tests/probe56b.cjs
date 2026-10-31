// read-only: v12.56 screenshots (Today plates, Costs P&L, tracker strip) + tracker night list check
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
const PAGE = process.env.PAGE || '/home/user/fish/03_GC500_Delivery_Control/build/GC500_v12.56/GC500_Delivery_Control_hosted.html';
const OUTDIR = process.env.OUTDIR || '/tmp/gc500-scratch/shots56';
fs.mkdirSync(OUTDIR, {recursive: true});
(async () => {
  const R = {};
  for (const [tag, W, H] of [['desktop', 1440, 1400], ['phone', 390, 844]]) {
    const h = await open({pageFile: PAGE, hash: '#today', W, H, ...(tag === 'phone' ? {dpr: 2, mobile: true} : {})});
    const p = h.page; const r = {};
    try {
      await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
      await p.waitForTimeout(6000);
      await p.evaluate(() => { const row = [...document.querySelectorAll('section, article, div')].find(el => /Build complete/.test(el.textContent || '') && (el.textContent || '').length < 400 && el.querySelector('button')); const btn = row && [...row.querySelectorAll('button')].find(b => /show/i.test(b.textContent || '')); if (btn) btn.click(); });
      await p.waitForTimeout(3000);
      const hide = () => p.evaluate(() => { [...document.querySelectorAll('body *')].forEach(el => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height < 200) el.style.visibility = 'hidden'; }); });
      await hide();
      const shotBy = async (key, finder, arg) => {
        try {
          const handle = await p.evaluateHandle(finder, arg); const el = handle.asElement();
          if (!el) { r[key] = 'not found'; return; }
          await el.scrollIntoViewIfNeeded({timeout: 15000}); await p.waitForTimeout(1200);
          await el.screenshot({path: OUTDIR + '/' + tag + '-' + key + '.png', timeout: 60000, animations: 'disabled'});
          r[key] = 'ok';
        } catch (e) { r[key] = 'fail ' + String(e.message || e).slice(0, 100); }
      };
      // Today plates: the wrapper of the group cards
      await shotBy('plates', () => { const g = document.querySelector('.grp[data-disc]'); return g ? g.parentElement : null; });
      for (const d of ['Access & plant', 'Furniture', 'Ground protection']) await shotBy('plate_' + d.replace(/\W+/g, '_'), (disc) => document.querySelector('.grp[data-disc="' + disc + '"]'), d);
      // Costs P&L
      await p.evaluate(() => go('costs')); await p.waitForTimeout(4000); await hide();
      await shotBy('costs_pl', () => { const c = document.querySelector('.pl-cols'); if (!c) return null; let el = c; for (let i = 0; i < 3 && el.parentElement && el.parentElement.tagName !== 'MAIN'; i++) el = el.parentElement; if (el.tagName === 'DETAILS') el.open = true; return el; });
      // Servicing tracker
      await p.evaluate(() => go('servicing')); await p.waitForTimeout(12000);
      r.trackerPick = await p.evaluate(() => { const s = document.querySelector('[data-svc-tracker]'); if (!s) return 'no picker'; const opts = [...s.options].map(o => o.textContent.trim()); const want = [...s.options].findIndex(o => /GC500 servicing tracker/i.test(o.textContent)); if (want >= 0 && s.selectedIndex !== want) { s.selectedIndex = want; s.dispatchEvent(new Event('change', {bubbles: true})); } return {opts, selected: s.selectedIndex, value: s.value}; });
      await p.waitForTimeout(12000);
      await p.evaluate(() => { document.querySelectorAll('details[data-svc-history]').forEach(d => { if (!d.open) d.querySelector('summary').click(); }); });
      await p.waitForTimeout(1500);
      r.tracker = await p.evaluate(() => ({ history: [...document.querySelectorAll('details[data-svc-history] [data-svc-day]')].map(b => b.textContent.trim().replace(/\s+/g, ' ')), active: [...document.querySelectorAll('#pane-servicing .svc-days [data-svc-day]')].map(b => b.getAttribute('data-svc-day')), heading: (document.querySelector('#svc1063-h') || {}).textContent || null, flag: (document.querySelector('#pane-servicing .svc-ex') || {}).textContent || null }));
      await hide();
      await shotBy('tracker_strip', () => { const d = document.querySelector('details[data-svc-history]'); if (!d) return null; let el = d; for (let i = 0; i < 2 && el.parentElement; i++) el = el.parentElement; return el; });
      r.pageErrors = h.errors.length;
    } catch (e) { r.err = String(e).slice(0, 300); } finally { await h.browser.close(); }
    R[tag] = r;
  }
  fs.writeFileSync(OUTDIR + '/probe56b.json', JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1));
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(1); });
