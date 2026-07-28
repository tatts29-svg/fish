#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | DAILY SAFETY CONVERSATION
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  One conversation a day, on the report, every day of the shutdown.
#  Twenty topics written by A. Fisher, 25 Jul 2026 - the whole life of a
#  tool from the store to the work front and back again.
#
#  HOW THE TOPIC IS PICKED
#  -----------------------
#  Straight off the report date: a 20-day cycle anchored to EPOCH. Every
#  report built for the same day shows the same conversation, so the
#  store, the crews and the client are all talking about the same thing.
#  No state file, no drift, nothing to remember at 05:00.
#
#  TO PIN A TOPIC
#  --------------
#  Set TOPIC_OVERRIDE to the topic number and run. Use it when something
#  has happened and the crew needs to hear about that today - a damaged
#  lead, a near miss on a grinder, a monitor that didn't come back. Set
#  it back to None to return to the cycle.
# =====================================================================

import datetime as _dt

#  Day 1 of the cycle. Topic 1 (Daily Plant Logbooks) falls on this date
#  and every 20 days after it.
EPOCH = _dt.date(2026, 7, 25)

#  None = follow the cycle. 1-20 = pin that topic until you clear it.
TOPIC_OVERRIDE = None


#  (number, title, body, the line to remember, Life Saving Rule)
TOPICS = [
    (1, "Daily Plant Logbooks",
     "The authorised operator must complete and record the required "
     "pre-start inspection before operating applicable plant each shift. "
     "Any defect, warning light, unusual noise or safety concern must be "
     "reported immediately and the plant must not be operated if its "
     "safety is uncertain. Coates provides the logbook and maintenance "
     "support, while the operator is responsible for completing an "
     "accurate daily entry.",
     "No completed pre-start and logbook entry means no operation.",
     "Rule 5 - Tools and Equipment"),

    (2, "Pre-Use Equipment Inspections",
     "Even when equipment has been inspected by Coates before issue, the "
     "person using it must complete a pre-use inspection at the work "
     "front. Check guards, handles, leads, plugs, hoses, controls, safety "
     "devices and general condition before starting. Conditions can "
     "change after issue or during transport. If anything is damaged, "
     "missing or operating abnormally, stop and report it.",
     "A current inspection tag supports compliance, but it never "
     "overrides visible damage.",
     "Rule 5 - Tools and Equipment"),

    (3, "Return Equipment in the Condition Supplied",
     "Equipment should be returned to the Coates tool store in the same "
     "clean, complete and serviceable condition in which it was supplied, "
     "allowing for normal operational wear. This includes returning "
     "cases, chargers, leads, handles, guards and other accessories "
     "issued with the item. Looking after equipment protects the next "
     "user and helps prevent delays caused by missing or damaged "
     "components.",
     "If something has changed while the equipment was in your care, tell "
     "the tool-store team when returning it.",
     "Rule 5 - Tools and Equipment"),

    (4, "Report Damage Immediately",
     "Damage must be reported as soon as it is discovered - not at the "
     "end of the shutdown or quietly when the equipment is returned. Stop "
     "using the item, place it in a safe condition and advise the Coates "
     "tool store of the asset number, location, hirer and nature of the "
     "damage. Coates will quarantine and tag the equipment Out of Service "
     "and organise assessment, repair or replacement where available.",
     "Early reporting prevents damaged equipment from reaching another "
     "worker.",
     "Rule 5 - Tools and Equipment"),

    (5, "Report Plant Breakdowns Clearly",
     "When plant breaks down, stop operating it safely and report the "
     "problem promptly. Provide the plant or asset number, description, "
     "exact location, operator or company, contact number, time of "
     "failure and a clear explanation of what occurred. Do not continue "
     "operating or attempt an unauthorised repair. Accurate information "
     "allows Coates to arrange the correct response without unnecessary "
     "delays.",
     "The better the breakdown information, the faster and safer the "
     "response can be.",
     "Rule 5 - Tools and Equipment"),

    (6, "Out-of-Service Equipment",
     "Equipment suspected of being unsafe must be clearly identified and "
     "kept separate from serviceable equipment. Do not pass it to another "
     "worker or leave it where it could be used accidentally. Notify the "
     "Coates team so an Out of Service tag can be completed with the "
     "asset number, fault, date and reporter's details before the item is "
     "placed in quarantine.",
     "If there is doubt about an item's safety, remove it from use until "
     "a competent person has assessed it.",
     "Rule 5 - Tools and Equipment"),

    (7, "Gas Monitors and Pocket Guides",
     "Gas monitors supplied by the Coates tool store are charged, within "
     "calibration and bump tested before issue in accordance with the "
     "shutdown process. A pocket-size quick-reference card is also "
     "available to help users understand the basic controls and alarm "
     "responses. Users must confirm the monitor is operating correctly "
     "before entering the work area and immediately follow site "
     "procedures if an alarm activates.",
     "The pocket card supports trained users; it does not replace the "
     "confined-space permit, training or emergency procedure.",
     "Rule 2 - High-Risk Work"),

    (8, "Radios and Channel Cards",
     "Radios supplied by Coates are charged and function checked before "
     "issue. Pocket-size radio channel cards are available to help users "
     "select the correct approved site channel and communicate clearly "
     "across the shutdown. Before entering the work area, confirm the "
     "radio is switched on, the volume is suitable and the correct "
     "channel is selected. Critical messages should be repeated back to "
     "confirm understanding.",
     "A radio only improves safety when it is charged, correctly set and "
     "understood by the user.",
     "Rule 5 - Tools and Equipment"),

    (9, "Flogging Spanners and Holders",
     "When a flogging spanner is required, use a purpose-designed "
     "flogging-spanner holder or finger-saver to keep hands away from the "
     "hammer's impact, crush and pinch zones. Inspect the spanner, holder "
     "and hammer before use, establish stable footing and keep other "
     "people clear of the hammer swing and line of fire. Coates supplies "
     "fit-for-purpose equipment, while users must follow the task risk "
     "assessment and site requirements.",
     "Hold the flogging spanner with the holder - not your hand.",
     "Rule 5 - Tools and Equipment"),

    (10, "Grinder Guards, Handles and Discs",
     "Before using a grinder, confirm the guard and handle are correctly "
     "fitted and the selected disc is suitable for the grinder, task and "
     "operating speed. Inspect the disc for damage and never use "
     "equipment with a removed guard, damaged lead or faulty switch. "
     "Establish a safe position and control the direction of sparks and "
     "fragments. Coates checks grinders before issue, but the user must "
     "inspect the complete setup before every use.",
     "The correct grinder with the wrong disc is still the wrong tool.",
     "Rule 5 - Tools and Equipment"),

    (11, "Impact and Torque Equipment",
     "Impact wrenches must be used with correctly sized, impact-rated "
     "sockets and the required retaining device. Keep hands clear of "
     "sockets, reaction points and nearby structures, and never use "
     "visibly cracked or excessively worn accessories. Hydraulic torque "
     "equipment introduces additional high-pressure and reaction-arm "
     "hazards and must only be used by trained and authorised personnel.",
     "Coates supplies fit-for-purpose equipment, but safe positioning and "
     "correct operation remain essential at the work front.",
     "Rule 3 - Training and Competency"),

    (12, "Electrical Inspection Compliance",
     "During the current July-August inspection period, applicable "
     "electrical equipment supplied on hire must display a current blue "
     "inspection tag with legible test and next-due dates. Coates "
     "verifies this compliance before issue. Users must still inspect "
     "leads, plugs, guards, casings and switches before use and protect "
     "equipment from water, sharp edges and vehicle movements.",
     "A missing tag, unclear date or damaged component means the "
     "equipment must not be used and must be reported.",
     "Rule 5 - Tools and Equipment"),

    (13, "Rigging Inspection Compliance",
     "Applicable rigging equipment supplied during the current period "
     "must display a current blue inspection tag together with legible "
     "identification and Working Load Limit information. Coates checks "
     "this before issue, while the user must perform the required pre-use "
     "inspection for cuts, wear, stretching, distortion, corrosion or "
     "damaged components. Never use unidentified rigging or exceed its "
     "rated capacity.",
     "If the condition, inspection status or capacity cannot be "
     "confidently confirmed, quarantine the equipment and request "
     "assistance.",
     "Rule 5 - Tools and Equipment"),

    (14, "Correct Tool for the Task",
     "Before collecting or using equipment, confirm it is designed and "
     "rated for the intended task and that the user is trained, competent "
     "and authorised where required. Do not modify tools, remove guards "
     "or force equipment beyond its intended capacity. The Coates team "
     "can assist with selecting an appropriate item when the task "
     "requirements are explained clearly.",
     "Taking an extra minute to select the correct tool is safer and "
     "usually faster than trying to make the wrong tool work.",
     "Rule 5 - Tools and Equipment"),

    (15, "Battery Tools and Safe Charging",
     "Inspect battery tools, batteries and chargers before use. Batteries "
     "showing cracks, swelling, leakage, excessive heat or damaged "
     "terminals must be removed from service and reported immediately. "
     "Only use the correct compatible charger in a designated, ventilated "
     "location away from combustible materials, and do not cover chargers "
     "while operating. Coates supplies charged equipment where required "
     "and manages reported defects.",
     "A damaged battery is not “good enough for one more job”.",
     "Rule 5 - Tools and Equipment"),

    (16, "Air Tools, Hoses and Whip Restraints",
     "Before using pneumatic equipment, inspect hoses, fittings, locking "
     "pins, clips and required whip restraints. Route hoses to prevent "
     "trips, crushing and contact with hot or sharp surfaces. Isolate and "
     "release stored pressure before disconnecting fittings or changing "
     "attachments, and never use compressed air to clean clothing or "
     "point it toward another person.",
     "Coates checks equipment before issue, while users remain "
     "responsible for safe setup and inspection at the work location.",
     "Rule 5 - Tools and Equipment"),

    (17, "Return Complete Equipment Kits",
     "Equipment must be returned with every component originally issued, "
     "including chargers, batteries, cases, leads, guards, handles, "
     "hoses, certificates and attachments where applicable. Missing parts "
     "can make otherwise serviceable equipment unsafe or unavailable for "
     "the next work group. Check the complete kit before leaving the work "
     "area and advise the tool-store team immediately if anything is "
     "missing.",
     "Returning the main tool without its safety-critical components is "
     "not a complete return.",
     "Rule 5 - Tools and Equipment"),

    (18, "Clean Equipment Before Return",
     "Remove normal dirt and residue from equipment before returning it, "
     "using an appropriate and safe cleaning method. Do not expose the "
     "next user or tool-store personnel to cement dust, oils, chemicals "
     "or unidentified contamination. If specialist decontamination may be "
     "required, advise Coates before bringing the item into the store. "
     "Clean equipment can be properly inspected and returned to service "
     "faster.",
     "If the contamination would concern you when receiving the tool, do "
     "not hand it to someone else without warning.",
     "Rule 5 - Tools and Equipment"),

    (19, "Equipment Accountability",
     "Equipment is issued to an identified hirer and company so its "
     "location and condition can be tracked throughout the shutdown. Do "
     "not transfer issued equipment to another person without following "
     "the approved process, and return items promptly when they are no "
     "longer required. Accurate accountability helps identify unreturned "
     "equipment, overdue inspections and items potentially left in unsafe "
     "locations.",
     "If Coates knows who has the equipment and where it is being used, "
     "we can provide safer and faster support.",
     "Rule 5 - Tools and Equipment"),

    (20, "Early Communication Prevents Delays",
     "Equipment concerns should be communicated early rather than carried "
     "into the next shift. Report faults, missing components, flat "
     "batteries, damaged leads, unusual operation or changing equipment "
     "needs to the Coates team as soon as possible. Clear information "
     "during returns and shift handovers allows equipment to be "
     "quarantined, repaired, charged or replaced before it affects "
     "another work group.",
     "Early reporting is not complaining - it is how Cement Australia, "
     "contractors and Coates keep the shutdown safe and moving.",
     "Rule 5 - Tools and Equipment"),
]

ORANGE = "#F26222"


def topic_for(on=None):
    """The conversation for a given day. Returns a dict, never None.

    A bad TOPIC_OVERRIDE must never take the daily build down, and it must
    never quietly show the wrong topic. Anything outside 1-20, anything
    that isn't a number, and the 0 an off-by-one would produce all fall
    back to the date cycle and say so on the console, rather than wrapping
    round to a topic nobody chose. (A. Fisher, 25 Jul 2026)"""
    d = on or _dt.date.today()
    if isinstance(d, _dt.datetime):
        d = d.date()
    pinned = False
    idx = (d - EPOCH).days % len(TOPICS)
    if TOPIC_OVERRIDE is not None:
        try:
            n = int(TOPIC_OVERRIDE)
        except (TypeError, ValueError):
            n = None
        if n is not None and 1 <= n <= len(TOPICS):
            idx = n - 1
            pinned = True
        else:
            print("  Safety conversation: TOPIC_OVERRIDE is {!r} - it has "
                  "to be a whole number from 1 to {}. Ignoring it and "
                  "following the date.".format(TOPIC_OVERRIDE, len(TOPICS)))
    n, title, body, takeaway, rule = TOPICS[idx]
    return {"n": n, "title": title, "body": body, "takeaway": takeaway,
            "rule": rule, "pinned": pinned, "day": idx + 1,
            "of": len(TOPICS), "date": d}


def _esc(s):
    return (str(s or "").replace("&", "&amp;")
            .replace("<", "&lt;").replace(">", "&gt;"))


def _tag(t):
    """The one label the report, the email and the plain text all use, so
    a pinned topic can never read "Pinned" on the PDF and "Topic 9 of 20"
    in the email that carries it."""
    return ("Pinned" if t["pinned"]
            else "Topic {} of {}".format(t["day"], t["of"]))


def panel_html(on=None, compact=False):
    """The conversation block for a paged report (dark Coates panel)."""
    t = topic_for(on)
    tag = _tag(t)
    if compact:
        return (
            "<div style=\"border-left:4px solid {o};background:#171B22;"
            "padding:10px 14px;margin:10px 0;border-radius:0 8px 8px 0\">"
            "<div style=\"font-size:7.5pt;letter-spacing:2px;color:{o};"
            "font-weight:800;text-transform:uppercase\">"
            "Today's safety conversation &middot; {tag}</div>"
            "<div style=\"font-size:11pt;color:#fff;font-weight:700;"
            "margin:3px 0 4px\">{n}. {title}</div>"
            "<div style=\"font-size:9pt;color:#D7DBE2;line-height:1.6\">"
            "<b style=\"color:{o}\">{take}</b></div></div>"
        ).format(o=ORANGE, tag=tag, n=t["n"], title=_esc(t["title"]),
                 take=_esc(t["takeaway"]))

    return (
        "<div style=\"border-left:4px solid {o};background:#171B22;"
        "padding:14px 18px;margin:10px 0 4px;border-radius:0 10px 10px 0\">"
        "<div style=\"display:flex;justify-content:space-between;"
        "align-items:baseline\">"
        "<div style=\"font-size:8pt;letter-spacing:2px;color:{o};"
        "font-weight:800;text-transform:uppercase\">"
        "Today's safety conversation</div>"
        "<div style=\"font-size:8pt;color:#8B9099;letter-spacing:1px;"
        "text-transform:uppercase\">{tag}</div></div>"
        "<div style=\"font-size:14pt;color:#fff;font-weight:700;"
        "margin:6px 0 8px\">{n}. {title}</div>"
        "<div style=\"font-size:9.5pt;color:#D7DBE2;line-height:1.75\">"
        "{body}</div>"
        "<div style=\"margin-top:10px;padding-top:9px;"
        "border-top:1px solid #2A313C;font-size:10pt;color:{o};"
        "font-weight:700;line-height:1.6\">{take}</div>"
        "<div style=\"margin-top:7px;font-size:8pt;color:#8B9099\">"
        "Supports Coates Life Saving Rules (SEQ-GL-009) &middot; "
        "<b style=\"color:#A9B1BD\">{rule}</b></div></div>"
    ).format(o=ORANGE, tag=tag, n=t["n"], title=_esc(t["title"]),
             body=_esc(t["body"]), take=_esc(t["takeaway"]),
             rule=_esc(t["rule"]))


def email_html(on=None):
    """Outlook-safe version - tables and inline styles only."""
    t = topic_for(on)
    return (
        "<table role='presentation' cellpadding='0' cellspacing='0' "
        "border='0' width='100%' style='margin:14px 0'>"
        "<tr><td style='border-left:4px solid {o};background:#F7F8FA;"
        "padding:12px 16px;font-family:Segoe UI,Arial,sans-serif'>"
        "<div style='font-size:11px;letter-spacing:2px;color:{o};"
        "font-weight:bold;text-transform:uppercase'>"
        "Today's safety conversation &middot; {tag}</div>"
        "<div style='font-size:16px;color:#1D1D1B;font-weight:bold;"
        "margin:5px 0 7px'>{title}</div>"
        "<div style='font-size:13px;color:#3A3F47;line-height:1.65'>"
        "{body}</div>"
        "<div style='margin-top:10px;font-size:14px;color:{o};"
        "font-weight:bold;line-height:1.55'>{take}</div>"
        "<div style='margin-top:7px;font-size:11px;color:#7A8089'>"
        "Supports Coates Life Saving Rules (SEQ-GL-009) &middot; {rule}"
        "</div></td></tr></table>"
    ).format(o=ORANGE, tag=_tag(t), title=_esc(t["title"]),
             body=_esc(t["body"]), take=_esc(t["takeaway"]),
             rule=_esc(t["rule"]))


def plain_text(on=None):
    t = topic_for(on)
    return ("TODAY'S SAFETY CONVERSATION - {tag}\n"
            "{n}. {title}\n\n{body}\n\n{take}\n\n"
            "Supports Coates Life Saving Rules (SEQ-GL-009) - {rule}").format(
        tag=_tag(t), n=t["n"], title=t["title"], body=t["body"],
        take=t["takeaway"], rule=t["rule"])


if __name__ == "__main__":
    import sys
    d = _dt.date.today()
    if len(sys.argv) > 1:
        d = _dt.datetime.strptime(sys.argv[1], "%Y-%m-%d").date()
    print(plain_text(d))
    print()
    print("Next fortnight:")
    for i in range(14):
        dd = d + _dt.timedelta(days=i)
        t = topic_for(dd)
        print("  {}  {:2d}. {}".format(dd.strftime("%d %b %Y"), t["n"],
                                       t["title"]))
