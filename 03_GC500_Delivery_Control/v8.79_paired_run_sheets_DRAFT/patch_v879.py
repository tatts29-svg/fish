# Author: Andrew Fisher. Native print presentation only.
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text();assert 'function paired879Sets(' not in s
s=rep(s,' · v8.76',' · v8.79','release footer',str(p))
css='.paired879{margin:12px 0;color:#111}.paired879 h3{margin:0 0 4px;font-size:22px}.paired879 p{margin:0 0 12px;font-size:16px}.paired879 table{border-collapse:collapse;width:100%;table-layout:auto}.paired879 th,.paired879 td{border:1.5px solid #333;padding:10px;text-align:left;font-size:16px}.paired879 thead{background:#eee}.paired879 td b{font-size:20px;white-space:nowrap}.paired879 tbody tr:nth-child(2n+1){border-top:2px solid #111}.rs-id:has(.paired879){grid-template-columns:1fr}.rs-id .paired879{width:100%}@media(max-width:500px){.paired879 th,.paired879 td{padding:5px;font-size:12px}.paired879 td b{font-size:15px}}'
s=s.replace('</head>','<style>'+css+'</style></head>',1)
pos=s.index('</script>',s.index('const DATA ='));s=s[:pos]+Path(__file__).with_name('paired879_src.js').read_text()+'\n'+s[pos:];p.write_text(s)
