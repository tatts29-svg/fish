"""Author: Andrew Fisher. Source-bound correction safety, using synthetic records."""
from copy import deepcopy
import unittest
from fencing_corrections847 import apply_corrections

class Corrections(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 64
        source = {'id':'source.pdf', 'sha256':self.sha, 'pages':2, 'media_type':'application/pdf'}
        record = {'id':'F1','docket_no':'D1','date':'2026-10-01','location':'Road edge','quantities':{'ccb_event':25,'clean':10},'components':{'cc_barrier':10},'note':'Original note.','cost_total':187.75,'lines':[{'column':'ccb_event','qty':25,'cost':187.75}]}
        expected = {k:deepcopy(record[k]) for k in ('date','location','quantities','components')}
        reviewed = {'record_id':'F1','docket_no':'D1','expected':deepcopy(expected),'reviewed_on':'2026-10-04','query':{'open':False,'text':'Original checked.'},'original':{'source_id':'source.pdf','page':1}}
        traced = {'record_id':'F1','docket_no':'D1','expected':dict(deepcopy(expected),note=record['note']),'reviewed_on':'2026-10-04','basis':'Existing area only.','evidence':[{'source_id':'source.pdf','sha256':self.sha,'page':1}],'area_ids':['existing-area']}
        self.data = {'ops':{'fencing':{'dockets':[record]}},'docs':{'docs':[]},'rates':{'ccb_event':7.51,'ccb_demarc':13.08}}
        self.review = {'sources':[source],'rows':[reviewed]}
        self.trace = {'sources':[source],'rows':[traced],'unmapped':[],'areas':[{'id':'existing-area'}]}
        self.cat = {'sources':[source],'rows':[{'record_id':'F1','docket_no':'D1','expected':dict(deepcopy(expected),note=record['note']),'decision':{'state':'pending','basis':'Old provisional allocation'},'source_ids':['source.pdf']}]}
        self.man = {'schema':1,'author':'Andrew Fisher','base_sha256':self.sha,'corrections':[{'record_id':'F1','docket_no':'D1','expected':deepcopy(record),'expected_review':deepcopy(reviewed),'expected_trace':deepcopy(traced),'from_type':'ccb_event','to_type':'ccb_demarc','quantity':25,'reviewed_on':'2026-10-05','basis':'Source identifies road-edge demarcation.','after_note':'Original note. Category corrected: Source identifies road-edge demarcation.','evidence':[{'source_id':'source.pdf','sha256':self.sha,'page':2}]}]}
    def apply(self):
        return apply_corrections(self.data,self.review,self.trace,self.cat,self.man,self.sha)
    def test_exact_transfer_preserves_metres_other_fields_and_historical_build_cost(self):
        before=deepcopy((self.data,self.review,self.trace,self.cat,self.man));data,review,trace,cat=self.apply()
        record=data['ops']['fencing']['dockets'][0]
        self.assertEqual(record['quantities'],{'ccb_demarc':25,'clean':10})
        self.assertEqual(record['cost_total'],187.75)
        self.assertEqual(record['lines'],self.data['ops']['fencing']['dockets'][0]['lines'])
        self.assertEqual(trace['areas'],self.trace['areas'])
        self.assertEqual(trace['rows'][0]['area_ids'],['existing-area'])
        self.assertEqual(cat['rows'][0]['decision']['type'],'ccb_demarc')
        self.assertEqual((self.data,self.review,self.trace,self.cat,self.man),before)
    def test_stale_or_duplicate_records_refuse(self):
        self.data['ops']['fencing']['dockets'][0]['components']['cc_barrier']=11
        with self.assertRaises(ValueError):self.apply()
        self.setUp();self.data['ops']['fencing']['dockets'].append(deepcopy(self.data['ops']['fencing']['dockets'][0]))
        with self.assertRaises(ValueError):self.apply()
    def test_partial_transfer_and_changed_target_refuse(self):
        self.man['corrections'][0]['quantity']=20
        with self.assertRaises(ValueError):self.apply()
        self.setUp();self.man['corrections'][0]['to_type']='clean'
        with self.assertRaises(ValueError):self.apply()
    def test_note_replacement_and_source_changes_refuse(self):
        self.man['corrections'][0]['after_note']='Source identifies road-edge demarcation.'
        with self.assertRaises(ValueError):self.apply()
        self.setUp();self.man['corrections'][0]['evidence'][0]['sha256']='b'*64
        with self.assertRaises(ValueError):self.apply()
        self.setUp();self.man['corrections'][0]['evidence'][0]['page']=3
        with self.assertRaises(ValueError):self.apply()
    def test_review_binding_change_refuses(self):
        self.trace['rows'][0]['area_ids']=['other-area']
        with self.assertRaises(ValueError):self.apply()
    def test_unmapped_records_remain_unmapped(self):
        unmapped={'record_id':'F1','docket_no':'D1','reason':'No exact map association'}
        self.trace['rows']=[];self.trace['unmapped']=[unmapped]
        self.man['corrections'][0]['expected_trace']=None;self.man['corrections'][0]['expected_unmapped']=deepcopy(unmapped)
        _,_,trace,_=self.apply()
        self.assertEqual(trace,self.trace)
    def test_repeated_patch_or_changed_base_refuses(self):
        data,review,trace,cat=self.apply()
        with self.assertRaises(ValueError):apply_corrections(data,review,trace,cat,self.man,self.sha)
        with self.assertRaises(ValueError):apply_corrections(self.data,self.review,self.trace,self.cat,self.man,'b'*64)

if __name__ == '__main__':
    unittest.main()
