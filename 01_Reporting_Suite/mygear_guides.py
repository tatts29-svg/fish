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
]


def guides_html():
    return ("<div id='g-contacts' class='gpane'>" + contact_board() +
            "</div><div id='g-radio' class='gpane'>" + radio_guide() +
            "</div><div id='g-gas' class='gpane'>" + gas_guide() + "</div>")


def guide_buttons():
    return "".join(
        "<button class='gbtn' onclick=\"openGuide('{k}')\">"
        "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' "
        "stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'>"
        "<path d='{p}'/></svg>"
        "<div><b>{t}</b><span>{s}</span></div>"
        "<em>&rsaquo;</em></button>".format(k=k, t=t, s=s, p=p)
        for k, t, s, p in GUIDES)
