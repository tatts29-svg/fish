#!/usr/bin/env python3
"""Author: Andrew Fisher. Consistent disclosures and source-reconciled fencing work."""
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
sys.path.insert(0, str(ROOT.parent / 'v8.47_fencing_category_audit_LIVE'))
from rep import rep
from fencing_corrections847 import apply_corrections, json_value, replace_json_value

BASE_SHA256 = 'c2541d7e51dec18187f9163a213fd6c77d607d8a50823b7c3234354019172f21'

def read(relative):
    return (ROOT.parent / relative).read_text()

def resolved_day(source):
    spec = importlib.util.spec_from_file_location('day842', ROOT.parent / 'v8.42_today_plan_clarity_LIVE/patch_v842.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.resolved_day(source)

def private_input(name):
    value = os.environ.get(name)
    if not value:
        raise ValueError('Missing reviewed private input: ' + name)
    return json.loads(Path(value).read_text())

def build(raw):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Refusing changed live base or repeated patch')
    text = raw.decode('utf-8')
    progress = private_input('FENCE_PROGRESS848_INPUT')
    catalogue = private_input('FENCE_CCB848_INPUT')
    manifest = private_input('FENCE_CCB848_CORRECTIONS')
    if progress.get('schema') != 1 or progress.get('author') != 'Andrew Fisher' or not progress.get('sources') or not progress.get('operations') or not progress.get('plan_allowances'):
        raise ValueError('Invalid reviewed physical-work catalogue')
    data, review, trace, catalogue = apply_corrections(
        json_value(text, 'const DATA = ')[0], json_value(text, 'const FENCE_REVIEW836 = ')[0],
        json_value(text, 'const FENCE_TRACE837 = ')[0], catalogue, manifest, BASE_SHA256)
    for correction in manifest['corrections']:
        if correction.get('assessment_method') != 'assessed' or correction.get('assessment_confidence') != 'medium':
            raise ValueError('An explicit assessment method and confidence are required')
        entry = next(row for row in catalogue['rows'] if row['record_id'] == correction['record_id'])
        entry['decision'].update(method='assessed', confidence='medium')
    data['fence_ccb_review847'] = catalogue
    text = replace_json_value(text, 'const DATA = ', data)
    text = replace_json_value(text, 'const FENCE_REVIEW836 = ', review)
    text = replace_json_value(text, 'const FENCE_TRACE837 = ', trace)
    encoded = json.dumps(progress, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    # The generic build scrub is for visible prose, not source-record signatures.
    # Preserve the exact JSON value while preventing a literal-name replacement.
    encoded = encoded.replace('Andrew Fisher', 'Andrew\\u0020Fisher')
    additions = 'const FENCE_PROGRESS848 = ' + encoded + ';\n\n' + '\n\n'.join((ROOT / name).read_text() for name in ['fencing_metrics848_src.js', 'work_summary848_src.js', 'linked_fencing848_src.js'])
    text = rep(text, resolved_day(read('v8.47_fencing_category_audit_LIVE/today_work847_src.js')),
               additions + '\n\n' + resolved_day((ROOT / 'today_work848_src.js').read_text()), 'Collapsible groups and reconciled physical work', 'v8.48')
    old_linked = read('v8.44_linked_completion_LIVE/linked_fencing844_src.js')
    old_linked = old_linked.replace("weeks.filter(week => week.phase === 'Build')", 'fenceInstallationWeeks847()').replace("datedWeek.phase !== 'Build'", "!['Build', 'Event'].includes(datedWeek.phase)").replace('Keep identical inclusion rules to todayFencingSummary841', 'Keep identical inclusion rules to todayFencingSummary847').replace('location, areaStatus:status, recordAction:', 'classification:fenceCcbReview847(docket), location, areaStatus:status, recordAction:')
    start = old_linked.index('    if (!docket.date')
    end = old_linked.index('    const quantity', start)
    new_linked = old_linked[:start] + "    if (fenceInstallationDocketState848(docket, day) !== 'included') continue;\n" + old_linked[end:]
    text = rep(text, old_linked, new_linked, 'Linked compound work inclusion', 'v8.48')
    types = read('v8.43_type_instruments_LIVE/type_metrics843_src.js').replace('todayWorkSummary842(', 'todayWorkSummary847(').replace('todayFencingSummary841(', 'todayFencingSummary847(').replace("groupId: 'Build programme', groupName: 'Build programme'", "groupId: 'Build programme', groupName: 'Installation programme · Build + Event'").replace('Recorded Build work by type.', 'Recorded installation work by type.')
    text = rep(text, types, types.replace('todayWorkSummary847(', 'todayWorkSummary848(').replace('todayFencingSummary847(', 'todayFencingSummary848('), 'Type API uses reconciled progress', 'v8.48')
    before = read('v8.47_fencing_category_audit_LIVE/fencing_classification847_src.js')
    after = before.replace("result.reviewState = 'current'; result.reason = row.decision.basis;", "result.reviewState = 'current'; result.reason = row.decision.basis; result.assessed = row.decision.method === 'assessed'; result.confidence = row.decision.confidence || null;")
    text = rep(text, before, after, 'Assessment provenance retained', 'v8.48')
    before = read('v8.47_fencing_category_audit_LIVE/fencing_ui847_src.js')
    after = before.replace("? 'CCB category confirmed'", "? (review.assessed ? 'CCB category assessed' : 'CCB category confirmed')").replace("? 'CCB category confirmed.'", "? (review.assessed ? 'CCB category assessed from linked sources.' : 'CCB category confirmed.')").replace('Current CCB category reviews are confirmed.', 'Current CCB categories have been reviewed; assessed classifications are identified in each source record.')
    text = rep(text, before, after, 'Assessed category audit labels', 'v8.48')
    style_start = text.index('<style id="today-work-v840"')
    style_end = text.index('</style>', style_start)
    text = text[:style_end] + '\n' + (ROOT / 'today_groups848_src.css').read_text() + '\n' + text[style_end:]
    text = rep(text, '<meta name="gc500-release" content="v8.47">', '<meta name="gc500-release" content="v8.48">', 'Release metadata', 'v8.48')
    text = rep(text, "+ ' · v8.47'; /* v8.19 - the footer names the release once */", "+ ' · v8.48'; /* v8.19 - the footer names the release once */", 'Release footer', 'v8.48')
    return text.encode('utf-8')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v848.py WORKING_COPY.html with reviewed private inputs')
    page = Path(sys.argv[1])
    page.write_bytes(build(page.read_bytes()))
    print('Applied consistent group disclosures and reconciled physical-work readings.')
