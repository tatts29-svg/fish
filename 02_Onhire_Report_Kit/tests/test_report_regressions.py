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


@contextlib.contextmanager
def temporary_site():
    # Some inspections call LooseSite after the build and reopen exports.
    # Release those handles before Windows removes the temporary directory.
    with tempfile.TemporaryDirectory() as base:
        try:
            yield base
        finally:
            report._close_ro_all()


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

    def test_build_releases_exports_after_success_and_failure(self):
        with temporary_site() as base:
            fixture(base)
            run(base)
            self.assertFalse(report._RO_CACHE)
            with mock.patch.object(report, 'write_email', side_effect=OSError('locked email')):
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(report.build(base, DAY), 1)
            self.assertFalse(report._RO_CACHE)
            with mock.patch.object(report, 'email_parts', side_effect=RuntimeError('interrupted')):
                with contextlib.redirect_stdout(io.StringIO()):
                    with self.assertRaises(RuntimeError):
                        report.build(base, DAY)
            self.assertFalse(report._RO_CACHE)

    def test_renamed_job_preserves_typed_tabs(self):
        with temporary_site() as base:
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
        with temporary_site() as base:
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
        with temporary_site() as base:
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
            cover = book['Cover']
            window_label = next(cell for row in cover.iter_rows() for cell in row
                                if cell.value == 'TRANSACTIONS COVER')
            window_value = cover.cell(window_label.row + 1, window_label.column)
            self.assertIn('01 Nov 2026', window_value.value)
            self.assertIn('06 Nov 2026', window_value.value)
            self.assertTrue(window_value.alignment.wrap_text,
                            'The complete export window must wrap inside its merged metadata cell')
            self.assertGreater(cover.row_dimensions[window_value.row].height, 20,
                               'Merged metadata rows need explicit room for multiple lines')
            book.close()

    def test_window_uses_time_boundaries_and_excludes_undated_sales(self):
        with temporary_site() as base:
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
        with temporary_site() as base:
            fixture(base, company_names=('A/B Engineering', 'A:B Engineering'))
            out = run(base) / 'By_Company'
            self.assertEqual(len(list(out.glob('*.pdf'))), 2)
            self.assertEqual(len(list(out.glob('*.eml'))), 2)
            for manifest_path in out.glob('*.draft.json'):
                manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
                self.assertTrue((out / manifest['body']).is_file())
                self.assertTrue(all((out / name).is_file() for name in manifest['attachments']))
                eml = email.message_from_bytes(manifest_path.with_suffix('').with_suffix('.eml').read_bytes(),
                                               policy=email.policy.default)
                self.assertEqual(eml['X-Unsent'], '1')
                self.assertIsNone(eml['To'])
                self.assertEqual(next(eml.iter_attachments()).get_filename(), manifest['attachments'][0])


    def test_missing_main_email_fails_the_run(self):
        with temporary_site() as base:
            fixture(base)
            with mock.patch.object(report, 'write_email', side_effect=OSError('locked email')):
                with contextlib.redirect_stdout(io.StringIO()) as log:
                    result = report.build(base, DAY)
            self.assertEqual(result, 1)
            self.assertIn('main email complete', log.getvalue())
            self.assertFalse((Path(base) / 'Reports' / 'history.csv').exists())

    def test_missing_company_draft_fails_the_run(self):
        with temporary_site() as base:
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
                if sheet_name == 'SALES_STOCK':
                    # SALES_STOCK is not windowed: a sale stamped after the
                    # transactions window ends is noted, never used to re-date
                    self.assertFalse((Path(base) / 'Reports' / '2026-11-07').is_dir())
                else:
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
        with temporary_site() as base:
            fixture(base)
            run(base)
            self.assertEqual(report.read_history(base, report.LooseSite(base))[-1]['basis'], 'window_time')


    def test_single_timed_scan_has_one_peak_hour(self):
        with temporary_site() as base:
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
            self.assertIn('1 scan (issues, returns and draws) in 1 day', forecast['ref_line'])
            self.assertIn('1 day on site', forecast['brief'])

    def test_single_item_email_uses_singular_counts(self):
        with temporary_site() as base:
            fixture(base)
            out = run(base)
            html = next(out.glob('*.html')).read_text(encoding='utf-8')
            self.assertIn('1 movement went through', html)
            self.assertIn('1 tooling transaction', html)
            self.assertIn('across 1 item type<', html)
            self.assertNotIn('1 movements', html)
            self.assertNotIn('1 item types', html)


    def test_consumable_on_customer_equipment_sheet_is_counted_once(self):
        with tempfile.TemporaryDirectory() as base:
            sale = dict(COMPANY_NAME='Example Engineering', HIRER='Worker',
                        SKU_DESCRIPTION='GLOVES', SALES_QUANTITY=2,
                        SALES_DATE='04/11/2026', SALES_TIME='09:00')
            fixture(base, sales=[sale])
            path = Path(base) / 'Data_SiteIQ' / 'TRANSACTIONS.xlsx'
            book = openpyxl.load_workbook(path)
            sheet = book.create_sheet('CUSTOMER_CONTRACTOR_EQUIP')
            sheet.append(['TRANSACTION_ID', 'SKU/ITEM_NUMBER', 'SKU/ITEM DESCRIPTION',
                          'PRODUCT_CATEGORY', 'EMPLOYER_NAME', 'HIRER_NAME',
                          'TRAN_START_DATE', 'TRAN_START_TIME', 'QUANTITY'])
            sheet.append(['SALE1', 'GLOVES', 'GLOVES', 'Consumable', 'Example Engineering',
                          'Worker', '04/11/2026', '09:00', 2])
            sheet.append(['RENT1', 'MAT1', 'CUSTOMER MAT', 'Rental', 'Example Engineering',
                          'Worker', '04/11/2026', '10:00', 1])
            book.save(path)
            book.close()
            with mock.patch.object(report, 'build_company_pack', wraps=report.build_company_pack) as pack:
                out = run(base)
            parts = pack.call_args.args[5]
            blocks = pack.call_args.args[6]
            self.assertEqual(parts['story']['own_total'], 1)
            self.assertEqual(parts['_tx_total'], (1, 1))
            self.assertEqual(blocks[0]['own'], 1)
            self.assertEqual(blocks[0]['draws'], 1)
            generated = openpyxl.load_workbook(next(out.glob('*.xlsx')), data_only=True)
            self.assertEqual(generated['Customer Gear'].max_row - 2, 1)
            self.assertEqual(generated['Customer Gear']['D3'].value, 'CUSTOMER MAT')
            generated.close()


    def test_forecast_top_tools_rank_issue_count_not_fleet_turnover(self):
        with tempfile.TemporaryDirectory() as base:
            site = report.LooseSite(base)
            future = DAY + dt.timedelta(days=1)
            roster = {'rows': [(future, 'Worker', 'Day', 8, '08:00', '16:00')]}
            # One small fleet line turns more often, but the larger fleet line
            # still receives more requests and must lead 'asked for most'.
            transactions = [dict(TRAN_START_DATE=DAY, TRAN_START_TIME='08:00',
                                 **{'SKU/ITEM DESCRIPTION': name})
                            for name in ['Small fleet wrench'] * 3 + ['Large fleet drill'] * 7]
            parts = {'viz': {'by_day': [(DAY, 10, 0, 0)]},
                     'hardest': [['Small fleet wrench', 1, 1, 3, 'Good Use', 'Keep'],
                                 ['Large fleet drill', 10, 1, 7, 'Low Use', 'Keep']]}
            forecast = report.forecast_block(site, DAY, roster, openpyxl.Workbook(),
                                             transactions, [], [], parts, '', 'QA', 0, 0)
            self.assertEqual(forecast['ref']['top_tools'], [('Large fleet drill', 7), ('Small fleet wrench', 3)])


    def test_existing_dated_latest_copy_is_refreshed(self):
        with tempfile.TemporaryDirectory() as base:
            fixture(base)
            day_folder = Path(base) / 'Reports' / DAY.isoformat()
            day_folder.mkdir(parents=True)
            legacy = day_folder / 'QA_Onhire_Workbook_LATEST.xlsx'
            legacy.write_bytes(b'stale copy from an older delivery')
            run(base)
            current = Path(base) / 'QA_Onhire_Workbook_LATEST.xlsx'
            self.assertEqual(legacy.read_bytes(), current.read_bytes())


    def test_consumable_only_company_pdf_makes_no_unverified_return_claim(self):
        with tempfile.TemporaryDirectory() as base:
            site = report.LooseSite(base)
            blocks, _ = report.pack_blocks([], [['Consumables Only', 'Worker', 'Gloves', 2, DAY, '08:00']],
                                            [], DAY)
            text = []
            original_text = report.coates_pdf.Document.text
            def capture(document, x, y, value, *args, **kwargs):
                text.append(str(value))
                return original_text(document, x, y, value, *args, **kwargs)
            with mock.patch.object(report.coates_pdf.Document, 'text', autospec=True, side_effect=capture):
                report.build_company_pdf(str(Path(base) / 'company.pdf'), site, DAY,
                                         dt.datetime(2026, 11, 6), '', blocks[0])
            rendered = ' '.join(text)
            self.assertIn('Nothing on hire right now.', rendered)
            self.assertIn('No items are recorded on hire in this export.', rendered)
            for unsupported in ('everything has come back', 'scanned back in', 'All back'):
                self.assertNotIn(unsupported, rendered)


    def test_transaction_story_buckets_do_not_include_outside_window_holdings(self):
        with temporary_site() as base:
            fixture(base, company_names=('A', 'B', 'C', 'D', 'E'))
            transactions = []
            for index, (started, returned) in enumerate([
                    ('03/11/2026', '03/11/2026'),
                    ('03/11/2026', '04/11/2026'),
                    ('03/11/2026', ''),
                    ('', '04/11/2026')]):
                transactions.append({'TRANSACTION_ID': f'TX{index}', 'SKU/ITEM_NUMBER': f'T{index}',
                    'SKU/ITEM DESCRIPTION': 'WRENCH', 'PRODUCT_CATEGORY': 'Tooling',
                    'EMPLOYER_NAME': chr(65 + index), 'HIRER_NAME': f'Worker {index}',
                    'TRAN_START_DATE': started, 'TRAN_END_DATE': returned,
                    'TRAN_START_TIME': '08:00', 'QUANTITY': 1})
            export(Path(base) / 'Data_SiteIQ' / 'TRANSACTIONS.xlsx',
                   {'TRANSACTION_WITHOUT_CHARGES': transactions})
            charts = []
            original_stacked = report._Pack.stacked
            def capture(pack, x, y, width, height, buckets, *args, **kwargs):
                charts.append(buckets)
                return original_stacked(pack, x, y, width, height, buckets, *args, **kwargs)
            with mock.patch.object(report, 'build_company_pack', wraps=report.build_company_pack) as pack:
                with mock.patch.object(report._Pack, 'stacked', autospec=True, side_effect=capture):
                    run(base)
            parts = pack.call_args.args[5]
            story = parts['story']
            self.assertEqual(parts['counts']['onhire'], 5)
            self.assertEqual(story['still_out'], 5)
            self.assertEqual([story[k] for k in ['same_day', 'kept', 'open_transactions',
                                                'uncertain_transactions']], [1, 1, 1, 1])
            breakdown = next(b for b in charts if any(label == 'No return recorded' for label, _, _ in b))
            self.assertEqual(sum(value for _, value, _ in breakdown), len(transactions))
            self.assertTrue(any(label == 'Dates need review' for label, _, _ in breakdown))
            self.assertFalse(any(label == 'Still on hire' for label, _, _ in breakdown))
            html = report._moving_strip(story)
            self.assertIn('issued and returned on the same date', html)
            self.assertIn('returned on a later date', html)
            self.assertNotIn('before the shift ended', html)
            self.assertNotIn('more than a day', html)


    def test_asset_numbers_sit_beside_descriptions(self):
        with temporary_site() as base:
            fixture(base, company_names=('Example Engineering', 'Second Crew'))
            day = run(base)
            page = next(day.glob('*.html')).read_text(encoding='utf-8')
            # each person's gear line carries the asset number after the description
            self.assertRegex(page, r'(?is)Torque wrench.{0,200}?T0')
            self.assertRegex(page, r'(?is)Torque wrench.{0,200}?T1')
            book = openpyxl.load_workbook(next(day.glob('*.xlsx')), read_only=True)
            rows = [r for r in book['Tooling Utilisation'].iter_rows(values_only=True) if r]
            head = next(r for r in rows if 'Item numbers' in r)
            col = head.index('Item numbers')
            values = [r[col] for r in rows[rows.index(head) + 1:] if len(r) > col and r[col]]
            self.assertIn('T0, T1', values)
            book.close()

    def test_asset_numbers_are_cut_back_whole_never_halved(self):
        class Doc:
            def text_width(self, text, size):
                return len(text) * size * 0.5
        doc = Doc()
        tag = 'HMRSLEDGE4LB-0003, HMRSLEDGE4LB-0005, HMRSLEDGE4LB-0011'
        self.assertEqual(report._fit_nums(doc, tag, 6, 1000), tag)
        self.assertEqual(report._fit_nums(doc, tag, 6, 80), 'HMRSLEDGE4LB-0003 +2 more')
        self.assertEqual(report._fit_nums(doc, 'A-0001, A-0002, A-0003 +30 more', 6, 70),
                         'A-0001, A-0002 +31 more')
        self.assertEqual(report._fit_nums(doc, 'SKU X-1, X-2 +4', 6, 30), 'SKU X-1 +5 more')
        self.assertEqual(report._fit_nums(doc, '72 assets', 6, 10), '72 assets')

    def test_back_dated_run_is_as_at_the_exports_not_todays_clock(self):
        if DAY >= dt.date.today():
            self.skipTest('needs a day earlier than today')
        with temporary_site() as base:
            fixture(base)
            run(base)
            # REQUESTED_DATE/TIME on the invented exports is 06/11/2026 05:05
            self.assertEqual(report._PRINT['asat'], '06 Nov 2026 05:05')
            # ...while "Built" still says when it was really built
            self.assertEqual(report._PRINT['built'].date(), dt.date.today())


if __name__ == '__main__':
    unittest.main()
