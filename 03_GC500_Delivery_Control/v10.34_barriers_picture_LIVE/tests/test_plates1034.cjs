/* v10.34: the Water barriers card on Today carries its picture, the other cards keep theirs. Read-only: the page is
   served from the build, the picture from this release's assets/ (until it is on the service), every other GET goes
   to the live service as it is; nothing is written. Author: Andrew Fisher.
     PAGE=build/GC500_v10.34/GC500_Delivery_Control_hosted.html node v10.34_barriers_picture_DRAFT/tests/test_plates1034.cjs */
const fs = require('fs'), path = require('path');
const here = path.resolve(__dirname, '..');
const {open} = require(path.resolve(here, '..', 'toolchain', 'harness', 'open_page.js'));
const desc = JSON.parse(fs.readFileSync(path.join(here, 'plates1034.json'), 'utf8'));
const cell = desc.cells[0];
const results = []; const check = (name, ok, note) => { results.push({name, ok: !!ok, note}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : '')); };
(async () => {
  const html = fs.readFileSync(process.env.PAGE, 'utf8');
  const atlas = JSON.parse(/const ATLAS = (\{[^\n]+\});/.exec(html)[1]);
  check('atlas names the barriers picture', atlas.barriers === cell.sha256, Object.keys(atlas).join(','));
  check('the eight v9.07 pictures are still named', ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'vms', 'equipment', 'yard'].every(k => /^[0-9a-f]{64}$/.test(atlas[k] || '')));
  const start = html.indexOf('const DATA = ') + 'const DATA = '.length; const depth = []; let end = start; for (let i = start; i < html.length; i++) { const ch = html[i]; if (ch === '"') { i++; while (html[i] !== '"') { if (html[i] === '\\') i++; i++; } continue; } if (ch === '{' || ch === '[') depth.push(ch); else if (ch === '}' || ch === ']') { depth.pop(); if (!depth.length) { end = i + 1; break; } } }
  const DATA = JSON.parse(html.slice(start, end));
  const m = DATA.media[cell.sha256];
  check('media table carries the picture', m && m.file === cell.file && m.bytes === cell.bytes && m.type === 'image/webp' && m.scope === 'view');
  const manifest = JSON.parse(fs.readFileSync(path.join(path.dirname(process.env.PAGE), 'media_manifest_v1034.json'), 'utf8'));
  check('page manifest hash is the written manifest', DATA.hostedMedia.manifest === manifest.sha256 && manifest.assets.some(a => a.sha256 === cell.sha256), manifest.sha256.slice(0, 12));
  check('footer v10.34', html.includes("+ ' · v10.34'") && !html.includes("+ ' · v10.33'"));
  for (const [W, H, mobile, tag] of [[1440, 900, false, 'desktop'], [390, 844, true, 'phone']]) {
    const s = await open({pageFile: process.env.PAGE, hash: '#today', W, H, mobile}); const p = s.page;
    let served = 0;
    await p.route(new RegExp('/m/[^?]*' + cell.file + '(?:\\?.*)?$'), r => { served++; return r.fulfill({status: 200, contentType: cell.type, body: fs.readFileSync(path.join(here, 'assets', cell.file))}); });
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
    await p.waitForTimeout(3000);
    const bg = await p.evaluate(sha => { const out = {}; for (const id of ['barriers', 'toilets', 'generators']) { const el = document.querySelector('#gc500-work-board840 article[data-tw840-area="' + id + '"] .tw846-summary'); out[id] = el ? getComputedStyle(el, '::before').backgroundImage : 'missing'; } out.rules = (document.getElementById('scene896-atlas') || {textContent: ''}).textContent.split('\n').length; return out; }, cell.sha256);
    check(tag + ': barriers card paints its picture', bg.barriers.includes(cell.file), bg.barriers.slice(0, 60) + '… rules ' + bg.rules);
    check(tag + ': toilets and generators keep theirs', bg.toilets.includes(atlas.toilets) && bg.generators.includes(atlas.generators));
    check(tag + ': the picture was fetched from the hosted media route', served >= 1, 'served ' + served);
    const el = await p.$('#gc500-work-board840 article[data-tw840-area="barriers"]');
    if (el && process.env.OUT) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(600); await el.screenshot({path: path.join(process.env.OUT, 'barriers_card_1034_' + tag + '.png')}); }
    await s.browser.close();
  }
  const bad = results.filter(r => !r.ok).length;
  console.log(bad ? 'FAILED ' + bad + ' of ' + results.length : 'ALL ' + results.length + ' PASSED');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(2); });
