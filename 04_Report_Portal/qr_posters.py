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

from qr_wordmark import draw_coates


TITLE = {
    "company": "Company on-hire report",
    "personal": "Personal on-hire report",
}
AUTHOR = "Andrew Fisher"
CREDIT = "Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved. Not to be copied or reproduced without permission."
SLATE = "#2A313C"
INK = "#1B2028"
ORANGE = "#F26222"
DARK_ORANGE = "#A73E0B"
WIDTH, HEIGHT = A4


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
    pdf.setFillGray(1)
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
    pdf.setFillGray(0)
    pdf.drawPath(path, fill=1, stroke=0)


def _text(pdf, x, y, value, font, size, colour, tracking=0):
    line = pdf.beginText(x, y)
    line.setFillColor(HexColor(colour))
    line.setFont(font, size)
    line.setCharSpace(tracking)
    line.textOut(value)
    pdf.drawText(line)


def _rule(pdf, x1, x2, y, colour, weight=.6):
    pdf.setStrokeColor(HexColor(colour))
    pdf.setLineWidth(weight)
    pdf.line(x1, y, x2, y)


def _lines(pdf, x, top, lines, font, size, leading, colour):
    for i, value in enumerate(lines):
        _text(pdf, x, HEIGHT-top-i*leading, value, font, size, colour)


def build_poster(kind: str, scoped_url: str) -> bytes:
    """Draw a single A4 field notice. The signed destination is encoded only in its QR."""
    if kind not in TITLE:
        raise ValueError("Unknown report poster")
    parsed = urlsplit(scoped_url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("A full scoped HTTPS address is required")

    company = kind == "company"
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

    left, right = 37, WIDTH-37
    key_colour = "#4C5660"
    line_colour = "#BBC1C5"

    # Keep the entire outer stroke at least 6.7 mm inside each A4 edge.
    # The bands meet the frame without intruding into the QR quiet zone.
    frame = 20
    rail = 1.8
    inside = frame + rail/2
    inside_width = WIDTH - 2*inside
    pdf.setStrokeColor(HexColor(SLATE))
    pdf.setLineWidth(rail)
    pdf.rect(frame, frame, WIDTH-2*frame, HEIGHT-2*frame, stroke=1, fill=0)
    pdf.setFillColor(HexColor(ORANGE))
    pdf.rect(frame-rail/2, HEIGHT-frame-2.7, 112, 2.7+rail/2, stroke=0, fill=1)
    # Project identity is distinct from the worker instructions and the invitation.
    draw_coates(pdf, left, HEIGHT-61, 93)
    pdf.setStrokeColor(HexColor(line_colour))
    pdf.setLineWidth(.6)
    pdf.line(left+107, HEIGHT-35, left+107, HEIGHT-64)
    try:
        logo = ImageReader(str(job / "logo.png"))
        width, height = logo.getSize()
        scale = min(42/width, 35/height)
        pdf.drawImage(logo, left+122, HEIGHT-68, width=width*scale, height=height*scale, mask="auto")
    except (OSError, ValueError):
        _text(pdf, left+122, HEIGHT-59, "MMG", bold, 21, "#B31F2B")
    pdf.setFillColor(HexColor(INK))
    pdf.setFont(bold, 12)
    pdf.drawRightString(right, HEIGHT-47, "Dugald River")
    pdf.setFillColor(HexColor(key_colour))
    pdf.setFont(regular, 10.5)
    pdf.drawRightString(right, HEIGHT-63, "Shutdown tool store")
    pdf.setFillColor(HexColor(SLATE))
    pdf.rect(inside, HEIGHT-194, inside_width, 107, stroke=0, fill=1)
    pdf.setFillColor(HexColor(ORANGE))
    pdf.rect(inside, HEIGHT-197, inside_width, 3, stroke=0, fill=1)

    _text(pdf, left-1, HEIGHT-145, TITLE[kind], bold, 39, "#FFFFFF", -1.35)
    intro = ("View your company’s equipment on hire and its work history at Dugald River."
             if company else "See what is on hire to you, your returns and your tool-store history.")
    _text(pdf, left, HEIGHT-174, intro, regular, 13.5, "#E6EBF2")

    # Read instructions in their natural order on the left. The unframed QR on the
    # right is 107 mm square including its four-module white quiet zone.
    _text(pdf, left, HEIGHT-235, "Access the report", bold, 19, INK, -.5)
    step_x = left+23
    def step(number, top, heading, body):
        _text(pdf, left, HEIGHT-top, str(number)+".", bold, 12, DARK_ORANGE)
        _text(pdf, step_x, HEIGHT-top, heading, bold, 14, INK, -.25)
        _lines(pdf, step_x, top+21, body, regular, 12, 17, key_colour)
    step(1, 276, "Scan the QR code", ("Point your phone camera", "at the code and tap the link."))
    if company:
        step(2, 365, "Choose your company", ("Select its name, then open", "the on-hire report."))
    else:
        step(2, 365, "Open your own report", ("Scan or enter your assigned", "barcode number. Only your", "own report opens."))
    _qr(pdf, scoped_url, right-302, HEIGHT-499, 302)
    _text(pdf, left, HEIGHT-469, "Report options", bold, 11, INK)
    _lines(pdf, left, 486, ("Print, save as a PDF, share or email.",), regular, 10.7, 15, key_colour)

    pdf.setFillColor(HexColor("#F6E9DD"))
    pdf.rect(inside, HEIGHT-556, inside_width, 41, stroke=0, fill=1)
    pdf.setFillColor(HexColor(ORANGE))
    pdf.rect(inside, HEIGHT-556, 3, 41, stroke=0, fill=1)
    _text(pdf, left, HEIGHT-543, "Equipment returns", bold, 19, INK, -.5)
    labels_x = left
    data_x = left+182
    if company:
        handover = [
            ("At shift end", ("Ask your crew to return any unneeded gear", "to the tool store.")),
            ("Before anyone leaves site", ("Check that all gear on their card has been returned.",)),
        ]
    else:
        handover = [
            ("At shift end", ("Return any gear you no longer need to the tool store.",)),
            ("Before you leave site", ("Return all gear on your card.",)),
        ]
    for y, (head, lines) in zip((578, 627), handover):
        _text(pdf, labels_x, HEIGHT-y, head, bold, 12.1, INK)
        _lines(pdf, data_x, y, lines, regular, 12, 16, INK)
    _rule(pdf, left, right, HEIGHT-607, line_colour, .5)
    _rule(pdf, left, right, HEIGHT-646, line_colour, .5)

    _text(pdf, left, HEIGHT-676, "Report updates", bold, 14.5, INK, -.2)
    _lines(pdf, left, 700, (
        "The tool store updates reports throughout the day and night. Speak to the tool store",
        "controller at any time for a fresh copy or if anything in your report looks wrong.",
    ), regular, 12, 17, INK)

    _rule(pdf, left, right, HEIGHT-756, line_colour, .6)
    _text(pdf, left, HEIGHT-776, "Author: Andrew Fisher | POWERED BY SITEIQ", bold, 8, SLATE)
    pdf.setFont(regular, 8)
    pdf.setFillColor(HexColor(key_colour))
    pdf.drawRightString(right, HEIGHT-776, "Each report shows the latest SiteIQ update.")
    _lines(pdf, left, 793, (
        "Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved.",
        "Not to be copied or reproduced without permission.",
    ), regular, 7.4, 11, key_colour)
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
