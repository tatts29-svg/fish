"""Author: Andrew Fisher. Guards use synthetic references; no operational data is published."""
import importlib.util
import os
from pathlib import Path
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('completion_patch', HERE / 'patch_completion1098.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)


class Guards(unittest.TestCase):
    def test_supported_input(self):
        patch.validate({'schema': 1, 'excluded_references': ['BARRIER-A']}, [{'key': 'BARRIER-A', 'product': 'WFB'}])

    def test_invalid_scope(self):
        for refs in [['BARRIER-A', 'BARRIER-A'], ['MISSING'], ['OTHER'], ['bad id'], 'BARRIER-A']:
            with self.subTest(refs=refs), self.assertRaises(ValueError):
                patch.validate({'schema': 1, 'excluded_references': refs}, [{'key': 'BARRIER-A', 'product': 'WFB'}, {'key': 'OTHER', 'product': 'Toilet'}])

    def test_extra_fields(self):
        with self.assertRaises(ValueError):
            patch.validate({'schema': 1, 'excluded_references': [], 'cancel': True}, [])

    def test_native_source_and_repeat_guards(self):
        text = Path(os.environ['BASE_PAGE']).read_text()
        output = patch.patch(text, {'schema': 1, 'excluded_references': []})
        with self.assertRaises(ValueError):
            patch.patch(output, {'schema': 1, 'excluded_references': []})
        with self.assertRaises(ValueError):
            patch.patch('wrong base', {'schema': 1, 'excluded_references': []})
        Path(os.environ['PAGE']).write_text(output)


if __name__ == '__main__':
    unittest.main()
