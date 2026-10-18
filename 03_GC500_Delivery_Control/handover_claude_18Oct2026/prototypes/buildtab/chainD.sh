#!/bin/bash
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/buildtab; export GC500_CACHE=$PWD/cache
for v in base proto_v7; do MOB=1 CPU=4 PAGE=$v.html OUT=runs TAG=swipe2_p_$v STEPS=4 node swipe.cjs; done
for v in base proto_v7f; do PAGE=$v.html OUT=runs TAG=redraw2_d_$v node redraw.cjs; done
echo CHAIN_D_DONE
