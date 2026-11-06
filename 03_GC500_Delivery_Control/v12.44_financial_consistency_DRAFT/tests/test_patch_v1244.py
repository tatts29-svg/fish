"""Author: Andrew Fisher. Exact-source and repeat-application refusal checks."""
import hashlib, importlib.util, os, pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch44',ROOT/'patch_v1244.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Patch(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.text=pathlib.Path(os.environ['BASE']).read_text();cls.sha=hashlib.sha256(cls.text.encode()).hexdigest()
 def test_exact_candidate(self):
  result=m.patch(self.text,expected_base_sha=self.sha)
  self.assertIn("+' · v12.44';",result);self.assertEqual(result.count('const native=servicing748;servicing748=function(){return CustomerWater1244.project'),1)
 def test_wrong_hash(self):
  with self.assertRaises(ValueError):m.patch(self.text,expected_base_sha='0'*64)
 def test_changed_bytes(self):
  with self.assertRaises(ValueError):m.patch(self.text+' ',expected_base_sha=self.sha)
 def test_old_footer(self):
  text=self.text.replace("+' · v12.43';","+' · v12.42.24';")
  with self.assertRaises(ValueError):m.patch(text,expected_base_sha=hashlib.sha256(text.encode()).hexdigest())
 def test_repeat(self):
  text=m.patch(self.text,expected_base_sha=self.sha)
  with self.assertRaises(ValueError):m.patch(text,expected_base_sha=hashlib.sha256(text.encode()).hexdigest())
if __name__=='__main__': unittest.main()
