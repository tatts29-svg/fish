#!/usr/bin/env python3
"""Author: Andrew Fisher. Native overlay exits and the moved supplier route."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'navigation934-script' not in s,'v9.34 already applied'
assert 'items933-script' in s and 'function renderSubhired932()' in s,'Expected combined v9.33 source'
s=rep(s," · v9.33'; /* v8.19"," · v9.34'; /* v8.19",'release footer',str(p))
s=rep(s,"action:{kind:'toilet-supplier', tab:'timeline', anchor:'ep819', heading:'ep819h'}","action:{kind:'toilet-supplier', tab:'subhired', anchor:'ep819', heading:'ep819h'}",'supplier action destination',str(p))
s=rep(s,"action.kind === 'toilet-supplier' ? 'timeline' : 'fencing'","action.kind === 'toilet-supplier' ? 'subhired' : 'fencing'",'supplier return strip destination',str(p))
s=rep(s,"go('timeline'); const journey = linkedReturn;","go('subhired'); document.querySelector('[data-supplier932-company=\"event-portables\"]')?.click(); const journey = linkedReturn;",'open the native supplier company',str(p))
s=rep(s,"linkedReturn !== journey || typeof state === 'undefined' || state.tab !== 'timeline'","linkedReturn !== journey || typeof state === 'undefined' || state.tab !== 'subhired'",'supplier heading focus guard',str(p))
s=rep(s,' const changed = tab !== state.tab;',' const changed = tab !== state.tab;\n if(changed&&window.Navigation934)Navigation934.depart(tab);','close transient overlays before tab changes',str(p))
s=rep(s,'function onPop(){','function onPop(){\n if(window.Navigation934)Navigation934.depart();','close transient overlays on browser Back',str(p))
# A dismissal must not save. Keep the original save/redraw path for completed changes.
for name,nextname,close_ids in [('contractDialog','contractBlock',['cClose','cCancel']),('breakdownDialog','bdRow',['bClose','bCancel']),('varDialog','', ['vClose','vCancel']),('loadPairDialog','makeDropCard',['lpClose']),('cardMadeDialog','',['cmClose'])]:
 start=s.index('function '+name+'(')
 end=s.find('\nfunction ',start+9)
 assert end>start,name+' boundary'
 block=s[start:end]
 old=' const shut = () => { d.remove(); '+('scrim.remove(); ' if name in ('loadPairDialog','cardMadeDialog') else '')+'bump(); };'
 pure=' const dismiss934 = () => { d.remove(); '+('scrim.remove(); ' if name in ('loadPairDialog','cardMadeDialog') else '')+'};\n const shut = () => { dismiss934(); bump(); };'
 block=rep(block,old,pure,name+' pure dismissal',str(p))
 for cid in close_ids:
  # Existing direct binding forms differ between the older native drawers.
  pattern=("$('#"+cid+"', d).onclick = shut" if name in ('contractDialog','breakdownDialog','varDialog') else "d.querySelector('#"+cid+"').onclick = shut")
  block=rep(block,pattern,pattern.replace('= shut','= dismiss934'),name+' '+cid,str(p))
 if name in ('contractDialog','breakdownDialog','varDialog'):
  block=rep(block,"if (e.key === 'Escape') shut();","if (e.key === 'Escape') dismiss934();",name+' Escape dismissal',str(p))
 else:
  block=rep(block,'scrim.onclick = shut;','scrim.onclick = dismiss934;',name+' backdrop dismissal',str(p))
 s=rep(s,s[start:end],block,name+' close lifecycle',str(p))
css=(HERE/'navigation934.css').read_text();js=(HERE/'navigation934.js').read_text()
tail=re.search(r'</script>(\s*</body></html>\s*)$',s);assert tail
s=rep(s,tail.group(0),'</script>\n<style id="navigation934-style">'+css+'</style>\n<script id="navigation934-script">'+js+'</script>'+tail.group(1),'navigation helper',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.34 navigation exits and supplier route applied; no operational records changed')
