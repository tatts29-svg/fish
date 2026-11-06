# Author: Andrew Fisher. Independent unloading extension; Today integration remains held.
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text();assert 'function unloading881Marker(' not in s
assert 'function paired879Sets(' in s
s=rep(s,' · v8.79',' · v8.81','release footer',str(p))
pos=s.index('</script>',s.index('const DATA ='))
s=s[:pos]+'\nfunction unloading881Marker(){return true;}\n'+Path(__file__).with_name('unloading881_src.js').read_text()+'\n'+s[pos:]
p.write_text(s)
