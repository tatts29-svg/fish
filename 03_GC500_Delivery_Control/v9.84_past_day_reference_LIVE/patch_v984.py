# Author: Andrew Fisher
from pathlib import Path
import sys,hashlib,base64
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if 'past984-script' in s:raise SystemExit('Already applied')
if hashlib.sha256(p.read_bytes()).hexdigest()!='19242957feb45f8abfe098ec096461f80d3ed7b57a887fb6086c666ca201c589':raise SystemExit('Wrong live base')
s=rep(s,"+ ' · v9.83'","+ ' · v9.84'",'version',str(p))
s=rep(s,' const card = (d, ci) => {\n const t = lightTally(d.deliveries.map(r => r.a));',' const card = (d, ci) => {\n if(window.BuildCards984)return BuildCards984.html(d,ci,sel,today);\n const t = lightTally(d.deliveries.map(r => r.a));','Shared day card renderer',str(p))
s=rep(s,' return {reconcile,refresh,stop,report};',' return {reconcile,refresh,stop,report,art,kindFor};','Reuse verified weather artwork',str(p))
stamp=base64.b64encode((here/'assets/day-completed-stamp.png').read_bytes()).decode()
css=(here/'card984.css').read_text()+'\n#pane-timeline .bc984-stamp{background-image:url(data:image/png;base64,'+stamp+')}\n'
history=(here/'history984.js').read_text().replace('__BUILD_HISTORY984_DATA__',(here/'history984.json').read_text())
js=(here/'card984-data.js').read_text()+'\n'+history+'\n'+(here/'card984-main.js').read_text()
s=rep(s,'</head>\n<body','<style id="past984-style">'+css+'</style>\n</head>\n<body','Approved upright Build cards',str(p))
s=rep(s,'</body>\n</html>','<script id="past984-script">'+js+'</script>\n</body>\n</html>','Dated shared card readings and motion',str(p))
p.write_text(s)
