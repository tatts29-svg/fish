# Author: Andrew Fisher. Minimal source delta and bounded release input.
from pathlib import Path
import re,subprocess,tempfile,sys
base=Path(sys.argv[1]);root=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'page.html';p.write_bytes(base.read_bytes());subprocess.run([sys.executable,str(root/'patch_v936.py'),str(p)],check=True)
 a=base.read_text(encoding='utf-8-sig');b=p.read_text(encoding='utf-8-sig')
 undo=b.replace('// Author: Andrew Fisher. Native hold is released in finally; no persistent supplier cache.\nfunction renderSubhired932(){ return holdAssets(renderSubhired936Held); }\nfunction renderSubhired936Held(){','function renderSubhired932(){')
 v=re.search(r" · v9\.(34|35)'; /\* v8.19",a).group(0);undo=undo.replace(" · v9.36'; /* v8.19",v)
 assert undo==a,'Only footer and wrapper may change'
 again=subprocess.run([sys.executable,str(root/'patch_v936.py'),str(p)],capture_output=True);assert again.returncode!=0
 print('PASS exact source-only wrapper/footer delta and duplicate application refusal')
