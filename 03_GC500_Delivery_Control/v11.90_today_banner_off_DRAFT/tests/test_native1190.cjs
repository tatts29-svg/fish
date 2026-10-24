// Author: Andrew Fisher. v11.90 on the real Today tab, reading the live record, writing nothing: the "areas at 100%" banner is gone,
// the Milestones section, its prints and the board's 100% badges stay, and Celebrate again still bursts.
//   PAGE=build/GC500_v11.90/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1190.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1,
    init: 'window.__burst1190 = 0; var ce1190 = Document.prototype.createElement; Document.prototype.createElement = function (t) { var e = ce1190.apply(this, arguments); if (String(t).toLowerCase() === "canvas") window.__burst1190++; return e; };'}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  try {
    const ready = () => p.waitForFunction(() => document.querySelector('#pane-today #gc500-work-board840 .tw840-card') && document.querySelector('#pane-today #ms1025') && typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 120000});    // the live record, not the built-in copy
    const look = () => p.evaluate(() => {
      const pane = document.getElementById('pane-today'), ms = document.getElementById('ms1025'), M = window.MS1025;
      const all = M && typeof M.allFacts === 'function' ? M.allFacts() : [], reached = all.filter(f => f.reached);
      return {banner: !!document.getElementById('ms1026'), reached: reached.length, section: !!ms, head: ms ? ms.querySelector('h2').textContent.replace(/\s+/g, ' ') : '',
        printAll: !!(ms && ms.querySelector('a[href="#print/milestone/all"]')), areas: ms ? ms.querySelectorAll('.ms1025-area').length : 0,
        prints: ms ? ms.querySelectorAll('a[href^="#print/milestone/"]').length : 0, badges: pane.querySelectorAll('#gc500-work-board840 .ms1025-reached').length};
    });
    await ready(); await p.waitForTimeout(1500);
    let L = await look();
    check(!L.banner, 'no "areas at 100%" banner at the top of Today');
    check(L.reached > 0 && L.section && L.head.includes(L.reached + ' area'), 'the Milestones section is there: ' + L.head.trim());
    check(L.printAll && L.areas >= L.reached && L.prints >= L.reached + 1, 'every area summary and its A4 print, and Print all, are still there');
    check(L.badges === L.reached, 'the Work progress board still badges each area at 100% (' + L.badges + ')');
    const before = await p.evaluate(() => window.__burst1190);
    check(await p.evaluate(() => { const b = document.querySelector('#ms1025 [data-ms1025-replay]'); if (!b) return false; const d = b.closest('details'); if (d) d.open = true; b.click(); return true; }), 'Celebrate again is there on a 100% area');
    await p.waitForTimeout(700);
    check(await p.evaluate(() => window.__burst1190) > before, 'and still runs its fireworks (where they land depends on the board redraw, as on the live page before)');

    // A redraw (leaving Today and coming back) and the edit link do not bring it back.
    await p.evaluate(() => { go('timeline'); });
    await p.waitForTimeout(500);
    await p.evaluate(() => { go('today'); });
    await ready(); await p.waitForTimeout(800);
    check(!(await look()).banner, 'still gone after leaving Today and coming back');
    await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; applyCapability(); go('timeline'); go('today'); });
    await ready(); await p.waitForTimeout(800);
    L = await look();
    check(!L.banner && L.section && L.printAll, 'on the edit link too');
    if (dir) { fs.mkdirSync(dir, {recursive: true}); await p.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('*').forEach(e => { if (e.scrollTop > 0) e.scrollTop = 0; }); document.querySelectorAll('.staff988 li').forEach(li => { li.style.filter = 'blur(7px)'; }); });    // no staff names in a picture await p.waitForTimeout(1200); await p.screenshot({path: path.join(dir, tag + '-today-top.png')}); }
    check(await p.evaluate(() => window.MS1026.screenBurst(1) === true && !!document.querySelector('canvas.ms1026-screen')), 'the screen burst itself still works (Celebrate again)');
    check(await p.evaluate(() => typeof location !== 'undefined') && await p.evaluate(() => { location.hash = '#print/milestone/all'; return true; }), 'Print all route reachable');
    await p.waitForTimeout(1500);
    check(await p.evaluate(() => /milestone/i.test(document.body.innerText) && !document.getElementById('ms1026')), 'the A4 milestone print opens');
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, reached: L.reached, head: L.head.trim()}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v11.90 native: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
