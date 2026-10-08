// Author: Andrew Fisher. v9.17 - phone screenshots of the WC09 and CP1 drawers: "Where it is" (pin, links, the two new
// close-ups) and the satellite panel's position line. Read only; the 46 new pictures are served from evidence/media917
// until they are uploaded. Fails if a dollar figure is visible in a frame or a write is attempted.
//   PAGE=<candidate> OUT=<dir> [MOB=1] node tests/shots917.cjs     (through browser_run.sh)
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page.js');
const TH = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'evidence', 'thumbs917.json'), 'utf8'));
const MEDIA = path.join(__dirname, '..', 'evidence', 'media917');
(async () => {
  let s; const R = [];
  try {
    const mob = process.env.MOB !== '0';
    s = await open({pageFile: process.env.PAGE, W: mob ? 390 : 1440, H: mob ? 844 : 900, mobile: mob, dpr: mob ? 2 : 1});
    const p = s.page; let served = 0;
    for (const m of TH.media) { const f = path.join(MEDIA, m.file); await p.route('**/m/Coates-GC500-2026/' + m.file, r => { served++; r.fulfill({status: 200, contentType: m.type, body: fs.readFileSync(f)}); }); }
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof openAsset === 'function', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    for (const ref of ['WC09', 'CP1']) {
      await p.evaluate(k => openAsset(k), ref); await p.waitForTimeout(2500);
      for (const [part, sel] of [['where', '.pinblock'], ['satellite', '.satcap.pos']]) {
        const found = await p.evaluate(sel => { const el = document.querySelector('#drawer ' + sel) || document.querySelector(sel); if (!el) return false; el.scrollIntoView({block: 'start'}); return true; }, sel);
        await p.waitForTimeout(1500);
        const info = await p.evaluate(() => {
          const vw = innerWidth, vh = innerHeight, out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          while (w.nextNode()) { const n = w.currentNode; if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || !el.offsetParent) continue;
            const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (b.bottom > 0 && b.top < vh && b.right > 0 && b.left < vw && b.width > 0) out.push(n.nodeValue); }
          const imgs = [...document.querySelectorAll('.mlocpics img')].map(i => ({w: i.naturalWidth, src: i.getAttribute('src').slice(-20)}));
          return {text: out.join(' ').replace(/\s+/g, ' '), imgs};
        });
        const file = path.join(process.env.OUT, `${mob ? 'phone' : 'laptop'}_${ref}_${part}.png`);
        await p.screenshot({path: file});
        const dollars = /\$\s?\d/.test(info.text);
        R.push({ref, part, found, file: path.basename(file), dollars, imgs: info.imgs, text: info.text.slice(0, 600)});
      }
      await p.keyboard.press('Escape'); await p.waitForTimeout(800);
    }
    const ok = R.every(r => r.found && !r.dollars) && s.counts.blocked === 0 && !s.errors.length;
    fs.writeFileSync(path.join(process.env.OUT, `shots917_${mob ? 'phone' : 'laptop'}.json`), JSON.stringify({R, counts: s.counts, errors: s.errors, served}, null, 1));
    R.forEach(r => console.log(r.ref, r.part, r.found ? 'shown' : 'NOT FOUND', r.dollars ? 'DOLLARS IN FRAME' : 'no dollar figures', JSON.stringify(r.imgs)));
    console.log((ok ? 'PASS' : 'FAIL') + ' shots, counts ' + JSON.stringify(s.counts) + ', errors ' + s.errors.length + ', pictures served locally ' + served);
    if (!ok) process.exitCode = 1;
  } finally { if (s) await s.browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
