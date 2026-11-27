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
    "company": ("See your company’s gear on hire and", "its work history at Dugald River."),
    "personal": ("Your issued tools, returns and recorded", "tool-store activity at Dugald River."),
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


def _polygon(pdf, points, fill, stroke=None, width=1):
    shape = pdf.beginPath()
    shape.moveTo(*points[0])
    for p in points[1:]:
        shape.lineTo(*p)
    shape.close()
    pdf.setFillColor(HexColor(fill))
    if stroke:
        pdf.setStrokeColor(HexColor(stroke))
        pdf.setLineWidth(width)
    pdf.drawPath(shape, fill=1, stroke=bool(stroke))


def _polyline(pdf, points, stroke, width=1):
    shape = pdf.beginPath()
    shape.moveTo(*points[0])
    for p in points[1:]:
        shape.lineTo(*p)
    pdf.setStrokeColor(HexColor(stroke))
    pdf.setLineWidth(width)
    pdf.drawPath(shape, stroke=1, fill=0)


def _circle(pdf, x, y, radius, fill):
    pdf.setFillColor(HexColor(fill))
    pdf.circle(x, y, radius, stroke=0, fill=1)


def _illustration(pdf, kind, x, y, width):
    """A tool case or a worker's ID badge, drawn in vector at the top of the poster."""
    pdf.saveState()
    pdf.translate(x,y)
    pdf.scale(width/180,width/180)
    pdf.setLineCap(1)
    pdf.setLineJoin(1)
    company = kind == "company"
    ground = "#F26222" if company else "#B61D2B"
    lighter = "#FF9152" if company else "#D73B43"
    line = "#FFB07B" if company else "#E76366"
    _polygon(pdf, [(0,0),(153,0),(180,27),(180,142),(26,142),(0,116)], ground)
    _polygon(pdf, [(0,0),(63,0),(154,142),(120,142)], lighter)
    for shift in (0,6,12):
        _polyline(pdf,[(132+shift,7),(171,46-shift)],line,.9)
    if company:
        # Recessed handle, hinged lid, metal clasps and moulded ribs identify the case.
        _polygon(pdf,[(23,38),(139,26),(160,45),(43,57)],"#CA501D")
        _polygon(pdf,[(28,45),(133,32),(151,46),(45,60)],"#303841")
        _polygon(pdf,[(27,94),(134,82),(150,94),(44,106)],"#677381")
        _polygon(pdf,[(134,82),(150,94),(150,49),(134,34)],"#20262E")
        _polygon(pdf,[(27,94),(134,82),(134,34),(27,47)],"#313B46")
        _polyline(pdf,[(27,84),(134,72),(150,84)],"#A8B2B9",1.9)
        _polyline(pdf,[(61,104),(61,113),(67,120),(89,118),(95,112),(95,100)],"#1E2833",7)
        _polyline(pdf,[(64,114),(69,117),(88,115)],"#8B99A2",2.1)
        for i in (45,101):
            _polygon(pdf,[(i,90-(i-45)*.12),(i+11,89-(i-45)*.12),
                          (i+11,74-(i-45)*.12),(i,75-(i-45)*.12)],"#E5E8E7")
            _polyline(pdf,[(i+2,81-(i-45)*.12),(i+9,80-(i-45)*.12)],"#62717C",1.4)
        for i in (41,53,99,111):
            h=(i-41)*.12
            _polyline(pdf,[(i,65-h),(i,54-h),(i+3,52-h)],"#56626C",2.4)
        _polygon(pdf,[(65,70),(89,67),(89,62),(65,65)],"#F27639")
    else:
        # Generic artwork, with no worker name, number or usable barcode.
        _polyline(pdf, [(56,141),(80,115),(95,104),(111,142)],"#5C2731",9)
        _polyline(pdf, [(58,141),(82,117),(96,106),(109,141)],"#F4A0A1",2.4)
        pdf.saveState()
        pdf.translate(91,67)
        pdf.rotate(-11)
        _roundbox(pdf,-47,-42,97,76,6,"#8F2430")
        _roundbox(pdf,-49,-38,96,76,6,"#F7F5EF")
        _roundbox(pdf,-43,-31,84,16,3,"#D8DEE0")
        _roundbox(pdf,-9,29,17,4,2,"#969DA2")
        _roundbox(pdf,-41,-8,32,29,3,"#2E3942")
        _circle(pdf,-25,11,6,"#F2F1EA")
        _roundbox(pdf,-36,-7,22,11,5,"#F2F1EA")
        _roundbox(pdf,-2,15,31,4,1.5,"#54616B")
        _roundbox(pdf,-2,5,23,3,1.5,"#A2AAAB")
        _roundbox(pdf,-2,-4,27,3,1.5,"#A2AAAB")
        _roundbox(pdf,-37,-25,19,3,1.5,"#AA2935")
        pdf.restoreState()
        _polyline(pdf,[(94,106),(97,102),(96,98)],"#E4E7E5",2.6)
    pdf.restoreState()


def _action_icon(pdf, action, x, y):
    pdf.saveState()
    pdf.translate(x,y)
    pdf.setStrokeColor(HexColor(WHITE))
    pdf.setLineWidth(1.5)
    pdf.setLineCap(1)
    pdf.setLineJoin(1)
    if action == "Print":
        pdf.roundRect(1,6,19,9,2,stroke=1,fill=0)
        pdf.rect(5,14,11,5,stroke=1,fill=0)
        pdf.rect(5,2,11,6,stroke=1,fill=0)
    elif action == "Save PDF":
        _polyline(pdf,[(11,20),(11,6),(6,11)],WHITE,1.5)
        _polyline(pdf,[(11,6),(16,11)],WHITE,1.5)
        _polyline(pdf,[(2,6),(2,2),(20,2),(20,6)],WHITE,1.5)
    elif action == "Share":
        _polyline(pdf,[(5,10),(16,17)],WHITE,1.5)
        _polyline(pdf,[(5,10),(16,4)],WHITE,1.5)
        for circle in [(4,10),(17,18),(17,3)]:
            _circle(pdf,*circle,3,WHITE)
    else:
        pdf.roundRect(1,3,20,14,2,stroke=1,fill=0)
        _polyline(pdf,[(2,15),(11,8),(20,15)],WHITE,1.5)
    pdf.restoreState()


def build_poster(kind: str, scoped_url: str) -> bytes:
    """Return a one-page A4 PDF. The scoped URL appears only in its QR symbol."""
    if kind not in TITLE:
        raise ValueError("Unknown report poster")
    parsed = urlsplit(scoped_url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("A full scoped HTTPS address is required")
    company = kind == "company"
    accent = ORANGE if company else MMG_RED
    accent_ink = DARK_ORANGE if company else "#982333"
    job = Path(os.environ.get("DATA_DIR","/data")) / "job"
    fonts = job / "kit" / "_fonts"
    regular, bold = _register_inter(fonts) if fonts.is_dir() else ("Helvetica","Helvetica-Bold")

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4, invariant=1, pageCompression=1)
    pdf.setTitle(TITLE[kind] + " | MMG Dugald River tool store")
    pdf.setAuthor(AUTHOR)
    pdf.setSubject(CREDIT)
    pdf.setCreator("Coates | MMG Dugald River tool store")
    pdf.setViewerPreference("PrintScaling","None")

    # All content and registration marks sit inside a standard office printer margin.
    left, right = 33, WIDTH-33
    _text(pdf,left,HEIGHT-60,"COATES",bold,26,"#C74710",-.6)
    _polyline(pdf,[(145,HEIGHT-65),(145,HEIGHT-39)],"#BDC4C6",.8)
    try:
        logo = ImageReader(str(job / "logo.png"))
        w,h=logo.getSize()
        scale=min(44/w,37/h)
        pdf.drawImage(logo,158,HEIGHT-68,width=w*scale,height=h*scale,mask="auto")
    except (OSError, ValueError):
        _text(pdf,158,HEIGHT-59,"MMG",bold,20,MMG_RED)
    pdf.setFillColor(HexColor(INK))
    pdf.setFont(bold,11.5)
    pdf.drawRightString(right,HEIGHT-48,"DUGALD RIVER")
    pdf.setFillColor(HexColor(MUTED))
    pdf.setFont(regular,10.5)
    pdf.drawRightString(right,HEIGHT-64,"Shutdown tool store")
    _polyline(pdf,[(left,HEIGHT-84),(right,HEIGHT-84)],"#3A454C",1)

    _illustration(pdf,kind,right-179,HEIGHT-250,179)
    _polyline(pdf,[(left,HEIGHT-109),(left+23,HEIGHT-109)],accent,3.6)
    _text(pdf,left+32,HEIGHT-113,"COMPANY REPORT" if company else "PERSONAL REPORT",bold,9.8,accent_ink,1.0)
    first, second = ("Company","on-hire") if company else ("My shutdown","report")
    hero_size=49 if company else 45
    _text(pdf,left-1,HEIGHT-165,first,bold,hero_size,INK,-1.9)
    _text(pdf,left-1,HEIGHT-214,second,bold,hero_size,INK,-1.9)
    for i,line in enumerate(COPY[kind]):
        _text(pdf,left,HEIGHT-237-i*17,line,regular,13.7,MUTED,-.1)

    # The nearly 107 mm QR symbol is the largest functional element. Its quiet zone
    # remains white even when the frame is photocopied or a printer trims the margin.
    qleft,qbottom,side = left+5,HEIGHT-584,302
    _roundbox(pdf,left,qbottom-5,side+10,side+10,6,"#E0E3E2")
    _roundbox(pdf,left+1,qbottom-4,side+8,side+8,5,WHITE)
    _qr(pdf,scoped_url,qleft,qbottom,side)
    _scan_brackets(pdf,left,qbottom-5,side+10,accent_ink)

    steps_x = left+335
    _polyline(pdf,[(steps_x,HEIGHT-282),(right,HEIGHT-282)],accent,2)
    def step(label, heading, lines, top):
        _text(pdf,steps_x,HEIGHT-top,label,bold,10,accent_ink,.8)
        for i,value in enumerate(heading):
            _text(pdf,steps_x,HEIGHT-top-30-i*24,value,bold,22,INK,-.6)
        yy=HEIGHT-top-30-(len(heading)-1)*24-23
        for j,value in enumerate(lines):
            _text(pdf,steps_x,yy-j*16,value,regular,11.7,MUTED)
    step("STEP 1",["Scan the code"],["Point your phone camera","at the QR and tap the link."],307)
    _polyline(pdf,[(steps_x,HEIGHT-400),(right,HEIGHT-400)],"#C7CCCC",.8)
    if company:
        step("STEP 2",["Choose your","company"],["Tap View on-hire report."],428)
    else:
        step("STEP 2",["Enter your","barcode"],["Use your borrower barcode","to open only your report."],428)

    # Keep the four real report actions in one narrow strip. The shift guidance below
    # gets a full-width reading area while the QR remains the same size.
    bar_y, bar_h = 207, 33
    _roundbox(pdf,left,bar_y,right-left,bar_h,5,SLATE)
    pdf.setFillColor(HexColor(accent))
    pdf.rect(left,bar_y+5,3,bar_h-10,stroke=0,fill=1)
    _text(pdf,left+12,bar_y+12,"Use your report",bold,10.5,WHITE)
    _polyline(pdf,[(left+113,bar_y+7),(left+113,bar_y+bar_h-7)],"#69747D",.7)
    cell=(right-left-118)/4
    for i,label in enumerate(("Print","Save PDF","Share","Email")):
        centre=left+118+(i+.5)*cell
        group_width=16+6+pdfmetrics.stringWidth(label,bold,10.5)
        icon_x=centre-group_width/2
        pdf.saveState()
        pdf.translate(icon_x,bar_y+8)
        pdf.scale(.77,.77)
        _action_icon(pdf,label,0,0)
        pdf.restoreState()
        _text(pdf,icon_x+22,bar_y+12,label,bold,10.5,WHITE)

    middle=(left+right)/2
    _roundbox(pdf,left,125,right-left,71,5,"#FFF0E6" if company else "#F8E9EB")
    _polyline(pdf,[(middle,136),(middle,185)],"#D5C7C1",.8)
    if company:
        messages=[
            ("At shift end",("Have your crew return any gear they", "no longer need to the tool store.")),
            ("Before anyone leaves site",("Check that all gear on their card", "has been returned.")),
        ]
    else:
        messages=[
            ("At shift end",("Return any gear you no longer need", "to the tool store.")),
            ("Before you leave site",("Return all gear on your card.",)),
        ]
    for x,(heading,lines) in zip((left+12,middle+12),messages):
        _text(pdf,x,173,heading,bold,14,accent_ink,-.2)
        for i,line in enumerate(lines):
            _text(pdf,x,154-i*15,line,regular,11.7,INK)

    _text(pdf,left,106,"If anything in the report looks wrong, speak to the tool store controller.",bold,11.4,INK)
    _text(pdf,left,88,"Reports are updated throughout the day and night.",regular,11.4,INK)
    _text(pdf,left,72,"Ask the controller for a fresh report at any time.",regular,11.4,INK)
    _polyline(pdf,[(left,59),(right,59)],"#BCC5C7",.7)
    _text(pdf,left,45,"Author: Andrew Fisher | POWERED BY SITEIQ",bold,8.3,SLATE)
    pdf.setFont(regular,8)
    pdf.setFillColor(HexColor(MUTED))
    pdf.drawRightString(right,45,"The SiteIQ pull time is shown in the report.")
    _text(pdf,left,32,"Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved.",regular,7.5,MUTED)
    _text(pdf,left,21,"Not to be copied or reproduced without permission.",regular,7.5,MUTED)
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
