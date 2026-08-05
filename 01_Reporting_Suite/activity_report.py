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
#  Status tints for the scorecards - colour only where a judgement
#  exists (Andrew picked this look, 28 Jul 2026: white tiles by default,
#  a tinted tile means the number IS the status). RAG discipline: red is
#  action, amber is watch, green is healthy - never decoration.
_TINT = {GOOD: ("#E8F6EC", "#12271A"), AMBER: ("#FFF4D6", "#2A2210"),
         BAD: ("#FBE3DF", "#2A1512")}


def cards(items, per_row=6):
    """The big scorecards. items = [(value, label, colour, sub)] - or a
    5th element truthy to TINT the tile with its status colour."""
    out = []
    for chunk in [items[i:i + per_row] for i in range(0, len(items), per_row)]:
        w = 100.0 / len(chunk)
        tds = []
        for item in chunk:
            val, label, colour, sub = item[:4]
            tinted = len(item) > 4 and item[4] and colour in _TINT
            #  One literal, one .format(). Splicing a colour in with
            #  " + FAINT + " ends the string expression, so .format()
            #  binds only to the last chunk and every {v} before it is
            #  printed raw - which is exactly how a whole page of
            #  headline numbers came out as "{v}". Colours go through
            #  as named fields like everything else.
            tds.append(
                "<td style=\"width:{w}%;background:{cd};border-top:3px solid "
                "{c};{edge}border-radius:8px;padding:11px 12px 9px;"
                "vertical-align:top\">"
                "<div style=\"font-size:23pt;font-weight:800;color:{c};"
                "line-height:1\">{v}</div>"
                "<div style=\"font-size:7.5pt;color:{fa};letter-spacing:1px;"
                "text-transform:uppercase;margin-top:5px;line-height:1.35\">"
                "{l}</div>{s}</td>".format(
                    w=w,
                    cd=(_TINT[colour][0 if _LIGHT else 1] if tinted
                        else CARD),
                    edge=("border:1px solid {};".format(colour) if tinted
                          else ""),
                    c=colour, v=val, l=_esc(label), fa=FAINT,
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


def hstack(title, segments):
    """One thin stacked colour band with its legend - the age or return
    mix at a glance. segments = [(label, count, colour)]. Zero segments
    are dropped and an all-zero band never prints. Table-based, inline
    styles only, so it renders identically in the browser, the PDF print
    and the email page capture."""
    live = [(l, v, c) for l, v, c in segments if v]
    if not live:
        return ""
    total = float(sum(v for _l, v, _c in live))
    tds = "".join(
        "<td style=\"width:{w:.2f}%;background:{c};height:16px;font-size:0;"
        "line-height:0\">&nbsp;</td>".format(w=100.0 * v / total, c=c)
        for _l, v, c in live)
    legend = " &nbsp;&nbsp; ".join(
        "<span style=\"color:{c}\">&#9632;</span> "
        "<b style=\"color:{ik}\">{v}</b> "
        "<span style=\"color:{m}\">{l}</span>".format(
            c=c, v=v, l=_esc(l), ik=INK, m=MUTED) for l, v, c in live)
    return (
        "<div class=\"keepnext\" style=\"font-size:7.5pt;letter-spacing:2px;"
        "color:{o};font-weight:800;text-transform:uppercase;"
        "margin:9px 0 3px\">{t}</div>"
        "<div class=\"keepnext\" style=\"border-radius:8px;overflow:hidden;"
        "line-height:0\">"
        "<table style=\"width:100%;border-collapse:collapse\"><tr>{r}</tr>"
        "</table></div>"
        "<div style=\"font-size:8.5pt;margin:4px 0 2px;line-height:1.5\">{lg}"
        "</div>").format(o=ORANGE, t=_esc(title), r=tds, lg=legend)


def story(inner):
    """The position in one plain paragraph - the highlight colours carry
    the numbers. Same look as the .intro.story card on the on-hire
    reports, so the two report families read as one suite. inner is
    already-built HTML: escape any data values before they go in."""
    return ("<div class=\"keepnext\" style=\"background:{bg};border-left:"
            "4px solid {o};border-radius:0 10px 10px 0;padding:10px 16px;"
            "margin:8px 0 5px;font-size:10pt;color:{tx};line-height:1.65\">"
            "{h}</div>").format(
        bg="#FFF3EC" if _LIGHT else "#221A15", o=ORANGE, tx=TEXT, h=inner)


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
         BAD if c["not_same"] else GOOD, "daily-return gear",
         c["not_same"] > 0),
        (c["recovered"], "Recovered", GOOD, "outstanding, now back"),
    ])
    body += cards([
        (c["still"], "Currently still on hire", INK, ""),
        ("{}d".format(co["oldest"]), "Oldest item", AMBER if co["oldest"] >= 5
         else INK, "", co["oldest"] >= 5),
        (_repl_hl(co["exposure"]) if co["exposure"] else
         _money(co["exposure"]), "Replacement exposure", ORANGE, ""),
        (a["1-7"], "On hire 1–7 days", GOOD, "", a["1-7"] > 0),
        (a["8-30"], "On hire 8–30 days", AMBER, "", a["8-30"] > 0),
        (a["30+"], "On hire 30+ days", BAD if a["30+"] else MUTED, "",
         a["30+"] > 0),
    ])
    #  The position in one paragraph - the numbers a manager repeats on
    #  the phone, wearing the same colours the scorecards gave them.
    #  Every value is the exact field the cards above show; nothing is
    #  recomputed here. One .format() on one literal - see the cards()
    #  comment for why splicing colours with + is banned in this file.
    if a["30+"]:
        tail = ("<b style=\"color:{b}\">{n} item{s} out 30+ days</b> "
                "&mdash; today's chase list.").format(
            b=BAD, n=a["30+"], s="" if a["30+"] == 1 else "s")
    elif co["oldest"] >= 5:
        tail = ("Oldest item out <b style=\"color:{a}\">{d} days</b> "
                "&mdash; worth a nudge when they're at the counter.").format(
            a=AMBER, d=co["oldest"])
    else:
        tail = ("<b style=\"color:{g}\">Nothing overdue</b> &mdash; the "
                "book is current.").format(g=GOOD)
    #  THE EXPOSURE CLAUSE ONLY WHEN THERE IS EXPOSURE. A company
    #  holding nothing was getting "replacement exposure TBC" in a
    #  finished client document - a placeholder standing in for a value
    #  that is genuinely nil. Nothing on hire, no clause. (5 Aug sweep.)
    exp_clause = (" &mdash; replacement exposure {}".format(
        _repl_hl(co["exposure"])) if (c["still"] and co["exposure"])
        else (" &mdash; replacement exposure <b>TBC</b>"
              if c["still"] else ""))
    body += story(
        "<b>The position:</b> {n} has <b style=\"color:{ik}\">{still} "
        "item{sp}</b> on hire{exp}. This "
        "period <b style=\"color:{g}\">{ret} returned</b> ({same} same-day) "
        "and <b style=\"color:{o}\">{iss} went out</b>. {tail}".format(
            n=_esc(co["display"]), ik=INK, still=c["still"],
            sp="" if c["still"] == 1 else "s",
            exp=exp_clause, g=GOOD, ret=c["returned"], same=c["same"],
            o=ORANGE, iss=c["issued"], tail=tail))

    #  How the company actually used the tool store. Every item is
    #  scanned on its own, so the item count is items - the visit count is
    #  trips to the counter. (A. Fisher, 25 Jul 2026)
    #  SECOND PERSON, LIKE THE REST OF THE PAGE - the pack is addressed
    #  to the client ("your crew took..."), so "their people" was the
    #  one line talking about them over their shoulder. And the counts
    #  go through n_of so "1 visits" can never print.
    body += facts([
        ("{} of {}".format(co.get("using_store", 0), co["n_hirers"]),
         "of your people used the tool store"),
        (co.get("visits", 0),
         "visit to the counter" if co.get("visits", 0) == 1
         else "visits to the counter"),
        (co.get("movements", 0),
         "item handled over the counter" if co.get("movements", 0) == 1
         else "items handled over the counter"),
    ])
    #  The same age and return numbers the cards carry, as two thin
    #  colour bands - the shape of the book at a glance. Both draw from
    #  the fields already on this page, so the bar and the card can
    #  never disagree.
    body += hstack("Age of gear on hire now", [
        ("on 1–7 days", a["1-7"], GOOD),
        ("on 8–30 days", a["8-30"], AMBER),
        ("on 30+ days", a["30+"], BAD),
    ])
    if c["returned"]:
        body += hstack("Returns this period", [
            ("back same day", c["same"], GOOD),
            ("back later", max(0, c["returned"] - c["same"]), BLUE),
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
        (h.get("visits", 0),
         "visit to the counter" if h.get("visits", 0) == 1
         else "visits to the counter"),
        (h.get("days_over", 0), "day{} they came over".format(
            "" if h.get("days_over") == 1 else "s")),
        (h.get("movements", 0),
         "item handled over the counter" if h.get("movements", 0) == 1
         else "items handled over the counter"),
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

# ---------------------------------------------------------------------
#  WHERE YOU ARE IN THE SHUT  (Andrew, 5 Aug 2026: "love option a")
#
#  Flame Off on the left, the planned end on the right, today marked,
#  and four things on one picture:
#
#    the blue area   how much of our gear they are holding
#    orange bars     what went out that day
#    green bars      what came back that day
#    the amber dash  the run-down to finish clear by the planned end
#
#  THE AMBER LINE IS ARITHMETIC, NOT A FORECAST. Items on hire divided
#  by days left. It is on here because a contractor who sees "39 a day"
#  on the 5th behaves differently to one who is told on the 10th, and
#  by then it is our problem to solve, not his.
#
#  IT PRINTS. These reports go out as PDFs and get printed, so the SVG
#  carries no dark background of its own and the page's print rules
#  turn the ink black. The per-day counts live in <title> tooltips,
#  which do not exist on paper - so nothing that matters is ONLY in a
#  tooltip. The numbers a person acts on are in the strip underneath.
#
#  No money. These leave Coates.
# ---------------------------------------------------------------------
def shut_curve_svg(co, today=None):
    rows = co.get("curve") or []
    if not rows:
        return ""
    today = today or dt.date.today()
    held = [r for r in rows if r["held"] is not None]
    if not held:
        return ""
    still = co["cards"]["still"]
    peak = max([r["held"] for r in held] + [still, 1])
    maxbar = max([max(r["out"], r["back"]) for r in rows] + [1])

    W, H, L, R, T, B = 980, 286, 52, 20, 24, 42
    pw, ph = W - L - R, H - T - B
    n = len(rows)
    step = pw / float(n - 1) if n > 1 else pw
    top = peak * 1.16
    X = lambda i: L + i * step
    Y = lambda v: T + ph - (ph * v / top)
    BS = top / (maxbar * 2.6)

    #  A FONT, SAID OUT LOUD. This SVG carried no font-family at all, so
    #  every label fell through to the browser's default - which on
    #  Andrew's machine is Times New Roman in the middle of an email set
    #  in Calibri, and in the headless renderer that builds the email
    #  PNG is a face that does not exist at normal weight, so the whole
    #  date axis along the bottom simply did not draw. The bold labels
    #  did, which is why it looked like a deliberate design and not a
    #  missing axis. Found in the 5 Aug sweep by cropping the bottom of
    #  the PNG that was already going out.
    g = ["<svg viewBox='0 0 {} {}' width='100%' role='img' aria-label="
         "'Gear on hire from Flame Off to the planned end'>".format(W, H),
         "<style>svg text" + "{font-family:Calibri,Segoe UI,Arial,"
         "Helvetica,DejaVu Sans,sans-serif}" + "</style>"]
    for k in range(5):
        v = top * k / 4.0
        y = Y(v)
        g.append("<line x1='{}' y1='{:.1f}' x2='{}' y2='{:.1f}' "
                 "stroke='{}' stroke-width='1'/>".format(L, y, W - R, y, LINE))
    #  NO NUMBERS ON THIS AXIS, AND ON PURPOSE.
    #
    #  The curve's shape comes from the movement feed and its scale is
    #  set by ONE point - what they hold today. That anchors the end of
    #  the line exactly, which is the number people read, but it also
    #  stretches everything behind it: DGH's peak came out near 850
    #  when they hold 233 now, and I cannot stand behind 850 as a count
    #  of anything. A gridline with a number on it is a claim.
    #
    #  So the gridlines stay as a sense of scale and the numbers come
    #  off. What the chart asserts is the SHAPE (real), the daily bars
    #  (raw counts, unscaled), and today's figure (straight off the
    #  register). Everything it asserts, it can prove.
    bw = max(2.0, step * 0.34)
    for i, r in enumerate(rows):
        if r["out"]:
            y = Y(r["out"] * BS)
            g.append("<rect x='{:.1f}' y='{:.1f}' width='{:.1f}' "
                     "height='{:.1f}' fill='{}' opacity='.5' rx='1'>"
                     "<title>{}: {} went out</title></rect>".format(
                         X(i) - bw - 1, y, bw, T + ph - y, ORANGE,
                         r["d"].strftime('%d %b'), r["out"]))
        if r["back"]:
            y = Y(r["back"] * BS)
            g.append("<rect x='{:.1f}' y='{:.1f}' width='{:.1f}' "
                     "height='{:.1f}' fill='{}' opacity='.5' rx='1'>"
                     "<title>{}: {} came back</title></rect>".format(
                         X(i) + 1, y, bw, T + ph - y, GOOD,
                         r["d"].strftime('%d %b'), r["back"]))
    pts = " ".join("{:.1f},{:.1f}".format(X(i), Y(r["held"]))
                   for i, r in enumerate(rows) if r["held"] is not None)
    i_t = max(i for i, r in enumerate(rows) if r["held"] is not None)
    g.append("<polygon points='{} {:.1f},{:.1f} {:.1f},{:.1f}' fill='{}' "
             "opacity='.15'/>".format(pts, X(i_t), T + ph, L, T + ph, BLUE))
    g.append("<polyline points='{}' fill='none' stroke='{}' "
             "stroke-width='2.5'/>".format(pts, BLUE))
    if i_t < n - 1:
        g.append("<line x1='{:.1f}' y1='{:.1f}' x2='{:.1f}' y2='{:.1f}' "
                 "stroke='{}' stroke-width='2' stroke-dasharray='6 5'/>"
                 .format(X(i_t), Y(still), X(n - 1), Y(0), AMBER))
    g.append("<circle cx='{:.1f}' cy='{:.1f}' r='5' fill='{}' "
             "stroke='{}' stroke-width='2'/>".format(
                 X(i_t), Y(still), BLUE, CARD))
    g.append("<text x='{:.1f}' y='{:.1f}' fill='{}' font-size='12' "
             "font-weight='700' text-anchor='end'>{} on hire today</text>"
             .format(X(i_t) - 9, Y(still) - 10, INK, still))
    for i, r in enumerate(rows):
        lab = ''
        if i == 0:
            lab, col, anc = 'FLAME OFF', ORANGE, 'start'
        elif r["d"] == today:
            lab, col, anc = 'TODAY', BLUE, 'middle'
        elif i == n - 1:
            lab, col, anc = 'PLANNED END', AMBER, 'end'
        if lab:
            g.append("<line x1='{:.1f}' y1='{}' x2='{:.1f}' y2='{:.1f}' "
                     "stroke='{}' stroke-width='1.5' stroke-dasharray='3 3' "
                     "opacity='.85'/>".format(X(i), T, X(i), T + ph, col))
            g.append("<text x='{:.1f}' y='{}' fill='{}' font-size='9.5' "
                     "font-weight='700' text-anchor='{}'>{}</text>".format(
                         X(i), T - 8, col, anc, lab))
        if i % 2 == 0:
            g.append("<text x='{:.1f}' y='{}' fill='{}' font-size='9' "
                     "text-anchor='middle'>{}</text>".format(
                         X(i), H - B + 16, MUTED, r["d"].strftime('%d/%m')))
    g.append("</svg>")
    return "".join(g)


def shut_curve_numbers(co, today=None):
    """The four figures under the chart - the ones that survive print
    and the ones an email needs even if the picture does not load.

    NO CURVE IS NOT NO NUMBERS. Three companies on 5 Aug had gear on
    hire and no drawable curve, because their movements net to zero by
    today and the shape cannot be honestly scaled. The register still
    says what they hold and the calendar still says how long is left,
    so those figures go out with or without the picture."""
    today = today or dt.date.today()
    still = co["cards"]["still"]
    rows = co.get("curve") or []
    end = rows[-1]["d"] if rows else AM.shut_window()[1]
    left = (end - today).days
    #  CEIL, NOT ROUND. High Risk hold 55 with 6 days left; 55/6 rounds
    #  to 9, and 9 a day for 6 days is 54 - one short of clear. A
    #  run-down figure that cannot actually finish the run-down is the
    #  polite kind of wrong. Rounding UP is the only rate this tile can
    #  stand behind, and it also retires the "<1" special case -
    #  Filtercare's 3 over 6 days is now an honest 1.
    import math as _math
    per = int(_math.ceil(still / float(left))) if left > 0 and still else 0
    label = str(per) if per else "-"
    #  "HOLDING GEAR" HAS TO COUNT PEOPLE HOLDING GEAR. This tile
    #  carried n_hirers - everyone who used the store this PERIOD - so
    #  Cleanaway's email said 15 people were holding 8 items, which the
    #  same email disproves. The company model already knows who is
    #  actually holding: the hirers whose own still-count is not nil.
    holders = sum(1 for h in co.get("hirers", [])
                  if h.get("cards", {}).get("still"))
    return {"still": still, "left": max(0, left), "per": per,
            "per_label": label, "people": co["n_hirers"],
            "holders": holders}


def shut_curve_html(co, today=None):
    svg = shut_curve_svg(co, today)
    if not svg:
        return ""
    today = today or dt.date.today()
    #  One source for the four figures - the same shut_curve_numbers the
    #  email strip uses, so the page and the email can never disagree.
    #  (They did: this block had its own round() and its own n_hirers.)
    cn = shut_curve_numbers(co, today)
    still, left, per = cn["still"], cn["left"], cn["per"]
    tiles = [(str(still), 'on hire right now'),
             (str(left), 'days to the planned end'),
             (cn["per_label"], 'returns a day to finish clear'),
             (str(cn["holders"]), 'of your people holding gear')]
    strip = "".join(
        "<div style='flex:1;min-width:118px;padding:12px 14px'>"
        "<div style='font-size:24pt;font-weight:800;line-height:1;color:{c}'>"
        "{v}</div><div style='color:{m};font-size:9.5pt;margin-top:5px'>{l}"
        "</div></div>".format(
            c=(AMBER if i == 0 else (BAD if i == 2 and per else INK)),
            v=v, l=l, m=MUTED) for i, (v, l) in enumerate(tiles))

    return (
        "<div class='card curvecard'>"
        "<h2>Where you are in the shut</h2>"
        "<div class='cap'>Flame Off to the planned end, and everything "
        "your crew has taken and given back along the way.</div>"
        + svg +
        "<div style='display:flex;gap:14px;flex-wrap:wrap;color:" + MUTED +
        ";font-size:9.5pt;margin-top:10px'>"
        "<span><b style='color:" + BLUE + "'>&#9632;</b> On hire</span>"
        "<span><b style='color:" + ORANGE + "'>&#9632;</b> Went out</span>"
        "<span><b style='color:" + GOOD + "'>&#9632;</b> Came back</span>"
        "<span><b style='color:" + AMBER + "'>&#9632;</b> Clearing by the "
        "planned end</span></div>"
        "<div style='display:flex;flex-wrap:wrap;margin-top:14px;border:1px "
        "solid " + LINE + ";border-radius:10px;overflow:hidden'>" + strip +
        "</div>"
        + (("<div class='note' style='margin-top:12px'><b>" + str(per) +
            " a day</b> is what clearing by the planned end looks like from "
            "here. It is arithmetic, not a target &mdash; " + str(still) +
            " items over " + str(left) + " days.</div>") if per else "")
        + "</div>")


def all_clear_html(co, period):
    """THE COMPANY THAT HAS NOTHING LEFT ON HIRE.

    Andrew, 5 Aug 2026: "any company that has nothing onhire should
    still get a report. a story and a thankyou. and still attach there
    report a story of their timw onsite."

    A zero is the best number on this report and it used to read like a
    blank. These are the crews who brought everything back - which on a
    shutdown is the whole job done properly - and the report they got
    said the same thing it says to a company sitting on forty overdue
    items, only with smaller numbers.

    So when the on-hire count is nil the page opens with the story of
    their time here instead of the chase: what they took, how they gave
    it back, and a thank you. It sits ABOVE the usual detail, which is
    all still there - nothing is taken away, it is just no longer the
    first thing they read."""
    c = co["cards"]
    if c.get("still"):
        return ""
    p0, p1 = period if period else (None, None)
    span = ""
    if p0 and p1:
        span = ("{} to {}".format(p0.strftime("%d %b"),
                                  p1.strftime("%d %b %Y")))
    same = c.get("same", 0)
    ret = c.get("returned", 0)
    iss = c.get("issued", 0)
    pct = int(round(100.0 * same / ret)) if ret else 0

    how = ""
    if ret and same == ret:
        how = ("Every single item came back the same day it went out. "
               "That is not the usual - it is the best return record a "
               "counter sees.")
    elif ret and pct >= 60:
        how = ("{}% of it came back the same day it went out - well "
               "above what the counter sees most weeks.".format(pct))
    elif ret:
        how = ("{} of those came back the same day they went "
               "out.".format(same))

    #  WHEN ISSUED AND RETURNED DO NOT MATCH ON A NIL BALANCE, the page
    #  has to join them up the same way the email does - QWest's pack
    #  showed 2 issued, 0 returned, 0 on hire under an all-clear banner
    #  and left the reader to do the reconciling themselves.
    join = _reconcile(co, period, nil=True)

    #  THE THANK-YOU HAS TO FIT WHAT HAPPENED. "Gear that comes back on
    #  time... your crew did exactly that" was being said to crews with
    #  zero recorded returns. True thanks or no thanks.
    if ret:
        thanks = ("Gear that comes back on time and in one piece is what "
                  "keeps the store running for everybody else on this "
                  "shutdown, and your crew did exactly that. It has been "
                  "a pleasure having you on site.")
    else:
        thanks = ("A clean sheet at the tool store is its own kind of "
                  "record. It has been a pleasure having you on site.")

    #  LIGHT, LIKE THE REST OF THE PAGE. The first cut of this card
    #  kept the old dark-theme slab - a near-black green block on an
    #  otherwise white executive page, and worse on paper. Same story,
    #  page's own palette.
    return (
        "<div style=\"background:#E9F7EE;border:1px solid #2BB673;"
        "border-left:5px solid #2BB673;border-radius:0 12px 12px 0;"
        "padding:20px 24px;margin:18px 0 6px\">"
        "<div style=\"color:#1F7A44;font-size:10.5pt;letter-spacing:2px;"
        "text-transform:uppercase;font-weight:800;margin-bottom:8px\">"
        "All clear &mdash; nothing on hire</div>"
        "<div style=\"color:#14181F;font-size:15pt;font-weight:800;"
        "line-height:1.3;margin-bottom:10px\">"
        + _esc(co["display"]) + " is holding none of our gear.</div>"
        "<div style=\"color:#2A3A2F;font-size:11pt;line-height:1.7\">"
        + ("Over " + _esc(span) + " your crew took <b>" + str(iss)
           + "</b> item" + ("" if iss == 1 else "s") + " off the tool "
           "store and returned <b>" + str(ret) + "</b>. " if (iss or ret)
           else "")
        + (_esc(how) + " " if how else "")
        + "Nothing is outstanding, nothing to chase and nothing to come "
        "back for."
        + (("<br><br><span style=\"font-size:9.5pt;color:#4A5A4F\">"
            + join + "</span>") if join else "")
        + "<br><br><b style=\"color:#14181F\">Thank you.</b> " + thanks
        + "</div></div>"
        "<div style=\"color:#5B6472;font-size:9.5pt;line-height:1.6;"
        "margin:10px 0 18px\">The rest of this report is the record of "
        "your time on site &mdash; what was taken, by whom, and how it "
        "came back. It is attached in full so you have your own copy."
        "</div>")


# ---------------------------------------------------------------------
#  WHAT THE EMAIL BODY SAYS
#
#  Andrew, 5 Aug 2026: "a deep deep sweep through the emails... every
#  is 110% accuarte its clean and tidy its presentable and its a wow
#  factor and also not boring for the company reading it."
#
#  Reading nineteen finished drafts side by side, four things were
#  wrong, and none of them were in the report - they were all in the
#  covering email:
#
#    1. "1 hirers, 1 items issued and 1 returned"  Aestec's draft, word
#       for word. Every count was hard-wired plural. The first sentence
#       a client reads cannot be illiterate.
#
#    2. The three headline numbers do not tie, and nothing said why.
#       Cleanaway: 108 issued, 108 returned, 8 still on hire. Read cold
#       that is a mistake. It is not - the first two count the counter
#       between two dates, the third is the register right now - but
#       the client has no way of knowing that, so it reads as "they do
#       not check their own emails".
#
#    3. The all-clear story never made it into the email. It was
#       written for the PDF and it is good, and Aestec's email still
#       opened with the same "here's your position" line as a company
#       holding 233 items. He asked for a story and a thank you; the
#       people who actually got one had to open the attachment first.
#
#    4. Nothing in any email was about THAT company. Nineteen drafts,
#       byte-identical apart from four numbers. The data to say
#       something true and specific was already computed and sitting
#       unused.
#
#  Everything below is wording. All of it comes off numbers the model
#  already proved - nothing here counts anything.
# ---------------------------------------------------------------------
def n_of(n, one, many=None):
    """'1 item', '2 items', '0 items'. Not a formatting nicety - the
    first line of a client email said "1 hirers"."""
    return "{:,} {}".format(n, one if n == 1 else (many or one + "s"))


def _reconcile(co, period, nil=False):
    """WHY 108 OUT, 108 BACK AND 8 STILL ON HIRE IS NOT A TYPO.

    Only said when the three numbers genuinely do not tie. When they do,
    saying it anyway is noise, and a client who is told the obvious
    stops reading the parts that matter."""
    c = co["cards"]
    gap = c["issued"] - c["returned"] - c["still"]
    if not gap:
        return ""
    p0, p1 = period if period else (None, None)
    win = ("between {} and {}".format(p0.strftime("%d %b"),
                                      p1.strftime("%d %b"))
           if p0 and p1 else "during this period")
    #  THE TIME LOGIC, THE RIGHT WAY ROUND. The first cut of this said
    #  "handed back after the register was pulled" - but a return made
    #  AFTER the snapshot would still be ON the snapshot. The gap is
    #  gear handed back after the period closed and before the register
    #  was pulled. departures.py had this right all along; the sentence
    #  did not. And "the higher of the two" named no comparison, so
    #  Cleanaway read "8 is the higher" under a pair of 108s. The
    #  comparison is against issued-minus-returned, and now it says so.
    #  (Both caught in the 5 Aug polish sweep, adversarially verified.)
    p1s = p1.strftime("%d %b") if p1 else "the period closed"
    if nil:
        return ("Those two figures count what crossed our counter {}; the "
                "nil balance is the register as it stands today. Anything "
                "handed back after {} and before the register was pulled "
                "is already off your list but is not in this period's "
                "returns, which is why they do not match.".format(win, p1s)
                if gap > 0 else
                "Those two figures count what crossed our counter {}; the "
                "nil balance is the register as it stands today, and "
                "everything your crew took outside those dates has since "
                "come back too.".format(win))
    lead = ("The three numbers above are counted two different ways, on "
            "purpose. Issued and returned are what crossed our counter "
            "{}; still on hire is what the register shows right "
            "now.".format(win))
    if gap < 0:
        return lead + (" That is why the on-hire figure can sit above the "
                       "difference between issued and returned &mdash; it "
                       "also counts gear that went out outside those "
                       "dates, before {} or since {}.".format(
                           p0.strftime("%d %b") if p0 else "the period",
                           p1s))
    return lead + (" Anything handed back after {} and before the "
                   "register was pulled is already off the on-hire list "
                   "but is not in this period's returns, which is why the "
                   "on-hire figure sits below the difference between "
                   "issued and returned.".format(p1s))


def _standout(co):
    """ONE TRUE THING ABOUT THIS COMPANY, not about the site.

    Never a comparison against another contractor by name and never a
    league table - he has been clear about that since the first pack.
    This is their own record, said out loud, because a client who is
    only ever sent a chase list learns to read the whole email as a
    chase list."""
    c = co["cards"]
    ret, same = c["returned"], c["same"]
    if ret and same == ret and ret >= 3:
        return ("<b>Every one of the {} your crew handed back went back "
                "the same day it came out.</b> That is the best return "
                "pattern a tool store sees, and it is the reason your "
                "list below is as short as it is.".format(
                    n_of(ret, "item")))
    if ret >= 5 and same * 2 >= ret:
        return ("<b>{} of the {} you handed back went back the same day "
                "they came out</b> &mdash; {}%. Same-day returns are what "
                "keep gear on the shelf for the next crew.".format(
                    "{:,}".format(same), n_of(ret, "item"),
                    int(round(100.0 * same / ret))))
    if c.get("recovered"):
        return ("<b>{} that had been outstanding from before this period "
                "came back this week.</b> That is the list getting "
                "shorter, and it is worth saying so.".format(
                    n_of(c["recovered"], "item")))
    if c["still"] and not c["not_same"]:
        #  IF WHAT THEY HOLD IS DAILY-RETURN GEAR, SAY SO. Cleanaway's
        #  email said "not due back yet" about 8 radios the pack says
        #  are due back at the store tonight. Nothing was overdue -
        #  that part was true - but "not due back yet" and "due back
        #  tonight, as every night" are different sentences.
        daily = (co.get("compliance") or {}).get("ret", 0)
        if daily:
            return ("<b>Nothing on your list is overdue.</b> {} of the "
                    "items you hold {} daily-return gear &mdash; back to "
                    "the store tonight as usual &mdash; and the rest is "
                    "authorised hire.".format(
                        "{:,}".format(daily) if daily != c["still"]
                        else ("All " + "{:,}".format(daily)
                              if daily > 1 else "The one item"),
                        "is" if daily == 1 else "are"))
        return ("<b>Nothing on your list is past its return day.</b> "
                "Everything you are holding is either authorised "
                "long-term hire or not due back yet.")
    if c["still"] and c["not_same"]:
        return ("{} on your list {} due back and not yet scanned in. "
                "They are named in the attached pack against the person "
                "holding them, so nobody has to guess.".format(
                    n_of(c["not_same"], "item"),
                    "is" if c["not_same"] == 1 else "are"))
    return ""


def email_intro(co):
    """The first thing they read, matched to what they are holding."""
    c = co["cards"]
    if not c["still"]:
        if not (c["issued"] or c["returned"]):
            return ("G'day team &mdash; this is your Coates position for "
                    "the K2 shutdown, and it is a nil one. <b>The full "
                    "record is attached as a PDF</b> so you have your own "
                    "copy. If you were expecting to see gear on here, "
                    "reply and we will go looking.")
        return ("G'day team &mdash; <b>you are all clear</b>, and thanks "
                "for that. <b>Your full record is attached as a PDF</b> "
                "&mdash; what your crew took, who had it and how it came "
                "back. Nothing to action; it is yours to keep.")
    if co["n_hirers"] == 1:
        return ("G'day team &mdash; thanks for looking after the gear. "
                "Here's your position at a glance, and <b>your full "
                "report is attached as a PDF</b> &mdash; every number, "
                "item by item. Reckon something on it has already come "
                "back? Reply or see us at the counter and we'll run the "
                "same-day double-check return so your list stays right.")
    return ("G'day team &mdash; thanks for looking after the gear. "
            "Here's your position at a glance, and <b>your full report is "
            "attached as a PDF</b> &mdash; every number, and a page for "
            "each of your people. Reckon something on it has already come "
            "back? Reply or see us at the counter and we'll run the "
            "same-day double-check return so your list stays right.")


def email_position(co, period, prev=None):
    """The paragraphs the covering email carries, in order, as
    (bold lead, html) pairs. The caller owns the table markup.

    prev = (date_label, still_then) from this company's LAST report,
    read back off the report itself - so the delta line is provable
    from two documents the client already holds. None = no last
    report, no line, no guessing."""
    c = co["cards"]
    out = []
    if not c["still"]:
        #  THE ALL-CLEAR STORY, IN THE EMAIL ITSELF. Andrew, 5 Aug 2026:
        #  "any company that has nothing onhire. should still get a
        #  report. a story and a thankyou." It was in the PDF only,
        #  which meant the crews who earned it had to open an
        #  attachment to find out.
        p0, p1 = period if period else (None, None)
        span = ("{} to {}".format(p0.strftime("%d %b"),
                                  p1.strftime("%d %b %Y"))
                if p0 and p1 else "")
        if not (c["issued"] or c["returned"]):
            #  NO EQUIPMENT MOVED. A thank-you for bringing gear back
            #  reads like a form letter when there was no gear. Nilsen's
            #  draft went further and said "nobody came through" - while
            #  its own attached pack showed Glenn Edwards at the counter
            #  on 28 Jul drawing a consumable. An email its own
            #  attachment disproves is worse than a plain one, so the
            #  consumables visit is now checked and said.
            cons_units = sum(int(h.get("units") or 0) for h in
                             (co.get("cons") or {}).get("by_hirer", []))
            if cons_units:
                who = ("One of your crew" if co["n_hirers"] == 1
                       else n_of(co["n_hirers"], "person", "people")
                       + " from your crew")
                out.append(("Nothing on hire.",
                            "{} came through the tool store {} for "
                            "consumables only &mdash; no equipment went "
                            "out under your name, and the register holds "
                            "nothing against it today. There is nothing "
                            "to chase and nothing owing.".format(
                                who, "over " + _esc(span) if span
                                else "this period")))
            else:
                out.append(("Nothing on hire, nothing this period.",
                            "Nobody from your crew came through the tool "
                            "store {}, and the register has nothing "
                            "against your name today. That is the whole "
                            "position &mdash; there is nothing to chase "
                            "and nothing owing.".format(
                                "over " + _esc(span) if span
                                else "this period")))
            out.append(("If that is not what you expect,",
                        "tell us. An empty page can mean your crew took "
                        "nothing, or it can mean gear went out under "
                        "another name. We would rather hear from you than "
                        "have you assume the first one."))
            return out
        took = ("Over {} your crew took {} off the tool store and "
                "returned {}. ".format(_esc(span), n_of(c["issued"], "item"),
                                       "{:,}".format(c["returned"]))
                if span else "")
        out.append(("All clear.",
                    took + "You are holding <b>none</b> of our gear. "
                    "Nothing outstanding, nothing to chase and nothing to "
                    "come back for."))
        #  ISSUED AND RETURNED DO NOT HAVE TO MATCH FOR THE ANSWER TO BE
        #  NIL. QWest's draft said "took 2 and returned 0" and then "you
        #  are holding none" in the same breath, with nothing to join
        #  them up. Both are true; the join has to be printed.
        r = _reconcile(co, period, nil=True)
        if r:
            out.append(("", "<span style='color:#777777'>" + r + "</span>"))
        s = _standout(co)
        if s:
            out.append(("", s))
        #  The praise has to match the record - "your crew did exactly
        #  that" was going to a company with 0 recorded returns.
        out.append(("Thank you.",
                    ("Gear that comes back on time and in one piece is "
                     "what keeps the store running for everybody else on "
                     "this shutdown, and your crew did exactly that. "
                     if c["returned"] else
                     "A clean sheet at the tool store is its own kind of "
                     "record. ")
                    + "The attached pack is the full record of your time "
                    "on site &mdash; what was taken, by whom, and how it "
                    "came back &mdash; so you have your own copy of it."))
        return out

    out.append(("The position.",
                "{} from your crew used the store this period. {} went out "
                "and {} came back. <b>{} {} still on hire.</b>{}".format(
                    n_of(co["n_hirers"], "person", "people"),
                    n_of(c["issued"], "item"),
                    "{:,}".format(c["returned"]),
                    "{:,}".format(c["still"]),
                    "item is" if c["still"] == 1 else "items are",
                    ("" if co["n_hirers"] == 1 else
                     " Every one of them has their own page in the attached "
                     "pack, so the list can be handed straight to the person "
                     "holding the gear."))))
    #  SINCE YOUR LAST REPORT. The one line a contractor actually wants:
    #  is my list getting shorter? Both numbers come off reports they
    #  already hold, so the claim is checkable from their own inbox.
    if prev:
        p_lab, p_still = prev
        d = c["still"] - int(p_still)
        if d < 0:
            out.append(("", "<b>Down {} since your {} report.</b> The "
                        "list is moving the right way &mdash; keep it "
                        "coming.".format("{:,}".format(-d), _esc(p_lab))))
        elif d > 0:
            out.append(("", "<b>Up {} since your {} report.</b> Worth a "
                        "minute with the attached pack to see who is "
                        "holding what.".format("{:,}".format(d),
                                               _esc(p_lab))))
    r = _reconcile(co, period)
    if r:
        out.append(("", "<span style='color:#777777'>" + r + "</span>"))
    s = _standout(co)
    if s:
        out.append(("", s))
    return out


def render(co, period):
    #  THE SHUT CURVE IS BUILT BUT NOT WIRED IN HERE. Andrew, 5 Aug
    #  2026: "how about we leave it out of there. give me a sec" - he
    #  has another place in mind for it. shut_curve_html() and the
    #  model's curve data are both intact and cost nothing sitting
    #  here, so putting it wherever he lands on is one line, not a
    #  rebuild. Add + shut_curve_html(co) back to turn it on.
    body = (all_clear_html(co, period) + company_page(co, period)
            + EC.store_story_html())
    for h in co["hirers"]:
        body += hirer_page(h, period, co["display"])
    return body
