#!/bin/bash
cd /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/load-hotspots
rm -f runs/bench_desk.jsonl
export GC500_CACHE=$PWD/cache
# bench (frozen record), desktop: base and each fix
for pg in base.html proto_all4.html proto_nights.html proto_meta.html proto_sig.html proto_hist.html proto_hold.html proto_capture.html base.html proto_all4.html; do FREEZE=$PWD/freeze REPS=5 PAGE=$pg node bench.cjs >> runs/bench_desk.jsonl; done
echo DONE >> runs/bench_desk.jsonl
# parity frozen, desktop + phone
FREEZE=$PWD/freeze PAGE=proto_all4.html OUT=parity/all4_d1.json node parity.cjs
FREEZE=$PWD/freeze PAGE=base.html OUT=parity/base_d3.json node parity.cjs
FREEZE=$PWD/freeze MOB=1 PAGE=base.html OUT=parity/base_m1.json node parity.cjs
FREEZE=$PWD/freeze MOB=1 PAGE=proto_all4.html OUT=parity/all4_m1.json node parity.cjs
FREEZE=$PWD/freeze MOB=1 PAGE=base.html OUT=parity/base_m2.json node parity.cjs
echo PARITY-DONE > runs/round2.flag
rm -f runs/bench_phone.jsonl; for pg in base.html proto_all4.html; do FREEZE=$PWD/freeze MOB=1 CPU=4 REPS=3 PAGE=$pg node bench.cjs >> runs/bench_phone.jsonl; done
# live A/B
./run_ab.sh runs/desk_ab2.jsonl 3 0 0 base.html proto_all4.html
./run_ab.sh runs/phone_ab2.jsonl 3 1 4 base.html proto_all4.html
echo ALL-DONE >> runs/round2.flag
