# Author: Andrew Fisher
from pathlib import Path
import sys,hashlib,json,base64
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if hashlib.sha256(p.read_bytes()).hexdigest()!='40dc8f6c66079d8910ef5eaa3dd6e98a80b778960f70659d5c2447676d1c6175':raise SystemExit('Wrong live base')
if 'icons989-script' in s:raise SystemExit('Already applied')
data={}
for a in json.loads((here/'sources.json').read_text())['icons']:
    raw=(here/a['file']).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=a['sha256']:raise SystemExit('Source icon changed: '+a['key'])
    data[a['key']]={k:a[k] for k in ['width','height','threshold']}
    data[a['key']]['data']='data:image/png;base64,'+base64.b64encode(raw).decode()
js=(here/'icons989.js').read_text().replace('__RULE_ART_989__',json.dumps(data,separators=(',',':')))
s=rep(s,"+ ' · v9.88'","+ ' · v9.89'",'Version',str(p))
s=rep(s,'<script id="past984-script">','<script id="icons989-script">'+js+'</script>\n<script id="past984-script">','Shared original outline renderer',str(p))
s=rep(s,"'+shield+'</span><span class=\"bc984-rule-copy\">","'+RuleIcons989.html(rule.title)+'</span><span class=\"bc984-rule-copy\">",'Daily rule artwork',str(p))
s=rep(s,"root.BuildProgress986?.sync();}","root.BuildProgress986?.sync();root.RuleIcons989?.setBuildPlaying(play);}",'Share Build motion lifecycle',str(p))
s=rep(s,"'<b>'+e(d.lifeSavingRule.title)+'</b><p>'","'<span class=\"ls989-heading\">'+RuleIcons989.html(d.lifeSavingRule.title)+'<b>'+e(d.lifeSavingRule.title)+'</b></span><p>'",'Selected rule artwork',str(p))
s=rep(s,'<span class="lsrn ${esc(c)}">${esc(n)}</span>','<span class="lsrn ${esc(c)} ls989-print-title">${RuleIcons989.html(n,{static:true})}<span>${esc(n)}</span></span>','Generated pre-start outlines',str(p))
s=rep(s,'<span class="dp-lsrn ${esc(c)}">${esc(n)}</span>','<span class="dp-lsrn ${esc(c)} ls989-print-title">${RuleIcons989.html(n,{static:true})}<span>${esc(n)}</span></span>','Driver and team sheet outlines',str(p))
s=rep(s,'</head>\n<body','<style id="icons989-style">'+(here/'icons989.css').read_text()+'</style>\n</head>\n<body','Transparent neon outline styling',str(p))
p.write_text(s)
