// Re-exports the sheet's own aerial patches (assets/underlay/x*.webp) WITH their soft masks and clip. Each patch is the
// scene record the manifest names (record_id), drawn in Chromium through the scene's own SVG (the record's clip group,
// clip path and luminance mask, exactly as the worker emits them for Original plan), at the image's native pixel size,
// onto a transparent canvas, and encoded as lossy WebP with alpha. The earlier export had dropped the alpha: the patches
// were RGB with the masked-out area black, which showed as large black areas in Original plan wherever the pre-rendered
// drawing tiles are used.        node regen_underlay.js <drawing-scene.bin> <underlay/manifest.json> <out dir> [quality]
const PW = process.env.PW || '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/node_modules/playwright';
const {chromium} = require(PW); const fs = require('fs'), path = require('path'), zlib = require('zlib');
const [SCENE, MAN, OUT, Q = '0.82'] = process.argv.slice(2);
(async () => {
  const P = JSON.parse(zlib.gunzipSync(fs.readFileSync(SCENE))), man = JSON.parse(fs.readFileSync(MAN, 'utf8'));
  fs.mkdirSync(path.join(OUT, 'underlay'), {recursive: true});
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext()).newPage(); page.on('pageerror', e => console.error('pageerror', e.message));
  await page.setContent('<!doctype html><body></body>');
  for (const it of man.items) {
    const rec = P.r[it.record_id], cg = P.c[rec[4]], [x0, y0, x1, y1] = it.bbox, [W, H] = it.px;
    if (rec[5] !== -1 || !/^<image\b/.test(rec[6])) throw new Error(it.file + ': record ' + it.record_id + ' is not an image record');
    const needed = new Set(), need = id => { if (needed.has(id) || !P.d[id]) return; needed.add(id); P.d[id][1].forEach(need); }; cg[2].forEach(need);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + H + '" viewBox="' + [x0, y0, x1 - x0, y1 - y0].join(' ') + '" preserveAspectRatio="none"><defs>' + [...needed].map(id => P.d[id][0]).join('') + '</defs>' + cg[0] + rec[6] + cg[1] + '</svg>';
    const res = await page.evaluate(async ({svg, W, H, q}) => {
      const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'})), img = new Image();
      await new Promise((r, j) => { img.onload = r; img.onerror = () => j(new Error('svg decode failed')); img.src = url; }); await img.decode();
      const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url);
      const px = g.getImageData(0, 0, W, H).data; let op = 0, part = 0; for (let i = 3; i < px.length; i += 4) { if (px[i] === 255) op++; else if (px[i]) part++; }
      const blob = await new Promise(r => c.toBlob(r, 'image/webp', q)); const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(blob); });
      return {b64, type: blob.type, opaque: op / (W * H), partial: part / (W * H)};
    }, {svg, W, H, q: +Q});
    if (res.type !== 'image/webp') throw new Error('encoder gave ' + res.type);
    const buf = Buffer.from(res.b64, 'base64'); fs.writeFileSync(path.join(OUT, it.file), buf); it.bytes = buf.length; it.alpha = true;
    console.log(it.file.padEnd(20), (W + 'x' + H).padEnd(10), 'opaque', (res.opaque * 100).toFixed(1) + '%', 'soft', (res.partial * 100).toFixed(1) + '%', 'transparent', ((1 - res.opaque - res.partial) * 100).toFixed(1) + '%', buf.length, 'B');
  }
  man.note = man.note.replace(/; re-exported.*$/, '') + '; re-exported with the soft mask and clip as the alpha channel (lossy WebP with alpha)';
  fs.writeFileSync(path.join(OUT, 'underlay', 'manifest.json'), JSON.stringify(man, null, 1)); await browser.close(); console.log('done', man.items.length);
})().catch(e => { console.error(e); process.exit(1); });
