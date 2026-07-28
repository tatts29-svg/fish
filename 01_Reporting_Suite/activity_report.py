#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | EQUIPMENT ACTIVITY & ACCOUNTABILITY - the pages
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Level 1  the company's whole position, for their management
#  Level 2  one page per hirer, the evidence behind it
#
#  The story the report has to tell, in order:
#    1. what is happening across the whole company
#    2. which issues need management action
#    3. which hirer owns each item and each action
#    4. what that hirer took and returned
#    5. what consumables they used
#    6. was anything damaged
#    7. is the equipment compliant
#    8. what remains on hire
#    9. what happens next
#
#  Numbers come from activity_model. Nothing is calculated here - this
#  file only draws. That is what keeps the company page and the hirer
#  pages honest with each other.
# =====================================================================

import datetime as dt

import equipment_compliance as EC
import activity_model as AM

ORANGE = "#F26222"
GOOD = "#3FB950"
AMBER = "#F2B01E"
BAD = "#F85149"
BLUE = "#2F80ED"

#  The palette follows the suite theme (report_pages.EXEC_LIGHT): white
#  executive pages get light cards and dark ink; flip the switch off and
#  the old dark look comes back here too. Bright accent colours above
#  are identical on both.
try:
    import report_pages as _RP
    _LIGHT = bool(getattr(_RP, "EXEC_LIGHT", False))
except Exception:
    _LIGHT = False
CARD = "#F6F7F9" if _LIGHT else "#171B22"
LINE = "#E3E6EB" if _LIGHT else "#2A313C"
MUTED = "#5B6472" if _LIGHT else "#8B9099"
TEXT = "#262C35" if _LIGHT else "#D7DBE2"
INK = "#14181F" if _LIGHT else "#fff"       # emphasis text on page/card
FAINT = "#6B7380" if _LIGHT else "#A9B1BD"  # small labels on page/card
ZEBRA = "#F6F8FA" if _LIGHT else "#141922"  # alternating table rows


def _esc(s):
    return (str(s if s is not None else "").replace("&", "&amp;")
            .replace("<", "&lt;").replace(">", "&gt;"))


def _money(v):
    return "-" if not v else "${:,.0f}".format(v)


def _repl_hl(v):
    """Replacement money wears the highlighter (Andrew, 26 Jul 2026) -
    when a replacement cost is on a page, you SEE it."""
    return ("<span style=\"background:" + EC.NEON + ";color:#101317;"
            "font-weight:800;padding:0 4px;border-radius:4px\">"
            + _money(v) + "</span>")


def _qty(v):
    return "{:,.0f}".format(v or 0)


def _d(v):
    return v.strftime("%d %b %Y") if isinstance(v, dt.date) else "-"


# ---------------------------------------------------------------------
#  building blocks
# ---------------------------------------------------------------------
def cards(items, per_row=6):
    """The big scorecards. items = [(value, label, colour, sub)]."""
    out = []
    for chunk in [items[i:i + per_row] for i in range(0, len(items), per_row)]:
        w = 100.0 / len(chunk)
        tds = []
        for val, label, colour, sub in chunk:
            #  One literal, one .format(). Splicing a colour in with
            #  " + FAINT + " ends the string expression, so .format()
            #  binds only to the last chunk and every {v} before it is
            #  printed raw - which is exactly how a whole page of
            #  headline numbers came out as "{v}". Colours go through
            #  as named fields like everything else.
            tds.append(
                "<td style=\"width:{w}%;background:{cd};border-top:3px solid "
                "{c};border-radius:8px;padding:11px 12px 9px;"
                "vertical-align:top\">"
                "<div style=\"font-size:23pt;font-weight:800;color:{c};"
                "line-height:1\">{v}</div>"
                "<div style=\"font-size:7.5pt;color:{fa};letter-spacing:1px;"
                "text-transform:uppercase;margin-top:5px;line-height:1.35\">"
                "{l}</div>{s}</td>".format(
                    w=w, cd=CARD, c=colour, v=val, l=_esc(label), fa=FAINT,
                    s=("<div style='font-size:7.5pt;color:{};margin-top:3px'>"
                       "{}</div>".format(MUTED, _esc(sub))) if sub else ""))
        out.append("<table style=\"width:100%;border-collapse:separate;"
                   "border-spacing:6px 0;margin:5px 0\"><tr>{}</tr></table>"
                   .format("".join(tds)))
    return "".join(out)


def mix_strip(mix, title="Equipment mix"):
    """Current numbers by equipment type - only the types actually held."""
    live = [(k, v) for k, v in
            [(k, mix.get(k, 0)) for k in AM.MIX_ORDER] if v]
    if not live:
        return ""
    w = 100.0 / len(live)
    tds = "".join(
        "<td style=\"width:{w}%;text-align:center;padding:9px 4px;"
        "border-right:1px solid {ln}\">"
        "<div style=\"font-size:17pt;font-weight:800;color:{ik};"
        "line-height:1\">{v}</div>"
        "<div style=\"font-size:7pt;color:{fa};letter-spacing:.8px;"
        "text-transform:uppercase;margin-top:4px\">{k}</div></td>".format(
            w=w, ln=LINE, v=v, k=_esc(k), ik=INK, fa=FAINT) for k, v in live)
    return (
        "<div class=\"keepnext\" style=\"font-size:7.5pt;letter-spacing:2px;"
        "color:{o};font-weight:800;text-transform:uppercase;"
        "margin:9px 0 3px\">{t}</div>"
        "<table style=\"width:100%;border-collapse:collapse;background:{cd};"
        "border-radius:8px;overflow:hidden\"><tr>{r}</tr></table>"
    ).format(o=ORANGE, t=_esc(title), cd=CARD, r=tds)


def band(title, sub="", colour=None):
    """Section header. The sub sits on its own line - inline it wrapped
    mid-phrase on the long company titles."""
    return (
        "<div class=\"keepnext\" style=\"background:{c};border-radius:8px;"
        "padding:8px 16px;margin:9px 0 5px\">"
        "<div style=\"color:#fff;font-size:11pt;font-weight:800;"
        "letter-spacing:.5px;text-transform:uppercase;line-height:1.3\">{t}"
        "</div>{s}</div>"
    ).format(c=colour or ORANGE, t=_esc(title),
             s=("<div style='color:#FFE2D4;font-size:8.5pt;margin-top:3px;"
                "letter-spacing:1px;text-transform:uppercase'>{}</div>"
                .format(_esc(sub))) if sub else "")


def tbl(heads, rows, aligns=None):
    if not rows:
        return ""
    aligns = aligns or []

    def al(i):
        return aligns[i] if i < len(aligns) else "left"
    h = "".join("<th style=\"background:#20262F;color:#fff;text-align:{a};"
                "padding:6px 8px;font-size:8pt;text-transform:uppercase;"
                "letter-spacing:.4px\">{t}</th>".format(a=al(i), t=_esc(x))
                for i, x in enumerate(heads))
    b = ""
    for n, r in enumerate(rows):
        bg = ZEBRA if n % 2 else "transparent"
        b += "<tr>" + "".join(
            "<td style=\"padding:4px 8px;border-bottom:1px solid {ln};"
            "font-size:9.5pt;color:{tx};background:{bg};text-align:{a};"
            "vertical-align:top\">{c}</td>".format(
                ln=LINE, tx=TEXT, bg=bg, a=al(i), c=c)
            for i, c in enumerate(r)) + "</tr>"
    return ("<table style=\"width:100%;border-collapse:collapse;"
            "margin-top:4px\"><thead><tr>{h}</tr></thead><tbody>{b}</tbody>"
            "</table>").format(h=h, b=b)


def badge(text, colour):
    ink = "#14181F" if colour in (AMBER, MUTED) else "#fff"
    return ("<span style=\"display:inline-block;background:{c};color:{ink};"
            "border-radius:9px;padding:1px 8px;font-size:7.5pt;"
            "font-weight:800;letter-spacing:.3px;white-space:normal\">{t}"
            "</span>").format(c=colour, t=_esc(text), ink=ink)


def facts(items):
    """One quiet line of supporting numbers. Some things are worth saying
    without giving them a scorecard the size of a fist - six more big
    boxes makes a page busier, not clearer. (A. Fisher, 25 Jul 2026)"""
    live = [(v, l) for v, l in items if v not in (0, "0", "", None)]
    if not live:
        return ""
    return ("<div style=\"background:{cd};border-radius:8px;padding:9px 14px;"
            "margin:5px 0;font-size:9.5pt;color:{tx};line-height:1.6\">{b}"
            "</div>").format(
        cd=CARD, tx=TEXT,
        b=" &nbsp;<span style='color:{}'>&bull;</span>&nbsp; ".format(LINE)
        .join("<b style='color:" + INK + "'>{}</b> <span style='color:{}'>{}</span>"
              .format(v, MUTED, _esc(l)) for v, l in live))


def note(html):
    return ("<div style=\"font-size:8.5pt;color:{m};margin-top:6px;"
            "line-height:1.7\">{h}</div>").format(m=MUTED, h=html)


# ---------------------------------------------------------------------
#  LEVEL 1 - the company page
# ---------------------------------------------------------------------
def company_page(co, period):
    c, a = co["cards"], co["age"]
    body = band("{} — company equipment activity & accountability"
                .format(co["display"]),
                "Reporting period {} – {}".format(_d(period[0]),
                                                  _d(period[1])))
    body += cards([
        (co["n_hirers"], "Active hirers", INK, ""),
        (c["issued"], "Equipment issued", ORANGE, "this period"),
        (c["returned"], "Equipment returned", GOOD, "this period"),
        (c["same"], "Returned same day", GOOD, ""),
        (c["not_same"], "Not returned same day",
         BAD if c["not_same"] else GOOD, "daily-return gear"),
        (c["recovered"], "Recovered", GOOD, "outstanding, now back"),
    ])
    body += cards([
        (c["still"], "Currently still on hire", INK, ""),
        ("{}d".format(co["oldest"]), "Oldest item", AMBER if co["oldest"] >= 5
         else INK, ""),
        (_repl_hl(co["exposure"]) if co["exposure"] else
         _money(co["exposure"]), "Replacement exposure", ORANGE, ""),
        (a["1-7"], "On hire 1–7 days", GOOD, ""),
        (a["8-30"], "On hire 8–30 days", AMBER, ""),
        (a["30+"], "On hire 30+ days", BAD if a["30+"] else MUTED, ""),
    ])
    #  How the company actually used the tool store. Every item is
    #  scanned on its own, so the item count is items - the visit count is
    #  trips to the counter. (A. Fisher, 25 Jul 2026)
    body += facts([
        ("{} of {}".format(co.get("using_store", 0), co["n_hirers"]),
         "of their people used the tool store"),
        (co.get("visits", 0), "visits to the counter"),
        (co.get("movements", 0), "items handled over the counter"),
    ])
    body += mix_strip(co["mix"], "Equipment mix — on hire now")

    # ---- consumables, entirely on their own -------------------------
    cs = co["cons"]
    if cs["txns"]:
        body += band("Company consumables", "Usage data — no return required")
        body += cards([
            (cs["txns"], "Consumable transactions", ORANGE, ""),
            (_qty(cs["units"]), "Total units taken", ORANGE, ""),
            (cs["types"], "Different products", ORANGE, ""),
        ], per_row=3)
        if cs["top"]:
            body += tbl(["Most-used consumables", "Material number", "Units"],
                        [[_esc(t["desc"]), _esc(t["material"] or "-"),
                          _qty(t["qty"])] for t in cs["top"][:10]],
                        ["left", "left", "right"])
        if cs["by_hirer"]:
            body += tbl(["Consumable usage by hirer", "Transactions", "Units"],
                        [[_esc(x["name"]), x["txns"], _qty(x["units"])]
                         for x in cs["by_hirer"]],
                        ["left", "right", "right"])
        body += note("Consumables are usage data. They are never counted in "
                     "still on hire, not returned same day, overdue, "
                     "recovered or outstanding equipment.")

    # ---- damage ------------------------------------------------------
    d = co["damage"]
    if d["reported"]:
        body += band("Damage and condition", colour="#8A3324")
        body += cards([
            (d["reported"], "Damage reports raised", INK, ""),
            (d["open"], "Open", AMBER if d["open"] else GOOD, ""),
            (d["closed"], "Closed", GOOD, ""),
            (d["oos"], "Out of service", BAD if d["oos"] else MUTED, ""),
            (d["offhired"], "Off-hired", INK, ""),
            (_money(d["exposure"]), "Estimated exposure", ORANGE, ""),
        ])
        body += tbl(["Reference", "Item", "Asset", "Reported",
                     "Operational status", "Status"],
                    [[_esc(x["cid"]), _esc(x["desc"]),
                      EC.asset_html(x["asset"]),
                      _d(x["when"]), _esc(x["op_status"] or "-"),
                      _esc(x["status"] or "-")] for x in d["items"]])
        body += note("Factual record only. Responsibility or recharge is "
                     "shown only where it has been formally confirmed.")

    # ---- compliance --------------------------------------------------
    cm = co["compliance"]
    if any(cm.values()):
        body += band("Compliance", colour="#1E3A5F")
        body += EC.rigging_strip(cm["rigging"])
        body += EC.electrical_strip(cm["electrical"])
        body += EC.logbook_strip(cm["logbook"])
        body += EC.return_strip(cm["ret"])

    # ---- action centre ------------------------------------------------
    acts = _company_actions(co)
    if acts:
        body += band("Action centre", "Exceptions only")
        body += tbl(["Priority", "Hirer", "Issue", "Required action",
                     "Owner", "Status"], acts)
    else:
        body += band("Action centre", "Exceptions only")
        body += note("<b style='color:{}'>Nothing outstanding.</b> No gear "
                     "overdue back, no open damage reports, nothing needing "
                     "a decision today.".format(GOOD))
    return body


def _company_actions(co):
    """Only genuine exceptions, highest priority first."""
    out = []
    for h in co["hirers"]:
        c = h["cards"]
        if c["not_same"]:
            out.append([badge("HIGH", BAD), _esc(h["name"]),
                        "{} item{} due back today, not yet returned".format(
                            c["not_same"], "" if c["not_same"] == 1 else "s"),
                        "Return to the Coates tool store this shift",
                        _esc(h["name"]), badge("OPEN", AMBER)])
        for d in h["damage"]:
            if d["status"].lower() not in ("closed", "invoiced"):
                out.append([badge("HIGH", BAD), _esc(h["name"]),
                            "Damage reported — {} ({})".format(
                                _esc(d["desc"]), _esc(d["cid"])),
                            "Awaiting inspection",
                            _esc(d["owner"] or "Coates tool store"),
                            badge(_esc(d["status"]).upper() or "OPEN", AMBER)])
    for h in co["hirers"]:
        if h["oldest"] >= 8:
            out.append([badge("MEDIUM", AMBER), _esc(h["name"]),
                        "Oldest item out {} days".format(h["oldest"]),
                        "Confirm still required or return",
                        _esc(h["name"]), badge("REVIEW", MUTED)])
    return out


# ---------------------------------------------------------------------
#  LEVEL 2 - one page per hirer
# ---------------------------------------------------------------------
def hirer_page(h, period, company):
    c = h["cards"]
    body = ("<div class='newpage'></div>"
            "<div style=\"background:{o};border-radius:10px;padding:12px 18px;"
            "margin:2px 0 8px;display:flex;justify-content:space-between;"
            "align-items:center\">"
            "<div><div style=\"color:#fff;font-size:19pt;font-weight:800;"
            "line-height:1.05\">{n}</div>"
            "<div style=\"color:#FFE2D4;font-size:8.5pt;margin-top:3px;"
            "letter-spacing:1px;text-transform:uppercase\">{co}</div></div>"
            "<div style=\"text-align:right;color:#FFE2D4;font-size:8pt;"
            "letter-spacing:1px;text-transform:uppercase;line-height:1.8\">"
            "Hirer ID <b style=\"color:#fff\">{id}</b><br>"
            "Hirer {i:02d} of {t:02d}<br>{p}</div></div>").format(
        o=ORANGE, n=_esc(h["name"]), co=_esc(company),
        id=_esc(h["hirer_id"] or "not recorded"), i=h["n"], t=h["of"],
        p="{} – {}".format(_d(period[0]), _d(period[1])))

    body += cards([
        (c["issued"], "Issued", ORANGE, ""),
        (c["returned"], "Returned", GOOD, ""),
        (c["same"], "Same day", GOOD, ""),
        (c["not_same"], "Not returned same day",
         BAD if c["not_same"] else GOOD, ""),
        (c["recovered"], "Recovered", GOOD, ""),
        (c["still"], "Still on hire", INK, ""),
    ])
    body += facts([
        (h.get("visits", 0), "visits to the counter"),
        (h.get("days_over", 0), "day{} they came over".format(
            "" if h.get("days_over") == 1 else "s")),
        (h.get("movements", 0), "items handled over the counter"),
    ])
    if c["returned"] > c["issued"]:
        body += note("Returned is higher than issued because older equipment "
                     "came back during this period. That is a good result, "
                     "not a data error.")
    body += mix_strip(h["mix"])

    # ---- consumables --------------------------------------------------
    cs = h["cons"]
    if cs["txns"]:
        body += band("Consumables taken", "Usage data — no return required")
        body += cards([
            (cs["txns"], "Transactions", ORANGE, ""),
            (_qty(cs["units"]), "Total units", ORANGE, ""),
            (cs["types"], "Product types", ORANGE, ""),
        ], per_row=3)
        body += tbl(["Date", "Time", "Description", "Material number", "Qty"],
                    [[_d(x["start"]), _esc(x["start_time"] or "-"),
                      _esc(x["desc"]), _esc(x["barcode"] or "-"),
                      _qty(x["qty"])] for x in cs["lines"]],
                    ["left", "left", "left", "left", "right"])

    # ---- compliance strips ---------------------------------------------
    cm = h["compliance"]
    if any(cm.values()):
        body += EC.rigging_strip(cm["rigging"])
        body += EC.electrical_strip(cm["electrical"])
        body += EC.logbook_strip(cm["logbook"])
        body += EC.return_strip(cm["ret"])

    # ---- damage ---------------------------------------------------------
    if h["damage"]:
        body += band("Damage and condition", colour="#8A3324")
        body += tbl(["Item", "Asset", "Reported", "Out-of-service tag",
                     "Off-hired", "Location", "Status", "Estimated exposure"],
                    [[_esc(d["desc"]), EC.asset_html(d["asset"]),
                      _d(d["when"]),
                      _esc(d["oos"] or "-"), _esc(d["offhired"] or "-"),
                      _esc(d["location"] or "-"),
                      _esc(d["op_status"] or d["status"] or "-"),
                      _money(d["repair"] or d["exposure"])]
                     for d in h["damage"]],
                    ["left", "left", "left", "left", "left", "left",
                     "left", "right"])
        body += note("Damage reported and awaiting inspection. No "
                     "responsibility is assigned until a decision is "
                     "confirmed.")

    # ---- outstanding ----------------------------------------------------
    if h["rows"]:
        body += band("Outstanding equipment", "Oldest first")
        rows = []
        for r in h["rows"]:
            f = EC.flags(r.get("asset"), r.get("description"))
            #  STATUS tells one truth only: is it out, and is it due back.
            #  A rigging block IS on hire - its blue tag is a compliance
            #  fact, not a status, so the tag marker rides with the
            #  description like every other page and never displaces
            #  ON HIRE. (Andrew's call, 26 Jul 2026.)
            b = [EC._dotword("DUE BACK", AMBER) if f["ret"]
                 else EC._dotword("ON HIRE", MUTED)]
            days = r.get("days")
            #  The line says what the thing is and what has to happen to
            #  it. The product family was on here too and it read as noise
            #  - "10 A Extension Lead / TOOLS & EQUIPMENT - Power Tools &
            #  Accessories" tells you nothing the description didn't, and
            #  it doubled the height of every row. (A. Fisher, 25 Jul 2026)
            #  Compliance markers (ELECTRICAL / RIGGING / LOGBOOK / RETURN
            #  DAILY) sit right here with the description - the KEY at the
            #  top of the page carries their meaning.
            desc = _esc(r.get("description")) + EC.badges_html(
                r.get("asset"), r.get("description"))
            #  One line, never wrapped - a date broken across three lines
            #  turns a 20-row page into an 11-row page.
            when = ("<span style='white-space:nowrap'>{}</span>"
                    .format(_d(r.get("on_hire_date")).replace(" 2026", "")))
            t = AM._txt(r.get("on_hire_time"))
            if t:
                when += ("<span style='font-size:8pt;color:{m};"
                         "white-space:nowrap'> {t}</span>"
                         .format(m=MUTED, t=_esc(t[:5])))
            rows.append([
                desc,
                EC.asset_html(r.get("asset")),
                _esc(AM._txt(r.get("storage_unit")) or "-"),
                when,
                "-" if days is None else "{}d".format(days),
                _repl_hl(r.get("repl")) if r.get("repl") else
                "<span style='color:{}'>TBC</span>".format(MUTED),
                " ".join(b)])
        body += tbl(["Description", "Item no.", "Storage unit", "On hire",
                     "Out for", "Replacement", "Status"], rows,
                    ["left", "left", "left", "left", "right", "right", "left"])

    # ---- action required --------------------------------------------------
    acts = h["actions"]
    if acts:
        body += band("Action required", colour="#8A3324")
        body += tbl(["Priority", "What", "Required action"],
                    [[badge(p, BAD if p == "HIGH" else AMBER),
                      _esc(what), _esc(action)] for p, what, action in acts])
    else:
        body += note("<b style='color:{}'>Nothing outstanding for {}.</b> "
                     "Gear is current, nothing overdue back, no open damage."
                     .format(GOOD, _esc(h["name"])))

    body += ("<div class=\"keepprev\" style=\"margin-top:8px;"
             "padding-top:7px;border-top:2px "
             "solid {o};font-size:8pt;color:{m};letter-spacing:1px;"
             "text-transform:uppercase\">End of {n} &nbsp;&bull;&nbsp; "
             "{i} item{s} on hire &nbsp;&bull;&nbsp; {u} consumable unit{us}"
             "{dmg}</div>").format(
        o=ORANGE, m=MUTED, n=_esc(h["name"]).upper(), i=c["still"],
        s="" if c["still"] == 1 else "s", u=_qty(cs["units"]),
        us="" if cs["units"] == 1 else "s",
        #  No damage register loaded means no damage line - we never put a
        #  figure on the page that the data cannot stand behind.
        dmg=("" if not h["damage"] else
             " &nbsp;&bull;&nbsp; {} open damage report{}".format(
                 len(h["damage"]), "" if len(h["damage"]) == 1 else "s")))
    return body


# ---------------------------------------------------------------------
#  the whole document body for one company
# ---------------------------------------------------------------------
def render(co, period):
    body = company_page(co, period) + EC.store_story_html()
    for h in co["hirers"]:
        body += hirer_page(h, period, co["display"])
    return body
