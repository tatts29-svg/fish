// Author: Andrew Fisher. v11.98 on the real page, reading the live record, writing nothing: the asset-number clash card is
// gone from Today, Today still draws, and the warning still rides with the number on P41 and P62 (each drawer's Contents notice).
//   PAGE=build/GC500_v11.98/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1198.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; console.log('ok   ' + msg); };
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 120000});
    await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; applyCapability(); go('today'); });
    await p.waitForTimeout(3000);
    const t = await p.evaluate(() => ({clash: document.querySelectorAll('#pane-today .clashcard').length, words: /delivered against two references|Plan lines overtaken by a delivery/.test(document.getElementById('pane-today').innerText),
      hubs: document.querySelectorAll('#pane-today .hubcard').length, foot: (document.getElementById('footL') || {}).textContent || '',
      clashes: (() => { try { return holdAssets(() => [...claimGrades().entries()].filter(([, g]) => g.grade === 'contradiction').map(([n, g]) => n + ' ' + g.keys.join('/'))); } catch (e) { return ['error ' + e.message]; } })()}));
    check(t.clash === 0 && !t.words, 'Today: no asset-number clash card');
    check(t.hubs >= 3, 'Today still draws its cards (' + t.hubs + ')');
    check(/· v11\.98$/.test(t.foot), 'footer: ' + t.foot.slice(-30));
    check(t.clashes.includes('1189908 P41/P62'), 'the record still holds the clash: ' + t.clashes.join(', '));
    /* the warning rides with the number: P41's and P62's drawers name the other reference */
    for (const [k, other] of [['P41', 'P62'], ['P62', 'P41']]) {
      await p.evaluate(k => openAsset(k), k);
      await p.waitForTimeout(1500);
      const d = await p.evaluate(() => { const n = document.querySelector('#drawer .cclash'); return n ? n.textContent.replace(/\s+/g, ' ') : ''; });
      check(d.includes('1189908') && d.includes(other) && /on another reference too/.test(d), k + ' drawer, under Contents and accessories, still warns: ' + d.slice(0, 140));
      if (dir) { fs.mkdirSync(dir, {recursive: true}); await p.screenshot({path: path.join(dir, tag + '-drawer-' + k + '.png')}); }
      await p.evaluate(() => { try { closeDrawer(); } catch (e) { const b = document.querySelector('#drawer .x, #drawer [data-close]'); if (b) b.click(); } });
      await p.waitForTimeout(600);
    }
    if (dir) { await p.evaluate(() => go('today')); await p.waitForTimeout(1500); await p.addStyleTag({content: '.staff988 li,.tm-person{filter:blur(7px)}'}); await p.screenshot({path: path.join(dir, tag + '-today.png'), fullPage: false}); }
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v11.98 native: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
