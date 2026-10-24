"""Author: Andrew Fisher. v11.94 - Costs: the P&L all in.

Andrew, 25 Oct 2026 (this chat): "costs sorted. P&L sorted. Clean and tidy. All costs should be all in. We should know how much.
Including demob. Apart from fencing. Should be simple. Whats the additional forecasf. This should be 0 ... Only thing we wont
know. Is fencing"; and "We now have amanagrmnt looking".
  pl1194_src.js + pl1194.css: the P&L card (pl770Card, outermost wrapper) shows each line's job total all in and, beside it,
  the one estimate still to come - fencing's remaining programme (cj764Model().fencing) - with every other line nil; what is
  not in it yet is named in one line from the cost gaps. Every figure comes from pl770Model, cj764Model and branchFinancial978,
  unchanged; if the lines do not tie to the cent the card is left as it was.
  pnl-clarity981 normaliseLabels: across Costs "Additional forecast" / "Still to come" read "Rest of the job" and "Job
  forecast" / "To job end" read "Job total".
  Footer -> v11.94. No record, rate, servicing, crew card, QR code or server change.

    python3 patch_v1194.py page.html      (in place, on the live v11.93 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = 'e49bca1a706ee7297f9f05ac04d0e91cbbbfcffdc216e8e1e8d1fb1326ff6ea3'
ANCHOR = '<script id="steady1143-script">'
MAP1_OLD = "    'Still to come': 'Additional forecast', 'To job end': 'Job forecast', 'Of which to date': 'Current record',"
MAP1_NEW = ("    'Still to come': 'Rest of the job', 'To job end': 'Job total', 'Of which to date': 'Current record',"
            " 'Additional forecast': 'Rest of the job', 'Job forecast': 'Job total', 'Still to come — forecast': 'Rest of the job', /* v11.94 - all in */")
MAP2_OLD = "    'Charged so far': 'Current record', 'Forecast to job end': 'Job forecast'};"
MAP2_NEW = "    'Charged so far': 'Current record', 'Forecast to job end': 'Job total'};"


def patch(html):
    if 'pl1194-script' in html: raise ValueError('v11.94 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.94 (expected v11.93 e49bca1a...)')
    for need in ('today1193-script', 'pnl-clarity981-script', 'function pl770Card(){', 'pl770Card = function () {', 'function pl770Model(){',
                 'function cj764Model(){', 'function branchFinancial978', 'function pl752Rows', 'function moneySummary', MAP1_OLD, MAP2_OLD):
        if need not in html: raise ValueError('the page has no %r' % need)
    for once in (MAP1_OLD, MAP2_OLD, 'pl770Card = function () {'):
        if html.count(once) != 1: raise ValueError('%r must be there exactly once' % once[:60])
    if html.index('pl770Card = function () {') > html.index(ANCHOR): raise ValueError('the P&L card wrapper must load before the anchor')
    src = (HERE / 'pl1194_src.js').read_text(encoding='utf-8')
    css = (HERE / 'pl1194.css').read_text(encoding='utf-8')
    if '</script' in src.lower() or '</style' in css.lower(): raise ValueError('source would close its own tag')
    html = rep(html, MAP1_OLD, MAP1_NEW, 'Costs labels: rest of the job, job total', 'page')
    html = rep(html, MAP2_OLD, MAP2_NEW, 'Costs labels: job total', 'page')
    block = '<style id="pl1194-style">\n' + css + '</style>\n<script id="pl1194-script">\n' + src + '\n</script>\n' + ANCHOR
    html = rep(html, ANCHOR, block, 'P&L all in', 'page')
    return rep(html, "+' · v11.93'; /* v8.19 release922", "+' · v11.94'; /* v8.19 release922", 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.94 P&L all in applied')
