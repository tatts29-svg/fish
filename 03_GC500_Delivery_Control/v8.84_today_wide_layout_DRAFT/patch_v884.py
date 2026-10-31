# Author: Andrew Fisher. v8.84 Today wide-screen layout. Presentation only; no data, record or other-tab changes.
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
assert 'function today876Tidy(' in s and 'today884-style' not in s and s.count(' · v8.83')==1
s=rep(s,' · v8.83',' · v8.84','release footer',str(p))
s=s.replace('</head>','<style id="today884-style">'+Path(__file__).with_name('today884.css').read_text()+'</style>\n</head>',1)
p.write_text(s)
