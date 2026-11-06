#!/usr/bin/env python3
"""Author: Andrew Fisher. Add a current-card building transport forecast only."""
import hashlib
import json
import os
import re
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '24b9bc1f256171330e5f02546fbf64fb3f82d3e9ec919ad60c4c1737182535d0'
OLD_UNIT = 'per unit per movement as the sheet lists it — whether that is each way is not written on the sheet'
NEW_UNIT = 'per listed transport unit, each way; rates exclude GST'


def validate_supplement(value):
    if not isinstance(value, dict) or set(value) != {'schema', 'author', 'card', 'rateSupplements', 'coverage', 'included', 'heldScopes'}:
        raise ValueError('Unexpected private transport source schema')
    card = value['card']
    if value['schema'] != 1 or value['author'] != 'Andrew Fisher' or not isinstance(card, dict) or card.get('eachWay') is not True:
        raise ValueError('Expected reviewed current-card each-way source binding')
    for key in ['sha256', 'originalWorkbookSha256']:
        if not re.fullmatch(r'[0-9a-f]{64}', str(card.get(key, ''))):
            raise ValueError('Missing exact card source fingerprint')
    for key in ['rateSupplements', 'coverage', 'included', 'heldScopes']:
        if not isinstance(value[key], list) or len(value[key]) > 500 or any(not isinstance(row, dict) for row in value[key]):
            raise ValueError('Invalid bounded transport source rows')
    ids = [row.get('id') for row in value['coverage']]
    if any(not isinstance(key, str) or not key for key in ids) or len(ids) != len(set(ids)):
        raise ValueError('Transport coverage source identities must be unique')
    for row in value['coverage']:
        if row.get('leg') not in ['delivery', 'pickup', 'both'] or row.get('quantityBasis') not in ['units', 'total-legs']:
            raise ValueError('Coverage requires a reviewed direction and quantity basis')
        if not isinstance(row.get('charge'), dict) or not isinstance(row.get('targets'), list):
            raise ValueError('Coverage requires exact source signatures and targets')
    def check_keys(item):
        if isinstance(item, dict):
            if any(key in ['__proto__', 'constructor', 'prototype'] for key in item):
                raise ValueError('Invalid source field')
            for child in item.values():
                check_keys(child)
        elif isinstance(item, list):
            for child in item:
                check_keys(child)
    check_keys(value)
    json.dumps(value, allow_nan=False)
    return value


def patch_bytes(raw, supplement):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Expected exact reviewed v8.30 base; refusing another base or repeat patch')
    text = raw.decode('utf-8')
    supplement = validate_supplement(supplement)
    source = '\n'.join(Path(__file__).with_name(name).read_text() for name in ['building_transport831.js', 'other_transport831.js'])
    if 'function buildingTransport831(' in text:
        raise ValueError('Building transport forecast already present')
    def change(old, new, why):
        nonlocal text
        text = rep(text, old, new, why, 'v8.31 candidate')
    old_token, new_token = json.dumps(OLD_UNIT, ensure_ascii=False), json.dumps(NEW_UNIT, ensure_ascii=False)
    if text.count(old_token) != 34 or new_token in text:
        raise ValueError('Expected exactly 34 reviewed stale card unit metadata values')
    replacement = rep(old_token, old_token, new_token, 'Guarded identical card metadata token', 'v8.31 candidate')
    text = text.replace(old_token, replacement)
    payload = json.dumps(supplement, ensure_ascii=True, separators=(',', ':'), allow_nan=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    change('const DATA = {', 'const DATA = {"transport_forecast831":' + payload + ',',
           'Reviewed source-only transport mapping; native records unchanged')
    change('Per unit per movement as the sheet lists it.',
           'Per listed transport unit, each way; this comparison counts one leg only.',
           'Pricing comparison retains one-leg numbers with the correct card basis')
    change('<li>Whether the transport figure is each way. The sheet lists one figure per unit and does not say.</li>',
           '<li>Transport rates are each way and exclude GST. The card comparison counts one leg per listed transport unit; the job-end forecast separately reconciles delivery and pickup coverage.</li>',
           'Correct stale each-way question from the original current card')
    change('<div class="l">Transport — charge</div>',
           '<div class="l">Transport — one-leg card comparison</div>',
           'Pricing card labels existing comparison without changing its arithmetic')
    change('Costs to job end v7.64 · read from the record; the P&amp;L’s own figures are unchanged by this card.',
           'Costs to job end · current-record figures are unchanged; job-end Revenue includes the provisional transport forecast.',
           'Clarify current-record boundary of the job-end forecast')
    change('function cj764Model(){ return heldMemo(\'cj764Model776\', cj764Model776Held); }',
           source + '\nfunction cj764Model(){ return heldMemo(\'cj764Model776\', cj764Model776Held); }',
           'Pure forecast model, runtime adapter and existing-style breakdown')
    change('const revenue = {record: r2(Number(c.total) || 0), fenceToCome: F.revenue, job: r2((Number(c.total) || 0) + F.revenue), noCardRate: F.noCardRate};',
           "const buildingTransport = buildingTransportModel831();\n  const revenue = {record: r2(Number(c.total) || 0), fenceToCome: F.revenue, transportToCome: buildingTransport.uncoveredAdditional, job: r2((Number(c.total) || 0) + F.revenue + buildingTransport.uncoveredAdditional), noCardRate: F.noCardRate};",
           'Add uncovered transport once to job-end Revenue')
    change('plKnown, plParts, revenue, fencing: F, transport: {ourRefs:',
           'plKnown, plParts, revenue, buildingTransport, fencing: F, transport: {ourRefs:',
           'Expose shared building forecast without changing cost rows')
    change("{key: 'transport', code: '1030 · 1031', line: 'Transport Revenue', what: 'delivery and pickup charged on the contracts', now: r2(n(c.delivery)), job: r2(n(c.delivery)), basis: 'the delivery and pickup lines on the contracts — cartage internal and external'},",
           "{key: 'transport', code: '1030 · 1031', line: 'Transport Revenue', what: 'recorded delivery and pickup, plus provisional transport to job end', now: r2(n(c.delivery)), job: r2(n(c.delivery) + n(X.revenue.transportToCome)), basis: 'the delivery and pickup lines on the contracts — cartage internal and external; job end adds ' + money(n(X.revenue.transportToCome)) + ' provisional delivery/pickup estimate pending branch confirmation, only for uncovered units and legs'},",
           'Transport Revenue forecast uses shared addition; current column preserved')
    change('${esc(money0(R.record))} on the contracts, the card andthe dockets so far + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card · labour still to tick is not carried',
           '${esc(money0(R.record))} on the contracts, the card andthe dockets so far + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card + ${esc(money0(R.transportToCome))} provisional transport pending branch entry · labour still to tick is not carried',
           'Forecast overview names transport addition')
    change('${esc(money0(R.record))}on the record + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card · labour per piece still to tick is charged as the work is done and is not carried here',
           '${esc(money0(R.record))}on the record + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card + ${esc(money0(R.transportToCome))} provisional transport pending branch entry · labour per piece still to tick is charged as the work is done and is not carried here',
           'Job-end Revenue basis names transport addition')
    change('<div class="fin745-block cj764-gaps"><div class="fin745-blockhead"><div><h3>Not priced yet — and who can price it</h3>',
           '${buildingTransportTable831(X.buildingTransport)}\n  <div class="fin745-block cj764-gaps"><div class="fin745-blockhead"><div><h3>Not priced yet — and who can price it</h3>',
           'Folded building breakdown inside existing Costs job-end section')
    change('<meta name="gc500-release" content="v8.30">', '<meta name="gc500-release" content="v8.31">', 'Release metadata')
    change("+ ' · v8.30'; /* v8.19 - the footer names the release once */", "+ ' · v8.31'; /* v8.19 - the footer names the release once */", 'Release footer')
    return text.encode('utf-8')


def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v831.py INPUT.html')
    path = Path(sys.argv[1])
    source_path = os.environ.get('GC500_V831_PRIVATE_SPEC')
    expected = os.environ.get('GC500_V831_SPEC_SHA256')
    if not source_path or not expected:
        raise SystemExit('Reviewed private transport source path and SHA-256 are required')
    source = Path(source_path).read_bytes()
    if hashlib.sha256(source).hexdigest() != expected:
        raise SystemExit('Reviewed private transport source fingerprint changed')
    path.write_bytes(patch_bytes(path.read_bytes(), json.loads(source)))
    print('Provisional building transport forecast added; native records and current financial calculations untouched.')


if __name__ == '__main__':
    main()
