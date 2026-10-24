/* Author: Andrew Fisher. v9.57 — source-backed flat-feet CCB metres.
 * Rate Card 2026 (1).xlsx, SHA-256
 * 60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6:
 * 'Street Rate Card 2026'!C53 says Per Mtr 2026; A63 names CCB Flat feet;
 * B63 says labour Included; C63 = 9.6511. 'Transport '!A92:O92 says Included.
 * The original programme CON WK2!L4:N5 names Crowd Control Barriers (m), Flat Feet.
 * Physical barrier counts remain components; they are never substituted for metres.
 */
function installFlatFeet957(columns, fencing){
 if (!columns.some(c => c.key === 'flat_feet')) columns.push({
  key: 'flat_feet', name_as_written: 'CCB flat feet', unit: 'm',
  programme_type: 'Crowd Control Barriers (m) — Flat Feet',
  unit_basis: "Rate Card 2026 (1).xlsx, 'Street Rate Card 2026'!C53: Per Mtr 2026; A63:C63: CCB Flat feet. The programme CON WK2!L4:N5 also specifies metres.",
  rate: 9.6511, rate_year: 2026, rate_source: 'the 2026 street rate card',
  card: 'street_2026', card_line: 'CCB Flat feet', card_state: 'matched',
  card_why: 'The named flat-feet CCB line is priced per metre. Labour and transport are included; the physical barrier count is recorded separately.',
  card_candidates: [], cost_rate: null,
  cost_basis: 'No verified Advanced flat-feet CCB supplier rate is recorded; retain the supplier cost as unknown until matched evidence is available.',
  issued_card_rate: 9.65, issued_card_differs: false,
  labour_included: true, transport_included: true,
  source957: {
   file: 'Rate Card 2026 (1).xlsx',
   sha256: '60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6',
   rate_cells: "'Street Rate Card 2026'!A63:C63", unit_cell: "'Street Rate Card 2026'!C53",
   transport_cells: "'Transport '!A92:O92", reviewed_on: '2026-10-09'
  }
 });
 const obsolete = 'the fencing programme has a "Crowd Control Barriers (m) — Flat Feet" line and the crew\'s dockets have no column for it — the 2026 card prices it ("CCB Flat feet", $9.65) once a column exists';
 if (Array.isArray(fencing.rate_gaps)) fencing.rate_gaps = fencing.rate_gaps.filter(g => g.problem !== obsolete);
}
installFlatFeet957(FCOL, FENCE);
