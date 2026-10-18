#!/usr/bin/env python3
"""Author: Andrew Fisher. Compact figures and accessible supporting disclosures."""
from pathlib import Path
import hashlib
import sys
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
BASE='1b24ad4e267d23f4ae20b03968551d275afda0c29d527f63aee62388ed9ac222'
def build(raw):
    if hashlib.sha256(raw).hexdigest()!=BASE:
        raise ValueError('Refusing changed live base or repeated patch')
    text=raw.decode('utf-8')
    if 'function fencePresentationFold851(' in text:
        raise ValueError('Already applied')
    text=rep(text,'const FENCE_COMPONENTS_VIEW849 = ',(ROOT/'clean_notes851_ui.js').read_text()+'\nconst FENCE_COMPONENTS_VIEW849 = ','Supporting disclosure helper','v8.51')
    for name,next_name,file in [('fenceComponentLinks849','fenceComponentGuideOutput849','clean_links851_ui.js'),('renderFenceComponents849','bindFenceComponents849','clean_components851_ui.js')]:
        a=text.index('function '+name+'(');b=text.index('function '+next_name+'(',a)
        original=text[a:b].rstrip()
        text=rep(text,original,(ROOT/file).read_text().rstrip(),'Compact '+name,'v8.51')
    a=text.index('function captureFenceComponents849(');b=text.index('function renderFenceComponents849(',a)
    original=text[a:b].rstrip()
    text=rep(text,original,(ROOT/'clean_focus851_ui.js').read_text().rstrip(),'Active notes focus and scroll','v8.51')
    a=text.index('function renderPrestarts_held(){');b=text.index('async function prestartUpload(',a)
    original=text[a:b].rstrip()
    replacement=(ROOT/'clean_prestarts851_ui.js').read_text().split('\n',1)[1].rstrip()
    # This older renderer retains CRLF blank lines; replace its exact guarded
    # source once without normalising other legacy page bytes.
    if text.count(original)!=1:raise ValueError('Pre-start renderer boundary differs')
    text=text.replace(original,replacement,1)
    original=(ROOT.parent/'v8.50_po_gate_progress_LIVE/po_evidence850_ui.js').read_text().rstrip()
    text=rep(text,original,(ROOT/'clean_po851_ui.js').read_text().rstrip(),'P/O supporting details','v8.51')
    text=rep(text,'<style id="private-equipment-demob-refresh">','<style id="clean-data-v851">\n'+(ROOT/'clean_layout851.css').read_text()+'\n</style>\n<style id="private-equipment-demob-refresh">','Equipment grid containment','v8.51')
    text=rep(text,'<meta name="gc500-release" content="v8.50">','<meta name="gc500-release" content="v8.51">','Release metadata','v8.51')
    text=rep(text,"+ ' · v8.50'; /* v8.19 - the footer names the release once */","+ ' · v8.51'; /* v8.19 - the footer names the release once */",'Release footer','v8.51')
    return text.encode('utf-8')
if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Usage: patch_v851.py WORKING_COPY.html')
    path=Path(sys.argv[1]);path.write_bytes(build(path.read_bytes()))
    print('Compacted source notes and duplicate paper links; figures and records preserved.')
