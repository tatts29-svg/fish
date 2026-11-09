"""Regression checks for crowded PDF covers and empty visual states."""
import datetime as dt
import email
import email.policy
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import build_onhire_workbook as report


class LayoutTests(unittest.TestCase):
    def pack(self):
        site = SimpleNamespace(author='QA', header_line='Example shutdown',
                               customer='Example', job='Shutdown')
        return report._Pack(site, dt.date(2026, 11, 6),
                            dt.datetime(2026, 11, 6, 12),
                            '01 Nov 2026 to 06 Nov 2026', 'Layout proof')

    def test_long_item_identifier_and_description_are_complete(self):
        pack = self.pack()
        pack.page()
        identifier = 'WEDGE-STEEL-MEDIUM-000000000000000000001'
        description = 'A long item description with full distinguishing details ' * 5
        row = ['Example', 'Worker', identifier, description, 'On Hire',
               dt.date(2026, 11, 6), '', 0]
        codes, descriptions, height = pack.item_layout(row)
        self.assertEqual(''.join(codes), identifier)
        self.assertEqual(' '.join(descriptions), report.item_name(description).strip())
        self.assertGreater(height, 21.5)
        with patch.object(pack.doc, 'text', wraps=pack.doc.text) as draw:
            pack.item_row(row, 0)
        values = [c.args[2] for c in draw.call_args_list]
        self.assertTrue(all(line in values for line in codes))
        self.assertFalse(any('…' in str(value) for value in values))

    def test_long_company_name_is_complete_in_section_heading(self):
        pack = self.pack()
        company = 'Control Systems Technology and Specialist Engineering Services'
        blocks, _ = report.pack_blocks([], [[company, 'Worker', 'Gloves', 1,
                                         dt.date(2026, 11, 6), '08:00']], [], dt.date(2026, 11, 6))
        with patch.object(pack.doc, 'text', wraps=pack.doc.text) as draw:
            pack.section(blocks[0])
        heading_lines = [c.args[2] for c in draw.call_args_list
                         if c.args[0] == pack.x0 + 60 and c.kwargs.get('bold')]
        self.assertEqual(' '.join(heading_lines), company)

    def test_zero_holding_email_does_not_claim_unobserved_returns(self):
        day = dt.date(2026, 11, 6)
        site = SimpleNamespace(author='QA', header_line='Example shutdown')
        blocks, _ = report.pack_blocks([], [['Example', 'Worker', 'Gloves', 1,
                                             day, '08:00']], [], day)
        parts = dict(story={}, source_stamp='06 Nov 2026', period='06 Nov 2026')
        with tempfile.TemporaryDirectory() as folder:
            stem = report.write_company_email(folder, site, day,
                                               dt.datetime(2026, 11, 6, 12),
                                               parts, blocks[0], None)
            message = email.message_from_bytes(
                (Path(folder) / (stem + '.eml')).read_bytes(), policy=email.policy.default)
            content = ' '.join(part.get_content() for part in message.walk()
                               if part.get_content_type() in ('text/plain', 'text/html'))
        self.assertIn('nothing on hire', message['Subject'])
        self.assertIn('no items recorded on hire', content)
        for unsupported in ('all back', 'every item is back', 'scanned back in'):
            self.assertNotIn(unsupported, content.lower())

    def test_empty_donut_displays_zero(self):
        pack = self.pack()
        pack.page()
        with patch.object(pack.doc, 'text', wraps=pack.doc.text) as draw:
            pack.donut(100, 150, 40, [('No use', 0, '#999999')], 'LINES')
        values = [c.args[2] for c in draw.call_args_list]
        self.assertIn('0', values)
        self.assertNotIn('1', values)
        self.assertTrue(pack.doc.render().startswith(b'%PDF'))

    def test_crowded_cover_preserves_every_action_sentence(self):
        pack = self.pack()
        pack.page()
        actions = [
            ('Top these up', '30 tooling lines need more stock. Reply to the report email and the counter can arrange the order.'),
            ('Order consumables', 'One consumable line is past the reorder point. Order now so the next shift has enough on the shelf.'),
            ('Date the undated', '146 items have no issue transaction in this export. Pull transactions from the start of the shut or confirm which items have been returned.'),
            ('Review unused stock', '2806 units have not moved this period. Confirm which lines to keep and which can be returned to the depot.'),
        ]
        blocks = [dict(company='Example company %02d' % i, items=i, people=[],
                       issues=i, draws=0, own=0, oldest_days=4)
                  for i in range(1, 37)]
        parts = dict(counts=dict(onhire=666, companies=36, oldest_days=4),
                     call=['666 items are on hire across 36 companies.',
                           'Every movement is recorded through the counter.',
                           'Review the priorities below before the next shift.'],
                     tiles=[('Items on hire', '666', '36 companies'),
                            ('Longest out', '4', 'days'),
                            ('Coates fleet', '1000', 'items'),
                            ('Tool moves', '500', 'this period'),
                            ('Consumable draws', '250', 'this period'),
                            ('Consumable lines', '65', 'on shelf')], actions=actions)
        with patch.object(pack.doc, 'text', wraps=pack.doc.text) as draw:
            pack.cover(parts, blocks, [], [0] * 36)
        rendered = ' '.join(str(c.args[2]) for c in draw.call_args_list)
        for head, body in actions:
            self.assertIn(head, rendered)
            self.assertIn(body, rendered)
        self.assertEqual(pack.doc.page_count, 1, 'Actions must remain on the cover')
        self.assertLessEqual(pack.y, pack.bottom)
        self.assertIn('more companies', rendered)
        # Text must fit its measured horizontal allowance without ellipsising.
        for c in draw.call_args_list:
            x, y, text = c.args[:3]
            if text in ('What needs attention',):
                continue
            if c.kwargs.get('max_w') is None and c.kwargs.get('align') != 'right':
                width = pack.doc.text_width(str(text), c.kwargs.get('size', 10),
                                           bold=c.kwargs.get('bold', False))
                self.assertLessEqual(x + width, pack.W + 1)


@unittest.skipUnless(os.environ.get('COATES_BROWSER_TESTS') == '1',
                     'Set COATES_BROWSER_TESTS=1 to check Chromium mobile rendering')
class BrowserLayoutTests(unittest.TestCase):
    def test_mobile_numbers_and_badges_remain_readable_without_overflow(self):
        from playwright.sync_api import sync_playwright
        import shutil

        site = SimpleNamespace(author='QA', header_line='Example shutdown')
        day = dt.date(2026, 11, 6)
        rows = [[report._lead('Worker with a long name', 'Tool description'),
                 report._num('17'), report._plain('after window'),
                 report._pill('undated', 'amber')]]
        body = report._masthead(site, day, dt.datetime(2026, 11, 6, 12),
                                dict(hero=('56', 'items on hire now', 'Example')))
        body += report._table(['Person', 'Items', 'Oldest issue', 'Out'], rows,
                              widths={0: 46, 1: 12, 2: 23, 3: 19})
        html = '<html><body style="margin:0">' + report._wrap_sheet(body) + '</body></html>'
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path=shutil.which('chromium'),
                                         headless=True, args=['--no-sandbox'])
            try:
                page = browser.new_page()
                for width in (320, 390):
                    with self.subTest(width=width):
                        page.set_viewport_size(dict(width=width, height=1000))
                        page.set_content(html)
                        self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'), width)
                        lines = page.locator('.hero-value,.pill').evaluate_all('''elements => elements.map(el => {
                            const range = document.createRange(); range.selectNodeContents(el);
                            return new Set([...range.getClientRects()].map(r => Math.round(r.top))).size;
                        })''')
                        self.assertEqual(lines, [1, 1])
            finally:
                browser.close()


if __name__ == '__main__':
    unittest.main()
