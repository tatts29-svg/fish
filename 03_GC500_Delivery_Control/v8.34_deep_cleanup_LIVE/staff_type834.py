"""Author: Andrew Fisher. Keep unset employment types out of the CNA forecast bucket."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

START = 'function acc761Model(month){'
MARKER = 'Employment type pending allocation'

def apply_patch(text, path='candidate'):
    if MARKER in text or text.count(START) != 1:
        raise ValueError('Wrong monthly Finance boundary or employment-type patch already present')
    start = text.index(START)
    # The next top-level function bounds this edit; never change running-sheet pay types.
    end = text.index('\nfunction ', start + len(START))
    body = text[start:end]
    changes = [
        (" ['hire', 'cna', 'salary'].forEach(type => {\n const rows = labourRows.filter(r => (r.type === 'hire' ? 'hire' : r.type === 'salary' ? 'salary' : 'cna') === type);",
         " ['hire', 'cna', 'salary', 'unknown'].forEach(type => {\n const rows = labourRows.filter(r => (['hire', 'cna', 'salary'].includes(r.type) ? r.type : 'unknown') === type);",
         'Unknown employment type stays separate'),
        ("const stream = (type === 'hire' ? 'Labour hire' : type === 'salary' ? 'Coates salary allocation' : 'Coates CNA allocation') + ' — '",
         "const stream = (type === 'hire' ? 'Labour hire' : type === 'salary' ? 'Coates salary allocation' : type === 'cna' ? 'Coates CNA allocation' : 'Employment type pending allocation') + ' — '",
         'Unknown classification is visible and keeps the allocation guard'),
        ("row.words = type === 'hire' ? 'Check supplier invoice and any amount already allocated; do not accrue the same cost twice.' : 'Finance to check payroll cost and allocation to Labour Install. A missing rate is unknown cost, not zero; do not repeat an existing allocation.';",
         "row.words = type === 'hire' ? 'Check supplier invoice and any amount already allocated; do not accrue the same cost twice.' : type === 'unknown' ? 'Employment type and pay basis need confirmation before Finance selects payroll or supplier allocation. Unknown cost is not zero; do not repeat an existing allocation.' : 'Finance to check payroll cost and allocation to Labour Install. A missing rate is unknown cost, not zero; do not repeat an existing allocation.';",
         'Do not infer payroll or supplier authority')]
    for old, new, why in changes:
        body = rep(body, old, new, why, path)
    text = text[:start] + body + text[end:]
    text = rep(text,
        "const wd = new Date(String(iso) + 'T00:00:00').getDay(), x = Math.max(0, Number(h) || 0), r2 = n => Math.round(n * 100) / 100, t = runType(type);",
        "const wd = new Date(String(iso) + 'T00:00:00').getDay(), x = Math.max(0, Number(h) || 0), r2 = n => Math.round(n * 100) / 100, t = runType(type);\n if (!t) return {ordinary: null, at_1_5: null, at_2: null, unknownType834: true};",
        'Unknown employment type has no assumed overtime split', path)
    text = rep(text,
        "function runPay(split, rate){ if (rate == null) return null;",
        "function runPay(split, rate){ if (rate == null || !split || split.unknownType834) return null;",
        'A rate alone cannot price an unknown employment type', path)
    for old, new, why in [
        ('the paid hours are split on the Coates CNA rule until a type is chosen.',
         'paid hours remain recorded, but their overtime split and calculated wage stay unpriced until the employment type is confirmed.',
         'Explain the unknown employment-type hold'),
        ('<span class="w" title="no pay rate entered for this person">no rate</span>',
         '<span class="w" title="employment type or pay rate needs confirmation">pay basis pending</span>',
         'Daily unknown pay basis'),
        ("${x.pay ? esc(money(x.pay)) : x.hours ? '<span class=\"w\">no rate</span>' : '—'}",
         "${x.pay ? esc(money(x.pay)) : x.hours ? (x.pay_hours_unrated ? '<span class=\"w\">pay basis pending</span>' : esc(money(x.pay))) : '—'}",
         'Running totals show unknown pay basis and preserve explicit zero rates'),
        ('have no pay rate yet, so no wage is put on them.',
         'need an employment type or pay rate confirmed, so no calculated wage is put on them.',
         'Unpriced hours include missing type as well as rate')]:
        text = rep(text, old, new, why, path)
    return text
