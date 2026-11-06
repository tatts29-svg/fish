#!/bin/bash
# v8.87 candidate: the new explorer checks, the before/after measurements, then every regression suite - one browser at a time
S=/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad
M=$S/mx887
cd /home/user/fish/03_GC500_Delivery_Control
E=v8.87_map_explorer_DRAFT/evidence
B=build/GC500_v8.87
X=$PWD/v8.87_map_explorer_DRAFT/explorer
LIVEX=$M/live_explorer
mkdir -p $E/shots $M/shots885
$M/rebuild887.sh > $M/rebuild.out 2>&1 || { echo "REBUILD FAILED"; cat $M/rebuild.out; exit 1; }
export NODE_PATH=$PWD/toolchain/node_modules CHROMIUM_PATH=/opt/pw-browsers/chromium PAGE=$PWD/$B/GC500_Delivery_Control_hosted.html
echo "candidate $(sha256sum $PAGE | cut -c1-16) base $(sha256sum $B/base_live.html | cut -c1-16) explorer $(sha256sum $X/index.html | cut -c1-12)"
R(){ GC500_CACHE=$(mktemp -d -p $S) MOB=$2 timeout 600 node $1 > $3 2>&1; echo "$(basename $3 .log) exit $? pass $(grep -c '^PASS' $3) fail $(grep -c '^FAIL' $3) $(grep -o '[0-9]*/[0-9]*$' $3 | tail -1)"; }
# the new checks, laptop and phone, against the prepared explorer
for m in "" 1; do w=$([ -n "$m" ] && echo phone || echo laptop)
  GC500_CACHE=$(mktemp -d -p $S) MOB=$m LOCAL=$X OUT=$E/shots timeout 600 node v8.87_map_explorer_DRAFT/tests/test_explorer887.cjs > $E/explorer887_$w.log 2>&1; echo "explorer887_$w exit $? pass $(grep -c '^PASS' $E/explorer887_$w.log) fail $(grep -c '^FAIL' $E/explorer887_$w.log) $(grep -o '[0-9]*/[0-9]*$' $E/explorer887_$w.log | tail -1)"
done
# before (the live v8.64 explorer files) and after (the prepared files), laptop and phone
for m in "" 1; do w=$([ -n "$m" ] && echo phone || echo laptop)
  for tag in live v887; do loc=$([ $tag = live ] && echo $LIVEX || echo $X)
    GC500_CACHE=$(mktemp -d -p $S) MOB=$m LOCAL=$loc TAG=$tag OUT=$E timeout 900 node v8.87_map_explorer_DRAFT/tests/perf887.cjs > $E/perf887_${tag}_$w.log 2>&1; echo "perf887_${tag}_$w exit $? lines $(grep -c '^{' $E/perf887_${tag}_$w.log)"
  done
done
# the page regression suites (as run885.sh)
python3 v8.75_schedule_lifting_LIVE/tests/test_source875.py $B/base_live.html $PAGE > $E/source_identity.log 2>&1; echo "source_identity exit $? $(tail -1 $E/source_identity.log)"
node v8.85_where_we_are_DRAFT/tests/test_model881.cjs > $E/model881.log 2>&1; echo "model881 exit $? $(tail -1 $E/model881.log)"
for w in 2560 1600 1440; do GC500_CACHE=$(mktemp -d -p $S) W=$w H=$([ $w = 2560 ] && echo 1370 || echo 1000) OUT=$M/shots885 timeout 600 node v8.85_where_we_are_DRAFT/tests/test_where885.cjs > $E/where885_$w.log 2>&1; echo "where885_$w exit $? $(tail -1 $E/where885_$w.log)"; done
GC500_CACHE=$(mktemp -d -p $S) MOB=1 OUT=$M/shots885 timeout 600 node v8.85_where_we_are_DRAFT/tests/test_where885.cjs > $E/where885_phone.log 2>&1; echo "where885_phone exit $? $(tail -1 $E/where885_phone.log)"
for w in 2560 1600 1440; do GC500_CACHE=$(mktemp -d -p $S) W=$w timeout 600 node v8.84_today_wide_layout_DRAFT/tests/test_wide884.cjs > $E/wide884_$w.log 2>&1; echo "wide884_$w exit $? $(tail -1 $E/wide884_$w.log)"; done
GC500_CACHE=$(mktemp -d -p $S) MOB=1 timeout 600 node v8.84_today_wide_layout_DRAFT/tests/test_wide884.cjs > $E/wide884_phone.log 2>&1; echo "wide884_phone exit $? $(tail -1 $E/wide884_phone.log)"
for m in "" 1; do w=$([ -n "$m" ] && echo phone || echo laptop)
R v8.76_today_layout_LIVE/tests/test_layout876.cjs "$m" $E/layout876_$w.log
R v8.83_crew_planning_LIVE/tests/test_crew883.cjs "$m" $E/crew883_$w.log
R v8.74_vms_today_LIVE/tests/test_vms874.cjs "$m" $E/vms874_$w.log
R v8.66_finance_handover_LIVE/tests/test_handover866.cjs "$m" $E/finance866_$w.log
R v8.73_asset_priority_LIVE/tests/test_asset873.cjs "$m" $E/asset873_$w.log
R v8.72_timeline_loading_LIVE/tests/test_loading872.cjs "$m" $E/loading872_$w.log
R v8.81_unloading_LIVE/tests/test_unloading881.cjs "$m" $E/unloading881_$w.log
R v8.81_unloading_LIVE/tests/test_paired881.cjs "$m" $E/paired881_$w.log
R v8.75_schedule_lifting_LIVE/tests/test_handling875.cjs "$m" $E/handling875_$w.log
R v8.79_paired_run_sheets_LIVE/tests/test_paired879.cjs "$m" $E/paired879_$w.log
R toolchain/harness/sweep.js "$m" $E/sweep_$w.log
python3 -c "
import json;d=json.load(open('$E/sweep_$w.log'));t=d['tabs'];print('  sweep $w: shown',sum(v['shown'] for v in t.values()),'errors',sum(len(v['errors']) for v in t.values())+len(d['allErrors']),'blocked',d['counts']['blocked'])"
done
for t in v8.71_baseplan_schedule4_LIVE/tests/test_v871.cjs v8.70_supplier_confirmation_LIVE/tests/test_supplier870.cjs v8.69_kinp_installation_LIVE/tests/test_kinp869.cjs; do R $t "" $E/$(basename $t .cjs).log; done
echo DONE
