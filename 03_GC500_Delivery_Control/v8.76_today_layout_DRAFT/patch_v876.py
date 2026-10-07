# Author: Andrew Fisher. Today presentation only; no source or shared-record changes.
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text();assert 'function handling875Set(' in s and 'function today876Tidy(' not in s
s=rep(s,"(groupFolds.get('group:' + area.id) || printing ? ' open' : '')","(printing || (groupFolds.has('group:' + area.id) ? groupFolds.get('group:' + area.id) : true) ? ' open' : '')",'open progress groups by default',str(p))
s=rep(s,'Open a count or explore by type','Select a count or view details','Today heading',str(p))
s=rep(s,' · v8.75',' · v8.76','release footer',str(p))
s=s.replace('</head>','<style id="today876-style">'+Path(__file__).with_name('today876.css').read_text()+'</style>\n</head>',1)
pos=s.index('</script>',s.index('const DATA ='));s=s[:pos]+Path(__file__).with_name('today876_src.js').read_text()+'\n'+s[pos:];p.write_text(s)
