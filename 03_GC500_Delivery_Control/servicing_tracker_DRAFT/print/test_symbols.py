"""Author: Andrew Fisher. Local checks for equipment symbols on servicing maps.

Uses invented equipment and repository fixtures only. No private tracker links,
live requests or record writes.
PyMuPDF reads the tiny in-memory PDFs at print resolution for shape/legibility checks.
"""
import importlib.util
import io
import json
import pathlib
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

import fitz

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('sheets_symbols', HERE / 'make_sheets.py')
M = importlib.util.module_from_spec(spec)
spec.loader.exec_module(M)


def line(type_, kind='', qty=1):
    return {'type': type_, 'kind': kind, 'qty': qty, 'id': 'FIXTURE',
            'label': 'Fixture equipment', 'nos': ['FIXTURE-ONLY']}


class EquipmentSymbols(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        M.setup_fonts()

    def test_current_equipment_types_have_their_own_symbols(self):
        cases = [('FWF', 'fwf', 'toilet'), ('FWF Trailer', 'fwf', 'toilet'),
                 ('Toilet Block 6m', 'block', 'block'), ('Toilet Block 6m', 'sewer', 'block'),
                 ('16Pan Block', 'pan16', 'pan16'),
                 ('Accessible Toilet', 'access', 'accessible'), ('Waste tank', 'tank', 'tank')]
        for type_, kind, expected in cases:
            with self.subTest(type=type_, kind=kind):
                self.assertEqual(M.symbol_kind(line(type_, kind)), expected)

    def test_pee_panels_supported_without_adding_a_servicing_record(self):
        # This name is the existing project term; symbol support is not service eligibility.
        self.assertEqual(M.symbol_kind(line('Pee Panels')), 'pee')
        self.assertEqual(M.symbol_kind(line('Pee Panel')), 'pee')

    def test_trailer_toilet_symbol_does_not_depend_on_its_servicing_plan(self):
        trailer = line('Trailer Toilet', 'pump_only')
        self.assertEqual(M.symbol_kind(trailer), 'toilet')
        self.assertEqual(M.what_here([{'lines': [trailer]}]), '1 trailer toilet')

    def test_unrecognised_equipment_does_not_masquerade_as_a_toilet(self):
        self.assertEqual(M.symbol_kind(line('Unclassified fixture', 'unclassified')), 'unknown')

    def test_mixed_types_are_distinct_and_do_not_change_quantities_or_assets(self):
        lines = [line('FWF', 'fwf', 4), line('Toilet Block 6m', 'block', 2),
                 line('Waste tank', 'tank', 2), line('FWF Trailer', 'fwf', 1)]
        before = json.dumps(lines, sort_keys=True)
        self.assertEqual(M.symbol_kinds(lines), ['toilet', 'block', 'tank'])
        self.assertEqual(json.dumps(lines, sort_keys=True), before)

    def marker(self, lines):
        x, y, radius = 50 * M.mm, 40 * M.mm, 2.5 * M.mm
        c = M.canvas.Canvas(io.BytesIO(), pagesize=M.A4)
        before = json.dumps(lines, sort_keys=True)
        with mock.patch.object(M, 'equipment_icon', wraps=M.equipment_icon) as icons:
            bounds = M.equipment_marker(c, x, y, radius, lines)
        self.assertEqual(json.dumps(lines, sort_keys=True), before)
        self.assertLessEqual(bounds[0], x)
        self.assertLessEqual(bounds[1], y)
        self.assertGreaterEqual(bounds[2], x)
        self.assertGreaterEqual(bounds[3], y)
        for call in icons.call_args_list:
            _, px, py, r = call.args[:4]
            self.assertGreaterEqual(px - r, bounds[0])
            self.assertGreaterEqual(py - r, bounds[1])
            self.assertLessEqual(px + r, bounds[2])
            self.assertLessEqual(py + r, bounds[3])
        return (x, y, radius), bounds, icons.call_args_list

    def test_one_type_stays_centred_at_the_recorded_anchor(self):
        (x, y, _), _, icons = self.marker([line('FWF', 'fwf', 7)])
        self.assertEqual(len(icons), 1)
        self.assertAlmostEqual(icons[0].args[1], x)
        self.assertAlmostEqual(icons[0].args[2], y)

    def test_mixed_spot_shows_every_type_with_one_centred_footprint(self):
        lines = [line('Toilet Block 6m', 'block'), line('Waste tank', 'tank'), line('FWF', 'fwf')]
        (x, y, r), bounds, icons = self.marker(lines)
        self.assertEqual(len(icons), 3)
        centres = [(call.args[1], call.args[2]) for call in icons]
        self.assertAlmostEqual(sum(px for px, _ in centres) / len(centres), x)
        self.assertTrue(all(abs(py - y) < 0.001 for _, py in centres))
        self.assertGreater(bounds[2] - bounds[0], 2 * r)
        for left, right in zip(centres, centres[1:]):
            self.assertGreaterEqual(right[0] - left[0], 2 * r)

    def test_all_symbols_are_visible_and_distinct_in_monochrome_at_print_size(self):
        kinds = ['toilet', 'block', 'pee', 'pan16', 'accessible', 'tank', 'unknown']
        memory = io.BytesIO()
        c = M.canvas.Canvas(memory, pagesize=(20 * M.mm, 20 * M.mm))
        for kind in kinds:
            M.equipment_icon(c, 10 * M.mm, 10 * M.mm, 2.5 * M.mm, kind)
            c.showPage()
        c.save()
        with fitz.open(stream=memory.getvalue(), filetype='pdf') as doc:
            rasters = []
            for kind, page in zip(kinds, doc):
                self.assertFalse(page.get_images(), kind + ' must stay a vector drawing')
                pix = page.get_pixmap(matrix=fitz.Matrix(300 / 72, 300 / 72), colorspace=fitz.csGRAY)
                pixels = bytes(pix.samples)
                # A monochrome threshold removes the ability to distinguish types by colour alone.
                bitmap = bytes(v < 150 for v in pixels)
                self.assertGreater(sum(bitmap), 100, kind + ' must be visible at the printed size')
                rasters.append(bitmap)
            for i, first in enumerate(rasters):
                for j, second in enumerate(rasters[i + 1:], i + 1):
                    self.assertGreater(sum(a != b for a, b in zip(first, second)), 35,
                                       kinds[i] + ' and ' + kinds[j] + ' need distinct shapes')
            self.assertIn('16', doc[kinds.index('pan16')].get_text())

    def test_legend_names_all_supported_equipment_and_stays_inside_page(self):
        memory = io.BytesIO()
        c = M.canvas.Canvas(memory, pagesize=M.A4)
        with mock.patch.object(M, 'equipment_icon', wraps=M.equipment_icon) as icons:
            M.icon_legend(c, 9 * M.mm, 20 * M.mm, 7)
        c.save()
        self.assertEqual(len(icons.call_args_list), 6)
        with fitz.open(stream=memory.getvalue(), filetype='pdf') as doc:
            page = doc[0]
            text = page.get_text().lower()
            for label in ['toilet', 'block', 'pee', '16', 'accessible', 'tank']:
                self.assertIn(label, text)
            for word in page.get_text('words'):
                self.assertGreaterEqual(word[0], 9 * M.mm - 0.5)
                self.assertLessEqual(word[2], M.A4[0] - 9 * M.mm + 0.5)

    def test_long_left_edge_label_fits_inside_map_without_covering_marker(self):
        mb = SimpleNamespace(x=10*M.mm, y=20*M.mm, w=100*M.mm, h=54*M.mm)
        px, py, r = mb.x+3*M.mm, mb.y+mb.h/2, 2.5*M.mm
        footprint = (px-r-.5*M.mm, py-r-.5*M.mm, px+r+.5*M.mm, py+r+.5*M.mm)
        label = 'FIX01 — 1 FWF (at the far left of the fixture area · asset FIXTURE-ONE)'
        c = M.canvas.Canvas(io.BytesIO(), pagesize=M.A4)
        bounds = []
        actual_tag = M.tag
        def record(*args, **kwargs):
            box = actual_tag(*args, **kwargs); bounds.append(box); return box
        with mock.patch.object(M, 'tag', side_effect=record):
            M.place_labels(c, mb, [(label,px,py)], r, 8.5, [footprint])
        self.assertEqual(len(bounds), 1)
        box = bounds[0]
        self.assertGreaterEqual(box[0], mb.x)
        self.assertLessEqual(box[2], mb.x+mb.w)
        self.assertGreaterEqual(box[1], mb.y)
        self.assertLessEqual(box[3], mb.y+mb.h)
        self.assertFalse(M.boxes_hit(box, footprint, gap=0))

    def test_long_cover_reference_stays_inside_its_column(self):
        refs = [{'ref': code, 'title': code, 'where': 'Fixture location', 'drop': '',
                 'pin': None, 'lines': [{'label': '1 × fixture toilet'}]}
                for code in ['WC01', 'TRAILER099']]
        pack = SimpleNamespace(d=None, ref_page={r['ref']: 1 for r in refs})
        memory = io.BytesIO()
        c = M.canvas.Canvas(memory, pagesize=M.A4)
        M.Pack.table(pack, c, {'refs': refs}, 250 * M.mm)
        c.save()
        with fitz.open(stream=memory.getvalue(), filetype='pdf') as doc:
            spans = [span for block in doc[0].get_text('dict')['blocks']
                     if 'lines' in block for row in block['lines'] for span in row['spans']]
            for code in ['WC01', 'TRAILER099']:
                span = next(span for span in spans if span['text'] == code)
                self.assertGreaterEqual(span['bbox'][0], 10.5 * M.mm - 0.5)
                self.assertLessEqual(span['bbox'][2], 25.5 * M.mm + 0.5,
                                     'reference must not cover the How many column')
            short = next(span for span in spans if span['text'] == 'WC01')
            self.assertAlmostEqual(short['size'], 10.5)
            self.assertEqual(doc[0].get_text().count('1 × fixture toilet'), 2)

    def test_all_repository_map_labels_fit_without_covering_symbols_or_each_other(self):
        data = M.Data(HERE.parent/'tracker_data.json')
        maps = json.loads((HERE/'maps/maps.json').read_text())
        maps['layout'] = json.loads((HERE/'layout.json').read_text())
        urls = json.loads((HERE/'urls.json').read_text())
        pack = M.Pack(data,maps,HERE/'maps',urls,True,'fixture')
        actual_place, actual_tag = M.place_labels, M.tag
        batches, issues = [], []
        def inspect(c, mb, groups, rr, font_size=8, footprints=None):
            bounds = []
            def record(*args, **kwargs):
                box = actual_tag(*args, **kwargs); bounds.append(box); return box
            with mock.patch.object(M,'tag',side_effect=record):
                actual_place(c,mb,groups,rr,font_size,footprints)
            symbols = footprints if footprints else [(x-rr,y-rr,x+rr,y+rr) for _,x,y in groups]
            batch = len(batches); batches.append(len(bounds))
            for i, box in enumerate(bounds):
                if box[0]<mb.x-.001 or box[1]<mb.y-.001 or box[2]>mb.x+mb.w+.001 or box[3]>mb.y+mb.h+.001:
                    issues.append(('outside map',batch,i))
                for j, symbol in enumerate(symbols):
                    if M.boxes_hit(box,symbol,gap=0): issues.append(('covers marker',batch,i,j))
                for j, previous in enumerate(bounds[:i]):
                    if M.boxes_hit(box,previous,gap=0): issues.append(('overlaps label',batch,i,j))
        with tempfile.TemporaryDirectory() as temp, \
             mock.patch.object(M.MapBox,'draw',lambda *args,**kwargs:None), \
             mock.patch.object(M.MapBox,'furniture',lambda *args,**kwargs:None), \
             mock.patch.object(M,'qr',lambda *args,**kwargs:None), \
             mock.patch.object(M,'place_labels',side_effect=inspect):
            pack.render(pathlib.Path(temp)/'fixture.pdf')
        self.assertGreater(sum(batches), len(data.refs))
        self.assertEqual(issues, [])


if __name__ == '__main__':
    unittest.main()
