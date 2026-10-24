"""Author: Andrew Fisher. Synthetic local-only checks for a bounded servicing move."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('movement', HERE / 'patch_v1098.py')
P = importlib.util.module_from_spec(spec)
spec.loader.exec_module(P)


def reference(code):
    return {'ref': code, 'title': code, 'where': 'Fixture location', 'drop': '',
            'pin': [-27.0, 153.0], 'lines': [{'id': code + '-LINE', 'type': 'FWF', 'kind': 'fwf',
            'label': '1 × fixture toilet', 'qty': 1, 'nos': ['SYNTHETIC-ASSET'],
            'pin': [-27.0, 153.0]}]}


class MovementChecks(unittest.TestCase):
    def setUp(self):
        self.before = {'version': 'Synthetic baseline', 'tasks': {'pump': 'Pump out', 'clean': 'Clean'},
            'plans': {'fwf': {'night': ['pump', 'clean'], 'final': ['pump', 'clean']}},
            'days': [{'id': '2026-10-23', 'label': 'Fri', 'to': 'Sat', 'plan': 'night'},
                     {'id': '2026-10-25', 'label': 'Sun', 'to': 'Mon', 'plan': 'final'}],
            'extras': [], 'groups': {'pump': {'label': 'Pump out', 'tasks': ['pump']},
                                     'clean': {'label': 'Clean', 'tasks': ['clean']}},
            'areas': [{'n': 1, 'name': 'Fixture original area',
                       'refs': [reference('FIX01'), reference('FIX02'), reference('FIX03')]},
                      {'n': 2, 'name': 'Fixture second area', 'refs': [reference('FIX04')]}]}
        self.after = copy.deepcopy(self.before)
        self.after['version'] = 'Synthetic movement'
        moved = self.after['areas'][0]['refs'].pop(0)
        moved.update(title='Fixture destination', where='Fixture destination',
                     drop='Fixture drop', pin=[-27.2, 153.2])
        self.after['areas'].append({'n': 3, 'name': 'Fixture destination area', 'refs': [moved]})
        self.scope = {'add_refs': [], 'move_refs': ['FIX01']}

    def page(self):
        self.template = '<html><meta name="author" content="Andrew Fisher"><script>var D = /*SVC1067_DATA*/null;</script></html>'
        bundle = P.encoded({'data': P.crew_data(self.before), 'html': self.template})
        # Preserve the encoded template text as well as its decoded string.
        bundle = bundle.replace('Andrew Fisher', 'Andrew\\u0020Fisher')
        return ('<script>const unrelated = 42;</script>\n<script>controllerBefore();\n'
                'var SVC1067_DATA=' + P.encoded(P.panel_data(self.before)) + ';\n'
                'var SVC1067_CARD=' + bundle + ';controllerAfter();</script>\n'
                "+' · v10.97'; /* v8.19 release922 */")

    @staticmethod
    def envelope(text):
        for marker in ('var SVC1067_CARD={"data":', 'var SVC1067_DATA='):
            _, start, end = P.object_at(text, marker)
            text = text[:start] + 'DATA' + text[end:]
        return text.replace('v10.97', 'VERSION').replace('v10.98', 'VERSION')

    def test_move_to_new_area_preserves_all_lines_and_service_rules(self):
        originals = copy.deepcopy((self.before, self.after, self.scope))
        P.validate_movement(self.before, self.after, self.scope)
        self.assertEqual((self.before, self.after, self.scope), originals)
        oldrefs = {r['ref']: r for a in self.before['areas'] for r in a['refs']}
        projected = P.crew_data(self.after)
        newrefs = {r['ref']: r for a in projected['areas'] for r in a['refs']}
        self.assertEqual(set(newrefs), set(oldrefs))
        self.assertEqual(newrefs['FIX01']['pin'], [-27.2, 153.2])
        self.assertEqual(newrefs['FIX01']['lines'][0]['nos'], ['SYNTHETIC-ASSET'])
        self.assertEqual(newrefs['FIX01']['lines'][0]['qty'], 1)
        self.assertEqual(projected['plans'], self.before['plans'])
        self.assertEqual(projected['days'], self.before['days'])
        self.assertEqual(self.after['areas'][-1]['refs'][0]['lines'], oldrefs['FIX01']['lines'])

    def test_move_to_existing_area_is_supported(self):
        area = self.after['areas'].pop()
        self.after['areas'][1]['refs'].extend(area['refs'])
        P.validate_movement(self.before, self.after, self.scope)

    def test_empty_or_multiple_moves_and_additions_are_refused(self):
        for scope in ({'add_refs': [], 'move_refs': []},
                      {'add_refs': [], 'move_refs': ['FIX01', 'FIX02']},
                      {'add_refs': ['NEW01'], 'move_refs': ['FIX01']},
                      {'move_refs': ['FIX01']}, {'add_refs': [], 'move_refs': ['UNKNOWN']}):
            with self.subTest(scope=scope), self.assertRaises(ValueError):
                P.validate_movement(self.before, self.after, scope)

    def test_missing_invalid_or_unchanged_pin_is_refused(self):
        for pin in (None, [], [-91, 153], [float('inf'), 153], [True, 153], [-27.0, 153.0]):
            after = copy.deepcopy(self.after); after['areas'][-1]['refs'][0]['pin'] = pin
            with self.subTest(pin=pin), self.assertRaises(ValueError):
                P.validate_movement(self.before, after, self.scope)

    def test_asset_quantity_line_id_and_line_pin_changes_are_refused(self):
        for field, value in [('id', 'OTHER-LINE'), ('qty', 2), ('nos', ['OTHER-ASSET']),
                             ('pin', [-28.0, 154.0]), ('kind', 'pump_only')]:
            after = copy.deepcopy(self.after)
            after['areas'][-1]['refs'][0]['lines'][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                P.validate_movement(self.before, after, self.scope)

    def test_unrelated_reference_area_and_service_metadata_changes_are_refused(self):
        for field in ('other_pin', 'area_name', 'tasks', 'days', 'plans', 'groups', 'extras'):
            after = copy.deepcopy(self.after)
            if field == 'other_pin': after['areas'][0]['refs'][0]['pin'] = [-28.0, 154.0]
            elif field == 'area_name': after['areas'][0]['name'] = 'Changed without authority'
            elif field == 'plans': after['plans']['fwf']['final'] = ['pump']
            elif isinstance(after[field], dict): after[field]['other'] = []
            else: after[field].append('other')
            with self.subTest(field=field), self.assertRaises(ValueError):
                P.validate_movement(self.before, after, self.scope)

    def test_reordering_and_unsupported_destination_metadata_are_refused(self):
        after = copy.deepcopy(self.after); after['areas'][0]['refs'].reverse()
        with self.assertRaises(ValueError): P.validate_movement(self.before, after, self.scope)
        after = copy.deepcopy(self.after); after['areas'][0], after['areas'][1] = after['areas'][1], after['areas'][0]
        with self.assertRaises(ValueError): P.validate_movement(self.before, after, self.scope)
        after = copy.deepcopy(self.after); after['areas'][-1]['extra'] = 'unsupported'
        with self.assertRaises(ValueError): P.validate_movement(self.before, after, self.scope)

    def test_only_two_json_values_and_footer_change(self):
        text = self.page()
        with mock.patch.object(P, 'BASE_SHA256', hashlib.sha256(text.encode()).hexdigest()):
            changed = P.patch(text, self.before, self.after, self.scope)
            self.assertEqual(self.envelope(text), self.envelope(changed))
            self.assertEqual(P.object_at(changed, 'var SVC1067_CARD=')[0]['html'], self.template)
            self.assertEqual(P.object_at(changed, 'var SVC1067_DATA=')[0], P.panel_data(self.after))
            self.assertEqual(P.object_at(changed, 'var SVC1067_CARD=')[0]['data'], P.crew_data(self.after))
            self.assertIn('v10.98', changed)

    def test_wrong_base_double_patch_and_stale_private_source_are_refused(self):
        text = self.page()
        with mock.patch.object(P, 'BASE_SHA256', hashlib.sha256(text.encode()).hexdigest()):
            changed = P.patch(text, self.before, self.after, self.scope)
            with self.assertRaises(ValueError): P.patch(changed, self.before, self.after, self.scope)
            with self.assertRaises(ValueError): P.patch(text + 'changed', self.before, self.after, self.scope)
            stale = copy.deepcopy(self.before); stale['areas'][0]['refs'][1]['pin'] = [-28, 154]
            with self.assertRaises(ValueError): P.patch(text, stale, self.after, self.scope)

    def test_all_private_inputs_are_required_and_read_from_named_environment(self):
        text = self.page()
        with tempfile.TemporaryDirectory() as folder:
            inputs = {'GC500_SERVICING_BASE_DATA': self.before,
                      'GC500_SERVICING_DATA': self.after, 'GC500_SERVICING_SCOPE': self.scope}
            env = {}
            for name, value in inputs.items():
                path = Path(folder) / (name + '.json'); path.write_text(json.dumps(value)); env[name] = str(path)
            with mock.patch.object(P, 'BASE_SHA256', hashlib.sha256(text.encode()).hexdigest()):
                with mock.patch.dict('os.environ', env):
                    self.assertEqual(self.envelope(P.patch(text)), self.envelope(text))
                with mock.patch.dict('os.environ', {}, clear=True):
                    with self.assertRaises(ValueError): P.patch(text)

    def test_private_location_text_is_script_escaped(self):
        self.after['areas'][-1]['refs'][0]['title'] = '</script><b>Fixture</b>'
        text = self.page()
        with mock.patch.object(P, 'BASE_SHA256', hashlib.sha256(text.encode()).hexdigest()):
            changed = P.patch(text, self.before, self.after, self.scope)
        self.assertNotIn('</script><b>Fixture', changed)
        self.assertIn('\\u003c', changed)


if __name__ == '__main__':
    unittest.main()
