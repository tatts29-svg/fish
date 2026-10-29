// read-only: viewport screenshots of the Costs tab P&L card on the v12.56 candidate (desktop and phone)
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const PAGE = process.env.PAGE || '/home/user/fish/03_GC500_Delivery_Control/build/GC500_v12.56/GC500_Delivery_Control_hosted.html';
const OUTDIR = '/tmp/gc500-scratch/shots56';
(async () => {
  for (const [tag, W, H] of [['desktop', 1440, 1900], ['phone', 390, 2200]]) {
    const h = await open({pageFile: PAGE, hash: '#costs', W, H, ...(tag === 'phone' ? {dpr: 2, mobile: true} : {})});
    const p = h.page;
    try {
      await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
      await p.waitForTimeout(6000);
      await p.evaluate(() => { [...document.querySelectorAll('body *')].forEach(el => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height < 200) el.style.visibility = 'hidden'; }); });
      const ok = await p.evaluate(() => { const c = document.querySelector('.pl-cols'); if (!c) return false; const hdr = c.previousElementSibling; const top = (hdr || c).getBoundingClientRect().top + window.scrollY - 8; window.scrollTo(0, top); return true; });
      await p.waitForTimeout(1500);
      await p.screenshot({path: OUTDIR + '/' + tag + '-pl_viewport.png', animations: 'disabled', timeout: 60000});
      console.log(tag, 'pl viewport shot', ok, 'errors', h.errors.length);
    } catch (e) { console.log(tag, 'FAIL', String(e.message).slice(0, 200)); } finally { await h.browser.close(); }
  }
})();
