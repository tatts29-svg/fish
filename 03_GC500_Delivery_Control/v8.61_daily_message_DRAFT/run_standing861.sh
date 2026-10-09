#!/bin/bash
# v8.61: the standing suites, run read-only on the candidate AND on the live base it was built from, so an inherited
# failure (one that also fails on live v8.60) is told apart from one v8.61 caused. Author: Andrew Fisher.
#   cd 03_GC500_Delivery_Control && OUTD=<private dir> bash v8.61_daily_message_DRAFT/run_standing861.sh
# Build first (toolchain/build.sh v8.61 ...). Logs go to OUTD, outside Git. Every write the page tries is aborted by the
# harness; one browser at a time under the shared lock. Evidence the suites rewrite in other folders is put back.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium} NODE_PATH=${NODE_PATH:-$PWD/toolchain/node_modules}
OUTD=${OUTD:?give a private OUTD}; LOCK=${BROWSER_LOCK:?give BROWSER_LOCK}; mkdir -p "$OUTD"
CAND=$PWD/build/GC500_v8.61/GC500_Delivery_Control_hosted.html; BASE=$PWD/build/GC500_v8.61/base_live.html
T=v7.99_today_faster_fuller_DRAFT/evidence
HDR="# v8.61 standing suites · source $(git rev-parse HEAD) · candidate $(sha256sum < $CAND | cut -c1-64) · base $(sha256sum < $BASE | cut -c1-64) · run $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "$HDR"
declare -a ROWS
suite() {   # suite <name> <command...>   (run on both pages)
  local name=$1; shift; local line="$name"
  for which in candidate base; do
    local page=$CAND; [ $which = base ] && page=$BASE
    local log=$OUTD/${name}_$which.log
    { echo "$HDR"; echo "# suite: $name on $which"; env PAGE=$page BASE=$BASE OUT=$OUTD/${name}_$which.json OUTD=$OUTD/${name}_$which flock "$LOCK" "$@"; } > "$log" 2>&1
    local rc=$? p f; p=$(grep -c '^PASS' "$log"); f=$(grep -c '^FAIL' "$log")
    line="$line | $which pass $p fail $f exit $rc"
  done
  ROWS+=("$line"); echo "$line"
}
mkdir -p "$OUTD"/{onetab-desktop,onetab-phone}_{candidate,base}
suite v799-desktop    node $T/v799_tests.js
suite v799-phone      env MOB=1 node $T/v799_tests.js
suite packed-desktop  node v7.95_today_packed_DRAFT/evidence/packed_tests.js
suite packed-phone    env MOB=1 node v7.95_today_packed_DRAFT/evidence/packed_tests.js
suite equip-desktop   node v7.96_equipment_tab_LIVE/evidence/equipment_tests.js
suite equip-phone     env MOB=1 node v7.96_equipment_tab_LIVE/evidence/equipment_tests.js
suite results-desktop node v8.19_meet_points_ep_plan_DRAFT/evidence/results796_tests_819.cjs
suite results-phone   env MOB=1 node v8.19_meet_points_ep_plan_DRAFT/evidence/results796_tests_819.cjs
suite onetab-desktop  node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js
suite onetab-phone    env MOB=1 node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js
suite rules           node v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js
suite fresh           node v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js
suite same-figures    node $T/same_figures.js
# put back what the suites rewrote in other release folders
git checkout -- v7.95_today_packed_DRAFT v7.99_today_faster_fuller_DRAFT v7.99_today_faster_fuller_LIVE v7.96_equipment_tab_LIVE \
  v7.93_one_tab_today_DRAFT v7.84_ways_in_from_andrew_LIVE v7.75_fresh_after_a_save_LIVE v8.19_meet_points_ep_plan_DRAFT 2>/dev/null
git status --short --untracked-files=all -- v7.95_today_packed_DRAFT v7.99_today_faster_fuller_DRAFT v7.99_today_faster_fuller_LIVE \
  v7.96_equipment_tab_LIVE v7.93_one_tab_today_DRAFT v7.84_ways_in_from_andrew_LIVE v7.75_fresh_after_a_save_LIVE v8.19_meet_points_ep_plan_DRAFT
{ echo "$HDR"; printf '%s\n' "${ROWS[@]}"; } > "$OUTD/summary.log"
