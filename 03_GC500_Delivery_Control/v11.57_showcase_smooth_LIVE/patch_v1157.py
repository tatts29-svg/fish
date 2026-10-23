"""Author: Andrew Fisher. Keep Showcase controls responsive during circuit preparation."""
import hashlib,json,sys,re
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(html):
    expected=(HERE/'BASE_SHA256').read_text().strip()
    if hashlib.sha256(html.encode()).hexdigest()!=expected: raise ValueError('Wrong live base for v11.57')
    if 'smooth1157-script' in html: raise ValueError('v11.57 already applied')
    for entry in json.loads((HERE/'constructors1157.json').read_text()):
        matches=[html[m.start():m.start()+entry['length']] for m in re.finditer(re.escape(entry['head']),html)]
        matches=[x for x in matches if hashlib.sha256(x.encode()).hexdigest()==entry['sha256']]
        if len(matches)!=1: raise ValueError('Constructor changed: '+entry['label'])
        original=matches[0]
        html=rep(html,original,entry['prefix']+original+'\n'+entry['generator'],entry['label'],'page')
    html=rep(html,"+' · v11.56'; /* v8.19 release922","+' · v11.57'; /* v8.19 release922",'footer','page')
    html=rep(html,"const C = completionAsOf(asOf), t = lightTally(allAssets(), asOf); /* both as at the day (B03) */", "const C = ['equipment','site'].includes(key) ? completionAsOf(asOf) : null, t = ['equipment','complete','site'].includes(key) ? lightTally(allAssets(), asOf) : null; /* Compute only figures this scene uses, as at the day. */", 'avoid unused scene calculations','page')
    html=rep(html,"const html=holdAssets(()=>inner(key,d));", "const html=['countdown','lead','crew','fencing'].includes(key)?inner(key,d):holdAssets(()=>inner(key,d));",'skip unused asset holds on information scenes','page')
    html=rep(html,"function visibleMotionTarget(node) {\n    const p = pane();","function visibleMotionTarget(node) {\n    if(document.body.classList.contains('showing'))return null;\n    const p = pane();",'stop hidden instrument layout work','page')
    html=rep(html,'body.showing{overflow:hidden}','body.showing{overflow:hidden}\nbody.showing>.app{display:none}','skip the covered dashboard paint','page')
    script=(HERE/'smooth1157.js').read_text()
    assert '</script' not in script
    i=html.rfind('</body>')
    return html[:i]+'<script id="smooth1157-script">\n'+script+'\n</script>\n'+html[i:]
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.57 cooperative circuit preparation applied')
