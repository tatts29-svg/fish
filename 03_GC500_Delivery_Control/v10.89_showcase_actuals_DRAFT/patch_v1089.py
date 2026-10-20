"""Author: Andrew Fisher. Exact-base Showcase content refresh; no native record writes.
Usage: patch_v1089.py INPUT [OUTPUT] [--development]
Final publication requires base.json to pin the newly verified live v10.88 page.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
DEV_BASE = 'd18ac8bff7966fd10a4c1ba954a8856b676bd747dfcbd716a5e3354d130f7f76'

def private_contacts_source():
    location = os.environ.get('GC500_ABOUT_CONTACTS_INPUT')
    if not location:
        raise ValueError('GC500_ABOUT_CONTACTS_INPUT must name the approved private contact input')
    file = Path(location).resolve()
    if file.is_relative_to(HERE.parents[1]):
        raise ValueError('Private contact input must stay outside the source checkout')
    raw = file.read_bytes()
    lock = json.loads((HERE/'private_input_lock.json').read_text())
    if hashlib.sha256(raw).hexdigest() != lock['sha256']:
        raise ValueError('Private contact input SHA-256 mismatch')
    data = json.loads(raw)
    people = data.get('people')
    if data.get('schema') != 1 or data.get('source_sha256') != lock['source_sha256'] or not isinstance(people,list) or len(people) != lock['people_count']:
        raise ValueError('Private contact input schema or source identity mismatch')
    seen = set()
    for person in people:
        if not isinstance(person,dict) or set(person)-{'name','event_role','group'}:
            raise ValueError('Only current installation contact fields are permitted')
        name = person.get('name')
        if not isinstance(name,str) or not name.strip() or name.strip().casefold() in seen:
            raise ValueError('Current contact identities must be distinct and nonempty')
        seen.add(name.strip().casefold())
        if person.get('group') != 'install' or person.get('event_role') != 'Installer':
            raise ValueError('Private additions are limited to installation contacts')
    encoded = json.dumps({'people':people},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    source = (HERE/'about_contacts1089.js').read_text()
    marker = 'var ABOUT_CONTACT_INPUT1089 = null;'
    if source.count(marker) != 1:
        raise ValueError('Private contact input marker is missing or duplicated')
    return source.replace(marker, 'var ABOUT_CONTACT_INPUT1089 = '+encoded+';')

def patch(text, path='page.html', development=False):
    if 'id="showcase1089-script"' in text:
        raise ValueError('v10.89 already applied')
    config = {'version':'v10.86','sha256':DEV_BASE} if development else json.loads((HERE/'base.json').read_text())
    if config['version'] != ('v10.86' if development else 'v10.88'):
        raise ValueError('unexpected release base')
    actual = hashlib.sha256(text.encode()).hexdigest()
    if actual != config['sha256']:
        raise ValueError('live base SHA-256 mismatch')
    for marker in ['function todayWorkMetrics840(', 'function todayFencingSummary848(', 'function fenceComponents849(', 'function showScene(']:
        if text.count(marker) != 1:
            raise ValueError('missing or ambiguous prerequisite: '+marker)
    text = rep(text, "function teamCard(){\n if (!TEAM.people.length) return '';",
        private_contacts_source()+"\nfunction teamCard(){\n const currentContacts1089=AboutContacts1089.current(TEAM.people);\n if (!currentContacts1089.length) return '';", 'About contact projection', path)
    text = rep(text, 'TEAM.groups.map(g => { const ps = TEAM.people.filter(p => p.group === g.key); return ps.length ?',
        'TEAM.groups.map(g => { const ps = currentContacts1089.filter(p => p.group === g.key); return ps.length ?',
        'About contact groups omit empty sections', path)
    text = rep(text, "' · "+config['version']+"'", "' · v10.89'", 'Showcase version', path)
    text = rep(text, '</body>\n</html>', '<style id="showcase1089-style">/* Author: Andrew Fisher. Preserve native title/count fitting; keep phone progress text readable and reserve a separate attribution strip. */@media(max-width:699px){#showcase[data-back="circuit3d"] #showBody[data-actuals1089],#showcase[data-back="circuit3d_day"] #showBody[data-actuals1089]{margin-bottom:48px;padding-bottom:calc(var(--u)*1)}#showBody[data-actuals1089] .shrow{font-size:max(12px,calc(var(--u)*1))}#showBody[data-actuals1089] .shrow b{font-size:max(12px,calc(var(--u)*1.5))}#showBody[data-actuals1089] .shof,#showBody[data-actuals1089] .shf{font-size:max(12px,calc(var(--u)*.95))}#showBody[data-actuals1089] .shbig small{display:block;font-size:max(12px,calc(var(--u)*1.5));line-height:1.25;margin:4px 0 0}}</style>\n<script id="showcase1089-script">\n'+(HERE/'showcase1089.js').read_text()+'\n</script>\n</body>\n</html>', 'read-only Showcase actuals', path)
    return text

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path, nargs='?')
    parser.add_argument('--development', action='store_true')
    args = parser.parse_args()
    inp, out = args.input, args.output or args.input
    result = patch(inp.read_text(), str(inp), args.development)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(result)
    print(json.dumps({'sha256':hashlib.sha256(result.encode()).hexdigest(),'bytes':len(result.encode()),'development':args.development}))
