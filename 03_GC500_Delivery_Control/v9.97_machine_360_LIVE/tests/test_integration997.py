"""Author: Andrew Fisher. Exact-base guards and preservation of records, layout and player."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import media997
import patch_v997


class Integration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = (ROOT.parent / 'build/GC500_v9.96-final/GC500_Delivery_Control_hosted.html').read_text()
        cls.data = media997.literal(cls.base)[0]
        cls.roles = {role: {'path': '/private/' + role, 'file': str(i)*64 + '.' + ext,
                           'sha256': str(i)*64, 'type': mime, 'bytes': 4096, 'scope': 'view'}
                     for i, (role, ext, mime) in enumerate([
                         ('full', 'mp4', 'video/mp4'), ('preview', 'mp4', 'video/mp4'),
                         ('poster', 'webp', 'image/webp')], 1)}

    def candidate(self, roles=None):
        with patch.object(patch_v997, 'load_report', return_value=roles or self.roles):
            return patch_v997.apply(self.base)

    def test_wrong_base_before_reading_media(self):
        with patch.object(patch_v997, 'load_report') as read:
            with self.assertRaisesRegex(ValueError, 'Wrong base'):
                patch_v997.apply(self.base + ' ')
            read.assert_not_called()

    def test_reapply_refused_before_reading_media(self):
        candidate = self.candidate()
        with patch.object(patch_v997, 'load_report') as read:
            with self.assertRaisesRegex(ValueError, 'already applied'):
                patch_v997.apply(candidate)
            read.assert_not_called()

    def test_everything_outside_three_scoped_fields_and_footer_is_identical(self):
        candidate = self.candidate()
        # Restore only the authorised literals, then require byte identity. This also
        # protects escaped names, CSS, scripts and the existing film player.
        restored = media997.replace_data(candidate, self.data)
        self.assertEqual(restored.replace("+ ' · v9.97'", "+ ' · v9.96'"), self.base)
        before = deepcopy(self.data)
        after = media997.literal(candidate)[0]
        for key, value in before['media'].items():
            self.assertEqual(after['media'][key], value)
        for d in (before, after):
            del d['machine']['hero'], d['media'], d['hostedMedia']['manifest']
        self.assertEqual(after, before)

    def test_unchanged_poster_can_be_reused_without_duplicate_catalogue_entry(self):
        roles = deepcopy(self.roles)
        old = self.data['machine']['hero']['poster']['media']
        roles['poster'] = dict(self.data['media'][old], path='/private/existing-poster.webp')
        after = media997.literal(self.candidate(roles))[0]
        self.assertEqual(len(after['media']), len(self.data['media']) + 2)
        self.assertEqual(after['machine']['hero']['poster'], {'media': old})
        self.assertEqual(after['hostedMedia']['manifest'], media997.manifest(after['media'])['sha256'])

    def test_existing_media_metadata_cannot_be_overwritten(self):
        roles = deepcopy(self.roles)
        roles['full']['sha256'] = self.data['machine']['hero']['mp4']['media']
        with self.assertRaisesRegex(ValueError, 'descriptor changed'):
            self.candidate(roles)

    def test_report_is_bound_to_a_digest(self):
        with self.assertRaisesRegex(ValueError, 'SHA-256'):
            media997.load_report('/not/read', None)


if __name__ == '__main__':
    unittest.main()
