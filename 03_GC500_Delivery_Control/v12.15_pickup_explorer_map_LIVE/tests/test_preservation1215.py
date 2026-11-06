"""Author: Andrew Fisher. Exact pickup-only scope, unchanged navigation and release guards."""
import hashlib, importlib.util, json, re, sys
from pathlib import Path
here=Path(__file__).resolve().parent.parent
base=Path(sys.argv[1]).read_text(); page=Path(sys.argv[2]).read_text()
pairs=[('v12.13_pickup_detail_LIVE','pickup1213_map.js','pickup1215_map.js'),('v12.13_pickup_detail_LIVE','pickup1213_frame.js','pickup1215_frame.js'),('v12.14_pickup_polish_LIVE','pickup1214_pdf.js','pickup1215_pdf.js')]
expected=base
for folder,old,new in pairs:
    a=(here.parent/folder/old).read_text().rstrip(); b=(here/new).read_text().rstrip()
    assert expected.count(a)==1 and page.count(b)==1
    expected=expected.replace(a,b)
expected=expected.replace('picture,pickupTarget1213,pickupPicture1213,words:','picture,pickupTarget1213,pickupPicture1213,pickupView1215,pickupViewKey1215,words:').replace("+' · v12.14'; /* v8.19 release922","+' · v12.15'; /* v8.19 release922")
oldmap=(here.parent/'v12.13_pickup_detail_LIVE/pickup1213_map.js').read_text(); newmap=(here/'pickup1215_map.js').read_text()
target=lambda s:re.search(r' function pickupTarget1213\(.*?\n }',s,re.S).group()
checks={'exact_live_base':hashlib.sha256(base.encode()).hexdigest()=='91f9006070d1269eb6e9ae807076e9146e7e52e6fbfc68a01d840f5666559a11','only_pickup_rendering_freshness_and_footer_changed':expected==page,'navigation_target_unchanged':target(oldmap)==target(newmap),'no_export_only_door_arrows':not re.search(r'(drawDoor|doorArc|arrow\()',newmap)}
spec=importlib.util.spec_from_file_location('patch',here/'patch_v1215.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for name,value in [('second_application_refused',page),('wrong_base_refused',base+'\n')]:
    try:mod.patch(value);checks[name]=False
    except ValueError:checks[name]=True
print(json.dumps(checks,indent=2));assert all(checks.values())
