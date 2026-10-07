# Author: Andrew Fisher. Crew planning is separate from permanent unloading instructions.
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text();assert 'function crew883Key(' not in s
assert 'function unloading881Marker(' in s
s=rep(s,' · v8.81',' · v8.83','release footer',str(p))
pos=s.index('</script>',s.index('const DATA ='))
s=s[:pos]+'\n'+Path(__file__).with_name('crew883_src.js').read_text()+'\n'+s[pos:]
head=s.index('</head>');s=s[:head]+'<style>/* Author: Andrew Fisher */.crew883-body{padding:12px}.crew883-body label{display:block;margin:8px 0}.crew883-body fieldset{border:1px solid #637d83;padding:12px;margin:10px 0}.crew883-body input:not([type=checkbox]),.crew883-body select,.crew883-body textarea{width:100%;max-width:100%;box-sizing:border-box;min-height:36px;background:#102b32;color:#eef7f6;color-scheme:dark;border:1px solid #637d83;border-radius:6px;padding:6px}.crew883-body textarea{width:100%;min-height:70px}</style>'+s[head:];p.write_text(s)
