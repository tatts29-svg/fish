/* v11.53 - questions-close-off-1153. Author: Andrew Fisher.
   Two things, both from the project manager's notes of 15 Oct 2026 and the work since.
   1. Contract 9961976 (NVAC): "line 41 distribution board and line 47 cable are supplied with the generators and are
      inside the card rate (the card prices 200 kVA with cables); line 45 is a spare 60 kVA, Pending, no charge unless
      called off; line 37 tyne rotator, Pending, no charge unless delivered. Nothing to enter." Each is a charge treatment
      on the line, the way the toilet-block tanks and Coates' own use are: no customer hire charge, the line kept as
      written. The two Pending lines keep their treatment only while the contract still writes them Pending.
   2. The questions those notes settle move to Answered or history with the decision as their answer; the note, name and
      time stay with them. Labour cost basis goes to Pending / later while every unpriced person is Coates staff whose
      cost rate is a payroll figure finance supplies. */
(function(W){
 const NVAC = new Map([
  ['9961976|41', {kind: 'in_card_rate', label: 'Inside the generator card rate', basis: 'Distribution board supplied with the generators — the card prices 200 kVA with its cables and board; no separate customer hire charge (the project manager, 15 Oct 2026)'}],
  ['9961976|47', {kind: 'in_card_rate', label: 'Inside the generator card rate', basis: 'Cable supplied with the generators — the card prices 200 kVA with cables; no separate customer hire charge (the project manager, 15 Oct 2026)'}],
  ['9961976|45', {kind: 'pending_no_charge', label: 'Pending — no charge unless called off', basis: 'Spare 60 kVA generator, Pending on the contract; no charge unless it is called off (the project manager, 15 Oct 2026)', pending: true}],
  ['9961976|37', {kind: 'pending_no_charge', label: 'Pending — no charge unless delivered', basis: 'Forklift tyne rotator, Pending on the contract; no charge unless it is delivered (the project manager, 15 Oct 2026)', pending: true}]]);
 const SETTLED = ['fe-quote', 'fe-closure', 'fe-gap', 'fe-rate-team_leader', 'oi-R30', 'oi-R10', 'oi-R26', 'oi-R29', 'oi-TX03'];
 W.Questions1153 = Object.freeze({nvac: Object.freeze([...NVAC.keys()]), settled: Object.freeze(SETTLED.slice()), reviewed: '2026-10-23'});
 const before = W.contractTreatment747;
 const g = function(row){
  const t = before.apply(this, arguments); if (t) return t;
  if (!row || row.branch_code !== 'NVAC' || row.rate_1 !== null || row.charge_line || row.subhired) return null;
  const d = NVAC.get(String(row.rental_contract) + '|' + row.line); if (!d) return null;
  if (d.pending && !/pending/i.test(String(row.status_as_written || ''))) return null;
  return {kind: d.kind, label: d.label, ref: null, approved_by: 'the project manager', approved_on: '2026-10-15', basis: d.basis, nvac1153: true};
 };
 g.charge1153 = true; W.contractTreatment747 = g; try { contractTreatment747 = g; } catch (x) {}
 /* the settled questions: after every other decorator has had its say */
 const settle1153 = (Q, id, title, why) => { const q = Q.find(x => x.id === id); if (!q || q.st === QH_DONE) return; q.original = q.original || (q.q + '. ' + q.why + ' ' + (q.need || '')); q.q = title; q.why = why; q.need = ''; q.st = QH_DONE; q.confirmed1153 = true; };
 const settleAll = Q => {
  settle1153(Q, 'fe-quote', 'Advanced’s fencing — paid on measured dockets, no lump-sum quote', 'No lump-sum quote exists and none is needed: Advanced is paid on measured dockets at the rates on its weekly Commercial Approval sheet (clean $10/m, braced for scrim $24.40/m, vehicle gate $50, pedestrian gate $61, demarcation CCB $5.40/m, installer and relocation labour $100/h, team leader $200/day), approved week by week against a purchase order each: 4647508 wk6 $8,992; 4647509 wk5 $33,670; 4647517 wk4 $26,695; 4647515 wk3 $50,154; 4647519 wk2 $28,246.50. Over or under is read docket by docket against the programme on the Fencing tab. The project manager, 15 Oct 2026.');
  settle1153(Q, 'fe-closure', 'Fence closures — the marks read, and drawn', 'Working rule (the project manager, 15 Oct 2026): a window is the time the closure is in force, closed at its start and clear by its end (Fri 7-8am and 6-7pm, Sat 7-7.25am and 5.53-7pm, Sun 7-7.25am and 5.15-7pm); the two marks sharing an order number are the two ends of one section and close together; the colour is the crew running that section (black, orange, teal, pink). Basis: the 19 Sep photograph and the 5 Oct review. The Fence closures tab carries the windows and the lines, redrawn from the project manager’s marked plan of 23 Oct 2026.');
  settle1153(Q, 'fe-gap', 'Fencing on the record vs the plan — read against the programme', 'Read against the programme weeks (the project manager, 15 Oct 2026): braced-for-scrim is booked under Clean with the bracing as components (36581 S04 corporate: 58 panels braced, no metres), so it is not missing; relocation is on the green service notes as hours (24469, 24471, 24474), not metres; removal is CON WK1 and the DECON weeks, still to do, with no docket metres by design; gates: Advanced’s week 2 sheet carries 33 vehicle and 3 pedestrian gates on 36574-36590, the rest are CON WK1 (50 + 21) and Event Week; CCB flat feet 42 of 45 for WK2 done, 121 m is Event Week. The Fencing tab keeps the live comparison, docket by docket.');
  settle1153(Q, 'fe-rate-team_leader', 'Team leader — no separate customer rate', 'The V8s are charged fencing per metre at the 2026 street card (clean $16.16, scrim $25.53, relocation $8.65, ped gate $36.18, CCB event $7.51, demarcation $13.08) and event people at the Event Labour Scope roles (fence team $88.49/h). Advanced’s $200/day team leader is inside our cost of each week’s approval sheet, not a line to the customer. Rule applied 15 Oct 2026.');
  settle1153(Q, 'oi-R30', 'R30 - VMS plan VMS001-26003-01 — the plan governs', 'Settled by what was issued: the Coates VMS plan pack of 15 Oct 2026 follows iEDM’s VMS001-26003-01 for every board position (D025 Rev 02’s VMS bubbles sit tens of metres off the spots and are not used for placement). Board 03 goes to the highway outside Gate 1 as the plan has it; boards 21-24 are on hire lines 9961265/31-39 (VMS24 sub-hired); supply stays 22 boards (R16); charges unchanged. The VMS boards tab works from that plan. The project manager, 15 Oct 2026.');
  try { const nv = Q.find(q => q.id === 'br-norate-NVAC'); if (nv && nv.st !== QH_DONE && !(nv.rows || []).length) settle1153(Q, 'br-norate-NVAC', 'NVAC — no unpriced contract lines remain', 'Contract 9961976: lines 41 (distribution board) and 47 (cable) are supplied with the generators and inside the card rate (the card prices 200 kVA with cables); line 45 is a spare 60 kVA and line 37 a tyne rotator, both Pending with no charge unless called off or delivered. Nothing to enter. The project manager, 15 Oct 2026; applied as charge treatments on the lines.'); } catch (e) {}
  try { const lb = Q.find(q => q.id === 'lb-rates');
   if (lb && lb.st === QH_OPEN) {
    const people = (typeof ourCosts === 'function' ? ourCosts() : []).filter(c => c.kind === 'person');
    const coates = p => people.some(c => String(c.person || '').trim() === p && (/coates/i.test(String(c.employer || '')) || /^(internal|salary)/i.test(String(c.type || ''))));
    const unpriced = (lb.rows || []).filter(r => /cost basis required/.test(String(r))).map(r => String(r).split(' · ')[0].trim());
    if (unpriced.length && unpriced.every(coates)) { lb.st = QH_LATER; lb.settled1153 = true; lb.need = 'The cost rate of ' + unpriced.length + ' Coates staff on salary is a payroll figure finance supplies (the 30 Sep review left it blank); the labour-hire people are costed from their purchase orders. Nothing to enter on the page until finance gives the rates (the project manager, 15 Oct 2026).'; }
   } } catch (e) {}
  return Q;
 };
 const beforeQ = W.questionsList;
 const gQ = function(){ const Q = beforeQ.apply(this, arguments); try { if (Q && typeof Q.find === 'function') settleAll(Q); } catch (e) {} return Q; };
 gQ.charge1153 = true; W.questionsList = gQ; try { questionsList = gQ; } catch (x) {}
})(window);
