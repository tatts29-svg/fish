#!/bin/bash
# Every check for v8.19, read-only, one browser suite at a time under the shared browser lock. Author: Andrew Fisher.
#   cd 03_GC500_Delivery_Control && SCRATCH=<dir> bash v8.19_meet_points_ep_plan_DRAFT/evidence/run_all.sh
# SCRATCH holds the screenshots, the run-sheet PDFs and the private reference assignment (SCRATCH/event_portables/work/assign.py).
#
# How it judges (Codex review, 3 Oct 2026): EVERY suite runs, even after one fails. Each suite's log starts with a header
# binding it to the source commit and the candidate's sha256; each suite is judged on its own exit code and its PASS/FAIL
# lines, and the table at the end prints them. The script exits non-zero if ANY suite failed (or the source has
# uncommitted changes, unless ALLOW_DIRTY=1 for a trial run). FORCE_FAIL=<suite> makes that one suite fail on purpose,
# to prove the exit code (the proof is in evidence/regress/force_fail_proof.log). ONLY="<suite> <suite>" runs just those.
set -uo pipefail                     # not -e: a failing suite must not stop the others; the tally decides the exit
cd "$(dirname "$0")/../.." || exit 2   # 03_GC500_Delivery_Control
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium} NODE_PATH=${NODE_PATH:-$(npm root -g)}
SCRATCH=${SCRATCH:?give SCRATCH}; LOCK=${BROWSER_LOCK:-$SCRATCH/browser.lock}
D=v8.19_meet_points_ep_plan_DRAFT; E=$D/evidence; R=$E/regress; T=v7.99_today_faster_fuller_DRAFT/evidence
SHOTS=$SCRATCH/v819/final; mkdir -p "$R" "$SHOTS"
PAGE=$PWD/build/GC500_v8.19/GC500_Delivery_Control_hosted.html; BASE=$PWD/build/GC500_v8.19/base_live.html; export PAGE

# ---- the source this run is bound to
SRCFILES="$D/patch_v819.py $D/mp819_src.js $D/ep819_src.js $D/v819.css $E/*.js $E/*.py $E/run_all.sh meet_points_03Oct2026 toolchain"
SRC=$(git rev-parse HEAD); DIRTY=''
if ! git diff --quiet HEAD -- $SRCFILES || [ -n "$(git ls-files --others --exclude-standard -- $SRCFILES)" ]; then
  if [ -z "${ALLOW_DIRTY:-}" ]; then echo "STOP: the v8.19 source has uncommitted changes - commit it first (or ALLOW_DIRTY=1 for a trial run)"; exit 2; fi
  DIRTY=' + UNCOMMITTED CHANGES (trial run, not evidence)'
fi
# ---- the candidate: built fresh from the live page now
if ! bash toolchain/build.sh v8.19 $D/patch_v819.py > $R/build.log 2>&1; then echo 'STOP: the build failed - see regress/build.log'; tail -5 $R/build.log; exit 2; fi
if [ "$(sha256sum < $PAGE)" = "$(sha256sum < $BASE)" ] || ! grep -q 'function meetPoint819(' $PAGE; then echo 'STOP: the built page is not v8.19'; exit 2; fi
CAND=$(sha256sum $PAGE | cut -d' ' -f1); SIZE=$(wc -c < $PAGE); BASEH=$(sha256sum $BASE | cut -d' ' -f1); BSIZE=$(wc -c < $BASE)
HDR="# v8.19 checks · source commit $SRC$DIRTY · candidate sha256 $CAND ($SIZE bytes) · base (live at build) sha256 $BASEH ($BSIZE bytes) · run $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "$HDR"; sed -i "1i $HDR" $R/build.log

declare -a NAMES RCS PS FS
suite() {   # suite <name> <log> <command...>
  local name=$1 log=$2; shift 2
  if [ -n "${ONLY:-}" ] && [[ " $ONLY " != *" $name "* ]]; then return 0; fi; echo "== $name"
  { echo "$HDR"; echo "# suite: $name · command: $*"; if [ "${FORCE_FAIL:-}" = "$name" ]; then echo 'FAIL forced failure (FORCE_FAIL) - proving the aggregate exit code'; false; else "$@"; fi; } > "$log" 2>&1
  local rc=$?; local p f; p=$(grep -c '^PASS' "$log"); f=$(grep -c '^FAIL' "$log")
  [ "$f" -gt 0 ] && [ $rc -eq 0 ] && rc=1   # a FAIL line fails the suite even if the script forgot to exit non-zero
  NAMES+=("$name"); RCS+=($rc); PS+=($p); FS+=($f)
}
# a sweep writes JSON; it is judged by the same rule the board uses: every tab shown, seven links, Back, 0 page and console
# errors, and no write attempted (the harness aborts every write and counts it)
sweep() {   # sweep <name> <mob 0|1>
  local name=$1 mob=$2 j=$R/$1.json
  if [ -n "${ONLY:-}" ] && [[ " $ONLY " != *" $name "* ]]; then return 0; fi
  (cd toolchain && MOB=$([ "$mob" = 1 ] && echo 1) flock "$LOCK" node harness/sweep.js > ../$j 2> ../$R/$name.err); local rc=$?
  suite "$name" $R/$name.log python3 - "$j" $rc <<'PY'
import json, sys
s = open(sys.argv[1]).read(); rc = int(sys.argv[2])
if '{' not in s: print('FAIL the sweep produced no result (exit %d)' % rc); sys.exit(1)
j = json.loads(s[s.index('{'):]); t = j['tabs']
shown = sum(1 for v in t.values() if v.get('shown')); pe = sum(len(v.get('errors', [])) for v in t.values()) + len(j.get('allErrors', []))
ce = sum(len(v.get('console', [])) for v in t.values()) + len(j.get('cons', [])); links = len(j['hashes']); le = sum(len(v.get('errors', [])) for v in j['hashes'].values())
back = j.get('back') or {}
print(f'   {len(t)} tabs, {shown} shown, {links} links, back {back}')
VIEW_ONLY = {'register', 'journal', 'breakdowns', 'variances', 'edit', 'add'}   # the view link sends these to Equipment / Today, on the live base too
hidden = sorted(k for k, v in t.items() if not v.get('shown'))
for c, w in ((rc == 0, 'the sweep ran to the end'), (len(t) in (21, 22) and set(hidden) <= VIEW_ONLY, f'all {len(t)} tabs swept; {shown} shown; the {len(hidden)} not shown are the view-only ones {hidden}'), (links == 7 and le == 0, 'seven links open with no errors'),
             (bool(back.get('pane')), 'Back returns to a pane'), (pe == 0, f'{pe} page errors'), (ce == 0, f'{ce} console errors'), ((j.get('counts') or {}).get('blocked', -1) == 0, f"no write attempted ({j.get('counts')})")):
    print(('PASS ' if c else 'FAIL ') + w)
PY
}

# ---- the v8.19 suites
suite anchors        $E/anchor_check819.log     python3 $E/anchor_check819.py $BASE
suite probe          $E/probe819.log            env OUT=$SCRATCH/v819/probe819.json flock "$LOCK" node $E/probe819.js
suite assign         $E/assign_check819.log     python3 $E/assign_check819.py $SCRATCH/v819/probe819.json $SCRATCH/event_portables/work
suite v819           $E/v819.log                env SHOTS=$SHOTS flock "$LOCK" node $E/v819_tests.js
suite qr             $E/qr_decode819.log        python3 $E/qr_decode819.py $SHOTS
suite fresh819       $E/fresh819.log            flock "$LOCK" node $E/fresh819.js
suite photo          $E/photo819.log            env BASE=$BASE flock "$LOCK" node $E/photo819.js
suite phone-widths   $E/phone819.log            env SHOTS=$SHOTS flock "$LOCK" node $E/phone819.js
# ---- the standing suites (they write their own evidence into their release folders; put back at the end)
suite v799-desktop    $R/v799_desktop.log      env BASE=$BASE flock "$LOCK" node $T/v799_tests.js
suite v799-phone      $R/v799_phone.log        env MOB=1 flock "$LOCK" node $T/v799_tests.js
suite packed-desktop  $R/packed_desktop.log    flock "$LOCK" node v7.95_today_packed_DRAFT/evidence/packed_tests.js
suite packed-phone    $R/packed_phone.log      env MOB=1 flock "$LOCK" node v7.95_today_packed_DRAFT/evidence/packed_tests.js
suite equip-desktop   $R/equipment_desktop.log flock "$LOCK" node v7.96_equipment_tab_LIVE/evidence/equipment_tests.js
suite equip-phone     $R/equipment_phone.log   env MOB=1 flock "$LOCK" node v7.96_equipment_tab_LIVE/evidence/equipment_tests.js
suite results-desktop $R/results_desktop.log   flock "$LOCK" node $E/results796_tests_819.cjs
suite results-phone   $R/results_phone.log     env MOB=1 flock "$LOCK" node $E/results796_tests_819.cjs
suite onetab-desktop  $R/one_tab_desktop.log   env OUTD=$R flock "$LOCK" node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js
suite onetab-phone    $R/one_tab_phone.log     env MOB=1 OUTD=$R flock "$LOCK" node v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js
suite rules           $R/rules.log             env BASE=$BASE OUT=$R/rules.json flock "$LOCK" node v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js
suite fresh           $R/fresh.log             env OUT=$R/fresh.json flock "$LOCK" node v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js
suite same-figures    $R/same_figures.log      env BASE=$BASE flock "$LOCK" node $T/same_figures.js
sweep sweep-desktop 0
sweep sweep-phone 1
# other drafts' evidence that the standing suites rewrite goes back as it was
git checkout -- v7.95_today_packed_DRAFT/evidence/packed_desktop.json v7.99_today_faster_fuller_DRAFT/evidence/v799_desktop.json v7.99_today_faster_fuller_DRAFT/evidence/v799_phone.json v7.96_equipment_tab_LIVE/evidence/equipment_desktop.json v7.96_equipment_tab_LIVE/evidence/equipment_phone.json 2>/dev/null
git checkout -- v7.99_today_faster_fuller_DRAFT/evidence/review796_results_desktop.json v7.99_today_faster_fuller_DRAFT/evidence/review796_results_phone.json 2>/dev/null
git status --short -- v7.95_today_packed_DRAFT v7.99_today_faster_fuller_DRAFT v7.96_equipment_tab_LIVE v7.93_one_tab_today_DRAFT v7.84_ways_in_from_andrew_LIVE v7.75_fresh_after_a_save_LIVE

# ---- the table
SUM=$R/summary.log; { echo "$HDR"; printf '%-16s %6s %6s %5s  %s\n' suite pass fail exit result
  bad=0; for i in "${!NAMES[@]}"; do r=PASS; [ "${RCS[$i]}" -ne 0 ] && { r=FAIL; bad=$((bad + 1)); }; printf '%-16s %6s %6s %5s  %s\n' "${NAMES[$i]}" "${PS[$i]}" "${FS[$i]}" "${RCS[$i]}" $r; done
  echo "suites: ${#NAMES[@]}, failed: $bad"; } | tee $SUM
grep -q 'failed: 0$' $SUM && exit 0 || exit 1
