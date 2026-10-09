#!/usr/bin/env python3
"""Author: Andrew Fisher. Clear figures and supporting detail folds."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
sys.path.insert(0,str(HERE))
from rep import rep
from apply_financial_presentation976 import apply_financial_presentation976
from prose976 import apply_prose976

def patch(s):
 if 'financial-presentation976-script' in s: raise ValueError('Already applied v9.76')
 if "+ ' · v9.75'" not in s: raise ValueError('Requires v9.75')
 s=apply_financial_presentation976(s,lambda x,a,b:rep(x,a,b,'Financial presentation',__file__))
 s=rep(s,'</body>\n</html>\n','<script id="financial-presentation976-script">\n'+(HERE/'financial_presentation976.js').read_text()+'\n</script>\n</body>\n</html>\n','Financial figures',__file__)
 s=apply_prose976(s)
 return rep(s,"+ ' · v9.75'","+ ' · v9.76'",'Release footer',__file__)

if __name__=='__main__':
 src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)>2 else src
 out.write_text(patch(src.read_text()))
