"""Printable A4 reports from a single company or worker's scoped QR projection."""
from datetime import date, datetime, timedelta, timezone
from io import BytesIO
from math import cos, pi, sin
from pathlib import Path
from threading import Lock
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont, TTFError
from reportlab.platypus import CondPageBreak, Flowable, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

SLATE = HexColor("#2A313C")
INK = HexColor("#232B35")
MUTED = HexColor("#52606D")
RULE = HexColor("#DCE1E6")
PALE = HexColor("#F3F5F7")
ORANGE = HexColor("#F26222")
ORANGE_INK = HexColor("#A23F0F")
MMG_RED = HexColor("#B61D2B")
COPYRIGHT = ("Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved. "
             "Not to be copied or reproduced without permission.")
WIDTH, HEIGHT = A4
MARGIN = 36
CONTENT = WIDTH - 2 * MARGIN - 12  # SimpleDocTemplate frame includes 6pt padding on either side.
FONT_LOCK = Lock()


def fonts(job_dir):
    if job_dir:
        directory = Path(job_dir) / "kit" / "_fonts"
        faces = [("QRInter", "Inter-Regular.ttf"), ("QRInterBold", "Inter-Bold.ttf")]
        if all((directory / file).is_file() for _, file in faces):
            try:
                with FONT_LOCK:
                    for name, file in faces:
                        if name not in pdfmetrics.getRegisteredFontNames():
                            pdfmetrics.registerFont(TTFont(name, str(directory / file)))
                return faces[0][0], faces[1][0]
            except (OSError, TTFError):
                pass
    return "Helvetica", "Helvetica-Bold"


def text(value):
    return " ".join(str(value).split()) if value is not None else ""


def number(value):
    if value is None:
        return "—"
    return f"{value:,}" if isinstance(value, int) else f"{value:,.2f}".rstrip("0").rstrip(".")


def when(value):
    raw = text(value)
    if not raw:
        return "Not supplied"
    try:
        if len(raw) == 10:
            return date.fromisoformat(raw).strftime("%d %b %Y").lstrip("0")
        stamp = datetime.fromisoformat(raw)
        if stamp.tzinfo is not None:
            stamp = stamp.astimezone(timezone(timedelta(hours=10)))
        return stamp.strftime("%d %b %Y %H:%M").lstrip("0") + " AEST"
    except ValueError:
        return raw


def transaction_periods(coverage):
    periods = coverage.get("transaction_periods")
    if periods is None:
        periods = [{"start": coverage.get("period_start"), "end": coverage.get("period_end")}]
    return [p for p in periods if p.get("start") and p.get("end")]


def observed(value, covered):
    """An export can establish zero only when its source exists."""
    return number(value) if value is not None and (covered or value != 0) else "Unavailable"


class DailyMovements(Flowable):
    """A compact, vector print chart with legible values independent of colour."""
    def __init__(self, rows, normal, bold, accent, wash):
        super().__init__()
        self.rows, self.normal, self.bold = rows, normal, bold
        self.accent, self.wash = accent, wash
        self.width, self.height = CONTENT, 39 + 19 * len(rows)

    def draw(self):
        c = self.canv
        c.setFillColor(self.wash)
        c.roundRect(0, 0, self.width, self.height, 6, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont(self.bold, 8.6)
        c.drawString(12, self.height - 16, "RECORDED DATE")
        lefts = (132, 322)
        for x, label in zip(lefts, ("TOOLS ISSUED", "TOOLS RETURNED")):
            c.drawString(x, self.height - 16, label)
        maximum = max(1, *(d[k] for d in self.rows for k in ("issued", "returned")))
        for i, day in enumerate(self.rows):
            y = self.height - 34 - i * 19
            c.setFont(self.normal, 8.7)
            c.setFillColor(INK)
            c.drawString(12, y, when(day["date"]))
            for x, k, tone in zip(lefts, ("issued", "returned"), (self.accent, SLATE)):
                value = day[k]
                c.setFillColor(white)
                c.roundRect(x, y + 1, 104, 5, 2, fill=1, stroke=0)
                if value:
                    c.setFillColor(tone)
                    c.rect(x, y + 1, 104 * value / maximum, 5, fill=1, stroke=0)
                c.setFillColor(INK)
                c.setFont(self.bold, 8.7)
                c.drawString(x + 112, y, number(value))


class ReturnStars(Flowable):
    """A labelled five-star rating; vector outlines and half fills survive printing."""
    def __init__(self, score, bold, accent, wash):
        super().__init__()
        self.score, self.bold, self.accent, self.wash = score, bold, accent, wash
        self.width, self.height = CONTENT, 51

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(self.wash)
        c.roundRect(0, 0, self.width, self.height, 6, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont(self.bold, 9)
        c.drawString(12, 31, "SAME-DAY RETURN SCORE")
        c.setFont(self.bold, 14)
        c.drawString(12, 12, f"{number(self.score)} / 5")
        radius = 12
        for i in range(5):
            cx, cy = self.width - 164 + i * 31, self.height / 2
            star = c.beginPath()
            for point in range(10):
                angle = pi / 2 + point * pi / 5
                distance = radius if point % 2 == 0 else radius * .44
                x, y = cx + distance * cos(angle), cy + distance * sin(angle)
                (star.moveTo if point == 0 else star.lineTo)(x, y)
            star.close()
            c.setStrokeColor(MUTED)
            c.setLineWidth(.9)
            c.setFillColor(white)
            c.drawPath(star, fill=1, stroke=1)
            fraction = min(1, max(0, self.score - i))
            if fraction:
                c.saveState()
                if fraction < 1:
                    clip = c.beginPath()
                    clip.rect(cx - radius, cy - radius, 2 * radius * fraction, 2 * radius)
                    c.clipPath(clip, stroke=0, fill=0)
                c.setFillColor(self.accent)
                c.setStrokeColor(self.accent)
                c.drawPath(star, fill=1, stroke=1)
                c.restoreState()
        c.restoreState()


def render_pdf(report, *, job_dir=None):
    """Render only the allowlisted fields of the given projection. No register lookups."""
    kind = report.get("kind")
    name = text(report.get("name"))
    if kind not in {"company", "person"} or not name:
        raise ValueError("A selected company or person is required.")
    company_report = kind == "company"
    accent = ORANGE if company_report else MMG_RED
    ink_accent = ORANGE_INK if company_report else MMG_RED
    wash = HexColor("#FFF0E3" if company_report else "#FBEDEE")
    coverage = report.get("coverage") or {}
    rental_asat = coverage.get("rental_asat") or report.get("asat")
    issue_time = when(rental_asat) if rental_asat else "Timestamp unavailable"
    normal, bold = fonts(job_dir)
    logo = None
    if job_dir:
        path = Path(job_dir) / "logo.png"
        if path.is_file():
            try:
                logo = ImageReader(str(path))
                logo.getSize()
            except (ValueError, OSError):
                logo = None

    out = BytesIO()
    title = "Company on-hire report" if company_report else "Personal tool store report"
    doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                            topMargin=85, bottomMargin=59, title=f"{name} | {title}",
                            author="Andrew Fisher", subject=COPYRIGHT, creator="Coates MMG Dugald River Tool Store")

    def para(value, size=9, face=None, colour=INK, **kwargs):
        style = ParagraphStyle("report", fontName=face or normal, fontSize=size,
                               leading=size * 1.28, textColor=colour, **kwargs)
        return Paragraph(escape(text(value)), style)

    def frame(canvas, document):
        canvas.saveState()
        canvas.setFillColor(SLATE)
        canvas.rect(0, HEIGHT - 76, WIDTH, 76, fill=1, stroke=0)
        canvas.setFillColor(accent)
        canvas.rect(0, HEIGHT - 79, WIDTH, 3, fill=1, stroke=0)
        canvas.setFillColor(ORANGE)
        canvas.setFont(bold, 17)
        canvas.drawString(MARGIN, HEIGHT - 35, "COATES")
        canvas.setStrokeColor(HexColor("#79838C"))
        canvas.line(MARGIN + 86, HEIGHT - 39, MARGIN + 86, HEIGHT - 17)
        if logo:
            canvas.setFillColor(white)
            canvas.roundRect(MARGIN + 91, HEIGHT - 46, 50, 40, 4, stroke=0, fill=1)
            canvas.drawImage(logo, MARGIN + 97, HEIGHT - 43, 38, 34,
                             preserveAspectRatio=True, anchor="c", mask="auto")
        else:
            canvas.setFillColor(white)
            canvas.setFont(bold, 17)
            canvas.drawString(MARGIN + 96, HEIGHT - 35, "MMG")
        canvas.setFillColor(white)
        canvas.setFont(normal, 9)
        canvas.drawString(MARGIN, HEIGHT - 60, "Dugald River  /  Shutdown Tool Store")
        # Preserve the complete selected name in the body; fit its running header separately.
        canvas.setFont(bold, 9)
        canvas.drawRightString(WIDTH - MARGIN, HEIGHT - 25, title.upper())
        running = para(name, 10, normal, white, alignment=TA_RIGHT)
        width, height = running.wrap(263, 38)
        if height > 38:
            short_name = name[:100]
            while short_name and pdfmetrics.stringWidth(short_name + "…", normal, 9) > 263:
                short_name = short_name[:-1]
            running = para(short_name + "…", 9, normal, white, alignment=TA_RIGHT)
            width, height = running.wrap(263, 38)
        running.drawOn(canvas, WIDTH - MARGIN - width, HEIGHT - 33 - height)
        canvas.setStrokeColor(RULE)
        canvas.line(MARGIN, 47, WIDTH - MARGIN, 47)
        canvas.setFillColor(MUTED)
        canvas.setFont(normal, 7.3)
        canvas.drawString(MARGIN, 36, "Author: Andrew Fisher | POWERED BY SITEIQ")
        canvas.drawRightString(WIDTH - MARGIN, 36, f"SiteIQ pull {issue_time}   ·   Page {document.page}")
        canvas.setFont(normal, 6.7)
        canvas.drawString(MARGIN, 20, COPYRIGHT)
        canvas.restoreState()

    flow = [para(title.upper(), 9, bold, ink_accent, spaceAfter=4),
            para(name, 23, bold, spaceAfter=3)]
    company = text(report.get("company"))
    if not company_report and company:
        flow.append(para(company, 11, colour=MUTED, spaceAfter=3))
    flow.extend([para("Latest SiteIQ rental stock snapshot  ·  " + issue_time, 9, colour=MUTED), Spacer(1, 10)])

    def heading(label):
        flow.extend([CondPageBreak(82), para(label, 13, bold, spaceBefore=14, spaceAfter=5)])

    def table(headers, rows, weights):
        widths = [w * CONTENT for w in weights]
        data = [[para(h.upper(), 7.8, bold, white) for h in headers]]
        data.extend([para(cell, 8.8) for cell in row] for row in rows)
        grid = LongTable(data, colWidths=widths, repeatRows=1, splitInRow=1, hAlign="LEFT")
        grid.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), SLATE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, PALE]),
            ("LINEBELOW", (0, 0), (-1, 0), 1.6, accent),
            ("LINEBELOW", (0, 1), (-1, -1), .35, RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ]))
        flow.append(grid)

    def record_coverage(coverage):
        heading("Record coverage")
        periods = transaction_periods(coverage)
        for period in periods:
            flow.append(para("Tool transactions  ·  " + when(period["start"]) + " to " + when(period["end"])))
        if not periods:
            flow.append(para("Tool transaction dates are unavailable. Issue and return totals for this period cannot be confirmed."))
        for key, label in [("rental_asat", "Rental stock pull"), ("transactions_asat", "Transactions pull"),
                           ("sales_asat", "Sales stock pull")]:
            if coverage.get(key):
                flow.append(para(label + "  ·  " + when(coverage[key]), 8.8, colour=MUTED))
        if not coverage.get("sales_asat"):
            flow.append(para("Sales stock snapshot date unavailable.", 8.8, colour=MUTED))

    def daily_table(activity, source):
        periods = transaction_periods(source)
        def values(a):
            day = a["date"]
            tools = any(p["start"][:10] <= day <= p["end"][:10] for p in periods)
            sales = bool(source.get("sales_asat") and day <= source["sales_asat"][:10])
            return (when(day), observed(a.get("issued"), tools), observed(a.get("returned"), tools),
                    observed(a.get("consumable_units"), sales), observed(a.get("consumable_returns"), sales))
        table(("Date", "Tools issued", "Tools returned", "Units drawn", "Units returned"),
              [values(a) for a in activity], (.24, .19, .19, .19, .19))

    def chapter(period):
        # SiteIQ retains this misspelling as its immutable import key.
        schedule = ("MMG Dugald River · November–December 2026"
                    if period["schedule"] == "MMG Shutdown Novermber26-December26" else period["schedule"])
        heading("This shutdown" if period["current"] else schedule)
        if period["current"]:
            flow.append(para(schedule, 9.4, bold, ink_accent, spaceAfter=3))
        source = period["coverage"]
        tools = bool(transaction_periods(source))
        sales = bool(source.get("sales_asat"))
        recorded = period["activity_days"]
        if recorded:
            first, last = period.get("first_date"), period.get("last_date")
            dates = (" (" + when(first) + ")") if first and first == last else (
                ", from " + when(first) + " to " + when(last) if first and last else "")
            flow.append(para(f"The tool store recorded activity on {number(recorded)} "
                             + ("date" if recorded == 1 else "dates") + dates + "."))
        elif tools or sales:
            flow.append(para("No dated activity was recorded in the available tool-store records."))
        else:
            flow.append(para("Dated activity records are unavailable for this shutdown."))
        flow.append(para("Activity dates refer to tool-store issues, returns and draws. Use the site attendance register to check hours on site.",
                         8.8, colour=MUTED, spaceAfter=5))
        table(("Tool issues", "Tool returns", "Consumable units drawn", "Consumable units returned"),
              [(observed(period.get("issues"), tools), observed(period.get("returned"), tools),
                observed(period.get("consumable_units"), sales), observed(period.get("consumable_returns"), sales))],
              (.21, .21, .29, .29))
        if not period["current"] and period.get("hire_count") is not None and (source.get("rental_asat") or period["hire_count"]):
            asat = source.get("rental_asat")
            flow.append(para(f"{number(period['hire_count'])} assets were on hire at the saved rental stock pull"
                             + (" on " + when(asat) if asat else "") + ".", colour=MUTED))
        days = sorted((d for d in period["activity"] if d["issued"] or d["returned"]
                       or any(p["start"][:10] <= d["date"] <= p["end"][:10] for p in transaction_periods(source))),
                      key=lambda d: d["date"])
        if days and any(d["issued"] or d["returned"] for d in days):
            heading("Daily tool movements" if len(days) <= 7 else "Tool movements on the latest seven recorded dates")
            flow.append(DailyMovements(days[-7:], normal, bold, accent, wash))

    def chapter_detail(period, include_daily):
        if include_daily and period["activity"]:
            heading("Daily activity")
            daily_table(period["activity"], period["coverage"])
        if period["equipment"]:
            heading("Equipment issued and returned")
            table(("Equipment", "Tool issues", "Tool returns"),
                  [(entry["name"], number(entry["issued"]), number(entry["returned"])) for entry in period["equipment"]],
                  (.66, .17, .17))
        if include_daily and period["consumables"]:
            heading("Consumables drawn")
            table(("Consumable", "Units drawn", "Units returned"),
                  [(entry["name"], number(entry["quantity"]), number(entry["returned"])) for entry in period["consumables"]],
                  (.64, .18, .18))

    groups = report["hires"]
    stories = report.get("story") or []
    now = next((period for period in stories if period["current"]), None)
    previous = [period for period in stories if not period["current"]]
    assets = []
    for group in groups:
        inventory = group["items"]
        for i, item in enumerate(inventory):
            issued = when(item["date"]) if item.get("date") else "Date not recorded"
            issued += " · " + (text(item.get("time")) or "Time not recorded")
            assets.append((group["name"], number(group["count"]) if i == 0 else "",
                           text(item.get("item")) or "Asset ID not recorded", issued))
    stats = [(observed(report["hire_count"], rental_asat), "Assets on hire"),
             (observed(len(groups), rental_asat), "Equipment types")]
    strip = Table([[[para(value, 21, bold), para(label, 8, normal, MUTED)] for value, label in stats]],
                  colWidths=[CONTENT / len(stats)] * len(stats), hAlign="LEFT")
    strip.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), wash),
                               ("VALIGN", (0, 0), (-1, -1), "TOP"),
                               ("LINEBEFORE", (0, 0), (0, 0), 3, accent),
                               ("LEFTPADDING", (0, 0), (-1, -1), 10),
                               ("TOPPADDING", (0, 0), (-1, -1), 8),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    flow.append(strip)
    heading("Equipment currently on hire" if company_report else "Currently on hire to you")
    if company_report:
        flow.append(para("Company holding these assets: " + name, 9.4, bold, spaceAfter=5))
    if assets:
        table(("Equipment", "Type qty", "Asset ID", "Date hired (AEST)"), assets, (.37, .095, .27, .265))
    elif rental_asat:
        message = ("No equipment is currently on hire in this rental stock pull." if company_report else
                   "You have no equipment currently on hire in this rental stock pull.")
        flow.append(para(message))
    else:
        flow.append(para("Current holdings are unavailable because the rental stock snapshot is undated."))
    guidance = ("At shift end, ask your crew to return unneeded gear to the tool store. Before anyone leaves site, "
                "check that all gear on their card has been returned." if company_report else
                "At shift end, return gear you no longer need to the tool store. Before you leave site, return all gear on your card.")
    flow.append(para(guidance, 9.0, spaceBefore=8, spaceAfter=3))
    flow.append(para("For a correction or a fresh copy, give the tool store controller the asset ID and the snapshot time above. "
                     "The tool store updates reports throughout the day and night.", 8.8, colour=MUTED))
    if now:
        chapter(now)
    if company_report and report.get("work_notes"):
        heading("Company work notes")
        flow.append(para("Work descriptions supplied by the company.", colour=MUTED, spaceAfter=4))
        for note in report["work_notes"]:
            flow.append(CondPageBreak(60))
            caption = "  ·  ".join(part for part in (when(note["date"]) if note.get("date") else "",
                                                     text(note.get("title"))) if part)
            if caption:
                flow.append(para(caption, 10, bold, ink_accent, spaceBefore=4))
            flow.append(para(note.get("description"), spaceAfter=4))
    if now:
        chapter_detail(now, include_daily=company_report)
        if company_report:
            record_coverage(now["coverage"])

    if not company_report:
        record_coverage(coverage)
        heading("Daily activity")
        if report["activity"]:
            daily_table(report["activity"], coverage)
        elif transaction_periods(coverage) or coverage.get("sales_asat"):
            flow.append(para("No dated activity was recorded in the available tool-store records."))
        else:
            flow.append(para("Dated tool-store activity is unavailable."))
        heading("Consumables drawn")
        summary = report["consumable_summary"]
        if coverage.get("sales_asat") or summary.get("units") or summary.get("returned_units"):
            flow.append(para(f"Units drawn: {observed(summary.get('units'), coverage.get('sales_asat'))}. "
                             f"Units returned: {observed(summary.get('returned_units'), coverage.get('sales_asat'))}."))
        else:
            flow.append(para("Consumable totals are unavailable because no dated sales stock snapshot was supplied."))
        rate = summary.get("units_per_draw_day")
        if rate is not None:
            flow.append(para(f"Average {number(rate)} units per draw day, based on {number(summary['active_days'])} "
                             "days with dated draws.", spaceAfter=5))
        if summary.get("previous_units_per_draw_day") is not None and summary.get("recent_units_per_draw_day") is not None:
            table(("Comparison period", "Units per draw day"), [
                (when(summary[prefix + "_start"]) + " to " + when(summary[prefix + "_end"]),
                 number(summary[prefix + "_units_per_draw_day"])) for prefix in ("previous", "recent")], (.7, .3))
            flow.append(Spacer(1, 5))
        if report["consumables"]:
            table(("Consumable", "Units drawn", "Units returned"),
                  [(r["name"], number(r["quantity"]), number(r.get("returned"))) for r in report["consumables"]], (.6, .2, .2))
        benchmark = summary.get("benchmark") or {}
        if benchmark:
            heading("Consumable volume comparison")
            labels = {"high": "High-volume consumable use", "within_range": "Within the comparison range",
                      "insufficient": "Insufficient comparison data"}
            status = benchmark.get("status")
            flow.append(para(labels.get(status, labels["insufficient"]), 10, bold))
            if benchmark.get("period_start") and benchmark.get("period_end"):
                flow.append(para(when(benchmark["period_start"]) + " to " + when(benchmark["period_end"])))
            if status in {"high", "within_range"}:
                flow.append(para(f"Your recorded units for the comparison period: {number(benchmark.get('own_units'))}."))
            if benchmark.get("method"):
                flow.append(para(benchmark["method"], 8.8, colour=MUTED))
        heading("Return activity")
        ret = report["returns"]
        tools_covered = bool(transaction_periods(coverage))
        if tools_covered or ret.get("issues") or ret.get("returned"):
            flow.append(para(f"Recorded issues: {observed(ret.get('issues'), tools_covered)}. "
                             f"Recorded returns: {observed(ret.get('returned'), tools_covered)}. "
                             "The transaction dates in Record coverage define which issues and returns are included."))
        else:
            flow.append(para("Issue and return totals are unavailable because the transaction period is missing."))
        score, eligible = ret.get("score"), ret.get("eligible", 0)
        if eligible:
            flow.append(para(f"{number(ret['same_day'])} of {number(eligible)} eligible completed hires returned on the same day."))
        if score is None or eligible < 5:
            reason = (f"{number(eligible)} of 5 eligible completed hires recorded." if tools_covered or eligible else
                      "Completed hire records are unavailable for assessment.")
            flow.append(para("Same-day return measure unavailable. " + reason + " A score requires at least five."))
        else:
            flow.extend([Spacer(1, 5), ReturnStars(score, bold, accent, wash), Spacer(1, 5)])
        flow.append(para("Same day means the same Queensland calendar date. During a night shift, a tool issued before midnight "
                         "and returned after midnight counts as a next-day return, even if the crew is still on shift.", 8.8, colour=MUTED))
        if ret.get("method"):
            flow.append(para(ret["method"], 8.8, colour=MUTED))
        if not ret.get("due_dates_available"):
            flow.append(para("Due dates were unavailable in the source records.", 8.8, colour=MUTED))
        elif ret.get("due_assessed"):
            flow.append(para(f"{number(ret.get('returned_by_due'))} of {number(ret['due_assessed'])} assessed returns "
                             "were made by the recorded due date."))
        else:
            flow.append(para("No completed returns had a recorded due date available for assessment.", 8.8, colour=MUTED))
        if report.get("rental_history"):
            heading("Rental transactions")
            table(("Equipment", "Asset ID", "Issued (AEST)", "Returned (AEST)"),
                  [(r["name"], r["item"], when(r["issued_at"]) if r.get("issued_at") else "Issue date not recorded",
                    when(r["returned_at"]) if r.get("returned_at") else "Return not recorded")
                   for r in report["rental_history"]], (.29, .27, .22, .22))
        if not previous:
            heading("Previous shutdown activity")
        if not previous and report.get("history"):
            rows = []
            for earlier in report["history"]:
                source = earlier.get("coverage") or {}
                tools = bool(transaction_periods(source))
                sales = bool(source.get("sales_asat"))
                rows.append((earlier["schedule"], observed(earlier.get("issues"), tools),
                             observed(earlier.get("returned"), tools), observed(earlier.get("same_day"), tools),
                             observed(earlier.get("consumable_units"), sales),
                             observed(earlier.get("activity_days"), tools or sales)))
            table(("Shutdown", "Issued", "Returned", "Same day", "Drawn units", "Active days"),
                  rows, (.35, .12, .14, .12, .14, .13))
        elif not previous:
            flow.append(para("Previous shutdown records are unavailable for this person."))
    elif not previous and now:
        heading("Previous shutdown activity")
        flow.append(para("Previous shutdown records are unavailable for this company."))
    if previous:
        heading("Previous shutdown activity")
        for period in previous:
            chapter(period)
            chapter_detail(period, include_daily=True)
            record_coverage(period["coverage"])
    doc.build(flow, onFirstPage=frame, onLaterPages=frame)
    return out.getvalue()
