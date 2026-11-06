#!/usr/bin/env python3
"""Author: Andrew Fisher. Summary of Coates delivery timing from parse_sms.py's output, plus the six deliveries booked
before the export begins (windows from Andrew's pasted list of 16 Oct; booking time unknown).
   python3 summarise.py orders.json report.json orders.csv"""
import json, sys, csv
from datetime import datetime
d = json.load(open(sys.argv[1]))
rows = [r for r in d['orders']]
def dt(s): return datetime.fromisoformat(s)
# booked before the export (first text 1 Oct 07:49): windows as Andrew pasted them, delivered/on-way times from the export
extra = [
 ('2026-10-01', 'Toilet Block 6.0M x 3.0M - Male/Female', '07:00', '10:00', '2026-10-01T08:59', '2026-10-01T13:09'),
 ('2026-10-06', 'Portable Building Shell 12.0M x 3.0M - Cycl', '06:00', '09:00', '2026-10-06T05:54', '2026-10-06T07:49'),
 ('2026-10-06', 'Portable Building Shell 12.0M x 3.0M - Cycl', '06:00', '09:00', '2026-10-06T06:09', '2026-10-06T08:09'),
 ('2026-10-06', 'P08 Portable Building Shell 6.0M x 3.0M + 1 items', '06:00', '09:00', '2026-10-06T05:49', '2026-10-06T08:14')]
left = {x['at'] for x in d['unmatched'] if x['kind'] == 'delivered'}
for day, item, a, b, way, dl in extra:
    if dl not in left: continue  # the export now holds its booking
    fs, fe, da = dt(day + 'T' + a), dt(day + 'T' + b), dt(dl)
    rows.append({'day': day, 'item': item, 'site': 'MAIN BEACH', 'ref': item.split()[0] if item[:1] in 'PW' and item.split()[0][1:2].isdigit() else None,
      'booked_at': None, 'first_window': a + '-' + b, 'final_window': a + '-' + b, 'window_changes': None, 'first_window_h': 3.0, 'final_window_h': 3.0,
      'onway_at': way, 'delivered_at': dl, 'failed_at': None, 'lead_h': None, 'onway_to_delivered_min': round((da - dt(way)).total_seconds() / 60),
      'in_first_window': fs <= da <= fe, 'in_final_window': fs <= da <= fe, 'late_vs_first_min': max(0, round((da - fe).total_seconds() / 60)),
      'early_vs_first_min': max(0, round((fs - da).total_seconds() / 60)), 'note': 'booked before the export; window from the pasted list'})
for r in rows:
    if r.get('no_booking'):
        r['result'] = 'no booking text'
    elif r['delivered_at'] and r.get('moved_day'):
        r['result'] = 'delivered a later day'
    elif r['delivered_at']:
        r['result'] = 'early' if r['early_vs_first_min'] else ('on time' if r['in_first_window'] else ('in revised window' if r['in_final_window'] else 'late'))
    else:
        r['result'] = 'failed' if r['failed_at'] else 'not yet due'
done = [r for r in rows if r['delivered_at'] and not r.get('no_booking')]
n = len(done)
c = {k: sum(1 for r in done if r['result'] == k) for k in ('on time', 'early', 'in revised window', 'late', 'delivered a later day')}
late = [r for r in done if r['late_vs_first_min'] or r.get('moved_day')]
rev = [r for r in rows if r['window_changes']]
lead = sorted(r['lead_h'] for r in done if r['lead_h'] is not None and r['booked_at'] and r['booked_at'] > '2026-10-01T08')
drive = sorted(r['onway_to_delivered_min'] for r in done if r['onway_to_delivered_min'] is not None)
med = lambda a: a[len(a) // 2] if a else None
byday = {}
for r in done:
    b = byday.setdefault(r['day'], {'n': 0, 'on_time': 0, 'late_min': 0})
    b['n'] += 1; b['on_time'] += r['result'] in ('on time', 'early'); b['late_min'] += r['late_vs_first_min'] or 0
rep = {'texts': d['messages'], 'span': [d['first'], d['last']], 'orders': len(rows), 'delivered': n, 'counts': c,
       'pct_first_window': round(100 * (c['on time'] + c['early']) / n, 1),
       'late': [{'day': r['day'], 'item': r['item'], 'window': r['first_window'], 'final': r['final_window'], 'delivered': r['delivered_at'][:16], 'late_min': r['late_vs_first_min'], 'result': r['result']} for r in sorted(late, key=lambda r: -(r['late_vs_first_min'] or 0))],
       'failed': [{'day': r['day'], 'item': r['item'], 'failed_at': r['failed_at'], 'delivered': r['delivered_at']} for r in rows if r.get('failed_at')],
       'no_booking_text': [r['item'] + ' ' + r['delivered_at'][:16] for r in rows if r.get('no_booking')],
       'no_delivered_text': [r['item'] + ' ' + r['day'] + ' ' + str(r['first_window']) for r in rows if not r['delivered_at'] and not r.get('failed_at') and r['day'] < '2026-10-17'],
       'window_revised': len(rev), 'widened': sum(1 for r in rev if r['final_window_h'] > r['first_window_h']),
       'lead_h_median': med(lead), 'lead_h_min': lead[0] if lead else None, 'lead_h_max': lead[-1] if lead else None,
       'onway_to_delivered_min_median': med(drive), 'onway_to_delivered_min_range': [drive[0], drive[-1]] if drive else None,
       'by_day': byday, 'not_yet_due': [r['item'] + ' ' + r['day'] + ' ' + str(r['first_window']) for r in rows if r['result'] == 'not yet due' and r['day'] > '2026-10-16']}
json.dump(rep, open(sys.argv[2], 'w'), indent=1)
with open(sys.argv[3], 'w', newline='') as f:
    k = ['day', 'item', 'ref', 'booked_at', 'first_window', 'final_window', 'window_changes', 'onway_at', 'delivered_at', 'failed_at', 'result', 'days_late', 'late_vs_first_min', 'early_vs_first_min', 'lead_h', 'onway_to_delivered_min', 'note']
    w = csv.DictWriter(f, fieldnames=k, extrasaction='ignore'); w.writeheader()
    for r in sorted(rows, key=lambda r: (r['day'], r['first_window'] or '99')): w.writerow(r)
print(json.dumps(rep, indent=1))
