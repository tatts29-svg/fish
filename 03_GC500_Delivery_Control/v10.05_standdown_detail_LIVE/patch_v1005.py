"""Author: Andrew Fisher. Visible standdown rate, dates, days and total; no financial changes."""
import hashlib
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA = '0030d7d3d6838fcad67773cdb19927ea0388591aa33cbc163e53d0d02d182443'

def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.04; refuses repeat application')
    text = rep(text, 'function generatorHtml1004(){', (HERE/'standdown1005.js').read_text()+'\nfunction generatorHtml1004(){', 'Standdown display helper', 'v10.05')
    text = rep(text, "fact('Standdown rate',quantity(r.standdownDays)+' days · '+rateAmount(r.standdownRate)+' per day')", "fact('Standdown calculation rate',rateAmount(r.standdownRate)+' / unit / day')", 'Retain source precision under More info; move days to visible breakdown', 'v10.05')
    text = rep(text, "'<td data-l=\"Dates\"><div class=\"tr888-v generator1004-dates\"><span><span class=\"acc761-w\">'+(arrived?'Arrived':'Planned')+'</span> '+date(arrived?r.deliveredDate:r.plannedDate)+'</span><span><span class=\"acc761-w\">Off hire</span> '+date(r.offhire)+'</span></div></td>'+", "'<td data-l=\"Dates\"><div class=\"tr888-v generator1004-dates\">'+(r.standdownDays>0?'':'<span><span class=\"acc761-w\">'+(arrived?'Arrived':'Planned')+'</span> '+date(arrived?r.deliveredDate:r.plannedDate)+'</span>')+'<span><span class=\"acc761-w\">Off hire</span> '+date(r.offhire)+'</span></div></td>'+", 'Show delivery date once when it is the visible standdown start', 'v10.05')
    text = rep(text, "'<td data-l=\"Standdown charge\" class=\"num\"><div class=\"tr888-v\"><b>'+amount(r.standdownCharge)+'</b></div></td>'+", "'<td data-l=\"Standdown charge\" class=\"num\"><div class=\"tr888-v\">'+generatorStanddownHtml1005(r,M.eventFrom)+'</div></td>'+", 'Visible standdown calculation facts', 'v10.05')
    text = rep(text, '</head>\n<body>', '<style id="standdown1005-style">\n'+(HERE/'standdown1005.css').read_text()+'\n</style>\n</head>\n<body>', 'Standdown facts within existing Finance layout', 'v10.05')
    return rep(text, "+ ' · v10.04'", "+ ' · v10.05'", 'Release footer', 'v10.05')

if __name__ == '__main__':
    page=Path(sys.argv[1]); page.write_text(apply(page.read_text()))
