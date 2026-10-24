#!/bin/bash
# usage: run_ab.sh OUTFILE N MOB CPU page1 page2 ...   (alternates pages, N rounds)
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/load-hotspots
export GC500_CACHE=$PWD/cache; unset FREEZE
OUT=$1; N=$2; MOB=$3; CPU=$4; shift 4
for i in $(seq 1 $N); do for pg in "$@"; do MOB=$MOB CPU=$CPU QUIET=10000 MAXS=200 PAGE=$pg node measure.cjs >> $OUT; done; done
echo DONE >> $OUT
