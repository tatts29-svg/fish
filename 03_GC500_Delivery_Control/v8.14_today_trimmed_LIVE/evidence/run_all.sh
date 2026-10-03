#!/bin/bash
# Every check for v8.14 (the v7.99 suites plus v814_tests), on the built page (read-only). Run from 03_GC500_Delivery_Control.
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium} NODE_PATH=${NODE_PATH:-$(npm root -g)}
PAGE=$PWD/build/GC500_v8.14/GC500_Delivery_Control_hosted.html; BASE=$PWD/build/GC500_v8.14/base_live.html; export PAGE
T=v7.99_today_faster_fuller_DRAFT/evidence; E=v8.14_today_trimmed_DRAFT/evidence; R=$E/regress; mkdir -p $R
if [ "$(sha256sum < $PAGE)" = "$(sha256sum < $BASE)" ] || ! grep -q 'v8.14 - Today, trimmed' $PAGE; then echo 'STOP: the built page is not v8.14 (the patch did not apply)'; exit 1; fi
node $E/v814_tests.js > $E/v814.log 2>&1
(BASE=$BASE node $T/v799_tests.js > $E/v799_desktop.log 2>&1) & (MOB=1 node $T/v799_tests.js > $E/v799_phone.log 2>&1) & wait
(node v7.95_today_packed_DRAFT/evidence/packed_tests.js > $R/packed_desktop.log 2>&1) & (MOB=1 node v7.95_today_packed_DRAFT/evidence/packed_tests.js > $R/packed_phone.log 2>&1) & (node v7.96_equipment_tab_DRAFT/evidence/equipment_tests.js > $R/equipment_desktop.log 2>&1) & (MOB=1 node v7.96_equipment_tab_DRAFT/evidence/equipment_tests.js > $R/equipment_phone.log 2>&1) & wait
(node $T/results796_tests.cjs > $R/results_desktop.log 2>&1) & (MOB=1 node $T/results796_tests.cjs > $R/results_phone.log 2>&1) & (OUTD=$R node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js > $R/one_tab_desktop.log 2>&1) & (MOB=1 OUTD=$R node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js > $R/one_tab_phone.log 2>&1) & wait
(GC500_NAV_BASE=$PWD/build/GC500_v7.74/GC500_Delivery_Control_hosted.html node v7.76_navigation_performance_LIVE/evidence/navigation_regressions.js > $R/navigation.log 2>&1) & (BASE=$BASE OUT=$R/rules.json node v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js > $R/rules.log 2>&1) & (OUT=$R/fresh.json node v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js > $R/fresh.log 2>&1) & wait
(cd toolchain && node harness/sweep.js > ../$R/sweep_desktop.json 2> ../$R/sweep_desktop.err) & (cd toolchain && MOB=1 node harness/sweep.js > ../$R/sweep_phone.json 2> ../$R/sweep_phone.err) & (cd toolchain && OUT=../layout_map_02Oct2026/repeats_v814.json node harness/repeat_check.js > ../layout_map_02Oct2026/repeats_v814.txt 2>&1) & wait
BASE=$BASE node $T/same_figures.js > $E/same_figures.log 2>&1
sha256sum $PAGE
for f in $E/v814 $E/v799_desktop $E/v799_phone $R/packed_desktop $R/packed_phone $R/equipment_desktop $R/equipment_phone $R/results_desktop $R/results_phone $R/one_tab_desktop $R/one_tab_phone; do echo "$(basename $f): $(grep -c ^PASS $f.log) pass, $(grep -c ^FAIL $f.log) fail"; grep ^FAIL $f.log | cut -c1-200; done
tail -n1 $R/navigation.log $R/rules.log $R/fresh.log | grep -v '^$'; head -1 layout_map_02Oct2026/repeats_v814.txt; tail -n1 $E/same_figures.log
python3 -c "
import json
for f in ['sweep_desktop','sweep_phone']:
  s=open('$R/'+f+'.json').read(); j=json.loads(s[s.index('{'):]); t=j['tabs']
  print(f, len(t),'tabs', sum(len(v.get('errors',[])) for v in t.values()),'page errors', sum(len(v.get('console',[])) for v in t.values()),'console errors')"
