#!/bin/bash
# usage: cmp.sh MOB CPU TAB N PROF tagprefix  -> alternates base/proto
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/buildtab
export GC500_CACHE=$PWD/cache
MOB=$1; CPU=$2; TAB=$3; N=$4; PROF=$5; P=$6
for i in $(seq 1 $N); do
 for v in ${VARIANTS:-base proto}; do
  MOB=$MOB CPU=$CPU TAB=$TAB PROF=$PROF PAGE=$v.html LINES=${v}_lines.json OUT=runs TAG=${P}_${v}_$i node prof.cjs
 done
done
echo DONE
