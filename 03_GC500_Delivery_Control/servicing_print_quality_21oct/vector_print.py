"""Author: Andrew Fisher. Preserve the registered original PDF map as vector forms.

Private inputs only. The original master form is reused and clipped to the exact
existing crop rectangle, then the unchanged sheet annotations and QR codes draw
above it. No coordinate, data or permanent-link change is made.
"""
from pathlib import Path
import argparse
import hashlib
import sys
from print_quality import load_generator



def vector_maps(module,source_pdf,expected_sha256):
    from pdfrw import PdfReader
    from pdfrw.buildxobj import pagexobj
    from pdfrw.toreportlab import makerl
    source=Path(source_pdf)
    if len(expected_sha256)!=64 or hashlib.sha256(source.read_bytes()).hexdigest()!=expected_sha256:
        raise ValueError('exact registered original master PDF required')
    pdf=PdfReader(str(source))
    if len(pdf.pages)!=1:raise ValueError('one registered master sheet required')
    form=pagexobj(pdf.pages[0])
    if [float(n) for n in form.BBox]!=[0,0,2384,1684]:
        raise ValueError('registered master sheet dimensions differ')
    def draw(box,c,folder,frame=True):
        c.saveState();p=c.beginPath();p.roundRect(box.x,box.y,box.w,box.h,2*module.mm)
        c.clipPath(p,stroke=0,fill=0)
        x0,y0,x1,y1=box.rect
        c.translate(box.x,box.y)
        c.scale(box.w/(x1-x0),box.h/(y1-y0))
        c.translate(-x0,-(1684-y1))
        c.doForm(makerl(c,form))
        c.restoreState()
        if frame:
            c.setStrokeColor(module.INK);c.setLineWidth(.8)
            c.roundRect(box.x,box.y,box.w,box.h,2*module.mm,stroke=1,fill=0)
    module.MapBox.draw=draw
    return module


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--generator',required=True)
    p.add_argument('--source-pdf',required=True)
    p.add_argument('--source-sha256',required=True)
    p.add_argument('--out',required=True)
    options,remaining=p.parse_known_args()
    module=vector_maps(load_generator(options.generator),options.source_pdf,options.source_sha256)
    sys.argv=[options.generator,*remaining,'--out',options.out]
    module.main()
    # Lossless compaction: retain original vector paths, fonts and images.
    import fitz
    import os
    import tempfile
    target=Path(options.out).resolve()
    with tempfile.TemporaryDirectory(dir=target.parent) as directory:
        compact=Path(directory)/'compacted.pdf'
        with fitz.open(target) as document:
            document.save(compact,garbage=4,deflate=True)
        os.replace(compact,target)
