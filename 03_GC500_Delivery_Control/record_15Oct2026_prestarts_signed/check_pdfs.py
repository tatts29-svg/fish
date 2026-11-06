#!/usr/bin/env python3
"""Read-only checks on the signed-off pre-start PDFs generate_prestarts.cjs made. Author: Andrew Fisher.

    python3 check_pdfs.py                       # every PDF in evidence/build.json
    python3 check_pdfs.py --render 2026-10-01   # also render page 1 of the records for those days to evidence/pages/

For every record in evidence/build.json: the PDF opens, its text carries the form (record of the pre-start held, the
day in words, the form id, every attendee named, the sign-off line, "Recorded after the day" only for days before
the sign-off date) and carries nothing it must not (an assistant's name, "via", undefined, NaN). Then the manifest
and the evidence files are read for the same forbidden words. Exit 0 when every check passes, 1 otherwise.
Needs PyMuPDF (import fitz) for the PDF text; nothing is written except the PNGs asked for with --render.
"""
import argparse, base64, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
# the names of the assistants a record must never carry, held encoded so this file names none of them itself
NAMES = base64.b64decode('Y29kZXh8Y2xhdWRlfGFyZ29ufGdlbWluaXxhbnRocm9waWN8b3BlbmFpfGNoYXRncHR8Y29waWxvdA==').decode()
FORBIDDEN = re.compile(r'\b(' + NAMES + r')\b|\bvia\b|undefined|\bNaN\b|\[object ', re.I)
NAMES_ONLY = re.compile(r'\b(' + NAMES + r')\b', re.I)
SIGNER = 'Andrew Fisher, Shutdown Manager'
FORM = {'coates': 'GC500-PS-INS-01', 'fencing': 'GC500-PS-ATF-01'}


def norm(s):
    return re.sub(r'\s+', ' ', s)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--build', default=str(HERE / 'evidence' / 'build.json'))
    ap.add_argument('--render', default='', help='comma-separated days whose page 1 is rendered to evidence/pages/')
    ap.add_argument('--dpi', type=int, default=110)
    args = ap.parse_args()
    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit('STOP: PyMuPDF is not installed (pip install pymupdf)')
    build = json.loads(Path(args.build).read_text('utf-8'))
    signed = build['signed']
    render = set(x.strip() for x in args.render.split(',') if x.strip())
    out_png = HERE / 'evidence' / 'pages'
    problems, rows = [], []
    for r in build['records']:
        pdf = HERE / r['file']
        tag = r['file']
        if not pdf.is_file():
            problems.append(f'{tag}: missing'); continue
        doc = fitz.open(str(pdf))
        text = ''.join(p.get_text() for p in doc)
        flat = norm(text)
        squeezed = text.replace(' ', '').replace('\n', '')
        fonts = sorted(set(f[3].split('+')[-1] for p in doc for f in p.get_fonts()))
        checks = {
            'record form heading': 'RECORDOFTHEPRE-STARTHELD' in squeezed,
            'day in words': r['words'] in flat,
            'form id': FORM[r['crew']] in flat,
            'sign-off line': f'Signed off: {SIGNER} · signed' in flat,
            'recorded after the day': ('Recorded after the day' in flat) == (r['day'] < signed),
            'every attendee named': all(name in flat for name in r['attendees']),
            'crew named': ('Coates Installs' in flat) if r['crew'] == 'coates' else ('Advanced Temporary Fencing' in flat),
            'nothing forbidden': not FORBIDDEN.search(text),
            'Carlito font': any(f.startswith('Carlito') for f in fonts),
        }
        bad = [k for k, v in checks.items() if not v]
        if bad:
            m = FORBIDDEN.search(text)
            problems.append(f'{tag}: ' + ', '.join(bad) + (f' (found {m.group(0)!r})' if m and 'nothing forbidden' in bad else ''))
        rows.append((tag, len(doc), fonts, bad))
        if r['day'] in render:
            out_png.mkdir(parents=True, exist_ok=True)
            png = out_png / (pdf.stem + '_p1.png')
            doc[0].get_pixmap(dpi=args.dpi).save(str(png))
            print(f'rendered {png}')
    for tag, pages, fonts, bad in rows:
        print(f'{tag}  pages {pages}  fonts {", ".join(fonts)}  {"OK" if not bad else "FAIL: " + ", ".join(bad)}')
    # the files that go in the repo beside the PDFs
    for name in ['manifest.json', 'evidence/build.json', 'evidence/record_snapshot.json']:
        p = HERE / name
        if not p.is_file():
            problems.append(f'{name}: missing'); continue
        hits = sorted(set(m.group(0) for m in NAMES_ONLY.finditer(p.read_text('utf-8'))))
        if hits:
            problems.append(f'{name}: carries {hits}')
        else:
            print(f'{name}: no assistant names')
    print(f'\n{len(rows)} PDFs checked, {sum(1 for x in rows if x[1] == 1)} on one page, {sum(1 for x in rows if x[1] > 1)} on more than one')
    if problems:
        print(f'PROBLEMS ({len(problems)}):')
        for p in problems:
            print('  - ' + p)
        sys.exit(1)
    print('ALL CHECKS PASSED')


if __name__ == '__main__':
    main()
