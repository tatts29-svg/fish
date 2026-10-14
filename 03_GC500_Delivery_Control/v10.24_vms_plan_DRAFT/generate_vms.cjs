#!/usr/bin/env node
/* Author: Andrew Fisher. Builds the VMS plan pack - one A4 colour sheet per board position, 28 pages - as a PDF from
   the page's own sheet renderer, read only, and writes the manifest upload_vms.py reads. The page is opened through
   the toolchain harness (every write aborted); the sheets, the page's print CSS and the satellite close-ups come from
   it; Chromium prints to A4.

     PAGE=build/GC500_v10.24/GC500_Delivery_Control_hosted.html node generate_vms.cjs [--out dir] [--issued 2026-10-15] */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const TOOLCHAIN = path.join(__dirname, '..', 'toolchain');
const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
const {chromium} = require('playwright');
const PAGE = process.env.PAGE; if (!PAGE) { console.error('PAGE=... is needed (the built page)'); process.exit(2); }
const args = process.argv.slice(2), arg = f => args.includes(f) ? args[args.indexOf(f) + 1] : null;
const outDir = arg('--out') || __dirname, issued = arg('--issued') || '2026-10-15';
const pdfDir = path.join(outDir, 'pdfs'), evDir = path.join(outDir, 'evidence');
fs.mkdirSync(pdfDir, {recursive: true}); fs.mkdirSync(evDir, {recursive: true});
const AGENT_WORDS = /\b(via\s+(Claude|Codex|Argon|Gemini)|Claude|Codex|Argon|OpenAI|Anthropic|GPT|Gemini)\b/;
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dmy = iso => { const d = new Date(iso + 'T00:00:00Z'); return `${d.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

(async () => {
  console.log('reading the sheets from the page (read only, every write aborted) ...');
  const s = await open({pageFile: PAGE, hash: '#vms', W: 1100, H: 1200});
  await s.page.waitForFunction(() => window.VMS1024 && typeof PS7_CSS === 'string' && typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await s.page.waitForTimeout(2000);
  const snap = await s.page.evaluate(async () => {
    const N = window.VMS1024;
    const html = await N.sheetsHtml('all');
    return {read_at: new Date().toISOString(), page_version: (document.body.innerText.match(/v10\.\d+/g) || []).pop(), css: PS7_CSS, extra: N.CSS, html,
      boards: N.boards().map(b => ({pos: b.pos, title: b.title, phase: b.phase, session: !!b.session, lat: N.position(b).lat, lon: N.position(b).lon, inFrame: !!N.frame(N.position(b)), asset: N.identity(b).asset, rego: N.identity(b).rego})),
      author: (DATA.brand && DATA.brand.author) || null};
  });
  snap.harness = {blocked_writes: s.counts.blocked, live_requests: s.counts.live, page_errors: s.errors};
  await s.browser.close();
  if (s.errors.length) throw new Error('page errors while reading: ' + s.errors.join(' | '));
  console.log('page', snap.page_version, '· boards', snap.boards.length, '· with satellite', snap.boards.filter(b => b.inFrame).length, '· writes blocked by the harness', snap.harness.blocked_writes);

  const PRINT_STYLE = '@page{size:A4 portrait;margin:7mm}html,body{margin:0;background:#fff}#dayprint{display:block;position:static;max-width:none}#dayprint.ps7wrap{width:196mm;font:inherit;background:#fff}\n';
  const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>GC500 VMS plan pack</title><style>${PRINT_STYLE}${snap.css}${snap.extra}</style></head><body><div id="dayprint" class="ps7wrap">${snap.html}</div></body></html>`;
  const text = html.replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, 'data:image'); /* the words, not the picture bytes */
  if (AGENT_WORDS.test(text)) throw new Error('the pack carries a word that must not be on a record: ' + text.match(AGENT_WORDS)[0]);
  if (/undefined|\[object |NaN/.test(text)) throw new Error('the pack has undefined/NaN in it: ' + text.slice(Math.max(0, text.search(/undefined|\[object |NaN/) - 120), text.search(/undefined|\[object |NaN/) + 40));
  if (!/Issued:/.test(html) || !/15 Oct 2026/.test(html)) throw new Error('the issued line is missing');
  const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU'], executablePath: process.env.CHROMIUM_PATH || undefined});
  const ctx = await browser.newContext({locale: 'en-AU', timezoneId: 'Australia/Brisbane', viewport: {width: 900, height: 1300}});
  const page = await ctx.newPage();
  await page.setContent(html, {waitUntil: 'load'});
  await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : null);
  const fit = await page.evaluate(() => {
    const ruler = document.createElement('div'); ruler.style.cssText = 'position:absolute;left:-10000px;top:0;height:283mm;width:1px'; document.body.appendChild(ruler);
    const avail = ruler.getBoundingClientRect().height; ruler.remove();
    return [...document.querySelectorAll('.ps7')].map(sec => { const h = sec.getBoundingClientRect().height; let zoom = 1; if (h > avail * 0.985) { zoom = Math.max(0.8, Math.floor(avail * 0.985 / h * 1000) / 1000); sec.style.zoom = String(zoom); } return {height: Math.round(h), avail: Math.round(avail), zoom}; });
  });
  const name = `GC500_VMS_Plan_Pack_${issued}_Issued.pdf`, pdf = path.join(pdfDir, name);
  await page.pdf({path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true});
  await browser.close();
  const bytes = fs.statSync(pdf).size, sha256 = crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex');
  const manifest = [{file: 'pdfs/' + name, title: `VMS plan pack · ${snap.boards.length} board sheets · ${issued} · Issued`,
    note: `One A4 sheet per VMS position on iEDM's VMS001-26003-01 plan (construction and event, the relocations, the five end-of-session boards, VMS 20's two messages): pin, satellite close-up where the page's aerial covers it, the plan's map crop and photo, QR navigation, board, asset number, number plate, notes; issued by ${snap.author || 'the project manager'}, Shutdown Manager, ${dmy(issued)}; the live sheets are on the page's VMS boards tab`,
    kind: 'pack', day: issued, crew: 'vms', replaces: []}];
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(evDir, 'build.json'), JSON.stringify({author: snap.author, built: new Date().toISOString(), issued, page_version: snap.page_version, record_read_at: snap.read_at,
    page_file: {name: path.basename(PAGE), sha256: crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'), bytes: fs.statSync(PAGE).size}, boards: snap.boards, harness: snap.harness, pack: {file: 'pdfs/' + name, bytes, sha256, pages: fit.length, fit}}, null, 1) + '\n');
  console.log(`  ${name}  ${fit.length} sheets  min zoom ${Math.min(...fit.map(f => f.zoom))}  ${bytes} bytes  ${sha256.slice(0, 16)}`);
  console.log('manifest', path.join(outDir, 'manifest.json'), '· build record', path.join(evDir, 'build.json'));
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
