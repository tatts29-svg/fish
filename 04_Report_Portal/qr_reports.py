"""Private MMG report projection. Only the returned fields may leave this module."""
import datetime as dt
import hashlib
import json
import math
from collections import Counter, defaultdict
from functools import lru_cache
from pathlib import Path

from upload_policy import MMG_PROJECT, MMG_SCHEDULE
from qr_identity import matched_pairs
from qr_store_activity import summarise as summarise_store_activity


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


SOURCES = ('hires', 'draws', 'movements')


def _archives(data_dir, current):
    """Only explicitly installed, schedule-addressed MMG Dugald River archives are eligible."""
    archives = []
    for path in (Path(data_dir) / 'qr_history').glob('*.json'):
        if len(path.stem) != 64 or any(c not in '0123456789abcdef' for c in path.stem):
            continue
        try:
            data = _json(path)
        except (FileNotFoundError, json.JSONDecodeError):
            continue
        if not isinstance(data, dict) or any(not isinstance(data.get(k), list) for k in SOURCES):
            continue
        schedule = data.get('schedule')
        if (data.get('project') != MMG_PROJECT or data.get('schema') != 1 or not isinstance(schedule, str)
                or not schedule or schedule == current['schedule'] or not data.get('asat') or data['asat'] > current['asat']
                or hashlib.sha256(schedule.encode()).hexdigest() != path.stem):
            continue
        archives.append(data)
    return sorted(archives, key=lambda archive: (archive.get('period_end', ''), archive['asat']), reverse=True)


def _company_employers(snapshot):
    names = defaultdict(set)
    for field in SOURCES:
        for r in snapshot[field]:
            employer = (r.get('employer') or '').strip().casefold()
            if r.get('company') and employer:
                names[r['company']].add(employer)
    return names


def _directory(data, archives):
    # The current job's employer spellings and approved display labels take
    # precedence. A renamed display label for the same raw entity is not a new
    # company. Never join a different legal employer on a display label alone.
    employers = _company_employers(data)
    known = set().union(*employers.values())
    for archive in archives:
        for name, raw in _company_employers(archive).items():
            unknown = raw - known
            if unknown and name not in employers:
                employers[name] = unknown
                known.update(unknown)
    directory = {}
    for name in sorted(employers, key=str.casefold):
        key = hashlib.sha256((data['schedule'] + '\0' + name).encode()).hexdigest()[:32]
        if key in directory:
            raise ValueError('Company directory is unavailable.')
        directory[key] = (name, employers[name])
    return directory


def companies(data_dir):
    data = _facts(data_dir)
    directory = _directory(data, _archives(data_dir, data))
    return {'companies': [{'id': key, 'name': name} for key, (name, _) in directory.items()]}


def _hires(records, assigned=None):
    by_type = defaultdict(list)
    for r in records:
        item = {k: r[k] for k in ('item', 'date', 'time')}
        if assigned is not None:
            item['holder'] = assigned.get(r['item'], (None, None))[0]
        by_type[r['name']].append(item)
    return [{'name': name, 'count': len(items), 'items': sorted(items, key=lambda r: r['item'])}
            for name, items in sorted(by_type.items(), key=lambda p: p[0].casefold())]


def company(data_dir, company_id):
    data = _facts(data_dir)
    archives = _archives(data_dir, data)
    directory = _directory(data, archives)
    selected = directory.get(company_id) if isinstance(company_id, str) else None
    if not selected:
        return None
    name, employers = selected
    records = {field: [r for r in data[field] if r.get('company') == name] for field in SOURCES}
    profiles = _record_profiles(records)
    assigned = _assigned_holders(records['hires'], profiles)
    hires = _hires(records['hires'], assigned)
    metrics = _metrics(data, records)
    story = [_story(data, records, metrics, current=True)]
    # A source employer shared by two display entities cannot establish historical continuity.
    unique_raw = {raw for raw in employers if sum(raw in other for _, other in directory.values()) == 1}
    for archive in archives:
        prior = {field: [r for r in archive[field] if r.get('employer', '').strip().casefold() in unique_raw]
                 for field in SOURCES}
        if any(prior.values()):
            story.append(_story(archive, prior, _metrics(archive, prior), current=False))
    return {'kind': 'company', 'name': name, 'company': name, 'asat': data['asat'], 'hires': hires,
            'hire_count': sum(g['count'] for g in hires), 'coverage': story[0]['coverage'], 'story': story,
            'return_rating': {k: metrics['returns'][k] for k in ('score', 'eligible', 'same_day')},
            'store_activity': _store_activity(data, records, profiles),
            'handover': _company_handover(data, records, metrics, assigned)}


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


def _scope(data, who, pairs=None):
    if pairs is None:
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
    if len(stamp) == 16:
        return start <= stamp + ':00' and stamp + ':59' <= end
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
    if data.get('period_start') and data.get('period_end'):
        return [{'start': data['period_start'], 'end': data['period_end']}]
    return []


def _benchmark(data, records, own_pairs):
    method = ('Positive dated sales units per borrower in this period. High means above the 90th percentile '
              'of other recorded borrowers. At least ten comparators and two observed sale dates are required.')
    result = dict(status='insufficient', method=method, period_start='', period_end='', own_units=0,
                  reason='An adequately sized comparison for this period is unavailable.')
    if not data.get('sales_asat'):
        return result
    end = dt.date.fromisoformat(data['sales_asat'][:10]); start = end - dt.timedelta(days=6)
    result.update(period_start=start.isoformat(), period_end=end.isoformat())
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


def _movement_times(row):
    start = _instant(row['start'], row['start_time'])
    end = _instant(row['end'], row['end_time'])
    if not start or (end and (row['end'] < row['start'] or (
            row['end'] == row['start'] and row['start_time'] and row['end_time'] and end < start))):
        return '', ''
    return start, end


def _metrics(data, records):
    activity = defaultdict(lambda: dict(issued=0, returned=0, consumable_units=0, consumable_returns=0))
    issues = returned = eligible = same = 0
    due_recorded = due_assessed = returned_by_due = 0
    rentals = []
    equipment = defaultdict(lambda: dict(issued=0, returned=0))
    for r in records['movements']:
        start, end = _movement_times(r)
        if not start:
            continue
        intervals = _periods(data)
        start_window = next((i for i, p in enumerate(intervals) if _in_window(start, p['start'], p['end'])), None)
        end_window = next((i for i, p in enumerate(intervals) if _in_window(end, p['start'], p['end'])), None)
        inside_start, inside_end = start_window is not None, end_window is not None
        if inside_start:
            issues += 1
            activity[r['start']]['issued'] += 1
            equipment[r['name']]['issued'] += 1
        if inside_end:
            returned += 1
            activity[r['end']]['returned'] += 1
            equipment[r['name']]['returned'] += 1
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
            'equipment': [dict(name=n, **totals) for n, totals in sorted(equipment.items(), key=lambda row: row[0].casefold())],
            'rental_history': sorted(rentals, key=lambda r: r['issued_at'], reverse=True),
            'consumables': lines, 'consumable_summary': usage,
            'returns': dict(issues=issues, returned=returned, eligible=eligible, same_day=same, score=score,
                            method='1 + 4 × same-day share, rounded to the nearest half point. At least five completed hire records with both dates in the transaction period are needed.',
                            due_dates_available=bool(due_recorded), due_recorded=due_recorded,
                            due_assessed=due_assessed, returned_by_due=returned_by_due)}


def _coverage(data):
    result = {k: data.get(k, '') for k in ('sales_asat', 'transactions_asat', 'period_start', 'period_end')}
    return dict(result, rental_asat=data['asat'], transaction_periods=_periods(data))


def _by_pull(stamp, pull):
    return not stamp or not pull or stamp[:len(pull)] <= pull


def _latest_return(data, metrics):
    intervals = _periods(data)
    returns = [r for r in metrics['rental_history'] if r['returned_at'] and
               _by_pull(r['returned_at'], data.get('transactions_asat')) and any(_in_window(r['returned_at'], p['start'], p['end']) for p in intervals)]
    receipt = None
    if returns:
        day = max(r['returned_at'][:10] for r in returns)
        same_day = [r for r in returns if r['returned_at'][:10] == day]
        latest = max(r['returned_at'] for r in same_day)
        # An undated clock on the last day prevents naming the last individual
        # receipt. Keep the actual recorded resolution and label the whole day.
        if any(len(r['returned_at']) == 10 for r in same_day):
            latest, precision = day, 'date'
        elif any(r['returned_at'] == latest[:16] for r in same_day):
            latest, precision = latest[:16], 'minute'
        else:
            precision = 'second'
        batch = sorted((r for r in same_day if r['returned_at'].startswith(latest)),
                       key=lambda r: (r['name'].casefold(), r['item']))
        receipt = dict(returned_at=latest, precision=precision, count=len(batch), items=batch)
    return receipt


def _datetime(value):
    if not value or len(value) <= 10:
        return None
    try:
        instant = dt.datetime.fromisoformat(value)
    except ValueError:
        return None
    if instant.tzinfo is not None:
        instant = instant.astimezone(dt.timezone(dt.timedelta(hours=10))).replace(tzinfo=None)
    return instant


def _completed_shift(data):
    # Export end is inclusive to the second. A shift is [06:00,18:00) or
    # [18:00,06:00) in Queensland. An overnight shift can span two files.
    snapshot_times = [_datetime(data.get(k)) for k in ('asat', 'transactions_asat')]
    cutoff = min((v for v in snapshot_times if v), default=None)
    if not cutoff:
        return None
    intervals = []
    for period in _periods(data):
        start, end = _datetime(period.get('start')), _datetime(period.get('end'))
        if start and end and start <= end:
            intervals.append((start, end + dt.timedelta(seconds=1)))
    merged = []
    for start, end in sorted(intervals):
        if merged and merged[-1][1] >= start:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    for start, end in reversed(merged):
        limit = min(cutoff, end)
        boundary = limit.replace(hour=18 if limit.hour >= 18 else 6, minute=0, second=0, microsecond=0)
        if boundary > limit:
            boundary -= dt.timedelta(hours=12)
        shift_start = boundary - dt.timedelta(hours=12)
        if start <= shift_start:
            return shift_start, boundary
    return None


def _shift_counts(data, movements):
    window = _completed_shift(data)
    if not window:
        return None
    start, end = window
    hours = [dict(start=(start + dt.timedelta(hours=h)).isoformat(timespec='minutes'),
                  issued=0, returned=0) for h in range(12)]
    for key in ('issued', 'returned'):
        for movement in movements:
            issued, returned = _movement_times(movement)
            value = issued if key == 'issued' else returned
            if not value:
                continue
            if len(value) == 10:
                # This event can't be assigned to either of the shifts that
                # touched its calendar date. Preserve unknown rather than zero.
                for hour in hours:
                    if hour['start'][:10] == value:
                        hour[key] = None
            else:
                stamp = _datetime(value)
                if stamp and start <= stamp < end:
                    bucket = hours[(stamp - start) // dt.timedelta(hours=1)]
                    if bucket[key] is not None:
                        bucket[key] += 1
    shift = dict(name='Day' if start.hour == 6 else 'Night', start=start.isoformat(timespec='minutes'),
                 end=end.isoformat(timespec='minutes'), hourly=hours)
    for key, peak in [('issued','peak_issue_hours'), ('returned','peak_return_hours')]:
        values = [h[key] for h in hours]
        shift[key] = None if None in values else sum(values)
        high = max(values) if shift[key] else None
        shift[peak] = [h['start'] for h in hours if high and h[key] == high]
    return shift


def _normal_holder(r):
    # Only the spaced SiteIQ given-name separator may disappear. A hyphen
    # inside a surname or the raw employer is significant.
    raw = ' '.join((r.get('hirer') or '').casefold().split()).replace(' - ', ' ')
    return (raw, ' '.join((r.get('employer') or '').casefold().split()))


def _record_profiles(records):
    # Only present the name explicitly recorded on a current hire. Other
    # scoped facts can disambiguate its profile, never supply a missing name.
    ids_for = defaultdict(set)
    names_for = defaultdict(set)
    for field in SOURCES:
        for row in records[field]:
            pair = _normal_holder(row)
            if row.get('hirer_id') and all(pair):
                profile = str(row['hirer_id'])
                ids_for[pair].add(profile)
                names_for[profile].add(pair[0])
    return ids_for, names_for


def _named_profile(row, profiles):
    pair = _normal_holder(row)
    name = pair[0]
    if not name or not any(c.isalpha() for c in name) or name in {
            'unknown', 'unassigned', 'n/a', 'store account'} or name.endswith(
                ('free issue', 'tool store consumables issue')):
        return None
    ids_for, names_for = profiles
    ids = {str(row['hirer_id'])} if row.get('hirer_id') else ids_for[pair]
    if len(ids) > 1 or any(len(names_for[i]) > 1 for i in ids):
        return None
    return ('profile', next(iter(ids))) if ids else ('name', *pair)


def _assigned_holders(hires, profiles):
    assigned = {}
    for row in hires:
        profile = _named_profile(row, profiles)
        if profile is not None:
            display = ' '.join(row['hirer'].split()).replace(' - ', ' ')
            assigned[row['item']] = display, profile
    return assigned


def _store_activity(data, records, profiles=None):
    # A private worker lookup already establishes one person across confirmed
    # source aliases. A company needs separate named profiles per minute.
    def profile(row):
        return _named_profile(row, profiles) if profiles is not None else 'selected worker'
    def loan(row):
        return row['item'], profile(row) or _normal_holder(row)

    periods = _periods(data)
    events = []
    open_issues = defaultdict(list)
    for row in records['movements']:
        start, end = _movement_times(row)
        for stamp in (start, end):
            if (stamp and _by_pull(stamp, data.get('transactions_asat')) and
                    any(_in_window(stamp, p['start'], p['end']) for p in periods)):
                events.append((profile(row), stamp))
                if stamp == start and not end:
                    open_issues[loan(row)].append(len(events) - 1)

    for row in records['hires']:
        stamp = _instant(row.get('date'), row.get('time'))
        if not _by_pull(stamp, data.get('asat')):
            continue
        # The inventory snapshot independently proves this issue. Keep it
        # once, including when its transaction lies after a 05:00 export cut.
        matches = []
        for idx in open_issues[loan(row)]:
            observed = events[idx][1]
            precision = min(len(stamp), len(observed), 16)
            if observed[:precision] == stamp[:precision]:
                matches.append(idx)
        if matches:
            if len(matches) == 1 and len(stamp) > len(events[matches[0]][1]):
                events[matches[0]] = profile(row), stamp
            continue
        events.append((profile(row), stamp))

    for row in records['draws']:
        for quantity, date, time in (('quantity','date','time'), ('returned','return_date','return_time')):
            stamp = _instant(row.get(date), row.get(time))
            if row.get(quantity, 0) > 0 and _by_pull(stamp, data.get('sales_asat')):
                events.append((profile(row), stamp))
    covered = bool(data.get('asat') or data.get('sales_asat') or periods)
    return summarise_store_activity(events, covered, personal=profiles is None)


def _oldest_holding(hires, movements, asat):
    if not hires or not asat or any(not r.get('date') for r in hires):
        return None
    earliest = min(r['date'] for r in hires)
    candidates = [r for r in hires if r['date'] == earliest]
    if earliest > asat[:10]:
        return None
    if any(not r.get('time') for r in candidates):
        if len(candidates) != 1:
            return None
        row = candidates[0]
        return dict(item=row['item'], name=row['name'], issued_at=earliest,
                    elapsed_minutes=None, tied_count=1)
    minute = min(r['time'][:5] for r in candidates)
    candidates = [r for r in candidates if r['time'][:5] == minute]
    stock_stamp = earliest + 'T' + minute
    stamp, snapshot = _datetime(stock_stamp), _datetime(asat)
    if not stamp or not snapshot or stamp > snapshot:
        return None
    # Validate seconds against the exact open asset, raw employer and named
    # hirer at its stock minute. Older snapshots may have minute precision only.
    by_item = defaultdict(list)
    for movement in movements:
        if movement.get('start') == earliest and not movement.get('end') and (
                movement.get('start_time') or '')[:5] == minute:
            by_item[movement['item']].append(movement)
    resolved = []
    for row in candidates:
        times = {r['start_time'] for r in by_item[row['item']] if _normal_holder(r) == _normal_holder(row)
                 and (not r.get('hirer_id') or not row.get('hirer_id') or r['hirer_id'] == row['hirer_id'])}
        precise = next(iter(times)) if len(times) == 1 else minute
        resolved.append((precise, row))
    if any(len(t) <= 5 for t, _ in resolved):
        resolved = [(minute, r) for _, r in resolved]
    first = min(t for t, _ in resolved)
    tied = [r for t, r in resolved if t == first]
    row = min(tied, key=lambda r: r['item'])
    return dict(item=row['item'], name=row['name'], issued_at=earliest + 'T' + first,
                elapsed_minutes=int((snapshot - stamp).total_seconds() // 60), tied_count=len(tied))


def _company_handover(data, records, metrics, assigned):
    asat = data.get('asat')
    oldest = _oldest_holding(records['hires'], records['movements'], asat)
    if oldest:
        oldest['holder'] = assigned.get(oldest['item'], (None, None))[0]
    return dict(current_holders=len({key for _, key in assigned.values()}) if asat else None,
                unassigned_assets=len(records['hires']) - len(assigned) if asat else None,
                oldest=oldest, shift=_shift_counts(data, records['movements']),
                latest_return=_latest_return(data, metrics))


def _story(data, records, stats, current):
    dates = [entry['date'] for entry in stats['activity']]
    return dict(schedule=data['schedule'], current=current, first_date=min(dates, default=''),
                last_date=max(dates, default=''), activity_days=len(dates), hire_count=len(records['hires']),
                coverage=_coverage(data), activity=stats['activity'], equipment=stats['equipment'],
                consumables=stats['consumables'], consumable_units=stats['consumable_summary']['units'],
                consumable_returns=stats['consumable_summary']['returned_units'],
                **{field: stats['returns'][field] for field in ('issues', 'returned', 'same_day', 'eligible')})


def _history(data_dir, who, roster, current):
    history = []
    if not who.get('person_id'):
        return history
    linked = who.get('history', [])
    if not linked:
        return history
    archives = {archive['schedule']: archive for archive in _archives(data_dir, current)}
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
        data = archives.get(schedule)
        if data is None:
            continue
        rows = _scope(data, link)
        if not rows or not any(rows.values()):
            continue
        stats = _metrics(data, rows)
        history.append(_story(data, rows, stats, current=False))
    return sorted(history, key=lambda s: (s['last_date'], s['coverage']['rental_asat']), reverse=True)


def personal(data_dir, exact_barcode):
    identity = _identity(data_dir, exact_barcode)
    if identity is None:
        return None
    who, registry = identity
    data = _facts(data_dir)
    pairs = matched_pairs(data, who, registry)
    if pairs is None:
        return None
    records = _scope(data, who, pairs)
    if records is None:
        return None
    hires = _hires(records['hires'])
    metrics = _metrics(data, records)
    metrics['consumable_summary']['benchmark'] = _benchmark(data, records, pairs)
    first = _story(data, records, metrics, current=True)
    history = _history(data_dir, who, registry, data)
    store = _store_activity(data, records)
    handover = dict(latest_return=_latest_return(data, metrics), last_activity_date=(store['last_at'] or '')[:10] or None)
    return dict(kind='person', name=who['name'], company=who['company'], asat=data['asat'], hires=hires,
                hire_count=sum(g['count'] for g in hires), coverage=first['coverage'],
                history=history, story=[first, *history], handover=handover, store_activity=store, **metrics)
