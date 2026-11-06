#!/usr/bin/env python3
"""Author: Andrew Fisher. Dated staff choices in the existing native Crew form."""
import argparse,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(s):
    if 'id="staff910-script"' in s:raise ValueError('Staff selector already applied')
    for marker in ['function crew883SaveDay(', 'function crew883SavePlan(', 'function rosterIncludes858(', 'function timeline908Arrange(', 'function time907Html(']:
        if marker not in s:raise ValueError('Missing current native feature: '+marker)
    def replace(old,new):
        nonlocal s
        s=rep(s,old,new,'v910 staff name selection','page.html')
    footer=re.search(r"\+ ' · v9\.0[89]'; /\* v8\.19",s)
    if not footer:raise ValueError('v910 needs current v9.08 or v9.09 base')
    replace(footer.group(),"+ ' · v9.10'; /* v8.19")
    css=(HERE/'staff910.css').read_text()
    js=(HERE/'staff910.js').read_text()
    if '</script' in js or '</style' in css:raise ValueError('Unsafe source boundary')
    replace('</head>\n<body>','<style id="staff910-style">'+css+'</style>\n</head>\n<body>')
    replace('</script>\n</body></html>','</script>\n<script id="staff910-script">\n'+js+'\n</script>\n</body></html>')
    return s

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('base',type=Path);ap.add_argument('output',type=Path);a=ap.parse_args()
    a.output.write_text(patch(a.base.read_text()))
    print('Staff-name candidate prepared; no operational records changed.')
