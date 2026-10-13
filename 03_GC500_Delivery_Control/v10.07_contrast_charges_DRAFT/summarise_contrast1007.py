#!/usr/bin/env python3
"""Author: Andrew Fisher. Reduce private contrast results to non-record release evidence."""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--reports', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--expected-sha', required=True)
args = parser.parse_args()
cases = []
for mode in ('tablet', 'phone', 'desktop'):
    for scheme in ('light', 'dark'):
        src = args.reports / f'final-{mode}-{scheme}.json'
        report = json.loads(src.read_text())
        assert report['sha256'] == args.expected_sha, f'Wrong candidate: {src.name}'
        assert all(c['pass'] for c in report['checks']), f'Failed check: {src.name}'
        assert not report['errors'] and not report['counts']['blocked'], src.name
        assert len(report['routes']) == (22 if mode == 'tablet' else 6), src.name
        assert len(report['views']) == 7 and len(report['drawers']) == 3, src.name
        if mode != 'tablet':
            assert len(report['states']) == 15 and report['edit'], src.name
        sections = report['routes'] + report['views'] + report['drawers'] + report['states']
        assert all(not section['failures'] for section in sections), src.name
        groups = [group for section in sections for group in section['groups']]
        measured = [group for group in groups if not group['image']]
        case = {
            'viewport': mode, 'os_colour_scheme': scheme, 'edit_practice': report['edit'],
            'routes': [r['tab'] for r in report['routes']],
            'finance_views': [r['view'] for r in report['views']],
            'asset_drawers': len(report['drawers']),
            'default_hover_focus_states': len(report['states']),
            'expanded_folds': sum(len(s.get('opened', [])) for s in sections),
            'text_control_groups_measured': len(measured),
            'disabled_or_readonly_groups': sum(bool(g['disabled'] or g['readOnly']) for g in measured),
            'gradient_groups_reviewed_with_screenshots': sum(bool(g['gradient']) for g in measured),
            'image_surface_groups_requiring_visual_review': sum(bool(g['image']) for g in groups),
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
result = {
    'author': 'Andrew Fisher', 'candidate_sha256': args.expected_sha,
    'method': 'Actual rendered text and form values/placeholders; hidden and decorative icon text excluded. Foreground/background alpha and ancestor opacity composited. Layered gradients use representative stop colours with visual review; image and canvas content is not given a numeric pass.',
    'thresholds': {'normal_text': 4.5, 'large_text': 3},
    'viewports': {'phone': [390, 844], 'tablet': [1138, 1280], 'desktop': [1440, 1000]},
    'cases': cases, 'all_pass': True,
}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'cases': len(cases), 'all_pass': True, 'sha256': args.expected_sha, 'output': str(args.output)}))
