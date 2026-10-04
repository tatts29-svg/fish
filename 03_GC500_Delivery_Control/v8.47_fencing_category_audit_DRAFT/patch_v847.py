#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded installation scope and CCB certainty correction."""
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = 'e176119c8ad29b8af472d8c740d66b0c20534284ebef260bd8cb9f682b5a4236'

def read(relative):
    return (ROOT.parent / relative).read_text()

def resolved_day(source):
    spec = importlib.util.spec_from_file_location('day842', ROOT.parent / 'v8.42_today_plan_clarity_LIVE/patch_v842.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.resolved_day(source)

def build(raw, catalogue_path=None):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Refusing changed live base or repeated patch')
    text = raw.decode('utf-8')
    catalogue_path = catalogue_path or os.environ.get('FENCE_CCB847_INPUT')
    if not catalogue_path:
        raise ValueError('A private source-reviewed category catalogue is required')
    catalogue = json.loads(Path(catalogue_path).read_text())
    if catalogue.get('schema') != 1 or catalogue.get('author') != 'Andrew Fisher' or not catalogue.get('sources') or not catalogue.get('rows'):
        raise ValueError('Invalid private review catalogue')
    encoded = json.dumps(catalogue, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    text = rep(text, 'const DATA = {', 'const DATA = {"fence_ccb_review847":' + encoded + ',', 'Category review catalogue', 'v8.47')
    old_ui = resolved_day(read('v8.46_one_box_per_group_LIVE/today_work846_src.js'))
    additions = '\n\n'.join((ROOT / name).read_text() for name in ['fencing_classification847_src.js', 'fencing_metrics847_src.js', 'work_summary847_src.js', 'fencing_ui847_src.js', 'fencing_other_views847_src.js'])
    text = rep(text, old_ui, additions + '\n\n' + resolved_day((ROOT / 'today_work847_src.js').read_text()), 'Today certainty and installation scope', 'v8.47')
    old = read('v8.44_linked_completion_LIVE/linked_fencing844_src.js')
    linked = old.replace("weeks.filter(week => week.phase === 'Build')", "fenceInstallationWeeks847()")
    linked = linked.replace("datedWeek.phase !== 'Build'", "!['Build', 'Event'].includes(datedWeek.phase)")
    linked = linked.replace('Keep identical inclusion rules to todayFencingSummary841', 'Keep identical inclusion rules to todayFencingSummary847')
    linked = linked.replace('location, areaStatus:status, recordAction:', 'classification:fenceCcbReview847(docket), location, areaStatus:status, recordAction:')
    text = rep(text, old, linked, 'Linked installation records and category basis', 'v8.47')
    old = read('v8.43_type_instruments_LIVE/type_metrics843_src.js')
    types = old.replace('todayWorkSummary842(', 'todayWorkSummary847(').replace('todayFencingSummary841(', 'todayFencingSummary847(')
    types = types.replace("groupId: 'Build programme', groupName: 'Build programme'", "groupId: 'Build programme', groupName: 'Installation programme · Build + Event'")
    types = types.replace('Recorded Build work by type.', 'Recorded installation work by type.')
    text = rep(text, old, types, 'Default type API uses installation certainty', 'v8.47')
    old = read('v8.40_today_work_progress_LIVE/work_metrics840_src.js')
    updated = old.replace("const buildWeeks = (DATA.weeks || []).filter(w => w.phase === 'Build');", 'const buildWeeks = fenceInstallationWeeks847();')
    updated = updated.replace("datedWeek.phase !== 'Build'", "!['Build', 'Event'].includes(datedWeek.phase)")
    updated = updated.replace('Build programme only', 'installation programme (Build and Event weeks) only').replace('clean-fence Build programme', 'clean-fence installation programme').replace('matching Build week', 'matching installation week')
    text = rep(text, old, updated, 'Clean-fence detail uses same installation horizon', 'v8.47')
    changes = [
        ('${fenceReviewStatus836(review)}</span>', '${fenceReviewStatus836(review)}${fenceCcbBadge847(d)}</span>', 'Native docket badge'),
        ('${fenceReviewDetails836(review,paper)}${fenceTraceRegister837(d)}', '${fenceReviewDetails836(review,paper)}${fenceCcbDetail847(d)}${fenceTraceRegister837(d)}', 'Native docket basis'),
        ('</section><section class="fp-register" aria-label="Fencing books">', '</section>${fenceCcbOverview847()}<section class="fp-register" aria-label="Fencing books">', 'Native CCB context'),
        ("wk.lines.map(l => { const over = l.remaining != null && l.remaining < 0;", "wk.lines.map(raw => { const l = fenceCcbWeekLine847(raw, wk.week); const over = l.remaining != null && l.remaining < 0;", 'Weekly category comparison'),
        ('<td><b>${esc(l.name)}</b>${l.unit ?', '<td><b>${esc(l.name)}</b>${l.ccbPending ? \' <span class="chip act" data-tw847-week-category>Category needs review</span>\' : \'\'}${l.unit ?', 'Weekly category qualification'),
        ("const uncertain = allDockets().filter(d => d.usable && /event or demarcation not written/i.test(d.note || '') && ((d.quantities || {}).ccb_demarc || (d.quantities || {}).ccb_event));", "const uncertain = allDockets().filter(d => d.usable && fenceCcbReview847(d).state === 'pending');", 'Questions include every pending CCB category'),
        ('These signed papers say CCB but do not state event or demarcation. The current classification is provisional and affects the rate and the programme comparison. The recorded metres remain visible.', 'These CCB records have an unconfirmed or conflicting Event/Demarcation allocation. Open each docket for its current source review. Classification affects the customer rate and programme comparison; the recorded metres remain visible.', 'Question basis'),
        ('<meta name="gc500-release" content="v8.46">', '<meta name="gc500-release" content="v8.47">', 'Release metadata'),
        ("+ ' · v8.46'; /* v8.19 - the footer names the release once */", "+ ' · v8.47'; /* v8.19 - the footer names the release once */", 'Release footer')
    ]
    for old, new, label in changes:
        text = rep(text, old, new, label, 'v8.47')
    spec = importlib.util.spec_from_file_location('other847', ROOT / 'fencing_other_views847_patch.py')
    other = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(other)
    text = other.apply(text)
    return text.encode('utf-8')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v847.py WORKING_COPY.html (requires FENCE_CCB847_INPUT)')
    file = Path(sys.argv[1])
    file.write_bytes(build(file.read_bytes()))
    print('Installation and category evidence corrected; native pricing and records preserved.')
