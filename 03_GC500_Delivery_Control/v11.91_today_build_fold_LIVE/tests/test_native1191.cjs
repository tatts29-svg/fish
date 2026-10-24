// Author: Andrew Fisher. v11.91 on the real Today tab, reading the live record, writing nothing: the finished build folds behind one
// bar, closed by default and remembered; it opens for the jump buttons, a link to Where we are and anything scrolling into it; a
// redraw does not jump; paper prints as before; no redraw loop.
//   PAGE=build/GC500_v11.91/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1191.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const ready = () => p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && document.querySelector('#pane-today > #gc500-work-board840 .tw840-card') && document.querySelector('#pane-today > #ms1025') && document.getElementById('build1191'), null, {timeout: 120000});
  const edit = () => p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; applyCapability(); go('timeline'); go('today'); });
  const look = () => p.evaluate(() => {
    const T = document.getElementById('pane-today'), bar = document.getElementById('build1191'), shown = id => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; };
    const ms = document.getElementById('ms1025'), F = Build1191.facts(ms.querySelectorAll('.ms1025-area').length, ms.querySelectorAll('.ms1025-rest .ms1025-area').length), w = Build1191.words(F, document.documentElement.getAttribute('data-build1191') === 'open');
    const first = Build1191.PARTS.slice(0, 3).map(id => document.getElementById(id)).find(e => e && e.parentElement === T);
    return {attr: document.documentElement.getAttribute('data-build1191'), bar: !!bar, child: !!bar && bar.parentElement === T, before: !!bar && bar.nextElementSibling === first,
      parts: Build1191.PARTS.map(shown), keep: ['.acts793', '.staff988', '.sec793', '.hub', '.dsnband'].map(sel => { const e = T.querySelector(':scope > ' + sel); return !!e && getComputedStyle(e).display !== 'none'; }),
      text: bar ? [bar.querySelector('.b1191-title').textContent, bar.querySelector('.b1191-sub').textContent, bar.querySelector('.b1191-act').textContent] : [], want: [w.title, w.sub, w.act],
      expanded: bar ? bar.querySelector('.b1191-btn').getAttribute('aria-expanded') : '', h: Math.round(T.getBoundingClientRect().height),
      stored: (() => { try { return localStorage.getItem('gc500.build1191'); } catch (e) { return 'x'; } })(), over: document.documentElement.scrollWidth > innerWidth + 1};
  });
  // A tap, then the layout settles: the first open after a load re-measures the embedded view's screen-only packed cards in the
  // next frame (222 to 1,192 px on a desktop). One live run measured in the same instant and read 5,567 px instead of 6,615.
  const tap = async () => { await p.evaluate(() => document.querySelector('#build1191 .b1191-btn').click()); await p.waitForTimeout(400); };
  const shot = async name => { if (!dir) return; fs.mkdirSync(dir, {recursive: true});
    await p.evaluate(() => { const st = document.getElementById('blur1191') || Object.assign(document.createElement('style'), {id: 'blur1191', textContent: '.staff988 li,.tm-person{filter:blur(7px)}'}); document.head.appendChild(st); });
    await p.waitForTimeout(600); await p.screenshot({path: path.join(dir, tag + '-' + name + '.png')}); };
  const toTop = () => p.evaluate(() => { const m = document.querySelector('main'); if (m) m.scrollTop = 0; window.scrollTo(0, 0); });
  try {
    await ready(); await edit(); await ready(); await p.waitForTimeout(1500);

    // 1. Closed by default: one bar where the build began; the four parts folded; everything for now still there.
    let L = await look();
    check(L.attr === 'closed' && L.stored === null, 'a first visit opens with the fold closed');
    check(L.bar && L.child && L.before, 'one bar on Today, straight before the Where we are plate');
    check(L.parts.every(x => !x), 'the plate, the Work progress board, Milestones and the By group view are folded away');
    check(L.keep.every(Boolean), 'the Today card, Available staff, Site contacts, Who to call and the event banner stay');
    check(JSON.stringify(L.text) === JSON.stringify(L.want) && L.text[0] === 'Build complete' && /^7 of 7 areas at 100%/.test(L.text[1]) && L.text[2] === 'Show', 'the bar: ' + L.text.join(' | '));
    check(L.expanded === 'false' && !L.over, 'aria-expanded false; no sideways scroll');
    const look1191 = await p.evaluate(() => { const a = getComputedStyle(document.getElementById('build1191')), b = getComputedStyle(document.querySelector('#pane-today > .staff988')); return a.backgroundImage === b.backgroundImage && a.borderLeftColor === b.borderLeftColor && a.color === b.color && a.borderRadius === b.borderRadius; });
    check(look1191, 'the bar wears the Available staff card\'s housing');
    const closedH = L.h;
    check(closedH < (mobile ? 4000 : 3000), 'Today is now ' + closedH + ' px');
    await toTop(); await shot('today-closed');

    // 2. Tap: open, remembered; tap again: closed, remembered.
    await tap(); L = await look();
    check(L.attr === 'open' && L.parts.every(Boolean) && L.text[2] === 'Hide' && L.expanded === 'true' && L.stored === 'open', 'tap: everything is back, the bar says Hide, the phone remembers');
    check(L.h > closedH + 5000, 'Today with the fold open: ' + L.h + ' px');
    const openH = L.h;
    await p.evaluate(() => { const m = document.querySelector('main'), bar = document.getElementById('build1191'); m.scrollTop += bar.getBoundingClientRect().top - m.getBoundingClientRect().top - 12; });
    await shot('today-open'); await toTop();
    await tap(); L = await look();
    check(L.attr === 'closed' && L.parts.every(x => !x) && L.stored === 'closed', 'tap again: folded, remembered');

    // 3. A redraw while reading below the bar does not jump. (Measured once the scroll has settled: on a desktop the header slims
    //    after the scroll event, and on a short page that can pull the scroll back.)
    const hubTop = () => p.evaluate(() => Math.round(document.querySelector('#pane-today > .hub').getBoundingClientRect().top));
    await p.evaluate(() => { const m = document.querySelector('main'), hub = document.querySelector('#pane-today > .hub'); m.scrollTop = Math.max(0, hub.getBoundingClientRect().top - m.getBoundingClientRect().top + m.scrollTop - 40); });
    await p.waitForTimeout(900);
    const before = await hubTop();
    await p.evaluate(() => renderToday()); await p.waitForTimeout(600);
    const after = await hubTop();
    check(Math.abs(after - before) <= 4, 'a full redraw keeps Who to call where it was (' + before + ' → ' + after + ')');
    check((await look()).before, 'the bar is back in its place after the redraw');

    // 3b. Desktop: a Today short enough that the slim header would leave nothing to scroll keeps the full header, and scrolls.
    //     (Before v11.91 the header flipped on every turn of the wheel there and the page sprang back to the top.)
    let slimRun = null;
    if (!mobile) {
      await toTop(); await p.waitForTimeout(400);
      const room = await p.evaluate(() => { const m = document.querySelector('main'); return m.scrollHeight - m.clientHeight; });
      const H = 1000 + room - 130;                     // the window height that leaves 130 px to scroll under the full header
      await p.setViewportSize({width: 1440, height: H}); await p.waitForTimeout(700); await toTop(); await p.waitForTimeout(400);
      const at = await p.evaluate(() => { const m = document.querySelector('main'), h = document.querySelector('header.top'), r = m.getBoundingClientRect(); window.__flips1191 = 0; let was = h.classList.contains('slim89');
        window.__mo1191 = new MutationObserver(() => { const now = h.classList.contains('slim89'); if (now !== was) { window.__flips1191++; was = now; } }); window.__mo1191.observe(h, {attributes: true, attributeFilter: ['class']});
        return {x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 200), room: m.scrollHeight - m.clientHeight}; });
      await p.mouse.move(at.x, at.y);
      for (let k = 0; k < 6; k++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(160); }
      await p.waitForTimeout(900);
      slimRun = await p.evaluate(() => { window.__mo1191.disconnect(); const m = document.querySelector('main'); return {flips: window.__flips1191, top: Math.round(m.scrollTop), room: m.scrollHeight - m.clientHeight, slim: document.querySelector('header.top').classList.contains('slim89')}; });
      slimRun.H = H;
      check(slimRun.flips <= 1 && slimRun.top > 0 && Math.abs(slimRun.top - slimRun.room) <= 2, 'a ' + H + ' px window: the header held (' + slimRun.flips + ' flips) and the page scrolled to its foot (' + slimRun.top + ' of ' + slimRun.room + ' px)');
      await p.setViewportSize({width: 1440, height: 1000}); await p.waitForTimeout(700); await toTop(); await p.waitForTimeout(400);
    }

    // 4. No redraw loop: Today's top level stays quiet.
    const quiet = await p.evaluate(() => new Promise(res => { let n = 0; const o = new MutationObserver(r => { n += r.length; }); o.observe(document.getElementById('pane-today'), {childList: true}); setTimeout(() => { o.disconnect(); res(n); }, 8000); }));
    check(quiet <= 6, 'Today\'s top level changed ' + quiet + ' times in 8 s (no loop)');

    // 5. The jump buttons that lead into the fold open it and land.
    await toTop();
    const jumps = await p.evaluate(() => [...document.querySelectorAll('#pane-today .jump95 .jb95')].map(b => b.textContent.trim()));
    check(jumps.includes('Today') && jumps.some(t => /By group|Work progress/.test(t)), 'jump buttons: ' + jumps.join(', '));
    const label = await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-today .jump95 .jb95')].find(x => /By group|Work progress/.test(x.textContent)); b.click(); return b.textContent.trim(); });
    await p.waitForTimeout(2300);
    const landed = await p.evaluate(n => { const m = document.querySelector('main').getBoundingClientRect(), el = jump799(n), t = el && el.getBoundingClientRect(); return {open: document.documentElement.getAttribute('data-build1191'), top: t ? Math.round(t.top - m.top) : null, inFold: !!el && !!el.closest('#pane-today > #gc500-work-board840, #pane-today > #pane-progress')}; }, label);
    check(landed.open === 'open' && landed.inFold && landed.top > -20 && landed.top < 200, label + ': the fold opens and the page lands on it (' + landed.top + ' px from the top)');
    await p.evaluate(() => window.gc500Build1191.close());
    await toTop();
    await p.evaluate(() => [...document.querySelectorAll('#pane-today .jump95 .jb95')].find(b => b.textContent.trim() === 'Site contacts').click());
    await p.waitForTimeout(1200);
    check((await look()).attr === 'closed', 'Site contacts leaves the fold closed');

    // 6. A link to Where we are, and anything scrolling into the fold, open it.
    await p.evaluate(() => go('progress')); await p.waitForTimeout(2500);
    L = await look();
    check(L.attr === 'open' && L.parts[3], 'go(\'progress\'): the fold opens on the By group view');
    await p.evaluate(() => window.gc500Build1191.close());
    await p.evaluate(() => document.getElementById('ms1025').scrollIntoView({block: 'start'}));
    check((await look()).attr === 'open', 'scrolling to Milestones opens the fold');
    await p.evaluate(() => window.gc500Build1191.close());
    await p.evaluate(() => document.querySelector('#pane-today > .hub').scrollIntoView({block: 'start'}));
    check((await look()).attr === 'closed', 'scrolling to Who to call does not');

    // 7. Paper prints as before: the parts print, the bar does not.
    await p.emulateMedia({media: 'print'});
    const paper = await p.evaluate(() => ({board: getComputedStyle(document.getElementById('gc500-work-board840')).display, bar: getComputedStyle(document.getElementById('build1191')).display}));
    check(paper.board !== 'none' && paper.bar === 'none', 'print: the Work progress board prints, the bar does not');
    await p.emulateMedia({media: 'screen'});

    // 8. Remembered across a reload, on the view link too.
    await tap(); check((await look()).stored === 'open', 'opened and remembered');
    await p.reload({waitUntil: 'load', timeout: 180000}); await ready(); await p.waitForTimeout(1500);
    L = await look();
    check(L.attr === 'open' && L.parts.every(Boolean), 'after a reload (view link) the fold is still open');
    await tap(); L = await look();
    check(L.attr === 'closed' && L.parts.every(x => !x) && L.stored === 'closed', 'and closes again on the view link');
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, closedH, openH, jumps, quiet, redraw: [before, after], slimRun}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v11.91 native: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
