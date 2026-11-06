#!/bin/bash
S=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/buildtab; R=/home/user/fish/03_GC500_Delivery_Control
export GC500_CACHE=$S/cache
for t in v10.57_build_tab_tidy_DRAFT/tests/test_part1.cjs v10.57_build_tab_tidy_DRAFT/tests/test_part2.cjs v10.57_build_tab_tidy_DRAFT/tests/test_part3.cjs v10.56_day_cards_LIVE/tests/test_daycards1056.cjs v10.59_late_desc_arrived_DRAFT/tests/test_v1059.cjs v10.53_no_twin_steer_LIVE/tests/test_twinsteer1053.cjs; do
 n=$(basename $t .cjs)
 for v in base proto_v7f; do d=$S/tests_ev/${v%%_*}; (cd $R/$(dirname $t) && timeout 900 node $(basename $t) $S/$v.html $d > $S/tests_ev/${n}_$v.log 2>&1); echo "$n $v exit=$? $(grep -c '^ok' $S/tests_ev/${n}_$v.log) ok $(grep -c '^FAIL' $S/tests_ev/${n}_$v.log) fail"; done
done
echo CHAIN_T_DONE
