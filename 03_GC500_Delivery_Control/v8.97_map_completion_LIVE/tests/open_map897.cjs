// Author: Andrew Fisher. Portable, read-only map rig. The shared harness reads the live record;
// every explorer byte must come from the exact local code/assets set (no live fallback).
const fs = require('fs'), path = require('path');
const {open} = require('../../v8.90_explorer_master_DRAFT/tests/xembed890.cjs');
const XB = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/';
const TYPES = {'.js':'text/javascript', '.html':'text/html', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.bin':'application/octet-stream'};
async function openMap({settle = 1200} = {}) {
  for (const key of ['PAGE', 'CODE', 'ASSETS']) if (!process.env[key] || !fs.existsSync(process.env[key])) throw new Error(`${key} must name an existing local candidate input`);
  for (const rel of ['index.html', 'explorer.js', 'explorer-merge.js', 'scene-worker.js', 'fencing-map.css', 'explorer-fix864.css', 'fencing-map-core.js'])
    if (!fs.existsSync(path.join(process.env.CODE, rel))) throw new Error(`Missing local map code: ${rel}`);
  for (const rel of ['drawing-scene.bin', 'vt/manifest.json']) if (!fs.existsSync(path.join(process.env.ASSETS, rel))) throw new Error(`Missing local map asset: ${rel}`);
  const MOB = !!process.env.MOB;
  const s = await open({pageFile:process.env.PAGE, W:MOB?390:1440, H:MOB?844:900, dpr:MOB?2:1, mobile:MOB});
  try {
    const p = s.page; s.counts.mediaServed = 0;
    await p.context().route(XB + '**', async route => {
      const r = route.request(); if (r.method() !== 'GET') { s.counts.blocked++; return route.abort(); }
      const rel = decodeURIComponent(new URL(r.url()).pathname.slice(new URL(XB).pathname.length)) || 'index.html';
      const asset = rel.startsWith('assets/'), base = path.resolve(asset ? process.env.ASSETS : process.env.CODE);
      const file = path.resolve(base, asset ? rel.slice(7) : rel);
      if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        s.counts.missing.push(rel); return route.fulfill({status:404, body:'Missing local candidate file'});
      }
      const body = fs.readFileSync(file), headers = {'content-type':TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control':'no-store', 'accept-ranges':'bytes'};
      s.counts.local++; s.counts.localPaths.add(rel);
      const range = /^bytes=(\d+)-(\d*)$/.exec(r.headers().range || '');
      if (range) {
        const a = Number(range[1]), b = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
        if (a > b || a >= body.length) return route.fulfill({status:416, headers, body:''});
        s.counts.ranges++; headers['content-range'] = `bytes ${a}-${b}/${body.length}`;
        return route.fulfill({status:206, headers, body:body.subarray(a,b+1)});
      }
      return route.fulfill({status:200, headers, body});
    });
    if (process.env.MEDIA) await p.context().route('**/m/Coates-GC500-2026/*.webp', async route => {
      if (route.request().method() !== 'GET') { s.counts.blocked++; return route.abort(); }
      const file = path.join(process.env.MEDIA, path.basename(new URL(route.request().url()).pathname));
      if (fs.existsSync(file)) { s.counts.mediaServed++; return route.fulfill({status:200, contentType:'image/webp', body:fs.readFileSync(file)}); }
      return route.fallback();
    });
    await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout:150000});
    await p.evaluate(() => go('map'));
    const fh = await p.waitForSelector('#pane-map iframe', {timeout:30000}), f = await fh.contentFrame();
    await f.waitForFunction(() => window.GC500Explorer && GC500Explorer.state.ready && window.__ready && window.GC500Explorer897, null, {timeout:150000});
    await p.waitForTimeout(settle);
    return Object.assign(s,{f,fh,MOB});
  } catch (e) { await s.browser.close(); throw e; }
}
module.exports = {openMap};
