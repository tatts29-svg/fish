# Author: Andrew Fisher. 25 Oct 2026 - our record against Coates' own delivery dockets (the Delivery Dockets sheet in
# Baseplan (7)): when each thing turned up, and its numbers. Andrew: "we just want to make sure what we have is right as
# we are truth when things turned up". The site record stays the truth; a docket that disagrees is a question for Andrew,
# never a change. Reads private files only; writes evidence/arrivals_check.json (no names, no links, no photos).
#   python3 arrivals_check.py <private dir>
# private dir: bp7.json (to_json.py), site.json (dump_site.cjs), vms_model.json (dump_vms.cjs), state_now.json (the
# live record, read only)
import collections, datetime as dt, json, re, sys
from pathlib import Path

PRIV = Path(sys.argv[1]); HERE = Path(__file__).resolve().parent
J = lambda n: json.load(open(PRIV / n))
bp7, site, V = J('bp7.json'), J('site.json'), J('vms_model.json')
rec = J('state_now.json')
DOCKETS = bp7['Delivery Dockets']
REF = re.compile(r'^(P\d+|WC\d+|GN\d+|CP\d+|T\d{4}|EQ\d{4}|FL\d+|LT\d+|WB\d+|VMS\d+|FR\d+|PG\d+|TM\d+|AA|HRP)$')
CHARGED_FROM_ARRIVAL = {'Access & plant', 'Other', 'Variable message signs', 'Water-filled barriers', 'Generators'}

def aest(s):   # a record stamp (UTC) or a plain date, as the AEST day
    if not s: return None
    s = str(s)
    if s.endswith('Z'): return (dt.datetime.fromisoformat(s.replace('Z', '+00:00')) + dt.timedelta(hours=10)).date()
    m = re.match(r'(\d{1,2}) (\w{3})\w* (\d{4})', s)
    if m: return dt.datetime.strptime(' '.join(m.groups()), '%d %b %Y').date()
    return dt.date.fromisoformat(s[:10])
day = lambda d: f'{d:%a %d %b}' if d else None
R = {r['ref']: r for r in site['refs']}

# every number on our record, with the reference and what it says it is (units, accessories, registers)
held = collections.defaultdict(set)    # number -> {(ref, type)}
for r in site['refs']:
    for a in r['asset_numbers'] or []: held[str(a)].add((r['ref'], r['discipline']))
for sc in site['scopes']:
    for u in sc.get('units') or []:
        if u.get('assetNo'): held[str(u['assetNo'])].add((sc['ref'], u.get('item') or u.get('label') or ''))
def walk(v, ref=None):
    if isinstance(v, dict):
        if v.get('asset_no') and ref: held[str(v['asset_no'])].add((ref, v.get('type') or v.get('label') or ''))
        for k, x in v.items(): walk(x, k if REF.match(str(k)) else (v.get('_k') if REF.match(str(v.get('_k') or '')) else ref))
    elif isinstance(v, list):
        for x in v: walk(x, ref)
walk(rec.get('docs', rec))
deleted = {}   # references taken off the record, with the note
for k, v in (rec.get('docs', {}).get('notes') or {}).items():
    pass
txt = json.dumps(rec)
for m in re.finditer(r'"asset~2f~(\w+)":\{"_k":"asset/\w+","v":"(Deleted [^"]{0,260})"', txt): deleted[m.group(1)] = m.group(2)

KIND = [('fridge', r'refrigerat|fridge'), ('aircon', r'air ?con'), ('boiler', r'auto ?boil|zip|urn|boiler'), ('microwave', r'microwave'),
        ('toilet', r'toilet|fwf|pan'), ('generator', r'generator'), ('forklift', r'forklift|telehandler|tyne'), ('board', r'board|vms')]
kind = lambda s: next((k for k, p in KIND if re.search(p, str(s), re.I)), None)
def dref(desc):   # the reference a docket line names first ("P66 Refrigerator", "GN20-S01-Generator", "VMS13 ...")
    m = re.match(r'\s*([A-Z]{1,3}\d{1,4}a?)\b', str(desc))
    return m.group(1).rstrip('a') if m else None
def near(a, b):   # one keying slip apart: a digit changed, dropped or two swapped
    if a == b: return False
    if len(a) == len(b): return sum(x != y for x, y in zip(a, b)) == 1 or (sorted(a) == sorted(b) and sum(x != y for x, y in zip(a, b)) == 2)
    s, l = sorted((a, b), key=len)
    return len(l) - len(s) == 1 and any(l[:i] + l[i + 1:] == s for i in range(len(l)))

numbers, out_rows = [], []
DOCKETED = {str(d['Fleet item']).strip() for d in DOCKETS}   # a number on its own docket is accounted for, never a slip candidate
for d in DOCKETS:
    fi, desc = str(d['Fleet item']).strip(), str(d['Description'])
    when = dt.date.fromisoformat(str(d['Date Delivery'])[:10])
    row = {'docket': d['Delivery Docket'], 'contract': d['Hire Agreement'], 'date': str(when), 'direction': d['Direction'], 'number': fi, 'description': desc[:60]}
    out_rows.append((row, when))
    if not re.fullmatch(r'\d{5,8}', fi): continue
    on = sorted(held.get(fi, []))
    dr = dref(desc)
    if on:
        refs = sorted({r for r, _ in on})
        k_docket, k_ours = kind(desc), {kind(t) for _, t in on} - {None}
        if dr and REF.match(dr) and dr not in refs and not dr.startswith('VMS') and not (dr == 'GN20'):
            numbers.append(dict(row, finding='on our record under another reference', ours=', '.join(refs), who='Andrew'))
        elif k_docket and k_ours and k_docket not in k_ours and k_docket != 'board':
            numbers.append(dict(row, finding=f'our record calls it {"/".join(sorted(t for _, t in on))[:40]}; the docket says {k_docket}', ours=', '.join(refs), who='Our record'))
        continue
    slips = sorted({(n, r) for n, refs in held.items() for r, t in refs if (r == dr or not dr) and near(n, fi) and (kind(t) in (None, kind(desc))) and n not in DOCKETED})
    if slips:
        numbers.append(dict(row, finding='keying slip: our record has ' + ', '.join(f'{n} on {r}' for n, r in slips), ours=', '.join(sorted({r for _, r in slips})), who='Our record'))
    elif fi == '1276701':   # Andrew, 22 and 25 Oct 2026: "this never came to site 1276701 Generator 365kVA Diesel"
        numbers.append(dict(row, finding='never came to site (Andrew, 22 and 25 Oct): the docket is wrong; the branch reverses it and closes line 6', ours='GN20', who='Baseplan'))
    elif dr in deleted:
        numbers.append(dict(row, finding=f'{dr} was taken off our record: ' + deleted[dr][:200], ours=dr, who='Andrew'))
    else:
        numbers.append(dict(row, finding='not on our record', ours=dr or '', who='Andrew'))

# one number on two references
twice = []
for n, refs in held.items():
    rs = sorted({r for r, _ in refs})
    if re.fullmatch(r'\d{5,8}', n) and len(rs) > 1:
        twice.append({'number': n, 'references': rs, 'what': sorted({t for _, t in refs})[:3]})

# arrivals: the earliest docket out for a reference's own numbers against our first on-site stamp
first_out = collections.defaultdict(list)
for row, when in out_rows:
    if row['direction'] != 'Out' or not re.fullmatch(r'\d{5,8}', row['number']): continue
    for r, _ in held.get(row['number'], []):
        if r in R and not r.startswith(('WB', 'VMS')) and R[r]['discipline'] != 'Variable message signs': first_out[r].append((when, row['docket'], row['number']))
arrivals = []
for r, L in sorted(first_out.items()):
    when, dk, n = min(L); ours = aest(R[r]['first_on_site'])
    days = (ours - when).days if ours else None
    verdict = ('no arrival on our record' if ours is None else 'same day' if days == 0 else
               f'docket closed {-days} day(s) after ours' if days < 0 else f'docket {days} day(s) before ours')
    arrivals.append({'reference': r, 'discipline': R[r]['discipline'], 'ours': str(ours) if ours else None, 'docket_date': str(when), 'docket': dk, 'number': n,
                     'days_ours_minus_docket': days, 'verdict': verdict, 'charged_from_arrival': R[r]['discipline'] in CHARGED_FROM_ARRIVAL})

# water barriers share one item code: match each barrier docket to the reference that went in that day
wb_refs = {r: aest(x['first_on_site']) for r, x in R.items() if r.startswith('WB')}
barriers = []
for row, when in out_rows:
    if 'barrier' in row['description'].lower() and row['direction'] == 'Out':
        same = sorted(r for r, d in wb_refs.items() if d == when)
        barriers.append(dict(row, ours_same_day=same))
wb_unmatched = sorted(r for r, d in wb_refs.items() if d and d not in {w for _, w in out_rows if True} and not any(b['date'] == str(d) for b in barriers))

# VMS boards: our model's day against the docket naming the board (by number, or "VMSnn" on a sub-hire)
pos = {p.get('board'): p for p in V['positions']}
vms = []
for b in V['boards913']:
    on = b.get('on') or {}
    ours = aest(on.get('said') if on.get('src') == 'word' else on.get('at')) if on.get('on') else aest(((pos.get(b['name']) or {}).get('arrival') or {}).get('effective_date'))
    ds = sorted(w for row, w in out_rows if row['direction'] == 'Out' and ((b['asset'] and row['number'] == b['asset']) or re.match(rf"{b['name']}a?\b", row['description'])))
    ins = sorted(w for row, w in out_rows if row['direction'] == 'In' and b['asset'] and row['number'] == b['asset'])
    if ds or ins:
        vms.append({'board': b['name'], 'number': b['asset'], 'ours': str(ours) if ours else None, 'dockets_out': [str(x) for x in ds], 'dockets_in': [str(x) for x in ins],
                    'days_ours_minus_first_out': (ours - ds[0]).days if ours and ds else None})

# names only: the docket's label and our reference differ, the number is the same thing (settled in earlier reviews)
NAMING = {'LT01': 'the towers sit on T0002 on our record (Molendinar council yard, 11 Sep)', 'LT02': 'as LT01', 'LT03': 'as LT01', 'LT04': 'as LT01', 'LT05': 'the tower pod sits under another reference on our record',
          'GN26': 'the concert sets sit under their own references on our record', 'GN27': 'as GN26', 'P36': 'our record has this shell as HRP (22 Oct review: line 93 is HRP, not P36)',
          'P44': 'our record has this shell as P58 (22 Oct review: line 59 is P58, not P44)'}
for x in numbers:
    dr = dref(x['description'])
    if x['finding'] == 'on our record under another reference' and dr in NAMING: x.update(finding='name only: ' + NAMING[dr], who='nobody')
    elif x['finding'] == 'on our record under another reference' and kind(x['description']) == 'toilet':
        x.update(finding=f"placed at {x['ours']} on our record; the docket names {dr} (where it was meant to go)", who='nobody')
KNOWN_ARRIVAL = {'T0002': 'known: the towers went to the Molendinar council yard on 11 Sep, not to site (15 Oct review)',
                 'T0024': "a team reference on its own hire schedule (held out of every charge)"}
for a in arrivals:
    if a['reference'] in KNOWN_ARRIVAL: a['verdict'] = KNOWN_ARRIVAL[a['reference']]; a['charged_from_arrival'] = False; a['known'] = True

# one flat table for the workbook, most useful first
sheet = []
for x in numbers:
    sheet.append(['Number', x['ours'], x['docket'], x['date'], x['number'], x['description'], None, None, x['finding'], x['who'], 'no'])
for x in twice:
    sheet.append(['Number on two references', ', '.join(x['references']), None, None, x['number'], ' / '.join(x['what']), None, None, 'one number, two references on our record: keep the one it is on', 'Our record', 'no'])
for a in sorted(arrivals, key=lambda a: (-(a['days_ours_minus_docket'] or 0) if a['ours'] else -999, a['reference'])):
    if a['verdict'] == 'same day' or a['verdict'].startswith('docket closed'): continue
    sheet.append(['Arrival', a['reference'], a['docket'], a['docket_date'], a['number'], a['discipline'], a['ours'], a['days_ours_minus_docket'], a['verdict'],
                  'nobody' if a.get('known') else 'Andrew' if a['charged_from_arrival'] or a['ours'] is None else 'Our record', 'yes' if a['charged_from_arrival'] else 'no (charged over the event)'])
for b in barriers:
    if not b['ours_same_day']:
        sheet.append(['Barrier arrival', 'no barrier reference went in that day', b['docket'], b['date'], b['number'], b['description'], None, None,
                      'a barrier docket with no matching day on our record (WB03 went in 23 Sep on ours; Baseplan has 18 Sep)', 'Andrew', 'yes'])
for v in vms:
    if v['days_ours_minus_first_out'] and v['days_ours_minus_first_out'] > 0:
        sheet.append(['VMS arrival', v['board'], None, v['dockets_out'][0], v['number'], 'Variable message board', v['ours'], v['days_ours_minus_first_out'],
                      f"docket out {', '.join(v['dockets_out'])}" + (f"; in {', '.join(v['dockets_in'])}" if v['dockets_in'] else ''), 'Andrew', 'yes'])
agree = {'same day': sum(1 for a in arrivals if a['verdict'] == 'same day'), 'docket closed after ours': sum(1 for a in arrivals if a['verdict'].startswith('docket closed')),
         'barriers matched by day': sum(1 for b in barriers if b['ours_same_day']), 'vms agree or docket later': sum(1 for v in vms if (v['days_ours_minus_first_out'] or 0) <= 0)}
out = {'source': 'Baseplan (7) Delivery Dockets, 258 rows; live record 10816', 'agree': agree, 'sheet': sheet, 'numbers': numbers, 'on_two_references': twice,
       'arrivals': arrivals, 'barriers': barriers, 'vms': vms}
(HERE / 'evidence' / 'arrivals_check.json').write_text(json.dumps(out, indent=1, default=str))
c = collections.Counter(a['verdict'].split(' (')[0].split(' day')[0] if 'day' in a['verdict'] else a['verdict'] for a in arrivals)
print(json.dumps({'numbers': collections.Counter(x['finding'].split(':')[0][:40] for x in numbers), 'twice': len(twice), 'arrivals': len(arrivals),
                  'docket_before_ours': [(a['reference'], a['days_ours_minus_docket']) for a in arrivals if (a['days_ours_minus_docket'] or 0) > 0],
                  'no_arrival': [a['reference'] for a in arrivals if a['ours'] is None],
                  'vms_diff': [(v['board'], v['days_ours_minus_first_out']) for v in vms if v['days_ours_minus_first_out']]}, default=str))
