#!/bin/bash
# A/B: base and prototype recorded at the same time (same machine load), 3 pairs normal network, 3 pairs slow API
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker
for i in 1 2 3; do
  GC500_CACHE=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/cache PAGE=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/base.html  OUT=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/ab/base_n$i  CPU=4 IDLE=45000 TOUR='timeline:12000,today:9000' timeout 400 node record.cjs > /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/ab/base_n$i.out 2>&1 &
  GC500_CACHE=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/cache PAGE=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/proto.html OUT=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/ab/proto_n$i CPU=4 IDLE=45000 TOUR='timeline:12000,today:9000' timeout 400 node record.cjs > /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/ab/proto_n$i.out 2>&1 &
  wait
done
for i in 1 2 3; do
  GC500_CACHE=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/cache PAGE=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/base.html  OUT=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/ab/base_s$i  CPU=4 DELAY_API=4000 IDLE=45000 TOUR='timeline:3000' timeout 400 node record.cjs > /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/ab/base_s$i.out 2>&1 &
  GC500_CACHE=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/cache PAGE=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/proto.html OUT=/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/ab/proto_s$i CPU=4 DELAY_API=4000 IDLE=45000 TOUR='timeline:3000' timeout 400 node record.cjs > /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/flicker/ab/proto_s$i.out 2>&1 &
  wait
done
echo ABDONE
