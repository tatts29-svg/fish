"""Author: Andrew Fisher. Exact-base, display-only explorer symbols and individual areas."""
import hashlib,json,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE_SHA256='471bb02f13e0b6aa7f5afa50e72e262a8728f6db66d53df9dbff01f10d9083b7'

def patch(html):
 if hashlib.sha256(html.encode()).hexdigest()!=BASE_SHA256:raise ValueError('Requires exact live v11.44 '+BASE_SHA256)
 if 'mapunits1145-script' in html:raise ValueError('Already applied')
 match=re.search(r'(<script id="shapes1060-script">)(.*?)(</script>)',html,re.S)
 if not match:raise ValueError('Expected shapes module missing')
 old=match.group(2);s=old
 s=rep(s,"  const nativeDraw = window.drawMarks,", "  if (!host.MapUnits1145) return;\n  host.MapUnits1145.mount(window);\n  const nativeDraw = window.drawMarks,",'install explorer symbols before native capture','shapes1060')
 s=rep(s,"  window.drawMarks = function(v){", "  window.drawMarks = function(v){\n   if (window.MapUnits1145) window.MapUnits1145.draw(v);",'area paint uses existing camera paint','shapes1060')
 s=rep(s,"const code = String(m.it.code || ''), fs =", "const code = referenceQuantity1010(m.it, status), fs =",'symbols retained in fitted shape labels','shapes1060')
 # Only this bounded script's reference fonts change; the new font contains private-use glyphs only.
 if s.count('px Inter,sans-serif')!=6:raise ValueError('Reference fonts changed upstream')
 s=s.replace('px Inter,sans-serif','px GC500MapUnits1145,Inter,sans-serif')
 source=(HERE/'map1145_src.js').read_text().replace('__SYMBOLS1145__',json.dumps(json.loads((HERE/'symbols.json').read_text()),separators=(',',':')))
 html=rep(html,match.group(0),'<script id="mapunits1145-script">\n'+source+'\n</script>\n'+match.group(1)+s+match.group(3),'bounded explorer update','page')
 html=rep(html,"+' · v11.44'; /* v8.19 release922","+' · v11.45'; /* v8.19 release922",'release footer','page')
 return html

if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()))
