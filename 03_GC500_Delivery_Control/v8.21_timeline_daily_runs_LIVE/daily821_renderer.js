/* GC500 daily delivery page · day-only installer page · Andrew Fisher.
 * Uses the existing carbon load plates and orange Navigate treatment.
 * This renderer has an explicit data allowlist. No full-app document or model
 * is embedded in its output. No scripts, remote dependencies or send actions.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GC500Daily = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function value(input) {
    return input == null ? '' : typeof input === 'string' || typeof input === 'number' ? String(input).trim() : '';
  }
  function esc(input) {
    return value(input).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  }
  function mapsUrl(input) {
    try {
      const url = new URL(value(input));
      const google = ['www.google.com', 'google.com', 'www.google.com.au', 'google.com.au'].includes(url.hostname) && /^\/maps(?:\/|$)/.test(url.pathname);
      const maps = ['maps.google.com', 'maps.google.com.au', 'maps.app.goo.gl'].includes(url.hostname);
      return url.protocol === 'https:' && !url.username && !url.password && !url.port && (google || maps) ? url.href : '';
    } catch (_) { return ''; }
  }
  function visibleStatus(state) {
    if (typeof state === 'string') return {label: state, tone: state === 'Not on site' ? 'red' : ''};
    state = state || {};
    return {label: value(state.label || state.text), tone: ['green', 'amber', 'red', 'cx'].includes(state.tone) ? state.tone : ''};
  }
  function equipment(row) {
    const items = Array.isArray(row.items) ? row.items : [];
    const detailed = items.map(item => {
      if (typeof item === 'string') return value(item);
      if (!item || typeof item !== 'object') return '';
      const name = value(item.name || item.item || item.equipment);
      const quantity = value(item.qty == null ? item.quantity : item.qty);
      return name ? (quantity ? quantity + ' × ' : '') + name : '';
    }).filter(Boolean);
    return detailed.length ? detailed : [value(row.item)].filter(Boolean);
  }
  const pin = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-6 18-4-8-8-4L21 3Z"/><path d="m11 13 10-10"/></svg>';
  const chevron = '<svg class="chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg>';
  const CSS = `
    :root{color-scheme:light;--ink:#14181d;--mute:#646d77;--paper:#fff;--tint:#f8f6f4;--rule:#e4e0dc;--ld-ink:#f4f1ec;--ld-mute:#b5bdc3;--ld-edge:#353e45;--ld-or:#ff6a13;--display:'Barlow Condensed','Arial Narrow',Arial,sans-serif;--sans:'Inter',system-ui,-apple-system,'Segoe UI',Arial,sans-serif}
    *{box-sizing:border-box}html{background:var(--tint);scroll-behavior:smooth}body{margin:0;color:var(--ink);font:14px/1.5 var(--sans);-webkit-text-size-adjust:100%}a{color:inherit}button,a,summary{-webkit-tap-highlight-color:transparent}a:focus-visible,summary:focus-visible{outline:3px solid #ff8a3d;outline-offset:4px;border-radius:6px}svg{display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}p,h1,h2,h3,dl,dd{margin:0}a,span,p,li,dd,h1,h2,h3{overflow-wrap:anywhere}.skip{position:absolute;left:12px;top:-100px;z-index:2;padding:12px;background:#fff;color:#14181d}.skip:focus{top:8px}.preview{border-bottom:1px solid #e6c4ad;background:#fff2e8;color:#74320c;font-size:11px;line-height:1.5}.preview-inner{max-width:900px;margin:auto;padding:9px 24px;display:flex;flex-wrap:wrap;gap:2px 8px;align-items:baseline}.preview strong{font-weight:800;letter-spacing:.05em;text-transform:uppercase}.preview span{color:#754328}.page{max-width:900px;margin:0 auto;padding:28px 24px 22px}.masthead{display:flex;align-items:center;gap:10px;padding-bottom:20px;border-bottom:1px solid var(--rule)}.brand{font:italic 800 24px/.95 var(--display);letter-spacing:-.025em}.brand::before{content:'';display:inline-block;width:5px;height:20px;margin-right:7px;background:var(--ld-or);transform:skew(-10deg);vertical-align:-1px}.masthead .slash{color:#bbb0a7;font-weight:400;font-size:24px}.masthead-label{font-size:13px;font-weight:650}.day-heading{padding:21px 0 19px}.eyebrow{color:#785540;font-size:10px;font-weight:750;letter-spacing:.13em;text-transform:uppercase;margin-bottom:7px}h1{font:italic 800 clamp(29px,5.5vw,39px)/1.08 var(--display);letter-spacing:-.025em}.recipient{margin-top:12px;display:flex;align-items:baseline;flex-wrap:wrap;gap:3px 6px;font-size:13px}.recipient .label{color:var(--mute)}.recipient strong{font-weight:700}.issued{font-size:11px;color:var(--mute);margin-top:6px}.run-heading{border-top:1px solid var(--rule);padding:14px 0 10px;display:flex;align-items:baseline;justify-content:space-between;gap:10px}.run-heading h2{font-size:12px;font-weight:750}.run-heading p{font-size:11px;color:var(--mute)}.loads{list-style:none;padding:0;margin:0;display:grid;gap:10px}.load{position:relative;border-radius:12px;color:var(--ld-ink);border:1px solid var(--ld-edge);background:repeating-linear-gradient(90deg,rgba(255,255,255,.02) 0 2px,transparent 2px 5px),linear-gradient(160deg,#222a2f,#121517 72%);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 4px 12px rgba(0,0,0,.1)}.load::before{content:'';position:absolute;left:-1px;top:12px;width:5px;height:44px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#ff8a3d,var(--ld-or))}.load-top{padding:14px 18px 11px;display:grid;grid-template-columns:57px minmax(0,1fr);gap:15px;align-items:center}.load-number{display:flex;flex-direction:column;gap:4px;line-height:1}.load-number span{font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#ff8a3d}.load-number b{font:italic 800 30px/.9 var(--display)}.load-timing{min-width:0;padding-left:15px;border-left:1px solid #424c53;display:flex;align-items:center;flex-wrap:wrap;gap:5px 12px}.load-timing strong{font:italic 800 23px/1.1 var(--display);font-variant-numeric:tabular-nums;letter-spacing:.01em}.load-timing .carrier{color:var(--ld-mute);font-size:10px;font-weight:700;letter-spacing:.075em;text-transform:uppercase}.load-content{padding:0 18px}.delivery{padding:13px 0 12px;border-top:1px solid #394147}.ref-line{display:flex;align-items:center;justify-content:space-between;gap:8px 12px;flex-wrap:wrap}.reference{display:flex;align-items:center;gap:8px;min-width:0}.reference-label{font-size:9px;letter-spacing:.1em;font-weight:700;color:var(--ld-mute);text-transform:uppercase}.reference h3{font:italic 800 25px/1 var(--display);letter-spacing:.015em}.status{display:inline-flex;align-items:center;gap:6px;font-size:9px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;color:var(--ld-mute);line-height:1.3}.lamp{display:inline-block;flex:none;width:8px;height:8px;border-radius:50%;border:1.5px solid #a5afb6}.status.green{color:#86e7aa}.status.amber{color:#ffce67}.status.red{color:#ff9a92}.status.green .lamp{border:0;background:#72e39c;box-shadow:0 0 5px #72e39c55}.status.amber .lamp{border:0;background:#ffc54d;box-shadow:0 0 5px #ffc54d55}.status.red .lamp{border:0;background:#ff8277;box-shadow:0 0 5px #ff827755}.status.cx .lamp{background:linear-gradient(135deg,transparent 43%,#a5afb6 43% 57%,transparent 57%)}.equipment{padding:0;list-style:none;margin:9px 0 10px;color:#edf0f2;font-size:12px;line-height:1.5}.equipment li+li{margin-top:2px}.destination-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.destination{display:flex;gap:7px;min-width:0;color:#c2c9ce;font-size:11px;line-height:1.4}.destination svg{width:15px;height:15px;flex:none;margin-top:1px;color:#ff8a3d}.navigate{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;min-width:110px;padding:8px 13px;border-radius:999px;color:#261407;text-decoration:none;background:linear-gradient(180deg,#ff9a58,#ff751f);border:1px solid #ffaf7b;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 0 10px 2px rgba(255,106,19,.12);font:italic 800 15px/1 var(--display);letter-spacing:.025em}.navigate svg{width:16px;height:16px}.navigate:hover{background:#ffac77}.no-navigation{color:var(--ld-mute);font-size:11px;padding:9px 0}.details{border-top:1px solid #394147}.details summary{list-style:none;cursor:pointer;display:flex;gap:8px;align-items:center;justify-content:space-between;min-height:43px;padding:10px 18px;font-size:11px;color:#d1d7db;font-weight:650}.details summary::-webkit-details-marker{display:none}.details-label{display:flex;align-items:center;gap:8px}.details-label span{font-weight:400;color:#aab3ba;font-size:10px}.chevron{width:16px;height:16px;flex:none;color:#b9c3ca;transition:transform .15s}.details[open] .chevron{transform:rotate(180deg);color:#ff8a3d}.details[open] summary{border-bottom:1px solid #394147}.details-body{padding:3px 18px 14px;color:#d1d7db;font-size:12px;line-height:1.55}.detail-row{padding-top:11px}.detail-row+.detail-row{border-top:1px solid #394147;margin-top:12px}.detail-ref{color:#ffab73;font-size:10px;letter-spacing:.075em;text-transform:uppercase;font-weight:750;margin-bottom:7px}.detail-row dl{display:grid;grid-template-columns:92px minmax(0,1fr);gap:7px 12px}.detail-row dt{font-size:11px;color:#aab3ba}.detail-row dd{white-space:pre-line}.footer{margin-top:20px;border-top:1px solid var(--rule);padding-top:14px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:5px 15px;color:var(--mute);font-size:10px;line-height:1.5}.empty{padding:20px;border:1px solid var(--rule);border-radius:12px;background:#fff;font-size:13px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    @media(min-width:700px){.load-top{grid-template-columns:62px minmax(0,1fr);padding-top:15px;padding-bottom:13px}.load-content{padding-left:95px}.load::before{height:46px}.delivery{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,.8fr);gap:6px 20px;align-items:center;padding-top:13px;padding-bottom:13px}.ref-line{grid-column:1;justify-content:flex-start;gap:14px}.equipment{grid-column:1;margin:3px 0}.destination-row{grid-column:2;grid-row:1/3;gap:16px}.details summary{padding-left:95px}.details-body{padding-left:95px}.details-label span{font-size:11px}.load-timing strong{font-size:25px}.details summary{min-height:42px}}
    @media(max-width:359px){.page{padding:21px 14px 18px}.preview-inner{padding-left:14px;padding-right:14px}.masthead{gap:8px}.masthead-label{font-size:12px}.day-heading{padding-top:18px}h1{font-size:30px}.load-top{padding-left:15px;padding-right:14px;grid-template-columns:47px minmax(0,1fr);gap:12px}.load-timing{padding-left:12px}.load-content{padding-left:15px;padding-right:14px}.load-timing strong{font-size:21px}.destination-row{gap:8px}.navigate{min-width:99px;padding:8px 10px}.details summary{padding-left:15px;padding-right:14px}.details-label span{display:none}.detail-row dl{grid-template-columns:1fr;gap:2px}.detail-row dd+dt{margin-top:6px}.details-body{padding-left:15px;padding-right:14px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important;animation:none!important}}
    .load-main{min-width:0;border-left:1px solid #424c53;padding-left:15px}.load-main .ref-line{gap:5px 12px}.load-main .reference-label{display:none}.load-main .load-timing{padding:7px 0 0;border:0;gap:5px 9px}.load-main .load-timing strong{font-size:16px}.load-main .status{font-size:8.5px}.delivery.single{padding-top:8px}.delivery.single .equipment{margin-top:0}.report-point{display:block;margin-top:3px;color:#ffb989;font-weight:650}.time-missing{font-size:11px!important;font-style:normal!important;font-family:var(--sans)!important;color:var(--ld-mute)}
    @media(min-width:700px){.load-main .ref-line{justify-content:flex-start;gap:14px}.load-main .status{font-size:9px}.delivery.single .destination-row{grid-row:1}.delivery.single .equipment{margin:0}.delivery.single{padding-top:10px;padding-bottom:10px}}
    @media(max-width:359px){.load-main{padding-left:12px}.load-main .ref-line{gap:6px}.load-main .reference h3{font-size:23px}.load-main .status{font-size:8px}}
    .date-warning{grid-column:1/-1;margin-top:10px;border-left:3px solid #ffc54d;padding:8px 10px;color:#ffdf97;background:#55431a66;font-size:12px;line-height:1.5}
    @media print{html,body{background:#fff}.page{max-width:none;padding:0}.preview{border:1px solid #bbb}.preview-inner{padding:5px 0}.skip{display:none}.load{break-inside:avoid;box-shadow:none;print-color-adjust:exact;-webkit-print-color-adjust:exact}.details[open] .details-body{display:block}.navigate{box-shadow:none}.footer{font-size:9px}}
  `;

  function renderReference(row, id) {
    const reference = value(row.key || row.ref);
    const status = visibleStatus(row.state);
    return '<div class="ref-line"><div class="reference"><span class="reference-label">Ref</span><h3 id="' + id + '">' + esc(reference || 'Not recorded') + '</h3></div>' +
      (status.label ? '<span class="status ' + esc(status.tone) + '"><span class="lamp" aria-hidden="true"></span>' + esc(status.label) + '</span>' : '') + '</div>';
  }

  function renderRow(row, loadNumber, rowIndex, single) {
    const reference = value(row.key || row.ref);
    const navigation = mapsUrl(row.navUrl);
    const id = 'load-' + loadNumber + '-ref-' + rowIndex;
    const report = value(row.meetName) || (row.directions && value(row.directions.report));
    return '<section class="delivery' + (single ? ' single' : '') + '" aria-labelledby="' + id + '">' +
      (single ? '' : renderReference(row, id)) +
      '<ul class="equipment" aria-label="Equipment and quantity">' + equipment(row).map(item => '<li>' + esc(item) + '</li>').join('') + '</ul>' +
      '<div class="destination-row"><p class="destination">' + pin + '<span>' + esc(row.place || 'Location not recorded') + (report ? '<span class="report-point">Report to ' + esc(report) + '</span>' : '') + '</span></p>' +
      (navigation ? '<a class="navigate" href="' + esc(navigation) + '" target="_blank" rel="noopener noreferrer" aria-label="Navigate to ' + esc(row.meetName || row.place || reference || 'load ' + loadNumber) + ' in Google Maps, opens in a new tab">' + arrow + '<span>' + (row.meetName ? 'Meet point' : 'Navigate') + '</span></a>' : '<span class="no-navigation">Map unavailable</span>') + '</div>' + (row.dateWarning ? '<p class="date-warning" role="note">' + esc(row.dateWarning) + '</p>' : '') + '</section>';
  }

  function renderDetails(rows, load, iso) {
    return '<details class="details"><summary><span class="details-label">Details<span>Notes &amp; delivery information</span></span>' + chevron + '</summary><div class="details-body">' + rows.map(row => {
      const ownNotes = Array.isArray(row.notes) ? row.notes.map(value) : [value(row.notes)];
      const eventNotes = (Array.isArray(row.events) ? row.events : []).filter(event => event && event.date === iso).map(event => value(event.note));
      const notes = Array.from(new Set([...ownNotes, ...eventNotes].filter(Boolean))).join('\n');
      const contact = "";
      const basis = value(row.navBasis);
      return '<div class="detail-row">' + (rows.length > 1 ? '<p class="detail-ref">Ref ' + esc(row.key || row.ref) + '</p>' : '') +
        '<dl>' + (row.order ? '<dt>Order</dt><dd>' + esc(row.order) + '</dd>' : '') + '<dt>' + esc(load.time ? (load.timeLabel || (load.booking ? 'Load Kingston' : 'Time')) : 'Load time') + '</dt><dd>' + esc(load.time || 'Not recorded') + '</dd>' + (load.basis ? '<dt>Load information</dt><dd>' + esc(load.basis) + '</dd>' : '') + (basis ? '<dt>Map point</dt><dd>' + esc(basis) + '</dd>' : '') +
        (row.quantityRecord ? '<dt>Quantity record</dt><dd>' + esc(row.quantityRecord) + '</dd>' : '') + (row.assets ? '<dt>Booked / recorded assets</dt><dd>' + esc(row.assets) + '</dd>' : '') + (row.access ? '<dt>Way in</dt><dd>' + esc(row.access) + '</dd>' : '') + (row.meetWords ? '<dt>Meet point</dt><dd>' + esc(row.meetWords) + '</dd>' : '') +
        '<dt>Delivery notes</dt><dd>' + esc(notes || 'No delivery notes recorded.') + '</dd></dl></div>';
    }).join('') + '</div></details>';
  }

  function renderDay(model, team, options) {
    model = model || {};
    team = team || {};
    const iso = value(model.iso);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(Date.parse(iso + 'T00:00:00Z')) || new Date(iso + 'T00:00:00Z').toISOString().slice(0, 10) !== iso) throw new Error('A valid selected delivery date is required.');
    const loads = (Array.isArray(model.loads) ? model.loads : []).filter(load => load && (!load.iso || load.iso === iso)).map(load => ({...load, rows:(Array.isArray(load.rows) ? load.rows : []).filter(row => row && (!row.iso || row.iso === iso))})).filter(load => load.rows.length);
    const label = value(model.label) || new Date(iso + 'T12:00:00Z').toLocaleDateString('en-AU', {weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'Australia/Brisbane'});
    const issued = value(model.issued);
    const recipient = value(team.name) || 'Installer';
    const loadCount = loads.length;
    // Optional font CSS is trusted build material, never taken from a day record.
    // Keep only embedded font-face blocks. The page CSP prevents network fetches.
    const fontCss = value(options && options.fontCss).match(/@font-face\s*\{[^{}<>]*\}/g);
    const fonts = (fontCss || []).filter(face => /url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\)/.test(face) && !/url\((?!data:font\/woff2;base64,)/.test(face)).join('\n');
    const cards = loads.map((load, index) => {
      const n = value(load.n) || String(index + 1);
      const single = load.rows.length === 1;
      const timing = load.time || load.carrier ? '<div class="load-timing">' + (load.time ? '<span class="carrier">' + esc(load.timeLabel || (load.booking ? 'Load Kingston' : 'Time')) + '</span><strong>' + esc(load.time) + '</strong>' : '') + (load.carrier ? '<span class="carrier">' + esc(load.carrier) + '</span>' : '') + '</div>' : '';
      return '<li><article class="load" aria-labelledby="load-heading-' + index + '"><header class="load-top"><h2 class="load-number" id="load-heading-' + index + '"><span>Load</span><b>' + esc(n.padStart(2,'0')) + '</b></h2>' +
        '<div class="load-main">' + (single ? renderReference(load.rows[0], 'load-' + index + '-ref-0') : '<p>' + load.rows.length + ' delivery references</p>') + timing + '</div></header>' +
        '<div class="load-content">' + load.rows.map((row, r) => renderRow(row, index, r, single)).join('') + '</div>' + renderDetails(load.rows, load, iso) + '</article></li>';
    }).join('');
    return '<!doctype html>\n<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="author" content="Andrew Fisher"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; font-src data:; base-uri \'none\'; form-action \'none\'"><title>GC500 · ' + esc(label) + ' · Daily deliveries</title><style>' + fonts + '\n' + CSS + '</style></head><body>' +
      '<a class="skip" href="#deliveries">Skip to deliveries</a><aside class="preview" aria-label="Issued delivery snapshot"><div class="preview-inner"><strong>Issued snapshot</strong><span>Current scheduled deliveries only · supplier plans remain separate · confirm any changed instructions with the site team.</span></div></aside>' +
      '<main class="page"><header><div class="masthead"><span class="brand">GC500</span><span class="slash" aria-hidden="true">/</span><span class="masthead-label">Daily deliveries</span></div><div class="day-heading"><p class="eyebrow">Installer delivery sheet</p><h1><time datetime="' + iso + '">' + esc(label) + '</time></h1><p class="recipient"><span class="label">Prepared for</span><strong>' + esc(recipient) + '</strong></p><p class="issued">Issued' + (issued ? ' · ' + esc(issued) : ' · issue time not recorded') + '</p></div></header>' +
      '<section id="deliveries" aria-labelledby="delivery-heading"><div class="run-heading"><h2 id="delivery-heading">' + loadCount + ' delivery ' + (loadCount === 1 ? 'load' : 'loads') + '</h2><p>In load order</p></div>' +
      (loadCount ? '<ol class="loads">' + cards + '</ol>' : '<p class="empty">No delivery loads recorded for this day.</p>') + '</section>' +
      '<footer class="footer"><p>Author: Andrew Fisher</p><p>Record revision ' + esc(model.revision || 'not recorded') + ' · link expires after ' + esc(model.expires || iso) + '</p></footer></main></body></html>';
  }

  return Object.freeze({renderDay, mapsUrl});
});
