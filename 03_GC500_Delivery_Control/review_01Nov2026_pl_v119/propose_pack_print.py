"""Author: Andrew Fisher. Review-only, scoped pack print formatting.
Writes a copy outside the source checkout. No records or figures are included.
"""
from pathlib import Path
import argparse
SOURCE='03_GC500_Delivery_Control/review_31Oct2026_october_month_end/build_monthend.py'
def once(text,old,new):
    if text.count(old)!=1:raise ValueError('Expected one print anchor; review current source before applying')
    return text.replace(old,new)
def propose(text):
    text=once(text,"CAT_HTML = (\"<h2>1c","CAT_HTML = (\"<section class='category-section'><h2>1c")
    text=once(text,"tbl(['Category', 'Branch', '#Sep', '#Oct', '#Nov', '#Job end'], _crow))","tbl(['Category', 'Branch', '#Sep', '#Oct', '#Nov', '#Job end'], _crow, 'category-report') + \"</section>\")")
    text=once(text,"m(EST_NOV)), 'cd'))","m(EST_NOV)), 'cd transport-estimate'))")
    anchor='table.cd td:nth-child(2),table.cd td:nth-child(3),table.cd th:nth-child(2),table.cd th:nth-child(3){white-space:nowrap}'
    rules='section.category-section{break-inside:avoid;page-break-inside:avoid}table.category-report th,table.category-report td{padding-top:1px;padding-bottom:1px}table.category-report tr:last-child{break-before:avoid;page-break-before:avoid}table.transport-estimate td:nth-child(5),table.transport-estimate th:nth-child(5),table.transport-estimate td:nth-child(6),table.transport-estimate th:nth-child(6){white-space:nowrap}'
    return once(text,anchor,rules+anchor)
def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--source-root',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
    root=a.source_root.resolve();out=a.output.resolve()
    if out==root or root in out.parents:raise ValueError('Output must be outside the source checkout')
    target=out/SOURCE;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(propose((root/SOURCE).read_text()))
    print('Review source copy written; rebuild and check actual printing before integration.')
if __name__=='__main__':main()
