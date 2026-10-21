"""Author: Andrew Fisher. Synthetic private-input hash/schema/HTML escaping checks."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from private_input1105 import read_private_input


class PrivateInputTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        fixture_module = Path(__file__).with_name('test_financialAssociation1105.cjs')
        output = subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require(process.argv[1]).fixture()))', str(fixture_module)], text=True)
        self.data = json.loads(output.splitlines()[-1])
        self.source = self.root / 'synthetic-source.bin'
        self.source.write_bytes(b'Synthetic source evidence; not a workbook or operational record.')
        self.data['source']['sha256'] = hashlib.sha256(self.source.read_bytes()).hexdigest()
        self.payload = self.root / 'synthetic.json'
        self.write()

    def write(self):
        self.payload.write_text(json.dumps(self.data))
        self.env = {'GC500_FINANCIAL_ASSOCIATION_INPUT':str(self.payload),
                    'GC500_FINANCIAL_ASSOCIATION_SOURCE':str(self.source),
                    'GC500_FINANCIAL_ASSOCIATION_SHA256':hashlib.sha256(self.payload.read_bytes()).hexdigest()}

    def test_valid_hashes_and_schema(self):
        encoded, manifest = read_private_input(self.env)
        self.assertEqual(json.loads(encoded), self.data)
        self.assertEqual(manifest['payload_sha256'], self.env['GC500_FINANCIAL_ASSOCIATION_SHA256'])

    def test_input_hash_required(self):
        self.env.pop('GC500_FINANCIAL_ASSOCIATION_SHA256')
        with self.assertRaisesRegex(ValueError, 'SHA-256'): read_private_input(self.env)

    def test_input_hash_mismatch(self):
        self.payload.write_text('{}')
        with self.assertRaisesRegex(ValueError, 'hash guard'): read_private_input(self.env)

    def test_source_hash_mismatch(self):
        self.source.write_bytes(b'Different source')
        with self.assertRaisesRegex(ValueError, 'source failed'): read_private_input(self.env)

    def test_actual_schema_check(self):
        self.data['row']['prebill'] = 123
        self.write()
        with self.assertRaisesRegex(ValueError, 'schema'): read_private_input(self.env)

    def test_size_guard(self):
        self.data['status'] = 'x' * 65536
        self.write()
        with self.assertRaisesRegex(ValueError, 'size'): read_private_input(self.env)

    def test_html_script_is_data(self):
        self.data['source']['basis'] = '</script><script>alert("synthetic")</script>&'
        self.write()
        encoded, _ = read_private_input(self.env)
        self.assertNotIn('<', encoded)
        self.assertNotIn('>', encoded)
        self.assertNotIn('&', encoded)
        self.assertEqual(json.loads(encoded), self.data)


if __name__ == '__main__':
    unittest.main()
