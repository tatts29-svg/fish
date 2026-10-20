"""Author: Andrew Fisher. Extend the current display input; preserve historical people."""
from pathlib import Path
import hashlib
import json
import os
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

PRIOR_INPUT_SHA256 = 'e9110e2545d3edc25a6aa2ab246073679308c6d46373dce714285d21aa4c8bff'
APPROVED_INPUT_SHA256 = '172bafd26eb8718f67263d37ffd5420a7efbe6d63a31a8b50c00aa52d46575c3'
MARKER = 'current-team-input1094'
INPUT_PATTERN = r'^var ABOUT_CONTACT_INPUT1089 = (.+);$'
OLD_FALLBACK_LABEL = ' <div class="shrow"><span>Installers</span><b>${fmtNum(crew)}</b></div>'
NEW_FALLBACK_LABEL = ' <div class="shrow"><span>Installation team</span><b>${fmtNum(crew)}</b></div>'


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True)


def folded(value):
    return ' '.join(str(value).split()).casefold()


def checked_input(value, previous, historical):
    if not isinstance(value, dict) or set(value) != {'people'} or not isinstance(value['people'], list):
        raise ValueError('Current display input must contain only a people list')
    people = value['people']
    if len(people) != len(previous['people']) + 2 or people[:len(previous['people'])] != previous['people']:
        raise ValueError('Keep the existing display additions in order and append exactly two approved people')
    seen = {folded(p.get('name', '')) for p in historical if isinstance(p, dict)}
    for person in people:
        if not isinstance(person, dict) or set(person) != {'name', 'event_role', 'group'}:
            raise ValueError('Display input permits names, supplied roles and existing group only')
        if person['group'] != 'install' or any(not isinstance(person[k], str) or not person[k].strip() for k in ('name', 'event_role')):
            raise ValueError('Each current team member needs a supplied name and role in the existing installation group')
        key = folded(person['name'])
        if key in seen:
            raise ValueError('Duplicate current or historical identity')
        seen.add(key)
    return value


def apply(text, private_input=None, path='page.html'):
    """Amend current display input and keep its fallback count label inclusive."""
    if MARKER in text:
        raise ValueError('Current display input v10.94 is already applied')
    for required in ('var AboutContacts1089 = (function(){',
                     "AboutContacts1089.current(TEAM.people).filter(p => p.lead || p.group === 'install')",
                     "AboutContacts1089.current(TEAM.people).filter(p => p.group === 'install')"):
        if required not in text:
            raise ValueError('Shared v10.92 current-contact projection is required')
    matches = list(re.finditer(INPUT_PATTERN, text, re.M))
    if len(matches) != 1:
        raise ValueError('Expected one current display input')
    prior = json.loads(matches[0].group(1))
    if hashlib.sha256(canonical(prior).encode()).hexdigest() != PRIOR_INPUT_SHA256:
        raise ValueError('Current display input differs from the reviewed predecessor')
    selected = private_input or os.environ.get('GC500_CURRENT_TEAM_INPUT1094')
    if not selected:
        raise ValueError('Private approved current-team input is required')
    source = Path(selected)
    if not source.is_absolute() or source.resolve().is_relative_to(Path(__file__).resolve().parents[2]):
        raise ValueError('Approved current-team input must remain in private storage outside the repository')
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != APPROVED_INPUT_SHA256:
        raise ValueError('Private current-team input differs from the approved hash')
    data_lines = [line for line in text.splitlines() if line.startswith('const DATA = ')]
    if len(data_lines) != 1 or not data_lines[0].endswith(';'):
        raise ValueError('Historical DATA source is required')
    historical = json.loads(data_lines[0][len('const DATA = '):-1]).get('team', {}).get('people', [])
    approved = checked_input(json.loads(raw), prior, historical)
    payload = json.dumps(approved, separators=(',', ':'), ensure_ascii=True).replace('<', '\\u003c')
    replacement = ('/* ' + MARKER + ': supplied names and roles for current cards only. */\n'
                   'var ABOUT_CONTACT_INPUT1089 = ' + payload + ';')
    text = rep(text, matches[0].group(0), replacement, 'approved current team display input', path, True)
    return rep(text, OLD_FALLBACK_LABEL, NEW_FALLBACK_LABEL, 'installation support count label', path, True)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: installer_order1094.py INPUT.html OUTPUT.html; private input via GC500_CURRENT_TEAM_INPUT1094')
    source, target = map(Path, sys.argv[1:])
    target.write_text(apply(source.read_text(), path=str(source)))
