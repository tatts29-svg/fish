#!/bin/bash
# v8.15's own checks on the built page (read only). Author: Andrew Fisher. Run from 03_GC500_Delivery_Control.
# One browser at a time; stops at the first suite that fails and exits with its code.
#   LOCK=<lock file> bash v8.15_documents_clean_DRAFT/evidence/run_all.sh
# The standing suites (sweeps, repeat_check and the other releases' suites) are run with their own commands; for 35ab1366
# Codex ran them (see the README).
set -euo pipefail
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium} NODE_PATH=${NODE_PATH:-$(npm root -g)}
PAGE=${PAGE:-$PWD/build/GC500_v8.15/GC500_Delivery_Control_hosted.html}; BASE=${BASE:-$PWD/build/GC500_v8.15/base_live.html}; export PAGE BASE
E=v8.15_documents_clean_DRAFT/evidence
L=(); [ -n "${LOCK:-}" ] && L=(flock "$LOCK")
grep -q 'function renderDocs815(' "$PAGE" || { echo 'STOP: the built page is not v8.15'; exit 1; }
sha256sum "$PAGE" "$BASE"
"${L[@]}" env ONLY=paper node $E/v815_tests.js > $E/v815_paper.log 2>&1
"${L[@]}" env ONLY=desktop OUT=$E/v815_desktop.json node $E/v815_tests.js > $E/v815_desktop.log 2>&1
"${L[@]}" env ONLY=phone OUT=$E/v815_phone.json node $E/v815_tests.js > $E/v815_phone.log 2>&1
for m in 0 1; do for t in live v815; do F=$PAGE; [ $t = live ] && F=$BASE; "${L[@]}" env PAGE=$F TAG=$t MOB=$m node $E/layout815.cjs > /dev/null; done; done
grep -h 'passed,' $E/v815_paper.log $E/v815_desktop.log $E/v815_phone.log
