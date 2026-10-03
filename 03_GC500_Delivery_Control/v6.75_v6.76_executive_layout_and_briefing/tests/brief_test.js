// the executive briefing: open from Where we are, five scenes by keyboard, frozen stamp, Escape returns focus, no errors
const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const [w, h, tag] of [[1366, 768, 'desk'], [390, 844, 'phone']]) {
  const p = await (await b.newContext({viewport: {width: w, height: h}, isMobile: w < 500, hasTouch: w < 500})).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/weather|503/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto(process.argv[2] + '#progress', {waitUntil: 'load'}); await p.waitForTimeout(2500);
  await p.click('.briefgo'); await p.waitForTimeout(500);
  const stamp = await p.textContent('#briefStamp');
  for (let i = 0; i < 5; i++) { const s = await p.evaluate(() => ({pos: document.querySelector('#briefPos').textContent, h: (document.querySelector('#briefBody h2') || {}).textContent, over: document.querySelector('#briefBody').scrollWidth > document.querySelector('#briefBody').clientWidth + 2}));
    console.log(tag, JSON.stringify(s)); await p.screenshot({path: `shots/brief_${tag}_${i + 1}.png`}); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); }
  const closed = await p.evaluate(() => ({hidden: document.querySelector('#brief').hidden, focus: document.activeElement && (document.activeElement.className || document.activeElement.id)}));
  console.log(tag, 'stamp', stamp, 'after last Next', JSON.stringify(closed));
  await p.click('.briefgo'); await p.waitForTimeout(300); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  console.log(tag, 'after Esc', JSON.stringify(await p.evaluate(() => ({hidden: document.querySelector('#brief').hidden, inert: document.querySelectorAll('[inert]').length}))));
  console.log(tag, 'errors', JSON.stringify(errs)); }
  await b.close(); })();
