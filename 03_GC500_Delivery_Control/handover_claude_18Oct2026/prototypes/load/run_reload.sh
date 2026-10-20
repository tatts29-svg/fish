#!/bin/bash
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/load-hotspots
export GC500_CACHE=$PWD/cache; unset FREEZE DELAY_RE DELAY_MS
rm -f runs/reload_desk.jsonl runs/reload_phone.jsonl
for i in 1 2 3; do for pg in base.html proto_all5.html; do QUIET=10000 MAXS=150 PAGE=$pg node measure_reload.cjs >> runs/reload_desk.jsonl; done; done; echo DONE >> runs/reload_desk.jsonl
for i in 1 2; do for pg in base.html proto_all5.html; do MOB=1 CPU=4 QUIET=10000 MAXS=200 PAGE=$pg node measure_reload.cjs >> runs/reload_phone.jsonl; done; done; echo DONE >> runs/reload_phone.jsonl
