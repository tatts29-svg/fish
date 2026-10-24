"""Author: Andrew Fisher. Stop rendering unseen UHD pixels; retain native 4K detail."""
import hashlib,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
def patch(html):
 if 'root.ShowcaseDisplay1209=' in html:raise ValueError('v12.09 already applied')
 if hashlib.sha256(html.encode()).hexdigest()!=(HERE/'BASE_SHA256').read_text().strip():raise ValueError('Exact live base changed; rebuild and retest')
 for name,file in [('CLARITY','clarity1209_src.js'),('SMOOTH','smooth1209_src.js')]:
  want=(HERE/(name+'_SHA256')).read_text().strip();matches=[m[2] for m in re.finditer(r'<script([^>]*)>([\s\S]*?)</script>',html) if hashlib.sha256(m[2].encode()).hexdigest()==want]
  if len(matches)!=1:raise ValueError(name+' source changed')
  html=rep(html,matches[0],(HERE/file).read_text(),name,'page')
 f=re.search(r"\+' · v(\d+\.\d+)'; /\* v8.19 release922",html)
 return rep(html,f[0],"+' · v12.09'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v12.09 display workload applied')
