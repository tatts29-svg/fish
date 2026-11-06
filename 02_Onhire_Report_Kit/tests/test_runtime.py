"""Runtime regressions that run without Windows or external services."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

KIT = Path(__file__).resolve().parents[1]


def load_module(name, filename):
    spec = importlib.util.spec_from_file_location(name, KIT / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class RuntimeTests(unittest.TestCase):
    def test_installer_library_probe_accepts_apostrophes_and_spaces(self):
        # Execute the actual embedded Python probe, using a stand-in library
        # that is available only in this simulated kit path.
        script = (KIT / "3_GET_PYTHON_NO_ADMIN.bat").read_text()
        probe = re.search(r'"%KIT%_python\\python.exe" -c "([^"\n]*import openpyxl)"', script).group(1)
        with tempfile.TemporaryDirectory(prefix="Coates O'Brien [QA] ") as folder:
            library = Path(folder) / "_lib"
            library.mkdir()
            (library / "openpyxl.py").write_text("TEST_LIBRARY = True\n")
            env = dict(os.environ, KIT=folder + os.sep)
            result = subprocess.run([sys.executable, "-I", "-S", "-c", probe],
                                    env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_corrupt_nonempty_export_cannot_pass_laptop_check(self):
        check = load_module("laptop_check", "check_this_laptop.py")
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            (base / "_lib").mkdir()
            (base / "Data_SiteIQ").mkdir()
            for name in ("build_onhire_workbook.py", "coates_pdf.py", "JOB.txt", "_RUN.bat"):
                (base / name).touch()
            for name in check.NEEDED:
                (base / "Data_SiteIQ" / (name + ".xlsx")).write_bytes(b"Not an Excel file")
            with mock.patch.object(check, "HERE", folder), \
                    mock.patch.object(check, "_LIB", str(base / "_lib")), \
                    contextlib.redirect_stdout(io.StringIO()):
                result = check.main()
            self.assertEqual(result, 1)
            unreadable = [r for r in check.results if r[0] == check.STOP and "cannot be read" in r[1]]
            self.assertEqual(len(unreadable), 3)
            self.assertNotIn("READY - this laptop will build the report", "\n".join(check.lines))


if __name__ == "__main__":
    unittest.main()
