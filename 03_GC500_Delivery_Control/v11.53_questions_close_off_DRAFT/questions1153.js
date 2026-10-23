/* v11.53 - questions-close-off-1153. Author: Andrew Fisher.
   Contract 9961976 (NVAC), the three lines the Questions tab still asked a rate for, and the fourth beside them: the
   project manager's note of 15 Oct 2026 - "line 41 distribution board and line 47 cable are supplied with the generators
   and are inside the card rate (the card prices 200 kVA with cables); line 45 is a spare 60 kVA, Pending, no charge unless
   called off; line 37 tyne rotator, Pending, no charge unless delivered. Nothing to enter." Each is a charge treatment on
   the line, the way the toilet-block tanks and Coates' own use are: no customer hire charge, the line kept as written.
   The two Pending lines keep their treatment only while the contract still writes them Pending: delivered or called off,
   the line comes back as a rate question. */
(function(W){
 const NVAC = new Map([
  ['9961976|41', {kind: 'in_card_rate', label: 'Inside the generator card rate', basis: 'Distribution board supplied with the generators — the card prices 200 kVA with its cables and board; no separate customer hire charge (the project manager, 15 Oct 2026)'}],
  ['9961976|47', {kind: 'in_card_rate', label: 'Inside the generator card rate', basis: 'Cable supplied with the generators — the card prices 200 kVA with cables; no separate customer hire charge (the project manager, 15 Oct 2026)'}],
  ['9961976|45', {kind: 'pending_no_charge', label: 'Pending — no charge unless called off', basis: 'Spare 60 kVA generator, Pending on the contract; no charge unless it is called off (the project manager, 15 Oct 2026)', pending: true}],
  ['9961976|37', {kind: 'pending_no_charge', label: 'Pending — no charge unless delivered', basis: 'Forklift tyne rotator, Pending on the contract; no charge unless it is delivered (the project manager, 15 Oct 2026)', pending: true}]]);
 W.Questions1153 = Object.freeze({nvac: Object.freeze([...NVAC.keys()]), settled: Object.freeze(['fe-quote', 'fe-closure', 'fe-gap', 'fe-rate-team_leader', 'oi-R10', 'oi-R26', 'oi-R29', 'oi-TX03']), reviewed: '2026-10-23'});
 const before = W.contractTreatment747;
 const g = function(row){
  const t = before.apply(this, arguments); if (t) return t;
  if (!row || row.branch_code !== 'NVAC' || row.rate_1 !== null || row.charge_line || row.subhired) return null;
  const d = NVAC.get(String(row.rental_contract) + '|' + row.line); if (!d) return null;
  if (d.pending && !/pending/i.test(String(row.status_as_written || ''))) return null;
  return {kind: d.kind, label: d.label, ref: null, approved_by: 'the project manager', approved_on: '2026-10-15', basis: d.basis, nvac1153: true};
 };
 g.charge1153 = true; W.contractTreatment747 = g; try { contractTreatment747 = g; } catch (x) {}
})(window);
