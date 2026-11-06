# Author: Andrew Fisher. Exact source preservation and fail-closed release guards.
from pathlib import Path
import hashlib, importlib.util, os, re, subprocess, tempfile, unittest
HERE = Path(__file__).resolve().parents[1]
BASE = Path(os.environ['BASE'])
BASE_SHA = '198bb721e7bff046bdfeb92c229e0dd35cb41a5edd4aa9c0d856fe8348aa9f28'
spec=importlib.util.spec_from_file_location('patch992',HERE/'patch_v992.py')
patch=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)

class PatchTests(unittest.TestCase):
 def test_exact_presentation_only_roundtrip(self):
  self.assertEqual(hashlib.sha256(BASE.read_bytes()).hexdigest(), BASE_SHA)
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'page.html';p.write_bytes(BASE.read_bytes())
   subprocess.run(['python3',str(HERE/'patch_v992.py'),str(p)],check=True)
   s=p.read_text()
   s=s.replace('<style id="loadlights992-style">'+(HERE/'loadlights992.css').read_text()+'</style>\n','',1)
   s=s.replace('<script id="loadlights992-script">'+(HERE/'loadlights992.js').read_text()+'</script>\n','',1)
   # rep() deliberately consumes leading whitespace. Restore the entire original
   # matched span, including those spaces, and require all other source bytes to match.
   for before,after,label in reversed(patch.CHANGES):
    pattern='\n'.join('[ \t]*'+r'\s+'.join(re.escape(tok) for tok in line.split()) if line.split() else '[ \t]*' for line in before.split('\n'))
    originals=list(re.finditer(pattern,BASE.read_text()))
    self.assertEqual(len(originals),1,label+' must identify one original source span')
    self.assertEqual(s.count(after),1,label+' must identify one resulting source span')
    s=s.replace(after,originals[0].group(0),1)
   self.assertEqual(s,BASE.read_text(),'Every original byte remains outside the declared presentation changes and added styles')
   before=p.read_bytes()
   r=subprocess.run(['python3',str(HERE/'patch_v992.py'),str(p)],capture_output=True)
   self.assertNotEqual(r.returncode,0);self.assertIn(b'Already applied',r.stderr)
   self.assertEqual(p.read_bytes(),before)
 def test_wrong_base_refused_without_write(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'page.html';p.write_bytes(BASE.read_bytes()+b'\n')
   before=p.read_bytes();r=subprocess.run(['python3',str(HERE/'patch_v992.py'),str(p)],capture_output=True)
   self.assertNotEqual(r.returncode,0);self.assertIn(b'Wrong live base',r.stderr)
   self.assertEqual(p.read_bytes(),before)
if __name__=='__main__':unittest.main()
