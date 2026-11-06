#!/usr/bin/env python3
"""Author: Andrew Fisher. Preview against exact live50; no production release."""
from pathlib import Path
import argparse,hashlib
BASE='7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404'
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
raw=a.source.read_bytes();assert hashlib.sha256(raw).hexdigest()==BASE,'Exact reviewed live50 required'
s=raw.decode();root=Path(__file__).parent
changes=[("  if (!editable()) { clearPrivate(); return; }\n  if(!admin)","  if (!editable()) { clearPrivate(); return; }\n  if (W.ServicingPreview1252 && W.ServicingPreview1252.draw()) return;\n  if(!admin)"),("async function pollRead1100() {\n  clearTimeout(timer); timer = 0;","async function pollRead1100() {\n  clearTimeout(timer); timer = 0;\n  if (W.ServicingPreview1252) { W.ServicingPreview1252.wake(); return; }")]
for old,new in changes:assert s.count(old)==1;s=s.replace(old,new)
addition='<style id="servicing1252-preview-style">\n'+(root/'servicing1252.css').read_text()+'</style>\n<script id="servicing1252-preview-script">\n'+(root/'servicing1252.js').read_text()+'</script>\n'
i=s.rfind('</body>');assert i>=0 and 'servicing1252-preview-script' not in s
s=s[:i]+addition+s[i:]
reverse=s.replace(addition,'');
for old,new in reversed(changes):assert reverse.count(new)==1;reverse=reverse.replace(new,old)
assert reverse.encode()==raw,'Preview reversal must preserve every original byte'
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(s)
print('PREVIEW ONLY',len(a.output.read_bytes()),hashlib.sha256(a.output.read_bytes()).hexdigest())
