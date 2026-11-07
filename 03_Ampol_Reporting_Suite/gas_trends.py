#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COATES | AMPOL - the non-return trend engine for gas monitors.
Author: Andrew Fisher | POWERED BY SITEIQ

WHY (06 Nov 2026, client feedback): the client's biggest worry is gear
that does not come back, gas monitors most of all. The engine already
counts the position today and the same-day rate by window; this module
reconstructs HOW IT GOT HERE from the transaction log, day by day since
the log began:

  daily      monitors out to crew at the end of every day, how many of
             them were overdue (out before that day) and how many had been
             out 8+ and 30+ days - the lines that show the pile growing or
             shrinking; issues and returns per day
  weekly     ISO weeks: crew draws, back same day, back within 1 day,
             back within 7 days, still open at the week's end, same-day %
  ageing     at the end of every week, the open draws split into age
             bands (0-1, 2-7, 8-29, 30+ days) - the stack that shows
             whether the old tail is clearing
  companies  for the busiest companies, non-return rate by month and the
             monitors they still hold at the end of each month
  people     repeat non-returners: people with non-returns in three or
             more separate weeks, with their months

Every figure is a count over rows in TRANSACTIONS (crew draws only -
custody and workflow accounts are excluded, exactly as the engine does).
A draw with no return in the log is open until the pull time. Nothing is
estimated or smoothed.
"""
from collections import Counter, defaultdict
from datetime import datetime, timedelta, date

BANDS = (("0-1 days", 0, 1), ("2-7 days", 2, 7), ("8-29 days", 8, 29), ("30+ days", 30, None))


def _day(d):
    return d.date() if isinstance(d, datetime) else d


def _open_at(t, eod):
    """True if the draw t is still out at the end of day eod."""
    st = _day(t["st"])
    if st > eod:
        return False
    if t["en"] is None:
        return True
    return _day(t["en"]) > eod


def compute(ctx, m=None, top_companies=10, top_people=10):
    tx = ctx.get("tx") or []
    crew = [t for t in tx if t.get("kind") == "crew" and t.get("st")]
    if not crew:
        return None
    win_start, win_end = ctx.get("tx_window") or (None, None)
    start = _day(win_start) if win_start else min(_day(t["st"]) for t in crew)
    now = ctx.get("tx_requested") or ctx.get("asat") or datetime.now()
    end = _day(now)
    if end < start:
        end = start
    days = []
    d = start
    while d <= end:
        days.append(d)
        d += timedelta(days=1)

    # --- events per day, so the daily sweep is O(days + draws) ---------
    issued_on = Counter(_day(t["st"]) for t in crew)
    returned_on = Counter(_day(t["en"]) for t in crew if t["en"])
    # open-at-end-of-day counts by scanning draws once per day would be
    # O(days * draws) (~250 x 60,000); instead sort by start and keep a
    # running set of open draws, retiring them on their return day
    by_start = sorted(crew, key=lambda t: t["st"])
    returns_by_day = defaultdict(list)
    for i, t in enumerate(by_start):
        if t["en"]:
            returns_by_day[_day(t["en"])].append(i)
    open_set = set()
    daily = []
    si = 0
    n_by_start = len(by_start)
    for eod in days:
        while si < n_by_start and _day(by_start[si]["st"]) <= eod:
            open_set.add(si)
            si += 1
        # retire draws returned on or before this day
        for i in returns_by_day.get(eod, ()):
            open_set.discard(i)
        out_eod = len(open_set)
        over1 = over8 = over30 = 0
        for i in open_set:
            age = (eod - _day(by_start[i]["st"])).days
            if age >= 1:
                over1 += 1
            if age >= 8:
                over8 += 1
            if age >= 30:
                over30 += 1
        daily.append({"day": eod, "issued": issued_on.get(eod, 0), "returned": returned_on.get(eod, 0),
                      "out": out_eod, "overdue": over1, "over8": over8, "over30": over30})
    # draws returned before they were issued (bad data) would be retired
    # before being added; they are counted in issued/returned only.

    # --- weekly ----------------------------------------------------------
    def iso_week(dd):
        y, w, _ = dd.isocalendar()
        return (y, w)
    weeks = defaultdict(lambda: {"draws": 0, "sd": 0, "d1": 0, "d7": 0, "open": 0, "people": set(), "cos": set()})
    for t in crew:
        k = iso_week(_day(t["st"]))
        w = weeks[k]
        w["draws"] += 1
        w["people"].add(t.get("who_key") or t.get("who"))
        w["cos"].add(t.get("co"))
        if t.get("sd"):
            w["sd"] += 1
        if t["en"]:
            dd = (t["en"] - t["st"]).total_seconds() / 86400.0
            if dd <= 1.0:
                w["d1"] += 1
            if dd <= 7.0:
                w["d7"] += 1
        else:
            w["open"] += 1
    weekly = []
    for k in sorted(weeks):
        w = weeks[k]
        monday = date.fromisocalendar(k[0], k[1], 1)
        # WHY (07 Nov 2026, QA): the first ISO week of 2026 starts Mon 29 Dec
        # 2025, before the log opens - it is labelled by the log's first day
        # and, like the current week, marked part week
        weekly.append({"week": k, "label": max(monday, start).strftime("%d %b"), "monday": monday,
                       "draws": w["draws"], "sd": w["sd"], "nsd": w["draws"] - w["sd"],
                       "d1": w["d1"], "d7": w["d7"], "open": w["open"],
                       "people": len(w["people"]), "companies": len(w["cos"]),
                       "sd_pct": round(w["sd"] / w["draws"] * 100, 1) if w["draws"] else 0.0,
                       "nsd_pct": round((w["draws"] - w["sd"]) / w["draws"] * 100, 1) if w["draws"] else 0.0,
                       "d7_pct": round(w["d7"] / w["draws"] * 100, 1) if w["draws"] else 0.0,
                       "partial": monday + timedelta(days=6) >= end or monday < start})

    # --- ageing of the open draws at the end of every week ----------------
    ageing = []
    week_ends = []
    for wk in weekly:
        we = min(wk["monday"] + timedelta(days=6), end)
        week_ends.append((wk["label"], we))
    for label, we in week_ends:
        counts = [0, 0, 0, 0]
        for t in crew:
            if _open_at(t, we):
                age = (we - _day(t["st"])).days
                for i, (_lab, lo, hi) in enumerate(BANDS):
                    if age >= lo and (hi is None or age <= hi):
                        counts[i] += 1
                        break
        # WHY (07 Nov 2026, QA): the snapshot is taken at the week's end, so the
        # row carries that date; the last row is the export's close (a part week)
        ageing.append({"label": we.strftime("%d %b"), "week_label": label, "end": we, "bands": counts,
                       "total": sum(counts), "partial": we >= end})

    # --- companies by month ----------------------------------------------
    months = sorted({(_day(t["st"]).year, _day(t["st"]).month) for t in crew})
    co_tot = Counter(t.get("co") or "(no company)" for t in crew)
    top = [c for c, _n in co_tot.most_common(top_companies)]
    by_co_month = defaultdict(lambda: defaultdict(lambda: {"draws": 0, "nsd": 0}))
    for t in crew:
        co = t.get("co") or "(no company)"
        k = (_day(t["st"]).year, _day(t["st"]).month)
        by_co_month[co][k]["draws"] += 1
        if not t.get("sd"):
            by_co_month[co][k]["nsd"] += 1
    month_labels = [date(y, mo, 1).strftime("%b") for y, mo in months]
    companies = []
    for co in top:
        rates, draws_, nsd_ = [], [], []
        for k in months:
            c = by_co_month[co].get(k, {"draws": 0, "nsd": 0})
            draws_.append(c["draws"]); nsd_.append(c["nsd"])
            rates.append(round(c["nsd"] / c["draws"] * 100, 1) if c["draws"] else None)
        held_now = sum(1 for t in crew if (t.get("co") or "(no company)") == co and t["en"] is None)
        companies.append({"name": co, "draws": sum(draws_), "nsd": sum(nsd_), "rates": rates,
                          "draws_by_month": draws_, "nsd_by_month": nsd_, "open_now": held_now,
                          "nsd_pct": round(sum(nsd_) / sum(draws_) * 100, 1) if sum(draws_) else 0.0})
    # the trend word. WHY (07 Nov 2026, QA review): the old rule compared
    # the last full month with an average that INCLUDED that month, and read
    # "last" as the last month with any rate - so a person with no draws
    # since July was marked "better". Now: the last FULL month (the current
    # part month is skipped) against the average of the three full months
    # before it, by position. A month with no draws (or, for a person, fewer
    # than five) is never judged; the word says so instead.
    part_month = bool(months and (end + timedelta(days=1)).month == months[-1][1] and
                      (end + timedelta(days=1)).year == months[-1][0])
    last_i = len(months) - (2 if part_month and len(months) >= 2 else 1)
    trend_last_label = month_labels[last_i] if 0 <= last_i < len(month_labels) else ""
    base_i = [i for i in range(max(0, last_i - 3), last_i)]
    trend_base_label = (f"{month_labels[base_i[0]]}-{month_labels[base_i[-1]]}" if len(base_i) > 1
                        else (month_labels[base_i[0]] if base_i else ""))

    def trend_of(rates, draws=None):
        """{'word', 'last', 'base'} - last full month against the three before."""
        if last_i < 0:
            return {"word": "-", "last": None, "base": None}
        last = rates[last_i]
        prior = [rates[i] for i in base_i if rates[i] is not None]
        base = round(sum(prior) / len(prior), 1) if prior else None
        if last is None:
            dd = draws or [0] * len(rates)
            if dd[last_i]:
                return {"word": f"under 5 draws in {trend_last_label}", "last": None, "base": base}
            seen = [i for i in range(last_i) if dd[i]]
            return {"word": (f"no draws since {month_labels[seen[-1]]}" if seen else "no draws"), "last": None, "base": base}
        if base is None:
            return {"word": "new", "last": last, "base": None}
        word = "worse" if last > base + 2 else "better" if last < base - 2 else "level"
        return {"word": word, "last": last, "base": base}

    def trend_word(rates, draws=None):
        return trend_of(rates, draws)["word"]

    for c in companies:
        t_ = trend_of(c["rates"], c["draws_by_month"])
        c["trend"], c["trend_last"], c["trend_base"] = t_["word"], t_["last"], t_["base"]

    # --- the worst offenders: named people by non-returns, month by month --
    # WHY (07 Nov 2026, Andrew): the league ranks people over three windows;
    # this is each person's own line through the year, so a habit shows as
    # a habit and a bad week shows as a bad week. Shared booking accounts
    # are never people and are left out; the month needs five draws before
    # a rate is judged.
    import ampol_names
    pp = defaultdict(lambda: {"draws": Counter(), "nsd": Counter(), "co": Counter(), "disp": Counter(),
                              "open": 0, "oldest": 0, "weeks": set()})
    for t in crew:
        k = t.get("who_key") or t.get("who")
        if not k:
            continue
        name = t.get("who") or k
        if ampol_names.is_site_account(name):
            continue
        st_d = _day(t["st"])
        P = pp[k]
        mk = (st_d.year, st_d.month)
        P["draws"][mk] += 1
        P["disp"][name] += 1
        P["co"][t.get("co") or ""] += 1
        if not t.get("sd"):
            P["nsd"][mk] += 1
            P["weeks"].add(iso_week(st_d))
        if t["en"] is None:
            P["open"] += 1
            P["oldest"] = max(P["oldest"], (end - st_d).days)
    people = []
    for k, P in pp.items():
        tot_nsd = sum(P["nsd"].values())
        if not tot_nsd:
            continue
        tot_draws = sum(P["draws"].values())
        by_month = [(P["draws"].get(mk, 0), P["nsd"].get(mk, 0)) for mk in months]
        rates = [round(n / d * 100, 1) if d >= 5 else None for d, n in by_month]
        people.append({"name": P["disp"].most_common(1)[0][0], "co": P["co"].most_common(1)[0][0],
                       "draws": tot_draws, "nsd": tot_nsd,
                       "nsd_pct": round(tot_nsd / tot_draws * 100, 1) if tot_draws else 0.0,
                       "open_now": P["open"], "oldest": P["oldest"], "weeks": len(P["weeks"]),
                       "draws_by_month": [d for d, _ in by_month], "nsd_by_month": [n for _, n in by_month],
                       "rates": rates, "trend": trend_word(rates, [d for d, _ in by_month]),
                       "trend_last": trend_of(rates, [d for d, _ in by_month])["last"],
                       "trend_base": trend_of(rates, [d for d, _ in by_month])["base"]})
    people.sort(key=lambda x: (-x["nsd"], -x["nsd_pct"], x["name"]))
    people = people[:top_people]

    # --- repeat non-returners (three or more separate weeks) ---------------
    ppl = defaultdict(lambda: {"nsd": 0, "draws": 0, "weeks": set(), "co": Counter(), "disp": Counter(), "open": 0, "months": set()})
    for t in crew:
        k = t.get("who_key") or t.get("who")
        if not k or ampol_names.is_site_account(t.get("who") or k):
            continue
        p = ppl[k]
        p["draws"] += 1
        p["co"][t.get("co") or ""] += 1
        p["disp"][t.get("who") or k] += 1
        if not t.get("sd"):
            p["nsd"] += 1
            p["weeks"].add(iso_week(_day(t["st"])))
            p["months"].add(_day(t["st"]).strftime("%b"))
        if t["en"] is None:
            p["open"] += 1
    repeaters = []
    for k, p in ppl.items():
        if len(p["weeks"]) >= 3:
            repeaters.append({"name": p["disp"].most_common(1)[0][0], "co": p["co"].most_common(1)[0][0],
                              "draws": p["draws"], "nsd": p["nsd"], "weeks": len(p["weeks"]),
                              "open_now": p["open"], "months": " ".join(sorted(p["months"], key=lambda s: datetime.strptime(s, "%b").month)),
                              "nsd_pct": round(p["nsd"] / p["draws"] * 100, 1) if p["draws"] else 0.0})
    repeaters.sort(key=lambda x: (-x["weeks"], -x["nsd"], x["name"]))

    # --- the headline words ------------------------------------------------
    first, last = daily[0], daily[-1]
    peak = max(daily, key=lambda x: x["overdue"])
    full_wk = [w for w in weekly if not w["partial"]] or weekly
    best_wk = max(full_wk, key=lambda w: w["sd_pct"]) if full_wk else None
    worst_wk = min([w for w in full_wk if w["draws"] >= 20] or full_wk, key=lambda w: w["sd_pct"]) if full_wk else None
    last4 = [w for w in weekly if not w["partial"]][-4:]
    prev4 = [w for w in weekly if not w["partial"]][-8:-4]
    def rate(ws):
        n = sum(w["draws"] for w in ws); s = sum(w["sd"] for w in ws)
        return round(s / n * 100, 1) if n else None
    summary = {"start": start, "end": end, "days": len(daily),
               "out_first": first["out"], "out_last": last["out"],
               "overdue_first": first["overdue"], "overdue_last": last["overdue"],
               "over30_first": first["over30"], "over30_last": last["over30"],
               "peak_overdue": peak["overdue"], "peak_day": peak["day"],
               "best_week": best_wk, "worst_week": worst_wk,
               "rate_last4": rate(last4), "rate_prev4": rate(prev4),
               "draws": len(crew), "nsd": sum(1 for t in crew if not t.get("sd")),
               "open_now": sum(1 for t in crew if t["en"] is None),
               "repeaters": len(repeaters)}
    summary["people_named"] = len(pp)
    summary["trend_last_label"], summary["trend_base_label"] = trend_last_label, trend_base_label
    summary["part_month"] = part_month
    return {"daily": daily, "weekly": weekly, "ageing": ageing, "months": month_labels,
            "trend_last_label": trend_last_label, "trend_base_label": trend_base_label, "part_month": part_month,
            "companies": companies, "people": people, "repeaters": repeaters, "summary": summary,
            "bands": [b[0] for b in BANDS]}


def workbook_sheets(tr):
    """(name, headers, rows, formats, what) tuples for coates_xlsx, plus chart specs."""
    import coates_xlsx as cx
    sheets, charts = [], []
    if not tr:
        return {"sheets": sheets, "charts": charts}
    sheets.append(("Trend - daily", ["Day", "Issued", "Returned", "Out at end of day", "Overdue 1+ days", "Out 8+ days", "Out 30+ days"],
                   [[x["day"], x["issued"], x["returned"], x["out"], x["overdue"], x["over8"], x["over30"]] for x in tr["daily"]],
                   {0: cx.DATE, 1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.INT, 5: cx.INT, 6: cx.INT},
                   "Monitors out to crew at the end of every day since the log began, and how many were overdue"))
    sheets.append(("Trend - weekly", ["Week starting", "Crew draws", "Back same day", "Same-day %", "Back within 1 day", "Back within 7 days", "Within 7 days %", "Still open", "People", "Companies", "Part week"],
                   [[w["monday"], w["draws"], w["sd"], w["sd_pct"] / 100.0, w["d1"], w["d7"], w["d7_pct"] / 100.0, w["open"], w["people"], w["companies"], "Yes" if w["partial"] else "No"] for w in tr["weekly"]],
                   {0: cx.DATE, 1: cx.INT, 2: cx.INT, 3: cx.PCT1, 4: cx.INT, 5: cx.INT, 6: cx.PCT1, 7: cx.INT, 8: cx.INT, 9: cx.INT},
                   "Every ISO week: how quickly draws came back, and what was still open"))
    sheets.append(("Trend - ageing", ["Week ending"] + tr["bands"] + ["Open in all"],
                   [[a["end"]] + a["bands"] + [a["total"]] for a in tr["ageing"]],
                   {0: cx.DATE, 1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.INT, 5: cx.INT},
                   "The open draws at the end of each week, split by how long they had been out"))
    lab_l, lab_b = tr.get("trend_last_label", ""), tr.get("trend_base_label", "")
    sheets.append(("Trend - companies", ["Company", "Crew draws", "Not same day", "Non-return %", "Open now",
                                         f"{lab_b} average", f"{lab_l}", "Trend"] + tr["months"],
                   [[c["name"], c["draws"], c["nsd"], c["nsd_pct"] / 100.0, c["open_now"],
                     (c["trend_base"] / 100.0) if c.get("trend_base") is not None else "-",
                     (c["trend_last"] / 100.0) if c.get("trend_last") is not None else "-", c["trend"]]
                    + [(r / 100.0) if r is not None else "-" for r in c["rates"]] for c in tr["companies"]],
                   {**{1: cx.INT, 2: cx.INT, 3: cx.PCT1, 4: cx.INT, 5: cx.PCT1, 6: cx.PCT1}, **{8 + i: cx.PCT1 for i in range(len(tr["months"]))}},
                   f"Non-return rate by month for the busiest companies - the trend compares {lab_l} with the {lab_b} average "
                   f"(worse = more than 2 points higher, better = more than 2 lower); a month with no draws shows a dash"))
    sheets.append(("Trend - worst offenders", ["Who", "Company", "Crew draws", "Not same day", "Non-return %", "Still out now",
                                               "Oldest open, days", "Separate weeks", "Trend"] + [f"{mo} not same day" for mo in tr["months"]],
                   [[p["name"], p["co"], p["draws"], p["nsd"], p["nsd_pct"] / 100.0, p["open_now"],
                     (p["oldest"] if p["open_now"] else "-"), p["weeks"], p["trend"]]
                    + p["nsd_by_month"] for p in tr.get("people", [])],
                   {**{2: cx.INT, 3: cx.INT, 4: cx.PCT1, 5: cx.INT, 6: cx.INT, 7: cx.INT}, **{9 + i: cx.INT for i in range(len(tr["months"]))}},
                   f"The ten people with the most non-returns this year, month by month - the trend compares {lab_l} with the {lab_b} "
                   f"average; a month needs five draws before it is judged"))
    sheets.append(("Trend - repeat people", ["Who", "Company", "Crew draws", "Not same day", "Non-return %", "Weeks with a non-return", "Open now", "Months"],
                   [[p["name"], p["co"], p["draws"], p["nsd"], p["nsd_pct"] / 100.0, p["weeks"], p["open_now"], p["months"]] for p in tr["repeaters"]],
                   {2: cx.INT, 3: cx.INT, 4: cx.PCT1, 5: cx.INT, 6: cx.INT},
                   "People with non-returns in three or more separate weeks this year (since the log began) - a habit, not a bad day"))
    dl = tr["daily"]
    step = max(1, len(dl) // 60)
    pts = dl[::step] if len(dl) > 60 else dl
    charts.append({"args": ("line", "Monitors out and overdue at the end of each day", [x["day"].strftime("%d %b") for x in pts],
                            [("Out to crew", [x["out"] for x in pts]), ("Overdue 1+ days", [x["overdue"] for x in pts]), ("Out 30+ days", [x["over30"] for x in pts])]),
                   "kw": {"colours": ["2A313C", "E08A24", "D0342C"], "legend": "b"}})
    wk = [w for w in tr["weekly"] if not w["partial"]]      # part weeks left off, as on the PDF
    charts.append({"args": ("line", "Same-day return rate by full week", [w["label"] for w in wk], [("Same-day %", [w["sd_pct"] / 100.0 for w in wk])]),
                   "kw": {"fmt": "0%", "colours": ["409A55"]}})
    pe = tr.get("people") or []
    if pe:
        charts.append({"args": ("bar", "Worst offenders - not back same day this year", [f'{p["name"]} ({p["co"]})' for p in pe],
                                [("Not same day", [p["nsd"] for p in pe])]), "kw": {"colours": ["D0342C"]}})
    ag = tr["ageing"]
    charts.append({"args": ("stacked", "Open draws by age at each week's end", [a["label"] for a in ag],
                            [(tr["bands"][i], [a["bands"][i] for a in ag]) for i in range(4)]),
                   "kw": {"colours": ["409A55", "E08A24", "B5651D", "D0342C"], "legend": "b"}})
    return {"sheets": sheets, "charts": charts}


if __name__ == "__main__":
    import gasmon_engine as ge
    ctx = ge.load()
    tr = compute(ctx)
    s = tr["summary"]
    print(f"days {s['days']} ({s['start']} to {s['end']}): out {s['out_first']} -> {s['out_last']}, overdue {s['overdue_first']} -> {s['overdue_last']}, "
          f"30+ {s['over30_first']} -> {s['over30_last']}, peak overdue {s['peak_overdue']} on {s['peak_day']}")
    print(f"weeks {len(tr['weekly'])}; last 4 full weeks same-day {s['rate_last4']}% vs prior 4 {s['rate_prev4']}%; repeaters {s['repeaters']}")
    print("companies:", [(c["name"], c["nsd_pct"], c["trend"], c["open_now"]) for c in tr["companies"][:5]])
    print("ageing last:", tr["ageing"][-1])
