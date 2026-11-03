"""Author: Andrew Fisher. v12.90: Still on site Map Explorer filter.
Read-only presentation on exact live v12.89. Native source geometry and shared
collection readers are retained. No unit positions or operational data are made.
"""
from pathlib import Path
import hashlib
import re
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '89993cbd62c29f0a28b3dc5edc4365e8baab03a0af4858633441acc6faacab40'

def apply(text):
    if 'function stillOnSite1290()' in text:
        raise ValueError('v12.90 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v12.90 requires exact reviewed live v12.89')
    def script(sid, changes):
        nonlocal text
        pattern = re.compile(r'(<script\b[^>]*\bid="'+sid+r'"[^>]*>)(.*?)(</script>)', re.S)
        found = list(pattern.finditer(text))
        if len(found) != 1: raise ValueError('script not unique: '+sid)
        m=found[0]; body=m.group(2)
        for old,new,label in changes:
            body=rep(body,old,new,label,sid)
        text=text[:m.start(2)]+body+text[m.end(2):]
    script('shapes1060-script', [
      ("const departure1288=it=>{const s=mapStatus1009(it);return s?.offsite1225&&s.departure1211?.collected>0?s:null;};",
       "const onsite1290=it=>window.GC500StillOnSite1290?.active?window.GC500StillOnSite1290.row(it):null;\n  const departure1288=it=>{if(window.GC500StillOnSite1290?.active)return null;const s=mapStatus1009(it);return s?.offsite1225&&s.departure1211?.collected>0?s:null;};",'filter presentation only'),
      ("const sel = selected === m.it, status = mapStatus1009(m.it), dep = departure1288(m.it), col = sel ? '#ff821f' : dep ? status.colour : m.c, L = projected1069.get(m.it) || project(sh, M, dpr);",
       "const sel = selected === m.it, status = mapStatus1009(m.it), dep = departure1288(m.it), on=onsite1290(m.it), col = on ? (on.review?'#ffaaa3':'#ff821f') : sel ? '#ff821f' : dep ? status.colour : m.c, L = projected1069.get(m.it) || project(sh, M, dpr);",'orange actual footprint'),
      ("const pk = m.it.code + '|' + (m.it.places || []).map(bx => bx.join(',')).join(';') + '|' + camKey", "const pk = m.it.code + '|' + (on?'onsite1290':'normal') + '|' + (m.it.places || []).map(bx => bx.join(',')).join(';') + '|' + camKey",'distinct label plan cache'),
      ("plan = dep ? {how:'departed reference'", "plan = dep || on ? {how:'reference outline'",'retain source plan text'),
      ("if (c.std || dep && !dep.departure1211.complete) g.setLineDash([4 * dpr, 3 * dpr]);", "if (c.std || on?.partial || dep && !dep.departure1211.complete) g.setLineDash([4 * dpr, 3 * dpr]);",'partial reference outline'),
      ("g.fillStyle = c.tank ? '#9aa4ad80' : dep ? col + (!dep.departure1211.complete ? '12' : sel ? '55' : '2e') : col + (sel ? 'b3' : '66'); g.fill();", "g.fillStyle = on ? col+(on.partial?'18':'32') : c.tank ? '#9aa4ad80' : dep ? col + (!dep.departure1211.complete ? '12' : sel ? '55' : '2e') : col + (sel ? 'b3' : '66'); g.fill();",'quiet orange fill'),
      ("g.strokeStyle = c.tank ? '#c9d1d8' : col;", "g.strokeStyle = on ? col : c.tank ? '#c9d1d8' : col;",'tank highlight too'),
      ("if (!dep && !dr.arcs.some", "if (!dep && !on && !dr.arcs.some",'never invent door side'),
      ("g.strokeStyle = '#ffffff'; g.lineWidth = 1.7 * dpr; door(g);", "g.strokeStyle = on ? col : '#ffffff'; g.lineWidth = 1.7 * dpr; door(g);",'source doors orange'),
      ("const all=marks;marks=all.filter(m=>!departure1288(m.it));frameDn=nativeDone().filter(it=>!departure1288(it));", "const all=marks;marks=all.filter(m=>!departure1288(m.it)&&!onsite1290(m.it));frameDn=window.GC500StillOnSite1290?.active?[]:nativeDone().filter(it=>!departure1288(it));",'unassigned reference tags only'),
      ("else if(!departure1288(m.it))rest.push(m);", "else if(!departure1288(m.it)&&!onsite1290(m.it))rest.push(m);",'no onsite circles'),
      ("const dn = nativeDone(), dnRest = []; doneShaped = [];", "const dn = window.GC500StillOnSite1290?.active?[]:nativeDone(), dnRest = []; doneShaped = [];",'no unrelated installation overlay'),
    ])
    src=(HERE/'still_onsite1290_src.js').read_text()
    script('spot1117-script', [
      ("filter(it=>it.location1210?.kind==='vms').map(it=>[it.code,it])", "filter(it=>it.location1210?.kind==='vms'&&(!window.GC500StillOnSite1290?.active||window.GC500StillOnSite1290.row(it))).map(it=>[it.code,it])",'VMS selected overlay obeys filter'),
      ("const left=ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected);", "const onsite=window.GC500StillOnSite1290,onlyOn=!!onsite?.active;\n  const left=ITEMS.filter(it=>it.places.length&&(onlyOn?onsite.row(it):states.get(key(it))?.collected));",'collection overlay filter'),
      ("const d=states.get(key(it)),shape=window.GC500Shape1060?.projected1288(it.code,true);\n   const common={code:it.code,kind:d.issues.length?'review':d.complete?'off':'part',n:d.collected,total:Number.isFinite(d.remaining)&&d.remaining>=0?d.collected+d.remaining:null};",
       "const d=states.get(key(it)),on=onlyOn?onsite.row(it):null,shape=window.GC500Shape1060?.projected1288(it.code,true);\n   const common=on?{code:it.code,kind:on.review?'review':'onsite',n:on.unknown||on.review?null:on.remaining,total:null,onsite:true,wording:onsite.wording(on)}:{code:it.code,kind:d.issues.length?'review':d.complete?'off':'part',n:d.collected,total:Number.isFinite(d.remaining)&&d.remaining>=0?d.collected+d.remaining:null};",'remaining reference tag'),
      ("C={off:'#7fffc1',part:'#7fffc1',review:'#ffaaa3'};", "C={off:'#7fffc1',part:'#7fffc1',review:'#ffaaa3',onsite:'#ff821f'};",'Coates orange tags'),
      ("const count=q.total&&q.total>q.n?q.n+'/'+q.total:String(q.n),standard=q.shape&&q.provenance!=='master';", "const count=q.onsite?q.wording:q.total&&q.total>q.n?q.n+'/'+q.total:String(q.n),standard=q.shape&&q.provenance!=='master';",'unambiguous count wording'),
      ("mapLeftFrame1256();", "mapLeftFrame1256();\n"+src+"\n  stillOnSite1290();",'install collection filter'),
    ])
    text=rep(text,"+' · v12.89'; /* v8.19 release922", "+' · v12.90'; /* v8.19 release922",'release footer','page')
    return text

if __name__ == '__main__':
    path=Path(sys.argv[1]);path.write_text(apply(path.read_text()))
    print('Applied v12.90 Still on site presentation filter. Author: Andrew Fisher.')
