"""Author: Andrew Fisher. Synthetic source boundaries, preservation and release guards."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import fitz

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import source_completion838 as S


class SourceCompletionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.master = self.pdf('master.pdf', 'master')
        self.old = self.pdf('old.pdf', 'old source')
        self.new = self.pdf('new.pdf', 'new source')
        self.master_hash = self.hash(self.master)
        self.plan = {'id':'new-plan','label':'Current plan','short_label':'Current plan','revision':'2026-10-01','pages':1,'sha256':self.hash(self.new),'document_file':'new.pdf','note':'Reviewed area context'}
        self.base = {'master_sha256':self.master_hash,'current_source_id':'old-plan','sources':[{'id':'old-plan','label':'Old plan','short_label':'Old','revision':'2026-09-01','pages':1,'sha256':self.hash(self.old),'document_file':'old.pdf','note':'Current source'}],'reference_sources':[],'geometry':[{'id':'old-line','kind':'line','points':[[1,2],[3,4]],'recorded_length':12}],'coverage':[],'conflicts':[{'id':'retained-query'}]}
        self.geom = {'id':'new-area','kind':'anchor','role':'area-signoff','region':'main','points':[[100,200]],'point':[100,200],'master_sha256':self.master_hash,'source_sha256':self.plan['sha256'],'source_page':1,'source_revision':self.plan['revision'],'task_ids':[],'area_evidence_names':[],'category':'unclassified','line_completion_permitted':False,'task_completion_permitted':False,'label':'Recorded work · Area','alignment':{'method':'Independent native master registration','setout':False}}
        self.raw = {'schema':1,'author':'Andrew Fisher','base_catalogue_sha256':S.digest(self.base),'master_path':str(self.master),'sources':[{**self.plan,'path':str(self.new)}],'geometry':[self.geom],'coverage':[],'geometry_reviews':[{'geometry_id':'new-area','geometry_sha256':S.digest(self.geom),'master_sha256':self.master_hash,'source_sha256':self.plan['sha256'],'source_page':1,'scope':'area','approved':True,'basis':'Independently reviewed source registration','reviewed_on':'2026-10-04'}]}
        self.review = S.dependency('v8.36_fencing_review_status','fencing_review836.py')
    def tearDown(self):self.tmp.cleanup()
    def pdf(self,name,text):
        p=self.root/name;d=fitz.open();pg=d.new_page(width=1000,height=1000);pg.insert_text((50,50),text);d.save(p);d.close();return p
    def hash(self,p):return hashlib.sha256(p.read_bytes()).hexdigest()
    def validate(self,raw=None):return S.validate_catalogue_delta(self.base,raw or self.raw,self.review.checked_file)
    def rebind(self,raw):raw['geometry_reviews'][0]['geometry_sha256']=S.digest(raw['geometry'][0])
    def test_additive_preserves_prior_catalogue(self):
        got=self.validate();self.assertEqual(got['geometry'][:-1],self.base['geometry']);self.assertEqual(got['sources'][:-1],self.base['sources']);self.assertEqual(got['sources'][-1]['id'],'new-plan');self.assertEqual(got['reference_sources'],self.base['reference_sources']);self.assertEqual(got['coverage'],self.base['coverage']);self.assertEqual(got['conflicts'],self.base['conflicts']);self.assertEqual(got['current_source_id'],'old-plan');self.assertNotIn(str(self.root),json.dumps(got))
    def test_source_bytes_pages_and_fingerprint(self):
        for field,value in [('sha256','0'*64),('pages',2),('document_file','../new.pdf')]:
            raw=deepcopy(self.raw);raw['sources'][0][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):self.validate(raw)
    def test_master_and_base_changed(self):
        for key,value in [('master_path',str(self.old)),('base_catalogue_sha256','0'*64)]:
            raw=deepcopy(self.raw);raw[key]=value
            with self.subTest(key=key),self.assertRaises(ValueError):self.validate(raw)
    def test_duplicate_source_or_geometry_refused(self):
        for key in ['sources','geometry']:
            raw=deepcopy(self.raw);raw[key].append(deepcopy(raw[key][0]))
            with self.subTest(key=key),self.assertRaises(ValueError):self.validate(raw)
        raw=deepcopy(self.raw);raw['geometry'][0]['id']='old-line';self.rebind(raw)
        with self.assertRaises(ValueError):self.validate(raw)
    def test_out_of_bounds_nonfinite_and_false_completion(self):
        for field,value in [('points',[[1001,1]]),('points',[[float('nan'),1]]),('task_ids',['task']),('area_evidence_names',['Completed area']),('line_completion_permitted',True),('cost',12)]:
            raw=deepcopy(self.raw);raw['geometry'][0][field]=value
            with self.subTest(field=field,value=value),self.assertRaises(ValueError):self.validate(raw)
    def test_reviews_bind_full_geometry(self):
        for field,value in [('approved',False),('scope','section'),('geometry_sha256','0'*64),('source_page',2)]:
            raw=deepcopy(self.raw);raw['geometry_reviews'][0][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):self.validate(raw)
    def test_source_date_qualification_is_bound_reviewed_text(self):
        raw=deepcopy(self.raw);note='The displayed date is PDF creation metadata, not an issued revision or work date.';raw['geometry'][0]['source_date_conflict']=note
        with self.assertRaises(ValueError):self.validate(raw)
        self.rebind(raw);got=self.validate(raw);self.assertEqual(got['geometry'][-1]['source_date_conflict'],note);self.assertEqual(got['geometry'][-1]['points'],self.geom['points'])
        for value in [None,{},[],7,' ',str(self.root)]:
            bad=deepcopy(raw);bad['geometry'][0]['source_date_conflict']=value;self.rebind(bad)
            with self.subTest(value=value),self.assertRaises(ValueError):self.validate(bad)
    def test_no_private_fields_or_area_line_coverage(self):
        raw=deepcopy(self.raw);raw['geometry'][0]['private_path']=str(self.root)
        with self.assertRaises(ValueError):self.validate(raw)
        raw=deepcopy(self.raw);raw['coverage']=[{'mapping_status':'mapped'}]
        with self.assertRaises(ValueError):self.validate(raw)
    def test_union_refuses_implicit_replacement(self):
        before=[{'id':'x','value':1}]
        with self.assertRaises(ValueError):S.unique_union(before,[{'id':'x','value':2}],'id','fixture')
        self.assertEqual(S.unique_union(before,[{'id':'y','value':2}],'id','fixture'),before+[{'id':'y','value':2}]);self.assertEqual(before,[{'id':'x','value':1}])
    def review_fixture(self):
        row={'record_id':'record-old','docket_no':'10001','book':'red','expected':{'quantities':{'clean':2}},'po':None,'summary':None,'query':{'open':True,'text':'Written component unclear'},'original':{'source_id':'old.pdf','page':1},'reviewed_on':'2026-10-03'}
        base={'sources':[{'id':'old.pdf','sha256':'a'*64}],'rows':[row]};raw={'base_review_sha256':S.digest(base),'replace_record_ids':['record-old']};return base,raw,row
    def test_review_clarification_preserves_signature_po_and_other_rows(self):
        base,raw,row=self.review_fixture();new=deepcopy(row);new['query']['text']='Handwriting clarified; separate charge basis unproved';got=S.merge_review(base,raw,{'sources':[],'rows':[new]});self.assertEqual(got['rows'][0]['expected'],row['expected']);self.assertEqual(base['rows'][0]['query']['text'],'Written component unclear')
        for key,value in [('expected',{'quantities':{'clean':3}}),('po',{'number':'12345'}),('book','green')]:
            bad=deepcopy(new);bad[key]=value
            with self.subTest(key=key),self.assertRaises(ValueError):S.merge_review(base,raw,{'sources':[],'rows':[bad]})
    def test_review_duplicate_docket_or_unbound_base(self):
        base,raw,row=self.review_fixture();new=deepcopy(row);new['record_id']='record-new'
        with self.assertRaises(ValueError):S.merge_review(base,{**raw,'replace_record_ids':[]},{'sources':[],'rows':[new]})
        with self.assertRaises(ValueError):S.merge_review(base,{**raw,'base_review_sha256':'0'*64},{'sources':[],'rows':[row]})
    def test_trace_preserves_commercial_relations_and_unmapped_context(self):
        old={'record_id':'old','docket_no':'10000','book':'red','expected':{'note':None},'area_ids':['old-area']};base={'sources':[],'areas':[],'rows':[old],'relations':[{'id':'existing'}],'commercial':{'groups':[{'total_cents':123,'lines':['unique-line']} ]},'unmapped':[{'record_id':'new'},{'record_id':'context'}]};raw={'base_trace_sha256':S.digest(base),'replace_record_ids':[]};clean={'sources':[],'areas':[],'rows':[{'record_id':'new','docket_no':'10001','area_ids':['new-area']},{'record_id':'context','docket_no':'10002','area_ids':[]}],'relations':[],'unmapped':[]};got=S.merge_trace(base,raw,clean);self.assertEqual(got['commercial'],base['commercial']);self.assertEqual(got['relations'],base['relations']);self.assertEqual(got['unmapped'],[{'record_id':'context'}]);self.assertEqual(got['rows'][0],old)
    def test_trace_no_removed_area_or_new_parent_relation(self):
        old={'record_id':'old','docket_no':'10000','book':'red','expected':{},'area_ids':['old-area']};base={'sources':[],'areas':[],'rows':[old],'relations':[],'unmapped':[]};raw={'base_trace_sha256':S.digest(base),'replace_record_ids':['old']};clean={'sources':[],'areas':[],'rows':[{**old,'area_ids':[]}],'relations':[],'unmapped':[]}
        with self.assertRaises(ValueError):S.merge_trace(base,raw,clean)
        clean['rows']=[old];clean['relations']=[{'id':'new'}]
        with self.assertRaises(ValueError):S.merge_trace(base,raw,clean)
    def test_exact_base_repeat_and_private_input_guards(self):
        with self.assertRaises(ValueError):S.apply('<html>wrong base</html>')
        with self.assertRaises(ValueError):S.apply(S.MARKER)
        p=self.root/'input.json';p.write_text(json.dumps({'schema':1,'author':'Andrew Fisher'}));self.assertEqual(S.bound_input(str(p),self.hash(p))['schema'],1)
        with self.assertRaises(ValueError):S.bound_input(str(p),'0'*64)
    def test_signature_scrub_safety_preserved(self):
        trace=S.dependency('v8.37_fencing_map_trace','fencing_trace837.py');value={'expected':{'note':'Andrew Fisher reviewed'},'basis':'Source <page>'};encoded=trace.safe_json(value);self.assertIn('\\u0041ndrew Fisher',encoded);self.assertNotIn('<page>',encoded);self.assertEqual(json.loads(encoded),value)

if __name__=='__main__':unittest.main()
