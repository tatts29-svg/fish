// full QA sweep of the live dashboard: errors, failed requests, broken images, overflow, bad text, click-fuzz per pane
const {chromium} = require('playwright'); const fs = require('fs');
(async () => {
  const phone = process.argv[3] === 'phone'; const url = process.argv[2];
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + fs.readFileSync('spki.txt', 'utf8').trim()]});
  const ctx = await browser.newContext({ignoreHTTPSErrors: true, viewport: phone ? {width: 390, height: 780} : {width: 1440, height: 900}, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone});
  const page = await ctx.newPage(); const errs = [], warns = [], net = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 220)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); else if (m.type() === 'warning') warns.push(m.text().slice(0, 120)); });
  page.on('response', r => { if (r.status() >= 400) net.push(r.status() + ' ' + r.url().slice(0, 120)); });
  page.on('dialog', d => d.dismiss());
  await page.addInitScript(() => { window.print = () => {}; window.open = () => null; });
  for (let k = 0; k < 3; k++) { try { await page.goto(url, {waitUntil: 'load', timeout: 120000}); break; } catch (e) {} } await page.waitForTimeout(5000);
  const tabs = await page.evaluate(() => TABS.map(t => t[0]).filter(k => !TABS_OFF.has(k)));
  const report = {};
  const audit = (t) => page.evaluate(t => { const p = document.getElementById('pane-' + t); if (!p) return {missing: true};
    const txt = p.innerText; const bad = []; for (const re of [/\bundefined\b/g, /\bNaN\b/g, /\[object Object\]/g, /\bnull\b/g, /—\s+—/g, /\$NaN/g, /Invalid Date/g]) { const m = txt.match(re); if (m) { const i = txt.search(re); bad.push(re.source + ' ×' + m.length + ' near "' + txt.slice(Math.max(0, i - 60), i + 40).replace(/\s+/g, ' ') + '"'); } }
    const W = document.documentElement.clientWidth; const over = [...p.querySelectorAll('*')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > W + 2 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 5).map(el => el.tagName + '.' + String(el.className).slice(0, 40) + ' right=' + Math.round(el.getBoundingClientRect().right));
    const imgs = [...p.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).slice(0, 5).map(i => (i.getAttribute('src') || '').slice(0, 80));
    const ids = {}; [...p.querySelectorAll('[id]')].forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; }); const dup = Object.entries(ids).filter(([, n]) => n > 1).map(([k]) => k).slice(0, 5);
    const deadGo = [...p.querySelectorAll('[data-go],[data-goto]')].map(e => e.dataset.go || e.dataset.goto).filter(k => TABS_OFF.has(k) && getComputedStyle(document.querySelector(`[data-go="${k}"],[data-goto="${k}"]`)).display !== 'none');
    const hscroll = document.querySelector('main') ? document.querySelector('main').scrollWidth > document.querySelector('main').clientWidth + 2 : false;
    return {badText: bad, overflow: over, brokenImgs: imgs, dupIds: dup, deadLinks: [...new Set(deadGo)], hscroll, chars: txt.length}; }, t);
  const SAFE = /^(print|export|import|email|send|upload|delete|set aside|attach|save|remove|variance|open the machine|full screen|own window|sign|clear|reset|refresh|download|copy|share)/i;
  for (const t of tabs) {
    const e0 = errs.length, n0 = net.length; await page.evaluate(t => go(t), t); await page.waitForTimeout(t === 'map' ? 4000 : 1200);
    const a = await audit(t);
    // click-fuzz: up to 25 visible buttons/chips in the pane, skipping anything that writes or opens something
    const handles = await page.$$(`#pane-${t} button, #pane-${t} [role="button"], #pane-${t} .chip[data-d], #pane-${t} summary`);
    let clicked = 0, skipped = 0; const clickErrs = [];
    for (const h of handles.slice(0, 60)) { if (clicked >= 25) break; try { const info = await h.evaluate(el => ({txt: (el.textContent || '').trim().slice(0, 40), vis: !!(el.offsetWidth || el.offsetHeight), dis: el.disabled, mopen: el.hasAttribute('data-mopen') || el.hasAttribute('data-mpage') || el.hasAttribute('data-open') || el.hasAttribute('data-eq') || el.hasAttribute('data-k')})); if (!info.vis || info.dis || SAFE.test(info.txt) || info.mopen) { skipped++; continue; } const eb = errs.length; await h.click({timeout: 2000, force: true}).catch(() => {}); await page.waitForTimeout(250); if (errs.length > eb) clickErrs.push(info.txt + ' → ' + errs[errs.length - 1]); clicked++; if (await page.evaluate(t => state.tab !== t, t)) { await page.evaluate(t => go(t), t); await page.waitForTimeout(600); } } catch (e) {} }
    // any modal left open? close it
    await page.evaluate(() => { const m = document.getElementById('machine'); if (m && !m.hidden) machineClose(); const s = document.getElementById('showcase'); if (s && !s.hidden) { const b = s.querySelector('button'); } document.querySelectorAll('dialog[open]').forEach(d => d.close()); });
    report[t] = Object.assign(a, {clicked, skipped, clickErrs, newErrs: errs.slice(e0), newNet: net.slice(n0)});
  }
  report._warns = [...new Set(warns)].slice(0, 8); report._errsTotal = errs.length;
  console.log(JSON.stringify(report)); await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
