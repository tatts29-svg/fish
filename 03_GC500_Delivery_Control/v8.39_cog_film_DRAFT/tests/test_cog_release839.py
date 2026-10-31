"""Author: Andrew Fisher. Portable synthetic media and scoped release validation."""
from copy import deepcopy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('film_release839_tested', ROOT / 'film_release839.py')
release = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(release)


def digest(value):
    return hashlib.sha256(value).hexdigest()


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg and ffprobe are required')
class FilmRelease839Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from PIL import Image
        cls.temp = tempfile.TemporaryDirectory(prefix='synthetic-film839-')
        cls.addClassCleanup(cls.temp.cleanup)
        cls.directory = Path(cls.temp.name)
        cls.preview = cls.make_video('preview.mp4', 1920, 1080)
        cls.full = cls.make_video('full.mp4', 3840, 2160)
        cls.poster = cls.directory / 'poster.png'
        Image.new('RGB', (1920, 1080), (23, 45, 67)).save(cls.poster)
        cls.valid = {'schema':1, 'author':'Andrew Fisher', 'roles':{
            'preview':cls.video_role(cls.preview),
            'full':cls.video_role(cls.full),
            'poster':cls.file_role(cls.poster, 'image/png', 1920, 1080),
        }}

    @classmethod
    def make_video(cls, name, width, height, fps=25, frames=2, audio=False):
        target = cls.directory / name
        command = ['ffmpeg','-hide_banner','-loglevel','error','-y',
                   '-f','lavfi','-i',f'color=c=0x123456:s={width}x{height}:r={fps}']
        if audio:
            command += ['-f','lavfi','-i','anullsrc=r=48000:cl=mono']
        command += ['-frames:v',str(frames),'-c:v','libx264','-preset','ultrafast',
                    '-pix_fmt','yuv420p','-threads','1']
        command += ['-c:a','aac','-t',str(frames / fps)] if audio else ['-an']
        command += ['-movflags','+faststart',str(target)]
        subprocess.run(command, capture_output=True, text=True, check=True, timeout=60)
        return target

    @staticmethod
    def file_role(path, mime, width, height):
        raw = path.read_bytes()
        return {'path':str(path), 'sha256':digest(raw), 'bytes':len(raw),
                'type':mime, 'width':width, 'height':height}

    @classmethod
    def video_role(cls, path):
        probe = json.loads(subprocess.run(
            ['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],
            capture_output=True, text=True, check=True, timeout=30).stdout)
        stream = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        numerator, denominator = map(int, stream['avg_frame_rate'].split('/'))
        return {**cls.file_role(path, 'video/mp4', stream['width'], stream['height']),
                'duration':float(stream['duration']), 'fps':numerator / denominator,
                'codec':stream['codec_name'], 'pixel_format':stream['pix_fmt']}

    def write_input(self, value=None, raw=None):
        target = self.directory / 'input.json'
        data = raw if raw is not None else json.dumps(value if value is not None else self.valid).encode()
        target.write_bytes(data)
        return str(target), digest(data)

    def load(self, value=None):
        return release.load_input(*self.write_input(value))

    def assert_rejected(self, mutate):
        value = deepcopy(self.valid)
        mutate(value)
        with self.assertRaises(ValueError):
            self.load(value)

    def synthetic_data(self):
        old_hash = 'e' * 64
        catalogue = {old_hash:{'file':old_hash + '.png', 'sha256':old_hash,
                               'type':'image/png', 'bytes':321, 'scope':'edit'}}
        return {
            'edition':'hosted', 'financial_fixture':{'amount':123.45,'note':'Synthetic only'},
            'machine':{'hero':{'src':{'media':old_hash},'webm':'previous.webm'},
                       'version':'fixture-machine', 'parts':7, 'other':{'keep':['unchanged']}},
            'media':catalogue,
            'hostedMedia':{'schema':'gc500-media-v1', 'manifest':release.media_manifest(catalogue)['sha256'],
                           'fonts':{'keep':True}, 'board':{'keep':'fixture'}, 'optional':None},
        }

    def test_verified_roles_are_content_addressed_and_have_no_private_paths(self):
        checked = self.load()
        self.assertEqual(set(checked), {'roles'})
        self.assertEqual(set(checked['roles']), {'preview','full','poster'})
        for role, item in checked['roles'].items():
            expected = self.valid['roles'][role]
            self.assertEqual(item['sha256'], expected['sha256'])
            self.assertEqual(item['bytes'], expected['bytes'])
            self.assertEqual(item['file'], expected['sha256'] + ('.png' if role == 'poster' else '.mp4'))
            self.assertNotIn('path', item)
            self.assertEqual(set(item), {'file','sha256','type','bytes','width','height'} |
                             (set() if role == 'poster' else {'duration','fps'}))
        self.assertNotIn(str(self.directory), json.dumps(checked))

    def test_input_fingerprint_and_absolute_path_are_mandatory(self):
        path, fingerprint = self.write_input()
        for candidate, sha in [(path, '0' * 64), (path, 'invalid'), ('input.json', fingerprint)]:
            with self.subTest(candidate=candidate, sha=sha), self.assertRaises(ValueError):
                release.load_input(candidate, sha)
        Path(path).write_bytes(Path(path).read_bytes() + b' ')
        with self.assertRaises(ValueError):
            release.load_input(path, fingerprint)

    def test_duplicate_json_keys_cannot_override_a_reviewed_field(self):
        raw = json.dumps(self.valid).replace('"schema": 1', '"schema": 1, "schema": 1').encode()
        with self.assertRaises(ValueError):
            release.load_input(*self.write_input(raw=raw))
        raw = json.dumps(self.valid).replace('"codec": "h264"', '"codec": "h264", "codec": "h264"', 1).encode()
        with self.assertRaises(ValueError):
            release.load_input(*self.write_input(raw=raw))

    def test_exact_schema_roles_and_role_fields(self):
        changes = [
            lambda d: d.update(extra=True),
            lambda d: d.update(author='Fixture other author'),
            lambda d: d.update(schema=2),
            lambda d: d['roles'].pop('poster'),
            lambda d: d['roles'].update(extra=deepcopy(d['roles']['poster'])),
            lambda d: d['roles']['preview'].update(scope='edit'),
            lambda d: d['roles']['poster'].update(duration=1),
            lambda d: d['roles']['preview'].pop('codec'),
        ]
        for index, change in enumerate(changes):
            with self.subTest(index=index):
                self.assert_rejected(change)

    def test_boolean_schema_is_not_the_integer_schema_version(self):
        self.assert_rejected(lambda d: d.update(schema=True))

    def test_file_hash_count_existence_and_size_are_checked(self):
        changes = [
            lambda d: d['roles']['preview'].update(sha256='0' * 64),
            lambda d: d['roles']['preview'].update(bytes=d['roles']['preview']['bytes'] + 1),
            lambda d: d['roles']['preview'].update(bytes=0),
            lambda d: d['roles']['preview'].update(bytes=True),
            lambda d: d['roles']['preview'].update(bytes=32 * 1024 * 1024 + 1),
            lambda d: d['roles']['preview'].update(path=str(self.directory / 'missing.mp4')),
            lambda d: d['roles']['preview'].update(path='relative.mp4'),
        ]
        for index, change in enumerate(changes):
            with self.subTest(index=index):
                self.assert_rejected(change)
        changed = self.directory / 'changed.mp4'
        raw = bytearray(self.preview.read_bytes())
        raw[-1] ^= 1
        changed.write_bytes(raw)
        self.assert_rejected(lambda d: d['roles']['preview'].update(path=str(changed)))

    def test_wrong_declared_video_type_codec_dimensions_and_timing_are_rejected(self):
        for field, value in [('type','video/webm'), ('codec','vp9'), ('pixel_format','yuv444p'),
                             ('width',1280), ('height',720), ('width',True), ('fps',True),
                             ('fps',30), ('duration',1), ('duration',float('inf'))]:
            with self.subTest(field=field, value=value):
                self.assert_rejected(lambda d: d['roles']['preview'].update({field:value}))

    def test_media_changed_during_metadata_verification_cannot_be_accepted(self):
        for role, reader in [('preview','video_info'), ('poster','poster_info')]:
            value = deepcopy(self.valid)
            original = Path(value['roles'][role]['path'])
            mutable = self.directory / ('mutable-' + original.name)
            mutable.write_bytes(original.read_bytes())
            value['roles'][role]['path'] = str(mutable)
            inspect = getattr(release, reader)

            def inspect_then_change(path):
                info = inspect(path)
                if Path(path) == mutable:
                    raw = bytearray(mutable.read_bytes())
                    raw[-1] ^= 1
                    mutable.write_bytes(raw)
                return info

            with self.subTest(role=role), patch.object(release, reader, side_effect=inspect_then_change):
                with self.assertRaisesRegex(ValueError, 'changed during metadata verification'):
                    self.load(value)

    def test_actual_audio_track_is_rejected(self):
        audio = self.make_video('with-audio.mp4', 1920, 1080, audio=True)
        self.assert_rejected(lambda d: d['roles'].update(preview=self.video_role(audio)))

    def test_actual_codec_dimensions_and_timing_are_verified_independently(self):
        actual = release.video_info(self.preview)
        for field, value in [('codec','mpeg4'), ('pixel_format','yuv444p'), ('width',1280),
                             ('height',720), ('fps',30), ('duration',1)]:
            with self.subTest(field=field), patch.object(release, 'video_info', return_value={**actual,field:value}):
                with self.assertRaises(ValueError):
                    self.load()

    def test_declared_duration_tolerance_is_one_frame(self):
        value = deepcopy(self.valid)
        value['roles']['preview']['duration'] += 1 / value['roles']['preview']['fps']
        self.assertIn('roles', self.load(value))
        value['roles']['preview']['duration'] += .001
        with self.assertRaises(ValueError):
            self.load(value)

    def test_preview_and_full_actual_timing_must_agree(self):
        different_rate = self.make_video('full-rate.mp4', 3840, 2160, fps=30)
        longer = self.make_video('full-long.mp4', 3840, 2160, frames=4)
        for video in [different_rate, longer]:
            with self.subTest(video=video.name):
                self.assert_rejected(lambda d: d['roles'].update(full=self.video_role(video)))

    def test_poster_decoding_type_dimensions_and_aspect_ratio_are_checked(self):
        from PIL import Image
        self.assert_rejected(lambda d: d['roles']['poster'].update(type='image/jpeg'))
        self.assert_rejected(lambda d: d['roles']['poster'].update(width=640))
        square = self.directory / 'square.png'
        Image.new('RGB', (32, 32)).save(square)
        self.assert_rejected(lambda d: d['roles'].update(poster=self.file_role(square, 'image/png', 32, 32)))
        bad = self.directory / 'bad.png'
        bad.write_bytes(b'not an image')
        self.assert_rejected(lambda d: d['roles'].update(poster=self.file_role(bad, 'image/png', 1920, 1080)))
        jpeg = self.directory / 'poster.jpg'
        Image.new('RGB', (160, 90)).save(jpeg)
        value = deepcopy(self.valid)
        value['roles']['poster'] = self.file_role(jpeg, 'image/jpeg', 160, 90)
        self.assertTrue(self.load(value)['roles']['poster']['file'].endswith('.jpg'))

    def test_the_same_asset_cannot_fill_different_roles(self):
        self.assert_rejected(lambda d: d['roles'].update(full=deepcopy(d['roles']['preview'])))

    def test_media_updates_are_pure_additive_and_confined_to_three_data_paths(self):
        data, checked = self.synthetic_data(), self.load()
        before_data, before_checked = deepcopy(data), deepcopy(checked)
        result = release.media_updates(data, checked)
        self.assertEqual(data, before_data)
        self.assertEqual(checked, before_checked)
        self.assertIsNot(result, data)
        self.assertEqual(len(result['media']), len(data['media']) + 3)
        for key, descriptor in data['media'].items():
            self.assertEqual(result['media'][key], descriptor)
        for item in checked['roles'].values():
            self.assertEqual(result['media'][item['sha256']], {
                **{key:item[key] for key in ['file','sha256','type','bytes']}, 'scope':'view'})
        self.assertEqual(result['hostedMedia']['manifest'], release.media_manifest(result['media'])['sha256'])
        self.assertNotEqual(result['hostedMedia']['manifest'], data['hostedMedia']['manifest'])
        for value in [data, result]:
            del value['media']
            del value['machine']['hero']
            del value['hostedMedia']['manifest']
        self.assertEqual(result, data)
        hero = release.media_updates(before_data, checked)['machine']['hero']
        self.assertEqual(hero['mp4'], {'media':checked['roles']['preview']['sha256']})
        self.assertEqual(hero['full_mp4'], {'media':checked['roles']['full']['sha256']})
        self.assertEqual(hero['poster'], {'media':checked['roles']['poster']['sha256']})
        self.assertNotIn('webm', hero)
        self.assertNotIn(str(self.directory), json.dumps(hero))

    def test_catalogue_integrity_scope_and_existing_asset_collision_are_guarded(self):
        checked = self.load()
        for mutate in [
            lambda d: d['hostedMedia'].update(manifest='0' * 64),
            lambda d: next(iter(d['media'].values())).update(scope='public'),
            lambda d: next(iter(d['media'].values())).update(extra=True),
        ]:
            data = self.synthetic_data()
            mutate(data)
            with self.assertRaises(ValueError):
                release.media_updates(data, checked)
        data = self.synthetic_data()
        item = checked['roles']['preview']
        data['media'][item['sha256']] = {**{key:item[key] for key in ['file','sha256','type','bytes']},'scope':'view'}
        data['hostedMedia']['manifest'] = release.media_manifest(data['media'])['sha256']
        with self.assertRaises(ValueError):
            release.media_updates(data, checked)

    def test_manifest_digest_is_canonical_and_order_independent(self):
        result = release.media_updates(self.synthetic_data(), self.load())
        first = release.media_manifest(result['media'])
        second = release.media_manifest(dict(reversed(list(result['media'].items()))))
        self.assertEqual(first, second)
        sha = first.pop('sha256')
        raw = json.dumps(first, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
        self.assertEqual(sha, digest(raw))

    def test_wrong_base_and_repeat_guards_run_before_media_reads(self):
        for text in ['synthetic wrong base', release.MARKER, 'function createCogMedia835(']:
            with self.subTest(text=text), patch.object(release, 'load_input', side_effect=AssertionError('Input must not be read')):
                with self.assertRaises(ValueError):
                    release.apply(text)

    @unittest.skipUnless(os.environ.get('BASE'), 'Set BASE only when full composition checks are authorised')
    def test_optional_exact_base_preserves_all_other_source_bytes(self):
        text = Path(os.environ['BASE']).read_text()
        self.assertEqual(digest(text.encode()), release.BASE_SHA256)
        path, fingerprint = self.write_input()
        result = release.apply(text, path, fingerprint)
        component = release.component().apply(text)
        _, start, end = release.literal(result)
        _, old_start, old_end = release.literal(component)
        original_raw, updated_raw = component[old_start:old_end], result[start:end]
        spans = []
        for keys in [('machine','hero'), ('media',), ('hostedMedia','manifest')]:
            a,b = release.value_span(updated_raw, keys)
            old_a,old_b = release.value_span(original_raw, keys)
            spans.append((a,b,original_raw[old_a:old_b]))
        for a,b,old in sorted(spans, reverse=True):
            updated_raw = updated_raw[:a] + old + updated_raw[b:]
        restored = result[:start] + updated_raw + result[end:]
        restored = restored.replace(release.MARKER + '\n', '', 1)
        restored = restored.replace('<meta name="gc500-release" content="v8.39">', '<meta name="gc500-release" content="v8.38">', 1)
        restored = restored.replace("+ ' · v8.39'; /* v8.19 - the footer names the release once */", "+ ' · v8.38'; /* v8.19 - the footer names the release once */", 1)
        self.assertTrue(restored == component, 'Only the approved data values and release markers may differ')
        with self.assertRaises(ValueError):
            release.apply(result, path, fingerprint)


if __name__ == '__main__':
    unittest.main()
