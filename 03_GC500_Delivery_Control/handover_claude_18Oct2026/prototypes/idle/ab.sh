#!/bin/bash
# back-to-back phone cpu4 runs, interleaved: base, proto2, proto2_glow x3
P=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/idle-sync
export GC500_CACHE=$P/cache
TAG=${TAG:-ab}
VARS=${VARS:-"base proto2 proto2_glow"}
for i in 1 2 3; do
 for v in $VARS; do
  MOB=1 CPU=4 PAGE=$P/$v.html PROF=1 IDLE=60 REFRESH=1 OUT=$P/runs/${TAG}_${v}_$i node $P/run.cjs > $P/runs/${TAG}_${v}_$i.log 2>&1
  echo "$v $i done $(date +%T) $(tail -c 300 $P/runs/${TAG}_${v}_$i.log | grep -o 'settle.*')" >> $P/runs/${TAG}.progress
 done
done
echo ALLDONE >> $P/runs/${TAG}.progress
