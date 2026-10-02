#!/bin/bash
# Every check for v8.15 on the built page (read only). Run from 03_GC500_Delivery_Control. One browser at a time,
# and only while no 3D test run is going (the machine is shared).
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium} NODE_PATH=${NODE_PATH:-$(npm root -g)}
PAGE=$PWD/build/GC500_v8.15/GC500_Delivery_Control_hosted.html; BASE=$PWD/build/GC500_v8.15/base_live.html; export PAGE BASE
E=v8.15_documents_clean_DRAFT/evidence
if [ "$(sha256sum < $PAGE)" = "$(sha256sum < $BASE)" ] || ! grep -q 'v8.15 - Documents, cleaned up' $PAGE; then echo 'STOP: the built page is not v8.15'; exit 1; fi
quiet(){ while ps -eo args | grep -E 'machine_rig|people_tests|driver_tests|ui_tests|mech_tests|fx_tests' | grep -v grep | grep -qE 'node |python'; do sleep 60; done; }
quiet; OUT=$E/heights.json node $E/v815_tests.js > $E/v815.log 2>&1
quiet; (cd toolchain && node harness/sweep.js > ../$E/sweep_desktop.json 2> ../$E/sweep_desktop.err)
quiet; (cd toolchain && MOB=1 node harness/sweep.js > ../$E/sweep_phone.json 2> ../$E/sweep_phone.err)
quiet; (cd toolchain && OUT=../$E/repeats_v815.json node harness/repeat_check.js > ../$E/repeats_v815.txt 2>&1)
sha256sum $PAGE
echo "v815: $(grep -c ^PASS $E/v815.log) pass, $(grep -c ^FAIL $E/v815.log) fail"; grep ^FAIL $E/v815.log | cut -c1-200
head -3 $E/repeats_v815.txt
python3 -c "
import json
for f in ['sweep_desktop','sweep_phone']:
  s=open('$E/'+f+'.json').read(); j=json.loads(s[s.index('{'):]); t=j['tabs']
  print(f, len(t),'tabs', sum(len(v.get('errors',[])) for v in t.values()),'page errors', sum(len(v.get('console',[])) for v in t.values()),'console errors', len(j.get('allErrors',[])), 'all errors')"
