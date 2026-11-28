#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COATES | AMPOL - the Excel twin of each report family.
Author: Andrew Fisher | POWERED BY SITEIQ

WHY (06 Nov 2026, client feedback): an Excel copy of every report, built
from the same model as the PDF so the two agree by construction, every
tab filterable. This module turns a family's model into a coates_xlsx
Workbook: the tooling family from its Blocks (every table and the full
register), the gas monitor family from its metric dictionary.
"""
import datetime as dt
import html as _html
import os
import re

import ampol_names as N
import coates_xlsx as cx

_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")
_MONEY = re.compile(r"^-?\$\s?[\d,]+(\.\d+)?$")
_INT = re.compile(r"^-?[\d,]+$")
_NUM = re.compile(r"^-?[\d,]*\.\d+$")
_PCT = re.compile(r"^-?[\d,]*(\.\d+)?\s?%$")
_DATE = re.compile(r"^\d{1,2} [A-Za-z]{3} \d{4}$")
_DATE2 = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}$")
_DAYS = re.compile(r"^(\d+)\s?d$")


def plain(v):
    """Cell HTML -> the words: tags off, entities decoded, spaces tidied."""
    if v is None:
        return ""
    s = _TAG.sub(" ", str(v))
    s = _html.unescape(s).replace("\xa0", " ")
    return _WS.sub(" ", s).strip()


def typed(v):
    """A printed cell -> (value, kind). kind: int, num, money, pct, date,
    text, none. '1,506' -> 1506; '$1,234.50' -> 1234.5; '34.2%' -> 0.342;
    '04 Sep 2026' -> date; '32d' -> 32 (days); '-' -> None."""
    if isinstance(v, (int, float, dt.date, dt.datetime)):
        if isinstance(v, bool):
            return v, "text"
        if isinstance(v, (dt.date, dt.datetime)):
            return v, "date"
        return v, ("int" if isinstance(v, int) else "num")
    s = plain(v)
    if s in ("", "-", "–", "—", "TBC", "n/a", "N/A"):
        return None, "none"
    core = s.replace("−", "-")
    # WHY (07 Nov 2026): '301 (November partial)' is the number 301 with a note -
    # stored as text it dropped out of the quarter chart; '+38' is the number 38
    mnote = re.match(r"^([+-]?[\d,]+(?:\.\d+)?)\s*\([^)]*\)$", core)
    if mnote:
        core = mnote.group(1)
    if re.match(r"^\+[\d,]+(\.\d+)?$", core):
        core = core[1:]
    if _MONEY.match(core):
        return float(core.replace("$", "").replace(",", "").replace(" ", "")), "money"
    if _PCT.match(core):
        try:
            return float(core.replace("%", "").replace(",", "").strip()) / 100.0, "pct"
        except ValueError:
            return s, "text"
    if _INT.match(core):
        try:
            return int(core.replace(",", "")), "int"
        except ValueError:
            return s, "text"
    if _NUM.match(core):
        try:
            return float(core.replace(",", "")), "num"
        except ValueError:
            return s, "text"
    m = _DAYS.match(core)
    if m:
        return int(m.group(1)), "int"
    if _DATE.match(core):
        try:
            return dt.datetime.strptime(core, "%d %b %Y").date(), "date"
        except ValueError:
            return s, "text"
    if _DATE2.match(core):
        try:
            return dt.datetime.strptime(core, "%d/%m/%Y").date(), "date"
        except ValueError:
            return s, "text"
    return s, "text"


def table_to_sheet(headers, rows):
    """(headers, typed rows, formats) from printed cells: a column takes
    the format of the kind most of its values share."""
    heads = [plain(h) for h in headers]
    out, kinds = [], [dict() for _ in heads]
    for r in rows:
        row = []
        for i, c in enumerate(list(r)[:len(heads)]):
            v, k = typed(c)
            row.append(v)
            if k != "none":
                kinds[i][k] = kinds[i].get(k, 0) + 1
        while len(row) < len(heads):
            row.append(None)
        out.append(row)
    fmts = {}
    for i, kd in enumerate(kinds):
        if not kd:
            continue
        top = max(kd, key=kd.get)
        if top == "text" and sum(kd.values()) - kd["text"] > kd["text"]:
            del kd["text"]
            top = max(kd, key=kd.get)
        fmts[i] = {"int": cx.INT, "num": "#,##0.00", "money": cx.MONEY, "pct": cx.PCT1, "date": cx.DATE}.get(top)
        if fmts[i] is None:
            del fmts[i]
        elif top != "text":
            # a mostly-numeric column keeps its words as text in the odd cell
            for row in out:
                if isinstance(row[i], str) and top in ("int", "num", "money", "pct"):
                    pass
    return heads, out, fmts


def _is_total(row):
    return bool(row) and isinstance(row[0], str) and row[0].strip().upper() in ("TOTAL", "TOTALS", "ALL")


# ------------------------------------------------------------ tooling ---
def tooling_workbook(bl, title, cfg, asat_s, gen_s, path, limits=(), hidden_note="", sources=None,
                     report_day=None):
    """The tooling family's Excel twin from its Blocks: the first story as
    the position, the tiles as headlines, the three things as the asks,
    every table as a tab (named by the heading above it), the register
    flattened to one filterable tab with the ageing colour, charts from
    the register, the honest limits as notes."""
    wb = cx.Workbook(title, cfg.get("project", ""), asat_s, kicker=cfg.get("kicker", ""),
                     client=cfg.get("client", "Ampol"), gen=gen_s, hidden_note=hidden_note)
    section, sub, n_tab = "", "", 0
    headlines, asks, lines = [], [], []
    status_line = ""
    register_rows = []
    n_register = 0
    tables = []          # (tab name, heads, typed rows) - the Dashboard draws from these
    for b in bl.items:
        k = b[0]
        if k == "h2":
            section, sub = plain(b[1]), ""
        elif k == "subh":
            sub = plain(b[1])
        elif k == "tiles" and len(headlines) < 8:
            for t in b[1]:
                val, label = t[0], t[1]
                note = plain(t[3]) if len(t) > 3 else ""
                v, kind = typed(val)
                headlines.append((plain(label), v if v is not None else plain(val), note))
        elif k == "three" and not asks:
            asks = [(plain(w), plain(y), plain(o)) for w, y, o in b[1] if w]
        elif k == "story" and not lines:
            lines = [plain(b[1])]
        elif k == "rag" and not status_line and isinstance(b[1], dict) and b[1].get("status"):
            # WHY (07 Nov 2026, QA): the workbook carries the PDF's RED / AMBER /
            # GREEN headline, word for word, at the top of the Cover
            status_line = f"{str(b[1]['status']).upper()} - {plain(b[1].get('head_txt', ''))}"
        elif k == "table":
            headers, rows = b[1], b[2]
            if not rows:
                continue
            heads, trows, fmts = table_to_sheet(headers, rows)
            n_tab += 1
            name = (sub or section or f"Table {n_tab}")
            what = " - ".join(x for x in (section, sub) if x) or name
            rules = {}
            for i, h in enumerate(heads):
                hl = h.lower()
                # days OUT colour amber/red; hire days in a utilisation table are
                # use, not lateness - a busy item is never painted red
                if hl in ("days", "days out", "held", "days held") and fmts.get(i) == cx.INT:
                    rules[i] = ("days", 30, 90)
                if hl in ("rating", "recommendation", "usage rating"):
                    rules[i] = "rag"
                if hl in ("status", "rag", "urgency"):
                    rules[i] = "rag_word"
            wb.sheet(name, heads, trows, formats=fmts, rules=rules, what=what, emphasis=_is_total)
            tables.append((name, heads, trows))
        elif k == "register":
            n_register += 1
            for co in b[1]:
                # WHY (07 Nov 2026, QA): a custody or holding account is not a
                # company - "Hoses Off Site" led Q1's value chart. It prints in
                # the account column under its holder type; the charts count
                # what the PDF counts (customers plus the Repairs custody
                # inside the count; holding accounts outside it are listed only)
                custody = bool(co.get("custody"))
                in_count = co.get("in_count", True)
                for g in co["groups"]:
                    for r in g["items"]:
                        desc = N.display_desc(r.get("desc_show") or r.get("desc", ""), barcode=r.get("barcode"))
                        if custody:
                            kind = "Repairs custody - in the count" if in_count else "Holding account - outside the count"
                            company, account = "-", N.hirer_label(co["name"])
                            hirer = N.hirer_label(g["hirer"])
                        else:
                            kind = "Account" if g.get("is_account") else "Person"
                            company = N.display_company(co["name"]) or co["name"]
                            hirer = N.hirer_label(g["hirer"]) if g.get("is_account") else N.display_person(g["hirer"])
                            account = N.hirer_label(g.get("account")) if g.get("account") else ""
                        register_rows.append([company, hirer, account, desc, str(r.get("barcode", "")).upper(),
                                              r.get("date"), r.get("days"), r.get("cost"), kind,
                                              (not custody), (not custody) or in_count])
    if register_rows:
        reg_heads = ["Company", "Hirer", "SiteIQ account", "Description", "Barcode", "On hire since",
                     "Days", "Replacement $", "Holder type"]
        flags = [(r[9], r[10]) for r in register_rows]
        register_rows = [r[:9] for r in register_rows]
        wb.sheet("On-hire register", reg_heads, register_rows,
                 formats={5: cx.DATE, 6: cx.INT, 7: cx.MONEY}, rules={6: ("days", 30, 90)},
                 widths={0: 26, 1: 24, 2: 22, 3: 46, 4: 20, 5: 14, 6: 9, 7: 14, 8: 11},
                 what="Every item on hire - company A to Z, hirer A to Z, longest-held first; filter any column")
        # charts from the register: who holds the most, and the ageing bands
        by_co = {}
        customer_rows = [r for r, (cust, _c) in zip(register_rows, flags) if cust]
        counted_rows = [r for r, (_cu, cnt) in zip(register_rows, flags) if cnt]
        for r in customer_rows:
            by_co[r[0]] = by_co.get(r[0], 0) + 1
        top = sorted(by_co.items(), key=lambda kv: -kv[1])[:12]
        if top:
            wb.chart("bar", "Items on hire by company - the largest twelve", [c for c, _ in top], [("Items", [n for _, n in top])])
        # WHY (07 Nov 2026, QA): the PDF's five bands in the house colours -
        # 0-30 green, 31-60 amber, 61-90 deep amber, 91+ red (over 180 darker)
        bands = [("0-30 days", 0, 30), ("31-60 days", 31, 60), ("61-90 days", 61, 90), ("91-180 days", 91, 180),
                 ("Over 180 days", 181, None)]
        counts = []
        for lab, lo, hi in bands:
            counts.append(sum(1 for r in counted_rows if r[6] is not None and lo <= r[6] and (hi is None or r[6] <= hi)))
        wb.chart("col", "Age of what is out - items by days on hire", [b[0] for b in bands], [("Items", counts)],
                 colours=["409A55", "E08A24", "B5651D", "D0342C", "A32015"])
        # a value-by-company chart when prices are known
        val = {}
        for r in customer_rows:
            if isinstance(r[7], (int, float)) and r[7]:
                val[r[0]] = val.get(r[0], 0.0) + float(r[7])
        topv = sorted(val.items(), key=lambda kv: -kv[1])[:12]
        if topv:
            wb.chart("bar", "Replacement value on hire by company - priced items", [c for c, _ in topv],
                     [("Replacement $", [round(v, 2) for _, v in topv])], fmt="$#,##0")
    # WHY (06 Nov 2026): native charts for the reports without a register
    # (the Executive Summary, the quarterlies) - drawn from the tabs whose
    # headings say what they hold, so the Dashboard is never empty
    def _nums(col):
        return [v if isinstance(v, (int, float)) and not isinstance(v, bool) else None for v in col]
    seen = set()
    for name, heads, trows in tables:
        nl = name.lower()
        body = [r for r in trows if not _is_total(r)]
        if not body or len(heads) < 2:
            continue
        # a week or day category prints in house style, never ISO ("04 Jan", not "2026-01-04")
        cats = [(r[0].strftime("%d %b") if isinstance(r[0], (dt.date, dt.datetime)) else str(r[0])) for r in body]
        hd = next((i for i, h in enumerate(heads) if "hire days" in h.lower()), None)
        if "working hardest" in nl and "hardest" not in seen and hd is not None:
            # WHY (07 Nov 2026, QA): the ranking is by hire days, so the bar is
            # hire days (it drew the quantity column before)
            seen.add("hardest")
            top = body[:12]
            wb.chart("bar", name, [str(r[0]) for r in top], [(heads[hd], _nums([r[hd] for r in top]))])
        elif "quarter issued" in nl and "quarter" not in seen:
            seen.add("quarter")
            wb.chart("col", name, cats, [(heads[1], _nums([r[1] for r in body]))])
        elif "week by week" in nl and "nrt" not in seen:
            seen.add("nrt")
            cols = [i for i, h in enumerate(heads) if i > 0 and "out" in h.lower()]
            if cols:
                wb.chart("line", "Tooling hires still out at each week's end", cats,
                         [(heads[i], _nums([r[i] for r in body])) for i in cols],
                         colours=["2A313C", "E08A24", "D0342C"], legend="b")
        elif "year in movements" in nl and "moves" not in seen and len(heads) >= 3:
            seen.add("moves")
            wb.chart("line", "Issues and returns by week", cats,
                     [(heads[1], _nums([r[1] for r in body])), (heads[2], _nums([r[2] for r in body]))],
                     colours=["F26222", "409A55"], legend="b")
        elif "recovery summary, by company" in nl and "byco" not in seen:
            seen.add("byco")
            ti = next((i for i, h in enumerate(heads) if "total" in h.lower() and "item" in h.lower()), None)
            if ti is not None:
                top = sorted(body, key=lambda r: -(r[ti] if isinstance(r[ti], (int, float)) else 0))[:12]
                wb.chart("bar", "Items on hire by company - the largest twelve", [str(r[0]) for r in top],
                         [("Items", _nums([r[ti] for r in top]))])
        elif "worst offenders" in nl and "worst" not in seen and len(heads) >= 4:
            seen.add("worst")
            oi = next((i for i, h in enumerate(heads) if "90" in h), 3)
            wb.chart("bar", "Worst offenders - items out more than 90 days, by holder", [f"{r[0]} ({r[1]})" for r in body],
                     [("Out more than 90 days", _nums([r[oi] for r in body]))], colours=["D0342C"])
        elif "busiest companies" in nl and "busy" not in seen and len(heads) >= 4:
            seen.add("busy")
            wb.chart("bar", "Busiest companies - hires this year and what is still out", cats[:10],
                     [(heads[1], _nums([r[1] for r in body[:10]])), (heads[2], _nums([r[2] for r in body[:10]]))],
                     colours=["2A313C", "F26222"], legend="b")
    if not wb.charts:
        # a report with no register and no named trend table still gets a
        # picture: the first short tab whose second column is numeric
        for name, heads, trows in tables:
            body = [r for r in trows if not _is_total(r)]
            if 2 <= len(body) <= 24 and len(heads) >= 2 and all(isinstance(r[1], (int, float)) or r[1] is None for r in body) \
                    and any(isinstance(r[1], (int, float)) for r in body):
                wb.chart("col" if len(body) <= 14 else "bar", name, [str(r[0]) for r in body], [(heads[1], _nums([r[1] for r in body]))])
                break
    tiles = [(h[0], h[1], h[2]) for h in headlines[:6] if isinstance(h[1], (int, float))]
    wb.dashboard(tiles=tiles)
    day = report_day or dt.date.today()
    facts = [("As at", asat_s), ("Report date", day.strftime("%d %b %Y")), ("Prepared by", "Andrew Fisher"),
             ("Report", title), ("Site", cfg.get("project", "")), ("Built", gen_s)]
    if hidden_note:
        facts.append(("Client view", "yes - some companies left out, see the note below"))
    notes = [plain(x) for x in (limits or [])]
    notes.append("Every figure is counted from the SiteIQ exports - nothing is estimated. "
                 "This workbook is the PDF's twin: the same model, the same numbers, every tab filterable.")
    if status_line:
        lines = [status_line] + list(lines)
    wb.cover(facts=facts, headlines=headlines[:8], asks=asks, notes=notes, sources=sources, lines=lines)
    return wb.save(path)


# --------------------------------------------------------- gas monitors ---
def gas_workbook(m, cfg, asat_s, gen_s, path, hidden_note="", trends=None):
    """The gas monitor family's Excel twin from the engine's metric
    dictionary: the position, where every monitor is by company, the
    overdue list, who is not bringing them back (people and companies),
    the year by month and by week, the repair queue, yesterday - and the
    non-return trend tables when the trend engine has run."""
    def num(v):
        try:
            return int(v)
        except (TypeError, ValueError):
            return v
    wb = cx.Workbook("Gas Monitor Operations", cfg.get("project", ""), asat_s, kicker=cfg.get("kicker", ""),
                     client=cfg.get("client", "Ampol"), gen=gen_s, hidden_note=hidden_note)
    R = m.get("rules", {})
    # where the monitors are, by company
    where = m.get("where") or []
    wb.sheet("Where they are", ["Company", "Out today", "1 day", "2-7 days", "8-29 days", "30+ days",
                                "Overdue (1+)", "Total out", "People", "Exposure $", "Urgency"],
             [[_company(w["name"]) or w["name"], w["today"], w["d1"], w["d2_7"], w["d8_29"], w["d30"], w["outstanding"], w["total"],
               w["people"], w["exposure"], w["urgency"]] for w in where],
             formats={1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.INT, 5: cx.INT, 6: cx.INT, 7: cx.INT, 8: cx.INT, 9: cx.MONEY},
             rules={10: "rag_word"}, what="Every monitor out to crew right now, by company and by how long")
    items = m.get("outstanding_items") or []
    # WHY (07 Nov 2026, QA): the charge applies at 30+ days out - a unit 1-29
    # days out carries no charge yet, so its cell is a dash, not $2,000
    wb.sheet("Overdue monitors", ["Days out", "Out since", "Who", "Company", "Barcode", "Serial", "Description", "Charge at 30+ days $"],
             [[x["days"], x.get("on_dt"), N.hirer_label(x["who"]) if str(x.get("who") or "").strip() else "", _company(x["co"]),
               str(x["bc"]).upper(), x.get("serial") or "", x.get("desc", ""),
               x.get("cost") if (x.get("days") or 0) >= 30 else None]
              for x in sorted(items, key=lambda x: -x["days"])],
             formats={0: cx.INT, 1: cx.DATETIME, 7: cx.MONEY}, rules={0: ("days", 8, 30)},
             what="Every monitor overdue one day or more, oldest first - the chase list")
    lg = m.get("league") or []
    wb.sheet("People - not returning", ["Who", "Company", "Draws 30d", "Not same day 30d", "Same-day % 30d",
                                        "Not same day 3 mo", "Draws 3 mo", "Not same day YTD", "Draws YTD",
                                        "Still out now", "Repeat (3+ weeks, last 30 days)"],
             [[N.hirer_label(x["name"]), _company(x["co"]), x["d30_draws"], x["d30_nsd"],
               (x["d30_sd_pct"] / 100.0) if x.get("d30_draws") else None, x["d90_nsd"], x["d90_draws"],
               x["ytd_nsd"], x["ytd_draws"], x["open_now"], "Yes" if x.get("repeat") else "No"] for x in lg],
             formats={2: cx.INT, 3: cx.INT, 4: cx.PCT1, 5: cx.INT, 6: cx.INT, 7: cx.INT, 8: cx.INT, 9: cx.INT},
             rules={10: ("yes_no", "yes_bad")}, what="Named people only, ranked by non-returns in the last 30 days")
    comps = m.get("companies") or []
    wb.sheet("Companies - not returning", ["Company", "Draws 30d", "Not same day 30d", "Rate 30d", "Rate 3 mo", "Rate YTD",
                                           "People 30d", "Still out now"],
             [[_company(c["name"]) or c["name"], c["d30_draws"], c["d30_nsd"], (c["d30_nsd_pct"] / 100.0) if c.get("d30_draws") else None,
               (c["d90_nsd_pct"] / 100.0) if c.get("d90_draws") else None, (c["ytd_nsd_pct"] / 100.0) if c.get("ytd_draws", 1) else None,
               c["d30_people"], c["open_now"]] for c in comps],
             formats={1: cx.INT, 2: cx.INT, 3: cx.PCT1, 4: cx.PCT1, 5: cx.PCT1, 6: cx.INT, 7: cx.INT},
             what="Non-return rate by company: the last 30 days against the last 3 months and the year")
    mon = m.get("monthly") or []
    wb.sheet("By month", ["Month", "Crew draws", "Back same day", "Same-day %", "People", "Part month"],
             [[x["label"], x["draws"], x.get("sd", x["draws"] - x.get("nsd", 0)), x["sd_pct"] / 100.0, x.get("people", None),
               "Yes" if x.get("partial") else "No"] for x in mon],
             formats={1: cx.INT, 2: cx.INT, 3: cx.PCT1, 4: cx.INT}, what="Volume and behaviour month by month")
    wk = m.get("weekly") or []
    wb.sheet("By week", ["Week starting", "Crew draws", "Back same day", "Not same day", "Same-day %"],
             [[w["label"], w["n"], w["sd"], w["nsd"], w["pct"] / 100.0] for w in wk],
             formats={1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.PCT1}, what="Every week of the year")
    yb = m.get("yday_by_company") or []
    tx_end = m.get("tx_window")[1] if m.get("tx_window") else None
    rec_head = f"Recovered by {tx_end:%d %b %H:%M} (end of the export)" if tx_end else "Recovered since"
    wb.sheet("Yesterday", ["Company", "Not back same day", rec_head, "Still out", "Who still has them"],
             [[_company(c["name"]) or c["name"], c["nsd"], c["recovered"], c["open"],
               ", ".join(f"{N.hirer_label(p)} ({k})" for p, k in c.get("people_open", []))]
              for c in yb], formats={1: cx.INT, 2: cx.INT, 3: cx.INT}, what="Yesterday's draws - did they come back?")
    rep = m.get("repair_cats") or []
    wb.sheet("Repair queue", ["Dräger status", "Monitors"], [[s, n] for s, n in rep], formats={1: cx.INT},
             what="Out of service - the repair queue by status")
    if trends:
        for name, heads, rows, fmts, what in trends.get("sheets", []):
            wb.sheet(name, heads, rows, formats=fmts, what=what)
        for ch in trends.get("charts", []):
            wb.chart(*ch["args"], **ch.get("kw", {}))
    # charts
    topw = sorted(where, key=lambda w: -w["outstanding"])[:12]
    if topw:
        wb.chart("stacked", "Overdue monitors by company and age", [w["name"] for w in topw],
                 [("1 day", [w["d1"] for w in topw]), ("2-7 days", [w["d2_7"] for w in topw]),
                  ("8-29 days", [w["d8_29"] for w in topw]), ("30+ days", [w["d30"] for w in topw])],
                 colours=["E08A24", "B5651D", "8A3B12", "D0342C"], legend="b")
    if mon:
        wb.chart("col", "Crew draws by month", [x["label"] for x in mon], [("Draws", [x["draws"] for x in mon])])
        wb.chart("line", "Same-day return rate by month", [x["label"] for x in mon],
                 [("Same-day %", [x["sd_pct"] / 100.0 for x in mon])], fmt="0%", colours=["409A55"])
    if wk and not trends:        # the trend engine draws the weekly line itself
        wb.chart("line", "Same-day return rate by week", [w["label"] for w in wk],
                 [("Same-day %", [w["pct"] / 100.0 for w in wk])], fmt="0%", colours=["409A55"])
    d30, ytd = m.get("d30", {}), m.get("ytd", {})
    tiles = [("Total fleet", num(m.get("fleet_total")), "on the register"),
             ("Available now", num(m.get("available")), ""),
             ("Out to crew", num(m.get("crew_out")), "named people"),
             ("Overdue 1+ days", num(m.get("outstanding")), f'{num(m.get("out_30"))} at 30+'),
             ("Same-day %, 30 days", (d30.get("sd_pct") or 0) / 100.0, f'{int(d30.get("draws") or 0):,} draws'),
             ("Repair queue", num(m.get("repairs")), "")]
    wb.dashboard(tiles=tiles)
    facts = [("As at", asat_s), ("Report date", dt.date.today().strftime("%d %b %Y")), ("Prepared by", "Andrew Fisher"),
             ("Fleet", f'{num(m.get("fleet_total"))} Dräger X-am 5000 monitors'),
             ("Transactions window", f'{m["tx_window"][0]:%d %b %Y} to {m["tx_window"][1]:%d %b %Y}' if m.get("tx_window") else "-"),
             ("Built", gen_s)]
    headlines = [("Total fleet", num(m.get("fleet_total")), ""), ("Available now", num(m.get("available")), ""),
                 ("Out to crew", num(m.get("crew_out")), ""), ("Overdue 1+ days", num(m.get("outstanding")), ""),
                 ("Overdue 30+ days", num(m.get("out_30")), ""), ("Replacement exposure", float(m.get("exposure") or 0), ""),
                 ("Same-day %, last 30 days", (d30.get("sd_pct") or 0) / 100.0, ""), ("Same-day %, year to date", (ytd.get("sd_pct") or 0) / 100.0, "")]
    asks = []
    for w in (m.get("focus3") or [])[:3]:
        asks.append((f'{w["name"]}: {w["outstanding"]} overdue ({w["d30"]} at 30+ days)',
                     "the overdue list is on the Overdue monitors tab, oldest first", "Andrew Fisher"))
    notes = ["Crew draws are transactions to a named person; custody and workflow accounts are reported on their own lines. "
             "Same day = back on the calendar day it went out (a draw after 15:00 counts as same day if back by 08:00 next morning). "
             "Overdue = on hire to a person with an on-hire date before the report date.",
             "Every figure is counted from the SiteIQ RENTAL_STOCK and TRANSACTIONS exports - nothing is estimated."]
    src = m.get("sources") or {}
    sources = [(os.path.basename(str(src.get("rental_stock", "RENTAL_STOCK.xlsx"))), asat_s, "Where every monitor is right now"),
               (str(src.get("transactions") or "TRANSACTIONS (joined exports)"),
                m["tx_requested"].strftime("%d %b %Y %H:%M") if m.get("tx_requested") else asat_s,
                "Every issue and return this year" + (f' - the log runs {m["tx_window"][0]:%d %b %Y %H:%M} to {m["tx_window"][1]:%d %b %Y %H:%M}'
                                                      if m.get("tx_window") else ""))]
    wb.cover(facts=facts, headlines=headlines, asks=asks, notes=notes, sources=sources)
    return wb.save(path)


# ===================================================================
# the five other families (06 Nov 2026, client feedback: an Excel copy
# of every report) - each from the builder's own model, so the PDF and
# the workbook agree by construction
# ===================================================================

PROJECT = "Ampol Lytton Refinery - Permanent Tool Store"
XLSX_MIME = "vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _book(title, cfg, asat_s, gen_s, hidden_note=""):
    cfg = cfg or {}
    return cx.Workbook(title, cfg.get("project") or PROJECT, asat_s, kicker=cfg.get("kicker", ""),
                       client=cfg.get("client", "Ampol"), gen=gen_s, hidden_note=hidden_note)


def _d(v):
    """A date/datetime through unchanged, anything else None."""
    return v if isinstance(v, (dt.date, dt.datetime)) else None


def _yn(b):
    return "Yes" if b else "No"


# WHY (06 Nov 2026, Andrew): the same naming rules as every page - a person
# as "First Last" (a shared booking account under its label), one customer
# one name, a SiteIQ account under its customer. The PDF pages apply these
# as they print; the workbook tabs apply them as they are written.
def _person(v):
    import ampol_names
    return ampol_names.display_person(v) if str(v or "").strip() else ""


def _company(v):
    import ampol_names
    return ampol_names.display_company(v) if str(v or "").strip() else ""


def _account(v):
    import ampol_names
    return ampol_names.account_label(v) if str(v or "").strip() else ""


def _facts(asat_s, gen_s, extra=()):
    return [("As at", asat_s), ("Report date", dt.date.today().strftime("%d %b %Y")),
            ("Prepared by", "Andrew Fisher")] + list(extra) + [("Built", gen_s)]


# ------------------------------------------------------------- radios ---
def radio_workbook(d, F, INS, changes, cfg, asat_s, gen_s, path, prior_label, hidden_note="",
                   sources=None):
    """The radio family's twin: every radio and battery on hire (by
    company, longest held first), the prior-year holders, what is on the
    shelf, out of service, what moved since the last pull and in the 24
    hours before it, and the year's movements from the transaction log."""
    wb = _book("Site Radio On-Hire Report", cfg, asat_s, gen_s, hidden_note)
    # WHY (07 Nov 2026, QA): longest held first, ties by the earlier hire;
    # one barcode case; the storage unit is the one SiteIQ last recorded (for
    # a unit on hire, where it was issued from), in one case; the issue year
    # is a number; red from 30 days, the PDF's rule
    def _when_key(i):
        return (str(i.get("date") or ""), str(i.get("time") or ""))
    r_on = sorted(d["r_cur"] + d["r_prev"], key=lambda i: (i["company"].upper(), -i["days"], _when_key(i), str(i["barcode"]).upper()))
    b_on = sorted(d["b_cur"] + d["b_prev"], key=lambda i: (i["company"].upper(), -i["days"], _when_key(i), str(i["barcode"]).upper()))

    def _unit(u):
        u = str(u or "").strip()
        return u[:1].upper() + u[1:].lower() if u else ""

    def _yr(y):
        return int(y) if str(y or "").strip().isdigit() else (y or "")

    def _who(h):
        return N.hirer_label(h) if str(h or "").strip() else ""

    def unit_row(i, serial=True):
        r = [i["company"], _who(i["hirer"]), str(i["barcode"]).upper()] + ([i["serial"]] if serial else []) + [
            i["desc"], _d(i["date"]), i["time"] or "", i["days"], _yr(i["year"]), i["cost"], _unit(i["unit"])]
        return r
    unit_note = ("Last storage unit is the unit SiteIQ last recorded - for a unit on hire it is where it was issued "
                 "from, not where it is now.")
    hdr_r = ["Company", "Hirer", "Barcode", "Serial", "Description", "On hire since", "Time", "Days", "Issued in",
             "Replacement $", "Last storage unit"]
    wb.sheet("Radios on hire", hdr_r, [unit_row(i) for i in r_on],
             formats={5: cx.DATE, 7: cx.INT, 8: "0", 9: cx.MONEY}, rules={7: ("days", 30, 30)}, note=unit_note,
             what="Every radio on hire, by company, longest held first")
    hdr_b = [h for h in hdr_r if h != "Serial"]
    wb.sheet("Batteries on hire", hdr_b, [unit_row(i, serial=False) for i in b_on],
             formats={4: cx.DATE, 6: cx.INT, 7: "0", 8: cx.MONEY}, rules={6: ("days", 30, 30)}, note=unit_note,
             what="Every battery on hire, by company, longest held first")
    prev_all = sorted(F["prev_all"], key=lambda i: (-i["days"], i["company"].upper()))
    wb.sheet(f"Issued {prior_label}, still out", ["Kind", "Company", "Hirer", "Barcode", "Serial", "Description",
                                              "On hire since", "Days", "Replacement $", "Last storage unit"],
             [[i["kind"].title(), i["company"], _who(i["hirer"]), str(i["barcode"]).upper(), i["serial"], i["desc"], _d(i["date"]),
               i["days"], i["cost"], _unit(i["unit"])] for i in prev_all],
             formats={6: cx.DATE, 7: cx.INT, 8: cx.MONEY}, rules={7: ("days", 30, 30)}, note=unit_note,
             what=f"The chase list - units issued in {prior_label} and still out, oldest first")
    # by company
    comp = {}
    for i in F["all_on"]:
        c = comp.setdefault(i["company"], {"r": 0, "b": 0, "prior": 0, "oldest": 0, "val": 0.0, "unpriced": 0})
        c["r" if i["kind"] == "radio" else "b"] += 1
        if i in prev_all:
            c["prior"] += 1
        c["oldest"] = max(c["oldest"], i["days"])
        if i["cost"]:
            c["val"] += i["cost"]
        else:
            c["unpriced"] += 1
    crows = [[k, v["r"], v["b"], v["r"] + v["b"], v["prior"], v["oldest"], v["val"], v["unpriced"]]
             for k, v in sorted(comp.items(), key=lambda kv: (-(kv[1]["r"] + kv[1]["b"]), kv[0].upper()))]
    if crows:
        crows.append(["TOTAL", sum(r[1] for r in crows), sum(r[2] for r in crows), sum(r[3] for r in crows),
                      sum(r[4] for r in crows), max(r[5] for r in crows), sum(r[6] for r in crows), sum(r[7] for r in crows)])
    wb.sheet("By company", ["Company", "Radios", "Batteries", "Units", f"Issued in {prior_label}", "Oldest days",
                            "Replacement $", "Unpriced"], crows,
             formats={1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.INT, 5: cx.INT, 6: cx.MONEY, 7: cx.INT},
             emphasis=_is_total, what="Units on hire by company, most first - the value is at the data page prices")
    av = sorted(d["r_avail"] + d["b_avail"], key=lambda i: (i["kind"], str(i["unit"]).upper(), str(i["barcode"]).upper()))
    wb.sheet("Available in store", ["Kind", "Barcode", "Serial", "Description", "Storage unit"],
             [[i["kind"].title(), str(i["barcode"]).upper(), i["serial"], i["desc"], _unit(i["unit"])] for i in av],
             what="On the shelf at the pull - ready to issue")
    oos = sorted(d["oos"], key=lambda i: -i["days"])
    wb.sheet("Out of service", ["Kind", "Barcode", "Serial", "Description", "Custody line", "Since", "Days", "Replacement $"],
             [[i["kind"].title(), str(i["barcode"]).upper(), i["serial"], i["desc"], _who(i["hirer"]), _d(i["date"]), i["days"], i["cost"]] for i in oos],
             formats={5: cx.DATE, 6: cx.INT, 7: cx.MONEY}, what="Units on the out-of-service custody line")
    # since the last pull
    if changes and changes.get("have_previous"):
        rows = []
        for kind, lst in (("Came back", changes["returned"]), ("Went out", changes["issued"]),
                          ("Changed hands", changes["moved"]), ("Crossed 30 days", changes["crossed"].get(30, []))):
            for r in lst:
                rows.append([kind, _company(r.get("company", "")), _who(r.get("hirer", "")), str(r.get("barcode", "")).upper(), r.get("desc", ""),
                             r.get("days_out"), _who(r.get("from_hirer", "")), r.get("now", "")])
        wb.sheet("Since the last pull", ["Change", "Company", "Hirer", "Barcode", "Description", "Days out",
                                         "From hirer", "Now"], rows, formats={5: cx.INT},
                 note=f"Previous pull {changes['prev_time']:%d %b %Y %H:%M}; this pull {changes['cur_time']:%d %b %Y %H:%M}.",
                 what="What changed between the previous SiteIQ pull and this one")
    L24 = (changes or {}).get("last24") or {}
    if L24.get("available"):
        rows = [["Issued", r["at"], _company(r["company"]), _person(r["hirer"]), r["barcode"], r["desc"]] for r in L24["issued"]] + \
               [["Returned", r["at"], _company(r["company"]), _person(r["hirer"]), r["barcode"], r["desc"]] for r in L24["returned"]]
        rows.sort(key=lambda r: r[1])
        ws_, we_ = L24["window"]
        wb.sheet("Last 24 hours", ["Movement", "At", "Company", "Hirer", "Barcode", "Description"], rows,
                 formats={1: cx.DATETIME}, note=f"Issues and returns from {ws_:%d %b %H:%M} to {we_:%d %b %Y %H:%M}, from TRANSACTIONS.",
                 what="The 24 hours before the pull, from the transaction log")
    if INS:
        wk = INS.get("weekly") or []
        wb.sheet("By week", ["Week starting", "Issues", "Returns", "Net", "Same-day %", "Part week"],
                 [[w["start"], w["issues"], w["returns"], w["net"], (w["sd_pct"] / 100.0) if w["sd_pct"] is not None else None,
                   _yn(w["partial"])] for w in wk],
                 formats={0: cx.DATE, 1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.PCT1},
                 what="Issues and returns of this report's barcodes, every week of the log")
        nr = INS.get("nonreturn") or []
        wb.sheet("Still out by week", ["Week ending", "Issues", "Returns", "Still out", "Out more than 30 days",
                                       "Out more than 90 days", "Part week"],
                 [[r["end"], r["issues"], r["returns"], r["out"], r["over30"], r["over90"], _yn(r["partial"])] for r in nr],
                 formats={0: cx.DATE, 1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.INT, 5: cx.INT},
                 what="The non-return trend - hires in the log still open at each week's end, and how long they had been out")
        if nr:
            wb.chart("line", "Radio hires still out at each week's end", [r["week"] for r in nr],
                     [("Still out", [r["out"] for r in nr]), ("Out more than 30 days", [r["over30"] for r in nr]),
                      ("Out more than 90 days", [r["over90"] for r in nr])], colours=["2A313C", "E08A24", "D0342C"], legend="b")
        ho = (INS.get("holders") or {}).get("rows") or []
        wb.sheet("Who holds the gear", ["Hirer", "Company", "Units", "Replacement $", "Oldest days", "Also holds"],
                 [[N.hirer_label(h["hirer"]), _company(h["company"]), h["items"], h.get("rvalue", 0.0), h["oldest"],
                   ", ".join({"gas": "gas monitors"}.get(str(a).strip().lower(), a) for a in h.get("also", []))] for h in ho],
                 formats={2: cx.INT, 3: cx.MONEY, 4: cx.INT}, what="Ranked by units held, with what else each holder has from the store")
        rw = (INS.get("rw") or {}).get("rows") or []
        if rw:
            def _prod(x):
                # the product under the suite's one name (as the register tabs print it)
                x = str(x)
                return N.product_name(x) or (x[:1].upper() + x[1:].lower() if x.isupper() else x)
            rw_sorted = sorted(rw, key=lambda r: (0 if "radio" in str(r["product"]).lower() and "batt" not in str(r["product"]).lower() else 1,
                                                  str(r["product"]).upper()))
            rw_rows = [[_prod(r["product"]), r["n"], r["median"], r["p90"], (r.get("sd_pct") or 0) / 100.0] for r in rw_sorted]
            allr = (INS.get("rw") or {}).get("all")
            if isinstance(allr, dict) and allr.get("n"):
                rw_rows.append(["TOTAL", allr["n"], allr.get("median"), allr.get("p90"), (allr.get("sd_pct") or 0) / 100.0])
            wb.sheet("How long hires run", ["Product", "Completed hires", "Median (days)", "90th percentile (days)", "Same-day %"],
                     rw_rows, formats={1: cx.INT, 2: "0.0", 3: "0.0", 4: cx.PCT1}, emphasis=_is_total,
                     what="Return windows by product, from completed hires - radios, then batteries")
    # charts and tiles
    top = crows[:-1][:12] if crows else []
    if top:
        wb.chart("stacked", "Units on hire by company" + (" - the largest twelve" if len(crows) - 1 > 12 else ""), [r[0] for r in top],
                 [("Radios", [r[1] for r in top]), ("Batteries", [r[2] for r in top])], colours=["F26222", "2A313C"], legend="b")
    if INS and INS.get("weekly"):
        wk = INS["weekly"]
        wb.chart("line", "Issues and returns by week", [w["week"] for w in wk],
                 [("Issues", [w["issues"] for w in wk]), ("Returns", [w["returns"] for w in wk])], colours=["F26222", "409A55"], legend="b")
    n_on = len(F["all_on"])
    wb.dashboard(tiles=[("On-hire value", float(F["exposure"]), f"{n_on:,} units"),
                        ("Radios on hire", len(r_on), ""), ("Batteries on hire", len(b_on), ""),
                        (f"Issued in {prior_label}", len(prev_all), f"{F['prior_pct']}% of units"),
                        ("Available", f"{len(d['r_avail'])} / {len(d['b_avail'])}", "radios / batteries"),
                        ("Out of service", len(oos), "")])
    wb.cover(facts=_facts(asat_s, gen_s, [("Fleet", f"{d['n_radio']} radios, {d['n_batt']} batteries on the register")]),
             headlines=[("Units on hire", n_on, ""), ("Replacement value", float(F["exposure"]), ""),
                        (f"Issued {prior_label}, still out", len(prev_all), f"{F['prior_pct']}%"),
                        ("Oldest hire, days", F["oldest"], ""), ("Radios on hire", len(r_on), ""),
                        ("Batteries on hire", len(b_on), ""), ("Available radios", len(d["r_avail"]), ""),
                        ("Out of service", len(oos), "")],
             asks=[(F["action"], F["headline"], "Andrew Fisher")],
             notes=[F["rule"], "Replacement values are the pricing master's new-replacement price per unit; "
                    "unpriced units are counted but never valued.",
                    "Every figure is counted from the SiteIQ RENTAL_STOCK pull - nothing is estimated."],
             sources=sources or [("RENTAL_STOCK.xlsx", asat_s, "Where every radio and battery is right now")],
             lines=[F["headline"]])
    return wb.save(path)


# ---------------------------------------------------------- stocktake ---
def stocktake_workbook(rows, d, a, fm, tx_window, band, cfg, asat_s, gen_s, path, hidden_note="", sources=None):
    """The stocktake compliance twin: the position by tier and by bay,
    the shelf tail, long hires, on-hire verification by company, possible
    missed returns, the daily three, who is counting, the activity by day
    and week, the fast movers and every countable item."""
    wb = _book("Stocktake Compliance Report", cfg, asat_s, gen_s, hidden_note)
    tier = [[lab, tgt, n, oh, ins, wt, w30, (p30 or 0) / 100.0, why] for k, lab, tgt, why, n, oh, ins, wt, w30, p30 in d["tier_stats"]]
    wb.sheet("Position by tier", ["Tier", "Target days", "Items", "On hire", "In store", "Within own target",
                                  "Sighted 30d", "Coverage 30d", "Why it matters"], tier,
             formats={1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.INT, 5: cx.INT, 6: cx.INT, 7: cx.PCT1}, rules={7: "bar"},
             wrap=[8], widths={8: 60}, what="The SOP position tier by tier")
    ut = a["units"]
    wb.sheet("By bay", ["Bay", "Items in store", "Sighted 30d", "Coverage 30d", "Due now", "Oldest days", "Value $"],
             [[u["unit"], u["n"], u["ok"], u["pct"] / 100.0, u["due"], (None if u["oldest"] == 99999 else u["oldest"]), u["val"]] for u in ut],
             formats={1: cx.INT, 2: cx.INT, 3: cx.PCT1, 4: cx.INT, 5: cx.INT, 6: cx.MONEY}, rules={3: "bar"},
             what="Coverage by home bay, biggest bays first - where the trolley goes next")

    def item_row(r, onhire=False):
        return ([_company(r["company"]), (N.hirer_label(r["hirer"]) if str(r.get("hirer") or "").strip() else "")] if onhire else []) + [r["unit"], r["barcode"], N.display_desc(r["desc"], barcode=r.get("barcode")), r["cat"].title(),
                _d(r.get("ohd")) if onhire else None, _d(r["last"]), r["by"], r["days"], r["target"], r["value"]]
    tail = sorted(a["ins_over30"], key=lambda r: (0 if r["days"] is None else 1, -(r["days"] or 0)))
    wb.sheet("Shelf over 30 days", ["Bay", "Barcode", "Description", "Tier", "", "Last sighted", "By", "Days", "Target", "Value $"],
             [[x for i, x in enumerate(item_row(r)) if i != 4] + [None] for r in tail][:0] or
             [[r["unit"], r["barcode"], N.display_desc(r["desc"], barcode=r.get("barcode")), r["cat"].title(), "", _d(r["last"]), r["by"], r["days"], r["target"], r["value"]] for r in tail],
             formats={5: cx.DATETIME, 7: cx.INT, 8: cx.INT, 9: cx.MONEY}, rules={7: ("days", 31, 91)},
             note="A blank Days cell is an item never sighted since it was added - the first thing to count.",
             what="In-store items outside 30 days, never sighted first then oldest first - the worklist")
    lh = sorted(a["oh_risk180"], key=lambda r: (0 if r["days"] is None else 1, -(r["days"] or 0)))
    wb.sheet("Long hires 180d+", ["Company", "Hirer", "Bay", "Barcode", "Description", "Tier", "On hire since",
                                  "Last sighted", "By", "Days", "Target", "Value $"],
             [item_row(r, True) for r in lh], formats={6: cx.DATETIME, 7: cx.DATETIME, 9: cx.INT, 10: cx.INT, 11: cx.MONEY},
             rules={9: ("days", 181, 365)}, what="On-hire gear not sighted for 180 days - verify at the next return or shutdown check")
    def _st_word(x):
        return {"ON HIRE": "On hire", "AVAILABLE FOR HIRE": "Available"}.get(str(x or "").strip().upper(), x)
    co = a["onhire_co"]
    wb.sheet("On hire by company", ["Company", "Items", "Outside 30d", "Value $", "Custody line"],
             [[_company(c["co"]) or c["co"], c["n"], c["due"], c["val"], _yn(c["custody"])] for c in co],
             formats={1: cx.INT, 2: cx.INT, 3: cx.MONEY}, widths={0: 34, 3: 16, 4: 14},
             what="On-hire verification by company, most items first")
    mr = d["missed_returns"]
    wb.sheet("Possible missed returns", ["Barcode", "Description", "Bay seen in", "Hirer", "Company", "On hire since", "Last sighted", "By"],
             [[r["barcode"], N.display_desc(r["desc"], barcode=r.get("barcode")), r["unit"], (N.hirer_label(r["hirer"]) if str(r.get("hirer") or "").strip() else ""), _company(r["company"]), _d(r.get("ohd")), _d(r["last"]), r["by"]] for r in mr],
             formats={5: cx.DATETIME, 6: cx.DATETIME},
             what="On hire in SiteIQ but sighted in a store bay after the hire began - scan them back in")
    wb.sheet("Not on live register", ["Barcode", "Description", "Bay", "Last sighted", "By"],
             [[r["barcode"], N.display_desc(r["desc"], barcode=r.get("barcode")), r["unit"], _d(r["last"]), r["by"]] for r in d["not_on_register"]],
             formats={3: cx.DATETIME}, what="Stocktake lines SiteIQ's live register no longer carries")
    wb.sheet("Awaiting arrival", ["Barcode", "Description", "Bay", "Last sighted", "By"],
             [[r["barcode"], N.display_desc(r["desc"], barcode=r.get("barcode")), r["unit"], _d(r["last"]), r["by"]] for r in d["awaiting_arrival"]],
             formats={3: cx.DATETIME}, what="Items the register shows as awaiting arrival")
    three = []
    for lab, key in (("Gas monitors", "gas"), ("Radios", "radio"), ("Batteries", "battery")):
        grp, seen, missed = a[key]
        seen_set = {id(r) for r in seen}
        for r in sorted(grp, key=lambda r: (id(r) in seen_set, r["unit"], r["barcode"])):
            three.append([lab, r["barcode"], N.display_desc(r["desc"], barcode=r.get("barcode")), r["unit"], _d(r["last"]), r["days"], _yn(id(r) in seen_set)])
    wb.sheet("Daily three", ["Group", "Barcode", "Description", "Bay", "Last sighted", "Days", "Sighted in 24 h"], three,
             formats={4: cx.DATETIME, 5: cx.INT}, rules={6: "yes_no"},
             what="The in-store gas monitors, radios and batteries - sighted in the 24 hours before the pull or not")
    wb.sheet("Counting league", ["Who", "Items 7d", "Items 30d", "Stocktake scans 30d", "Last sighting"],
             [[p["name"], p["d7"], p["d30"], p["st30"], _d(p["last"])] for p in a["league"]],
             formats={1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.DATETIME}, what="Who sighted what, by items in the last 30 days")
    wb.sheet("Activity - 14 days", ["Day", "Items last sighted", "Of which stocktake scans"],
             [[x["label"], x["issued"], x["returned"]] for x in a["days14"]], formats={1: cx.INT, 2: cx.INT},
             note="The export carries each item's most recent sighting only, so these are items by the day of their latest sighting, not scans performed.",
             what="Items by latest sighting day, the last 14 days")
    wb.sheet("Activity - by week", ["Week starting", "Items last sighted"], [[w["label"], w["n"]] for w in a["weekly"]],
             formats={1: cx.INT}, what="Items by latest sighting week, the last 12 weeks")
    if fm:
        wb.sheet("Fast movers", ["Barcode", "Description", "Bay", "Status", "Moves", "Last move"],
                 [[r["barcode"], N.display_desc(r["desc"], barcode=r.get("barcode")), r["unit"], _st_word(r["status"]), r["moves"], _d(r["last"])] for r in fm["rows"]],
                 formats={4: cx.INT, 5: cx.DATETIME},
                 note=(f"From TRANSACTIONS {tx_window[0]:%d %b %Y} to {tx_window[1]:%d %b %Y}; {fm['items_moved']:,} barcodes moved in all."
                       if tx_window and tx_window[0] else ""),
                 what="The items the counter handles most, from the transaction log")
    allrows = sorted(rows, key=lambda r: (r["onhire"], r["unit"], r["barcode"]))
    wb.sheet("All countable items", ["Bay", "Barcode", "Description", "Tier", "Status", "Company", "Hirer", "On hire since",
                                     "Last sighted", "By", "Days", "Target", "Value $"],
             [[r["unit"], r["barcode"], N.display_desc(r["desc"], barcode=r.get("barcode")), r["cat"].title(), _st_word(r["status"]), _company(r["company"]), (N.hirer_label(r["hirer"]) if str(r.get("hirer") or "").strip() else ""), _d(r.get("ohd")),
               _d(r["last"]), r["by"], r["days"], r["target"], r["value"]] for r in allrows],
             formats={7: cx.DATETIME, 8: cx.DATETIME, 10: cx.INT, 11: cx.INT, 12: cx.MONEY}, rules={4: "status", 10: ("days", 31, 91)},
             what="Every countable item on the stocktake export, with its sighting and its value")
    # charts and tiles
    if tier:
        # WHY (07 Nov 2026, QA): each tier in its own RAG colour, the report's
        # rule (green from 90%, amber from 75%, red under) - 49.7% is red
        rag_hex = lambda v: "409A55" if v >= 0.90 else ("E08A24" if v >= 0.75 else "D0342C")
        wb.chart("col", "Coverage inside 30 days by tier", [t[0] for t in tier], [("Coverage", [t[7] for t in tier])], fmt="0%",
                 colours=[rag_hex(t[7] or 0) for t in tier] + (["98A0AA"] if len(tier) == 1 else []))
    topb = ut[:12]
    if topb:
        wb.chart("bar", "Coverage by bay - the twelve biggest bays", [u["unit"] for u in topb], [("Coverage 30d", [u["pct"] / 100.0 for u in topb])], fmt="0%",
                 colours=[("409A55" if u["pct"] >= 90 else "E08A24" if u["pct"] >= 75 else "D0342C") for u in topb] + (["98A0AA"] if len(topb) == 1 else []))
    wb.chart("col", "Items by latest sighting day - 14 days", [x["label"] for x in a["days14"]],
             [("Items", [x["issued"] for x in a["days14"]]), ("Stocktake scans", [x["returned"] for x in a["days14"]])],
             colours=["2A313C", "F26222"], legend="b")
    idle = a["idle_ins"]
    # WHY (07 Nov 2026, QA): each age band in its own colour - inside 30 days
    # green, 31-60 amber, 61-90 deep amber, older or never red
    def _band_hex(lab):
        nums = [int(x) for x in re.findall(r"\d+", str(lab))]
        if not nums:
            return "D0342C"
        top = max(nums) if "+" not in str(lab) else 10 ** 6
        return "409A55" if top <= 30 else "E08A24" if top <= 60 else "B5651D" if top <= 90 else "D0342C"
    wb.chart("col", "In-store items by days since sighted", [b[0] for b in idle], [("Items", [b[1] for b in idle])],
             colours=[_band_hex(b[0]) for b in idle] + (["98A0AA"] if len(idle) == 1 else []))
    ins_pct = (d["ok30_instore"] / len(d["instore"]) * 100) if d["instore"] else 0
    g_all, g_seen, g_miss = a["gas"]
    wb.dashboard(tiles=[("Countable items", d["countable"], f"{len(d['instore']):,} in store"),
                        ("In-store SOP 30d", f"{ins_pct:.1f}%", f"{len(a['ins_over30']):,} outside"),
                        ("Whole store SOP 30d", f"{d['comp30']:.1f}%", "on hire counted in"),
                        ("Sighted last 7 days", len(d["done7"]), "items"),
                        (("Gas monitors 2 days", f"{len(g_all) - len(a['gas_past'])}/{len(g_all)}",
                          f"{len(a['gas_past'])} past the standard" if a["gas_past"] else "all inside")
                         if "gas_past" in a else
                         ("Gas monitors 24h", f"{len(g_seen)}/{len(g_all)}", f"{len(g_miss)} missed" if g_miss else "all sighted")),
                        ("Value verified 30d", float(d["val_ok30"]), f"of {cx_money(d['val_total'])}")])
    wb.cover(facts=_facts(asat_s, gen_s, [("Countable", f"{d['countable']:,} items ({len(d['instore']):,} in store, {len(d['onhire']):,} on hire)")]),
             headlines=[("Countable items", d["countable"], ""), ("In-store SOP 30d", f"{ins_pct:.1f}%", ""),
                        ("Whole store SOP 30d", f"{d['comp30']:.1f}%", ""), ("Shelf items outside 30d", len(a["ins_over30"]), ""),
                        ("Sighted last 7 days", len(d["done7"]), ""), ("Possible missed returns", len(d["missed_returns"]), ""),
                        ("Value verified 30d", float(d["val_ok30"]), ""), ("Long hires 180d+", len(a["oh_risk180"]), "")],
             asks=[(band.get("action", ""), band.get("headline", ""), band.get("owner", "Andrew Fisher"))] if band else [],
             notes=[band.get("rule", "") if band else "",
                    "The STOCKTAKE export carries one row per item - its most recent sighting. Compliance is items sighted inside "
                    "30 days over countable items; the in-store figure is the shelf count the team controls.",
                    "Every figure is counted from the SiteIQ exports - nothing is estimated."],
             sources=sources or [("STOCKTAKE.xlsx", asat_s, "Every item's latest sighting"), ("RENTAL_STOCK.xlsx", asat_s, "Status, hirer and company")],
             lines=[band.get("headline", "")] if band else None)
    return wb.save(path)


def cx_money(v):
    try:
        return f"${float(v):,.0f}"
    except (TypeError, ValueError):
        return "-"


# -------------------------------------------------------- calibration ---
def calibration_workbook(rows, d, S, cfg, asat_s, gen_s, path, hidden_note="", sources=None):
    """The calibration register twin: overdue (the chase list by name),
    due inside 30 days, no date, overdue on the shelf and not in SiteIQ,
    on hire but not on the register, what lapsed since the register was
    last maintained, and the full register with its status at the pull."""
    wb = _book("Calibration Register Report", cfg, asat_s, gen_s, hidden_note)
    # WHY (07 Nov 2026, QA): a column the register never fills is not shown
    # (Calibrated was empty on every row); "Out since" is a hire start, so it
    # shows only for an item SiteIQ has on hire; the register's own Notes are
    # its status the day it was last saved, and the heading says so
    has_cal = any(r.get("cal_date") for r in rows)
    note_head = f"Register note (as saved {S.get('maint_s', '')})".replace(" ()", "")

    def _on_hire(r):
        return bool(re.search(r"\bon\s*hire\b", str(r.get("where") or ""), re.I))

    def reg_row(r, with_status=False):
        live = r.get("live") or {}
        return ([r["asset"], N.display_desc(r["desc"]), r["serial"], r["cert"]] + ([_d(r.get("cal_date"))] if has_cal else []) + [_d(r["due"])]
                + ([r["now_status"]] if with_status else [])
                + [r["now_days"], r["where"], N.hirer_label(r["live_hirer"]) if str(r.get("live_hirer") or "").strip() else "",
                   _company(r["company"]), _d(r.get("out")) if _on_hire(r) else None, live.get("unit", ""), r.get("notes", "")])
    hdr = (["Asset", "Description", "Serial", "Certificate"] + (["Calibrated"] if has_cal else [])
           + ["Calibration due", "Days to due (neg = overdue)", "Where (SiteIQ)", "Hirer", "Company", "Out since", "Bay", note_head])
    sh = 0 if has_cal else -1      # every column after Calibrated moves left one when it is not shown

    def F(*pairs):
        out = {}
        for i, f in pairs:
            if i == 4 and not has_cal:
                continue                  # the Calibrated column is not shown
            out[i if i < 4 else i + sh] = f
        return out
    od = d["now_overdue"]
    wb.sheet("Overdue", hdr + ["Hired after due"], [reg_row(r) + [_yn(r["issued_after_due"])] for r in od],
             formats=F((4, cx.DATE), (5, cx.DATE), (6, cx.INT), (10, cx.DATETIME)), rules={13 + sh: ("yes_no", "yes_bad")},
             what="Every asset overdue at the pull, most overdue first")
    chase = []
    for queue, groups in (("Hirer", d["now_chase_hirer"]), ("Repairs account", d["now_chase_repairs"])):
        for hirer, items in groups:
            for r in sorted(items, key=lambda r: r["now_days"]):
                chase.append([N.hirer_label(hirer), queue, _company(r["company"]), r["asset"], N.display_desc(r["desc"]), _d(r["due"]), -(r["now_days"] or 0), _d(r.get("out"))])
    wb.sheet("Chase list", ["Hirer", "Queue", "Company", "Asset", "Description", "Calibration due", "Days overdue", "Out since"],
             chase, formats={5: cx.DATE, 6: cx.INT, 7: cx.DATETIME}, rules={6: ("days", 1, 30)},
             what="Overdue and out on hire in SiteIQ - by name, worst first inside each name")
    wb.sheet("Due inside 30 days", hdr, [reg_row(r) for r in d["now_due30"]],
             formats=F((4, cx.DATE), (5, cx.DATE), (6, cx.INT), (10, cx.DATETIME)), what="Book these in now - due inside 30 days of the pull")
    wb.sheet("No date", hdr, [reg_row(r) for r in d["nodate"]], formats=F((4, cx.DATE), (5, cx.DATE), (10, cx.DATETIME)),
             what="No certificate date on the register - status unknown until it is entered")
    wb.sheet("Overdue on the shelf", hdr, [reg_row(r) for r in d["now_od_avail"]],
             formats=F((4, cx.DATE), (5, cx.DATE), (6, cx.INT)), what="Overdue and available for hire in SiteIQ - pull them off the shelf")
    wb.sheet("Overdue not in SiteIQ", hdr, [reg_row(r) for r in d["now_od_missing"]],
             formats=F((4, cx.DATE), (5, cx.DATE), (6, cx.INT)), what="Overdue on the register with no RENTAL_STOCK line at all")
    kw_set = {id(l) for l in d["kw"]}
    nir = sorted(d["nir"], key=lambda l: (l["hirer"].upper(), l["desc"].upper()))
    wb.sheet("On hire, not in register", ["Barcode", "Description", "Hirer", "Company", "Out since", "Bay", "Calibration keyword"],
             [[l["barcode"], N.display_desc(l["desc"]), N.hirer_label(l["hirer"]) if str(l.get("hirer") or "").strip() else "",
               _company(l["company"]), _d(l.get("out")), l.get("unit", ""), _yn(id(l) in kw_set)] for l in nir],
             formats={4: cx.DATETIME},
             what="SiteIQ lines on hire that the register does not list - the keyword column flags likely calibrated gear")
    wb.sheet("Lapsed since maintained", hdr, [reg_row(r) for r in d["lapsed"]],
             formats=F((4, cx.DATE), (5, cx.DATE), (6, cx.INT), (10, cx.DATETIME)),
             note=f"Due dates were last maintained {S['maint_s']}, {S['stale_days']} days before the pull - a certificate issued since may not be on the register yet.",
             what="Assets that fell due between the register's last save and the pull")
    full = sorted(rows, key=lambda r: (r["now_days"] if r["now_days"] is not None else 10 ** 6, r["asset"]))
    cut = 6 + sh
    wb.sheet("Full register", hdr[:cut] + ["Status at pull"] + hdr[cut:], [reg_row(r, True) for r in full],
             formats=F((4, cx.DATE), (5, cx.DATE), (7, cx.INT), (11, cx.DATETIME)), rules={6 + sh: "rag_word"},
             what="Every asset on the Register Entry sheet with its computed status at the pull time")
    # charts and tiles
    now = d["now"]
    order = ["Overdue", "Due 0-30 Days", "Due 31-60 Days", "Due 61-90 Days", "Current", "No Date"]
    cats = [k for k in order if now.get(k)] + [k for k in now if k not in order]
    # WHY (07 Nov 2026, QA): one colour per status, the report's own rule -
    # overdue red, due inside 30 days amber, in calibration green, no date grey
    status_col = {"Overdue": "D0342C", "Due 0-30 Days": "E08A24", "Due 31-60 Days": "409A55",
                  "Due 61-90 Days": "409A55", "Current": "409A55", "No Date": "98A0AA"}
    wb.chart("col", "Register status at the pull", cats, [("Assets", [now.get(k, 0) for k in cats])],
             colours=[status_col.get(k, "5B6472") for k in cats] + (["5B6472"] if len(cats) == 1 else []))
    fam = d["now_od_family"].most_common(12)
    if fam:
        wb.chart("bar", "Overdue by item family", [k for k, _ in fam], [("Overdue", [n for _, n in fam])], colours=["D0342C"])
    ndf = d["nd_family"].most_common(12)
    if ndf:
        wb.chart("bar", "No Date by item family", [k for k, _ in ndf], [("Assets", [n for _, n in ndf])], colours=["E08A24"])
    n_od_oh = len(d["now_od_onhire"])
    wb.dashboard(tiles=[("Assets on register", d["total"], ""), ("In calibration", len(d["now_incal"]), "next due 31+ days"),
                        ("Due inside 30 days", len(d["now_due30"]), ""), ("Overdue", len(d["now_overdue"]), f"{n_od_oh} out on hire"),
                        ("No date", len(d["nodate"]), ""), ("Chase list", n_od_oh, "overdue and on hire")])
    rw = S.get("rag_words") or {}
    wb.cover(facts=_facts(asat_s, gen_s, [("Due dates maintained", f"{S['maint_s']} ({S['stale_days']} days before the pull)")]),
             headlines=[("Assets on register", d["total"], ""), ("In calibration", len(d["now_incal"]), ""),
                        ("Due inside 30 days", len(d["now_due30"]), ""), ("Overdue", len(d["now_overdue"]), ""),
                        ("Overdue and on hire", n_od_oh, ""), ("Overdue on the shelf", len(d["now_od_avail"]), ""),
                        ("No date", len(d["nodate"]), ""), ("On hire, not in register", len(d["nir"]), "")],
             asks=[(rw.get("action", ""), "", (cfg or {}).get("rag_owner", "Andrew Fisher"))] if rw and rw.get("action") else [],
             notes=[rw.get("rule", ""),
                    "Status at the pull is computed from Calibration Due against the SiteIQ pull date; where, hirer and hire start are SiteIQ's. "
                    "Nothing here needs the register workbook refreshed.",
                    "Every figure is counted from the register's entry sheet and the RENTAL_STOCK pull - nothing is estimated."],
             sources=sources or [("Ampol_Calibration_Register.xlsx", S["maint_s"], "The human-maintained list and its due dates"),
                                 ("RENTAL_STOCK.xlsx", asat_s, "Where every asset is right now")],
             lines=[rw.get("headline", "")] if rw else None)
    return wb.save(path)


# ------------------------------------------------------------ rigging ---
def rigging_workbook(d, rag, cfg, asat_s, gen_s, path, hidden_note="", sources=None):
    """The rigging and lifting register twin: on hire by company, in the
    store, at repairs, not found in SiteIQ, by category, duplicates and
    keyword leads, the year's movements and who holds the gear, the test
    record truth and the full register with where each item is."""
    wb = _book("Rigging & Lifting Register Report", cfg, asat_s, gen_s, hidden_note)
    where_word = {"onhire": "On hire", "store": "In store", "repair": "At repairs", "missing": "Not in SiteIQ", "other": "Other status"}

    def it_row(it, where=False):
        tests = it.get("tests") or {}
        live = it.get("live") or {}
        hirer = N.hirer_label(it["hirer"]) if str(it.get("hirer") or "").strip() else ""
        # a custody line (repairs, quarantine) has no customer - say so, never a blank
        co_cell = _company(it["company"]) or ("Custody line - not customer hire" if it.get("bucket") == "repair" else "")
        return ([where_word.get(it["bucket"], it["bucket"])] if where else []) + [
            co_cell, _account(it["account"]), hirer, it["barcode"], N.display_desc(it["desc"]), it["cat"], it.get("serial", ""),
            _d(it["since"]), it["held"], it["unit"], live.get("status", ""), _yn(it.get("has_test")), tests.get("Test Status", "")]
    hdr = ["Company", "Account", "Hirer", "Barcode", "Description", "Category", "Serial", "On hire since", "Days held",
           "Storage unit", "SiteIQ status", "Test record", "Test status"]
    oh = sorted(d["onhire"], key=lambda it: (it["company"].upper(), it["since"] is None, it["since"] or dt.datetime.max))
    wb.sheet("On hire", hdr, [it_row(it) for it in oh], formats={7: cx.DATETIME, 8: cx.INT}, rules={8: ("days", 90, 180), 11: "yes_no"},
             what="Register gear on hire to customers, by company, longest held first")
    wb.sheet("By company", ["Company", "Items", "Hirers", "Accounts", "Oldest since", "Oldest days", "Oldest item"],
             [[_company(c["co"]) or c["co"], c["n"], c["hirers"], ", ".join(sorted({_account(a) for a in c["accounts"]})), _d(c["oldest"]["since"]), c["oldest"]["held"],
               f'{N.display_desc(c["oldest"]["desc"])} ({c["oldest"]["barcode"]})'] for c in d["companies"]],
             formats={1: cx.INT, 2: cx.INT, 4: cx.DATETIME, 5: cx.INT}, what="Customer hire by company, A to Z")
    wb.sheet("In store", hdr, [it_row(it) for it in sorted(d["store"], key=lambda it: (it["unit"], it["barcode"]))],
             formats={7: cx.DATETIME, 8: cx.INT}, rules={11: "yes_no"}, what="Register gear available for hire in the store")
    wb.sheet("At repairs", hdr, [it_row(it) for it in sorted(d["repair"], key=lambda it: (it["hirer"].upper(), it["barcode"]))],
             formats={7: cx.DATETIME, 8: cx.INT}, rules={8: ("days", 30, 90), 11: "yes_no"}, what="On the repairs or quarantine custody lines")
    wb.sheet("Not found in SiteIQ", ["Barcode", "Description", "Category", "Serial", "Snapshot status", "Snapshot hirer", "Register rows"],
             [[it["barcode"], N.display_desc(it["desc"]), it["cat"], it.get("serial", ""), (it.get("snap") or {}).get("status", ""),
               N.hirer_label((it.get("snap") or {}).get("hirer", "")) if str((it.get("snap") or {}).get("hirer", "") or "").strip() else "",
               it.get("rows", 1)] for it in d["missing"]],
             formats={6: cx.INT}, what="Register barcodes with no RENTAL_STOCK line - last known from the workbook snapshot")
    wb.sheet("By category", ["Category", "Register rows", "Distinct items", "On hire", "At repairs", "In store", "Other", "Not found", "Oldest hire"],
             [[c["cat"], c["rows"], c["distinct"], c["onhire"], c["repair"], c["store"], c["other"], c["missing"],
               (f'{c["oldest"]["desc"]} - {c["oldest"]["held"]} days' if c["oldest"] else "")] for c in d["cat_detail"]],
             formats={1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.INT, 5: cx.INT, 6: cx.INT, 7: cx.INT}, what="Where each category's gear is")
    wb.sheet("Duplicate barcodes", ["Barcode", "Register rows"], [[b, n] for b, n in d["dups"]], formats={1: cx.INT},
             what="Barcodes that appear on more than one register row")
    wb.sheet("Keyword leads", ["Description", "Live lines", "On hire", "In store", "Other", "Example barcode"],
             [[N.display_desc(g["desc"]), g["n"], g["onhire"], g["store"], g["other"], g["eg"]] for g in d["kw_groups"]],
             formats={1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.INT}, what="Live SiteIQ lines that look like rigging gear but are not on the register")
    L = d.get("log") or {}
    wk = L.get("weekly") or []
    wb.sheet("By week", ["Week starting", "Issues", "Returns", "Net", "Same-day %", "Part week"],
             [[w["start"], w["issues"], w["returns"], w["net"], (w["sd_pct"] / 100.0) if w["sd_pct"] is not None else None, _yn(w["partial"])] for w in wk],
             formats={0: cx.DATE, 1: cx.INT, 2: cx.INT, 3: cx.INT, 4: cx.PCT1}, what="Issues and returns of register barcodes, every week of the log")
    ho = (L.get("holders") or {}).get("rows") or []
    # WHY (07 Nov 2026, QA): a column that says the same word on every row
    # ("tooling") tells the reader nothing - it shows only when holders differ
    fam_vals = {", ".join(sorted(h["families"])) for h in ho}
    ho_heads = ["Hirer", "Company", "Items", "Replacement value $ (master price)", "Oldest days"] + (["Families held"] if len(fam_vals) > 1 else [])
    wb.sheet("Who holds the gear", ho_heads,
             [[N.hirer_label(h["hirer"]), _company(h["company"]), h["items"], h["value"], h["oldest"]]
              + ([", ".join(sorted(h["families"]))] if len(fam_vals) > 1 else []) for h in ho],
             formats={2: cx.INT, 3: cx.MONEY, 4: cx.INT}, what="Ranked by items held; value from the Ampol master price list")
    wb.sheet("Test record columns", ["Column", "Rows filled", "Of rows"], [[c, n, d["rows"]] for c, n in d["col_fill"]] +
             [["(Test Status: " + k + ")", n, d["rows"]] for k, n in d["test_status"].most_common()],
             formats={1: cx.INT, 2: cx.INT}, what="How much of the test record is actually filled in")
    allit = sorted(d["items"].values(), key=lambda it: (it["bucket"], it["company"].upper(), it["barcode"]))
    wb.sheet("Full register", ["Where"] + hdr, [it_row(it, True) for it in allit], formats={8: cx.DATETIME, 9: cx.INT}, rules={12: "yes_no"},
             what="Every distinct register barcode and where SiteIQ has it")
    # charts and tiles
    buckets = [("On hire", len(d["onhire"])), ("In store", len(d["store"])), ("At repairs", len(d["repair"])),
               ("Not in SiteIQ", len(d["missing"])), ("Other", len(d["other"]))]
    buckets = [b for b in buckets if b[1]]
    wb.chart("doughnut", "Where the register gear is", [b[0] for b in buckets], [("Items", [b[1] for b in buckets])],
             colours=["F26222", "409A55", "E08A24", "D0342C", "5B6472"], legend="r")
    topc = sorted(d["companies"], key=lambda c: -c["n"])[:12]
    if topc:
        wb.chart("bar", "Customer hire by company", [_company(c["co"]) or c["co"] for c in topc], [("Items", [c["n"] for c in topc])])
    cd = d["cat_detail"]
    if cd:
        wb.chart("stacked", "Each category - where it is", [c["cat"] for c in cd],
                 [("On hire", [c["onhire"] for c in cd]), ("In store", [c["store"] for c in cd]),
                  ("At repairs", [c["repair"] for c in cd]), ("Not found", [c["missing"] for c in cd])],
                 colours=["F26222", "409A55", "E08A24", "D0342C"], legend="b")
    if wk:
        wb.chart("line", "Issues and returns by week", [w["week"] for w in wk],
                 [("Issues", [w["issues"] for w in wk]), ("Returns", [w["returns"] for w in wk])], colours=["F26222", "409A55"], legend="b")
    found_share = (float(d["found_pct"]) / 100.0) if isinstance(d.get("found_pct"), (int, float)) else d.get("found_pct")
    wb.dashboard(tiles=[("Register rows", d["rows"], f"{d['distinct']:,} distinct barcodes"), ("Found in SiteIQ %", found_share, f"{len(d['found']):,} items"),
                        ("On hire to customers", len(d["onhire"]), f"{len(d['companies'])} companies"), ("In the store", len(d["store"]), ""),
                        ("At repairs", len(d["repair"]), ""), ("Not found in SiteIQ", len(d["missing"]), "")])
    wb.cover(facts=_facts(asat_s, gen_s, [("Register", f"{d['rows']:,} rows, {d['distinct']:,} distinct barcodes")]),
             headlines=[("Not found in SiteIQ", len(d["missing"]), ""), ("On hire to customers", len(d["onhire"]), ""),
                        ("Companies", len(d["companies"]), ""), ("In the store", len(d["store"]), ""),
                        ("At repairs", len(d["repair"]), ""), ("Found in SiteIQ %", found_share, ""),
                        ("Test records filled", len(d["with_test"]), f"of {d['rows']}"), ("Keyword leads", len(d["kw"]), "")],
             asks=[(rag.get("card_action", ""), "", (cfg or {}).get("rag_owner", "Andrew Fisher"))] if rag and rag.get("card_action") else [],
             notes=[plain(rag.get("rule", "")) if rag else "",
                    "The register says WHICH barcodes are rigging gear; RENTAL_STOCK says WHERE each one is right now. "
                    "A barcode SiteIQ cannot see is shown with its last-known snapshot row, never guessed.",
                    "Every figure is counted from the register joined to the SiteIQ pull - nothing is estimated."],
             sources=sources or [("Rigging Register.xlsx", "-", "Which barcodes are on the register"), ("RENTAL_STOCK.xlsx", asat_s, "Where each one is right now")],
             lines=[plain(rag.get("headline", ""))] if rag else None)
    return wb.save(path)


# ---------------------------------------------------- daily position ---
def daily_workbook(rows, counts, hist, run_day, asat_s, gen_s, path, hidden_note=""):
    """The daily position twin: the six families' own page-1 records on
    one tab, and every recorded day of every family on another - the
    scoreboard as a table."""
    wb = _book("Daily Position", {"client": "Ampol"}, asat_s, gen_s, hidden_note)
    out = []

    def _fig(v):
        # WHY (07 Nov 2026, QA): a figure is a number in the cell, not text
        val, kind = typed(v)
        return val if kind in ("int", "num", "money", "pct") else (plain(v) if v not in (None, "") else "")

    def _when(v):
        # house style for a stamp the scoreboard stored as ISO text
        t = str(v or "").strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
            try:
                d_ = dt.datetime.strptime(t[:19] if "S" in fmt else t[:16] if "M" in fmt else t[:10], fmt)
                return d_.strftime("%d %b %Y %H:%M") if "H" in fmt else d_.strftime("%d %b %Y")
            except ValueError:
                continue
        return t

    for _o, _k, key, name, button, _ico, entry in rows:
        x = (entry or {}).get("extra") or {}
        fam = str(name or "")
        fam = fam[:1].upper() + fam[1:]
        out.append([fam, (x.get("rag") or ("not recorded" if not entry else "recorded")).upper(),
                    _fig(x.get("key_value", "")), x.get("key_label", ""), _fig(x.get("second_value", "")), x.get("second_label", ""),
                    x.get("headline", ""), x.get("owner", ""), x.get("action", ""), x.get("due", ""),
                    _when((entry or {}).get("asat", "")), x.get("pdf", ""), _when((entry or {}).get("written", ""))])
    wb.sheet("Six families", ["Family", "Status", "Key figure", "What it is", "Second figure", "What that is",
                              "Headline", "Owner", "Next action", "By", "Pull", "Report PDF", "Built"], out,
             rules={1: "rag_word"}, wrap=[6, 8], widths={6: 60, 8: 50}, formats={2: cx.INT, 4: cx.INT},
             what="Each family's own page-1 position, read back from the scoreboard it wrote")
    hrows = []
    for fam, days in (hist or {}).items():
        for day, e in sorted(days.items()):
            x = e.get("extra") or {}
            hrows.append([str(fam)[:1].upper() + str(fam)[1:], dt.date.fromisoformat(day) if len(day) == 10 else day,
                          (x.get("rag") or "").upper(), _fig(x.get("key_value", "")), x.get("key_label", ""),
                          _when(e.get("asat", "")), _when(e.get("written", ""))])
    wb.sheet("History - every day", ["Family", "Day", "Status", "Key figure", "What it is", "Pull", "Built"], hrows,
             formats={1: cx.DATE, 3: cx.INT}, rules={2: "rag_word"}, what="Every recorded day of every family - the movement scoreboard")
    wb.chart("col", "Today's tally", ["Red", "Amber", "Green", "Not recorded"],
             [("Families", [counts["red"], counts["amber"], counts["green"], counts["none"]])],
             colours=["D0342C", "E08A24", "409A55", "98A0AA"])
    wb.dashboard(tiles=[("Red - action needed", counts["red"], ""), ("Amber - at risk", counts["amber"], ""),
                        ("Green - on track", counts["green"], ""), ("Not recorded today", counts["none"], "")])
    heads = [(r[0], r[2] if r[2] not in ("", None) else "-", r[1]) for r in out][:8]
    asks = [(f'{r[0]}: {r[8]}', r[6], r[7] or "Andrew Fisher") for r in out if r[1] == "RED" and r[8]]
    wb.cover(facts=_facts(asat_s, gen_s, [("Run day", _when(run_day))]), headlines=heads, asks=asks,
             notes=["Every status, number and action is the one the family's own report printed on its page 1, read back "
                    "from the record each report writes when it is built. Nothing is counted or estimated here."],
             sources=[("The six family reports", gen_s, "Each family's page-1 position, recorded when its report was built")],
             lines=[f"{counts['red']} red, {counts['amber']} amber, {counts['green']} green across the six families"
                    + (f"; {counts['none']} not recorded" if counts["none"] else "") + "."])
    return wb.save(path)
