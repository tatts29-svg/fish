#!/usr/bin/env python3
"""Author: Andrew Fisher. Local-only Build preview. Unknown source fails closed."""
import argparse, hashlib, re
from pathlib import Path
BASE_SHA256 = '7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f'
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
raw=a.source.read_bytes()
assert hashlib.sha256(raw).hexdigest()==BASE_SHA256, 'Preview base changed; review/rebase required'
s=raw.decode();ending='</body>\n</html>';assert s.rstrip().endswith(ending) and 'id="buildcards1247-script"' not in s
root=Path(__file__).parent
SELECTED_STRIP_CSS_SHA256 = 'f808fcf0eae57b66a4d0b42e260303cf4e0a9679e50430da16b8aecac0cd7861'
assert hashlib.sha256((root/'build_cards1247.css').read_bytes()).hexdigest()==SELECTED_STRIP_CSS_SHA256, 'Selected dark-strip styling changed'
addition='<style id="buildcards1247-style">\n'+(root/'build_cards1247.css').read_text()+'\n</style>\n<script id="buildcards1247-script">\n'+(root/'build_preview_lifecycle1247.js').read_text()+'\n'+(root/'build_cards1247.js').read_text()+'\n</script>\n'
offset=s.rfind(ending);out=s[:offset]+addition+s[offset:];a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(out)
assert out.replace(addition,'')==s, 'Native source changed'
styles=lambda text: re.findall(r'<style\b[^>]*>[\s\S]*?</style>',text)
original_styles=styles(s)
new_styles=[block for block in styles(out) if 'id="buildcards1247-style"' not in block]
assert new_styles==original_styles, 'An original global or card stylesheet changed'
assert out.replace(addition,'').encode()==raw, 'Removing the preview additions must return the exact base bytes'
print('Original stylesheet blocks unchanged:',len(original_styles))
print('PREVIEW ONLY',hashlib.sha256(a.output.read_bytes()).hexdigest(),a.output)
