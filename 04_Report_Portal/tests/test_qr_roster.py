"""SiteIQ badge import tests use fictional employees and badges."""
import io
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import qr_roster as roster
from upload_policy import MMG_PROJECT, MMG_SCHEDULE


def workbook(rows, *, ref=MMG_SCHEDULE, headers=('Name', 'Employer', 'External ID', 'Status'),
             title='Sheet1', number_format=None):
    book = openpyxl.Workbook()
    sheet = book.active
    sheet.title = title
    sheet.append(list(headers))
    for r in rows:
        sheet.append(list(r))
    if number_format:
        for cell, form in number_format.items():
            sheet[cell].number_format = form
    if ref is not None:
        rs = book.create_sheet('REFERENCE_INFO')
        rs.append(['PROJECT SCHEDULE', 'PROJECT'])
        rs.append([ref, MMG_PROJECT])
    buf = io.BytesIO()
    book.save(buf)
    return buf.getvalue()


def on_hire(rows, ref=MMG_SCHEDULE):
    return workbook(rows, ref=ref, title='ON_HIRE',
                    headers=('HIRER_NAME', 'COMPANY', 'HIRER_BARCODE', 'EXTERNAL_ID', 'HIRER_ID', 'ITEM_NUMBER'))


class TestRoster(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tempdir.cleanup)
        self.root = Path(self.tempdir.name)

    def install(self, book, attest=False):
        return roster.import_roster(self.root, book, confirmed_mmg=attest)

    def facts(self, workers):
        data = dict(schedule=MMG_SCHEDULE, workers=[
            dict(hirer=n, employer=c, hirer_id=i) for n,c,i in workers])
        (self.root/'qr-report-data.json').write_text(json.dumps(data))

    def links(self):
        data = json.loads((self.root/roster.FILE).read_text())
        return {c:(p['hirer'],p['company']) for p in data['people']
                for c in [p['barcode'],*p['barcodes']]}

    def test_stamped_onhire_dedupes_items_and_preserves_badge_aliases_not_hirer_id(self):
        rows = [('Field Worker','Mine','ID-raw','0054','65','Asset1'),
                ('Field Worker','Mine','ID-raw','0054','65','Asset2')]
        result = self.install(on_hire(rows))
        self.assertEqual(result['linked'], 1)
        self.assertEqual(set(self.links()), {'0054','ID-raw'})
        self.assertTrue(roster.status(self.root)['updated'].endswith('+00:00'))
        self.assertEqual((self.root/roster.FILE).stat().st_mode & 0o777, 0o600)

    def test_roster_template_cell_schedule_and_numeric_formats(self):
        book = workbook([('Field Worker','Mine',53,MMG_SCHEDULE),('Other Worker','Mine','000022',MMG_SCHEDULE)],
                        headers=('HIRER_NAME','COMPANY','HIRER_BARCODE','PROJECT SCHEDULE'),
                        ref=None,number_format={'C2':'000000'})
        self.assertEqual(self.install(book)['linked'], 2)
        self.assertEqual(set(self.links()),{'000053','000022'})
        bad = workbook([('Field Worker','Mine',53,'Other job')],headers=('Name','Employer','External ID','PROJECT SCHEDULE'),ref=None)
        with self.assertRaises(ValueError):
            self.install(bad,True)
        self.assertEqual(set(self.links()),{'000053','000022'})

    def test_unstamped_attestation_needs_current_unique_exact_party(self):
        self.facts([('Field Worker','Raw Employer',''),('Same Person','CO','11'),('Same Person','CO','22'),
                    ('Case Worker','CO',''),('CASE WORKER','CO','')])
        b=workbook([(' FIELD  worker ','RAW  EMPLOYER','0001',None),('Foreign Worker','CO','0002','Active'),
                    ('Same Person','CO','0003','Active'),('Case Worker','CO','0004','Active')],ref=None)
        with self.assertRaisesRegex(ValueError,'Confirm'):
            self.install(b)
        result=self.install(b,True)
        self.assertEqual(self.links(),{'0001':('Field Worker','Raw Employer')})
        self.assertEqual((result['linked'],result['skipped']),(1,3))

    def test_badges_checked_before_filtering_including_incomplete_and_inactive_rows(self):
        self.facts([(n, 'Mine', '') for n in ('Worker A', 'Worker B', 'Worker C', 'Worker D', 'Independent')])
        rows = [('Worker A', 'Mine', 'a', 'shared-a', 'Active'),
                ('Off Job', 'Foreign', 'shared-a', 'offjob-alias', 'Active'),
                ('Worker B', 'Mine', 'b', 'shared-b', 'Active'),
                ('', 'Unknown employer', 'shared-b', '', 'Active'),
                ('Worker C', 'Mine', 'c', 'shared-c', 'Active'),
                ('Worker D', 'Mine', 'shared-c', 'd', 'Inactive'),
                ('Independent', 'Mine', 'good', '', 'Active')]
        result = self.install(workbook(rows, ref=None,
                              headers=('Name','Employer','External ID','Hirer barcode','Status')), True)
        self.assertEqual(self.links(), {'good': ('Independent','Mine')})
        self.assertEqual((result['linked'], result['skipped'], result['conflicts']), (1, 6, 4))
        self.assertNotIn('Foreign', (self.root/roster.FILE).read_text())
        self.assertNotIn('offjob-alias', (self.root/roster.FILE).read_text())
        self.install(on_hire([('Worker B', 'Mine', 'b', None, '', 'tool')]))
        self.assertEqual(set(self.links()), {'good'})

    def test_new_incomplete_claim_revokes_existing_link_without_changing_unrelated_holders(self):
        self.facts([('Worker A','Mine',''),('Worker B','Mine','')])
        self.install(workbook([('Worker A','Mine','one','Active'), ('Worker B','Mine','two','Active')]))
        result = self.install(workbook([('Unknown',None,'one','Active')], ref=None), True)
        self.assertEqual(self.links(), {'two': ('Worker B','Mine')})
        self.assertEqual(result['skipped'], 1)
        self.install(on_hire([('Worker A','Mine','one',None,'','tool')]))
        self.assertEqual(set(self.links()), {'two'})

    def test_full_roster_reimport_admits_new_activity_and_quarantines_off_job_collision(self):
        self.facts([('Already Known','Mine','')])
        source = workbook([('Already Known','Mine','early','Active'),
                           ('New Worker','Mine','later','Active'),
                           ('Off Job A','Elsewhere','disputed','Active'),
                           ('Off Job B','Elsewhere','disputed','Inactive')], ref=None)
        self.assertEqual(self.install(source, True)['linked'], 1)
        directory = json.loads((self.root/roster.FILE).read_text())
        self.assertIn('disputed', directory['blocked_barcodes'])
        self.assertNotIn('New Worker', (self.root/roster.FILE).read_text())
        self.install(on_hire([('Off Job A','Elsewhere','disputed',None,'','item')]))
        self.assertEqual(set(self.links()), {'early'})
        self.facts([('Already Known','Mine',''),('New Worker','Mine','')])
        self.assertEqual(self.install(source, True)['linked'], 2)
        self.assertEqual(set(self.links()), {'early','later'})

    def test_hirer_spelling_matches_only_same_raw_employer_and_supported_source_separator(self):
        facts = dict(schedule=MMG_SCHEDULE,
                     hires=[dict(hirer='Field - Worker', employer='Raw Employer', hirer_id='stable')],
                     draws=[dict(hirer='Field Worker', employer='Raw Employer')],
                     workers=[dict(hirer='Field Worker', employer='Raw Employer')])
        (self.root/'qr-report-data.json').write_text(json.dumps(facts))
        source = workbook([('Field Worker','Raw Employer','field','Active'),
                           ('Field Worker','Different Employer','other','Active')], ref=None)
        result = self.install(source, True)
        self.assertEqual(self.links(), {'field': ('Field Worker','Raw Employer')})
        self.assertEqual((result['linked'],result['skipped'],result['conflicts']), (1,1,0))
        self.assertEqual(json.loads((self.root/roster.FILE).read_text())['people'][0]['hirer_id'], 'stable')

    def test_foreign_or_invalid_workbook_keeps_previous(self):
        self.install(workbook([('First Worker','Em','0001','Active')]))
        for b in (b'not Excel',workbook([],ref='MMG other schedule'),
                  on_hire([('First Worker','Em','a','b','1','item')],None),
                  workbook([('Worker','Em','x')],headers=('Name','Employer','HIRER_ID')),
                  workbook([])):
            with self.subTest(length=len(b)), self.assertRaises(ValueError):
                self.install(b,True)
            self.assertEqual(self.links(),{'0001':('First Worker','Em')})

    def test_partial_concurrent_updates_preserve_others_and_block_crossperson_collision(self):
        self.install(workbook([('First Worker','Em','0001',None)]))
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda i:self.install(on_hire([(f'Worker {i}','Em',f'c{i}',f'e{i}',f'i{i}',f'item{i}')])),range(5)))
        self.assertEqual(len(results),5)
        self.assertEqual(roster.status(self.root)['linked'],6)
        self.install(on_hire([('Second Worker','Em','0001',None,'another','asset')]))
        self.assertNotIn('0001',self.links())
        self.install(on_hire([('First Worker','Em','0001',None,None,'item')]))
        self.assertNotIn('0001',self.links())
        self.assertIn('c4',self.links())

    def test_full_replaces_old_and_revocation_survives_a_partial_replay(self):
        self.install(workbook([('A Worker','Em','old',None),('B Worker','Em','BB',None)]))
        self.install(workbook([('A Worker','Em','new',None),('B Worker','Em','BB','Inactive')]))
        self.assertEqual(set(self.links()),{'new'})
        # A stale partial for the still-employed A must not remove the new badge.
        self.install(on_hire([('A Worker','Em','old',None,'a','item')]))
        self.assertEqual(set(self.links()),{'new'})
        self.install(on_hire([('B Worker','Em','BB',None,'b','item')]))
        self.assertEqual(set(self.links()),{'new'})
        self.install(workbook([('B Worker','Em','BB','Active')]))
        self.assertEqual(set(self.links()),{'BB'})

    def test_revocation_only_workbook_preserves_unrelated_links(self):
        self.install(workbook([('A Worker','Em','one',None), ('B Worker','Em','two',None)]))
        result=self.install(workbook([('A Worker','Em','one','Inactive')]))
        self.assertEqual(self.links(),{'two':('B Worker','Em')})
        self.assertEqual(result['conflicts'],0)

    def test_private_history_follows_only_same_verified_person(self):
        self.install(on_hire([('A Worker','Em','one',None,'native','item')]))
        file = self.root / roster.FILE
        prior = json.loads(file.read_text())
        metadata = dict(person_id='stable-worker',
                        history=[dict(schedule='Earlier shutdown',hirer='A Worker',company='Past employer')],
                        aliases=[dict(hirer='Other Spelling',company='Em')])
        prior['people'][0].update(metadata)
        file.write_text(json.dumps(prior))
        self.install(on_hire([('B Worker','Em','two',None,'b','item2')]))
        kept = next(r for r in json.loads(file.read_text())['people'] if r['hirer']=='A Worker')
        for k,v in metadata.items():
            self.assertEqual(kept[k],v)
        self.install(workbook([('A Worker','Em','one',None)]))
        kept = json.loads(file.read_text())['people'][0]
        self.assertEqual(kept['hirer_id'],'native')
        for k,v in metadata.items():
            self.assertEqual(kept[k],v)
        self.install(workbook([('A Worker','Em','rotated','native')],
                              headers=('Name','Employer','External ID','HIRER_ID')))
        self.assertEqual(json.loads(file.read_text())['people'][0]['person_id'],'stable-worker')
        self.install(workbook([('Another Worker','Em','rotated','native')],
                              headers=('Name','Employer','External ID','HIRER_ID')))
        self.assertFalse(set(metadata) & json.loads(file.read_text())['people'][0].keys())

    def test_credential_disagreement_drops_private_history(self):
        self.install(on_hire([('A Worker','Em','one',None,'original','item')]))
        file = self.root / roster.FILE
        prior = json.loads(file.read_text())
        prior['people'][0]['person_id']='stable-worker'
        file.write_text(json.dumps(prior))
        self.install(workbook([('A Worker','Em','one','other')],headers=('Name','Employer','External ID','HIRER_ID')))
        self.assertNotIn('person_id',json.loads(file.read_text())['people'][0])

    def test_ambiguous_names_and_credentials_never_resolve_to_one_party(self):
        self.install(on_hire([('Same Name','Em','a','x','id1','Item1'),
                              ('Same Name','Em','b','y','id2','Item2'),
                              ('Hirer A','Em','z',None,'3','Item3'),
                              ('Hirer B','Em2','z',None,'4','Item4'),
                              ('Hirer C','Em','u',None,'same-id','Item5a'),
                              ('Hirer D','Em','v',None,'same-id','Item5b'),
                              ('Confirm Worker','Em','OK',None,'5','Item5')]))
        self.assertEqual(self.links(),{'OK':('Confirm Worker','Em')})

    def test_empty_unstamped_unrelated_preserves_existing_directory(self):
        self.facts([('Field Worker','Mine','')])
        self.install(workbook([('Field Worker','Mine','X',None)]))
        with self.assertRaisesRegex(ValueError,'No eligible'):
            self.install(workbook([('Unknown','Not there','X2',None)],ref=None),True)
        self.assertEqual(set(self.links()),{'X'})

    def test_additive_roster_preserves_every_existing_subject_and_revocation(self):
        rows = [('Existing Worker','Em','badge','Active'),('Retired Worker','Em','retired','Inactive')]
        self.install(workbook(rows))
        file = self.root/roster.FILE
        prior = json.loads(file.read_text())
        prior['people'][0].update(hirer_id='stable-id', barcodes=['alias-badge'],
                                  aliases=[dict(hirer='Alternate - Name',company='Em')],
                                  history=[dict(schedule='Other',hirer='Old Name',company='Em')])
        prior['custom'] = {'other': True}
        file.write_text(json.dumps(prior))
        def add():
            return roster.import_roster(self.root, workbook([
                ('Independent Worker','Em','003','Active',''),
                ('Existing Worker','EM','alias-badge','Active',''),
                ('Another Worker','Em','badge','Active',''),
                ('Alternate Name','Em','new-alias','Active',''),
                ('Different Name','Em','new-code','Active','stable-id'),
                ('Retired - Worker','Em','replacement','Active',''),
                ('Another Name','Em','retired','Active',''),
                ('Inactive Name','Em','inactive','Inactive',''),
                ('Unknown Status','Em','pending','',''),
                ('Incomplete','', 'claimed-by-incomplete','Active',''),
                ('Other Subject','Em', 'claimed-by-incomplete','Active',''),
                ('Same Name','Em','one','Active',''),
                ('Same Name','Em','two','Active',''),
                ('Another New','Em','shared-new','Active',''),
                ('Third New','Em','shared-new','Active',''),
            ], headers=('Name','Employer','External ID','Status','Hirer ID')), add_only=True)
        result = add()
        self.assertEqual((result['added'],result['already_linked'],result['linked']),(1,1,2))
        current = json.loads(file.read_text())
        self.assertEqual(current['people'][0],prior['people'][0])
        for key in ('blocked_barcodes','disabled_pairs','custom'):
            self.assertEqual(current[key],prior[key])
        self.assertEqual(set(self.links()), {'badge','alias-badge','003'})
        before = file.read_bytes()
        result = add()
        self.assertEqual((result['added'],result['already_linked'],result['linked']),(0,2,2))
        self.assertEqual(file.read_bytes(),before)

    def test_additive_scope_is_explicit_and_concurrent_updates_accumulate(self):
        def add(body):
            return roster.import_roster(self.root, body, confirmed_mmg=True, add_only=True)
        rows = [('Field Worker','Em','id','Active')]
        for body in (workbook(rows, ref=None), workbook(rows, ref='Other schedule'),
                     workbook([(*rows[0],MMG_SCHEDULE)],ref=None,
                              headers=('Name','Employer','External ID','Status','Project Schedule')),
                     on_hire([('Field Worker','Em','id','','42','123')])):
            with self.assertRaises(ValueError):
                add(body)
        self.assertFalse((self.root/roster.FILE).exists())
        def submit(i):
            return add(workbook([(f'Worker {i}','Em',f'00{i}','Active',MMG_PROJECT,MMG_SCHEDULE)],
                                ref=None,headers=('Name','Employer','External ID','Status','Project','Project Schedule')))
        with ThreadPoolExecutor(max_workers=4) as pool:
            self.assertEqual(sum(r['added'] for r in pool.map(submit,range(7))),7)
        self.assertEqual(set(self.links()), {f'00{i}' for i in range(7)})

    def test_workbook_limits_sparse_row_and_noncredential_types(self):
        good=workbook([('Good Guy','Em','valid',None),
                       ('Bad Formula','Em','=1+1',None),('Bad precision','Em',1000000000000000,None)])
        self.assertEqual(self.install(good)['skipped'],2)
        self.assertEqual(set(self.links()),{'valid'})
        buf=io.BytesIO()
        with zipfile.ZipFile(io.BytesIO(good)) as src, zipfile.ZipFile(buf,'w') as dest:
            for n in src.namelist():
                body=src.read(n)
                if n=='xl/worksheets/sheet1.xml':
                    body=body.replace(b'</sheetData>',b'<row r="1048576"></row></sheetData>')
                dest.writestr(n,body)
        with self.assertRaisesRegex(ValueError,'limits'):
            self.install(buf.getvalue())


if __name__=='__main__':
    unittest.main()
