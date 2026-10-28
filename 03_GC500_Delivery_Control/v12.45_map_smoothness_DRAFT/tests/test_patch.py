"""Author: Andrew Fisher. Reject stale, repeated and mismatched map patches."""
import hashlib
import importlib.util
import os
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch45',ROOT/'patch_v1245.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class Boundary(unittest.TestCase):
 def setUp(self):
  self.base='\n'.join((ROOT/(stem+'_before.js')).read_text() for stem in ('drawing_tiles1245', 'closure_tiles1245', 'removal_tiles1245', 'removal_apply1245', 'satellite_tiles1245', 'satellite_apply1245', 'removal_pins_apply1245', 'satellite_pins_apply1245'))+"\n+' · v12.43';"
 def runpatch(self,text): return mod.patch(text,expected_base_sha=hashlib.sha256(text.encode()).hexdigest())
 def test_base(self):
  text=self.runpatch(self.base);self.assertIn('finishTiles1245',text);self.assertIn('tileImages1245',text);self.assertIn("+' · v12.45';",text)
 def test_hash(self):
  with self.assertRaises(ValueError):mod.patch(self.base,expected_base_sha='0'*64)
 def test_repeat(self):
  with self.assertRaises(ValueError):self.runpatch(self.runpatch(self.base))
 def test_missing_hook(self):
  with self.assertRaises((ValueError,SystemExit)):self.runpatch(self.base.replace(' let tileGen = 0;',' let tileGen = 2;'))
 def test_bad_footer(self):
  with self.assertRaises(ValueError):self.runpatch(self.base.replace('v12.43','v12.42.24'))
 def test_successor_footer(self):
  self.assertIn("+' · v12.45';",self.runpatch(self.base.replace('v12.43','v12.43.1')))
 def test_unrelated_content(self):
  self.assertTrue(self.runpatch('sentinel_before\n'+self.base+'\nsentinel_after').startswith('sentinel_before\n'));self.assertTrue(self.runpatch('sentinel_before\n'+self.base+'\nsentinel_after').endswith('\nsentinel_after'))
if __name__=='__main__':unittest.main()
