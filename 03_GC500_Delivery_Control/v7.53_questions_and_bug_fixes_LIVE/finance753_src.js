/* Author: Andrew Fisher. Financial explanations use the same current records as the figures. */
function labourNote753(asOf){
 const s = fin745Summary(null, asOf), priced = s.rows.length - s.unpricedCount;
 if (!s.rows.length) return 'wages — no usable running-sheet shifts for an actual or forecast cost review';
 const pricedWords = priced ? `${priced} of ${s.rows.length} shifts priced; ${money(s.expectedCost)} ${s.complete ? 'labour outlook' : 'partial labour outlook'}` : 'no shifts priced yet';
 return `wages — ${pricedWords}; ${fmtNum(s.unpricedHours)} paid/allocation hours unpriced. Actuals, forecast & Finance journals separates verified costs, unconfirmed past estimates and future plans. These labour costs are not added to this P&L`;
}
function labourCategory753(person){
 const t = runType(person.type);
 if (t) return t === 'hire' ? 'external' : 'internal';
 if (/coates/i.test(person.employer || '')) return 'internal';
 return String(person.employer || '').trim() ? 'external' : 'unknown';
}
