# Author: Andrew Fisher. Dated site confirmation; preserve programme, docket and financial quantities.
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


LABEL_REPLACEMENTS = [
    ("' confirmed behind'", "' with programme/docket differences'"),
    ("' behind the selected-day plan'", "' not yet docketed against the selected-day programme'"),
    ("' confirmed behind the installation plan'", "' with programme/docket differences'"),
    ("' ahead; the rest on plan'", "' docketed above programme quantities; the rest match'"),
    ("'Work types on the installation plan'", "'Docketed quantities match the dated programme'"),
    ("'behind — week ended, metres still on the plan'", "'not yet docketed — ended-week programme quantity'"),
    (' is behind the programme — weeks that ended with metres still on the plan; Advanced to confirm)',
     ' relates to ended-week programme quantities not yet docketed; matching and scope need review)'),
    (' is behind the programme — Advanced to confirm)',
     ' relates to ended-week programme quantities not yet docketed; matching and scope need review)'),
    (" at the card) behind the programme — ${F.behind.join(', ')} ended with metres still on the plan; Advanced to confirm",
     " at the card) for programme/docket differences — ${F.behind.join(', ')}; matching and scope need review"),
    ("${w.prog || w.week} ${w.past ? 'behind' : w.state}",
     "${w.prog || w.week} ${w.past ? 'not yet docketed' : w.state}"),
    (" is BEHIND THE PROGRAMME: ${F.behind.join(', ')} ended with metres still on the plan and no docket for them — still to do, or done and docketed under another week; Advanced to confirm",
     " relates to programme/docket differences: ${F.behind.join(', ')}; quantities may be recorded under another week or reflect changed scope — reconciliation required"),
    ("Fencing behind the programme: ${F.behind.join(', ')} ended with metres still on the plan",
     "Fencing programme/docket differences: ${F.behind.join(', ')} — programme quantities not yet docketed"),
    ('carried as still to come until Advanced say whether it was done under another week or dropped',
     'retained in forecast pending docket matching and scope review; this is not a crew-delay finding'),
    (' behind the programme — ended weeks with metres still on the plan)',
     ' for ended-week programme quantities not yet docketed)'),
    ('Behind the programme by type</span>', 'Programme/docket differences by type</span>'),
    ('Early work on one type never makes up for a type behind.',
     'Each type is compared separately; a programme/docket difference does not establish a crew delay.'),
    ("' · behind by type: '", "' · programme/docket differences by type: '"),
    ("P.fenceLines.length ? (fencePending847 ? (fenceOk ? 'CCB categories need review' : 'behind · CCB categories need review') : fenceOk ? 'on track' : 'behind') : 'nothing planned yet'",
     "P.fenceLines.length ? (fencePending847 ? (fenceOk ? 'CCB categories need review' : 'Programme/docket difference · CCB categories need review') : fenceOk ? 'Docket quantities meet dated programme' : 'Programme/docket difference') : 'nothing planned yet'"),
    ('<th class="num">Planned to date</th><th class="num">Done</th><th class="num">Behind by</th>',
     '<th class="num">Planned to date</th><th class="num">Docketed</th><th class="num">Not yet docketed</th>'),
]


def presentation_labels(html):
    """Only display strings change here: executable tokens and quantities are retained."""
    for name, next_name, plan_name in [
        ('todayWorkSummary842', 'todayTypeMetrics843', 'Build'),
        ('todayWorkSummary847', 'fenceCcbBadge847', 'installation'),
        ('todayWorkSummary848', 'todayLinkedFencing848', 'installation'),
    ]:
        start, end = html.index('function ' + name + '('), html.index('function ' + next_name + '(')
        original = html[start:end]
        changed = rep(original,
            "(plan.delta < 0 ? ' behind' : ' ahead of') + ' " + plan_name + " plan'",
            "(plan.delta < 0 ? ' not yet docketed against' : ' docketed above') + ' dated programme'",
            name + ' quantity comparison', 'fencing994')
        changed = rep(changed, "'On " + plan_name + " plan for this type'", "'Docketed quantity matches the dated programme'",
            name + ' matching quantity', 'fencing994')
        changed = rep(changed,
            "(plan.delta < 0 ? ' behind' : ' ahead of') + ' current dated " + plan_name + " plan'",
            "(plan.delta < 0 ? ' not yet docketed against' : ' docketed above') + ' current dated programme'",
            name + ' provisional comparison', 'fencing994')
        changed = rep(changed, "'matches current dated " + plan_name + " plan'", "'docketed quantity matches current dated programme'",
            name + ' provisional matching quantity', 'fencing994')
        html = rep(html, original, changed, name + ' presentation only', 'fencing994')
    for index, (old, new) in enumerate(LABEL_REPLACEMENTS):
        html = rep(html, old, new, 'Fencing comparison wording ' + str(index + 1), 'fencing994')
    return html


def patch(html):
    if 'function fencingReview994()' in html:
        raise ValueError('Fencing presentation v9.94 already applied')
    html = presentation_labels(html)
    html = rep(html, 'function cwReds(){', (HERE / 'fencing994.js').read_text() + '\nfunction cwReds(){',
               'Read-only fencing comparison and dated site evidence', 'fencing994')
    old = '''/* v6.74 (DATA-09) - a fencing type behind the programme is red on its own, whatever the other types did early */
fenceGapsOf(fenceCcbDisplayTypes847(P)).forEach(g => out.push({
 what: `Fencing behind the 2026 programme — ${esc(fenceGapName(g))}: ${esc(fmtNum(g.done))} of ${esc(fmtNum(g.planned))}${g.unit === 'm' ? ' m' : ''} due by today`,
 cause: null, action: null, owner: null, when: null, pillar: 'Operations', go: () => go('fencing') /* v8.05 */}));'''
    html = rep(html, old, '/* Aggregate programme/docket differences are shown in More info; they do not prove a crew delay. */',
               'Stop inferring fencing crew delay from quantity differences', 'fencing994')
    html = rep(html,
               " ['Breakdowns open', `${fmtNum(allBreakdowns().filter(b => b.open).length)} of ${fmtNum(allBreakdowns().length)} recorded`]],",
               " ['Breakdowns open', `${fmtNum(allBreakdowns().filter(b => b.open).length)} of ${fmtNum(allBreakdowns().length)} recorded`],\n ['Fencing programme', 'On track · confirmed 12 Oct 2026']],",
               'One dated fencing confirmation in Operations', 'fencing994')
    html = rep(html,
               '<table class="cwpt"><tbody>${p.rows.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join(\'\')}</tbody></table>',
               '<table class="cwpt"><tbody>${p.rows.map(r => `<tr><td>${esc(r[0])}</td><td><b${p.k === \'O\' && r[0] === \'Fencing programme\' ? \' class="fencing994-status"\' : \'\'}>${esc(r[1])}</b></td></tr>`).join(\'\')}</tbody></table>',
               'Style only the dated fencing status', 'fencing994')
    html = rep(html,
               ' <p class="sub">The four pillars, on this job. They only work together — a green Operations column on the back of an unpriced Financials one is not a job going well.</p>\n <div class="cwp">',
               ' <div class="cwp">',
               'Retain pillar explanation once inside the native More info', 'fencing994')
    html = rep(html,
               " </div>`).join('')}</div>\n </div>\n\n <div class=\"card cwc\"><h3>The third ring — the scorecard, and what is red</h3>",
               " </div>`).join('')}</div>\n ${fencingComparisonHtml994()}\n </div>\n\n <div class=\"card cwc\"><h3>The third ring — the scorecard, and what is red</h3>",
               'Keep original quantity comparison available without a delay verdict', 'fencing994')
    html = rep(html,
               'No open breakdown recorded, no overdue reference, no variance without authority and no fencing type behind the programme.',
               'No open breakdown recorded, no overdue reference and no variance without authority.',
               'Remove unsupported fencing verdict from empty red-state message', 'fencing994')
    return rep(html, '</head>\n<body', '<style id="fencing994-style">' + (HERE / 'fencing994.css').read_text() +
               '</style>\n</head>\n<body', 'Dated fencing status styles', 'fencing994')
