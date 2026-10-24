"""Author: Andrew Fisher. Coates-style servicing report and a clear print entry."""
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

page = Path(sys.argv[1])
raw = page.read_bytes()
text = raw.decode('utf-8')
assert 'report1172-cover' not in text, 'v11.72 already applied'
assert hashlib.sha256(raw).hexdigest() == 'f6394233f1e42df04ebbf84bee7fdfd7df892020a06c267311faae1c69708cf4', 'Wrong live base; rebuild and retest'

def change(old, new, label):
    global text
    text = rep(text, old, new, label, str(page))

start = text.index('var SvcShift1168 =')
end = text.index('module.exports=SvcShift1168;', start) + len('module.exports=SvcShift1168;')
old = text[start:end]
module = old
i = module.index('function html(s) {')
j = module.index('function csv(s)', i)
module = module[:i] + (HERE / 'report1172_html.js').read_text() + '\n' + module[j:]
i = module.index('var PRINT_CSS=')
j = module.index('function documentHtml(s)', i)
standalone = '*{box-sizing:border-box}body{margin:0;background:#e7eaed;font-family:Arial,Helvetica,sans-serif}.shift1168-report{max-width:850px;margin:24px auto;padding:28px;background:#fff}.shift1168-print-controls{max-width:850px;margin:20px auto;padding:0 18px;font-size:13px;color:#242629}.shift1168-print-controls button{border:0;border-radius:5px;background:#ff6a13;color:#242629;padding:13px 22px;font:700 15px Arial;cursor:pointer}.shift1168-print-controls p{line-height:1.5}@media(max-width:540px){.shift1168-report{margin:0;padding:16px}.shift1168-print-controls{padding:0 16px}}@media print{body{background:#fff}.shift1168-report{max-width:none;margin:0;padding:0}.shift1168-print-controls{display:none}}'
module = module[:i] + 'var PRINT_CSS=' + json.dumps(standalone + '\n' + (HERE / 'report1172.css').read_text(), ensure_ascii=False) + ';\n' + module[j:]
module = module.replace('<title>GC500 shift report ', '<title>Coates GC500 servicing report ')
module = module.replace('Choose Save as PDF in your print options to keep or share this report.', 'Choose your printer, or Save as PDF to keep or share the report. A4 portrait is recommended.')
change(old, module, 'report presentation; preserve snapshot, CSV and lifecycle')

old_button = '<button type="button" data-shift1168 data-ro>Shift report</button>'
change(old_button, '', 'remove print entry from map filters')
anchor = '<div class="svc1099-overall" data-svc1099-overall role="status"></div>'
launch = '<div class="report1172-launch"><div><b>Shift report</b><p>Selected night · all areas · completed work and follow-up</p></div><button type="button" data-shift1168 data-ro>Print report</button></div>'
change(anchor, launch + anchor, 'prominent report entry above progress and map')
change('</head>\n<body>', '<style>\n' + (HERE / 'report1172.css').read_text() + '\n' + (HERE / 'controls1172.css').read_text() + '\n</style>\n</head>\n<body>', 'Coates report and controls')
change("+' · v11.71';", "+' · v11.72';", 'release footer')
page.write_text(text, encoding='utf-8')
