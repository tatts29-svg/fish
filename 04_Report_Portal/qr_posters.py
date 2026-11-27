"""Generate the MMG tool store's two printable on-hire QR posters."""

from functools import lru_cache
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit
import os

import qrcode
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont, TTFError
from reportlab.pdfgen import canvas


TITLE = {
    "company": "Company on-hire report",
    "personal": "Personal on-hire report",
}
COPY = {
    "company": (
        "See the equipment on hire to your company.",
        "Select your company.",
        "Print, save, share or email the report.",
    ),
    "personal": (
        "See your shutdown through your gear and tool-store visits.",
        "Enter your borrower barcode.",
        "Print, save, share or email your report.",
    ),
}
AUTHOR = "Andrew Fisher"
CREDIT = "Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved. Not to be copied or reproduced without permission."
SLATE = "#2A313C"
INK = "#1B2028"
MUTED = "#505D6D"
ORANGE = "#F26222"
DARK_ORANGE = "#A73E0B"
MMG_RED = "#B61D2B"
WHITE = "#FFFFFF"
WIDTH, HEIGHT = A4
MARGIN = 36


@lru_cache(maxsize=4)
def _register_inter(fonts):
    # Use the same licensed font files the job supplies to its report builder.
    try:
        for weight in ("Regular", "Bold"):
            pdfmetrics.registerFont(TTFont("PosterInter-" + weight, str(fonts / ("Inter-" + weight + ".ttf"))))
    except (OSError, TTFError):
        return "Helvetica", "Helvetica-Bold"
    return "PosterInter-Regular", "PosterInter-Bold"


def _qr(pdf, url, left, bottom, size):
    code = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4)
    code.add_data(url, optimize=0)
    code.make(fit=True)
    matrix = code.get_matrix()
    pitch = size / len(matrix)
    # A single compound path keeps every module sharp at full A4 size.
    pdf.setFillColor(HexColor(WHITE))
    pdf.rect(left, bottom, size, size, fill=1, stroke=0)
    path = pdf.beginPath()
    for row_number, row in enumerate(matrix):
        first = None
        for col, dark in enumerate([*row, False]):
            if dark and first is None:
                first = col
            elif not dark and first is not None:
                path.rect(left + first*pitch, bottom + (len(matrix)-row_number-1)*pitch, (col-first)*pitch, pitch)
                first = None
    pdf.setFillColor(HexColor("#101318"))
    pdf.drawPath(path, fill=1, stroke=0)


def _text(pdf, x, y, value, font, size, colour, tracking=0):
    line = pdf.beginText(x, y)
    line.setFillColor(HexColor(colour))
    line.setFont(font, size)
    line.setCharSpace(tracking)
    line.textOut(value)
    pdf.drawText(line)


def _roundbox(pdf, x, y, w, h, radius, colour):
    pdf.setFillColor(HexColor(colour))
    pdf.roundRect(x, y, w, h, radius, fill=1, stroke=0)


def _scan_brackets(pdf, x, y, side, colour):
    # The alignment brackets sit wholly outside the QR's white quiet zone.
    pdf.saveState()
    pdf.setStrokeColor(HexColor(colour))
    pdf.setLineWidth(2.2)
    pdf.setLineCap(1)
    for cx, cy, sx, sy in [(x,y,1,1), (x+side,y,-1,1), (x,y+side,1,-1), (x+side,y+side,-1,-1)]:
        path=pdf.beginPath()
        path.moveTo(cx+sx*13, cy)
        path.lineTo(cx,cy)
        path.lineTo(cx,cy+sy*13)
        pdf.drawPath(path)
    pdf.restoreState()


def build_poster(kind: str, scoped_url: str) -> bytes:
    """Return a one-page A4 PDF. The scoped URL appears only inside its QR symbol."""
    if kind not in TITLE:
        raise ValueError("Unknown report poster")
    parsed = urlsplit(scoped_url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("A full scoped HTTPS address is required")

    job = Path(os.environ.get("DATA_DIR", "/data")) / "job"
    fonts = job / "kit" / "_fonts"
    regular, bold = _register_inter(fonts) if fonts.is_dir() else ("Helvetica", "Helvetica-Bold")
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4, invariant=1, pageCompression=1)
    pdf.setTitle(TITLE[kind] + " | MMG Dugald River tool store")
    pdf.setAuthor(AUTHOR)
    pdf.setSubject(CREDIT)
    pdf.setCreator("Coates | MMG Dugald River tool store")
    pdf.setViewerPreference("PrintScaling", "None")

    # The same slate and orange masthead frames the printed operational reports.
    pdf.setFillColor(HexColor(SLATE))
    pdf.rect(0, HEIGHT-79, WIDTH, 79, fill=1, stroke=0)
    pdf.setFillColor(HexColor(ORANGE))
    pdf.rect(0, HEIGHT-82, WIDTH, 3, fill=1, stroke=0)
    _text(pdf, MARGIN, HEIGHT-50, "COATES", bold, 25, ORANGE)
    pdf.setStrokeColor(HexColor("#687381"))
    pdf.setLineWidth(.8)
    pdf.line(150, HEIGHT-57, 150, HEIGHT-23)
    logo = job / "logo.png"
    try:
        reader = ImageReader(str(logo))
        w, h = reader.getSize()
        scale = min(50/w, 42/h)
        _roundbox(pdf, 165, HEIGHT-65, 63, 50, 5, WHITE)
        pdf.drawImage(reader, 196.5-w*scale/2, HEIGHT-40-h*scale/2,
                      width=w*scale, height=h*scale, mask="auto")
    except (OSError, ValueError):
        _text(pdf, 166, HEIGHT-48, "MMG", bold, 20, WHITE)
    pdf.setFillColor(HexColor(WHITE))
    pdf.setFont(bold, 12)
    pdf.drawRightString(WIDTH-MARGIN, HEIGHT-35, "DUGALD RIVER")
    pdf.setFillColor(HexColor("#CFD6DF"))
    pdf.setFont(regular, 10.5)
    pdf.drawRightString(WIDTH-MARGIN, HEIGHT-52, "Shutdown tool store")

    intro, first, second = COPY[kind]
    _text(pdf, MARGIN, HEIGHT-140, TITLE[kind], bold, 40, INK, -.7)
    _text(pdf, MARGIN, HEIGHT-167, intro, regular, 16, MUTED)

    # Different tone and corner marks help distinguish two posters displayed together.
    panel_y = 262
    panel_h = 383
    company = kind == "company"
    background = "#FFE4D0" if company else "#FBE4E4"
    band_colour = ORANGE if company else MMG_RED
    band_text = "#121820" if company else WHITE
    accent = DARK_ORANGE if company else MMG_RED
    panel_w = WIDTH - 2*MARGIN
    _roundbox(pdf, MARGIN, panel_y, panel_w, panel_h, 14, background)
    # A solid instruction band puts the colour on a useful surface without flooding the page.
    _roundbox(pdf, MARGIN, panel_y, panel_w, 47, 14, band_colour)
    pdf.setFillColor(HexColor(band_colour))
    pdf.rect(MARGIN, panel_y+26, panel_w, 21, fill=1, stroke=0)
    qr_size = 305
    qr_x = (WIDTH-qr_size)/2
    qr_y = panel_y + 56
    _roundbox(pdf, qr_x-3, qr_y-3, qr_size+6, qr_size+6, 4, WHITE)
    _scan_brackets(pdf,qr_x-6,qr_y-6,qr_size+12,accent)
    _qr(pdf, scoped_url, qr_x, qr_y, qr_size)
    pdf.setFillColor(HexColor(band_text))
    pdf.setFont(bold,16)
    pdf.drawCentredString(WIDTH/2, panel_y+17, "Scan with your phone camera")

    for n, message, y in [(1,first,219), (2,second,165)]:
        _roundbox(pdf, MARGIN, y-7, 28, 28, 7, band_colour)
        pdf.setFillColor(HexColor(band_text))
        pdf.setFont(bold,14)
        pdf.drawCentredString(MARGIN+14,y+2,str(n))
        _text(pdf, MARGIN+40, y, message, bold if n==1 else regular, 17, INK)
        if n == 1 and not company:
            _text(pdf, MARGIN+40, y-18, "Only your own report opens.", regular, 11.5, MUTED)

    pdf.setStrokeColor(HexColor("#D9DFE5"))
    pdf.setLineWidth(.8)
    pdf.line(MARGIN, 142, WIDTH-MARGIN, 142)
    _text(pdf, MARGIN, 120, "Need help? Ask the tool store controller.", bold, 11, INK)
    _text(pdf, MARGIN, 102, "The report shows the SiteIQ pull time.", regular, 10, MUTED)

    pdf.setFillColor(HexColor("#F2F4F7"))
    pdf.rect(0,0,WIDTH,72,fill=1,stroke=0)
    _text(pdf, MARGIN, 48, "Author: Andrew Fisher | POWERED BY SITEIQ", bold, 8.5, SLATE)
    _text(pdf, MARGIN, 30, "Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved.", regular, 7.7, MUTED)
    _text(pdf, MARGIN, 18, "Not to be copied or reproduced without permission.", regular, 7.7, MUTED)
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
