#!/bin/sh
# scrub, syntax-check, and upload the page to the local test server: ./rebuild.sh <page.html>
cd /tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad
P=$1
python3 scrub_attributions.py $P | tail -1
python3 - "$P" <<'PY'
import re,subprocess,sys
t=open(sys.argv[1],encoding='utf-8').read()
bl=re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>',t,re.S); bad=0
for i,b in enumerate(bl):
    open(f'chk{i}.js','w').write(b); r=subprocess.run(['node','--check',f'chk{i}.js'],capture_output=True,text=True)
    if r.returncode: bad+=1; print(i,r.stderr[:600])
print('scripts',len(bl),'bad',bad); sys.exit(1 if bad else 0)
PY
[ $? -eq 0 ] || exit 1
cp $P kit600/GC500_v6.00_reimport/GC500_Delivery_Control_hosted.html && GC500_BASE=http://127.0.0.1:8814 GC500_EDIT_TOKEN=edittokenedittoken1 python3 upload_kit.py kit600/GC500_v6.00_reimport 2>&1 | grep -o '^page: [0-9]*'
