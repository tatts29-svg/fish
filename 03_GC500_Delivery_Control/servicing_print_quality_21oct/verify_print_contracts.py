"""Author: Andrew Fisher. Check actual PDF registration and unchanged print contracts.

All operational inputs and detailed output remain private. This performs no
network access or tracker writes and does not substitute for full PDF QR decode.
"""
import argparse
import ast
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import tempfile

import fitz
from print_quality import load_generator, revised_source


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def selected_nodes(source):
    tree = ast.parse(source)
    protected = {'qr', 'Data', 'maps_url', 'load_pack_data', 'load_urls', 'pack_readiness', 'MapBox'}
    output = {node.name: ast.dump(node, include_attributes=False)
              for node in tree.body if getattr(node, 'name', '') in protected}
    pack = next(node for node in tree.body if getattr(node, 'name', '') == 'Pack')
    for node in pack.body:
        if getattr(node, 'name', '') in {'scan_cards', 'job_url', 'render', 'ref_block', 'left_col'}:
            output['Pack.' + node.name] = ast.dump(node, include_attributes=False)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('generator', 'maps', 'links', 'pdf', 'previous_decoded', 'final_decoded', 'out'):
        parser.add_argument('--' + key.replace('_', '-'), required=True)
    args = parser.parse_args()
    source = Path(args.generator).read_text()
    before, after = selected_nodes(source), selected_nodes(revised_source(source))
    if before != after or len(before) != 12:
        raise ValueError('protected data, QR, readiness or layout logic changed')
    baseline_codes = json.loads(Path(args.previous_decoded).read_text())
    final_codes = json.loads(Path(args.final_decoded).read_text())
    if Counter(baseline_codes) != Counter(final_codes):
        raise ValueError('final print QR payloads or occurrence counts changed')

    module = load_generator(args.generator)
    inputs = argparse.Namespace(links=args.links, urls='', data=None, mode='test',
                                contact_name='', contact_phone='', readiness=None)
    data = module.load_pack_data(inputs)
    urls, placeholder = module.load_urls(inputs, data)
    mode, contact = module.pack_readiness(inputs, data, urls, placeholder)
    maps = json.loads((Path(args.maps) / 'maps.json').read_text())
    maps['layout'] = json.loads((Path(args.generator).parent / 'layout.json').read_text())
    module.setup_fonts()
    pack = module.Pack(data, maps, Path(args.maps), urls, True, 'registration audit', mode, contact)
    expected = []

    def capture(box, canvas, folder, frame=True):
        x0, y0, x1, y1 = box.rect
        sx, sy = box.w / (x1 - x0), box.h / (y1 - y0)
        expected.append({'page': canvas.getPageNumber(),
                         'matrix': [sx, 0, 0, sy, box.x - x0 * sx, box.y - (1684 - y1) * sy]})

    module.MapBox.draw = capture
    with tempfile.TemporaryDirectory() as directory:
        pack.render(Path(directory) / 'PRIVATE-overlay-layout.pdf')
    observed = []
    number = rb'[-+]?(?:\d*\.\d+|\d+)(?:[Ee][-+]?\d+)?'
    pattern = re.compile(rb'(' + rb'\s+'.join([number] * 6) +
                         rb')\s+cm\s+/FormXob\.pdfrw_\d+\s+Do')
    with fitz.open(args.pdf) as document:
        if len(document) != len(pack.pages):
            raise ValueError('page plan changed')
        for page in document:
            stream = b'\n'.join(document.xref_stream(xref) for xref in page.get_contents())
            for match in pattern.finditer(stream):
                observed.append({'page': page.number + 1,
                                 'matrix': [float(value) for value in match[1].split()]})
    if len(expected) != len(observed) or not expected:
        raise ValueError('registered map placement count differs')
    max_delta = 0
    for planned, actual in zip(expected, observed):
        if planned['page'] != actual['page']:
            raise ValueError('registered map page differs')
        delta = max(abs(a - b) for a, b in zip(planned['matrix'], actual['matrix']))
        max_delta = max(max_delta, delta)
        if delta > .005:
            raise ValueError('PDF map transform differs from original registration')
    result = {'author': 'Andrew Fisher', 'pdf_sha256': digest(args.pdf),
              'protected_functions_unchanged': len(before),
              'previous_pdf_payloads_exactly_preserved': True,
              'qr_occurrences': len(final_codes), 'map_placements': len(observed),
              'max_pdf_matrix_rounding_error': max_delta,
              'tolerance_page_points': .005, 'page_count': len(pack.pages),
              'passed': True, 'network_requests': 0, 'physical_paper_scans': False}
    Path(args.out).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
