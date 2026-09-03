#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
report_history - the movement scoreboard for the Ampol suite.
Author: Andrew Fisher | POWERED BY SITEIQ

WHAT THIS IS
  Every report writes its key figures here once per run, keyed by the
  data-as-at day. The next morning's report reads the previous day back
  and prints the movement ("up 16 since 01 Sep") and a 30-day sparkline.
  Real data only: the file holds exactly what a report printed on the
  day it printed it. No history means no arrow - never a guess.

WHERE
  History\\report_history.json in the suite folder. Per machine, never in
  an update zip, never overwritten by an update. A re-run on the same day
  replaces that day's entry (idempotent), so the file never doubles up.

HOW A REPORT USES IT
  import report_history as rh
  rh.record("gas", asat_dt, {"overdue": 77, "available": 335, ...})
  prev = rh.previous("gas", "overdue", asat_dt)   -> (date, 61) or None
  rh.series("gas", "overdue", asat_dt, days=30)   -> [(date, value), ...]
"""
import json
from datetime import date, datetime, timedelta
from pathlib import Path

BASE = Path(__file__).resolve().parent
HIST_DIR = BASE / "History"
HIST = HIST_DIR / "report_history.json"


def _day(d):
    if isinstance(d, datetime):
        d = d.date()
    if isinstance(d, date):
        return d.isoformat()
    return str(d)[:10]


def load():
    try:
        return json.loads(HIST.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def record(family, asat, figures, extra=None):
    """Write today's figures for a family. Same day = replace, never append."""
    data = load()
    fam = data.setdefault(family, {})
    entry = {"asat": asat.strftime("%d %b %Y %H:%M") if isinstance(asat, datetime) else str(asat),
             "written": datetime.now().strftime("%d %b %Y %H:%M"),
             "figures": {k: v for k, v in figures.items() if v is not None}}
    if extra:
        entry["extra"] = extra
    fam[_day(asat)] = entry
    HIST_DIR.mkdir(exist_ok=True)
    tmp = HIST.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=1, sort_keys=True), encoding="utf-8")
    tmp.replace(HIST)
    return HIST


def previous(family, key, asat):
    """The most recent EARLIER day that holds this figure -> (date, value)."""
    fam = load().get(family, {})
    today = _day(asat)
    days = sorted(d for d in fam if d < today and key in fam[d].get("figures", {}))
    if not days:
        return None
    d = days[-1]
    return (date.fromisoformat(d), fam[d]["figures"][key])


def series(family, key, asat, days=30):
    """(date, value) for every recorded day in the window ending at asat."""
    fam = load().get(family, {})
    end = date.fromisoformat(_day(asat))
    start = end - timedelta(days=days - 1)
    out = []
    for d in sorted(fam):
        dd = date.fromisoformat(d)
        if start <= dd <= end and key in fam[d].get("figures", {}):
            out.append((dd, fam[d]["figures"][key]))
    return out


def movement(family, key, asat, value, good="down", money=False):
    """(text, css_class) for a tile note, or ("", "") when there is no
    earlier day - a report never invents movement. good="down" means a
    fall is the good direction (overdue, not found); "up" the reverse;
    None is a figure with no good direction (it moves in grey).
    money=True prints the change as dollars and cents."""
    prev = previous(family, key, asat)
    if prev is None or value is None:
        return "", ""
    pdate, pval = prev
    try:
        diff = value - pval
    except TypeError:
        return "", ""
    when = pdate.strftime("%d %b")
    if diff == 0:
        return f"no change since {when}", "grey"
    arrow = "▲" if diff > 0 else "▼"
    mag = abs(diff)
    if money:
        txt = f"{arrow} ${mag:,.2f}"
    elif isinstance(mag, float):
        txt = f"{arrow} {mag:,.1f}".rstrip("0").rstrip(".")
    else:
        txt = f"{arrow} {mag:,}"
    if good is None:
        return f"{txt} since {when}", "grey"
    improved = (diff < 0) if good == "down" else (diff > 0)
    return f"{txt} since {when}", ("green" if improved else "red")


if __name__ == "__main__":
    print(HIST, "exists" if HIST.exists() else "(not yet written)")
    for fam, days in load().items():
        print(f"{fam}: {len(days)} day(s), latest {max(days)}")
