#!/usr/bin/env python3
"""Author: Andrew Fisher. Export only public circuit geometry and rendering code for an offline visual preview."""
import json
import sys
from pathlib import Path
from vegetation781 import _SOURCE as vegetation_source

HERE = Path(__file__).resolve().parent
source = Path(sys.argv[1]).read_text()
start = source.index('const DATA = ') + len('const DATA = ')
data, _ = json.JSONDecoder().raw_decode(source[start:])
visual = {key: data[key] for key in ('circuit', 'surrounds')}
core = source[source.index('/* GC3D part 1 —'):source.index('/* GC3D part 6 —')]
modules = vegetation_source + '\n' + '\n'.join((HERE / name).read_text() for name in (
    'track_detail781_src.js', 'architecture781_src.js', 'sky781_src.js', 'preview781_src.js'))
template = (HERE / 'preview_shell781.html').read_text()
out = Path(sys.argv[2])
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(template.replace('/* VISUAL_DATA_781 */', 'const DATA='+json.dumps(visual, separators=(',', ':')).replace('</', '<\\/')+';')
    .replace('/* RENDERER_781 */', core).replace('/* EXTENSIONS_781 */', modules))
print(f'Offline preview: {out} ({out.stat().st_size:,} bytes); circuit/surrounds only, no service requests or financial records')
