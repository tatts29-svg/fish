"""Programme EVENT WEEK rows against the event week's papers on the record: one table, the pairing by hand.
Reads the programme extract and the live record dump (probe_all.json); prints Markdown."""
import json, sys
B = '/home/user/fish/03_GC500_Delivery_Control/'
prog = json.load(open(B + 'v9.51_programme_sources_LIVE/fencing_source951.json'))
rows = [w for w in prog['weeks'] if w['sheet'] == 'EVENT WEEK'][0]['rows']
rec = json.load(open(sys.argv[1]))
D = {d['no']: d for d in rec['dockets'] if d.get('no')}
N = {n['no']: n for n in rec['notes']}
C = {c['no']: c for c in rec['colls']}
AB = {'Temporary Fence (m) — Clean': 'clean', 'Temporary Fence (m) — Braced for Scrim': 'braced for scrim', 'Temporary Fence (m) — Relocation': 'relocation', 'Temporary Fence (m) — Removal': 'removal', 'Temporary Fence (m) — Hoarding': 'hoarding', 'Crowd Control Barriers (m) — Event': 'CCB event', 'Crowd Control Barriers (m) — Demarcation': 'CCB demarc', 'Crowd Control Barriers (m) — Flat Feet': 'flat feet', 'Crowd Control Barriers (m) — WPF': 'picket fence', 'Vehicle Gates': 'veh. gates', 'Ped. Gates': 'ped. gates'}
# the pairing: programme row -> papers (hire agreements / notes / collections) and a word on the fit
PAIR = {
 6: (['36623'], 'clean 97.5 m incl. the gate; the 100 m CCB on the same paper is the S15 demarcation (rows 10/32)'),
 7: (['36623'], 'hoarding 102.5 m held as 41 panels - no card line'),
 8: ([], 'no paper seen (36641?)'),
 9: (['36624', '24482'], '32.5 m fence braced (31 braces), no scrim written; 24482 relocates 22.5 m fence + 70 m CCB'),
 10: (['36623'], 'the S15 C2 demarcation 100 m (paper says Demarcation); rows 10 and 32 together ask 179 m'),
 11: ([], 'no paper seen'),
 12: (['36625'], '285 m braced & scrimmed on a hire agreement (charged as installed, not as relocation)'),
 13: (['36629'], 'demarcation share 182.5 m of the 420 m'), 14: (['36629'], 'in the 182.5 m'),
 15: (['36629'], 'event share 237.5 m of the 420 m'), 16: (['36629'], 'in the 237.5 m'),
 17: (['36626'], '492.5 m against 120 + 189 (row 34) planned'),
 19: ([], 'no paper seen'), 20: ([], 'no paper seen'),
 21: (['36636'], '205 m all demarcation (rows 21-23 ask 193 demarc + 28 event)'), 22: (['36636'], 'see row 21'), 23: (['36636'], 'see row 21'),
 24: ([], 'no paper seen (36633 fire hydrant 17.5 m is elsewhere at S01)'),
 25: (['36642'], 'Gate 6: 7.5 m clean + scrim'),
 26: (['36630'], '30 m, not scrimmed (confirmed with Jake on the paper), 3 wheels'),
 27: (['36638'], '88 m flat feet'),
 28: ([], 'no paper seen'),
 30: ([], 'removals: collections carry counts only'), 31: (['28569'], 'S15 CZ: 38 panels = 95 m'), 32: (['36623'], 'see row 10'),
 33: ([], 'no paper seen'), 34: (['36626'], 'see row 17'), 35: ([], 'no paper seen'), 36: ([], 'no paper seen'),
 37: ([], 'no paper seen'), 38: ([], 'no paper seen'),
 39: (['36758', '24490'], '30 m fence (1 brace), no scrim; 24490 relocates 27.5 m'),
 40: (['36761'], '35 m fence (6 braces); scrim 32.5 m per note 24488'),
 41: (['36627'], '62.5 m of the track-wide paper (The Hill & Merchandise BS08-BS09)'),
 42: ([], 'no paper seen'),
 43: (['36627'], '5 m + 7.5 m = the paper\'s S01-S05 corporate 12.5 m'), 44: (['36627'], 'see row 43'),
 45: ([], 'no paper seen'), 46: ([], 'no paper seen'),
 47: ([], 'picket fence: no card line, no paper'), 48: ([], 'as row 47'), 49: ([], 'as row 47'), 50: ([], 'as row 47'),
 51: ([], 'no paper seen (36642 is row 25)'), 52: (['28572'], 'PB03: 4 panels (10 m) collected'),
 54: (['36643', '24486', '24488'], '32.5 m new fence + 20 m CCB; relocation from the creek (24486); scrim 47.5 m (24488)'),
 55: (['36635'], '37.5 m CCB, Event per the column'), 56: (['36635'], '35 m flat feet'),
 57: ([], 'no paper seen'), 58: (['36752'], 'Staghorn St entry 20 m, 2 wheels (5A/5B?)'), 59: (['36752'], 'see row 58'),
 60: (['36751'], '147.5 m clean, 8 wheels'), 61: (['36751'], '315 m CCB event'),
 62: (['28571'], 'Monster CZ: 59 panels (147.5 m) collected'), 63: ([], 'no paper seen'), 64: ([], 'no paper seen'), 65: ([], 'no paper seen'),
 66: (['36649'], 'Gate 10: 40 m clean + scrim, 2 wheels'), 67: (['36753'], 'Gate 9: 17.5 m, 2 wheels'), 68: (['36754'], 'Gate 8: 37.5 m, 2 wheels'), 69: (['36648'], 'Gate 7: 37.5 m, 2 wheels'),
 70: ([], 'no paper seen'), 71: ([], 'no paper seen'), 72: (['36645'], 'inlet, Breaker St: 12.5 m of the 25 m'),
}
def paper(no):
    if no in D: d = D[no]; return f"{no} ({d['date'][5:]}, {json.dumps(d['q']) if d['q'] else 'components only'})"
    if no in N: n = N[no]; return f"note {no} ({n['date'][5:]}, {n['h']} h{', ' + str(n['m']) + ' m' if n.get('m') else ''})"
    if no in C: c = C[no]; return f"collection {no} ({c['date'][5:]}, {', '.join(str(v) + ' ' + k for k, v in c['collected'].items())})"
    return no
used = set()
print('| Row | Date | Location | Programme line | Planned | Papers | Fit |')
print('|---|---|---|---|---|---|---|')
for r in rows:
    q = r.get('quantities') or {}; planned = '; '.join(f"{AB.get(k, k)} {v}" for k, v in q.items())
    papers, fit = PAIR.get(r['source_row'], ([], '?'))
    used |= set(papers)
    print(f"| {r['source_row']} | {r['date'][5:]} | {r.get('location')} | {r.get('description')} | {planned} | {', '.join(paper(p) for p in papers) or '—'} | {fit} |")
print()
print('Papers of the week not on a programme line:')
for no, d in sorted(D.items()):
    if d['date'] >= '2026-10-19' and no not in used: print(f"- {paper(no)} — {d['loc']}")
for no, n in sorted(N.items()):
    if n['date'] >= '2026-10-19' and no not in used: print(f"- {paper(no)} — {n['loc']}")
for no, c in sorted(C.items()):
    if c['date'] >= '2026-10-19' and no not in used: print(f"- {paper(no)} — {c['loc']}")
