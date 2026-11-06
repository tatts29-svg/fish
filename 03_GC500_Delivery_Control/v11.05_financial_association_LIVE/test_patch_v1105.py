"""Author: Andrew Fisher. Synthetic release wrapper and preservation checks."""
import hashlib
import unittest
from unittest.mock import patch as replace

import patch_v1105
import test_private_input1105 as fixtures


class PatchTests(unittest.TestCase):
    def setUp(self):
        self.write = lambda: fixtures.PrivateInputTests.write(self)
        fixtures.PrivateInputTests.setUp(self)
        self.base = '''<html><body><script>
var SvcState = {synthetic:true}; module.exports = SvcState;
var SVC1067_DATA={synthetic:true}; /* Author: Andrew Fisher. Deliberate edit-only tracker publication;
var SVC1099_MAP_DATA={synthetic:true}; /* Author: Andrew Fisher. Saved servicing progress
const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && typeof r.rate_1 !== 'number' && !lr748Decided(r)).map
+' · v11.04'; /* v8.19 release922
</script></body>
</html>'''
        self.sha = hashlib.sha256(self.base.encode()).hexdigest()

    def build(self, text=None):
        with replace.object(patch_v1105, 'BASE_SHA256', self.sha):
            return patch_v1105.patch(self.base if text is None else text, self.env)

    def test_release_and_preserved_sections(self):
        candidate = self.build()
        self.assertIn("+' · v11.05'; /* v8.19 release922", candidate)
        self.assertEqual(candidate.count('<script'), self.base.count('<script') + 3)
        self.assertIn('var SVC1067_DATA={synthetic:true}', candidate)
        self.assertIn('var SVC1099_MAP_DATA={synthetic:true}', candidate)
        self.assertEqual(candidate.count('id="financial-association1105-data"'), 1)

    def test_wrong_base_refused(self):
        with self.assertRaisesRegex(ValueError, 'exact verified'): self.build(self.base + ' ')

    def test_repeat_refused(self):
        candidate = self.build()
        with self.assertRaisesRegex(ValueError, 'exact verified'): self.build(candidate)

    def test_preserved_section_guard(self):
        integrate = patch_v1105.integrate
        def altered(text, env):
            result, manifest = integrate(text, env)
            return result.replace('var SVC1067_DATA={synthetic:true}', 'var SVC1067_DATA={synthetic:false}'), manifest
        with replace.object(patch_v1105, 'integrate', altered):
            with self.assertRaisesRegex(ValueError, 'Protected servicing'): self.build()

    def test_script_boundary_guard(self):
        integrate = patch_v1105.integrate
        def altered(text, env):
            result, manifest = integrate(text, env)
            return result.replace('</body>', '<script></script></body>'), manifest
        with replace.object(patch_v1105, 'integrate', altered):
            with self.assertRaisesRegex(ValueError, 'script boundary'): self.build()


if __name__ == '__main__':
    unittest.main()
