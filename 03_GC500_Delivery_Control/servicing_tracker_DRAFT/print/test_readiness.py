"""Author: Andrew Fisher. Local-only print readiness and reference-map regression checks."""
import argparse, hashlib, importlib.util, io, json, pathlib, sys, tempfile, unittest
from unittest import mock
HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('sheets', HERE / 'make_sheets.py')
M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)

class Readiness(unittest.TestCase):
    def setUp(self):
        self.data = M.Data(HERE.parent / 'tracker_data.json')
        self.urls = {r['ref']: f'{M.BASE}/d/local-test-token-for-print-1234567#r={r["ref"]}.AAAAAAAAAAAAAAAA' for r in self.data.refs}
        self.args = argparse.Namespace(mode=None, contact_name='', contact_phone='', readiness=None)
    def test_signed_links_default_test(self):
        self.assertEqual(M.pack_readiness(self.args,self.data,self.urls,False)[0],'test')
    def test_placeholder_default_draft(self):
        self.assertEqual(M.pack_readiness(self.args,self.data,self.urls,True)[0],'draft')
    def test_placeholder_cannot_be_real(self):
        self.args.mode='real'
        with self.assertRaises(SystemExit): M.pack_readiness(self.args,self.data,self.urls,True)
    def test_partial_contact_refused(self):
        self.args.contact_name='Fixture contact'
        with self.assertRaises(SystemExit): M.pack_readiness(self.args,self.data,self.urls,False)
    def test_real_needs_contact_and_receipt(self):
        self.args.mode='real'
        with self.assertRaises(SystemExit): M.pack_readiness(self.args,self.data,self.urls,False)
        self.args.contact_name='Fixture contact';self.args.contact_phone='0400 000 000'
        with self.assertRaises(SystemExit): M.pack_readiness(self.args,self.data,self.urls,False)
    def test_real_receipt_bound_to_token_data_contact_and_checks(self):
        self.args.mode='real';self.args.contact_name='Fixture contact';self.args.contact_phone='0400 000 000'
        r={'token':'local-test-token-for-print-1234567','data_sha256':self.data.sha,'contact':{'name':self.args.contact_name,'phone':self.args.contact_phone},'test_checks_passed':True,'real_tracker_read_back':True,'iphone_paper_scan':True,'android_paper_scan':True}
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/'receipt.json';self.args.readiness=str(p);p.write_text(json.dumps(r))
            self.assertEqual(M.pack_readiness(self.args,self.data,self.urls,False)[0],'real')
            for key in ['token','data_sha256','contact','test_checks_passed','real_tracker_read_back','iphone_paper_scan','android_paper_scan']:
                bad=dict(r);bad[key]=False;p.write_text(json.dumps(bad))
                with self.assertRaises(SystemExit):M.pack_readiness(self.args,self.data,self.urls,False)
    def test_download_bundle_keeps_actual_test_days_and_contact(self):
        d=json.loads((HERE.parent/'tracker_data.json').read_text())
        d['days']=[{'id':'2026-10-18','plan':'night','label':'TEST 2026-10-18','to':'Mon 19','ifNeeded':False}]
        raw=json.dumps(d,indent=2)+'\n'
        bundle={'mode':'test','contact':{'name':'Fixture contact','phone':'0400 000 000'},'data_json':raw}
        with tempfile.TemporaryDirectory() as folder:
            p=pathlib.Path(folder)/'links.json';p.write_text(json.dumps(bundle))
            args=argparse.Namespace(links=str(p),data=None,mode='test',contact_name='',contact_phone='')
            got=M.load_pack_data(args)
            self.assertEqual(got.days,d['days']);self.assertEqual(got.sha,hashlib.sha256(raw.encode()).hexdigest())
            self.assertEqual(args.contact_name,'Fixture contact');self.assertEqual(args.contact_phone,'0400 000 000')
            args.mode='real'
            with self.assertRaises(SystemExit):M.load_pack_data(args)
            args.mode='test';args.contact_phone='0499 000 000'
            with self.assertRaises(SystemExit):M.load_pack_data(args)

class ReferenceMaps(unittest.TestCase):
    def draw_reference(self, split):
        """Render an invented two-unit reference; spy on the real projection/drawing helpers."""
        M.setup_fonts()
        ref = {'ref':'FIX01', 'title':'FIX01', 'where':'Fixture area', 'drop':'', 'pin':[-27.0,153.0],
               'lines':[{'id':'FIX01-A','type':'FWF','kind':'fwf','label':'1 × FWF at first spot','qty':1,'nos':['FIXTURE-A']},
                        {'id':'FIX01-B','type':'FWF','kind':'fwf','label':'1 × FWF at second spot','qty':1,'nos':['FIXTURE-B']}]}
        area = {'n':1,'name':'Fixture area','refs':[ref]}
        raw = {'tasks':{'pump':'Pumped out','clean':'Cleaned & restocked'},
               'plans':{'fwf':{'night':['pump','clean']}},
               'days':[{'id':'2026-10-23','label':'Fixture day','to':'Next day','plan':'night'}],
               'groups':{'pump':{'label':'Pump out','tasks':['pump']},'clean':{'label':'Clean & restock','tasks':['clean']}},
               'areas':[area]}
        data = M.Data(raw=json.dumps(raw).encode())
        spots = {'FIX01-A':{'ref':'FIX01','x':25,'y':27},'FIX01-B':{'ref':'FIX01','x':60,'y':27}} if split else {}
        maps = {'positions':{'FIX01':{'x':25,'y':27}},'line_spots':spots,'ref_image':{'FIX01':'fixture'},
                'images':{'fixture':{'rect':[0,0,100,54],'file':'unused-fixture.jpg'}},'m_per_unit':1,
                'layout':{'ref_map':{'w':100,'h':54}},
                'areas':{'1':{'main':{'key':'fixture','refs':['FIX01']},'far':[],'unplaced':[]}}}
        before = json.dumps((raw,maps),sort_keys=True)
        urls = {'FIX01':f'{M.BASE}/d/{M.TEST_TOKEN}#r=FIX01.0000'}
        pack = M.Pack(data,maps,HERE,urls,True,'fixture')
        draws, labels = [], []
        real_tag = M.tag
        def record_tag(*args, **kwargs):
            bounds = real_tag(*args, **kwargs); labels.append((args[3],bounds)); return bounds
        with mock.patch.object(M.MapBox,'draw',lambda mb,*args:draws.append(mb)), \
             mock.patch.object(M.MapBox,'furniture',lambda *args,**kwargs:None), \
             mock.patch.object(M,'equipment_marker',wraps=M.equipment_marker) as icons, \
             mock.patch.object(M,'ring',wraps=M.ring) as rings, \
             mock.patch.object(M,'tag',side_effect=record_tag), \
             mock.patch.object(M,'qr',wraps=M.qr) as codes:
            c = M.canvas.Canvas(io.BytesIO(),pagesize=M.A4)
            pack.ref_block(c,data.areas[0],data.refs[0],9*M.mm,20*M.mm,M.A4[0]-18*M.mm,M.HALF_H)
            c.save()
        self.assertEqual(before,json.dumps((raw,maps),sort_keys=True))
        self.assertEqual([call.args[1] for call in codes.call_args_list],
                         [urls['FIX01']+'~pump',urls['FIX01']+'~clean',M.maps_url(ref['pin'])])
        return draws[0],labels,icons.call_args_list,rings.call_count,spots

    def test_split_reference_uses_each_existing_line_spot_and_asset_label(self):
        box,labels,icons,rings,spots = self.draw_reference(True)
        self.assertEqual(rings,0)
        self.assertEqual(len(icons),2)
        for call, spot in zip(icons,spots.values()):
            expected = box.at(spot['x'],spot['y'])
            self.assertAlmostEqual(call.args[1],expected[0]);self.assertAlmostEqual(call.args[2],expected[1])
        self.assertEqual(len(labels),2)
        for (label,bounds),asset in zip(labels,('FIXTURE-A','FIXTURE-B')):
            self.assertIn('FIX01 — 1 FWF',label);self.assertIn('asset '+asset,label)
            self.assertGreaterEqual(bounds[0],box.x);self.assertGreaterEqual(bounds[1],box.y)
            self.assertLessEqual(bounds[2],box.x+box.w);self.assertLessEqual(bounds[3],box.y+box.h)
        self.assertFalse(M.boxes_hit(labels[0][1],labels[1][1]))

    def test_ordinary_reference_keeps_one_aggregate_marker(self):
        box,labels,icons,rings,_ = self.draw_reference(False)
        self.assertEqual(rings,1);self.assertEqual(len(icons),1)
        expected = box.at(25,27)
        self.assertAlmostEqual(icons[0].args[1],expected[0]);self.assertAlmostEqual(icons[0].args[2],expected[1])
        self.assertEqual([label for label,_ in labels],['FIX01 — 2 FWF'])

class MasterLegend(unittest.TestCase):
    def test_master_prints_every_area_name_and_metadata_without_clipping(self):
        M.setup_fonts(); data = M.Data(HERE.parent/'tracker_data.json')
        maps = json.loads((HERE/'maps/maps.json').read_text())
        maps['layout'] = json.loads((HERE/'layout.json').read_text())
        urls = json.loads((HERE/'urls.json').read_text())
        pack = M.Pack(data,maps,HERE/'maps',urls,True,'fixture')
        with mock.patch.object(M.MapBox,'draw',lambda *args:None), \
             mock.patch.object(M.MapBox,'furniture',lambda *args,**kwargs:None), \
             mock.patch.object(M,'txt',wraps=M.txt) as text:
            c = M.canvas.Canvas(io.BytesIO(),pagesize=M.landscape(M.A4));pack.master(c);c.save()
        printed = [call.args for call in text.call_args_list if len(call.args)>5 and call.args[4]=='narrowb' and call.args[5]<=7.6]
        self.assertEqual(' '.join(s[3] for s in printed),' '.join(a['name'] for a in data.areas))
        cols = max(7,-(-len(data.areas)//2)); cw = (M.landscape(M.A4)[0]-18*M.mm)/cols
        metadata = [call.args for call in text.call_args_list if len(call.args)>5 and call.args[4]=='narrow' and call.args[5]<=7]
        offset = meta_offset = 0
        for a in data.areas:
            parts=[]
            while ' '.join(s[3] for s in parts) != a['name']:
                self.assertLess(offset,len(printed));parts.append(printed[offset]);offset+=1
            self.assertLessEqual(len(parts),2)
            n=len(a['refs']);units=data.units(a['refs'])
            meta=f'{n} location{"s" if n!=1 else ""} · {units} unit{"s" if units!=1 else ""}'
            if not maps['areas'][str(a['n'])]['main']:meta+=' · not on the map'
            meta_parts=[]
            while ' '.join(s[3] for s in meta_parts) != meta:
                self.assertLess(meta_offset,len(metadata));meta_parts.append(metadata[meta_offset]);meta_offset+=1
            self.assertLessEqual(len(parts)+len(meta_parts),3)
            for s in parts+meta_parts:self.assertLessEqual(M.sw(s[3],s[4],s[5]),cw-8.5*M.mm)
            if len(M.wrap(a['name'],'narrowb',7.6,cw-8.5*M.mm))+len(M.wrap(meta,'narrow',7,cw-8.5*M.mm))<=3:
                self.assertTrue(all(s[5]==7.6 for s in parts))
                self.assertTrue(all(s[5]==7 for s in meta_parts))

if __name__=='__main__':unittest.main()
