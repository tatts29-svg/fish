/* v7.04 - THE DAY'S DOCUMENTS AS A PLATE AT THE TOP OF THE TIMELINE. The project manager, 27 Sep 2026: "can we have
 these more noticeable and up the top somewhere. They need to have their own card feel. Almost like its own importance
 data plate." The four controls v7.00 put in a row under the day strip - Pre-start, Drivers, Install, Email - move to a
 plate of their own directly under the Timeline's heading, above the banner, for the day that is selected. Each is a
 tile that says what it prints and how much: the loads and pages the sheet will hold, read from the same grouping the
 sheet itself uses (dpLoads), so the tile and the paper can never disagree. The row under the strip is hidden while the
 plate is there - one home, no doubling up. Every button carries the data attribute v7.00 wires, so nothing new is
 wired except the day steppers. */
const DP_PLATE_ICO = {
 ps: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 13l2 2 4-4"/></svg>',
 drv: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
 ins: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h18M5 17v-2a7 7 0 0 1 14 0v2M10 8V5h4v3"/></svg>',
 mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
};
function dpPlate(days, sel){
 const L = days || [], i = L.findIndex(x => x.iso === sel), d = L[i];
 if (!d) return '';
 const iso = esc(d.iso), f = fmtDay(d.iso), ps = dpPs(d.iso), today = todayIso();
 let loads = []; try { loads = dpLoads(d); } catch (e) { loads = []; }
 const n = loads.length, s = n === 1 ? '' : 's';
 const prev = i > 0 ? L[i - 1] : null, next = i < L.length - 1 ? L[i + 1] : null;
 let week = ''; try { week = d.sheet ? String(d.sheet).replace('Demob Week', 'Demob') : ((programmeDay(d.iso) || {}).short || ''); } catch (e) { week = ''; }
 const inN = (d.deliveries || []).length, outN = (d.removals || []).length;
 const facts = [week, d.phase, inN + ' due in', outN + ' due out'].filter(Boolean).join(' · ');
 const tile = (attrs, off, ico, word, sub, code) => `<button type="button" class="dpt${off ? ' dp-off' : ''}" ${attrs}${off ? ' aria-disabled="true"' : ''}><span class="dpt-i">${ico}</span><span class="dpt-w">${word}</span><span class="dpt-s">${sub}</span>${code ? `<span class="dpt-c">${code}</span>` : ''}</button>`;
 const psNone = d.iso < today ? 'No pre-start for a day gone by' : 'No pre-start for this day';
 const pre = ps.state === 'ready' ? tile(`data-print-ps7="${iso}" title="The Coates Installs daily pre-start for this day, prefilled from the record - one A4 page"`, false, DP_PLATE_ICO.ps, 'Pre-start', 'Coates Installs daily pre-start · 1 page', 'Print · A4')
  : ps.state === 'later' ? tile(`data-ps7-later="${esc(dpPsLater(ps))}" title="${esc(dpPsLater(ps))}"`, true, DP_PLATE_ICO.ps, 'Pre-start', esc(dpPsLater(ps)), 'Not ready yet')
  : tile(`data-ps7-later="${esc(psNone)}" title="${esc(psNone)}"`, true, DP_PLATE_ICO.ps, 'Pre-start', esc(psNone), '');
 const sheet = who => n ? `${n} load${s} · ${n} page${s} · ${who}` : 'Nothing moves this day';
 const drv = tile(`data-print-drv="${iso}" title="Delivery driver sheet (GC500-DRV-01): one A4 page per load - for the branch to print for the drivers"`, false, DP_PLATE_ICO.drv, 'Drivers', sheet('for the branch'), 'GC500-DRV-01');
 const ins = tile(`data-print-ins="${iso}" title="Install team sheet (GC500-INS-01): one A4 page per load - for the team on site"`, false, DP_PLATE_ICO.ins, 'Install', sheet('for the team on site'), 'GC500-INS-01');
 /* the Email drop-down is v7.00's own, so its menu, its rows and its wiring are exactly the ones already live */
 const btns = dpDayButtons(d), k = btns.indexOf('<details class="dpmail">');
 let mail = k >= 0 ? btns.slice(k) : '';
 const oldSum = /<summary class="btn"[^>]*>Email ▾<\/summary>/;
 if (mail && oldSum.test(mail)) mail = mail.replace('<details class="dpmail">', '<details class="dpmail dpt-mail">').replace(oldSum,
  `<summary class="dpt" aria-haspopup="menu" title="Email a link to one of this day's documents"><span class="dpt-i">${DP_PLATE_ICO.mail}</span><span class="dpt-w">Email ▾</span><span class="dpt-s">A link to one of them, ready to send</span><span class="dpt-c">Pre-start · Drivers · Install</span></summary>`);
 const step = (x, w, ch) => x ? `<button type="button" class="dplate-step" data-dplate-day="${esc(x.iso)}" aria-label="${w}, ${esc(fmtDate(x.iso))}" title="${w} · ${esc(fmtDate(x.iso))}">${ch}</button>` : '';
 return `<section class="dplate" aria-label="This day's documents, ${esc(fmtDate(d.iso))}">
 <div class="dplate-h"><div class="dplate-id"><span class="dplate-k">Day documents · GC500 2026</span>
 <span class="dplate-d">${refPlate(f.dm.toUpperCase(), 24)}<b>${esc(f.dow)}</b>${d.iso === today ? '<em>Today</em>' : ''}</span>
 <span class="dplate-f">${esc(facts)}</span></div>
 <div class="dplate-nav">${step(prev, 'Previous day', '‹')}${step(next, 'Next day', '›')}</div></div>
 <div class="dplate-t" role="group" aria-label="This day's documents">${pre}${drv}${ins}${mail}</div>
 </section>`;
}
/* the plate sits straight under the Timeline's heading - above the page's banner picture, so it is the first thing seen */
function dpHeadWithPlate(days, sel){
 const h = paneHeadingHtml('timeline'), k = h.indexOf('</h2>'), plate = dpPlate(days, sel);
 return k < 0 ? h + plate : h.slice(0, k + 5) + plate + h.slice(k + 5);
}
function dpWirePlate(pane){
 pane.classList.toggle('has-dplate', !!pane.querySelector('.dplate'));
 pane.querySelectorAll('[data-dplate-day]').forEach(b => b.onclick = () => timelineChange(b, () => { state.day = b.dataset.dplateDay; state.tlView = 'day'; }));
}
