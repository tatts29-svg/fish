#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR POSTERS - built to match the page they open
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew, 27 Jul 2026: "looks very boring very basic - I want it to
#  look fancy like this, or to suit what happens after you're in."
#
#  So the poster is now drawn in the SAME language as the My Gear page
#  itself - the dark panel, the orange glow, the cabinet tiles, the
#  scan frame. A bloke sees the poster on the window, scans it, and the
#  thing that opens looks like the thing he was just looking at. That
#  is the whole point: one product, not a flyer and an app.
#
#  Both QR codes are generated here every run (qr_lite.py), so the
#  poster can never drift from the address the store is actually
#  serving on.
# =====================================================================
import os

import qr_lite

HERE = os.path.dirname(os.path.abspath(__file__))

CABS = [
    ("Tooling", "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4"
                "l-2.6 2.6-2.4-2.4z"),
    ("Battery gear", "RECT:6,4,12,17,2|M10 2h4M13 9l-3 4h4l-3 4"),
    ("Electrical", "M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V8zM12 16v5"),
    ("Plant", "M3 19h13M5 19v-4h7l2-5h3l2 4v5M14 10 11 5H8"),
    ("Radios", "RECT:8,7,8,14,2|M12 7V2M12 2l3 2M10.5 11h3M10.5 14h3"),
    ("Gas monitors", "RECT:7,5,10,16,2.5|M9.5 2.5h5"),
]


def _icon(spec, size=34):
    body = ""
    for part in spec.split("|"):
        if part.startswith("RECT:"):
            x, y, w, h, r = part[5:].split(",")
            body += ("<rect x='{}' y='{}' width='{}' height='{}' rx='{}'/>"
                     .format(x, y, w, h, r))
        else:
            body += "<path d='{}'/>".format(part)
    #  stroke follows the tile's colour so the mono build can turn the
    #  whole set black without touching the drawing itself.
    return ("<svg viewBox='0 0 24 24' width='{s}' height='{s}' fill='none' "
            "stroke='currentColor' stroke-width='1.7' stroke-linecap='round' "
            "stroke-linejoin='round'>{b}</svg>").format(s=size, b=body)


CSS = """
@page{size:297mm 420mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;
  print-color-adjust:exact}
body{width:297mm;height:420mm;background:#0A0E14;color:#EAF0F7;
  font-family:'Segoe UI',Calibri,Arial,sans-serif;padding:14mm 13mm}
/*  bottom padding reserves the strip the absolute .foot sits in, so
    flow content can never run underneath it however much the sheet
    grows (it did, 29 Jul 2026)  */
.frame{height:100%;border:2.2mm solid #F26222;border-radius:9mm;
  padding:11mm 11mm 17mm;position:relative;overflow:hidden;
  background:radial-gradient(120% 60% at 50% -8%,#1A2432 0%,#0C111A 55%,#0A0E14 100%);
  box-shadow:inset 0 0 26mm rgba(242,98,34,.10)}
.top{display:flex;justify-content:space-between;align-items:flex-start}
.logo{font-size:34pt;font-weight:900;color:#F26222;letter-spacing:-1.5px;
  line-height:.9}
.logo small{display:block;color:#C3CDDA;font-size:10.5pt;font-weight:700;
  letter-spacing:.4px;margin-top:2mm}
.siq{text-align:right;font-size:11pt;font-weight:900;color:#F26222;
  letter-spacing:2px}
.siq small{display:block;color:#8A97A8;font-size:9.5pt;font-weight:600;
  letter-spacing:.6px;margin-top:1.6mm;text-transform:none}
.hero{text-align:center;margin:8mm 0 2mm}
.hero h1{font-size:97pt;font-weight:900;letter-spacing:-4px;line-height:.9;
  color:#fff;text-shadow:0 0 16mm rgba(242,98,34,.55)}
.hero h1 span{color:#F26222;text-shadow:0 0 10mm rgba(242,98,34,.8)}
.hero h1 em{font-style:normal}
.hero .sweep{width:96mm;height:1.6mm;margin:4mm auto 0;border-radius:1mm;
  background:linear-gradient(90deg,transparent,#F26222 30%,#EFFF3D 50%,
  #F26222 70%,transparent);filter:blur(.15mm)}
.kick{font-size:13pt;font-weight:900;letter-spacing:8px;color:#EFFF3D;
  margin-top:4mm;text-shadow:0 0 6mm rgba(239,255,61,.5)}
.tag{font-size:16pt;color:#C3CDDA;margin-top:3mm}
.tag b{color:#fff}
.cabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin:7mm 0 6mm}
.cab{position:relative;background:linear-gradient(180deg,#151A22,#10141B);
  border:.4mm solid #2A313C;border-radius:4mm;padding:6mm 2mm 4.5mm;
  text-align:center;overflow:hidden;color:#F26222}
.cab:before{content:"";position:absolute;top:0;left:14%;right:14%;height:1mm;
  border-radius:0 0 2mm 2mm;
  background:linear-gradient(90deg,transparent,#F26222 35%,#EFFF3D 50%,
  #F26222 65%,transparent);
  filter:blur(.4mm)}
.cab b{display:block;font-size:10pt;font-weight:900;letter-spacing:1.6px;
  text-transform:uppercase;color:#EAF0F7;margin-top:2.5mm}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.qc{position:relative;background:linear-gradient(180deg,#151C27,#0E141D);
  border:.5mm solid #28323F;border-radius:6mm;padding:7mm 6mm 6mm;
  text-align:center}
.qc .n{position:absolute;top:-6mm;left:50%;transform:translateX(-50%);
  width:13mm;height:13mm;border-radius:50%;background:#F26222;color:#fff;
  font-size:18pt;font-weight:900;display:flex;align-items:center;
  justify-content:center;box-shadow:0 0 10mm rgba(242,98,34,.75),
  0 0 0 .8mm #0A0E14,0 0 0 1.4mm #EFFF3D}
.qc h3{font-size:17pt;font-weight:900;margin:3.5mm 0 1.5mm;color:#fff;
  letter-spacing:.4px}
.qc .h{font-size:11pt;color:#8A97A8;margin-bottom:4mm}
.qbox{position:relative;display:inline-block;background:#fff;
  padding:4mm;border-radius:4mm;box-shadow:0 0 14mm rgba(242,98,34,.40)}
.qbox i{position:absolute;width:7mm;height:7mm;border:1mm solid #F26222}
.qbox .c1{top:-2mm;left:-2mm;border-right:0;border-bottom:0;
  border-radius:2mm 0 0 0}
.qbox .c2{top:-2mm;right:-2mm;border-left:0;border-bottom:0;
  border-radius:0 2mm 0 0}
.qbox .c3{bottom:-2mm;left:-2mm;border-right:0;border-top:0;
  border-radius:0 0 0 2mm}
.qbox .c4{bottom:-2mm;right:-2mm;border-left:0;border-top:0;
  border-radius:0 0 2mm 0}
.qc .u{font-size:10pt;color:#8A97A8;margin-top:4mm;word-break:break-all;
  font-family:Consolas,monospace}
/*  A3 only (.steps exists on the big poster alone): the codes are the
    whole point of the sheet, so on A3 they are drawn as large as the
    card allows - a bloke reads this from across the store, not with
    the sheet in his hand. SVG, so it scales with no loss.  */
.steps .qbox svg{display:block;width:82mm;height:82mm}
/*  The promise band - three things that are true of My Gear and that
    every crew asks before they scan. It also carries the bottom of the
    sheet: without it the poster runs out of words 5cm early and reads
    unfinished.  */
.promise{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;
  margin-top:8mm}
.promise div{position:relative;text-align:center;padding:6.5mm 3mm 6mm;
  border:.4mm solid #2A313C;border-radius:4mm;
  background:linear-gradient(180deg,#151A22,#10141B);overflow:hidden}
.promise div:before{content:"";position:absolute;top:0;left:20%;right:20%;
  height:.9mm;background:linear-gradient(90deg,transparent,#EFFF3D,transparent);
  filter:blur(.3mm)}
.promise b{display:block;font-size:15pt;font-weight:900;color:#fff;
  letter-spacing:.3px}
.promise span{display:block;font-size:10pt;color:#8A97A8;margin-top:1.6mm}

/* =================================================================
   THE OFFICEWORKS A3 - the one that goes on the wall
   Andrew, 29 Jul 2026: "make it like WOW what is this."
   A poster has one job at ten metres: stop someone. So the sheet
   leads with the product itself - a phone showing what actually
   opens - because "what is this?" is the question, and a picture
   of the answer beats a paragraph about it. Everything here is
   drawn, not photographed: it stays vector, prints sharp at any
   size, and can never go stale.
   ================================================================= */
.ghost{position:absolute;top:26mm;left:0;right:0;text-align:center;
  font-size:190pt;font-weight:900;letter-spacing:-8px;line-height:1;
  color:rgba(242,98,34,.055);pointer-events:none;z-index:0}
.hero,.strip,.show,.after,.promise,.note{position:relative;z-index:1}
/*  the wordmark carries a metal-to-neon rake - the single most
    looked-at thing on the sheet, so it earns the gradient  */
.hero h1 span.grad{background:linear-gradient(178deg,#FFC489 2%,#F26222 46%,
  #EFFF3D 128%);-webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:#F26222}
/*  the six cabinets, reduced to one confident strip - they say what
    the store holds without eating a third of the poster  */
.strip{display:flex;justify-content:space-between;gap:3mm;margin:9mm 0 9mm;
  padding:4.5mm 5mm;border-radius:4mm;border:.4mm solid #2A313C;
  background:linear-gradient(180deg,#151A22,#10141B)}
.strip div{flex:1;text-align:center;color:#F26222}
.strip b{display:block;font-size:8.6pt;font-weight:900;letter-spacing:1.2px;
  text-transform:uppercase;color:#C3CDDA;margin-top:1.8mm}
/*  product left, the two scans right - one row, one read  */
.show{display:grid;grid-template-columns:1fr 1.34fr 1fr;gap:4.5mm;
  align-items:stretch}
.show .qc{padding:6mm 3.5mm 5mm;display:flex;flex-direction:column;
  justify-content:center;position:relative}
.arw{position:absolute;top:50%;margin-top:-4.5mm;width:9mm;height:9mm;
  border-radius:50%;background:#F26222;color:#fff;display:flex;
  align-items:center;justify-content:center;z-index:3;
  box-shadow:0 0 6mm rgba(242,98,34,.7)}
.show .qc.l .arw{right:-6.7mm}
.show .qc.r .arw{left:-6.7mm;transform:rotate(180deg)}
.show .qbox svg{width:55mm;height:55mm}
/*  the middle card is the hero of the sheet - it sits in a pool of
    orange light, wears the neon edge, and is the thing the two
    chevrons point at  */
.pcard{position:relative;background:linear-gradient(180deg,#18202C,#0E141D);
  border:.6mm solid #F26222;border-radius:6mm;padding:6mm 4mm 5mm;
  text-align:center;overflow:hidden;
  box-shadow:0 0 16mm rgba(242,98,34,.28)}
.pcard:after{content:"";position:absolute;left:0;right:0;top:0;bottom:0;
  background:radial-gradient(58% 42% at 50% 40%,rgba(242,98,34,.22),
  transparent 72%);pointer-events:none}
.pcard>*{position:relative;z-index:1}
.pcard:before{content:"";position:absolute;top:0;left:12%;right:12%;height:1mm;
  background:linear-gradient(90deg,transparent,#EFFF3D,transparent);
  filter:blur(.35mm)}
.pcard .lab{font-size:11.5pt;font-weight:900;letter-spacing:2.6px;
  text-transform:uppercase;color:#EFFF3D;margin-bottom:4.5mm}
.phone{margin:0 auto;width:82mm;border-radius:7mm;background:#05070B;
  border:1.1mm solid #2F3945;padding:4mm 3mm;box-shadow:0 0 12mm rgba(242,98,34,.22)}
.notch{width:16mm;height:1.4mm;border-radius:1mm;background:#2F3945;
  margin:0 auto 3mm}
.scr{background:#0B0F16;border-radius:4mm;padding:5mm 4mm;text-align:left}
.ph-top{font-size:13pt;font-weight:900;color:#fff;letter-spacing:-.4px;
  line-height:1}
.ph-top b{color:#F26222}
.ph-sub{font-size:6.6pt;color:#8A97A8;letter-spacing:1.5px;margin-top:1.2mm;
  text-transform:uppercase}
.ph-score{margin:4.5mm 0;padding:4mm 4mm;border-radius:3mm;
  background:linear-gradient(135deg,#F26222,#c94c16);color:#fff}
.ph-score b{display:block;font-size:25pt;font-weight:900;line-height:1}
.ph-score span{display:block;font-size:7pt;font-weight:700;letter-spacing:.8px;
  opacity:.92;margin-top:.8mm}
.ph-row{display:flex;align-items:center;gap:2mm;padding:3.4mm 0;
  border-top:.25mm solid #1C232E;font-size:7.4pt;color:#C3CDDA}
.ph-row i{width:2.5mm;height:2.5mm;border-radius:50%;flex:none}
.ph-row em{margin-left:auto;font-style:normal;color:#7E8B9C;font-size:6.8pt}
.ph-rank{margin-top:4mm;padding:3.2mm;border-radius:2.5mm;text-align:center;
  border:.35mm solid #3A4657;font-size:7pt;font-weight:900;letter-spacing:.9px;
  color:#EFFF3D}
.after{margin-top:10mm;background:linear-gradient(180deg,#151C27,#0E141D);
  border:.5mm solid #28323F;border-left:1.4mm solid #F26222;
  border-radius:5mm;padding:6mm 7mm}
.after h4{font-size:12pt;font-weight:900;letter-spacing:2.5px;color:#F26222;
  text-transform:uppercase}
.after h4 span{color:#EFFF3D}
.after .row{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;
  margin-top:5.5mm}
.after .row div{font-size:11pt;color:#C3CDDA;line-height:1.5}
.after .row b{display:block;color:#fff;font-size:12pt;margin-bottom:1mm}
.note{margin-top:7mm;text-align:center;font-size:11pt;color:#C3CDDA}
.note b{color:#F26222}
.foot{position:absolute;left:11mm;right:11mm;bottom:6mm;text-align:center;
  font-size:9pt;color:#6C7A8C;border-top:.3mm solid #28323F;padding-top:3.5mm}
.foot b{color:#8A97A8}
"""

# ---------------------------------------------------------------------
#  MONO - the same poster for a black and white printer
#
#  Andrew, 27 Jul 2026: "on occasion we have a black n white printer
#  can this do both for the poster."
#
#  A mono laser does not print orange, it prints a flat grey - and a
#  dark poster comes out of one as a solid black sheet that eats a
#  cartridge and reads like a photocopy of a photocopy. So the mono
#  build is not the colour poster in greyscale. It is the same layout
#  redrawn for one ink: white paper, black type, weight and rules
#  doing the job the orange was doing. Every glow, gradient and
#  shadow is off, because on a laser they dither into grey noise -
#  and noise around a QR code is the one thing that stops a phone
#  locking on. The codes themselves go pure black on white.
# ---------------------------------------------------------------------
MONO_CSS = """
body{background:#fff;color:#111}
.frame{border:1.4mm solid #111;background:#fff;box-shadow:none}
.logo{color:#111}
.logo small{color:#444}
.siq{color:#111}
.siq small{color:#444}
.hero h1{color:#111;text-shadow:none}
.hero h1 span{color:#111;text-shadow:none}
.hero h1 em{font-style:normal;color:#666}
.hero .sweep{background:#111;filter:none;height:1mm}
.kick{color:#444;text-shadow:none}
.tag{color:#333}
.tag b{color:#111}
.cab{background:#fff;border:.5mm solid #111;color:#111}
.cab:before{background:#111;filter:none;left:14%;right:14%;height:1.2mm;
  border-radius:0 0 1mm 1mm}
.cab b{color:#111}
.qc{background:#fff;border:.6mm solid #111}
.qc .n{background:#111;color:#fff;box-shadow:0 0 0 .8mm #fff,0 0 0 1.4mm #111}
.qc h3{color:#111}
.qc .h{color:#444}
.qbox{box-shadow:none;padding:3mm;border-radius:0}
.qbox i{border-color:#111}
.qc .u{color:#333}
.after{background:#fff;border:.5mm solid #111;border-left:1.8mm solid #111}
.after h4{color:#111}
.after h4 span{color:#444}
.after .row div{color:#333}
.after .row b{color:#111}
.note{color:#333}
.note b{color:#111}
.promise div{background:#fff;border:.5mm solid #111}
.promise div:before{background:#111;filter:none;height:1mm}
.promise b{color:#111}
.promise span{color:#444}
/*  one-ink versions of the showcase: gradients and glows dither into
    grey mush on a laser, so they come off entirely and weight does
    the work instead  */
.ghost{color:rgba(0,0,0,.05)}
.hero h1 span.grad{background:none;-webkit-text-fill-color:#111;color:#111}
.strip{background:#fff;border:.5mm solid #111}
.strip div{color:#111}
.strip b{color:#111}
.pcard{background:#fff;border:.9mm solid #111;box-shadow:none}
.pcard:before{background:#111;filter:none;height:1mm}
.pcard:after{background:none}
.pcard .lab{color:#111}
.arw{background:#111;color:#fff;box-shadow:none}
.phone{background:#fff;border:.8mm solid #111;box-shadow:none}
.notch{background:#111}
.scr{background:#fff;border:.3mm solid #BBB}
.ph-top{color:#111}
.ph-top b{color:#111}
.ph-sub{color:#444}
.ph-score{background:#111;color:#fff}
.ph-row{color:#333;border-top:.25mm solid #CCC}
/*  the tag dots are set inline (they are data, not decoration), so the
    one-ink build has to shout them down - a green and an amber dot
    print as two identical grey blobs on a laser. The words beside
    them carry the meaning.  */
.ph-row i{background:#111 !important}
.ph-row em{color:#666}
.ph-rank{border:.35mm solid #111;color:#111}
.foot{color:#444;border-top:.3mm solid #111}
.foot b{color:#111}
"""


def _shell(title, css, mono, body):
    return ("<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<title>" + title + "</title><style>" + css +
            (MONO_CSS if mono else "") +
            "</style></head><body>" + body + "</body></html>")


def poster_html(url, wifi=None, wifi_name="", mono=False):
    strip = "".join(
        "<div>{}<b>{}</b></div>".format(_icon(p, 26), n) for n, p in CABS)
    dark = "#000000" if mono else "#101317"

    #  The phone. Drawn, never a screenshot - a screenshot ages the
    #  moment the page changes and carries somebody's real gear list
    #  onto a wall. The rows below are plainly a sample: no name, no
    #  ID, ordinary tool store items.
    phone = (
        "<div class='pcard'><div class='lab'>This is what opens</div>"
        "<div class='phone'><div class='notch'></div><div class='scr'>"
        "<div class='ph-top'>MY <b>GEAR</b></div>"
        "<div class='ph-sub'>Your name &middot; your hire ID</div>"
        "<div class='ph-score'><b>12</b>"
        "<span>ITEMS IN YOUR NAME</span></div>"
        "<div class='ph-row'><i style='background:#12B76A'></i>"
        "Grinder 125mm<em>4 days</em></div>"
        "<div class='ph-row'><i style='background:#12B76A'></i>"
        "Milwaukee battery<em>4 days</em></div>"
        "<div class='ph-row'><i style='background:#FAB219'></i>"
        "Radio + battery<em>back daily</em></div>"
        "<div class='ph-row'><i style='background:#FAB219'></i>"
        "Gas monitor<em>back daily</em></div>"
        "<div class='ph-row'><i style='background:#E14434'></i>"
        "Chain block 1t<em>logbook due</em></div>"
        "<div class='ph-rank'>RETURNS RANK &middot; 3rd IN YOUR CREW</div>"
        "</div></div></div>")

    #  The chevron points INWARD, at the phone. Both scans lead to the
    #  same place, so the sheet is read as two steps feeding one result
    #  rather than three things sitting in a row.
    chev = ("<div class='arw'><svg viewBox='0 0 24 24' width='22' height='22' "
            "fill='none' stroke='currentColor' stroke-width='3' "
            "stroke-linecap='round' stroke-linejoin='round'>"
            "<path d='M9 5l7 7-7 7'/></svg></div>")

    def qcard(n, title, hint, code, under, side):
        return (
            "<div class='qc {s}'><div class='n'>{n}</div><h3>{t}</h3>"
            "<div class='h'>{h}</div>"
            "<div class='qbox'><i class='c1'></i><i class='c2'></i>"
            "<i class='c3'></i><i class='c4'></i>{q}</div>"
            "<div class='u'>{u}</div>{a}</div>"
        ).format(n=n, t=title, h=hint, s=side, a=chev,
                 q=qr_lite.qr_svg(code, px=250, dark=dark), u=under)

    if wifi:
        card1 = qcard(1, "Join the store Wi-Fi",
                      "Point your camera here &mdash; tap join",
                      wifi, wifi_name or "store network", "l")
        card2 = qcard(2, "Open My Gear",
                      "Then scan this one", url, url, "r")
    else:
        card1 = qcard(1, "Open My Gear",
                      "Point your camera here", url, url, "l")
        card2 = qcard(2, "Or scan your card",
                      "Tap SCAN on the page, hold your card up",
                      url, "your list opens in seconds", "r")

    return _shell("My Gear - A3 Poster", CSS, mono,
            "<div class='frame'>"
            "<div class='top'><div class='logo'>coates"
            "<small>Equipped for anything</small></div>"
            "<div class='siq'>POWERED BY SITEIQ"
            "<small>Cement Australia K2 &middot; Gladstone</small></div></div>"
            "<div class='ghost'>K2</div>"
            "<div class='hero'><h1><em>MY</em> "
            "<span class='grad'>GEAR</span></h1>"
            "<div class='sweep'></div>"
            "<div class='kick'>K2 DIGITAL TOOL STORE</div>"
            "<div class='tag'>Every tool in your name, on your phone, "
            "<b>in 30 seconds.</b></div></div>"
            + "<div class='strip'>" + strip + "</div>"
            + "<div class='show'>" + card1 + phone + card2 + "</div>"
            + "<div class='after'><h4>What you get when you're in "
              "<span>&mdash; live, every morning</span></h4>"
              "<div class='row'>"
              "<div><b>Every item</b>in your name, oldest first</div>"
              "<div><b>What it needs</b>tag colour, logbook, back daily</div>"
              "<div><b>Your scorecard</b>you v your crew v the site</div>"
              "<div><b>Site contacts</b>one tap to call the store</div>"
              "</div></div>"
              "<div class='promise'>"
              "<div><b>No app to install</b><span>It's a web page &mdash; "
              "nothing to download</span></div>"
              "<div><b>No login, no password</b><span>Your hire ID opens "
              "your list, and only yours</span></div>"
              "<div><b>Any phone, 30 seconds</b><span>Two scans and you're "
              "looking at your gear</span></div>"
              "</div>"
              "<div class='note'><b>Updated once a day, about 7:00 AM.</b> "
              "Anything taken or handed back since then shows tomorrow.</div>"
              "<div class='foot'>Locked to your own ID &mdash; a wrong number "
              "shows nothing &middot; <b>Two scans. Two looks. One "
              "standard.</b> &middot; Author: Andrew Fisher</div>"
              "</div>")


A4_CSS = ("@page{size:A4 portrait;margin:0}body{width:210mm;height:297mm;"
          "padding:10mm}.hero h1{font-size:56pt}.qbox{padding:5mm}")

#  The process sheet. Two audiences on one page on purpose: the store
#  runs it, the crews use it, and when a bloke asks "why isn't my gear
#  showing" the answer needs to be on the same sheet as the steps.
PROC_CSS = """
@page{size:A4 portrait;margin:0}
body{width:210mm;height:297mm;padding:7mm}
/* everything below is sized so the whole process lands on ONE sheet -
   a second page is a page that gets left on the printer */
.frame{padding:7mm 8mm 14mm}
.hero{margin:3mm 0 0}
.hero h1{font-size:30pt}
.hero .kick{font-size:10pt;letter-spacing:5px;margin-top:2mm}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:4mm}
.col{background:linear-gradient(180deg,#151C27,#0E141D);border:.5mm solid #28323F;
  border-radius:4mm;padding:4.5mm 4.5mm 3mm}
.col h3{font-size:11pt;font-weight:900;color:#F26222;letter-spacing:1.4px;
  text-transform:uppercase;margin-bottom:.8mm}
.col .who{font-size:8pt;color:#8A97A8;margin-bottom:3mm}
ol{margin:0 0 0 4.5mm;padding:0}
ol li{font-size:9.2pt;color:#C3CDDA;line-height:1.4;margin-bottom:2.2mm}
ol li b{color:#fff}
ol li code{font-family:Consolas,monospace;font-size:8.4pt;color:#EFFF3D}
.when{margin-top:4mm;background:linear-gradient(180deg,#151C27,#0E141D);
  border:.5mm solid #28323F;border-left:1.4mm solid #EFFF3D;border-radius:4mm;
  padding:3.5mm 5mm}
.when h4{font-size:9.5pt;font-weight:900;color:#EFFF3D;letter-spacing:1.8px;
  text-transform:uppercase}
.when p{font-size:9.2pt;color:#C3CDDA;margin-top:1.8mm;line-height:1.4}
.when b{color:#fff}
.fix{margin-top:4mm}
.fix h4{font-size:9.5pt;font-weight:900;color:#F26222;letter-spacing:1.8px;
  text-transform:uppercase;margin-bottom:2mm}
.fix table{width:100%;border-collapse:collapse}
.fix td{font-size:8.8pt;color:#C3CDDA;padding:1.8mm 2.5mm;
  border-top:.3mm solid #28323F;vertical-align:top;line-height:1.35}
.fix td:first-child{color:#fff;font-weight:700;width:36%}
.foot{bottom:5mm}
"""

PROCESS_STEPS_STORE = [
    ("Pull today's numbers", "run <code>28_PULL_SITEIQ_EXPORTS.bat</code> - it "
     "takes the SiteIQ exports out of Downloads and files them"),
    ("Build the page", "run <code>04_RUN_MY_GEAR.bat</code>"),
    ("Serve it", "run <code>31_START_GEAR_LOOKUP_HTTPS.bat</code> and "
     "<b>leave that window open</b> - close it and the QR codes stop working"),
    ("Check the address", "if it prints something other than the address at "
     "the foot of this sheet, run <code>32_UPDATE_POSTERS.bat</code> and "
     "reprint the posters"),
]

PROCESS_STEPS_CREW = [
    ("Join the store Wi-Fi", "scan QR 1 on the poster, tap join"),
    ("Open My Gear", "scan QR 2, or type the address at the foot of this sheet"),
    ("Put your ID in", "type your hire ID, or tap <b>SCAN</b> and hold your "
     "card up to the camera"),
    ("Your gear appears", "everything in your name, oldest first, with what "
     "each item needs"),
    ("Take it with you", "print the A4 sheet, or just keep it open on your "
     "phone"),
]

FIXES = [
    ("Page won't open",
     "The store server isn't running. Ask the tool store to start it."),
    ("Camera won't scan my card",
     "The scan button only appears on a secure (https) connection. Type your "
     "ID in instead - it works the same."),
    ("Gear I handed back is still listed",
     "The list is built once a day at 7:00 AM. It'll be right tomorrow."),
    ("Gear I took this morning isn't there",
     "Same reason - anything after 7:00 AM shows tomorrow."),
    ("It says nothing is in my name",
     "Wrong ID number. A number that isn't yours shows an empty list, never "
     "someone else's gear."),
]


def process_html(url, mono=False, store="the Coates tool store"):
    def steps(items):
        return "<ol>" + "".join(
            "<li><b>{}</b> &mdash; {}</li>".format(a, b) for a, b in items) \
            + "</ol>"
    fixes = "".join("<tr><td>{}</td><td>{}</td></tr>".format(a, b)
                    for a, b in FIXES)
    return _shell("My Gear - How It Works", CSS + PROC_CSS, mono,
            "<div class='frame'>"
            "<div class='top'><div class='logo'>coates"
            "<small>Equipped for anything</small></div>"
            "<div class='siq'>POWERED BY SITEIQ"
            "<small>Cement Australia K2 &middot; Gladstone</small></div></div>"
            "<div class='hero'><h1><em>MY</em> <span>GEAR</span></h1>"
            "<div class='kick'>HOW IT WORKS</div></div>"
            "<div class='cols'>"
            "<div class='col'><h3>Every morning</h3>"
            "<div class='who'>Tool store &mdash; about 15 minutes</div>"
            + steps(PROCESS_STEPS_STORE) + "</div>"
            "<div class='col'><h3>Getting your list</h3>"
            "<div class='who'>Anyone on site &mdash; about 30 seconds</div>"
            + steps(PROCESS_STEPS_CREW) + "</div>"
            "</div>"
            "<div class='when'><h4>Updated once a day</h4>"
            "<p>The list is built <b>about 7:00 AM</b> from that morning's "
            "SiteIQ pull. Anything taken or handed back after that shows up "
            "<b>tomorrow</b>. It is a record of what is in your name, not a "
            "live feed &mdash; if it looks wrong, check the time before you "
            "chase it.</p></div>"
            "<div class='fix'><h4>If something looks wrong</h4>"
            "<table>" + fixes + "</table></div>"
            "<div class='foot'>" + url + " &middot; <b>" + store +
            "</b> &middot; Author: Andrew Fisher</div>"
            "</div>")


def window_html(url, mono=False):
    dark = "#000000" if mono else "#101317"
    return _shell("My Gear - Window", CSS + A4_CSS, mono,
            "<div class='frame'>"
            "<div class='top'><div class='logo'>coates"
            "<small>Equipped for anything</small></div>"
            "<div class='siq'>POWERED BY SITEIQ</div></div>"
            "<div class='hero'><h1><em>MY</em> <span>GEAR</span></h1>"
            "<div class='kick'>SCAN ME</div>"
            "<div class='tag'>See everything in your name. "
            "<b>Your list, nobody else's.</b></div></div>"
            "<div style='text-align:center;margin-top:10mm'>"
            "<div class='qbox'><i class='c1'></i><i class='c2'></i>"
            "<i class='c3'></i><i class='c4'></i>"
            + qr_lite.qr_svg(url, px=330, dark=dark) + "</div></div>"
            "<div class='note' style='margin-top:9mm;font-size:13pt'>"
            "Scan with your phone camera &middot; enter or "
            "<b>scan your ID</b> &middot; your gear appears</div>"
            "<div class='foot'>" + url + " &middot; <b>Updated once a day, "
            "about 7:00 AM</b> &middot; Author: Andrew Fisher</div>"
            "</div>")
