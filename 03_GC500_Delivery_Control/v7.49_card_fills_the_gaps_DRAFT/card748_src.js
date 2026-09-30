/* v7.49 - THE CARD FILLS THE GAPS. Andrew Fisher, 30 Sep 2026, with the Street Rate Card 2026: "Can you not use the
 rate card to fill in the gaps. We can edit the hire rate later on if needed."

 1. The servicing on Event Portables' quote Q6844 is on no contract line, and was "not charged". It is now charged
 at the card's pump-out rates (FWF $72.87, tank $624.60, sewer-connect clean $260.25) on Event Portables' own
 quantities, and says it is on no contract line yet.
 2. Generators, light towers and forklifts with no rate on the contract take the card's daily on-site rate
 (Andrew, 1 Oct 2026: "If a generator price is not there you go for the lower, so 70 kVA becomes the 60 kVA. If
 the client asks for a 60 kVA and we supplied larger, they get the price of a 60 kVA."). The size is what was
 asked for (the reference's own type), else what the line says; a size the card has no line for takes the next
 size down. Forklifts charge by the day from when they go in, as every forklift line does. A generator or a tower
 is charged once, for the three event days only (Brenden Meek, Branch Manager: "Forklifts, VMS and water barriers
 are charged for from when they go in. Everything else is only charged for over the event.") - never for its
 days on site, which is how long it is there, not what the customer pays for.
 3. Every rate can be typed over on the Costs tab; an empty box puts the card's back.
 The seven toilet lines and the building/container lines that had no rate are settled already, by the project
 manager's answers of 1 Oct 2026 (waste tanks included in toilet-block hire; contract 9968929 for Coates' own use)
 - those decisions stand and are never overridden here. The contract's own rule runs first, always: a rate on
 the line, or a decision, wins. Anything typed here wins over the card; an empty box puts the card back. */
const CARD748 = {
 card: 'Street Rate Card 2026',
};
function lr748Key(r){ return 'c|' + r.rental_contract + '|' + r.line; }
function lr748Typed(k){ const v = (S.lineRates || {})[k]; const n = v == null || String(v).trim() === '' ? null : safeNum(v, MAX_RATE); return n == null ? null : n; }
/* the card's own line for a contract line's gear, read through the reference it is matched to - a guide only */
function lr748Card(r){
 const m = r.match || {}, key = m.key || (String(r.description || '').match(/^([A-Z]{1,3}\d+)\b/) || [])[1] || m.task_id;
 const a = key ? assetOf(key) : null; if (!a) return null;
 for (const t of (a.item_types || [])) { const c = cardRate(a.discipline, t, a.key); if (c && c.rate != null && c.line) return {line: c.line, rate: c.rate, kind: c.kind}; }
 return null;
}
/* the card's daily on-site rates, Street Rate Card 2026 (450 and 650 kVA are POA - they take 315) */
const GEN748 = [[12, 102.94], [20, 122.23], [30, 141.53], [40, 158.11], [45, 175.84], [50, 182.28], [60, 193.00], [80, 218.73],
 [100, 225.17], [125, 257.34], [150, 268.06], [200, 364.56], [250, 418.17], [315, 471.78]];
const FORK748 = {std: ['2.5t Forklift (Standard)', 123.31], rough: ['2.5t Forklift (rough)', 185.40], big: ['5.0t Manitou Forklift (Rough Terrain)', 268.06]};
const TOWER748 = ['Lighting Towers', 64.33];
function kva748(s){ const m = String(s || '').match(/(\d+(?:\.\d+)?)\s*kva/i); return m ? +m[1] : null; }
function asset748(r){
 const m = r.match || {}, key = m.key || (String(r.description || '').match(/^([A-Z]{1,3}\d+)\b/) || [])[1] || m.task_id;
 return key ? assetOf(key) : null;
}
/* the card line and daily rate for a generator, tower or forklift line - by what was asked for */
function plant748(r){
 const a = asset748(r), types = a ? (a.item_types || []).join(' ') : '', said = String(r.what || r.description || '');
 if (r.kind === 'generator') {
 const asked = kva748(types), sent = kva748(said), k = asked || sent; if (!k) return null;
 const row = GEN748.filter(g => g[0] <= k).pop(); if (!row) return null;
 const why = [asked && sent && sent > asked ? 'asked for ' + asked + ' kVA, ' + sent + ' kVA supplied: charged as ' + asked + ' kVA' : '',
 row[0] !== k ? 'no ' + k + ' kVA line on the card: the next size down' : ''].filter(Boolean).join('; ');
 return {line: 'Generator ' + row[0] + ' KVA', daily: row[1], why};
 }
 if (r.kind === 'lighting tower') return {line: TOWER748[0], daily: TOWER748[1], why: ''};
 if (r.kind === 'forklift') {
 const src = (types || said).toLowerCase();
 const f = /(^|[^.\d])5(\.0)?\s*t\b/.test(src) ? FORK748.big : /\brt\b|rough/.test(src) ? FORK748.rough : FORK748.std;
 const bigger = /(^|[^.\d])(3(\.0)?|3\.5)\s*t\b/.test(said.toLowerCase());
 return {line: f[0], daily: f[1], why: bigger && f === FORK748.std ? 'no 3 t or 3.5 t line on the card: the 2.5 t standard' : ''};
 }
 return null;
}
/* the days an event-only line is charged for: the race days, both ends billed (the page's own event window) */
function days748(r){
 const ev = eventWindow(); if (!ev) return null;
 const d = Math.max(ev.days, typeof r.minimum_days === 'number' ? r.minimum_days : 0);
 return d > 0 ? {days: d, from: ev.from, to: ev.to} : null;
}
function lr748Decided(r){ return typeof contractTreatment747 === 'function' && !!contractTreatment747(r); }
/* the rate a line with no contract rate is charged at: typed here, else the card, else nothing */
function lr748For(r){
 if (!r || r.charge_line || r.subhired || typeof r.rate_1 === 'number' || lr748Decided(r)) return null;
 const k = lr748Key(r), typed = lr748Typed(k), pc = plant748(r);
 if (typed != null) return {rate: typed, from: 'typed', key: k, by: (S.by || {})['lineRates/' + k] || '', plant: pc};
 if (!pc) return null;
 if (CONTRACT_DAILY_KINDS.has(r.kind)) return {rate: pc.daily, from: 'card', key: k, plant: pc, per: 'day'};
 const d = days748(r); if (!d) return null;
 return {rate: Math.round(pc.daily * d.days * 100) / 100, from: 'card', key: k, plant: pc, days: d, per: 'event'};
}
function contractCharge(r){
 const base = contractCharge_747(r);
 if (typeof base.amount === 'number') return base; /* a rate on the line, or a decision: that stands */
 const f = lr748For(r); if (!f) return base;
 const out = contractCharge_747(Object.assign({}, r, {rate_1: f.rate}));
 out.filled = f.from;
 out.basis = (f.from === 'typed' ? 'no rate on the contract - ' + money(f.rate) + ' typed on the Costs tab' + (f.by ? ' by ' + f.by : '')
 : 'no rate on the contract - the card\'s ' + f.plant.line + ' ' + money(f.plant.daily) + ' a day' + (f.days ? ' x the ' + f.days.days + ' event days' : '') + (f.plant.why ? ' (' + f.plant.why + ')' : '')) + ' · ' + out.basis;
 return out;
}
/* the servicing: Event Portables' quantities, the card's pump-out rates (or a rate typed here) */
function servicing748(){
 const TS = DATA.toilet_servicing; if (!TS || !TS.lines || !TS.lines.length) return null;
 const cents = n => Math.round(n * 100) / 100;
 const lines = TS.lines.map(l => { const k = 'service|' + l.card_line, typed = lr748Typed(k), rate = typed != null ? typed : l.card_rate;
 return Object.assign({}, l, {key: k, rate, from: typed != null ? 'typed' : 'card', amount: cents((l.qty || 0) * rate)}); });
 return {lines, total: cents(lines.reduce((t, l) => t + l.amount, 0)), their_total: TS.their_total, not_on_the_card: TS.not_on_the_card || []};
}
function servicing748Total(){ const s = servicing748(); return s ? s.total : 0; }
/* the card on the Costs tab: the servicing at the card's rates, then every contract line still without a rate */
function card748Html(){
 const ro = capability() !== 'edit';
 const box = (k, v, ph) => ro ? '' : `<input class="rate" data-lr748="${esc(k)}" inputmode="decimal" value="${v != null ? esc(String(v)) : ''}" placeholder="${esc(ph)}" aria-label="Rate">`;
 const per = r => CONTRACT_DAILY_KINDS.has(r.kind) ? ' a day' : ' whole event';
 const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && typeof r.rate_1 !== 'number' && !lr748Decided(r)).map(r => ({r, f: lr748For(r), ch: contractCharge(r)}));
 const filled = open.filter(x => x.f), still = open.filter(x => !x.f);
 const sv = servicing748();
 const from = f => f.from === 'typed' ? 'typed' + (f.by ? ' by ' + esc(f.by) : '') + (f.plant ? `<br><span class="w">card: ${esc(f.plant.line)} ${esc(money(f.plant.daily))} a day</span>` : '')
 : `card: ${esc(f.plant.line)} ${esc(money(f.plant.daily))} a day${f.days ? ` × the ${esc(f.days.days)} event days <span class="w">(${esc(fmtDay(f.days.from).dm)} to ${esc(fmtDay(f.days.to).dm)})</span>` : ' <span class="w">× days from when it goes in</span>'}${f.plant.why ? `<br><span class="w">${esc(f.plant.why)}</span>` : ''}`;
 const tr = x => { const r = x.r, f = x.f;
 return `<tr><td class="mono">${esc(r.rental_contract)} · ${esc(r.line)}</td><td>${esc(r.what || r.description || '')}${r.quantity > 1 ? ' × ' + esc(r.quantity) : ''}</td>
 <td>${f ? from(f) : '<span class="chip cand">no rate yet</span> <span class="w">no line on the card</span>'}</td>
 <td class="num">${f ? esc(money(f.rate)) + '<span class="w">' + esc(per(r)) + '</span>' : '—'} ${box(lr748Key(r), f && f.from === 'typed' ? f.rate : null, f ? String(f.rate) : 'rate' + per(r))}</td>
 <td class="num">${typeof x.ch.amount === 'number' ? '<b>' + esc(money(x.ch.amount)) + '</b>' : '—'}</td></tr>`; };
 const head = '<thead><tr><th>Contract · line</th><th>What</th><th>Rate from</th><th class="num">Rate</th><th class="num">Charge</th></tr></thead>';
 return `<div class="card card748" id="card748"><h3>From the ${esc(CARD748.card)} <span class="w">· what the card fills · change any rate here</span></h3>
 ${sv ? `<h4>Toilet servicing — on no contract line yet</h4>
 <p class="hint">Event Portables' quantities on quote Q6844, charged at the card's pump-out rates. Event Portables charge us ${esc(money0(sv.their_total))} for the same three; that is in the rehire cost. Type a rate to change one; an empty box puts the card's back.${ro ? ' Rates are changed on the editing link.' : ''}</p>
 <div class="tblwrap"><table class="tbl t748"><thead><tr><th>Servicing</th><th class="num">Qty</th><th>Rate from</th><th class="num">Rate</th><th class="num">Charge</th></tr></thead><tbody>
 ${sv.lines.map(l => `<tr><td>${esc(l.description)} <span class="w">(theirs ${esc(money(l.their_rate))})</span></td><td class="num">${esc(fmtNum(l.qty))}</td>
 <td>${l.from === 'card' ? 'card: ' + esc(l.card_line) : 'typed' + ((S.by || {})['lineRates/' + l.key] ? ' by ' + esc(S.by['lineRates/' + l.key]) : '') + ` <span class="w">(card ${esc(money(l.card_rate))})</span>`}</td>
 <td class="num">${esc(money(l.rate))} ${box(l.key, lr748Typed(l.key), String(l.card_rate))}</td><td class="num"><b>${esc(money(l.amount))}</b></td></tr>`).join('')}
 <tr class="tot"><td colspan="4">Servicing charged</td><td class="num"><b>${esc(money(sv.total))}</b></td></tr>
 </tbody></table></div>
 ${sv.not_on_the_card.length ? `<p class="hint">Not charged — no line on the card: ${esc(sv.not_on_the_card.map(l => l.description + ' (theirs ' + money0(l.their_amount) + ')').join(', '))}. Needs a price agreed.</p>` : ''}` : ''}
 ${filled.length ? `<h4>Contract lines with no rate — charged from the card</h4>
 <p class="hint">The card's daily on-site rate for what was asked for; a size the card has no line for takes the next size down (the project manager, 1 Oct 2026). Forklifts charge by the day from when they go in; a generator or tower once, for the three event days only — the branch's rule (Brenden Meek): everything but forklifts, VMS and water barriers is charged over the event. A rate typed here is the line's figure (per day for a forklift, the whole event otherwise).</p>
 <div class="tblwrap"><table class="tbl t748">${head}<tbody>${filled.map(tr).join('')}
 <tr class="tot"><td colspan="4">${filled.length} line${filled.length === 1 ? '' : 's'}</td><td class="num"><b>${esc(money(filled.reduce((s, x) => s + (x.ch.amount || 0), 0)))}</b></td></tr></tbody></table></div>` : ''}
 ${still.length ? `<details class="fold748"><summary>Still no rate: ${still.length} contract line${still.length === 1 ? '' : 's'} — no line on the card; type a rate to charge one</summary>
 <div class="tblwrap"><table class="tbl t748">${head}<tbody>${still.map(tr).join('')}</tbody></table></div></details>` : ''}
 </div>`;
}
/* one listener for every rate box on the card, however often the pane is drawn */
document.addEventListener('change', e => {
 const i = e.target && e.target.closest && e.target.closest('[data-lr748]'); if (!i) return;
 if (!mayWrite('a rate')) { renderCosts(); return; }
 const who = whoAmI(); if (!who) { renderCosts(); return; }
 const v = String(i.value).trim();
 if (v !== '' && safeNum(v, MAX_RATE) == null) { flash('A rate is a number of dollars — nothing changed.'); renderCosts(); return; }
 S.lineRates = S.lineRates || {};
 if (v === '') delete S.lineRates[i.dataset.lr748]; else S.lineRates[i.dataset.lr748] = v;
 stampIt('lineRates', i.dataset.lr748, who); bump(); /* save, then a full draw: every total on every tab re-reads */
});
