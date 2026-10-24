"""Author: Andrew Fisher. Local print geometry and role-code separation checks."""
import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

import fitz

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('sheets', HERE / 'make_sheets.py')
M = importlib.util.module_from_spec(spec)
spec.loader.exec_module(M)


class ScanLayout(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        M.setup_fonts()
        cls.source = json.loads((HERE.parent / 'tracker_data.json').read_text())
        cls.maps = json.loads((HERE / 'maps/maps.json').read_text())
        cls.maps['layout'] = json.loads((HERE / 'layout.json').read_text())

    def draw(self, raw=None):
        data = M.Data(raw=json.dumps(raw or self.source).encode())
        urls = {r['ref']: f'{M.BASE}/d/{M.TEST_TOKEN}#r={r["ref"]}.0000' for r in data.refs}
        pack = M.Pack(data, self.maps, HERE / 'maps', urls, True, 'local test')
        out = io.BytesIO()
        c = M.canvas.Canvas(out, pagesize=M.A4)
        records = []
        original_qr = M.qr
        for ref in data.refs:
            codes = []
            full = M.ref_too_tall(data, ref)
            h = 2 * M.HALF_H + 6 * M.mm if full else M.HALF_H
            def capture(canvas, value, x, y, size):
                codes.append((value, x, y, size))
                return original_qr(canvas, value, x, y, size)
            with mock.patch.object(M.MapBox, 'draw', lambda *args: None), \
                 mock.patch.object(M.MapBox, 'furniture', lambda *args, **kw: None), \
                 mock.patch.object(M, 'qr', side_effect=capture):
                pack.ref_block(c, data.area_of[ref['ref']], ref, 9*M.mm, 20*M.mm, M.A4[0]-18*M.mm, h)
            records.append((ref, full, codes))
            c.showPage()
        c.save()
        return data, urls, records, fitz.open(stream=out.getvalue(), filetype='pdf')

    def test_each_code_has_its_own_labeled_lane_whitespace_and_exact_destination(self):
        before = json.dumps((self.source, self.maps), sort_keys=True)
        data, urls, records, doc = self.draw()
        for page, (ref, full, codes) in zip(doc, records):
            with self.subTest(ref=ref['ref']):
                expected = {urls[ref['ref']] + ('~'+g if g else '') for g in data.groups_for(ref)}
                if ref['pin']: expected.add(M.maps_url(ref['pin']))
                self.assertEqual({code[0] for code in codes}, expected)
                self.assertEqual(len(codes), len(expected))
                ordered = sorted(codes, key=lambda q: q[1])
                for value, x, y, size in ordered:
                    self.assertGreaterEqual(size/M.mm, 30)
                    self.assertGreaterEqual(x, 9*M.mm)
                    self.assertLessEqual(x+size, M.A4[0]-9*M.mm)
                    rect = fitz.Rect(x, page.rect.height-y-size, x+size, page.rect.height-y)
                    # QR quiet zones must not contain a text caption or a neighbouring asset label.
                    self.assertEqual(page.get_text(clip=rect).strip(), '')
                for left, right in zip(ordered, ordered[1:]):
                    self.assertGreaterEqual((right[1]-left[1]-left[3])/M.mm, 26 if full else 36)
                text = page.get_text()
                self.assertGreaterEqual(text.count(ref['ref']), len(codes)+1)
                self.assertIn('LOCATION', text)
                for g in data.groups_for(ref):
                    self.assertIn(data.groups[g]['label'].upper() if g else 'COMPLETION', text)
                if not ref['pin']:
                    self.assertIn('No pin - ask on site', text)
        self.assertEqual(before, json.dumps((self.source, self.maps), sort_keys=True))
        self.assertTrue(any(full for _, full, _ in records), 'dense records use full pages')
        self.assertTrue(any(not full for _, full, _ in records), 'ordinary records remain paired')

    def test_role_lanes_are_stable_when_native_json_key_order_changes(self):
        changed = copy.deepcopy(self.source)
        changed['groups'] = dict(reversed(list(changed['groups'].items())))
        _, _, records, _ = self.draw(changed)
        for ref, _, codes in records:
            by_group = {value.rsplit('~', 1)[-1]: x for value, x, _, _ in codes if '~' in value}
            if {'pump', 'clean'} <= by_group.keys():
                self.assertLess(by_group['pump'], by_group['clean'])
            directions = [x for value, x, _, _ in codes if value.startswith('https://www.google.com/maps/')]
            if directions:
                self.assertTrue(all(x < directions[0] for x in by_group.values()))

    def test_mode_watermark_does_not_enter_any_qr_quiet_zone(self):
        data = M.Data(raw=json.dumps(self.source).encode())
        urls = {r['ref']: f'{M.BASE}/d/{M.TEST_TOKEN}#r={r["ref"]}.0000' for r in data.refs}
        pack = M.Pack(data, self.maps, HERE/'maps', urls, True, 'local test')
        ordinary = next(r for r in data.refs if not M.ref_too_tall(data, r))
        dense = next(r for r in data.refs if M.ref_too_tall(data, r))
        pack.pages = [('refs', data.area_of[ordinary['ref']], [ordinary]),
                      ('ref_full', data.area_of[dense['ref']], [dense])]
        records = []
        original_qr = M.qr
        def capture(c, value, x, y, size):
            records.append((c.getPageNumber()-1, x, y, size))
            return original_qr(c, value, x, y, size)
        with tempfile.TemporaryDirectory(prefix='gc500-qr-layout-') as directory, \
             mock.patch.object(M.MapBox, 'draw', lambda *args: None), \
             mock.patch.object(M.MapBox, 'furniture', lambda *args, **kw: None), \
             mock.patch.object(M, 'qr', side_effect=capture):
            out = Path(directory)/'TEST-layout.pdf'
            pack.render(out)
            doc = fitz.open(stream=out.read_bytes(), filetype='pdf')
        from PIL import Image
        for page_index, x, y, size in records:
            page = doc[page_index]
            box = fitz.Rect(x, page.rect.height-y-size, x+size, page.rect.height-y)
            pix = page.get_pixmap(dpi=180, clip=box, alpha=False)
            image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
            band = max(2, int(min(image.size)*.04))
            w, h = image.size
            for rect in [(0,0,w,band),(0,h-band,w,h),(0,0,band,h),(w-band,0,w,h)]:
                self.assertTrue(all(low >= 250 for low, _ in image.crop(rect).getextrema()), 'QR quiet zone is white, including under the mode watermark')


if __name__ == '__main__':
    unittest.main()
