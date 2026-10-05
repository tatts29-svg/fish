#!/usr/bin/env python3
"""Author: Andrew Fisher. Add the read-only Fencing bridge to the exact v8.27 page.
The source catalogue is a separately supplied private input, never bundled here.
This patch performs no network requests, operational writes or asset registration.
"""
from pathlib import Path
import hashlib,json,os,sys,re
HERE=Path(__file__).resolve().parent
sys.path.insert(0,os.environ.get('GC500_TOOLCHAIN',str(HERE.parent/'toolchain')))
from rep import rep
BASE_SHA='f7126dd4e0d3217bfc1eb926c401a7668aa3d72f14a9e670fd186d33a9f1c01f'
def sha(b):return hashlib.sha256(b).hexdigest()
def exact(text,old,new,label):
    if text.count(old)!=1:raise ValueError('Expected exactly one '+label)
    # rep includes leading indentation in its match. Retain it byte-for-byte.
    start=text.index(old);prefix=re.search(r'[ \t]*$',text[:start]).group(0)
    result=rep(text,old,prefix+new,label,'private host input')
    if result!=text.replace(old,new,1):raise ValueError('Unexpected whitespace change: '+label)
    return result
def build(raw,catalogue_raw,expected_input_sha,source_raw):
    if sha(raw)!=BASE_SHA:raise ValueError('Expected the exact final v8.27 input')
    if sha(catalogue_raw)!=expected_input_sha:raise ValueError('Private catalogue changed; review and freeze again')
    data=json.loads(catalogue_raw)
    if not isinstance(data,dict) or not isinstance(data.get('sources'),list) or not isinstance(data.get('geometry'),list):raise ValueError('Invalid private catalogue')
    source=source_raw.decode('utf-8')
    if source.count('__FENCING_PRIVATE_INPUT_JSON__')!=1:raise ValueError('Expected one private-input slot')
    source=source.replace('__FENCING_PRIVATE_INPUT_JSON__',json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'))
    if '</script' in source.lower():raise ValueError('Source closes script')
    text=raw.decode('utf-8')
    if 'gc500FencingMapSnapshot' in text:raise ValueError('Fencing bridge already applied')
    text=exact(text,'function renderFencing(){',source+'\nfunction renderFencing(){','install fencing bridge')
    text=exact(text,"$('#pane-fencing').innerHTML = paneHeadingHtml('fencing') + `","$('#pane-fencing').innerHTML = paneHeadingHtml('fencing') + `\n <p><button class=\"btn\" data-open-fencing-map>View fencing on map →</button></p>",'add fencing map link')
    text=exact(text,' state.tab = tab; setHash(tab); renderTabs();',' state.tab = tab; setHash(tab); renderTabs();\n if(window.gc500FencingMapVisibility)window.gc500FencingMapVisibility(tab==="map");','follow native tab visibility')
    text=exact(text,'function expStash(){','function expStash(){\n if(window.gc500FencingMapVisibility)window.gc500FencingMapVisibility(false);','park fencing layer')
    text=exact(text,' chPickBanner(); expRefresh(); /* v7.02',' if(window.gc500FencingMapVisibility)window.gc500FencingMapVisibility(true);\n chPickBanner(); expRefresh(); /* v7.02','resume fencing layer')
    text=exact(text,'<meta name="gc500-release" content="v8.27">','<meta name="gc500-release" content="v8.28">','release meta')
    text=exact(text,"+ ' · v8.27'; /* v8.19 - the footer names the release once */","+ ' · v8.28'; /* v8.19 - the footer names the release once */",'release footer')
    return text.encode('utf-8')
if __name__=='__main__':
    if len(sys.argv) not in (2,3):raise SystemExit('Usage: patch_v828.py PRIVATE_WORKING_COPY.html [PRIVATE_OUTPUT.html]')
    src=Path(sys.argv[1]);out=Path(sys.argv[-1])
    if len(sys.argv)==3 and src.resolve()==out.resolve():raise SystemExit('Two-path mode requires a separate output')
    private_path=os.environ.get('GC500_FENCING_INPUT','');expected=os.environ.get('GC500_FENCING_INPUT_SHA256','')
    if not private_path or len(expected)!=64:raise SystemExit('Provide the approved private catalogue path and full SHA-256 through environment variables')
    result=build(src.read_bytes(),Path(private_path).read_bytes(),expected,(HERE/'source/fencing-map-host.js').read_bytes())
    out.write_bytes(result);print(sha(result))
