"""Author: Andrew Fisher. Independent patch boundaries and complete byte restoration."""
import hashlib
import importlib.util
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch as mock_patch

ROOT = Path(__file__).resolve().parents[1]
BASE_SHA = "20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5"


class Boundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_path = Path(os.environ["BASE"])
        cls.base = cls.base_path.read_text(encoding="utf-8")
        assert hashlib.sha256(cls.base.encode()).hexdigest() == BASE_SHA, "Exact reviewed predecessor required"
        spec = importlib.util.spec_from_file_location("patch_v1257", ROOT / "patch_v1257.py")
        cls.p = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.p)
        cls.trace = []
        original = cls.p.rep

        def traced(text, old, new, what, source, need=True):
            assert need, "Every production replacement must be mandatory"
            pattern = "\n".join("[ \t]*" + r"\s+".join(re.escape(tok) for tok in line.split()) if line.split() else "[ \t]*" for line in old.split("\n"))
            matches = list(re.finditer(pattern, text))
            assert len(matches) == 1, "Every edit must have one predecessor boundary"
            actual_old = matches[0].group()
            result = original(text, old, new, what, source, need)
            cls.trace.append((actual_old, new, what))
            return result

        with mock_patch.object(cls.p, "rep", traced):
            cls.changed = cls.p.patch(cls.base)

    def test_every_declared_change_reverses_to_all_original_bytes(self):
        self.assertTrue(self.trace, "Shared exact replacement helper must be used")
        restored = self.changed
        for old, new, what in reversed(self.trace):
            self.assertEqual(restored.count(new), 1, "One successor boundary for " + what)
            restored = restored.replace(new, old, 1)
        self.assertEqual(restored, self.base, "No change outside the declared replacement boundaries")
        self.assertEqual(hashlib.sha256(restored.encode()).hexdigest(), BASE_SHA)
        self.assertNotEqual(self.changed, self.base)

    def test_original_html_styles_are_preserved(self):
        styles = lambda text: re.findall(r"<style\b[^>]*>[\s\S]*?</style>", text)
        before, after = styles(self.base), styles(self.changed)
        self.assertTrue(before, "Existing stylesheet blocks must be exercised")
        for original in before:
            self.assertEqual(after.count(original), 1, "Each original stylesheet stays exact")
        retained = [block for block in after if block in before]
        self.assertEqual(retained, before, "Original stylesheet order stays intact")
        added = [block for block in after if block not in before]
        self.assertEqual(len(added), 1, "Only the bounded map control stylesheet is added")
        self.assertRegex(added[0], r'<style id="map1257-style">')

    def test_data_and_external_script_blocks_are_preserved(self):
        scripts = lambda text: re.findall(r"<script\b([^>]*)>([\s\S]*?)</script>", text)
        retained = lambda text: [block for block in scripts(text) if re.search(r"\bsrc\s*=|application/(?:json|ld\+json)", block[0])]
        self.assertTrue(retained(self.base), "A real source/external block must be exercised")
        self.assertEqual(retained(self.changed), retained(self.base))

    def test_repeated_application_fails(self):
        with self.assertRaises((ValueError, SystemExit)):
            self.p.patch(self.changed)

    def test_wrong_bytes_with_matching_version_fail(self):
        with self.assertRaises((ValueError, SystemExit)):
            self.p.patch(self.base + " ")

    def test_wrong_release_fails(self):
        wrong = self.base.replace("+' · v12.54.1'; /* v8.19 release922", "+' · v12.53'; /* v8.19 release922", 1)
        self.assertNotEqual(wrong, self.base)
        with self.assertRaises((ValueError, SystemExit)):
            self.p.patch(wrong)

    def test_pure_and_deterministic(self):
        before = self.base_path.read_bytes()
        self.assertEqual(self.p.patch(self.base), self.changed)
        self.assertEqual(self.base_path.read_bytes(), before)

    def test_failed_cli_never_overwrites_input(self):
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / "page.html"
            before = (self.base + " ").encode()
            page.write_bytes(before)
            result = subprocess.run([sys.executable, str(ROOT / "patch_v1257.py"), str(page)], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(page.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
