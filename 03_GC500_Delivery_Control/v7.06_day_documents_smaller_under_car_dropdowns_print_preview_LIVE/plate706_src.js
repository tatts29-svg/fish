/* v7.06 - THE DAY'S DOCUMENTS, SMALLER, UNDER THE CAR, AND PRINTED FROM A PREVIEW. The project manager, 27 Sep 2026:
 "They dont print right, its all over the place, prints all day cards. Nothing aligns. Can we do a drop box for installs
 and drivers and have a print all, or have each one mentioned individually by reference no. I said one page for each.
 I dont want empty space. You're mentioning Monday multiple times. They probably need to be smaller and under the car."

 WHY IT PRINTED THE DAY CARDS: on a phone the browser's print sheet opens AFTER window.print() has returned and the
 'afterprint' event has already fired, so the page had put itself back to normal - the Timeline - before the phone
 took its picture of it. Every document now opens as a preview (the v7.00 bar: the pages on screen, Print / Save as PDF
 and Close) and stays exactly as it will print until Close is pressed, so whatever the phone prints is the sheets.
 On a phone the preview is scaled to the screen; the paper is untouched.

 The plate: one slim row under the banner picture - the date once, no weekday - and four tiles. Drivers and Install
 are drop-downs: Print all, or one load, named by its reference numbers. One A4 page per load, as before. */
const DP_PLATE_ICO = {
 ps: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 13l2 2 4-4"/></svg>',
 drv: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
 ins: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h18M5 17v-2a7 7 0 0 1 14 0v2M10 8V5h4v3"/></svg>',
 mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
};
function dpPlate(days, sel){
 const L = days || [], d = L.find(x => x.iso === sel);
 if (!d) return '';
 const iso = esc(d.iso), f = fmtDay(d.iso), ps = dpPs(d.iso), today = todayIso();
 let loads = []; try { loads = dpLoads(d); } catch (e) { loads = []; }
 const n = loads.length, pg = k => k + ' page' + (k === 1 ? '' : 's');
 const face = (ico, word, sub) => `<span class="dpt-i">${ico}</span><span class="dpt-w">${word}</span><span class="dpt-s">${sub}</span>`;
 const psNone = d.iso < today ? 'Not for a day gone by' : 'None for this day';
 const pre = ps.state === 'ready'
  ? `<button type="button" class="dpt" data-dpp="prestart" data-iso="${iso}" title="The Coates Installs daily pre-start for this day - one A4 page">${face(DP_PLATE_ICO.ps, 'Pre-start', '1 page · ready')}</button>`
  : `<button type="button" class="dpt dp-off" aria-disabled="true" data-ps7-later="${esc(ps.state === 'later' ? dpPsLater(ps) : psNone)}" title="${esc(ps.state === 'later' ? dpPsLater(ps) : psNone)}">${face(DP_PLATE_ICO.ps, 'Pre-start', esc(ps.state === 'later' ? 'Ready ' + ps7Words(ps.batch) : psNone))}</button>`;
 /* Drivers and Install: Print all, or one load by its references */
 const menu = (kind, ico, word) => {
  if (!n) return `<button type="button" class="dpt dp-off" aria-disabled="true" data-ps7-later="Nothing is scheduled to move on this day">${face(ico, word, 'Nothing moves this day')}</button>`;
  const rows = loads.map((g, i) => {
   const refs = g.rows.map(r => r.a.key).join(' · '), when = [g.time, g.carrier].filter(Boolean).join(' · ');
   return `<button type="button" role="menuitem" class="dpm-r" data-dpp="${kind}" data-iso="${iso}" data-only="${i}"><b>Load ${i + 1}</b><span>${esc(refs)}</span>${when ? `<em>${esc(when)}</em>` : ''}</button>`;
  }).join('');
  return `<details class="dpm"><summary class="dpt" aria-haspopup="menu" title="Print all of them, or one load">${face(ico, word + ' ▾', n + ' load' + (n === 1 ? '' : 's') + ' · ' + pg(n))}</summary><div class="dpmail-m dpm-m" role="menu">
  <button type="button" role="menuitem" class="dpm-r dpm-all" data-dpp="${kind}" data-iso="${iso}"><b>Print all</b><span>${pg(n)}, one per load</span></button>${rows}</div></details>`;
 };
 /* the Email drop-down is v7.00's own - its menu, its rows and its wiring are the ones already live */
 const btns = dpDayButtons(d), k = btns.indexOf('<details class="dpmail">');
 let mail = k >= 0 ? btns.slice(k) : '';
 const oldSum = /<summary class="btn"[^>]*>Email ▾<\/summary>/;
 if (mail && oldSum.test(mail)) mail = mail.replace('<details class="dpmail">', '<details class="dpmail dpt-mail">').replace(oldSum,
  `<summary class="dpt" aria-haspopup="menu" title="Email a link to one of this day's documents">${face(DP_PLATE_ICO.mail, 'Email ▾', 'Send a link')}</summary>`);
 return `<section class="dplate" aria-label="Day documents, ${esc(fmtDate(d.iso))}"><span class="dplate-k">Day documents<b>${esc(f.dm)}</b></span>${pre}${menu('drivers', DP_PLATE_ICO.drv, 'Drivers')}${menu('install', DP_PLATE_ICO.ins, 'Install')}${mail}</section>`;
}
/* the plate sits under the banner picture (the car), above the day's figures */
function dpHeadWithPlate(days, sel){
 const h = paneHeadingHtml('timeline'), plate = dpPlate(days, sel);
 const f = h.lastIndexOf('</figure>'), k = f >= 0 ? f + 9 : h.indexOf('</h2>') + 5;
 return k < 5 ? h + plate : h.slice(0, k) + plate + h.slice(k);
}
/* the preview, on a phone, scaled to fit the screen - on screen only; the paper is never scaled by this */
function dpZoomFit(){
 const w = document.getElementById('dayprint'); if (!w) return;
 w.style.setProperty('--dpz', '1');
 const vw = document.documentElement.clientWidth, sw = w.scrollWidth;
 w.style.setProperty('--dpz', String(sw > vw ? Math.max(0.3, Math.floor((vw - 12) / sw * 1000) / 1000) : 1));
}
function dpWirePlate(pane){
 pane.classList.toggle('has-dplate', !!pane.querySelector('.dplate'));
 pane.querySelectorAll('.dplate [data-dpp]').forEach(b => b.onclick = () => {
  const dt = b.closest('details'); if (dt) dt.open = false;
  dpFromLink(b.dataset.dpp, b.dataset.iso, b.dataset.only != null && b.dataset.only !== '' ? +b.dataset.only : null);
 });
 pane.querySelectorAll('.dplate details').forEach(dt => dt.addEventListener('toggle', () => {
  if (!dt.open) return;
  pane.querySelectorAll('.dplate details[open]').forEach(o => { if (o !== dt) o.open = false; });
  const m = dt.querySelector('.dpmail-m'); if (!m) return;
  m.style.left = '0px'; m.style.right = 'auto';
  const r = m.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  if (r.right > vw - 8) m.style.left = (vw - 8 - r.right) + 'px';
  const r2 = m.getBoundingClientRect(); if (r2.left < 8) m.style.left = (parseFloat(m.style.left) + 8 - r2.left) + 'px';
 }));
}
document.addEventListener('click', e => { document.querySelectorAll('details.dpm[open]').forEach(dt => { if (!dt.contains(e.target)) dt.open = false; }); });
window.addEventListener('resize', () => { if (document.body.classList.contains('dpbar-on')) dpZoomFit(); });
