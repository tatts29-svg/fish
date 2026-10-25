"""Author: Andrew Fisher. Only the pickup renderer and release footer may change."""
import hashlib,importlib.util,json,re,sys
from pathlib import Path
here=Path(__file__).resolve().parent.parent
base=Path(sys.argv[1]).read_text();page=Path(sys.argv[2]).read_text()
old=(here.parent/'v12.13_pickup_detail_LIVE/pickup1213_pdf.js').read_text()
new=(here/'pickup1214_pdf.js').read_text()
checks={'exact_live_base':hashlib.sha256(base.encode()).hexdigest()=='8b524dbcb293d487c04465734d03df5182a74ef75a8214c03559bf674a2066cf',
 'only_pdf_and_version_changed':base.replace(old,new).replace("+' · v12.13'; /* v8.19 release922","+' · v12.14'; /* v8.19 release922")==page,
 'exact_one_renderer':base.count(old)==page.count(new)==1}
spec=importlib.util.spec_from_file_location('patch',here/'patch_v1214.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for name,value in [('second_application_refused',page),('wrong_base_refused',base+'\n')]:
 try:mod.patch(value);checks[name]=False
 except ValueError:checks[name]=True
print(json.dumps(checks,indent=2));assert all(checks.values())
