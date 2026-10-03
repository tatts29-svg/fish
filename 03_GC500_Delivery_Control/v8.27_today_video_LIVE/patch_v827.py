"""Author: Andrew Fisher. Apply the bounded Today-video repair to the exact private v8.26 page.
This loader performs no network request or operational write. Input HTML is not distributable source.
"""
from pathlib import Path
import hashlib,sys
BASE_SHA='cde8d4295b58d6f0ec85d46b49091698afd847bc4f49a4bad90a2c14d17c595e'
SOURCE_SHA='f2eae8aa0ef0580b5621b82493d80dc74166348a593e43b372dade7a14e58f60'
EXPECTED_OUTPUT_SHA='f7126dd4e0d3217bfc1eb926c401a7668aa3d72f14a9e670fd186d33a9f1c01f'
def sha(raw): return hashlib.sha256(raw).hexdigest()
def build(raw,source_bytes):
    if sha(raw)!=BASE_SHA: raise ValueError('Expected the approved exact v8.26 private input')
    if sha(source_bytes)!=SOURCE_SHA: raise ValueError('Video patch source changed; review and freeze again')
    namespace={'__name__':'_gc500_video_patch','__file__':str(Path(__file__).with_name('main_video_patch.py'))}
    exec(compile(source_bytes,namespace['__file__'],'exec'),namespace)
    result=namespace['apply'](raw.decode('utf-8'))
    labels=[('<meta name="gc500-release" content="v8.26">','<meta name="gc500-release" content="v8.27">'),("+ ' · v8.26'; /* v8.19 - the footer names the release once */","+ ' · v8.27'; /* v8.19 - the footer names the release once */")]
    for old,new in labels:
        if result.count(old)!=1: raise ValueError('Expected exactly one release label: '+old)
        result=result.replace(old,new,1)
    result=result.encode('utf-8')
    if sha(result)!=EXPECTED_OUTPUT_SHA: raise ValueError('Unexpected candidate bytes')
    return result
if __name__=='__main__':
    if len(sys.argv)==2:
        src=out=Path(sys.argv[1]) # standard build.sh patches its private working copy in place
    elif len(sys.argv)==3:
        src,out=map(Path,sys.argv[1:])
        if src.resolve()==out.resolve(): raise SystemExit('Two-path mode requires separate input and output files')
    else: raise SystemExit('Usage: patch_v827.py PRIVATE_WORKING_COPY.html [PRIVATE_OUTPUT.html]')
    source=Path(__file__).with_name('main_video_patch.py').read_bytes()
    result=build(src.read_bytes(),source)
    out.write_bytes(result)
    print(sha(result))
