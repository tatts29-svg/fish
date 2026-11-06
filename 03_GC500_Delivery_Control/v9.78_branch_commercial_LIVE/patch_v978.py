#!/usr/bin/env python3
"""Author: Andrew Fisher. Branch reconciliation and commercial presentation."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'));sys.path.insert(0,str(HERE))
from rep import rep
from terminology978 import apply_terminology978
def patch(s):
 if 'branch-commercial978-script' in s:raise ValueError('Already v9.78')
 if "+ ' · v9.77'" not in s:raise ValueError('Requires v9.77')
 s=apply_terminology978(s,lambda x,a,b:rep(x,a,b,'Commercial labels',__file__))
 s=rep(s,'</style>\n</head>','</style>\n<style id="branch978-style">'+(HERE/'branch978.css').read_text()+'</style>\n</head>','Branch layout',__file__)
 s=rep(s,'</body>\n</html>\n','<script id="branch-commercial978-script">'+(HERE/'branch978.js').read_text()+'</script>\n</body>\n</html>\n','Branch model and presentation',__file__)
 return rep(s,"+ ' · v9.77'","+ ' · v9.78'",'Release footer',__file__)
if __name__=='__main__':
 src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)>2 else src;out.write_text(patch(src.read_text()))
