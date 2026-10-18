#!/usr/bin/env python3
"""Author: Andrew Fisher. One group instrument and compact native Timeline."""
from pathlib import Path
import hashlib
import importlib.util
import sys
ROOT = Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
BASE_SHA256='a290469d9d14777ceca734d13b5f57f5da548206e15995f1bd288c851e541758'
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod

def build(raw):
 if hashlib.sha256(raw).hexdigest()!=BASE_SHA256: raise ValueError('Refusing a changed live base or repeat application')
 text=raw.decode('utf-8')
 day=module('day842',ROOT.parent/'v8.42_today_plan_clarity_LIVE/patch_v842.py').resolved_day
 old=(ROOT.parent/'v8.44_linked_completion_LIVE/today_work844_src.js').read_text()
 text=rep(text,day(old),day((ROOT/'today_work846_src.js').read_text()),'Compact group presentation','v8.46')
 old_style=module('clarity845',ROOT.parent/'v8.45_toilet_and_text_clarity_LIVE/patch_v845.py').clarity_style()
 text=rep(text,old_style,old_style+'\n<style id="today-group-v846">\n'+(ROOT/'today_group846_src.css').read_text()+'\n</style>','Group presentation style','v8.46')
 text=module('timeline846',ROOT/'timeline846_patch.py').apply(text)
 text=rep(text,'<meta name="gc500-release" content="v8.45">','<meta name="gc500-release" content="v8.46">','Release metadata','v8.46')
 text=rep(text,"+ ' · v8.45'; /* v8.19 - the footer names the release once */","+ ' · v8.46'; /* v8.19 - the footer names the release once */",'Release footer','v8.46')
 return text.encode('utf-8')
if __name__=='__main__':
 if len(sys.argv)!=2: raise SystemExit('Usage: patch_v846.py WORKING_COPY.html')
 p=Path(sys.argv[1]);p.write_bytes(build(p.read_bytes()));print('Today and Timeline presentation composed; native models preserved.')
