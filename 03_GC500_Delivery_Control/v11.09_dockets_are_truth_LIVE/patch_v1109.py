"""Author: Andrew Fisher. v11.09 - dockets and invoices are the truth; Eric off the installers.

Andrew, 22 Oct 2026: "Our dockets and whats been invoiced is truth"; "please remove eric from the names in installers";
"Everywhere needs to talk updates and place updates everywhere else".

1. The three crowd-control-barrier dockets the Build index held as "awaiting classification" (36596 287.5 m, 36603
   672.5 m, 36613 70 m - 1,030 m shown as a range) are confirmed as the docket records already classify them:
   36596 and 36603 Demarcation, 36613 Event. Their rows in the CCB review catalogue (DATA.fence_ccb_review847) are
   written against the current record (date, location, quantities, components, note) and the signed paper's checksum,
   so the page's own review rule reads them as confirmed; if the record or the paper changes, the rule marks them stale
   again, as it does for every other row.
2. The invoiced workbook row with no docket date (Fence Costs 2026.xlsx, Week 6 row 3: 232.5 m clean + 3 vehicle gates,
   recorded 10 Sep 2026 by the supplier) is counted as done. fenceInstallationDocketState848 places an invoiced
   workbook row with no docket date on the day the invoice sheet recorded it, inside its own week; every other rule
   (usable, week placement, scope) is unchanged. No other docket is affected: it was the only undated record.
3. Eric Lucian comes off the current installers list (ABOUT_CONTACT_INPUT1089 and the AboutContacts1089 filter).
   His 14 Oct labour and rate records on Costs are history and stay.
4. Footer v11.08 -> v11.09.

    python3 patch_v1109.py page.html      (in place, on the live v11.08 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '522dbc09fbed279e1873b245828f25d32b0b2019e03018da22560d01fb125a76'

RULE = "Our dockets and what has been invoiced are the truth (the project manager's rule, 22 Oct 2026). "
CCB_ROWS = [
 {"record_id": "F-AF-0023", "docket_no": "36596",
  "expected": {"date": "2026-10-12",
   "location": "Main Beach Pde - Madison Point to Ferny Ave, Higman St to Equinox, Ferny Ave southern side, Seacrest to Pacific Point",
   "quantities": {"clean": 385, "ccb_demarc": 287.5, "ped_gates": 5},
   "components": {"mesh_panel": 164, "cc_barrier": 115, "base": 164, "clamp": 160, "wheels": 12},
   "note": "Mesh fence 385 m (164 panels), CC barrier 287.5 m (115 barriers), 5 pedestrian gates, 12 wheels, 164 bases, 160 clamps. Install includes: Madison Point to Ferny Ave; Higman St to Equinox; Ferny Ave southern side; Seacrest to Pacific Point. Programme CON WK1 rows 7-10 (12 Oct): Residents Fence Seacrest to Pacific Point (221 m, 4 pedestrian gates) and Maddison Point (98 m, 1 pedestrian gate); Demarcation CCB Seacrest to Pacific Point (228 m) and Maddison Point (91 m) - so the CCB is Demarcation. 164 panels would make 410 m against 385 m written; the paper's metres are recorded. Service note 24475 (3 h walking 135 m of these panels in from Madison Point to Ferny Ave, no truck access) is this paper's labour, not extra metres. Installation date written 12/10/24 (the year a slip; installed 12 Oct 2026). Owner sign-off dated 20.10.26 on the paper, photographed 19 Oct 2026. Prices and totals blank on the paper."},
  "source_ids": ["36596.jpg", "GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx"],
  "decision": {"state": "confirmed", "type": "ccb_demarc", "basis": RULE + "Docket 36596 stands as recorded: CC barrier 287.5 m (115 barriers) is Demarcation, the programme rows this paper installs (CON WK1 rows 7-10, 12 Oct: Demarcation CCB Seacrest to Pacific Point 228 m and Maddison Point 91 m)."}},
 {"record_id": "F-AF-0003", "docket_no": "36603",
  "expected": {"date": "2026-10-13",
   "location": "Eastern Residents & Demarc - Cable St to Gate 8A - DL & DR",
   "quantities": {"clean": 537.5, "ccb_demarc": 672.5, "ped_gates": 4},
   "components": {"mesh_panel": 215, "cc_barrier": 269, "base": 209, "clamp": 240, "brace": 21, "wheels": 14},
   "note": "Install includes: Residents - Amira to Norfolk; Demarcation - Cable St to Breaker St; Demarcation - Ocean Isles to Amari; Residents - Ocean Isles to Amari to SLS Tower; Demarcation - T11 - DL; Demarcation - T11 - Runoff; Residents - Norfolk to Decks; Demarcation - Norfolk to Decks; Residents - Bougainvillea to Sunbird - West; Demarcation - Ocean Resort - Sunbird West. Mesh fence 537.5 m (residents) on the clean line; CC barrier 672.5 m recorded as demarcation, as the paper's notes say; 4 pedestrian gates. Owner sign-off: Andrew, 16 Oct 2026; installation date 13 Oct 2026. Prices and totals blank on the paper. Source review 20 Oct 2026: the supplied original writes Castle St in its main location and demarcation run, while the reviewed programme uses Cable St; retain that wording discrepancy. Several handwritten building names are uncertain; the existing programme associations are area/task context, not a new exact transcription of those names."},
  "source_ids": ["36603.jpg", "GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx"],
  "decision": {"state": "confirmed", "type": "ccb_demarc", "basis": RULE + "Docket 36603 stands as recorded: CC barrier 672.5 m (269 barriers) is Demarcation; the paper's own notes name every CC barrier run Demarcation (Cable St to Breaker St, Ocean Isles to Amari, T11 DL and Runoff, Norfolk to Decks, Ocean Resort to Sunbird West)."}},
 {"record_id": "F-AF-0013", "docket_no": "36613",
  "expected": {"date": "2026-10-15", "location": "Porsche CZ",
   "quantities": {"ccb_event": 70}, "components": {"cc_barrier": 28},
   "note": "Paper says CC Barrier 70 m, 28 barriers. Recorded as CCB Event from the programme request: Porsche C.2 is the Porsche Lounge construction zone on The Esplanade (CON WK1 row 39, Exclusion Zone - Porsche Lounge CZ, 14 Oct; row 65, Porsche Lounge BOH & Compound, 16 Oct) - a works and compound barrier, not a spectator demarcation route, as PB01 works area (36530) stands. Owner sign-off: Andrew, 16 Oct 2026; installation date 15 Oct 2026. Prices and totals blank on the paper."},
  "source_ids": ["36613.jpg", "GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx"],
  "decision": {"state": "confirmed", "type": "ccb_event", "basis": RULE + "Docket 36613 stands as recorded: CC barrier 70 m (28 barriers) is Event; Porsche C.2 is the Porsche Lounge construction zone (CON WK1 rows 39 and 65), a works and compound barrier like PB01 (36530)."}},
]
NEW_SOURCES = [{"id": "36596.jpg", "sha256": "6dd9a6e797e0a56de278dd84db08cf08828d72e3fbba7d2eacdab10b7f7c4c63", "title": "Signed hire agreement 36596"}]

OLD_STATE = """function fenceInstallationDocketState848(docket, asOf) {
  const d = docket || {}, day = asOf || todayIso();
  const validDate = /^\\d{4}-\\d{2}-\\d{2}$/.test(d.date || '') && Number.isFinite(Date.parse(d.date + 'T00:00:00Z')) && new Date(d.date + 'T00:00:00Z').toISOString().slice(0, 10) === d.date;
  if (!validDate) return 'undated';
  if (d.date > day) return 'future';
  if (!d.usable) return 'unusable';
  const weeks = typeof DATA === 'undefined' ? [] : DATA.weeks || [];
  const datedWeeks = weeks.filter(w => w.start && w.end && w.start <= d.date && w.end >= d.date);"""
NEW_STATE = """function fenceInstallationDocketState848(docket, asOf) {
  const d = docket || {}, day = asOf || todayIso();
  const isoDay1109 = v => /^\\d{4}-\\d{2}-\\d{2}$/.test(v || '') && Number.isFinite(Date.parse(v + 'T00:00:00Z')) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
  /* v11.09 (Andrew, 22 Oct 2026: "Our dockets and whats been invoiced is truth"): an invoiced workbook row with no
     docket date is still done. It is placed on the day the invoice sheet recorded it, inside its own week. */
  const date = isoDay1109(d.date) ? d.date : d.origin === 'workbook' && isoDay1109(d.recorded_on) ? d.recorded_on : null;
  if (!date) return 'undated';
  if (date > day) return 'future';
  if (!d.usable) return 'unusable';
  const weeks = typeof DATA === 'undefined' ? [] : DATA.weeks || [];
  const datedWeeks = weeks.filter(w => w.start && w.end && w.start <= date && w.end >= date);"""


def patch(text):
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.09 requires the live v11.08 page ' + BASE_SHA256)
    # 1. the CCB review catalogue: the three rows land the way the page already layers its review rows (the v10.46
    #    block replaces rows by docket number after the base catalogue and the 957 rows), so they read as current
    # the three dockets are live records on the service (F-AF-0023, F-AF-0003, F-AF-0013), not page text
    add = json.dumps({"rows": CCB_ROWS, "sources": NEW_SOURCES}, ensure_ascii=False, separators=(',', ':'))
    block = ("R.ccb1046 = true; } catch (e) {} })();\n"
             "/* v11.09 - dockets and invoices are the truth (Andrew, 22 Oct 2026): the three crowd-control-barrier dockets confirmed as their records classify them. */\n"
             "(function(){ try { const add = " + add + ", R = DATA && DATA.fence_ccb_review847; if (!R || !Array.isArray(R.rows) || R.ccb1109) return;\n"
             " const nos = new Set(add.rows.map(r => r.docket_no)); R.rows = R.rows.filter(r => !nos.has(r.docket_no)).concat(add.rows);\n"
             " const ids = new Set(R.sources.map(s => s.id)); add.sources.forEach(s => { if (!ids.has(s.id)) R.sources.push(s); }); R.ccb1109 = true; } catch (e) {} })();\n"
             "/* v10.47 - fence-completion-1047")
    text = rep(text, "R.ccb1046 = true; } catch (e) {} })();\n/* v10.47 - fence-completion-1047", block, 'CCB rows confirmed after the v10.46 block', 'page')
    # 2. the invoiced workbook row placed in its week
    text = rep(text, OLD_STATE, NEW_STATE, 'docket date state', 'page')
    # 3. Eric off the current installers
    text = rep(text, '{"name":"Jayden Paul","event_role":"Installer","group":"install"},{"name":"Eric Lucian","event_role":"Installer","group":"install"},{"name":"Ludwig Chee"',
        '{"name":"Jayden Paul","event_role":"Installer","group":"install"},{"name":"Ludwig Chee"', 'installers input', 'page')
    text = rep(text, "const removed=new Set(['corey machado','ross saxelby','abraham tibble','krystal stephens']);",
        "const removed=new Set(['corey machado','ross saxelby','abraham tibble','krystal stephens','eric lucian']); /* v11.09: Andrew, 22 Oct 2026 */", 'installers filter', 'page')
    if 'Eric Lucian' in text: raise ValueError('Eric Lucian still named on the page')
    # 4. vehicle gates: the invoiced workbook row has no component count, only its 3 gates; the v10.47 wheels count
    #    (2 per gate) skipped it twice over - its scope is unset (the state rule reads unset as programme) and it has no
    #    wheels column. Count its invoiced gates as 2 wheels each, as every docket's gates are counted.
    text = rep(text, "const wheels = () => { try { return (allDockets() || []).filter(d => d.scope === 'programme').reduce((n, d) => n + (Number((d.components || {}).wheels) || 0), 0); } catch (e) { return null; } };",
        "const wheels = () => { try { return (allDockets() || []).filter(d => (d.scope || 'programme') === 'programme').reduce((n, d) => n + (Number((d.components || {}).wheels) || 0) + (d.origin === 'workbook' && !d.components ? 2 * (Number((d.quantities || {}).v_gates) || 0) : 0) /* v11.09: an invoiced row's gates */, 0); } catch (e) { return null; } };",
        'invoiced gates in the wheels count', 'page')
    # 5. footer
    return rep(text, "+' · v11.08'; /* v8.19 release922", "+' · v11.09'; /* v8.19 release922", 'release footer', 'page')


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
