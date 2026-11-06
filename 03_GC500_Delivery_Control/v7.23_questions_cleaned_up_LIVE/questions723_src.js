/* v7.23 - QUESTIONS, CLEANED UP. The project manager, 28 Sep 2026: "revisit all questions ... see if you can close off some
 of these yourself. They must be easy to understand so whoever looks at them understands why and what info we need",
 and the Questions review handed over the same morning (49 open, reviewed against record version 2038).

 What changed, and why:
 - A typed note no longer closes a question. It is kept with the name and the Brisbane time, and the question stays
   until the record itself settles it (a rate typed, a docket in, a date confirmed). "Waiting on quote" is not an answer.
 - The 34 questions imported with the workbook (R01-R29, TX01-TX05) were read against today's record. Where the record
   already answers one, the answer is shown and the question moves to Answered; where two asked the same thing they
   are merged; where one was a rule or a note on an old file it moves to History. Each keeps its original wording.
 - Every question left says, in plain words: what it is, why it matters, and exactly what we need.
 - Four fencing "catch up" questions become one, measured to the end of yesterday (today's work is not late at 04:00),
   and worded as a gap in the record - not proof the work is behind.
 - Pay rates move to "Later": the labour workbook is hours only, so wages are not in the costs. Accommodation counts
   each unpriced night, so pricing one night no longer hides the rest.
 - A check that fails to run says so, instead of quietly dropping its questions. */
const QH_OPEN = 'open', QH_LATER = 'later', QH_DONE = 'done';
/* the imported questions, one line each: [id, status, plain title, what we know now, what we still need (or ''), where] */
const QHIST = [
 ['R01', QH_DONE, 'WC05 - how many?', 'WC05 is one toilet block (asset 1097377) and one waste tank (asset 1328978). Hire contract 9968955 lines 1 and 3 say the same.', '', 'plant'],
 ['R02', QH_DONE, 'P09 - how many?', 'P09 is one 6 m building, asset 1268824 (contract 9968862 line 28), delivered 16 Sep. The 1097377 in the workbook’s quantity cell was an asset number typed in the wrong box. The carrier list (TX04) agrees.', '', 'plant'],
 ['R03', QH_DONE, 'Seven buildings with no quantity', 'One building each: P13 1097346, P14 960599, P15 1097345, P16 415575, P41 1189412, P44 198481, P58 1273656 - all on the register and hire contracts. The rule from 28 Sep: a building with no quantity is one.', '', 'plant'],
 ['R04', QH_DONE, 'GN20 generator change', 'The old 200 kVA row was cancelled on 15 Sep. GN20 now asks for 350 kVA and has 365 kVA asset 1276701 (contract 9961976 line 6), due 30 Sep - not delivered as at 28 Sep.', '', 'plant'],
 ['R05', QH_DONE, 'GN23 size', 'GN23 asks for 150 kVA and has 150 kVA asset 1297157 (contract 9961976 line 9), due 30 Sep. The old "1277449 - 250 kVA" note is out of date. Not delivered yet.', '', 'plant'],
 ['R06', QH_OPEN, 'Which BOQ do we work to?', 'Both BOQs are in (the customer’s and ours) and Pricing compares them line by line. This also covers R18.', 'Tell us which BOQ, and which revision, is the one we build and charge to. Then the summaries are rebuilt from it.', 'pricing'],
 ['R07', QH_DONE, '2026 schedule on 2025 drawings', 'Out of date: the 2026 drawings (project 26003, Rev 02) arrived on 7 Sep. What is left is under R23.', '', 'about'],
 ['R08', QH_DONE, 'Fencing programme', 'The 2026 fencing programme arrived on 11 Sep for the build and the event. Only the removal dates are still missing - that is R28.', '', 'fencing'],
 ['R09', QH_LATER, 'Getting everything back after the race', 'Planned pick-up dates are in for most items (for example P09 and WC21 on 13 Nov, GN20 and the light towers on 26 Oct, VMS on 13 Nov). A planned date is not a pick-up. This also covers R17.', 'Nothing yet. As each item goes back we need its return docket, so the last few with no pick-up booked stand out.', 'plant'],
 ['R10', QH_LATER, 'Office and lunchroom - pick-up date', 'Size answered: the internal office (960639) and lunchroom (960634) are both 4.8 × 3 m, contract 9968929 lines 1 and 3. The demob sheet’s "6 m" is wrong.', 'One date: the demob sheet says pick-up 12 Nov, the hire contract says 13 Nov. Which is right?', 'plant'],
 ['R11', QH_OPEN, 'Concert generators - which GN and where?', 'Two synced 200 kVA units, brand new, assets 1316182 and 1316183, planned for 12 Oct. The schedule calls them "GN?".', 'Their GN number and where they go on the drawing. We won’t make up a number.', 'plant'],
 ['R12', QH_DONE, 'Things on the drawings that aren’t ours', 'A rule, not a question: something drawn on a map is not automatically Coates scope. Other suppliers’ buildings and gensets stay marked as theirs.', '', 'about'],
 ['R13', QH_DONE, 'Progress from preparation notes', 'Out of date: deliveries, levelling and steps are now recorded on site, with a name and a time on each.', '', 'today'],
 ['R14', QH_DONE, 'Map numbers vs schedule numbers', 'A rule, not a question: a map number and a schedule number are only linked once checked. The live links are handled under R23.', '', 'map'],
 ['R15', QH_DONE, 'Light towers - 7 or 9?', 'Merged into R27.', '', 'plant'],
 ['R16', QH_OPEN, 'VMS boards - 22 or 23?', 'We are hiring 22 VMS boards (8 delivered and 14 to come, as at 28 Sep). The 5 relocations are moves of boards already there, not extra hires.', 'The BOQ says 23. Is a 23rd board needed, or should the BOQ change to 22?', 'plant'],
 ['R17', QH_DONE, 'VMS and light tower pick-ups', 'Merged into R09: pick-up dates are now planned (towers 26 Oct, VMS 13 Nov).', '', 'plant'],
 ['R18', QH_DONE, 'The customer’s BOQ file', 'Out of date: the customer’s BOQ is now in and compared on Pricing. What is left is under R06.', '', 'pricing'],
 ['R19', QH_DONE, 'Reading the workbook headings', 'A note for the build, not a question for anyone on site.', '', 'about'],
 ['R20', QH_DONE, '30 schedule rows on 19 Oct', 'Guidance, not a question: 30 rows on a day is not 30 trucks. A real gap on a real day would be asked on its own.', '', 'timeline'],
 ['R21', QH_DONE, 'Old fencing files from 2019 and 2021', 'Background only. Kept for reference.', '', 'fencing'],
 ['R22', QH_DONE, '"The app doesn’t hold the evidence"', 'Out of date: the record now holds the fencing dockets, service notes, collection forms, area sign-offs and GPS fixes. Anything specific still missing is asked on its own.', '', 'fencing'],
 ['R23', QH_OPEN, 'Are the 2026 drawings the current issue?', 'We hold the 2026 drawings (project 26003, Rev 02, received 7 Sep). No need to send them again. This also covers R07, R14 and R25.', 'A yes from the customer (iEDM) that these are the current issue for the works - an email is enough.', 'about'],
 ['R24', QH_DONE, 'Old fencing programme file', 'Background only: that file is 2025/2023 content. The 2026 programme is in; removal dates are R28.', '', 'fencing'],
 ['R25', QH_DONE, 'Map links re-checked on the 2026 drawings', 'Merged into R23.', '', 'map'],
 ['R26', QH_OPEN, 'Generator "028" on drawing D024', 'The GN22 part is answered: GN22 was replaced by GN20 (see R04).', 'D024 shows a generator "028" that has no row on our schedule. Is 028 ours to supply, or someone else’s?', 'plant'],
 ['R27', QH_OPEN, 'Light towers - which spots, and 7 or 9?', 'We have 7 on the schedule: 5 delivered to Molendinar on 11 Sep, and LT05/06 still to come as at 28 Sep. The drawing shows 19 numbered spots across two number series. The BOQ says 9. This also covers R15.', 'Which drawing spots do our 7 towers go to, and is the BOQ’s 9 still right?', 'plant'],
 ['R28', QH_LATER, 'Fencing removal dates', 'The build and event dates are 2026. The removal weeks in the programme still carry 2025 dates (a few say 2027 and 2028) and last year’s "Complete" marks.', 'The 2026 removal dates, from Advanced or iEDM, before the pull-down starts.', 'fencing'],
 ['R29', QH_OPEN, 'Fencing plan changes on 11 Sep', 'On dockets now: PB03 20 m (36508); Cypress Carpark 97.5 m (36505), later upgraded to scrim (36539); S05 back of house 35 m (36518).', 'The S04 compound: the plan added 41 m and 1 gate; docket 36546 shows a 22.5 m extension. Is the rest still coming, or was it dropped?', 'fencing'],
 ['TX01', QH_DONE, 'Loads arriving before 07:00', 'That week (14-17 Sep) is done. The site-hours rule (07:00-17:00 unless iEDM approves) still applies to future bookings.', '', 'timeline'],
 ['TX02', QH_DONE, 'Carrier’s four-early-loads limit', 'That week is done. The limit still applies to future bookings.', '', 'timeline'],
 ['TX03', QH_OPEN, 'Two buildings linked to two loads each', 'All 22 loads are linked to their buildings. P20 is on two loads (16 Sep, loads 10 and 14) and P21 is on two (16 Sep, loads 12 and 16). This also covers TX05.', 'Did P20 and P21 each really go twice, or is one link on each wrong?', 'timeline'],
 ['TX04', QH_DONE, 'Carrier list vs P09 quantity', 'Merged into R02 (answered).', '', 'plant'],
 ['TX05', QH_DONE, 'More buildings than loads on 16-17 Sep', 'Merged into TX03: once the P20/P21 links are settled, any building with no truck will show.', '', 'timeline'],
];
function qYesterday(td){ const d = new Date(td + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
function qWhen(id){ const t = (S.stamps || {})['answers/' + id]; if (!t) return ''; try { return new Date(t).toLocaleString('en-AU', {timeZone: 'Australia/Brisbane', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false}); } catch (e) { return ''; } }
function questionsList(){
 const td = todayIso(), Q = [], fails = [];
 /* q: the question; why: why it matters; need: what we need; rows: the detail; st: open / later */
 const add = (group, id, q, why, need, go, extra) => Q.push(Object.assign({group, id, q, why, need, go, st: QH_OPEN}, extra || {}));
 const chk = (name, fn) => { try { fn(); } catch (e) { fails.push(name); } };
 let M = null; chk('costs', () => { M = moneySummary(td); });
 /* by branch */
 chk('branch rates', () => { const R = branchRollup(td);
  R.branches.forEach(g => { const c = g.contract || {}, code = g.code || 'no branch';
   if (c.unknown) add('By branch', 'br-norate-' + code, `${code}: ${c.unknown} hire-contract line${c.unknown === 1 ? '' : 's'} with no rate`,
    `Lines with no rate are left out of the charges - they are unknown, not free.${(c.unknown_kinds || []).length ? ' They are: ' + c.unknown_kinds.map(([k, n]) => n + ' ' + k + (n === 1 ? '' : 's')).join(', ') + '.' : ''} A price typed on Pricing is a card price; it does not fix a contract rate.`,
    `The agreed rate for each line, from the ${code} hire contract.`, 'pricing'); });
  if (R.none && R.none.lines && R.none.lines.length) add('By branch', 'br-none', `${R.none.lines.length} schedule line${R.none.lines.length === 1 ? ' has' : 's have'} no branch`, 'A line with no branch carries no branch revenue or cost.', 'Which branch carries each one.', 'plant');
 });
 /* fencing */
 chk('fencing quote', () => { if (!fenceQuote()) add('Fencing', 'fe-quote', 'Advanced’s accepted fencing quote', 'Without the quote we can’t say whether any fencing is over or under. The programme, BOQ and order numbers don’t show what was quoted.', 'The accepted quote (number and date) - or confirm we are paying on measured dockets instead.', 'fencing'); });
 chk('fencing rates', () => { (typeof FCOL !== 'undefined' ? FCOL : []).filter(c => c.card_state !== 'matched' && !c.settled_by && fenceRateFor(c.key).value == null).forEach(c => {
  const nm = c.name_as_written, later = c.key === 'team_leader';
  const why = c.key === 'v_gates' ? 'Three vehicle gates are on dockets. Advanced charges us $50 each, but we have no price to charge the customer - and our cost or the pedestrian-gate price is not the answer.'
   : c.key === 'removal' ? 'Service note 24455 already records 32.5 m stacked down with 0.75 h of Advanced’s labour. Labour must not be charged twice.'
   : later ? 'Nothing is booked against it yet, so it isn’t costing us today. Advanced’s $200 is their price to us, not ours to the customer.'
   : (c.card_why || 'The 2026 rate card has no line for it.') + ' A docket with it is not priced until a rate is in.';
  const need = c.key === 'removal' ? 'Is fence removal included in the price, or charged on its own? If on its own: the rate and unit, ex GST.' : `What we charge the customer for "${nm}", per unit, ex GST.`;
  add('Fencing', 'fe-rate-' + c.key, `No customer rate for "${nm}"`, why, need, 'fencing', later ? {st: QH_LATER} : null); }); });
 chk('fencing record', () => { const y = qYesterday(td), ft = fenceTypes(progressAsOf(y)), G = rsFenceGaps(ft);
  if (!G.length) return; const ccbE = ft.find(t => /ccb/i.test(t.name) && /event/i.test(t.name));
  add('Fencing', 'fe-gap', `Fencing on the record vs the plan - ${G.length} line${G.length === 1 ? '' : 's'} short`,
   `Measured to the end of ${fmtDate(y)}, so today’s work isn’t counted as late. A gap in the record is not proof the work is behind: dockets may be missing, work may be booked under another type${ccbE && ccbE.done ? ` (${fmtNum(ccbE.done)} m is booked as event CCB and none as demarcation - some dockets leave that split to us)` : ''}, or the plan may have changed. Brace counts and wheels don’t tell us metres or gates.`,
   'For each line below: done but not docketed, booked under another type, dropped from the plan, or still to do?', 'fencing',
   {rows: G.map(g => `${rsGapName(g)}: ${fmtNum(g.done)} of ${fmtNum(g.planned)}${g.unit === 'm' ? ' m' : ''} on the record`)}); });
 add('Fencing', 'fe-closure', 'Fencing closure plan - what the marks mean', 'The 2026 order and times were given on 19 Sep, drawn over the 2019 printed base (project 19003 rev 13). The printed gates and lines underneath are 2019’s.',
  'Three things: what each colour group means; whether marks with the same order number act together; and whether a time means "closed at" or "clear by".', 'fencing');
 /* transport */
 chk('transport', () => { if (M) M.missing.filter(s => /transport/i.test(s)).forEach(s => add('Transport', 'tr-miss-' + qSlug(s), 'Transport costs we don’t have yet',
  s.charAt(0).toUpperCase() + s.slice(1) + ' "Internal" loads have no carrier bill, but that doesn’t make them free.', 'The final carrier invoices for the loads still marked "+" or with no figure.', 'costs')); });
 chk('transport lines', () => { const O = ourCosts().filter(c => c.kind === 'transport' && c.usable && c.amount == null); if (O.length) add('Transport', 'tr-await', `${O.length} of our transport line${O.length === 1 ? ' is' : 's are'} waiting for a cost`, 'Our cost, not a charge to the customer.', 'What each one cost.', 'costs'); });
 /* labour */
 chk('labour', () => { const T = runTotals(); const nr = T.rows.filter(x => x.rate == null && x.hours);
  if (nr.length) add('Labour', 'lb-rates', 'Wages are not in the costs', 'The labour workbook is hours only - it says "hours, not payroll". So no wage is put on anyone, and the costs say they exclude labour. Nobody’s pay is guessed from what we charge.', `Only if you want wages in: an hourly pay rate for ${nr.map(x => x.name).join(', ')}.`, 'runsheet', {st: QH_LATER});
  const acc = {}; ourCosts().filter(c => c.kind === 'accommodation' && c.usable && c.person && c.amount == null).forEach(c => { const a = acc[c.person] = acc[c.person] || {n: 0, past: 0}; a.n++; if (c.date < td) a.past++; });
  Object.entries(acc).forEach(([who, a]) => add('Labour', 'lb-nights-' + ourSlug(who), `${who}: ${a.n} night${a.n === 1 ? '' : 's'} with no accommodation rate`, `${a.past} already stayed, ${a.n - a.past} still to come. Another person’s nightly rate is never copied across.`, `${who.split(' ')[0]}’s nightly rate, ex GST.`, 'runsheet')); });
 chk('labour quantities', () => { const LP = labourPlan(); if (LP.all.unpriced) add('Labour', 'lb-noqty', `${LP.all.unpriced} labour lines with no quantity`, 'They sit on references with no readable quantity, so no labour figure can go on them.', 'How many units each one is.', 'pricing'); });
 chk('event staff', () => { if (M) M.missing.filter(s => /event staff|not on the tracker/i.test(s)).forEach(s => add('Labour', 'lb-miss-' + qSlug(s), 'Event staff not on the tracker', s.charAt(0).toUpperCase() + s.slice(1) + ' Fence-team labour already on Advanced’s invoices or the green book must not be added again.', 'Who covers each event shift that has no name against it, and where their cost comes from.', 'costs')); });
 /* schedule and plant */
 chk('schedule quantities', () => { const X = dsnState(td); const nq = X.rows.filter(r => r.noQty && !r.reloc && !/building/i.test(r.a.product || '')).map(r => r.a.key); if (nq.length) add('Schedule & plant', 'sp-noqty', `${nq.length} reference${nq.length === 1 ? '' : 's'} with no quantity`, `${nq.slice(0, 8).join(', ')}${nq.length > 8 ? ', …' : ''}. Each is counted as one until confirmed. (Buildings with no quantity are one - settled 28 Sep.)`, 'How many units each one is.', 'plant'); });
 QHIST.forEach(([id, st, title, known, need, go]) => { if (st !== QH_DONE) add('Schedule & plant', 'oi-' + id, `${id} - ${title}`, known, need, go, {st, hist: id}); });
 Q.fails = fails;
 return Q;
}
function renderQuestions_held(){
 const Q = questionsList(), ed = canEdit(), fails = Q.fails || [];
 const groups = ['By branch', 'Fencing', 'Transport', 'Labour', 'Schedule & plant'];
 const now = Q.filter(q => q.st === QH_OPEN), later = Q.filter(q => q.st === QH_LATER), oi = {}; (DATA.open_items || []).forEach(o => oi[o.id] = o);
 const done = QHIST.filter(h => h[1] === QH_DONE);
 const note = q => { const a = qAnswer(q.id), who = a ? (stampBy('answers', q.id) || 'unnamed') : '', when = a ? qWhen(q.id) : '';
  return (ed ? `<label class="qans"><span class="vh">Note</span><input data-qa="${esc(q.id)}" value="${esc(a)}" placeholder="Add a note - it keeps your name and time"></label>` : a ? `<span class="qansv">Note: ${esc(a)}</span>` : '')
   + (a ? `<span class="edby">${esc(who)}${when ? ' · ' + esc(when) : ''}</span>` : ''); };
 const orig = q => q.hist && oi[q.hist] ? `<details class="qorig"><summary>Original wording</summary><p>${esc(oi[q.hist].title)}. ${esc(oi[q.hist].finding || '')}</p></details>` : '';
 const item = q => `<li><b>${esc(q.q)}</b>
  <span class="qwhy"><em>Why it matters:</em> ${esc(q.why)}</span>
  ${q.rows ? `<ul class="qrows">${q.rows.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
  ${q.need ? `<span class="qneed"><em>What we need:</em> ${esc(q.need)}</span>` : ''}
  <span class="qact"><button type="button" class="linkish" data-qgo="${esc(q.go)}">Open where it lives →</button></span>${orig(q)}${note(q)}</li>`;
 const list = L => groups.map(g => { const G = L.filter(q => q.group === g); if (!G.length) return '';
  return `<div class="qgroup" id="qg-${esc(ourSlug(g))}"><h4>${esc(g)} <span class="chip ref">${G.length}</span></h4><ol class="qlist">${G.map(item).join('')}</ol></div>`; }).join('');
 $('#pane-questions').innerHTML = paneHeadingHtml('questions') + `
 <div class="card"><div class="hubtitle"><h3>Questions</h3><span class="chip ${now.length ? 'act' : 'ok'}">${now.length} need an answer</span> <span class="chip ref">${later.length} later</span> <span class="chip ok">${done.length} answered or history</span></div>
 <p class="sub">Each one says what it is, why it matters and exactly what we need. A question goes away when the answer lands in the record - a rate typed, a docket in, a date confirmed. A note typed here is kept with your name and time, but it doesn’t close the question.</p>
 ${fails.length ? `<p class="qfail">Some checks didn’t run (${esc(fails.join(', '))}), so this list may be short. Reload the page; if it stays, the record needs a look.</p>` : ''}
 <div class="qjump">${groups.map(g => { const n = now.filter(q => q.group === g).length; return n ? `<a class="chip ref" href="#questions" data-qg="${esc(g)}">${esc(g)} · ${n}</a>` : ''; }).join(' ')}</div></div>
 <div class="card qcard"><h3>Needs an answer <span class="chip act">${now.length}</span></h3>${list(now) || '<p class="sub">Nothing needs an answer right now.</p>'}</div>
 ${later.length ? `<details class="card qcard qfold"><summary><h3>Later - not needed yet <span class="chip ref">${later.length}</span></h3></summary>${list(later)}</details>` : ''}
 <details class="card qcard qfold"><summary><h3>Answered or history <span class="chip ok">${done.length}</span></h3></summary>
 <p class="sub">The imported questions the record now answers, or that were rules and old-file notes rather than questions. Nothing is thrown away - the original wording is under each one.</p>
 <ol class="qlist qdone">${done.map(([id, , title, known]) => `<li><b>${esc(id)} - ${esc(title)}</b><span class="qwhy">${esc(known)}</span>${oi[id] ? `<details class="qorig"><summary>Original wording</summary><p>${esc(oi[id].title)}. ${esc(oi[id].finding || '')}</p></details>` : ''}</li>`).join('')}</ol></details>`;
 const pane = $('#pane-questions');
 pane.querySelectorAll('[data-qgo]').forEach(b => b.onclick = () => go(b.dataset.qgo));
 pane.querySelectorAll('[data-qa]').forEach(i => i.onchange = () => setQAnswer(i.dataset.qa, i.value));
 pane.querySelectorAll('[data-qg]').forEach(a => a.onclick = e => { e.preventDefault(); const el = document.getElementById('qg-' + ourSlug(a.dataset.qg)); if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'}); });
}
