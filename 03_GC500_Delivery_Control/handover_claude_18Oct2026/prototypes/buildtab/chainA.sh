#!/bin/bash
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/buildtab; export GC500_CACHE=$PWD/cache
MOB=1 PAGE=base.html OUT=parity/base_p.json node parity.cjs
MOB=1 PAGE=proto_v3.html OUT=parity/proto_p.json node parity.cjs
for v in base proto_v3 base_f13; do PAGE=$v.html OUT=runs TAG=redraw_d_$v node redraw.cjs; done
echo DONE
