#!/bin/bash
# Author: Andrew Fisher. The combined handover suite (v8.84..v8.89 + v8.93 + v8.94 + v8.91 + v8.92 + v8.95) on one candidate,
# one browser at a time, read-only against the live record. Usage: run_h1.sh <label of the candidate build> <evidence dir>
# Needs: V895_BASEPLAN (the 7 Oct export), ASSETS893 (the v8.93 asset set, archive untarred), MEDIA893 (the v8.93 media),
# S (a working folder outside the repo; default a temp folder).
cd "$(dirname "$0")/../.." || exit 1
L=$1; E=$2; mkdir -p "$E"; S=${S:-$(mktemp -d)}
export NODE_PATH=toolchain/node_modules CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium}
PAGE=$PWD/build/GC500_$L/GC500_Delivery_Control_hosted.html
C=(v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.86_event_portables_days_DRAFT/patch_v886.py
   v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py v8.89_master_map_DRAFT/patch_v889.py)
P893=v8.93_maps_aligned_DRAFT/patch_v893.py; P894=v8.94_lighting_basis_DRAFT/patch_v894.py; P891=v8.91_truck_flow_DRAFT/patch_v891.py
P892=v8.92_a_plus_pass_DRAFT/patch_v892.py; P895=v8.95_baseplan_07oct_DRAFT/patch_v895.py
b(){ local n=$1; shift; V895_LOG=$S/$n.changes895.json toolchain/build.sh "$n" "$@" > "$S/$n.build.log" 2>&1 && echo "base $n $(sha256sum build/GC500_$n/GC500_Delivery_Control_hosted.html | cut -c1-16)" || { echo "BUILD FAILED $n"; tail -5 "$S/$n.build.log"; }; }
echo "candidate $L $(sha256sum $PAGE | cut -c1-16) $(stat -c %s $PAGE) bytes"
b ${L}_to893 "${C[@]}" $P893
b ${L}_no892 "${C[@]}" $P893 $P894 $P891 $P895
b ${L}_no895 "${C[@]}" $P893 $P894 $P891 $P892
p(){ echo "$1/GC500_Delivery_Control_hosted.html"; }
python3 v8.93_maps_aligned_DRAFT/tests/test_identity893.py $(p build/GC500_v8.89all) $(p build/GC500_${L}_to893) > $E/identity893.log 2>&1; echo "identity893 exit $? $(tail -1 $E/identity893.log)"
python3 v8.92_a_plus_pass_DRAFT/tests/test_identity892.py $(p build/GC500_${L}_no892) $PAGE > $E/identity892.log 2>&1; echo "identity892 exit $? $(tail -1 $E/identity892.log)"
python3 v8.95_baseplan_07oct_DRAFT/tests/test_identity895.py $(p build/GC500_${L}_no895) $PAGE > $E/identity895.log 2>&1; echo "identity895 exit $? $(tail -1 $E/identity895.log)"
T(){ local name=$1 m=$2; shift 2; local w=$([ -n "$m" ] && echo phone || echo laptop); env GC500_CACHE=$(mktemp -d -p $S) MOB=$m PAGE=$PAGE "$@" > $E/${name}_$w.log 2>&1; echo "${name}_$w exit $? pass $(grep -c '^PASS' $E/${name}_$w.log) fail $(grep -c '^FAIL' $E/${name}_$w.log) $(grep -o '[0-9]*/[0-9]*$' $E/${name}_$w.log | tail -1)"; }
for m in "" 1; do
 T lighting894 "$m" timeout 600 node v8.94_lighting_basis_DRAFT/tests/test_lighting894.cjs
 T flow891 "$m" OUT=$S/flow891 timeout 900 node v8.91_truck_flow_DRAFT/tests/test_flow891.cjs
 T aplus892 "$m" OUT=$S/aplus892 timeout 900 node v8.92_a_plus_pass_DRAFT/tests/test_aplus892.cjs
 T money892 "$m" BASE=$(p $PWD/build/GC500_${L}_no892) timeout 900 node v8.92_a_plus_pass_DRAFT/tests/test_money892.cjs
 T contracts895 "$m" OUT=$S/c895 timeout 600 node v8.95_baseplan_07oct_DRAFT/tests/test_contracts895.cjs
 T align893 "$m" ASSETS=$ASSETS893 MEDIA=$MEDIA893 POC3D=$PWD/v8.93_maps_aligned_DRAFT/assets_small/poc3d CODE=$PWD/v8.93_maps_aligned_DRAFT/machine_code_v887_v890_v893 OUT=$E/align timeout 900 node v8.93_maps_aligned_DRAFT/tests/test_align893.cjs
done
# the two legacy suites that read out-of-date expectations (v8.75 handling, v8.79 paired run sheets) are run on live v8.83 itself as well:
# the same failures on live prove they are the tests' age, not this release
for t in v8.75_schedule_lifting_LIVE/tests/test_handling875.cjs v8.79_paired_run_sheets_LIVE/tests/test_paired879.cjs; do n=$(basename $t .cjs | sed 's/test_//'); env GC500_CACHE=$(mktemp -d -p $S) PAGE=$PWD/build/GC500_$L/base_live.html timeout 600 node $t > $E/${n}_live.log 2>&1; echo "${n}_live exit $? pass $(grep -c '^PASS' $E/${n}_live.log) fail $(grep -c '^FAIL' $E/${n}_live.log) $(grep -o '[0-9]*/[0-9]*$' $E/${n}_live.log | tail -1)"; done
# the standing regression set on the same candidate (the chain-identity checks there are for the v8.89 chain only, so skipped)
SKIP_CHAIN_IDENTITY=1 S=$S MEDIA889=$MEDIA893 MASTER889_TEST=v8.93_maps_aligned_DRAFT/tests/test_master889_v893.cjs EXPLORER_DIR=v8.93_maps_aligned_DRAFT/machine_code_v887_v890_v893 bash v8.89_full_chain_08Oct2026/tools/run_all.sh build/GC500_$L $E
echo SUITE DONE
