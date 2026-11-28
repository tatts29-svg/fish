import json
import unittest
from unittest.mock import Mock, patch
from urllib.parse import urlsplit

import qr_access
import qr_product_art as pictures
import qr_reports
from report_delivery import WebReport
from test_swms import PortalHTTPCase


class ProductReferences(unittest.TestCase):
    def setUp(self):
        self.source = {
            'job': {'title': 'MMG Dugald River'}, 'asat': '2 Dec 2026 05:00',
            'pics': ['data:image/webp;base64,YWJj', 'data:image/png;base64,eHl6'],
            'tools': {
                'RAD': {'name': 'Radio (MMG Owned)', 'pic': 0},
                'GRN': {'name': 'Grinder', 'pic': 1},
                'SAW': {'name': 'Saw', 'pic': None},
            },
            'assets': [
                {'i': 'R1', 'dk': 'RAD'}, {'i': 'R2', 'dk': 'RAD'},
                {'i': 'G1', 'dk': 'GRN'}, {'i': 'S1', 'dk': 'SAW'},
            ],
        }
        self.report = {
            'asat': '2026-12-02T05:00',
            'hires': [{'name': 'Radio (MMG Owned)', 'items': [{'item': 'R1'}]}],
            'handover': {'latest_return': {'items': [{'item': 'G1', 'name': 'Grinder'}]},
                         'oldest': {'item': 'R1', 'name': 'Radio (MMG Owned)'}},
        }
        self.secret = b'k' * 32

    def web(self):
        body = '<script>const D=' + json.dumps(self.source) + ';</script>'
        return WebReport(body.encode('utf-8'))

    def links(self, web, scope='personal', session='first'):
        return pictures.links(self.report, lambda: web, self.secret, scope, session)

    def test_scoped_items_only_and_session_bound_art(self):
        web = self.web()
        for scope in ('personal', 'company'):
            with self.subTest(scope=scope):
                links = self.links(web, scope)
                self.assertEqual(set(links), {'R1', 'G1'})
                path = links['R1']
                self.assertTrue(path.startswith('/qr/' + scope + '/art-'))
                match = pictures.ROUTE.fullmatch(path.rsplit('/', 1)[1])
                self.assertIsNotNone(match)
                self.assertEqual(pictures.fetch(match, lambda: web, self.secret, scope, 'first'),
                                 ('image/webp', b'abc'))
                loader = Mock(side_effect=AssertionError('Untrusted request reached the photo catalogue'))
                for key, other_scope, session in [(self.secret, scope, 'second'), (b'z' * 32, scope, 'first'),
                                                   (self.secret, 'company' if scope == 'personal' else 'personal', 'first')]:
                    self.assertIsNone(pictures.fetch(match, loader, key, other_scope, session))
                forgery = pictures.ROUTE.fullmatch('art-' + '0' * 64 + '.png.' + match[2])
                self.assertIsNone(pictures.fetch(forgery, loader, self.secret, scope, 'first'))

    def test_conflicting_or_unsourced_product_is_omitted(self):
        self.source['assets'].append({'i': 'G1', 'dk': 'SAW'})
        self.report['hires'] += [
            {'name': 'Saw', 'items': [{'item': 'S1'}]},
            {'name': 'Another receiver', 'items': [{'item': 'R2'}]},
        ]
        self.assertEqual(set(self.links(self.web())), {'R1'})
        self.report['handover']['oldest']['name'] = 'Another receiver'
        self.assertEqual(self.links(self.web()), {})

    def test_missing_and_stale_snapshots_leave_reports_usable(self):
        self.source['asat'] = '2 Dec 2026 04:59'
        self.assertEqual(self.links(self.web()), {})
        self.source['asat'] = '2 Dec 2026 05:00'
        self.source['job']['title'] = 'Unrelated Job'
        self.assertEqual(self.links(self.web()), {})
        self.assertEqual(self.links(WebReport(b'<h1>No inventory yet</h1>')), {})
        self.assertEqual(pictures.links(self.report, Mock(side_effect=FileNotFoundError), self.secret,
                                        'personal', 'first'), {})
        self.report = {'asat': self.report['asat'], 'hires': [], 'handover': {}}
        self.assertEqual(pictures.links(self.report, Mock(side_effect=AssertionError), self.secret,
                                        'personal', 'first'), {})

    def test_latest_and_oldest_have_images_without_a_hire_group(self):
        self.report['hires'] = []
        self.assertEqual(set(self.links(self.web())), {'G1', 'R1'})


class ProductDelivery(PortalHTTPCase):
    def test_report_photo_and_cookie_scope_through_http(self):
        doc = {
            'job': {'title': 'MMG Dugald River'}, 'asat': '2 Dec 2026 05:00',
            'pics': ['data:image/png;base64,cGhvdG8='],
            'tools': {'R': {'name': 'Radio (MMG Owned)', 'pic': 0}},
            'assets': [{'i': 'R1', 'dk': 'R'}, {'i': 'R2', 'dk': 'R'}],
        }
        (self.root / 'report.html').write_text('<script>const D=' + json.dumps(doc) + ';</script>')
        report = {'kind': 'company', 'asat': '2026-12-02T05:00',
                  'hires': [{'name': 'Radio (MMG Owned)', 'items': [{'item': 'R1'}]}]}
        invite = urlsplit(qr_access.entry_url(self.root, 'company')).fragment

        def session():
            code, headers, _ = self.request('POST', '/qr/company/enter', body=json.dumps({'token': invite}),
                                             headers={'Content-Type': 'application/json', 'X-Portal': '1'})
            self.assertEqual(code, 200)
            return {'Cookie': headers['Set-Cookie'].split(';')[0]}

        headers = session()
        with patch.object(qr_reports, 'company', return_value=report):
            code, _, body = self.request('GET', '/qr/company/report?company=test', headers=headers)
        self.assertEqual(code, 200)
        images = json.loads(body)['product_art']
        self.assertEqual(set(images), {'R1'})
        path = images['R1']
        code, response, body = self.request('GET', path, headers=headers)
        self.assertEqual((code, response['Content-Type'], body), (200, 'image/png', b'photo'))
        self.assertEqual(response['Cache-Control'], 'no-store')
        self.assertEqual(self.request('HEAD', path, headers=headers)[2], b'')
        self.assertEqual(self.request('GET', path)[0], 403)
        self.assertEqual(self.request('GET', path, headers=session())[0], 404)
