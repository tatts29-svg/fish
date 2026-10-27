"""v12.42.5 - the P&L on Andrew's answers of 27 Oct 2026 (the Baseplan (8) review). Author: Andrew Fisher.

1. Coates forklifts are own use, no charge ("Coates own use equipment no charge"): T0003, T0004, T0005, FL01, FL02,
   EQ0004 and EQ0007 join the references held out of every charge (NotChargedHere1152) - tracked on the page as before,
   nothing from them in hire, labour, servicing or transport. T0085 and T0109 (Supply forklifts on 9987005) stay charged.
2. Water is part of the pump-out charges ("Is part of the pump out charges"): the water truck, the pre-fill, the water
   deliveries and the drinking-water tank are no longer added to revenue. What Event Portables charge us stays a cost.
3. Accommodation and travel is $27,700 ("$27,700 is this years cost. They haven't updated"), half under Portable Building
   Hire and half under Toilet Hire, as Baseplan has it ($13,850 each). The workbook's own $19,101.60 stays as written.
4. The footer reads v12.42.5.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

FOOT = ("+' · v12.42.4'; /* v8.19 release922", "+' · v12.42.5'; /* v8.19 release922")
OWN = (" const HELD = new Map(TEAMS.map(([ref, hs, who]) => [ref, Object.freeze({ref, hs: hs.slice(), who})]));",
 " /* v12.42.5: Coates' own-use forklifts, no charge (Andrew, 27 Oct 2026: \"Coates own use equipment no charge\") - held the same way */\n"
 " const OWN12425 = ['T0003', 'T0004', 'T0005', 'FL01', 'FL02', 'EQ0004', 'EQ0007'];\n"
 " const HELD = new Map(TEAMS.map(([ref, hs, who]) => [ref, Object.freeze({ref, hs: hs.slice(), who})]).concat(OWN12425.map(ref => [ref, Object.freeze({ref, hs: [], who: 'Coates own use', own: true})])));")
WHY = (" const why = ref => { const h = HELD.get(String(ref)); return h ? ",
 " const why = ref => { const h = HELD.get(String(ref)); if (h && h.own) return 'Not charged: Coates\\u2019 own-use equipment (Andrew, 27 Oct 2026: \"Coates own use equipment no charge\"). Tracked on this page.'; return h ? ")
GH = ("   return '<section class=\"notice charges952\" data-charges952=\"' + esc(a.key) + '\" data-held1152><b>Charges to V8 Supercars · arrived equipment</b><p><b>Not charged here.</b> '\n    + esc(a.key) + ' is on hire schedule '",
 "   if (h.own) return '<section class=\"notice charges952\" data-charges952=\"' + esc(a.key) + '\" data-held1152><b>Charges to V8 Supercars · arrived equipment</b><p><b>Not charged.</b> ' + esc(a.key) + ' is Coates\\u2019 own-use equipment, no charge to V8 Supercars (Andrew, 27 Oct 2026). Tracked on this page; nothing from this reference is in the hire, labour, servicing or transport figures.</p></section>'; /* v12.42.5 */\n   return '<section class=\"notice charges952\" data-charges952=\"' + esc(a.key) + '\" data-held1152><b>Charges to V8 Supercars · arrived equipment</b><p><b>Not charged here.</b> '\n    + esc(a.key) + ' is on hire schedule '")
PUMP = ("pump = r2((sv ? n(sv.card_total) : 0) + waterPump);",
 "pump = r2(sv ? n(sv.card_total) : 0); /* v12.42.5: water is part of the pump-out charges (Andrew, 27 Oct 2026) - not added to revenue */")
CONS = ("key: 'cons', code: '1020', line: 'Consumables', what: 'water deliveries and the drinking-water tank at what we are charged', now: waterCons, job: waterCons,",
 "key: 'cons', code: '1020', line: 'Consumables', what: 'water is part of the pump-out charges (Andrew, 27 Oct 2026): not charged on its own', now: 0, job: 0,")
ACC = ('"accommodation_travel":{"amount":19101.6,"row":68,"split":[{"cost_code":"3.14","name":"Portable Building Hire","amount":9550.8},{"cost_code":"3.16","name":"Toilet Hire","amount":9550.8}],"as_written":"a figure typed in the workbook, charged half under Portable Building Hire and half under Toilet Hire"}',
 '"accommodation_travel":{"amount":27700,"row":68,"split":[{"cost_code":"3.14","name":"Portable Building Hire","amount":13850},{"cost_code":"3.16","name":"Toilet Hire","amount":13850}],"as_written":"$27,700, this year\'s cost (Andrew, 27 Oct 2026: the workbook\'s $19,101.60 was not updated), charged half under Portable Building Hire and half under Toilet Hire, as Baseplan has it"}')

TRE = (" ['9968929', 7, 'Toilet Portable - Fresh Water Flush', 'toilet', 'T0024', 'own_use']\n].map(row => Object.freeze(row)));",
 " ['9968929', 7, 'Toilet Portable - Fresh Water Flush', 'toilet', 'T0024', 'own_use'],\n"
 " /* v12.42.5: the Coates forklifts on 9961976, own use, no charge (Andrew, 27 Oct 2026: \"Coates own use equipment no charge\") */\n"
 " ['9961976', 21, 'COATES Forklift 3.0t Container Diesel', 'forklift', 'T0004', 'own_use', '2026-10-27'],\n"
 " ['9961976', 25, 'COATES Forklift Rough Terrain 2.5t With Switchable 2WD to 4WD', 'forklift', 'T0005', 'own_use', '2026-10-27'],\n"
 " ['9961976', 26, 'COATES Forklift Rough Terrain 4WD With Rotator 2.5t Diesel', 'forklift', 'T0005', 'own_use', '2026-10-27'],\n"
 " ['9961976', 27, 'SUPPLY-Forklift 3.5t Diesel', 'forklift', 'EQ0004', 'own_use', '2026-10-27'],\n"
 " ['9961976', 31, 'COATES- 5T FORKLIFT 1.8TYNNES', 'forklift', 'T0003', 'own_use', '2026-10-27'],\n"
 " ['9961976', 34, 'AT009 Forklift Rough Terrain 2.5t With Switchable 2WD to 4WD', 'forklift', 'EQ0007', 'own_use', '2026-10-27'],\n"
 " ['9961976', 35, 'COATES-Forklift Rough Terrain 2.5t With Switchable 2WD to 4WD', 'forklift', 'T0005', 'own_use', '2026-10-27']\n].map(row => Object.freeze(row)));")
TRF = (" if (!row || row.branch_code !== 'KINP' || row.rate_1 !== null",
 " if (!row || (row.branch_code !== 'KINP' && row.branch_code !== 'NVAC') || row.rate_1 !== null")
TRB = (" return {kind: match[5], label, ref: match[4], approved_by: 'the project manager', approved_on: '2026-10-01',",
 " if (match[6]) return {kind: match[5], label, ref: match[4], approved_by: 'Andrew Fisher', approved_on: match[6], basis: 'Coates\\u2019 own-use equipment; no customer hire charge \\u2014 Andrew, 27 Oct 2026'}; /* v12.42.5 */\n return {kind: match[5], label, ref: match[4], approved_by: 'the project manager', approved_on: '2026-10-01',")

def patch(t, path='page'):
    for a, b, what in (OWN + ('own-use forklifts',), WHY + ('own-use words',), GH + ('own-use drawer words',), PUMP + ('water off pump revenue',), CONS + ('water off consumables revenue',), ACC + ('accommodation $27,700',), TRE + ('forklift rows own use',), TRF + ('own use on NVAC rows',), TRB + ('own use words for the forklift rows',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once')
        t = rep(t, a, b, what, path)
    if t.count(FOOT[0]) != 1: raise ValueError('footer')
    return t.replace(FOOT[0], FOOT[1])

if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v12425 applied')
