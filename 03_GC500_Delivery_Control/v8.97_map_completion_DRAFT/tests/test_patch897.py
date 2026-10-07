#!/usr/bin/env python3
"""Author: Andrew Fisher. Patch guards, exact copied bytes and unchanged interaction/rendering logic."""
import hashlib, json, os, re, subprocess, tempfile
from pathlib import Path
HERE = Path(__file__).resolve().parents[1]
BASE = HERE.parent / 'v8.93_maps_aligned_DRAFT/machine_code_v887_v890_v893'
passed = 0
def check(name, condition):
    global passed
    assert condition, name
    passed += 1
    print('PASS', name)
def run(*args):
    return subprocess.run(args, capture_output=True, text=True)
with tempfile.TemporaryDirectory(prefix='test897-', dir=HERE) as tmp:
    t = Path(tmp); out=t/'out'
    p=run('python3',str(HERE/'patch_explorer897.py'),str(BASE),str(out))
    check('Patch applies on current v8.93 code',p.returncode==0)
    manifest=json.loads((out/'prepared897.json').read_text())
    changed={n for n,v in manifest['files'].items() if manifest['base'].get(n)!=v['sha256']}
    check('Only explorer, merge and index change',changed=={'explorer.js','explorer-merge.js','index.html'})
    for name in ['explorer.js','explorer-merge.js']:
        data=(out/name).read_bytes(); token=hashlib.sha256(data).hexdigest()[:12]
        check(name+' script token matches output bytes',f'src="{name}?v={token}"' in (out/'index.html').read_text())
        check(name+' parses',run('node','--check',str(out/name)).returncode==0)
    before=(BASE/'explorer.js').read_text(); after=(out/'explorer.js').read_text()
    for function,next_anchor in [('selectCode','/* v6.97'),('itemAt887','function markAt'),('markAt','/* search on'),('startPulse','function stopPulse'),('placePulse','/* v7.82'),('done782Draw','let done782At')]:
        take=lambda s:s.split('function '+function+'(',1)[1].split(next_anchor,1)[0]
        check(function+' unchanged',take(before)==take(after))
    ring=lambda s:s.split('function drawMarks(',1)[1].split('const gradCache887',1)[0]
    check('Ring, label and selected-pulse rendering retained exactly',ring(before)==ring(after).replace(' tick897(ctx, c.x, c.y, r, m.it);   /* v8.97 */',''))
    check('No new animation in completion source',not re.search(r'@keyframes|requestAnimationFrame|setInterval|setTimeout', (HERE/'source/explorer897_src.js').read_text()))
    check('Existing output rejected without modification',run('python3',str(HERE/'patch_explorer897.py'),str(BASE),str(out)).returncode!=0)
    check('Reapplication rejected',run('python3',str(HERE/'patch_explorer897.py'),str(out),str(t/'twice')).returncode!=0)
    check('Input=output rejected',run('python3',str(HERE/'patch_explorer897.py'),str(BASE),str(BASE)).returncode!=0)
    broken=t/'broken';broken.mkdir()
    for f in BASE.iterdir():
        if f.is_file(): (broken/f.name).write_bytes(f.read_bytes())
    (broken/'index.html').write_text((broken/'index.html').read_text().replace('src="explorer.js?v=', 'src="wrong.js?v='))
    check('Bad script token rejected before creating output',run('python3',str(HERE/'patch_explorer897.py'),str(broken),str(t/'badout')).returncode!=0 and not (t/'badout').exists())
    page=t/'page.html'
    fixture='<body>Author: Andrew Fisher · v8.96 gc500Map887 window.gc500DoneKeys = function(){ function timeline841State( function deliveryOf( function finderRow( function assetOf(</body>'
    page.write_text(fixture)
    check('Page patch applies once',run('python3',str(HERE/'patch_v897.py'),str(page)).returncode==0)
    check('Page footer advanced once',page.read_text().count(' · v8.97')==1)
    check('Page reapplication rejected',run('python3',str(HERE/'patch_v897.py'),str(page)).returncode!=0)
    page.write_text(fixture.replace('gc500Map887','wrongBase'))
    check('Page wrong base rejected',run('python3',str(HERE/'patch_v897.py'),str(page)).returncode!=0)
print(json.dumps({'author':'Andrew Fisher','passed':passed,'failed':0,'network':False,'liveWrites':0}))
