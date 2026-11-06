#!/bin/bash
cd "$(dirname "$0")"; export GC500_CACHE=$PWD/cache; rm -rf cache
for i in 1 2 3; do for v in base sub cand; do
  PAGE=$PWD/$v.html LINES=${v}_lines.json TAG=d_${v}_$i OUT=runs timeout 900 node measure.cjs
done; done
