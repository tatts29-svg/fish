// Author: Andrew Fisher. Actual clicks on both Inventory lists; reads only, writes blocked by the harness.
// PAGE=<built page> [MOB=1] [OUT=<json>] node drill_click_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const mobile = !!process.env.MOB, tests = [], s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1});
  const p = s.page, ok = (name, pass) => tests.push({name, pass: !!pass});
  try {
    await p.waitForFunction(() => typeof inv87Line === 'function' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout:240000});
    // Observe the selected target while still running the real navigation. The embedded explorer
    // consumes EXP.pending and deliberately does not update the legacy state.sel field.
    await p.evaluate(() => { const real = showOnMap; window.__drillTarget87 = null; showOnMap = function(key) { window.__drillTarget87 = key; return real.apply(this, arguments); }; });
    const type = await p.evaluate(() => inventory().list.filter(r => /toilet/i.test(r.disc) && r.asked > r.on).sort((a,b) => b.asked-b.on-(a.asked-a.on))[0].type);
    async function restore() {
      await p.evaluate(t => { const close = document.querySelector('#dclose'); if(close) close.click(); INV.disc='*'; INV.drill={t,col:'togo'}; go('change'); render(); }, type);
      await p.waitForSelector('#invDrill li.ln87');
    }
    for (const host of ['invDrill','tg782']) {
      for (const action of ['reference','map','locator']) {
        await restore();
        const sel = '#' + host + (action === 'reference' ? ' .tg-ref[data-open]' : action === 'map' ? ' .tg-map[data-map]' : ' .ln87-pics[data-map]');
        const target = p.locator(sel).first();
        const key = await target.getAttribute(action === 'reference' ? 'data-open' : 'data-map');
        await p.evaluate(() => { window.__drillTarget87 = null; });
        // Clicking the element dispatches its real bound handler and production navigation.
        await target.evaluate(el => el.click());
        if(action !== 'reference') await p.waitForFunction(() => state.tab === 'map', null, {timeout:3000}).catch(()=>null);
        const result = await p.evaluate(({action,key}) => action === 'reference'
          ? document.querySelector('#drawer').classList.contains('on') && document.querySelector('#drawer').textContent.includes(key)
          : state.tab === 'map' && window.__drillTarget87 === key, {action,key});
        ok(host + ': ' + action + ' opens the selected reference', result);
      }
    }
    ok('No page errors', !s.errors.length);
    ok('No attempted record writes', s.counts.blocked === 0);
    const result = {author:'Andrew Fisher',device:mobile?'phone':'desktop',candidateSha256:require('crypto').createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
    if(process.env.OUT) fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result));
    if(result.passed !== result.total) process.exitCode=1;
  } finally { await s.browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
