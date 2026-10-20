# Author: Andrew Fisher. Source guide and individual transport/load assessment integration.
import sys,re
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
assert 'restraint924-style' not in s, 'v9.24 already applied'
assert 'FLOW891' in s and 'showStability918' in s and 'loading872Editor' in s, 'Requires the current integrated baseline'
# Remove the former truthy-object test at source, even before the runtime adapters initialise.
old="const items = a.refs.concat(b.refs).map(r => r.key), missing = items.filter(k => !FLOW891.specs[k]);\n  share.push({a, b, area: a.area.name, fits: missing.length ? null : true, why: missing.length ? 'weights and dimensions are not on the page for ' + missing.join(', ') + ' — not suggested; check the Coates Load Restraint Guide 2023 before combining' : 'weights and dimensions on the page fit the guide'});"
new="const checked924 = window.Restraint924 ? window.Restraint924.share(d,a,b) : {fits:null,why:'Verify the individual units and actual truck/load arrangement before combining'};\n  share.push({a,b,area:a.area.name,fits:checked924.fits===true?true:null,why:checked924.why});"
s=rep(s,old,new,'fail closed shared-truck assessment',str(p))
footer=re.findall(r"\+ ' · v9\.\d+'; /\* v8\.19",s)
assert len(footer)==1, 'Expected one current release footer'
s=rep(s,footer[0],"+ ' · v9.24'; /* v8.19",'release footer',str(p))
src=Path(__file__).with_name('restraint924_src.js').read_text().replace('/* GUIDE924_DATA */[]',Path(__file__).with_name('guide924.json').read_text().strip())
assert s.endswith('</body></html>') or s.endswith('</body></html>\n'), 'Expected final document anchor'
end=s.rfind('</body></html>')
s=s[:end]+'<script>\n'+src+'\n</script>\n'+s[end:]
p.write_text(s)
