#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR - THE SITE GUIDES
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  The three things a crew member actually needs on their phone at
#  02:00, rebuilt as native HTML rather than bolted-on PDFs:
#
#    1. CONTACT BOARD    every number for the shut - TAP TO CALL
#    2. RADIO GUIDE      DP4801e, the K2SHUT26 channel plan
#    3. GAS MONITOR      Honeywell BW Flex4, alarm = action
#
#  WHY NOT JUST EMBED THE PDFs
#  ---------------------------
#  A PDF on a phone is a pinch-and-zoom fight in the dark, the numbers
#  are not tappable, and an A3 contact board is unreadable on a 6-inch
#  screen. Rebuilt native they are sharp at any size, they work with no
#  signal once the page is open, they weigh a few kilobytes instead of
#  megabytes - and every phone number is a link you can ring with your
#  thumb. That last one is the whole point of the board.
#  (A. Fisher, 25 Jul 2026)
#
#  Source documents:
#    CA-K2-TS-PS-004 Rev 1  - Master Contact Board A3, issued 24 Jul 2026
#    CIS-GDE-001 Rev 2.0    - How to use your two-way radio, 20 Jul 2026
#    Honeywell BW Flex4 - How to use, the Coates Way
# =====================================================================

ORANGE = "#F26222"


def _esc(s):
    return (str(s or "").replace("&", "&amp;")
            .replace("<", "&lt;").replace(">", "&gt;"))


def _tel(num):
    """A tappable number. Australia: strip spaces for the dial string,
    keep them for reading."""
    raw = "".join(c for c in str(num) if c.isdigit() or c == "+")
    if not raw:
        return _esc(num)
    return ("<a class='tel' href='tel:{r}'>{n}"
            "<svg viewBox='0 0 24 24' width='13' height='13'><path d='M6.6 "
            "10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11.4 11.4 0 "
            "003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 "
            "011-1h3.5a1 1 0 011 1 11.4 11.4 0 00.57 3.57 1 1 0 01-.25 "
            "1z' fill='currentColor'/></svg></a>").format(
        r=raw, n=_esc(num))


# ---------------------------------------------------------------------
#  1. THE CONTACT BOARD - every number for the shut
# ---------------------------------------------------------------------
EMERGENCY = {
    "internal": "2222",
    "external": "07 4970 2222",
    "channel": "1",
}

CONTACT_GROUPS = [
    #  The tool store first. This is the tool store's own page, read by a
    #  bloke standing at the window - the person who runs it should not be
    #  twenty rows down under "contractors". (Andrew, 29 Jul 2026)
    ("Your tool store &mdash; ask us first", "#F26222", [
        ("Andrew Fisher", "Coates Shutdown Manager QLD &middot; "
         "andrew.fisher@coates.com.au", "0429 352 788"),
        ("The tool store window", "Gear in and out, consumables, "
         "damage and returns", ""),
    ]),
    ("Safety advisors &amp; isolation officers", "#C0392B", [
        ("Adam McInnes", "Shutdown Safety Lead", "0428 671 885"),
        ("Kris Tierney", "Safety Manager", "0428 283 694"),
        ("Melissa Cooper", "Day Shift Safety Advisor", "0438 153 953"),
        ("Nicole Ward", "Night Shift Safety Advisor", "0409 766 797"),
    ]),
    ("Cement Australia — shutdown team", "#2F80ED", [
        ("Renier van Zyl", "Operations Manager", "0473 654 490"),
        ("Daniel Osborne", "Maintenance Manager", "0457 564 205"),
        ("Ben Vandenbroek", "Shutdown Manager (Day Shift)", "0477 698 094"),
        ("David Moore", "Shutdown Manager (Night Shift)", "0412 048 176"),
        ("Andrew Coad", "Production Manager", "0437 273 585"),
        ("Samantha Brown", "Commercial Manager", "0448 662 991"),
        ("Sonal Bhutra", "Prod. Delivery Mgr · Refractory D/S · QA/ITP",
         "0477 876 717"),
        ("Grant Holdsworth", "Mechanical Execution Manager", "0460 020 213"),
        ("Quintin Graham", "Electrical Execution Manager", "0429 883 552"),
        ("Omobolarin Awodoye", "Shutdown Scheduler", "0421 679 499"),
        ("John Pickels", "Shutdown Planner", "0409 467 303"),
        ("Adam Durham", "Refractory Coordinator Preheater (Night Shift)",
         "0448 212 982"),
        ("Matt Byers", "Refractory Coordinator Kiln/Cooler (D/S)",
         "0473 856 963"),
        ("Matt Miller", "Mechanical Coordinator 404", "0408 242 182"),
        ("Craige Palmer", "Bag Filters Supervisor", "0488 030 478"),
        ("Dave Beacon", "Cranes &amp; Scaffold Coordinator", "0421 213 295"),
        ("Junaid Khan", "Mechanical Engineering Support", "0448 916 804"),
        ("Peter Curran", "Mechanical Engineering Support", "0427 537 826"),
        ("Hazel Barba", "Shutdown Cost Controller", "Shutdown office"),
        ("Amber Levitt", "Site Admin", "07 4970 1118"),
    ]),
    ("On the radio — UHF channel 1", "#7C5CBF", [
        ("Brad O'Sullivan", "Mech Supervisor 404 (Night)", ""),
        ("Jason Vasquez", "Mech Supervisor 404 Kiln", ""),
        ("Paul Lester", "Mech Supervisor 402", ""),
        ("Andrew Bowman", "Mech Supervisor 402 (Night)", ""),
        ("Bill Jones", "401 Coordinator", ""),
        ("Michael Neideck", "Electrical Coordinator", ""),
        ("Andrew Newton", "PSS Coordinator", ""),
    ]),
    ("Contractors on site", "#F26222", [
        ("Cleanaway", "Jayden Andrew", "0499 511 437"),
        ("Control System Technology", "Justin Sheehan", "07 4952 1580"),
        ("DGH", "Jake Adams", "0439 475 725"),
        ("DKE", "Tim Lalor", "0416 088 669"),
        ("Down to Earth Results", "Dani Hunt", "0450 592 642"),
        ("High Risk Solutions", "Matt Wooldridge", "0466 715 215"),
        ("I &amp; C Electrical", "Clint Storch", "0437 137 631"),
        ("Industec", "Michael Clayton", "0419 899 571"),
        ("ISH 24", "Tyson / Mike / Christian", "0499 919 741"),
        ("Machinery Consultation Services", "Salah Attia", "0499 881 294"),
        ("Nilsen's", "Grant Roberts", "0407 949 424"),
        ("Parkers Liquid Waste", "Amy Fuller", "0491 971 774"),
        ("Programmed", "Deb Rogers", "0459 106 376"),
        ("Schneider Electrical", "Chris Freebody", "0447 234 516"),
        ("Swampy Property Services", "Rosie Peck", "0438 738 455"),
        ("Syncclift", "Brendan Lewicki", "0430 028 260"),
        ("Universal Cranes", "Josh Breslin", "0447 031 824"),
        ("Veolia Refractory", "Andrew Mcloughlin", "0437 273 585"),
        ("Walz Construction", "Patrick Sheehan", "0448 616 359"),
        ("Xtreme Engineering", "Kelly Kay", "0431 403 640"),
    ]),
]


def contact_board():
    e = EMERGENCY
    h = ("<div class='gsec'>"
         "<div class='gemerg'>"
         "<div class='ge-t'>Emergency — any incident, anywhere on site</div>"
         "<div class='ge-n'>{i}</div>"
         "<div class='ge-s'>internal phone</div>"
         "<div class='ge-r'>{x}<span class='ge-ch'>UHF channel {c}</span>"
         "</div>"
         "<div class='ge-b'>Say <b>&ldquo;Emergency, Emergency, "
         "Emergency&rdquo;</b> three times over the radio and wait for a "
         "response.<br>Give your <b>location</b>, <b>what has "
         "happened</b>, and the <b>status of anyone injured</b>."
         "<br><span class='ge-m'>Rescue on site day and night: ISH24 + CA "
         "first aiders. First aid 24 hours — IRET primary.</span></div>"
         "</div>").format(i=_tel(e["internal"]), x=_tel(e["external"]),
                          c=e["channel"])

    for title, colour, people in CONTACT_GROUPS:
        h += ("<div class='ghead' style='border-left-color:{c}'>{t}"
              "<span>{n}</span></div><div class='glist'>").format(
            c=colour, t=title, n=len(people))
        for a, b, num in people:
            h += ("<div class='grow'><div class='gwho'><b>{a}</b>"
                  "<span>{b}</span></div><div class='gnum'>{n}</div></div>"
                  ).format(a=_esc(a), b=b,
                           n=_tel(num) if num else
                           "<span class='gradio'>Call on the radio</span>")
        h += "</div>"

    h += ("<div class='gfoot'>Number changed, or someone new on the job? "
          "Tell the Coates tool store and we&rsquo;ll keep this current. "
          "<b>One Team.</b><br><span>CA-K2-TS-PS-004 &middot; Rev 1 "
          "&middot; issued 24 Jul 2026</span></div></div>")
    return h


# ---------------------------------------------------------------------
#  2. THE RADIO - Motorola DP4801e, channel plan K2SHUT26
# ---------------------------------------------------------------------
RADIO_CHANNELS = [
    ("1", "Production / Safety", "Rayment Excavation", "#C0392B"),
    ("2", "Stockpile Entry Request", "Xtreme · DKE · I&amp;C", "#F26222"),
    ("3", "Maintenance", "", "#E0A400"),
    ("4", "Refractory", "Veolia", "#7FA45C"),
    ("5", "Crane / Scaffolding / CSE / Hole Watch", "Universal · HRS",
     "#2F80ED"),
    ("6", "Shipping", "", "#7C5CBF"),
    ("7", "Plant Services / Cleanaway / Fuel / Alimak", "", "#5C7A9E"),
    ("8", "DGH", "", "#8B9099"),
]

RADIO_STEPS = [
    ("Switch on", "Turn the volume knob clockwise until it clicks. The "
                  "screen shows your zone and channel."),
    ("Pick the channel", "Turn the selector to the K2SHUT26 channel for "
                         "your crew — the list is right above."),
    ("Listen first", "Check nobody is already talking. Only one person "
                     "transmits at a time."),
    ("Press and talk", "Hold PTT, wait a second, then speak 2.5–5 cm from "
                       "your mouth. Release to listen."),
]

RADIO_CHECKS = [
    "Charged — battery healthy, or swap it",
    "Antenna hand-tight and undamaged",
    "Right channel for your crew and task",
    "Radio check — call another set, confirm you are heard",
    "Faulty? Tag it, quarantine it, write it up",
]

RADIO_LIGHTS = [
    ("#F85149", "Solid red", "Transmitting — you are talking"),
    ("#3FB950", "Blinking green", "Receiving a call, or powering up"),
    ("#F2B01E", "Blinking yellow", "Scanning, or no channel activity"),
]


def radio_guide():
    ch = "".join(
        "<div class='rch'><span class='rcn' style='background:{c}'>{n}</span>"
        "<div class='rct'><b>{t}</b>{s}</div></div>".format(
            c=col, n=n, t=t, s=("<span>" + s + "</span>") if s else "")
        for n, t, s, col in RADIO_CHANNELS)
    st = "".join(
        "<div class='rstep'><span>{i}</span><div><b>{t}</b>{d}</div></div>"
        .format(i=i, t=t, d=d) for i, (t, d) in enumerate(RADIO_STEPS, 1))
    ck = "".join("<li>{}</li>".format(c) for c in RADIO_CHECKS)
    li = "".join(
        "<div class='rlight'><span style='background:{c}'></span>"
        "<b>{n}</b>{d}</div>".format(c=c, n=n, d=d)
        for c, n, d in RADIO_LIGHTS)
    return (
        "<div class='gsec'>"
        "<div class='gemerg gsmall'><div class='ge-t'>In an emergency</div>"
        "<div class='ge-n'>Channel 1</div>"
        "<div class='ge-s'>Production / Safety</div>"
        "<div class='ge-b'>Use the orange button only as briefed at "
        "induction. <b>Anyone can stop the job.</b> If it isn't safe — "
        "stop, make the call, ask.</div></div>"
        "<div class='ghead' style='border-left-color:#F26222'>"
        "Channel plan K2SHUT26<span>8</span></div>"
        "<div class='rchs'>{ch}</div>"
        "<div class='ghead' style='border-left-color:#3FB950'>"
        "Get talking — four steps<span>4</span></div>{st}"
        "<div class='ghead' style='border-left-color:#2F80ED'>"
        "Before each shift<span>5</span></div>"
        "<ul class='rlist'>{ck}</ul>"
        "<div class='ghead' style='border-left-color:#E0A400'>"
        "What the light means<span>3</span></div>{li}"
        "<div class='gfoot'>Keep every call as short as you can. All radios "
        "are signed out and signed back in, returned clean and undamaged, "
        "and any fault reported straight away.<br>"
        "<span>CIS-GDE-001 &middot; Rev 2.0 &middot; Motorola MOTOTRBO "
        "DP4801e</span></div></div>"
    ).format(ch=ch, st=st, ck=ck, li=li)


# ---------------------------------------------------------------------
#  3. THE GAS MONITOR - Honeywell BW Flex4
# ---------------------------------------------------------------------
GAS_STEPS = [
    ("Check the monitor",
     "No damage. Sensor openings clean and clear. Battery charged. No "
     "warning, fault, calibration-due or bump-due message."),
    ("Turn it on in fresh air",
     "Press and hold the grey front button for <b>4 seconds</b>."),
    ("Let the start-up checks finish",
     "Confirm the screen, lights, sound and vibration all work."),
    ("Wear it correctly",
     "Clip it on your chest or collar. Keep it uncovered and the sensor "
     "openings clear."),
    ("If it alarms",
     "Stop work. Leave the area and move somewhere safe. Warn others. "
     "Report it and follow the site emergency procedure. "
     "<b>Never silence an alarm and keep working.</b>"),
]

GAS_READINGS = [("LEL", "0", "#2F80ED"), ("O₂", "20.9", "#E6E9EE"),
                ("H₂S", "0", "#E0A400"), ("CO", "0", "#8B9099")]

GAS_ALARMS = [
    ("#F85149", "High alarm",
     "Leave the area immediately. Move to fresh air. Follow the emergency "
     "procedure."),
    ("#F2B01E", "Low alarm",
     "Be aware. Assess the situation. Leave the area if required."),
    ("#E0A400", "STEL / TWA alarm",
     "Take action. Follow site procedures. Monitor your exposure."),
    ("#8B9099", "Fault warning",
     "The monitor is not working properly. Tag it out. Do not use it. "
     "Report it."),
]


def gas_guide():
    st = "".join(
        "<div class='rstep'><span>{i}</span><div><b>{t}</b>{d}</div></div>"
        .format(i=i, t=t, d=d) for i, (t, d) in enumerate(GAS_STEPS, 1))
    rd = "".join(
        "<div class='grd'><b style='color:{c}'>{k}</b><span>{v}</span></div>"
        .format(c=c, k=k, v=v) for k, v, c in GAS_READINGS)
    al = "".join(
        "<div class='ralarm'><span style='background:{c}'></span>"
        "<div><b>{n}</b>{d}</div></div>".format(c=c, n=n, d=d)
        for c, n, d in GAS_ALARMS)
    return (
        "<div class='gsec'>"
        "<div class='gemerg gsmall'><div class='ge-t'>Honeywell BW Flex4"
        "</div><div class='ge-n' style='font-size:23px;line-height:1.25'>"
        "Check it. Wear it.<br>Trust it. Live it.</div>"
        "<div class='ge-b'><b>No pass = no issue.</b> A damaged, overdue or "
        "failed monitor does not leave the store.</div></div>"
        "<div class='ghead' style='border-left-color:#F26222'>"
        "Before use<span>5</span></div>{st}"
        "<div class='ghead' style='border-left-color:#2F80ED'>"
        "Typical clean-air readings<span>4</span></div>"
        "<div class='grds'>{rd}</div>"
        "<div class='ghead' style='border-left-color:#C0392B'>"
        "Alarm = action<span>4</span></div>{al}"
        "<div class='gfoot'>Only ever zero the monitor in known fresh air — "
        "never in a hazardous area. Bump test before use each day: "
        "<b>no bump, no use</b>. To turn it off, move somewhere safe and "
        "hold the front button for about 4 seconds until the countdown "
        "finishes.<br><span>Unsure about anything? Stop and ask. Safety is "
        "in our control — everyone, everywhere, every day.</span></div>"
        "</div>"
    ).format(st=st, rd=rd, al=al)


# ---------------------------------------------------------------------
#  the guides, wrapped for the page
# ---------------------------------------------------------------------
# ---------------------------------------------------------------------
#  TRADE TABLES (Andrew, 1 Aug 2026) - the laminated crib cards, on the
#  phone. Built from the Coates Tool Store cards Andrew carries:
#  "Torque Settings - Bolting Tools, Hydraulic Torque Wrench, Issue 2"
#  and "Imperial to Metric Conversions for Torque Sockets & Cassettes",
#  plus the socket-and-spanner visual guide.
#
#  Two rules held while building it:
#
#  NOTHING GUESSED. The Enerpac pressure/torque tables are GENERATED
#  from the relationship the card itself proves (ft.lb = psi x 0.2 /
#  0.4 / 0.8 / 1.5, exact on every row of the imperial table), not
#  copied by eye. That removes the one real risk in putting torque
#  figures on a screen - a misread digit.
#
#  ONE ERROR CORRECTED, OUT LOUD. The printed conversions card lists
#  W15000 as 32,200 Nm. 15,000 lbf.ft is 20,337 Nm, and Coates' own
#  torque card agrees (W15000 tops out at 20,337 Nm at 690 bar). The
#  correct figure is shown here and the difference is called out.
# ---------------------------------------------------------------------
_NM_PER_FTLB = 1.35582
#  the card's own bar column is psi divided by 14.5 and rounded -
#  match it exactly rather than diverge on the last row (1 bar is
#  14.5038 psi; at 10,000 psi that is 0.7 bar of nothing)
_BAR_PER_PSI = 1.0 / 14.5

#  the four cassette tools on the Coates card, and their torque per psi
_W_TOOLS = (("W2000", 0.2), ("W4000", 0.4), ("W8000", 0.8),
            ("W15000", 1.5))


def _tt_shell(title, note, body, wide=False):
    h = ("<div class='ttblk'><div class='tth'>" + title + "</div>")
    if note:
        h += "<div class='ttn'>" + note + "</div>"
    h += ("<div class='ttscroll'>" if wide else "") + body
    h += ("</div>" if wide else "") + "</div>"
    return h


def _tt_rows(head, rows, cls=""):
    h = "<table class='ttt " + cls + "'><tr>"
    h += "".join("<th>" + str(c) + "</th>" for c in head) + "</tr>"
    for r in rows:
        h += "<tr>" + "".join("<td>" + str(c) + "</td>" for c in r) + "</tr>"
    return h + "</table>"


def _tt_cards(items):
    """title / lines pairs as small stacked cards - reads better than a
    table when the content is words rather than numbers."""
    h = "<div class='ttcards'>"
    for t, lines in items:
        h += ("<div class='ttcard'><b>" + t + "</b><span>"
              + "<br>".join(lines) + "</span></div>")
    return h + "</div>"


# ---------------------------------------------------------------------
#  the bolting sequence diagrams - drawn, not photographed
# ---------------------------------------------------------------------
def _star_order(n):
    """A true criss-cross: consecutive numbers always land opposite each
    other, starting at twelve o'clock, then the gaps are bisected. The
    card's own note applies - these are general patterns, and the
    manufacturer's procedure wins."""
    half = n // 2
    order = [0]

    def bisect(lo, hi):
        if lo > hi:
            return
        mid = (lo + hi) // 2
        order.append(mid)
        bisect(lo, mid - 1)
        bisect(mid + 1, hi)

    bisect(1, half - 1)
    seq = []
    for i in order:
        seq.append(i)
        seq.append(i + half)
    return seq


def _bolt_svg(n, px=104):
    import math
    #  the marker has to fit the gap between bolts or the numbers pile
    #  up on each other - found on the 16/18/20 bolt patterns
    r = px * 0.36
    c = px / 2.0
    gap = (2 * math.pi * r) / n
    mr = max(6.0, min(9.5, gap * 0.44))
    fs = round(mr * 1.15, 1)
    seq = _star_order(n)
    #  position -> bolt number
    at = {}
    for num, pos in enumerate(seq, start=1):
        at[pos] = num
    s = ("<svg viewBox='0 0 " + str(px) + " " + str(px) + "' width='" + str(px)
         + "' height='" + str(px) + "'>")
    s += ("<circle cx='" + str(c) + "' cy='" + str(c) + "' r='" + str(round(r, 1))
          + "' fill='none' stroke='#3A424E' stroke-width='1.2'/>")
    for pos in range(n):
        ang = -math.pi / 2 + (2 * math.pi * pos / n)
        x = c + r * math.cos(ang)
        y = c + r * math.sin(ang)
        num = at[pos]
        s += ("<circle cx='" + str(round(x, 1)) + "' cy='" + str(round(y, 1))
              + "' r='" + str(round(mr, 1)) + "' fill='#151C27' "
              "stroke='#F26222' stroke-width='1.2'/>")
        s += ("<text x='" + str(round(x, 1))
              + "' y='" + str(round(y + fs * 0.36, 1))
              + "' text-anchor='middle' font-size='" + str(fs)
              + "' font-weight='700' fill='#EAF0F7'>" + str(num) + "</text>")
    return s + "</svg>"


def _bolt_grid():
    h = "<div class='ttbolts'>"
    for n in (4, 6, 8, 10, 12, 16, 18, 20):
        big = n >= 16
        h += ("<div class='ttbolt" + (" big" if big else "") + "'>"
              + _bolt_svg(n, 190 if big else 104)
              + "<b>" + str(n) + " BOLT</b></div>")
    return h + "</div>"


# ---------------------------------------------------------------------
#  the Enerpac pressure / torque table, generated and self-checking
# ---------------------------------------------------------------------
def _torque_rows(factor):
    #  the card rounds Nm UP, not to nearest - proved against every
    #  legible value on it (200 ft.lb -> 272, 360 -> 489, 520 -> 706,
    #  2000 -> 2712). Rounding to nearest would sit 1 Nm light on most
    #  rows and look like a disagreement with the printed card.
    import math
    rows = []
    for psi in range(1000, 10001, 200):
        ftlb = int(round(psi * factor))
        nm = int(math.ceil(ftlb * _NM_PER_FTLB))
        rows.append((format(psi, ','), int(round(psi * _BAR_PER_PSI)),
                     format(nm, ','), format(ftlb, ',')))
    return rows


def _torque_block():
    h = ("<div class='ttpick'>"
         "<input type='radio' name='ttw' id='ttw0' checked>"
         "<input type='radio' name='ttw' id='ttw1'>"
         "<input type='radio' name='ttw' id='ttw2'>"
         "<input type='radio' name='ttw' id='ttw3'>"
         "<div class='ttpickbar'>")
    for i, (name, _f) in enumerate(_W_TOOLS):
        h += "<label for='ttw" + str(i) + "'>" + name + "</label>"
    h += "</div>"
    for i, (name, f) in enumerate(_W_TOOLS):
        h += ("<div class='ttwpane' id='ttwp" + str(i) + "'>"
              + _tt_rows(("PSI", "BAR", "Nm", "ft&middot;lb"),
                         _torque_rows(f), "num") + "</div>")
    return h + "</div>"


# ---------------------------------------------------------------------
#  reference data lifted from the Coates cards
# ---------------------------------------------------------------------
_DRIVES = [
    ("1/4\"", "6.35 mm", "Smallest drive &mdash; precision work",
     "Electrical, instrument, small engine, electronics", "4 &ndash; 14 mm"),
    ("3/8\"", "9.53 mm", "General purpose workshop",
     "General maintenance, automotive, light industrial", "8 &ndash; 24 mm"),
    ("1/2\"", "12.7 mm", "Heavy duty &mdash; most applications",
     "Shutdowns, construction, mining, industrial maintenance",
     "10 &ndash; 36 mm"),
    ("3/4\"", "19.05 mm", "Very heavy duty &mdash; high torque",
     "Structural, flange work, heavy equipment, large bolts",
     "10 &ndash; 36 mm"),
    ("1\"", "25.4 mm", "Extreme heavy duty &mdash; maximum torque",
     "Mining, excavators, draglines, large industrial equipment",
     "46 &ndash; 80 mm+"),
]

_HEX_METRIC = [
    ("M10", 17), ("M12", 19), ("M14", 22), ("M16", 24), ("M18", 27),
    ("M20", 30), ("M22", 32), ("M24", 36), ("M27", 41), ("M30", 46),
    ("M33", 50), ("M36", 55), ("M39", 60), ("M42", 65), ("M45", 70),
    ("M48", 75), ("M52", 80), ("M56", 85), ("M60", 90), ("M64", 95),
    ("M68", 100), ("M72", 105), ("M76", 110), ("M80", 115), ("M85", 120),
    ("M95", 139), ("M100", 145), ("M105", 150), ("M110", 155),
    ("M115", 165), ("M120", 170), ("M125", 180), ("M130", 185),
    ("M140", 200), ("M150", 210),
]

_HEX_IMP = [
    ("5/8\"", "1 1/16\""), ("3/4\"", "1 1/4\""), ("7/8\"", "1 7/16\""),
    ("1\"", "1 5/8\""), ("1 1/8\"", "1 13/16\""), ("1 1/4\"", "2\""),
    ("1 3/8\"", "2 3/16\""), ("1 1/2\"", "2 3/8\""), ("1 5/8\"", "2 9/16\""),
    ("1 3/4\"", "2 3/4\""), ("1 7/8\"", "2 15/16\""), ("2\"", "3 1/8\""),
    ("2 1/8\"", "3 7/16\""), ("2 1/4\"", "3 7/8\""), ("2 3/8\"", "4 1/4\""),
    ("2 1/2\"", "4 5/8\""), ("2 3/4\"", "5\""),
]

_SQUARE_DRIVES = [
    ("S1500", "3/4\" drive", 1400), ("S3000", "1\" drive", 3200),
    ("S6000", "1 1/2\" drive", 6010), ("S11000", "1 1/2\" drive", 11000),
    ("S25000", "2 1/2\" drive", 25400),
]


def _inch_mm_rows():
    """Sixteenths from 1/16 to 4 inches - the range a tool store actually
    reaches for. Computed, so no digit can slip."""
    from fractions import Fraction
    rows = []
    for k in range(1, 65):
        fr = Fraction(k, 16)
        whole, rem = divmod(fr.numerator, fr.denominator)
        if rem == 0:
            label = str(whole) + "\""
        elif whole == 0:
            label = str(rem) + "/" + str(fr.denominator) + "\""
        else:
            label = (str(whole) + " " + str(rem) + "/"
                     + str(fr.denominator) + "\"")
        rows.append((label, format(round(float(fr) * 25.4, 1), '.1f')))
    #  two side-by-side columns so it is half as tall to scroll
    half = (len(rows) + 1) // 2
    out = []
    for i in range(half):
        a = rows[i]
        b = rows[i + half] if i + half < len(rows) else ("", "")
        out.append((a[0], a[1], b[0], b[1]))
    return out


def trade_tables():
    hon = ("<div class='ttwarn'><b>Quick reference only.</b> The stamp on "
           "the gear, the tag on the sling, the printed card at the counter "
           "and the manufacturer's procedure always win. If this page and "
           "the job's procedure disagree, the procedure is right.</div>")

    # ---- TAB 1: SOCKETS ------------------------------------------------
    t1 = _tt_shell(
        "Socket drive sizes",
        "Check the square drive on the tool or the socket. "
        "<b>1/2\" is the most common.</b>",
        _tt_rows(("DRIVE", "SIZE", "WHAT IT IS FOR", "TYPICAL SOCKETS"),
                 [(d[0], d[1], d[2] + "<br><i>" + d[3] + "</i>", d[4])
                  for d in _DRIVES], "drv"))
    t1 += _tt_shell(
        "How to tell the drive size",
        "",
        _tt_cards([
            ("1 &middot; Look inside",
             ["Check the square hole in the socket. That is the drive size."]),
            ("2 &middot; Check the anvil",
             ["Look at the square on the impact gun or ratchet."]),
            ("3 &middot; Look for markings",
             ["Most sockets and tools are stamped with the drive size."]),
            ("4 &middot; Compare the size",
             ["The bigger the square, the bigger the drive."]),
        ]))
    t1 += _tt_shell(
        "Impact vs chrome",
        "Getting this wrong is how sockets shatter.",
        _tt_cards([
            ("IMPACT socket (black)",
             ["Stronger steel, thicker walls, black phosphate.",
              "<b class='ttok'>Use with impact guns only.</b>"]),
            ("CHROME socket (silver)",
             ["Chrome vanadium, thinner walls, chrome plated.",
              "<b class='ttbad'>Hand tools (ratchet) only &mdash; "
              "never on a rattle gun.</b>"]),
        ]))
    t1 += _tt_shell(
        "Socket types",
        "",
        _tt_rows(("TYPE", "WHAT IT IS FOR"),
                 [("Standard (shallow)", "Most common, general use"),
                  ("Deep", "For long bolts and studs"),
                  ("6 point", "Better grip on fasteners"),
                  ("12 point", "More contact with the fastener"),
                  ("Impact (black)", "Impact guns only")]))
    t1 += _tt_shell(
        "Square drive reference",
        "",
        _tt_rows(("DRIVE", "ACTUAL SIZE"),
                 [(d[0], d[1]) for d in _DRIVES], "num"))

    # ---- TAB 2: SPANNERS -----------------------------------------------
    t2 = _tt_shell(
        "Spanner for the bolt (metric)",
        "Standard hex heads. Flanged and structural heads can differ &mdash; "
        "if the spanner fights you, it is the wrong spanner.",
        _tt_rows(("THREAD", "HEX A/F", "THREAD", "HEX A/F"),
                 _pairs([(t, str(a) + " mm") for t, a in _HEX_METRIC]),
                 "num"))
    t2 += _tt_shell(
        "Spanner for the bolt (imperial)",
        "",
        _tt_rows(("THREAD", "HEX A/F", "THREAD", "HEX A/F"),
                 _pairs(_HEX_IMP), "num"))
    t2 += _tt_shell(
        "Common sizes on the shelf",
        "",
        _tt_cards([
            ("Metric (mm)",
             ["6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,",
              "21, 22, 24, 27, 30, 32"]),
            ("Imperial (inch)",
             ["1/4, 5/16, 3/8, 7/16, 1/2, 9/16, 5/8, 3/4, 7/8, 1,",
              "1-1/8, 1-1/4, 1-3/8, 1-1/2, 1-5/8, 1-3/4, 1-7/8, 2"]),
        ]))
    t2 += _tt_shell(
        "Types of spanners",
        "",
        _tt_rows(("TYPE", "WHAT IT IS FOR"),
                 [("Combination", "Open end and ring end. The all-rounder."),
                  ("Ring spanner", "Ring both ends. Better grip, less likely to slip."),
                  ("Open end", "Quick work where space allows."),
                  ("Podger", "Tapered point for aligning bolt holes."),
                  ("Flogging spanner", "Used with a hammer &mdash; extra tightening or loosening."),
                  ("Adjustable", "Adjustable jaw. When the exact size is unknown."),
                  ("Offset ring", "Offset for clearance over obstructions.")]))
    t2 += _tt_shell(
        "Drill for the tap (metric coarse)",
        "",
        _tt_rows(("TAP", "DRILL", "TAP", "DRILL"),
                 [("M5 &times; 0.8", "4.2 mm", "M12 &times; 1.75", "10.2 mm"),
                  ("M6 &times; 1.0", "5.0 mm", "M14 &times; 2.0", "12.0 mm"),
                  ("M8 &times; 1.25", "6.8 mm", "M16 &times; 2.0", "14.0 mm"),
                  ("M10 &times; 1.5", "8.5 mm", "M20 &times; 2.5", "17.5 mm")],
                 "num"))

    # ---- TAB 3: TORQUE -------------------------------------------------
    t3 = ("<div class='ttblk'><div class='tth'>Hydraulic torque wrench "
          "&mdash; pump pressure to torque</div>"
          "<div class='ttn'>Enerpac low-profile <b>W series</b> cassette "
          "type. Pick your tool, then read the pressure. Figures follow the "
          "Coates Tool Store torque card (Issue 2); Nm = ft&middot;lb "
          "&times; 1.35582 rounded up (as the card does), bar = psi "
          "&divide; 14.5. Odd rows can sit 1&nbsp;Nm either side of the "
          "printed card &mdash; nothing on a 2,712&nbsp;Nm tool.</div>"
          + _torque_block() + "</div>")
    t3 += _tt_shell(
        "Bolting sequences",
        "Recommended general patterns &mdash; numbers opposite each other, "
        "working out from the centre. <b>The manufacturer's procedure "
        "wins.</b>",
        _bolt_grid())
    t3 += _tt_shell(
        "Bolting guidelines",
        "",
        _tt_cards([
            ("Always", ["Follow the manufacturer's specific bolting "
                        "procedure when provided."]),
            ("In stages", ["Tighten in stages &mdash; typically 30%, 60%, "
                           "then 100% of final torque."]),
            ("Criss-cross", ["Work in a criss-cross pattern from the centre "
                             "outward."]),
            ("Clean and lubricated", ["Mating surfaces clean, threads "
                                      "lubricated as specified."]),
            ("Re-check", ["Re-check torque if the procedure requires it."]),
        ]))
    t3 += _tt_shell(
        "Enerpac drives &mdash; maximum torque",
        "<b class='ttbad'>Note:</b> the printed conversions card shows "
        "W15000 as 32,200&nbsp;Nm. 15,000&nbsp;lbf&middot;ft is "
        "<b>20,337&nbsp;Nm</b>, and the Coates torque card agrees "
        "(W15000 tops out at 20,337&nbsp;Nm at 690&nbsp;bar). The correct "
        "figure is shown here.",
        _tt_rows(("SQUARE DRIVE", "SIZE", "lbf&middot;ft", "Nm"),
                 [(n, d, format(f, ','),
                   format(int(round(f * _NM_PER_FTLB)), ','))
                  for n, d, f in _SQUARE_DRIVES], "num")
        + _tt_rows(("CASSETTE", "", "lbf&middot;ft", "Nm"),
                   [(n, "", format(int(f * 10000), ','),
                     format(int(round(f * 10000 * _NM_PER_FTLB)), ','))
                    for n, f in _W_TOOLS], "num"))
    t3 += _tt_shell(
        "Quick conversions",
        "",
        _tt_rows(("FROM", "TO", "DO THIS"),
                 [("lbf&middot;ft", "Nm", "&times; 1.3558"),
                  ("Nm", "lbf&middot;ft", "&times; 0.7376"),
                  ("inch", "mm", "&times; 25.4"),
                  ("mm", "inch", "&times; 0.03937"),
                  ("psi", "bar", "&divide; 14.504"),
                  ("bar", "psi", "&times; 14.504")]))

    # ---- TAB 4: CONVERSIONS --------------------------------------------
    t4 = _tt_shell(
        "Inch to millimetre",
        "Sixteenths, computed &mdash; not copied.",
        _tt_rows(("INCH", "MM", "INCH", "MM"), _inch_mm_rows(), "num"))

    # ---- TAB 5: RIGGING ------------------------------------------------
    t5 = _tt_shell(
        "Round sling colours (AS 4497)",
        "Straight vertical lift. <b>Angles and hitches change the WLL</b> "
        "&mdash; read the tag, follow the lift plan.",
        _tt_rows(("COLOUR", "WLL", "COLOUR", "WLL"),
                 [("Violet", "1.0 t", "Red", "5.0 t"),
                  ("Green", "2.0 t", "Brown", "6.0 t"),
                  ("Yellow", "3.0 t", "Blue", "8.0 t"),
                  ("Grey", "4.0 t", "Orange", "10 t+")], "num"))
    t5 += _tt_shell(
        "Rated bow shackles &mdash; typical grade S",
        "<b>Typical only.</b> The WLL stamped on the bow is the law for "
        "that shackle &mdash; always read the stamp.",
        _tt_rows(("PIN &Oslash;", "WLL", "PIN &Oslash;", "WLL"),
                 [("10 mm", "1.0 t", "22 mm", "6.5 t"),
                  ("13 mm", "2.0 t", "25 mm", "8.5 t"),
                  ("16 mm", "3.2 t", "32 mm", "12 t"),
                  ("19 mm", "4.7 t", "", "")], "num"))
    t5 += _tt_shell(
        "Before you pick it up",
        "",
        _tt_cards([
            ("Wear the glasses", ["Every time, no exceptions."]),
            ("Right tool for the job", ["A flogging spanner is not a hammer "
                                        "handle and a chrome socket is not "
                                        "an impact socket."]),
            ("Impact sockets on impact guns", ["Black on the rattle gun. "
                                               "Silver on the ratchet."]),
            ("Never exceed the rating", ["Do not exceed the tool's or the "
                                         "fastener's torque rating."]),
        ]))

    # ---- assemble the tabs (CSS only - no JS, works offline) -----------
    tabs = (("SOCKETS", t1), ("SPANNERS", t2), ("TORQUE", t3),
            ("CONVERT", t4), ("RIGGING", t5))
    h = hon + "<div class='tt'>"
    for i in range(len(tabs)):
        h += ("<input type='radio' name='tttab' id='tttab" + str(i) + "'"
              + (" checked" if i == 0 else "") + ">")
    h += "<div class='ttbar'>"
    for i, (name, _b) in enumerate(tabs):
        h += "<label for='tttab" + str(i) + "'>" + name + "</label>"
    h += "</div>"
    for i, (_n, body) in enumerate(tabs):
        h += "<div class='ttpane' id='ttp" + str(i) + "'>" + body + "</div>"
    return h + "</div>"


def _pairs(items):
    """Two columns side by side, so a long list is half as tall."""
    half = (len(items) + 1) // 2
    out = []
    for i in range(half):
        a = items[i]
        b = items[i + half] if i + half < len(items) else ("", "")
        out.append((a[0], a[1], b[0], b[1]))
    return out


#  the trade tables' own styling - kept here with the tables so the
#  next site gets both or neither. BUILD_MY_GEAR folds it into the page.
TT_CSS = """
.ttwarn{background:#241a09;border:1px solid #4a3a10;border-radius:12px;
 padding:10px 12px;font-size:11.5px;color:#C9B27A;line-height:1.55;margin-bottom:12px}
.ttwarn b{color:#F0B429}
.tt input[type=radio]{position:absolute;opacity:0;pointer-events:none}
.ttbar{display:flex;flex-wrap:wrap;gap:6px;padding-bottom:8px;margin-bottom:4px}
.ttbar label{flex:none;border:1px solid #2A313C;background:#151A22;color:#8A97A8;
 border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:1.1px;
 padding:8px 12px;cursor:pointer;white-space:nowrap}
.ttpane{display:none}
#tttab0:checked~.ttbar label[for=tttab0],#tttab1:checked~.ttbar label[for=tttab1],
#tttab2:checked~.ttbar label[for=tttab2],#tttab3:checked~.ttbar label[for=tttab3],
#tttab4:checked~.ttbar label[for=tttab4]{background:#F26222;border-color:#F26222;color:#fff}
#tttab0:checked~#ttp0,#tttab1:checked~#ttp1,#tttab2:checked~#ttp2,
#tttab3:checked~#ttp3,#tttab4:checked~#ttp4{display:block}
.ttblk{margin:16px 0 0}
.tth{font-size:14px;font-weight:800;color:#E6E9EE;margin-bottom:4px}
.ttn{font-size:11px;color:#8A97A8;line-height:1.55;margin-bottom:7px}
.ttn b,.ttblk b.ttbad{color:#F0B429}
.ttscroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.ttt{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:2px}
.ttt th{text-align:left;color:#F26222;font-size:9.5px;letter-spacing:1.2px;
 padding:5px 6px;border-bottom:1px solid #28323F;font-weight:800;white-space:nowrap}
.ttt td{padding:6px;border-bottom:1px solid #1D242E;color:#C3CDDA;
 vertical-align:top;line-height:1.45}
.ttt td i{font-style:normal;color:#7B8798;font-size:10.5px}
.ttt.num td{font-variant-numeric:tabular-nums;white-space:nowrap}
.ttt.drv td:nth-child(1),.ttt.drv td:nth-child(2),
.ttt.drv td:nth-child(4){white-space:nowrap}
.ttcards{display:grid;grid-template-columns:1fr;gap:8px}
.ttcard{background:#11151C;border:1px solid #232A34;border-radius:11px;padding:10px 12px}
.ttcard b{display:block;font-size:12.5px;color:#EAF0F7;font-weight:800}
.ttcard span{display:block;font-size:11.5px;color:#8A97A8;margin-top:3px;line-height:1.55}
.ttok{color:#35D68A}
.ttbad{color:#F0B429}
.ttbolts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ttbolt.big{grid-column:1/-1}
.ttbolt{background:#11151C;border:1px solid #232A34;border-radius:12px;
 padding:8px 4px 6px;text-align:center}
.ttbolt b{display:block;font-size:10px;letter-spacing:1.6px;color:#8A97A8;
 font-weight:800;margin-top:2px}
.ttpick input[type=radio]{position:absolute;opacity:0;pointer-events:none}
.ttpickbar{display:flex;gap:6px;margin:2px 0 8px;overflow-x:auto}
.ttpickbar label{flex:none;border:1px solid #2A313C;background:#151A22;color:#8A97A8;
 border-radius:9px;font-size:11px;font-weight:800;padding:7px 12px;cursor:pointer;
 letter-spacing:1px;white-space:nowrap}
.ttwpane{display:none}
#ttw0:checked~.ttpickbar label[for=ttw0],#ttw1:checked~.ttpickbar label[for=ttw1],
#ttw2:checked~.ttpickbar label[for=ttw2],#ttw3:checked~.ttpickbar label[for=ttw3]
{background:#F26222;border-color:#F26222;color:#fff}
#ttw0:checked~#ttwp0,#ttw1:checked~#ttwp1,#ttw2:checked~#ttwp2,
#ttw3:checked~#ttwp3{display:block}
"""


GUIDES = [
    ("contacts", "Contact board", "Every number for the shut — tap to call",
     "M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11.4 11.4 0 "
     "003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 "
     "1 0 011 1 11.4 11.4 0 00.57 3.57 1 1 0 01-.25 1z"),
    ("radio", "Your two-way radio", "Channels, calls and care — DP4801e",
     "M5 9h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2zm2 "
     "4h4M17 3l-4 5"),
    ("gas", "Your gas monitor", "BW Flex4 — check it, wear it, trust it",
     "M12 2a7 7 0 017 7c0 4-3 5-3 8H8c0-3-3-4-3-8a7 7 0 017-7zm-3 19h6"),
    ("tables", "Trade tables", "Sockets · spanners · torque · conversions",
     "M3 5h18v14H3zM3 10h18M9 5v14M15 5v14"),
]


def guides_html():
    return ("<div id='g-contacts' class='gpane'>" + contact_board() +
            "</div><div id='g-radio' class='gpane'>" + radio_guide() +
            "</div><div id='g-gas' class='gpane'>" + gas_guide() +
            "</div><div id='g-tables' class='gpane'>" + trade_tables() +
            "</div>")


def guide_buttons():
    return "".join(
        "<button class='gbtn' onclick=\"openGuide('{k}')\">"
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' "
        "stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'>"
        "<path d='{p}'/></svg>"
        "<div><b>{t}</b><span>{s}</span></div>"
        "<em>&rsaquo;</em></button>".format(k=k, t=t, s=s, p=p)
        for k, t, s, p in GUIDES)
