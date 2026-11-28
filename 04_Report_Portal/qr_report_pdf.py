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
ISSUED = HexColor("#B94F1D")
RETURNED = HexColor("#34754E")
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


def when(value, precision=None):
    raw = text(value)
    if not raw:
        return "Not supplied"
    try:
        if len(raw) == 10:
            return date.fromisoformat(raw).strftime("%d %b %Y").lstrip("0")
        stamp = datetime.fromisoformat(raw)
        if stamp.tzinfo is not None:
            stamp = stamp.astimezone(timezone(timedelta(hours=10)))
        if precision == "date":
            return stamp.strftime("%d %b %Y").lstrip("0")
        pattern = "%d %b %Y %H:%M:%S" if precision == "second" else "%d %b %Y %H:%M"
        return stamp.strftime(pattern).lstrip("0") + " AEST"
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
    def __init__(self, rows, normal, bold, wash):
        super().__init__()
        self.rows, self.normal, self.bold = rows, normal, bold
        self.wash = wash
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
            for x, k, tone in zip(lefts, ("issued", "returned"), (ISSUED, RETURNED)):
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
    def __init__(self, score, label, caption, bold):
        super().__init__()
        self.score, self.label, self.caption, self.bold = score, label, caption, bold
        self.width, self.height = 145, 46

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFont(self.bold, 7.2)
        c.setFillColor(MUTED)
        c.drawString(2, 37, self.label)
        c.setFont(self.bold, 9)
        c.setFillColor(INK)
        c.drawString(2, 3, self.caption)
        radius = 7.3
        for i in range(5):
            cx, cy = 9 + i * 19, 23
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
            fraction = min(1, max(0, (self.score or 0) - i))
            if fraction:
                c.saveState()
                if fraction < 1:
                    clip = c.beginPath()
                    clip.rect(cx - radius, cy - radius, 2 * radius * fraction, 2 * radius)
                    c.clipPath(clip, stroke=0, fill=0)
                c.setFillColor(ORANGE)
                c.setStrokeColor(ORANGE)
                c.drawPath(star, fill=1, stroke=1)
                c.restoreState()
        c.restoreState()


def render_pdf(report, *, job_dir=None, returns_only=False):
    """Render only the allowlisted fields of the given projection. No register lookups."""
    kind = report.get("kind")
    name = text(report.get("name"))
    if kind not in {"company", "person"} or not name:
        raise ValueError("A selected company or person is required.")
    company_report = kind == "company"
    if returns_only and not company_report:
        raise ValueError("A company is required for a crew return list.")
    wash = PALE
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
    if returns_only:
        title = "End-of-shift return list"
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

    flow = [para(title.upper(), 9, bold, ORANGE_INK, spaceAfter=4)]
    tools_covered = bool(transaction_periods(coverage))
    ret = report.get("returns") or {}
    rating = report.get("return_rating") if company_report else ret
    if rating is None or returns_only:
        flow.append(para(name, 23, bold, spaceAfter=3))
    else:
        eligible = rating.get("eligible") or 0
        score = rating.get("score")
        qualified_score = score if tools_covered and eligible >= 5 and score is not None and 1 <= score <= 5 else None
        if qualified_score is not None:
            caption = f"{number(score)} / 5"
            if rating.get("same_day") is not None:
                caption += f" · {number(rating['same_day'])} of {number(eligible)} same day"
        elif tools_covered:
            caption = f"Pending · {number(eligible)} of 5 eligible"
        else:
            caption = "Awaiting dated records"
        label = "CREW SAME-DAY RETURNS" if company_report else (
            "SAME-DAY RETURN SCORE" if qualified_score is not None else "SAME-DAY RETURNS")
        identity = [para(name, 23, bold)]
        if not company_report and report.get("company"):
            identity.append(para(report["company"], 10, colour=MUTED))
        banner = Table([[identity, ReturnStars(qualified_score, label, caption, bold)]],
                       colWidths=[CONTENT - 155, 155], splitInRow=1, hAlign="LEFT")
        banner.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                    ("LEFTPADDING", (0, 0), (0, 0), 0),
                                    ("LINEBEFORE", (1, 0), (1, 0), .6, RULE)]))
        flow.extend([banner, Spacer(1, 3)])
    flow.extend([para("Latest SiteIQ rental stock snapshot  ·  " + issue_time, 9, colour=MUTED), Spacer(1, 10)])

    def heading(label):
        flow.extend([CondPageBreak(82), para(label, 13, bold, spaceBefore=14, spaceAfter=5)])

    def table(headers, rows, weights, *, group_label=None):
        widths = [w * CONTENT for w in weights]
        data = [[para(h.upper(), 7.8, bold, white) for h in headers]]
        data.extend([para(cell, 8.8) for cell in row] for row in rows)
        if group_label:
            data.insert(0, [para(group_label, 11, bold, white)] + [""] * (len(headers) - 1))
        header = 1 if group_label else 0
        grid = LongTable(data, colWidths=widths, repeatRows=header + 1, splitInRow=1, hAlign="LEFT")
        grid.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, header), SLATE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, header + 1), (-1, -1), [white, PALE]),
            ("LINEBELOW", (0, header), (-1, header), 1.6, ORANGE),
            ("LINEBELOW", (0, 1), (-1, -1), .35, RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ]))
        if group_label:
            grid.setStyle(TableStyle([("SPAN", (0, 0), (-1, 0))]))
        flow.append(grid)

    if returns_only:
        groups = report["return_groups"]
        total = sum(len(group["items"]) for group in groups)
        if total:
            heading(f"{number(total)} " + ("asset" if total == 1 else "assets") + " still to return")
            flow.append(para("Return unneeded equipment at shift end. Return all gear before leaving site.",
                             9, spaceAfter=8))
            for group in groups:
                holder = group["holder"] or "Individual holder unconfirmed"
                rows = []
                for asset in group["items"]:
                    day = asset.get("date")
                    clock = asset.get("time")
                    issued = (when(day) + " · " + (clock or "Time not recorded")) if day else "Issue date unavailable"
                    rows.append((asset["name"], asset["item"] or "Asset ID unavailable", issued))
                flow.append(Spacer(1, 8))
                label = holder + f"  ·  {len(rows)} " + ("asset" if len(rows) == 1 else "assets")
                table(("Equipment", "Asset number", "Issued (AEST)"), rows, (.46, .25, .29), group_label=label)
        else:
            heading("Return balance")
            flow.append(para("No equipment is listed against this company at the dated stock snapshot."
                             if rental_asat else "The current balance needs a dated rental stock export."))
        flow.append(para("For a correction, give the asset number and snapshot time to the tool store.",
                         colour=MUTED, spaceBefore=10))
        doc.build(flow, onFirstPage=frame, onLaterPages=frame)
        return out.getvalue()

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

    def store_activity(activity):
        heading("Crew store activity" if company_report else "Your store activity")
        if not activity.get("has_coverage"):
            flow.append(para("Store activity records are unavailable for this shutdown."))
            return
        days = activity.get("active_days") or 0
        interactions = activity.get("interactions") or 0
        dated_only = activity.get("date_only_events") or 0
        undated = activity.get("undated_events") or 0
        unattributed = activity.get("unattributed_timed_events") or 0
        if days:
            dates = "recorded activity date" if days == 1 else "recorded activity dates"
            if interactions:
                counted = "timed interaction" if interactions == 1 else "timed interactions"
                flow.append(para(f"{number(interactions)} {counted} across {number(days)} {dates}. "
                                 f"Average {number(interactions / days)} per recorded activity date.",
                                 10, bold, spaceAfter=4))
            else:
                flow.append(para(f"Activity was recorded on {number(days)} " +
                                 ("date." if days == 1 else "dates."), 10, bold, spaceAfter=4))
            table(("First recorded activity", "Latest recorded activity"),
                  [(when(activity.get("first_at")), when(activity.get("last_at")))], (.5, .5))
            for endpoint, label in (("first", "Earliest"), ("last", "Latest")):
                known = activity.get(endpoint + "_timed_at")
                if known and len(activity.get(endpoint + "_at") or "") == 10:
                    flow.append(para(label + " activity with a recorded time · " + when(known), 8.6, colour=MUTED))
            hours = activity.get("busiest_hours") or []
            periods = {row["hour"]: row["interactions"] for row in activity.get("hourly", [])}
            peak = periods.get(hours[0]) if hours else None
            if peak:
                slots = ", ".join(f"{hour:02}:00–{(hour + 1) % 24:02}:00" for hour in hours)
                if len(hours) == 24:
                    slots = "All 24 hourly windows"
                per_slot = " timed interaction" if peak == 1 else " timed interactions"
                title = "Busiest hourly window" if len(hours) == 1 else "Tied busiest hourly windows"
                flow.append(para(f"{title} (AEST) · {slots}", 9.2, bold, spaceBefore=4))
                flow.append(para(number(peak) + per_slot +
                                 (" in each window" if len(hours) > 1 else " in this window") +
                                 " across the recorded dates.", 8.8, colour=MUTED))
            else:
                flow.append(para("There are no attributed clock times for an hourly comparison.", 8.8, colour=MUTED))
            if interactions:
                flow.append(para("Each timed interaction counts one hirer with recorded activity in one Queensland "
                                 "calendar minute. Multiple items in that minute count once. These figures describe bookings to the hirer. "
                                 "Attendance is recorded separately.", 8.7, colour=MUTED))
        else:
            flow.append(para("No dated store activity is recorded in the available sources."))
        if dated_only:
            flow.append(para(f"Date-only activity · {number(dated_only)} source " +
                             ("entry." if dated_only == 1 else "entries.") +
                             " These entries contribute to activity dates only.", 8.7, colour=MUTED))
        if undated:
            flow.append(para(f"Undated activity · {number(undated)} source " +
                             ("entry omitted" if undated == 1 else "entries omitted") +
                             " from dates, frequency and hourly totals.", 8.7, colour=MUTED))
        if unattributed:
            flow.append(para(f"Timed entries without a verified hirer · {number(unattributed)}. "
                             "The interaction totals include only identified hirers.", 8.7, colour=MUTED))

    def chapter(period):
        # SiteIQ retains this misspelling as its immutable import key.
        schedule = ("MMG Dugald River · November–December 2026"
                    if period["schedule"] == "MMG Shutdown Novermber26-December26" else period["schedule"])
        heading("This shutdown" if period["current"] else schedule)
        if period["current"]:
            flow.append(para(schedule, 9.4, bold, ORANGE_INK, spaceAfter=3))
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
            flow.append(DailyMovements(days[-7:], normal, bold, wash))

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
    show_holders = company_report and any("holder" in item for group in groups for item in group["items"])
    for group in groups:
        inventory = group["items"]
        for i, item in enumerate(inventory):
            issued = when(item["date"]) if item.get("date") else "Date not recorded"
            issued += " · " + (text(item.get("time")) or "Time not recorded")
            row = [group["name"], number(group["count"]) if i == 0 else "",
                   text(item.get("item")) or "Asset ID not recorded"]
            if show_holders:
                row.append(text(item.get("holder")) or "Unconfirmed")
            assets.append([*row, issued])
    handover = report.get("handover") or {}
    stats = [(observed(report["hire_count"], rental_asat), "Assets on hire")]
    if company_report:
        stats.append((observed(len(groups), rental_asat), "Equipment types"))
        if "current_holders" in handover:
            stats.append((observed(handover["current_holders"], rental_asat), "Current holders"))
    else:
        stats.extend([(observed(ret.get("issues"), tools_covered), "Tools issued"),
                      (observed(ret.get("returned"), tools_covered), "Tools returned"),
                      (observed(report["consumable_summary"].get("units"), coverage.get("sales_asat")),
                       "Consumable units issued")])
    strip = Table([[[para(value, 14 if value == "Unavailable" else 21, bold), para(label, 8, normal, MUTED)] for value, label in stats]],
                  colWidths=[CONTENT / len(stats)] * len(stats), hAlign="LEFT")
    strip.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), wash),
                               ("VALIGN", (0, 0), (-1, -1), "TOP"),
                               ("LINEBEFORE", (0, 0), (0, 0), 3, ORANGE),
                               ("LEFTPADDING", (0, 0), (-1, -1), 10),
                               ("TOPPADDING", (0, 0), (-1, -1), 8),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    flow.append(strip)
    if not company_report and tools_covered and coverage.get("transactions_asat"):
        last_period = max(period["end"] for period in transaction_periods(coverage))
        cutoff = min(last_period, coverage["transactions_asat"])
        flow.append(para("Tool issue and return totals use transaction records through " + when(cutoff) + ".", 8, normal, MUTED))
    if company_report:
        unknown = handover.get("unassigned_assets")
        if unknown:
            flow.append(para(f"{number(unknown)} on-hire " + ("asset has" if unknown == 1 else "assets have") +
                             " no verified holder.", 8.5, colour=MUTED, spaceBefore=4))
        shift = handover.get("shift")
        if shift and shift.get("start") and shift.get("end"):
            heading("Last fully covered shift")
            flow.append(para(f"{text(shift.get('name'))} shift · {when(shift['start'])} to {when(shift['end'])}",
                             9.2, bold, spaceAfter=3))
            flow.append(para("Tools issued: " + observed(shift.get("issued"), True) +
                             "    ·    Tools returned: " + observed(shift.get("returned"), True)))
            hourly = {hour["start"]: hour for hour in shift.get("hourly", [])}
            for label, key, events in [("Peak issue hour", "peak_issue_hours", "issued"),
                                       ("Peak return hour", "peak_return_hours", "returned")]:
                peaks = shift.get(key) or []
                if peaks and hourly.get(peaks[0], {}).get(events):
                    tied = f" · {len(peaks)} hours tied" if len(peaks) > 1 else ""
                    flow.append(para(f"{label} began {when(peaks[0])} · {number(hourly[peaks[0]][events])} "
                                     + ("issues" if events == "issued" else "returns") + tied, 8.5, colour=MUTED))
        elif "shift" in handover:
            flow.append(para("Complete shift totals are unavailable for the supplied transaction period.",
                             8.5, colour=MUTED, spaceBefore=4))
        oldest = handover.get("oldest")
        if oldest and oldest.get("issued_at"):
            heading("Longest-held equipment")
            flow.append(para(text(oldest.get("name")) + "  ·  " + (text(oldest.get("item")) or "Asset ID not recorded"),
                             9.4, bold))
            if oldest.get("holder"):
                flow.append(para("Current holder · " + text(oldest["holder"]), 9))
            detail = "Issued " + when(oldest["issued_at"])
            minutes = oldest.get("elapsed_minutes")
            if minutes is not None and minutes >= 0:
                days, remainder = divmod(int(minutes), 1440)
                hours, mins = divmod(remainder, 60)
                duration = f"{days}d {hours}h" if days else f"{hours}h {mins}m"
                detail += "  ·  " + duration + " held at the snapshot"
            tied = oldest.get("tied_count") or 0
            if tied > 1:
                detail += f"  ·  {number(tied)} assets share this issue time"
            flow.append(para(detail, 8.8, colour=MUTED))
    if handover.get("latest_return") and (company_report or not assets):
        receipt = handover["latest_return"]
        count = receipt.get("count")
        if count and receipt.get("returned_at"):
            heading("Latest crew return" if company_report else "Latest recorded return")
            precision = receipt.get("precision")
            stamp = when(receipt["returned_at"], precision)
            if precision == "date":
                description = ("hire record closed" if count == 1 else "hire records closed") + " on "
            else:
                description = ("hire record closed" if count == 1 else "hire records closed") + " at "
            flow.append(para(f"{number(count)} {description}{stamp}", 10, bold, spaceAfter=3))
            if not company_report:
                for item in (receipt.get("items") or [])[:3]:
                    flow.append(para("  ·  ".join(filter(None, (text(item.get("name")), text(item.get("item"))))),
                                     8.8, colour=MUTED))
                if count > 3:
                    flow.append(para(f"{number(count - 3)} more in Rental transactions.", 8.6, colour=MUTED))
    heading("Equipment currently on hire" if company_report else "Still to return")
    if company_report:
        flow.append(para("Company holding these assets: " + name, 9.4, bold, spaceAfter=5))
    if assets:
        if show_holders:
            table(("Equipment", "Qty", "Asset ID", "Current holder", "Date hired (AEST)"),
                  assets, (.285, .08, .205, .215, .215))
        else:
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
    if report.get("store_activity") is not None:
        store_activity(report["store_activity"])
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
                flow.append(para(caption, 10, bold, ORANGE_INK, spaceBefore=4))
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
