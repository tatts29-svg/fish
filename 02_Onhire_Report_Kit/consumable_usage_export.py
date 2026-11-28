"""Client copies of the per-product MMG consumable usage and handback register."""

from datetime import datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.properties import PageSetupProperties
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import KeepTogether, LongTable, Paragraph, SimpleDocTemplate, TableStyle


TITLE = "Consumables usage and MMG handback"
BALANCE = "Available to hand back to MMG"
CURRENT_NOTE = (
    "All available consumable stock belongs to MMG. The handback column shows stock available "
    "at the SiteIQ sales stock snapshot. Physical delivery to MMG requires separate confirmation."
)
MOVEMENTS_NOTE = (
    "Gross issued counts recorded issues. Credited counts recorded stock issued back. "
    "Net usage is gross issued less credited. Available stock already reflects the stock balance."
)
HISTORY_NOTE = (
    "Average issued is the mean gross quantity per comparable, complete prior shutdown for that "
    "product and recorded unit. The number of qualifying shutdowns is shown beside each average."
)
DARK, ORANGE, INK, DIM = "202D38", "F26222", "192732", "425563"


def numeric(value):
    if value is None:
        return "—"
    return format(value, ",")


def snapshot(value):
    if not value:
        return "Not recorded"
    try:
        stamp = datetime.fromisoformat(value)
        if stamp.tzinfo:
            stamp = stamp.astimezone(ZoneInfo("Australia/Brisbane"))
        return stamp.strftime("%d %b %Y %H:%M AEST")
    except (TypeError, ValueError):
        return str(value)


def issue_status(data):
    return "Final" if data.get("status") == "final" else "Provisional"


def recorded_unit(row):
    return row.get("unit") or "Not recorded"


def history_basis(rows):
    if any(r.get("average_shuts") for r in rows):
        return HISTORY_NOTE
    return "No verified complete prior shutdown qualifies for a product average in this snapshot."


def period_note(period):
    start, end = period.get("start"), period.get("end")
    if start and end:
        return f"{start} to {end}"
    observed = [x for x in [period.get("first_observed"), period.get("last_observed")] if x]
    if observed:
        return "Observed " + " to ".join(dict.fromkeys(observed))
    return "Dates not recorded"


def coverage_sources(periods):
    for period in periods:
        yield period
        for extra in period.get("additional_sources", []):
            yield {**extra, "label": period["label"], "source": extra["source"] + " (additional evidence)"}


def write_excel(path, data):
    wb = Workbook()
    wb.properties.title = TITLE
    ws = wb.active
    ws.title = "Usage and handback"
    periods = data.get("history", [])
    rows = data.get("rows", [])
    by_period = {p["id"]: p for p in periods}

    def style_cell(cell, value, header=False):
        cell.value = value
        if isinstance(value, str):
            cell.data_type = "s"  # Report labels and stock codes are always literal text.
        cell.font = Font(name="Calibri", size=11, color="FFFFFF" if header else INK, bold=header)
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        if header:
            cell.fill = PatternFill("solid", fgColor=DARK)

    def banner(sheet, columns, heading, subtitle):
        sheet.sheet_view.showGridLines = False
        for rowno, text, colour, size in [(1, heading, DARK, 17), (2, subtitle, "EAF0F3", 11)]:
            sheet.merge_cells(start_row=rowno, start_column=1, end_row=rowno, end_column=columns)
            c = sheet.cell(rowno, 1)
            style_cell(c, text)
            c.fill = PatternFill("solid", fgColor=colour)
            c.font = Font(name="Calibri", size=size, color="FFFFFF" if rowno == 1 else INK, bold=True)
            sheet.row_dimensions[rowno].height = 34 if rowno == 1 else 29
        sheet.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
        sheet.page_setup.orientation = "landscape"
        sheet.page_setup.paperSize = sheet.PAPERSIZE_A4
        sheet.page_setup.fitToWidth, sheet.page_setup.fitToHeight = 1, 0
        sheet.oddFooter.left.text = "MyGear HQ  |  Coates · MMG Dugald River"
        sheet.oddFooter.right.text = "Page &P of &N"

    def line(sheet, rowno, text, columns):
        sheet.merge_cells(start_row=rowno, start_column=1, end_row=rowno, end_column=columns)
        style_cell(sheet.cell(rowno, 1), text)
        sheet.row_dimensions[rowno].height = 29

    def grid(sheet, at, headings, widths, records, decimal_columns=()):
        for j, (name, width) in enumerate(zip(headings, widths), 1):
            style_cell(sheet.cell(at, j), name, True)
            sheet.column_dimensions[get_column_letter(j)].width = width
        sheet.row_dimensions[at].height = 34
        for i, rec in enumerate(records, at + 1):
            for j, v in enumerate(rec, 1):
                c = sheet.cell(i, j)
                style_cell(c, v)
                if (i - at) % 2 == 0:
                    c.fill = PatternFill("solid", fgColor="EFF3F5")
                if j in decimal_columns:
                    c.number_format = "#,##0.00;-#,##0.00;0.00"
            sheet.row_dimensions[i].height = max(
                28,
                14 * (1 + max(len(str(v or "")) // max(1, int(w * 0.85)) for v, w in zip(rec, widths))),
            )
        last = max(sheet.max_row, at)
        sheet.auto_filter.ref = f"A{at}:{get_column_letter(len(headings))}{last}"
        sheet.print_title_rows = f"{at}:{at}"
        sheet.print_area = f"A1:{get_column_letter(len(headings))}{last}"

    label = f"{data.get('project') or 'MMG Dugald River'} · {issue_status(data)} · {data.get('source') or 'SiteIQ SALES_STOCK'} · {snapshot(data.get('as_at'))}"
    banner(ws, 9, TITLE, label)
    for at, note in enumerate(
        [
            CURRENT_NOTE,
            MOVEMENTS_NOTE,
            history_basis(rows),
            "Blank numeric cells mean the source value or qualifying history is unavailable. A recorded zero is shown as 0.",
        ],
        3,
    ):
        line(ws, at, note, 9)
    grid(
        ws,
        7,
        [
            "Product",
            "Stock code / SKU",
            "Source unit",
            BALANCE,
            "Gross issued",
            "Credited / issued back",
            "Net usage",
            "Average issued per prior shut",
            "Qualifying prior shuts",
        ],
        [39, 22, 17, 23, 16, 20, 16, 23, 17],
        (
            (
                r["name"],
                r.get("sku") or "",
                recorded_unit(r),
                r.get("available_for_mmg"),
                r.get("issued"),
                r.get("credited"),
                r.get("net"),
                r.get("average_issued"),
                r.get("average_shuts"),
            )
            for r in rows
        ),
        (8,),
    )
    ws.freeze_panes = "D8"
    if not rows:
        line(ws, 8, "No product records available in this snapshot.", 9)
        ws.print_area = "A1:I8"

    hist = wb.create_sheet("Historical issues")
    banner(hist, 7, "Historical issues by product", label)
    line(hist, 3, history_basis(rows) + " Partial periods are excluded from the average.", 7)
    listings = (
        (
            r["name"],
            r.get("sku") or "",
            recorded_unit(r),
            by_period.get(h["id"], {}).get("label", h["id"]),
            by_period.get(h["id"], {}).get("status", "unverified").capitalize(),
            h.get("issued"),
            "Yes" if h.get("qualified") else "No",
        )
        for r in rows
        for h in (r.get("history") or [])
    )
    grid(
        hist,
        4,
        [
            "Product",
            "Stock code / SKU",
            "Source unit",
            "Prior shutdown",
            "Coverage",
            "Gross issued",
            "In average",
        ],
        [39, 22, 18, 33, 18, 16, 15],
        listings,
    )
    hist.freeze_panes = "D5"
    if hist.max_row == 4:
        line(hist, 5, "No product-level historical quantities are available.", 7)
        hist.print_area = "A1:G5"

    cov = wb.create_sheet("Source coverage")
    banner(cov, 5, "Sources and coverage", label)
    line(
        cov,
        3,
        "Coverage describes each source period. Observed dates alone do not establish a complete shutdown.",
        5,
    )
    grid(
        cov,
        4,
        ["Prior shutdown", "Coverage", "Date range", "Observed days", "Source"],
        [34, 19, 42, 16, 50],
        (
            (
                p["label"],
                p.get("status", "unverified").capitalize(),
                period_note(p),
                p.get("days_observed"),
                p.get("source") or "Not recorded",
            )
            for p in coverage_sources(periods)
        ),
    )
    cov.freeze_panes = "A5"
    at = cov.max_row + 1
    if not periods:
        line(cov, at, "No historical shutdown sources available.", 5)
        at += 1
    for note in data.get("warnings", []):
        line(cov, at, str(note), 5)
        at += 1
    cov.print_area = f"A1:E{cov.max_row}"

    observations = [
        (
            row["name"],
            row.get("sku") or "",
            recorded_unit(row),
            by_period.get(period["id"], {}).get("label", period["id"]),
            extra.get("source") or "Not recorded",
            period_note(extra),
            snapshot(extra["as_at"]) if extra.get("as_at") else None,
            extra.get("issued"),
        )
        for row in rows
        for period in row.get("history", [])
        for extra in period.get("observations", [])
    ]
    if observations:
        sheet = wb.create_sheet("Additional observations")
        banner(sheet, 8, "Additional historical observations", label)
        line(
            sheet,
            3,
            "These additional sources overlap the primary history. Their observations are excluded from totals and averages.",
            8,
        )
        grid(
            sheet,
            4,
            [
                "Product",
                "Stock code / SKU",
                "Source unit",
                "Prior shutdown",
                "Additional source",
                "Observation date range",
                "Source snapshot",
                "Gross issued observed",
            ],
            [39, 22, 18, 33, 37, 34, 26, 17],
            observations,
        )
        sheet.freeze_panes = "D5"
    wb.save(path)


def write_pdf(path, data, logo=None):
    width, height = A4
    margin = 30
    usable = width - 2 * margin - 12
    colour = lambda value: colors.HexColor("#" + value)
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        title=TITLE,
        author="Coates · MMG Dugald River",
        leftMargin=margin,
        rightMargin=margin,
        topMargin=62,
        bottomMargin=37,
    )
    client_logo = ImageReader(str(logo)) if logo and Path(logo).is_file() else None
    body = ParagraphStyle(
        "body", fontName="Helvetica", fontSize=9.2, leading=12.2, textColor=colour(INK), spaceAfter=4
    )
    heading = ParagraphStyle(
        "section",
        parent=body,
        fontName="Helvetica-Bold",
        fontSize=13.5,
        leading=17,
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True,
    )
    title = ParagraphStyle("title", parent=heading, fontSize=21, leading=24, spaceBefore=0)
    small = ParagraphStyle("meta", parent=body, fontSize=8.3, leading=10.5, textColor=colour(DIM))
    cell = ParagraphStyle("cell", parent=body, fontSize=8.6, leading=10.8, spaceAfter=0)
    value = ParagraphStyle("value", parent=cell, alignment=TA_RIGHT)
    th = ParagraphStyle(
        "th", parent=cell, fontSize=8.1, leading=9.5, textColor=colors.white, fontName="Helvetica-Bold"
    )

    def p(text, style=body):
        return Paragraph(escape(str(text or "")).replace("\n", "<br/>"), style)

    def frame(canvas, _document):
        canvas.saveState()
        canvas.setFillColor(colour(DARK))
        canvas.rect(0, height - 47, width, 47, fill=1, stroke=0)
        canvas.setFillColor(colour(ORANGE))
        canvas.rect(0, height - 49, width, 2, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 14)
        canvas.drawString(margin, height - 30, "COATES")
        if client_logo:
            canvas.drawImage(
                client_logo,
                margin + 80,
                height - 39,
                37,
                30,
                mask="auto",
                preserveAspectRatio=True,
                anchor="c",
            )
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(width - margin, height - 28, "MyGear HQ  /  MMG Dugald River")
        canvas.setStrokeColor(colour("D4DFE3"))
        canvas.line(margin, 29, width - margin, 29)
        canvas.setFillColor(colour(DIM))
        canvas.setFont("Helvetica", 8)
        canvas.drawString(margin, 16, "Consumables usage and MMG handback")
        canvas.drawRightString(width - margin, 16, f"Page {canvas.getPageNumber()}")
        canvas.restoreState()

    def table(labels, records, widths):
        tbl = LongTable(
            [[p(label, th) for label in labels], *records],
            colWidths=[usable * w for w in widths],
            repeatRows=1,
            splitInRow=1,
            hAlign="LEFT",
        )
        tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colour(DARK)),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colour("EFF3F5")]),
                    ("LINEBELOW", (0, 0), (-1, 0), 1.35, colour(ORANGE)),
                    ("LINEBELOW", (0, 1), (-1, -1), 0.3, colour("D4DFE3")),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        return tbl

    rows = data.get("rows", [])
    periods = data.get("history", [])
    flow = [
        p(TITLE, title),
        p(f"{data.get('project') or 'MMG Dugald River'} · {issue_status(data)}", heading),
        p(
            f"Stock snapshot · {snapshot(data.get('as_at'))} · {data.get('source') or 'SiteIQ SALES_STOCK'}",
            small,
        ),
        p(CURRENT_NOTE),
        p(MOVEMENTS_NOTE),
        p(history_basis(rows)),
    ]
    if issue_status(data) == "Provisional":
        flow.append(
            p(
                "Provisional figures may change with later SiteIQ exports before shutdown close-out.",
                small,
            )
        )
    has_units = any(r.get("unit") for r in rows)
    legend = "A dash means unavailable. Zero is a recorded quantity."
    if rows and not has_units:
        legend += " The sales export does not specify units of measure."
    flow.extend([p("Usage by product", heading), p(legend, small)])
    if rows:
        records = []
        for r in rows:
            label = escape(str(r["name"]))
            if r.get("sku"):
                label += '<br/><font size="7.9" color="#425563">' + escape(str(r["sku"])) + "</font>"
            records.append(
                [
                    Paragraph(label, cell),
                    *([p(recorded_unit(r), cell)] if has_units else []),
                    *[
                        p(numeric(r.get(k)), value)
                        for k in (
                            "available_for_mmg",
                            "issued",
                            "credited",
                            "net",
                            "average_issued",
                            "average_shuts",
                        )
                    ],
                ]
            )
        labels = [
            "Product / stock code",
            *(["Source unit"] if has_units else []),
            BALANCE,
            "Gross issued",
            "Credited / issued back",
            "Net usage",
            "Avg issued / prior shut",
            "Qualifying shuts",
        ]
        widths = (
            [0.295, 0.093, 0.119, 0.095, 0.107, 0.084, 0.113, 0.094]
            if has_units
            else [0.335, 0.153, 0.10, 0.107, 0.084, 0.124, 0.097]
        )
        quantities = table(labels, records, widths)
        handback = labels.index(BALANCE)
        quantities.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (handback, 0), (handback, 0), colour("793A22")),
                    ("BACKGROUND", (handback, 1), (handback, -1), colour("FFF0E6")),
                ]
            )
        )
        flow.append(quantities)
    else:
        flow.append(p("No product records available in this snapshot."))
    coverage = [p("Historical coverage", heading)]
    if periods:
        history_rows = [
            [
                p(h["label"], cell),
                p(h.get("status", "unverified").capitalize(), cell),
                p(period_note(h), cell),
                p(h.get("source") or "Not recorded", cell),
            ]
            for h in coverage_sources(periods)
        ]
        coverage.append(
            table(
                ["Prior shutdown", "Coverage", "Date range", "Source"],
                history_rows,
                [0.25, 0.15, 0.29, 0.31],
            )
        )
    else:
        coverage.append(p("No historical shutdown sources available."))
    if not periods or len(history_rows) <= 10:
        flow.append(KeepTogether(coverage))
    else:
        flow.extend(coverage)
    for note in data.get("warnings", []):
        flow.append(p(note, small))
    doc.build(flow, onFirstPage=frame, onLaterPages=frame)


def write_exports(data, folder, *, logo=None):
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=folder) as tmp:
        root = Path(tmp)
        write_pdf(root / "consumables-usage.pdf", data, logo)
        write_excel(root / "consumables-usage.xlsx", data)
        for suffix in ("pdf", "xlsx"):
            name = "consumables-usage." + suffix
            (root / name).replace(folder / name)
