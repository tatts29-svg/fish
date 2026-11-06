// Author: Andrew Fisher. Exact category-name deduplication; descriptive scope and native controls stay intact.
// PAGE=<candidate> [OUT=dir] node v8.96_today_scene_DRAFT/tests/test_scope896.cjs
const fs = require('fs'), {open} = require('../../toolchain/harness/open_page');
(async () => {
 let session;
 try {
  session = await open({pageFile: process.env.PAGE, W: 1600, H: 1000});
  const p = session.page;
  await p.waitForFunction(() => typeof Scene896 === 'object' && SYNC.status === 'live' && todayWorkHealth840().ready, null, {timeout: 150000});
  await p.evaluate(() => go('today')); await p.waitForTimeout(700);
  let checks = 0;
  const check = (name, valid, detail) => { if (!valid) throw new Error(name + ': ' + JSON.stringify(detail)); checks++; console.log('PASS ' + name); };
  for (const width of [1600, 1440, 2560, 390]) {
   await p.setViewportSize({width, height: width === 390 ? 844 : width === 2560 ? 1370 : 1000});
   await p.evaluate(() => renderToday()); await p.waitForTimeout(250);
   const cards = await p.evaluate(() => {
    const clean = x => String(x || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-AU');
    return [...document.querySelectorAll('#gc500-work-board840 .tw848-card')].map(card => {
     const scope = card.querySelector('.tw840-scope'), title = card.querySelector('.tw846-title'), fold = card.querySelector('.tw848-group'),
      toggle = card.querySelector('.tw848-group-toggle'), header = card.querySelector('.tw840-top'), summary = card.querySelector('.tw846-summary');
     const a = toggle.getBoundingClientRect(), b = header.getBoundingClientRect();
     return {id: card.id, repeated: clean(scope.textContent) === clean(title.textContent), hidden: getComputedStyle(scope).display === 'none',
      title: title.textContent.trim(), titleVisible: title.getBoundingClientRect().width > 20 && parseFloat(getComputedStyle(title).fontSize) >= 28,
      fullWidth: Math.abs(summary.getBoundingClientRect().width - fold.getBoundingClientRect().width) <= 2,
      compact: Math.abs(a.top - b.top) <= 2 && a.height <= Math.max(80, b.height + 2),
      fold: fold.open && !!toggle.textContent.trim(), reviews: card.querySelectorAll('[data-tw840-detail],[data-tw853-detail]').length,
      motion: !!card.querySelector('[data-tw840-motion]')};
    });
   });
   check(width + ' px: exact repeated scope names are hidden; distinct descriptions and large headings remain',
    cards.length === 7 && cards.some(x => x.repeated) && cards.some(x => !x.repeated) && cards.every(x => x.hidden === x.repeated && x.titleVisible), cards);
   check(width + ' px: native controls share a compact row and instruments keep the whole card width',
    cards.every(x => x.fullWidth && x.compact && x.fold && x.reviews >= 1 && x.motion), cards);
  }
  const description = await p.evaluate(() => {
   const scope = document.querySelector('#tw840-card-generators .tw840-scope'), original = scope.textContent;
   scope.textContent = 'Generators for delivery and installation'; Scene896.mount();
   const kept = getComputedStyle(scope).display !== 'none' && !scope.hasAttribute('data-s896-duplicate-scope');
   scope.textContent = original; Scene896.mount();
   return kept && getComputedStyle(scope).display === 'none' && scope.textContent === original;
  });
  check('a distinct scope description is never hidden, and the original text is preserved', description);
  const sel = '#tw840-card-generators [data-tw848-group-fold]';
  await p.click(sel + ' > summary');
  check('closing the native fold shows its category name', await p.evaluate(sel => { const d = document.querySelector(sel); return !d.open && getComputedStyle(d.querySelector('.tw848-toggle-title')).clipPath === 'none'; }, sel));
  await p.click(sel + ' > summary');
  check('reopening keeps the native big title and suppresses only its duplicate scope', await p.evaluate(sel => { const d = document.querySelector(sel); return d.open && getComputedStyle(d.querySelector('.tw840-scope')).display === 'none' && d.querySelector('.tw846-title').getBoundingClientRect().width > 20; }, sel));
  await p.emulateMedia({media: 'print'});
  check('print retains the native scope text', await p.evaluate(() => getComputedStyle(document.querySelector('#tw840-card-generators .tw840-scope')).display !== 'none'));
  await p.emulateMedia({media: 'screen'});
  check('no runtime errors or attempted record writes', session.errors.length === 0 && session.counts.blocked === 0, {errors: session.errors, blocked: session.counts.blocked});
  console.log(checks + '/' + checks + ' scope checks');
 } finally { if (session) await session.browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
