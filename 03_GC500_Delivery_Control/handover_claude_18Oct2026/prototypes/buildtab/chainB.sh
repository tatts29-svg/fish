#!/bin/bash
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/buildtab; export GC500_CACHE=$PWD/cache
PAGE=proto_v4.html OUT=parity/proto4_d2.json node parity.cjs
PAGE=proto_v4.html OUT=parity/proto4_d3.json node parity2.cjs
VARIANTS="base proto_v4" ./cmp.sh 0 0 plant 3 0 cmpd_pl
for v in base proto_v4; do MOB=1 CPU=4 PAGE=$v.html OUT=runs TAG=swipe_p_$v STEPS=4 node swipe.cjs; done
for v in base proto_v4f; do MOB=1 CPU=4 PAGE=$v.html OUT=runs TAG=redraw_p_$v node redraw.cjs; done
VARIANTS="base proto_v4" ./cmp.sh 1 4 plant 1 0 cmpp_pl
VARIANTS="proto_v4" ./cmp.sh 1 4 timeline 2 0 cmpp4_tl
echo DONE
