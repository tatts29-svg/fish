#!/bin/bash
# Every check for v8.19 on the built page (read-only), one browser suite at a time under the shared browser lock.
# Run from 03_GC500_Delivery_Control:   SCRATCH=<dir> bash v8.19_meet_points_ep_plan_DRAFT/evidence/run_all.sh
# SCRATCH holds the screenshots, the run-sheet PDFs and the private reference assignment (SCRATCH/event_portables/work/assign.py).
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium} NODE_PATH=${NODE_PATH:-$(npm root -g)}
PAGE=$PWD/build/GC500_v8.19/GC500_Delivery_Control_hosted.html; BASE=$PWD/build/GC500_v8.19/base_live.html; export PAGE
T=v7.99_today_faster_fuller_DRAFT/evidence; E=v8.19_meet_points_ep_plan_DRAFT/evidence; R=$E/regress; mkdir -p $R
SCRATCH=${SCRATCH:?give SCRATCH}; SHOTS=$SCRATCH/v819/final; mkdir -p $SHOTS
LOCK=${BROWSER_LOCK:-$SCRATCH/browser.lock}
if [ "$(sha256sum < $PAGE)" = "$(sha256sum < $BASE)" ] || ! grep -q 'function meetPoint819(' $PAGE; then echo 'STOP: the built page is not v8.19'; exit 1; fi
step() { echo "== $1"; }
step probe;           flock "$LOCK" env OUT=$SCRATCH/v819/probe819.json node $E/probe819.js > $E/probe819.log 2>&1
step assign;          python3 $E/assign_check819.py $SCRATCH/v819/probe819.json $SCRATCH/event_portables/work > $E/assign_check819.log 2>&1
step v819;            SHOTS=$SHOTS flock "$LOCK" node $E/v819_tests.js > $E/v819.log 2>&1
step qr;              python3 $E/qr_decode819.py $SHOTS > $E/qr_decode819.log 2>&1
step v799-desktop;    BASE=$BASE flock "$LOCK" node $T/v799_tests.js > $R/v799_desktop.log 2>&1
step v799-phone;      MOB=1 flock "$LOCK" node $T/v799_tests.js > $R/v799_phone.log 2>&1
step packed-desktop;  flock "$LOCK" node v7.95_today_packed_DRAFT/evidence/packed_tests.js > $R/packed_desktop.log 2>&1
step packed-phone;    MOB=1 flock "$LOCK" node v7.95_today_packed_DRAFT/evidence/packed_tests.js > $R/packed_phone.log 2>&1
step equip-desktop;   flock "$LOCK" node v7.96_equipment_tab_LIVE/evidence/equipment_tests.js > $R/equipment_desktop.log 2>&1
step equip-phone;     MOB=1 flock "$LOCK" node v7.96_equipment_tab_LIVE/evidence/equipment_tests.js > $R/equipment_phone.log 2>&1
step results-desktop; flock "$LOCK" node $T/results796_tests.cjs > $R/results_desktop.log 2>&1
step results-phone;   MOB=1 flock "$LOCK" node $T/results796_tests.cjs > $R/results_phone.log 2>&1
step onetab-desktop;  OUTD=$R flock "$LOCK" node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js > $R/one_tab_desktop.log 2>&1
step onetab-phone;    MOB=1 OUTD=$R flock "$LOCK" node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js > $R/one_tab_phone.log 2>&1
step rules;           BASE=$BASE OUT=$R/rules.json flock "$LOCK" node v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js > $R/rules.log 2>&1
step fresh;           OUT=$R/fresh.json flock "$LOCK" node v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js > $R/fresh.log 2>&1
step sweep-desktop;   (cd toolchain && flock "$LOCK" node harness/sweep.js > ../$R/sweep_desktop.json 2> ../$R/sweep_desktop.err)
step sweep-phone;     (cd toolchain && MOB=1 flock "$LOCK" node harness/sweep.js > ../$R/sweep_phone.json 2> ../$R/sweep_phone.err)
step same-figures;    BASE=$BASE flock "$LOCK" node $T/same_figures.js > $R/same_figures.log 2>&1
sha256sum $PAGE $BASE
tail -n2 $E/assign_check819.log; tail -n1 $E/v819.log; tail -n2 $E/qr_decode819.log
for f in $R/v799_desktop $R/v799_phone $R/packed_desktop $R/packed_phone $R/equipment_desktop $R/equipment_phone $R/results_desktop $R/results_phone $R/one_tab_desktop $R/one_tab_phone; do echo "$(basename $f): $(grep -c ^PASS $f.log) pass, $(grep -c ^FAIL $f.log) fail"; grep ^FAIL $f.log | cut -c1-200; done
tail -n1 $R/rules.log $R/fresh.log | grep -v '^$'; tail -n1 $R/same_figures.log
python3 -c "
import json
for f in ['sweep_desktop','sweep_phone']:
  s=open('$R/'+f+'.json').read(); j=json.loads(s[s.index('{'):]); t=j['tabs']
  print(f, len(t),'tabs', sum(1 for v in t.values() if v.get('shown')),'shown', len(j['hashes']),'links', sum(len(v.get('errors',[])) for v in t.values()),'page errors', sum(len(v.get('console',[])) for v in t.values()),'console errors', len(j.get('allErrors',[])), 'all errors', len(j.get('cons',[])), 'console', 'back', j.get('back'))"
# the standing suites write their own evidence into their release folders; those are put back afterwards with git checkout --
