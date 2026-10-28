#!/usr/bin/env python3
"""Author: Andrew Fisher. Presentation preview only; never a publication patch."""
import argparse, hashlib
from pathlib import Path
BASE = '7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404'
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
raw=a.source.read_bytes();assert hashlib.sha256(raw).hexdigest()==BASE,'Preview requires exact reviewed v12.50'
s=raw.decode();assert 'id="pl1251-preview-script"' not in s
root=Path(__file__).parent;ending='</body>\n</html>';assert s.rstrip().endswith(ending)
addition='<style id="pl1251-preview-style">\n'+(root/'pl1251_preview.css').read_text()+'\n</style>\n<script id="pl1251-preview-script">\n'+(root/'pl1251_preview.js').read_text()+'\n</script>\n'
offset=s.rfind(ending);out=s[:offset]+addition+s[offset:]
assert out.replace(addition,'').encode()==raw,'Removing preview must recover every predecessor byte'
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(out)
print('PREVIEW ONLY',hashlib.sha256(a.output.read_bytes()).hexdigest(),len(a.output.read_bytes()))
