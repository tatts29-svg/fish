#!/usr/bin/env python3
"""Author: Andrew Fisher. Approved Today instruments, on the verified live base."""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '400bb272d392322ad5a615fa23b83d724d38bc15811b0cde242377b0c5777929'


def require(ok, message):
    if not ok:
        raise ValueError(message)


def between(text, start, end, replacement, label):
    require(text.count(start) == 1 and text.count(end) == 1, label + ': boundaries changed')
    a, b = text.index(start), text.index(end)
    require(a < b, label + ': boundaries reversed')
    return text[:a] + replacement + text[b:]


def build(raw):
    require(hashlib.sha256(raw).hexdigest() == BASE_SHA256, 'Refusing a different live base; rebuild and review the patch')
    text = raw.decode('utf-8')
    require('function todayWorkBoard840(' not in text, 'Today work progress already applied')
    metric = (ROOT / 'work_metrics840_src.js').read_text()
    ui = (ROOT / 'today_work840_src.js').read_text()
    css = (ROOT / 'today_work840_src.css').read_text()
    wrapper = "function renderToday(){ return holdAssets(() => { wwaHome793();const r = renderToday_held(); wwaEmbed793(); pack795(); return r; }); } /* v7.93 */ /* v6.69 - one asset list for the whole draw */"
    updated = "function renderToday(){ const kept840 = TodayWork840.capture(); return holdAssets(() => { wwaHome793(); const r = renderToday_held(); wwaEmbed793(); pack795(); TodayWork840.restore(kept840); return r; }); } /* v8.40 - preserve main scroll and instrument focus across record redraws */"
    text = rep(text, wrapper, metric + '\n\n' + ui + '\n\n' + updated,
               'Today model, instruments and lifecycle', 'v8.40')
    text = rep(text, 'function render(){ const r = holdAssets(renderPass); tblFocusSoon(); return r; }',
               "function render(){ const kept840 = state.tab === 'today' ? TodayWork840.capture() : null; const r = holdAssets(renderPass); tblFocusSoon(); if (kept840) TodayWork840.restore(kept840); return r; } /* v8.40 - restore after capability and layout postprocessing */",
               'Today full-render scroll continuity', 'v8.40')
    start = text.index('function renderToday_held(){')
    end = text.index('/* ------------------------------------------------------------------ map */', start)
    scope = text[start:end]
    scope = between(scope, ' <div class="todaycols">', ' <div class="hubhead">',
                    ' <!-- v8.40: delivery details belong in Timeline. -->\n',
                    'Today delivery brief')
    scope = between(scope, ' <div class="inst">', ' <div class="hub">',
                    ' ${todayWorkBoard840(today)}\n <div class="inst today-work-programme840">${progCard(today)}</div>\n',
                    'Today instruments')
    scope = between(scope, ' <div class="hub">', ' ${TEAM.people.length',
                    ' <div class="hub">\n', 'Today delivery summary cards')
    text = text[:start] + scope + text[end:]
    text = rep(text, 'Today’s work <span>what is due next, what came in today, who to call</span>',
               'Site contacts and controls <span>who to call and the rest of the job</span>',
               'Today supporting section title', 'v8.40')
    text = rep(text, "['Today’s work', T.querySelector(':scope > .sec793')]",
               "['Site contacts', T.querySelector(':scope > .sec793')]",
               'Today supporting jump label', 'v8.40')
    text = rep(text, "if (n === 'Today’s work') return T.querySelector(':scope > .sec793');",
               "if (n === 'Site contacts') return T.querySelector(':scope > .sec793');",
               'Today supporting jump after redraw', 'v8.40')
    text = rep(text, '</head>\n<body>\n<!-- The delivery status instrument', '<style id="today-work-v840">\n' + css + '\n</style>\n</head>\n<body>\n<!-- The delivery status instrument',
               'Scoped Today instrument styles', 'v8.40')
    text = rep(text, '<meta name="gc500-release" content="v8.38">',
               '<meta name="gc500-release" content="v8.40">', 'Release metadata', 'v8.40')
    text = rep(text, "+ ' · v8.38'; /* v8.19 - the footer names the release once */",
               "+ ' · v8.40'; /* v8.19 - the footer names the release once */", 'Release footer', 'v8.40')
    return text.encode('utf-8')


if __name__ == '__main__':
    require(len(sys.argv) == 2, 'Usage: patch_v840.py WORKING_COPY.html')
    path = Path(sys.argv[1])
    path.write_bytes(build(path.read_bytes()))
    print('Today work instruments applied; shared records and native media preserved.')
