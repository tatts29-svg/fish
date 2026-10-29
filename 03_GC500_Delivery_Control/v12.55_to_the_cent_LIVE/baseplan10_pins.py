"""Author: Andrew Fisher. Baseplan (10)'s own figure, to the cent, on every contract line it prices differently from
the site rule - WB02 (9972648/3) excepted, where Baseplan is under the site record and the branch is asked to fix it.

Andrew, 29 Oct 2026: "Baseplan is what will invoice ... What is on baseplan is what will charge." The page's existing
pin table (BP12429, struck against Baseplan (8) on 28 Oct) is re-struck against Baseplan (10) of 29 Oct 14:31 AEST.
"""

# contract|line -> Baseplan (10) prebill amount, AUD ex GST
PINS = {
    # 9961265 VMS boards (STPS): the four 7 Sep boards termed 28 Oct, the three to 13 Nov on Baseplan's inclusive
    # count, the day-rate boards on Baseplan's count, the four post-event boards at Baseplan's flat 428.94, the
    # labour and transport lines at 20 boards and 40 legs
    "9961265|1": 857.76, "9961265|3": 2734.11, "9961265|4": 3645.48, "9961265|5": 2787.72, "9961265|6": 3645.48,
    "9961265|7": 3645.48, "9961265|8": 2734.11, "9961265|9": 2787.72, "9961265|12": 1072.20, "9961265|13": 1072.20,
    "9961265|16": 589.71, "9961265|24": 428.88, "9961265|25": 428.88, "9961265|26": 428.88, "9961265|28": 268.05,
    "9961265|29": 268.05, "9961265|30": 268.05, "9961265|31": 268.05, "9961265|32": 428.94, "9961265|34": 428.88,
    "9961265|35": 428.94, "9961265|37": 428.94, "9961265|39": 428.94, "9961265|40": 3539.40, "9961265|41": 6000.00,
    "9961265|43": 375.27,
    # 9961976 generators, forklifts, light towers (NVAC): unchanged from the 28 Oct pins, all equal to Baseplan (10)
    "9961976|1": 643.3, "9961976|2": 643.3, "9961976|3": 643.3, "9961976|4": 643.3, "9961976|5": 643.3,
    "9961976|6": 6260.4, "9961976|7": 1254.5, "9961976|9": 2412.54, "9961976|10": 1132.28, "9961976|11": 2187.36,
    "9961976|14": 919.97, "9961976|15": 1142.96, "9961976|16": 1544.0, "9961976|18": 855.63, "9961976|19": 385.98,
    "9961976|20": 385.98, "9961976|37": 0, "9961976|38": 868.5, "9961976|44": 1406.72, "9961976|48": 1168.72,
    "9961976|49": 984.33, "9961976|51": 3302.42, "9961976|52": 333.12, "9961976|58": 1275.96, "9961976|60": 333.12,
    # 9972648 water barriers (STPS): Baseplan's inclusive day count; WB02 (/3) is not pinned
    "9972648|4": 169.92, "9972648|5": 184.08, "9972648|6": 920.40, "9972648|16": 920.40, "9972648|17": 521.56,
    "9972648|18": 4.72,
    # 9987005 forklifts (MEAD): the 2.5 t rough terrain billed to 30 Oct
    "9987005|1": 3600.0, "9987005|2": 480.0, "9987005|7": 3337.20,
    # 9992300 access (MEAD): the booms at Baseplan's five days
    "9992300|3": 270.6, "9992300|4": 1672.64, "9992300|5": 1554.75, "9992300|6": 531.3, "9992300|12": 1554.75,
    # 9994248 (STPS): the contract the page did not carry
    "9994248|1": 612.50, "9994248|2": 630.00, "9994248|3": 52.80, "9994248|4": 250.00, "9994248|5": 250.00,
    # 9997710 (STPS)
    "9997710|1": 207.36, "9997710|2": 1349.28, "9997710|3": 225.30,
    # the seven-digit contracts and consumables, unchanged from the 28 Oct pins
    "10000484|1": 984.12, "10000484|2": 950.0, "10000475|1": 2296.28, "10000523|2": 450.34, "10000523|11": 500.0,
    "10000523|1": 3721.92, "10000523|4": 5796.0, "10000523|6": 2801.4, "10000523|8": 357.42,
    "10000506|1": 4647.5, "10000506|2": 2076.9,
}

OLD_BASIS = "'Baseplan (8) charges this line ' + money(y12429.amount) + ' (per day where it is hired by the day) - Andrew, 28 Oct 2026'"
NEW_BASIS = "'Baseplan (10) charges this line ' + money(y12429.amount) + ' (per day where it is hired by the day) - Andrew, 29 Oct 2026'"


def literal():
    """The replacement for the page's `const BP12429 = {...};` literal, one entry per line."""
    body = ', '.join('"%s": %s' % (k, ('%.2f' % v).rstrip('0').rstrip('.') if v else '0') for k, v in PINS.items())
    return ('const BP12429 = {/* v12.55: Baseplan (10)\'s own figure, to the cent, on every line it prices '
            'differently from the site rule; WB02 9972648/3 excepted (Andrew, 29 Oct 2026) */ ' + body + '};')


def replace_pins(text):
    start = text.find('const BP12429 = {')
    if start < 0 or text.count('const BP12429 = {') != 1:
        raise ValueError('pin table: expected one BP12429 literal')
    end = text.find('};', start)
    if end < 0 or end - start > 4000:
        raise ValueError('pin table: literal end not found where expected')
    old = text[start:end + 2]
    if '9961265|1' not in old or '10000506|2' not in old:
        raise ValueError('pin table: the literal does not look like the 28 Oct pins')
    text = text[:start] + literal() + text[end + 2:]
    if text.count(OLD_BASIS) != 1:
        raise ValueError('pin basis: expected one occurrence')
    return text.replace(OLD_BASIS, NEW_BASIS, 1)
