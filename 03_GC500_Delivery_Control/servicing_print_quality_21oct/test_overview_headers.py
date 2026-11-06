"""Author: Andrew Fisher. Synthetic regression for printed overview header clearance."""
from pathlib import Path
from types import SimpleNamespace
import argparse
import tempfile
import fitz
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from print_quality import load_generator


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generator',required=True)
    args=parser.parse_args()
    module=load_generator(args.generator)
    module.setup_fonts()
    class HeaderDrawn(Exception):
        pass
    def stop_at_map(*args,**kwargs):
        raise HeaderDrawn()
    module.MapBox=stop_at_map
    # Synthetic names and totals exercise both short and long title/count pairs.
    cases=[('Service area',1,1),('North entrance, freight and event administration',99,999),
           ('South service compounds and equipment staging area',999,9999)]
    with tempfile.TemporaryDirectory() as directory:
        path=Path(directory)/'synthetic_headers.pdf'
        c=canvas.Canvas(str(path),pagesize=landscape(A4))
        for number,(name,locations,units) in enumerate(cases,1):
            area={'n':number,'name':name,'refs':[{}]*locations}
            data=SimpleNamespace(areas=[area],refs=area['refs'],units=lambda refs,u=units:u,plan_days=lambda:[])
            pack=module.Pack.__new__(module.Pack)
            pack.d=data;pack.maps={'areas':{str(number):{'main':True}}};pack.maps_dir=Path(directory)
            try:pack.master(c,area)
            except HeaderDrawn:pass
            else:raise AssertionError('header capture did not stop at map')
            c.showPage()
        c.save()
        with fitz.open(path) as doc:
            assert len(doc)==len(cases)
            for page in doc:
                spans=[s for b in page.get_text('dict')['blocks'] for l in b.get('lines',[]) for s in l.get('spans',[])]
                title=next(s for s in spans if 'WHERE IT IS ON THE SITE' in s['text'])
                stats=next(s for s in spans if 'location' in s['text'])
                assert stats['bbox'][0]-title['bbox'][2]>=6*mm-.1,'title overlaps reserved statistics gap'
                assert title['size']>=10,'title became illegibly small'
                assert title['bbox'][0]>=9*mm-.1 and stats['bbox'][2]<=page.rect.width-9*mm+.1
                assert abs(title['origin'][1]-stats['origin'][1])<.1
        # If future source text exceeds the readable column, fail explicitly.
        area={'n':1,'name':'Oversize synthetic heading '*40,'refs':[{}]}
        pack.d=SimpleNamespace(areas=[area],refs=area['refs'],units=lambda refs:1,plan_days=lambda:[])
        with tempfile.TemporaryDirectory() as extra:
            c=canvas.Canvas(str(Path(extra)/'oversize.pdf'),pagesize=landscape(A4))
            try:pack.master(c,area)
            except ValueError as error:assert str(error)=='Overview title requires more print space'
            else:raise AssertionError('oversize heading should fail safely')
            c.save()
    print('PASS: 3 synthetic overview headers keep 6 mm separation, readable text and safe margins; oversize source fails explicitly.')

if __name__=='__main__':main()
