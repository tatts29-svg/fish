"""Author: Andrew Fisher. v12.27 - the Advanced race crew is a fencing cost on the P&L, not wages.

Andrew, 25 Oct 2026 (this chat), on the race-day crew Fencing 1–6: "For advanced / We pay advanced". The crew's shifts (23–25 Oct,
18 shifts, 216 h at Advanced's quote 27172, $142/h, 4 h minimum = $30,672.00) sat in the wages: "Labour hire — the running sheet",
tracked beside the P&L and never added. They are what Coates pays Advanced, so they go where Advanced's crew already goes:

  - the fencing cost category and stream, and so "Direct costs known" (moneySummary_);
  - P&L 2142 Installation — external contractors, "Advanced's crew" (pl770Model);
  - Costs to job end's fencing line, which reads the fencing category (cj764Model776Held), and from it the Finance handover's
    fencing (STPS);
  - out of the wages: the labour-hire line, people by branch (fh868People), the wages note (labourNote753) and the two Questions
    notes; the whole-job labour card keeps the crew on a row of its own, so labour charged against labour cost still compares
    like with like.

Checked again against the sources (Andrew: "Check again"): the rate is quote 27172's race-day rate, but the hours are the planned
roster typed before the race (6 × 06:00–18:00; Saturday's and Sunday's times were never on the crew's source line) and no Advanced
race-day docket is on the record. So the running sheet's own rule decides known or forecast: a planned shift stays a forecast (still to
come) until its hours are recorded or Finance verifies the actual. Today that puts the whole $30,672.00 in the forecast: direct costs
known unchanged, direct costs to job end +$30,672.00, and Costs to job end lists Advanced's race-day dockets as the thing to confirm.

Difference to job end is unchanged: it already took the wages off. The V8 charge stays as the event labour scope has it (Fence team).
racecrew1227_src.js (RaceCrew1227) is inserted after the Workforce1010 script it reads. Every edit must find its text exactly once on
the verified v12.26 page. Footer v12.26 -> v12.27.
    python3 patch_v1227.py page.html      (in place, on the live v12.26 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '82589211d0b07c43b71f5859e1fbb6fe43dabf338e2509e750ea815cef5fa26e'
FOOT_OLD, FOOT_NEW = "+' · v12.26'; /* v8.19 release922", "+' · v12.27'; /* v8.19 release922"
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()
RC = "typeof RaceCrew1227 !== 'undefined'"

EDITS = [
 # 1. moneySummary_: the crew's known cost is a direct cost known
 ('direct costs known',
  "cost.known = cents((OT.amount || 0) + schedT.counted + (cost.accommodation ? cost.accommodation.amount : 0) + (cost.meals ? cost.meals.amount : 0) + (cost.misc ? cost.misc.amount : 0) + (fd.cost || 0)\n +(cost.fencing_labour && cost.fencing_labour.priced ? cost.fencing_labour.amount : 0) + (rqApproved ? rq : 0));",
  "cost.race_crew1227 = " + RC + " ? RaceCrew1227.model(day) : null; /* v12.27 - the Advanced race crew is what Coates pays Advanced: a fencing cost, not wages (the project manager, 25 Oct 2026) */\n"
  " cost.known = cents((OT.amount || 0) + schedT.counted + (cost.accommodation ? cost.accommodation.amount : 0) + (cost.meals ? cost.meals.amount : 0) + (cost.misc ? cost.misc.amount : 0) + (fd.cost || 0)\n +(cost.fencing_labour && cost.fencing_labour.priced ? cost.fencing_labour.amount : 0) + (rqApproved ? rq : 0) + (cost.race_crew1227 ? cost.race_crew1227.known : 0));"),
 # 2. moneySummary_: the hours "not in this P&L" leave out the crew's race hours, now costed
 ('wages hours outside the P&L',
  "const hrsOut = cost.labour ? Math.round((cost.labour.hours + (cost.race_hours || 0)) * 10) / 10 : 0;",
  "const crewRace1227 = cost.race_hours && cost.race_crew1227 && cost.race_crew1227.shifts ? T.people.filter(p => Workforce1010.isPerson(p.name)).reduce((s, p) => s + (Number(p.race) || 0), 0) : 0; /* v12.27 - the race crew's hours are costed, not wages */\n"
  " const hrsOut = cost.labour ? Math.round((cost.labour.hours + (cost.race_hours || 0) - crewRace1227) * 10) / 10 : 0;"),
 # 3. moneyStreams: the fencing stream's cost
 ('fencing stream cost',
  "if (X.cost.fencing_labour && X.cost.fencing_labour.priced) add('fencing', X.cost.fencing_labour.amount, 'cost');",
  "if (X.cost.fencing_labour && X.cost.fencing_labour.priced) add('fencing', X.cost.fencing_labour.amount, 'cost');\n"
  " if (X.cost.race_crew1227 && X.cost.race_crew1227.known) add('fencing', X.cost.race_crew1227.known, 'cost'); /* v12.27 - the Advanced race crew, what we pay Advanced */"),
 # 4. moneyStreams: the fencing stream's note says it
 ('fencing stream note',
  "${X.cost.fencing_labour ? ` · green-book labour ${hoursTxt(X.cost.fencing_labour.hours)} h` : ''}`);",
  "${X.cost.fencing_labour ? ` · green-book labour ${hoursTxt(X.cost.fencing_labour.hours)} h` : ''}${X.cost.race_crew1227 && X.cost.race_crew1227.shifts ? ' · ' + RaceCrew1227.words(X.cost.race_crew1227, 'charge') : ''}`);"),
 # 5. costCategories: the crew's hours leave the hours-only external labour ...
 ('external hours',
  "exP = T.people.filter(p => worked(p) && labourCategory753(p) === 'external');",
  "exP = T.people.filter(p => worked(p) && labourCategory753(p) === 'external' && !(X.cost.race_crew1227 && X.cost.race_crew1227.shifts && Workforce1010.isPerson(p.name))); /* v12.27 - the Advanced race crew is costed under fencing */"),
 # 6. ... and their dollars join Advanced under fencing (Costs to job end's fencing line reads this category)
 ('fencing category',
  "if (X.cost.fencing_labour && X.cost.fencing_labour.priced) put('fencing', X.cost.fencing_labour.amount, 'Installation — external contractors: '+supplierGreenText1014(X.cost.fencing_labour));",
  "if (X.cost.fencing_labour && X.cost.fencing_labour.priced) put('fencing', X.cost.fencing_labour.amount, 'Installation — external contractors: '+supplierGreenText1014(X.cost.fencing_labour));\n"
  " if (X.cost.race_crew1227 && X.cost.race_crew1227.shifts) put('fencing', X.cost.race_crew1227.known || null, 'Installation — external contractors: the ' + RaceCrew1227.words(X.cost.race_crew1227)); /* v12.27 */"),
 # 7. pl770Model: 2142 Installation — external contractors carries the crew
 ('P&L 2142 model',
  " const cost = [\n  {key: 'rehire', code: '2126'",
  " const RC1227 = " + RC + " ? RaceCrew1227.model() : null; /* v12.27 - the Advanced race crew is Advanced's crew too: on 2142 */\n const cost = [\n  {key: 'rehire', code: '2126'"),
 ('P&L 2142 line',
  "{key: 'install', code: '2142', line: 'Installation — external contractors', what: 'Advanced’s crew', now: fenceInst, job: fenceInst, basis: SP.clean ? `their crew on the dockets ${money0(n(SP.docket_labour))}${n(SP.green) ? ' + the green book ' + money0(SP.green) : ''} · the relocation hours to come are not priced` : 'the green book only — the dockets are not split on the record'},",
  "{key: 'install', code: '2142', line: 'Installation — external contractors', what: 'Advanced’s crew', now: r2(fenceInst + (RC1227 ? RC1227.known : 0)), job: r2(fenceInst + (RC1227 ? RC1227.job : 0)), basis: (SP.clean ? `their crew on the dockets ${money0(n(SP.docket_labour))}${n(SP.green) ? ' + the green book ' + money0(SP.green) : ''}` : 'the green book only — the dockets are not split on the record') + (RC1227 && RC1227.shifts ? ' + the ' + RaceCrew1227.words(RC1227, 'charge') : '') + (SP.clean ? ' · the relocation hours to come are not priced' : '')},"),
 # 8. cj764Model776Held: the fencing line (its known figure is the fencing category) says the crew; a later race day is to come
 ('job end crew model',
  "const F = cj764Fencing(); const SP = fencePaidSplit(); const fenceToDate = r2(cat('fencing').amount || 0);",
  "const F = cj764Fencing(); const SP = fencePaidSplit(); const fenceToDate = r2(cat('fencing').amount || 0); const RC1227 = " + RC + " ? RaceCrew1227.model(today) : null; /* v12.27 - the race crew's known cost is in the fencing category */"),
 ('job end fencing line',
  "push('Fencing — Advanced Temporary Fencing, rehire cost', typeof pl760FencingBranch === 'function' ? pl760FencingBranch() : 'STPS', fenceToDate, F.cost,\n `to date: ${fmtNum(allDockets().filter(d => d.usable).length)}dockets at Advanced’s own sheet${SP.green ? ' + the green book ' + money0(SP.green) : ''}${fenceOrdersWords1159(' · ')}",
  "push('Fencing — Advanced Temporary Fencing, rehire cost', typeof pl760FencingBranch === 'function' ? pl760FencingBranch() : 'STPS', fenceToDate, RC1227 && RC1227.toCome ? r2((F.cost || 0) + RC1227.toCome) : F.cost,\n `to date: ${fmtNum(allDockets().filter(d => d.usable).length)}dockets at Advanced’s own sheet${SP.green ? ' + the green book ' + money0(SP.green) : ''}${RC1227 && RC1227.shifts ? ' + the ' + RaceCrew1227.words(RC1227) : ''}${fenceOrdersWords1159(' · ')}"),
 ('job end race crew to confirm',
  "\n/* v11.59 - CW1's prior task allowances are not a forecast gap",
  "\nif (RC1227 && RC1227.plannedShifts) gap('Fencing race crew — the hours on Advanced’s race-day dockets', `${fmtNum(RC1227.plannedShifts)} shifts are the planned roster, ${fmtNum(RC1227.plannedHours)} h, forecast at quote ${RC1227.quote} (${money(RC1227.rate)}/h, ${RC1227.minimumHours} h minimum) — ${money(RC1227.toCome)}; Advanced bills from signed daily event dockets, and none for the race days are on the record yet`, 'Advanced’s race-day dockets — the project manager'); /* v12.27 */"
  "\n/* v11.59 - CW1's prior task allowances are not a forecast gap"),
 # 9. cj764Model776Held: the wages leave the crew out
 ('job end wages',
  "try { fin745Rows(today).forEach(r => { const past",
  "try { fin745Rows(today).forEach(r => { if (RC1227 && RaceCrew1227.isCrew(r)) return; /* v12.27 - the Advanced race crew is in fencing above, not wages */ const past"),
 ('job end wages words',
  "Job Connect’s people and the race crew;",
  "Job Connect’s people${RC1227 && RC1227.shifts ? ' (the Advanced race crew is what we pay Advanced, in fencing above)' : ' and the race crew'};"),
 # 10. fh868People: people by branch are the wages, so the crew is not in them
 ('people by branch',
  "try { fin745Rows(today).forEach(r => { const g = get(r.person)",
  "try { fin745Rows(today).forEach(r => { if (" + RC + " && RaceCrew1227.isCrew(r)) return; /* v12.27 - a fencing cost, not wages */ const g = get(r.person)"),
 # 11. labourWholeJob865: the crew on a row of its own; the totals still hold every labour cost
 ('labour card rows',
  "const R = agg(rows.filter(r => ev.has(r.date))), O = agg(rows.filter(r => !ev.has(r.date))), ALL = agg(rows), allow = labourAllowance858();",
  "const RC1227 = " + RC + " ? RaceCrew1227.model(td) : null; if (RC1227) rows = rows.filter(r => !RaceCrew1227.isCrew(r)); /* v12.27 - the Advanced race crew is a fencing cost on the P&L: its own row below, not wages */\n"
  " const R = agg(rows.filter(r => ev.has(r.date))), O = agg(rows.filter(r => !ev.has(r.date))), ALL = agg(rows), allow = labourAllowance858();"),
 ('labour card totals',
  "chargeJob = r2(L.job + people + sourceInstall1224), costJob = r2(ALL.priced + allow), costNow = ALL.toDate;",
  "chargeJob = r2(L.job + people + sourceInstall1224), crewJob1227 = RC1227 ? RC1227.job : 0, crewNow1227 = RC1227 ? RC1227.known : 0, costJob = r2(ALL.priced + allow + crewJob1227), costNow = r2(ALL.toDate + crewNow1227);"),
 ('labour card metric',
  "labour hire ${money(ALL.priced)} + salary allowance ${money(allow)}",
  "labour hire ${money(ALL.priced)} + salary allowance ${money(allow)}${crewJob1227 ? ` + the Advanced race crew ${money(crewJob1227)} (a fencing cost on the P&L, 2142)` : ''}"),
 ('labour card crew row',
  "${row('The rest of the job — build and demob'",
  "${RC1227 && RC1227.shifts ? row('Race weekend — the Advanced race crew (Fencing 1–6)', m(RC1227.known), m(RC1227.toCome), m(RC1227.job), `${esc(RaceCrew1227.words(RC1227))} · what we pay Advanced — on the P&amp;L under Installation — external contractors (2142), not wages`) : ''}\n ${row('The rest of the job — build and demob'"),
 ('labour card total words',
  "`what the P&amp;L calls wages priced · Coates wages",
  "`${crewJob1227 ? `wages priced ${m(r2(ALL.priced + allow))} + the Advanced race crew ${m(crewJob1227)} (on the P&amp;L under 2142)` : 'what the P&amp;L calls wages priced'} · Coates wages"),
 # 12. the wages lines elsewhere say where the crew went
 ('at a glance wages row',
  "the running sheet at the rates on the record — the hired-in people, Temporary Staff on the P&amp;L ·",
  "the running sheet at the rates on the record — the hired-in people, Temporary Staff on the P&amp;L${" + RC + " && RaceCrew1227.model().shifts ? ' (the Advanced race crew is not wages: it is on 2142 above)' : ''} ·"),
 ('questions wages note',
  "these labour costs are not added to this P&L.`;",
  "these labour costs are not added to this P&L${(RC => RC && RC.shifts ? `, except the Advanced race crew (${fmtNum(RC.shifts)} shifts, ${money(RC.job)}${RC.toCome ? ' forecast' : ''}): what we pay Advanced, on the P&L under Installation — external contractors` : '')(" + RC + " ? RaceCrew1227.model(todayIso()) : null)}.`;"),
 ('questions wages ruling',
  "'. None of it is added to the P&L’s direct costs.';",
  "'. None of it is added to the P&L’s direct costs.' + ((RC => RC && RC.shifts ? ' The Advanced race crew is not wages: ' + RC.shifts + ' shifts, ' + dollars(RC.job) + (RC.toCome ? ' forecast' : '') + ', what we pay Advanced, on the P&L under Installation — external contractors.' : '')(" + RC + " ? RaceCrew1227.model() : null));"),
 ('email fencing parts',
  "bits.push(`Rehire ${money0(SP.gear)} + Installation, external contractors ${money0(SP.installation)}`); } /* v7.03 */",
  "bits.push(`Rehire ${money0(SP.gear)} + Installation, external contractors ${money0(SP.installation)}${M.cost.race_crew1227 && M.cost.race_crew1227.known ? ' + the race-day crew ' + money0(M.cost.race_crew1227.known) : ''}`); } /* v7.03; v12.27 the race crew */"),
 ('rehire by branch note',
  "); the P&L’s fencing category ${money0(Number(fenceCat.amount) || 0)} is the two together`",
  ")${M.cost && M.cost.race_crew1227 && M.cost.race_crew1227.known ? '; the race-day crew ' + money0(M.cost.race_crew1227.known) + ' (quote 27172) is Installation — external contractors too; the P&L’s fencing category ' + money0(Number(fenceCat.amount) || 0) + ' is the three together' : '; the P&L’s fencing category ' + money0(Number(fenceCat.amount) || 0) + ' is the two together'}`"),
]

NOTE_NEW = """function labourNote753(asOf){
 const s = fin745Summary(null, asOf), crew = typeof RaceCrew1227 !== 'undefined' ? RaceCrew1227.model(asOf) : null, cs = crew ? crew.shifts : 0; /* v12.27 - the Advanced race crew is a fencing cost on this P&L, not wages */
 const hired = s.rows.length - (s.hoursOnlyCount || 0) - cs, hiredCost = Math.round((s.expectedCost - (crew ? crew.job : 0)) * 100) / 100, unpCount = s.unpricedCount - (crew ? crew.unpricedShifts : 0), unpHours = Math.round((s.unpricedHours - (crew ? crew.unpricedHours : 0)) * 100) / 100;
 if (!s.rows.length) return 'wages — no usable running-sheet shifts for an actual or forecast cost review';
 const hiredWords = hired ? `${fmtNum(hired)} hired-in shift${hired === 1 ? '' : 's'} at the rates on the record, ${money(hiredCost)}${unpCount ? ` (${fmtNum(unpHours)} h with no rate)` : ''}` : 'no hired-in shifts';
 return `wages — ${hiredWords}; Coates wages and salary ${fmtNum(s.hoursOnly || 0)} h tracked in hours only, no hourly rate (the project manager, 23 Oct 2026). The “Actuals, forecast & Finance journals” section keeps verified costs, past estimates and forecasts apart; none of these wages are added to this P&L${cs ? `. The Advanced race crew, ${fmtNum(cs)} shifts ${money(crew.job)}${crew.toCome ? ' forecast' : ''}, is what we pay Advanced: on this P&L under Installation — external contractors, not wages` : ''}`;
}"""


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.26; rebuild and retest')
    for label, old, new in EDITS:
        if text.count(old) != 1: raise ValueError(f'{label}: expected text found {text.count(old)} times, not once')
        text = text.replace(old, new)
    a = text.find('function labourNote753(asOf){'); b = text.find('\nfunction labourCategory753', a)
    if a < 0 or b < 0 or text.count('function labourNote753(asOf){') != 1 or not text[a:b].rstrip().endswith('}'): raise ValueError('labourNote753 not found once')
    text = text[:a] + NOTE_NEW + text[b:]
    w = text.find('<script id="workforce1010-script">'); e = text.find('</script>', w) + len('</script>')
    if w < 0 or text.count('<script id="workforce1010-script">') != 1 or text[e:e + 1] != '\n': raise ValueError('the Workforce1010 script is not on the page once')
    if 'racecrew1227-script' in text: raise ValueError('RaceCrew1227 is already on the page')
    text = text[:e + 1] + (HERE / 'racecrew1227_src.js').read_text(encoding='utf-8').rstrip() + '\n' + text[e + 1:]
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.26 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print(f'patch_v1227 applied: {len(EDITS)} edits + labourNote753 + RaceCrew1227; the Advanced race crew is a fencing cost on the P&L; footer v12.26 -> v12.27')
