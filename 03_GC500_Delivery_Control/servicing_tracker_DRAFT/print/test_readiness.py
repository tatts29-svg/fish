"""Author: Andrew Fisher. Local-only print release-mode and private receipt regression checks."""
import argparse, hashlib, importlib.util, json, pathlib, sys, tempfile, unittest
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

if __name__=='__main__':unittest.main()
