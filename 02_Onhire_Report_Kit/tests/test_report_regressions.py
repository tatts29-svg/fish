"""Regression checks using tiny, invented SiteIQ exports (no site data)."""
import contextlib
import datetime as dt
import email
import email.policy
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import build_onhire_workbook as report

DAY = dt.date(2026, 11, 6)


def export(path, sheets, period='01/11/2026 05:00:00 - 06/11/2026 04:59:00'):
    book = openpyxl.Workbook()
    book.remove(book.active)
    for name, rows in sheets.items():
        sheet = book.create_sheet(name)
        columns = list(dict.fromkeys(k for row in rows for k in row))
        if not columns:
            columns = ['ITEM_NUMBER']
        sheet.append(columns)
        for row in rows:
            sheet.append([row.get(key) for key in columns])
    ref = book.create_sheet('REFERENCE_INFO')
    ref.append(['PROJECT_SCHEDULE', 'REPORT_PERIOD', 'REQUESTED_DATE/TIME'])
    ref.append(['Synthetic QA job', period, '06/11/2026 05:05'])
    book.save(path)


def fixture(base, company_names=('Example Engineering',), sales=None):
    data = Path(base) / 'Data_SiteIQ'
    data.mkdir()
    (Path(base) / 'JOB.txt').write_text('short: QA\njob: Synthetic QA job\n')
    rental, tooling = [], []
    for index, name in enumerate(company_names):
        rental.append(dict(ITEM_NUMBER=f'T{index}', ITEM_BARCODE=f'B{index}',
            ITEM_DESCRIPTION='TORQUE WRENCH', ITEM_STATUS='On Hire',
            OWNER='COATES', COMPANY_NAME=name, HIRER_NAME=f'Worker {index}'))
        tooling.append({'TRANSACTION_ID': f'TX{index}', 'SKU/ITEM_NUMBER': f'T{index}',
            'LATEST_BARCODE': f'B{index}', 'SKU/ITEM DESCRIPTION': 'TORQUE WRENCH',
            'PRODUCT_CATEGORY': 'Tooling', 'EMPLOYER_NAME': name,
            'HIRER_NAME': f'Worker {index}', 'TRAN_START_DATE': '03/11/2026',
            'TRAN_START_TIME': '08:00', 'QUANTITY': 1})
    export(data / 'RENTAL_STOCK.xlsx', {'RENTAL_STOCK': rental})
    export(data / 'TRANSACTIONS.xlsx', {'TRANSACTION_WITHOUT_CHARGES': tooling})
    export(data / 'SALES_STOCK.xlsx', {'SALES_STOCK': sales or []})


def run(base):
    report._close_ro_all()
    with contextlib.redirect_stdout(io.StringIO()):
        result = report.build(str(base), DAY)
    assert result == 0
    return Path(base) / 'Reports' / DAY.isoformat()


class ReportRegressions(unittest.TestCase):
    def tearDown(self):
        report._close_ro_all()

    def test_renamed_job_preserves_typed_tabs(self):
        with tempfile.TemporaryDirectory() as base:
            (Path(base) / 'JOB.txt').write_text('short: New name\njob: QA\n')
            old = openpyxl.Workbook()
            old.active.title = 'Coates Labour'
            old.active['B5'] = 'Manually typed roster entry'
            old.create_sheet('Cost Breakdown')['C8'] = 1234.5
            old.save(Path(base) / 'Old_name_Onhire_Workbook_LATEST.xlsx')
            new = openpyxl.Workbook()
            with contextlib.redirect_stdout(io.StringIO()):
                report.carry_over(new, report.LooseSite(base), base, 'QA', DAY)
            self.assertEqual(new['Coates Labour']['B5'].value, 'Manually typed roster entry')
            self.assertEqual(new['Cost Breakdown']['C8'].value, 1234.5)

    def test_company_email_uses_its_own_hero(self):
        with tempfile.TemporaryDirectory() as base:
            site = report.LooseSite(base)
            blocks, _ = report.pack_blocks(
                [['Example', 'Worker', 'T1', 'Wrench', 'On Hire', DAY, '08:00', 0, 'TX1', None]],
                [], [], DAY)
            parts = {'story': {'hero': ('9,999', 'items on hire now', 'SITEWIDE HERO')},
                     'period': '', 'source_stamp': '06 Nov 2026'}
            html = report.company_email_html(site, DAY, dt.datetime(2026, 11, 6), parts, blocks[0])
            self.assertNotIn('9,999', html)
            self.assertNotIn('SITEWIDE HERO', html)
            self.assertEqual(parts['story']['hero'][0], '9,999', 'Rendering must not mutate whole-site parts')

    def test_sales_draws_agree_with_company_summary(self):
        with tempfile.TemporaryDirectory() as base:
            sale = dict(COMPANY_NAME='Consumables Only', HIRER='Worker A',
                        SKU_DESCRIPTION='GLOVES', SALES_QUANTITY=2,
                        SALES_DATE='04/11/2026', SALES_TIME='09:00')
            fixture(base, sales=[sale])
            out = run(base)
            book = openpyxl.load_workbook(next(out.glob('*.xlsx')), data_only=True)
            rows = list(book['Company Summary'].iter_rows(min_row=3, values_only=True))
            matching = [r for r in rows if r[0] == 'Consumables Only' and r[1] == 'CONSUMABLES']
            self.assertTrue(matching, 'A company that only drew sales stock must be included')
            self.assertEqual(matching[0][2], 1)
            book.close()

    def test_window_uses_time_boundaries_and_excludes_undated_sales(self):
        with tempfile.TemporaryDirectory() as base:
            def sale(day, time):
                return dict(COMPANY_NAME='Example Engineering', HIRER='Worker',
                            SKU_DESCRIPTION='GLOVES', SALES_QUANTITY=1,
                            SALES_DATE=day, SALES_TIME=time)
            fixture(base, sales=[sale('01/11/2026', '04:59'), sale('01/11/2026', '05:00'),
                sale('06/11/2026', '04:59'), sale('06/11/2026', '05:00'), sale('', '')])
            out = run(base)
            history = report.read_history(base, report.LooseSite(base))
            self.assertEqual(history[-1]['draws'], 2,
                             'Only the two confirmed draws inside the exact export window count')
            book = openpyxl.load_workbook(next(out.glob('*.xlsx')), data_only=True)
            self.assertEqual(book['Consumable Transactions'].max_row - 2, 5,
                             'Excluded draws must remain available in the audit tab')
            book.close()

    def test_company_filenames_cannot_overwrite_each_other(self):
        with tempfile.TemporaryDirectory() as base:
            fixture(base, company_names=('A/B Engineering', 'A:B Engineering'))
            out = run(base) / 'By_Company'
            self.assertEqual(len(list(out.glob('*.pdf'))), 2)
            self.assertEqual(len(list(out.glob('*.eml'))), 2)
            for manifest_path in out.glob('*.draft.json'):
                manifest = json.loads(manifest_path.read_text())
                self.assertTrue((out / manifest['body']).is_file())
                self.assertTrue(all((out / name).is_file() for name in manifest['attachments']))
                eml = email.message_from_bytes(manifest_path.with_suffix('').with_suffix('.eml').read_bytes(),
                                               policy=email.policy.default)
                self.assertEqual(eml['X-Unsent'], '1')
                self.assertIsNone(eml['To'])
                self.assertEqual(next(eml.iter_attachments()).get_filename(), manifest['attachments'][0])


    def test_missing_main_email_fails_the_run(self):
        with tempfile.TemporaryDirectory() as base:
            fixture(base)
            with mock.patch.object(report, 'write_email', side_effect=OSError('locked email')):
                with contextlib.redirect_stdout(io.StringIO()) as log:
                    result = report.build(base, DAY)
            self.assertEqual(result, 1)
            self.assertIn('main email complete', log.getvalue())
            self.assertFalse((Path(base) / 'Reports' / 'history.csv').exists())

    def test_missing_company_draft_fails_the_run(self):
        with tempfile.TemporaryDirectory() as base:
            fixture(base)
            with mock.patch.object(report, 'write_company_email', side_effect=OSError('locked draft')):
                with contextlib.redirect_stdout(io.StringIO()) as log:
                    result = report.build(base, DAY)
            self.assertEqual(result, 1)
            self.assertIn('company drafts complete', log.getvalue())

    def test_date_only_sale_requires_a_fully_covered_day(self):
        bounds = (dt.datetime(2026, 11, 1, 5), dt.datetime(2026, 11, 6, 4, 59, 59))
        self.assertFalse(report.sale_in_window({'SALES_DATE': '01/11/2026'}, bounds))
        self.assertTrue(report.sale_in_window({'SALES_DATE': '02/11/2026'}, bounds))
        self.assertFalse(report.sale_in_window({'SALES_DATE': '06/11/2026'}, bounds))
        self.assertTrue(report.sale_in_window({'SALES_DATE': '06/11/2026',
                                              'SALES_TIME': '04:59:59 AM'}, bounds))
        self.assertFalse(report.sale_in_window({'SALES_DATE': '06/11/2026',
                                               'SALES_TIME': '05:00:00 AM'}, bounds))


    def test_report_date_includes_returns_own_gear_and_sales(self):
        cases = [('TRANSACTION_WITHOUT_CHARGES', 'TRAN_END_DATE'),
                 ('CUSTOMER_CONTRACTOR_EQUIP', 'TRAN_START_DATE'),
                 ('CUSTOMER_CONTRACTOR_EQUIP', 'TRAN_END_DATE'),
                 ('SALES_STOCK', 'SALES_DATE')]
        for sheet_name, date_field in cases:
            with self.subTest(sheet=sheet_name, field=date_field), tempfile.TemporaryDirectory() as base:
                fixture(base)
                data = Path(base) / 'Data_SiteIQ'
                path = data / ('SALES_STOCK.xlsx' if sheet_name == 'SALES_STOCK' else 'TRANSACTIONS.xlsx')
                book = openpyxl.load_workbook(path)
                if sheet_name not in book.sheetnames:
                    sheet = book.create_sheet(sheet_name)
                    sheet.append(['TRANSACTION_ID', 'SKU/ITEM_NUMBER', 'SKU/ITEM DESCRIPTION',
                                  'EMPLOYER_NAME', 'HIRER_NAME', 'TRAN_START_DATE'])
                    sheet.append(['OWN1', 'OWN1', 'Mat', 'Example Engineering', 'Worker', '03/11/2026'])
                sheet = book[sheet_name]
                if sheet_name == 'SALES_STOCK':
                    sheet.append([])
                    sheet.cell(1, 1, 'SALES_QUANTITY')
                    sheet.cell(2, 1, 1)
                columns = [c.value for c in sheet[1]]
                col = columns.index(date_field) + 1 if date_field in columns else len(columns) + 1
                sheet.cell(1, col, date_field)
                sheet.cell(2, col, '07/11/2026')
                book.save(path)
                book.close()
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(report.build(base, DAY), 0)
                self.assertTrue((Path(base) / 'Reports' / '2026-11-07').is_dir())
                self.assertEqual(report._PRINT['stale_days'], 0)
                report._close_ro_all()

    def test_history_deltas_compare_matching_time_window_basis(self):
        with mock.patch.dict(report._PRINT, {'draws_basis': 'window_time'}):
            previous = {'moves': 10, 'draws': 100, 'basis': 'window'}
            self.assertEqual(report._moves_delta(previous, 12, 50), (2, 'tooling moves'))
            previous['basis'] = 'window_time'
            self.assertEqual(report._moves_delta(previous, 12, 105), (7, 'movements'))
        with mock.patch.dict(report._PRINT, {'draws_basis': 'all_sales'}):
            self.assertEqual(report._moves_delta(previous, 12, 200), (2, 'tooling moves'))

    def test_new_history_marks_time_window_basis(self):
        with tempfile.TemporaryDirectory() as base:
            fixture(base)
            run(base)
            self.assertEqual(report.read_history(base, report.LooseSite(base))[-1]['basis'], 'window_time')


    def test_single_timed_scan_has_one_peak_hour(self):
        with tempfile.TemporaryDirectory() as base:
            site = report.LooseSite(base)
            future = DAY + dt.timedelta(days=1)
            roster = {'rows': [(future, 'Worker', 'Day', 8, '08:00', '16:00')]}
            transaction = {'TRAN_START_DATE': DAY, 'TRAN_START_TIME': '08:00'}
            parts = {'viz': {'by_day': [(DAY, 1, 0, 0)]}}
            forecast = report.forecast_block(site, DAY, roster, openpyxl.Workbook(),
                                             [transaction], [], [], parts, '', 'QA', 0, 0)
            self.assertEqual(forecast['ref']['busy'], [8])
            self.assertEqual(forecast['ref']['scans'], 1)
            self.assertEqual(forecast['ref']['busy_share'], 1.0)
            self.assertIn('busiest at 08:00', forecast['ref_line'])
            self.assertNotIn('00:00', forecast['ref_line'])
            self.assertIn('1 movement in 1 day', forecast['ref_line'])
            self.assertIn('1 day on site', forecast['brief'])

    def test_single_item_email_uses_singular_counts(self):
        with tempfile.TemporaryDirectory() as base:
            fixture(base)
            out = run(base)
            html = next(out.glob('*.html')).read_text()
            self.assertIn('1 movement went through', html)
            self.assertIn('1 tooling transaction', html)
            self.assertIn('across 1 item type<', html)
            self.assertNotIn('1 movements', html)
            self.assertNotIn('1 item types', html)


if __name__ == '__main__':
    unittest.main()
