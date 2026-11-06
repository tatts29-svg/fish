#!/bin/bash
cd "$(dirname "$0")"; export GC500_CACHE=$PWD/cache3; rm -rf cache3
for i in 1 2 3; do if [ $i = 2 ]; then O="rec base"; else O="base rec"; fi; for v in $O; do
  TABS=timeline,plant PAGE=$PWD/$v.html LINES=${v}_lines.json TAG=r_${v}_$i OUT=runs timeout 900 node measure.cjs
done; done
