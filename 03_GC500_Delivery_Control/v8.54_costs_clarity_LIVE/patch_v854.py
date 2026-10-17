from pathlib import Path
import hashlib,sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]); raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='8edafa7191103aa834af6b6c3091d7beba40041e0ccdb056b056709145e94549'
s=raw.decode()
for name,end in [('cj765Glance','/* a fold opened'),('pl770Card','/* v7.66')]:
 start=s.index('function '+name+'(){'); stop=s.index(end,start); old=s[start:stop];new=old.replace('money0(', 'money(')
 if name=='cj765Glance':new=new.replace('M.difference0 != null ? M.difference0','M.difference != null ? M.difference')
 else:new=new.replace('money(P.diff.now)', 'money(moneySummary().difference)')
 s=rep(s,old,new,name+' precise display','v8.54')
js=Path(__file__).with_name('costs_clarity854.js').read_text()
css=Path(__file__).with_name('costs_clarity854.css').read_text()
s=rep(s,'</head>\n<body>','<style id="costs-clarity854">'+css+'</style>\n</head>\n<body>','Scoped styles','v8.54')
s=rep(s,' window.costsAuditDecorate=decorate;',' window.costsAuditDecorate=decorate;\n'+js,'Supporting disclosures','v8.54')
s=rep(s,'<meta name="gc500-release" content="v8.53">','<meta name="gc500-release" content="v8.54">','Metadata','v8.54')
s=rep(s,"+ ' · v8.53'; /* v8.19 - the footer names the release once */","+ ' · v8.54'; /* v8.19 - the footer names the release once */",'Footer','v8.54')
p.write_text(s)
