// navigation / scroll / load sweep: deep links, back & forward, tab scroll memory, drawer, search keys, showcase, reload
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const mode = process.argv[3] || 'desk', BASE = process.argv[2];
  const mk = async () => { const ctx = await browser.newContext({viewport: mode === 'phone' ? {width: 360, height: 740} : {width: 1280, height: 800}, isMobile: mode === 'phone', hasTouch: mode === 'phone'});
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push('PE ' + String(e).slice(0, 200))); page.on('console', m => { if (m.type() === 'error' && !/503|weather/.test(m.text())) errs.push('CE ' + m.text().slice(0, 160)); });
    page.on('response', r => { if (r.status() >= 400 && !/favicon|weather/.test(r.url())) errs.push('HTTP ' + r.status() + ' ' + r.url().slice(-60)); }); return {ctx, page, errs}; };
  const out = []; const say = (k, v) => { out.push(k + ' ' + JSON.stringify(v)); console.log(mode, k, JSON.stringify(v)); };
  const st = page => page.evaluate(() => ({tab: state.tab, hash: location.hash, scroll: Math.round(($('main') || document.scrollingElement).scrollTop), drawer: !!document.querySelector('#drawer.on, .drawer.on'), show: typeof SHOW !== 'undefined' && !!SHOW.open, overflowX: document.documentElement.scrollWidth > innerWidth + 1}));
  // 1. deep links
  { const {ctx, page, errs} = await mk();
    for (const h of ['#today', '#progress', '#timeline', '#plant', '#map', '#docs', '#coatesway', '#register', '#docs/photos', '#nothing-here', '']) {
      await page.goto(BASE + h, {waitUntil: 'load'}); await page.waitForTimeout(1200); say('deeplink ' + (h || '(none)'), await st(page)); }
    say('deeplink errors', errs); await ctx.close(); }
  // 2. back / forward through tabs, and the scroll each tab had
  { const {ctx, page, errs} = await mk(); await page.goto(BASE, {waitUntil: 'load'}); await page.waitForTimeout(1500);
    const tabs = mode === 'phone' ? ['plant', 'map', 'timeline'] : ['plant', 'map', 'timeline', 'docs'];
    for (const t of tabs) { await page.evaluate(t => document.querySelector(`#tabs [data-tab="${t}"]`).click(), t); await page.waitForTimeout(900);
      if (t === 'plant' || t === 'timeline') { await page.evaluate(() => { const m = $('main') || document.scrollingElement; m.scrollTop = 1400; }); await page.waitForTimeout(400); } }
    say('after clicks', await st(page));
    const trail = [];
    for (let i = 0; i < tabs.length; i++) { await page.goBack(); await page.waitForTimeout(900); trail.push(await st(page)); }
    say('back trail', trail.map(x => x.tab + '@' + x.scroll));
    await page.goForward(); await page.waitForTimeout(900); say('forward', await st(page));
    // return to plant via tab: its reading position is kept
    await page.evaluate(() => document.querySelector('#tabs [data-tab="plant"]').click()); await page.waitForTimeout(1200);
    say('plant return scroll', await st(page));
    say('plant rows after return', await page.evaluate(() => ({rows: document.querySelectorAll('#pane-plant tbody tr').length, pending: document.querySelectorAll('#pane-plant tr.plrest').length})));
    say('nav errors', errs); await ctx.close(); }
  // 3. drawer: open, Escape, back button closes it
  { const {ctx, page, errs} = await mk(); await page.goto(BASE + '#plant', {waitUntil: 'load'}); await page.waitForTimeout(1500);
    await page.evaluate(() => openAsset('P12')); await page.waitForTimeout(700); say('drawer open', await st(page));
    await page.keyboard.press('Escape'); await page.waitForTimeout(500); say('drawer after Esc', await st(page));
    await page.evaluate(() => openAsset('P12')); await page.waitForTimeout(700); await page.goBack(); await page.waitForTimeout(800); say('drawer after Back', await st(page));
    // search keys
    const q = await page.$('#q'); if (q && await q.isVisible()) { await q.fill('WC12'); await page.waitForTimeout(400); await page.keyboard.press('Enter'); await page.waitForTimeout(900); say('search Enter', await st(page));
      await page.keyboard.press('Escape'); await page.waitForTimeout(400); say('search Esc', await page.evaluate(() => ({q: document.querySelector('#q').value, finder: !document.querySelector('#finder').hidden}))); }
    else { await page.click('#searchBtn').catch(() => {}); await page.waitForTimeout(400); say('phone search open', await page.evaluate(() => ({vis: !!document.querySelector('#q').offsetParent, focus: document.activeElement && document.activeElement.id})));
      await page.fill('#q', 'WC12'); await page.waitForTimeout(400); await page.keyboard.press('Enter'); await page.waitForTimeout(900); say('phone search Enter', await st(page)); }
    // showcase open / Escape / Back
    await page.goto(BASE + '#progress', {waitUntil: 'load'}); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector('#showStart').click()); await page.waitForTimeout(1500); say('show open', await st(page));
    await page.keyboard.press('Escape'); await page.waitForTimeout(700); say('show after Esc', await st(page));
    await page.evaluate(() => document.querySelector('#showStart').click()); await page.waitForTimeout(1500); await page.goBack(); await page.waitForTimeout(900); say('show after Back', await st(page));
    say('drawer/show errors', errs); await ctx.close(); }
  // 4. reload keeps the tab; overflow on every tab at this width
  { const {ctx, page, errs} = await mk(); await page.goto(BASE + '#timeline', {waitUntil: 'load'}); await page.waitForTimeout(1200); await page.reload({waitUntil: 'load'}); await page.waitForTimeout(1200); say('reload', await st(page));
    const tabs = await page.evaluate(() => TABS.map(t => t[0]).filter(k => !TABS_OFF.has(k)));
    const over = [];
    for (const t of tabs) { await page.evaluate(t => go(t), t); await page.waitForTimeout(700); const o = await page.evaluate(() => { const W = innerWidth; const bad = [...document.querySelectorAll('.pane.on *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('.tblwrap, .daystrip, .mapstage, [style*="overflow"], .hscroll'); }).slice(0, 3).map(e => e.tagName + '.' + String(e.className).slice(0, 24) + ':' + Math.round(e.getBoundingClientRect().right)); return {page: document.documentElement.scrollWidth > W + 1, bad}; }); if (o.page || o.bad.length) over.push([t, o]); }
    say('overflow', over); say('reload errors', errs); await ctx.close(); }
  await browser.close(); })();
