#!/usr/bin/env python3
"""Author: Andrew Fisher. Reconcile authorised future event shifts, keeping native edits authoritative."""
import copy
import hashlib
import json
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = 'c3e610a5a1def55fc3eac0f87b3f2e4d14cfdefd7ba926bcb548487d6cdfc95b'
SHIFT_FIELDS = {'side', 'kind', 'person', 'date', 'start', 'finish', 'break_min', 'hours', 'note'}

def encoded(value):
    return json.dumps(value, ensure_ascii=True, separators=(',', ':'), allow_nan=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')

def patch_bytes(raw, payload):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Expected exact reviewed v8.32 base; refusing another base or repeat patch')
    text = raw.decode('utf-8')
    if 'function eventStaffing833(' in text or 'function buildingTransportModel831(' not in text:
        raise ValueError('Wrong source markers')
    if set(payload) != {'schema', 'author', 'roster', 'updates', 'newPeople', 'newShifts'} or payload['schema'] != 1 or payload['author'] != 'Andrew Fisher':
        raise ValueError('Unexpected reviewed private roster schema')
    if len(payload['updates']) != 12 or len(payload['newShifts']) != 6 or len(payload['newPeople']) != 2:
        raise ValueError('Expected reviewed twelve replacements, six new shifts and two new people')
    marker = 'const DATA = '
    start = text.index(marker) + len(marker)
    data, _ = json.JSONDecoder().raw_decode(text[start:])
    wf = copy.deepcopy(data['workforce'])
    ids = [r['id'] for r in wf['lines']]
    if len(ids) != len(set(ids)):
        raise ValueError('Existing source IDs are not unique')
    by_id = {r['id']: r for r in wf['lines']}
    dates = set(payload['roster']['dates'])
    if dates != {'2026-10-23', '2026-10-24', '2026-10-25'}:
        raise ValueError('Unexpected authorised event dates')
    changed_ids = set()
    for row in payload['updates']:
        if set(row) != {'id', 'before', 'fields'} or row['id'] in changed_ids or by_id.get(row['id']) != row['before']:
            raise ValueError('Existing planned shift differs from reviewed source')
        fields = row['fields']
        if set(fields) != SHIFT_FIELDS or fields['kind'] != 'labour' or fields['side'] != 'ours' or fields['date'] not in dates:
            raise ValueError('Unreviewed shift fields')
        if fields['person'] != row['before']['person'] or fields['date'] != row['before']['date']:
            raise ValueError('Existing shift identity must be retained')
        if (fields['start'], fields['finish'], fields['break_min'], fields['hours']) != ('06:00', '18:00', 0, 12):
            raise ValueError('Expected twelve explicitly paid hours')
        by_id[row['id']].update(fields)
        changed_ids.add(row['id'])
    for row in payload['newPeople'] + payload['newShifts']:
        if row['id'] in by_id or row['id'] in changed_ids or row.get('side') != 'ours':
            raise ValueError('New source row would duplicate or change an existing identity')
        if row in payload['newPeople']:
            if row.get('kind') != 'person' or any(row.get(k) is not None for k in ['type', 'employer', 'pay_rate', 'charged_as']):
                raise ValueError('New role must not invent employment or pay authority')
        elif row.get('kind') != 'labour' or row.get('date') not in dates or (row.get('start'), row.get('finish'), row.get('break_min'), row.get('hours')) != ('06:00', '18:00', 0, 12):
            raise ValueError('Unexpected new planned shift')
        wf['lines'].append(copy.deepcopy(row)); changed_ids.add(row['id'])
    if len(payload['roster']['roster']) != 6 or any(p.get('hours') is not None for p in payload['roster']['placeholders']):
        raise ValueError('Unknown shifts must remain unknown')
    for person in payload['roster']['roster']:
        if set(person.get('shiftDates', {})) != set(person['shiftIds']) or set(person['shiftDates'].values()) != dates:
            raise ValueError('Each planned identity must be bound to its exact date')
    wf_key = '"workforce":'
    wf_start = text.index(wf_key, start) + len(wf_key)
    whitespace = len(text[wf_start:]) - len(text[wf_start:].lstrip())
    wf_start += whitespace
    old_wf, length = json.JSONDecoder().raw_decode(text[wf_start:])
    if old_wf != data['workforce']:
        raise ValueError('Workforce source boundary not found')
    old = text[wf_start:wf_start + length]
    text = rep(text, old, encoded(wf), 'Only the reviewed workforce source rows', 'v8.33 candidate')
    text = rep(text, 'const DATA = {', 'const DATA = {"event_staffing833":' + encoded(payload['roster']) + ',', 'Private planned roster source', 'v8.33 candidate')
    source = Path(__file__).with_name('event_staffing833_src.js').read_text()
    text = rep(text, 'function renderCosts(){', source + '\nfunction renderCosts(){', 'Read-only roster reconciliation', 'v8.33 candidate')
    text = rep(text, '${cj764Card()}\n ${rh766Card()}', '${cj764Card()}\n${eventStaffingCard833()}\n ${rh766Card()}', 'Existing Costs fold pattern', 'v8.33 candidate')
    text = rep(text, '${esc(p.event_role)}${p.lead && p.about ?', '${esc(eventStaffingRole833(p.name) || p.event_role)}${p.lead && p.about ?', 'Consistent operational event role in team directory', 'v8.33 candidate')
    text = rep(text, '<td><b>${n}</b>${r.P.employer ?', '<td><b>${n}</b>${eventStaffingRole833(r.name, iso) ? `<br><span class="w">${esc(eventStaffingRole833(r.name, iso))}</span>` : ""}${r.P.employer ?', 'Operational role on existing event running-sheet rows', 'v8.33 candidate')
    text = rep(text, '<p class="sub"><b>Worked</b> is every hour from start to finish — what the V8s are charged.', '<p class="sub"><b>Worked</b> is every hour from start to finish. Over the event, customer hourly Revenue follows the event labour scope; a roster change does not add another charge.', 'Separate event paid roster from commercial scope', 'v8.33 candidate')
    text = rep(text, '<meta name="gc500-release" content="v8.32">', '<meta name="gc500-release" content="v8.33">', 'Release metadata', 'v8.33 candidate')
    text = rep(text, "+ ' · v8.32'; /* v8.19 - the footer names the release once */", "+ ' · v8.33'; /* v8.19 - the footer names the release once */", 'Release footer', 'v8.33 candidate')
    return text.encode('utf-8')

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v833.py WORKING_COPY.html')
    source_path, expected = os.environ.get('GC500_V833_PRIVATE_SPEC'), os.environ.get('GC500_V833_SPEC_SHA256')
    if not source_path or not expected:
        raise SystemExit('Reviewed private staffing payload and SHA-256 required')
    raw = Path(source_path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected:
        raise SystemExit('Private staffing payload changed')
    path = Path(sys.argv[1])
    path.write_bytes(patch_bytes(path.read_bytes(), json.loads(raw)))
    print('Planned event staffing reconciled; native records, customer scope and actuals unchanged.')

if __name__ == '__main__':
    main()
