"""Author: Andrew Fisher. Synthetic registration and release-input boundaries."""
import copy
import hashlib
import importlib.util
import io
from pathlib import Path
import unittest
from PIL import Image
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('patch1100',HERE/'patch_v1100.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)

def webp(size):
 b=io.BytesIO();Image.new('RGB',size,'white').save(b,format='WEBP',quality=80);return b.getvalue()

class RegistrationGuards(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.preview=webp((1024,512));cls.detail=webp((4096,2048))
 def setUp(self):
  self.g={'schema':1,'rect':[10,20,2010,1020],'px':[3000,1500],'image':'existing source','refs':{'QA1':{'lines':{'QA1-A':{'point':{'x':80,'y':90}},'QA1-B':{'point':None}}}}}
  self.m={'rect':self.g['rect'][:],'source_sha256':'a'*64,'preview_px':[1024,512],'detail_px':[4096,2048],'preview_sha256':hashlib.sha256(self.preview).hexdigest(),'detail_sha256':hashlib.sha256(self.detail).hexdigest()}
 def run_images(self):return p.images(self.g,self.preview,self.detail,self.m)
 def test_exact_registration_and_null_line_preserved(self):
  before=copy.deepcopy(self.g);r=self.run_images()
  for k in ('rect','px','refs'):self.assertEqual(r[k],before[k])
  self.assertEqual(self.g,before);self.assertEqual(r['detailPx'],[4096,2048])
  self.assertTrue(r['detailImage'].startswith('data:image/webp;base64,'))
 def test_different_crop_rejected(self):
  self.m['rect'][0]+=1
  with self.assertRaisesRegex(ValueError,'rectangle'):self.run_images()
 def test_modified_asset_rejected(self):
  self.detail+=b'changed'
  with self.assertRaisesRegex(ValueError,'hash mismatch'):self.run_images()
 def test_dimensions_must_match_manifest(self):
  self.m['detail_px']=[4096,2000]
  with self.assertRaisesRegex(ValueError,'dimensions'):self.run_images()
 def test_wrong_image_aspect_rejected(self):
  self.g['rect'][3]=1520;self.m['rect']=self.g['rect'][:]
  with self.assertRaisesRegex(ValueError,'aspect'):self.run_images()
 def test_fake_upscaled_resolution_metadata_rejected(self):
  self.detail=self.preview;self.m['detail_px']=[1024,512];self.m['detail_sha256']=self.m['preview_sha256']
  with self.assertRaisesRegex(ValueError,'4K'):self.run_images()
 def test_missing_source_provenance_rejected(self):
  del self.m['source_sha256']
  with self.assertRaisesRegex(ValueError,'provenance'):self.run_images()
 def test_wrong_base_refused(self):
  with self.assertRaisesRegex(ValueError,'exact verified'):p.patch('wrong')
 def test_repeat_patch_refused(self):
  text='svc1100'
  with self.assertRaisesRegex(ValueError,'already installed'):p.patch(text,expected_sha=hashlib.sha256(text.encode()).hexdigest())

if __name__=='__main__':unittest.main()
