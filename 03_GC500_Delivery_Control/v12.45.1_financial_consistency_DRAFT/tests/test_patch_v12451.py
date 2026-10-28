"""Author: Andrew Fisher. Exact-source and repeat-application refusal checks."""
import hashlib, importlib.util, os, pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch451',ROOT/'patch_v12451.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Patch(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.text=pathlib.Path(os.environ['BASE']).read_text();cls.sha=hashlib.sha256(cls.text.encode()).hexdigest()
  cls.candidate=m.patch(cls.text,expected_base_sha=cls.sha)
 def test_exact_candidate(self):
  result=self.candidate
  self.assertIn("+' · v12.45.1';",result);self.assertEqual(result.count('const native=servicing748;servicing748=function(){return CustomerWater1244.project'),1)
 def test_wrong_hash(self):
  with self.assertRaises(ValueError):m.patch(self.text,expected_base_sha='0'*64)
 def test_changed_bytes(self):
  with self.assertRaises(ValueError):m.patch(self.text+' ',expected_base_sha=self.sha)
 def test_old_footer(self):
  for version in ['12.42.24','12.43','12.43.1','12.44','12.45.2']:
   with self.subTest(version=version):
    text=self.text.replace("+' · v12.45';","+' · v"+version+"';")
    with self.assertRaisesRegex(ValueError,'requires verified v12.45'):
     m.patch(text,expected_base_sha=hashlib.sha256(text.encode()).hexdigest())
 def test_repeat(self):
  text=self.candidate
  with self.assertRaises(ValueError):m.patch(text,expected_base_sha=hashlib.sha256(text.encode()).hexdigest())
 def test_missing_predecessor_implementation(self):
  for marker in ['const Offsite1225=', 'const PicCache12431 =', 'const finishTiles1245 =', 'function tileImages1245(']:
   with self.subTest(marker=marker):
    text=self.text.replace(marker,'missing_predecessor_marker')
    with self.assertRaisesRegex(ValueError,'requires retained predecessor implementation'):
     m.patch(text,expected_base_sha=hashlib.sha256(text.encode()).hexdigest())
 def test_partial_financial_patch_refused(self):
  for marker in ['CustomerWater1244','FwfLabour1244']:
   with self.subTest(marker=marker):
    text=self.text+'\n/* '+marker+' */'
    with self.assertRaisesRegex(ValueError,'already applied'):
     m.patch(text,expected_base_sha=hashlib.sha256(text.encode()).hexdigest())
 def test_predecessor_map_and_picture_sources_retained(self):
  def release_dir(stem):
   choices=[ROOT.parent/(stem+suffix) for suffix in ['_LIVE','_DRAFT']]
   return next(p for p in choices if p.is_dir())
  map_root=release_dir('v12.45_map_smoothness')
  for stem in ['drawing_tiles1245','closure_tiles1245','removal_tiles1245','removal_apply1245','satellite_tiles1245','satellite_apply1245','removal_pins_apply1245','satellite_pins_apply1245']:
   with self.subTest(source=stem):
    source=(map_root/(stem+'.js')).read_text().rstrip('\n')
    self.assertEqual(self.text.count(source),1,'Reviewed map source must occur once: '+stem)
    self.assertEqual(self.candidate.count(source),1,'Financial patch preserves exact map source: '+stem)
  picture_root=release_dir('v12.43.1_offsite_pictures')
  spec=importlib.util.spec_from_file_location('predecessor431',picture_root/'patch_v12431.py')
  predecessor=importlib.util.module_from_spec(spec);spec.loader.exec_module(predecessor)
  for before,after,label in predecessor.replacements():
   if label=='footer':continue
   with self.subTest(source=label):
    self.assertEqual(self.text.count(after),1,'Reviewed off-site/picture source must occur once: '+label)
    self.assertEqual(self.candidate.count(after),1,'Financial patch preserves exact off-site/picture source: '+label)
 def test_financial_helpers_identical_to_checked_draft(self):
  original=ROOT.parent/'v12.44_financial_consistency_DRAFT'
  for name in ['customer_water1244.js','fwf_labour1244.js','fwf_labour1244_patch.py']:
   with self.subTest(source=name):self.assertEqual((ROOT/name).read_bytes(),(original/name).read_bytes())
if __name__=='__main__': unittest.main()
