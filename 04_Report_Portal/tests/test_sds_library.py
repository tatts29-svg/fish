"""Only publish the new register after its referenced PDFs have been validated."""
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sds_library import install
from upload_policy import MMG_PROJECT


def bundle(project, document, name):
    data = io.BytesIO()
    with zipfile.ZipFile(data, "w") as archive:
        index = {"project": project, "entries": {"123": {"file": name}}}
        archive.writestr("register.json", json.dumps(index))
        archive.writestr("pdfs/" + name, document)
    return data.getvalue()


class SDSLibrary(unittest.TestCase):
    def test_scope_integrity_and_failed_replace(self):
        pdf = b"%PDF-1.7\nexample"
        name = "example-" + hashlib.sha256(pdf).hexdigest()[:12] + ".pdf"
        with tempfile.TemporaryDirectory() as tmp:
            index = Path(tmp) / "sds/register.json"
            self.assertEqual(install(bundle(MMG_PROJECT, pdf, name), tmp), 1)
            before = index.read_bytes()
            for project, body, filename in [("Another mine", pdf, name),
                                            (MMG_PROJECT, pdf + b"changed", name),
                                            (MMG_PROJECT, pdf, "../" + name)]:
                with self.assertRaises(ValueError):
                    install(bundle(project, body, filename), tmp)
                self.assertEqual(index.read_bytes(), before)
            self.assertEqual((index.parent / "pdfs" / name).read_bytes(), pdf)
