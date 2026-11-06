#!/usr/bin/env node
/* Author: Andrew Fisher. Builds the VMS plan pack - one A4 colour sheet per board position, 28 pages - as a PDF from
   the page's own print path, read only, and writes the manifest upload_vms.py reads. The page is opened through the
   toolchain harness at the live address (every write aborted) on #print/vms/all, exactly as a person pressing
   "Print the whole plan" sees it: the map service's satellite pictures load for the page (the token is restricted to
   this address), the bar waits for every picture, then Chromium prints the sheets to A4.

     PAGE=build/GC500_v10.24/GC500_Delivery_Control_hosted.html node generate_vms.cjs [--out dir] [--issued 2026-10-15] */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const TOOLCHAIN = path.join(__dirname, '..', 'toolchain');
const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
const PAGE = process.env.PAGE; if (!PAGE) { console.error('PAGE=... is needed (the built page)'); process.exit(2); }
const args = process.argv.slice(2), arg = f => args.includes(f) ? args[args.indexOf(f) + 1] : null;
const outDir = arg('--out') || __dirname, issued = arg('--issued') || '2026-10-15';
const pdfDir = path.join(outDir, 'pdfs'), evDir = path.join(outDir, 'evidence');
fs.mkdirSync(pdfDir, {recursive: true}); fs.mkdirSync(evDir, {recursive: true});
const AGENT_WORDS = /\b(via\s+(Claude|Codex|Argon|Gemini)|Claude|Codex|Argon|OpenAI|Anthropic|GPT|Gemini)\b/;
const dmy = iso => { const d = new Date(iso + 'T00:00:00Z'); return `${d.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

(async () => {
  console.log('opening the page on #print/vms/all (read only, every write aborted) ...');
  const s = await open({pageFile: PAGE, hash: '#print/vms/all', W: 1100, H: 1400});
  await s.page.waitForFunction(() => window.VMS1024 && typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await s.page.waitForFunction(() => { const b = document.getElementById('dpbar'); const secs = document.querySelectorAll('#dayprint .ps7.v1024'); return b && !b.querySelector('[data-dpbar-print]').disabled && secs.length >= 28; }, null, {timeout: 300000});
  await s.page.waitForTimeout(1500);
  const snap = await s.page.evaluate(() => {
    const N = window.VMS1024, secs = [...document.querySelectorAll('#dayprint .ps7.v1024')];
    const imgs = [...document.querySelectorAll('#dayprint img')];
    return {read_at: new Date().toISOString(), page_version: (document.body.textContent.match(/v10\.\d+/g) || []).pop(), bar: document.querySelector('#dpbar .dpbar-t').textContent,
      sheets: secs.length, satellite: secs.filter(x => x.querySelectorAll('.v1024-sat img').length === 4).length,
      imgs: imgs.length, loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length, failed: imgs.filter(i => i.complete && i.naturalWidth === 0).length,
      zooms: secs.map(x => Number(x.style.zoom || '1')), text: document.getElementById('dayprint').innerText,
      boards: N.boards().map(b => ({pos: b.pos, title: b.title, phase: b.phase, session: !!b.session, lat: N.position(b).lat, lon: N.position(b).lon, asset: N.identity(b).asset, rego: N.identity(b).rego, board: N.identity(b).board})),
      author: (DATA.brand && DATA.brand.author) || null, key: !!(typeof liveMapKey === 'function' && liveMapKey())};
  });
  snap.harness = {blocked_writes: s.counts.blocked, live_requests: s.counts.live, page_errors: s.errors};
  console.log('page', snap.page_version, '·', snap.bar, '· sheets', snap.sheets, '· with four satellite views', snap.satellite, '· pictures', snap.loaded + '/' + snap.imgs, 'loaded,', snap.failed, 'failed · map key', snap.key, '· writes blocked', snap.harness.blocked_writes);
  if (s.errors.length) throw new Error('page errors: ' + s.errors.join(' | '));
  if (snap.sheets !== snap.boards.length || snap.satellite !== snap.boards.length) throw new Error('a sheet is missing or without its satellite close-ups');
  if (snap.failed || snap.loaded !== snap.imgs) throw new Error('a picture did not load: ' + snap.loaded + ' of ' + snap.imgs);
  if (AGENT_WORDS.test(snap.text)) throw new Error('the pack carries a word that must not be on a record: ' + snap.text.match(AGENT_WORDS)[0]);
  if (/undefined|\[object |NaN/.test(snap.text)) throw new Error('the pack has undefined/NaN in it');
  if (!/Issued:/.test(snap.text) || !/15 Oct 2026/.test(snap.text)) throw new Error('the issued line is missing');
  const name = `GC500_VMS_Plan_Pack_${issued}_Issued.pdf`, pdf = path.join(pdfDir, name);
  await s.page.emulateMedia({media: 'print'});
  await s.page.pdf({path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true});
  await s.browser.close();
  const bytes = fs.statSync(pdf).size, sha256 = crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex');
  const manifest = [{file: 'pdfs/' + name, title: `VMS plan pack · ${snap.boards.length} board sheets · ${issued} · Issued`,
    note: `One A4 sheet per VMS position on iEDM's VMS001-26003-01 plan (construction and event, the relocations, the five end-of-session boards, VMS 20's two messages): pin, four satellite views (exact spot, close-up, the area, the way in), the plan's map crop and photo, QR navigation, board, asset number, number plate, notes; issued by ${snap.author || 'the project manager'}, Shutdown Manager, ${dmy(issued)}; the live sheets are on the page's VMS boards tab`,
    kind: 'pack', day: issued, crew: 'vms', replaces: []}];
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(evDir, 'build.json'), JSON.stringify({author: snap.author, built: new Date().toISOString(), issued, page_version: snap.page_version, record_read_at: snap.read_at,
    page_file: {name: path.basename(PAGE), sha256: crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'), bytes: fs.statSync(PAGE).size}, boards: snap.boards, harness: snap.harness,
    pack: {file: 'pdfs/' + name, bytes, sha256, sheets: snap.sheets, satellite_sheets: snap.satellite, pictures: snap.imgs, zooms: snap.zooms}}, null, 1) + '\n');
  console.log(`  ${name}  ${snap.sheets} sheets  min zoom ${Math.min(...snap.zooms)}  ${bytes} bytes  ${sha256.slice(0, 16)}`);
  console.log('manifest', path.join(outDir, 'manifest.json'), '· build record', path.join(evDir, 'build.json'));
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
