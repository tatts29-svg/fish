#!/usr/bin/env node
/* Author: Andrew Fisher. Builds the three issued run sheets for the event nights (Fri 23, Sat 24, Sun 25 Oct 2026) as
   PDFs from the page's own run-sheet renderer, read only, and writes the manifest upload_nights.py reads.
   Nothing here writes to the service: the page is opened through the toolchain harness, which aborts every write the
   page tries, and the PDFs are made from the sheet the page renders with nothing ticked (a blank issued sheet).

     PAGE=build/GC500_v10.23/GC500_Delivery_Control_hosted.html node generate_nights.cjs [--out dir] [--signed 2026-10-15]

   The sheet carries the night, the team, the night's tasks, the service order of every toilet unit, the relocation
   requests block, the night manager's sign-off and the project manager's audit boxes, and the line
   "Issued and signed: <author>, <title> · 15 Oct 2026". Nothing is pre-ticked; there are no cost lines and no staff names
   beyond Andrew's own word for the night manager (Kyle). */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const TOOLCHAIN = path.join(__dirname, '..', 'toolchain');
const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
const {chromium} = require('playwright');
const PAGE = process.env.PAGE; if (!PAGE) { console.error('PAGE=... is needed (the built page)'); process.exit(2); }
const args = process.argv.slice(2), arg = f => args.includes(f) ? args[args.indexOf(f) + 1] : null;
const outDir = arg('--out') || __dirname, signed = arg('--signed') || '2026-10-15';
const pdfDir = path.join(outDir, 'pdfs'), evDir = path.join(outDir, 'evidence');
fs.mkdirSync(pdfDir, {recursive: true}); fs.mkdirSync(evDir, {recursive: true});
const AGENT_WORDS = /\b(via\s+(Claude|Codex|Argon|Gemini)|Claude|Codex|Argon|OpenAI|Anthropic|GPT|Gemini)\b/;
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dmy = iso => { const d = new Date(iso + 'T00:00:00Z'); return `${d.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

(async () => {
  console.log('reading the sheets from the page (read only, every write aborted) ...');
  const s = await open({pageFile: PAGE, hash: '#nights', W: 1000, H: 1200});
  await s.page.waitForFunction(() => window.Nights1022 && typeof PS7_CSS === 'string' && typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await s.page.waitForTimeout(2000);
  const snap = await s.page.evaluate(() => {
    const N = window.Nights1022;
    return {read_at: new Date().toISOString(), page_version: (document.body.innerText.match(/v10\.\d+/g) || []).pop(), record_version: SYNC.version || null,
      css: PS7_CSS, extra: N.CSS, units: N.unitRows().map(u => u.key), author: (DATA.brand && DATA.brand.author) || null,
      sheets: N.NIGHTS.map(n => ({iso: n.iso, label: n.label, kind: n.kind, html: N.sheetHtml(n.iso, {blank: true})}))};
  });
  snap.harness = {blocked_writes: s.counts.blocked, live_requests: s.counts.live, page_errors: s.errors};
  await s.browser.close();
  if (s.errors.length) throw new Error('page errors while reading: ' + s.errors.join(' | '));
  console.log('page', snap.page_version, '· record', snap.record_version, '· units', snap.units.length, '· writes blocked by the harness', snap.harness.blocked_writes);

  const PRINT_STYLE = '@page{size:A4 portrait;margin:7mm}html,body{margin:0;background:#fff}#dayprint{display:block;position:static;max-width:none}#dayprint.ps7wrap{width:196mm;font:inherit;background:#fff}\n';
  const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU'], executablePath: process.env.CHROMIUM_PATH || undefined});
  const ctx = await browser.newContext({locale: 'en-AU', timezoneId: 'Australia/Brisbane', viewport: {width: 900, height: 1300}});
  const page = await ctx.newPage();
  const manifest = [], build = [];
  for (const sh of snap.sheets) {
    const name = `GC500_EventNights_RunSheet_${sh.iso}_Issued.pdf`;
    const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>${esc('Event nights run sheet ' + sh.iso)}</title><style>${PRINT_STYLE}${snap.css}${snap.extra}</style></head><body><div id="dayprint" class="ps7wrap">${sh.html}</div></body></html>`;
    if (AGENT_WORDS.test(html)) throw new Error(`${name}: the sheet carries a word that must not be on a record: ${html.match(AGENT_WORDS)[0]}`);
    if (/undefined|\[object |NaN/.test(html)) throw new Error(`${name}: the sheet has undefined/NaN in it`);
    if (/class="bx checked"/.test(html)) throw new Error(`${name}: a blank issued sheet must have nothing pre-ticked`);
    if (!/Issued and signed:/.test(html) || !/15 Oct 2026/.test(html)) throw new Error(`${name}: the issued line is missing`);
    await page.setContent(html, {waitUntil: 'load'});
    await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : null);
    const fit = await page.evaluate(() => {
      const sec = document.querySelector('.ps7'), ruler = document.createElement('div');
      ruler.style.cssText = 'position:absolute;left:-10000px;top:0;height:283mm;width:1px'; document.body.appendChild(ruler);
      const avail = ruler.getBoundingClientRect().height, h = sec.getBoundingClientRect().height; ruler.remove();
      let zoom = 1; if (h > avail * 0.985) { zoom = Math.max(0.8, Math.floor(avail * 0.985 / h * 1000) / 1000); sec.style.zoom = String(zoom); }
      return {avail: Math.round(avail), height: Math.round(h), zoom, rows: document.querySelectorAll('table.n1022-t tbody tr').length, ticked: document.querySelectorAll('.bx.checked').length};
    });
    const pdf = path.join(pdfDir, name);
    await page.pdf({path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true});
    const bytes = fs.statSync(pdf).size, sha256 = crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex');
    const words = `${sh.label.replace(' night', '')} ${dmy(sh.iso)}`;
    manifest.push({file: 'pdfs/' + name, title: `Event nights run sheet · ${sh.label} · ${sh.iso} · Issued and signed`,
      note: `Run sheet for the ${sh.label.toLowerCase()} of ${dmy(sh.iso)} (${sh.kind === 'final' ? 'final night: no pump-out missed, equipment off the roadways, relocations to the collection points' : 'service night: maps, service order, spot checks, relocation requests'}); issued and signed by ${snap.author || 'the project manager'}, Shutdown Manager, ${dmy(signed)}; the night is recorded on the page's Event nights tab`,
      kind: 'pack', day: sh.iso, crew: 'nights', replaces: []});
    build.push({file: 'pdfs/' + name, night: sh.label, day: sh.iso, bytes, sha256, fit});
    console.log(`  ${name}  ${words}  rows ${fit.rows}  ticked ${fit.ticked}  zoom ${fit.zoom}  ${bytes} bytes  ${sha256.slice(0, 16)}`);
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(evDir, 'build.json'), JSON.stringify({author: snap.author, built: new Date().toISOString(), signed, page_version: snap.page_version, record_version: snap.record_version, record_read_at: snap.read_at,
    page_file: {name: path.basename(PAGE), sha256: crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'), bytes: fs.statSync(PAGE).size}, units: snap.units, harness: snap.harness, records: build}, null, 1) + '\n');
  console.log('manifest', path.join(outDir, 'manifest.json'), '· build record', path.join(evDir, 'build.json'));
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
