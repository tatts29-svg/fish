#!/usr/bin/env python3
"""Author: Andrew Fisher. Reduce private contrast results to non-record release evidence."""
import argparse
import hashlib
import json
import re
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--reports', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--page', type=Path, required=True)
parser.add_argument('--prior-pages', type=Path, nargs='+', required=True)
args = parser.parse_args()
sha = lambda raw: hashlib.sha256(raw).hexdigest()
final = args.page.read_bytes()
final_sha = sha(final)

def extract_css(raw):
    start = raw.index(b'<style id="contrast1007css">')
    end = raw.index(b'</style>', start) + len(b'</style>')
    return raw[:start] + raw[end:], raw[start:end]

outside_final, css_final = extract_css(final)
# Two tightly scoped additions after the comprehensive matrix. Removing them
# must reproduce the earlier tested bytes, including every script and record.
danger = re.search(rb'  /\* Destructive actions.*?  body \.btn\.danger:is\(:hover,:focus-visible\) \{.*?\n  \}\n', css_final, re.S)
header = re.search(rb'  \.top #q::placeholder \{.*?\n  \}\n', css_final, re.S)
assert danger and header
known = {final_sha: {'applicability': 'final candidate'}}
equivalence = []
for prior_path in args.prior_pages:
    prior = prior_path.read_bytes()
    outside, css = extract_css(prior)
    assert outside == outside_final, f'Non-CSS change: {prior_path.name}'
    removed = [name for name, match in [('danger buttons', danger), ('header search placeholder', header)] if match.group() not in css]
    reduced = css_final
    for name, match in [('danger buttons', danger), ('header search placeholder', header)]:
        if name in removed:
            reduced = reduced.replace(match.group(), b'', 1)
    assert reduced == css, f'Unexpected CSS delta: {prior_path.name}'
    evidence = {'tested_sha256': sha(prior), 'final_sha256': final_sha,
                'only_added_styles': removed,
                'all_bytes_outside_contrast_styles_identical': True,
                'scripts_markup_and_records_identical': True}
    known[sha(prior)] = evidence
    equivalence.append(evidence)

cases = []
for mode in ('tablet', 'phone', 'desktop'):
    for scheme in ('light', 'dark'):
        src = args.reports / f'final-{mode}-{scheme}.json'
        report = json.loads(src.read_text())
        assert report['sha256'] in known, f'Unproven candidate: {src.name}'
        assert all(c['pass'] for c in report['checks']), f'Failed check: {src.name}'
        assert not report['errors'] and not report['counts']['blocked'], src.name
        assert len(report['routes']) == (22 if mode == 'tablet' else 6), src.name
        assert len(report['views']) == 7 and len(report['drawers']) == 3, src.name
        if mode != 'tablet':
            assert len(report['states']) in (15, 24) and report['edit'], src.name
        sections = report['routes'] + report['views'] + report['drawers'] + report['states']
        assert all(not section['failures'] for section in sections), src.name
        groups = [group for section in sections for group in section['groups']]
        measured = [group for group in groups if not group['image']]
        case = {
            'viewport': mode, 'os_colour_scheme': scheme, 'edit_practice': report['edit'],
            'tested_sha256': report['sha256'], 'applies_to_final_by_css_delta_proof': report['sha256'] != final_sha,
            'routes': [r['tab'] for r in report['routes']],
            'finance_views': [r['view'] for r in report['views']],
            'asset_drawers': len(report['drawers']),
            'default_hover_focus_states': len(report['states']),
            'expanded_folds': sum(len(s.get('opened', [])) for s in sections),
            'text_control_groups_measured': len(measured),
            'disabled_or_readonly_groups': sum(bool(g['disabled'] or g['readOnly']) for g in measured),
            'gradient_groups_with_representative_stop_measurement': sum(bool(g['gradient']) for g in measured),
            'image_surface_groups_not_given_numeric_pass': sum(bool(g['image']) for g in groups),
            'minimum_normal_text_ratio': min(g['ratio'] for g in measured if g['min'] == 4.5),
            'minimum_large_text_ratio': min(g['ratio'] for g in measured if g['min'] == 3),
            'contrast_failures': 0, 'page_errors': 0, 'attempted_operational_writes': 0,
            'checks': report['checks'],
        }
        if 'mapProof' in report:
            case['map_initial_style_count'] = report['mapProof']['initial']['count']
            case['map_reload_style_count'] = report['mapProof']['reloaded']['count']
            case['map_search_passed'] = report['mapProof']['searched']['text']
        cases.append(case)
chrome = json.loads((args.reports / 'final-chrome.json').read_text())
assert chrome['sha256'] == final_sha and chrome['pass'] and len(chrome['cases']) == 6
assert not chrome['errors'] and not chrome['counts']['blocked']
chrome_cases = [{'viewport': c['mode'], 'os_colour_scheme': c['scheme'],
                 'text_control_groups': len(c['chrome']['groups']),
                 'search_placeholder_minimum_rendered_pixel_contrast': c['pixel']['minimum_pixel_contrast'],
                 'contrast_failures': 0} for c in chrome['cases']]
result = {
    'author': 'Andrew Fisher', 'candidate_sha256': final_sha,
    'method': 'Actual rendered text and form values/placeholders; hidden and decorative icon text excluded. Foreground/background alpha and ancestor opacity composited. Layered gradients use representative stop colours with visual review; image and canvas content is not given a numeric pass. Header search placeholder additionally measured against its actual rendered background pixels, excluding the overlaid Close button.',
    'thresholds': {'normal_text': 4.5, 'large_text': 3},
    'viewports': {'phone': [390, 844], 'tablet': [1138, 1280], 'desktop': [1440, 1000]},
    'source_equivalence': equivalence,
    'cases': cases, 'final_candidate_chrome_cases': chrome_cases, 'all_scoped_contrast_checks_pass': True,
    'separate_layout_finding': 'At 390px the Build Rules table exceeds its container and is clipped by main overflow-x:hidden; scrollIntoView can shift main by27px. Existing layout defect assigned to v10.08. Finance handover already has a local horizontal scroll container.',
}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(result, indent=2) + '\n')
# Root navigation checks were run against the first comprehensive candidate.
nav_path = args.output.parent / 'navigation-controls.json'
if nav_path.exists():
    nav = json.loads(nav_path.read_text())
    tested_sha = nav.get('tested_sha256', nav['sha256'])
    assert tested_sha in known
    nav.update({'tested_sha256': tested_sha, 'applies_to_candidate_sha256': final_sha,
                'applicability': 'Only paired danger-button colours and the header search placeholder changed; all bytes outside contrast1007 CSS, including navigation scripts and markup, are identical.',
                'source_equivalence_evidence': 'contrast-matrix1007.json'})
    nav_path.write_text(json.dumps(nav, indent=2) + '\n')
print(json.dumps({'cases': len(cases), 'chrome_cases': len(chrome_cases), 'all_scoped_contrast_checks_pass': True, 'sha256': final_sha, 'output': str(args.output)}))
