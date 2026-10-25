<style id="figures1220-style">
/* Author: Andrew Fisher. v12.22 - figures first on the Costs cards: the workings fold away under each card's button */
.figures1220:not(.work1220) .pl-lb > small,.figures1220:not(.work1220) .pl-note,.figures1220:not(.work1220) .pl-missing-full1220,
.figures1220:not(.work1220) .fin745-basis,.figures1220:not(.work1220) .work1220-only,.figures1220:not(.work1220) .fin745-blockhead p,
.figures1220:not(.work1220) .fin745-heading p:not(.fin745-eyebrow),.figures1220:not(.work1220) .fin745-metric small,
.figures1220:not(.work1220) .rh766-basis,.figures1220:not(.work1220) td.num .acc761-w{display:none!important}
.figures1220.work1220 .pl-missing-short1220{display:none!important}
.work1220-bar{display:flex;justify-content:flex-end;margin:6px 0 10px}
.work1220-bar .btn{font-size:12px;padding:5px 12px;min-height:32px}
.pl-missing-short1220 li{margin:3px 0}
</style>
<script id="figures1220-script">
/* Author: Andrew Fisher. v12.22 - figures first. Andrew, 25 Oct 2026 (this chat): "i want this the amount of info shortened no
   one is going to read all this we just want Figures", on the Forecast P&L's Revenue and Direct costs, "Not in it yet", Transport
   Revenue and Rehire by Revenue branch; and "OUR DATA MUST BE CLEAN ... ITS DEMOB TOMMORROW SO ALL COST NEED TO BE VERY CLEAR".
   Each of the four cards shows its figures; the explanations fold away under a "Show the workings" button on the card, remembered
   for the visit. "Not in it yet" groups the lines that repeat (one line for the barriers) and keeps each line to its figures;
   the full list is under the workings. Presentation only: every figure and every word is still on the page. */
(function (W) {
'use strict';
if (W.Figures1220 || typeof pl752Card !== 'function') return;
var KEY = 'gc500.workings1220';
var opened = function () { try { return JSON.parse(W.sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
var remember = function (id, on) { try { var o = opened(); if (on) o[id] = 1; else delete o[id]; W.sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
var label = function (on) { return on ? 'Hide the workings' : 'Show the workings'; };
var bar = function (id) { var on = !!opened()[id]; return '<div class="work1220-bar"><button type="button" class="btn ghost" data-work1220="' + id + '" aria-expanded="' + on + '">' + label(on) + '</button></div>'; };
var cls = function (id) { return 'figures1220' + (opened()[id] ? ' work1220' : ''); };
/* the list's words, not its HTML, so nothing is ever cut inside an escaped character (&amp; read as a break once) */
var ENT = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&apos;': "'"};
var plain = function (h) { return String(h).replace(/&(?:amp|lt|gt|quot|apos|#39|#x27);/g, function (e) { return ENT[e]; }).replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(Number(n)); }); };
var html = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
var MAX = 175;
/* figures first: the line's first clause, then each later clause that carries a figure, as far as about two lines; quoted
   words, who said it and lists in brackets without a figure stay in the full list */
function short(t, max) {
  max = max || MAX;
  var s = String(t).replace(/\s*“[^”]*”/g, '').replace(/\s+—\s+(?:the )?project manager\b[^—]*/gi, ' ')
    .replace(/\s*\(([^()]*)\)/g, function (m, inner) { return /\$\d|\d\s?(?:h|nights?|loads?|shifts?)\b/.test(inner) ? m : ''; })
    .replace(/\s{2,}/g, ' ').trim().replace(/\.$/, '');
  var parts = s.split(/;\s+|\.\s+/), out = parts[0];
  for (var i = 1; i < parts.length; i++) {
    if (!/\d/.test(parts[i])) continue;
    if (out.length + 2 + parts[i].length > max) break;
    out += '; ' + parts[i];
  }
  if (out.length > max) {
    var k = Math.max(out.lastIndexOf(' — ', max), out.lastIndexOf(' · ', max));
    out = k > 40 ? out.slice(0, k) : out.slice(0, max - 3).replace(/\s+\S*$/, '') + '…';
  }
  return out;
}
/* references in runs: WB01, WB02 … WB07 reads WB01–WB07 */
function ranges(refs) {
  var p = refs.map(function (r) { var m = /^([A-Z]+)(\d+)$/.exec(r); return m ? {p: m[1], n: Number(m[2]), r: r} : null; });
  if (p.some(function (x) { return !x; })) return refs.join(', ');
  var out = [], i = 0;
  while (i < p.length) {
    var j = i; while (j + 1 < p.length && p[j + 1].p === p[i].p && p[j + 1].n === p[j].n + 1) j++;
    out.push(j - i >= 2 ? p[i].r + '–' + p[j].r : p.slice(i, j + 1).map(function (x) { return x.r; }).join(', ')); i = j + 1;
  }
  return out.join(', ');
}
/* the lines that say the same thing for several references become one */
function group(items) {
  var out = [], seen = {}, order = [];
  items.forEach(function (it) {
    /* v12.26 - a provisional note that repeats for several references folds the same way ("Provisional: 13 × TL2 (…) — …") */
    var t = plain(it.html), pre = it.cls === 'prov' && /^Provisional: /.test(t) ? 'Provisional: ' : '';
    var m = (!it.cls || pre) && /^([A-Z]{1,5}\d+[A-Z0-9-]*) · ([^:]{1,40}): ([\s\S]+)$/.exec(t.slice(pre.length));
    if (!m) { order.push({cls: it.cls, text: t}); return; }
    var key = (it.cls || '') + '|' + m[3].trim();
    if (!seen[key]) { seen[key] = {refs: [], labels: [], cls: it.cls || '', pre: pre, reason: m[3].trim()}; order.push({key: key}); }
    seen[key].refs.push(m[1]); seen[key].labels.push(m[2].trim());
  });
  order.forEach(function (o) {
    if (!o.key) { out.push({cls: o.cls, html: html(short(o.text))}); return; }
    var g = seen[o.key], same = g.labels.every(function (l) { return l === g.labels[0]; });
    var who = g.refs.length > 3 ? g.refs.length + ' × ' + (same ? g.labels[0] : 'items') + ' (' + ranges(g.refs) + ')'
      : g.refs.map(function (r, n) { return r + ' ' + g.labels[n]; }).join(', ');
    out.push({cls: g.cls, html: html(g.pre + who + ' — ' + short(g.reason, MAX - g.pre.length - who.length - 3))});
  });
  return out;
}
var p752 = pl752Card;
pl752Card = function () {
  var out = p752.apply(this, arguments);
  try {
    if (typeof out !== 'string' || out.indexOf('<section class="card pl752" id="pl752"') < 0) return out;
    out = out.replace('<section class="card pl752" id="pl752"', '<section class="card pl752 ' + cls('pl752') + '" data-figures1220="pl752" id="pl752"');
    out = out.replace('</header>', '</header>' + bar('pl752'));
    out = out.replace(/<ul class="pl-missing">([\s\S]*?)<\/ul>/, function (all, inner) {
      var items = [];
      inner.replace(/<li(?: class="([^"]*)")?>([\s\S]*?)<\/li>/g, function (m, c, t) { items.push({cls: c || '', html: t}); return m; });
      if (!items.length) return all;
      var g = group(items);
      return '<ul class="pl-missing pl-missing-short1220">' + g.map(function (x) { return '<li' + (x.cls ? ' class="' + x.cls + '"' : '') + '>' + x.html + '</li>'; }).join('') + '</ul>' +
        '<ul class="pl-missing pl-missing-full1220">' + inner + '</ul>';
    });
    return out;
  } catch (e) { return out; }
};
if (typeof buildingTransportTable831 === 'function') {
  var bt = buildingTransportTable831;
  buildingTransportTable831 = function () {
    var out = bt.apply(this, arguments);
    try {
      if (typeof out !== 'string' || out.indexOf('<div class="fin745-block" id="buildingTransport831">') < 0) return out;
      out = out.replace('<div class="fin745-block" id="buildingTransport831">', '<div class="fin745-block ' + cls('transport831') + '" data-figures1220="transport831" id="buildingTransport831">');
      out = out.replace('. Existing contract charges are counted once. Card or recorded rates apply only to uncovered units and legs.</p>', '<span class="work1220-only">. Existing contract charges are counted once. Card or recorded rates apply only to uncovered units and legs.</span></p>');
      out = out.replace('<p class="fin745-basis">', bar('transport831') + '<p class="fin745-basis">');
      return out;
    } catch (e) { return out; }
  };
}
if (typeof rh766Card === 'function') {
  var rh = rh766Card;
  rh766Card = function () {
    var out = rh.apply(this, arguments);
    try {
      if (typeof out !== 'string' || out.indexOf('<section id="rehire766" class="fin745 rh766') < 0) return out;
      out = out.replace('<section id="rehire766" class="fin745 rh766', '<section id="rehire766" data-figures1220="rehire766" class="' + cls('rehire766') + ' fin745 rh766');
      out = out.replace('<th>Basis · what is not on the record</th>', '<th class="rh766-basis">Basis · what is not on the record</th>');
      out = out.replace('<div class="fin745-metrics acc761-metrics">', bar('rehire766') + '<div class="fin745-metrics acc761-metrics">');
      return out;
    } catch (e) { return out; }
  };
}
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('[data-work1220]') : null; if (!b) return;
  var id = b.getAttribute('data-work1220'), card = b.closest('[data-figures1220]'); if (!card) return;
  var on = !card.classList.contains('work1220');
  card.classList.toggle('work1220', on); remember(id, on);
  b.textContent = label(on); b.setAttribute('aria-expanded', String(on));
});
W.Figures1220 = Object.freeze({version: 'v12.26', short: short, group: group});
})(window);
</script>
