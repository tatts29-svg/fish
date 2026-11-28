"""Summarise only the selected holder's or company's store records."""
from collections import Counter, defaultdict


def summarise(events, has_coverage, *, personal=False):
    hourly = [dict(hour=hour, events=0, interactions=0) for hour in range(24)]
    daily = defaultdict(lambda: dict(interactions=0, timed_events=0, date_only_events=0))
    stamps_by_day = defaultdict(set)
    grouped = Counter()
    undated_events = unattributed = 0
    for profile, stamp in events:
        if not stamp:
            undated_events += 1
            continue
        day = stamp[:10]
        if len(stamp) == 10:
            daily[day]['date_only_events'] += 1
            continue
        hour = int(stamp[11:13])
        stamps_by_day[day].add(stamp)
        daily[day]['timed_events'] += 1
        hourly[hour]['events'] += 1
        if profile is None:
            unattributed += 1
            continue
        key = profile, stamp[:16]
        if key not in grouped:
            daily[day]['interactions'] += 1
            hourly[hour]['interactions'] += 1
        grouped[key] += 1

    days = []
    for day, counts in sorted(daily.items()):
        times = stamps_by_day[day]
        first, last = min(times, default=None), max(times, default=None)
        # A minute-only event and a second-resolved event in the same minute
        # cannot be ordered more precisely than the minute itself.
        if last and last[:16] in times:
            last = last[:16]
        days.append(dict(date=day, **counts, first_timed_at=first, last_timed_at=last,
                         first_at=day if counts['date_only_events'] else first,
                         last_at=day if counts['date_only_events'] else last))
    peak = max(h['interactions'] for h in hourly)
    result = dict(has_coverage=has_coverage, active_days=len(days),
                  first_at=days[0]['first_at'] if days else None,
                  last_at=days[-1]['last_at'] if days else None,
                  first_timed_at=next((day['first_timed_at'] for day in days if day['first_timed_at']), None),
                  last_timed_at=next((day['last_timed_at'] for day in reversed(days) if day['last_timed_at']), None),
                  interactions=len(grouped), timed_events=sum(h['events'] for h in hourly),
                  date_only_events=sum(d['date_only_events'] for d in days), undated_events=undated_events,
                  unattributed_timed_events=unattributed, hourly=hourly,
                  busiest_hours=[h['hour'] for h in hourly if peak and h['interactions'] == peak], daily=days)
    if personal:
        result['timed_minutes'] = [dict(at=at, events=count) for (_, at), count in
                                   sorted(grouped.items(), key=lambda row: row[0][1], reverse=True)]
    return result
