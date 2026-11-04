"""Author: Andrew Fisher. Extend the existing outstanding list only."""
from pathlib import Path
import sys,hashlib
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='d6c557d3045c55f4d66bca2227f098f4951003bd4674ac83ba497aa16f7b8de0'
def apply(s):
 if hashlib.sha256(s.encode()).hexdigest()!=BASE:raise ValueError('Requires exact live93 base')
 s=rep(s,' function renderList(){',(HERE/'list1295_src.js').read_text()+'\n function renderList(){','details helper','map')
 s=rep(s,"'</small></div>'+(r.mapped?'<button type=\"button\" data-locate=\"'", "'</small>'+details1295(r)+'</div>'+(r.mapped?'<button type=\"button\" data-locate=\"'",'list details','map')
 s=rep(s,'#still-onsite-panel1290 .onsite-summary{font-weight:700}', '#still-onsite-panel1290 .onsite-summary{font-weight:700}#still-onsite-panel1290{max-width:900px}.onsite-details1295{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 14px;margin:8px 0}.onsite-details1295 dt{font-size:11px;color:#b8c8cf}.onsite-details1295 dd{margin:0;overflow-wrap:anywhere}.onsite-item1295{border-top:1px solid #ffffff18;padding-top:9px;margin-top:10px}.onsite-spec1295{padding:5px 0}@media(max-width:500px){.onsite-details1295{grid-template-columns:1fr}#still-onsite-panel1290 .onsite-row{align-items:flex-start}}','list styling','map')
 return rep(s,"+' · v12.93';", "+' · v12.95';",'footer','page')
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(apply(p.read_text()))
