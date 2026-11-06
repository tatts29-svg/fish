/* Author: Andrew Fisher. Read-only browser reproduction on an original page and a candidate. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {open} = require(path.join(__dirname, '../../toolchain/harness/open_page.js'));
const live = process.env.LIVE === '1';
const cliPaths = process.argv.slice(2);
assert(!live || cliPaths.length === 0, 'LIVE=1 must not include local HTML paths');
const paths = live ? [undefined] : cliPaths;
assert(paths.length, 'Supply original and/or candidate HTML paths, or set LIVE=1');
(async () => {
  for (const pageFile of paths) {
    const mobile = process.env.MOB === '1', fixed = live || fs.readFileSync(pageFile, 'utf8').includes('let costsScroll1065 = 0;');
    const s = await open({pageFile, hash: '#plant', W: mobile ? 390 : 1440, H: mobile ? 844 : 900, mobile, dpr: mobile ? 2 : 1, gl: false});
    try {
      const p = s.page;
      const patchPresent = await p.evaluate(() => Array.from(document.scripts).some(script => (script.textContent || '').includes('let costsScroll1065 = 0;')));
      assert.equal(patchPresent, fixed, live ? 'Live page must contain the Costs scroll patch' : 'Served page must match the local patch state');
      if (live) assert.equal(s.counts.page, 0, 'Live mode must not serve a local page');
      await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && Object.keys(SYNC_COLLS).every(k => SYNC.first.has(k)), null, {timeout: 90000});
      await p.evaluate(() => { go('costs'); }); await p.waitForTimeout(800);
      await p.evaluate(() => { eq796s().reveal = true; go('plant'); }); await p.waitForTimeout(800);
      const arrival = await p.evaluate(async () => {
        const main = document.querySelector('main');
        const source = Math.min(600, main.scrollHeight - main.clientHeight);
        if (source < 100) throw new Error('Equipment list too short for arrival reproduction: ' + source);
        main.scrollTop = source; TAB_SCROLL.costs = 0; go('costs');
        const expected = main.scrollTop;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return {source, expected, actual: main.scrollTop};
      });
      const lateTab = await p.evaluate(async () => {
        const main = document.querySelector('main');
        main.scrollTop = 600; const source = main.scrollTop; renderCosts(); TAB_SCROLL.demob = 0; go('demob');
        const expected = main.scrollTop;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return {source, expected, actual: main.scrollTop};
      });
      await p.evaluate(() => go('costs')); await p.waitForTimeout(500);
      const refresh = await p.evaluate(async () => {
        const main = document.querySelector('main'); main.scrollTop = 600;
        const expected = main.scrollTop; renderCosts();
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return {expected, actual: main.scrollTop};
      });
      const input = await p.evaluate(async () => {
        const main = document.querySelector('main'); main.scrollTop = 600; renderCosts();
        document.dispatchEvent(new WheelEvent('wheel', {bubbles: true, deltaY: 100})); main.scrollTop = 900;
        const expected = main.scrollTop;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return {expected, actual: main.scrollTop};
      });
      const movedAfterRender = await p.evaluate(async () => {
        const main = document.querySelector('main'); main.scrollTop = 600; renderCosts();
        main.scrollTop = 900; const expected = main.scrollTop;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return {expected, actual: main.scrollTop};
      });
      if (fixed) {
        for (const [name, result] of Object.entries({arrival, lateTab, refresh, input, movedAfterRender})) {
          assert(Math.abs(result.actual - result.expected) <= 1, name + ': ' + JSON.stringify(result));
        }
      } else {
        assert.notEqual(lateTab.actual, lateTab.expected, 'original cross-tab jump reproduced');
        assert.notEqual(input.actual, input.expected, 'original override of user input reproduced');
        assert.notEqual(movedAfterRender.actual, movedAfterRender.expected, 'original override of caller/inertial scroll reproduced');
      }
      assert.deepEqual(s.errors, []); assert.equal(s.counts.blocked, 0);
      if (process.env.SHOT) await p.screenshot({path: process.env.SHOT, fullPage: false});
      console.log(JSON.stringify({pageFile: pageFile || p.url(), live, mobile, fixed, patchPresent, pass: true, arrival, lateTab, refresh, input, movedAfterRender, errors: s.errors, blockedWrites: s.counts.blocked}));
    } finally { await s.browser.close(); }
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
