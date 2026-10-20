# Author: Andrew Fisher. v8.93: the pyramid manifest's boot block (it lets the explorer open before the scene has loaded)
# rebuilt from the v8.93 scene, so its meta carries the window-clip note and names this scene, not v8.90's.
#   python3 boot893.py <assets dir>      (vt/boot.json and vt/manifest.json are rewritten in place, same formatting)
import gzip, hashlib, json, os, sys
A = sys.argv[1]
raw = open(os.path.join(A, 'drawing-scene.bin'), 'rb').read(); S = json.loads(gzip.decompress(raw)); tok = hashlib.sha256(raw).hexdigest()[:12]
def rewrite(path, change):
    text = open(path).read(); obj = json.loads(text)
    fmt = next((f for f in (dict(separators=(',', ':')), dict(separators=(', ', ': ')), dict(indent=1), dict(indent=2), dict(indent=1, ensure_ascii=False), dict(separators=(',', ':'), ensure_ascii=False))
                if json.dumps(obj, **f) == text or json.dumps(obj, **f) + '\n' == text), None)
    assert fmt, 'formatting of ' + path
    change(obj); out = json.dumps(obj, **fmt) + ('\n' if text.endswith('\n') else '')
    open(path, 'w').write(out); return obj
def fix_boot(b):
    b['note'] = 'lets the explorer open without the scene; v8.93: the 2 Oct issue in the 17 Sep frame, the main plan window clipping its content at 74.96 pt (drawing-scene.bin %s)' % tok
    b['meta'] = S['meta']; b['count'] = len(S['r']); b['images'] = sum(1 for r in S['r'] if r[5] == -1)
boot = rewrite(os.path.join(A, 'vt', 'boot.json'), fix_boot)
def fix_man(m): m['boot'] = boot
rewrite(os.path.join(A, 'vt', 'manifest.json'), fix_man)
print('boot rebuilt: token', tok, '| records', boot['count'], '| images', boot['images'], '| meta keys', list(boot['meta'].keys()))
