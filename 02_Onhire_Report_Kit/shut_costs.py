#!/usr/bin/env python3
"""The shut's labour roster and charges, day by day, for the report page.
Author: Andrew Fisher | POWERED BY SITEIQ.

Reads a small typed file (kept outside git - it carries names and rates):

    {"rates": {"Day": .., "Night": ..},
     "roster":  [{"date": "YYYY-MM-DD", "type": .., "name": .., "shift": "Day"|"Night",
                  "start": "06:00", "finish": "18:00", "hours": 12}, ...],
     "charges": [{"date": "YYYY-MM-DD", "tooling": .., "services": .., "flights": ..}, ...],
     "starts":  {"labour": .., "nights": .., "tooling": .., "services": ..}}

Nothing is estimated: a labour row costs its hours times the typed rate for
its shift, and a charge is the amount typed for that day. "To date" is every
day up to and including the day of the SiteIQ pull.
"""
import collections
import datetime as dt
import json

CATS = ("labour", "tooling", "services", "flights")
NAMES = {"labour": "Labour", "tooling": "Tooling", "services": "Site services", "flights": "Flights"}


def _day(text):
    return dt.datetime.strptime(text, "%Y-%m-%d").date()


def _label(d):
    return "{} {} {}".format(d.strftime("%a"), d.day, d.strftime("%b"))


def build(spec, today):
    """The figures the page shows. `today` is the date of the SiteIQ pull."""
    rates = spec.get("rates", {})
    days = collections.OrderedDict()
    rows = []
    people = collections.OrderedDict()
    for r in sorted(spec.get("roster", []), key=lambda r: (r["date"], r.get("shift") != "Day", r["name"])):
        d = _day(r["date"])
        if r["shift"] not in rates:
            raise ValueError("No rate typed for the {} shift".format(r["shift"]))
        rate = float(rates[r["shift"]])
        cost = round(float(r["hours"]) * rate, 2)
        done = d <= today
        rows.append({"date": _label(d), "iso": r["date"], "type": r.get("type", ""), "name": r["name"], "shift": r["shift"],
                     "start": r.get("start", ""), "finish": r.get("finish", ""), "hours": r["hours"], "rate": rate, "cost": cost, "done": done})
        day = days.setdefault(d, dict.fromkeys(CATS, 0.0))
        day["labour"] += cost
        day.setdefault("types", set()).add(r.get("type", ""))
        p = people.setdefault(r["name"], {"name": r["name"], "hours": 0, "cost": 0.0, "hours_done": 0, "cost_done": 0.0,
                                         "day": 0, "night": 0, "shifts": 0})
        p["hours"] += r["hours"]
        p["cost"] += cost
        p["shifts"] += 1
        p["night" if r["shift"] == "Night" else "day"] += 1
        if done:
            p["hours_done"] += r["hours"]
            p["cost_done"] += cost
    for c in spec.get("charges", []):
        day = days.setdefault(_day(c["date"]), dict.fromkeys(CATS, 0.0))
        for k in ("tooling", "services", "flights"):
            day[k] += float(c.get(k) or 0)
    out_days, run = [], 0.0
    tot = dict.fromkeys(CATS, 0.0)
    sofar = dict.fromkeys(CATS, 0.0)
    for d in sorted(days):
        v = days[d]
        total = round(sum(v[k] for k in CATS), 2)
        run = round(run + total, 2)
        done = d <= today
        for k in CATS:
            tot[k] += v[k]
            if done:
                sofar[k] += v[k]
        out_days.append(dict({k: round(v[k], 2) for k in CATS}, date=_label(d), iso=d.isoformat(),
                             type=" / ".join(sorted(t for t in v.get("types", ()) if t)), total=total, running=run,
                             done=done, today=d == today))
    for p in people.values():
        p["cost"], p["cost_done"] = round(p["cost"], 2), round(p["cost_done"], 2)
    starts = {k: _label(_day(v)) for k, v in (spec.get("starts") or {}).items()}
    return {
        "days": out_days, "roster": rows, "people": list(people.values()),
        "rates": [{"shift": k, "rate": float(v)} for k, v in rates.items()],
        "cats": [{"key": k, "name": NAMES[k], "total": round(tot[k], 2), "sofar": round(sofar[k], 2)} for k in CATS if tot[k]],
        "total": round(sum(tot.values()), 2), "sofar": round(sum(sofar.values()), 2),
        "hours": sum(r["hours"] for r in rows), "hours_done": sum(r["hours"] for r in rows if r["done"]),
        "days_done": sum(1 for d in out_days if d["done"]), "starts": starts,
        "upto": _label(min(today, max(days))) if days else "", "role": spec.get("role", ""),
    }


def load(path, today):
    with open(path, encoding="utf-8") as f:
        return build(json.load(f), today)
