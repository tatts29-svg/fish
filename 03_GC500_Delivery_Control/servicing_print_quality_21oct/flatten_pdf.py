"""Author: Andrew Fisher. Flatten a private print PDF to portable, opaque A4 page images.

This utility performs no network calls, record writes or QR regeneration. The private
input/output and receipt must stay outside the repository. Independent rendering and
exact QR payload checks remain required before delivering the output.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import struct
import tempfile

import fitz
from PIL import Image

def insert_png(doc, page, filename):
    # Store the existing standard PNG filter stream without expanding its palette.
    data = Path(filename).read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    offset = 8
    chunks = {}
    while offset < len(data):
        length = struct.unpack('>I', data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]
        chunks.setdefault(kind, []).append(data[offset+8:offset+8+length])
        offset += length + 12
    width, height, depth, colour, compression, filtering, interlace = struct.unpack('>IIBBBBB', chunks[b'IHDR'][0])
    assert depth == 8 and colour in (2,3) and not interlace and not compression and not filtering
    assert b'tRNS' not in chunks
    xref = page.insert_image(page.rect, filename=filename, keep_proportion=False, overlay=True)
    doc.update_stream(xref, b''.join(chunks[b'IDAT']), compress=False)
    if colour == 3:
        palette = b''.join(chunks[b'PLTE'])
        doc.xref_set_key(xref, 'ColorSpace', f'[/Indexed /DeviceRGB {len(palette)//3-1} <{palette.hex()}>]')
    else:
        doc.xref_set_key(xref, 'ColorSpace', '/DeviceRGB')
    doc.xref_set_key(xref, 'BitsPerComponent', '8')
    doc.xref_set_key(xref, 'Filter', '/FlateDecode')
    doc.xref_set_key(xref, 'DecodeParms', f'<< /Predictor 15 /Colors {1 if colour == 3 else 3} /BitsPerComponent 8 /Columns {width} >>')


def flatten(source, output, expected_sha, dpi=300, rgb=False):
    source, output = Path(source), Path(output)
    if source.resolve() == output.resolve():
        raise ValueError('Input and output must be different files')
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != expected_sha:
        raise ValueError('Source PDF changed; review the new source before conversion')
    os.umask(0o077)
    with fitz.open(source) as original, tempfile.TemporaryDirectory() as temporary:
        out = fitz.open()
        for index, page in enumerate(original):
            pix = page.get_pixmap(dpi=dpi, colorspace=fitz.csRGB, alpha=False)
            image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
            indexed = image if rgb else image.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
            filename = Path(temporary) / f'page-{index + 1:03}.png'
            indexed.save(filename, 'PNG', optimize=True, dpi=(dpi, dpi))
            target = out.new_page(width=page.rect.width, height=page.rect.height)
            insert_png(out, target, filename)
        links = 0
        for index, page in enumerate(original):
            for link in page.get_links():
                if link['kind'] == fitz.LINK_URI:
                    out[index].insert_link({'kind': fitz.LINK_URI, 'from': link['from'], 'uri': link['uri']})
                elif link['kind'] == fitz.LINK_GOTO:
                    out[index].insert_link({'kind': fitz.LINK_GOTO, 'from': link['from'], 'page': link['page'], 'to': link['to']})
                else:
                    raise ValueError('Unreviewed link type; preserve it before converting')
                links += 1
        metadata = dict(original.metadata)
        metadata.update(author='Andrew Fisher', subject=f'Author: Andrew Fisher. Opaque page images at {dpi} dpi; original codes and page order retained.')
        out.set_metadata(metadata)
        out.save(output, garbage=4, deflate=True, use_objstms=0)
        out.close()
    with fitz.open(output) as result:
        assert all(len(p.get_images()) == 1 and not p.get_fonts() and not p.get_xobjects() for p in result)
        assert sum(len(p.get_links()) for p in result) == links
        pages = len(result)
    return {'author': 'Andrew Fisher', 'status': 'BUILT_PENDING_QR_AND_INDEPENDENT_RENDER_VERIFICATION',
            'source_sha256': digest, 'output_sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
            'pages': pages, 'dpi': dpi, 'bytes': output.stat().st_size, 'links_preserved': links,
            'physical_paper_scan_verified': False}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('output')
    parser.add_argument('--expected-source-sha256', required=True)
    parser.add_argument('--dpi', type=int, default=300, choices=(300,))
    parser.add_argument('--rgb', action='store_true', help='Use lossless RGB if palette conversion fails QR or visual checks')
    args = parser.parse_args()
    print(json.dumps(flatten(args.source, args.output, args.expected_source_sha256, args.dpi, args.rgb), indent=2))
