#!/bin/bash
# after the phone A/B: Build switch (phone cpu4) x3 each, then desktop idle A/B x3 each, interleaved
P=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/idle-sync
export GC500_CACHE=$P/cache
for i in 1 2 3; do for v in base proto2_glow; do
  MOB=1 CPU=4 PAGE=$P/$v.html OUT=$P/runs/sw_${v}_$i node $P/switch.cjs > $P/runs/sw_${v}_$i.log 2>&1
  echo "sw $v $i done $(date +%T) $(tail -c 200 $P/runs/sw_${v}_$i.log)" >> $P/runs/after.progress
done; done
for i in 1 2 3; do for v in base proto2_glow; do
  PAGE=$P/$v.html PROF=1 IDLE=60 REFRESH=1 OUT=$P/runs/desk_${v}_$i node $P/run.cjs > $P/runs/desk_${v}_$i.log 2>&1
  echo "desk $v $i done $(date +%T)" >> $P/runs/after.progress
done; done
echo ALLDONE >> $P/runs/after.progress
