# Author: Andrew Fisher. Exact-base/atomic patch guards and unchanged native upload/financial boundaries.
from pathlib import Path
import hashlib,subprocess,tempfile,unittest
HERE=Path(__file__).resolve().parent
BASE=Path('/workspace/private-quantity964/candidate964.html')
class PatchTests(unittest.TestCase):
 def apply(self,raw):
  d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup);p=Path(d.name)/'candidate.html';p.write_bytes(raw)
  r=subprocess.run(['python',str(HERE/'patch_v965.py'),str(p)],capture_output=True,text=True)
  return p,r
 def test_predecessor_and_output(self):
  p,r=self.apply(BASE.read_bytes());self.assertEqual(r.returncode,0,r.stderr);s=p.read_text();self.assertEqual(s.count('const ItemPhotos965 ='),1);self.assertIn(" · v9.65'; /* v8.19",s)
 def test_wrong_base_is_unchanged(self):
  raw=BASE.read_bytes()+b'\n';p,r=self.apply(raw);self.assertNotEqual(r.returncode,0);self.assertEqual(p.read_bytes(),raw)
 def test_reapply_is_unchanged(self):
  p,r=self.apply(BASE.read_bytes());self.assertEqual(r.returncode,0);raw=p.read_bytes();r=subprocess.run(['python',str(HERE/'patch_v965.py'),str(p)],capture_output=True);self.assertNotEqual(r.returncode,0);self.assertEqual(p.read_bytes(),raw)
 def test_native_photo_pipeline_only_changes_final_guard(self):
  old=BASE.read_text();p,r=self.apply(BASE.read_bytes());self.assertEqual(r.returncode,0);new=p.read_text()
  start='async function dropPhotoAdd(';end='function filedPhotosOf('
  a=old[old.index(start):old.index(end,old.index(start))];b=new[new.index(start):new.index(end,new.index(start))]
  changed='const reason=item933.quantityOnly?ItemPhotos965.guard(key,item933.unitId,slot,item933.expected,item933.replace):Items933.guard(key,item933.unitId,slot,item933.expected,item933.replace);'
  self.assertEqual(b.replace(changed,'const reason=Items933.guard(key,item933.unitId,slot,item933.expected,item933.replace);'),a)
 def test_native_money_ownership_and_counts_untouched(self):
  old=BASE.read_text();p,r=self.apply(BASE.read_bytes());self.assertEqual(r.returncode,0);new=p.read_text()
  for start,end in [('function quantitySubhire964Read(', 'function quantitySubhire964List('),('function inventory(){','function '),('function charges952Html(','function mount925('),('function dsnState_(', 'function fenceTypes('),('function toiletItem962(', 'function toiletRows962(')]:
   a=old.index(start);b=new.index(start);self.assertEqual(old[a:old.index(end,a+len(start))],new[b:new.index(end,b+len(start))],start)
if __name__=='__main__':unittest.main()
