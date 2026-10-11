# Author: Andrew Fisher. Display and print/email selection only; no regrouping or record changes.
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def patch(html):
    if 'demob994-style' in html:
        raise ValueError('Demob scope v9.94 already applied')
    html = rep(html,
        '<div class="dmbody816">${body}</div>',
        '<div class="dmbody816">${[\'toilets\',\'pump\'].includes(DM816.view) ? `<p class="demob994-scope"><b>All branches</b><span>${DM816.view === \'toilets\' ? \'Complete toilet loads\' : \'Pump-outs for this day and the next demob day\'}</span></p>` : \'\'}${body}</div>',
        'Show the actual all-branch scope of toilet and pump-out views', 'demob994')
    html = rep(html,
        '<button type="button" class="btn" data-print816="day">Print run sheets · ${T.length}</button>',
        '<button type="button" class="btn" data-print816="day">Print ${br === \'all\' ? \'all branches\' : esc(br)} · ${T.length} run sheet${T.length === 1 ? \'\' : \'s\'}</button>',
        'State the selected branch scope on the day print action', 'demob994')
    html = rep(html,
        "pane.querySelectorAll('[data-print816]').forEach(b => b.onclick = () => printDay816(DM816.sel, DM816.branch, b.dataset.print816, b.dataset.load816 || Number(b.dataset.truck816 || 0)));",
        "pane.querySelectorAll('[data-print816]').forEach(b => b.onclick = () => printDay816(DM816.sel, b.dataset.print816 === 'load' ? 'all' : DM816.branch, b.dataset.print816, b.dataset.load816 || Number(b.dataset.truck816 || 0)));",
        'A visible whole toilet load prints that exact load regardless of branch filter', 'demob994')
    html = rep(html,
        'const Ls = Dy.loads.filter(Ld => Ld.stream === s);',
        'const Ls = T.filter(Ld => Ld.toilet && Ld.toilet.stream === s).map(Ld => Ld.toilet);',
        'Branch email uses the same complete toilet loads as branch truck/print selection', 'demob994')
    return rep(html, '</head>\n<body', '<style id="demob994-style">' +
               (HERE / 'demob994.css').read_text() + '</style>\n</head>\n<body',
               'Compact Demob scope label', 'demob994')
