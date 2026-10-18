"""Author: Andrew Fisher. Fail closed when a standing suite emits no assertion proof."""
import json
import re


def assertions(name, content, evidence=None):
    """Validate the actual legacy summary or map-suite evidence format."""
    lines = content.splitlines()
    if any(re.match(r'\s*(?:FAIL(?:ED)?\b|AssertionError\b)', line) for line in lines):
        return False, 'failure output'
    for line in lines:
        try:
            value = json.loads(line)
        except (ValueError, TypeError):
            continue
        if isinstance(value, dict) and (value.get('pass') is False or value.get('passed') is False):
            return False, 'structured failure output'
    passed = [line for line in lines if re.match(r'^(?:ok\s+|PASS\s+)', line)]
    family = name.split('-')[0]
    if family in ('interactions', 'integrated'):
        expected = 11 if family == 'interactions' else 16
        if not isinstance(evidence, dict):
            return False, 'missing map evidence JSON'
        checks = evidence.get('checks')
        if not isinstance(checks, list) or len(checks) != expected or not all(isinstance(c, str) and c for c in checks):
            return False, 'incomplete map assertions'
        if passed != ['PASS ' + check for check in checks]:
            return False, 'map log and evidence do not match'
        if evidence.get('errors') != [] or not isinstance(evidence.get('counts'), dict) or evidence['counts'].get('blocked') != 0:
            return False, 'map errors or missing write-abort evidence'
        return True, str(expected) + ' map assertions'
    summaries = [re.fullmatch(r'(?:ALL PASS )?(\d+)/(\d+)(?: passed)?', line.strip()) for line in lines]
    summaries = [match for match in summaries if match]
    if not summaries:
        return False, 'missing assertion summary'
    successes, total = map(int, summaries[-1].groups())
    if total <= 0 or successes != total or len(passed) != total:
        return False, 'incomplete or inconsistent assertion summary'
    return True, str(total) + ' assertions'
