"""Author: Andrew Fisher. Synthetic input and byte-preservation guards."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch as mock_patch

SPEC = importlib.util.spec_from_file_location('patch1071', Path(__file__).parents[1] / 'patch_v1071.py')
P = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(P)


def fixture():
    old = dict(schema=1, author='Andrew Fisher', base_sha256='a' * 64,
               sources=[dict(id='existing', sha256='b' * 64)], operations=[], plan_allowances=[])
    new = copy.deepcopy(old)
    new['sources'] += [dict(id='synthetic-' + str(i), sha256='c' * 64) for i in range(3)]
    for i, kind in enumerate(['scrim_existing'] * 3 + ['relocation']):
        new['operations'].append(dict(id='operation-' + str(i), type=kind, quantity=i + 1,
                                     unit='m', source_ids=['synthetic-' + str(min(i, 2))],
                                     basis='Synthetic regression input only.'))
    bundle = dict(schema=1, progress_before=old, progress_after=new)
    html = ('const DATA = {"sentinel":"unchanged"};\nconst FENCE_PROGRESS848 = '
            + json.dumps(old) + ';\nfunction fenceProgressEvidence848(asOf, options){}\n'
            + 'function todayFencingSummary848(asOf){}\n'
            + '<script id="departure1070-script"></script>\n'
            + "footer + ' · v10.70'\n</body>\n</html>")
    return html, bundle


class Guards(unittest.TestCase):
    def test_exact_replacement_and_repeat_refusal(self):
        html, bundle = fixture()
        result = P.patch(html, bundle)
        value, start, end = P.catalogue_span(result)
        self.assertEqual(value, bundle['progress_after'])
        _, old_start, old_end = P.catalogue_span(html)
        reverted = result[:start] + html[old_start:old_end] + result[end:]
        reverted = reverted.replace("+ ' · v10.71'", "+ ' · v10.70'").replace('\n' + P.MARK, '')
        self.assertEqual(reverted, html)
        with self.assertRaisesRegex(ValueError, 'already applied'):
            P.patch(result, bundle)

    def test_changed_current_catalogue_and_wrong_version(self):
        html, bundle = fixture()
        with self.assertRaisesRegex(ValueError, 'reviewed base'):
            P.patch(html.replace('"existing"', '"changed"'), bundle)
        with self.assertRaisesRegex(ValueError, 'final v10.70'):
            P.patch(html.replace('v10.70', 'v10.69'), bundle)
        with self.assertRaisesRegex(ValueError, 'exactly one'):
            P.apply_catalogue(html + html, bundle)

    def test_unrelated_input_changes_refused(self):
        _, bundle = fixture()
        mutations = [
            lambda b: b.update(ccb_after={}),
            lambda b: b['progress_after']['plan_allowances'].append({'id': 'new'}),
            lambda b: b['progress_after']['sources'][0].update(sha256='d' * 64),
            lambda b: b['progress_after']['operations'][0].update(type='clean'),
            lambda b: b['progress_after']['operations'][1].update(id='operation-0'),
            lambda b: b['progress_after']['operations'].pop(),
            lambda b: b['progress_after']['operations'][0].update(source_ids=['unknown']),
        ]
        for change in mutations:
            changed = copy.deepcopy(bundle)
            change(changed)
            with self.subTest(change=change), self.assertRaises(ValueError):
                P.validate_bundle(changed)

    def test_private_input_hash_and_script_escaping(self):
        html, bundle = fixture()
        bundle['progress_after']['operations'][0]['basis'] = '</script><script>bad()</script>'
        result = P.patch(html, bundle)
        self.assertNotIn('</script><script>bad()', result)
        self.assertIn('\\u0041ndrew Fisher', result)
        self.assertEqual(P.catalogue_span(result)[0], bundle['progress_after'])
        with tempfile.TemporaryDirectory() as temp:
            f = Path(temp) / 'synthetic.json'
            raw = json.dumps(bundle).encode()
            f.write_bytes(raw)
            with self.assertRaisesRegex(ValueError, 'exact bundle'):
                P.read_bundle(f)
            with mock_patch.object(P, 'APPROVED_INPUT_SHA256', hashlib.sha256(raw).hexdigest()):
                self.assertEqual(P.read_bundle(f), bundle)
                f.write_bytes(raw + b' ')
                with self.assertRaisesRegex(ValueError, 'exact bundle'):
                    P.read_bundle(f)


if __name__ == '__main__':
    unittest.main()
