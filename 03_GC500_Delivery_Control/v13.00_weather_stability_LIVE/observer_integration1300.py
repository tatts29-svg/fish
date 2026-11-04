"""Author: Andrew Fisher. Ignore weather controls and retain unchanged Demob staff DOM."""
from pathlib import Path
import re, sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

MARKER='/* v13.00: compare native Demob staff structure after HTML parsing */'

def apply(s):
 if MARKER in s: raise ValueError('Demob observer stability v13.00 already applied')
 def edit(script_id,old,new,label):
  nonlocal s
  matches=list(re.finditer(r'(<script\b[^>]*\bid="'+re.escape(script_id)+r'"[^>]*>)(.*?)(</script>)',s,re.S))
  if len(matches)!=1: raise ValueError('Expected one '+script_id)
  m=matches[0];body=rep(m[2],old,new,label,'Demob observer stability v13.00')
  s=s[:m.start(2)]+body+s[m.end(2):]
 edit('staff988-script',
  'const content=html(day);if(existing){if(existing.outerHTML!==content)existing.outerHTML=content;return;}',
  '''const content=html(day);if(existing){
  /* v13.00: compare native Demob staff structure after HTML parsing */
  if(pane.id==='pane-demob'){const temp=document.createElement('template');temp.innerHTML=content;const next=temp.content.firstElementChild;if(next&&!existing.isEqualNode(next))existing.replaceWith(next);}
  else if(existing.outerHTML!==content)existing.outerHTML=content;
  return;
 }''',
  'retain structurally unchanged Demob staff while refreshing changed native facts')
 edit('demobmap1236-script',
  "m.target.closest('.ov1236,.mpf1236,.sgv1238,.pg1238,.dl1238')",
  "m.target.closest('.ov1236,.mpf1236,.sgv1238,.pg1238,.dl1238,.dc996-controls')",
  'weather controls do not change equipment map decoration')
 edit('singles1238-script',
  "m.target.closest('.sgv1238,.pg1238,.dl1238')",
  "m.target.closest('.sgv1238,.pg1238,.dl1238,.dc996-controls')",
  'weather controls do not change equipment unit decoration')
 return s
