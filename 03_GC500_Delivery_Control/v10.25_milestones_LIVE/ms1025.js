/* Author: Andrew Fisher. Milestones (v10.25): when an area of the job - a discipline group, the plates on Where we
   are - has every unit done by the board's own count, the area card gets a 100% badge with the day it got there, a
   short fireworks burst the first time this browser sees it, and a start-to-finish summary generated only from the
   record's own documents: counts and stamps, nothing written by a person or a model. Printable, one A4 per area
   (#print/milestone/<area>, #print/milestone/all). Nothing here writes to the record. */
(function () {
'use strict';
const W = window;
const SEEN_KEY = 'ms1025_seen';
const FORM = 'GC500-MS-01 v1';
const MIN_REFS = 3;

/* ---------------------------------------------------------------------------------------------------- the areas
   The areas are the Today tab's Work progress board's own (todayWorkMetrics840): Buildings, Toilets, Generators,
   Lighting, VMS boards, Equipment - each with its Done and Left by the board's own rule ("recorded complete ticks
   across the whole active scope"). Fencing is metres of docketed work, not references, and is left out. */
function areas(asOf){
 const m = typeof todayWorkMetrics840 === 'function' ? todayWorkMetrics840(asOf || todayIso()) : [];
 return (Array.isArray(m) ? m : []).filter(a => a && a.id && a.groupName && Array.isArray(a.rows));
}
function area(id, asOf){ return areas(asOf).find(a => a.id === id) || null; }
function refsOf(a){ const seen = new Set(); return (a.rows || []).map(r => r && r.key).filter(k => k && !seen.has(k) && seen.add(k)).map(k => assetOf(k)).filter(x => x && !x._cancelled); }

/* ------------------------------------------------------------------------------------------------- the stamps */
const DAY_FMT = new Intl.DateTimeFormat('en-CA', {timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit'});
const HM_FMT = new Intl.DateTimeFormat('en-GB', {timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false});
function dayOf(iso){ const d = new Date(iso); return isNaN(d) ? null : DAY_FMT.format(d); }
function hmOf(iso){ const d = new Date(iso); return isNaN(d) ? '' : HM_FMT.format(d); }
function dmy(day){ if (!day) return '—'; const d = new Date(day + 'T00:00:00'); return isNaN(d) ? day : `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; }
function dmyhm(iso){ const day = dayOf(iso); return day ? dmy(day) + ' ' + hmOf(iso) : '—'; }

/* ------------------------------------------------------------------------------------------------- the facts
   Everything below is a count or a stamp read from the delivery documents and the asset list. The as-at day is
   the one Where we are shows; an event after that day is not counted. */
function facts(id, asOf){
 asOf = asOf || todayIso();
 const A = typeof id === 'object' ? id : area(id, asOf); if (!A) return null;
 const refs = refsOf(A), raw = S.delivery || {};
 const onsite = [], complete = [], byDay = new Map(), tickedBy = new Map(), onsiteBy = new Map(), movedMany = [], reticked = [], noHistory = [], noNumber = [];
 const types = new Map(); let levelled = 0, steps = 0, numbered = 0, numbersTotal = 0, withAcc = 0, doneNow = 0, onNow = 0;
 const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
 const dayRow = day => { if (!byDay.has(day)) byDay.set(day, {onsite: 0, complete: 0}); return byDay.get(day); };
 refs.forEach(a => {
  const d = deliveryAsOf(a.key, asOf), r = raw[a.key] || {};
  (a.item_types || []).forEach(it => bump(types, it));
  if (d.done) doneNow++; if (d.recorded && (d.state === 'on site' || d.done)) onNow++;
  if (d.levelled) levelled++; if (d.steps) steps++;
  const nums = a.asset_numbers || []; if (nums.length) { numbered++; numbersTotal += nums.length; } else noNumber.push(a.key);
  if ((a.accessories || []).length) withAcc++;
  const hist = (r.history || []).filter(h => h && h.at && dayOf(h.at) && dayOf(h.at) <= asOf);
  const first = hist.find(h => h.state === 'on site');
  if (first) { onsite.push({key: a.key, at: first.at, by: first.by || null}); dayRow(dayOf(first.at)).onsite++; bump(onsiteBy, String(first.by || '(no name)')); }
  else if (d.recorded && d.state === 'on site') noHistory.push(a.key);
  if (hist.length > 1) movedMany.push({key: a.key, n: hist.length, path: hist.map(h => h.state).join(' → ')});
  const dh = (r.done_history || []).filter(h => h && h.at && dayOf(h.at) && dayOf(h.at) <= asOf);
  const ons = dh.filter(h => h.done);
  if (ons.length) { const last = ons[ons.length - 1]; complete.push({key: a.key, at: last.at, by: last.by || null}); dayRow(dayOf(last.at)).complete++; bump(tickedBy, String(last.by || '(no name)')); }
  else if (d.done && r.done_at && dayOf(r.done_at) <= asOf) { complete.push({key: a.key, at: r.done_at, by: r.done_by || null}); dayRow(dayOf(r.done_at)).complete++; bump(tickedBy, String(r.done_by || '(no name)')); }
  if (dh.some(h => !h.done)) reticked.push(a.key);
 });
 onsite.sort((x, y) => x.at < y.at ? -1 : 1); complete.sort((x, y) => x.at < y.at ? -1 : 1);
 const total = refs.length, units = {done: A.done, total: A.total, left: A.remaining};
 /* 100% by the board's own rule: every unit done, nothing left - and at least MIN_REFS references, so an area of one
    or two is listed with its percent, never celebrated as a milestone */
 const reached = A.total > 0 && A.done === A.total && !(A.remaining > 0) && total >= MIN_REFS && doneNow === total;
 const last = complete.length ? complete[complete.length - 1] : null, firstOn = onsite[0] || null, firstDone = complete[0] || null;
 const start = firstOn || firstDone;
 const days = reached && start && last ? daysBetween(dayOf(start.at), dayOf(last.at)) : null;
 const sortedDays = [...byDay.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([day, v]) => ({day, onsite: v.onsite, complete: v.complete}));
 const top = list => [...list.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
 return {id: A.id, name: A.name, group: A.groupName, unit: A.unit, slug: A.id, asOf, total, complete: doneNow, onsite: onNow, units, pct: Math.round(Number(A.pct) || 0), reached,
  reachedAt: reached && last ? last.at : null, reachedKey: reached && last ? last.key : null, reachedBy: reached && last ? last.by : null,
  firstOn, firstDone, last, days, byDay: sortedDays, levelled, steps, numbered, numbersTotal, noNumber, withAcc,
  tickedBy: top(tickedBy), onsiteBy: top(onsiteBy), movedMany: movedMany.sort((a, b) => b.n - a.n || a.key.localeCompare(b.key)), reticked, noHistory, types: top(types)};
}
function allFacts(asOf){ asOf = asOf || todayIso(); return areas(asOf).map(a => facts(a, asOf)).filter(Boolean); }
function reachedAreas(asOf){ return allFacts(asOf).filter(f => f.reached); }

/* -------------------------------------------------------------------------------------------- once per browser */
function seen(){ try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {}; } catch (e) { return {}; } }
function markSeen(disc, at){ try { const s = seen(); s[disc] = at; localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch (e) {} }
function unseen(){ try { localStorage.removeItem(SEEN_KEY); } catch (e) {} }

/* --------------------------------------------------------------------------------------------------- fireworks
   A canvas over the plate, pointer-events none, three bursts in the plate's own accent and the Coates orange, gone
   after about three seconds. With reduced motion asked for, the badge alone. */
function celebrate(el, opts){
 if (!el) return false;
 if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches && !(opts && opts.force)) { el.classList.add('ms1025-glow'); setTimeout(() => el.classList.remove('ms1025-glow'), 2500); return true; }
 const old = el.querySelector('canvas.ms1025-fw'); if (old) old.remove();
 const c = document.createElement('canvas'); c.className = 'ms1025-fw'; el.appendChild(c);
 const rect = el.getBoundingClientRect(), dpr = Math.min(2, W.devicePixelRatio || 1);
 const w = Math.max(60, rect.width), h = Math.max(60, rect.height);
 c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px';
 const ctx = c.getContext('2d'); if (!ctx) { c.remove(); return false; } ctx.scale(dpr, dpr);
 const colours = ['#ff6a13', '#ffd166', '#ffffff', '#06d6a0', '#118ab2', '#ef476f'];
 const parts = [], start = performance.now(), life = 3600;
 const burst = (x, y, n, delay, c1) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 1.8 + Math.random() * 3.4; parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.1, r: 2.2 + Math.random() * 2.6, c: c1 && i % 3 === 0 ? c1 : colours[i % colours.length], born: start + delay, ttl: 1500 + Math.random() * 1100}); } };
 /* the bursts land in the part of the card that is on the screen - a tall card on a phone is mostly below the fold */
 const vTop = Math.max(0, -rect.top), vBot = Math.min(h, (W.innerHeight || h) - rect.top), vh = Math.max(120, vBot - vTop), y0 = vTop;
 burst(w * 0.5, y0 + vh * 0.4, 110, 0, '#ff6a13'); burst(w * 0.22, y0 + vh * 0.3, 80, 400, '#ffd166'); burst(w * 0.78, y0 + vh * 0.32, 80, 750, '#06d6a0'); burst(w * 0.5, y0 + vh * 0.22, 100, 1150, '#ffffff'); burst(w * 0.35, y0 + vh * 0.55, 70, 1600, '#ef476f'); burst(w * 0.65, y0 + vh * 0.5, 70, 1900, '#118ab2');
 el.classList.add('ms1025-glow');
 const tick = now => {
  ctx.clearRect(0, 0, w, h);
  let alive = false;
  parts.forEach(p => { const age = now - p.born; if (age < 0 || age > p.ttl) return; alive = true; const k = age / 16, k0 = Math.max(0, k - 3); const x = p.x + p.vx * k, y = p.y + p.vy * k + 0.012 * k * k, x0 = p.x + p.vx * k0, y0 = p.y + p.vy * k0 + 0.012 * k0 * k0; const al = 1 - age / p.ttl; ctx.globalAlpha = Math.max(0, al) * 0.55; ctx.strokeStyle = p.c; ctx.lineWidth = p.r * 0.9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = Math.max(0, al); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, y, p.r * (0.6 + al * 0.6), 0, Math.PI * 2); ctx.fill(); });
  ctx.globalAlpha = 1;
  if (alive && now - start < life + 1500) requestAnimationFrame(tick); else { c.remove(); el.classList.remove('ms1025-glow'); }
 };
 requestAnimationFrame(tick);
 return true;
}

/* --------------------------------------------------------------------------------------------------- the screen */
function badgeHtml(f){ return `<span class="ms1025-badge" title="every reference in this area is ticked complete${f.reachedAt ? ' — the last tick ' + esc(dmyhm(f.reachedAt)) + ' on ' + esc(f.reachedKey || '') : ''}">100%<small>${f.reachedAt ? esc(dmy(dayOf(f.reachedAt))) : 'complete'}</small></span>`; }
function barsHtml(f){
 if (!f.byDay.length) return '<p class="ms1025-none">No dated on-site or complete events on the record for this area.</p>';
 const max = Math.max(1, ...f.byDay.map(d => Math.max(d.onsite, d.complete)));
 return `<table class="ms1025-days"><thead><tr><th>Day</th><th>On site</th><th></th><th>Complete</th><th></th></tr></thead><tbody>${f.byDay.map(d => `<tr><td>${esc(dmy(d.day))}</td><td class="num">${d.onsite || '—'}</td><td class="bar"><i style="width:${Math.round(d.onsite / max * 100)}%"></i></td><td class="num">${d.complete || '—'}</td><td class="bar"><i class="c" style="width:${Math.round(d.complete / max * 100)}%"></i></td></tr>`).join('')}</tbody>
 <tfoot><tr><td>Total</td><td class="num">${f.byDay.reduce((s, d) => s + d.onsite, 0)}</td><td></td><td class="num">${f.byDay.reduce((s, d) => s + d.complete, 0)}</td><td></td></tr></tfoot></table>`;
}
function factsRows(f){
 const who = list => list.length ? list.map(([n, c]) => `${esc(n)} ${c}`).join(' · ') : '—';
 const ev = e => e ? `${esc(e.key)} · ${esc(dmyhm(e.at))}${e.by ? ' · ' + esc(e.by) : ''}` : '—';
 const rows = [
  ['References', `${f.total} on the job · ${f.onsite} on site · ${f.complete} complete`],
  ['Units (the board\'s count)', `${f.units.done} of ${f.units.total} ${esc(f.unit || '')} done · ${f.units.left || 0} left`],
  ['First on site', ev(f.firstOn)],
  ['First complete', ev(f.firstDone)],
  [f.reached ? 'Last complete — the 100%' : 'Latest complete', ev(f.last)],
  ['Start to finish', f.days != null ? `${f.days} day${f.days === 1 ? '' : 's'} (first on site to the last complete tick)` : (f.reached ? 'no dated start on the record' : `not there yet — ${f.total - f.complete} to go`)],
  ['Levelled / steps', `${f.levelled} of ${f.total} levelled · ${f.steps} of ${f.total} steps`],
  ['Asset numbers', `${f.numbered} of ${f.total} numbered (${f.numbersTotal} number${f.numbersTotal === 1 ? '' : 's'})${f.noNumber.length ? ` · none on ${f.noNumber.map(esc).join(', ')}` : ''}`],
  ['Accessories', `${f.withAcc} of ${f.total} carry accessories`],
  ['Ticked complete by (as recorded)', who(f.tickedBy)],
  ['Set on site by (as recorded)', who(f.onsiteBy)],
  ['Lights that moved more than once', f.movedMany.length ? `${f.movedMany.length}${f.movedMany.slice(0, 4).map(m => ` · ${esc(m.key)} ${m.n} times`).join('')}` : '—'],
  ['Un-ticked and ticked again', f.reticked.length ? f.reticked.map(esc).join(', ') : '—'],
  ['On site with no dated history', f.noHistory.length ? `${f.noHistory.length} (set before the history was kept)` : '—'],
  ['Mix', f.types.length ? f.types.map(([t, n]) => `${n} × ${esc(t)}`).join(', ') : '—'],
 ];
 return rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
}
function areaHtml(f, o){
 return `<details class="ms1025-area${f.reached ? ' reached' : ''}" data-ms1025="${esc(f.slug)}"${o && o.open ? ' open' : ''}>
 <summary><b>${esc(f.name)}</b> <span class="ms1025-pct${f.reached ? ' full' : ''}">${f.pct}%</span> <span class="w">${f.complete} of ${f.total} complete${f.reached && f.reachedAt ? ' · reached ' + esc(dmyhm(f.reachedAt)) : ''}</span></summary>
 <div class="ms1025-body">
 <table class="ms1025-facts"><tbody>${factsRows(f)}</tbody></table>
 ${barsHtml(f)}
 <div class="ms1025-acts"><a class="btn" href="#print/milestone/${esc(f.slug)}">Print this summary (A4)</a>${f.reached ? ` <button type="button" class="btn" data-ms1025-replay="${esc(f.slug)}">Celebrate again</button>` : ''}</div>
 <p class="ms1025-src">Every line is a count or a stamp off this record as at ${esc(fmtDate(f.asOf))}: the delivery lights and their history, the complete ticks and theirs, the asset numbers and accessories on each reference. Nothing here is written by a person.</p>
 </div></details>`;
}
function sectionHtml(asOf){
 const all = allFacts(asOf), reached = all.filter(f => f.reached), rest = all.filter(f => !f.reached && f.total);
 return `<section id="ms1025" class="ms1025">
 <h2>Milestones <span class="w">${reached.length ? reached.length + ' area' + (reached.length === 1 ? '' : 's') + ' at 100%' : 'no area at 100% yet'}</span>${reached.length ? ` <a class="btn sm" href="#print/milestone/all">Print all (A4)</a>` : ''}</h2>
 ${reached.map(f => areaHtml(f, {open: reached.length <= 2})).join('')}
 ${rest.length ? `<div class="ms1025-rest">${rest.map(f => areaHtml(f)).join('')}</div>` : ''}
 </section>`;
}
/* after the Today tab has drawn its Work progress board: badges on the area cards, the section under the board,
   the burst once per browser (only when the board shows today) */
function after(){
 const board = document.getElementById('gc500-work-board840'); if (!board) return;
 const asOf = /^\d{4}-\d{2}-\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso();
 const old = document.getElementById('ms1025'); if (old) old.remove();
 board.insertAdjacentHTML('afterend', sectionHtml(asOf));
 const s = seen(), fire = [], all = allFacts(asOf);
 all.forEach(f => {
  const card = board.querySelector(`.tw840-card[data-tw840-area="${CSS.escape(f.id)}"]`); if (!card) return;
  card.querySelectorAll('.ms1025-badge').forEach(b => b.remove()); card.classList.remove('ms1025-reached');
  if (!f.reached) return;
  const t = card.querySelector('.tw848-toggle-title') || card.querySelector('.tw840-name'); if (t) t.insertAdjacentHTML('beforeend', badgeHtml(f));
  card.classList.add('ms1025-reached');
  if (asOf === todayIso() && s[f.id] !== (f.reachedAt || 'reached')) fire.push({card, f});
 });
 fire.forEach(({card, f}, i) => { markSeen(f.id, f.reachedAt || 'reached'); setTimeout(() => celebrate(card), 250 + i * 400); });
 const sec = document.getElementById('ms1025'); if (!sec) return;
 sec.querySelectorAll('[data-ms1025-replay]').forEach(b => { b.onclick = e => { e.preventDefault(); e.stopPropagation(); const card = board.querySelector(`.tw840-card[data-tw840-area="${CSS.escape(b.dataset.ms1025Replay)}"]`); if (card) { card.scrollIntoView({block: 'center', behavior: 'smooth'}); celebrate(card, {force: true}); } else celebrate(b.closest('.ms1025-area'), {force: true}); }; });
}

/* ------------------------------------------------------------------------------------------------------ print */
const PRINT_CSS = `
.ps7.ms1025p .ms-title{display:flex;align-items:center;gap:4mm;margin:3mm 0 2mm}
.ps7.ms1025p .ms-title .pct{background:#ff6a13;color:#fff;font-weight:800;font-size:9mm;padding:1mm 4mm;border-radius:2mm}
.ps7.ms1025p .ms-title h2{margin:0;font-size:5.2mm;display:block;text-transform:none;letter-spacing:0;line-height:1.2}
.ps7.ms1025p .ms-title h2 small{display:block;font-weight:400;font-size:3.2mm;color:#444;margin-top:1mm;text-decoration:none;border:0}
.ps7.ms1025p table{width:100%;min-width:0!important;border-collapse:collapse;table-layout:fixed;font-size:3.1mm;margin:0 0 3mm}
.ps7.ms1025p table th,.ps7.ms1025p table td{border:0.25mm solid #bbb;padding:1.2mm 2mm;vertical-align:top;text-align:left;word-break:break-word}
.ps7.ms1025p .ms1025-facts th{width:50mm;background:#f3f3f3;font-weight:700;white-space:normal;text-transform:none;letter-spacing:0;font-size:3mm;line-height:1.25}
.ps7.ms1025p .ms1025-days th{background:#f3f3f3;text-transform:none;letter-spacing:0;font-size:3mm}
.ps7.ms1025p .ms1025-days td.num{text-align:right;width:16mm}
.ps7.ms1025p .ms1025-days td.bar{width:40mm}
.ps7.ms1025p .ms1025-days td.bar i{display:block;height:3mm;background:#118ab2;min-width:0}
.ps7.ms1025p .ms1025-days td.bar i.c{background:#ff6a13}
.ps7.ms1025p .ms1025-days tfoot td{font-weight:700;background:#f8f8f8}
.ps7.ms1025p .ms-src{font-size:2.9mm;color:#333;border:0.25mm solid #999;padding:1.5mm 2mm;margin-top:2mm}
.ps7.ms1025p.brk{page-break-before:always;break-before:page}
`;
function sheetHtml(f, o){
 return `<section class="ps ps7 fen ms1025p${o && o.brk ? ' brk' : ''}">
 <header class="psh"><div class="psh-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="psh-m"><span class="kicker">MILESTONE — START TO FINISH · ${esc(FORM)}</span><h1>${esc(f.name)} · ${f.pct}% complete</h1></div>
 <div class="psh-r"><b>GC500 · 2026</b><span>SUPERCARS GOLD COAST 500</span><span>SURFERS PARADISE STREET CIRCUIT</span></div></header>
 <div class="ms-title"><span class="pct">${f.pct}%</span><h2>${esc(f.name)}${f.reached ? ' — every reference ticked complete' : ' — ' + (f.total - f.complete) + ' to go'}<small>${f.reached && f.reachedAt ? 'Reached ' + esc(dmyhm(f.reachedAt)) + ' AEST with ' + esc(f.reachedKey || '') + (f.reachedBy ? ', ticked by ' + esc(f.reachedBy) : '') : 'As at ' + esc(fmtDate(f.asOf))}</small></h2></div>
 <table class="ms1025-facts"><tbody>${factsRows(f)}</tbody></table>
 ${barsHtml(f)}
 <p class="ms-src"><b>Where every figure comes from:</b> this record as at ${esc(fmtDate(f.asOf))} — the delivery lights and their history, the complete ticks and theirs, the asset numbers and accessories on each reference in the area. Counts and stamps only; nothing written by a person. Generated by the page, ${esc(dmyhm(new Date().toISOString()))} AEST.</p>
 </section>`;
}
function print(which, o){
 const asOf = /^\d{4}-\d{2}-\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso();
 const list = which === 'all' ? reachedAreas(asOf) : [facts(which, asOf)].filter(Boolean);
 if (!list.length) { flash(which === 'all' ? 'No area is at 100% yet — nothing to print.' : 'That is not an area on the Work progress board.'); return false; }
 supplierPrint841Dismiss();
 const token = timeline841PrintStart();
 const wrap = document.getElementById('dayprint') || (() => { const e = document.createElement('div'); e.id = 'dayprint'; document.body.appendChild(e); return e; })();
 wrap.classList.add('ps7wrap');
 const st = document.createElement('style'); st.id = 'dayPage';
 st.textContent = '@page{size:A4 portrait;margin:7mm}\n#dayprint.ps7wrap{width:196mm;font:inherit;background:#fff}\n' + PS7_CSS + PRINT_CSS;
 document.head.appendChild(st);
 document.body.classList.add('printing-day');
 const done = () => { st.remove(); if (!timeline841PrintCurrent(token)) return; wrap.classList.remove('ps7wrap'); document.body.classList.remove('printing-day'); };
 if (o && o.keep) DPBAR.done = done; else window.addEventListener('afterprint', done, {once: true});
 wrap.innerHTML = list.map((f, i) => sheetHtml(f, {brk: i > 0})).join('\n');
 wrap.querySelectorAll('.ps7').forEach(sec => {
  const keep = wrap.getAttribute('style'), ruler = document.createElement('div');
  wrap.setAttribute('style', 'display:block;position:absolute;left:-10000px;top:0;visibility:hidden');
  ruler.style.cssText = 'position:absolute;left:-10000px;top:0;height:283mm;width:1px'; document.body.appendChild(ruler);
  const avail = ruler.getBoundingClientRect().height, h = sec.getBoundingClientRect().height; ruler.remove();
  if (keep === null) wrap.removeAttribute('style'); else wrap.setAttribute('style', keep);
  if (h > avail * 0.985) sec.style.zoom = String(Math.max(0.8, Math.floor(avail * 0.985 / h * 1000) / 1000));
 });
 if (o && o.keep) { try { dpBarSay((DP_MAIL.milestone || 'Milestone summary') + ' · ' + (which === 'all' ? list.length + ' page' + (list.length === 1 ? '' : 's') : list[0].name + ' · 1 page'), true); } catch (e) {} if (typeof dpZoomFit === 'function') dpZoomFit(); }
 else (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => window.print());
 return true;
}

W.MS1025 = {FORM, MIN_REFS, areas, area, refsOf, facts, allFacts, reachedAreas, seen, markSeen, unseen, celebrate, after, print, sectionHtml, sheetHtml, dayOf};
W.ms1025After = after;
})();
