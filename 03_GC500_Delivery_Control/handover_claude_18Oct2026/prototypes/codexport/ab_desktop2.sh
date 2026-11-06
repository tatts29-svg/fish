#!/bin/bash
cd "$(dirname "$0")"; export GC500_CACHE=$PWD/cache2; rm -rf cache2
for i in 1 2 3; do for v in base sub cand; do
  TABS=timeline,plant PAGE=$PWD/$v.html LINES=${v}_lines.json TAG=t_${v}_$i OUT=runs timeout 900 node measure.cjs
done; done
