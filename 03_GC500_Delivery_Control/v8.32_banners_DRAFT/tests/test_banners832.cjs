// Author: Andrew Fisher. GET-only all-route banner and original Today MP4 checks.
// Run serially under the shared browser lock. BASE is the pre-cleanup private host;
// PAGE is the final candidate, or omit PAGE and set PUBLIC=1 for actual-public smoke.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const toolchain = process.env.GC500_TOOLCHAIN || path.resolve(__dirname, '../../toolchain');
const {open} = require(path.join(toolchain, 'harness/open_page.js'));
if (!process.env.BASE || (!process.env.PAGE && !process.env.PUBLIC) || !process.env.OUT) throw Error('Set BASE, PAGE (or PUBLIC=1), and private OUT');
const source = fs.readFileSync(process.env.BASE, 'utf8');
const dataLine = source.split('\n').find(line => /^const DATA = /.test(line));
if (!dataLine) throw Error('Original DATA is unavailable');
const original = JSON.parse(dataLine.slice('const DATA = '.length).replace(/;\s*$/, ''));
const removedFiles = new Set(Object.values({...original.pageBanners, ...original.raceBanners}).map(item => original.media[item.src.media].file));
const out = process.env.OUT, mobile = !!process.env.MOB, checks = [], requests = [], consoleErrors = [];
fs.mkdirSync(out, {recursive: true});
let session;
function check(name, pass, evidence) {
  checks.push({name, pass: !!pass, evidence});
  console.log((pass ? 'PASS ' : 'FAIL ') + name);
}
async function player(page) {
  return page.locator('#pane-today .bhero[data-board="video"]').evaluate(fig => {
    const video = fig.querySelector('video'), button = fig.querySelector('.bplay');
    return {count: document.querySelectorAll('.bhero').length,
      playing: fig.classList.contains('playing'), paused: video.paused,
      time: video.currentTime, currentSrc: video.currentSrc,
      hasHandler: typeof button.onclick === 'function', label: button.innerText,
      sourceTypes: [...video.querySelectorAll('source')].map(node => node.type)};
  });
}
(async () => {
  try {
    session = await open({pageFile: process.env.PAGE || undefined, W: mobile ? 390 : 1440,
      H: mobile ? 844 : 1000, mobile, dpr: mobile ? 2 : 1});
    const page = session.page;
    page.on('request', request => { if ([...removedFiles].some(file => request.url().endsWith('/' + file))) requests.push(request.url()); });
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 180)); });
    await page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    check('Decorative selections are empty and all native headings remain available', await page.evaluate(() =>
      Object.keys(DATA.pageBanners).length === 0 && Object.keys(DATA.raceBanners).length === 0 &&
      TABS.every(([key]) => paneHeadingHtml(key).includes('id="panehead-' + key + '"'))));
    const tabs = await page.evaluate(() => TABS.map(([key]) => key));
    check('The complete native tab catalog is still present', tabs.length === 22, {count: tabs.length});
    for (const tab of tabs) {
      await page.evaluate(key => go(key), tab);
      await page.waitForTimeout(tab === 'map' ? 3500 : 500);
      const state = await page.evaluate(() => ({
        active: state.tab,
        decorative: document.querySelectorAll('.pgban, .rbhero, [data-refresh-fold="equipment-image"]').length,
        outsideToday: [...document.querySelectorAll('.bhero')].filter(node => !node.closest('#pane-today')).length,
        visible: !!document.querySelector('#pane-' + state.tab + '.on'),
      }));
      check('Route ' + tab + ' has no car banner outside Today', state.decorative === 0 && state.outsideToday === 0 && state.visible, state);
      if (['timeline', 'plant', 'costs', 'map'].includes(tab)) await page.screenshot({path: path.join(out, (mobile ? 'phone-' : 'desktop-') + tab + '.png')});
    }
    check('No removed banner image was requested on any route', requests.length === 0, {count: requests.length});
    await page.evaluate(() => {localStorage.setItem('gc500.band', 'shown'); go('today');});
    await page.locator('#pane-today .bhero[data-board="video"]').scrollIntoViewIfNeeded();
    const initial = await player(page);
    check('Today retains one wired video banner with original MP4 and WebM', initial.count === 1 && initial.hasHandler && initial.paused && initial.sourceTypes.includes('video/mp4') && initial.sourceTypes.includes('video/webm'), initial);
    // Suppress WebM in this browser only, exercising the retained MP4 directly.
    await page.locator('#pane-today .bhero video source[type="video/webm"]').evaluate(node => node.remove());
    await page.locator('#pane-today .bhero video').evaluate(video => video.load());
    await page.locator('#pane-today .bhero .bplay').click();
    await page.waitForFunction(() => {const video = document.querySelector('#pane-today .bhero video'); return video && !video.paused && video.currentTime > .3;}, null, {timeout: 25000});
    const playing = await player(page);
    check('The original MP4 plays after deliberate Play', playing.playing && !playing.paused && playing.time > .3 && /\.mp4(?:\?|$)/.test(playing.currentSrc), playing);
    await page.screenshot({path: path.join(out, (mobile ? 'phone-' : 'desktop-') + 'today-mp4.png')});
    await page.locator('#pane-today .bhero .bplay').click();
    const stopped = await player(page);
    check('Stop returns Today to its original still', stopped.paused && !stopped.playing && stopped.label === 'Play with sound', stopped);
    await page.evaluate(() => go('timeline'));
    await page.evaluate(() => go('today'));
    const returned = await player(page);
    check('Returning to Today mounts once without autoplay', returned.count === 1 && returned.paused && returned.hasHandler, returned);
    check('No horizontal page overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check('No browser errors or attempted operational writes', session.errors.length === 0 && consoleErrors.length === 0 && session.counts.blocked === 0,
      {pageErrors: session.errors, consoleErrors, blockedWrites: session.counts.blocked});
  } catch (error) {
    checks.push({name: 'Browser execution', pass: false, error: String(error.message)});
    console.error(error.message);
  } finally {
    if (session) await session.browser.close();
    const report = {author: 'Andrew Fisher', scope: process.env.PUBLIC ? 'Actual public host, no HTML replacement' : 'Final candidate through GET-only harness',
      mobile, at: new Date().toISOString(),
      candidate_sha256: process.env.PAGE ? crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex') : null,
      passed: checks.filter(item => item.pass).length, total: checks.length, checks};
    fs.writeFileSync(path.join(out, 'banner-checks.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({passed: report.passed, total: report.total}));
    if (report.passed !== report.total) process.exitCode = 1;
  }
})();
