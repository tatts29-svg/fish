#!/bin/bash
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/buildtab; export GC500_CACHE=$PWD/cache

# parity of the final candidate
PAGE=proto_v7f.html OUT=parity/proto7_d2.json node parity.cjs
PAGE=proto_v7f.html OUT=parity/proto7_d3.json node parity2.cjs
K=WB03,WB14,WB20,WC07; PAGE=proto_v7f.html KEYS=$K OUT=parity/dr_proto6.json node drawers.cjs
MOB=1 PAGE=proto_v7f.html OUT=parity/proto7_p.json node parity.cjs
# desktop timing, back to back, 3 each
VARIANTS="base proto_v7" ./cmp.sh 0 0 timeline 3 0 cmpd7_tl
VARIANTS="base proto_v7" ./cmp.sh 0 0 plant 3 0 cmpd7_pl
# phone
for v in base proto_v7; do MOB=1 CPU=4 PAGE=$v.html OUT=runs TAG=swipe_p_$v STEPS=4 node swipe.cjs; done
for v in base proto_v7f; do MOB=1 CPU=4 PAGE=$v.html OUT=runs TAG=redraw_p_$v node redraw.cjs; done
VARIANTS="base proto_v7" ./cmp.sh 1 4 timeline 3 0 cmpp7_tl
VARIANTS="base proto_v7" ./cmp.sh 1 4 plant 1 0 cmpp7_pl
echo DONE
