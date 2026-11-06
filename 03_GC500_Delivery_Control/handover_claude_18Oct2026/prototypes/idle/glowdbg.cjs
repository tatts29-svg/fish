const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const s = await open({pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true}); const p = s.page;
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000}); await sleep(10000);
 await p.evaluate(() => go('plant')); await sleep(15000);
 const r = await p.evaluate(() => ({script: !!document.getElementById('glow1061-script'), vh: innerHeight, se: document.scrollingElement.scrollHeight, rings: [...document.querySelectorAll('.complete1008-ring')].map(x => { const b = x.getBoundingClientRect(); const a = x.getAnimations()[0]; let sc = x.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement; return [Math.round(b.top), Math.round(b.width), a ? a.playState : '-', x.closest('[id^=pane-]') ? x.closest('[id^=pane-]').id : '?', sc ? (sc.id || sc.tagName) : 'viewport']; })}));
 console.log(JSON.stringify(r));
 await p.evaluate(() => window.scrollTo(0, 3000)); await sleep(2000);
 console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.complete1008-ring')].map(x => [Math.round(x.getBoundingClientRect().top), (x.getAnimations()[0] || {}).playState]))));
 await s.browser.close();
})();
