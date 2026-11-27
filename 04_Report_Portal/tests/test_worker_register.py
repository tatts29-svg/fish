"""The private worker list is a manager download, never a source of sign-in identities."""
import io
import json

from openpyxl import Workbook
from test_swms import PortalHTTPCase
from upload_policy import MMG_PROJECT, MMG_SCHEDULE
import qr_roster
import worker_register


def register(*, project=MMG_PROJECT, schedule=MMG_SCHEDULE, badge='003',
             formula=False, external=False, with_header=True):
    book = Workbook()
    sh = book.active
    sh.title = 'Worker register'
    sh.append(['MMG Dugald River'])
    sh.append(['Company','Worker','Assigned barcode' if with_header else 'Card'])
    sh.append(['Example Company','Example Worker',badge])
    sh.append(['Example Company','Example Second Worker',None])
    ref = book.create_sheet('REFERENCE_INFO')
    ref.append(['PROJECT','PROJECT SCHEDULE'])
    ref.append([project,schedule])
    if formula:
        book.create_sheet('Other')['A1'] = '=2+2'
    if external:
        sh['A3'].hyperlink = 'https://example.org/'
    out = io.BytesIO()
    book.save(out)
    return out.getvalue()


class RegisterTests(PortalHTTPCase):
    path = '/upload/worker-register.xlsx'

    def test_manager_can_save_and_download_identical_bytes_while_other_roles_cannot(self):
        body = register()
        self.assertEqual(self.request('GET', self.path)[0], 303)
        self.assertEqual(self.request('PUT', self.path, body=body)[0], 401)
        self.assertEqual(self.request('GET', self.path, 'testmanager')[0],404)
        for user in ('store','client'):
            self.assertEqual(self.request('PUT', self.path,user,body)[0],403)
            self.assertEqual(self.request('GET', self.path,user)[0],403)
        before = qr_roster.status(self.root)
        status, _, response = self.request('PUT', self.path,'testmanager',body)
        self.assertEqual(status,200)
        self.assertEqual(json.loads(response)['rows'],2)
        self.assertIn('+10:00',json.loads(response)['updated'])
        status, headers, saved = self.request('GET', self.path,'testmanager')
        self.assertEqual((status,saved),(200,body))
        self.assertEqual(headers['Cache-Control'],'no-store')
        self.assertEqual(headers['Content-Type'],worker_register.MIME)
        self.assertIn('attachment;',headers['Content-Disposition'])
        self.assertEqual((self.root/worker_register.FILE).stat().st_mode & 0o777,0o600)
        for user, should_show in [('testmanager',True),('store',False)]:
            status, _, html = self.request('GET', '/upload/qr-reports',user)
            self.assertEqual(status,200)
            self.assertEqual(b'Download full worker register' in html,should_show)
            self.assertEqual(b'Register updated' in html,should_show)
        self.assertEqual(qr_roster.status(self.root), before)

    def test_bad_register_cannot_replace_last_accepted_download(self):
        good = register()
        self.assertEqual(self.request('PUT', self.path,'testmanager',good)[0],200)
        for bad in [b'bad',register(schedule='Other shutdown'),register(project='Other mine'),
                    register(with_header=False),register(badge=3),register(formula=True),register(external=True)]:
            with self.subTest(size=len(bad)):
                self.assertEqual(self.request('PUT',self.path,'testmanager',bad)[0],400)
                self.assertEqual(self.request('GET',self.path,'testmanager')[2],good)
