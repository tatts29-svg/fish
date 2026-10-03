/* Author: Andrew Fisher. v7.53 — questions follow the current record and confirmed commercial rules.
 * Presentation only: no source contract, shared record, note or confirmation is written here. */
function questionHistory753(){
 return QHIST.map(row => {
  const h = row.slice(), ref = h[0] === 'R04' ? 'GN20' : h[0] === 'R05' ? 'GN23' : null;
  if (ref) {
   const d = (S.delivery || {})[ref] || {};
   const historical = h[3].replace(/ - not delivered as at 28 Sep\.$/, '. Delivery had not been recorded at the 28 Sep review.').replace(/ Not delivered yet\.$/, ' Delivery had not been recorded at the 28 Sep review.');
   h[3] = historical + (d.state ? ' Current delivery record: ' + ref + ' is marked ' + d.state + (d.done ? ', with completion recorded' : '') + '.' : ' See the register for the current delivery record.');
  }
  if (h[0] === 'R27') {
   h[3] = 'The schedule has seven towers: five on the Molendinar delivery and one each at LT05 and LT06. D024 has two separate numbering series: six keyed locations and thirteen circuit light-spread positions. The circuit positions are already mapped; this does not establish which hired tower goes to each position. The BOQ says nine. This also covers R15.';
   h[4] = 'Confirm the allocation of our seven scheduled towers to the drawing positions, and whether two more towers are required. The current delivery status stays on the register.';
  }
  return h;
 });
}
function questionsList(){
 const Q = questionsList_751(), fail = name => { Q.fails = (Q.fails || []).concat(name); };
 const done = q => Q.push(Object.assign({st: QH_DONE, need: '', confirmed753: true}, q));
 const rowName = r => `${r.rental_contract}, line ${r.line} · ${r.what || r.description || r.kind}`;
 try {
  const candidates = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && typeof r.rate_1 !== 'number' && !lr748Decided(r));
  const covered = candidates.map(r => ({r, fill: lr748For(r), charge: contractCharge(r)})).filter(x => x.fill && typeof x.charge.amount === 'number');
  Q.filter(q => q.id.startsWith('br-norate-') && q.st !== QH_DONE).forEach(q => {
   const branch = q.id.slice('br-norate-'.length);
   const missing = candidates.filter(r => r.branch_code === branch && typeof contractCharge(r).amount !== 'number');
   q.go = 'costs';
   q.original = q.original || q.q + '. ' + q.why + ' ' + q.need;
   q.q = `${branch}: ${missing.length} contract line${missing.length === 1 ? '' : 's'} still without a rate`;
   q.why = 'These lines have no agreed contract rate and no matching numeric card rate. They remain outside Revenue until a rate is supplied; unknown does not mean free. Card-covered lines are already included as estimates.';
   q.need = 'Enter the agreed rate on Costs → From the Street Rate Card 2026. That rate changes the page’s Revenue estimate; the original Rate 1 on the source contract is retained.';
   q.rows = missing.map(rowName);
  });
  if (covered.length) done({group: 'By branch', id: 'card-covered753',
   q: `${covered.length} contract lines priced from the card or an entered rate`,
   why: 'The instruction to use the Street Rate Card 2026 has been applied. These estimates are already in Revenue; they are not missing-rate lines. Rates can be changed on Costs. A card estimate does not rewrite the source contract or become an agreed branch rate.',
   rows: covered.map(x => rowName(x.r) + ' · ' + (x.fill.from === 'typed' ? 'entered rate' : 'card estimate') + ' · ' + money(x.charge.amount) + ' ex GST'), go: 'costs',
   original: 'NVAC originally had 33 contract lines without rates. The card now covers the supported plant; any line still without a rate remains a separate question.'});
  if (!Q.some(q => q.id === 'br-norate-NVAC') && (candidates.some(r => r.branch_code === 'NVAC') || qAnswer('br-norate-NVAC'))) done({group: 'By branch', id: 'br-norate-NVAC',
   q: 'NVAC — no unpriced contract lines remain',
   why: 'The current charge calculation covers every NVAC contract line. Entered rates and card estimates remain distinguishable from source contract rates. The original missing-rate question and its notes are retained here.',
   original: 'NVAC: hire-contract lines awaiting agreed rates.', go: 'costs'});
 } catch (e) { fail('current contract-rate questions'); }
 done({group: 'By branch', id: 'charge-window753', q: 'Hire charging window — confirmed',
  why: 'Brenden Meek’s branch rule: forklifts, VMS and water barriers are charged from when they go in. Everything else is charged over the event. Card estimates for generators and lighting towers therefore use 23, 24 and 25 October — three event days. Labour is charged per piece of equipment; only labour over the event is charged hourly.', go: 'costs'});
 done({group: 'By branch', id: 'generator-card-rule753', q: 'Generator pricing — requested size, then the next lower card size',
  why: 'Use the size the customer asked for when a larger generator is supplied. If that size has no numeric rate on the card, use the next size down: 70 kVA uses 60 kVA. Confirmed 1 Oct 2026.', go: 'costs'});
 try {
  const r = ONHIRE_ROWS.find(r => String(r.rental_contract) === '9968726' && Number(r.line) === 1 && r.kind === 'forklift');
  if (r) {
   const base = contractCharge_747(r), pc = forkliftWholeHire748(r, base), charged = contractCharge(r);
   if (pc && typeof charged.amount === 'number') done({group: 'By branch', id: 'mead-day-rate753', q: 'MEAD forklift — day-rate basis confirmed',
    why: `Contract 9968726, line 1: Rate 1 ${money(r.rate_1)} is ${money(pc.daily)} a day × ${base.days} days written as one figure. Revenue is ${money(charged.amount)} ex GST; the whole-hire figure is not multiplied by the days again. Confirmed 1 Oct 2026.`, go: 'costs'});
  }
 } catch (e) { fail('MEAD day-rate answer'); }
 try {
  const sv = servicing748();
  if (sv) {
   done({group: 'By branch', id: 'servicing-card753', q: 'Toilet servicing — card estimate applied',
    why: `Quote Q6844’s servicing quantities are charged at the card’s pump-out rates or rates entered on Costs: ${money(sv.total)} ex GST. This is Revenue. The supplier’s amount remains a separate Rehire cost. The card figures remain estimates until agreed rates replace them.`, go: 'costs'});
   if (sv.not_on_the_card.length) Q.push({group: 'By branch', id: 'water-service-rate753', st: QH_OPEN,
    q: 'Water services — customer rates still required',
    why: 'The supplier quote contains these costs, but the card has no customer rate for them. Supplier cost is not the rate charged to the V8s, so no Revenue is assumed.',
    need: 'Confirm what to charge the V8s for each service, or explicitly confirm which service is included in another agreed charge.',
    rows: sv.not_on_the_card.map(l => l.description + ' · supplier cost ' + money(l.their_amount) + ' ex GST'), go: 'costs'});
  }
 } catch (e) { fail('servicing-rate questions'); }
 try {
  const uncertain = allDockets().filter(d => d.usable && /event or demarcation not written/i.test(d.note || '') && ((d.quantities || {}).ccb_demarc || (d.quantities || {}).ccb_event));
  if (uncertain.length) Q.push({group: 'Fencing', id: 'ccb-classification753', st: QH_OPEN,
   q: 'CCB hire agreements — confirm event or demarcation',
   why: 'These signed papers say CCB but do not state event or demarcation. The current classification is provisional and affects the rate and the programme comparison. The recorded metres remain visible.',
   need: 'Confirm the CCB classification for each hire agreement. Do not change the metres or add the same work again.',
   rows: uncertain.map(d => `Hire agreement ${d.docket_no} · ${d.location} · ${fmtNum((d.quantities.ccb_demarc || 0) + (d.quantities.ccb_event || 0))} m · currently ${d.quantities.ccb_demarc ? 'demarcation' : 'event'}`), go: 'fencing'});
 } catch (e) { fail('CCB classification questions'); }
 try {
  const labour = Q.find(q => q.id === 'lb-rates');
  if (labour) {
   const s = fin745Summary(null, todayIso()), priced = s.rows.length - s.unpricedCount;
   labour.original = labour.q + '. ' + labour.why + ' ' + labour.need;
   labour.q = s.unpricedCount ? 'Labour costs — remaining rates and actuals to review' : 'Labour outlook — every current shift has a cost basis';
   labour.why = `${priced} of ${s.rows.length} shifts have a cost basis: ${money(s.expectedCost)} ${s.complete ? 'labour outlook' : 'partial labour outlook'}, with ${fmtNum(s.unpricedHours)} paid/allocation hours still unpriced. This is not all verified actual cost. Actuals, forecast & Finance journals keeps verified costs, unconfirmed past estimates and future plans separate; these labour costs are not added to this P&L.`;
   labour.need = s.unpricedCount ? 'Review the remaining person rates or actual costs in Costs → Actuals, forecast & Finance journals, then verify the actual hours and Finance allocation. Do not infer wages from customer charge rates.' : '';
   labour.rows = [...new Set(s.rows.filter(r => r.actualCost == null && r.calculatedCost == null).map(r => r.person))].map(person => person + ' · cost basis required');
   labour.go = 'costs';
   if (!s.unpricedCount) labour.st = QH_DONE;
  }
 } catch (e) { fail('labour cost-basis question'); }
 Q.forEach(q => {
  if (q.group === 'By branch') q.go = 'costs';
  if (q.id === 'br-norate-KINP' || q.id === 'resolved-kinp747') q.why += ' This is a hire classification only. It does not remove separately recorded install or levelling charges, or mark work as completed.';
  if (q.id === 'sp-nums') {
   q.why = 'Match each unit on site to its asset number; for Rehire, use the supplier’s fleet number. A missing number is a record gap and does not prove a missing delivery.';
   q.need = 'Read the number off each unit and add it: Timeline, the day, Edit, Change, Asset numbers. Record What turned up separately; confirmed quantities drive the short-delivery check.';
  }
 });
 return Q;
}
function answersOverview753Html(Q){
 const answered = Q.filter(q => q.confirmed747 || q.confirmed753).length + 1;
 return `<div class="notice" data-answers753><b>Confirmed answers applied · reviewed 01 Oct 2026</b><p>${answered} answers cover included hire, fencing, 22 VMS boards, the card, the event window and the MEAD day rate. Questions below identify the remaining evidence or rates needed. Card estimates are in Revenue; source entries and recorded notes are retained.</p></div>`;
}
