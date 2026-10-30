"""Author: Andrew Fisher. Baseplan (11)'s own figure, to the cent, on the contract lines it moved since (10).

Andrew, 30 Oct 2026 15:1x AEST, on the Baseplan (11) review: "Can we match baseplan data on those". The page's pin table
(BP12429, re-struck against Baseplan (10) by v12.55) is re-struck against Baseplan (11) of 30 Oct 14:2x on the nineteen
lines whose amount moved: the VMS contract 9961265 (the construction boards now keyed as fixed amounts, VMS19 487T and
VMS20 475T at nought, VMS22 and VMS23 up, the four post-event boards at 428.88, VMS05a at nought) and the water barriers
9972648 (WB01, WB03 to Baseplan's 19 Oct term, WB04). WB02 (9972648/3) stays unpinned at the site record's 34 days, as
in v12.55: Baseplan's 280.84 is the branch's to fix. Every other pin is unchanged.
"""
import json
import re

# contract|line -> (Baseplan (10) figure the page carries today, Baseplan (11) figure)
CHANGES = {
    "9961265|3": (2734.11, 3538.77), "9961265|4": (3645.48, 3431.54), "9961265|5": (2787.72, 3002.60),
    "9961265|6": (3645.48, 3538.77), "9961265|7": (3645.48, 3538.77), "9961265|8": (2734.11, 3109.83),
    "9961265|9": (2787.72, 3646.01), "9961265|25": (428.88, 0), "9961265|26": (428.88, 0),
    "9961265|29": (268.05, 428.88), "9961265|30": (268.05, 321.66), "9961265|32": (428.94, 428.88),
    "9961265|35": (428.94, 428.88), "9961265|37": (428.94, 428.88), "9961265|39": (428.94, 428.88),
    "9961265|43": (375.27, 0),
    # the two barrier runs the page priced by the site rule until now (their (10) figures equalled the rule): pinned from here
    "9972648|1": (None, 608.88), "9972648|2": (None, 1097.40), "9972648|5": (184.08, 168.74),
}
NET = 409.70  # +807.36 on 9961265, -397.66 on 9972648

OLD_BASIS = "'Baseplan (10) charges this line ' + money(y12429.amount) + ' (per day where it is hired by the day) - Andrew, 29 Oct 2026'"
NEW_BASIS = "'Baseplan (11) charges this line ' + money(y12429.amount) + ' (per day where it is hired by the day) - Andrew, 30 Oct 2026'"
HEAD = 'const BP12429 = {'


def read_pins(text):
    """The page's pin literal as a dict, in order, plus its span."""
    if text.count(HEAD) != 1: raise ValueError('pin table: expected one BP12429 literal')
    start = text.find(HEAD); end = text.find('};', start)
    if end < 0 or end - start > 4000: raise ValueError('pin table: literal end not found where expected')
    body = text[start + len(HEAD):end]
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.S).strip()
    pins = json.loads('{' + body + '}')
    return pins, start, end + 2


def fmt(v):
    return ('%.2f' % v).rstrip('0').rstrip('.') if v else '0'


def literal(pins):
    body = ', '.join('"%s": %s' % (k, fmt(v)) for k, v in pins.items())
    return (HEAD + '/* v12.64: Baseplan (11)\'s own figure, to the cent, on every line it prices differently from the site rule; '
            'WB02 9972648/3 excepted (Andrew, 30 Oct 2026) */ ' + body + '};')


def replace_pins(text):
    pins, start, end = read_pins(text)
    if '9961265|1' not in pins or '10000506|2' not in pins: raise ValueError('pin table: the literal does not look like the v12.55 pins')
    for k, (was, now) in CHANGES.items():
        have = pins.get(k)
        if was is None:
            if have is not None: raise ValueError('pin table: %s is already pinned (%s)' % (k, have))
        elif have is None or abs(have - was) > 0.005:
            raise ValueError('pin table: %s is %s, expected the Baseplan (10) figure %s' % (k, have, was))
        pins[k] = now
    text = text[:start] + literal(pins) + text[end:]
    if text.count(OLD_BASIS) != 1: raise ValueError('pin basis: expected one occurrence')
    return text.replace(OLD_BASIS, NEW_BASIS, 1)
