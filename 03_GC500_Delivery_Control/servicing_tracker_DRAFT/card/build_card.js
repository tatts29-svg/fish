#!/usr/bin/env node
/* Author: Andrew Fisher. GC500 servicing tracker: makes the crew card's HTML from tracker_data.json.
   The HTML is posted as the drop card's `html` (POST /api/cards with `tracker`) and served at /d/<token> under the
   card Content-Security-Policy: exactly ONE bare <script> (its hash is pinned), no on*= handlers, no external fonts
   or scripts, the data written into the script with every '<' escaped. Only Google Maps links leave the card.
   Nothing token-specific is in it: the card reads its token from its own address, so one HTML serves every token.

     node build_card.js                      writes card.html and tracker_config.json beside this file
     node build_card.js --data <json> --out <html> [--contact-name "<name>" --contact-phone "<number>"]

   As a module: buildCardHtml(data, {contact}), trackerConfig(data), cardScriptHash(html), cardData(data). */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const HERE = __dirname;
const DEFAULT_DATA = path.join(HERE, '..', 'tracker_data.json');

/* the card keeps only what it shows or needs to work out a job */
function cardData(data, opts) {
  opts = opts || {};
  const pick = (o, ks) => { const r = {}; ks.forEach(k => { if (o[k] !== undefined) r[k] = o[k]; }); return r; };
  return {
    version: data.version,
    tasks: data.tasks,
    plans: data.plans,
    extras: data.extras || [],
    groups: data.groups || {},
    days: data.days.map(d => pick(d, ['id', 'label', 'to', 'plan', 'ifNeeded', 'practice'])),
    areas: data.areas.map(a => ({
      n: a.n, name: a.name,
      refs: a.refs.map(r => Object.assign(pick(r, ['ref', 'title', 'where', 'drop', 'pin']), {
        lines: r.lines.map(l => pick(l, ['id', 'type', 'kind', 'label', 'qty', 'nos'])),
      })),
    })),
    contact: opts.contact && opts.contact.phone ? { name: String(opts.contact.name || ''), phone: String(opts.contact.phone) } : null,
  };
}

/* the tracker block of the card body (API contract): days [{id, plan}], lines [{id, ref, kind, qty}], plans */
function trackerConfig(data) {
  const lines = [];
  data.areas.forEach(a => a.refs.forEach(r => r.lines.forEach(l => lines.push({ id: l.id, ref: r.ref, kind: l.kind, qty: l.qty }))));
  return { days: data.days.map(d => ({ id: d.id, plan: d.plan })), lines, plans: data.plans };
}

/* JSON safe inside a <script>: no '<' (so no </script> and no <!--), and no line separators */
function scriptJson(v) {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(new RegExp('\\u2028', 'g'), '\\u2028').replace(new RegExp('\\u2029', 'g'), '\\u2029');
}
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* the same hash the service pins (server.js cardScriptHash): the first <script>…</script> */
function cardScriptHash(html) {
  const m = String(html || '').match(/<script>([\s\S]*?)<\/script>/);
  if (!m) return 'none';
  return 'sha256-' + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64');
}

function checkData(data) {
  const problems = [];
  const kinds = Object.keys(data.plans || {});
  const ids = new Set(), refs = new Set();
  (data.days || []).forEach(d => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d.id)) problems.push('day ' + d.id); });
  (data.areas || []).forEach(a => (a.refs || []).forEach(r => {
    if (!/^[A-Z0-9]+$/.test(r.ref)) problems.push('reference ' + r.ref + ' is not upper-case letters and digits');
    if (refs.has(r.ref)) problems.push('reference ' + r.ref + ' twice'); refs.add(r.ref);
    if (r.pin != null && !(Array.isArray(r.pin) && r.pin.length === 2 && r.pin.every(Number.isFinite))) problems.push('pin on ' + r.ref);
    (r.lines || []).forEach(l => {
      if (ids.has(l.id)) problems.push('line ' + l.id + ' twice'); ids.add(l.id);
      if (kinds.indexOf(l.kind) < 0) problems.push('line ' + l.id + ' kind ' + l.kind);
      if (!(Number.isInteger(l.qty) && l.qty > 0)) problems.push('line ' + l.id + ' qty');
    });
  }));
  (data.days || []).forEach(d => kinds.forEach(k => {
    const t = (data.plans[k] || {})[d.plan];
    if (!Array.isArray(t) || !t.length) problems.push('no ' + d.plan + ' plan for ' + k);
    else t.forEach(x => { if (!data.tasks[x]) problems.push('task ' + x + ' has no wording'); });
  }));
  /* Andrew, 20 Oct 2026: a Pump out QR and a Clean & restock QR per reference. Every task a plan names must be on
     at least one QR, or nobody could ever tick it; an extra (Refilled) must be a real task. */
  const groups = data.groups || {}, onQr = new Set();
  Object.keys(groups).forEach(g => {
    if (!/^[a-z]{1,12}$/.test(g)) problems.push('QR group ' + g + ' is not a plain lower-case word');
    const gt = groups[g] && groups[g].tasks;
    if (!groups[g] || !groups[g].label || !Array.isArray(gt) || !gt.length) problems.push('QR group ' + g + ' needs a label and tasks');
    else gt.forEach(x => { if (!data.tasks[x]) problems.push('QR group ' + g + ' names unknown task ' + x); onQr.add(x); });
  });
  (data.extras || []).forEach(x => { if (!data.tasks[x]) problems.push('extra ' + x + ' is not a task'); });
  if (Object.keys(groups).length) kinds.forEach(k => Object.keys(data.plans[k] || {}).forEach(p => (data.plans[k][p] || []).forEach(x => {
    if (!onQr.has(x)) problems.push('task ' + x + ' (' + k + ' ' + p + ') is on no QR');
  })));
  if (problems.length) throw new Error('tracker data: ' + problems.join('; '));
}

function buildCardHtml(data, opts) {
  checkData(data);
  const css = fs.readFileSync(path.join(HERE, 'card.css'), 'utf8');
  const src = fs.readFileSync(path.join(HERE, 'card_src.js'), 'utf8');
  if (src.indexOf('/*DATA*/null') < 0) throw new Error('card_src.js has lost its /*DATA*/null placeholder');
  const state = fs.readFileSync(path.join(HERE, '..', 'panel_mockup', 'state.js'), 'utf8');
  if (!src.includes('/*SHARED_STATE*/')) throw new Error('card must embed the shared state rule');
  const script = src.replace('/*DATA*/null', () => scriptJson(cardData(data, opts))).replace('/*SHARED_STATE*/', () => state);
  if (/<\/script/i.test(script) || /<!--/.test(script)) throw new Error('the card script would close itself early');
  if (/<\/style/i.test(css)) throw new Error('the card styles would close themselves early');
  const html = '<!doctype html>\n<html lang="en-AU">\n<head>\n<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    + '<meta name="robots" content="noindex">\n<meta name="referrer" content="no-referrer">\n'
    + '<meta name="author" content="Andrew Fisher">\n<meta name="color-scheme" content="light dark">\n'
    + '<title>GC500 Servicing</title>\n<style>\n' + css + '</style>\n</head>\n<body>\n'
    + '<!-- GC500 servicing tracker crew card. Author: Andrew Fisher. Track only: nothing here ticks the job record or changes a charge. Data: ' + escHtml(data.version || '') + ' -->\n'
    + '<header><div class="wrap">\n'
    + '<div class="top"><h1>GC500 Servicing</h1><span id="status" class="status">Connecting…</span></div>\n'
    + '<div id="compact" class="compact" aria-label="Service day and progress"></div>\n'
    + '</div></header>\n'
    + '<main><div class="wrap">\n'
    + '<div id="banners" class="bars"></div>\n'
    + '<div class="days" id="days" role="group" aria-label="Service day, 08:00 to 08:00"></div>\n'
    + '<div class="window" id="window"></div>\n'
    + '<div id="view"><noscript><p>This card needs JavaScript switched on to show and tick the servicing.</p></noscript></div>\n'
    + '<section class="card progress-detail" aria-label="Progress totals"><div class="bars" id="bars"></div></section>\n'
    + '<p class="note" id="readiness" role="status">Preparing offline scans…</p>\n'
    + '</div></main>\n'
    + '<footer><div class="wrap"><p class="note">Track only: nothing here ticks the job record or changes a charge. Times are Gold Coast time; each service day runs 08:00 to 08:00.</p>'
    + '<p class="note">' + (opts && opts.contact && opts.contact.phone
      ? 'Questions: ring <a href="tel:' + escHtml(String(opts.contact.phone).replace(/[^0-9+]/g, '')) + '">' + escHtml(opts.contact.name || 'the Coates events project manager') + ' on ' + escHtml(opts.contact.phone) + '</a>.'
      : 'Questions: contact the Coates events project manager on site.') + '</p>'
    + '<p class="note">GC500 · Coates · Author: Andrew Fisher</p></div></footer>\n'
    + '<div id="say" class="sr" aria-live="polite"></div>\n'
    + '<script>' + script + '</script>\n</body>\n</html>\n';
  const scripts = html.match(/<script\b/gi) || [];
  if (scripts.length !== 1) throw new Error('the card must carry exactly one <script>, it has ' + scripts.length);
  if (/\son[a-z]+\s*=/i.test(html.replace(/<script>[\s\S]*?<\/script>/, ''))) throw new Error('the card has an inline on*= handler');
  return html;
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--data') o.data = argv[++i];
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--config-out') o.configOut = argv[++i];
    else if (a === '--contact-name') o.contactName = argv[++i];
    else if (a === '--contact-phone') o.contactPhone = argv[++i];
    else throw new Error('unknown argument ' + a);
  }
  return o;
}

if (require.main === module) {
  const a = parseArgs(process.argv.slice(2));
  const data = JSON.parse(fs.readFileSync(a.data || DEFAULT_DATA, 'utf8'));
  const contact = a.contactPhone ? { name: a.contactName || '', phone: a.contactPhone } : null;
  const html = buildCardHtml(data, { contact });
  const out = a.out || path.join(HERE, 'card.html');
  fs.writeFileSync(out, html);
  const cfgOut = a.configOut || path.join(HERE, 'tracker_config.json');
  const cfg = trackerConfig(data);
  fs.writeFileSync(cfgOut, JSON.stringify(cfg, null, 1) + '\n');
  const sha = crypto.createHash('sha256').update(html, 'utf8').digest('hex');
  console.log('card      ' + out + '  ' + Buffer.byteLength(html) + ' bytes  sha256 ' + sha);
  console.log('script    ' + cardScriptHash(html) + '  (the CSP pins this)');
  console.log('tracker   ' + cfgOut + '  ' + cfg.days.length + ' days, ' + cfg.lines.length + ' lines, '
    + new Set(cfg.lines.map(l => l.ref)).size + ' references, ' + cfg.lines.reduce((n, l) => n + l.qty, 0) + ' units');
}

module.exports = { buildCardHtml, trackerConfig, cardData, cardScriptHash, scriptJson, DEFAULT_DATA };
