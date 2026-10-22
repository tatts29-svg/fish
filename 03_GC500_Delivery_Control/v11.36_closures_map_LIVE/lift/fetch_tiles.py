"""Fetch explorer tiles (byte ranges) for a sheet-pt window at level L and compose one image. Cache per tile."""
import json, os, sys, io, urllib.request
from PIL import Image
S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/tiles'
M = json.load(open('/home/user/fish/03_GC500_Delivery_Control/v11.37_card_zoom_DRAFT/tiles1137_manifest.json'))
HOST = 'https://gc500-production.up.railway.app'
def lv(L): return [l for l in M['levels'] if l['L'] == L][0]
def tile(L, x, y):
    l = lv(L); key = f'{x}_{y}'
    if key not in l['tiles']: return None
    fn = f'{S}/cache/L{L}_{x}_{y}.webp'
    if not os.path.exists(fn):
        os.makedirs(f'{S}/cache', exist_ok=True)
        off, ln = l['tiles'][key]
        req = urllib.request.Request(HOST + M['base'] + l['file'], headers={'Range': f'bytes={off}-{off+ln-1}'})
        with urllib.request.urlopen(req, timeout=60) as r: data = r.read()
        open(fn, 'wb').write(data)
    return Image.open(fn).convert('RGBA')
def window(L, x0, y0, x1, y1):
    """sheet-pt window -> RGBA image at level L (scale = 2^L device px per pt)"""
    l = lv(L); s = l['scale']; T = M['tile']; span = T / s   # pt per tile
    tx0, ty0, tx1, ty1 = int(x0 // span), int(y0 // span), int(x1 // span), int(y1 // span)
    W, H = int((x1 - x0) * s), int((y1 - y0) * s); im = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            t = tile(L, tx, ty)
            if t is None: continue
            im.paste(t, (int(tx * span * s - x0 * s), int(ty * span * s - y0 * s)), t)
    return im
if __name__ == '__main__':
    L, x0, y0, x1, y1, out = int(sys.argv[1]), *map(float, sys.argv[2:6]), sys.argv[6]
    window(L, x0, y0, x1, y1).convert('RGB').save(out); print('saved', out)
