"""Author: Andrew Fisher. Exact-base/source preservation contracts; BASE=private predecessor."""
from pathlib import Path
import importlib.util
import os
import re
import unittest
H=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('patch1069',H/'patch_v1069.py');M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
class Contract(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.base=Path(os.environ['BASE']).read_text();cls.out=M.apply_shape(cls.base)
 def test_shape_only(self):
  scrub=lambda s:re.sub(r'<script id="shapes1060-script">.*?</script>','SHAPE',s,flags=re.S)
  self.assertEqual(scrub(self.base),scrub(self.out))
 def test_no_reapply(self):
  with self.assertRaises(ValueError):M.apply_shape(self.out)
 def test_bad_pin(self):
  with self.assertRaises(ValueError):M.apply_shape(self.base.replace('explorer.js?v=e175ec073b2d','explorer.js?v=000000000000'))
 def test_expanded_allowlist(self):
  with self.assertRaises(ValueError):M.apply_shape(self.base.replace('[EXPLORER_BUILD, EXPLORER_BUILD_1064, EXPLORER_BUILD_1065].includes','[EXPLORER_BUILD, EXPLORER_BUILD_1064, EXPLORER_BUILD_1065, "unknown"].includes'))
 def test_source_drift(self):
  with self.assertRaises(ValueError):M.apply_shape(self.base.replace('const MIN = 12, NEAR = 6','const MIN = 14, NEAR = 6'))
 def test_require_predecessor(self):
  with self.assertRaises(ValueError):M.patch(self.base)
 def test_release_footer_only_after_predecessor(self):
  fixture=self.base.replace("+ ' · v10.65'","+ ' · v10.68'")+ '\n/* supplier-cost-consistency-1068 */'
  out=M.patch(fixture);self.assertIn("+ ' · v10.69'",out)
 def test_keeps_geometry_functions_and_pins(self):
  for start,end in [('  function project(', '  const path ='),('  function shapeFor(', '  /* project a reference')]:
   self.assertEqual(self.base.split(start)[1].split(end)[0],self.out.split(start)[1].split(end)[0])
  self.assertEqual(re.findall(r'const EXPLORER_BUILD[^;]*;',self.base),re.findall(r'const EXPLORER_BUILD[^;]*;',self.out))
 def test_ripple_guard_unchanged(self):
  for line in self.base.splitlines():
   if 'shape1065:' in line:self.assertIn(line,self.out)
if __name__=='__main__':unittest.main()
