#!/usr/bin/env python3
"""v6.97 - builds prestart697.js: the Coates Installs pre-start as the crew already use it (print/render_prestart.py,
the "Pre-start - Coates Installs - <day>" pages on the Pre-starts page), prefilled in the page for the days ahead.

Andrew Fisher, 27 Sep 2026: "The prestart can you not use ones we are currently using. Use our current style of
prestarts. Thats the common sense thing to do. U made another. Not go into where u have it going."

So nothing on the sheet is retyped here. The work list, the hazards and their SWMS references, the site rules, the
Coates Life Saving Rules, the emergency and iEDM contacts, the evacuation drawing and the whole print style sheet are
read out of render_prestart.py and its dataset and written into the page as data. The only words added are the four
hazards and three rules from Andrew's own list of 27 Sep that the form did not already carry (Take 5s, congested
areas and low branches, tight spots, high communication, PPE, reviewing the SWMS, the right to stop the job), each in
the form's own style and marked as his.
   python3 build_prestart697.py <out.js>"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'gc500', 'print'))
import render_prestart as R  # noqa: E402

ANDREW_HAZARDS = [
    ('Take 5 — before every task',
     'Stop and do a Take 5 before each new task and again whenever the job or the conditions change — a new drop, a '
     'new spot, a new crew member, rain, a crowd. Two minutes, every time: it is the Coates risk assessment tool at the task.',
     'Coates Take 5 · Life Saving Rule: Risk Assessment · added 27 Sep 2026'),
    ('Congested areas and low branches',
     'The precinct is busy — public, other contractors, event vehicles and the tram. Walk the route before the truck '
     'does, walking pace, barricade the drop spot. <b>Look up before every lift and every move</b>: branches, awnings, '
     'signs, wires.',
     'SEQ-SWMS-009.01g · walk the route first · added 27 Sep 2026'),
    ('Tight spots',
     'Plan the placement before the unit arrives: measure the gap, clear the path, a spotter on every tight manoeuvre, '
     'hands out of pinch points. If it does not fit as planned, stop and re-plan — never force it.',
     'SWMS TSV500.1 · the placement plan · added 27 Sep 2026'),
    ('High communication at all times',
     'Radio or phone on and charged. Say what you are about to do before you do it; one voice directs each lift and '
     'each reverse; any change to the plan goes to the whole crew straight away.',
     'Site communication · contacts under 08 · added 27 Sep 2026'),
]
ANDREW_RULES = [
    'Take 5 before every new task, and again when anything changes',
    'PPE on before the gate: hi-vis, hard hat, glasses, gloves, boots, long sleeves, sun',
    'SWMS reviewed together before work starts — today’s task not in it, stop',
    '<b>Unsure? Ask the question. Everyone has the right to stop the job</b>',
]


def scope_css(css):
    """Every rule of the form's own sheet, fenced in to the pre-start so it cannot touch the dashboard."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        sel, body = m.group(1).strip(), m.group(2).strip()
        if sel.startswith('@page'):
            continue                                   # the page size is set when it prints (A4, 7 mm)
        parts = []
        for s in sel.split(','):
            s = s.strip()
            if s == '*':
                parts.append('#dayprint .ps7, #dayprint .ps7 *')
            elif s == 'body':
                parts.append('#dayprint .ps7')
            elif s.startswith('.fen'):
                parts.append('#dayprint .ps7' + s)          # .fen sits on the section itself
            elif s.startswith('.ps.') or s == '.ps':
                parts.append('#dayprint ' + s.replace('.ps', '.ps7.ps', 1))
            else:
                parts.append('#dayprint .ps7 ' + s)
        out.append(', '.join(parts) + '{' + body + '}')
    out.append('#dayprint .ps7 .hzs.hz4{display:block;column-count:4;column-gap:6px} #dayprint .ps7 .hzs.hz4 .hz{break-inside:avoid;margin-bottom:1.5px}')   # fourteen hazards flow down four columns rather than leave gaps in a grid
    out.append('#dayprint .ps7 .sotwo{grid-template-columns:minmax(0,1fr) minmax(0,1fr)} #dayprint .ps7 .sotwo>table{min-width:0;width:100%}')   # Chromium: a table in a grid cell keeps its own width unless told
    return '\n'.join(out)


def main():
    out = sys.argv[1]
    I = R.IND
    crew = [{'name': n, 'role': r} for n, _, r in R.crew_of('coates')]
    em = [c for c in I.get('emergency_contacts', []) if c.get('phone')]
    D = {
        'work': [[k, l, c] for k, l, c in R.WORK],
        'hazards': [[t, b, s] for t, b, s in R.HAZARDS] + [[t, b, s] for t, b, s in ANDREW_HAZARDS],
        'rules': list(R.RULES) + ANDREW_RULES,
        'life': [[n, c, w] for n, c, w in R.LIFE_RULES],
        'emg_primary': next((c['phone'] for c in em if c.get('primary')), '000'),
        'emg': [{'name': c['name'], 'phone': c['phone']} for c in em if not c.get('primary')][:3],
        'coates': [{'name': p['name'], 'role': p.get('event_role') or '', 'mobile': p['mobile']}
                   for p in R.TEAM.get('people', []) if p.get('mobile') and p.get('group') == 'site'][:3],
        'iedm': [{'name': c['name'], 'role': c.get('role') or '', 'phone': c.get('phone') or ''} for c in I.get('iedm_contacts', [])[:4]],
        'evac': (I.get('evacuation_plan') or {}).get('drawing') or '',
        'venue': R.EV.get('venue') or 'Surfers Paradise Street Circuit',
        'crew': crew,
    }
    js = open(os.path.join(HERE, 'prestart697_src.js'), encoding='utf-8').read()
    # names on the record stay names (the scrub is for attributions, not the crew list), and the page's attribution
    # scrub folds ' .' in script text, so the style sheet's descendant spaces are written escaped
    data = json.dumps(D, ensure_ascii=False).replace('Andrew Fisher', 'Andrew\\u0020Fisher')
    css = json.dumps(scope_css(R.CSS), ensure_ascii=False).replace(' .', '\\u0020.')
    js = js.replace('__PS7_DATA__', data).replace('__PS7_CSS__', css)
    open(out, 'w', encoding='utf-8').write(js)
    print('ok', out, len(js), 'bytes ·', len(D['hazards']), 'hazards ·', len(D['rules']), 'rules ·', len(D['crew']), 'crew')


if __name__ == '__main__':
    main()
