"""Author: Andrew Fisher. Current team credits; historical sources stay intact."""
from pathlib import Path
import hashlib, json, sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '7562d69c41506d5e7404a52f7f7cb479a5e967c3f6935d567d2a5b845d2992bc'

def patch(text, path='page.html'):
    if 'current team credits v10.92' in text:
        raise ValueError('v10.92 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE:
        raise ValueError('Exact verified v10.91 predecessor required')
    def change(old, new, label):
        nonlocal text
        text = rep(text, old, new, label, path)
    change("' · v10.91'", "' · v10.92'", 'release version')
    change("const ppl = TEAM.people || [], groups = (TEAM.groups || []).filter(g => g.key !== 'other' && g.coates !== false);",
           "/* current team credits v10.92: one current roster, historical TEAM retained. */\n const ppl = AboutContacts1089.current(TEAM.people).filter(p => p.lead || p.group === 'install'), groups = (TEAM.groups || []).filter(g => g.key === 'install');",
           'project lead and installation team')
    change("const first = span(nodes[0]) / 2 / total * 100, last = span(nodes[nodes.length - 1]) / 2 / total * 100;",
           "const first = nodes.length ? span(nodes[0]) / 2 / total * 100 : 0, last = nodes.length ? span(nodes[nodes.length - 1]) / 2 / total * 100 : 0;",
           'safe empty installation roster')
    change("const ppl = (TEAM.people || []).filter(p => p.group === 'install');",
           "const ppl = AboutContacts1089.current(TEAM.people).filter(p => p.group === 'install');",
           'current installation credit cards')
    change("const crew = (TEAM.people || []).filter(p => p.group === 'install').length;",
           "const crew = AboutContacts1089.current(TEAM.people).filter(p => p.group === 'install').length;",
           'consistent fallback crew count')
    change("${TEAM.people.length ? `<div class=\"card hubcard teamhub\" data-go=\"about\">",
           "${AboutContacts1089.current(TEAM.people).length ? `<div class=\"card hubcard teamhub\" data-go=\"about\">",
           'current contact hub visibility')
    change("${TEAM.people.length} on the team", "${AboutContacts1089.current(TEAM.people).length} on the team", 'current contact hub count')
    change("${TEAM.people.filter(p => ['site', 'transport', 'install'].includes(p.group)).map(p => teamPerson(p, {compact: true})).join('')}",
           "${AboutContacts1089.current(TEAM.people).filter(p => ['site', 'transport', 'install'].includes(p.group)).map(p => teamPerson(p, {compact: true})).join('')}",
           'current contact hub list')
    change("+ fine('Event roles as the project manager assigned them for the GC500, from the project record as at ' + fmtDate(TEAM.stated_on || asOf)\n + ' — a roster, not an attendance list, and not the Coates reporting lines. Numbers and addresses as supplied; where one is not shown, none is on the record.');",
           "+ fine('The project manager and installation team running the GC500. Current roster, not an attendance list or the Coates reporting lines. Contact details are shown only where supplied.');",
           'current team credit explanation')
    change("const originalTurns=bcTurns(),originalMap={...bcScenes()},voice=programme(originalTurns,originalMap,ORDER,BC_LOOP);",
           "/* Omit the retired support-credit take from playback only; source audio remains intact. */\nconst originalTurns=bcTurns().filter(t=>t.slot!==21),originalMap={...bcScenes()},voice=programme(originalTurns,originalMap,ORDER,BC_LOOP);",
           'omit retired spoken credit and reconnect programme')
    return text

if __name__ == '__main__':
    src = Path(sys.argv[1]); out = Path(sys.argv[2]) if len(sys.argv)>2 else src
    result = patch(src.read_text(), str(src)); out.write_text(result)
    print(json.dumps({'sha256':hashlib.sha256(result.encode()).hexdigest(),'bytes':len(result.encode())}))
