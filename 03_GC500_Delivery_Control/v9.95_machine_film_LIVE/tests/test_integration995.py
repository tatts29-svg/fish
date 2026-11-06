"""Author: Andrew Fisher. Reject unsafe release inputs and prove business-data boundaries."""
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
import media995, patch_v995
BASE=ROOT.parent/'build/GC500_v9.94-final/GC500_Delivery_Control_hosted.html'

class Integration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base=BASE.read_text();cls.data=media995.literal(cls.base)[0]
        cls.roles={role:{'path':'/private/'+role,'file':str(i)*64+'.'+ext,'sha256':str(i)*64,'type':mime,'bytes':4096,'scope':'view'} for i,(role,ext,mime) in enumerate([('full','mp4','video/mp4'),('preview','mp4','video/mp4'),('poster','webp','image/webp')],1)}
    def candidate(self):
        with patch.object(patch_v995,'load_report',return_value=self.roles):return patch_v995.apply(self.base)
    def test_wrong_base_before_media_reads(self):
        with patch.object(patch_v995,'load_report') as read:
            with self.assertRaisesRegex(ValueError,'Wrong base'):patch_v995.apply(self.base+' ')
            read.assert_not_called()
    def test_duplicate_before_media_reads(self):
        candidate=self.candidate()
        with patch.object(patch_v995,'load_report') as read:
            with self.assertRaisesRegex(ValueError,'already applied'):patch_v995.apply(candidate)
            read.assert_not_called()
    def test_only_hero_catalogue_manifest_change(self):
        before=deepcopy(self.data);after=media995.literal(self.candidate())[0]
        for key,value in before['media'].items():self.assertEqual(after['media'][key],value)
        self.assertEqual(len(after['media']),len(before['media'])+3)
        self.assertEqual(after['hostedMedia']['manifest'],media995.manifest(after['media'])['sha256'])
        for d in (before,after):
            del d['machine']['hero'];del d['media'];del d['hostedMedia']['manifest']
        self.assertEqual(before,after)
    def test_interactive_machine_functions_preserved(self):
        candidate=self.candidate()
        for name in ['machineFrameLoad','machineOpen','machineClose','machineHosted','machineFocusable']:
            start=self.base.index('function '+name+'(');end=self.base.index('\nfunction ',start+9)
            self.assertIn(self.base[start:end],candidate)
    def test_actual_old_media_not_deleted(self):
        after=media995.literal(self.candidate())[0]
        self.assertNotIn('webm',after['machine']['hero'])
        for name in ['src','poster','still','mp4','webm']:
            old=self.data['machine']['hero'][name]['media'];self.assertEqual(after['media'][old],self.data['media'][old])
    def test_no_script_timer_or_duplicate_source(self):
        source=(ROOT/'player995.js').read_text();self.assertNotIn('setInterval',source);self.assertNotIn('requestAnimationFrame',source)
        self.assertIn('preload="none"',self.candidate());self.assertNotIn(patch_v995.OLD_VIDEO,self.candidate())
    def test_capacity_and_permissions_validation(self):
        catalogue=deepcopy(self.data['media']);key=next(iter(catalogue));catalogue[key]['scope']='public'
        with self.assertRaises(ValueError):media995.manifest(catalogue)
        with self.assertRaisesRegex(ValueError,'capacity'):media995.manifest({str(i):{} for i in range(2001)})
    def test_private_report_requires_digest(self):
        with self.assertRaisesRegex(ValueError,'SHA-256'):media995.load_report('/not/read',None)
    def test_existing_descriptor_collision_rejected(self):
        roles=deepcopy(self.roles);existing=next(iter(self.data['media']));roles['full']['sha256']=existing
        with self.assertRaisesRegex(ValueError,'immutable'):media995.update_data(self.data,roles)
if __name__=='__main__':unittest.main()
