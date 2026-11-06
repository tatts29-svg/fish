#!/usr/bin/env python3
"""Author: Andrew Fisher. Writes the document details (title, author, subject) into the two PDFs; nothing on the pages changes.

    python3 pdf_meta.py      (after node render.cjs and node render.cjs certificates.html)
"""
from pathlib import Path
from pypdf import PdfReader, PdfWriter

HERE = Path(__file__).resolve().parent
META = {
    'GC500_2026_fencing_crew_what_you_built.pdf': ('What you built — GC500 2026 fencing crew',
                                                   'Advanced Temporary Fencing, GC500 2026 build: the distance, the gear, seven weeks, the line-up, thank you'),
    'GC500_2026_fencing_crew_certificates.pdf': ('Certificates of thanks — GC500 2026 fencing crew',
                                                 'Ten certificates of thanks, Advanced Temporary Fencing, GC500 2026 build'),
}

for name, (title, subject) in META.items():
    p = HERE / name
    if not p.exists(): continue
    w = PdfWriter(clone_from=PdfReader(p))
    w.add_metadata({'/Title': title, '/Author': 'Andrew Fisher', '/Subject': subject, '/Creator': 'Andrew Fisher, Coates'})
    tmp = p.with_suffix('.part')
    with open(tmp, 'wb') as f: w.write(f)
    tmp.replace(p)
    print(name, 'details written')
