"""Author: Andrew Fisher. Shared receipt/status presentation and current, concise explanations."""
import json
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep

def apply(html):
    if 'root.Information1013=' in html:
        raise ValueError('Information patch already applied')
    if 'FinancialScopes1011' not in html or 'typedSingle1012' not in html:
        raise ValueError('Requires reviewed v10.12 source')
    def edit(old,new,label):
        nonlocal html
        html=rep(html,old,new,label,'v10.13')
    edit('const fmtStamp = iso => { const d = new Date(iso);',
         (HERE/'information1013.js').read_text()+"\nconst fmtStamp = (iso,context) => { const dayOnly=Information1013.receiptDay(iso,context);if(dayOnly)return fmtDate(dayOnly)+' · time not recorded'; const d = new Date(iso);",
         'Use explicit day-only evidence for receipt dates')
    edit('const timeOfStamp = at => { const d = new Date(at);',
         "const timeOfStamp = (at,context) => {if(Information1013.receiptDay(at,context))return 'Time not recorded'; const d = new Date(at);",
         'Do not print a midnight placeholder as an observed time')
    for item in json.loads((HERE/'presentation_replacements1013.json').read_text()):
        edit(item['old'],item['new'],item['why'])
    return html
