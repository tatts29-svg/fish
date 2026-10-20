"""Author: Andrew Fisher. Synthetic, local-only servicing update checks."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('update', HERE / 'patch_v1097.py')
P = importlib.util.module_from_spec(spec)
spec.loader.exec_module(P)


def fixture_ref(ref='FIX01'):
    return {'ref': ref, 'title': ref, 'where': 'Fixture place', 'drop': 'Fixture gate',
            'pin': [-27.0, 153.0], 'lines': [{'id': ref + '-FWF', 'type': 'FWF', 'kind': 'fwf',
            'label': '1 × FWF', 'qty': 1, 'nos': ['FIXTURE-ASSET'], 'pin': [-27.0, 153.0]}]}


class PatchChecks(unittest.TestCase):
    def setUp(self):
        self.before = {'version': 'Synthetic fixture', 'tasks': {'pump': 'Pump out', 'clean': 'Clean'},
                       'plans': {'fwf': {'night': ['pump', 'clean'], 'final': ['pump', 'clean']}},
                       'days': [{'id': '2026-10-23', 'label': 'Fri', 'to': 'Sat', 'plan': 'night'},
                                {'id': '2026-10-25', 'label': 'Sun', 'to': 'Mon', 'plan': 'final'}],
                       'areas': [{'n': 1, 'name': 'Fixture area', 'refs': [fixture_ref()]}],
                       'extras': [], 'groups': {'pump': {'label': 'Pump out', 'tasks': ['pump']},
                                                'clean': {'label': 'Clean', 'tasks': ['clean']}}}
        self.after = copy.deepcopy(self.before)
        self.after['version'] = 'Fixture update'
        self.after['plans']['pump_only'] = copy.deepcopy(P.PUMP_PLAN)
        self.after['areas'][0]['refs'].append({'ref': 'NEW01', 'title': 'Fixture trailer',
            'where': 'Fixture area', 'drop': '', 'pin': [-27.01, 153.01],
            'lines': [{'id': 'NEW01-TRAILER', 'type': 'Trailer Toilet', 'kind': 'pump_only',
                       'label': '1 × trailer toilet', 'qty': 1, 'nos': []}]})
        self.scope = {'add_refs': ['NEW01'], 'move_refs': []}

    def test_addition_preserves_existing_data_and_has_only_pump_tasks(self):
        original = copy.deepcopy((self.before, self.after, self.scope))
        P.validate_update(self.before, self.after, self.scope)
        self.assertEqual((self.before, self.after, self.scope), original)
        projection = P.crew_data(self.after)
        new = projection['areas'][0]['refs'][-1]
        self.assertEqual(new['lines'][0]['qty'], 1)
        self.assertEqual(new['lines'][0]['nos'], [])
        for day in projection['days']:
            self.assertEqual(projection['plans']['pump_only'][day['plan']], ['pump'])

    def test_declared_movement_preserves_reference_line_and_assets(self):
        self.scope['move_refs'] = ['FIX01']
        moved = self.after['areas'][0]['refs'][0]
        moved.update(title='New fixture destination', where='New fixture place', pin=[-27.02, 153.02])
        P.validate_update(self.before, self.after, self.scope)
        self.assertEqual(moved['lines'], self.before['areas'][0]['refs'][0]['lines'])

    def test_undeclared_addition_or_movement_refused(self):
        with self.assertRaises(ValueError): P.validate_update(self.before, self.after, {'add_refs': [], 'move_refs': []})
        self.after['areas'][0]['refs'][0]['pin'] = [-27.02, 153.02]
        with self.assertRaises(ValueError): P.validate_update(self.before, self.after, self.scope)

    def test_existing_reference_deletion_or_rename_refused(self):
        for change in ('remove', 'rename'):
            after = copy.deepcopy(self.after)
            if change == 'remove': after['areas'][0]['refs'].pop(0)
            else: after['areas'][0]['refs'][0]['ref'] = 'RENAMED'
            with self.assertRaises(ValueError): P.validate_update(self.before, after, self.scope)

    def test_existing_line_changes_refused_even_on_declared_movement(self):
        self.scope['move_refs'] = ['FIX01']
        for key, value in [('id', 'FIX01-OTHER'), ('qty', 4), ('nos', []), ('pin', [-28.0, 154.0])]:
            after = copy.deepcopy(self.after)
            after['areas'][0]['refs'][0]['lines'][0][key] = value
            with self.assertRaises(ValueError): P.validate_update(self.before, after, self.scope)

    def test_existing_plans_tasks_groups_extras_days_unchanged(self):
        for key in ('plans', 'tasks', 'groups', 'extras', 'days'):
            after = copy.deepcopy(self.after)
            if key == 'plans': after[key]['fwf']['final'] = ['pump']
            elif isinstance(after[key], dict): after[key]['unapproved'] = []
            else: after[key].append('unapproved')
            with self.assertRaises(ValueError): P.validate_update(self.before, after, self.scope)

    def test_new_line_cannot_gain_cleaning_quantity_fleet_number_or_fwf_assumption(self):
        for key, value in [('kind', 'fwf'), ('qty', 4), ('nos', ['INVENTED']), ('type', 'FWF Trailer')]:
            after = copy.deepcopy(self.after)
            after['areas'][0]['refs'][-1]['lines'][0][key] = value
            with self.assertRaises(ValueError): P.validate_update(self.before, after, self.scope)
        self.after['plans']['pump_only']['final'].append('clean')
        with self.assertRaises(ValueError): P.validate_update(self.before, self.after, self.scope)

    def test_invalid_or_missing_pin_refused(self):
        for pin in (None, [100, 200], [float('nan'), 153], [True, 153]):
            after = copy.deepcopy(self.after); after['areas'][0]['refs'][-1]['pin'] = pin
            with self.assertRaises(ValueError): P.validate_update(self.before, after, self.scope)

    def test_only_two_data_values_and_footer_change(self):
        template = '<html><meta name="author" content="Andrew Fisher"><script>var D = /*SVC1067_DATA*/null;</script></html>'
        bundle = P.encoded({'data': P.crew_data(self.before), 'html': template}).replace('Andrew Fisher', 'Andrew\\u0020Fisher')
        text = ('<script id="other">const keep = 12;</script>\n<script id="svc1067-script">\n'
                'controllerBefore();\nvar SVC1067_DATA=' + P.encoded(P.panel_data(self.before)) + ';\n'
                'var SVC1067_CARD=' + bundle + ';\ncontrollerAfter();\n</script>\n'
                "+' · v10.95'; /* v8.19 release922 */")
        def envelope(value):
            for marker in ('var SVC1067_CARD={"data":', 'var SVC1067_DATA='):
                _, start, end = P.object_at(value, marker)
                value = value[:start] + 'DATA' + value[end:]
            return value.replace('v10.95', 'VERSION').replace('v10.97', 'VERSION')
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'fixture.json'; source.write_text(json.dumps(self.before))
            with mock.patch.object(P, 'SOURCE', source), mock.patch.object(P, 'BASE_SHA256', hashlib.sha256(text.encode()).hexdigest()):
                after = P.patch(text, self.after, self.scope)
                self.assertEqual(envelope(text), envelope(after))
                self.assertEqual(P.object_at(after, 'var SVC1067_CARD=')[0]['html'], template)
                self.assertEqual(P.object_at(after, 'var SVC1067_DATA=')[0], P.panel_data(self.after))
                self.assertEqual(P.object_at(after, 'var SVC1067_CARD=')[0]['data'], P.crew_data(self.after))
                with self.assertRaises(ValueError): P.patch(after, self.after, self.scope)
                with self.assertRaises(ValueError): P.patch(text + 'changed', self.after, self.scope)

    def test_private_text_is_script_escaped(self):
        self.after['areas'][0]['refs'][-1]['title'] = '</script><b>Fixture</b>'
        encoded = P.encoded(P.crew_data(self.after))
        self.assertNotIn('</script', encoded)
        self.assertIn('\\u003c', encoded)


if __name__ == '__main__':
    unittest.main()
