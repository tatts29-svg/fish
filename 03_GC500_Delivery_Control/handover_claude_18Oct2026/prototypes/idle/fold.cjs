/* which collection reports a change when the same record is delivered again */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900});
 const p = s.page;
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000});
 await sleep(15000);
 for (let round = 0; round < 3; round++) {
  const r = await p.evaluate(async () => {
   const log = []; const f0 = window.syncFold;
   window.syncFold = function (name, docs) { const c = SYNC_COLLS[name]; const before = JSON.stringify(c.get()); const r = f0.apply(this, arguments); let why = '';
    if (r) { const after = JSON.stringify(c.get()); why = before === after ? 'same-json-after-set' : 'diff len ' + before.length + '->' + after.length; if (before !== after) { let i = 0; while (i < before.length && before[i] === after[i]) i++; why += ' @' + i + ' ' + before.slice(Math.max(0, i - 60), i + 60) + ' || ' + after.slice(Math.max(0, i - 60), i + 60); } }
    log.push([name, r, why]); return r; };
   const rr = []; const red0 = window.syncRedraw; window.syncRedraw = function () { rr.push(new Error().stack.split('\n').slice(2, 5).join(' / ')); return red0.apply(this, arguments); };
   for (let k = 0; k < 40; k++) { const t0 = performance.now(); await SYNC.backend.pull(true); if (performance.now() - t0 >= 20) break; await new Promise(r => setTimeout(r, 250)); }
   window.syncFold = f0; window.syncRedraw = red0;
   return {changed: log.filter(x => x[1]), n: log.length, redraws: rr};
  });
  console.log(JSON.stringify(r, null, 1).slice(0, 3000));
  await sleep(5000);
 }
 await s.browser.close();
})();
