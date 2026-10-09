#!/bin/bash
# Author: Andrew Fisher. Combined candidate: every suite, one browser at a time. Needs NODE deps in toolchain/node_modules,
# CHROMIUM_PATH, and MEDIA889 = the v8.89 media folder (make_master889.py output) for the master889 test.
# Usage: run_all.sh <build dir, e.g. build/GC500_v8.89all> <evidence dir> [<base page for the v8.89 identity check>]
S=${S:-$(mktemp -d)}   # working folder for caches and screenshots (outside the repo)
HERE=$(cd "$(dirname "$0")" && pwd)
cd /home/user/fish/03_GC500_Delivery_Control
B=$1; E=$2; IDBASE=$3; mkdir -p $E
export NODE_PATH=toolchain/node_modules CHROMIUM_PATH=/opt/pw-browsers/chromium PAGE=$PWD/$B/GC500_Delivery_Control_hosted.html
echo "candidate $(sha256sum $PAGE | cut -c1-16) $(stat -c %s $PAGE) bytes; base $(sha256sum $B/base_live.html | cut -c1-16)"
R(){ GC500_CACHE=$(mktemp -d -p $S) MOB=$2 timeout 600 node $1 > $3 2>&1; echo "$(basename $3 .log) exit $? pass $(grep -c '^PASS' $3) fail $(grep -c '^FAIL' $3) $(grep -o '[0-9]*/[0-9]*$' $3 | tail -1)"; }
# --- the releases' own checks (added by EXTRA, one line per check, from the builders' READMEs)
[ -f "$HERE/run_all_extra.sh" ] && source "$HERE/run_all_extra.sh"
# --- v8.89
if [ -n "$IDBASE" ]; then python3 v8.89_master_map_DRAFT/tests/test_identity889.py $IDBASE $PAGE > $E/identity889.log 2>&1; echo "identity889 exit $? $(tail -1 $E/identity889.log)"; fi
for m in "" 1; do w=$([ -n "$m" ] && echo phone || echo laptop); GC500_CACHE=$(mktemp -d -p $S) MOB=$m MEDIA889=${MEDIA889:-$S/mm/out889} timeout 600 node ${MASTER889_TEST:-v8.89_master_map_DRAFT/tests/test_master889.cjs} > $E/master889_$w.log 2>&1; echo "master889_$w exit $? $(tail -1 $E/master889_$w.log)"; done
# --- v8.85 / v8.84
for w in 2560 1600 1440; do GC500_CACHE=$(mktemp -d -p $S) W=$w H=$([ $w = 2560 ] && echo 1370 || echo 1000) timeout 600 node v8.85_where_we_are_DRAFT/tests/test_where885.cjs > $E/where885_$w.log 2>&1; echo "where885_$w exit $? $(tail -1 $E/where885_$w.log)"; done
GC500_CACHE=$(mktemp -d -p $S) MOB=1 timeout 600 node v8.85_where_we_are_DRAFT/tests/test_where885.cjs > $E/where885_phone.log 2>&1; echo "where885_phone exit $? $(tail -1 $E/where885_phone.log)"
for w in 2560 1600 1440; do GC500_CACHE=$(mktemp -d -p $S) W=$w timeout 600 node v8.84_today_wide_layout_DRAFT/tests/test_wide884.cjs > $E/wide884_$w.log 2>&1; echo "wide884_$w exit $? $(tail -1 $E/wide884_$w.log)"; done
GC500_CACHE=$(mktemp -d -p $S) MOB=1 timeout 600 node v8.84_today_wide_layout_DRAFT/tests/test_wide884.cjs > $E/wide884_phone.log 2>&1; echo "wide884_phone exit $? $(tail -1 $E/wide884_phone.log)"
# --- the standing regression set
for m in "" 1; do w=$([ -n "$m" ] && echo phone || echo laptop)
R v8.76_today_layout_LIVE/tests/test_layout876.cjs "$m" $E/layout876_$w.log
R v8.83_crew_planning_LIVE/tests/test_crew883.cjs "$m" $E/crew883_$w.log
python3 -c "import json;d=json.load(open('$E/crew883_$w.log'));print('  crew883 $w:',sum(1 for v in d.values() if v is True),'/',len(d))" 2>/dev/null || echo "  crew883 $w: not JSON"
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
# no prices in the repo: the inherited v8.71 log prints transport charges
python3 - $E <<'PYEOF'
import re, sys, pathlib
for p in pathlib.Path(sys.argv[1]).glob('*.log'):
    s = p.read_text(errors='replace'); n = re.sub(r'\$\s?[0-9][0-9,]*(\.[0-9]+)?', '$—', s)
    if n != s: p.write_text(n); print('  redacted dollar figures in', p.name)
PYEOF
echo DONE
