"""Private MMG report projection. Only the returned fields may leave this module."""
import datetime as dt
import hashlib
import json
import math
from collections import Counter, defaultdict
from functools import lru_cache
from pathlib import Path

from upload_policy import MMG_PROJECT, MMG_SCHEDULE


@lru_cache(maxsize=12)
def _load(path, revision):
    with path.open(encoding='utf-8') as f:
        return json.load(f)


def _json(path):
    stat = path.stat()
    return _load(path, (stat.st_ino, stat.st_mtime_ns, stat.st_size))


def _facts(data_dir):
    data = _json(Path(data_dir) / 'qr-report-data.json')
    if data.get('project') != MMG_PROJECT or data.get('schedule') != MMG_SCHEDULE or data.get('schema') != 1:
        raise ValueError('MMG report data is unavailable.')
    return data


def _directory(data):
    names = {r['company'] for field in ('hires', 'draws', 'movements') for r in data[field] if r.get('company')}
    directory = {}
    for name in sorted(names, key=str.casefold):
        key = hashlib.sha256((data['schedule'] + '\0' + name).encode()).hexdigest()[:32]
        if key in directory:
            raise ValueError('Company directory is unavailable.')
        directory[key] = name
    return directory


def companies(data_dir):
    return {'companies': [{'id': key, 'name': name} for key, name in _directory(_facts(data_dir)).items()]}


def _hires(records):
    by_type = defaultdict(list)
    for r in records:
        by_type[r['name']].append({k: r[k] for k in ('item', 'date', 'time')})
    return [{'name': name, 'count': len(items), 'items': sorted(items, key=lambda r: r['item'])}
            for name, items in sorted(by_type.items(), key=lambda p: p[0].casefold())]


def company(data_dir, company_id):
    data = _facts(data_dir)
    name = _directory(data).get(company_id) if isinstance(company_id, str) else None
    if not name:
        return None
    hires = _hires(r for r in data['hires'] if r['company'] == name)
    return {'kind': 'company', 'name': name, 'company': name, 'asat': data['asat'], 'hires': hires,
            'hire_count': sum(g['count'] for g in hires)}


def _pairs(person):
    return {(r['hirer'], r['company']) for r in [person, *person.get('aliases', [])]
            if isinstance(r, dict) and isinstance(r.get('hirer'), str) and r['hirer']
            and isinstance(r.get('company'), str) and r['company']}


def _identity(data_dir, barcode):
    if not isinstance(barcode, str) or not 1 <= len(barcode) <= 256:
        return None
    try:
        roster = _json(Path(data_dir) / 'qr-identities.json')
    except FileNotFoundError:
        return None
    if roster.get('schedule') != MMG_SCHEDULE or not isinstance(roster.get('people'), list):
        return None
    if barcode in roster.get('blocked_barcodes', []):
        return None
    matches = []
    for person in roster['people']:
        if not isinstance(person, dict):
            return None
        aliases = person.get('barcodes', [])
        if not isinstance(aliases, list) or any(not isinstance(b, str) for b in aliases):
            return None
        if barcode == person.get('barcode') or barcode in aliases:
            matches.append(person)
    if len(matches) != 1 or matches[0].get('active') is False:
        return None
    who = matches[0]
    pairs = _pairs(who)
    if not pairs or not who.get('name') or any(_pairs(other) & pairs for other in roster['people'] if other is not who):
        return None
    return who, roster['people']


def _matches(fact, who, pairs):
    return (fact['hirer'], fact['employer']) in pairs and (
        not fact.get('hirer_id') or not who.get('hirer_id') or fact['hirer_id'] == who['hirer_id'])


def _scope(data, who):
    pairs = _pairs(who)
    ids = {w['hirer_id'] for w in data.get('workers', [])
           if (w['hirer'], w['employer']) in pairs and w.get('hirer_id')}
    if len(ids) > 1 or who.get('hirer_id') and ids and who['hirer_id'] not in ids:
        return None
    return {field: [r for r in data[field] if _matches(r, who, pairs)] for field in ('hires', 'movements', 'draws')}


def _instant(day, time):
    return day + ('T' + time if time else '') if day else ''


def _in_window(stamp, start, end):
    if not stamp or not start or not end:
        return False
    if len(stamp) == 10:
        return start <= stamp + 'T00:00:00' and stamp + 'T23:59:59' <= end
    return start <= stamp <= end


def _usage(draws, sales_asat, activity):
    quantities, returns, days = Counter(), Counter(), Counter()
    any_draw = set()
    for r in draws:
        name, qty, returned, day = r['name'], r['quantity'], r['returned'], r['date']
        quantities[name] += qty
        returns[name] += returned
        if qty and day and sales_asat and day <= sales_asat[:10]:
            activity[day]['consumable_units'] += qty
            days[day] += qty
            any_draw.add(day)
        return_date = r.get('return_date')
        if returned and return_date and sales_asat and return_date <= sales_asat[:10]:
            activity[return_date]['consumable_returns'] += returned
    def window_rate(first, last):
        dates = [d for d in any_draw if first <= d <= last]
        return round(sum(days[d] for d in dates) / len(dates), 2) if dates else None
    summary = dict(units=sum(quantities.values()), returned_units=sum(returns.values()), active_days=len(any_draw),
                   dated_units=sum(days.values()), units_per_draw_day=round(sum(days.values()) / len(any_draw), 2) if any_draw else None,
                   previous_units_per_draw_day=None, recent_units_per_draw_day=None)
    if sales_asat:
        today = dt.date.fromisoformat(sales_asat[:10])
        # Two equal three-calendar-day windows ending yesterday. A partial today cannot depress a rate.
        bounds = [(today-dt.timedelta(days=n)).isoformat() for n in (6, 4, 3, 1)]
        earlier, recent = window_rate(*bounds[:2]), window_rate(*bounds[2:])
        if earlier is not None and recent is not None:
            summary.update(previous_units_per_draw_day=earlier, recent_units_per_draw_day=recent,
                           previous_start=bounds[0], previous_end=bounds[1], recent_start=bounds[2], recent_end=bounds[3])
    lines = [{'name': n, 'quantity': quantities[n], 'returned': returns[n]}
             for n in sorted(quantities, key=lambda n: (-quantities[n], n.casefold()))]
    return lines, summary


def _periods(data):
    if 'transaction_periods' in data:
        return data['transaction_periods']
    return [{'start': data['period_start'], 'end': data['period_end']}] if data.get('period_start') else []


def _benchmark(data, records, who):
    method = ('Positive dated sales units per borrower in this period. High means above the 90th percentile '
              'of other recorded borrowers. At least ten comparators and two observed sale dates are required.')
    result = dict(status='insufficient', method=method, period_start='', period_end='', own_units=0,
                  reason='An adequately sized comparison for this period is unavailable.')
    if not data.get('sales_asat'):
        return result
    end = dt.date.fromisoformat(data['sales_asat'][:10]); start = end - dt.timedelta(days=6)
    result.update(period_start=start.isoformat(), period_end=end.isoformat())
    own_pairs = _pairs(who)
    peers, days = Counter(), set()
    for r in data['draws']:
        if not r['hirer'] or not r['employer'] or not result['period_start'] <= r['date'] <= result['period_end'] or r['quantity'] <= 0:
            continue
        days.add(r['date'])
        person = r['hirer'], r['employer']
        if person not in own_pairs:
            peers[person] += r['quantity']
    own = sum(r['quantity'] for r in records['draws'] if result['period_start'] <= r['date'] <= result['period_end'])
    result['own_units'] = own
    if len(peers) >= 10 and len(days) >= 2:
        threshold = sorted(peers.values())[math.ceil(0.9 * len(peers)) - 1]
        result.update(reason='', status='high' if own > threshold else 'within_range')
    return result


def _metrics(data, records):
    activity = defaultdict(lambda: dict(issued=0, returned=0, consumable_units=0, consumable_returns=0))
    issues = returned = eligible = same = 0
    due_recorded = due_assessed = returned_by_due = 0
    rentals = []
    for r in records['movements']:
        start, end = _instant(r['start'], r['start_time']), _instant(r['end'], r['end_time'])
        if not start or end and (r['end'] < r['start'] or r['end'] == r['start'] and r['start_time'] and r['end_time'] and end < start):
            continue
        intervals = _periods(data)
        start_window = next((i for i, p in enumerate(intervals) if _in_window(start, p['start'], p['end'])), None)
        end_window = next((i for i, p in enumerate(intervals) if _in_window(end, p['start'], p['end'])), None)
        inside_start, inside_end = start_window is not None, end_window is not None
        if inside_start:
            issues += 1
            activity[r['start']]['issued'] += 1
        if inside_end:
            returned += 1
            activity[r['end']]['returned'] += 1
        if inside_start and inside_end and start_window == end_window:
            eligible += 1
            same += int(r['start'] == r['end'])
        if inside_start or inside_end:
            if r.get('due'):
                due_recorded += 1
                if inside_end:
                    due_assessed += 1
                    returned_by_due += int(r['end'] <= r['due'])
            rentals.append(dict(name=r['name'], item=r['item'], issued_at=start, returned_at=end))
    score = None
    if eligible >= 5:
        # Integer half-up rounding of 1 + 4 × same-day share to the nearest half point.
        score = 1 + ((16 * same + eligible) // (2 * eligible)) / 2
    lines, usage = _usage(records['draws'], data.get('sales_asat', ''), activity)
    return {'activity': [dict(date=d, **activity[d]) for d in sorted(activity, reverse=True)],
            'rental_history': sorted(rentals, key=lambda r: r['issued_at'], reverse=True),
            'consumables': lines, 'consumable_summary': usage,
            'returns': dict(issues=issues, returned=returned, eligible=eligible, same_day=same, score=score,
                            method='1 + 4 × same-day share, rounded to the nearest half point. At least five completed hire records with both dates in the transaction period are needed.',
                            due_dates_available=bool(due_recorded), due_recorded=due_recorded,
                            due_assessed=due_assessed, returned_by_due=returned_by_due)}


def _history(data_dir, who, roster):
    history = []
    if not who.get('person_id'):
        return history
    linked = who.get('history', [])
    used = set()
    for link in linked:
        schedule = link.get('schedule')
        if not schedule or schedule == MMG_SCHEDULE or schedule in used:
            continue
        used.add(schedule)
        pairs = _pairs(link)
        if not pairs or any(_pairs(h) & pairs for p in roster if p is not who
                            for h in p.get('history', []) if h.get('schedule') == schedule):
            continue
        name = hashlib.sha256(schedule.encode()).hexdigest() + '.json'
        try:
            data = _json(Path(data_dir) / 'qr_history' / name)
        except FileNotFoundError:
            continue
        if data.get('project') != MMG_PROJECT or data.get('schedule') != schedule or data.get('schema') != 1:
            continue
        rows = _scope(data, link)
        if not rows or not any(rows.values()):
            continue
        stats = _metrics(data, rows)
        history.append(dict(schedule=schedule, activity_days=len(stats['activity']),
                            consumable_units=stats['consumable_summary']['units'],
                            **{key: stats['returns'][key] for key in ('issues','returned','same_day','eligible')}))
    return history


def personal(data_dir, exact_barcode):
    identity = _identity(data_dir, exact_barcode)
    if identity is None:
        return None
    who, registry = identity
    data = _facts(data_dir)
    records = _scope(data, who)
    if records is None:
        return None
    hires = _hires(records['hires'])
    metrics = _metrics(data, records)
    metrics['consumable_summary']['benchmark'] = _benchmark(data, records, who)
    coverage = {k: data[k] for k in ('sales_asat', 'transactions_asat', 'period_start', 'period_end')}
    coverage['transaction_periods'] = _periods(data)
    return dict(kind='person', name=who['name'], company=who['company'], asat=data['asat'], hires=hires,
                hire_count=sum(g['count'] for g in hires), coverage=coverage,
                history=_history(data_dir, who, registry), **metrics)
