"""Printable A4 reports from a single company or worker's scoped QR projection."""
from datetime import date, datetime, timedelta, timezone
from io import BytesIO
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
from reportlab.platypus import CondPageBreak, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

SLATE = HexColor("#2A313C")
INK = HexColor("#232B35")
MUTED = HexColor("#52606D")
RULE = HexColor("#DCE1E6")
PALE = HexColor("#F3F5F7")
ORANGE = HexColor("#F26222")
ORANGE_INK = HexColor("#A23F0F")
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


def render_pdf(report, *, job_dir=None):
    """Render only the allowlisted fields of the given projection. No register lookups."""
    kind = report.get("kind")
    name = text(report.get("name"))
    if kind not in {"company", "person"} or not name:
        raise ValueError("A selected company or person is required.")
    company_report = kind == "company"
    issue_time = when(report.get("asat"))
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
        canvas.setFillColor(ORANGE)
        canvas.rect(0, HEIGHT - 79, WIDTH, 3, fill=1, stroke=0)
        canvas.setFont(bold, 17)
        canvas.drawString(MARGIN, HEIGHT - 35, "COATES")
        canvas.setStrokeColor(HexColor("#79838C"))
        canvas.line(MARGIN + 86, HEIGHT - 39, MARGIN + 86, HEIGHT - 17)
        if logo:
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

    flow = [para(title.upper(), 9, bold, ORANGE_INK, spaceAfter=4),
            para(name, 23, bold, spaceAfter=3)]
    company = text(report.get("company"))
    if not company_report and company:
        flow.append(para(company, 11, colour=MUTED, spaceAfter=3))
    flow.extend([para("SiteIQ rental stock pull  ·  " + issue_time, 9, colour=MUTED), Spacer(1, 13)])

    def heading(label):
        flow.extend([CondPageBreak(95), para(label, 13, bold, spaceBefore=14, spaceAfter=5)])

    def table(headers, rows, weights):
        widths = [w * CONTENT for w in weights]
        data = [[para(h.upper(), 7.8, bold, white) for h in headers]]
        data.extend([para(cell, 8.8) for cell in row] for row in rows)
        grid = LongTable(data, colWidths=widths, repeatRows=1, splitInRow=1, hAlign="LEFT")
        grid.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), SLATE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, PALE]),
            ("LINEBELOW", (0, 0), (-1, 0), 1.6, ORANGE),
            ("LINEBELOW", (0, 1), (-1, -1), .35, RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ]))
        flow.append(grid)

    groups = report["hires"]
    assets = []
    for group in groups:
        inventory = group["items"]
        for i, item in enumerate(inventory):
            issued = when(item.get("date")) if item.get("date") else ""
            if item.get("time"):
                issued = (issued + "  " + text(item["time"])).strip()
            assets.append((group["name"], number(group["count"]) if i == 0 else "",
                           text(item.get("item")) or "Not supplied", issued or "Not supplied"))
    stats = [(report["hire_count"], "Assets on hire"), (len(groups), "Equipment types")]
    if not company_report:
        stats.append((report["consumable_summary"].get("units"), "Consumable units drawn"))
    strip = Table([[[para(number(n), 21, bold), para(label, 8, normal, MUTED)] for n, label in stats]],
                  colWidths=[CONTENT / len(stats)] * len(stats), hAlign="LEFT")
    strip.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PALE),
                               ("VALIGN", (0, 0), (-1, -1), "TOP"),
                               ("LINEBEFORE", (0, 0), (0, 0), 3, ORANGE),
                               ("LEFTPADDING", (0, 0), (-1, -1), 10),
                               ("TOPPADDING", (0, 0), (-1, -1), 8),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    flow.append(strip)
    heading("Equipment currently on hire")
    if assets:
        table(("Equipment", "Type qty", "Asset ID", "Date hired (AEST)"), assets, (.43, .11, .21, .25))
    else:
        flow.append(para("No equipment is currently on hire in this rental stock pull."))

    if not company_report:
        coverage = report.get("coverage", {})
        heading("Record coverage")
        periods = coverage.get("transaction_periods")
        if periods is None:
            start, end = coverage.get("period_start"), coverage.get("period_end")
            periods = [{"start": start, "end": end}] if start and end else []
        for period in periods:
            flow.append(para("Tool transactions  ·  " + when(period["start"]) + " to " + when(period["end"])))
        if not periods:
            flow.append(para("Transaction periods were unavailable."))
        for key, label in [("transactions_asat", "Transactions pull"), ("sales_asat", "Sales stock pull")]:
            if coverage.get(key):
                flow.append(para(label + "  ·  " + when(coverage[key]), 8.8, colour=MUTED))
        heading("Daily activity")
        if report["activity"]:
            table(("Date", "Tools issued", "Tools returned", "Units drawn", "Units returned"),
                  [(when(a["date"]), number(a["issued"]), number(a["returned"]),
                    number(a["consumable_units"]), number(a.get("consumable_returns")))
                   for a in report["activity"]], (.24, .19, .19, .19, .19))
        else:
            flow.append(para("No daily activity recorded in the supplied period."))
        heading("Consumables drawn")
        summary = report["consumable_summary"]
        flow.append(para(f"{number(summary['units'])} units drawn · {number(summary.get('returned_units'))} units returned."))
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
        flow.append(para(f"{number(ret['issues'])} issued · {number(ret['returned'])} returned. "
                         f"{number(ret['same_day'])} of {number(ret['eligible'])} eligible completed hires returned on the same day."))
        if ret.get("score") is None:
            flow.append(para("Same-day return measure unavailable. At least five eligible completed hires are required."))
        else:
            flow.append(para(f"Same-day return measure  ·  {number(ret['score'])} / 5"))
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
                  [(r["name"], r["item"], when(r.get("issued_at")), when(r.get("returned_at")))
                   for r in report["rental_history"]], (.35, .21, .22, .22))
        heading("Previous shutdown activity")
        if report.get("history"):
            table(("Shutdown", "Issued", "Returned", "Same day", "Drawn units", "Active days"),
                  [(r["schedule"], number(r["issues"]), number(r["returned"]), number(r["same_day"]),
                    number(r["consumable_units"]), number(r["activity_days"]))
                   for r in report["history"]], (.35, .12, .14, .12, .14, .13))
        else:
            flow.append(para("No previous shutdown records are linked to this person."))
    doc.build(flow, onFirstPage=frame, onLaterPages=frame)
    return out.getvalue()
