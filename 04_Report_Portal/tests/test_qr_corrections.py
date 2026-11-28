import json
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import qr_roster
from upload_policy import MMG_PROJECT, MMG_SCHEDULE


def correction(worker='Test Worker', old='00114', new='00113'):
    return {'worker': worker, 'employer': 'Example', 'previous': old, 'corrected': new}


def request(*items):
    return {'project': MMG_PROJECT, 'schedule': MMG_SCHEDULE, 'corrections': list(items)}


class BadgeCorrectionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.file = self.root / qr_roster.FILE
        self.data = {
            'schedule': MMG_SCHEDULE, 'blocked_barcodes': ['retired'], 'disabled_pairs': [['former', 'example']],
            'people': [
                {'hirer': 'Test Worker', 'name': 'Test Worker', 'company': 'Example', 'barcode': '00114',
                 'barcodes': ['existing-alias'], 'hirer_id': '841', 'history': [{'schedule': 'prior'}]},
                {'hirer': 'Other Worker', 'name': 'Other Worker', 'company': 'Example', 'barcode': '810',
                 'barcodes': ['other-alias'], 'hirer_id': '823'},
            ],
        }
        self.store()

    def store(self):
        self.file.write_text(json.dumps(self.data))

    def apply(self, *items):
        return qr_roster.correct_verified(self.root, request(*items))

    def test_apply_retry_no_unrelated_changes_and_retire_wrong_badge(self):
        response = self.apply(correction())
        self.assertEqual((response['corrected'], response['linked'], response['already_corrected']), (1, 2, 0))
        saved = self.file.read_bytes()
        updated = json.loads(saved)
        self.assertEqual(updated['blocked_barcodes'], ['00114', 'retired'])
        self.assertEqual(updated['disabled_pairs'], self.data['disabled_pairs'])
        self.assertEqual(updated['people'][0], dict(self.data['people'][0], barcode='00113'))
        self.assertEqual(updated['people'][1], self.data['people'][1])
        replay = self.apply(correction())
        self.assertEqual((replay['corrected'], replay['already_corrected'], replay['updated']),
                         (0, 1, response['updated']))
        self.assertEqual(self.file.read_bytes(), saved)

    def test_concurrent_retries_update_exactly_once(self):
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.apply(correction()), range(2)))
        self.assertEqual(sorted(row['corrected'] for row in results), [0, 1])
        self.assertEqual(json.loads(self.file.read_bytes())['blocked_barcodes'].count('00114'), 1)

    def test_invalid_worker_badge_or_batch_never_partially_applied(self):
        for second in [correction('Missing', '7', '9'), correction('Other Worker', '809', '811'),
                       correction('Other Worker', '810', 'retired'), correction('Other Worker', '810', '00113'),
                       correction('Test Worker', '1', '2')]:
            with self.subTest(second=second):
                before = self.file.read_bytes()
                with self.assertRaises(ValueError):
                    self.apply(correction(), second)
                self.assertEqual(self.file.read_bytes(), before)

    def test_refuse_alias_conflict_native_id_blocked_and_ambiguous_owner(self):
        for code in ['other-alias', '823', 'retired']:
            with self.subTest(code=code), self.assertRaises(ValueError):
                self.apply(correction(new=code))
        self.data['people'][1]['aliases'] = [{'hirer': 'Test Worker', 'company': 'Example'}]
        self.store()
        with self.assertRaises(ValueError):
            self.apply(correction())

    def test_blocked_disabled_disputed_and_fact_native_id(self):
        index_file = self.root / 'qr-report-data.json'
        facts = [{'hirer': 'Test Worker', 'employer': 'Example', 'hirer_id': '842'}]
        index_file.write_text(json.dumps({'schedule': MMG_SCHEDULE, 'hires': facts}))
        with self.assertRaises(ValueError):
            self.apply(correction())
        facts = [{'hirer': 'Fact Worker', 'employer': 'Example', 'hirer_id': '00113'}]
        index_file.write_text(json.dumps({'schedule': MMG_SCHEDULE, 'hires': facts}))
        with self.assertRaises(ValueError):
            self.apply(correction())
        index_file.unlink()
        self.data['disabled_pairs'].append(['test worker', 'example'])
        self.store()
        with self.assertRaises(ValueError):
            self.apply(correction())

    def test_bad_request_and_scope(self):
        for body in [None, request(), dict(request(correction()), schedule='Elsewhere'),
                     request(dict(correction(), corrected=113)), request(correction(old='00113')),
                     request(dict(correction(), employer='  ')), request(dict(correction(), extra=True))]:
            with self.subTest(body=body), self.assertRaises(ValueError):
                qr_roster.correct_verified(self.root, body)
