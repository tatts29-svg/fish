# Author: Andrew Fisher. Exact preservation and fail-closed patch checks.
from pathlib import Path
import hashlib, os, subprocess, tempfile, unittest
HERE = Path(__file__).resolve().parents[1]
BASE = Path(os.environ['BASE'])
class PatchTests(unittest.TestCase):
 def test_exact_presentation_only_roundtrip(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'page.html';p.write_bytes(BASE.read_bytes())
   subprocess.run(['python3',str(HERE/'patch_v989.py'),str(p)],check=True)
   s=p.read_text()
   s=s.replace('<style id="loadcards989-style">'+(HERE/'loadcards989.css').read_text()+'</style>\n','',1)
   s=s.replace('<script id="loadcards989-script">'+(HERE/'loadcards989.js').read_text()+'</script>\n','',1)
   s=s.replace("+ ' · v9.89 DRAFT'","+ ' · v9.88'",1)
   self.assertEqual(s,BASE.read_text(), 'Every original byte remains except the review version and inserted presentation')
   before=p.read_bytes()
   r=subprocess.run(['python3',str(HERE/'patch_v989.py'),str(p)],capture_output=True)
   self.assertNotEqual(r.returncode,0);self.assertIn(b'Already applied',r.stderr)
   self.assertEqual(p.read_bytes(),before)
 def test_wrong_base_refused_without_write(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'page.html';p.write_bytes(BASE.read_bytes()+b'\n')
   before=p.read_bytes();r=subprocess.run(['python3',str(HERE/'patch_v989.py'),str(p)],capture_output=True)
   self.assertNotEqual(r.returncode,0);self.assertIn(b'Wrong live base',r.stderr)
   self.assertEqual(p.read_bytes(),before)
if __name__=='__main__':unittest.main()
