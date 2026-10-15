"""Author: Andrew Fisher. Loads of 24, as many loads as the day needs, v10.31. Andrew, 16 Oct 2026: "Toilets are all due
in today. Loads of 24." The Event Portables run sheet (v10.00) capped proposed portaloo deliveries at 24 a calendar day
and pushed the rest to the next days, so the 34 still to come read as 24 today, 4 Saturday, 1 Monday and 5 Tuesday. A
load is 24 portaloos (or 6 pee panels and 18 portaloos); a day takes as many loads as it needs. The supplier's own load day
(Event Portables plan v10, 3 Oct, already the page's rule for delivery days) is the proposed day, a day recorded on the
shared record still wins, and every load whose day has passed is proposed for today, packed into loads of 24 in route
order. Nothing is written
to the record; no charge, quantity or date on the record changes. Footer v10.30 -> v10.31.

    python3 patch_v1031.py path/to/page.html   (after patch_v1030.py)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

REPLACEMENTS = [
    ('The rule in its own words', "Proposed outstanding portaloo deliveries: maximum 24 per calendar day.",
     "Proposed outstanding portaloo deliveries: loads of 24, as many loads as the day needs (v10.31, Andrew, 16 Oct 2026: \"Toilets are all due in today. Loads of 24.\")."),
    ('No daily cap: the whole remainder on its day, the loads packed by pack()',
     "const free=Math.max(0,24-(used.get(day)||0));if(!free){day=nextWork(day);continue;}\n const n=Math.min(free,left),numbers=numbered?row.numbers.slice(offset,offset+n):(row.numbers||[]).slice();\n out.push({...row,date:day,sourceDate,remaining:n,numbers,dailyLimit:24});used.set(day,(used.get(day)||0)+n);left-=n;offset+=n;\n if(left)day=nextWork(day);",
     "const n=left,numbers=numbered?row.numbers.slice(offset,offset+n):(row.numbers||[]).slice(); /* v10.31 - a day takes as many loads of 24 as it needs */\n out.push({...row,date:day,sourceDate,remaining:n,numbers,dailyLimit:24});used.set(day,(used.get(day)||0)+n);left-=n;offset+=n;"),
    ('The supplier\'s own load day is the proposed day; a day recorded on the shared record still wins',
     "const target=changed?row.movedDate:sourceDate?(sourceDate===part.sourceDate?part.date:sourceDate>part.date?sourceDate:part.date):'';",
     "const target=changed?row.movedDate:(date(part.date)?part.date:sourceDate||''); /* v10.31 - the supplier's load day is the page's planned delivery day (the 7 Oct plan reading); the later schedule date no longer delays the proposal; an overdue load is proposed for today */"),
    ('The PDF footer says loads, not a daily maximum', "Maximum 24 portaloos per day", "Loads of 24 portaloos, as many loads as the day needs"),
    ('Release footer', "+ ' · v10.30'", "+ ' · v10.31'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'as many loads as the day needs' in html: sys.exit('patch_v1031 refuses a repeat')
    if "+ ' · v10.30'" not in html: sys.exit('patch_v1031: not the v10.30 line - wrong base (apply patch_v1030.py first)')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1031 applied: loads of 24, as many loads as the day needs; footer v10.30 -> v10.31')


if __name__ == '__main__':
    main()
