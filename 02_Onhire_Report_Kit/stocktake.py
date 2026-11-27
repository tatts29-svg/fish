"""Reconcile dated SiteIQ sightings with the current MMG asset and SKU registers."""
import datetime as dt
import json
from collections import Counter
from pathlib import Path

import openpyxl

import catalogue


# Exact SiteIQ PROJECT SCHEDULE spelling. Dates are Brisbane local time.
NOVEMBER_SCHEDULE = "MMG Shutdown Novermber26-December26"
NOVEMBER_ROUNDS = [
    {"label": "Opening stocktake", "start": "2026-11-22", "end": "2026-11-25"},
    {"label": "Closeout stocktake", "start": "2026-11-25", "end": "2026-12-03",
     "evidence_start": "2026-11-25", "evidence_end": "2026-12-03"},
]
COUNT_ACTIONS = {"stocktake", "stock take", "stock count", "physical count", "cycle count"}


def text(value):
    return str(value).strip() if value is not None else ""


def timestamp(value):
    if not isinstance(value, dt.datetime):
        raw = text(value)
        for fmt in ("%d/%m/%Y %I:%M %p", "%d/%m/%Y %I:%M:%S %p", "%d/%m/%Y %H:%M",
                    "%d/%m/%Y %H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"):
            try:
                value = dt.datetime.strptime(raw, fmt)
                break
            except ValueError:
                continue
        else:
            return ""
    return value.isoformat(timespec="seconds" if value.second or value.microsecond else "minutes")


def quantity(value):
    if isinstance(value, bool):
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return int(n) if n.is_integer() else None


def category(kind, name):
    if not name:
        return "Uncategorised"
    return catalogue.tool_category(name) if kind == "tool" else catalogue.cons_category(name)


def inventory(rental, stock):
    items = {}
    for kind, rows, id_field, desc, barcode in (
        ("tool", rental, "ITEM_NUMBER", "ITEM_DESCRIPTION", "ITEM_BARCODE"),
        ("cons", stock, "SKU_NUMBER", "SKU_DESCRIPTION", "SKU_BARCODE"),
    ):
        for r in rows:
            key, name = text(r.get(id_field)), text(r.get(desc))
            if not key:
                continue
            items.setdefault((kind, key.casefold()), {
                "kind": kind, "key": key, "name": name, "category": category(kind, name),
                "family": text(r.get("PRODUCT_FAMILY")), "product": text(r.get("PRODUCT")),
                "storage_unit": text(r.get("STORAGE_UNIT")), "tool_store": text(r.get("TOOLSTORE")),
                "barcode": text(r.get(barcode)), "owner": text(r.get("OWNER")),
                "expected": 1 if kind == "tool" else quantity(r.get("AVAILABLE_QUANTITY")),
                "status": text(r.get("ITEM_STATUS")), "sighted": "", "who": "", "action": "",
                "quantity": None, "round": None, "checks": [],
            })
    return items


def shift_info(rec, sighted):
    time = dt.datetime.fromisoformat(sighted)
    recorded = text(rec.get("LAST_SIGHTED_SHIFT") or rec.get("SHIFT_NAME") or rec.get("SHIFT"))
    shift = {"day": "Day", "day shift": "Day", "night": "Night", "night shift": "Night"}.get(recorded.casefold())
    source = "SiteIQ" if shift else "Time of sighting"
    if not shift:
        shift = "Day" if 6 <= time.hour < 18 else "Night"
    shift_date = time.date() - dt.timedelta(days=int(shift == "Night" and time.hour < 6))
    return {"shift": shift, "shift_source": source, "shift_date": shift_date.isoformat()}


def sightings(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        sheet = wb["STOCKTAKE"].values
        headers = [text(c).upper() for c in next(sheet)]
        for row in sheet:
            yield dict(zip(headers, row))
    finally:
        wb.close()


def event_type(kind, action, count, who):
    if " ".join(action.casefold().split()) not in COUNT_ACTIONS:
        return "activity"
    if count is None or count < 0 or (kind == "tool" and count > 1):
        return "quantity_unconfirmed"
    return "physical_count" if who else "unattributed_count"


def category_totals(items, checked):
    totals = Counter((row['kind'], row['category']) for row in items.values())
    done = Counter((items[key]['kind'], items[key]['category']) for key in checked)
    return [{"kind": kind, "category": cat, "checked": done[kind, cat], "total": total}
            for (kind, cat), total in sorted(totals.items())]


def accepted_opening(round_data, baseline_path, schedule):
    """Display the manager's direction separately from recorded physical checks."""
    approval = {"status": "accepted", "approved_by": "Andrew Fisher", "role": "Shutdown Manager",
                "approved_on": "2026-11-28", "baseline_available": baseline_path is not None}
    round_data["carry_forward"] = approval
    round_data["physical_checks"] = {label: round_data[label]["checked"] for label in ("tools", "cons")}
    round_data.update(categories=[], baseline_rows=[], tools={"total": None, "checked": None},
                      cons={"total": None, "checked": None})
    if baseline_path is None:
        return
    with Path(baseline_path).open(encoding="utf-8") as f:
        snapshot = json.load(f)
    if not isinstance(snapshot, dict) or snapshot.get("schedule") != schedule or not isinstance(snapshot.get("rows"), list):
        raise ValueError("The opening stocktake snapshot must contain the approved MMG schedule and register rows.")
    frozen = {}
    for record in snapshot["rows"]:
        if not isinstance(record, dict):
            raise ValueError("The opening stocktake snapshot contains an invalid register row.")
        kind, key = record.get("kind"), text(record.get("key"))
        if kind not in ("tool", "cons") or not key or (kind, key.casefold()) in frozen:
            raise ValueError("The opening stocktake snapshot contains an invalid or duplicate register identity.")
        row = {field: text(record.get(field)) for field in ("name", "category", "barcode", "owner", "status", "family",
                                                             "product", "tool_store", "storage_unit")}
        row.update(kind=kind, key=key, expected=quantity(record.get("expected")))
        row["category"] = row["category"] or category(kind, row["name"])
        frozen[kind, key.casefold()] = row
    if not frozen:
        raise ValueError("The opening stocktake snapshot contains no register identities.")
    for label in ("inventory_asat", "rental_asat", "sales_asat"):
        if snapshot.get(label):
            approval[label] = text(snapshot[label])
    round_data["baseline_rows"] = list(frozen.values())
    round_data["categories"] = category_totals(frozen, frozen)
    for kind, label in (("tool", "tools"), ("cons", "cons")):
        n = sum(row["kind"] == kind for row in frozen.values())
        round_data[label] = {"total": n, "checked": n}


def build(folder, current_file, schedule, rental, stock, opening_baseline=None):
    folder = Path(folder)
    config = folder / "stocktake.json"
    if config.is_file():
        policy = json.loads(config.read_text(encoding="utf-8"))
    elif schedule == NOVEMBER_SCHEDULE:
        policy = {"rounds": NOVEMBER_ROUNDS, "departure": "2026-12-02"}
    else:
        return None
    items = inventory(rental, stock)
    periods = policy["rounds"]
    if schedule == NOVEMBER_SCHEDULE:
        # Older copies of this job can still contain the previous one-day window.
        periods = [dict(period) for period in periods]
        periods[1].update(evidence_start="2026-11-25", evidence_end="2026-12-03", includes_routine_counts=True)
    arrival = policy.get("arrival") or periods[0]["start"]
    activity, windows = {}, {}
    snapshots = []
    current_path = Path(current_file) if current_file else None
    paths = set((folder / "stocktake_history").glob("*.xlsx"))
    if current_path:
        paths.add(current_path)
    for path in sorted(paths):
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            rows = wb["REFERENCE_INFO"].values
            headers = [text(c).upper() for c in next(rows)]
            ref = dict(zip(headers, next(rows)))
            if text(ref.get("PROJECT SCHEDULE")).casefold() != schedule.casefold():
                continue
            pulled = timestamp(ref.get("REQUESTED_DATE/TIME (LOCAL TIME)"))
            if not pulled:
                continue
            windows[pulled] = {"asat": pulled, "start": timestamp(ref.get("FROM_DATE/TIME")),
                               "end": timestamp(ref.get("TO_DATE/TIME"))}
            snapshots.append((pulled, path == current_path, path))
        finally:
            wb.close()
    for pulled, _, path in sorted(snapshots):
        # A newer pull supersedes earlier versions of the same item/time.
        # Preserve distinct evidence inside one pull, including same-minute recounts.
        snapshot = {}
        for rec in sightings(path):
            kind = {"rental": "tool", "consumable": "cons"}.get(text(rec.get("PRODUCT_CATEGORY")).casefold())
            key = text(rec.get("ITEM_OR_CONSUMABLE") if kind == "tool" else rec.get("SKU_NUMBER"))
            sighted = timestamp(rec.get("LAST_SIGHTED_DATE_TIME"))
            if not key or not kind or not sighted or sighted[:len(pulled)] > pulled:
                continue
            identity = kind, key.casefold()
            item = items.get(identity)
            action, who = text(rec.get("LAST_SIGHTED_ACTION")), text(rec.get("LAST_SIGHTED_BY"))
            count = quantity(rec.get("SIGHTED_QUANTITY"))
            evidence = event_type(kind, action, count, who)
            period = None
            if evidence == "physical_count":
                period = next((i for i, r in enumerate(periods)
                               if r.get("evidence_start", r["start"]) <= sighted[:10]
                               < r.get("evidence_end", r["end"])), None)
            name = text(rec.get("DESCRIPTION")) or (item["name"] if item else "")
            key_at_time = snapshot.setdefault((identity, sighted), {})
            key_at_time[who.casefold(), action.casefold(), count] = {
                "kind": kind, "key": item["key"] if item else key, "name": name, "current": item is not None,
                "category": item["category"] if item else category(kind, name),
                "family": text(rec.get("PRODUCT_FAMILY")) or (item["family"] if item else ""),
                "storage_unit": text(rec.get("STORAGE_UNIT")), "tool_store": text(rec.get("TOOL_STORE")),
                "sighted": sighted, "who": who, "action": action, "quantity": count, "round": period,
                "evidence": evidence, **shift_info(rec, sighted),
            }
        activity.update(snapshot)
    events = sorted((event for group in activity.values() for event in group.values()),
                    key=lambda event: event["sighted"], reverse=True)
    physical = [event for event in events if event["evidence"] in {"physical_count", "unattributed_count"}]
    checked = [set() for _ in periods]
    overall = set()
    unmatched = set()
    for event in events:
        identity = event["kind"], event["key"].casefold()
        item = items.get(identity)
        if item is None:
            unmatched.add(identity)
            continue
        fields = {k: event[k] for k in ("sighted", "who", "action", "quantity", "round", "shift", "shift_date", "shift_source", "evidence")}
        if not item["sighted"]:
            item.update(fields)
        if event["evidence"] in {"physical_count", "unattributed_count"}:
            if event["sighted"][:10] >= arrival:
                overall.add(identity)
            period = event["round"]
            if period is not None:
                item["checks"].append(fields)
                checked[period].add(identity)
    rounds = []
    for i, r in enumerate(periods):
        result = dict(r, categories=category_totals(items, checked[i]))
        for kind, label in (("tool", "tools"), ("cons", "cons")):
            result[label] = {"total": sum(key[0] == kind for key in items),
                             "checked": sum(key[0] == kind for key in checked[i])}
        rounds.append(result)
    if schedule == NOVEMBER_SCHEDULE:
        accepted_opening(rounds[0], opening_baseline, schedule)
    return {"asat": max(windows, default=""), "schedule": schedule, "windows": [windows[k] for k in sorted(windows)],
            "arrival": arrival, "departure": policy.get("departure"), "rows": list(items.values()),
            "rounds": rounds, "categories": category_totals(items, overall), "unmatched": len(unmatched),
            "physical_counts": physical, "sightings": events}


# SiteIQ's STOCKTAKE is a last-sighting extract. Window coverage records what
# was requested, never a guarantee that every earlier scan was retained.
_QLD = dt.timezone(dt.timedelta(hours=10))


def _local(value):
    try:
        value = dt.datetime.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None
    if value.tzinfo:
        value = value.astimezone(_QLD).replace(tzinfo=None)
    return value


def _iso(value):
    return value.isoformat(timespec='seconds') if value else ''


def _segments(intervals):
    merged = []
    for start, end in sorted(intervals):
        if end <= start:
            continue
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


def _within(intervals, start, end):
    return [(max(a, start), min(b, end)) for a, b in intervals if a < end and b > start]


def _minutes(start, end):
    return max(0, int((end-start).total_seconds() // 60))


def _counts(events):
    keys = {(e['kind'], e['id']) for e in events}
    return {'count_events': len(events), 'tools': sum(k == 'tool' for k, _ in keys),
            'cons': sum(k == 'cons' for k, _ in keys)}


def _dimension(row, field):
    return text(row.get(field)) or ('Uncategorised' if field == 'category' else 'Location not recorded')


def _frequency(events, field):
    tallies = Counter(e[field] for e in events)
    return [{'name': k, 'count_events': n} for k, n in sorted(tallies.items(), key=lambda p: (-p[1], p[0]))]


def _review_evidence(st, manual, register, begin, finish):
    periods = st.get('rounds', [])
    close = periods[1] if len(periods) > 1 else None
    carry = bool(periods and (periods[0].get('carry_forward') or {}).get('status') == 'accepted')
    records = []
    unique_requests = set()
    sources = st.get('sightings')
    if sources is None:
        sources = st.get('physical_counts', [])
    # A portal entry is identified by its request ID. There is no shared event
    # ID across SiteIQ and the ledger, so do not silently merge real recounts.
    for is_manual, entries in ((False, sources), (True, manual or ())):
        for r in entries:
            if is_manual:
                if r.get('schedule') and r['schedule'] != st.get('schedule'):
                    continue
                request = r.get('request_id')
                if request and request in unique_requests:
                    continue
                if request:
                    unique_requests.add(request)
            raw_id = text(r.get('item_id') if is_manual else r.get('key'))
            kind = r.get('kind')
            when = _local(r.get('counted_at') if is_manual else r.get('sighted'))
            if kind not in ('tool', 'cons') or not raw_id or not when or not begin <= when < finish:
                continue
            who = _counter_name(st.get('schedule'), r.get('person') if is_manual else r.get('who'))
            action = 'Physical count' if is_manual else text(r.get('action'))
            evidence = event_type(kind, action, quantity(r.get('quantity')), who)
            # Some historical snapshots already identify explicit checks but do
            # not retain the action label. Never infer one from an ordinary sighting.
            if not is_manual and not action and r.get('evidence') in ('physical_count', 'unattributed_count'):
                evidence = event_type(kind, 'Physical count', quantity(r.get('quantity')), who)
            shift = shift_info({'SHIFT': r.get('shift')}, _iso(when))
            key = kind, raw_id.casefold()
            row = register.get(key, {})
            period = r.get('round')
            close_eligible = close is None or period in (1, 'closeout')
            if close and is_manual and period == 'routine' and carry:
                day = when.date().isoformat()
                close_eligible = close.get('evidence_start', close['start']) <= day < close.get('evidence_end', close['end'])
            records.append(dict(kind=kind, id=key[1], key=key, time=when, who=who,
                                evidence=evidence, close=close_eligible and evidence == 'physical_count',
                                category=_dimension(row or r, 'category'),
                                area=_dimension({'storage_unit':r.get('storage_unit') or row.get('storage_unit')}, 'storage_unit'),
                                shift=(shift['shift_date'], shift['shift']), source='Portal' if is_manual else 'SiteIQ'))
    return sorted(records, key=lambda r: r['time'])


def _review_groups(register, checked, field, *, touched=None, still_pending=None):
    grouped = {}
    for key, row in register.items():
        name = _dimension(row, field)
        dimension = row['kind'], name
        if touched is not None and dimension not in touched:
            continue
        group = grouped.setdefault(dimension, {'kind': row['kind'], 'name': name, 'total': 0, 'checked': 0,
                                               'remaining': 0})
        group['total'] += 1
        if key in checked:
            group['checked'] += 1
        else:
            group['remaining'] += 1
            if still_pending is not None:
                group.setdefault('pending_ids', []).append({'kind': row['kind'], 'key': row['key']})
                group['still_remaining'] = group.get('still_remaining', 0) + int(key in still_pending)
    for g in grouped.values():
        g['pct'] = round(100 * g['checked'] / g['total'], 1)
    return sorted((g for g in grouped.values() if touched is None or g['remaining']),
                  key=lambda g: (-g['remaining'], g['kind'], g['name'].casefold()))


def _counter_name(schedule, value):
    name = ' '.join(text(value).split())
    if schedule == NOVEMBER_SCHEDULE and name.casefold() in ('cody mitchel', 'cody mitchell'):
        # The dated MMG roster and the signed off contact sheet use different spellings.
        return 'Cody Mitchell'
    return name


def _rostered_shifts(roster, schedule):
    shifts = {}
    for r in roster or ():
        day = text(r.get('iso'))
        shift = text(r.get('shift')).title()
        start = _local(day + 'T' + text(r.get('start')))
        end = _local(day + 'T' + text(r.get('finish')))
        name = _counter_name(schedule, r.get('name'))
        if shift not in ('Day', 'Night') or not name or not start or not end or start == end:
            continue
        if end < start:
            end += dt.timedelta(days=1)
        shifts.setdefault((day, shift), set()).add((start, end, name))
    return shifts


def _time_series(records, planned, windows, unknown_windows, begin, limit, default_start, *, person=False):
    counts = [r for r in records if r['evidence'] == 'physical_count']
    other = [r for r in records if r['evidence'] == 'activity']
    start = min((s for s, _, _ in planned), default=default_start)
    end = max((e for _, e, _ in planned), default=default_start + dt.timedelta(hours=12))
    if person and not planned:
        stamps = [r['time'] for r in records if r['evidence'] != 'activity']
        if stamps:
            start, end = min(stamps), max(stamps)
    first, cutoff = max(start, begin), min(end, limit)
    intervals = _segments((a, b) for a, b, _ in planned) if planned else [(start, end)]
    elapsed_periods = _within(intervals, first, cutoff) if cutoff > first else []
    overlaps = [segment for a, b in elapsed_periods for segment in _within(windows, a, b)]
    elapsed = sum((b - a for a, b in elapsed_periods), dt.timedelta(0))
    covered = sum((b - a for a, b in overlaps), dt.timedelta(0))
    if elapsed and covered == elapsed:
        coverage = 'full'
    elif covered:
        coverage = 'partial'
    else:
        coverage = 'unknown' if unknown_windows else 'none'

    # Assign the record to its actual hour, including an event at a snapshot
    # stamped exactly on the hour. That final bucket has zero elapsed minutes.
    by_hour = {}
    for r in counts:
        hour = r['time'].replace(minute=0, second=0, microsecond=0)
        by_hour.setdefault(hour, []).append(r)
    hour = first.replace(minute=0, second=0, microsecond=0)
    while hour < cutoff:
        by_hour.setdefault(hour, [])
        hour += dt.timedelta(hours=1)
    hours = []
    for hour, entries in sorted(by_hour.items()):
        a = max(first, hour)
        b = min(cutoff, hour + dt.timedelta(hours=1))
        if b < a:  # A record outside the roster still belongs to its genuine clock hour.
            a = b = entries[0]['time']
        minutes = sum(_minutes(x, y) for x, y in _within(overlaps, a, b)) if b > a else 0
        elapsed_minutes = sum(_minutes(x, y) for x, y in _within(elapsed_periods, a, b)) if b > a else 0
        if not elapsed_minutes and not entries and not _within(elapsed_periods, a, b):
            continue
        hours.append(dict(start=_iso(a), end=_iso(b), elapsed_minutes=elapsed_minutes,
                          window_minutes=minutes, **_counts(entries)))

    # Without a dated roster, review only the period between real counts.
    review = _segments((a, b) for a, b, _ in planned)
    if not review and counts:
        review = [(counts[0]['time'], counts[-1]['time'])]
    gaps = []
    for a, b in overlaps:
        for x, y in _within(review, a, b):
            marks = sorted({r['time'] for r in records if r['evidence'] != 'activity' and x < r['time'] < y})
            for left, right in zip([x, *marks], [*marks, y]):
                minutes = _minutes(left, right)
                if minutes >= 60:
                    gaps.append(dict(start=_iso(left), end=_iso(right), minutes=minutes,
                                     other_sightings=sum(left < r['time'] < right for r in other)))
    return dict(start=_iso(start), end=_iso(end), elapsed_end=_iso(cutoff) if cutoff >= first else '',
                upcoming=limit < start, interval_basis='roster' if planned else ('observed' if person else 'standard_shift'),
                ongoing=start <= limit < end, coverage=coverage, window_minutes=int(covered.total_seconds() // 60),
                elapsed_minutes=int(elapsed.total_seconds() // 60), hours=hours, gaps=gaps,
                planned=[{'person': n, 'start': _iso(a), 'end': _iso(b)} for a, b, n in sorted(planned)],
                other_sightings=len(other),
                unattributed_counts=sum(r['evidence'] == 'unattributed_count' for r in records),
                unconfirmed_counts=sum(r['evidence'] == 'quantity_unconfirmed' for r in records),
                first=_iso(counts[0]['time']) if counts else '', last=_iso(counts[-1]['time']) if counts else '',
                **_counts(counts))


def _review_shift(key, planned, records, windows, unknown_windows, begin, limit):
    day, shift = key
    default_start = dt.datetime.fromisoformat(day) + dt.timedelta(hours=6 if shift == 'Day' else 18)
    def timeline(group, plans, *, person=False):
        return _time_series(group, plans, windows, unknown_windows, begin, limit, default_start, person=person)

    result = timeline(records, planned)
    names = {n.casefold(): n for _, _, n in sorted(planned)}
    for r in records:
        if r['who'] and r['evidence'] != 'activity':
            names.setdefault(r['who'].casefold(), r['who'])
    operators = []
    for ident, name in names.items():
        own_plan = [(a, b, n) for a, b, n in planned if n.casefold() == ident]
        own_records = [r for r in records if r['who'].casefold() == ident]
        counts = [r for r in own_records if r['evidence'] == 'physical_count']
        operator = timeline(own_records, own_plan, person=True)
        # Show named events even if someone worked outside the scheduled interval.
        operator.update(name=name, categories=_frequency(counts, 'category'), areas=_frequency(counts, 'area'))
        operators.append(operator)
    result.update(date=day, shift=shift,
                  operators=sorted(operators, key=lambda p: (-p['count_events'], p['name'].casefold())))
    return result


def shift_analysis(st, roster=None, recorded_entries=None, ledger_asat=None):
    """Manager view of recorded physical counts and follow-up on the current register.

    An export's requested window establishes the reporting boundary only. These
    data cannot prove when a person worked, who was assigned an item, or that an
    unrecorded check did not occur.
    """
    begin = _local(st.get('arrival')) or dt.datetime.min
    departure = _local(st.get('departure'))
    finish = departure + dt.timedelta(days=1) if departure else dt.datetime.max
    register = {(r['kind'],str(r['key']).casefold()): r for r in st.get('rows',[]) if r.get('key')}
    events = _review_evidence(st, recorded_entries if recorded_entries is not None else st.get('recorded_entries'),
                              register,begin,finish)
    site_asat = _local(st.get('asat'))
    limit = min(max([d for d in [site_asat, *(r['time'] for r in events)] if d],default=begin), finish)
    windows = []
    unknown = False
    for w in st.get('windows',[]):
        start, end, pull = (_local(w.get(k)) for k in ('start','end','asat'))
        if start and end and pull and start <= min(end,pull):
            windows.append((start,min(end,pull)))
        else:
            unknown = True
    windows = _segments(windows)
    counts = [r for r in events if r['evidence']=='physical_count']
    plans = _rostered_shifts(roster, st.get("schedule"))
    by_shift = {}
    for event in events:
        by_shift.setdefault(event['shift'],[]).append(event)
    shift_keys = set(plans) | {r['shift'] for r in events if r['evidence'] != 'activity'}
    first_close = {}
    for r in counts:
        if r['close'] and r['key'] in register:
            first_close.setdefault(r['key'],r['time'])
    pending = register.keys() - first_close.keys()
    shifts = []
    for key in sorted(shift_keys):
        planned = plans.get(key,())
        if planned and (min(a for a,b,n in planned)>limit or max(b for a,b,n in planned)<=begin):
            continue
        group = by_shift.get(key,[])
        s = _review_shift(key,planned,group,windows,unknown or not st.get('windows'),begin,limit)
        if not s['elapsed_minutes'] and not group:
            continue
        cutoff = _local(s['elapsed_end'])
        checked = {k for k, t in first_close.items() if t < cutoff or (s['ongoing'] and t == cutoff)}
        touched = [r for r in group if r['close'] and r['key'] in checked and
                   (r['time'] < cutoff or (s['ongoing'] and r['time'] == cutoff))]
        s['follow_up'] = {'asat':s['elapsed_end']}
        for dimension,field,record_field in [('areas','storage_unit','area'),('categories','category','category')]:
            touch = {(r['kind'],r[record_field]) for r in touched}
            touch.discard(('cons','Location not recorded'))
            touch.discard(('tool','Location not recorded'))
            s['follow_up'][dimension] = _review_groups(register,checked,field,touched=touch,still_pending=pending) if touch else []
        shifts.append(s)
    follow = dict(round='closeout' if len(st.get('rounds',[]))>1 else 'since_arrival',
                  categories=_review_groups(register,first_close,'category'),areas=_review_groups(register,first_close,'storage_unit'),
                  pending_ids=[{'kind':r['kind'],'key':r['key']} for k,r in register.items() if k in pending],
                  unlocated={label:sum(r['kind']==kind and not text(r.get('storage_unit')) for r in register.values())
                             for kind,label in [('tool','tools'),('cons','cons')]})
    return dict(asat=_iso(limit) if limit!=dt.datetime.min else '', siteiq_asat=_iso(site_asat),
                ledger_asat=text(ledger_asat or st.get('ledger_asat')), shifts=shifts, follow_up=follow,
                first_count=_iso(counts[0]['time']) if counts else '', last_count=_iso(counts[-1]['time']) if counts else '',
                unattributed_counts=sum(r['evidence']=='unattributed_count' for r in events),
                unconfirmed_counts=sum(r['evidence']=='quantity_unconfirmed' for r in events),
                **_counts(counts))
