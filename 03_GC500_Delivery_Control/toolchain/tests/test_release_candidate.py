#!/usr/bin/env python3
"""Author: Andrew Fisher. Runner failure propagation, using fixture processes only; no network/browser."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

spec = importlib.util.spec_from_file_location('release_candidate', Path(__file__).resolve().parents[1] / 'release_candidate.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class OutputChecks(unittest.TestCase):
    def test_rejects_failed_or_missing_assertions(self):
        for output in ('', 'all done', 'FAIL missing asset', 'PASS first\nFAIL second',
                       'AssertionError: missing tag', 'PASS first\nTraceback (most recent call last):',
                       '{"first":true,"second":false}', '{"pass":false}', '{}', '{broken'):
            with self.subTest(output=output), self.assertRaises(ValueError):
                runner.validate_output(output)

    def test_accepts_positive_assertions(self):
        runner.validate_output('PASS identity\nPASS all checks\n')
        runner.validate_output('{"first":true,"second":true}')

    def test_counted_summary_keeps_metadata_separate_from_assertions(self):
        good = {'author': 'Andrew Fisher', 'passed': 12, 'failed': 0, 'network': False,
                'reduced': False, 'liveWrites': 0, 'blocked': 0, 'errors': [], 'consoleErrors': []}
        runner.validate_output('PASS example\n' + json.dumps(good))
        for field, value in (('failed', 1), ('passed', 0), ('pass', False), ('success', False),
                             ('errors', ['runtime error']), ('consoleErrors', ['error']), ('blocked', 1), ('liveExplorer', 1)):
            with self.subTest(field=field), self.assertRaises(ValueError):
                runner.validate_output('PASS example\n' + json.dumps(dict(good, **{field: value})))

    def test_sweep_requires_every_route_link_and_back(self):
        row = {'ok': True, 'errors': [], 'console': []}
        result = {'success': True, 'tabs': dict.fromkeys(runner.ROUTES, row),
                  'hashes': dict.fromkeys(runner.LINKS, row), 'counts': {'blocked': 0},
                  'back': {'hash': '#plant', 'pane': 'pane-plant'},
                  'allErrors': [], 'cons': [], 'failures': []}
        runner.validate_output(json.dumps(result), 'sweep')
        variants = []
        for field, value in (('tabs', {}), ('hashes', {}), ('back', {'hash': '#today'}),
                             ('counts', {'blocked': 1}), ('allErrors', ['error']),
                             ('cons', ['error']), ('success', False)):
            variants.append(dict(result, **{field: value}))
        changed = dict(result, tabs=dict(result['tabs']))
        changed['tabs']['today'] = dict(row, ok=False)
        variants.append(changed)
        for data in variants:
            with self.subTest(data=data), self.assertRaises(ValueError):
                runner.validate_output(json.dumps(data), 'sweep')


class ProcessChecks(unittest.TestCase):
    def test_source_binding_covers_helpers_descriptors_and_direct_assets(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            tools = root / 'toolchain'
            draft = root / runner.FOLDERS[896]
            tools.mkdir()
            draft.mkdir()
            patch = draft / 'patch_v896.py'
            patch.write_text('# fixture')
            (draft / 'scene.js').write_text('const scene = 1;')
            (draft / 'assets').mkdir()
            (draft / 'assets/small.webp').write_bytes(b'actual build input')
            (draft / 'atlas896.json').write_text('{"cells":[{"file":"small.webp"}]}')
            (tools / 'rep.py').write_text('# build helper')
            for excluded in ('evidence', 'archive', 'generated', 'node_modules'):
                (draft / excluded).mkdir()
                (draft / excluded / 'ignored.json').write_text('{}')
            (draft / 'README.md').write_text('review notes')
            extra = root / 'external.csv'
            extra.write_text('authorised source')
            with mock.patch.multiple(runner, HERE=tools, CONTROL=root):
                bound = runner.source_binding([(896, patch)], {}, [extra])
                files = bound['files']
                for path in (patch, draft / 'scene.js', draft / 'atlas896.json',
                             draft / 'assets/small.webp', tools / 'rep.py', extra):
                    self.assertEqual(files[str(path)], runner.file_hash(path))
                self.assertEqual(len(files), 6)
                (draft / 'evidence/ignored.json').write_text('{"changed":true}')
                runner.require_same_sources(bound, runner.source_binding([(896, patch)], {}, [extra]))
                (draft / 'scene.js').write_text('const scene = 2;')
                with self.assertRaisesRegex(ValueError, 'bounded source inputs differ'):
                    runner.require_same_sources(bound, runner.source_binding([(896, patch)], {}, [extra]))
                with self.assertRaisesRegex(ValueError, 'bounded source inputs differ'):
                    runner.require_same_sources(None, bound)  # Old patch-only snapshots are not upgraded by assumption.

    def run_fixture(self, code, kind='assertions', timeout=10):
        with tempfile.TemporaryDirectory() as folder:
            return runner.run_step('fixture', [sys.executable, '-c', code], os.environ.copy(),
                                   Path(folder), timeout, kind)

    def test_nonzero_exit_wins_over_printed_pass(self):
        with self.assertRaisesRegex(ValueError, 'exited 7'):
            self.run_fixture('print("PASS misleading"); raise SystemExit(7)')

    def test_zero_exit_does_not_mask_fail_or_false_json(self):
        for code in ('print("FAIL hidden by exit zero")', 'print(\'{"pass":false}\')', 'pass'):
            with self.subTest(code=code), self.assertRaises(ValueError):
                self.run_fixture(code)

    def test_positive_process_returns_evidence(self):
        self.assertEqual(self.run_fixture('print("PASS checked")')['status'], 'pass')

    def test_timeout_is_failure(self):
        with self.assertRaises(subprocess.TimeoutExpired):
            self.run_fixture('import time; time.sleep(10)', timeout=0.05)

    def test_known_order_matches_current_patch_dependencies(self):
        args = argparse.Namespace(versions='884,885,886,887,888,889,893,894,891,892,895,896,897', patch=None)
        self.assertEqual([v for v, _ in runner.select_patches(args)], list(runner.CHAIN))
        args.versions = '894,895,891'
        with self.assertRaises(ValueError):
            runner.select_patches(args)

    def test_shell_wrapper_works_outside_checkout(self):
        run = subprocess.run(['bash', str(runner.HERE / 'release_candidate.sh'), '--help'],
                             cwd='/tmp', capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertIn('--evidence-dir', run.stdout)

    def test_wrapper_preserves_stage_sidecar_and_propagates_patch_failure(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            snapshots = root / 'private'
            snapshots.mkdir()
            page = root / 'page.html'
            page.write_text('before')
            patch = root / 'patch.py'
            patch.write_text('from pathlib import Path\nimport sys\np=Path(sys.argv[1])\np.write_text("after")\np.with_name("media_manifest_v896.json").write_text("{}")\n')
            wrapper = runner.make_wrappers([(896, patch)], snapshots)[0]
            result = subprocess.run([sys.executable, wrapper, str(page)], capture_output=True)
            self.assertEqual(result.returncode, 0)
            self.assertEqual((snapshots / 'v896.before.html').read_text(), 'before')
            self.assertEqual((snapshots / 'v896.after.html').read_text(), 'after')
            self.assertEqual((snapshots / 'media_manifest_v896.json').read_text(), '{}')
            patch.write_text('raise SystemExit(7)\n')
            result = subprocess.run([sys.executable, wrapper, str(page)], capture_output=True)
            self.assertNotEqual(result.returncode, 0)

    def test_fixture_build_binds_resume_to_candidate_and_keeps_evidence_private(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            repo = root / 'repo'
            control = repo / 'control'
            tools = control / 'toolchain'
            tools.mkdir(parents=True)
            (repo / '.git').mkdir()
            (repo / '.git/HEAD').write_text('ref: refs/heads/fixture\n')
            (tools / 'build.sh').write_text('''#!/bin/bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../build/GC500_$1"
shift
mkdir -p "$out"
printf base > "$out/base_live.html"
cp "$out/base_live.html" "$out/GC500_Delivery_Control_hosted.html"
for p in "$@"; do python3 "$p" "$out/GC500_Delivery_Control_hosted.html"; done
''')
            (tools / 'check_page.py').write_text('print("PASS fixture page")\n')
            patch = repo / 'patch_custom.py'
            source = repo / 'selected.js'
            source.write_text(' changed')
            patch.write_text('from pathlib import Path\nimport sys\np=Path(sys.argv[1]); p.write_text(p.read_text()+Path(__file__).with_name("selected.js").read_text())\n')
            evidence = root / 'private'
            with mock.patch.multiple(runner, HERE=tools, CONTROL=control, REPO=repo):
                self.assertEqual(runner.main(['--patch', str(patch), '--label', 'fixture', '--build-only',
                                              '--evidence-dir', str(evidence)]), 0)
                page = control / 'build/GC500_fixture/GC500_Delivery_Control_hosted.html'
                self.assertEqual(page.read_text(), 'base changed')
                self.assertEqual(evidence.stat().st_mode & 0o777, 0o700)
                binding = json.loads((evidence / 'snapshots/build.json').read_text())
                self.assertEqual(binding['candidate_sha256'], runner.file_hash(page))
                self.assertEqual(binding['sources']['files'][str(source)], runner.file_hash(source))
                source.write_text(' changed after capture')
                with self.assertRaisesRegex(ValueError, 'bounded source inputs differ'):
                    runner.main(['--patch', str(patch), '--page', str(page), '--snapshots', str(evidence / 'snapshots'),
                                 '--test', str(root / 'not-run.cjs'), '--evidence-dir', str(root / 'source-resume')])
                source.write_text(' changed')
                page.write_text('different candidate')
                with self.assertRaisesRegex(ValueError, 'differs from the captured build'):
                    runner.main(['--patch', str(patch), '--page', str(page), '--snapshots', str(evidence / 'snapshots'),
                                 '--test', str(root / 'not-run.cjs'), '--evidence-dir', str(root / 'resume')])
                with self.assertRaisesRegex(ValueError, 'outside every git checkout'):
                    runner.main(['--patch', str(patch), '--label', 'other', '--build-only', '--evidence-dir', str(repo / 'logs')])


if __name__ == '__main__':
    unittest.main()
