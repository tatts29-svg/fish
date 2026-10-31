"""Author: Andrew Fisher. Synthetic geometry/build guards; no private reference literals."""
import copy
import hashlib
import importlib.util
import io
import os
from pathlib import Path
import unittest
from PIL import Image

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('patch1099', HERE / 'patch_v1099.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


class GeometryGuards(unittest.TestCase):
    def setUp(self):
        self.data = {'areas': [{'n': 1, 'name': 'Synthetic area', 'refs': [{'ref': 'QA1', 'title': 'Test', 'pin': [-25, 150], 'lines': [
            {'id': 'QA1-A', 'type': 'FWF', 'kind': 'fwf', 'label': '1 toilet', 'qty': 1},
            {'id': 'QA1-B', 'type': 'Toilet Block 6m', 'kind': 'block', 'label': '1 block', 'qty': 1, 'pin': [-25.01, 150.01]}
        ]}]}]}
        self.maps = {'images': {'master': {'rect': [20, 30, 120, 90], 'px': [100, 60]}},
                     'positions': {'QA1': {'x': 50, 'y': 60}}, 'line_spots': {'QA1-B': {'ref': 'QA1', 'x': 100, 'y': 70}}}
        buf = io.BytesIO()
        Image.new('RGB', (100, 60), 'white').save(buf, format='JPEG')
        self.image = buf.getvalue()

    def build(self):
        return p.build_geometry(self.data, self.maps, self.image)

    def test_line_positions_preserved_and_image_unchanged(self):
        g = self.build()
        self.assertEqual(g['rect'], [20, 30, 120, 90])
        self.assertEqual(g['refs']['QA1']['lines']['QA1-A']['point'], {'x': 50, 'y': 60})
        self.assertEqual(g['refs']['QA1']['lines']['QA1-B']['point'], {'x': 100, 'y': 70})
        import base64
        self.assertEqual(base64.b64decode(g['image'].split(',')[1]), self.image)

    def test_null_location_not_replaced_with_old_reference_tag(self):
        self.maps['line_spots']['QA1-B'] = None
        self.maps['positions']['QA1'] = None
        g = self.build()
        self.assertIsNone(g['refs']['QA1']['lines']['QA1-A']['point'])
        self.assertIsNone(g['refs']['QA1']['lines']['QA1-B']['point'])

    def test_separate_pin_requires_registered_line_position(self):
        del self.maps['line_spots']['QA1-B']
        with self.assertRaisesRegex(ValueError, 'separate line pin'):
            self.build()

    def test_crop_aspect_must_match(self):
        self.maps['images']['master']['rect'][3] = 95
        with self.assertRaisesRegex(ValueError, 'aspect'):
            self.build()

    def test_image_dimensions_must_match(self):
        self.maps['images']['master']['px'] = [200, 120]
        with self.assertRaisesRegex(ValueError, 'dimensions'):
            self.build()

    def test_wrong_reference_or_unknown_line_rejected(self):
        self.maps['line_spots']['QA1-B']['ref'] = 'QA2'
        with self.assertRaisesRegex(ValueError, 'different reference'):
            self.build()
        self.maps['line_spots']['QA1-B']['ref'] = 'QA1'
        self.maps['line_spots']['unknown'] = None
        with self.assertRaisesRegex(ValueError, 'unknown servicing line'):
            self.build()

    def test_position_membership_must_match(self):
        self.maps['positions']['QA2'] = None
        with self.assertRaisesRegex(ValueError, 'differs'):
            self.build()
        del self.maps['positions']['QA1']
        with self.assertRaisesRegex(ValueError, 'missing'):
            self.build()

    def test_nonfinite_locations_rejected(self):
        self.maps['positions']['QA1']['x'] = float('nan')
        with self.assertRaisesRegex(ValueError, 'invalid registered'):
            self.build()

    def test_exact_base_guard(self):
        with self.assertRaisesRegex(ValueError, 'exact verified predecessor'):
            p.patch('<html>wrong base</html>', self.data, self.maps, self.image)

    def test_already_patched_guard(self):
        text = 'var SvcMap1099 = {}'
        with self.assertRaisesRegex(ValueError, 'already installed'):
            p.patch(text, self.data, self.maps, self.image, expected_sha=hashlib.sha256(text.encode()).hexdigest())


if __name__ == '__main__':
    unittest.main()
