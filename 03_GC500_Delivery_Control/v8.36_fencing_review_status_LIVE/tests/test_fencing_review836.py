"""Author: Andrew Fisher. Synthetic private-input boundary and exact patch tests."""
import copy
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch as mock_patch
import unittest

import fitz

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import fencing_review836 as patch
import patch_v836 as release


class ReviewInputTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = Path(self.tmp.name)
        pack = self.folder / 'pack.pdf'
        with fitz.open() as doc:
            for word in ['Synthetic first page', 'Different second page']:
                page = doc.new_page(width=300, height=400)
                page.insert_text((30, 60), word)
            doc.save(pack)
        self.one = self.folder / 'page.pdf'
        with fitz.open(pack) as doc, fitz.open() as single:
            single.insert_pdf(doc, from_page=0, to_page=0)
            single.save(self.one)
        digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
        self.data = {'schema': 1, 'author': 'Andrew Fisher',
                     'sources': [{'id': 'synthetic-pack.pdf', 'title': 'Synthetic original', 'sha256': digest(pack), 'path': str(pack)},
                                 {'id': 'synthetic-summary.pdf', 'title': 'Synthetic summary', 'sha256': digest(pack), 'path': str(pack)}],
                     'rows': [{'record_id': 'fixture-A', 'docket_no': 'test-A', 'book': 'red', 'reviewed_on': '2026-01-02',
                               'original': {'source_id': 'synthetic-pack.pdf', 'page': 1, 'page_sha256': digest(self.one), 'page_path': str(self.one)},
                               'summary': {'source_id': 'synthetic-summary.pdf'},
                               'po': {'number': '8000001', 'basis': 'source_summary', 'source_id': 'synthetic-summary.pdf'},
                               'expected': {'date': '2026-01-01', 'location': 'Synthetic yard', 'quantities': {'clean': 5}, 'components': None},
                               'query': {'open': True, 'text': 'Synthetic charge query.'}}]}
        self.input = self.folder / 'input.json'

    def read(self, data=None):
        self.input.write_text(json.dumps(self.data if data is None else data))
        return patch.load_input(str(self.input))

    def test_files_and_page_checked_and_paths_stripped(self):
        original = copy.deepcopy(self.data)
        result = self.read()
        self.assertEqual(self.data, original)
        self.assertEqual(result['sources'][0]['pages'], 2)
        self.assertNotIn(str(self.folder), json.dumps(result))
        self.assertNotIn('page_path', result['rows'][0]['original'])
        self.assertEqual(result['rows'][0]['expected'], original['rows'][0]['expected'])

    def image_fixture(self):
        from PIL import Image
        path = self.folder / 'original.jpg'
        Image.new('RGB', (32, 24), (20, 90, 180)).save(path, format='JPEG')
        sha = hashlib.sha256(path.read_bytes()).hexdigest()
        self.data['sources'][0] = {'id': 'synthetic-original.jpg', 'title': 'Synthetic original image', 'sha256': sha, 'path': str(path)}
        self.data['rows'][0]['original'] = {'source_id': 'synthetic-original.jpg', 'page': 1, 'page_sha256': sha, 'page_path': str(path)}
        return path

    def test_jpeg_original_is_verified_without_conversion(self):
        path = self.image_fixture()
        before = path.read_bytes()
        result = self.read()
        self.assertEqual(result['sources'][0]['media_type'], 'image/jpeg')
        self.assertEqual(result['sources'][0]['pages'], 1)
        self.assertEqual(result['sources'][1]['media_type'], 'application/pdf')
        self.assertEqual(result['rows'][0]['original']['page_sha256'], result['sources'][0]['sha256'])
        self.assertEqual(path.read_bytes(), before)
        self.assertNotIn(str(path), json.dumps(result))

    def test_jpeg_page_and_declared_media_type_must_match(self):
        self.image_fixture()
        self.data['rows'][0]['original']['page'] = 2
        with self.assertRaisesRegex(ValueError, 'outside'):
            self.read()
        self.data['rows'][0]['original']['page'] = 1
        self.data['sources'][0]['media_type'] = 'application/pdf'
        with self.assertRaisesRegex(ValueError, 'media type'):
            self.read()

    def test_jpeg_wrong_original_pixels_and_unsupported_format_rejected(self):
        from PIL import Image
        self.image_fixture()
        other = self.folder / 'different.jpg'
        Image.new('RGB', (32, 24), (180, 40, 10)).save(other, format='JPEG')
        self.data['rows'][0]['original'].update(page_path=str(other), page_sha256=hashlib.sha256(other.read_bytes()).hexdigest())
        with self.assertRaisesRegex(ValueError, 'differs from its named original'):
            self.read()
        png = self.folder / 'unsupported.png'
        Image.new('RGB', (32, 24), (20, 90, 180)).save(png, format='PNG')
        self.data['sources'][0].update(path=str(png), sha256=hashlib.sha256(png.read_bytes()).hexdigest())
        with self.assertRaisesRegex(ValueError, 'PDF or JPEG'):
            self.read()

    def test_source_and_export_hash_changes_rejected(self):
        for parent, key in [(self.data['sources'][0], 'sha256'), (self.data['rows'][0]['original'], 'page_sha256')]:
            old = parent[key]
            parent[key] = '0' * 64
            with self.assertRaises(ValueError):
                self.read()
            parent[key] = old

    def test_other_original_page_cannot_use_first_page_export(self):
        self.data['rows'][0]['original']['page'] = 2
        with self.assertRaisesRegex(ValueError, 'differs from its named original'):
            self.read()

    def test_page_boundary_rejected(self):
        for page in [0, 3, True, '1']:
            self.data['rows'][0]['original']['page'] = page
            with self.assertRaises(ValueError):
                self.read()

    def test_duplicate_identity_rejected(self):
        row = copy.deepcopy(self.data['rows'][0])
        row['docket_no'] = 'test-B'
        self.data['rows'].append(row)
        with self.assertRaisesRegex(ValueError, 'record ID'):
            self.read()
        row['record_id'] = 'fixture-B'
        row['docket_no'] = 'test-A'
        with self.assertRaisesRegex(ValueError, 'docket number'):
            self.read()

    def test_exact_field_signature_and_finite_values_required(self):
        row = self.data['rows'][0]
        del row['expected']['components']
        with self.assertRaisesRegex(ValueError, 'signature'):
            self.read()
        row['expected']['components'] = None
        row['expected']['quantities']['clean'] = float('nan')
        with self.assertRaises(ValueError):
            self.read()

    def test_unassigned_review_is_allowed_but_cannot_inherit_po(self):
        row = self.data['rows'][0]
        row['summary'] = None
        with self.assertRaisesRegex(ValueError, 'explicit matching summary'):
            self.read()
        row['po'] = None
        result = self.read()
        self.assertIsNone(result['rows'][0]['po'])
        self.assertIsNone(result['rows'][0]['summary'])

    def test_charge_query_requires_explicit_boolean_and_explanation(self):
        query = self.data['rows'][0]['query']
        query['open'] = False
        self.assertIs(self.read()['rows'][0]['query']['open'], False)
        for value in [None, 0, 1, 'false']:
            query['open'] = value
            with self.assertRaisesRegex(ValueError, 'explicit boolean'):
                self.read()
        query['open'] = False
        query['text'] = ''
        with self.assertRaisesRegex(ValueError, 'explanation'):
            self.read()

    def test_source_identity_cannot_embed_private_path(self):
        self.data['sources'][0]['id'] = '/private/source.pdf'
        with self.assertRaisesRegex(ValueError, 'path-free'):
            self.read()

    def test_script_boundary_escaped(self):
        self.data['rows'][0]['query']['text'] = '</script><script>bad()</script>'
        manifest = self.read()
        fragment = patch.changes(manifest)[0][1]
        self.assertNotIn('</script>', fragment)
        self.assertIn('\\u003c/script\\u003e', fragment)

    def test_release_refuses_wrong_base_and_repeat_before_input(self):
        for raw, reason in [(b'wrong base', 'exact reviewed'), (b'const FENCE_REVIEW836 = {};', 'already applied')]:
            with self.assertRaisesRegex(ValueError, reason):
                release.build(raw, '/absent-private-manifest')

    def test_private_environment_input_required(self):
        with mock_patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(ValueError, 'FENCE_REVIEW836_INPUT'):
                patch.load_input()
        self.read()
        with mock_patch.dict(os.environ, {'FENCE_REVIEW836_INPUT': str(self.input)}):
            self.assertEqual(patch.load_input(), patch.load_input(str(self.input)))

    @unittest.skipUnless(os.environ.get('BASE'), 'Set private BASE for exact release wrapper verification')
    def test_release_changes_only_component_and_version(self):
        raw = Path(os.environ['BASE']).read_bytes()
        self.read()
        with mock_patch.dict(os.environ, {'FENCE_REVIEW836_INPUT': str(self.input)}):
            actual = release.build(raw).decode('utf-8')
        expected = patch.apply(raw.decode('utf-8'), str(self.input))
        for old, new, label in release.RELEASE_CHANGES:
            self.assertEqual(expected.count(old), 1, label)
            expected = expected.replace(old, new, 1)
        self.assertEqual(actual, expected)
        self.assertIn('<meta name="gc500-release" content="v8.36">', actual)
        with self.assertRaisesRegex(ValueError, 'already applied'):
            release.build(actual.encode('utf-8'), str(self.input))

    @unittest.skipUnless(os.environ.get('BASE'), 'Set private BASE for exact complete-page preservation')
    def test_exact_native_source_preservation(self):
        base = Path(os.environ['BASE']).read_text()
        manifest = self.read()
        actual = patch.apply(base, str(self.input))
        expected, positions = base, []
        for old, new, label in patch.changes(manifest):
            self.assertEqual(expected.count(old), 1, label)
            pos = expected.index(old)
            positions.append((pos, old, new))
            expected = expected[:pos] + new + expected[pos+len(old):]
        self.assertEqual(actual, expected)
        for pos, old, new in reversed(positions):
            self.assertEqual(expected[pos:pos+len(new)], new)
            expected = expected[:pos] + old + expected[pos+len(new):]
        self.assertEqual(expected, base)
        for name in ['costDocket', 'allDockets', 'serviceNoteRows', 'poAll', 'setPo', 'fencePrivateApply']:
            start = base.index('function ' + name + '(')
            end = base.find('\nfunction ', start+1)
            self.assertIn(base[start:end], actual, name)
        self.assertIn("text:'Approved by Andrew · docket attached'", actual)
        self.assertIn('class="fp-native-actions"', actual)
        with self.assertRaises(ValueError):
            patch.apply(actual, str(self.input))
        with self.assertRaises(ValueError):
            patch.apply(base.replace('function pricingAction834(', 'function absentBase('), str(self.input))


if __name__ == '__main__':
    unittest.main()
