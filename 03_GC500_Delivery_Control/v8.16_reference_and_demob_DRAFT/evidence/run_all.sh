#!/bin/bash
# Every check for v8.16 (the standing suites plus v816_tests), on the built page (read-only). Run from 03_GC500_Delivery_Control.
# ONE browser test at a time: the machine is shared with heavy 3D runs, so nothing here runs in parallel, and each step
# waits while a 3D rig is running.
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium} NODE_PATH=${NODE_PATH:-$(npm root -g)}
PAGE=$PWD/build/GC500_v8.16/GC500_Delivery_Control_hosted.html; BASE=$PWD/build/GC500_v8.16/base_live.html; export PAGE
T=v7.99_today_faster_fuller_DRAFT/evidence; E=v8.16_reference_and_demob_DRAFT/evidence; R=$E/regress; mkdir -p $R
if [ "$(sha256sum < $PAGE)" = "$(sha256sum < $BASE)" ] || ! grep -q 'v8.16 - reference drawer and Demob tab' $PAGE; then echo 'STOP: the built page is not v8.16 (the patch did not apply)'; exit 1; fi
quiet() { while pgrep -f "node .*(machine_rig|people_tests|driver_tests|ui_tests|mech_tests|fx_tests)" > /dev/null; do echo "waiting: a 3D test is running"; sleep 60; done; }
step() { quiet; echo "== $1"; }
step v816;            node $E/v816_tests.js > $E/v816.log 2>&1
step v799-desktop;    BASE=$BASE node $T/v799_tests.js > $E/v799_desktop.log 2>&1
step v799-phone;      MOB=1 node $T/v799_tests.js > $E/v799_phone.log 2>&1
step packed-desktop;  node v7.95_today_packed_DRAFT/evidence/packed_tests.js > $R/packed_desktop.log 2>&1
step packed-phone;    MOB=1 node v7.95_today_packed_DRAFT/evidence/packed_tests.js > $R/packed_phone.log 2>&1
step equip-desktop;   node v7.96_equipment_tab_DRAFT/evidence/equipment_tests.js > $R/equipment_desktop.log 2>&1
step equip-phone;     MOB=1 node v7.96_equipment_tab_DRAFT/evidence/equipment_tests.js > $R/equipment_phone.log 2>&1
step results-desktop; node $T/results796_tests.cjs > $R/results_desktop.log 2>&1
step results-phone;   MOB=1 node $T/results796_tests.cjs > $R/results_phone.log 2>&1
step onetab-desktop;  OUTD=$R node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js > $R/one_tab_desktop.log 2>&1
step onetab-phone;    MOB=1 OUTD=$R node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js > $R/one_tab_phone.log 2>&1
step navigation;      GC500_NAV_BASE=$PWD/build/GC500_v7.74/GC500_Delivery_Control_hosted.html node v7.76_navigation_performance_LIVE/evidence/navigation_regressions.js > $R/navigation.log 2>&1
step rules;           BASE=$BASE OUT=$R/rules.json node v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js > $R/rules.log 2>&1
step fresh;           OUT=$R/fresh.json node v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js > $R/fresh.log 2>&1
step sweep-desktop;   (cd toolchain && node harness/sweep.js > ../$R/sweep_desktop.json 2> ../$R/sweep_desktop.err)
step sweep-phone;     (cd toolchain && MOB=1 node harness/sweep.js > ../$R/sweep_phone.json 2> ../$R/sweep_phone.err)
step repeat-check;    (cd toolchain && OUT=../layout_map_02Oct2026/repeats_v816.json node harness/repeat_check.js > ../layout_map_02Oct2026/repeats_v816.txt 2>&1)
step same-figures;    BASE=$BASE node $T/same_figures.js > $E/same_figures.log 2>&1
sha256sum $PAGE
for f in $E/v816 $E/v799_desktop $E/v799_phone $R/packed_desktop $R/packed_phone $R/equipment_desktop $R/equipment_phone $R/results_desktop $R/results_phone $R/one_tab_desktop $R/one_tab_phone; do echo "$(basename $f): $(grep -c ^PASS $f.log) pass, $(grep -c ^FAIL $f.log) fail"; grep ^FAIL $f.log | cut -c1-200; done
tail -n1 $R/navigation.log $R/rules.log $R/fresh.log | grep -v '^$'; head -1 layout_map_02Oct2026/repeats_v816.txt; tail -n1 $E/same_figures.log
python3 -c "
import json
for f in ['sweep_desktop','sweep_phone']:
  s=open('$R/'+f+'.json').read(); j=json.loads(s[s.index('{'):]); t=j['tabs']
  print(f, len(t),'tabs', sum(len(v.get('errors',[])) for v in t.values()),'page errors', sum(len(v.get('console',[])) for v in t.values()),'console errors', len(j.get('allErrors',[])), 'all errors', len(j.get('cons',[])), 'console')"
# the standing suites write their own evidence into their release folders; put those back (git checkout --) afterwards:
#   git status --short -- v7.95_today_packed_DRAFT v7.96_equipment_tab_DRAFT v7.99_today_faster_fuller_DRAFT v7.93_one_tab_today_DRAFT
