# Author: Andrew Fisher. Shared approved weather cards; native Demob reference evidence.
from pathlib import Path
import re
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep


def patch(html):
    if 'demob-weather996-source' in html:
        raise ValueError('Demob weather v9.96 already applied')
    if 'demob994-style' not in html or 'root.BuildCards984=' not in html:
        raise ValueError('Demob weather v9.96 requires the v9.94 approved card/flow base')
    html = rep(html, 'root.BuildCards984={html,begin,mount,weather,refreshWeather,sync,reading,progressForDate:jobAtDate,',
               'root.BuildCards984={html,begin,mount,weather,refreshWeather,sync,reading,progressForDate:jobAtDate,visuals996:{sky,foreground,weatherHtml},',
               'Share existing weather artwork without duplicating or changing Build rendering', 'demob996')
    html = rep(html, 'root.BuildCardData984 = {create, day(iso, today, dayObj)',
               'root.BuildCardData984 = {create, ruleForDate996(iso){return ruleReading(iso,nativeDependencies());}, day(iso, today, dayObj)',
               'Reuse the existing daily Life Saving Rule selection', 'demob996')
    # The exact same CSS and embedded transparent stamp serve both approved card surfaces.
    for ident in ('past984-style', 'work986-style'):
        found = re.findall(r'(<style id="' + re.escape(ident) + r'">)([\s\S]*?)(</style>)', html)
        if len(found) != 1:
            raise ValueError('Expected one shared card style: ' + ident)
        start, css, end = found[0]
        shared = css.replace('#pane-timeline', ':is(#pane-timeline,#pane-demob)')
        html = rep(html, start + css + end, start + shared + end, 'Share approved ' + ident, 'demob996')
    html = rep(html, 'const M = demob816(), sel = demobSel816(M), C = M.counts, Dy = M.day[sel];',
               'const M = demob816(), sel = demobSel816(M), C = window.DemobProgress996?.summary ? DemobProgress996.summary(M) : M.counts, Dy = M.day[sel];',
               'Native summary uses the same positive-reference scope as cards', 'demob996')
    html = rep(html, '<p class="ctk">To come off site</p><b>${C.total}</b><span>references</span>',
               '<p class="ctk">Demob scope</p><b>${C.total}</b><span>positive-quantity refs</span>',
               'Name reference programme scope rather than imply all remain on site', 'demob996')
    html = rep(html, 'function setLight(key, state){', 'function setLight(key, state, collection996){',
               'Optional typed collection intent preserves every ordinary light caller', 'demob996')
    html = rep(html, "const who = whoAmI(); if (!who) return false;\n S.delivery = S.delivery || {};\n const d = S.delivery[key] || (S.delivery[key] = {});\n const now = new Date().toISOString();\nd.state = state; d.set_at = now; d.by = who;",
               "const who = whoAmI(); if (!who) return false;\n if (collection996) {\n const checked = DemobCollection996.validate(key, collection996);\n if (!checked.ok) { flash(checked.message); return false; }\n collection996 = checked.value;\n if (!checked.complete) return DemobCollection996.partial(key, collection996, who);\n }\n S.delivery = S.delivery || {};\n const d = S.delivery[key] || (S.delivery[key] = {});\n const now = new Date().toISOString();\nd.state = state; d.set_at = now; d.by = who;",
               'Revalidate collection atomically; partial pickup preserves the native on-site state', 'demob996')
    html = rep(html, "d.history = (d.history || []).concat([{state, at: now, by: who}]).slice(-400);",
               "d.history = (d.history || []).concat([{state, at: now, by: who, ...(collection996 ? {collection996} : {})}]).slice(-400);",
               'Persist collection quantities and provenance in the same native history entry', 'demob996')
    html = rep(html, "function collect816(key){\n\tif (!mayWrite('a pick-up')) return false;\n\tif (!emptyGate816(key, 'in transit', true)) return false;\n\treturn setLight(key, 'in transit');\n}",
               "function collect816(key){ return DemobCollection996.open(key); }",
               'Explicit actual date and quantities before the existing collection action', 'demob996')
    css = (HERE / 'cards996.css').read_text()
    scripts = '\n'.join((HERE / name).read_text() for name in ('model996.js', 'cards996.js', 'collection996.js'))
    html = rep(html, '</head>\n<body', '<style id="demob-weather996-style">' + css + '</style>\n</head>\n<body',
               'Adapt Demob accents and retain the single native staff editor', 'demob996')
    return rep(html, '</body>\n</html>', '<script id="demob-weather996-source">\n' + scripts + '\n</script>\n</body>\n</html>',
               'Demob weather and reference collection evidence adapter', 'demob996')
