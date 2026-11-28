"""Store-wide rental movements for day and night shifts, in Queensland local time."""
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal, InvalidOperation

from qr_facts import event_key, rental_transactions, text
from utilisation import stamp


HALF_HOUR = timedelta(minutes=30)
SHIFT = timedelta(hours=12)
SECOND = timedelta(seconds=1)
REQUIRED = {'TRANSACTION_ID', 'SKU/ITEM_NUMBER', 'PRODUCT_CATEGORY', 'QUANTITY',
            'TRAN_START_DATE', 'TRAN_START_TIME', 'TRAN_END_DATE', 'TRAN_END_TIME'}


def iso(value):
    return value.isoformat(timespec='seconds') if value else ''


def intervals(windows):
    """Combine touching or overlapping half-open intervals."""
    combined = []
    for a, b in sorted(windows, key=lambda pair: (pair[0], pair[1])):
        if b <= a:
            continue
        if combined and combined[-1][1] >= a:
            combined[-1] = (combined[-1][0], max(combined[-1][1], b))
        else:
            combined.append((a, b))
    return combined


def read_movements(rows):
    # SiteIQ's no-charge and customer-equipment tabs can repeat the same hire.
    facts = {}
    disputed = set()
    skipped = 0
    for row in rows:
        if text(row.get('PRODUCT_CATEGORY')).casefold() != 'rental':
            continue
        transaction, asset = text(row.get('TRANSACTION_ID')), text(row.get('SKU/ITEM_NUMBER'))
        if not transaction or not asset:
            skipped += 1
            continue
        key = event_key(transaction, asset)
        try:
            quantity = Decimal(text(row.get('QUANTITY')))
        except InvalidOperation:
            quantity = Decimal('NaN')
        if not quantity.is_finite() or quantity <= 0 or quantity != quantity.to_integral_value():
            disputed.add(key)
            continue
        issued = stamp(row.get('TRAN_START_DATE'), row.get('TRAN_START_TIME'))
        returned = stamp(row.get('TRAN_END_DATE'), row.get('TRAN_END_TIME'))
        if issued and returned and returned < issued:
            disputed.add(key)
            continue
        if not issued and not returned:
            disputed.add(key)
            continue
        # An incomplete clock cannot support that endpoint. The opposite,
        # independently timestamped movement is still useful.
        fact = [iso(issued), iso(returned), int(quantity)]
        if key in facts and facts[key] != fact:
            disputed.add(key)
        facts[key] = fact
    for key in disputed:
        facts.pop(key, None)
    return facts, disputed, skipped + len(disputed)


def snapshot(path, reference, schedule, prior=None):
    history = prior if (prior and prior.get('version') == 1 and prior.get('schedule') == schedule) else {}
    previous = history.get('rentals', {})
    windows = history.get('windows', [])
    pulled = reference.get('requested')
    period = reference.get('period')
    reason = ''
    if not path or not pulled or not period or reference.get('schedule') != schedule:
        reason = 'A dated Transactions export for this MMG shutdown is unavailable.'
    elif reference.get('scoped'):
        reason = 'The latest Transactions export has a customer, contractor, hirer or store filter.'
    elif history and iso(pulled) < history['as_at']:
        reason = 'The latest supplied Transactions file predates the saved movement coverage.'
    else:
        low, high = iso(period[0]), iso(min(period[1], pulled) + SECOND)
        if high <= low:
            reason = 'The Transactions export window has no elapsed time.'
        else:
            try:
                facts, disputed, excluded = read_movements(rental_transactions(path, required=REQUIRED))
            except ValueError as exc:
                reason = str(exc)
            else:
                # Replace data inside the refreshed reporting window. Keep
                # unrelated earlier windows. A corrected key supersedes its old
                # endpoints, even when the corrected movement changes shift.
                merged = {}
                for key, (issued, returned, count) in previous.items():
                    if key in facts or key in disputed:
                        continue
                    # This export selects by hire start. An older hire may
                    # return within the refreshed period without being selected.
                    if not (issued and low <= issued < high):
                        merged[key] = [issued, returned, count]
                for key, (issued, returned, count) in facts.items():
                    # The range selects hires. A hire may have a real timed
                    # return outside that range by the pull. Keep the point
                    # without turning neighbouring unobserved bins into zeros.
                    kept = [s if s and s <= iso(pulled) else '' for s in (issued, returned)]
                    if any(kept):
                        merged[key] = [*kept, count]
                return {'version': 1, 'schedule': schedule, 'as_at': iso(pulled),
                        'windows': intervals([*windows, (low, high)]), 'rentals': merged,
                        'excluded': excluded}, ''
    return history, reason


def _coverage(start, end, windows):
    spans = [(max(a, start), min(b, end)) for a, b in windows if a < end and b > start]
    return {'covered_start': iso(spans[0][0]) if spans else '', 'covered_end': iso(spans[-1][1]) if spans else '',
            'covered_minutes': round(sum((b-a).total_seconds() for a, b in spans)/60, 3),
            'covered_intervals': [{'start': iso(a), 'end': iso(b)} for a, b in spans]}


def report(history, arrival, departure, as_of, reason=''):
    result = {'as_at': history.get('as_at', ''), 'start':'', 'end':'', 'reason': reason,
              'excluded': history.get('excluded', 0), 'shifts': []}
    if not history or not arrival or not as_of:
        return result
    first_date = date.fromisoformat(arrival)
    last_date = min(date.fromisoformat(departure) if departure else as_of.date(),
                    (as_of - timedelta(hours=6)).date())
    lo = datetime.combine(first_date, time())
    hi = min(as_of + SECOND, datetime.combine(last_date + timedelta(days=1), time(6)))
    windows = intervals((max(lo, datetime.fromisoformat(a)), min(hi, datetime.fromisoformat(b)))
                        for a, b in history['windows'])
    if not windows:
        result['reason'] = reason or 'No rental movement coverage overlaps the shutdown dates.'
        return result
    result.update(start=iso(windows[0][0]), end=iso(windows[-1][1]))
    at_shift = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    for issued, returned, count in history['rentals'].values():
        for i, raw in enumerate((issued, returned)):
            if not raw:
                continue
            when = datetime.fromisoformat(raw)
            if not lo <= when < hi:
                continue
            key = ((when - timedelta(hours=6)).date(), 'Day' if 6 <= when.hour < 18 else 'Night')
            at_shift[key][when][i] += count
    # Include an arrival-morning movement on the preceding night shift if the
    # source covers it, keeping midnight on the shift that actually started it.
    day = min([first_date, (windows[0][0]-timedelta(hours=6)).date(),
               *(shift_date for shift_date, _ in at_shift)])
    while day <= last_date:
        for shift, hour in [('Day', 6), ('Night', 18)]:
            start = datetime.combine(day, time(hour))
            end = start + SHIFT
            if end <= lo:
                continue
            coverage = _coverage(start, end, windows)
            events = sorted(at_shift[day, shift].items())
            bins = []
            for idx in range(24):
                clock = start + HALF_HOUR * idx
                part = _coverage(clock, clock + HALF_HOUR, windows)
                empty = 0 if part['covered_start'] else None
                bins.append({'start': iso(clock), 'end': iso(clock+HALF_HOUR), **part, 'issued': empty, 'returned': empty})
            recorded = []
            endpoints = {'issued':[], 'returned':[]}
            for at, counts in events:
                bucket = bins[(at-start)//HALF_HOUR]
                for field, count in zip(('issued','returned'), counts):
                    if count:
                        bucket[field] = (bucket[field] or 0) + count
                        endpoints[field].append(at)
                recorded.append({'at': iso(at), 'issued': counts[0], 'returned': counts[1]})
            entry = {'day': day.isoformat(), 'shift':shift, 'start':iso(start), 'end':iso(end),
                     **coverage, 'first':iso(events[0][0]) if events else '',
                     'last':iso(events[-1][0]) if events else '', 'bins':bins, 'events':recorded}
            for field, times in endpoints.items():
                entry[field] = sum(b[field] or 0 for b in bins) if coverage['covered_start'] or times else None
                entry['first_'+field] = iso(times[0]) if times else ''
                entry['last_'+field] = iso(times[-1]) if times else ''
            result['shifts'].append(entry)
        day += timedelta(days=1)
    return result
