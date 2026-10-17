#!/bin/bash
cd "$(dirname "$0")"; export GC500_CACHE=$PWD/cache_p; rm -rf cache_p
for i in 1 2 3; do for v in base sub cand; do
  TABS=timeline,plant MOB=1 CPU=4 PAGE=$PWD/$v.html LINES=${v}_lines.json TAG=p_${v}_$i OUT=runs timeout 1500 node measure.cjs
done; done
