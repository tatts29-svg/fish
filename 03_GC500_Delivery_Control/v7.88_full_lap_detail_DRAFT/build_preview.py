#!/usr/bin/env python3
"""Author: Andrew Fisher. Offline full-lap review; public visual geometry only."""
import json,sys
from pathlib import Path
here=Path(__file__).resolve().parent
source=Path(sys.argv[1]).read_text()
start=source.index('const DATA = ')+len('const DATA = ')
data,_=json.JSONDecoder().raw_decode(source[start:])
visual={key:data[key] for key in ('circuit','surrounds')}
core=source[source.index('/* GC3D part 1 —'):source.index('/* GC3D part 6 —')]
pos=source.index('G.fullLap788=')
start=source.rfind('<script>',0,pos)+len('<script>')
modules=source[start:source.index('</script>',pos)]
template=(here/'preview_shell788.html').read_text()
out=Path(sys.argv[2]);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(template.replace('/* VISUAL_DATA_788 */','const DATA='+json.dumps(visual,separators=(',',':')).replace('</','<\\/')+';').replace('/* RENDERER_788 */',core).replace('/* EXTENSIONS_788 */',modules))
print(f'Offline full-lap preview: {out.name}, {out.stat().st_size} bytes; no records or service access')
