"""Author: Andrew Fisher. Post-v10.21 publication review: retain the revised layout's honest provenance."""
from pathlib import Path
import hashlib,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() not in {'9db6edd2492e6f25d4144cc8762f8a223f1cca1a6ad01d25d9c648e17280456b','e116d2a58deed0f4c155482f5d240ce89204eb69f6d16ef123050fd2656d9ef6'}:
        raise ValueError('Combined candidate changed; review the exact source before applying')
    if 'function gate6Revision1021(' in html or 'const MASTER_IMG1020 =' not in html or "+ ' · v10.21'" not in html:
        raise ValueError('Requires the combined v10.21 candidate, once')
    def once(old,new,label):
        nonlocal html
        html=rep(html,old,new,label,'v10.21 publication review')
    once('function locSrc782(ref){', (HERE/'provenance1021.js').read_text()+'\nfunction locSrc782(ref){\n const revised1021=gate6Revision1021(ref); if(revised1021)return revised1021;', 'honest Gate 6 source')
    once("return {lat: m.ll[0], lon: m.ll[1], acc: null, at: '2026-09-27T00:00:00.000Z', by: L782 ? L782.by", "return {lat: m.ll[0], lon: m.ll[1], acc: null, at: L782&&L782.kind==='revised'?null:'2026-09-27T00:00:00.000Z', by: L782 ? L782.by", 'no invented revision timestamp')
    once(" if (L) return {kind: L.kind, ll: nt.ll, a, nt, approx: L.kind === 'unverified'", " if (L&&L.kind==='revised') return {kind:L.kind,ll:nt.ll,a,nt,approx:true,label:L.label,sms:L.sms,spoken:'to the approximate spot on the revised Gate 6 layout for',nav:L.nav};\n if (L) return {kind: L.kind, ll: nt.ll, a, nt, approx: L.kind === 'unverified'", 'revised destination without redirect')
    once("const items = live.map(a => { const m = MASTER_LOC[a.key]; return {key: a.key, trade:", "const items = live.map(a => { const m = MASTER_LOC[a.key]; return {placedHow:gate6Revision1021(a.key)?.label,key: a.key, trade:", 'map search source label')
    once("return {name: a.name || a.item || '', status: words[st]", "return {revision1021:gate6Revision1021(key)?.line,name: a.name || a.item || '', status: words[st]", 'map card source label')
    return html

if __name__=='__main__':
    path=Path(sys.argv[1]);path.write_text(apply(path.read_text()))
