#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact-source Map explorer identity/search synchronisation repair."""
from pathlib import Path
import hashlib
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'toolchain'))
from rep import rep
BASE = {'explorer.js':'5d9ec8fa34696b3806fc83ff889a6e23cc30ae5699d89d17852c2465f68d4296', 'explorer-merge.js': 'b3f1bb15f5dc697d1fb3a0dbda90d2792eb4f95988672ff1d88c5e2f35ebd331', 'index.html': 'd23edfb85666a6df9854f5f4c305878ce8fa6bb7311406a8a2c7ce6fbc2a8411'}

def apply(source, output):
    source, output = Path(source), Path(output)
    merge = (source / 'explorer-merge.js').read_bytes()
    index_file = source / 'index.html'
    if not index_file.exists(): index_file = source / 'explorer-live.html'
    index = index_file.read_bytes()
    explorer = (source / 'explorer.js').read_bytes()
    for name, raw in [('explorer-merge.js', merge), ('index.html', index), ('explorer.js', explorer)]:
        if hashlib.sha256(raw).hexdigest() != BASE[name]: raise ValueError('Wrong source or already patched: ' + name)
    text = merge.decode()
    start = text.index('  /* what the items were last built from, so a refresh rebuilds only when the dashboard\'s answer has changed */')
    end = text.index('  /* pick a point */', start)
    text = rep(text, text[start:end], Path(__file__).with_name('refresh996.js').read_text(), 'Map explorer refresh', 'explorer-merge.js')
    text = rep(text, "assets: p.assets || '', placedHow:", "assets: p.assets || '', ownership:p.ownership || '', location:p.location || '', placedHow:", 'Pinned references retain current ownership and destination', 'explorer-merge.js')
    body = explorer.decode()
    body = rep(body, "function search() { if (!P) return; const q", "function search() { if (!P) return; if (window.GC500Explorer && typeof window.GC500Explorer.refresh === 'function') window.GC500Explorer.refresh(true); const q", 'Search sees record received before a deferred redraw', 'explorer.js')
    body = rep(body, "reg: {name: i.name, asset_numbers: i.assets, sec: i.sec}", "reg: {name: i.name, asset_numbers: i.assets, sec: i.sec, ownership:i.ownership || '', location:i.location || ''}", 'Placed current map identities', 'explorer.js')
    body = rep(body, "reg: {name: i.name, drawing: i.drawing}", "reg: {name: i.name, drawing: i.drawing, asset_numbers:i.assets || '', ownership:i.ownership || '', location:i.location || ''}", 'Unplaced current map identities', 'explorer.js')
    body = rep(body, "String(it.reg.asset_numbers || '').includes(q) || norm(it.reg.name || '').includes(n)", "String(it.reg.asset_numbers || '').includes(q) || norm([it.reg.name,it.reg.ownership,it.reg.location].filter(Boolean).join(' ')).includes(n)", 'Map searches current ownership and location', 'explorer.js')
    # Reuse the existing result metadata line; quantity-only units never get a fake asset number.
    body = rep(body, r"${it.reg && String(it.reg.asset_numbers || '[]') !== '[]' ? ' · asset ' + esc(String(it.reg.asset_numbers).replace(/[\[\]']/g, '')) : ''}</small></button>", r"${it.reg && it.reg.asset_numbers ? ' · asset ' + esc(String(it.reg.asset_numbers).replace(/[\[\]']/g, '')) : ''}${it.reg && it.reg.ownership ? ' · ' + esc(it.reg.ownership) : ''}${it.reg && it.reg.location && norm(it.reg.location) !== norm(it.reg.name || '') ? ' · ' + esc(it.reg.location) : ''}</small></button>", 'Map result ownership and destination', 'explorer.js')
    js_digest = hashlib.sha256(body.encode()).hexdigest()
    digest = hashlib.sha256(text.encode()).hexdigest()
    html = rep(index.decode(), 'explorer-merge.js?v=b3f1bb15f5dc', 'explorer-merge.js?v=' + digest[:12], 'Map explorer script cache key', 'index.html')
    html = rep(html, 'explorer.js?v=5d9ec8fa3469', 'explorer.js?v=' + js_digest[:12], 'Map identity script cache key', 'index.html')
    output.mkdir(parents=True, exist_ok=True)
    (output / 'explorer-merge.js').write_text(text)
    (output / 'explorer.js').write_text(body)
    (output / 'index.html').write_text(html)
    return {name: hashlib.sha256((output / name).read_bytes()).hexdigest() for name in BASE}

if __name__ == '__main__':
    import json
    if len(sys.argv) != 3: raise SystemExit('Usage: patch_maps996.py SOURCE_EXPLORER_DIRECTORY OUTPUT_EXPLORER_DIRECTORY')
    print(json.dumps(apply(sys.argv[1], sys.argv[2]), indent=2))
