#!/usr/bin/env python3
"""Author: Andrew Fisher. Compact Timeline presentation. DRAFT awaiting preview approval."""
import argparse,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(s):
    if 'function timeline908Arrange(' in s:raise ValueError('v908 already applied')
    for marker in ['function timeline846Line(', 'function traffic903Plan(', 'timeline903-style', 'function flow891Card(']:
        if marker not in s:raise ValueError('Missing current base feature: '+marker)
    def replace(old,new):
        nonlocal s
        s=rep(s,old,new,'v908 compact Timeline','page.html')
    footer=re.search(r"\+ ' · v9\.0[4-7]'; /\* v8\.19",s)
    if not footer:raise ValueError('v908 requires current v9.04–v9.07 base')
    replace(footer.group(),"+ ' · v9.08'; /* v8.19")
    replace('</head>\n<body>','<style id="timeline908-style">'+(HERE/'timeline908.css').read_text()+'</style>\n</head>\n<body>')
    js=(HERE/'timeline908.js').read_text()
    if '</script' in js:raise ValueError('Unsafe script boundary')
    replace('</script>\n</body></html>','</script>\n<script id="timeline908-script">\n'+js+'\n</script>\n</body></html>')
    return s

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('base',type=Path);parser.add_argument('output',type=Path,nargs='?');args=parser.parse_args()
    (args.output or args.base).write_text(patch(args.base.read_text()))
    print('v9.08 DRAFT prepared; no operational records changed.')
