# Author: Andrew Fisher. Exact source boundaries, supported version inputs, refusal of duplicate application.
from pathlib import Path
import sys,re,subprocess,tempfile
base=Path(sys.argv[1]);here=Path(__file__).resolve().parents[1];a=base.read_text(encoding='utf-8-sig')
with tempfile.TemporaryDirectory() as d:
 for version in [37,38,39]:
  original=re.sub(r" · v9\.(37|38|39)'; /\* v8.19",f" · v9.{version}'; /* v8.19",a);p=Path(d)/f'{version}.html';p.write_text(original);subprocess.run([sys.executable,str(here/'patch_v940.py'),str(p)],check=True)
  b=p.read_text();b=b.replace(" · v9.40'; /* v8.19",f" · v9.{version}'; /* v8.19")
  b=re.sub(r" // Author: Andrew Fisher\. numbering940:.*?\n const content=",' const content=',b,flags=re.S)
  b=b.replace('\npages.forEach((p,i)=>','\n pages.forEach((p,i)=>')
  b=b.replace("const label=p.querySelector('.dp-pages899')||document.createElement('span');","const label=document.createElement('span');")
  b=re.sub(r'// Author: Andrew Fisher\. Fit a location reference.*?function dpFit\(root\) \{','function dpFit(root) {',b,flags=re.S)
  b=b.replace("  if(pg.classList.contains('pl782')){plFit940(pg);continue;}\n  if(pg.dataset.continuation899)continue;","  if(pg.classList.contains('pl782')||pg.dataset.continuation899)continue;")
  
  assert b==original,'Only pagination/sign-fit/footer source may change'
  again=subprocess.run([sys.executable,str(here/'patch_v940.py'),str(p)],capture_output=True);assert again.returncode!=0
print('PASS source37/38/39 exact pagination/sign-fit/footer boundaries; duplicate application refused')
