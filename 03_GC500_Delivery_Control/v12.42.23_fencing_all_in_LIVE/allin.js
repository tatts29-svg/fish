;(function(){ /* v12.42.23: Fencing, everything included - one figure on the Fencing tab (Andrew, 28 Oct 2026: "i want everything included"). Display only: every figure is read live from the page's own functions; nothing is added to the total charge twice. */
 const c2 = n => Math.round((Number(n) || 0) * 100) / 100;
 const m = n => { try { return money(n); } catch (e) { return '$' + c2(n).toFixed(2); } };
 const q = n => { const v = c2(n); return v.toLocaleString('en-AU', {maximumFractionDigits: 2}); };
 function model12423(){
  const fd = fenceDerived(); const types = {}; const inv = {n: 0, ch: 0, pd: 0}, not = {n: 0, ch: 0, pd: 0};
  allDockets().filter(d => d.usable).forEach(d => { const g = d.invoiced1219 ? inv : not; g.n++; g.ch += d.cost_total || 0; g.pd += d.paid_total || 0;
   (d.lines || []).forEach(l => { let k = String(l.name || l.column || ''); if (/under the scrim/.test(k)) k = 'Clean'; const t = types[k] = types[k] || {unit: l.unit, rate: l.rate, inv: 0, not: 0, ch: 0}; t[d.invoiced1219 ? 'inv' : 'not'] += Number(l.qty) || 0; t.ch += Number(l.cost) || 0; }); });
  let scope = 0, scopeH = 0; try { const f = scopeFigures().lines.find(l => l.key === 'fence'); if (f) { scope = f.amount; scopeH = f.hours; } } catch (e) {}
  let crew = 0; try { const R = typeof RaceCrew1227 !== 'undefined' ? RaceCrew1227.model() : null; if (R) crew = c2(R.job + (R.recordedCost || 0)); } catch (e) {}
  const cl = []; [['10000484', 1, 'Scrim rolls (12)'], ['10000484', 2, 'Scrim rolls (10)'], ['10000475', 1, 'Scrim rolls (28)'], ['9997710', 1, '1.8 m fence, 144 m'], ['9997710', 2, 'Shade cloth, 144 m']].forEach(([k, l, w]) => {
   const r = ONHIRE_ROWS.find(x => String(x.rental_contract) === k && String(x.line) === String(l)); let a = 0; try { a = r ? (contractCharge(r).amount || 0) : 0; } catch (e) {} cl.push({w: w + ' · ' + k + '/' + l, a: c2(a)}); });
  const extrasCh = c2(fd.charged - inv.ch - not.ch), extrasPd = c2(fd.cost - inv.pd - not.pd);
  const charge = c2(fd.charged + scope + cl.reduce((s, x) => s + x.a, 0)), cost = c2(fd.cost + crew);
  return {fd, types, inv, not, scope, scopeH, crew, cl, extrasCh, extrasPd, charge, cost};
 }
 function html12423(){
  const M = model12423(); const row = (a, b, c, d, cls) => `<tr${cls ? ` class="${cls}"` : ''}><td>${a}</td><td class="num">${b}</td><td class="num">${c}</td><td class="num">${d}</td></tr>`;
  const tr = Object.entries(M.types).sort((a, b) => b[1].ch - a[1].ch).map(([k, t]) => `<tr><td>${esc(k)}</td><td class="num">${q(t.inv)}</td><td class="num">${q(t.not)}</td><td class="num"><b>${q(t.inv + t.not)}</b> ${esc(t.unit || '')}</td><td class="num">${t.rate != null ? m(t.rate) : ''}</td><td class="num">${m(t.ch)}</td></tr>`).join('');
  return `<div class="card" id="fence-allin12423" style="margin-bottom:12px"><h3 style="margin:0 0 6px">Fencing, everything included</h3>
<p class="w" style="margin:0 0 8px">Charge to the V8s <b>${m(M.charge)}</b> · we pay <b>${m(M.cost)}</b> · margin <b>${m(c2(M.charge - M.cost))}</b>. Every line is already in the job's total charge; this card only brings them together.</p>
<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table class="tbl" style="min-width:520px"><thead><tr><th>What</th><th class="num">Qty</th><th class="num">Charge to V8s</th><th class="num">We pay</th></tr></thead><tbody>
${row(`Dockets on Advanced's invoiced sheets`, M.inv.n, m(M.inv.ch), m(M.inv.pd))}
${row('Dockets not invoiced yet (our dockets at their rate sheet)', M.not.n, m(M.not.ch), m(M.not.pd))}
${row('Labour notes and at-cost items', '', m(M.extrasCh), m(M.extrasPd))}
${row('Fence event labour, race days (event scope)', q(M.scopeH) + ' h', m(M.scope), '—')}
${row('Advanced race crew (forecast)', '', '—', m(M.crew))}
${M.cl.map(x => row(esc(x.w), '', m(x.a), '—')).join('')}
${row('<b>Everything included</b>', '', `<b>${m(M.charge)}</b>`, `<b>${m(M.cost)}</b>`, 'tot')}
</tbody></table></div>
<h4 style="margin:10px 0 4px">Quantities on the dockets</h4>
<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table class="tbl" style="min-width:520px"><thead><tr><th>Type</th><th class="num">Invoiced</th><th class="num">Not invoiced yet</th><th class="num">Total</th><th class="num">Our rate</th><th class="num">Charge</th></tr></thead><tbody>${tr}</tbody></table></div></div>`;
 }
 /* money stays off the operational Fencing tab (crews use it); the card sits on Costs, where the money is */
 const put = () => { try { const p = document.getElementById('pane-costs'); if (p && p.children.length && !document.getElementById('fence-allin12423')) p.insertAdjacentHTML('afterbegin', html12423()); } catch (e) {} };
 const hook = () => { if (typeof renderCosts !== 'function' || renderCosts.allin12423) return; const R0 = renderCosts; renderCosts = function(){ const out = R0.apply(this, arguments); put(); return out; }; renderCosts.allin12423 = true; try { window.renderCosts = renderCosts; } catch (e) {} };
 try { window.FenceAllIn12423 = {model: model12423, put: put}; } catch (e) {}
 if (document.readyState === 'complete') { hook(); put(); } else window.addEventListener('load', () => { hook(); put(); });
})();
