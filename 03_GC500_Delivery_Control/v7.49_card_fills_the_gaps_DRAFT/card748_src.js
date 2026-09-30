/* v7.49 - THE CARD FILLS THE GAPS. Andrew Fisher, 30 Sep 2026, with the Street Rate Card 2026: "Can you not use the
 rate card to fill in the gaps. We can edit the hire rate later on if needed."

 1. The servicing on Event Portables' quote Q6844 is on no contract line, and was "not charged". It is now charged
 at the card's pump-out rates (FWF $72.87, tank $624.60, sewer-connect clean $260.25) on Event Portables' own
 quantities, and says it is on no contract line yet.
 2. Every contract line still with no rate gets a box to type one; the card's own daily rate is shown beside it.
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
function lr748Decided(r){ return typeof contractTreatment747 === 'function' && !!contractTreatment747(r); }
/* the rate a line with no contract rate is charged at: typed here, else the card, else nothing */
function lr748For(r){
 if (!r || r.charge_line || r.subhired || typeof r.rate_1 === 'number' || lr748Decided(r)) return null;
 const k = lr748Key(r), typed = lr748Typed(k);
 return typed != null ? {rate: typed, from: 'typed', key: k, by: (S.by || {})['lineRates/' + k] || ''} : null;
}
function contractCharge(r){
 const base = contractCharge_747(r);
 if (typeof base.amount === 'number') return base; /* a rate on the line, or a decision: that stands */
 const f = lr748For(r); if (!f) return base;
 const out = contractCharge_747(Object.assign({}, r, {rate_1: f.rate}));
 out.filled = f.from;
 out.basis = 'no rate on the contract - ' + money(f.rate) + ' typed on the Costs tab' + (f.by ? ' by ' + f.by : '') + ' · ' + out.basis;
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
 const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && typeof r.rate_1 !== 'number' && !lr748Decided(r)).map(r => ({r, f: lr748For(r), ch: contractCharge(r), c: lr748Card(r)}));
 const typed = open.filter(x => x.f), still = open.filter(x => !x.f);
 const sv = servicing748();
 const tr = x => { const r = x.r, f = x.f, c = x.c;
 return `<tr><td class="mono">${esc(r.rental_contract)} · ${esc(r.line)}</td><td>${esc(r.what || r.description || '')}${r.quantity > 1 ? ' × ' + esc(r.quantity) : ''}</td>
 <td>${f ? 'typed' + (f.by ? ' by ' + esc(f.by) : '') : '<span class="chip cand">no rate yet</span>'}${c ? `<br><span class="w">card: ${esc(c.line)} ${esc(money(c.rate))}${c.kind === 'daily' ? ' a day on site' : ''}</span>` : ''}</td>
 <td class="num">${f ? esc(money(f.rate)) + '<span class="w">' + esc(per(r)) + '</span>' : '—'} ${box(lr748Key(r), f ? f.rate : null, 'rate' + per(r))}</td>
 <td class="num">${typeof x.ch.amount === 'number' ? '<b>' + esc(money(x.ch.amount)) + '</b>' : '—'}</td></tr>`; };
 const head = '<thead><tr><th>Contract · line</th><th>What</th><th>Rate from</th><th class="num">Rate</th><th class="num">Charge</th></tr></thead>';
 return `<div class="card card748" id="card748"><h3>From the ${esc(CARD748.card)} <span class="w">· the servicing, and the lines with no rate · change any rate here</span></h3>
 ${sv ? `<h4>Toilet servicing — on no contract line yet</h4>
 <p class="hint">Event Portables' quantities on quote Q6844, charged at the card's pump-out rates. Event Portables charge us ${esc(money0(sv.their_total))} for the same three; that is in the rehire cost. Type a rate to change one; an empty box puts the card's back.${ro ? ' Rates are changed on the editing link.' : ''}</p>
 <div class="tblwrap"><table class="tbl t748"><thead><tr><th>Servicing</th><th class="num">Qty</th><th>Rate from</th><th class="num">Rate</th><th class="num">Charge</th></tr></thead><tbody>
 ${sv.lines.map(l => `<tr><td>${esc(l.description)} <span class="w">(theirs ${esc(money(l.their_rate))})</span></td><td class="num">${esc(fmtNum(l.qty))}</td>
 <td>${l.from === 'card' ? 'card: ' + esc(l.card_line) : 'typed' + ((S.by || {})['lineRates/' + l.key] ? ' by ' + esc(S.by['lineRates/' + l.key]) : '') + ` <span class="w">(card ${esc(money(l.card_rate))})</span>`}</td>
 <td class="num">${esc(money(l.rate))} ${box(l.key, lr748Typed(l.key), String(l.card_rate))}</td><td class="num"><b>${esc(money(l.amount))}</b></td></tr>`).join('')}
 <tr class="tot"><td colspan="4">Servicing charged</td><td class="num"><b>${esc(money(sv.total))}</b></td></tr>
 </tbody></table></div>
 ${sv.not_on_the_card.length ? `<p class="hint">Not charged — no line on the card: ${esc(sv.not_on_the_card.map(l => l.description + ' (theirs ' + money0(l.their_amount) + ')').join(', '))}. Needs a price agreed.</p>` : ''}` : ''}
 ${typed.length ? `<h4>Contract lines charged at a rate typed here</h4><div class="tblwrap"><table class="tbl t748">${head}<tbody>${typed.map(tr).join('')}
 <tr class="tot"><td colspan="4">${typed.length} line${typed.length === 1 ? '' : 's'}</td><td class="num"><b>${esc(money(typed.reduce((s, x) => s + (x.ch.amount || 0), 0)))}</b></td></tr></tbody></table></div>` : ''}
 ${still.length ? `<details class="fold748"><summary>Still no rate: ${still.length} contract line${still.length === 1 ? '' : 's'} — type a rate to charge one; the card's daily rate is shown as a guide</summary>
 <p class="hint">The card prices generators, light towers and forklifts by the day on site. Forklifts are charged by the day from when they go in; the rest once for the whole event — so a rate typed for a generator is its whole-event figure.</p>
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
