"""Author: Andrew Fisher. Review-only wording helper; writes copies, never owner source.

Run with --source-root <checkout> --output <private-review-dir>.
Contains no financial amounts, individual records or attachment-derived rows.
"""
import argparse,re
from pathlib import Path

BUILDER='03_GC500_Delivery_Control/review_31Oct2026_october_month_end/build_monthend.py'
TAB='03_GC500_Delivery_Control/v12.77_pl_tab_explorer/plf1277_src.js'

def once(text,old,new):
    if text.count(old)!=1:raise ValueError('Expected one wording anchor; review the current source before applying')
    return text.replace(old,new)

def change_builder(text):
    pairs=[
        ('GC500 October month-end: costs by supplier and month, accruals, labour, invoices',
         'GC500 October month-end: costs by supplier and month, accruals, labour (worked hours), invoices. Staff worked-hour rows before the job start date are excluded here. The separate daily register CSV is an unfiltered source copy, not the paid-hours journal.'),
        ('Hours from the running sheet, allocated by the job’s rules',
         'Worked hours from the running sheet, allocated by the job’s rules'),
        ('Coates wages and salary are hours only.',
         'This table shows worked hours; use section 2f for paid-hour quantities. Coates wages remain uncosted; the salary allowance is already in Costs.'),
        ('invoices where received and the running sheet where not',
         'invoices where received, PO amounts where available, and the running sheet otherwise'),
        ('2b · Labour by person: home branch, and where the cost is journaled to',
         '2b · Worked hours by person: home and receiving branches'),
        ("Coates wages and salary are hours (finance applies the pay cost); labour hire is dollars at the record's rates.",
         'These are worked hours by receiving branch; use section 2f for paid-hour quantities. Coates wage dollars remain for Finance to cost; the salary allowance is already in Costs. Labour hire dollars are the independently allocated running-sheet amounts.'),
        ('Labour journals (hours; Coates wages and salary are hours only): see section 2b, each person from their home branch to the branch of the work, with the contract named outside KINP.',
         'Labour journal preparation: use the paid-hour quantities in section 2f and the receiving branches in section 2b. Coates wage dollars remain for Finance to cost; the salary allowance is already in Costs. Use the existing labour-hire dollar amounts and applicable invoice or purchase order basis; do not reprice displayed rounded hour bands.'),
        ('Paid hours are the journal basis (what payroll pays)',
         'Calculated paid hours for journal preparation, using the running-sheet pay rules'),
        ('A day on more than one branch shares each band pro rata by the hours on each branch.',
         'A day on more than one branch shares each band pro rata by the hours on each branch. Displayed bands are rounded for reporting; do not reprice them. Monetary labour-hire journals use the existing dollar amounts and applicable invoice or purchase order basis. Coates wage dollars remain for Finance to cost; the salary allowance is already in Costs.'),
    ]
    for old,new in pairs:text=once(text,old,new)
    # Only quoted column-label prefixes change. Existing month qualifiers remain verbatim.
    pattern=r"(?P<quote>['\"])(?P<hash>#?)(?P<month>Sep|September|Oct|October) h(?=['\"]| \()"
    text,count=re.subn(pattern,lambda m:m['quote']+m['hash']+m['month']+' worked h',text)
    if count!=18:raise ValueError('Worked-hour column anchors changed; review before applying')
    text,count=re.subn(r"(['\"])#Total h\1",lambda m:m[1]+'#Total worked h'+m[1],text)
    if count!=4:raise ValueError('Worked-hour total anchors changed; review before applying')
    return text

def change_tab(text):
    return once(text,
        'Coates wages are hours only, not yet costed; the salary allowance is costed (the Salary allowance category). ',
        'Coates wages are hours only, not yet costed; the salary allowance is costed (the Salary allowance category). Worked and paid hours are different quantities. Displayed paid-hour bands are rounded for reporting; do not reprice them. Monetary labour-hire journals use the existing dollar amounts and applicable invoice or purchase order basis. ')

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--source-root',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    root=args.source_root.resolve();output=args.output.resolve()
    if output==root or root in output.parents:raise ValueError('Choose an output directory outside the owner checkout')
    for name,fn in [(BUILDER,change_builder),(TAB,change_tab)]:
        target=output/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(fn((root/name).read_text()))
    print('Review copies written; no owner files changed. Rebuild and verify privately before integration.')

if __name__=='__main__':main()
