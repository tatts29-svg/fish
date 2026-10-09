/* Author: Andrew Fisher. Issued-card Revenue for programme types without a docket column.
   Current and future programme weeks only; supplier costs remain unknown. */
const FORECAST_CARD771 = __FORECAST_CARD771__;
function cj771AddProgrammeForecast(row, out, totals){
 const r2 = n => Math.round(n * 100) / 100;
 Object.entries(totals || {}).forEach(([type, rawQty]) => {
  if (typeof rawQty !== 'number' && typeof rawQty !== 'string') return;
  if (typeof rawQty === 'string' && !rawQty.trim()) return;
  const q = Number(rawQty);
  if (!Number.isFinite(q) || q <= 0 || (FCOL || []).some(c => c.programme_type === type)) return;
  const card = FORECAST_CARD771.entries.find(c => c.programme_type === type && c.unit === 'm');
  const rate = card && Number(card.rate);
  const rev = card && Number.isFinite(rate) && rate >= 0 ? q * rate : null;
  if (rev != null && Number.isFinite(rev)) {
   row.revenue += rev;
   row.lines.push({name: type, unit: card.unit, q, rev, cost: null, forecastOnly: true});
  } else {
   out.noCardRate[type] = r2((out.noCardRate[type] || 0) + q);
  }
  out.noCostRate[type] = r2((out.noCostRate[type] || 0) + q);
 });
}
