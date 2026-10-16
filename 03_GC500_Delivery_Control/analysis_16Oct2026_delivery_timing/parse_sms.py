#!/usr/bin/env python3
"""Author: Andrew Fisher. Coates delivery texts (SMS export, conversation 'Coates') -> one row per delivery order:
booked, window changes, on its way, delivered or failed, with times. Read only; nothing goes to the record.
   python3 parse_sms.py sms.txt out.json"""
import re, sys, json
from datetime import datetime, timedelta
from collections import defaultdict

txt = open(sys.argv[1], encoding='utf-8').read()
# each message starts with "Received   16 Oct 2026   Coates   <content>" then the time on the next line
blocks = re.split(r'\n\s*(?=(?:Received|Sent)\s+\d{1,2} \w{3} \d{4}\s+Coates)', '\n' + txt)
msgs = []
for b in blocks:
    m = re.match(r'\s*(Received|Sent)\s+(\d{1,2} \w{3} \d{4})\s+Coates\s+(.*)', b, re.S)
    if not m: continue
    body = m.group(3)
    tm = re.search(r'\n\s*(\d{1,2}:\d{2}:\d{2} [ap]m)', body)
    if not tm: continue
    when = datetime.strptime(m.group(2) + ' ' + tm.group(1), '%d %b %Y %I:%M:%S %p')
    # content: strip the time and the layout indentation
    lines = [l for l in body.split('\n')]
    text = ' '.join(re.sub(r'^\s*\d{1,2}:\d{2}:\d{2} [ap]m', '', l).strip() for l in lines).strip()
    text = re.sub(r'\s+', ' ', text)
    msgs.append({'at': when, 'text': text})
msgs.sort(key=lambda x: x['at'])

def norm(s): return re.sub(r'\s+', ' ', s).strip()
ev = []
for m in msgs:
    t = m['text']
    a = re.search(r'order to deliver (.+?) to ([A-Z ]+?) on (\d{1,2} \w{3}) between (\d{2}:\d{2}) - (\d{2}:\d{2})', t)
    if a:
        d = datetime.strptime(a.group(3) + ' 2026', '%d %b %Y').date()
        ev.append({'kind': 'booked', 'item': norm(a.group(1)), 'site': a.group(2).strip(), 'day': d, 'w0': a.group(4), 'w1': a.group(5), 'at': m['at']}); continue
    a = re.search(r'order for (.+?) to ([A-Z ]+?) is on its way', t)
    if a: ev.append({'kind': 'onway', 'item': norm(a.group(1)), 'site': a.group(2).strip(), 'at': m['at']}); continue
    a = re.search(r'Your (.+?) from Coates has been delivered to ([A-Z ]+?)\.', t)
    if a: ev.append({'kind': 'delivered', 'item': norm(a.group(1)), 'site': a.group(2).strip(), 'at': m['at']}); continue
    a = re.search(r'Your (.+?) from Coates could not be delivered', t)
    if a: ev.append({'kind': 'failed', 'item': norm(a.group(1)), 'site': '', 'at': m['at']}); continue
    ev.append({'kind': 'other', 'item': '', 'site': '', 'at': m['at'], 'text': t[:120]})

# orders: bookings grouped by (item, site, day); a later booking with the same item/site/day revises the window
orders = []
for e in [x for x in ev if x['kind'] == 'booked']:
    same = [o for o in orders if o['item'] == e['item'] and o['site'] == e['site'] and o['day'] == e['day'] and not o.get('closed')]
    # same item, day and an identical first window -> a duplicate text; a different window -> a revision of the open order
    if same:
        o = same[0]
        o['texts'] += 1
        if (e['w0'], e['w1']) != o['windows'][-1][:2]:
            # two different orders of the same item on the same day are told apart by window start when both stay 3 h
            o['windows'].append((e['w0'], e['w1'], e['at']))
    else:
        orders.append({'item': e['item'], 'site': e['site'], 'day': e['day'], 'windows': [(e['w0'], e['w1'], e['at'])], 'booked_at': e['at'], 'texts': 1})

def dt(day, hhmm): return datetime.combine(day, datetime.strptime(hhmm, '%H:%M').time())
used = set()
def take(kind, o, before=None, after=None):
    c = [(i, x) for i, x in enumerate(ev) if x['kind'] == kind and i not in used and x['item'] == o['item'] and (not x['site'] or x['site'] == o['site'])
         and x['at'].date() == o['day'] and (before is None or x['at'] <= before) and (after is None or x['at'] >= after)]
    if not c: return None
    i, x = c[0]; used.add(i); return x
for o in sorted(orders, key=lambda o: (o['day'], o['windows'][0][0])):
    d = take('delivered', o) or None
    f = None if d else take('failed', o)
    w = take('onway', o, before=(d or f or {'at': None})['at'] if (d or f) else None)
    o['delivered_at'] = d['at'] if d else None; o['failed_at'] = f['at'] if f else None; o['onway_at'] = w['at'] if w else None

# two or more units of the same item on the same day: a delivery left over joins a copy of that day's order
for i, x in enumerate(ev):
    if x['kind'] not in ('delivered', 'failed') or i in used: continue
    base = [o for o in orders if o['item'] == x['item'] and (not x['site'] or o['site'] == x['site']) and o['day'] == x['at'].date()]
    if not base: continue
    o = dict(base[0]); o['windows'] = list(base[0]['windows']); o['unit_of_same_order'] = True
    used.add(i); o['delivered_at'] = x['at'] if x['kind'] == 'delivered' else None; o['failed_at'] = x['at'] if x['kind'] == 'failed' else None
    w = take('onway', o, before=x['at']); o['onway_at'] = w['at'] if w else None
    orders.append(o)
rows = []
for o in sorted(orders, key=lambda o: (o['day'], o['windows'][0][0], o['item'])):
    first, last = o['windows'][0], o['windows'][-1]
    fs, fe, ls, le = dt(o['day'], first[0]), dt(o['day'], first[1]), dt(o['day'], last[0]), dt(o['day'], last[1])
    da = o['delivered_at']
    def mins(a, b): return round((a - b).total_seconds() / 60)
    r = {'day': o['day'].isoformat(), 'item': o['item'], 'site': o['site'], 'ref': (re.match(r'^(WC\d+|Wc\d+|P\d+)\b', o['item']) or [None])[0],
         'booked_at': o['booked_at'].isoformat(timespec='minutes'), 'first_window': first[0] + '-' + first[1], 'final_window': last[0] + '-' + last[1],
         'window_changes': len(o['windows']) - 1, 'first_window_h': round((fe - fs).total_seconds() / 3600, 1), 'final_window_h': round((le - ls).total_seconds() / 3600, 1),
         'onway_at': o['onway_at'].isoformat(timespec='minutes') if o['onway_at'] else None,
         'delivered_at': da.isoformat(timespec='minutes') if da else None, 'failed_at': o['failed_at'].isoformat(timespec='minutes') if o['failed_at'] else None,
         'lead_h': round((da - o['booked_at']).total_seconds() / 3600, 1) if da else None,
         'onway_to_delivered_min': mins(da, o['onway_at']) if da and o['onway_at'] else None,
         'in_first_window': (fs <= da <= fe) if da else None, 'in_final_window': (ls <= da <= le) if da else None,
         'late_vs_first_min': max(0, mins(da, fe)) if da else None, 'early_vs_first_min': max(0, mins(fs, da)) if da else None}
    rows.append(r)
left = [ {'kind': x['kind'], 'item': x['item'], 'at': x['at'].isoformat(timespec='minutes')} for i, x in enumerate(ev) if x['kind'] in ('delivered', 'failed', 'onway') and i not in used]
other = [x for x in ev if x['kind'] == 'other']
json.dump({'messages': len(msgs), 'first': msgs[0]['at'].isoformat(), 'last': msgs[-1]['at'].isoformat(), 'orders': rows, 'unmatched': left,
           'other': [{'at': x['at'].isoformat(), 'text': x['text']} for x in other]}, open(sys.argv[2], 'w'), indent=1, default=str)
print(len(msgs), 'messages', msgs[0]['at'], '->', msgs[-1]['at'], '|', len(rows), 'orders |', len(left), 'unmatched events |', len(other), 'other')
