"""COATES | AMPOL TOOL STORE - the daily position, one page (button 15).

Author: Andrew Fisher | POWERED BY SITEIQ

WHY (03 Sep 2026): six report families, six PDFs, and a refinery manager
with sixty seconds. This page puts the position of every family on one
A4 sheet: the RAG status each report printed on its own page 1, the one
number of the day, the headline in words, who owns the next action and
by when. Nothing is counted here - every figure is read back from the
movement scoreboard (History\\report_history.json) that each report wrote
when it built this morning, so the page can never disagree with the
reports it summarises. A family that has not built today says so in
plain words rather than showing yesterday's number as today's.

Runs LAST in 00_RUN_EVERYTHING (after the six families) and on its own
from button 15. Output: Reports\\<day>\\Daily\\ - PDF, page HTML, an
Outlook draft with the PDF attached. Nothing sends itself.
"""

import json
import os
import sys
from datetime import date, datetime
from email import encoders
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import ampol_names
import ampol_paths
import k2shell as sh
import pdf_finish
import report_history as rh
import build_stocktake_compliance_tool as eng    # write_pdf_robust, STAFF_EMAIL_TO

esc = sh.esc
BASE = Path(__file__).resolve().parent
OUT = Path(ampol_paths.day_folder("Daily"))

CONFIG = {
    "kicker": "COATES · TOOL STORE · DAILY POSITION",
    "client": "Ampol",
    "title": "Daily Position",
    "project": "Ampol Lytton Refinery · Permanent Tool Store",
    "asat_note": "(each family's own SiteIQ pull)",
    "key_items": [
        ("red", "RED", "action needed - owner and date named"),
        ("amber", "AMBER", "at risk - watched, action set"),
        ("green", "GREEN", "on track"),
    ],
    "team": [
        {"name": "Andrew Fisher", "role": "Shutdown Manager", "shift": "",
         "email": "andrew.fisher@coates.com.au",
         "blurb": "Runs the Ampol tool store the Coates Way - every figure counted from SiteIQ."},
    ],
}

# family key -> (name on the page, the button that builds it, icon)
FAMILIES = [
    ("gas", "Gas monitors", "01", "shield"),
    ("radio", "Site radios", "03", "swap"),
    ("tooling", "Tooling on hire", "04", "box"),
    ("stocktake", "Stocktake", "05", "check"),
    ("calibration", "Calibration", "06", "clock"),
    ("rigging", "Rigging and lifting", "07", "warn"),
]
ORDER = {"red": 0, "amber": 1, "green": 2}
# WHY (03 Sep 2026): the direction that is good for each family's cover
# number - a fall in overdue monitors is good, a rise in the share of the
# shelf sighted is good, and "items on hire" has no good direction (grey).
KEY_GOOD = {"gas": "down", "radio": "down", "tooling": None, "stocktake": "up",
            "calibration": "down", "rigging": "down"}


def key_number(text):
    """'1,500' -> 1500, '96%' -> 96.0, '$72,000' -> 72000; None when the
    figure is not a number (never guessed)."""
    t = str(text or "").replace(",", "").replace("$", "").replace("%", "").strip()
    if not t:
        return None
    try:
        return float(t) if "." in t else int(t)
    except ValueError:
        return None


def key_series(fam, run_day, days=30):
    """[(day, number)] for the family's cover number over the recorded
    days on or before the run day - read from the extra each report
    wrote, so the line is the number the cover printed, nothing else."""
    hist = rh.load().get(fam, {})
    out = []
    for day in sorted(k for k in hist if k <= run_day)[-days:]:
        x = hist[day].get("extra") or {}
        n = key_number(x.get("key_value"))
        if n is not None:
            out.append((day, n))
    return out


def key_movement(fam, series):
    """(text, css_class) like the page-1 tiles: the change since the
    previous recorded day, or ("", "") with fewer than two days."""
    if len(series) < 2:
        return "", ""
    (pday, pval), (_, val) = series[-2], series[-1]
    diff = val - pval
    when = datetime.strptime(pday, "%Y-%m-%d").strftime("%d %b")
    if diff == 0:
        return f"no change since {when}", "grey"
    arrow = "\u25b2" if diff > 0 else "\u25bc"
    mag = abs(diff)
    txt = f"{arrow} {mag:g}" if isinstance(mag, float) else f"{arrow} {mag:,}"
    good = KEY_GOOD.get(fam)
    if good is None:
        return f"{txt} since {when}", "grey"
    improved = (diff < 0) if good == "down" else (diff > 0)
    return f"{txt} since {when}", ("green" if improved else "red")

EXTRA_CSS = """
.dp-sum { display: flex; gap: 8px; margin: 2px 0 6px 0; }
.dp-sum .c { flex: 1 1 0; border-radius: 10px; padding: 5px 10px 6px 10px; color: #FFFFFF; background: #1A2430; }
.dp-sum .c .n { font-size: 22px; font-weight: 700; line-height: 1; }
.dp-sum .c .l { font-size: 8.4px; letter-spacing: 1.4px; text-transform: uppercase; margin-top: 4px; color: #C9D6E2; }
.dp-sum .c.rd { background: #F0603E; } .dp-sum .c.a { background: #EFA82B; color: #16202C; }
.dp-sum .c.a .l { color: #16202C; } .dp-sum .c.g { background: #22C55E; color: #0F1620; } .dp-sum .c.g .l { color: #0F1620; }
.dp-fresh { font-size: 9px; color: #5B6B7B; margin: 0 0 4px 0; }
.dp-fresh b { color: #16202C; }
.fam { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.fam .fc { border: 1px solid #E3E8EE; border-left: 7px solid #8A9AAC; border-radius: 10px; background: #FFFFFF;
           padding: 6px 9px 5px 9px; break-inside: avoid; }
.fam .fc.rd { border-left-color: #F0603E; } .fam .fc.a { border-left-color: #EFA82B; } .fam .fc.g { border-left-color: #22C55E; }
.fam .fh { display: flex; align-items: center; gap: 7px; }
.fam .fh .nm { font-size: 12.2px; font-weight: 700; color: #16202C; flex: 1 1 auto; }
.fam .fh .pill { font-size: 8px; font-weight: 900; letter-spacing: 1.6px; padding: 3px 8px; border-radius: 10px; color: #FFFFFF; background: #8A9AAC; }
.fam .fc.rd .pill { background: #F0603E; } .fam .fc.a .pill { background: #EFA82B; color: #16202C; } .fam .fc.g .pill { background: #22C55E; color: #0F1620; }
.fam .big { display: flex; align-items: baseline; gap: 8px; margin-top: 3px; }
.fam .big .v { font-size: 23px; font-weight: 700; color: #16202C; line-height: 1; letter-spacing: -0.5px; }
.fam .big .k { font-size: 9.2px; color: #5B6B7B; }
.fam .big .v2 { font-size: 12.5px; font-weight: 700; color: #16202C; margin-left: auto; }
.fam .big .k2 { font-size: 8.6px; color: #5B6B7B; }
.fam .mv { display: flex; align-items: center; gap: 8px; margin-top: 1px; font-size: 8.6px; font-weight: 700; }
.fam .mv .green { color: #16A34A; } .fam .mv .red { color: #DC2626; } .fam .mv .grey { color: #8A9AAC; }
.fam .mv .spark { display: inline-block; }
.fam .fhl { margin-top: 3px; font-size: 9.4px; line-height: 1.36; color: #16202C; }
.fam .act { margin-top: 3px; font-size: 8.4px; line-height: 1.36; color: #5B6B7B; border-top: 1px solid #EEF1F5; padding-top: 3px; }
.fam .act b { color: #16202C; }
.fam .fc.none { background: #F7F9FB; }
.fam .fc.none .fhl { color: #5B6B7B; }
.dp-note { margin-top: 6px; font-size: 8.4px; color: #5B6B7B; line-height: 1.4; }
"""


def family_card(fam, name, button, ico, entry, run_day, series=()):
    """One card: the family's own status, number and action, read back
    from what its report recorded. No entry today = an honest grey card."""
    if not entry or "extra" not in entry:
        why = ("not built yet" if not entry else "built before the position record was added")
        return (f'<div class="fc none"><div class="fh">{sh.icon(ico, "#8A9AAC")}<div class="nm">{esc(name)}</div>'
                f'<div class="pill">NO POSITION</div></div>'
                f'<div class="fhl">No position recorded for {esc(run_day)} - {why}. '
                f'Run button {button} and this page again.</div></div>')
    x = entry["extra"]
    st = (x.get("rag") or "").lower()
    cls = {"red": "rd", "amber": "a", "green": "g"}.get(st, "")
    word = {"red": "RED", "amber": "AMBER", "green": "GREEN"}.get(st, "RECORDED")
    v2 = (f'<div class="v2">{esc(str(x.get("second_value", "")))}</div><div class="k2">{esc(x.get("second_label", ""))}</div>'
          if x.get("second_value") not in (None, "") else "")
    act = ""
    if x.get("action") or x.get("owner"):
        # a family that already wrote the due date into its action line
        # does not get it twice
        due = x.get("due", "")
        act = (f'<div class="act"><b>{esc(x.get("owner", ""))}</b> &middot; {esc(x.get("action", ""))}'
               + (f' &middot; by <b>{esc(due)}</b>' if due and due not in x.get("action", "") else "") + "</div>")
    asat = entry.get("asat", "")
    mv, mcls = key_movement(fam, series)
    spark = sh.sparkline([n for _, n in series], w=96, h=20) if len(series) >= 2 else ""
    move = (f'<div class="mv"><span class="{mcls}">{esc(mv)}</span>{spark}</div>' if mv else "")
    return (f'<div class="fc {cls}"><div class="fh">{sh.icon(ico)}<div class="nm">{esc(name)}</div>'
            f'<div class="pill">{word}</div></div>'
            f'<div class="big"><div class="v">{esc(str(x.get("key_value", "-")))}</div>'
            f'<div class="k">{esc(x.get("key_label", ""))}</div>{v2}</div>{move}'
            f'<div class="fhl">{esc(x.get("headline", ""))}</div>{act}'
            f'<div class="act" style="border-top:0;padding-top:2px">Pull {esc(asat)} &middot; {esc(x.get("title", ""))}'
            + (f' &middot; <b>built {esc(str(entry.get("written", ""))[:11])} - not today</b>' if entry.get("_stale") else "")
            + '</div></div>')


def build(run_day):
    cards, counts = [], {"red": 0, "amber": 0, "green": 0, "none": 0}
    asats = []
    rows = []
    for key, name, button, ico in FAMILIES:
        # WHY (03 Sep 2026): a family keys its record on the PULL day (the
        # 03 Sep morning report runs on the 02 Sep 18:30 pull), so the
        # newest record on or before the run day is today's position. The
        # card prints the pull time; a record not written today is marked.
        day, entry = rh.latest(key, run_day)
        if entry is not None:
            written = str(entry.get("written", ""))
            entry = dict(entry)
            entry["_stale"] = not written.startswith(datetime.strptime(run_day, "%Y-%m-%d").strftime("%d %b %Y"))
        st = ((entry or {}).get("extra") or {}).get("rag", "").lower() if entry else ""
        counts[st if st in counts else "none"] += 1
        if entry and entry.get("asat"):
            try:
                asats.append(datetime.strptime(entry["asat"], "%d %b %Y %H:%M"))
            except ValueError:
                pass
        rows.append((ORDER.get(st, 3), ampol_names.sort_key(name), key, name, button, ico, entry))
    rows.sort(key=lambda r: (r[0], r[1]))
    for _, _, key, name, button, ico, entry in rows:
        cards.append(family_card(key, name, button, ico, entry, run_day, key_series(key, run_day)))
    now = datetime.now()
    if asats:
        lo, hi = min(asats), max(asats)
        fresh = (f'Pulled <b>{lo:%d %b %Y %H:%M}</b>' + (f' to <b>{hi:%d %b %Y %H:%M}</b>' if hi != lo else "")
                 + f' &middot; built <b>{now:%d %b %Y %H:%M}</b> &middot; <b>{(now - lo).total_seconds() / 3600:.0f} h</b> old at build')
    else:
        fresh = "No family has recorded a position today."
    summ = (f'<div class="dp-sum">'
            f'<div class="c rd"><div class="n">{counts["red"]}</div><div class="l">Red - action needed</div></div>'
            f'<div class="c a"><div class="n">{counts["amber"]}</div><div class="l">Amber - at risk</div></div>'
            f'<div class="c g"><div class="n">{counts["green"]}</div><div class="l">Green - on track</div></div>'
            f'<div class="c"><div class="n">{counts["none"]}</div><div class="l">Not recorded today</div></div></div>')
    inner = (summ + f'<div class="dp-fresh">{fresh}</div>'
             + '<div class="sect" style="margin-top:6px"><h3>The six families - red first, then amber, then green, A to Z inside each</h3></div>'
             + f'<div class="fam">{"".join(cards)}</div>'
             + '<div class="dp-note">Every status, number and action on this page is the one the family\'s own report '
               'printed on its page 1 this morning, read back from the movement scoreboard the report wrote '
               '(History\\report_history.json). Nothing is counted or estimated here. The detail, the rules and '
               'the data sources are in each family\'s PDF, named on its card.</div>')
    asat_s = f"{min(asats):%d %b %Y %H:%M}" if asats else f"{date.fromisoformat(run_day):%d %b %Y}"
    gen_s = f"{now:%d %b %Y %H:%M}"
    page = sh.render_page(CONFIG, inner, 1, 1, gen_s, asat_s)
    doc = (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
           f'<title>Coates Ampol Daily Position - {esc(asat_s)}</title><style>{EXTRA_CSS}</style></head>'
           f'<body>{page}</body></html>')
    return doc, counts, asat_s, gen_s, rows


def email_body(counts, asat_s, gen_s, rows, pdf_name):
    lines = []
    for _, _, key, name, button, ico, entry in rows:
        x = (entry or {}).get("extra") if entry else None
        if not x:
            lines.append(f"<tr><td style='padding:4px 8px;color:#8A9AAC'>{esc(name)}</td><td style='padding:4px 8px' colspan='2'>no position recorded today</td></tr>")
            continue
        col = sh.rag_colour(x.get("rag"))
        lines.append(f"<tr><td style='padding:4px 8px;font-weight:bold'>{esc(name)}</td>"
                     f"<td style='padding:4px 8px;color:{col};font-weight:bold'>{esc((x.get('rag') or '').upper())}</td>"
                     f"<td style='padding:4px 8px'>{esc(str(x.get('key_value', '')))} {esc(x.get('key_label', ''))} - {esc(x.get('headline', ''))}</td></tr>")
    return (f"<html><body style='font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#16202C'>"
            f"<p>Good morning,</p><p>The Ampol tool store position on one page is attached ({esc(pdf_name)}). "
            f"Today: {counts['red']} red, {counts['amber']} amber, {counts['green']} green"
            + (f", {counts['none']} not recorded" if counts['none'] else "") + ".</p>"
            f"<table style='border-collapse:collapse;font-size:10pt'>{''.join(lines)}</table>"
            f"<p>Each line is what that family's own report printed on its page 1 this morning; the detail is in that report.</p>"
            f"<p>Andrew Fisher<br>Shutdown Manager, Coates<br>POWERED BY SITEIQ</p></body></html>")


def write_eml(path, subject, body_html, pdf_path, card_path=None):
    """The draft: the card inline under the greeting (cid) and attached,
    the PDF attached. Nothing sends itself."""
    from email.mime.image import MIMEImage
    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["To"] = eng.STAFF_EMAIL_TO
    msg["X-Unsent"] = "1"
    if card_path:
        body_html = body_html.replace("<p>Good morning,</p>",
                                      '<p>Good morning,</p><p><img src="cid:positioncard" width="420" '
                                      'style="max-width:420px;height:auto;border-radius:12px" alt="Daily position"></p>', 1)
        rel = MIMEMultipart("related")
        rel.attach(MIMEText(body_html, "html", "utf-8"))
        with open(card_path, "rb") as f:
            img = MIMEImage(f.read(), _subtype="png")
        img.add_header("Content-ID", "<positioncard>")
        img.add_header("Content-Disposition", "inline", filename=os.path.basename(card_path))
        rel.attach(img)
        msg.attach(rel)
        with open(card_path, "rb") as f:
            att = MIMEImage(f.read(), _subtype="png")
        att.add_header("Content-Disposition", "attachment", filename=os.path.basename(card_path))
        msg.attach(att)
    else:
        alt = MIMEMultipart("alternative")
        alt.attach(MIMEText(body_html, "html", "utf-8"))
        msg.attach(alt)
    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            part = MIMEApplication(f.read(), _subtype="pdf")
        part.add_header("Content-Disposition", "attachment", filename=os.path.basename(pdf_path))
        msg.attach(part)
    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(msg.as_string())


def main():
    run_day = date.today().isoformat()
    stem = ampol_names.report_stem("daily")
    print("=" * 68)
    print(" COATES | AMPOL DAILY POSITION - one page, six families")
    print("=" * 68)
    print(f"Scoreboard           : {rh.HIST}")
    doc, counts, asat_s, gen_s, rows = build(run_day)
    css = (BASE / "k2style.css").read_text(encoding="utf-8")
    full = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    html_path = OUT / f"{stem}.html"
    html_path.write_text(full, encoding="utf-8")
    pdf_path = OUT / f"{stem}.pdf"
    try:
        pdf_path.unlink()
    except OSError:
        pass
    ok = eng.write_pdf_robust(str(html_path), str(pdf_path))
    fit_ok = False
    if ok and pdf_path.exists():
        fit_ok, _, _ = sh.fit_check(doc, css, f"{stem}.pdf", OUT)
        if fit_ok is None:
            fit_ok = True
        print("PDF                  : " + pdf_finish.finish(
            str(pdf_path), f"Ampol Daily Position - as at {asat_s}",
            "The position of all six Ampol tool store report families on one page, read from their own page-1 records.",
            doc, has_cover=False, family="Daily position"))
    else:
        print("*" * 68)
        print("WARNING: no PDF engine on this machine - the page HTML is written; the draft goes without a PDF.")
        print("*" * 68)
    # the phone card: six family numbers in their status colours, the
    # day's tally as the band - the same values as the page, nothing else
    card_path = OUT / f"{stem}_PositionCard.png"
    try:
        col = {"red": "#F0603E", "amber": "#EFA82B", "green": "#22C55E"}
        tiles = []
        for _, _, key, name, button, ico, entry in rows:
            x = (entry or {}).get("extra") if entry else None
            if x:
                tiles.append((str(x.get("key_value", "-")), name, f"{(x.get('rag') or '').upper()} - {x.get('key_label', '')}"[:44],
                              col.get((x.get("rag") or "").lower(), "#7A8A9A")))
            else:
                tiles.append(("-", name, "no position recorded", "#7A8A9A"))
        overall = "red" if counts["red"] else "amber" if counts["amber"] else "green"
        sh.position_card_png(CONFIG, asat_s, tiles[:6],
                             (overall, f"{counts['red']} red, {counts['amber']} amber, {counts['green']} green across the six families"
                              + (f"; {counts['none']} not recorded" if counts['none'] else "") + ".",
                              "Andrew Fisher, Shutdown Manager", "Each family's next action and date sit on its own card and PDF"),
                             [], str(card_path), "Read back from each report's own page-1 record - nothing counted here.")
        print(f"Position card        : {card_path.name}")
    except Exception as e:
        card_path = None
        print(f"Position card        : not drawn ({type(e).__name__}: {e})")
    subject = f"Ampol tool store - daily position {asat_s[:11].strip()} ({counts['red']} red, {counts['amber']} amber, {counts['green']} green)"
    eml_path = OUT / f"{stem}_OUTLOOK.eml"
    body = email_body(counts, asat_s, gen_s, rows, f"{stem}.pdf")
    write_eml(eml_path, subject, body, str(pdf_path) if pdf_path.exists() else None,
              str(card_path) if card_path and card_path.exists() else None)
    (OUT / f"{stem}.body.html").write_text(body, encoding="utf-8")
    to_line = "; ".join(a.strip("<> ") for a in
                        [p.split("<")[-1] for p in eng.STAFF_EMAIL_TO.split(",")])
    # the same manifest shape every family writes (MAKE_OUTLOOK_DRAFTS reads
    # it): body and attachments are file names beside the manifest
    with open(OUT / f"{stem}.draft.json", "w", encoding="utf-8") as f:
        json.dump({"subject": subject, "to": to_line, "body": f"{stem}.body.html",
                   "attachments": ([f"{stem}.pdf"] if pdf_path.exists() else [])
                                  + ([card_path.name] if card_path and card_path.exists() else [])}, f, indent=1)
    print(f"Position             : {counts['red']} red, {counts['amber']} amber, {counts['green']} green, "
          f"{counts['none']} not recorded today")
    print(f"Written              : {OUT}")
    print(f"                       {stem}.pdf / .html / _OUTLOOK.eml / .draft.json")
    print("NEXT STEP: double-click the .eml, check it, press Send. Nothing sends itself.")
    if pdf_path.exists() and not fit_ok:
        sys.exit("\nWARNING: the page did not pass its fit check - do not send it as is.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
