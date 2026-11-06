#!/usr/bin/env python3
"""Author: Andrew Fisher. Patch only the exact existing explorer assets; no network writes."""
from pathlib import Path
import argparse,hashlib,os,sys,re
HERE=Path(__file__).resolve().parent
sys.path.insert(0,os.environ.get('GC500_TOOLCHAIN',str(HERE.parent/'toolchain')))
from rep import rep
EXPECTED={'explorer.js':'366897925de96b5f881485bec60c6a3a7263fd20d9b04d48231ac82d356020d0','explorer-index.html':'e2f0f9bfbfc9b5f707a2ead734b99cb0569c11f68bf15e0303d7021eac9e0572'}
EXPORT_TILE_OLD='        for (const [tx, ty] of need) { const t = tiles.get(tileKey(z, tx, ty)); if (t && t.bm) g.drawImage(t.bm, tx * TILE, ty * TILE, TILE + .5, TILE + .5); else incomplete++; } g.restore(); } }'
EXPORT_TILE_NEW="        /* v8.28 - compose the awaited tiles before rotating, as the live canvas does. */\n        const nx = tx1 - tx0 + 1, ny = ty1 - ty0 + 1, exportKey = 'export828-' + R.key;\n        const mz = mosaicFor(exportKey, z, tx0, ty0, nx, ny);\n        for (const [tx, ty] of need) { const t = tiles.get(tileKey(z, tx, ty)); if (t && t.bm) mz.put(tx - tx0, ty - ty0, t, null, null); else { mz.put(tx - tx0, ty - ty0, null, null, null); incomplete++; } }\n        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';\n        g.drawImage(mz.canvas, 0, 0, nx * TILE, ny * TILE, tx0 * TILE, ty0 * TILE, nx * TILE, ny * TILE);\n        mz.canvas.width = 0; mz.canvas.height = 0; mosaics.delete(exportKey); g.restore(); } }"
def sha(b):return hashlib.sha256(b).hexdigest()
def replace(text,old,new):
    if text.count(old)!=1:raise ValueError('Expected one map anchor: '+old[:60])
    start=text.index(old);prefix=re.search(r'[ \t]*$',text[:start]).group(0)
    result=rep(text,old,prefix+new,'fencing map hook','private map input')
    if result!=text.replace(old,new,1):raise ValueError('Unexpected map whitespace change')
    return result
def write(p,b):
    p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b if isinstance(b,bytes) else b.encode())
def build(BASE,output,source_dir):
    base = (BASE / 'explorer.js').read_bytes()
    assert sha(base) == EXPECTED['explorer.js']
    s = base.decode()
    assert 'fencingAdapter' not in s
    hook = "  if (window.GC500FencingMap) window.GC500FencingMap.paint({width:canvas.width,height:canvas.height,dpr,\n    project:(p,region)=>{ const q=geoOn()&&region==='inset'?ap(TIN,p[0],p[1]):p; const d=applyM(S2D,q[0],q[1]);return[d.x,d.y]; }});\n"
    s = replace(s, '  perf.frames++; perf.frameMs += performance.now() - t0;', hook + '  perf.frames++; perf.frameMs += performance.now() - t0;')
    api = 'fencingAdapter:Object.freeze({masterHash:()=>P&&P.meta&&P.meta.sha256,requestPaint,\n    goto:gotoRect,setMode,toast,clearSelection:()=>{clearSelection813();showCategory(null);},panel:panel813}),'
    s = replace(s, 'window.GC500Explorer = {', 'window.GC500Explorer = {' + api)
    export_hook = "    if(window.GC500FencingMap)window.GC500FencingMap.exportLayer(g,{width,height,dpr:width/sw,\n      project:(p,region)=>{const q=geoOn()&&region==='inset'?ap(TIN,p[0],p[1]):p;const d=applyM(EX,q[0],q[1]);return[d.x,d.y];}});\n"
    s = replace(s, "    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '600 26px Inter, sans-serif';", export_hook + "    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '600 26px Inter, sans-serif';")
    s = replace(s, " : 'satellite only') + (incomplete", " : (window.GC500FencingMap&&window.GC500FencingMap.state.active?'satellite basemap + fencing source overlay':'satellite only')) + (incomplete")
    s = replace(s, EXPORT_TILE_OLD, EXPORT_TILE_NEW)
    write(output / 'explorer.js', s)
    basehtml = (BASE / 'explorer-index.html').read_bytes()
    assert sha(basehtml) == EXPECTED['explorer-index.html']
    h = basehtml.decode()
    h = replace(h, '</head>', '<link rel="stylesheet" href="fencing-map.css">\n</head>')
    h = replace(h, '<script src="explorer-merge.js?v=261238402f3c"></script>', '<script src="explorer-merge.js?v=261238402f3c"></script>\n<script src="fencing-map-core.js"></script>\n<script src="fencing-map-explorer.js"></script>')
    h = replace(h, 'explorer.js?v=366897925de9', 'explorer.js?v=' + sha(s.encode())[:12])
    for name in ['fencing-map-core.js', 'fencing-map-explorer.js', 'fencing-map.css']:
        b = (source_dir / name).read_bytes()
        write(output / name, b)
        h = h.replace('"' + name + '"', '"' + name + '?v=' + sha(b)[:12] + '"')
    write(output / 'index.html', h)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--base-dir',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);a=parser.parse_args()
    build(a.base_dir,a.output,HERE/'source')
